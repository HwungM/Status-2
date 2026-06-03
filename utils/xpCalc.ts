export function xpToNextLevel(level: number): number {
  // L1→2: 20 XP, each level adds 8 more
  return 20 + (level - 1) * 8
}

export function totalXpForLevel(level: number): number {
  let total = 0
  for (let i = 1; i < level; i++) {
    total += xpToNextLevel(i)
  }
  return total
}

export function getLevelFromXp(totalXp: number): { level: number; xp: number; xpToNext: number } {
  let level = 1
  let remaining = totalXp
  while (true) {
    const needed = xpToNextLevel(level)
    if (remaining < needed) break
    remaining -= needed
    level++
  }
  return { level, xp: remaining, xpToNext: xpToNextLevel(level) }
}
