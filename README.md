# 食物罗盘 · 奶茶罗盘 MVP

一个移动端优先的奶茶随机选择网站。用户可以按品牌、品类、热量和核验状态缩小候选池，通过真实等概率 SVG 转盘抽取饮品，并查看规格、营养、来源和审计边界。

## 当前数据限制

当前派生数据共 65 条、3 个品牌，只有 6 条含热量。其余记录用于建立官方产品目录，未知值保持 `null`，前端显示“待核验”。4 条网络补充记录均为历史二手口径，并明确标为部分核验；没有估算或伪造数据。

本项目不构成医疗、减重或专业营养建议，也不实现缺少可靠数据的价格筛选。

## 环境

- Node.js 22+
- pnpm 11+

## 安装与运行

```bash
pnpm install
pnpm dev
```

访问 `http://localhost:3000`。

## 校验、测试与构建

```bash
pnpm data:validate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

可选的浏览器视觉检查（使用本机 Chrome）：

```bash
pnpm visual:qa round-local
```

## 路由

- `/`：极简品牌首页
- `/wheel`：筛选、转盘和结果
- `/data`：覆盖范围、来源构成和字段缺失率
- `/about`：产品边界

## 数据更新

原始数据位于项目父目录，网站不修改它。更新流程：

1. 完成人工核验并更新父目录原始 JSON/CSV，或把独立、可追溯的补充 variant 加入 `data/supplemental/records.json`。
2. 运行 `pnpm data:generate`，生成 `data/generated/products.json` 和 manifest。
3. 运行 `pnpm data:validate && pnpm test && pnpm build`。
4. 检查 `/data` 的数量、来源构成和缺失率。

### 使用人工核验队列

按父目录 `manual_verification_queue.csv` 的 P0 → P3 顺序处理。每次固定中国大陆具体门店、杯型、甜度、冰量和奶底；保存产品页与营养页截图；不同规格创建独立 variant；未知字段继续填 `null`。

## 部署

### Vercel

将 `food-compass` 作为项目根目录，构建命令使用 `pnpm build`，输出由 Next.js 自动识别。提交前必须先生成并包含 `data/generated/products.json`。

### Docker

```bash
docker build -t food-compass .
docker run --rm -p 3000:3000 food-compass
```

Docker 使用 Next.js standalone 输出，不依赖父目录原始数据。

## 项目结构

```text
app/                 页面与全局样式
components/          导航、筛选、转盘、结果卡
data/generated/      可部署的派生数据与 manifest
data/supplemental/   独立网络补充记录
docs/                数据、架构、视觉规范和 QA 记录
lib/                 数据访问、筛选、随机、格式化
scripts/             数据生成/校验与 Playwright 视觉检查
tests/               数据、筛选、随机和 UI 测试
types/               TypeScript 数据契约
```

## 尚未完成

- 补齐主要品牌当前小程序中的默认规格与营养数据。
- 接入真实价格、门店距离和当前在售状态。
- 建立 PostgreSQL/API 与审核后台。
- 保存可审计的原始页面截图和版本历史。

详细记录见 [progress.md](./progress.md) 与 [docs/data-audit-summary.md](./docs/data-audit-summary.md)。
