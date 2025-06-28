import { PublicKey } from "@solana/web3.js";
import { createConfig, type ActioConfig } from "./config/index";
import {
  ConnectionService,
  ActionCodesService,
  ModalService,
} from "./services/index";
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
  private readonly connectionService: ConnectionService;
  private readonly actionCodesService: ActionCodesService;
  private readonly modalService: ModalService;

  constructor(userConfig: Partial<ActioConfig> = {}) {
    this.config = createConfig(userConfig);
    this.connectionService = new ConnectionService(this.config);
    this.actionCodesService = new ActionCodesService(this.config);
    this.modalService = new ModalService();
  }

  public getConnectionService(): ConnectionService {
    return this.connectionService;
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
   * Open the modal and process an action code
   * Returns the public key of the wallet that processed the action
   */
  public async openModal(
    options?: ActionSubmissionOptions
  ): Promise<PublicKey> {
    try {
      // Create action context from options and current origin
      const context = this.createActionContext(options);

      // Set action context and show modal to get code from user
      this.modalService.setActionContext(context);
      const code = await this.modalService.show();

      // Process the action with UI updates
      const result = await this.processActionWithUI(code, options);

      if (result && result.publicKey) {
        this.modalService.showSuccess(result);
        return result.publicKey;
      } else {
        throw new Error("No result to show success for.");
      }
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
   * Process an action code programmatically (without modal UI)
   */
  public async processAction(
    code: string,
    options?: ActionSubmissionOptions
  ): Promise<ActionResult> {
    try {
      // Step 1: Validate and fetch action details
      const action = await this.actionCodesService.getAction(code);

      if (!action.intendedFor) {
        throw new ActioConnectionError("Action missing intended recipient");
      }

      const publicKey = new PublicKey(action.intendedFor);

      // Step 2: Prepare transaction
      const transaction = await this.connectionService.prepareTransaction(
        publicKey
      );

      // Step 3: Submit action and process statuses
      const transactionBase64 = transaction
        .serialize({ verifySignatures: false })
        .toString("base64");

      const statusIterator = await this.actionCodesService.submitAction(
        code,
        transactionBase64,
        options
      );

      // Step 4: Process status updates
      let signature: string | undefined;
      for await (const status of statusIterator) {
        if (status === "cancelled") {
          // Handle cancellation immediately - don't process any more statuses
          throw new ActioConnectionError("Action was cancelled");
        } else if (status === "failed") {
          throw new ActioConnectionError("Action processing failed");
        } else if (status === "completed") {
          // Get resolved action for final details
          const resolved = await this.actionCodesService.getResolvedAction(
            code
          );
          // Extract signature if available from resolved action
          signature = (resolved as any).signature || (resolved as any).txHash;
          break;
        }
      }

      return {
        publicKey,
        signature,
        code,
        metadata: action,
      };
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
   * Process an action code with UI updates (used by openModal)
   */
  private async processActionWithUI(
    code: string,
    options?: ActionSubmissionOptions
  ): Promise<ActionResult> {
    try {
      // Step 1: Validate and fetch action details
      this.modalService.showLoading("Validating action code...");
      const action = await this.actionCodesService.getAction(code);

      if (!action.intendedFor) {
        throw new ActioConnectionError("Action missing intended recipient");
      }

      const publicKey = new PublicKey(action.intendedFor);

      // Step 2: Prepare transaction
      this.modalService.showLoading("Preparing transaction...");
      const transaction = await this.connectionService.prepareTransaction(
        publicKey
      );

      // Step 3: Submit action and process statuses
      this.modalService.showLoading("Processing action...");
      const transactionBase64 = transaction
        .serialize({ verifySignatures: false })
        .toString("base64");

      const statusIterator = await this.actionCodesService.submitAction(
        code,
        transactionBase64,
        options
      );

      // Step 4: Process status updates with UI
      let signature: string | undefined;
      let completed = false;
      for await (const status of statusIterator) {
        console.log("Processing status:", status);
        this.updateLoadingMessage(status);

        if (status === "cancelled") {
          console.log("Action cancelled - throwing error");
          this.modalService.hide();
          throw new ActioConnectionError("Action was cancelled");
        } else if (status === "failed") {
          throw new ActioConnectionError("Action processing failed");
        } else if (status === "completed") {
          const resolved = await this.actionCodesService.getResolvedAction(
            code
          );
          signature = (resolved as any).signature || (resolved as any).txHash;
          completed = true;
          break;
        } else {
          // Defensive: log and continue for unknown statuses
          console.warn("Unknown action status:", status);
        }
      }

      // Defensive: Only return if completed
      if (completed) {
        return {
          publicKey,
          signature,
          code,
          metadata: action,
        };
      } else {
        throw new ActioConnectionError("Action did not complete successfully.");
      }
    } catch (error) {
      // Enhanced error handling - show user-friendly error in modal
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
   * Update loading message based on action status
   */
  private updateLoadingMessage(status: ActionStatus): void {
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
    return this.connectionService.getNetworkInfo();
  }

  /**
   * Test network connection
   */
  public async testConnection(): Promise<boolean> {
    return this.connectionService.testConnection();
  }

  /**
   * Update RPC endpoint
   */
  public updateRpcEndpoint(endpoint: string): void {
    this.connectionService.updateEndpoint(endpoint);
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
}
