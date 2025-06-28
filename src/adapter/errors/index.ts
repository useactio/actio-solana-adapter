/**
 * Base error class for Actio-related errors
 */
export class ActioError extends Error {
  public readonly code: string;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: string = "ACTIO_ERROR",
    originalError?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.originalError = originalError;

    // Maintain proper stack trace for where our error was thrown (only in V8)
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error for network-related issues (connection, CORS, etc.)
 */
export class NetworkError extends ActioError {
  public readonly networkErrorCode: string;

  constructor(
    message: string,
    originalError?: Error,
    networkErrorCode: string = "NETWORK_ERROR"
  ) {
    super(message, "NETWORK_ERROR", originalError);
    this.networkErrorCode = networkErrorCode;
  }

  /**
   * Check if this is a CORS-related error
   */
  public isCorsError(): boolean {
    return this.networkErrorCode === "CORS_ERROR";
  }

  /**
   * Check if this is a connection error
   */
  public isConnectionError(): boolean {
    return ["CONNECTION_ERROR", "TIMEOUT_ERROR"].includes(
      this.networkErrorCode
    );
  }

  /**
   * Check if this is a server error (5xx)
   */
  public isServerError(): boolean {
    return this.networkErrorCode === "SERVER_ERROR";
  }

  /**
   * Get user-friendly help text based on error type
   */
  public getHelpText(): string {
    switch (this.networkErrorCode) {
      case "CORS_ERROR":
        return "The website you're on needs to be configured to work with Actio. Contact the website administrator.";
      case "CONNECTION_ERROR":
        return "Check your internet connection and try again.";
      case "TIMEOUT_ERROR":
        return "The request is taking too long. Try again with a stable internet connection.";
      case "SERVER_ERROR":
        return "Actio services are experiencing issues. Please try again in a few minutes.";
      case "AUTH_ERROR":
        return "Your action code may have expired. Please generate a new one.";
      case "NOT_FOUND_ERROR":
        return "Double-check your action code and make sure it's entered correctly.";
      default:
        return "If the problem persists, please contact Actio support.";
    }
  }
}

/**
 * Error for invalid action codes
 */
export class InvalidActionCodeError extends ActioError {
  public readonly actionCode: string;

  constructor(actionCode: string, reason: string) {
    super(`Invalid action code: ${reason}`, "INVALID_ACTION_CODE");
    this.actionCode = actionCode;
  }
}

/**
 * Error for wallet connection issues
 */
export class ActioConnectionError extends ActioError {
  constructor(message: string, originalError?: Error) {
    super(message, "CONNECTION_ERROR", originalError);
  }
}

/**
 * Error for action processing issues
 */
export class ActionProcessingError extends ActioError {
  public readonly phase: string;

  constructor(message: string, phase: string, originalError?: Error) {
    super(message, "PROCESSING_ERROR", originalError);
    this.phase = phase;
  }
}

/**
 * Error for configuration issues
 */
export class ConfigurationError extends ActioError {
  constructor(message: string) {
    super(message, "CONFIGURATION_ERROR");
  }
}

/**
 * Convert any error to an ActioError with enhanced messaging
 */
export function toActioError(error: unknown): ActioError {
  if (error instanceof ActioError) {
    return error;
  }

  if (error instanceof Error) {
    // Try to categorize the error
    const message = error.message.toLowerCase();

    if (message.includes("cors") || message.includes("access-control")) {
      return new NetworkError(
        "Unable to connect due to browser security restrictions. The website needs to be configured to work with Actio.",
        error
      );
    }

    if (message.includes("fetch") || message.includes("network")) {
      return new NetworkError(
        "Network connection failed. Please check your internet connection and try again.",
        error
      );
    }

    return new ActioError(error.message, "UNKNOWN_ERROR", error);
  }

  return new ActioError(
    typeof error === "string" ? error : "An unknown error occurred",
    "UNKNOWN_ERROR"
  );
}
