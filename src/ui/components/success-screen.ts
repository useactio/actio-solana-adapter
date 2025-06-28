import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { theme } from "../styles/theme";
import { modal } from "../styles/modal";
import type { ActionContext } from "../actio";
import "./layout";

@customElement("actio-success-screen")
export class ActioSuccessScreen extends LitElement {
  @property()
  title = "Transaction Successful";

  @property()
  message = "Your transaction has been processed successfully.";

  @property()
  txHash?: string;

  @property({ type: Object })
  context?: ActionContext;

  @property({ type: Function })
  onClose?: () => void;

  @property({ type: Function })
  onViewTransaction?: (txHash: string) => void;

  private _handleClose() {
    if (this.onClose) {
      this.onClose();
    }
  }

  private _handleViewTransaction() {
    if (this.txHash && this.onViewTransaction) {
      this.onViewTransaction(this.txHash);
    }
  }

  render() {
    const context = this.context || {
      origin: "Unknown Origin",
      title: "Transaction Complete",
      description: "Your transaction has been successfully processed.",
    };

    return html`
      <actio-layout .origin=${context.origin} .favicon=${context.favicon}>
        <div class="success-container">
          <div class="success-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9 12l2 2 4-4"></path>
            </svg>
          </div>

          <h3 class="success-title">${this.title}</h3>
          <p class="success-message">${this.message}</p>

          ${this.txHash
            ? html`
                <div class="transaction-info">
                  <div class="transaction-header">
                    ${context.favicon
                      ? html`<img
                          src="${context.favicon}"
                          alt=""
                          class="transaction-favicon"
                        />`
                      : html`<div class="transaction-favicon-placeholder">
                          🌐
                        </div>`}
                    <div class="transaction-details">
                      <div class="transaction-origin">${context.origin}</div>
                      <div class="transaction-label">Transaction Hash</div>
                    </div>
                  </div>
                  <div class="transaction-hash">${this.txHash}</div>
                </div>
              `
            : ""}

          <div class="success-actions">
            ${this.txHash
              ? html`
                  <button
                    class="btn btn-primary btn-full"
                    @click=${this._handleViewTransaction}
                  >
                    View Transaction
                  </button>
                `
              : ""}
            <button
              class="btn btn-secondary btn-full"
              @click=${this._handleClose}
            >
              Close
            </button>
          </div>
        </div>
      </actio-layout>
    `;
  }

  static styles = [
    theme,
    modal,
    css`
      .transaction-header {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        margin-bottom: var(--space-sm);
      }

      .transaction-favicon {
        width: 20px;
        height: 20px;
        border-radius: var(--radius-sm);
      }

      .transaction-favicon-placeholder {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        border-radius: var(--radius-sm);
        background: var(--bg-tertiary);
      }

      .transaction-details {
        flex: 1;
      }

      .transaction-origin {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
        margin-bottom: 2px;
      }

      .transaction-label {
        font-size: var(--font-size-xs);
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "actio-success-screen": ActioSuccessScreen;
  }
}
