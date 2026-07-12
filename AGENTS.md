
# Agent Instructions for Shopping List PWA

## Summary
This repository contains a minimal, cross-platform Progressive Web App (PWA) for managing shopping lists. The core philosophy of this project is absolute simplicity, speed, and privacy. The app is entirely client-side.

## Must-Follow Rules (Strict Boundaries)
- **Zero Frameworks:** The project uses strictly Vanilla JavaScript, HTML5, and CSS3. Do NOT install or suggest any UI frameworks (React, Vue, Angular) or utility libraries (Tailwind, jQuery).
- **Zero Build Tools:** Do NOT add `package.json`, Node.js dependencies, Webpack, Vite, or any transpilers. The code must be immediately executable by a browser and compatible with raw GitHub Pages hosting.
- **Zero Backend:** Do NOT implement cloud syncing, databases (Firebase, Supabase, etc.), or APIs. 
- **Zero Authentication:** Do NOT implement login screens, account creation, or user sessions.
- **Zero Dark Patterns:** Do NOT include cookie consent banners, premium subscription popups, or unnecessary alerts. 
- **Data Persistence:** All user data (lists and items) MUST be saved and retrieved exclusively using the browser's native `localStorage` API.

## Core Features
The app contains only these allowed features:
1. **Lists:** Add, edit (rename), delete, and switch between multiple shopping lists.
2. **Items:** Add, edit (rename), and delete items within the currently active list. Mark and unmark items as completed (checkbox/strikethrough).

## PWA & Distribution Requirements
In the future this application will be wrapped via PWABuilder for Google Play Store distribution as a Trusted Web Activity (TWA).
- Maintain a valid `manifest.json` with appropriate icons, theme colors, and `display: standalone`.
- Maintain an active Service Worker (`sw.js`) that caches core assets to ensure full offline functionality.
- Ensure all styling is highly responsive, prioritizing a mobile-first, app-like layout (e.g., preventing horizontal scrolling, using touch-friendly tap targets).

## Educational Guidelines (For the Agent)
The maintainer's building this app because he needs it, but he is using this codebase to practice core web technologies. Also this repository will be open-source, so when generating or refactoring code, you must:
- Write comments where needed (balanced, not too extensively).
- Clearly explain DOM manipulation techniques (e.g., `document.createElement`, event delegation).
- Clearly explain state management and `localStorage` serialization (`JSON.stringify` / `JSON.parse`).
- Use modern, clean ES6+ syntax (`let`, `const`, arrow functions, template literals) but explain the concepts in the comments.
