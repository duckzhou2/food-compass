import { describe, expect, it } from "vitest";
import { pickRandom } from "@/lib/random/pick-random";

describe("随机选择", () => {
  it("空集合返回 null", () => {
    expect(pickRandom([])).toBeNull();
  });

  it("单元素集合始终返回该元素", () => {
    expect(pickRandom(["唯一候选"], () => 0.99)).toEqual({ item: "唯一候选", index: 0 });
  });

  it("只返回候选集合中的对应索引", () => {
    const candidates = ["a", "b", "c", "d"];
    expect(pickRandom(candidates, () => 0.51)).toEqual({ item: "c", index: 2 });
  });

  it("保护随机源的边界值", () => {
    expect(pickRandom(["a", "b"], () => 1)?.item).toBe("b");
    expect(pickRandom(["a", "b"], () => -1)?.item).toBe("a");
  });
});
