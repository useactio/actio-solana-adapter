import {
  BaseSignerWalletAdapter,
  WalletReadyState,
  type TransactionOrVersionedTransaction,
  type WalletName,
} from "@solana/wallet-adapter-base";
import { PublicKey, type TransactionVersion } from "@solana/web3.js";
import ActioIcon from "./icon";
import { ActioCore } from "./core";

export const ActioWalletName = "Use Actio" as WalletName<"Use Actio">;

export class ActioWalletAdapter extends BaseSignerWalletAdapter {
  name = ActioWalletName;
  url = "https://actio.click";
  icon = ActioIcon;

  // we only support legacy and v0 transactions for maximum compatibility
  readonly supportedTransactionVersions = new Set<TransactionVersion>([
    "legacy",
    0,
  ]);

  // we need to store these values since we dont use browser injection
  _readyState: WalletReadyState;
  _publicKey: PublicKey | null;
  _connecting: boolean;
  _actio: ActioCore;

  constructor() {
    super();

    this._readyState =
      typeof window === "undefined"
        ? WalletReadyState.Unsupported // not supported on server
        : WalletReadyState.Installed; // since we dont use browser injection, we can assume the wallet is installed
    this._publicKey = null;
    this._connecting = false;
    this._actio = new ActioCore();
    this._actio.init();
  }

  get readyState(): WalletReadyState {
    return this._readyState;
  }
  get publicKey(): PublicKey | null {
    return this._publicKey;
  }
  get connecting(): boolean {
    return this._connecting;
  }

  /**
   * Prompts the user to sign the provided transaction using Actio modal and signOnly task system.
   * Supports both Transaction and VersionedTransaction.
   * @param transaction The transaction to sign
   * @returns The signed transaction
   */
  public async signTransaction<
    T extends TransactionOrVersionedTransaction<
      this["supportedTransactionVersions"]
    >
  >(transaction: T): Promise<T> {
    try {
      // 1. Show modal and get code
      const code = await this._actio.openModal();

      // 2. Show loading
      this._actio.getModalService().showLoading("Signing transaction...");

      // 3. Fetch action details using the code
      const action = await this._actio.getActionCodesService().getAction(code);
      if (!action.intendedFor) {
        throw new Error("Action missing intended recipient");
      }
      // Optionally update publicKey
      this._publicKey = new PublicKey(action.intendedFor);

      // 4. Serialize the provided transaction to base64
      // (Assume Transaction and VersionedTransaction both have serialize())
      // @ts-ignore
      const transactionBase64 = transaction
        .serialize({ verifySignatures: false })
        .toString("base64");

      // 5. Submit action in signOnly mode
      const { statusStream, getResult } = await this._actio
        .getActionCodesService()
        .submitAction(code, transactionBase64, { signOnly: true });

      // 6. Wait for completion
      let signedTxBase64: string | undefined;
      for await (const status of statusStream) {
        this._actio.updateLoadingMessage(status);
        if (status === "cancelled") {
          throw new Error("Action was cancelled");
        } else if (status === "failed") {
          throw new Error("Action processing failed");
        } else if (status === "completed") {
          signedTxBase64 = await getResult();
          break;
        }
      }
      if (!signedTxBase64) {
        throw new Error("Did not receive signed transaction");
      }
      // 7. Deserialize the signed transaction
      const binary = atob(signedTxBase64);
      const signedTxBuffer = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        signedTxBuffer[i] = binary.charCodeAt(i);
      }
      let signedTx: T;
      // Try Transaction first, then VersionedTransaction
      try {
        // @ts-ignore
        signedTx = (transaction.constructor as any).from(signedTxBuffer);
      } catch {
        // fallback: try VersionedTransaction if available
        // @ts-ignore
        if (typeof window !== "undefined" && window.VersionedTransaction) {
          // @ts-ignore
          signedTx = window.VersionedTransaction.from(signedTxBuffer);
        } else {
          throw new Error("Unable to deserialize signed transaction");
        }
      }

      // 8. Show success
      this._actio.getModalService().showSuccess({
        publicKey: this._publicKey,
        code,
        metadata: action,
      });

      // 9. Hide modal after a delay or on user action
      setTimeout(() => this._actio.getModalService().hide(), 1500);

      return signedTx;
    } catch (error) {
      // 10. Show error
      this._actio
        .getModalService()
        .showError(
          new Error((error as string) || "Unknown error"),
          "Signing failed"
        );
      throw error;
    }
  }

  // we dont support signing multiple transactions at once since
  // one code = one action = one transaction
  // maybe later we batch it
  public signAllTransactions<
    T extends TransactionOrVersionedTransaction<
      this["supportedTransactionVersions"]
    >
  >(): Promise<T[]> {
    throw new Error("Method not implemented.");
  }

  // we dont support connecting to the wallet
  // instead we trigger a popup to open Actio Modal
  async connect(): Promise<void> {
    if (this._connecting) return;

    try {
      this._connecting = true;

      // 1. Show modal and get code
      const code = await this._actio.openModal();

      // 2. Fetch action details using the code
      const action = await this._actio.getActionCodesService().getAction(code);

      if (!action.intendedFor) {
        throw new Error("Action missing intended recipient");
      }

      // 3. Extract public key from intendedFor
      this._publicKey = new PublicKey(action.intendedFor);
      this._connecting = false;
      this.emit("connect", this._publicKey);
      this._actio.getModalService().hide();
    } catch (error) {
      this._connecting = false;
      if (error instanceof Error && error.message.includes("Modal closed")) {
        this.emit("disconnect");
        return;
      }
      throw error;
    }
  }

  // we dont support disconnecting from the wallet
  // we use it as cleanup
  disconnect(): Promise<void> {
    this._publicKey = null;
    this.emit("disconnect");
    return Promise.resolve();
  }
}
