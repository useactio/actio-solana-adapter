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
      // 1. Show modal and get code with signing-specific context
      const signingContext = {
        title: "Sign Transaction",
        description: "Enter your Actio code to sign this transaction securely.",
        type: "Transaction Signing",
      };
      
      const code = await this._actio.openModal({
        context: signingContext,
      });

      // 2. Show loading
      this._actio.getModalService().showLoading("Signing transaction...");

      // 3. Fetch action details using the code
      const action = await this._actio.getActionCodesService().getAction(code);
      if (!action.intendedFor) {
        throw new Error("Action missing intended recipient");
      }
      // Optionally update publicKey
      this._publicKey = new PublicKey(action.intendedFor);

      // 4. Serialize the provided transaction to base64 using browser-native utilities
      const serializedTx = transaction.serialize({ verifySignatures: false });
      const transactionBase64 = this.arrayBufferToBase64(serializedTx);

      // 5. Submit action in signOnly mode
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

      // 6. Handle status and result
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

      // 7. Deserialize the signed transaction using browser-native atob
      const signedTxBuffer = this.base64ToArrayBuffer(signedTxBase64);
      
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
      // 10. Reset modal and show error
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

  // Connect to wallet with session management
  async connect(): Promise<void> {
    if (this._connecting) return;

    try {
      this._connecting = true;

      // Use the new session-aware connection
      const { publicKey, isNewSession } = await this._actio.connectWallet({
        context: {
          title: "Connect Wallet",
          description: "Connect your wallet to continue",
        },
      });

      this._publicKey = publicKey;
      this._connecting = false;
      this.emit("connect", this._publicKey);

      // Only hide modal if this was a new session (user entered code)
      if (isNewSession) {
        // Give user a moment to see the success message
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

  // Disconnect and clear session
  disconnect(): Promise<void> {
    this._publicKey = null;
    this._actio.disconnectWallet();
    this.emit("disconnect");
    return Promise.resolve();
  }

  // Auto-connect using session if available
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
      // Auto-connect failures should be silent
      console.warn("Auto-connect failed:", error);
    }
  }

  /**
   * Convert Uint8Array to base64 string using browser-native btoa
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    // Convert Uint8Array to binary string
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    // Convert to base64 using browser-native btoa
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
