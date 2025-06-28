import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { theme } from "../styles/theme";
import { modal } from "../styles/modal";
import type { ActionContext } from "../actio";
import "./layout";

@customElement("actio-input-screen")
export class ActioInputScreen extends LitElement {
  @property({ type: Function })
  onSubmit?: (code: string) => void;

  @property({ type: Object })
  context?: ActionContext;

  @property({ type: Function })
  onClose?: () => void;

  private _handleSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const code = formData.get("code") as string;

    if (code && this.onSubmit) {
      this.onSubmit(code);
    }
  }

  private _handleClose() {
    if (this.onClose) {
      this.onClose();
    }
  }

  render() {
    const context = this.context || {
      origin: "Unknown Origin",
      title: "Authorize Transaction",
      description: "Please authorize this blockchain transaction to continue.",
    };

    return html`
      <actio-layout .origin=${context.origin} .favicon=${context.favicon}>
        <!-- Main Content -->
        <div class="input-container">
          <!-- Action Title & Description -->
          <h2 class="action-title">${context.title}</h2>
          <p class="action-description">${context.description}</p>

          <!-- Amount Display (if provided) -->
          ${context.amount
            ? html`
                <div class="amount-display">
                  <div class="amount-label">Amount</div>
                  <div class="amount-value">${context.amount.formatted}</div>
                </div>
              `
            : ""}

          <!-- Input Form -->
          <form @submit=${this._handleSubmit}>
            <div class="form-group">
              <label class="form-label" for="code">Your one-time code</label>
              <input
                class="form-input"
                type="text"
                id="code"
                name="code"
                placeholder="Enter your one-time code..."
                required
                autocomplete="off"
                spellcheck="false"
              />
              <div class="form-help">
                <a href="#" class="help-link">Where to get code?</a>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary btn-full">
                Authorise with action code
              </button>

              <button
                type="button"
                class="btn btn-secondary btn-full"
                @click=${this._handleClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </actio-layout>
    `;
  }

  static styles = [
    theme,
    modal,
    css`
      .form-actions {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
      }

      .form-help {
        margin-top: var(--space-sm);
        text-align: center;
      }

      .help-link {
        font-size: var(--font-size-xs);
        color: var(--text-tertiary);
        text-decoration: none;
        transition: color 0.2s ease;
      }

      .help-link:hover {
        color: var(--color-primary);
        text-decoration: underline;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "actio-input-screen": ActioInputScreen;
  }
}
