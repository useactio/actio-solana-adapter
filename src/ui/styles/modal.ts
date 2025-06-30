import { css } from "lit";

export const modal = css`
  :host {
    display: block;
  }

  /* Modal Overlay */
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(12px);
    padding: var(--space-lg);
    animation: fadeIn 0.2s ease-out;
  }

  /* Modal Container */
  .modal {
    background: var(--bg-primary);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-xl);
    max-width: 420px;
    width: 100%;
    max-height: calc(100vh - 32px);
    overflow: hidden;
    position: relative;
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1px solid var(--border-primary);
  }

  /* Remove default padding - components handle their own */
  .modal > * {
    margin: 0;
  }

  /* Input Screen Styles */
  .input-container {
    padding: var(--space-3xl) var(--space-2xl) var(--space-lg);
  }

  .action-title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-sm);
    line-height: var(--line-height-tight);
    text-align: center;
  }

  .action-description {
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
    margin-bottom: var(--space-xl);
    text-align: center;
  }

  .amount-display {
    background: var(--color-primary-light);
    border: 1px solid rgba(136, 231, 85, 0.2);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    margin-bottom: var(--space-xl);
    text-align: center;
  }

  .amount-label {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: var(--space-xs);
  }

  .amount-value {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    line-height: var(--line-height-tight);
  }

  /* Form Elements */
  .form-group {
    margin-bottom: var(--space-xl);
  }

  .form-label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    margin-bottom: var(--space-sm);
  }

  .form-input {
    width: 100%;
    padding: var(--space-md) var(--space-lg);
    font-size: 16px; /* 16px minimum to prevent zoom on iOS */
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
    transition: all 0.2s ease;
    line-height: var(--line-height-normal);
  }

  .form-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(136, 231, 85, 0.1);
  }

  .form-input::placeholder {
    color: var(--text-tertiary);
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-md) var(--space-xl);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    line-height: var(--line-height-normal);
    min-height: 44px;
  }

  .btn-primary {
    background: var(--color-primary);
    color: #141414;
    box-shadow: var(--shadow-sm);
    font-weight: var(--font-weight-medium);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-hover);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  .btn-secondary {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-primary);
    font-weight: var(--font-weight-medium);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--bg-tertiary);
    border-color: var(--border-secondary);
  }

  .btn-full {
    width: 100%;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }

  /* Loading Screen */
  .loading-container {
    padding: var(--space-3xl) var(--space-2xl);
    text-align: center;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-primary);
    border-top: 3px solid var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto var(--space-xl);
  }

  .loading-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-sm);
  }

  .loading-message {
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
  }

  /* Error Screen */
  .error-container {
    padding: var(--space-3xl) var(--space-2xl) var(--space-lg);
    text-align: center;
  }

  .error-icon {
    width: 56px;
    height: 56px;
    background: var(--color-danger-light);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--space-xl);
    color: var(--color-danger);
    font-size: var(--font-size-2xl);
  }

  .error-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-sm);
  }

  .error-message {
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
    margin-bottom: var(--space-lg);
  }

  .error-details {
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    margin-bottom: var(--space-xl);
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    text-align: left;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .error-actions {
    display: flex;
    gap: var(--space-md);
    margin-bottom: var(--space-xl);
  }

  /* Success Screen */
  .success-container {
    padding: var(--space-3xl) var(--space-2xl) var(--space-lg);
    text-align: center;
  }

  .success-icon {
    width: 56px;
    height: 56px;
    background: var(--color-success-light);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--space-xl);
    color: var(--color-success);
    font-size: var(--font-size-2xl);
  }

  .success-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-sm);
  }

  .success-message {
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
    margin-bottom: var(--space-xl);
  }

  .transaction-info {
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    padding: var(--space-lg);
    margin-bottom: var(--space-xl);
    text-align: left;
  }

  .transaction-label {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: var(--space-xs);
  }

  .transaction-hash {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    word-break: break-all;
    line-height: var(--line-height-relaxed);
  }

  .success-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    margin-bottom: var(--space-xl);
  }

  /* Responsive Design */
  @media (max-width: 480px) {
    .overlay {
      padding: var(--space-md);
      align-items: center; /* Keep modal centered on mobile */
    }
    
    .modal {
      border-radius: var(--radius-2xl); /* Keep consistent border radius */
      max-height: 90vh;
      width: 100%;
    }

    .input-container,
    .loading-container,
    .error-container,
    .success-container {
      padding: var(--space-2xl) var(--space-lg) var(--space-lg);
    }

    .error-actions,
    .success-actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
    }
  }

  @media (max-height: 700px) {
    .overlay {
      align-items: flex-start;
      padding-top: var(--space-2xl);
    }
    
    .input-container,
    .loading-container,
    .error-container,
    .success-container {
      padding-top: var(--space-2xl);
    }
  }

  /* Focus states for accessibility */
  .modal:focus {
    outline: none;
  }

  .btn:focus-visible {
    box-shadow: 0 0 0 3px rgba(136, 231, 85, 0.3);
  }

  .form-input:focus-visible {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(136, 231, 85, 0.1);
  }

  .btn-half {
    width: 50%;
  }

  @media (max-width: 480px) {
    .error-actions {
      flex-direction: column;
    }
    .btn-half {
      width: 100%;
    }
  }
`;
