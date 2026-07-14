import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import { ProductResultCard } from "@/components/product-result-card";
import { WheelExperience } from "@/components/wheel-experience";
import { products } from "@/lib/data/products";

afterEach(() => {
  vi.useRealTimers();
});

describe("关键界面", () => {
  it("首页呈现主标题和核心入口", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: /今天喝什么/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /开始转罗盘/ })).toHaveAttribute("href", "/wheel");
  });

  it("结果卡把 null 显示为待核验，并保留来源链接", () => {
    const incomplete = products.find((product) => product.calories_kcal_min === null)!;
    render(<ProductResultCard product={incomplete} />);
    expect(screen.getByText("热量待核验")).toBeInTheDocument();
    expect(screen.getAllByText("待核验").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /查看原始来源/ })).toHaveAttribute("href", incomplete.source_url);
  });

  it("无候选条件显示可恢复的空状态", () => {
    render(<WheelExperience products={products} />);
    fireEvent.change(screen.getByLabelText("关键词"), { target: { value: "不存在的饮品-xyz" } });
    expect(screen.getByText("没有符合条件的饮品")).toBeInTheDocument();
  });

  it("转盘只随机一次并在动画后揭晓结果", () => {
    vi.useFakeTimers();
    const random = vi.spyOn(Math, "random").mockReturnValue(0);
    render(<WheelExperience products={products} />);
    fireEvent.click(screen.getByRole("button", { name: "转一下" }));
    expect(screen.getByRole("button", { name: "转动中" })).toBeDisabled();
    act(() => vi.advanceTimersByTime(2400));
    expect(screen.getByText("罗盘选中了")).toBeInTheDocument();
    expect(random).toHaveBeenCalledTimes(1);
    random.mockRestore();
  });
});
