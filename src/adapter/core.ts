import { PublicKey } from "@solana/web3.js";
import { ActionCodesService, ModalService, SessionService } from "./services/index";
import { ActioConnectionError, toActioError } from "./errors/index";
import type {
  ActionResult,
  ActionSubmissionOptions,
  ActionContext,
} from "./types/index";
import { type ActionStatus } from "@useactio/sdk";

/**
 * Core class for the Actio Solana Adapter
 *
 * Provides a modular, type-safe interface for handling Action Codes
 * with proper error handling and UI management.
 */
export class ActioCore {
  private readonly actionCodesService: ActionCodesService;
  private readonly modalService: ModalService;
  private readonly sessionService: SessionService;

  constructor() {
    this.actionCodesService = new ActionCodesService();
    this.modalService = new ModalService();
    this.sessionService = new SessionService(this.actionCodesService);
  }

  public getActionCodesService(): ActionCodesService {
    return this.actionCodesService;
  }

  public getModalService(): ModalService {
    return this.modalService;
  }

  public getSessionService(): SessionService {
    return this.sessionService;
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
    // Create action context from options and current origin
    const context = this.createActionContext(options);
    this.modalService.setActionContext(context);

    while (true) {
      try {
        const code = await this.modalService.show();
        return code;
      } catch (error) {
        // If user closed/cancelled, propagate error
        if (
          error instanceof Error &&
          (error.message.includes("Modal closed") ||
            error.message.includes("Action was cancelled"))
        ) {
          this.modalService.hide();
          throw error;
        }
        
        // Show error and allow retry
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
        
        // Wait for retry - just continue the loop
        continue; // This will call show() again in the next iteration
      }
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
  ): Promise<{ publicKey: PublicKey; code: string; metadata: any }> {
    try {
      // Step 1: Validate and fetch action details
      const action = await this.actionCodesService.getAction(code);
      if (!action.intendedFor) {
        throw new ActioConnectionError("Action missing intended recipient");
      }
      const publicKey = new PublicKey(action.intendedFor);

      // Step 2: Validate session wallet matches intendedFor
      const origin = this.getCurrentOrigin();
      const sessionValidation = await this.sessionService.validateSession(origin);
      if (!sessionValidation.isValid || !sessionValidation.publicKey) {
        throw new ActioConnectionError("Session is not valid. Please reconnect your wallet.");
      }
      if (!publicKey.equals(sessionValidation.publicKey)) {
        throw new ActioConnectionError("Something went wrong. Please check your code or try again.");
      }

      return { publicKey, code, metadata: action };
    } catch (error) {
      throw toActioError(error);
    }
  }

  /**
   * Connect wallet with session management
   * First tries to restore from session, then falls back to code entry
   */
  public async connectWallet(options?: ActionSubmissionOptions): Promise<{
    publicKey: PublicKey;
    isNewSession: boolean;
    session?: any;
  }> {
    const origin = this.getCurrentOrigin();

    try {
      // 1. Try to restore from existing session
      const sessionValidation = await this.sessionService.validateSession(origin);
      if (sessionValidation.isValid && sessionValidation.publicKey) {
        return {
          publicKey: sessionValidation.publicKey,
          isNewSession: false,
        };
      }

      // 2. No valid session, create new one via code entry
      // Show modal with connection-specific context
      const connectionContext = this.createConnectionContext(options);
      this.modalService.setActionContext(connectionContext);
      
      const code = await this.modalService.show();
      
      // 3. Show loading while creating session
      this.modalService.showLoading("Waiting for you to approve in your wallet...");
      
      // 4. Create session with the code
      const { session, publicKey } = await this.sessionService.createSession(code, origin);

      // 5. Show success briefly
      this.modalService.showSuccess({
        publicKey,
        code,
        metadata: { type: "connected" },
      });

      return {
        publicKey,
        isNewSession: true,
        session,
      };
    } catch (error) {
      // Reset modal on any error
      this.modalService.reset();
      
      if (error instanceof Error && error.message.includes("Modal closed")) {
        throw error;
      }
      
      // Show error and re-throw
      const actioError = toActioError(error);
      this.modalService.showError(actioError, "Connection Failed");
      throw error;
    }
  }

  /**
   * Disconnect wallet and clear session
   */
  public disconnectWallet(): void {
    this.sessionService.clearSession();
    this.modalService.reset();
  }

  /**
   * Check if wallet is connected (has valid session)
   */
  public async isWalletConnected(): Promise<boolean> {
    const origin = this.getCurrentOrigin();
    return await this.sessionService.hasValidSession(origin);
  }

  /**
   * Get connected wallet public key if available
   */
  public async getConnectedWallet(): Promise<PublicKey | null> {
    const origin = this.getCurrentOrigin();
    const sessionValidation = await this.sessionService.validateSession(origin);
    return sessionValidation.isValid ? sessionValidation.publicKey || null : null;
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
   * Create connection-specific context for wallet connection
   */
  private createConnectionContext(
    options?: ActionSubmissionOptions
  ): ActionContext {
    const origin = this.getCurrentOrigin();
    
    const favicon =
      typeof document !== "undefined"
        ? document.querySelector<HTMLLinkElement>(
            'link[rel="icon"], link[rel="shortcut icon"]'
          )?.href
        : options?.context?.favicon;

    return {
      origin,
      title: options?.context?.title || "Connect Wallet",
      description: options?.context?.description || 
        "Enter your Action code to connect your wallet securely.",
      type: "Wallet Connection",
      favicon,
      metadata: options?.context?.metadata,
    };
  }

  /**
   * Get current origin for session management
   */
  private getCurrentOrigin(): string {
    return typeof window !== "undefined" ? window.location.hostname : "Unknown Origin";
  }

  /**
   * Update loading message based on action status
   */
  public updateLoadingMessage(status: ActionStatus): void {
    const titles: Record<ActionStatus, string> = {
      pending: "Waiting for Action",
      ready: "Action Ready",
      completed: "Done!",
      failed: "Something Went Wrong",
      cancelled: "Action Cancelled",
    };
    const messages: Record<ActionStatus, string> = {
      pending: "Enter your code to continue.",
      ready: "Confirm this in your wallet.",
      completed: "You may now close this window.",
      failed: "Please check your code or try again.",
      cancelled: "This code has expired or was rejected.",
    };
    this.modalService.showLoading(`${titles[status]}\n${messages[status]}`);
  }

  /**
   * Check if the adapter is properly initialized
   */
  public isInitialized(): boolean {
    return this.modalService.isAvailable();
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
