import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { theme } from "../styles/theme";
import { modal } from "../styles/modal";
import type { ActionContext } from "../actio";
import "./layout";

@customElement("actio-error-screen")
export class ActioErrorScreen extends LitElement {
  @property()
  title = "Action Failed";

  @property()
  message = "Something went wrong while processing your action.";

  @property()
  error?: string;

  @property({ type: Object })
  context?: ActionContext;

  @property({ type: Function })
  onRetry?: () => void;

  @property({ type: Function })
  onClose?: () => void;

  private _handleRetry() {
    this.dispatchEvent(
      new CustomEvent("modal-retry", {
        detail: {},
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleClose() {
    if (this.onClose) {
      this.onClose();
    }
  }

  render() {
    const context = this.context || {
      origin: "Unknown Origin",
      title: "Action Error",
      description: "An error occurred while processing your action.",
    };

    return html`
      <actio-layout 
        .origin=${context.origin}
        .favicon=${context.favicon}
      >
        <div class="error-container">
          <div class="error-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>

          <h3 class="error-title">${this.title}</h3>
          <p class="error-message">${this.message}</p>

          ${this.error
            ? html`<div class="error-details">${this.error}</div>`
            : ""}

          <div class="error-actions">
            <button class="btn btn-primary btn-half" @click=${this._handleRetry}>
              Try Again
            </button>
            <button class="btn btn-secondary btn-half" @click=${this._handleClose}>
              Cancel
            </button>
          </div>
        </div>
      </actio-layout>
    `;
  }

  static styles = [theme, modal];
}

declare global {
  interface HTMLElementTagNameMap {
    "actio-error-screen": ActioErrorScreen;
  }
} 