import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import type { Commitment } from "@solana/web3.js";
import { NetworkError } from "../errors/index";
import type { ActioConfig } from "../config/index";

/**
 * Service for managing Solana RPC connections
 */
export class ConnectionService {
  private connection: Connection;
  private readonly config: ActioConfig;

  constructor(config: ActioConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcEndpoint, "confirmed");
  }

  /**
   * Get the current connection instance
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Update the RPC endpoint and create a new connection
   */
  updateEndpoint(endpoint: string): void {
    this.connection = new Connection(endpoint, "confirmed");
  }

  /**
   * Get the latest blockhash with error handling
   */
  async getLatestBlockhash(commitment: Commitment = "confirmed") {
    try {
      return await this.connection.getLatestBlockhash(commitment);
    } catch (error) {
      throw new NetworkError("Failed to get latest blockhash", error as Error);
    }
  }

  /**
   * Validate that a public key exists on the network
   */
  async validatePublicKey(publicKey: PublicKey): Promise<boolean> {
    try {
      const accountInfo = await this.connection.getAccountInfo(publicKey);
      return accountInfo !== null;
    } catch (error) {
      // If we can't fetch account info, assume the key is invalid
      return false;
    }
  }

  /**
   * Prepare a transaction with recent blockhash and fee payer
   */
  async prepareTransaction(feePayer: PublicKey): Promise<Transaction> {
    try {
      const transaction = new Transaction();
      const { blockhash } = await this.getLatestBlockhash();

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = feePayer;

      return transaction;
    } catch (error) {
      throw new NetworkError("Failed to prepare transaction", error as Error);
    }
  }

  /**
   * Get network status and basic info
   */
  async getNetworkInfo() {
    try {
      const [slot, version, supply] = await Promise.all([
        this.connection.getSlot(),
        this.connection.getVersion(),
        this.connection.getSupply(),
      ]);

      return {
        slot,
        version: version["solana-core"],
        totalSupply: supply.value.total,
        network: this.config.network,
        endpoint: this.config.rpcEndpoint,
      };
    } catch (error) {
      throw new NetworkError("Failed to get network info", error as Error);
    }
  }

  /**
   * Test the connection health
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.connection.getSlot();
      return true;
    } catch {
      return false;
    }
  }
}
