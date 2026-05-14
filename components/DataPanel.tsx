"use client";

// 实时数据显示面板 — 动量、速度、动能、总动量

interface DataRow {
  label: string;
  value: string;
  unit: string;
  color?: string;
  highlight?: boolean;
}

interface DataPanelProps {
  title: string;
  rows: DataRow[];
}

export default function DataPanel({ title, rows }: DataPanelProps) {
  return (
    <div className="glass rounded-xl p-4 min-w-[180px]">
      <div className="text-xs text-slate-400 font-semibold mb-3 uppercase tracking-wider">
        {title}
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div
            key={i}
            className={`flex justify-between items-baseline ${
              row.highlight
                ? "bg-white/5 -mx-2 px-2 py-1 rounded border border-accent/20"
                : ""
            }`}
          >
            <span className="text-xs text-slate-400">{row.label}</span>
            <span
              className="text-sm font-mono font-semibold"
              style={{ color: row.color || "#e2e8f0" }}
            >
              {row.value}
              <span className="text-[10px] text-slate-500 ml-0.5">
                {row.unit}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
