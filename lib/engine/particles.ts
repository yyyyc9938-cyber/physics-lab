// 粒子特效系统 — 碰撞闪光 + 拖尾轨迹

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;        // remaining life (0..1)
  maxLife: number;
  radius: number;
  color: string;
}

let particles: Particle[] = [];

// Spawn particles at collision point
export function spawnCollisionBurst(
  x: number,
  y: number,
  count: number = 40,
  power: number = 3
): void {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = power * (0.4 + Math.random() * 1.0);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 0.4 + Math.random() * 0.6,
      radius: 1 + Math.random() * 3,
      color: Math.random() > 0.5 ? "#38bdf8" : "#fb923c",
    });
  }
}

// Spawn trail particle behind moving object
export function spawnTrail(
  x: number,
  y: number,
  color: string = "#38bdf8"
): void {
  if (Math.random() > 0.4) return; // throttle
  particles.push({
    x: x + (Math.random() - 0.5) * 8,
    y: y + (Math.random() - 0.5) * 8,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    life: 1,
    maxLife: 0.3 + Math.random() * 0.4,
    radius: 1 + Math.random() * 2,
    color,
  });
}

// Update and render particles
export function updateParticles(dt: number): void {
  particles = particles.filter((p) => {
    p.life -= dt / p.maxLife;
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;
    return p.life > 0;
  });
}

export function drawParticles(ctx: CanvasRenderingContext2D): void {
  for (const p of particles) {
    const alpha = p.life;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function clearParticles(): void {
  particles = [];
}
