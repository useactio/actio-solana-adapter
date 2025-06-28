import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import ActioLogo from "./assets/logo-black-lime.svg";

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
          <div>
            <img src=${ActioLogo} class="logo" alt="Actio logo" />
            <h1>Actio Modal</h1>
          </div>
          <slot></slot>
          <div class="card">
            <button @click=${this._onClick} part="button">
              count is ${this.count}
            </button>
          </div>
          <p class="read-the-docs">${this.docsHint}</p>
        `
      : null;
  }

  private _onClick() {
    this.count++;
  }

  static styles = css`
    :host {
      background-color: #000;
      color: white;
      padding: 2rem;
      text-align: center;
      border-radius: 1rem;
      width: 100%;
      height: 100%;
    }

    .logo {
      height: 2em;
      padding: 1.5em;
      will-change: filter;
      transition: filter 300ms;
    }
    .logo:hover {
      filter: drop-shadow(0 0 2em #646cffaa);
    }
    .logo.lit:hover {
      filter: drop-shadow(0 0 2em #325cffaa);
    }

    .card {
      padding: 2em;
    }

    .read-the-docs {
      color: #888;
    }

    ::slotted(h1) {
      font-size: 3.2em;
      line-height: 1.1;
    }

    a {
      font-weight: 500;
      color: #646cff;
      text-decoration: inherit;
    }
    a:hover {
      color: #535bf2;
    }

    button {
      color: white;
      border-radius: 8px;
      border: 1px solid transparent;
      padding: 0.6em 1.2em;
      font-size: 1em;
      font-weight: 500;
      font-family: inherit;
      background-color: #1a1a1a;
      cursor: pointer;
      transition: border-color 0.25s;
    }
    button:hover {
      border-color: #646cff;
    }
    button:focus,
    button:focus-visible {
      outline: 4px auto -webkit-focus-ring-color;
    }

    @media (prefers-color-scheme: light) {
      a:hover {
        color: #747bff;
      }
      button {
        color: black;
        background-color: #f9f9f9;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "actio-modal": ActioModal;
  }
}
