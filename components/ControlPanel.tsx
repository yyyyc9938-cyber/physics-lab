"use client";

import { ReactNode, useState } from "react";

interface ControlPanelProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

export default function ControlPanel({
  title,
  children,
  defaultExpanded = true,
}: ControlPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="glass rounded-2xl overflow-hidden glow-accent">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3 flex items-center justify-between text-sm font-semibold text-slate-200 hover:bg-white/5 transition-colors"
      >
        <span>{title}</span>
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          expanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 pb-4 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}
