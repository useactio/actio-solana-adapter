# Actio UI Components

This directory contains the modular UI components for the Actio Solana Adapter.

## Structure

```
src/ui/
├── components/           # Modular screen components
│   ├── input-screen.ts   # Rich context input screen
│   ├── loading-screen.ts # Loading/processing screen
│   ├── error-screen.ts   # Error display screen
│   ├── success-screen.ts # Success confirmation screen
│   └── index.ts         # Component exports and types
├── styles/              # Shared styles
│   ├── modal.ts         # Modern modal container styles
│   └── theme.ts         # Base theme and typography
├── assets/              # Static assets
│   └── logo-black-lime.svg
├── actio.ts            # Main modal component
└── index.ts            # Main UI exports
```

## Components

### ActioModal (Main Component)

The main modal wrapper that manages different screen states. **Modal is hidden by default** and only shows when explicitly requested.

```typescript
import { ActioModal } from './src/ui';

// Basic usage - modal starts hidden
const modal = document.createElement('actio-modal');
document.body.appendChild(modal);

// API methods
modal.setVisible(true);           // Show modal
modal.setVisible(false);          // Hide modal
modal.setScreen('loading');       // Change screen

// Set rich action context
modal.setActionContext({
  origin: 'app.uniswap.org',
  title: 'Swap Tokens',
  description: 'Swap 100 USDC for ETH on Uniswap',
  type: 'DeFi Swap',
  amount: {
    value: '100',
    currency: 'USDC',
    formatted: '100.00 USDC'
  },
  favicon: 'https://app.uniswap.org/favicon.ico'
});

modal.showLoading('Processing...'); // Show loading (makes modal visible)
modal.showError('Failed', 'Error message', 'Error details');
modal.showSuccess('Success!', 'Transaction completed', 'tx_hash_123');
modal.reset();                    // Reset to input screen
```

### Screen Components

Each screen is a separate, reusable component:

#### ActioInputScreen ⭐ **Enhanced!**
- **Rich Context Display**: Shows website origin, favicon, action details
- **Professional Design**: Inspired by modern payment interfaces
- **Amount Display**: Shows transaction amounts when applicable
- **Smart Defaults**: Auto-detects website origin and favicon
- **Responsive**: Looks great on all screen sizes
- Properties: `onSubmit` callback, `context` (ActionContext)

#### ActioLoadingScreen  
- Shows animated spinner and loading message
- Properties: `message` (string)

#### ActioErrorScreen
- Displays error information with retry/close options
- Properties: `title`, `message`, `error`, `onRetry`, `onClose`

#### ActioSuccessScreen
- Shows success message and transaction details
- Properties: `title`, `message`, `txHash`, `onClose`, `onViewTransaction`

## Action Context

The new **ActionContext** interface enables rich, informative displays:

```typescript
interface ActionContext {
  origin: string;        // Website requesting the action
  title: string;         // Action title (e.g., "Swap Tokens")
  description: string;   // What user is signing
  amount?: {             // Transaction amount if applicable
    value: string;
    currency: string;
    formatted: string;
  };
  type?: string;         // Action type (e.g., "DeFi", "NFT", "Transfer")
  favicon?: string;      // Website favicon URL
  metadata?: any;        // Additional context
}
```

## Events

### code-submit
Fired when user submits a code in the input screen.
```typescript
modal.addEventListener('code-submit', (event) => {
  console.log('Code:', event.detail.code);
});
```

### modal-close
Fired when modal should be closed.
```typescript
modal.addEventListener('modal-close', (event) => {
  console.log('Close reason:', event.detail.reason);
});
```

## Modal Behavior

### 🎯 **Key Principle: Hidden by Default**

- Modal starts **hidden** when created
- Only shows when explicitly requested
- Perfect for non-intrusive user experience

### **When Modal Shows:**

1. **User Connection**: `actio.openModal()` - Shows rich input screen
2. **Processing States**: `modal.showLoading()`, `modal.showError()`, `modal.showSuccess()` 
3. **Manual Control**: `modal.setVisible(true)`

### **When Modal Stays Hidden:**

1. **Initialization**: `actio.init()` - Just mounts, doesn't show
2. **Programmatic Actions**: `actio.processAction()` - Headless processing
3. **Background Operations**: Network checks, config updates

## Styling

- `theme.ts`: Base typography and component styles
- `modal.ts`: Modern modal container with backdrop blur and animations
- Each component has its own scoped styles using Lit's CSS system
- **Dark mode support** included
- **Responsive design** for all screen sizes

## Usage Examples

### Rich Action Context
```typescript
import { ActioModal } from './src/ui';

const modal = new ActioModal();
document.body.appendChild(modal);

// Set rich context for better UX
modal.setActionContext({
  origin: 'app.opensea.io',
  title: 'Purchase NFT',
  description: 'Buy "Cool Cat #1234" from the Cool Cats collection',
  type: 'NFT Purchase',
  amount: {
    value: '2.5',
    currency: 'ETH',
    formatted: '2.5 ETH'
  },
  favicon: 'https://opensea.io/favicon.ico',
  metadata: {
    collection: 'Cool Cats',
    tokenId: '1234'
  }
});

// Show modal - user sees rich context
modal.setVisible(true);
```

### Complete Action Flow
```typescript
import { ActioModal } from './src/ui';

const modal = new ActioModal();
document.body.appendChild(modal);
// Modal is hidden at this point

// Listen for code submission
modal.addEventListener('code-submit', async (event) => {
  const code = event.detail.code;
  
  // Show loading (modal becomes visible)
  modal.showLoading('Processing your swap...');
  
  try {
    // Process the code
    const result = await processSwap(code);
    
    // Show success (modal stays visible)
    modal.showSuccess(
      'Swap Completed!', 
      'Your tokens have been swapped successfully',
      result.txHash
    );
  } catch (error) {
    // Show error (modal stays visible)
    modal.showError(
      'Swap Failed',
      'The token swap could not be completed',
      error.message
    );
  }
});

// Listen for modal close
modal.addEventListener('modal-close', () => {
  modal.setVisible(false); // Hide modal
});

// Rich context when showing modal
modal.setActionContext({
  origin: 'app.uniswap.org',
  title: 'Swap 100 USDC → ETH',
  description: 'Exchange 100 USDC for approximately 0.05 ETH',
  type: 'Token Swap',
  amount: { value: '100', currency: 'USDC', formatted: '100.00 USDC' }
});

// Now modal appears with rich context
modal.setVisible(true);
```

### Using Individual Components
```typescript
import { ActioInputScreen } from './src/ui/components';

const inputScreen = new ActioInputScreen();
inputScreen.context = {
  origin: 'dapp.example.com',
  title: 'Sign Transaction',
  description: 'Authorize this blockchain transaction'
};
inputScreen.onSubmit = (code) => {
  console.log('Submitted code:', code);
};
```

### Auto-Detection Integration
```typescript
// Modal automatically detects website context
const modal = document.createElement('actio-modal');
document.body.appendChild(modal);

// Context is auto-populated from current page
// - origin: extracted from window.location.hostname
// - favicon: detected from <link rel="icon">
// - title/description: from options or defaults

modal.setVisible(true); // Shows with auto-detected context
```

## Customization

You can extend or customize any component by importing the base classes:

```typescript
import { ActioInputScreen } from './src/ui/components';

class CustomInputScreen extends ActioInputScreen {
  render() {
    return html`
      <div class="custom-wrapper">
        ${super.render()}
        <div class="custom-footer">
          <p>Custom additional information</p>
        </div>
      </div>
    `;
  }
}
```

## 🎨 **New Design Features**

- **🏢 Origin Display**: Shows website/app requesting the action
- **🎯 Rich Context**: Action title, description, and metadata
- **💰 Amount Display**: Prominent amount/currency display
- **🖼️ Favicon Support**: Shows website favicon for brand recognition
- **📱 Mobile Optimized**: Responsive design for all devices
- **🌙 Dark Mode**: Automatic dark mode support
- **✨ Modern Animations**: Smooth, professional transitions
- **🔒 Security Focus**: Clear indication of what user is signing

## 🎨 **Benefits of Rich Context**

- **🚫 Non-Intrusive**: No unexpected popups
- **🎯 User-Controlled**: Modal only appears when requested  
- **⚡ Performance**: No unnecessary rendering
- **📱 Mobile Friendly**: Better UX on small screens
- **🔧 Developer Friendly**: Clear control over when UI appears
- **🎨 Professional**: Modern payment-interface inspired design
- **🔍 Transparent**: Users know exactly what they're signing
- **🛡️ Secure**: Clear origin and action context