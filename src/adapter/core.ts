import { WalletConnectionError } from "@solana/wallet-adapter-base";
import { ActionCodesClient } from "@actioncodes/sdk";
import "../ui/actio";
import { PublicKey } from "@solana/web3.js";

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
    if (document.querySelector("actio-modal")) {
      return;
    }

    const modal = document.createElement("actio-modal");
    document.body.appendChild(modal);
  }

  public async openModal(): Promise<PublicKey> {
    const modal = document.querySelector("actio-modal") as HTMLElement & { setVisible: (v: boolean) => void };
    if (!modal) {
      throw new Error("ActioModal not found");
    }

    modal.setVisible(true);

    // Return a promise that resolves when the user submits the code
    const code = await new Promise<string>((resolve) => {
      const handler = (event: Event) => {
        const customEvent = event as CustomEvent;
        modal.removeEventListener("code-submit", handler);
        resolve(customEvent.detail.code);
      };
      modal.addEventListener("code-submit", handler);
    });

    const action = await this.actionCodesClient.getAction(code);

    modal.setVisible(false);

    if (!action.intendedFor) {
      throw new WalletConnectionError();
    }

    return new PublicKey(action.intendedFor);
  }
}
