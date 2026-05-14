// 网格背景渲染 — 模拟实验台网格

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pixelPerUnit: number = 100
): void {
  const w = width;
  const h = height;

  // Major grid lines
  ctx.strokeStyle = "rgba(56, 189, 248, 0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let x = 0; x <= w; x += pixelPerUnit) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = 0; y <= h; y += pixelPerUnit) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  // Minor grid lines (sub-grid)
  const minorStep = pixelPerUnit / 5;
  ctx.strokeStyle = "rgba(56, 189, 248, 0.04)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();

  for (let x = 0; x <= w; x += minorStep) {
    if (x % pixelPerUnit === 0) continue;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = 0; y <= h; y += minorStep) {
    if (y % pixelPerUnit === 0) continue;
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
}

// Draw a horizontal track line (轨道)
export function drawTrack(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y: number,
  x2: number,
  color: string = "rgba(56, 189, 248, 0.5)"
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();

  // Track ticks (刻度)
  ctx.strokeStyle = "rgba(56, 189, 248, 0.2)";
  ctx.lineWidth = 1;
  const tickInterval = 50; // every 50 px
  for (let x = x1; x <= x2; x += tickInterval) {
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x, y + 6);
    ctx.stroke();
  }
}

// Draw arrow (速度矢量)
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  lineWidth: number = 3
): void {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return;

  const ux = dx / len;
  const uy = dy / len;

  const headLen = Math.min(14, len * 0.4);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";

  // Shaft
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX - ux * headLen * 0.6, toY - uy * headLen * 0.6);
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - ux * headLen + uy * headLen * 0.4,
    toY - uy * headLen - ux * headLen * 0.4
  );
  ctx.lineTo(
    toX - ux * headLen - uy * headLen * 0.4,
    toY - uy * headLen + ux * headLen * 0.4
  );
  ctx.closePath();
  ctx.fill();
}
