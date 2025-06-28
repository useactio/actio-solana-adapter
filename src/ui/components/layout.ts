import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { theme } from "../styles/theme";
import LogoBlackSvg from "../assets/logo-black.svg";
import LogoLimeSvg from "../assets/logo-lime.svg";

@customElement("actio-layout")
export class ActioLayout extends LitElement {
  @property()
  origin?: string;

  @property()
  favicon?: string;

  render() {
    return html`
      <div class="layout">
        <!-- Header -->
        <div class="header">
          <!-- Actio Logo (Left) -->
          <div class="header-left">
            <img
              src="${LogoBlackSvg}"
              class="actio-logo actio-logo-light"
              alt="Actio"
            />
            <img
              src="${LogoLimeSvg}"
              class="actio-logo actio-logo-dark"
              alt="Actio"
            />
          </div>

          <!-- Website Domain Info (Right) -->
          <div class="header-right">
            ${this.favicon
              ? html`<img src="${this.favicon}" alt="" class="favicon" />`
              : html`<div class="favicon-placeholder">🌐</div>`}
            <span class="origin">${this.origin || "Unknown Origin"}</span>
          </div>
        </div>

        <!-- Content -->
        <div class="content">
          <slot></slot>
        </div>

        <!-- Footer -->
        <div class="footer">
          <a href="https://actio.click" target="_blank" rel="noopener noreferrer" class="powered-by">
            <span>Powered by</span>
            <img
              src="${LogoBlackSvg}"
              class="actio-logo actio-logo-light"
              alt="Actio"
            />
            <img
              src="${LogoLimeSvg}"
              class="actio-logo actio-logo-dark"
              alt="Actio"
            />
          </a>
        </div>
      </div>
    `;
  }

  static styles = [
    theme,
    css`
      .layout {
        display: flex;
        flex-direction: column;
        min-height: 100%;
      }

      /* Header Styles */
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-lg) var(--space-2xl);
        border-bottom: 1px solid var(--border-primary);
        background: var(--bg-primary);
      }

      .header-left {
        display: flex;
        align-items: center;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
      }

      .header .actio-logo {
        height: 24px;
        width: auto;
      }

      .favicon {
        width: 16px;
        height: 16px;
        border-radius: var(--radius-sm);
      }

      .favicon-placeholder {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        border-radius: var(--radius-sm);
        background: var(--bg-tertiary);
      }

      .origin {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
      }

      /* Content Styles */
      .content {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      /* Footer Styles */
      .footer {
        padding: var(--space-lg) var(--space-2xl) var(--space-2xl);
        border-top: 1px solid var(--border-primary);
        background: var(--bg-secondary);
      }

      .powered-by {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-sm);
        font-size: var(--font-size-xs);
        color: var(--text-tertiary);
        text-decoration: none;
        transition: all 0.2s ease;
        cursor: pointer;
      }

      .powered-by:hover {
        color: var(--color-primary);
      }

      .footer .actio-logo {
        height: 16px;
        width: auto;
        opacity: 0.8;
        transition: opacity 0.2s ease;
      }

      .powered-by:hover .actio-logo {
        opacity: 1;
        transform: scale(1.05);
      }

      /* Logo visibility for light/dark mode */
      .actio-logo-light {
        display: block;
      }

      .actio-logo-dark {
        display: none;
      }

      @media (prefers-color-scheme: dark) {
        .actio-logo-light {
          display: none;
        }

        .actio-logo-dark {
          display: block;
        }
      }

      /* Mobile responsiveness */
      @media (max-width: 480px) {
        .header {
          padding: var(--space-md) var(--space-lg);
        }

        .footer {
          padding: var(--space-md) var(--space-lg) var(--space-lg);
        }
      }
    `,
  ];
}
