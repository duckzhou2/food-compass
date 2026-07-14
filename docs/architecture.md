# 架构说明

## 选择

MVP 使用 Next.js App Router 静态生成和本地 JSON。当前数据规模小、更新依赖人工审核，引入数据库和 API 会增加部署成本而不改善数据质量，因此暂不连接 PostgreSQL。

## 数据流

```text
父目录原始 JSON（只读，61 条）
            +
data/supplemental/records.json（4 条）
            ↓ scripts/generate-data.mjs
data/generated/products.json（65 条）
            ↓ lib/data/products.ts 校验与访问
筛选 / 统计 / 随机选择 / 页面展示
```

## 模块边界

- `types/product.ts`：产品与筛选类型。
- `lib/data/`：唯一数据入口和统计逻辑；页面不直接读取原始文件。
- `lib/filters/`：纯函数组合筛选，`null` 热量不会进入数值区间。
- `lib/random/`：可注入随机源的单次等概率选择。
- `lib/formatters.ts`：热量、来源、审计与缺失字段展示规则。
- `components/wheel-experience.tsx`：客户端状态、筛选 UI、SVG 转盘和动画协调。
- `components/product-result-card.tsx`：结果第一层与次级证据层。

## 转盘正确性

1. 从当前筛选后的完整数组调用一次 `pickRandom`，得到产品与索引。
2. 按 `360 / candidateCount` 计算扇区中心角。
3. 使用同一索引计算目标旋转角度。
4. 动画结束只揭晓已保存产品，不再随机。

每个产品对应等宽扇区，因而视觉概率和逻辑概率一致。筛选在转动期间禁用。

## 未来数据库接口

将来可用 API/数据库实现替换 `lib/data/products.ts`，保持 `MilkTeaProduct[]` 或建立 DTO 适配；筛选、统计、随机和展示组件无需感知底层存储。
