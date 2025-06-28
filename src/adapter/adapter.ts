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

  public signTransaction<
    T extends TransactionOrVersionedTransaction<
      this["supportedTransactionVersions"]
    >
  >(): Promise<T> {
    throw new Error("Method not implemented.");
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

      // 1. Show modal and get code from user
      const code = await this._actio.getModalService().show();

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
