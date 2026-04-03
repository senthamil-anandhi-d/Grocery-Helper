# 🛠️ Developer Notes - Grocery Helper

This document provides technical insights into the architecture and design decisions of the Grocery Helper application.

## 🏗️ Architectural Overview

The application is built as a **Cloud-Synced Single Page Application (SPA)** using purely vanilla technologies (HTML/CSS/JS) and a **Firebase Backend** for scalable user-specific data storage.

### Design System
- **Glassmorphism**: Achieved using `backdrop-filter: blur()` and semi-transparent HSL colors.
- **HSL Color Scaling**: All colors are defined using HSL tokens for consistent lighting and easy theme adjustments.
- **Responsive Grid**: Uses CSS Grid for the form layout and Flexbox for the item lists.

### State Management
- **Hybrid Storage**: The app uses `localStorage` for fast offline access and **Firebase Firestore** for cross-device cloud synchronization.
- **Atomic Persistence**: Every mutation (adding to bill, clearing comparison) triggers a silent background sync if the user is authenticated.
- **Auth Listener**: The `onAuthStateChanged` hook serves as the primary router for data hydration, fetching the user's personal history document upon successful login.

## 📂 File Structure

- `index.html`: Main entry and semantic structure.
- `style.css`: All premium design tokens, glassmorphism effects, and responsiveness.
- `app.js`: Core logic, unit price normalization, and DOM manipulation.

## 🧮 Logic Details

### Unit Price Normalization
To compare products accurately, the app normalizes all inputs to a base "per kg" or "per Liter" price:
```javascript
const unitPrice = (price / weight) * (unit === 'g' || unit === 'ml' ? 1000 : 1);
```
- For grams/ml: It calculates the price per 1000 units.
- For kg/L/unit: It takes the raw unit price.

### Ripple Effect
Custom micro-animations are added to primary buttons via a JS-injected span:
```javascript
const ripple = btn.querySelector('.btn-ripple');
// ... calculates click coordinates and triggers CSS animation
```

## 🚀 Future Enhancements

- **PWA Capabilities**: Full offline service worker support for a truly mobile-native feel.
- **Social Login**: Integrating Google/Facebook auth via Firebase.
- **Export to Image/PDF**: Generating a shareable image of the bill.
- **Barcode Scanning**: Integrating browser-based barcode scanning for product lookups.

---
*Maintained by the Grocery Helper Dev Team.*
