/**
 * Configuration for the Actio Solana Adapter
 */
export interface ActioConfig {
  /** Solana RPC endpoint URL */
  rpcEndpoint: string;
  /** ActionCodes API configuration */
  actionCodes: {
    /** Base URL for ActionCodes API (optional, uses default if not provided) */
    baseUrl?: string;
    /** API key for ActionCodes (optional) */
    apiKey?: string;
  };
  /** UI configuration */
  ui: {
    /** Whether to auto-mount the modal on init */
    autoMount: boolean;
    /** Custom modal container selector (optional) */
    container?: string;
  };
  /** Network configuration */
  network: "mainnet-beta" | "devnet" | "testnet" | "localnet";
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: ActioConfig = {
  rpcEndpoint: "https://sparkling-methodical-uranium.solana-mainnet.quiknode.pro/e480f20642656f69959ce95a15d4094af9d91d2a/",
  actionCodes: {},
  ui: {
    autoMount: true,
  },
  network: "mainnet-beta",
};

/**
 * RPC endpoints for different networks
 */
export const RPC_ENDPOINTS = {
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  "devnet": "https://api.devnet.solana.com", 
  "testnet": "https://api.testnet.solana.com",
  "localnet": "http://localhost:8899",
} as const;

/**
 * Create a configuration object with defaults
 */
export function createConfig(userConfig: Partial<ActioConfig> = {}): ActioConfig {
  const config: ActioConfig = {
    ...DEFAULT_CONFIG,
    ...userConfig,
    actionCodes: {
      ...DEFAULT_CONFIG.actionCodes,
      ...userConfig.actionCodes,
    },
    ui: {
      ...DEFAULT_CONFIG.ui,
      ...userConfig.ui,
    },
  };

  // Use network-specific RPC endpoint if not explicitly provided
  if (!userConfig.rpcEndpoint && userConfig.network) {
    config.rpcEndpoint = RPC_ENDPOINTS[userConfig.network];
  }

  return config;
} 