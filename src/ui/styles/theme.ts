import { css } from "lit";

export const theme = css`
  :host {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: var(--text-primary);
    line-height: 1.5;
    font-size: 14px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :host {
    /* Color System - Actio Brand Colors */
    --color-primary: #88E755;
    --color-primary-hover: #7DD147;
    --color-primary-light: #F0FDE7;
    
    --color-success: #10b981;
    --color-success-light: #d1fae5;
    
    --color-danger: #ef4444;
    --color-danger-light: #fee2e2;
    
    --color-warning: #f59e0b;
    --color-warning-light: #fef3c7;
    
    /* Text Colors */
    --text-primary: #141414;
    --text-secondary: #6b7280;
    --text-tertiary: #9ca3af;
    --text-inverse: #ffffff;
    
    /* Background Colors */
    --bg-primary: #ffffff;
    --bg-secondary: #f9fafb;
    --bg-tertiary: #f3f4f6;
    --bg-overlay: rgba(20, 20, 20, 0.4);
    
    /* Border Colors */
    --border-primary: #e5e7eb;
    --border-secondary: #d1d5db;
    --border-focus: var(--color-primary);
    
    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    
    /* Border Radius */
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-2xl: 20px;
    
    /* Spacing */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 12px;
    --space-lg: 16px;
    --space-xl: 24px;
    --space-2xl: 32px;
    --space-3xl: 48px;
    
    /* Typography */
    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
    
    --font-size-xs: 12px;
    --font-size-sm: 13px;
    --font-size-base: 14px;
    --font-size-lg: 16px;
    --font-size-xl: 18px;
    --font-size-2xl: 24px;
    --font-size-3xl: 30px;
    
    --line-height-tight: 1.25;
    --line-height-snug: 1.375;
    --line-height-normal: 1.5;
    --line-height-relaxed: 1.625;
  }

  /* Dark mode */
  @media (prefers-color-scheme: dark) {
    :host {
      --text-primary: #f9fafb;
      --text-secondary: #d1d5db;
      --text-tertiary: #9ca3af;
      
      --bg-primary: #141414;
      --bg-secondary: #1f1f1f;
      --bg-tertiary: #2a2a2a;
      --bg-overlay: rgba(0, 0, 0, 0.6);
      
      --border-primary: #333333;
      --border-secondary: #404040;
    }
  }

  * {
    box-sizing: border-box;
  }

  /* Typography */
  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    font-weight: var(--font-weight-semibold);
    line-height: var(--line-height-tight);
    color: var(--text-primary);
  }

  h1 { font-size: var(--font-size-3xl); }
  h2 { font-size: var(--font-size-2xl); }
  h3 { font-size: var(--font-size-xl); }
  h4 { font-size: var(--font-size-lg); }
  h5 { font-size: var(--font-size-base); }
  h6 { font-size: var(--font-size-sm); }

  p {
    margin: 0;
    line-height: var(--line-height-normal);
    color: var(--text-secondary);
  }

  small {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
  }

  /* Form Elements */
  input, textarea, select {
    font-family: inherit;
    font-size: var(--font-size-base);
    line-height: var(--line-height-normal);
    color: var(--text-primary);
    background: var(--bg-primary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
  }

  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px rgba(136, 231, 85, 0.1);
  }

  /* Buttons */
  button {
    font-family: inherit;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-normal);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    user-select: none;
  }

  button:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(136, 231, 85, 0.1);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Utility Classes */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .text-center { text-align: center; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }

  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .items-center { align-items: center; }
  .justify-center { justify-content: center; }
  .justify-between { justify-content: space-between; }

  .w-full { width: 100%; }
  .h-full { height: 100%; }

  .hidden { display: none; }

  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
