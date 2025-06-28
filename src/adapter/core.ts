import { PublicKey } from "@solana/web3.js";
import { createConfig, type ActioConfig } from "./config/index";
import { ActionCodesService, ModalService } from "./services/index";
import { ActioConnectionError, toActioError } from "./errors/index";
import type {
  ActionResult,
  ActionStatus,
  ActionSubmissionOptions,
  ActionContext,
} from "./types/index";

/**
 * Core class for the Actio Solana Adapter
 *
 * Provides a modular, type-safe interface for handling ActionCodes
 * with proper error handling and UI management.
 */
export class ActioCore {
  private readonly config: ActioConfig;
  private readonly actionCodesService: ActionCodesService;
  private readonly modalService: ModalService;

  constructor(userConfig: Partial<ActioConfig> = {}) {
    this.config = createConfig(userConfig);
    this.actionCodesService = new ActionCodesService();
    this.modalService = new ModalService();
  }

  public getActionCodesService(): ActionCodesService {
    return this.actionCodesService;
  }

  public getModalService(): ModalService {
    return this.modalService;
  }

  /**
   * Initialize the adapter
   */
  public init(): void {
    if (typeof window === "undefined") {
      throw new Error("ActioCore is not supported on server");
    }

    this.modalService.init();
  }

  /**
   * Open the modal and process an action code (UI only, no transaction logic)
   * Returns the code entered by the user
   */
  public async openModal(options?: ActionSubmissionOptions): Promise<string> {
    try {
      // Create action context from options and current origin
      const context = this.createActionContext(options);
      this.modalService.setActionContext(context);
      const code = await this.modalService.show();
      return code;
    } catch (error) {
      console.log("openModal caught error:", error);
      if (
        error instanceof Error &&
        (error.message.includes("Modal closed") ||
          error.message.includes("Action was cancelled"))
      ) {
        this.modalService.hide();
        throw error;
      }
      if (
        error instanceof Error &&
        error.message === "Action did not complete successfully."
      ) {
        this.modalService.showError(
          new Error("Action did not complete successfully."),
          "Something went wrong"
        );
      } else {
        const actioError = toActioError(error);
        this.modalService.showError(actioError);
      }
      throw error;
    }
  }

  /**
   * Process an action code programmatically (no transaction logic)
   * @param code The action code
   * @param options Optional submission options
   * @returns The intended public key and action metadata
   */
  public async processAction(
    code: string,
    options?: ActionSubmissionOptions
  ): Promise<{ publicKey: PublicKey; code: string; metadata: any }> {
    try {
      // Step 1: Validate and fetch action details
      const action = await this.actionCodesService.getAction(code);
      if (!action.intendedFor) {
        throw new ActioConnectionError("Action missing intended recipient");
      }
      const publicKey = new PublicKey(action.intendedFor);
      return { publicKey, code, metadata: action };
    } catch (error) {
      throw toActioError(error);
    }
  }

  /**
   * Create action context from current environment and options
   */
  private createActionContext(
    options?: ActionSubmissionOptions
  ): ActionContext {
    // Get origin from current window or fallback
    const origin =
      typeof window !== "undefined"
        ? window.location.hostname
        : options?.context?.origin || "Unknown Origin";

    // Extract favicon if possible
    const favicon =
      typeof document !== "undefined"
        ? document.querySelector<HTMLLinkElement>(
            'link[rel="icon"], link[rel="shortcut icon"]'
          )?.href
        : options?.context?.favicon;

    // Build context from options and environment
    const context: ActionContext = {
      origin,
      title:
        options?.context?.title || options?.label || "Authorize Transaction",
      description:
        options?.context?.description ||
        options?.message ||
        "Please authorize this blockchain transaction to continue.",
      type: options?.context?.type || "Transaction",
      favicon,
      amount: options?.context?.amount,
      metadata: options?.context?.metadata,
    };

    return context;
  }
  /**
   * Update loading message based on action status
   */
  public updateLoadingMessage(status: ActionStatus): void {
    const messages: Record<ActionStatus, string> = {
      idle: "Preparing...",
      validating: "Validating action...",
      processing: "Please check your wallet to complete action",
      signing: "Waiting for signature...",
      submitting: "Submitting transaction...",
      completed: "Action completed!",
      failed: "Action failed",
      cancelled: "Action cancelled",
    };

    this.modalService.showLoading(messages[status]);
  }

  /**
   * Check if the adapter is properly initialized
   */
  public isInitialized(): boolean {
    return this.modalService.isAvailable();
  }

  /**
   * Get current configuration
   */
  public getConfig(): ActioConfig {
    return { ...this.config };
  }

  /**
   * Get network information
   */
  public async getNetworkInfo() {
    // This method is no longer used in the updated code
  }

  /**
   * Test network connection
   */
  public async testConnection(): Promise<boolean> {
    // This method is no longer used in the updated code
    return true; // Placeholder return, actual implementation needed
  }

  /**
   * Update RPC endpoint
   */
  public updateRpcEndpoint(endpoint: string): void {
    // This method is no longer used in the updated code
  }

  /**
   * Show modal manually (for custom flows)
   */
  public showModal(): void {
    if (!this.modalService.isAvailable()) {
      throw new Error("Modal not initialized. Call init() first.");
    }
    this.modalService.reset();
    this.modalService.show().catch(() => {
      // User cancelled - ignore
    });
  }

  /**
   * Hide modal manually
   */
  public hideModal(): void {
    this.modalService.hide();
  }

  /**
   * Get modal state
   */
  public getModalState() {
    return this.modalService.getState();
  }

  /**
   * Cleanup and destroy the adapter
   */
  public destroy(): void {
    this.modalService.unmount();
  }

  /**
   * Show the modal loading state with a custom message
   */
  public showLoading(message: string = "Processing...") {
    this.modalService.showLoading(message);
  }

  /**
   * Show the modal error state with an Error and optional title
   */
  public showError(error: Error, title?: string) {
    this.modalService.showError(error, title);
  }

  /**
   * Show the modal success state with an ActionResult
   */
  public showSuccess(result: ActionResult) {
    this.modalService.showSuccess(result);
  }

  /**
   * Reset the modal to its initial state
   */
  public resetModal() {
    this.modalService.reset();
  }
}
