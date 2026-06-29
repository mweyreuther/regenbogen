# Implementation Plan: "Schlange" (Snake) — Auto-Draw Mode

Date: 2026-06-29
Status: Planning only (no feature code in this document)
App: Regenbogen (Nuxt 3 + Vue 3 `<script setup lang="ts">`, Tailwind v4, Nuxt UI drawers, dark-mode only)

---

## 0. TL;DR for the implementer

Add a self-running "Schlange" mode: a circular pointer wanders around the canvas at constant speed, bouncing off the edges with a touch of random drift, drawing a continuous **small** ("S" = `12`) line behind it. The line color follows the **currently selected drawing mode** (rainbow if Regenbogen is on, eraser/background color if Radierer is on, otherwise the solid `selectedColor`). The wandering pointer dot is rendered on the **overlay canvas** so it is never baked into the drawing, while the line itself is drawn onto the **main canvas** so it is a real, exportable, undoable part of the picture.

Core pieces:
- New composable `app/composables/useSnake.ts` owns the `requestAnimationFrame` loop, position/velocity state, and the per-frame draw calls.
- `useDrawingCanvas.ts` gains a thin primitive `drawSnakeSegment(...)` (main canvas) + a helper to draw/clear the pointer on the overlay (exposed via the canvas component).
- `DrawingCanvas.vue` exposes the new methods on its `defineExpose` surface; `CanvasRef` type in `useToolbar.ts` is extended to match.
- `useToolbar.ts` gains `isSnake` state + `toggleSnake()`, added to the `ToolbarContext`.
- `index.vue` instantiates `useSnake(canvasComponent)`, wires start/stop into the context.
- A `ToolbarPanelButton` "Schlange" is added to `ColorPanel.vue` (Effects row).

---

## 1. Overview & UX

### 1.1 What the user sees / does
- In the **Farbe** drawer (`app/components/toolbar/ColorPanel.vue`), in the "Effects" grid that currently holds **Regenbogen** and **Blinken** (`grid grid-cols-2 gap-2.5` at lines 46–59), add a third effect button **Schlange** (icon `i-lucide-worm` or `i-lucide-spline`/`i-lucide-route`). Note the grid is currently 2 columns; adding a third tile means switching that grid to `grid-cols-3` (matching the "Hintergrund" row) or adding a second row — recommend `grid-cols-3` so all three effects sit in one tidy row.
- Tapping **Schlange** toggles the mode on/off (active highlight via `ToolbarPanelButton`'s `:active`).
- When ON: a visible circle pointer appears on the canvas and immediately starts moving on its own, leaving a continuous painted line. The user can close the drawer and just watch it draw.
- When OFF: the pointer disappears (overlay cleared), the rAF loop stops, the painted line remains on the canvas.

### 1.2 The toggle location
- Primary: **ColorPanel** effects row (it is the natural home next to Regenbogen/Blinken, and the snake's color depends on those modes — see §4).
- Alternative considered: **MorePanel** "Werkzeug" row. Rejected because the snake's color is driven by the color/effect state that lives in ColorPanel, so co-locating is clearer for kids and for wiring.

### 1.3 Rainbow-vs-eraser color choice — RECOMMENDATION
**Recommended: "follow the currently-selected mode."** The snake does not introduce its own color picker. Instead, each segment is drawn using whatever the user has already selected:
- If **Regenbogen** (`isRainbow`) is active → cycling-hue rainbow line (with neon glow if `isNeon`).
- If **Radierer** (`isEraser`) is active → draws in `eraserColor` (the dark canvas bg `#1e293b`), i.e. it "un-draws", with no glow.
- Otherwise → the solid `selectedColor` (with glow per `isNeon`).

Rationale: this matches the existing app mental model (the brush already behaves this way), requires zero new UI, and lets a kid set up "rainbow snake" or "eraser snake" using controls they already understand. The Snake button is purely a motion toggle.

**Alternative (documented, not recommended):** a dedicated two-option segmented toggle inside the Schlange affordance ("Regenbogen 🌈 / Radierer 🧽") that overrides the global color while the snake runs. This is more self-contained but duplicates state, adds UI, and can confuse kids about why the normal swatches stop mattering. If chosen, store a `snakeColorMode: Ref<'rainbow' | 'eraser'>` in `useToolbar` and branch on it in `useSnake` instead of reading `isRainbow`/`isEraser`.

### 1.4 Start/stop semantics & interactions
- **Toggle**: tapping Schlange starts; tapping again stops. Idempotent.
- **Manual draw while running — RECOMMENDATION: stop the snake on manual pointer-down.** A kid putting a finger on the canvas clearly wants to take over; letting both draw simultaneously is chaotic and risks racing on `getCtx()`/`lastPos` state. So `onStart` in `DrawingCanvas.vue` should stop the snake before starting a manual stroke. (Implementation: emit a `manualdraw` event or call a stop callback — see §6.)
- **Opening a panel (drawer) — RECOMMENDATION: keep running.** The snake should keep drawing while the Farbe/Größe/Mehr drawer is open so the kid can watch and tweak settings live (e.g. flip Regenbogen and see the snake change color). The drawers are bottom sheets (`UDrawer`) and don't cover the whole canvas. Document the alternative: pause-while-open, which is simpler but less fun — not recommended.
- **Rotate overlay (`RotateNotice.vue`)**: the overlay covers the screen at `z-[100]` when the phone is landscape. The snake loop keeps running underneath (it's just an rAF), but the user can't see it. No special handling required; on rotate back the snake is still bouncing inside the (now correctly sized) canvas. After the resize that the rotation triggers, the snake must be re-clamped into bounds — see §5.2.
- **Reduced motion**: respect `prefers-reduced-motion` the way `clearWithWipe` (index.vue lines 65–87) and `setColor` (useToolbar.ts lines 143–151) do. RECOMMENDATION: if `(prefers-reduced-motion: reduce)` matches, still allow the snake (it's the whole point of the feature) but reduce the wander jitter / keep speed modest, OR show it as available but document that we deliberately do NOT block it. Decide with the user (see §8). Safest default: run it, but skip any decorative easing and keep the pointer a simple static circle (no pulsing animation).

---

## 2. Architecture

### 2.1 New composable: `useSnake(canvasComponent)`
Create `app/composables/useSnake.ts`. It owns:
- Reactive `isRunning = ref(false)`.
- Mutable (non-reactive, plain `let`) physics state: `x, y` (canvas pixels), `vx, vy` (pixels/second), `rafId`, `lastTime`, `hue` (for rainbow cycling).
- `start()`, `stop()`, `toggle()`.
- The rAF `tick(now)` function.

It takes the same `Ref<CanvasRef | null>` that `useToolbar` and `index.vue` already pass around (`canvasComponent` in `index.vue` line 29), so it can call the exposed drawing primitives.

Signature mirrors `useToolbar(canvasComponent: Ref<CanvasRef | null>)` (useToolbar.ts line 99).

It must also read the live color/effect state. Two clean options:
- (a) Pass the relevant refs in: `useSnake(canvasComponent, { isRainbow, isEraser, isNeon, selectedColor, eraserColor })`. Recommended — explicit, no new coupling.
- (b) Have `useSnake` read from `canvasComponent.value` (which already exposes `rainbowMode`, `neonGlow`, `brushColor`). The catch: the eraser case is represented on the canvas only as `brushColor === eraserColor` with `neonGlow=false`, so `brushColor` already encodes the resolved color. This is actually the **simplest** path: the snake can just read `canvasComponent.value.brushColor` (solid or eraser color, already resolved by `toggleEraser`/`setColor`) and `canvasComponent.value.rainbowMode` to decide rainbow-vs-solid, and `canvasComponent.value.neonGlow` for the glow. RECOMMENDATION: option (b) — it reuses the exact same resolved values the manual brush uses, guaranteeing the snake's color always matches the brush. Keep `selectedSize` out of it: the snake always uses the **S** width `12`, not `brushSize`.

### 2.2 Main canvas vs overlay
- **The painted line → MAIN canvas.** It should be a permanent, exportable, undoable part of the drawing (the user explicitly wants it to "draw a continuous line"). It must therefore go through the same context the brush uses (`getCtx()` in `useDrawingCanvas.ts`).
- **The pointer circle → OVERLAY canvas.** Following the existing blink pattern (`overlayRef` in `DrawingCanvas.vue`), draw the moving dot on the overlay so it is transient and never baked into the picture. Each frame: clear the overlay, then draw the circle at the new position.
  - Caveat: the overlay is `v-show`-gated by `hasBlinkStroke || isOverlayDrawing` (template line 15). The snake must make the overlay visible while running. Add a third reactive flag, e.g. `isSnakeRunning` (or reuse a generic `showOverlay`), to the `v-show` condition: `v-show="hasBlinkStroke || isOverlayDrawing || snakeActive"`.
  - Caveat: the overlay has `class="pointer-events-none"`, so the pointer dot never intercepts touches — good, manual draw still hits the main canvas.

### 2.3 Exposing drawing primitives
Add to `useDrawingCanvas.ts` and re-expose through `DrawingCanvas.vue`:
- `drawSnakeSegment(from, to, opts)` on the MAIN canvas — strokes a single small line segment from previous point to current point using the resolved color/glow and `lineWidth = 12`, `lineCap/lineJoin = "round"`. This reuses the exact stroke style logic already in `continueStroke` (useDrawingCanvas.ts lines 101–123) but as a standalone, event-free call. Implement it once in `useDrawingCanvas` so the snake doesn't poke at the context directly.
- `beginSnakeRun()` → calls `saveToHistory()` **once** so the whole run is a single undo step (see §4.3), and optionally sets up shared stroke state.
- For the pointer, add overlay helpers on the component (they need `overlayRef`, which lives in `DrawingCanvas.vue`, not in `useDrawingCanvas`):
  - `drawSnakePointer(x, y, radius, color)` — clears the overlay and draws a filled/outlined circle.
  - `clearSnakeOverlay()` — clears it and flips the `v-show` flag off.

Wire-up through `ToolbarContext`: `index.vue` builds the context (lines 89–98) and adds a `toggleSnake` action that calls the `useSnake` instance. Panels call `injectToolbar().toggleSnake()`. The `isSnake` ref is spread in from `useToolbar` (like `isRainbow`, `isBlink`).

Note: `useSnake` lives in `index.vue` (alongside `useToolbar`) because it needs `canvasComponent`, which only exists there. `useToolbar` owns the **UI flag** `isSnake` and a no-op `toggleSnake` placeholder is NOT enough — instead let `index.vue` provide the real `toggleSnake` that flips `toolbar.isSnake` AND calls `snake.toggle()`, exactly like `clear` is overridden with `clearWithWipe` in index.vue line 93. RECOMMENDATION: keep `isSnake` in `useToolbar` (so the button's `:active` binding is reactive and consistent with the other effect toggles), and have `index.vue` compose the action.

---

## 3. Motion math

All math is in **canvas device pixels** (the canvas is high-DPR: `canvas.width = cssWidth * dpr`, see `fitCanvas` in DrawingCanvas.vue lines 185–227). Because the painted segments use `getCtx()` on the main canvas (whose coordinate space is device pixels), and the pointer is drawn on the overlay (also device pixels, same `width/height`), keeping everything in device pixels means **no manual DPR conversion is needed** — both canvases share the same pixel grid. The only place DPR matters is choosing a speed/radius that feels right on screen (multiply by `dpr` so it looks the same on retina and non-retina; or define speed in CSS px and multiply by `window.devicePixelRatio`).

### 3.1 State
```
x, y            // current position, device px
vx, vy          // velocity, device px per second
radius          // pointer circle radius, device px (e.g. 14 * dpr; line is 12 wide)
hue             // 0..359, for rainbow
```

### 3.2 Initialization (on start)
- Read `w = canvas.width`, `h = canvas.height` from `canvasComponent.value.canvasRef` (exposed at DrawingCanvas line 249).
- Start position: center `x = w/2, y = h/2` (or last position if resuming — recommend always re-center on a fresh start).
- Speed: pick a base speed `SPEED` in CSS px/sec (e.g. ~`180` css px/s) → convert to device px: `speed = SPEED * dpr`. Random initial heading `θ = Math.random() * 2π`: `vx = cos θ * speed`, `vy = sin θ * speed`.

### 3.3 Per-frame update (frame-rate independent)
Use delta time. `Date.now()` is acceptable in app code, but `performance.now()` (the timestamp rAF already passes to its callback) is cleaner and what rAF provides — use the callback arg `tick(now)`:
```
dt = (now - lastTime) / 1000   // seconds; clamp to e.g. 0.05 to avoid jumps after tab-away
lastTime = now
// wander: nudge the heading by a small random angle each second
angle += (Math.random() - 0.5) * WANDER * dt   // WANDER ~ 2.5 rad/s spread
// re-derive velocity from angle so speed stays constant
vx = cos(angle) * speed; vy = sin(angle) * speed
prevX = x; prevY = y
x += vx * dt; y += vy * dt
```
Keeping a single `angle` scalar and re-deriving `vx/vy` each frame guarantees **constant speed** and makes the "wander randomness" trivial — much cleaner than perturbing `vx/vy` directly (which would change the magnitude). The bounce then reflects the `angle` rather than negating a component (see below).

### 3.4 Edge bounce (clamp + reflect, account for radius)
Bounds for the pointer center are `[radius, w - radius]` × `[radius, h - radius]` so the circle never clips off-screen.
```
if (x < radius)      { x = radius;     vx = +Math.abs(vx); angle = Math.atan2(vy, vx) }
if (x > w - radius)  { x = w - radius; vx = -Math.abs(vx); angle = Math.atan2(vy, vx) }
if (y < radius)      { y = radius;     vy = +Math.abs(vy); angle = Math.atan2(vy, vx) }
if (y > h - radius)  { y = h - radius; vy = -Math.abs(vy); angle = Math.atan2(vy, vx) }
```
After reflecting the component(s), recompute `angle = atan2(vy, vx)` so the wander step continues from the reflected heading. Optionally add a tiny random kick on bounce so the snake doesn't fall into a periodic loop (`angle += (Math.random()-0.5) * 0.4`). Reflection note: clamping the position first (then flipping the relevant velocity sign) prevents the snake from getting "stuck" outside the wall on the next frame.

### 3.5 Line width
Always `12` device px? No — `12` is a CSS-px brush value (`brushSizes` S = 12 in useToolbar.ts line 56). The manual brush sets `ctx.lineWidth = brushSize.value` directly in device-pixel space (continueStroke line 108) without multiplying by DPR, so to **match the manual brush exactly**, set `ctx.lineWidth = 12` (no DPR multiply). This keeps the snake line visually identical to selecting "S" and drawing by hand. (If the brush ever starts DPR-scaling, scale here too.) The pointer radius, however, should be a bit larger than the line for visibility (e.g. line 12 + a 6px ring → radius ~9–14 device px) and CAN be DPR-scaled for crispness since it's only on the overlay.

---

## 4. Color logic

### 4.1 Resolving the color each segment
Read from the canvas expose surface (option (b), §2.1):
- `rainbow = canvasComponent.value.rainbowMode`
- `color = canvasComponent.value.brushColor` (already the eraser color when Radierer is on, or the solid selected color otherwise)
- `glow = canvasComponent.value.neonGlow` (already `false` while erasing)

`drawSnakeSegment` in `useDrawingCanvas` then branches:
- **Rainbow on**: `const c = ` hsl(${hue}, 90%, 55%)`; draw the segment with `strokeStyle = c`, apply glow if `neonGlow`, then `hue = (hue + 4) % 360`. This reuses the existing pattern at useDrawingCanvas.ts lines 103 & 116 verbatim (same `4` increment, same `90%, 55%`, same `shadowBlur = 18`). Use a snake-local hue counter so it doesn't fight the brush's `rainbowHue`.
- **Solid / eraser**: `strokeStyle = brushColor` (the resolved value), `applyGlow(ctx, color)` (which is a no-op when `neonGlow` is false — see `applyGlow` lines 65–73). For the eraser case, glow is already off, exactly matching manual erasing.

### 4.2 How segments are drawn
Per frame, one segment from `(prevX, prevY)` to `(x, y)`:
```
ctx.beginPath();
ctx.moveTo(prevX, prevY);
ctx.lineTo(x, y);
ctx.strokeStyle = color;     // hsl(...) or resolved brushColor
ctx.lineWidth = 12;
ctx.lineCap = "round"; ctx.lineJoin = "round";
applyGlow(ctx, color);       // or set shadowColor/Blur for rainbow as in continueStroke
ctx.stroke();
```
Identical shape to `continueStroke` (lines 101–123). At the end of the run, reset shadow like `endStroke` does (lines 133–140: `shadowColor = "transparent"; shadowBlur = 0`).

### 4.3 History — RECOMMENDATION: ONE undo step per run
Call `saveToHistory()` **once** when the snake starts (in `beginSnakeRun()` / inside `start()`), and **not** per frame. Reasons:
- Per-frame `saveToHistory()` would call `ctx.getImageData(...)` every frame (expensive `willReadFrequently` reads) and blow past `maxHistory = 30` (useToolbar/useDrawingCanvas line 8) in well under a second, evicting all real history.
- One snapshot before the run means a single Undo removes the entire snake drawing — intuitive for a kid ("undo the snake").
- This mirrors how `clear()` and `fillBackground()` snapshot once (lines 167, 175).

Document the alternative: **no history at all** (snake line is not undoable). Rejected — kids will want to undo a runaway eraser-snake. The one-snapshot approach is the recommended default.

Edge: if the snake is stopped and restarted, each run is its own undo step. Acceptable.

---

## 5. Lifecycle & edge cases

### 5.1 Cleanup
- `stop()` must `cancelAnimationFrame(rafId)`, set `rafId = null`, reset `lastTime`, clear the overlay pointer (`clearSnakeOverlay()`), reset shadow on the main ctx, and set `isRunning = false`.
- In `index.vue`, register `onBeforeUnmount(() => snake.stop())` so navigating away cancels the loop (the page itself is the app root, but this is correct hygiene and prevents a dangling rAF in dev HMR).
- `DrawingCanvas.vue` already disconnects its `ResizeObserver` in `onBeforeUnmount` (lines 236–238); no change needed there beyond the new overlay flag.

### 5.2 Canvas resize (the IMPORTANT one)
On resize/orientation change, `fitCanvas` (DrawingCanvas.vue 185–227) does: snapshot → set `canvas.width/height` (which clears + reallocates the bitmap) → `invalidateCache()` (which **wipes `history` and `redoStack`**, useDrawingCanvas lines 24–29) → redraw the snapshot **scaled** to the new size → resizes the overlay the same way → `emit("resize")`.

Implications for the snake:
1. **The loop keeps running** — `fitCanvas` doesn't touch the rAF. Good.
2. **`history` is wiped** by `invalidateCache`, so the "one undo step" snapshot taken at `start()` is gone after a resize. This is pre-existing behavior (any drawing's history is wiped on resize); acceptable. Do NOT try to preserve it.
3. **Position can be out of bounds**: the canvas dimensions change, so `x/y` may now be outside `[radius, w-radius]`. The snake must re-read `w = canvas.width, h = canvas.height` every frame (cheap) OR listen for the `resize` event and re-clamp. RECOMMENDATION: **read `w/h` fresh inside `tick` every frame** and clamp there — this is robust to any resize without extra wiring, and the bounce code in §3.4 already clamps. Because `fitCanvas` scales the existing bitmap, also consider rescaling `x/y` proportionally on resize for visual continuity; but simply clamping is sufficient and simpler. Decide in §8.
4. **`index.vue` already listens?** The `<UiDrawingCanvas>` emits `resize` (line 226) but index.vue does not currently bind `@resize`. If you choose the "rescale position on resize" approach, add `@resize` handling that recomputes the snake's scale factor. If you choose "read w/h every frame + clamp", no `@resize` binding is needed. Recommended: the latter (no new event wiring).

### 5.3 Pause vs continue when a drawer/panel is open
Per §1.4, **continue running** while drawers are open. No pause logic. (If product later wants pause-on-open, the `activePanel` ref lives in `BottomToolbar.vue` and is not currently in the context; pausing would require surfacing it — out of scope.)

### 5.4 Manual-draw takeover
`DrawingCanvas.vue#onStart` (lines 94–115) must stop the snake before beginning a manual stroke. Cleanest: emit a new `manualstart` event from `onStart`, and have `index.vue` call `snake.stop()` on it (and also flip `toolbar.isSnake = false` so the button de-activates). This keeps `DrawingCanvas` unaware of the snake composable. Also flip the Schlange button off. (Alternative: pass a `onManualDraw` callback prop — but the codebase prefers events/inject over prop callbacks.)

### 5.5 Reduced motion
Gate any decorative pointer animation behind `!window.matchMedia("(prefers-reduced-motion: reduce)").matches`, consistent with `clearWithWipe`/`setColor`. The snake motion itself is the feature; see §1.4 / §8 for whether to also tone down wander.

### 5.6 Performance
- Exactly **one** rAF loop (in `useSnake`). Do not spawn per-segment animations.
- Per frame: 1 main-canvas `stroke()` (one short segment) + 1 overlay `clearRect` + 1 overlay `arc/fill`. All cheap.
- Never call `getImageData`/`saveToHistory` per frame (see §4.3) — that's the main perf trap given `willReadFrequently`.
- Clamp `dt` to avoid a giant jump (and a long off-screen segment) after the tab is backgrounded and rAF pauses.
- The overlay is `pointer-events-none` and `v-show`-gated; clearing only the small overlay each frame (not the main canvas) keeps the painted line intact.

---

## 6. Files to change / add

| File | Change |
|---|---|
| `app/composables/useSnake.ts` | **NEW.** `useSnake(canvasComponent)` → `{ isRunning, start, stop, toggle }`. Owns rAF loop, physics (§3), color resolution (§4.1), calls `drawSnakeSegment` (main) + `drawSnakePointer`/`clearSnakeOverlay` (overlay) on `canvasComponent.value`. Calls `beginSnakeRun()` (single `saveToHistory`) on start. Reads `w/h` from `canvasComponent.value.canvasRef`. |
| `app/composables/useDrawingCanvas.ts` | Add `drawSnakeSegment(from, to)` (main-canvas segment stroke reusing `getCtx`/`applyGlow`, `lineWidth=12`, rainbow hue branch like lines 101–123) and `beginSnakeRun()` (single `saveToHistory()` + reset shadow at end via existing `endStroke`-style reset). Return them from the composable (add to the `return {}` at lines 268–289). A snake-local `snakeHue` counter. |
| `app/components/ui/DrawingCanvas.vue` | Destructure the two new fns from `useDrawingCanvas()` (line 24 block). Add overlay helpers `drawSnakePointer(x,y,r,color)` and `clearSnakeOverlay()` (they need `overlayRef`/`getOverlayCtx`). Add a reactive `snakeActive` flag and include it in the overlay `v-show` (line 15). In `onStart` (line 94), emit a new `manualstart` event before drawing. Extend `defineEmits` (line 42) with `manualstart: []`. Add `drawSnakeSegment`, `beginSnakeRun`, `drawSnakePointer`, `clearSnakeOverlay`, and a setter for `snakeActive` to `defineExpose` (lines 240–254). |
| `app/composables/useToolbar.ts` | Add `isSnake = ref(false)` and include it in the returned object (lines 210–225) and in `ToolbarContext` (lines 67–89) as `isSnake: Ref<boolean>` + `toggleSnake: () => void`. Extend the `CanvasRef` type (lines 4–16) with the new exposed methods: `drawSnakeSegment`, `beginSnakeRun`, `drawSnakePointer`, `clearSnakeOverlay`, `setSnakeActive` (or `snakeActive` ref), and `canvasRef`. Optionally a `disableSnake()` helper analogous to `disableEraser()` so other toggles can stop the snake; and have `toggleRainbow`/`toggleEraser`/`toggleBlink` NOT necessarily stop it (snake should coexist with color changes — see §1.4). |
| `app/pages/index.vue` | Instantiate `const snake = useSnake(canvasComponent)`. Compose `toggleSnake` into `toolbarContext` (like `clear`/`undo` overrides, lines 91–97): it flips `toolbar.isSnake.value` and calls `snake.toggle()`, toggling `canvasComponent.value.setSnakeActive(...)`. Bind `@manualstart` on `<UiDrawingCanvas>` to a handler that calls `snake.stop()` and sets `toolbar.isSnake.value = false`. Add `onBeforeUnmount(() => snake.stop())`. (Optionally bind `@resize` if you pick the rescale-on-resize variant in §5.2.) |
| `app/components/toolbar/ColorPanel.vue` | Destructure `isSnake`, `toggleSnake` from `injectToolbar()` (lines 135–149). Add a third `ToolbarPanelButton` "Schlange" (`i-lucide-worm`/`i-lucide-spline`) in the effects grid (lines 46–59) with `:active="isSnake" @click="toggleSnake()"`, and switch that grid to `grid-cols-3`. |

No other files change. **Do not** modify `BottomToolbar.vue` (the toggle lives in the drawer), `SizePanel.vue`, `RotateNotice.vue`, or `MorePanel.vue`.

---

## 7. Step-by-step implementation tasks (ordered, each verifiable)

1. **Extend the canvas engine.** In `useDrawingCanvas.ts`, add `drawSnakeSegment(from, to)` and `beginSnakeRun()` + `snakeHue` local, and return them. *Verify*: temporarily call `beginSnakeRun()` then `drawSnakeSegment({x:50,y:50},{x:200,y:200})` from a console/test and confirm a line appears on the main canvas and undo removes it.
2. **Add overlay pointer helpers + expose surface.** In `DrawingCanvas.vue`, add `drawSnakePointer`/`clearSnakeOverlay`, the `snakeActive` flag in `v-show`, the `manualstart` emit in `onStart`, and extend `defineExpose`. *Verify*: from console, set the overlay flag and call `drawSnakePointer(100,100,14,'#fff')` → a dot shows on the overlay and does not appear in `exportImage()`.
3. **Type the surface.** Update `CanvasRef` and `ToolbarContext` in `useToolbar.ts`; add `isSnake` ref + `toggleSnake` to the interface and the `useToolbar` return. *Verify*: `npm run lint` / `nuxi typecheck` passes (no TS errors about missing members).
4. **Build the loop.** Create `useSnake.ts` with physics (§3), color resolution (§4.1 option b), per-frame draw, bounce, `start/stop/toggle`, `dt` clamp, fresh `w/h` read each frame. *Verify*: standalone — temporarily call `snake.start()` from `index.vue` on mount and watch it bounce + draw; confirm it stays in bounds.
5. **Wire the context.** In `index.vue`, instantiate `useSnake`, compose `toggleSnake`, bind `@manualstart` to stop + de-activate, add `onBeforeUnmount(stop)`. *Verify*: drawing manually stops the snake and un-highlights the button.
6. **Add the UI button.** In `ColorPanel.vue`, add the Schlange `ToolbarPanelButton`, switch effects grid to `grid-cols-3`, wire `:active`/`@click`. *Verify*: button toggles, highlights, starts/stops the snake; drawer can be closed while it runs.
7. **Color modes.** Confirm rainbow/eraser/solid + neon all reflect into the snake line by toggling Regenbogen / Radierer / picking colors / toggling Neon while the snake runs. *Verify*: visually, per §9.
8. **Reduced-motion + edge passes.** Add the `prefers-reduced-motion` gate for any decorative pointer pulse; test resize/rotate re-clamping. *Verify*: §9.
9. **Lint/format.** Run the repo's lint+format (the recent commits "Lint and format all files" suggest ESLint/Prettier). *Verify*: clean.

---

## 8. Open questions / decisions for the user

1. **Color selection model** — confirm the recommended "follow current mode" (§1.3) vs a dedicated rainbow/eraser sub-toggle.
2. **Manual-draw behavior** — confirm "stop the snake when the user touches the canvas" (§1.4 / §5.4). Alternative: let both coexist.
3. **Resize handling** — "read w/h every frame + clamp" (recommended, no new wiring) vs "rescale snake position proportionally on `@resize`" (smoother visual continuity, needs the event bound).
4. **Reduced motion** — run the snake normally even under `prefers-reduced-motion: reduce` (recommended; it's the feature), or refuse/limit it? At minimum, no decorative pointer animation in that case.
5. **Speed / wander tuning** — proposed base ~180 css px/s and a gentle wander; needs a feel-test with the kids. Should there be a UI to change speed, or hard-coded? (Recommend hard-coded for now.)
6. **Icon** — `i-lucide-worm` vs `i-lucide-spline`/`i-lucide-route` for the Schlange button.
7. **Pointer appearance** — plain filled circle in the current color, or a white-ringed dot for contrast against same-color lines? (Recommend a contrasting ring so it stays visible over its own trail.)
8. **Coexistence with Blinken** — Blinken draws on the overlay (the snake pointer also uses the overlay). If both are on, the snake pointer and a blink stroke could collide on the same overlay. Recommend: starting the snake disables Blinken (call the existing `setBlinkMode(false)` / clear the blink stroke), since both want the overlay. Confirm.

## 9. Verification plan

Manual (dev server + browser; the app is portrait phone UI):
1. `npm run dev` (or the repo's dev script) and open in a mobile-emulated portrait viewport.
2. Open **Farbe**, tap **Schlange**. Confirm: a circular pointer appears and starts moving on its own; the button shows the active highlight.
3. Watch it **bounce** off all four edges; confirm it never clips off-screen (the pointer stays fully inside) and that it **wanders** (heading drifts, not perfectly periodic).
4. Confirm a **continuous small line** is painted along the path at the "S" width (compare against manually drawing with S selected — line widths should match).
5. **Rainbow**: with Regenbogen on, confirm the trail cycles hue (and glows if Neon is on).
6. **Eraser**: select Radierer, confirm the snake now "erases" (paints in `#1e293b`) with no glow.
7. **Solid + Neon**: pick a color, toggle Neon on/off, confirm the trail color/glow follow.
8. Change color/effects **while it runs** (drawer open) → trail updates live; closing the drawer keeps it running.
9. **Stop**: tap Schlange again → pointer disappears, trail remains, loop stops (verify via no further CPU/visual change).
10. **Manual takeover**: while running, touch/drag on the canvas → snake stops, button de-activates, your manual stroke draws normally.
11. **Undo**: after a run, one Undo removes the entire snake trail (single history step).
12. **Resize/rotate**: resize the window / rotate to landscape (RotateNotice covers UI) and back → snake keeps running and is re-clamped inside the new bounds; no off-screen drift.
13. **Export**: `Speichern`/`Teilen` → the snake line IS in the exported image; the pointer dot is NOT (it's overlay-only).
14. **Console**: no errors/warnings throughout; confirm only a single rAF is active (e.g. stop → no further frames logged if you temporarily instrument `tick`).
15. **Reduced motion**: with OS reduced-motion on, confirm behavior matches the §8.4 decision (no decorative pointer pulse at minimum).
16. **Lint/typecheck** clean.
