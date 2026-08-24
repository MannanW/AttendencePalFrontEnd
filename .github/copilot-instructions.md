# Attendance App - Project Cursor Rules

## 1. Visual & Design System (Cyber-Noir Aesthetic)
- **Backgrounds:** Strictly use True Black (`#000000`) for all primary screen backgrounds. No grey gradients or white backdrops.
- **Surfaces & Cards:** Use dark grey (`#121212` or `#1A1A1A`) for all cards, modals, and container surfaces.
- **Accents & States:** Use deep bottle green for primary action buttons, active tabs, progress fill bars, and "Attended" indicators.
- **Borders & Contrast:** Use sharp, flat, high-contrast borders. Strictly NO generic AI styling (avoid soft pastel shadows, rounded bubbly gradients, or iOS-style glassmorphism unless explicitly requested).
- **Typography:** Clean, modern sans-serif. Use crisp white (`#FFFFFF`) for primary headers and muted neutral grey (`#9CA3AF`) for secondary helper text, ensuring WCAG compliance.

## 2. Core Architecture Rules
- **Precompute-Only Logic:** All attendance percentages, streak counts, buffers ("can miss X more" / "must attend Y more"), and statistics must be read from precomputed state or cached storage models. Never perform heavy, unoptimized runtime iterations or recalculations on component mount.
- **Local-First Persistence:** Maintain a local-first architecture using offline-first storage wrappers (such as AsyncStorage or MMKV for React Native/Expo environments).

## 3. Continuous Testing & Quality Loop
- **Self-Correction & Error Checking:** Before finalizing any generated component or logic block, automatically check for missing error boundaries, potential null-state crashes on empty schedules, and layout overflow on mobile viewports.
- **Strict Scope Boundaries:** When working on specific phases (e.g., Phase 1 MVP), do not prematurely introduce complex backend hooks, cloud syncing, or code structures belonging to later phases unless explicitly instructed.
- **Clean Code Standard:** Write fully functional, modular TypeScript/JavaScript components without placeholder text, unhandled promise rejections, or broken imports.