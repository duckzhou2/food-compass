import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import { BackToTopButton } from "@/components/back-to-top-button";
import { ProductResultCard } from "@/components/product-result-card";
import { WheelExperience } from "@/components/wheel-experience";
import { MealExperience } from "@/components/meal-experience";
import { CanteenExperience } from "@/components/canteen-experience";
import { getMilkTeaBrand, milkTeaProducts } from "@/lib/data/milk-tea";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe("关键界面", () => {
  it("首页呈现主标题和核心入口", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1, name: /今天吃什么/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /开始选一顿/ })).toHaveAttribute("href", "/meals");
    expect(screen.getByRole("link", { name: /去选一杯/ })).toHaveAttribute("href", "/wheel");
    expect(screen.getByRole("link", { name: /去逛食堂/ })).toHaveAttribute("href", "/canteens");
  });

  it("北大食堂支持搜索、菜品详情和筛选后的随机", async () => {
    render(<CanteenExperience />);
    expect(screen.getByRole("heading", { level: 1, name: "北大食堂" })).toBeInTheDocument();
    expect(screen.queryByText("数据状态")).not.toBeInTheDocument();
    expect(screen.queryByText("窗口信息")).not.toBeInTheDocument();
    expect(screen.queryByText("资料范围")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("搜索食堂、窗口或菜品"), { target: { value: "襄阳牛肉面" } });
    fireEvent.click(screen.getByRole("button", { name: "菜品浏览" }));
    const detail = await screen.findByRole("button", { name: "查看菜品详情" });
    fireEvent.click(detail);
    expect(screen.getByRole("dialog", { name: "襄阳牛肉面详情" })).toBeInTheDocument();
  });

  it("北大食堂按食堂、窗口、菜品逐级确认", () => {
    const random = vi.spyOn(Math, "random").mockReturnValue(0);
    render(<CanteenExperience />);
    fireEvent.click(screen.getByRole("button", { name: "转盘帮我选" }));

    fireEvent.click(screen.getByRole("button", { name: "抽食堂" }));
    expect(screen.getByRole("button", { name: "就选这个食堂" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "就选这个食堂" }));

    fireEvent.click(screen.getByRole("button", { name: "抽窗口" }));
    expect(screen.getByRole("button", { name: "就选这个窗口" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "就选这个窗口" }));

    fireEvent.click(screen.getByRole("button", { name: "抽菜品" }));
    expect(screen.getByRole("button", { name: "就吃这个" })).toBeInTheDocument();
    random.mockRestore();
  });

  it("北大食堂筛选会按食堂联动楼层和窗口", () => {
    render(<CanteenExperience />);
    expect(screen.getByText("家园食堂 · B1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "勺园食堂" }));
    expect(screen.getByRole("button", { name: "勺园食堂" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("家园食堂 · B1")).not.toBeInTheDocument();
    expect(screen.getByText("推荐菜")).toBeInTheDocument();
  });

  it("学一食堂的窗口待确认菜品也能进入逐级抽取", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
    render(<CanteenExperience />);
    fireEvent.click(screen.getByRole("button", { name: "学一食堂" }));
    fireEvent.click(screen.getByRole("button", { name: "转盘帮我选" }));
    fireEvent.click(screen.getByRole("button", { name: "抽食堂" }));
    fireEvent.click(screen.getByRole("button", { name: "就选这个食堂" }));
    fireEvent.click(screen.getByRole("button", { name: "抽窗口" }));
    expect(screen.getByRole("heading", { name: "窗口待确认（其他菜品）" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "就选这个窗口" }));
    fireEvent.click(screen.getByRole("button", { name: "抽菜品" }));
    expect(screen.getByRole("button", { name: "就吃这个" })).toBeInTheDocument();
  });

  it("产品结果展示规格、小料和统一提示，不展示内部来源字段", () => {
    const product = milkTeaProducts.find((item) => item.brandId === "mixue")!;
    render(<ProductResultCard product={product} brand={getMilkTeaBrand(product.brandId)} />);
    expect(screen.getByRole("heading", { name: product.productName })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "选择已有热量记录的规格" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "额外添加小料" })).toBeInTheDocument();
    expect(screen.getByText(/以下为该品牌常见小料/)).toBeInTheDocument();
    expect(screen.getByText(/热量仅供参考，可能因杯型/)).toBeInTheDocument();
    expect(screen.queryByText(/来源|可信度|A级|B级|C级/)).not.toBeInTheDocument();
  });

  it("勾选小料后立即更新最终总热量", () => {
    const product = milkTeaProducts.find(
      (item) => item.brandId === "mixue" && item.productName === "芋泥好暖椰",
    )!;
    render(<ProductResultCard product={product} brand={getMilkTeaBrand(product.brandId)} />);
    fireEvent.click(screen.getByText("椰果").closest("label")!);
    expect(screen.getByText("409 kcal")).toBeInTheDocument();
  });

  it("无候选条件显示可恢复的空状态", () => {
    render(<WheelExperience products={milkTeaProducts} />);
    fireEvent.change(screen.getByLabelText("产品名称搜索"), { target: { value: "不存在的饮品-xyz" } });
    expect(screen.getByText("没有符合条件的饮品")).toBeInTheDocument();
  });

  it("品牌筛选可以同时选择多个品牌", () => {
    const twoBrands = milkTeaProducts.filter((product) =>
      product.brandId === "yidiandian" || product.brandId === "heytea",
    );
    render(<WheelExperience products={twoBrands} />);
    fireEvent.click(screen.getByRole("button", { name: "一点点" }));
    fireEvent.click(screen.getByRole("button", { name: "喜茶" }));
    expect(screen.getByRole("button", { name: "一点点" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "喜茶" })).toHaveAttribute("aria-pressed", "true");
  });

  it("转盘只随机一次并在动画后进入规格选择", () => {
    vi.useFakeTimers();
    const random = vi.spyOn(Math, "random").mockReturnValue(0);
    const fixture = milkTeaProducts.filter((product) => !product.excludeFromWheel).slice(0, 4);
    render(<WheelExperience products={fixture} />);
    fireEvent.click(screen.getByRole("button", { name: "转盘抽一杯" }));
    fireEvent.click(screen.getByRole("button", { name: "转一下" }));
    expect(screen.getByRole("button", { name: "转动中" })).toBeDisabled();
    act(() => vi.advanceTimersByTime(3200));
    expect(screen.getByText("当前选择")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "选择已有热量记录的规格" })).toBeInTheDocument();
    expect(random).toHaveBeenCalledTimes(1);
    random.mockRestore();
  });

  it("奶茶浏览列表分批渲染，但候选总数保持完整", () => {
    render(<WheelExperience products={milkTeaProducts} />);
    const productList = screen.getByRole("region", { name: "产品列表" });
    const productGrid = productList.querySelector(".grid")!;
    expect(productGrid.querySelectorAll("button")).toHaveLength(24);
    expect(screen.getByText(String(milkTeaProducts.length))).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /加载更多/ }));
    expect(productGrid.querySelectorAll("button")).toHaveLength(48);
  });

  it("确认饮品会保存当前规格和小料，并可从历史恢复", async () => {
    const product = milkTeaProducts.find(
      (item) => item.brandId === "mixue" && item.productName === "芋泥好暖椰",
    )!;
    render(<WheelExperience products={[product]} />);
    fireEvent.click(screen.getByRole("region", { name: "产品列表" }).querySelector("button")!);
    fireEvent.click(screen.getByText("椰果").closest("label")!);
    fireEvent.click(screen.getByRole("button", { name: "就喝这个" }));
    await waitFor(() => {
      const history = JSON.parse(
        localStorage.getItem("foodCompass.milkTea.history") ?? "[]",
      );
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        productId: product.productId,
        variantId: product.defaultSelection.variantId,
      });
      expect(history[0].toppingIds).toContain(
        getMilkTeaBrand(product.brandId).toppings.find((item) => item.name === "椰果")!.toppingId,
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "管理我的奶茶" }));
    fireEvent.click(screen.getByRole("button", { name: /最近喝过 1/ }));
    fireEvent.click(screen.getByRole("dialog").querySelector("article button")!);
    expect(screen.getByText("椰果").closest("label")?.querySelector("input")).toBeChecked();
  });

  it("仍保留的异常规格显示必要的待核验提示", () => {
    const product = milkTeaProducts.find(
      (item) => item.brandId === "chagee" && item.productName === "橙香四季",
    )!;
    render(<ProductResultCard product={product} brand={getMilkTeaBrand(product.brandId)} />);
    fireEvent.click(screen.getByRole("button", { name: "微糖" }));
    expect(screen.getByText("该规格热量数据存在冲突，仅供参考。")).toBeInTheDocument();
  });

  it("浏览模式的唯一详情面板位于产品列表上方", () => {
    const { container } = render(<WheelExperience products={milkTeaProducts.slice(0, 4)} />);
    const resultPanel = container.querySelector("#resultPanel")!;
    const productList = screen.getByRole("region", { name: "产品列表" });
    expect(container.querySelectorAll("#resultPanel")).toHaveLength(1);
    expect(resultPanel.compareDocumentPosition(productList) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(productList.querySelector("button")!);
    expect(resultPanel.querySelector("h2")).toBeInTheDocument();
  });

  it("回到顶部按钮按滚动位置显示且不修改 hash", () => {
    const requestAnimationFrame = vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 700 });
    const originalHash = window.location.hash;
    render(<BackToTopButton />);
    const button = screen.getByRole("button", { name: "回到页面顶部" });
    expect(button).toHaveAttribute("aria-hidden", "false");
    fireEvent.click(button);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    expect(window.location.hash).toBe(originalHash);
    requestAnimationFrame.mockRestore();
    scrollTo.mockRestore();
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });

  it("产品名称已有的小料不会被默认勾选", () => {
    const product = milkTeaProducts.find(
      (item) => item.brandId === "yidiandian" && item.productName.includes("波霸"),
    )!;
    render(<ProductResultCard product={product} brand={getMilkTeaBrand(product.brandId)} />);
    expect(screen.getAllByRole("checkbox").every((checkbox) => !checkbox.hasAttribute("checked"))).toBe(true);
  });

  it("正餐模块默认全选主分类并直接从全部食物抽取", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    render(<MealExperience />);
    expect(screen.getByRole("button", { name: "转盘抽一个" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/当前有/).parentElement).toHaveTextContent("459");
    expect(screen.getByRole("heading", { name: "从所选分类中直接选一个" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消全选" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/盘面展示 24 个代表选项/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "取消全选" }));
    expect(screen.getByRole("heading", { name: "先决定今天吃哪一类" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "一键全选" })).toBeInTheDocument();
  });

  it("正餐浏览支持搜索并打开结果卡", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    render(<MealExperience />);
    fireEvent.click(screen.getByRole("button", { name: "浏览食物" }));
    fireEvent.change(screen.getByLabelText("食物名称搜索"), { target: { value: "黄焖鸡米饭" } });
    fireEvent.click(screen.getByRole("button", { name: /黄焖鸡米饭/ }));
    expect(screen.getByRole("heading", { name: "黄焖鸡米饭" })).toBeInTheDocument();
    await waitFor(() => expect(localStorage.getItem("foodCompass.meal.schemaVersion")).toBe("1"));
    fireEvent.click(screen.getByRole("button", { name: "就吃这个" }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem("foodCompass.meal.history") ?? "[]")).toHaveLength(1));
  });
});
