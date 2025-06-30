import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { modal } from "./styles/modal";
import { theme } from "./styles/theme";

// Import the modular screen components
import "./components/input-screen.js";
import "./components/loading-screen.js";
import "./components/error-screen.js";
import "./components/success-screen.js";

import type {
  ModalScreen,
  CodeSubmitEvent,
  ModalCloseEvent,
} from "./components/index.js";

export interface ActionContext {
  origin: string;
  title: string;
  description: string;
  amount?: {
    value: string;
    currency: string;
    formatted: string;
  };
  type?: string;
  favicon?: string;
  metadata?: Record<string, any>;
}

/**
 * Actio Modal Component - Main modal wrapper that manages different screen states
 *
 * @fires code-submit - Fired when user submits a code in the input screen
 * @fires modal-close - Fired when modal should be closed
 */
@customElement("actio-modal")
export class ActioModal extends LitElement {
  @state() private visible = false;

  /**
   * The current screen to show
   */
  @state() private screen: ModalScreen = "input";

  /**
   * Action context for rich display
   */
  @property({ type: Object })
  actionContext?: ActionContext;

  /**
   * Loading message to display
   */
  @property()
  loadingMessage = "Processing your action...";

  /**
   * Error details
   */
  @state() private errorTitle = "Action Failed";
  @state() private errorMessage =
    "Something went wrong while processing your action.";
  @state() private errorDetails?: string;

  /**
   * Success details
   */
  @state() private successTitle = "Action Completed Successfully";
  @state() private successMessage =
    "Your action has been processed successfully.";
  @state() private txHash?: string;

  constructor() {
    super();
    // Modal starts hidden by default - only opens when explicitly requested
  }

  render() {
    if (!this.visible) {
      return null;
    }

    return html`
      <div class="overlay">
        <div class="modal">${this.renderCurrentScreen()}</div>
      </div>
    `;
  }

  private renderCurrentScreen() {
    switch (this.screen) {
      case "input":
        return html`
          <actio-input-screen
            .onSubmit=${this._handleCodeSubmit}
            .onClose=${this._handleClose}
            .context=${this.actionContext}
          ></actio-input-screen>
        `;

      case "loading":
        return html`
          <actio-loading-screen
            .message=${this.loadingMessage}
            .context=${this.actionContext}
          ></actio-loading-screen>
        `;

      case "error":
        return html`
          <actio-error-screen
            .title=${this.errorTitle}
            .message=${this.errorMessage}
            .error=${this.errorDetails}
            .context=${this.actionContext}
            .onRetry=${this._handleRetry}
            .onClose=${this._handleClose}
          ></actio-error-screen>
        `;

      case "success":
        return html`
          <actio-success-screen
            .title=${this.successTitle}
            .message=${this.successMessage}
            .txHash=${this.txHash}
            .context=${this.actionContext}
            .onClose=${this._handleClose}
            .onViewTransaction=${this._handleViewTransaction}
          ></actio-success-screen>
    `;

      default:
        return html`<div>Unknown screen state</div>`;
    }
  }

  private _handleCodeSubmit = (code: string) => {
    this.dispatchEvent(
      new CustomEvent("code-submit", {
        detail: { code },
        bubbles: true,
        composed: true,
      }) as CodeSubmitEvent
    );
  };

  private _handleRetry = () => {
    this.dispatchEvent(
      new CustomEvent("modal-retry", {
        detail: {},
        bubbles: true,
        composed: true,
      })
    );
  };

  private _handleClose = () => {
    // Dispatch the modal-close event so the modal service can handle it properly
    this.dispatchEvent(
      new CustomEvent("modal-close", {
        detail: { reason: "user" },
        bubbles: true,
        composed: true,
      }) as ModalCloseEvent
    );
  };

  private _handleViewTransaction = (txHash: string) => {
    // Open transaction in a new tab - you can customize this URL based on your network
    const url = `https://solscan.io/tx/${txHash}`;
    window.open(url, "_blank");
  };

  // Public API methods for controlling the modal

  /**
   * Show or hide the modal
   */
  public setVisible(visible: boolean) {
    this.visible = visible;
  }

  /**
   * Change the current screen
   */
  public setScreen(screen: ModalScreen) {
    this.screen = screen;
  }

  /**
   * Set action context for better UX
   */
  public setActionContext(context: ActionContext) {
    this.actionContext = context;
  }

  /**
   * Show loading screen with optional message
   */
  public showLoading(message?: string) {
    if (message) {
      this.loadingMessage = message;
    }
    this.setScreen("loading");
  }

  /**
   * Show error screen with details
   */
  public showError(title?: string, message?: string, error?: string) {
    if (title) this.errorTitle = title;
    if (message) this.errorMessage = message;
    this.errorDetails = error;
    this.setScreen("error");
  }

  /**
   * Show success screen with details
   */
  public showSuccess(title?: string, message?: string, txHash?: string) {
    if (title) this.successTitle = title;
    if (message) this.successMessage = message;
    this.txHash = txHash;
    this.setScreen("success");
  }

  /**
   * Reset to input screen
   */
  public reset() {
    this.setScreen("input");
    this.errorDetails = undefined;
    this.txHash = undefined;
  }

  static styles = [theme, modal];
}

declare global {
  interface HTMLElementTagNameMap {
    "actio-modal": ActioModal;
  }
}
