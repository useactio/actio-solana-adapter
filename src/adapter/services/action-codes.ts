import { ActionCodesClient } from "@actioncodes/sdk";
import { PublicKey } from "@solana/web3.js";
import {
  InvalidActionCodeError,
  ActionProcessingError,
  NetworkError,
} from "../errors/index";
import type { ActioConfig } from "../config/index";
import type { ActionSubmissionOptions, ActionStatus } from "../types/index";

/**
 * Service for handling ActionCodes SDK operations
 */
export class ActionCodesService {
  private readonly client: ActionCodesClient;
  private readonly config: ActioConfig;

  constructor(config: ActioConfig) {
    this.config = config;
    this.client = new ActionCodesClient();
  }

  /**
   * Validate and fetch action details
   */
  async getAction(code: string) {
    if (!code?.trim()) {
      throw new InvalidActionCodeError(code, "Code cannot be empty");
    }

    try {
      const action = await this.client.getAction(code);

      if (!action) {
        throw new InvalidActionCodeError(code, "Action not found");
      }

      if (!action.intendedFor) {
        throw new InvalidActionCodeError(
          code,
          "Action missing intended recipient"
        );
      }

      // Validate the intended recipient is a valid public key
      try {
        new PublicKey(action.intendedFor);
      } catch {
        throw new InvalidActionCodeError(code, "Invalid recipient public key");
      }

      return action;
    } catch (error) {
      if (error instanceof InvalidActionCodeError) {
        throw error;
      }
      
      // Enhanced error handling with specific error types
      const enhancedError = this.enhanceNetworkError(error as Error);
      throw enhancedError;
    }
  }

  /**
   * Submit an action with proper status handling
   */
  async submitAction(
    code: string,
    transactionBase64: string,
    options: ActionSubmissionOptions = {}
  ): Promise<AsyncGenerator<ActionStatus, void, unknown>> {
    const submissionOptions = {
      label: options.label || "Actio Wallet Adapter",
      logo: options.logo || "",
      memo: options.memo || "",
      message:
        options.message ||
        "You are about to sign a transaction via Actio Wallet Adapter",
      signOnly: options.signOnly ?? true,
      transactionBase64,
    };

    try {
      const statusIterator = await this.client.submitAction(
        code,
        submissionOptions
      );

      return this.processActionStatuses(statusIterator);
    } catch (error) {
      const enhancedError = this.enhanceNetworkError(error as Error);
      throw new ActionProcessingError(
        "Failed to submit action",
        "SUBMISSION_FAILED",
        enhancedError
      );
    }
  }

  /**
   * Process action status updates with proper typing
   */
  private async *processActionStatuses(
    statusIterator: AsyncIterable<string>
  ): AsyncGenerator<ActionStatus, void, unknown> {
    try {
      for await (const status of statusIterator) {
        // Map ActionCodes statuses to our internal status types
        const mappedStatus = this.mapActionStatus(status);
        yield mappedStatus;

        // If we reach a terminal state, break
        if (mappedStatus === "completed" || mappedStatus === "failed") {
          break;
        }
      }
    } catch (error) {
      const enhancedError = this.enhanceNetworkError(error as Error);
      throw new ActionProcessingError(
        "Action processing failed",
        "PROCESSING_ERROR",
        enhancedError
      );
    }
  }

  /**
   * Map ActionCodes status strings to our typed status
   */
  private mapActionStatus(status: string): ActionStatus {
    switch (status.toLowerCase()) {
      case "pending":
      case "validating":
        return "validating";
      case "processing":
      case "executing":
        return "processing";
      case "signing":
        return "signing";
      case "submitting":
      case "broadcasting":
        return "submitting";
      case "completed":
      case "success":
        return "completed";
      case "failed":
      case "error":
        return "failed";
      default:
        console.warn(`Unknown action status: ${status}`);
        return "processing";
    }
  }

  /**
   * Get the resolved action after completion
   */
  async getResolvedAction(code: string) {
    try {
      return await this.client.getAction(code);
    } catch (error) {
      const enhancedError = this.enhanceNetworkError(error as Error);
      throw new ActionProcessingError(
        "Failed to get resolved action",
        "RESOLUTION_FAILED",
        enhancedError
      );
    }
  }

  /**
   * Enhanced error handling to provide better user messages
   */
  private enhanceNetworkError(error: Error): NetworkError {
    const errorMessage = error.message.toLowerCase();
    
    // CORS Error Detection
    if (
      errorMessage.includes('cors') ||
      errorMessage.includes('access-control-allow-origin') ||
      errorMessage.includes('preflight') ||
      (errorMessage.includes('fetch') && errorMessage.includes('blocked'))
    ) {
             return new NetworkError(
         "Unable to connect to Actio services due to browser security restrictions. This usually happens when the website hasn't been properly configured to work with Actio.",
         error
       );
    }

         // Network/Connection Errors  
     if (
       errorMessage.includes('failed to fetch') ||
       errorMessage.includes('network error') ||
       errorMessage.includes('fetch error')
     ) {
       return new NetworkError(
         "Unable to connect to Actio services. Please check your internet connection and try again.",
         error
       );
     }

     // Timeout Errors
     if (
       errorMessage.includes('timeout') ||
       errorMessage.includes('timed out')
     ) {
       return new NetworkError(
         "Request timed out. The Actio service might be temporarily unavailable. Please try again.",
         error
       );
     }

     // 4xx Client Errors
     if (errorMessage.includes('400') || errorMessage.includes('bad request')) {
       return new NetworkError(
         "Invalid request. Please check your action code and try again.",
         error
       );
     }

     if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
       return new NetworkError(
         "Unauthorized access. Your action code may have expired or be invalid.",
         error
       );
     }

     if (errorMessage.includes('404') || errorMessage.includes('not found')) {
       return new NetworkError(
         "Action not found. Please check your action code and try again.",
         error
       );
     }

     // 5xx Server Errors
     if (
       errorMessage.includes('500') ||
       errorMessage.includes('502') ||
       errorMessage.includes('503') ||
       errorMessage.includes('504') ||
       errorMessage.includes('server error') ||
       errorMessage.includes('internal server error') ||
       errorMessage.includes('service unavailable')
     ) {
       return new NetworkError(
         "Actio services are temporarily unavailable. Please try again in a few moments.",
         error
       );
     }

     // Generic network error
     return new NetworkError(
       "Unable to connect to Actio services. Please check your internet connection and try again.",
       error
     );
  }
}
