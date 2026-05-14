"use client";

// 猜想模式 — 让学生先预测碰撞结果，再揭晓答案
// 增强课堂参与感

export type PredictionPhase = "setup" | "predicting" | "revealed";

interface PredictionModeProps {
  phase: PredictionPhase;
  onStartPredict: () => void;
  onReveal: () => void;
  onReset: () => void;
}

export default function PredictionMode({
  phase,
  onStartPredict,
  onReveal,
  onReset,
}: PredictionModeProps) {
  return (
    <div className="glass rounded-xl p-4 flex flex-col items-center gap-3 min-w-[200px]">
      <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
        猜想模式
      </div>

      {phase === "setup" && (
        <>
          <div className="text-4xl">🤔</div>
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            设置好参数后，
            <br />
            请学生猜想碰撞结果
          </p>
          <button
            onClick={onStartPredict}
            className="px-5 py-2 bg-accent/20 border border-accent/40 rounded-lg text-sm font-semibold text-accent hover:bg-accent/30 transition-all active:scale-95"
          >
            开始猜想
          </button>
        </>
      )}

      {phase === "predicting" && (
        <>
          <div className="relative">
            <span className="text-5xl">❓</span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-highlight rounded-full animate-ping" />
          </div>
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            碰撞后速度是多少？
            <br />
            学生回答后揭晓答案
          </p>
          <button
            onClick={onReveal}
            className="px-5 py-2 bg-highlight/20 border border-highlight/40 rounded-lg text-sm font-semibold text-highlight hover:bg-highlight/30 transition-all active:scale-95 glow-highlight"
          >
            揭晓答案
          </button>
        </>
      )}

      {phase === "revealed" && (
        <>
          <div className="text-4xl">✨</div>
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            结果已展示
          </p>
          <div className="flex gap-2">
            <button
              onClick={onReset}
              className="px-4 py-1.5 bg-white/10 border border-white/15 rounded-lg text-xs font-semibold text-slate-300 hover:bg-white/15 transition-all active:scale-95"
            >
              重新猜想
            </button>
          </div>
        </>
      )}
    </div>
  );
}
