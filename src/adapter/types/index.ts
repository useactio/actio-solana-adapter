import { PublicKey, Transaction } from "@solana/web3.js";

/**
 * Status of an action processing flow
 */
export type ActionStatus = 
  | "idle"
  | "validating" 
  | "processing"
  | "signing"
  | "submitting"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * Result of a successful action processing
 */
export interface ActionResult {
  /** The public key of the wallet that processed the action */
  publicKey: PublicKey;
  /** Transaction hash if available */
  signature?: string;
  /** The original action code */
  code: string;
  /** Additional metadata from the action */
  metadata?: Record<string, any>;
}

/**
 * Error details for action processing failures
 */
export interface ActionError {
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: string;
  /** Original error object */
  originalError?: Error;
}

/**
 * Action context information for display
 */
export interface ActionContext {
  /** Origin website/domain requesting the action */
  origin: string;
  /** Action description/title */
  title: string;
  /** Detailed description of what user is signing */
  description: string;
  /** Amount if applicable */
  amount?: {
    value: string;
    currency: string;
    formatted: string;
  };
  /** Action type (swap, transfer, vote, etc.) */
  type?: string;
  /** Website favicon URL */
  favicon?: string;
  /** Additional metadata to display */
  metadata?: Record<string, any>;
}

/**
 * Action processing events
 */
export interface ActionEvents {
  "status-change": ActionStatus;
  "progress": { message: string; progress?: number };
  "error": ActionError;
  "success": ActionResult;
}

/**
 * Modal state for UI management
 */
export interface ModalState {
  visible: boolean;
  screen: "input" | "loading" | "error" | "success";
  data?: {
    error?: ActionError;
    result?: ActionResult;
    loadingMessage?: string;
    context?: ActionContext;
  };
}

/**
 * Action submission options
 */
export interface ActionSubmissionOptions {
  /** Custom label for the action */
  label?: string;
  /** Logo URL for the action */
  logo?: string;
  /** Memo text */
  memo?: string;
  /** Message to display to user */
  message?: string;
  /** Whether to only sign without submitting */
  signOnly?: boolean;
  /** Action context for better UX */
  context?: Partial<ActionContext>;
} 