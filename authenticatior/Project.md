# Authenticator Pro - Project Architecture

This document describes the structure and the purpose of the files and directories in the Authenticator Pro project.

## Project Structure Overview

The project is built using Pure HTML, CSS, and Vanilla JavaScript (ES6 Modules) to fully comply with Google Chrome Extension Manifest V3. No external build tools (like Webpack or Vite) are required.

```text
authenticatior/
├── manifest.json              # Extension metadata and permissions
├── popup.html                 # The main user interface of the extension
├── CHROME_STORE_LISTING.md    # Chrome Web Store listing, Privacy Policy & T&C
├── css/
│   └── style.css              # All UI styling, custom variables, and responsive layouts
├── icons/
│   ├── icon16.png             # Extension icon (16x16)
│   ├── icon48.png             # Extension icon (48x48)
│   └── icon128.png            # Extension icon (128x128)
├── js/
│   ├── background.js          # Service worker for handling background tasks and session cleanup
│   ├── popup.js               # Main UI logic, event delegation, UI state management, and rendering
│   ├── accounts/
│   │   └── logic.js           # Utilities for matching issuer names to their respective brand logos
│   ├── i18n/
│   │   └── i18n.js            # Internationalization logic and translation dictionary (English & Vietnamese)
│   └── storage/
│       ├── crypto.js          # Web Crypto API wrapper for AES-GCM encryption/decryption
│       └── storage.js         # Wrapper for Chrome Storage API (local and sync), managing encrypted data
└── lib/
    ├── jsqr.js                # Third-party library for decoding QR codes from uploaded images
    └── otpauth.js             # Third-party library for parsing OTP URIs and generating TOTP tokens
```

## Detailed Component Descriptions

### Root Files
*   **`manifest.json`**: Configures the extension for Chrome, requesting necessary permissions (`storage`, `session`, `clipboardWrite`), defining the background service worker, and registering the `popup.html` action.
*   **`popup.html`**: Contains the entire DOM structure. It is divided into logical blocks: Header, Search, Account List, and various Modals (Add Account, Settings, Unlock, Change Password).

### JavaScript Core (`/js`)
*   **`popup.js`**: The central controller of the extension. 
    *   **State Management:** Holds the decrypted accounts list in memory.
    *   **Rendering:** Uses interval timers to re-render the TOTP codes and the SVG countdown circles every second.
    *   **Events:** Implements MV3-compliant Event Delegation for copying codes, revealing codes, and deleting accounts.
    *   **Decoders:** Contains the logic for parsing standard `otpauth://` URIs and decoding `otpauth-migration://` (Google Authenticator export) protobuf payloads.
*   **`background.js`**: A lightweight MV3 Service Worker. Its primary role is to initialize state or clean up the `chrome.storage.session` when the browser is closed, ensuring the Master Password is not persisted insecurely.

### Storage & Security (`/js/storage`)
*   **`crypto.js`**: The security backbone. It uses `window.crypto.subtle` to derive a cryptographic key from the user's Master Password via PBKDF2 (100,000 iterations). It encrypts the TOTP secret keys using AES-GCM to ensure the vault cannot be accessed without the correct password.
*   **`storage.js`**: Acts as an interface to `chrome.storage`. It supports reading/writing to `chrome.storage.local` or `chrome.storage.sync` based on user preference, seamlessly handling encryption/decryption via `crypto.js`.

### User Interface & Experience
*   **`/css/style.css`**: Implements a cohesive design language heavily inspired by Microsoft Authenticator. Features CSS variables for easy Light/Dark mode toggling, Flexbox layouts, and custom animations for Modals and Toast notifications.
*   **`/js/accounts/logic.js`**: Enhances UX by automatically detecting the issuer (e.g., "Google", "GitHub") and fetching the corresponding brand logo from `logo.clearbit.com` or falling back to a custom avatar.
*   **`/js/i18n/i18n.js`**: Provides real-time language switching without requiring background scripts.

### Libraries (`/lib`)
Since Manifest V3 prohibits loading remote scripts, essential libraries are bundled locally.
*   **`otpauth.js`**: An established library used for taking the Base32 Secret Key and generating the correct 6-digit TOTP code based on the current system time.
*   **`jsqr.js`**: A pure JavaScript QR code decoder. When a user uploads a QR image, the image is drawn to a hidden canvas, converted to pixel data, and fed to `jsQR` to extract the `otpauth` payload.
