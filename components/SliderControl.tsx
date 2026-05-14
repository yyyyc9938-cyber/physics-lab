"use client";

// 触摸友好的参数滑块组件
// 大触控区域，适配希沃白板

interface SliderControlProps {
  label: string;
  unit?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  color?: string;
}

export default function SliderControl({
  label,
  unit,
  min,
  max,
  step,
  value,
  onChange,
  color = "#38bdf8",
}: SliderControlProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full min-w-[200px]">
      <div className="flex justify-between items-baseline">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-base font-mono font-semibold" style={{ color }}>
          {value.toFixed(step < 1 ? 1 : 0)}
          {unit && (
            <span className="text-xs text-slate-500 ml-0.5">{unit}</span>
          )}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-8 appearance-none rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900"
        style={{
          background: `linear-gradient(to right, ${color}33, ${color} ${((value - min) / (max - min)) * 100}%, #334155 ${((value - min) / (max - min)) * 100}%)`,
          "--thumb-bg": color,
        } as React.CSSProperties}
      />
    </div>
  );
}
