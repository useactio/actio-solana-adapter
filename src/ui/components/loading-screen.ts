import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { theme } from "../styles/theme";
import { modal } from "../styles/modal";
import type { ActionContext } from "../actio";
import "./layout";

@customElement("actio-loading-screen")
export class ActioLoadingScreen extends LitElement {
  @property()
  message = "Processing your action...";

  @property({ type: Object })
  context?: ActionContext;

  render() {
    const context = this.context || {
      origin: "Unknown Origin",
      title: "Processing Action",
      description: "Please wait while we process your action.",
    };

    return html`
      <actio-layout .origin=${context.origin} .favicon=${context.favicon}>
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <h3 class="loading-title">Processing</h3>
          <p class="loading-message">${this.message}</p>
        </div>
      </actio-layout>
    `;
  }

  static styles = [theme, modal];
}

declare global {
  interface HTMLElementTagNameMap {
    "actio-loading-screen": ActioLoadingScreen;
  }
}
