# 食物罗盘

一个移动端优先、可静态导出和单文件离线使用的选择工具，包含“今天吃什么”“北大食堂”和“奶茶罗盘”三个独立模块。

- 今天吃什么：459 个内置选项、九个主分类、组合筛选、分类均衡随机、最近记录、收藏、排除、自定义食物和 JSON 导入导出。
- 北大食堂：14 个官方餐饮单位、79 个已收录窗口、650 个结构化菜品、514 条历史 SKU，支持全层级搜索、组合筛选、详情、随机、收藏和本地历史。
- 奶茶罗盘：八品牌产品浏览与随机、真实规格联动、小料累计、收藏、历史、防重复、两类排除和个人数据导入导出。

## 当前数据限制

当前数据覆盖一点点、喜茶、蜜雪冰城、霸王茶姬、CoCo都可、古茗、瑞幸咖啡和茶百道，共 515 款独立产品、2559 条规格热量记录和 82 种小料。产品在列表和转盘中只出现一次；瑞幸 49 款简餐保留浏览但不进入转盘；低优先级冲突、缺失值和异常标记保留在内部导入报告，不在普通页面展示。

正餐标签是一般化决策参考；北大食堂的 GitHub 价格和每份营养均为历史参考；奶茶热量保留原始数据边界。本项目不构成过敏原、医疗、减重或专业营养建议。

## 环境

- Node.js 22+
- pnpm 11+
- Python 3.11+ 与 openpyxl（仅重新导入 Excel 时需要）

## 安装与运行

```bash
pnpm install
pnpm dev
```

访问 `http://localhost:3000`。

## 校验、测试与构建

```bash
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

## 单文件离线版

生成可直接双击打开、无需网络连接的正餐与奶茶静态页面：

```bash
pnpm build:offline
pnpm check:offline-script
pnpm test:offline
pnpm test:offline:meals
pnpm test:offline:canteens
```

同一次成功构建会生成内容完全相同的两份文件：

- 项目内：`offline/食物罗盘-离线版.html`
- 项目根目录外层固定入口：`D:\desktop\网站\食物罗盘-离线版.html`

离线版在构建时嵌入 459 条餐食、北大食堂正式目录和八品牌奶茶 JSON，不会在浏览器中读取原始 CSV/Excel，也不会请求外部资源。

## 路由

- `/`：正餐与奶茶双入口首页
- `/meals`：正餐筛选、浏览、分类均衡转盘和本地个人数据
- `/canteens`：北大食堂、楼层、窗口、菜品、筛选、推荐和本地个人记录
- `/wheel`：奶茶筛选、转盘、结果与本地个人数据管理
- `/data`：餐食与奶茶数据概览
- `/about`：使用说明和数据边界

## 数据更新

八份原始 Excel 位于项目父目录的 `资料源/奶茶/各个奶茶品牌/`，网站不修改它们。更新流程：

1. 更新并保存八份原始 Excel，不改变工作表字段口径。
2. 运行 `python scripts/import-milk-tea-data.py`，稳定生成 `data/milk-tea/brands/*.json` 与内部导入报告。
3. 运行 `pnpm lint && pnpm typecheck && pnpm test && pnpm build`。
4. 检查 `/wheel` 的品牌、产品、规格联动、小料累计和转盘结果，并查看 `/data` 数量概览。

## 部署

### Vercel

将 `food-compass` 作为项目根目录，构建命令使用 `pnpm build`，输出由 Next.js 自动识别。提交前需包含 `data/milk-tea/brands/*.json`。

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
data/meals/          459 条正餐静态数据
data/canteens/       北大食堂正式目录与导入报告
data/milk-tea/       八品牌独立静态数据与内部导入报告
docs/                数据、架构、视觉规范和 QA 记录
lib/                 数据访问、规格联动、热量计算、筛选和随机
scripts/             Excel 导入、离线版构建与 Playwright 视觉检查
tests/               数据、筛选、随机和 UI 测试
types/               TypeScript 数据契约
```

## 当前边界

- 不接入地图、定位、外卖平台、实时价格、账号或云端同步。
- 正餐不计算热量，不使用联网 AI 或隐藏推荐权重。
- 个人数据只保存在当前浏览器，可通过 JSON 手动备份。

详细记录见 [progress.md](./progress.md)、[docs/architecture.md](./docs/architecture.md) 与 [docs/canteen-data.md](./docs/canteen-data.md)。
