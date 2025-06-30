import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { ActionCodesService } from "./action-codes";
import { ActioConnectionError } from "../errors/index";
import {
  validateActionCodesMemoTransaction,
  getActioMemo,
} from "@useactio/sdk";

/**
 * Session data structure for storing authenticated wallet sessions
 */
export interface ActioSession {
  /** The signed authentication transaction (base64 encoded) */
  signedTxBase64: string;
  /** When the session expires (ISO timestamp) */
  expiresAt: string;
  /** The origin that created this session */
  origin: string;
}

/**
 * Session validation result
 */
export interface SessionValidationResult {
  /** Whether the session is valid */
  isValid: boolean;
  /** The recovered public key if valid */
  publicKey?: PublicKey;
  /** Error message if invalid */
  error?: string;
}

/**
 * Service for managing secure wallet sessions using signed transactions
 */
export class SessionService {
  private readonly actionCodesService: ActionCodesService;
  private readonly storageKey = "actio_wallet_session";
  private readonly sessionDurationMs = 24 * 60 * 60 * 1000; // 24 hours

  constructor(actionCodesService: ActionCodesService) {
    this.actionCodesService = actionCodesService;
  }

  /**
   * Create a new session by generating and signing an auth transaction
   */
  async createSession(
    code: string,
    origin: string
  ): Promise<{ session: ActioSession; publicKey: PublicKey }> {
    try {
      console.log("Creating session for code:", code, "origin:", origin);

      // 1. Validate the action code and get the public key
      const action = await this.actionCodesService.getAction(code);
      if (!action.intendedFor) {
        throw new ActioConnectionError("Action missing intended recipient");
      }
      const publicKey = new PublicKey(action.intendedFor);
      console.log("Session public key:", publicKey.toString());

      // 2. Create a valid transaction with dummy blockhash
      const authTx = new Transaction();

      // Use a dummy blockhash since we won't broadcast this transaction
      authTx.recentBlockhash = "11111111111111111111111111111111";
      authTx.feePayer = publicKey;

      // 3. Submit the auth transaction for signing
      const { status, result } = await this.actionCodesService.submitAction(
        code,
        {
          label: "Use Actio",
          logo: "",
          memo: "",
          message: "Use Actio to connect your wallet",
          signOnly: true,
          transactionBase64: this.arrayBufferToBase64(
            authTx.serialize({ verifySignatures: false })
          ),
        }
      );

      if (status !== "completed" || !result) {
        throw new ActioConnectionError("Failed to create session");
      }

      // 4. Store session
      const session: ActioSession = {
        signedTxBase64: result,
        expiresAt: new Date(Date.now() + this.sessionDurationMs).toISOString(),
        origin,
      };

      this.storeSession(session);
      console.log("Session stored successfully");
      return { session, publicKey };
    } catch (error) {
      console.error("Failed to create session:", error);
      throw new ActioConnectionError(
        `Failed to create session: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validate and restore a session
   */
  async validateSession(origin: string): Promise<SessionValidationResult> {
    try {
      console.log("Validating session for origin:", origin);

      // 1. Get stored session
      const session = this.getStoredSession();
      if (!session) {
        console.log("No session found in localStorage");
        return { isValid: false, error: "No session found" };
      }
      console.log("Found session:", session);

      // 2. Check expiration
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);
      console.log("Session expires at:", expiresAt, "Current time:", now);

      if (expiresAt < now) {
        console.log("Session expired, clearing");
        this.clearSession();
        return { isValid: false, error: "Session expired" };
      }

      // 3. Check origin
      console.log("Session origin:", session.origin, "Current origin:", origin);
      if (session.origin !== origin) {
        console.log("Origin mismatch, clearing session");
        this.clearSession();
        return { isValid: false, error: "Session origin mismatch" };
      }

      // 4. Validate transaction using SDK (same as signTransaction validation)
      console.log("Validating transaction...");
      const signedTxBuffer = this.base64ToArrayBuffer(session.signedTxBase64);

      let signedTx: Transaction | VersionedTransaction;
      try {
        signedTx = Transaction.from(signedTxBuffer);
        console.log("Transaction deserialized as Transaction");
      } catch {
        try {
          signedTx = VersionedTransaction.deserialize(signedTxBuffer);
          console.log("Transaction deserialized as VersionedTransaction");
        } catch (error) {
          console.error("Failed to deserialize transaction:", error);
          return { isValid: false, error: "Invalid transaction format" };
        }
      }

      // 5. Extract public key from memo (same as signTransaction)
      console.log("Extracting memo...");
      const actioMemo = getActioMemo(signedTx);
      if (!actioMemo) {
        console.log("No memo found in transaction");
        return { isValid: false, error: "No memo found" };
      }
      console.log("Memo text:", actioMemo);

      if (!actioMemo) {
        console.log("Failed to parse memo");
        return { isValid: false, error: "Invalid memo format" };
      }
      console.log("Parsed memo:", actioMemo);

      // 6. Use SDK to validate (same validation as signTransaction)
      console.log("Running SDK validation...");
      const isValid = await validateActionCodesMemoTransaction(signedTx);
      console.log("SDK validation result:", isValid);

      if (!isValid) {
        console.log("SDK validation failed, clearing session");
        this.clearSession();
        return { isValid: false, error: "Invalid transaction" };
      }

      const publicKey = new PublicKey(actioMemo.parsed.int);
      console.log("Extracted public key:", publicKey.toString());
      return { isValid: true, publicKey };
    } catch (error) {
      console.error("Session validation error:", error);
      this.clearSession();
      return {
        isValid: false,
        error: `Session validation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Clear the session
   */
  clearSession(): void {
    console.log("Clearing session from localStorage");
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Check if session is valid
   */
  async hasValidSession(origin: string): Promise<boolean> {
    const result = await this.validateSession(origin);
    console.log("hasValidSession result:", result);
    return result.isValid;
  }

  /**
   * Convert Uint8Array to base64 (same as signTransaction)
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 to Uint8Array (same as signTransaction)
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Store session
   */
  private storeSession(session: ActioSession): void {
    console.log("Storing session:", session);
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(this.storageKey, JSON.stringify(session));
    }
  }

  /**
   * Get stored session
   */
  private getStoredSession(): ActioSession | null {
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = localStorage.getItem(this.storageKey);
      console.log("Raw stored session:", stored);
      if (stored) {
        try {
          return JSON.parse(stored) as ActioSession;
        } catch (error) {
          console.error("Failed to parse stored session:", error);
          localStorage.removeItem(this.storageKey);
        }
      }
    }
    return null;
  }
}
