// 碰撞物理引擎
// 弹性碰撞 / 完全非弹性碰撞 / 自定义恢复系数

export type CollisionType = "elastic" | "perfectly-inelastic" | "custom";

export interface BallState {
  mass: number;      // kg
  x: number;         // position (m)
  v: number;         // velocity (m/s), positive = right
  radius: number;    // display radius (proportional to mass^(1/3))
}

export interface CollisionResult {
  v1After: number;
  v2After: number;
  pTotal: number;       // total momentum (should be conserved)
  keTotalBefore: number;
  keTotalAfter: number;
  keLoss: number;
  keLossPercent: number;
}

// Calculate collision outcome
export function computeCollision(
  b1: BallState,
  b2: BallState,
  type: CollisionType,
  restitution: number = 1.0
): CollisionResult {
  const { mass: m1, v: v1 } = b1;
  const { mass: m2, v: v2 } = b2;

  const pTotal = m1 * v1 + m2 * v2;
  const keBefore = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;

  let v1After: number;
  let v2After: number;

  if (type === "perfectly-inelastic") {
    // Perfectly inelastic: stick together
    const vCommon = pTotal / (m1 + m2);
    v1After = vCommon;
    v2After = vCommon;
  } else {
    // Elastic or custom restitution
    const e = type === "elastic" ? 1.0 : clampRestitution(restitution);

    // Standard 1D collision formulas
    v1After = (m1 * v1 + m2 * v2 + m2 * e * (v2 - v1)) / (m1 + m2);
    v2After = (m1 * v1 + m2 * v2 + m1 * e * (v1 - v2)) / (m1 + m2);
  }

  const keAfter = 0.5 * m1 * v1After * v1After + 0.5 * m2 * v2After * v2After;
  const keLoss = keBefore - keAfter;

  return {
    v1After,
    v2After,
    pTotal,
    keTotalBefore: keBefore,
    keTotalAfter: keAfter,
    keLoss,
    keLossPercent: keBefore > 0 ? (keLoss / keBefore) * 100 : 0,
  };
}

function clampRestitution(e: number): number {
  return Math.max(0, Math.min(1, e));
}

// Momentum = mass * velocity
export function momentum(mass: number, velocity: number): number {
  return mass * velocity;
}

// Kinetic energy
export function kineticEnergy(mass: number, velocity: number): number {
  return 0.5 * mass * velocity * velocity;
}
