# Actio Solana Adapter - Core Module

This directory contains the refactored, modular core implementation of the Actio Solana Adapter.

## 🏗️ **Architecture Overview**

The core module has been completely refactored for better **modularity**, **type safety**, and **maintainability**:

```
src/adapter/
├── config/           # Configuration management
│   └── index.ts      # Config types, defaults, and factory
├── errors/           # Custom error classes
│   └── index.ts      # Typed error hierarchy
├── services/         # Modular services
│   ├── connection.ts # Solana RPC connection management
│   ├── action-codes.ts # ActionCodes SDK wrapper
│   ├── modal.ts      # UI modal management
│   └── index.ts      # Service exports
├── types/            # Type definitions
│   └── index.ts      # Core types and interfaces
├── core.ts          # Main ActioCore class
└── index.ts         # Module exports
```

## 🔧 **Core Components**

### **ActioCore (Main Class)**

The main entry point with a clean, powerful API:

```typescript
import { ActioCore } from './src/adapter';

// Initialize with custom config
const actio = new ActioCore({
  network: 'devnet',
  rpcEndpoint: 'https://api.devnet.solana.com',
  ui: {
    autoMount: true,
    container: '#wallet-modal'
  }
});

// Initialize the adapter
actio.init();

// Open modal and process action
try {
  const publicKey = await actio.openModal({
    label: 'My Custom Action',
    message: 'Sign this transaction to continue'
  });
  console.log('Connected:', publicKey.toString());
} catch (error) {
  console.error('Action failed:', error);
}
```

### **Configuration System**

Flexible, type-safe configuration:

```typescript
import { createConfig, ActioConfig } from './src/adapter';

// Use defaults
const config = createConfig();

// Custom configuration
const config = createConfig({
  network: 'devnet',
  rpcEndpoint: 'https://api.devnet.solana.com',
  ui: {
    autoMount: false,
    container: '#my-modal-container'
  },
  actionCodes: {
    baseUrl: 'https://api.actioncodes.com',
    apiKey: 'your-api-key'
  }
});
```

### **Service Architecture**

#### **ConnectionService**
Manages Solana RPC connections with error handling:

```typescript
import { ConnectionService } from './src/adapter';

const connectionService = new ConnectionService(config);

// Get network info
const info = await connectionService.getNetworkInfo();

// Test connection health
const isHealthy = await connectionService.testConnection();

// Prepare transactions
const tx = await connectionService.prepareTransaction(publicKey);
```

#### **ActionCodesService**
Handles ActionCodes SDK interactions with proper typing:

```typescript
import { ActionCodesService } from './src/adapter';

const actionService = new ActionCodesService(config);

// Validate and get action
const action = await actionService.getAction(code);

// Submit action with status tracking
const statusIterator = await actionService.submitAction(code, txBase64, {
  label: 'Custom Action',
  signOnly: true
});

for await (const status of statusIterator) {
  console.log('Status:', status); // 'validating' | 'processing' | 'signing' etc.
}
```

#### **ModalService**
Manages UI interactions with the new modular components:

```typescript
import { ModalService } from './src/adapter';

const modalService = new ModalService(config);

// Show modal and get user input
const code = await modalService.show();

// Update modal state
modalService.showLoading('Processing...');
modalService.showError(errorDetails);
modalService.showSuccess(result);
```

## 🎯 **Key Improvements**

### **1. Type Safety**
- Comprehensive TypeScript interfaces
- Strongly-typed event system
- Proper error type hierarchy

### **2. Error Handling**
- Custom error classes for different failure modes
- Proper error propagation and conversion
- User-friendly error messages

### **3. Configurability**
- Network-specific defaults
- Customizable UI behavior
- Flexible RPC endpoint management

### **4. Separation of Concerns**
- Each service has a single responsibility
- Clean interfaces between components
- Easy to test and maintain

### **5. Developer Experience**
- Rich documentation and examples
- Intuitive API design
- Better debugging capabilities

## 📚 **Usage Examples**

### **Basic Integration**

```typescript
import { ActioCore } from './src/adapter';

const actio = new ActioCore();
actio.init(); // Modal is mounted but stays hidden

// Modal only opens when explicitly requested for connection
const publicKey = await actio.openModal();
```

### **Advanced Configuration**

```typescript
import { ActioCore, createConfig } from './src/adapter';

const actio = new ActioCore({
  network: 'devnet',
  ui: { autoMount: false },
  rpcEndpoint: 'https://custom-rpc.com'
});

actio.init(); // Modal stays hidden until needed

// Show modal for user interaction (opens modal)
actio.showModal();

// Programmatic action processing (no modal - headless)
const result = await actio.processAction('action_code_123', {
  label: 'Swap Tokens',
  message: 'Approve this token swap'
});

// Process action with full UI flow (opens modal with loading states)
const publicKey = await actio.openModal({
  label: 'Connect Wallet',
  message: 'Connect your wallet to continue'
});
```

### **Error Handling**

```typescript
import { 
  ActioCore, 
  InvalidActionCodeError, 
  NetworkError,
  UserCancelledError 
} from './src/adapter';

try {
  const publicKey = await actio.openModal();
} catch (error) {
  if (error instanceof InvalidActionCodeError) {
    console.error('Invalid code:', error.message);
  } else if (error instanceof NetworkError) {
    console.error('Network issue:', error.message);
  } else if (error instanceof UserCancelledError) {
    console.log('User cancelled the action');
  }
}
```

### **Service Usage**

```typescript
import { 
  ConnectionService, 
  ActionCodesService,
  ModalService,
  createConfig 
} from './src/adapter';

const config = createConfig({ network: 'devnet' });

// Use services individually
const connection = new ConnectionService(config);
const actionCodes = new ActionCodesService(config);
const modal = new ModalService(config);

// Custom flow
modal.init();
const code = await modal.show();
const action = await actionCodes.getAction(code);
const tx = await connection.prepareTransaction(new PublicKey(action.intendedFor));
```

### **After (Modular)**
```typescript
const actio = new ActioCore();
actio.init(); // Modal mounted but hidden by default

// Modal only opens when explicitly requested
const publicKey = await actio.openModal(); // Shows modal

// Or programmatic processing without UI
const result = await actio.processAction(code); // No modal shown
```

## 🎨 **Benefits**

- **🔧 Maintainable**: Clear separation of concerns
- **🛡️ Type Safe**: Full TypeScript support
- **⚡ Performant**: Optimized service architecture  
- **🎯 Flexible**: Highly configurable
- **🚀 Developer Friendly**: Rich API and documentation
- **🔍 Debuggable**: Better error handling and logging
