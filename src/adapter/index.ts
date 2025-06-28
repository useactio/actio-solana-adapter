// Main adapter class
export { ActioCore } from "./core";

// Configuration
export { createConfig, DEFAULT_CONFIG, RPC_ENDPOINTS } from "./config/index";
export type { ActioConfig } from "./config/index";

// Types
export type {
  ActionStatus,
  ActionResult,
  ActionError,
  ActionSubmissionOptions,
  ModalState,
  ActionEvents,
} from "./types/index";

// Services (for advanced usage)
export {
  ConnectionService,
  ActionCodesService,
  ModalService,
} from "./services/index";

// Errors
export {
  ActioError,
  ModalNotFoundError,
  InvalidActionCodeError,
  ActionProcessingError,
  NetworkError,
  UserCancelledError,
  ActioConnectionError,
  toActioError,
} from "./errors/index"; 