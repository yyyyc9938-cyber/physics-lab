"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import SliderControl from "@/components/SliderControl";
import ControlPanel from "@/components/ControlPanel";
import ZoomControls from "@/components/ZoomControls";
import DataPanel from "@/components/DataPanel";
import PredictionMode, { PredictionPhase } from "@/components/PredictionMode";
import {
  computeCollision,
  CollisionType,
  CollisionResult,
} from "@/lib/physics/collision";
import {
  createCamera,
  zoomAt,
  pan,
  resetCamera,
  applyCamera,
  restoreCamera,
  CameraState,
} from "@/lib/engine/camera";
import { drawGrid, drawTrack, drawArrow } from "@/lib/engine/grid";
import {
  spawnCollisionBurst,
  spawnTrail,
  updateParticles,
  drawParticles,
  clearParticles,
} from "@/lib/engine/particles";

// ---- constants ----
const CANVAS_W = 1400;
const CANVAS_H = 800;
const TRACK_Y = 500; // track height on canvas
const PX_PER_METER = 120; // pixels per meter

// ---- defaults ----
const DEFAULT_M1 = 2;
const DEFAULT_M2 = 1;
const DEFAULT_V1 = 3;
const DEFAULT_V2 = 0;

export default function CollisionLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // state
  const [m1, setM1] = useState(DEFAULT_M1);
  const [m2, setM2] = useState(DEFAULT_M2);
  const [v1, setV1] = useState(DEFAULT_V1);
  const [v2, setV2] = useState(DEFAULT_V2);
  const [collisionType, setCollisionType] = useState<CollisionType>("elastic");
  const [running, setRunning] = useState(false);
  const [camera, setCamera] = useState<CameraState>(createCamera());
  const [result, setResult] = useState<CollisionResult | null>(null);
  const [collisionHappened, setCollisionHappened] = useState(false);
  const [predictionPhase, setPredictionPhase] =
    useState<PredictionPhase>("setup");

  const m1Ref = useRef(m1);
  const m2Ref = useRef(m2);
  const v1Ref = useRef(v1);
  const v2Ref = useRef(v2);
  const collisionTypeRef = useRef(collisionType);
  const runningRef = useRef(running);
  const cameraRef = useRef(camera);
  const collisionHappenedRef = useRef(collisionHappened);
  const resultRef = useRef(result);
  const predictionPhaseRef = useRef(predictionPhase);

  // sync refs
  useEffect(() => { m1Ref.current = m1; }, [m1]);
  useEffect(() => { m2Ref.current = m2; }, [m2]);
  useEffect(() => { v1Ref.current = v1; }, [v1]);
  useEffect(() => { v2Ref.current = v2; }, [v2]);
  useEffect(() => { collisionTypeRef.current = collisionType; }, [collisionType]);
  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { cameraRef.current = camera; }, [camera]);
  useEffect(() => { collisionHappenedRef.current = collisionHappened; }, [collisionHappened]);
  useEffect(() => { resultRef.current = result; }, [result]);
  useEffect(() => { predictionPhaseRef.current = predictionPhase; }, [predictionPhase]);

  const pxToM = (px: number) => (px - CANVAS_W / 2) / PX_PER_METER;
  const mToPx = (m: number) => CANVAS_W / 2 + m * PX_PER_METER;
  const radiusFromMass = (mass: number) => 20 + mass * 8;

  // compute collision when running starts
  const startSimulation = useCallback(() => {
    if (predictionPhase === "setup") return;

    const b1 = {
      mass: m1Ref.current,
      x: -3,
      v: v1Ref.current,
      radius: radiusFromMass(m1Ref.current),
    };
    const b2 = {
      mass: m2Ref.current,
      x: 3,
      v: v2Ref.current,
      radius: radiusFromMass(m2Ref.current),
    };

    const res = computeCollision(b1, b2, collisionTypeRef.current);
    setResult(res);
    setCollisionHappened(false);
    setRunning(true);
    setPredictionPhase("revealed");
  }, [predictionPhase]);

  // ---- canvas render loop ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = performance.now();
    // simulation state (mutable for animation)
    let simTime = 0;
    let b1x = -3; // meters
    let b2x = 3;
    let b1v = v1Ref.current;
    let b2v = v2Ref.current;
    let simCollisionHappened = false;
    let simResult: CollisionResult | null = null;

    const resetSim = () => {
      simTime = 0;
      b1x = -3;
      b2x = 3;
      b1v = v1Ref.current;
      b2v = v2Ref.current;
      simCollisionHappened = false;
      simResult = null;
      clearParticles();
    };

    const frame = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05); // cap dt
      lastTime = now;

      const cam = cameraRef.current;
      const isRunning = runningRef.current;

      // physics update
      if (isRunning) {
        const speedLimit = PX_PER_METER * 2;
        simTime += dt;

        const colX = 0; // collision point in meters
        const r1m = radiusFromMass(m1Ref.current) / PX_PER_METER;
        const r2m = radiusFromMass(m2Ref.current) / PX_PER_METER;

        b1x += b1v * dt;
        b2x += b2v * dt;

        // collision detection
        if (!simCollisionHappened && b1x + r1m >= b2x - r2m) {
          // back up to exact collision point
          const overlap = b1x + r1m - (b2x - r2m);
          const relV = b2v - b1v;
          if (relV < 0) {
            const backDt = overlap / Math.abs(relV || 0.01);
            b1x -= b1v * backDt;
            b2x -= b2v * backDt;

            const b1 = {
              mass: m1Ref.current,
              x: b1x,
              v: b1v,
              radius: radiusFromMass(m1Ref.current),
            };
            const b2 = {
              mass: m2Ref.current,
              x: b2x,
              v: b2v,
              radius: radiusFromMass(m2Ref.current),
            };

            simResult = computeCollision(b1, b2, collisionTypeRef.current);
            b1v = simResult.v1After;
            b2v = simResult.v2After;
            simCollisionHappened = true;

            // spawn particles at collision
            const colPx = mToPx(0);
            spawnCollisionBurst(colPx, TRACK_Y, 50, 5);
          }
        }

        // edge bounds
        const leftEdge = -CANVAS_W / 2 / PX_PER_METER;
        const rightEdge = CANVAS_W / 2 / PX_PER_METER;
        if (b1x - r1m < leftEdge) { b1x = leftEdge + r1m; b1v = Math.abs(b1v); }
        if (b1x + r1m > rightEdge) { b1x = rightEdge - r1m; b1v = -Math.abs(b1v); }
        if (b2x - r2m < leftEdge) { b2x = leftEdge + r2m; b2v = Math.abs(b2v); }
        if (b2x + r2m > rightEdge) { b2x = rightEdge - r2m; b2v = -Math.abs(b2v); }

        // update react state (throttled)
        if (simCollisionHappened && !collisionHappenedRef.current && simResult) {
          setCollisionHappened(true);
          setResult(simResult);
        }

        updateParticles(dt);
      }

      // ---- start rendering ----
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // background
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, w, h);

      applyCamera(ctx, cam);

      // grid
      drawGrid(ctx, CANVAS_W, CANVAS_H, PX_PER_METER);

      // track
      drawTrack(ctx, mToPx(-5), TRACK_Y, mToPx(5), "rgba(56, 189, 248, 0.4)");

      // draw balls
      const drawBall = (
        xM: number,
        mass: number,
        color: string
      ) => {
        const px = mToPx(xM);
        const py = TRACK_Y;
        const r = radiusFromMass(mass);

        // glow
        const glow = ctx.createRadialGradient(px, py, r * 0.5, px, py, r * 2.5);
        glow.addColorStop(0, `${color}40`);
        glow.addColorStop(0.5, `${color}10`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // body
        const bodyGrad = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, r * 0.1, px, py, r);
        bodyGrad.addColorStop(0, `${color}cc`);
        bodyGrad.addColorStop(0.7, `${color}66`);
        bodyGrad.addColorStop(1, `${color}22`);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();

        // border
        ctx.strokeStyle = `${color}99`;
        ctx.lineWidth = 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // center label
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.max(12, r * 0.6)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${mass.toFixed(0)}kg`, px, py);
      };

      // velocity arrows
      const drawVelArrow = (xM: number, v: number, mass: number, color: string) => {
        const px = mToPx(xM);
        const py = TRACK_Y - radiusFromMass(mass) - 20;
        const arrowLen = v * PX_PER_METER * 0.8;
        drawArrow(ctx, px, py, px + arrowLen, py, color, 3);

        // label
        ctx.fillStyle = color;
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(`v=${v.toFixed(1)} m/s`, px + arrowLen / 2, py - 8);
      };

      // predict mode: show ? if not yet running
      if (!isRunning && predictionPhaseRef.current === "predicting") {
        drawBall(-3, m1Ref.current, "#38bdf8");
        drawBall(3, m2Ref.current, "#fb923c");
        drawVelArrow(-3, v1Ref.current, m1Ref.current, "#38bdf8");
        drawVelArrow(3, v2Ref.current, m2Ref.current, "#fb923c");

        // question mark between balls
        const qmX = mToPx(0);
        const qmY = TRACK_Y;
        ctx.fillStyle = "#fb923c";
        ctx.font = "bold 48px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", qmX, qmY);
      } else {
        // normal rendering
        drawBall(b1x, m1Ref.current, "#38bdf8");
        drawBall(b2x, m2Ref.current, "#fb923c");
        drawVelArrow(b1x, b1v, m1Ref.current, "#38bdf8");
        drawVelArrow(b2x, b2v, m2Ref.current, "#fb923c");

        if (isRunning) {
          spawnTrail(mToPx(b1x), TRACK_Y, "#38bdf8");
          spawnTrail(mToPx(b2x), TRACK_Y, "#fb923c");
        }
      }

      // particles
      drawParticles(ctx);

      restoreCamera(ctx);

      // collision point flash indicator (screen coords)
      if (simCollisionHappened && simTime < 1.5) {
        const flashPx = mToPx(0) * cam.scale + cam.offsetX;
        const flashPy = TRACK_Y * cam.scale + cam.offsetY;
        const alpha = Math.max(0, 1 - simTime / 1.5);
        ctx.strokeStyle = `rgba(251, 146, 60, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = `rgba(251, 146, 60, ${alpha})`;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(flashPx, flashPy, 30 * cam.scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animRef.current = requestAnimationFrame(frame);
    };

    resetSim();
    animRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // restart / reset
  const handleReset = () => {
    setRunning(false);
    setCollisionHappened(false);
    setResult(null);
    setPredictionPhase("setup");
    clearParticles();
  };

  const handleStartPredict = () => {
    setPredictionPhase("predicting");
  };

  // zoom handlers
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

  // mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setCamera((c) => zoomAt(c, c.scale + delta, cx, cy));
    },
    []
  );

  // collision type label
  const collisionTypeLabel = {
    elastic: "弹性碰撞",
    "perfectly-inelastic": "完全非弹性碰撞",
    custom: "自定义恢复系数",
  };

  // data panel rows
  const dataPanelRows = () => {
    const rows: Array<{
      label: string;
      value: string;
      unit: string;
      color?: string;
      highlight?: boolean;
    }> = [
      { label: "碰撞前总动量", value: (m1 * v1 + m2 * v2).toFixed(2), unit: "kg·m/s", color: "#38bdf8", highlight: true },
    ];

    if (result) {
      rows.push(
        { label: "碰撞后总动量", value: result.pTotal.toFixed(2), unit: "kg·m/s", color: "#38bdf8", highlight: true },
        { label: "碰撞前总动能", value: result.keTotalBefore.toFixed(2), unit: "J" },
        { label: "碰撞后总动能", value: result.keTotalAfter.toFixed(2), unit: "J" },
      );
      if (result.keLoss > 0.001) {
        rows.push({
          label: "动能损失",
          value: result.keLoss.toFixed(2),
          unit: `J (${result.keLossPercent.toFixed(1)}%)`,
          color: "#fb923c",
        });
      }
    }

    return rows;
  };

  return (
    <div className="h-full flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden relative">
        {/* Canvas area */}
        <div className="flex-1 relative" onWheel={handleWheel}>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full h-full block"
            style={{ touchAction: "none" }}
          />

          {/* Top-left data overlay */}
          <div className="absolute top-4 left-4">
            <DataPanel title={collisionTypeLabel[collisionType]} rows={dataPanelRows()} />
          </div>

          {/* Bottom-right zoom controls */}
          <div className="absolute bottom-4 right-4">
            <ZoomControls
              scale={camera.scale}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onReset={handleZoomReset}
            />
          </div>

          {/* Prediction mode overlay (center bottom) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <PredictionMode
              phase={predictionPhase}
              onStartPredict={handleStartPredict}
              onReveal={startSimulation}
              onReset={handleReset}
            />
          </div>
        </div>

        {/* Right control panel */}
        <div className="w-[320px] shrink-0 overflow-y-auto border-l border-white/5 p-4 flex flex-col gap-4 bg-[#0c1627]">
          <ControlPanel title="⚙️ 参数设置">
            <SliderControl
              label="质量 m₁"
              unit="kg"
              min={0.5}
              max={5}
              step={0.1}
              value={m1}
              onChange={setM1}
              color="#38bdf8"
            />
            <SliderControl
              label="质量 m₂"
              unit="kg"
              min={0.5}
              max={5}
              step={0.1}
              value={m2}
              onChange={setM2}
              color="#fb923c"
            />
            <SliderControl
              label="初速度 v₁"
              unit="m/s"
              min={-5}
              max={5}
              step={0.1}
              value={v1}
              onChange={setV1}
              color="#38bdf8"
            />
            <SliderControl
              label="初速度 v₂"
              unit="m/s"
              min={-5}
              max={5}
              step={0.1}
              value={v2}
              onChange={setV2}
              color="#fb923c"
            />
          </ControlPanel>

          <ControlPanel title="🔬 碰撞类型">
            <div className="flex flex-col gap-2">
              {(
                [
                  ["elastic", "弹性碰撞"],
                  ["perfectly-inelastic", "完全非弹性碰撞"],
                ] as [CollisionType, string][]
              ).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => {
                    setCollisionType(type);
                    handleReset();
                  }}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                    collisionType === type
                      ? "bg-accent/20 border border-accent/40 text-accent"
                      : "bg-white/5 border border-transparent text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </ControlPanel>

          <ControlPanel title="📘 公式">
            <div className="text-xs text-slate-400 leading-relaxed space-y-2">
              <p>
                <span className="text-accent">弹性碰撞</span>
                <br />
                v₁&apos; = (m₁-m₂)v₁/(m₁+m₂) + 2m₂v₂/(m₁+m₂)
                <br />
                v₂&apos; = 2m₁v₁/(m₁+m₂) + (m₂-m₁)v₂/(m₁+m₂)
              </p>
              <p>
                <span className="text-highlight">完全非弹性碰撞</span>
                <br />
                v&apos; = (m₁v₁+m₂v₂)/(m₁+m₂)
              </p>
              <p className="text-accent font-semibold">
                动量守恒：m₁v₁+m₂v₂ = m₁v₁&apos;+m₂v₂&apos;
              </p>
            </div>
          </ControlPanel>
        </div>
      </div>
    </div>
  );
}
