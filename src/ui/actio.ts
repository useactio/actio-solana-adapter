import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import ActioLogo from "./assets/logo-black-lime.svg";
import { modal } from "./styles/modal";
import { theme } from "./styles/theme";

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement("actio-modal")
export class ActioModal extends LitElement {
  @state() private visible = false; // modal visibility

  /**
   * Copy for the read the docs hint.
   */
  @property()
  docsHint = "Click on the Vite and Lit logos to learn more";

  /**
   * The number of times the button has been clicked.
   */
  @property({ type: Number })
  count = 0;

  constructor() {
    super();
    this.visible = false; // modal visibility
  }

  render() {
    return this.visible
      ? html`
          <div class="overlay">
            <div class="modal">
              <img src=${ActioLogo} class="logo" alt="Actio logo" />
              <h2>Enter Your Action Code</h2>
              <input
                id="code-input"
                type="text"
                placeholder="e.g. actio-abc123"
              />
              <button @click=${this._submit}>Continue</button>
            </div>
          </div>
        `
      : null;
  }

  private _submit() {
    const code = (
      this.shadowRoot?.querySelector("#code-input") as HTMLInputElement
    ).value;
    this.dispatchEvent(new CustomEvent("code-submit", {
      detail: { code },
      bubbles: true,
      composed: true,
    }));
  }

  public setVisible(visible: boolean) {
    this.visible = visible;
  }

  static styles = [theme, modal];
}

declare global {
  interface HTMLElementTagNameMap {
    "actio-modal": ActioModal;
  }
}
