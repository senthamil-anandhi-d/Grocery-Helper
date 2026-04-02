# 🛠️ Developer Notes - Grocery Helper

This document provides technical insights into the architecture and design decisions of the Grocery Helper application.

## 🏗️ Architectural Overview

The application is built as a **Single Page Application (SPA)** using purely vanilla technologies (HTML/CSS/JS) to ensure maximum performance and zero dependency overhead.

### Design System
- **Glassmorphism**: Achieved using `backdrop-filter: blur()` and semi-transparent HSL colors.
- **HSL Color Scaling**: All colors are defined using HSL tokens for consistent lighting and easy theme adjustments.
- **Responsive Grid**: Uses CSS Grid for the form layout and Flexbox for the item lists.

### State Management
- **Local Arrays**: `comparisonItems` and `billItems` hold the current session state.
- **Session Persistence**: Data is serialized to JSON and stored in `sessionStorage` on every mutation.
- **Re-hydration**: On page load, the app checks `sessionStorage`, parses the JSON, and triggers a full UI re-render.

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

- **Offline Support**: Migration to `localStorage` or Service Workers for PWA capabilities.
- **Export to Image/PDF**: Generating a shareable image of the bill.
- **Barcode Scanning**: Integrating browser-based barcode scanning for product lookups.

---
*Maintained by the Grocery Helper Dev Team.*
