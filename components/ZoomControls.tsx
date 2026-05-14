"use client";

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export default function ZoomControls({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
}: ZoomControlsProps) {
  const pct = Math.round(scale * 100);

  return (
    <div className="glass rounded-xl flex items-center gap-1 p-1">
      <button
        onClick={onZoomOut}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-300 hover:bg-white/10 transition-colors text-xl font-bold select-none"
        title="缩小"
      >
        −
      </button>
      <button
        onClick={onReset}
        className="text-xs text-slate-400 px-2 hover:text-slate-200 transition-colors min-w-[48px] text-center"
        title="双击重置"
      >
        {pct}%
      </button>
      <button
        onClick={onZoomIn}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-300 hover:bg-white/10 transition-colors text-xl font-bold select-none"
        title="放大"
      >
        +
      </button>
    </div>
  );
}
