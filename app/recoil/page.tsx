"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import SliderControl from "@/components/SliderControl";
import ControlPanel from "@/components/ControlPanel";
import ZoomControls from "@/components/ZoomControls";
import DataPanel from "@/components/DataPanel";
import {
  createCamera,
  zoomAt,
  resetCamera,
  applyCamera,
  restoreCamera,
  CameraState,
} from "@/lib/engine/camera";
import { drawGrid } from "@/lib/engine/grid";

const CANVAS_W = 1400;
const CANVAS_H = 800;

export default function RecoilLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [m1, setM1] = useState(1);
  const [m2, setM2] = useState(3);
  const [running, setRunning] = useState(false);
  const [camera, setCamera] = useState<CameraState>(createCamera());

  const runningRef = useRef(running);
  const m1Ref = useRef(m1);
  const m2Ref = useRef(m2);
  const cameraRef = useRef(camera);

  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { m1Ref.current = m1; }, [m1]);
  useEffect(() => { m2Ref.current = m2; }, [m2]);
  useEffect(() => { cameraRef.current = camera; }, [camera]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animTime = 0;
    let lastTime = performance.now();
    const springForce = 300; // constant spring push force

    const frame = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const cam = cameraRef.current;

      if (runningRef.current) {
        animTime += dt;
        if (animTime > 2.5) {
          setRunning(false);
          animTime = 0;
        }
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, w, h);

      applyCamera(ctx, cam);
      drawGrid(ctx, CANVAS_W, CANVAS_H, 100);

      const centerX = CANVAS_W / 2;
      const trackY = 400;
      const trackLen = 550;

      // Track
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - trackLen, trackY);
      ctx.lineTo(centerX + trackLen, trackY);
      ctx.stroke();

      // Tick marks
      for (let i = -5; i <= 5; i++) {
        const x = centerX + i * 100;
        ctx.strokeStyle = "rgba(56, 189, 248, 0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, trackY - 6);
        ctx.lineTo(x, trackY + 6);
        ctx.stroke();
      }

      // Spring at center
      const springX = centerX;
      const springY = trackY;
      const springWidth = 60;
      const coils = 8;

      // Physics: recoil velocities (momentum conservation)
      // p1 + p2 = 0 → m1*v1 = -m2*v2 → v2 = -v1*m1/m2
      // Energy from spring: 1/2*k*x^2 = 1/2*m1*v1^2 + 1/2*m2*v2^2
      // Using constant force approximation for simplicity
      const pushTime = 0.15;
      const activeTime = Math.min(animTime, pushTime);
      const a1 = springForce / m1Ref.current;
      const a2 = springForce / m2Ref.current;
      const v1Final = a1 * pushTime;
      const v2Final = a2 * pushTime;

      const b1V = runningRef.current ? (activeTime / pushTime) * v1Final : 0;
      const b2V = runningRef.current ? (activeTime / pushTime) * v2Final : 0;
      const b1X = centerX - springWidth / 2 - 30 - (runningRef.current ? a1 * activeTime * activeTime * 2 : 0);
      const b2X = centerX + springWidth / 2 + 30 + (runningRef.current ? a2 * activeTime * activeTime * 2 : 0);

      // Draw spring
      const springLeft = Math.min(b1X + 35, centerX - springWidth / 2);
      const springRight = Math.max(b2X - 35, centerX + springWidth / 2);
      ctx.strokeStyle = "rgba(251, 146, 60, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const springSpan = springRight - springLeft;
      const coilHeight = 12;
      ctx.moveTo(springLeft, springY);
      for (let i = 0; i < coils * 2; i++) {
        const x = springLeft + (springSpan / (coils * 2)) * (i + 0.5);
        const y = springY + (i % 2 === 0 ? -coilHeight : coilHeight);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(springRight, springY);
      ctx.stroke();

      // Draw ball 1
      const r1 = 20 + m1Ref.current * 6;
      const drawBall = (x: number, y: number, r: number, color: string, label: string) => {
        const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2);
        glow.addColorStop(0, `${color}30`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 2, 0, Math.PI * 2);
        ctx.fill();

        const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
        grad.addColorStop(0, `${color}cc`);
        grad.addColorStop(0.7, `${color}66`);
        grad.addColorStop(1, `${color}22`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `${color}99`;
        ctx.lineWidth = 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.max(11, r * 0.55)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, x, y);
      };

      drawBall(b1X, trackY, r1, "#38bdf8", `${m1Ref.current}kg`);
      drawBall(b2X, trackY, 20 + m2Ref.current * 6, "#a78bfa", `${m2Ref.current}kg`);

      // Velocity vectors
      if (runningRef.current) {
        const drawArrow = (fromX: number, y: number, dir: number, color: string) => {
          const len = 80 * Math.min(1, activeTime / pushTime);
          const toX = fromX + dir * len;
          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(fromX, y - r1 - 15);
          ctx.lineTo(toX, y - r1 - 15);
          ctx.stroke();
          // arrowhead
          ctx.beginPath();
          ctx.moveTo(toX, y - r1 - 15);
          ctx.lineTo(toX - dir * 12, y - r1 - 22);
          ctx.lineTo(toX - dir * 12, y - r1 - 8);
          ctx.closePath();
          ctx.fill();
        };

        drawArrow(b1X, trackY, -1, "#38bdf8");
        drawArrow(b2X, trackY, 1, "#a78bfa");
      }

      // Momentum bar chart
      const barY = 160;
      const barH = 100;
      const barW = 60;
      const barCenterX = centerX;
      const maxMomentum = Math.max(
        Math.abs(m1Ref.current * v1Final),
        Math.abs(m2Ref.current * v2Final),
        1
      ) * 1.2;

      const p1 = runningRef.current ? m1Ref.current * b1V : 0;
      const p2 = runningRef.current ? m2Ref.current * b2V : 0;
      const pTotal = p2 - p1; // p1 goes left (negative convention)

      const p1Px = (Math.abs(p1) / maxMomentum) * barH;
      const p2Px = (p2 / maxMomentum) * barH;

      // P1 bar (left)
      ctx.fillStyle = "rgba(56, 189, 248, 0.3)";
      ctx.fillRect(barCenterX - barW - 20, barY + barH - p1Px, barW, p1Px);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.strokeRect(barCenterX - barW - 20, barY + barH - p1Px, barW, p1Px);
      ctx.fillStyle = "#38bdf8";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`p₁=${p1.toFixed(1)}`, barCenterX - barW / 2 - 20, barY + barH - p1Px - 8);
      ctx.fillText("← m₁", barCenterX - barW / 2 - 20, barY + barH + 20);

      // P2 bar (right)
      ctx.fillStyle = "rgba(168, 139, 250, 0.3)";
      ctx.fillRect(barCenterX + 20, barY + barH - p2Px, barW, p2Px);
      ctx.strokeStyle = "#a78bfa";
      ctx.lineWidth = 2;
      ctx.strokeRect(barCenterX + 20, barY + barH - p2Px, barW, p2Px);
      ctx.fillStyle = "#a78bfa";
      ctx.fillText(`p₂=${p2.toFixed(1)}`, barCenterX + 20 + barW / 2, barY + barH - p2Px - 8);
      ctx.fillText("m₂ →", barCenterX + 20 + barW / 2, barY + barH + 20);

      // Total momentum
      ctx.fillStyle = "#fb923c";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(
        `总动量 = ${pTotal.toFixed(2)} kg·m/s ≈ 0`,
        barCenterX,
        barY + barH + 50
      );

      restoreCamera(ctx);
      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
    return () => {};
  }, []);

  const handleStart = () => {
    setRunning(false);
    setTimeout(() => setRunning(true), 50);
  };

  const handleZoomIn = () => setCamera((c) => {
    const canvas = canvasRef.current;
    const w = canvas ? canvas.width / 2 : CANVAS_W / 2;
    const h = canvas ? canvas.height / 2 : CANVAS_H / 2;
    return zoomAt(c, c.scale + 0.15, w, h);
  });
  const handleZoomOut = () => setCamera((c) => {
    const canvas = canvasRef.current;
    const w = canvas ? canvas.width / 2 : CANVAS_W / 2;
    const h = canvas ? canvas.height / 2 : CANVAS_H / 2;
    return zoomAt(c, c.scale - 0.15, w, h);
  });
  const handleZoomReset = () => setCamera(resetCamera());
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setCamera((c) => zoomAt(c, c.scale + delta, e.clientX - rect.left, e.clientY - rect.top));
  }, []);

  const v1 = 300 / m1 * 0.15;
  const v2 = 300 / m2 * 0.15;
  const p = m1 * v1;

  return (
    <div className="h-full flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative" onWheel={handleWheel}>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full h-full block"
            style={{ touchAction: "none" }}
          />

          <div className="absolute top-4 left-4">
            <DataPanel
              title="反冲 · 动量守恒"
              rows={[
                { label: "m₁ 速度", value: v1.toFixed(1), unit: "m/s ←", color: "#38bdf8" },
                { label: "m₂ 速度", value: v2.toFixed(1), unit: "m/s →", color: "#a78bfa" },
                { label: "m₁ 动量", value: p.toFixed(1), unit: "kg·m/s", color: "#38bdf8" },
                { label: "m₂ 动量", value: p.toFixed(1), unit: "kg·m/s", color: "#a78bfa" },
                { label: "总动量", value: "0.00", unit: "kg·m/s", color: "#fb923c", highlight: true },
                { label: "v₁/v₂", value: (v1 / v2).toFixed(2), unit: `≈ m₂/m₁ = ${(m2/m1).toFixed(2)}` },
              ]}
            />
          </div>

          <div className="absolute bottom-4 right-4">
            <ZoomControls
              scale={camera.scale}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onReset={handleZoomReset}
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <button
              onClick={handleStart}
              className="glass rounded-xl px-6 py-3 text-sm font-semibold text-accent border border-accent/30 hover:bg-accent/10 transition-all active:scale-95 glow-accent"
            >
              {running ? "▶▶ 播放中..." : "🔓 释放弹簧"}
            </button>
          </div>
        </div>

        <div className="w-[300px] shrink-0 overflow-y-auto border-l border-white/5 p-4 flex flex-col gap-4 bg-[#0c1627]">
          <ControlPanel title="⚙️ 参数设置">
            <SliderControl label="质量 m₁" unit="kg" min={0.5} max={4} step={0.1} value={m1} onChange={setM1} color="#38bdf8" />
            <SliderControl label="质量 m₂" unit="kg" min={0.5} max={4} step={0.1} value={m2} onChange={setM2} color="#a78bfa" />
          </ControlPanel>

          <ControlPanel title="📘 公式">
            <div className="text-xs text-slate-400 leading-relaxed space-y-2">
              <p className="text-accent font-semibold">
                动量守恒：0 = m₁v₁ + m₂v₂
              </p>
              <p>
                速度反比：v₁/v₂ = m₂/m₁
              </p>
              <p>
                质量越大 → 速度越小
                <br />
                质量越小 → 速度越大
              </p>
            </div>
          </ControlPanel>
        </div>
      </div>
    </div>
  );
}
