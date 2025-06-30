import type { ActionResult, ModalState, ActionContext } from "../types/index";

// Import UI components
import "../../ui/actio";
import type { ActioModal } from "../../ui/actio";

/**
 * Service for managing modal UI interactions
 */
export class ModalService {
  private modal: ActioModal | null = null;
  private currentPromise: {
    resolve: (value: string) => void;
    reject: (error: Error) => void;
  } | null = null;
  private retryPromise: {
    resolve: () => void;
    reject: (error: Error) => void;
  } | null = null;

  /**
   * Initialize and mount the modal
   */
  init(): void {
    if (typeof window === "undefined" || typeof document === "undefined") {
      throw new Error("Modal service requires a browser environment");
    }

    // Remove existing modal if present
    this.unmount();

    // Create and mount new modal
    this.modal = document.createElement("actio-modal") as ActioModal;
    document.body.appendChild(this.modal);

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for modal interactions
   */
  private setupEventListeners(): void {
    if (!this.modal) return;

    // Handle code submission
    this.modal.addEventListener("code-submit", (event: any) => {
      const { code } = event.detail;
      if (this.currentPromise && code) {
        this.currentPromise.resolve(code);
        this.currentPromise = null;
      }
    });

    // Handle retry from error screen
    this.modal.addEventListener("modal-retry", () => {
      if (this.modal) {
        // Switch to input screen
        this.modal.setScreen("input");
        
        // DON'T resolve the promise here - let the user enter a new code
        // The promise will be resolved when the user submits the new code
      }
    });

    // Handle modal close/cancel
    this.modal.addEventListener("modal-close", (event: any) => {
      const { reason } = event.detail;
      this.handleModalClose(reason);
    });

    // Handle escape key to close modal
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.modal?.style.display !== "none") {
        this.handleModalClose("escape");
      }
    });
  }

  /**
   * Handle modal close/cancel with proper cleanup
   */
  private handleModalClose(reason: string): void {
    // Reject current promise if active
    if (this.currentPromise) {
      this.currentPromise.reject(new Error(`Modal closed: ${reason}`));
      this.currentPromise = null;
    }

    // Hide and reset modal
    this.hide();
    this.reset();
  }

  /**
   * Show the modal and wait for user input
   */
  async show(): Promise<string> {
    if (!this.modal) {
      throw new Error("Modal not initialized");
    }

    // Only reset and show if there's no current promise (first time) AND we're not on error screen
    if (!this.currentPromise && this.getState().screen !== "error") {
      this.reset();
      this.modal.setVisible(true);
      this.modal.setScreen("input");
    } else if (!this.currentPromise && this.getState().screen === "error") {
      // Don't reset, just make sure modal is visible
      this.modal.setVisible(true);
    }

    // Return promise that resolves with user input
    return new Promise((resolve, reject) => {
      this.currentPromise = { resolve, reject };
    });
  }

  /**
   * Hide the modal
   */
  hide(): void {
    if (this.modal) {
      this.modal.setVisible(false);
    }
  }

  /**
   * Set action context for rich display
   */
  setActionContext(context: ActionContext): void {
    if (this.modal) {
      this.modal.setActionContext(context);
    }
  }

  /**
   * Show loading state with message
   */
  showLoading(message = "Processing your action..."): void {
    if (this.modal) {
      this.modal.setVisible(true);
      this.modal.showLoading(message);
    }
  }

  /**
   * Show error state
   */
  showError(error: Error, title?: string): void {
    if (!this.modal) return;

    this.modal.setVisible(true);

    // Enhanced error handling with better messages
    let errorTitle = title || "Something went wrong";
    let errorMessage = "An unexpected error occurred. Please try again.";
    // let errorDetails: string | undefined;

    // Check if it's a network error with enhanced information
    if ((error as any).networkErrorCode) {
      const networkError = error as any;
      errorTitle = this.getErrorTitle(networkError.networkErrorCode);
      errorMessage = error.message;

      // Add helpful context
      const helpText = networkError.getHelpText?.();
      if (helpText) {
        errorMessage += `\n\n${helpText}`;
      }

      // Show technical details if needed
      if (networkError.originalError) {
        // errorDetails = `Technical details: ${networkError.originalError.message}`;
      }
    } else {
      errorMessage = error.message || errorMessage;
      // errorDetails = error.stack;
      if (error.stack) {
      }
    }

    // Remove 'Error: ' prefix if present
    if (errorMessage.startsWith('Error: ')) {
      errorMessage = errorMessage.slice(7);
    }
    this.modal.showError(errorTitle, errorMessage);
  }

  /**
   * Get user-friendly error titles
   */
  private getErrorTitle(networkErrorCode: string): string {
    switch (networkErrorCode) {
      case "CORS_ERROR":
        return "Connection Blocked";
      case "CONNECTION_ERROR":
        return "Connection Failed";
      case "TIMEOUT_ERROR":
        return "Request Timeout";
      case "SERVER_ERROR":
        return "Service Unavailable";
      case "AUTH_ERROR":
        return "Authorization Failed";
      case "NOT_FOUND_ERROR":
        return "Action Not Found";
      default:
        return "Connection Error";
    }
  }

  /**
   * Show success state
   */
  showSuccess(result: ActionResult): void {
    if (this.modal) {
      this.modal.setVisible(true);
      this.modal.showSuccess(
        "Action Completed Successfully",
        "Your action has been processed successfully.",
        result.signature
      );
    }
  }

  /**
   * Reset modal to initial state
   */
  reset(): void {
    if (this.modal) {
      this.modal.reset();
    }
    // Do not reject the currentPromise here; only reset UI.
  }

  /**
   * Force close and reset everything (for emergencies)
   */
  forceClose(): void {
    this.handleModalClose("force");
  }

  /**
   * Get current modal state
   */
  getState(): ModalState {
    if (!this.modal) {
      return { visible: false, screen: "input" };
    }

    return {
      visible: (this.modal as any).visible,
      screen: (this.modal as any).screen,
    };
  }

  /**
   * Check if modal is mounted and available
   */
  isAvailable(): boolean {
    return this.modal !== null;
  }

  /**
   * Remove modal from DOM
   */
  unmount(): void {
    if (this.modal) {
      // Cancel any pending operations
      this.forceClose();

      // Remove from DOM
      if (this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      this.modal = null;
    }
  }

  /**
   * Wait for retry action
   */
  async waitForRetry(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.retryPromise = { resolve, reject };
    });
  }
}
