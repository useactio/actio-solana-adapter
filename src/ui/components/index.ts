// Core UI components
export * from "./layout";
export * from "./input-screen";
export * from "./loading-screen";
export * from "./error-screen";
export * from "./success-screen";

// Types and interfaces
export type ModalScreen = "input" | "loading" | "error" | "success";

export interface CodeSubmitEvent extends CustomEvent {
  detail: { code: string };
}

export interface ModalCloseEvent extends CustomEvent {
  detail: { reason: string };
}

export interface RetryEvent extends CustomEvent {
  detail: {
    screen: ModalScreen;
  };
}
