import {
  ActionCodesClient,
  type ActionPayload,
  type ActionStatus,
} from "@useactio/sdk";
import { PublicKey } from "@solana/web3.js";
import {
  InvalidActionCodeError,
  ActionProcessingError,
  NetworkError,
} from "../errors/index";

/**
 * Service for handling ActionCodes SDK operations
 */
export class ActionCodesService {
  private readonly client: ActionCodesClient;

  constructor() {
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
   * Submit an action and wait for its result in a single call
   */
  async submitAction(
    code: string,
    payload: ActionPayload,
    timeoutMs?: number
  ): Promise<{ status: ActionStatus; result: any; rawTask: any }> {
    try {
      // Submit the action and wait for its result in a single call
      const task = await this.client.submitAndWait(code, payload, timeoutMs);
      // Return both the status and the relevant result
      return {
        status: task.status,
        result: task.result?.txSignature || task.result?.signedTxBase64 || null,
        rawTask: task,
      };
    } catch (error: any) {
      if (error.name === "TaskTimeoutError") {
        throw new ActionProcessingError(
          "Task did not complete in time",
          "TASK_TIMEOUT",
          error
        );
      }
      if (error.name === "TaskNotFoundError") {
        throw new ActionProcessingError(
          "Task not found",
          "TASK_NOT_FOUND",
          error
        );
      }
      const enhancedError = this.enhanceNetworkError(error as Error);
      throw new ActionProcessingError(
        "Failed to submit action",
        "SUBMISSION_FAILED",
        enhancedError
      );
    }
  }

  /**
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
      errorMessage.includes("cors") ||
      errorMessage.includes("access-control-allow-origin") ||
      errorMessage.includes("preflight") ||
      (errorMessage.includes("fetch") && errorMessage.includes("blocked"))
    ) {
      return new NetworkError(
        "Unable to connect to Actio services due to browser security restrictions. This usually happens when the website hasn't been properly configured to work with Actio.",
        error
      );
    }

    // Network/Connection Errors
    if (
      errorMessage.includes("failed to fetch") ||
      errorMessage.includes("network error") ||
      errorMessage.includes("fetch error")
    ) {
      return new NetworkError(
        "Unable to connect to Actio services. Please check your internet connection and try again.",
        error
      );
    }

    // Timeout Errors
    if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("timed out")
    ) {
      return new NetworkError(
        "Request timed out. The Actio service might be temporarily unavailable. Please try again.",
        error
      );
    }

    // 4xx Client Errors
    if (errorMessage.includes("400") || errorMessage.includes("bad request")) {
      return new NetworkError(
        "Invalid request. Please check your action code and try again.",
        error
      );
    }

    if (errorMessage.includes("401") || errorMessage.includes("unauthorized")) {
      return new NetworkError(
        "Unauthorized access. Your action code may have expired or be invalid.",
        error
      );
    }

    if (errorMessage.includes("404") || errorMessage.includes("not found")) {
      return new NetworkError(
        "Action not found. Please check your action code and try again.",
        error
      );
    }

    // 5xx Server Errors
    if (
      errorMessage.includes("500") ||
      errorMessage.includes("502") ||
      errorMessage.includes("503") ||
      errorMessage.includes("504") ||
      errorMessage.includes("server error") ||
      errorMessage.includes("internal server error") ||
      errorMessage.includes("service unavailable")
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
