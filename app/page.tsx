"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

const chapters = [
  {
    href: "/collision",
    title: "碰撞实验室",
    subtitle: "Collision Lab",
    desc: "弹性碰撞 · 完全非弹性碰撞 · 动量守恒验证",
    icon: "🔵",
    gradient: "from-blue-500/20 to-cyan-500/10",
    border: "border-blue-500/30",
  },
  {
    href: "/impulse",
    title: "冲量实验室",
    subtitle: "Impulse Lab",
    desc: "冲量-动量定理 · F-t 曲线 · 动量变化量",
    icon: "🟠",
    gradient: "from-orange-500/20 to-amber-500/10",
    border: "border-orange-500/30",
  },
  {
    href: "/recoil",
    title: "反冲实验室",
    subtitle: "Recoil Lab",
    desc: "反冲现象 · 动量守恒 · 速度反比关系",
    icon: "🟣",
    gradient: "from-purple-500/20 to-pink-500/10",
    border: "border-purple-500/30",
  },
];

export default function Home() {
  return (
    <div className="h-full flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-100 mb-2 tracking-wide">
            选择性必修一 · 动量守恒定律
          </h1>
          <p className="text-sm text-slate-500">
            交互式物理可视化教学实验室
          </p>
          <div className="mt-3 inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            适用于希沃白板 · 触摸操作 · 可缩放
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl w-full">
          {chapters.map((ch) => (
            <Link
              key={ch.href}
              href={ch.href}
              className={`relative glass rounded-2xl p-6 border ${ch.border} hover:scale-[1.03] active:scale-95 transition-all duration-300 cursor-pointer group overflow-hidden`}
            >
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${ch.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />
              <div className="relative z-10">
                <div className="text-4xl mb-3">{ch.icon}</div>
                <h2 className="text-lg font-bold text-slate-100 mb-1">
                  {ch.title}
                </h2>
                <p className="text-xs text-slate-500 mb-2">{ch.subtitle}</p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {ch.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
