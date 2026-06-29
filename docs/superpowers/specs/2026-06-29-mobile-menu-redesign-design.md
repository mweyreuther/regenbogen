# Regenbogen — Mobile Menu Redesign

**Date:** 2026-06-29
**Status:** Approved for implementation

## Goal

Make Regenbogen mobile-first. Replace the top `AppHeader` and bottom color `AppFooter` with a single bottom toolbar of three large buttons that open slide-up panels. Lock the app to portrait orientation. Fix a bug where rotating the device clears the drawing.

All UI strings are **German**. Visual style is **Clean** — matches the app's existing aesthetic (translucent white, `backdrop-blur`, slate tones, rounded corners, neon accents). The codebase is a Nuxt 4 SPA (`ssr: false`) using Nuxt UI v4.6 and Tailwind v4.

## Decisions (from brainstorming)

- **Grouping:** Minimal — three big buttons: **Farbe**, **Größe**, **Mehr**.
- **Style:** Clean (not playful).
- **Undo:** Promoted to a small, always-visible floating button (top-left of canvas). Also kept inside Mehr → Werkzeug.
- **Orientation:** Portrait only, always.
- **Bug:** Rotating used to clear the canvas — must be fixed.

## 1. Orientation lock (portrait only)

The web cannot hard-lock orientation everywhere (iOS Safari ignores both the manifest `orientation` field and `screen.orientation.lock()`). Best-effort "lock" = two layers:

1. **`public/manifest.json`** — add `"orientation": "portrait"`. Honored by installed PWA / Android.
2. **`ui/RotateNotice.vue`** — a full-screen overlay (`z-[100]`) shown whenever `(orientation: landscape) and (max-height: 500px)` matches (phone in landscape). Dimmed background, rotate icon, German text (e.g. "Bitte dreh dein Gerät ins Hochformat 📱"). Implemented with VueUse `useMediaQuery`.
3. Remove the `@custom-variant mobile-landscape (...)` from `app/assets/css/main.css` and all `mobile-landscape:` utility classes throughout the app (header/footer/toolbar components are being deleted; the layout and index are being rewritten).

## 2. Layout

- Canvas is **edge-to-edge**. `AppHeader` and `AppFooter` are removed; `layouts/default.vue` becomes a simple full-height container.
- **`toolbar/BottomToolbar.vue`** — fixed to the bottom, three equal-width big buttons (**Farbe / Größe / Mehr**), icon + German label, Clean style, `backdrop-blur`, bottom safe-area inset (`env(safe-area-inset-bottom)`). The active button is highlighted while its panel is open. The **Farbe** button shows a small swatch of the current color; the **Größe** button shows a dot at the current size.
- **Floating Undo** — a small, semi-transparent round button (`i-lucide-undo-2`) pinned top-left of the canvas, always visible, calls the canvas undo.

## 3. Slide-up panels (bottom sheets)

Built on **Nuxt UI `UDrawer`** (`direction="bottom"`). Each panel:

- Controlled externally via `:open` / `@update:open` so **one panel is open at a time** (BottomToolbar owns an `activePanel: 'color' | 'size' | 'more' | null` state). Tapping another bar button switches panels.
- Drag handle (UDrawer default `handle`), a **header** with the title and a **✕ close button** (top-right), and a **body** with the controls.
- Closes via ✕, **backdrop tap / click-outside** (`dismissible`, default), **swipe-down** (Vaul), and Escape. Auto height, capped (`max-h-[70vh]`) with internal scroll. Respects `prefers-reduced-motion` (UDrawer/Vaul handles this; our own animations already guard it).

## 4. Panel contents

- **Farbe** (`ColorPanel.vue`): neon toggle (⚡), the 8-color palette as large swatches (with neon glow), and an inline custom color picker (`UColorPicker`). Same logic/state as today.
- **Größe** (`SizePanel.vue`): S / M / L (12 / 36 / 120) shown as scaled dots; current size highlighted.
- **Mehr** (`MorePanel.vue`): three labeled sections —
  - **Effekte:** Regenbogen (rainbow), Blinken (blink) — toggles.
  - **Werkzeug:** Radierer (eraser toggle), Zurück (undo), Leeren (clear, danger/red).
  - **App:** Speichern (save), Teilen (share), Dunkel/Hell (color-mode toggle), Neu laden (reload), Info (opens the existing About modal with the animated heart).

No drawing features, palette values, or behaviors are dropped.

## 5. Canvas persistence fix

Root cause: in `ui/DrawingCanvas.vue` the `ResizeObserver` sets `canvas.width/height` (which clears the bitmap) and calls `invalidateCache()` (which empties undo history) on every resize, so any size change blanks the drawing.

Fix: in the observer callback —
1. Skip if dimensions are unchanged or zero.
2. Snapshot the current canvas to an offscreen canvas.
3. Set the new `width/height`; `invalidateCache()`.
4. `drawImage` the snapshot back, scaled to the new size, using the (willReadFrequently) context.
5. Resize the overlay canvas too.

The visible drawing survives any resize. Undo history resets across a resize (acceptable trade-off).

## 6. Component architecture

State sharing uses **provide/inject** to avoid deep prop-drilling. `index.vue` owns the canvas ref and the wipe overlay, calls `useToolbar(canvasComponent)`, composes a toolbar context object (toolbar state + handlers + `save` / `share` / `reload` / `undo` / `clear`), and `provide`s it under a typed `InjectionKey` exported from `useToolbar.ts`. Panels call an `injectToolbar()` helper.

**New files**
- `app/components/ui/RotateNotice.vue`
- `app/components/toolbar/BottomToolbar.vue`
- `app/components/toolbar/ColorPanel.vue`
- `app/components/toolbar/SizePanel.vue`
- `app/components/toolbar/MorePanel.vue`

**Changed**
- `app/composables/useToolbar.ts` — export `ToolbarContext` type, `toolbarKey` InjectionKey, `injectToolbar()`.
- `app/pages/index.vue` — simplified; provides context; renders canvas + BottomToolbar + RotateNotice.
- `app/layouts/default.vue` — drop landscape row layout.
- `app/components/ui/DrawingCanvas.vue` + `app/composables/useDrawingCanvas.ts` — resize fix.
- `public/manifest.json`, `app/assets/css/main.css`.

**Deleted**
- `app/components/AppHeader.vue`, `app/components/AppFooter.vue`, `app/components/AppMenu.vue`
- `app/components/toolbar/BrushSizeSelector.vue`, `BrushEffects.vue`, `EditActions.vue`, `ColorPicker.vue` (replaced by the panels).

## Non-goals

No new drawing tools, no palette changes, no backend, no test framework introduction (the project has none). Orientation is best-effort per platform limits described above.

## Verification

`pnpm lint`, Nuxt typecheck, dev server boot, and a headless-browser screenshot pass (portrait canvas, each panel open, rotate overlay in landscape), followed by an adversarial multi-dimension code review.
