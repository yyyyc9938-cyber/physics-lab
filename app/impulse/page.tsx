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

export default function ImpulseLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [force, setForce] = useState(5);
  const [duration, setDuration] = useState(0.5);
  const [running, setRunning] = useState(false);
  const [camera, setCamera] = useState<CameraState>(createCamera());

  const runningRef = useRef(running);
  const forceRef = useRef(force);
  const durationRef = useRef(duration);
  const cameraRef = useRef(camera);

  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { forceRef.current = force; }, [force]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { cameraRef.current = camera; }, [camera]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animTime = 0;
    let lastTime = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const cam = cameraRef.current;

      if (runningRef.current) {
        animTime += dt;
        if (animTime > 3) {
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

      // F-t graph area
      const graphX = 200;
      const graphY = 200;
      const graphW = 1000;
      const graphH = 400;
      const fMax = 10;

      // Axes
      ctx.strokeStyle = "rgba(226, 232, 240, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(graphX, graphY);
      ctx.lineTo(graphX, graphY + graphH);
      ctx.lineTo(graphX + graphW, graphY + graphH);
      ctx.stroke();

      // Labels
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("F (N)", graphX - 40, graphY + graphH / 2);
      ctx.fillText("t (s)", graphX + graphW / 2, graphY + graphH + 40);
      ctx.fillText("0", graphX - 15, graphY + graphH + 20);

      // Y-axis ticks
      for (let f = 0; f <= fMax; f += 2) {
        const y = graphY + graphH - (f / fMax) * graphH;
        ctx.strokeStyle = "rgba(226, 232, 240, 0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(graphX, y);
        ctx.lineTo(graphX + graphW, y);
        ctx.stroke();
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "right";
        ctx.fillText(`${f}`, graphX - 8, y + 4);
      }

      // Force curve (constant force rectangle)
      const fPx = (force / fMax) * graphH;
      const tPx = duration * 200; // 1s = 200px

      const drawGraph = () => {
        // Filled area under curve
        ctx.fillStyle = "rgba(251, 146, 60, 0.3)";
        ctx.fillRect(graphX, graphY + graphH - fPx, tPx, fPx);

        // Outline
        ctx.strokeStyle = "#fb923c";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#fb923c";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(graphX, graphY + graphH);
        ctx.lineTo(graphX, graphY + graphH - fPx);
        ctx.lineTo(graphX + tPx, graphY + graphH - fPx);
        ctx.lineTo(graphX + tPx, graphY + graphH);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Impulse label
        const impulse = force * duration;
        ctx.fillStyle = "#fb923c";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          `I = F·Δt = ${impulse.toFixed(1)} N·s`,
          graphX + tPx / 2,
          graphY + graphH - fPx - 16
        );

        // Area label
        ctx.fillText(
          "冲量 (面积)",
          graphX + tPx / 2,
          graphY + graphH - fPx / 2
        );
      };

      drawGraph();

      // Ball animation below
      const ballY = graphY + graphH + 120;
      const ballStartX = graphX + 100;
      const ballRadius = 25;

      // Track
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(graphX, ballY);
      ctx.lineTo(graphX + graphW, ballY);
      ctx.stroke();

      // Ball position (accelerates during force, then constant)
      let ballX = ballStartX;
      const ballMass = 2;
      const ballAccel = force / ballMass;
      const animStart = Math.min(animTime, duration);
      const deltaV = ballAccel * animStart;
      ballX = ballStartX + deltaV * animStart * 60;

      if (animTime > duration) {
        const coastTime = animTime - duration;
        ballX = ballStartX + deltaV * duration * 60 + deltaV * coastTime * 60;
      }

      ballX = Math.min(ballX, graphX + graphW - ballRadius);

      // Ball glow
      const glow = ctx.createRadialGradient(ballX, ballY, ballRadius * 0.5, ballX, ballY, ballRadius * 2.5);
      glow.addColorStop(0, "rgba(56, 189, 248, 0.25)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Ball body
      const ballGrad = ctx.createRadialGradient(ballX - 5, ballY - 5, ballRadius * 0.1, ballX, ballY, ballRadius);
      ballGrad.addColorStop(0, "rgba(56, 189, 248, 0.9)");
      ballGrad.addColorStop(0.7, "rgba(56, 189, 248, 0.5)");
      ballGrad.addColorStop(1, "rgba(56, 189, 248, 0.15)");
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Velocity label
      const currentV = runningRef.current
        ? Math.min(animTime, duration) * (force / 2)
        : 0;
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`v = ${currentV.toFixed(1)} m/s`, ballX, ballY - 40);

      // Momentum change label
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(
        `Δp = ${(2 * currentV).toFixed(1)} kg·m/s`,
        ballX,
        ballY - 60
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

  const impulse = force * duration;
  const deltaP = impulse;
  const deltaV = deltaP / 2; // m = 2kg

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
              title="冲量-动量定理"
              rows={[
                { label: "力 F", value: force.toFixed(1), unit: "N", color: "#fb923c" },
                { label: "持续时间 Δt", value: duration.toFixed(2), unit: "s" },
                { label: "冲量 I = F·Δt", value: impulse.toFixed(1), unit: "N·s", color: "#fb923c", highlight: true },
                { label: "动量变化 Δp", value: deltaP.toFixed(1), unit: "kg·m/s", color: "#38bdf8", highlight: true },
                { label: "速度变化 Δv", value: deltaV.toFixed(1), unit: "m/s" },
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
              {running ? "▶▶ 播放中..." : "▶ 施加冲量"}
            </button>
          </div>
        </div>

        <div className="w-[300px] shrink-0 overflow-y-auto border-l border-white/5 p-4 flex flex-col gap-4 bg-[#0c1627]">
          <ControlPanel title="⚙️ 参数设置">
            <SliderControl label="力 F" unit="N" min={1} max={10} step={0.5} value={force} onChange={setForce} color="#fb923c" />
            <SliderControl label="持续时间 Δt" unit="s" min={0.1} max={1.5} step={0.05} value={duration} onChange={setDuration} />
          </ControlPanel>

          <ControlPanel title="📘 公式">
            <div className="text-xs text-slate-400 leading-relaxed space-y-2">
              <p>
                <span className="text-accent font-semibold">动量定理</span>
                <br />
                F·Δt = Δp = m·Δv
              </p>
              <p>
                冲量 = 力的时间积累
                <br />
                = F-t 图曲线下方面积
              </p>
            </div>
          </ControlPanel>
        </div>
      </div>
    </div>
  );
}
