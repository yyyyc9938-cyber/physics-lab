// 视口缩放/平移系统
// 支持滚轮缩放 + 双指捏合 + 平移

export interface CameraState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 3.0;
const ZOOM_STEP = 0.1;

export function createCamera(
  scale: number = 1,
  offsetX: number = 0,
  offsetY: number = 0
): CameraState {
  return { scale, offsetX, offsetY };
}

export function zoomIn(cam: CameraState, factor: number = ZOOM_STEP): CameraState {
  return { ...cam, scale: Math.min(MAX_SCALE, cam.scale + factor) };
}

export function zoomOut(cam: CameraState, factor: number = ZOOM_STEP): CameraState {
  return { ...cam, scale: Math.max(MIN_SCALE, cam.scale - factor) };
}

export function zoomAt(
  cam: CameraState,
  newScale: number,
  cx: number,
  cy: number
): CameraState {
  const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
  const ratio = clamped / cam.scale;
  return {
    scale: clamped,
    offsetX: cx - (cx - cam.offsetX) * ratio,
    offsetY: cy - (cy - cam.offsetY) * ratio,
  };
}

export function pan(
  cam: CameraState,
  dx: number,
  dy: number
): CameraState {
  return {
    ...cam,
    offsetX: cam.offsetX + dx / cam.scale,
    offsetY: cam.offsetY + dy / cam.scale,
  };
}

export function resetCamera(): CameraState {
  return createCamera(1, 0, 0);
}

// Apply camera transform to canvas context
export function applyCamera(ctx: CanvasRenderingContext2D, cam: CameraState): void {
  ctx.save();
  ctx.translate(cam.offsetX, cam.offsetY);
  ctx.scale(cam.scale, cam.scale);
}

export function restoreCamera(ctx: CanvasRenderingContext2D): void {
  ctx.restore();
}
