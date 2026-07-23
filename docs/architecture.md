# 架构说明

## 技术选择

网站使用 Next.js App Router、React、严格 TypeScript、Tailwind CSS 和静态导出。交互状态保留在客户端组件内，不引入额外状态管理库。八份 Excel 只在开发时导入，浏览器运行时仅读取已经生成的静态 JSON。

## 数据流

```text
父目录/资料源/奶茶/各个奶茶品牌/*.xlsx（只读）
            ↓ scripts/import-milk-tea-data.py
data/milk-tea/brands/*.json（八个品牌）
            ↓ lib/data/milk-tea.ts 运行时结构校验
筛选 / 转盘 / 规格联动 / 小料累计 / 页面展示
```

正餐模块使用独立数据流：

```text
父目录/资料源/今天吃什么/食物罗盘_今天吃什么模块_Codex开发指导.md
            ↓ scripts/import-meal-data.mjs
data/meals/foods.json（459 条、九个分类）
            ↓ lib/data/meals.ts 运行时结构校验
筛选 / 分类均衡随机 / 本地个人数据 / 页面与离线版
```

北大食堂模块使用可重复生成的数据流：

```text
父目录/资料源/北大食堂/PKU_Canteen_Data_Pack_2026-07-15/*（原始资料只读）
            ↓ scripts/import-canteen-data.mjs（逐行比对、清洗、关联校验）
data/canteens/catalog.json + import-report.json
            ↓ lib/data/canteens.ts 运行时结构校验
搜索 / 组合筛选 / 食堂与菜品详情 / 推荐 / 独立本地记录 / 离线版
```

GitHub 的514行全部保留为独立 SKU；菜品以食堂、楼层和标准化基础名分组，窗口未知时不根据名称自动绑定。官网聚合描述保存为窗口说明，不伪造成具体菜品。

导入脚本按“精细矩阵 → 明确规格单值 → 规格不明参考值”的优先级处理。低优先级数据不会覆盖高优先级组合；被跳过的冲突记录、原表筛选决定与公式错误扫描写入 `data/milk-tea/import-report.json`，不进入普通页面。

## 模块边界

- `types/milk-tea.ts`：品牌、产品、variant、默认选择、小料和热量区间类型。
- `lib/data/milk-tea.ts`：八个品牌的唯一数据入口与运行时结构校验。
- `lib/milk-tea/selection.ts`：默认规格解析、有效选项和级联选择。
- `lib/milk-tea/calories.ts`：杯型匹配的小料规格、区间求和和格式化。
- `lib/milk-tea/filters.ts`：产品去重、品牌/分类/热量筛选与排序。
- `components/wheel-experience.tsx`：筛选、产品列表、等概率转盘和结果协调。
- `components/product-result-card.tsx`：规格按钮、小料选择与最终热量。

## 转盘正确性

候选池在进入转盘前按 `productId` 去重。随机选择只调用一次 `pickRandom`；同一个索引同时用于计算扇区停靠角度和保存结果。规格在抽中产品后才解析，优先使用 `defaultSelection`，缺失时回退到第一条有效 variant。

## 静态部署

`pnpm build` 先生成 Next.js 静态文件，再由 `scripts/prepare-sites-build.mjs` 打包为本地/Workers 可运行的 `dist`。静态服务器包含 Next RSC 预取文件的 Windows 路径映射，避免页面导航预取 404。

## 餐食模块边界

“今天吃什么”使用独立的 `app/meals/` 路由、`data/meals/` 数据、`lib/meals/` 业务逻辑和 `foodCompass.meal.*` 本地存储命名空间。奶茶与餐食只共享导航、页脚、通用随机函数及视觉样式，不混用产品类型、筛选状态或导入规则。离线构建读取与在线页面相同的餐食 JSON，再嵌入原生单文件交互。

北大食堂同样使用独立的 `/canteens` 路由、`types/canteens.ts` 数据契约、`lib/canteens/` 纯逻辑和 `foodCompass.canteen.*` 存储命名空间。三套模块互不覆盖 localStorage。
