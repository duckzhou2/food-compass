export interface RandomPick<T> {
  item: T;
  index: number;
}

export function pickRandom<T>(items: readonly T[], random: () => number = Math.random): RandomPick<T> | null {
  if (items.length === 0) return null;
  const sample = Math.min(Math.max(random(), 0), 0.9999999999999999);
  const index = Math.floor(sample * items.length);
  return { item: items[index], index };
}
