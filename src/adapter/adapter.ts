import {
  BaseSignerWalletAdapter,
  WalletReadyState,
  type TransactionOrVersionedTransaction,
  type WalletName,
} from "@solana/wallet-adapter-base";
import { PublicKey, type TransactionVersion } from "@solana/web3.js";
import ActioIcon from "./icon";

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

  constructor() {
    super();

    this._readyState =
      typeof window === "undefined"
        ? WalletReadyState.Unsupported // not supported on server
        : WalletReadyState.Installed; // since we dont use browser injection, we can assume the wallet is installed
    this._publicKey = null;
    this._connecting = false;
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
  >(transaction: T): Promise<T> {
    throw new Error("Method not implemented.");
  }

  // we dont support signing multiple transactions at once since
  // one code = one action = one transaction
  // maybe later we batch it
  public signAllTransactions<
    T extends TransactionOrVersionedTransaction<
      this["supportedTransactionVersions"]
    >
  >(transactions: T[]): Promise<T[]> {
    throw new Error("Method not implemented.");
  }

  // we dont support connecting to the wallet
  // instead we trigger a popup to open Actio Modal
  connect(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  // we dont support disconnecting from the wallet
  // we use it as cleanup
  disconnect(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
