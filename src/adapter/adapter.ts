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

  readonly supportedTransactionVersions = new Set<TransactionVersion>([
    "legacy",
    0,
  ]);

  _readyState: WalletReadyState;
  _publicKey: PublicKey | null;
  _connecting: boolean;
  _actio: ActioCore;

  constructor() {
    super();

    this._readyState =
      typeof window === "undefined"
        ? WalletReadyState.Unsupported
        : WalletReadyState.Installed;
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
      const signingContext = {
        title: "Sign Transaction",
        description: "Enter your Actio code to sign this transaction securely.",
        type: "Transaction Signing",
      };

      const code = await this._actio.openModal({
        context: signingContext,
      });

      this._actio.getModalService().showLoading("Signing transaction...");

      const action = await this._actio.getActionCodesService().getAction(code);
      if (!action.intendedFor) {
        throw new Error("Action missing intended recipient");
      }

      this._publicKey = new PublicKey(action.intendedFor);

      const origin =
        typeof window !== "undefined"
          ? window.location.hostname
          : "Unknown Origin";
      const sessionValidation = await this._actio
        .getSessionService()
        .validateSession(origin);
      if (!sessionValidation.isValid || !sessionValidation.publicKey) {
        throw new Error("Session is not valid. Please reconnect your wallet.");
      }
      if (!this._publicKey.equals(sessionValidation.publicKey)) {
        throw new Error(
          "Session wallet does not match action's intended recipient."
        );
      }

      const serializedTx = transaction.serialize({ verifySignatures: false });
      const transactionBase64 = this.arrayBufferToBase64(serializedTx);

      const { status, result } = await this._actio
        .getActionCodesService()
        .submitAction(code, {
          label: this.name,
          logo: "",
          memo: "",
          message:
            "You are about to sign a transaction via Actio Wallet Adapter",
          signOnly: true,
          transactionBase64,
        });

      if (status === "failed") {
        throw new Error("Action failed");
      }
      if (status === "cancelled") {
        throw new Error("Action was cancelled");
      }
      if (!result) {
        throw new Error("Did not receive signed transaction");
      }
      const signedTxBase64 = result;

      const signedTxBuffer = this.base64ToArrayBuffer(signedTxBase64);

      let signedTx: T;

      try {
        signedTx = (transaction.constructor as any).from(signedTxBuffer);
      } catch (error) {
        throw new Error("Failed to parse signed transaction");
      }

      this._actio.getModalService().showSuccess({
        publicKey: this._publicKey,
        code,
        metadata: action,
      });

      setTimeout(() => this._actio.getModalService().hide(), 1500);

      return signedTx;
    } catch (error) {
      this._actio.getModalService().reset();
      this._actio
        .getModalService()
        .showError(
          new Error((error as string) || "Unknown error"),
          "Signing failed"
        );
      throw error;
    }
  }

  public signAllTransactions<
    T extends TransactionOrVersionedTransaction<
      this["supportedTransactionVersions"]
    >
  >(): Promise<T[]> {
    throw new Error("Method not implemented.");
  }

  async connect(): Promise<void> {
    if (this._connecting) return;

    try {
      this._connecting = true;

      const { publicKey, isNewSession } = await this._actio.connectWallet({
        context: {
          title: "Connect Wallet",
          description: "Connect your wallet to continue",
        },
      });

      this._publicKey = publicKey;
      this._connecting = false;
      this.emit("connect", this._publicKey);

      if (isNewSession) {
        setTimeout(() => this._actio.getModalService().hide(), 1000);
      }
    } catch (error) {
      this._connecting = false;
      this._actio.getModalService().reset();

      if (error instanceof Error && error.message.includes("Modal closed")) {
        this.emit("disconnect");
        return;
      }
      throw error;
    }
  }

  disconnect(): Promise<void> {
    this._publicKey = null;
    this._actio.disconnectWallet();
    this.emit("disconnect");
    return Promise.resolve();
  }

  async autoConnect(): Promise<void> {
    try {
      const isConnected = await this._actio.isWalletConnected();
      if (isConnected) {
        const publicKey = await this._actio.getConnectedWallet();
        if (publicKey) {
          this._publicKey = publicKey;
          this.emit("connect", this._publicKey);
        }
      }
    } catch (error) {
      console.warn("Auto-connect failed:", error);
    }
  }

  /**
   * Convert Uint8Array to base64 string using browser-native btoa
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
  }

  /**
   * Convert base64 string to Uint8Array using browser-native atob
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
