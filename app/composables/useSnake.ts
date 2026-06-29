import type { Ref } from "vue";
import type { CanvasRef } from "~/composables/useToolbar";

const SPEED_CSS = 180; // css px per second
// A smoothly varying turn rate makes the path curve and deflect continuously
// instead of running in long straight lines.
const TURN_ACCEL = 6; // how fast the turn rate itself changes (rad/s^2)
const TURN_DAMP = 2; // pulls the turn rate back toward straight (so it meanders, not circles)
const MAX_TURN = 1.8; // cap on turn rate (rad/s) — higher = tighter curves

/**
 * "Schlange" auto-draw mode: a pointer wanders the canvas at constant speed,
 * bounces off the edges, and paints a small line behind it. The trail color
 * follows the currently-selected drawing mode (rainbow / eraser / solid),
 * resolved inside the canvas engine's drawSnakeSegment. The pointer dot is
 * drawn on the overlay canvas so it is never baked into the picture.
 */
export function useSnake(canvasComponent: Ref<CanvasRef | null>) {
  const isRunning = ref(false);

  let rafId: number | null = null;
  let x = 0;
  let y = 0;
  let angle = 0;
  let speed = 0;
  let radius = 10;
  let lineWidth = 12;
  let turnRate = 0;
  let lastTime = 0;

  function tick(now: number) {
    const canvas = canvasComponent.value;
    const el = canvas?.canvasRef;
    if (!canvas || !el) {
      stop();
      return;
    }

    // Skip the very first frame so we have a real delta to integrate.
    if (lastTime === 0) {
      lastTime = now;
      rafId = requestAnimationFrame(tick);
      return;
    }

    let dt = (now - lastTime) / 1000;
    lastTime = now;
    if (dt > 0.05) dt = 0.05; // clamp jumps after the tab was backgrounded

    // Read dimensions fresh each frame so the snake self-clamps after a resize.
    const w = el.width;
    const h = el.height;

    // Wander the heading via a random-walking (capped) turn rate, then re-derive
    // velocity so speed stays constant. This yields smooth, curvy deflection.
    turnRate += (Math.random() - 0.5) * TURN_ACCEL * dt;
    turnRate -= turnRate * TURN_DAMP * dt; // mean-revert toward straight
    if (turnRate > MAX_TURN) turnRate = MAX_TURN;
    else if (turnRate < -MAX_TURN) turnRate = -MAX_TURN;
    angle += turnRate * dt;
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;

    const prevX = x;
    const prevY = y;
    x += vx * dt;
    y += vy * dt;

    // Bounce: clamp inside [radius, size-radius] then reflect the component.
    let bounced = false;
    if (x < radius) {
      x = radius;
      vx = Math.abs(vx);
      bounced = true;
    } else if (x > w - radius) {
      x = w - radius;
      vx = -Math.abs(vx);
      bounced = true;
    }
    if (y < radius) {
      y = radius;
      vy = Math.abs(vy);
      bounced = true;
    } else if (y > h - radius) {
      y = h - radius;
      vy = -Math.abs(vy);
      bounced = true;
    }
    if (bounced) {
      // Resync heading from the reflected velocity, with a random kick and a
      // fresh turn rate so it doesn't hug the wall or fall into a loop.
      angle = Math.atan2(vy, vx) + (Math.random() - 0.5) * 0.6;
      turnRate = (Math.random() - 0.5) * MAX_TURN;
    }

    canvas.drawSnakeSegment(prevX, prevY, x, y, lineWidth);
    canvas.drawSnakePointer(x, y, radius);

    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (isRunning.value) return;
    const canvas = canvasComponent.value;
    const el = canvas?.canvasRef;
    if (!canvas || !el) return;

    const dpr = window.devicePixelRatio || 1;
    speed = SPEED_CSS * dpr;
    // Initialize the snake's line width from the currently selected brush size.
    lineWidth = Math.max(1, canvas.brushSize || 12);
    radius = Math.max(10 * dpr, lineWidth / 2);
    x = el.width / 2;
    y = el.height / 2;
    angle = Math.random() * Math.PI * 2;
    turnRate = (Math.random() - 0.5) * MAX_TURN;
    lastTime = 0;

    canvas.beginSnakeRun(); // single history snapshot → one undo step per run
    canvas.setSnakeActive(true);
    isRunning.value = true;
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastTime = 0;
    const canvas = canvasComponent.value;
    if (canvas) {
      canvas.clearSnakeOverlay();
      canvas.setSnakeActive(false);
      canvas.endSnakeRun();
    }
    isRunning.value = false;
  }

  function toggle() {
    if (isRunning.value) stop();
    else start();
  }

  return { isRunning, start, stop, toggle };
}
