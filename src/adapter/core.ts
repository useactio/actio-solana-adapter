import {
  WalletConnectionError,
  isVersionedTransaction,
} from "@solana/wallet-adapter-base";
import { ActionCodesClient } from "@actioncodes/sdk";

export class ActioCore {
  private readonly actionCodesClient: ActionCodesClient;

  constructor() {
    this.actionCodesClient = new ActionCodesClient();
  }

  public init() {
    if (typeof window === "undefined") {
      throw new Error("ActioCore is not supported on server");
    }

    this.mountModal();
  }

  public mountModal(): void {
    // TODO: inject <actio-modal> into the DOM if not already present
  }

  public async openModal(): Promise<string> {
    // TODO: trigger modal and resolve the action code input
    return "";
  }
}
