"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "首页" },
  { href: "/collision", label: "碰撞实验" },
  { href: "/impulse", label: "冲量实验" },
  { href: "/recoil", label: "反冲实验" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="glass border-b border-white/5 px-4 py-2.5 flex items-center gap-1 shrink-0">
      <Link
        href="/"
        className="text-sm font-bold text-accent mr-3 hover:brightness-125 transition-all"
      >
        物理实验室
      </Link>
      {links.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              active
                ? "bg-accent/20 text-accent font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
