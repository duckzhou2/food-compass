import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brandDirectory = path.join(projectRoot, "data", "milk-tea", "brands");
const outputDirectory = path.join(projectRoot, "offline");
const outputPath = path.join(outputDirectory, "食物罗盘-离线版.html");
const rootOutputPath = path.resolve(projectRoot, "..", "食物罗盘-离线版.html");
const mealDataPath = path.join(projectRoot, "data", "meals", "foods.json");
const canteenDataPath = path.join(projectRoot, "data", "canteens", "catalog.json");
const takeoutDataPath = path.resolve(projectRoot, "..", "食物罗盘_外卖板块_Codex最终交付_v1.0.json");
const brandFiles = [
  "yidiandian.json", "heytea.json", "mixue.json", "chagee.json",
  "coco.json", "guming.json", "luckin.json", "chabaidao.json",
];

const brands = await Promise.all(
  brandFiles.map(async (fileName) =>
    JSON.parse(await readFile(path.join(brandDirectory, fileName), "utf8")),
  ),
);

if (brands.length !== 8 || brands.some((brand) => !Array.isArray(brand.products))) {
  throw new Error("离线版需要八个品牌的有效静态数据。");
}

const productIds = brands.flatMap((brand) => brand.products.map((product) => product.productId));
if (new Set(productIds).size !== productIds.length) {
  throw new Error("离线数据中存在重复 productId。");
}

const brandData = JSON.stringify(brands)
  .replaceAll("<", "\\u003c")
  .replaceAll("\u2028", "\\u2028")
  .replaceAll("\u2029", "\\u2029");

const mealFoods = JSON.parse(await readFile(mealDataPath, "utf8"));
if (!Array.isArray(mealFoods) || mealFoods.length !== 459) {
  throw new Error("离线版需要 459 条有效餐食数据。");
}
if (new Set(mealFoods.map((food) => food.id)).size !== mealFoods.length) {
  throw new Error("离线餐食数据中存在重复 ID。");
}
const mealData = JSON.stringify(mealFoods)
  .replaceAll("<", "\\u003c")
  .replaceAll("\u2028", "\\u2028")
  .replaceAll("\u2029", "\\u2029");
const canteenCatalog = JSON.parse(await readFile(canteenDataPath, "utf8"));
const canteenSkus = canteenCatalog.dishes.flatMap((dish) => dish.skus);
if (canteenCatalog.canteens.filter((item) => !item.isServicePoint).length !== 14 || canteenSkus.length !== 514 || new Set(canteenSkus.map((item) => item.id)).size !== 514) {
  throw new Error("离线版需要 14 个正式食堂和 514 个唯一历史 SKU。");
}
const canteenData = JSON.stringify(canteenCatalog).replaceAll("<", "\\u003c").replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");
const takeoutCatalog = JSON.parse(await readFile(takeoutDataPath, "utf8"));
if (!Array.isArray(takeoutCatalog.merchants) || takeoutCatalog.merchants.length !== 339 || new Set(takeoutCatalog.merchants.map((merchant) => merchant.id)).size !== 339) {
  throw new Error("离线版需要 339 个唯一外卖商户。");
}
const takeoutData = JSON.stringify(takeoutCatalog).replaceAll("<", "\\u003c").replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");
const mealMarkup = await readFile(path.join(projectRoot, "scripts", "offline-meals.html"), "utf8");
const mealCss = await readFile(path.join(projectRoot, "scripts", "offline-meals.css"), "utf8");
const mealScript = await readFile(path.join(projectRoot, "scripts", "offline-meals.js"), "utf8");
const canteenMarkup = await readFile(path.join(projectRoot, "scripts", "offline-canteens.html"), "utf8");
const canteenCss = await readFile(path.join(projectRoot, "scripts", "offline-canteens.css"), "utf8");
const canteenScript = await readFile(path.join(projectRoot, "scripts", "offline-canteens.js"), "utf8");
const takeoutMarkup = await readFile(path.join(projectRoot, "scripts", "offline-takeout.html"), "utf8");
const takeoutCss = await readFile(path.join(projectRoot, "scripts", "offline-takeout.css"), "utf8");
const takeoutScript = await readFile(path.join(projectRoot, "scripts", "offline-takeout.js"), "utf8");
const milkPersonalMarkup = await readFile(path.join(projectRoot, "scripts", "offline-milk-personal.html"), "utf8");
const milkPersonalCss = await readFile(path.join(projectRoot, "scripts", "offline-milk-personal.css"), "utf8");
const milkPersonalScript = await readFile(path.join(projectRoot, "scripts", "offline-milk-personal.js"), "utf8");

const html = String.raw`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>食物罗盘｜今天吃什么？</title>
  <style>
    :root{--paper:#f8f5ee;--ink:#1d241f;--forest:#173f35;--jade:#176b55;--amber:#e8a54b;--coral:#c96348;--line:#d8d2c7;--muted:#716d66;--white:#fff;--soft:#f0ebdf;--shadow:0 22px 60px rgba(50,45,35,.12)}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;overflow-x:hidden;background:radial-gradient(circle at 8% 3%,rgba(232,165,75,.11),transparent 24rem),radial-gradient(circle at 94% 16%,rgba(23,107,85,.09),transparent 27rem),var(--paper);color:var(--ink);font-family:"Microsoft YaHei UI","PingFang SC",system-ui,sans-serif}button,input,select,summary{font:inherit}button,a,input,select,summary{-webkit-tap-highlight-color:transparent}button{cursor:pointer}button:disabled{cursor:not-allowed}.shell{width:min(1200px,calc(100% - 32px));margin:auto}.hidden{display:none!important}
    .topbar{position:sticky;top:0;z-index:50;border-bottom:1px solid rgba(216,210,199,.75);background:rgba(248,245,238,.95);backdrop-filter:blur(16px)}.topbar-inner{display:flex;align-items:center;gap:18px;min-height:70px}.brand{display:flex;align-items:center;gap:10px;color:var(--forest);font-family:Georgia,"Songti SC",serif;font-weight:800;text-decoration:none;white-space:nowrap}.brand-mark{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:var(--forest);color:#f6cf72}.nav{display:flex;align-items:center;gap:4px;margin-left:auto}.nav a{padding:9px 12px;border-radius:999px;color:#67635d;font-size:14px;text-decoration:none}.nav a:hover,.nav a.active{background:#e9e2d4;color:var(--forest)}.offline-badge{padding:6px 9px;border:1px solid #bed5cb;border-radius:999px;color:var(--jade);font-size:11px;font-weight:800;white-space:nowrap}
    .page{display:none;min-height:calc(100vh - 142px);padding:54px 0 72px}.page.active{display:block}.eyebrow{margin:0;color:var(--jade);font-size:12px;font-weight:800;letter-spacing:.16em}.page-title,.hero h1{color:var(--forest);font-family:Georgia,"Songti SC",serif;font-weight:800;letter-spacing:-.035em}.page-title{margin:12px 0 0;font-size:clamp(38px,5vw,58px);line-height:1.12}.lead{max-width:760px;margin:20px 0 0;color:#625f59;font-size:16px;line-height:1.9}.hero{display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:42px;min-height:640px}.hero h1{margin:22px 0 0;font-size:clamp(48px,7vw,80px);line-height:1.03}.hero h1 span{display:block;margin-top:8px;color:var(--coral)}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}.primary,.secondary{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 22px;border-radius:999px;font-size:14px;font-weight:800;text-decoration:none}.primary{border:0;background:var(--forest);color:#fff;box-shadow:0 12px 30px rgba(23,63,53,.2)}.secondary{border:1px solid var(--line);background:#fff;color:#4f4b45}.hero-card{padding:38px;border-radius:38px;background:var(--forest);color:#fff;box-shadow:0 35px 80px rgba(23,63,53,.22)}.hero-card strong{display:block;color:#f6cf72;font:800 clamp(54px,7vw,78px) ui-monospace,monospace}.hero-card h2{margin:8px 0 14px;font:800 28px Georgia,"Songti SC",serif}.hero-card p{margin:0;color:#cfe8de;line-height:1.8}.hero-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:24px}.hero-stat{padding:14px;border:1px solid rgba(255,255,255,.13);border-radius:16px}.hero-stat b{display:block;color:#fff;font-size:22px}.hero-stat span{color:#cfe8de;font-size:11px}
    .page-head{max-width:800px;margin-bottom:30px}.workspace{display:grid;grid-template-columns:310px minmax(0,1fr);gap:28px;align-items:start}.filters{position:sticky;top:90px;padding:20px;border-radius:28px;background:var(--soft)}.filter-summary{display:none}.filter-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.filter-head h2{margin:0;color:var(--forest);font:800 25px Georgia,"Songti SC",serif}.link-button{border:0;background:transparent;color:#746e65;font-size:12px;text-decoration:underline;text-underline-offset:4px}.filter-body{margin-top:20px}.field{margin-top:20px}.field:first-child{margin-top:0}.field-title{display:block;margin-bottom:9px;color:#3f3c37;font-size:13px;font-weight:800}.control{width:100%;min-width:0;border:1px solid #ddd6ca;border-radius:12px;background:#fbfaf6;padding:11px 12px;color:var(--ink);outline:none}.control:focus{border-color:var(--jade);box-shadow:0 0 0 3px rgba(23,107,85,.1)}.brand-pills,.choice-pills{display:flex;flex-wrap:wrap;gap:7px}.pill{border:1px solid #d9d2c6;border-radius:999px;background:#fff;padding:7px 10px;color:#676159;font-size:12px}.pill.active{border-color:var(--forest);background:var(--forest);color:#fff}.mode-switch{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border-radius:15px;background:#e5ded2}.mode-switch button{border:0;border-radius:11px;background:transparent;padding:10px 6px;color:#777168;font-size:12px;font-weight:800}.mode-switch button.active{background:#fff;color:var(--forest);box-shadow:0 2px 8px rgba(0,0,0,.06)}.mode-tabs{margin-bottom:20px;padding:5px;border-radius:20px}.mode-tabs button{padding:14px 10px;border-radius:15px;font-size:14px}.filter-note{margin:20px 0 0;border-top:1px solid rgba(120,95,60,.13);padding-top:14px;color:#795f3a;font-size:11px;line-height:1.7}
    .content{min-width:0}.toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.count{margin:0;color:#777168;font-size:13px}.count strong{color:var(--forest);font:800 18px ui-monospace,monospace}.product-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.product-card{min-width:0;border:1px solid #e1dbd0;border-radius:20px;background:#fff;padding:18px;text-align:left;box-shadow:0 8px 25px rgba(50,45,35,.045);transition:.16s}.product-card:hover,.product-card.selected{border-color:var(--jade);transform:translateY(-2px);box-shadow:0 14px 30px rgba(23,107,85,.1)}.card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.card-brand{color:var(--jade);font-size:11px;font-weight:800}.card-calories{flex:none;color:var(--forest);font-size:12px;font-weight:800}.product-card h3{margin:7px 0 0;overflow-wrap:anywhere;color:#292722;font:800 20px Georgia,"Songti SC",serif;line-height:1.28}.card-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:13px}.tag{padding:5px 8px;border-radius:999px;background:#f3efe7;color:#756f67;font-size:10px}.reference{margin:12px 0 0;color:#938c82;font-size:10px}.empty{padding:48px 20px;border:1px dashed #cfc8bc;border-radius:26px;background:rgba(255,255,255,.55);text-align:center}.empty h3{margin:0;color:var(--forest);font:800 24px Georgia,"Songti SC",serif}.empty p{margin:10px 0 0;color:#777168;font-size:13px}
    .wheel-card{overflow:hidden;padding:30px 20px;border-radius:34px;background:#efe9dc;text-align:center}.wheel-stage{position:relative;width:min(100%,540px);aspect-ratio:1;margin:20px auto 0}.wheel-canvas{width:100%;height:100%;border:9px solid #fff;border-radius:50%;background:#fff;box-shadow:0 24px 55px rgba(70,60,40,.18);transition:transform 3.2s cubic-bezier(.08,.72,.16,1)}.pointer{position:absolute;z-index:3;left:50%;top:-4px;width:0;height:0;transform:translateX(-50%);border-right:16px solid transparent;border-left:16px solid transparent;border-top:31px solid var(--coral);filter:drop-shadow(0 4px 4px rgba(0,0,0,.14))}.spin{position:absolute;z-index:4;left:50%;top:50%;display:grid;place-items:center;width:106px;height:106px;transform:translate(-50%,-50%);border:9px solid #fff;border-radius:50%;background:var(--forest);color:#fff;font:800 18px Georgia,"Songti SC",serif;box-shadow:0 12px 28px rgba(0,0,0,.2)}.spin:disabled{opacity:.78}.wheel-hint{margin:14px 0 0;color:#777168;font-size:12px}
    .result{scroll-margin-top:82px;margin-top:22px;overflow:hidden;border-radius:30px;background:#fff;box-shadow:var(--shadow)}.result-empty{padding:34px 20px;color:#777168;font-size:13px;text-align:center}.result-head{padding:25px 28px;background:var(--forest);color:#fff}.result-brand{margin:0;color:#f6cf72;font-size:11px;font-weight:800;letter-spacing:.13em}.result-head h2{margin:8px 0 0;overflow-wrap:anywhere;font:800 clamp(29px,5vw,45px) Georgia,"Songti SC",serif;line-height:1.15}.result-summary{display:grid;grid-template-columns:1fr auto;align-items:end;gap:18px;margin-top:22px;border-top:1px solid rgba(255,255,255,.16);padding-top:18px}.result-summary span{color:#cfe8de;font-size:12px}.result-summary strong{font:800 25px ui-monospace,monospace}.result-body{padding:26px 28px}.section-label{margin:0 0 12px;color:#8c857b;font-size:11px;font-weight:800;letter-spacing:.13em}.option-group{margin-top:20px}.option-group:first-child{margin-top:0}.option-title{margin:0 0 9px;color:#403c37;font-size:13px;font-weight:800}.option-buttons{display:flex;flex-wrap:wrap;gap:8px}.option-button{max-width:100%;overflow-wrap:anywhere;border:1px solid #d8d2c7;border-radius:999px;background:#fff;padding:8px 12px;color:#625d55;font-size:12px}.option-button.active{border-color:var(--forest);background:var(--forest);color:#fff}.topping-section{margin-top:26px;border-top:1px solid #e5e0d7;padding-top:23px}.topping-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.topping{display:flex;align-items:flex-start;gap:9px;min-width:0;border:1px solid #e2ddd4;border-radius:14px;padding:11px;background:#faf8f3}.topping input{flex:none;margin-top:3px;accent-color:var(--jade)}.topping-text{min-width:0}.topping-name{display:block;overflow-wrap:anywhere;font-size:12px;font-weight:800}.topping-cal{display:block;margin-top:4px;color:#817a71;font-size:10px}.calorie-box{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin-top:26px;overflow:hidden;border:1px solid #e2ddd4;border-radius:18px;background:#e2ddd4}.calorie-item{min-width:0;background:#f8f5ee;padding:15px}.calorie-item span{display:block;color:#817a71;font-size:10px}.calorie-item strong{display:block;margin-top:6px;overflow-wrap:anywhere;color:var(--forest);font-size:14px}.calorie-item.total{background:#e6f0eb}.disclaimer{margin:17px 0 0;color:#7b756c;font-size:11px;line-height:1.7}
    .stats{display:grid;grid-template-columns:repeat(3,1fr);margin-top:35px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:22px 0}.stat{padding:0 22px;border-right:1px solid var(--line)}.stat:first-child{padding-left:0}.stat:last-child{border:0}.stat-label{color:#777168;font-size:12px}.stat-value{margin-top:8px;color:var(--forest);font:800 36px ui-monospace,monospace}.brand-data-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:38px}.brand-data-card{padding:23px;border:1px solid var(--line);border-radius:22px;background:#fff}.brand-data-card h2{margin:0;color:var(--forest);font:800 23px Georgia,"Songti SC",serif}.brand-data-card dl{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:20px 0 0}.brand-data-card dt{color:#8a8379;font-size:10px}.brand-data-card dd{margin:5px 0 0;color:#302d29;font:800 20px ui-monospace,monospace}.about-wrap{max-width:820px}.prose{margin:25px 0 0;color:#625f59;font-size:14px;line-height:1.95}.notice{margin-top:30px;padding:22px;border-left:4px solid var(--amber);border-radius:0 18px 18px 0;background:#f1eadc;color:#655f57;font-size:13px;line-height:1.8}.footer{border-top:1px solid rgba(216,210,199,.8);padding:24px 0;color:#817b72;font-size:11px}.footer-inner{display:flex;justify-content:space-between;gap:20px}
${mealCss}
${canteenCss}
${takeoutCss}
${milkPersonalCss}
    @media(max-width:900px){.hero{grid-template-columns:1fr;min-height:auto}.hero-card{max-width:620px}.workspace{grid-template-columns:1fr}.filters{position:static}.filter-summary{display:block;cursor:pointer;color:var(--forest);font-weight:800}.filters:not([open]) .filter-head,.filters:not([open]) .filter-body{display:none}.product-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:640px){.shell{width:min(100% - 22px,1200px)}.topbar-inner{min-height:62px;gap:8px}.brand span:last-child{display:none}.nav{gap:0}.nav a{padding:8px;font-size:12px}.offline-badge{display:none}.page{padding:36px 0 54px}.hero{gap:28px}.hero h1{font-size:44px}.hero-card{padding:26px;border-radius:28px}.page-head{margin-bottom:22px}.product-grid,.brand-data-grid,.topping-grid{grid-template-columns:1fr}.toolbar{align-items:flex-start;flex-direction:column}.wheel-card{padding:22px 10px}.spin{width:88px;height:88px;border-width:7px;font-size:15px}.result-head,.result-body{padding:22px 18px}.result-summary{grid-template-columns:1fr}.calorie-box{grid-template-columns:1fr}.stats{grid-template-columns:1fr;padding:0}.stat{border-right:0;border-bottom:1px solid var(--line);padding:18px 0}.stat:last-child{border-bottom:0}.brand-data-card dl{grid-template-columns:repeat(3,minmax(0,1fr))}.footer-inner{flex-direction:column}.choice-pills{max-height:160px;overflow:auto}}
    .result{scroll-margin-top:92px}.result-slot:empty{display:none}.back-to-top{position:fixed;z-index:40;right:max(24px,calc(env(safe-area-inset-right) + 16px));bottom:max(24px,calc(env(safe-area-inset-bottom) + 16px));display:grid;width:48px;height:48px;place-items:center;border:1px solid var(--line);border-radius:50%;background:var(--forest);color:var(--paper);font-size:21px;font-weight:800;box-shadow:0 10px 26px rgba(23,63,53,.24);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s,visibility .18s,transform .18s,background .18s}.back-to-top.visible{opacity:1;visibility:visible;pointer-events:auto}.back-to-top:hover{transform:translateY(-2px);background:#0e4d3d}.back-to-top:focus-visible{outline:2px solid var(--amber);outline-offset:3px}@media(max-width:640px){.back-to-top{right:max(14px,calc(env(safe-area-inset-right) + 12px));bottom:max(16px,calc(env(safe-area-inset-bottom) + 12px));width:46px;height:46px}}
  </style>
</head>
<body>
  <header class="topbar">
    <div class="shell topbar-inner">
      <a class="brand" href="#home"><span class="brand-mark">食</span><span>食物罗盘</span></a>
      <nav class="nav" aria-label="主导航"><a href="#home">首页</a><a href="#food">今天吃什么</a><a href="#canteens">北大食堂</a><a href="#takeout">外卖罗盘</a><a href="#wheel">奶茶罗盘</a><a href="#data">数据</a><a href="#about">说明</a></nav>
      <span class="offline-badge">单文件离线版</span>
    </div>
  </header>

  <main>
    <section class="page" id="home">
      <div class="shell hero">
        <div><p class="eyebrow">FOOD COMPASS</p><h1>今天吃什么？<span>让罗盘替你选。</span></h1><p class="lead">不知道吃什么、去哪座食堂、点哪家外卖或喝什么时，按条件筛一下，或者直接交给随机。</p><div class="actions"><a class="primary" href="#food">开始选一顿</a><a class="secondary" href="#canteens">去逛食堂</a><a class="secondary" href="#takeout">去抽外卖</a><a class="secondary" href="#wheel">去选一杯</a></div></div>
        <div class="hero-card"><strong>4</strong><h2>套独立选择工具，完全离线</h2><p>正餐、北大食堂、外卖和奶茶使用彼此独立的数据与本地记录。</p><div class="hero-stats"><div class="hero-stat"><b>459</b><span>种正餐选择</span></div><div class="hero-stat"><b>14</b><span>个北大餐饮单位</span></div><div class="hero-stat"><b>339</b><span>家外卖候选</span></div><div class="hero-stat"><b id="heroProductCount">0</b><span>款奶茶产品</span></div></div><b id="heroVariantCount" style="display:none">0</b><b id="heroToppingCount" style="display:none">0</b></div>
      </div>
    </section>

${mealMarkup}

${canteenMarkup}

${takeoutMarkup}

    <section class="page" id="wheel">
      <div class="shell"><div class="page-head"><p class="eyebrow">EIGHT BRANDS</p><h1 class="page-title">奶茶罗盘</h1><p class="lead">先筛选候选饮品，再浏览列表或转动罗盘。筛选热量基于每款饮品的默认规格，不做平均。</p></div>
        <div class="workspace">
          <details class="filters" open><summary class="filter-summary">筛选饮品</summary><div class="filter-head"><h2>筛选</h2><button class="link-button" id="resetFilters" type="button">重置</button></div><div class="filter-body">
            <div class="field"><label class="field-title" for="searchInput">搜索产品</label><input class="control" id="searchInput" type="search" placeholder="输入饮品名称"></div>
            <div class="field"><span class="field-title">品牌</span><div class="brand-pills" id="brandPills"></div></div>
            <div class="field"><span class="field-title">分类</span><div class="choice-pills" id="categoryPills"></div></div>
            <div class="field"><span class="field-title">默认规格热量</span><div class="choice-pills" id="caloriePills"></div></div>
            <div class="field"><label class="field-title" for="sortSelect">排序</label><select class="control" id="sortSelect"><option value="source">原始顺序</option><option value="caloriesAsc">热量从低到高</option><option value="caloriesDesc">热量从高到低</option><option value="name">产品名称</option></select></div>
            <details class="milk-personal-options"><summary>更多条件</summary><label class="milk-personal-option"><input id="milkTeaOnlyFavorites" type="checkbox">只看收藏</label><label class="milk-personal-option"><input id="milkTeaAvoidRecent" type="checkbox" checked>避免最近三次重复</label><div class="milk-personal-option"><button id="milkTeaRestoreSession" type="button">恢复本轮排除（0）</button></div></details>
            <p class="milk-storage-warning hidden" id="milkTeaStorageWarning" role="status">浏览器存储不可用，本次仍可使用，但刷新后个人数据不会保留。</p>
            <p class="filter-note">热量仅供参考，可能因杯型、配方、原料及门店制作方式不同而变化。</p>
          </div></details>
          <div class="content"><div class="meal-actions"><div class="mode-switch mode-tabs" id="milkModeSwitch" style="min-width:260px;margin:0"><button class="active" data-mode="products" type="button">浏览产品</button><button data-mode="wheel" type="button">转盘抽一杯</button></div><button class="meal-manager-button" id="milkTeaManagerOpen" type="button">管理我的奶茶</button></div><div class="toolbar"><p class="count">当前共 <strong id="candidateCount">0</strong> 款产品，每款只出现一次。</p><p class="count" id="activeBrandLabel">全部品牌</p></div>
            <section id="productMode"><div class="result-slot" id="browseResultSlot"><section class="result" id="resultPanel"><div class="result-empty">选择一款产品，或转动罗盘后在这里选择已有热量记录的规格。</div></section></div><div class="product-grid" id="productGrid"></div></section>
            <section class="hidden" id="wheelMode"><div class="wheel-card"><p class="count">无可靠热量、严重冲突及瑞幸简餐不进入转盘</p><div class="wheel-stage"><div class="pointer" aria-hidden="true"></div><canvas class="wheel-canvas" id="wheelCanvas" width="600" height="600"></canvas><button class="spin" id="spinButton" type="button">转一下</button></div><p class="wheel-hint">转盘仅用于随机动画，最终结果以下方显示为准。</p></div><div class="result-slot" id="wheelResultSlot"></div></section>
          </div>
        </div>
      </div>
    </section>

    <section class="page" id="data"><div class="shell"><div class="page-head"><p class="eyebrow">DATA OVERVIEW</p><h1 class="page-title">四套选择，一处说明数据边界</h1><p class="lead">正餐、北大食堂、外卖和奶茶全部静态写入本文件，并使用彼此独立的本地存储。</p></div><div class="mode-switch mode-tabs" style="max-width:720px"><button class="active" data-offline-data="meals" type="button">食物选项</button><button data-offline-data="canteens" type="button">北大食堂</button><button data-offline-data="takeout" type="button">外卖数据</button><button data-offline-data="milk" type="button">奶茶数据</button></div><section id="offlineMealData"><div class="stats"><div class="stat"><div class="stat-label">内置食物</div><div class="stat-value">459</div></div><div class="stat"><div class="stat-label">主分类</div><div class="stat-value">9</div></div><div class="stat"><div class="stat-label">自定义</div><div class="stat-value" id="offlineCustomCount">0</div></div></div><div class="brand-data-grid" id="offlineMealCategoryGrid"></div><p class="prose">价格、口味、时间和饱腹标签是一般化决策参考，不是官方门店数据。</p></section><section class="hidden" id="offlineCanteenData"><div class="stats"><div class="stat"><div class="stat-label">正式食堂</div><div class="stat-value">14</div></div><div class="stat"><div class="stat-label">窗口/档口</div><div class="stat-value">79</div></div><div class="stat"><div class="stat-label">结构化菜品</div><div class="stat-value">650</div></div><div class="stat"><div class="stat-label">历史SKU</div><div class="stat-value">514</div></div></div><p class="prose">窗口待确认菜品427个；历史价格与营养不代表当前在售或医学精确测量。</p></section><section class="hidden" id="offlineTakeoutData"><div class="stats"><div class="stat"><div class="stat-label">候选商户</div><div class="stat-value">339</div></div><div class="stat"><div class="stat-label">主分类</div><div class="stat-value">9</div></div><div class="stat"><div class="stat-label">覆盖商圈</div><div class="stat-value">9</div></div><div class="stat"><div class="stat-label">A级证据</div><div class="stat-value">73</div></div></div><div class="brand-data-grid">${takeoutCatalog.referenceData.categories.map((category) => `<article class="brand-data-card"><h2>${category.name}</h2><dl><div><dt>候选商户</dt><dd>${category.merchantCount}</dd></div></dl></article>`).join("")}</div><p class="prose" id="offlineTakeoutPersonalStats">公开候选库未接入美团或饿了么，不能据此判断当前是否可送。</p></section><section class="hidden" id="offlineMilkData"><div class="stats"><div class="stat"><div class="stat-label">品牌</div><div class="stat-value" id="brandCount">0</div></div><div class="stat"><div class="stat-label">独立产品</div><div class="stat-value" id="productCount">0</div></div><div class="stat"><div class="stat-label">规格记录</div><div class="stat-value" id="variantCount">0</div></div></div><div class="brand-data-grid" id="brandDataGrid"></div><p class="prose" id="milkTeaPersonalStats"></p></section></div></section>

    <section class="page" id="about"><div class="shell about-wrap"><p class="eyebrow">ABOUT</p><h1 class="page-title">让选择轻一点，也把边界说清楚</h1><p class="prose">正餐标签为一般化参考；北大食堂资料严格区分当前官方、官方历史、GitHub历史、推断与待核验；奶茶缺失规格不推算、不平均。</p><p class="prose"><strong>外卖罗盘：</strong>商户、距离、营业时间和人均仅为公开资料或估算参考。未接入美团或饿了么，所有内置商户均为“配送待平台确认”，不能据此判断当前是否可送、营业或在售。</p><p class="prose">食堂历史价格和每份营养不代表当前在售、现价或官方精确测量。所有收藏、排除与历史只保存在当前浏览器本地。</p><div class="notice">本网站不提供定位、实时菜单、实时价格、过敏原、医疗、减重或专业营养建议。</div></div></section>
  </main>

  <footer class="footer"><div class="shell footer-inner"><span>食物罗盘 · 单文件离线版</span><span>正餐、北大食堂、外卖与奶茶数据静态内嵌，无需联网</span></div></footer>
${milkPersonalMarkup}
  <button class="back-to-top" id="backToTop" type="button" aria-label="回到页面顶部" aria-hidden="true" tabindex="-1"><span aria-hidden="true">↑</span></button>

  <script>
    var BRANDS = __BRAND_DATA__;
    var FIELDS = ["size","drinkingMethod","sugar","version","base"];
    var FIELD_LABELS = {size:"杯型",drinkingMethod:"饮用方式",sugar:"甜度",version:"版本",base:"基底"};
    var DISPLAY_CATEGORIES = ["奶茶 / 奶绿","鲜奶茶 / 轻乳茶","纯茶","果茶 / 果饮","茶特调","冰淇淋 / 甜品","咖啡"];
    var CALORIE_BANDS = [{value:"under100",label:"100 kcal 以下"},{value:"100to199",label:"100–199 kcal"},{value:"200to299",label:"200–299 kcal"},{value:"over300",label:"300 kcal 及以上"}];
    var COLORS = ["#176b55","#e8a54b","#c96348","#356f8a","#8e6e53","#6b8e5b","#9c5f74","#397c72"];
    var PRODUCTS = dedupe(BRANDS.reduce(function(all,brand){return all.concat(brand.products);},[]));
    var BRAND_BY_ID = Object.fromEntries(BRANDS.map(function(brand){return [brand.brandId,brand];}));
    var state = {brandIds:[],query:"",categories:[],calorieBands:[],sort:"source",mode:"products",products:PRODUCTS.slice(),selectedProductId:null,selection:null,toppingIds:new Set(),rotation:0,spinning:false};

    function byId(id){return document.getElementById(id);}
    function escapeHtml(value){return String(value == null ? "" : value).replace(/[&<>"']/g,function(character){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[character];});}
    function formatNumber(value){return Number.isInteger(value) ? String(value) : Number(value).toFixed(1).replace(/\.0$/,"");}
    function formatCalories(value){return value == null ? "暂无可靠参考热量" : formatNumber(value)+" kcal";}
    function formatRange(range){if(!range)return "暂无可靠参考热量";return range.min===range.max ? formatNumber(range.min)+" kcal" : formatNumber(range.min)+"–"+formatNumber(range.max)+" kcal";}
    function dedupe(products){var map=new Map();products.forEach(function(product){if(!map.has(product.productId))map.set(product.productId,product);});return Array.from(map.values());}
    function toggleValue(values,value){return values.includes(value)?values.filter(function(item){return item!==value;}):values.concat(value);}
    function selectedProduct(){return PRODUCTS.find(function(product){return product.productId===state.selectedProductId;})||null;}
    function variantValue(variant,field){return field==="drinkingMethod"?(variant.temperature||variant.ice):variant[field];}
    function isReliableVariant(variant){return variant&&variant.dataStatus!=="needs_review"&&variant.calories!==null;}
    function severeConflict(product){return product.variants.some(function(variant){return variant.dataStatus==="needs_review";})&&!product.variants.some(isReliableVariant);}
    function wheelEligible(product){return product.excludeFromWheel!==true&&product.variants.some(isReliableVariant)&&!severeConflict(product);}
    function defaultVariant(product){var explicit=product.variants.find(function(variant){return variant.variantId===product.defaultSelection.variantId;});return explicit&&isReliableVariant(explicit)?explicit:product.variants.find(isReliableVariant)||explicit||product.variants[0]||null;}
    function defaultCalories(product){var variant=defaultVariant(product);return isReliableVariant(variant)?variant.calories:null;}
    function uniqueValues(variants,field){return Array.from(new Set(variants.map(function(variant){return variantValue(variant,field);}).filter(function(value){return value!==null;})));}
    function selectionFromVariant(variant){var selection={};FIELDS.forEach(function(field){selection[field]=variant ? variantValue(variant,field) : null;});return selection;}
    function resolveSelection(product,requested){var preferred=selectionFromVariant(defaultVariant(product));var resolved=selectionFromVariant(null);var candidates=product.variants.slice();FIELDS.forEach(function(field){var options=uniqueValues(candidates,field);if(!options.length){resolved[field]=null;return;}var wanted=requested&&requested[field];var value=options.includes(wanted) ? wanted : options.includes(preferred[field]) ? preferred[field] : options[0];resolved[field]=value;candidates=candidates.filter(function(variant){return variantValue(variant,field)===value;});});return resolved;}
    function updateSelection(product,current,field,value){var requested=Object.assign({},current);requested[field]=value;FIELDS.slice(FIELDS.indexOf(field)+1).forEach(function(next){requested[next]=null;});return resolveSelection(product,requested);}
    function validOptions(product,selection,field){var previous=FIELDS.slice(0,FIELDS.indexOf(field));var candidates=product.variants.filter(function(variant){return previous.every(function(item){return selection[item]===null||variantValue(variant,item)===selection[item];});});return uniqueValues(candidates,field);}
    function findVariant(product,selection){return product.variants.find(function(variant){return FIELDS.every(function(field){return variantValue(variant,field)===selection[field];});})||defaultVariant(product);}
    function inBand(value,band){if(value==null)return false;if(band==="under100")return value<100;if(band==="100to199")return value>=100&&value<200;if(band==="200to299")return value>=200&&value<300;return value>=300;}
    function statusText(product){if(product.dataStatus==="detailed")return "精细规格";if(product.dataStatus==="specified_reference")return "明确规格参考值";if(product.dataStatus==="unspecified_reference")return "规格不明参考值";if(product.dataStatus==="needs_review")return "待核验，不参与热量筛选和默认转盘";return "暂无可靠参考热量";}
    function visibleProducts(){var query=state.query.trim().toLocaleLowerCase("zh-CN");var products=PRODUCTS.filter(function(product){if(state.brandIds.length&&!state.brandIds.includes(product.brandId))return false;if(state.categories.length&&!state.categories.includes(product.displayCategory))return false;if((state.sort==="caloriesAsc"||state.sort==="caloriesDesc")&&severeConflict(product))return false;if(state.calorieBands.length&&!state.calorieBands.some(function(band){return inBand(defaultCalories(product),band);}))return false;if(query){var searchable=(product.brandName+" "+product.productName+" "+product.category+" "+product.displayCategory).toLocaleLowerCase("zh-CN");if(!searchable.includes(query))return false;}return true;});if(state.sort==="name")products.sort(function(a,b){return a.productName.localeCompare(b.productName,"zh-CN");});if(state.sort==="caloriesAsc"||state.sort==="caloriesDesc")products.sort(function(a,b){var left=defaultCalories(a),right=defaultCalories(b);if(left==null)return 1;if(right==null)return -1;return state.sort==="caloriesAsc"?left-right:right-left;});return products;}
    function wheelProducts(){return state.products.filter(wheelEligible);}
    function activeProducts(){return state.mode==="wheel"?wheelProducts():state.products;}
    function renderCandidateCount(){byId("candidateCount").textContent=activeProducts().length;}
    function selectedToppingDetails(product,variant){var brand=BRAND_BY_ID[product.brandId];return Array.from(state.toppingIds).map(function(id){var topping=brand.toppings.find(function(item){return item.toppingId===id;});if(!topping)return null;var match=variant&&variant.size!==null?topping.variants.find(function(item){return item.size===variant.size;}):null;var toppingVariant=match||topping.variants.find(function(item){return item.size===null;})||topping.variants[0]||null;return toppingVariant?{topping:topping,variant:toppingVariant}:null;}).filter(Boolean);}
    function sumToppings(details){return details.reduce(function(sum,item){var calories=item.variant.calories;return {min:sum.min+(calories?calories.min:0),max:sum.max+(calories?calories.max:0)};},{min:0,max:0});}
    function renderBrandPills(){var html='<button class="pill'+(state.brandIds.length===0?' active':'')+'" data-brand="" type="button">全部品牌</button>';BRANDS.forEach(function(brand){html+='<button class="pill'+(state.brandIds.includes(brand.brandId)?' active':'')+'" data-brand="'+escapeHtml(brand.brandId)+'" type="button">'+escapeHtml(brand.brandName)+'</button>';});byId("brandPills").innerHTML=html;}
    function renderCategories(){var html='<button class="pill'+(state.categories.length===0?' active':'')+'" data-category="" type="button">全部分类</button>';DISPLAY_CATEGORIES.forEach(function(category){html+='<button class="pill'+(state.categories.includes(category)?' active':'')+'" data-category="'+escapeHtml(category)+'" type="button">'+escapeHtml(category)+'</button>';});byId("categoryPills").innerHTML=html;}
    function renderCalorieBands(){var html='<button class="pill'+(state.calorieBands.length===0?' active':'')+'" data-calorie="" type="button">全部热量</button>';CALORIE_BANDS.forEach(function(band){html+='<button class="pill'+(state.calorieBands.includes(band.value)?' active':'')+'" data-calorie="'+band.value+'" type="button">'+band.label+'</button>';});byId("caloriePills").innerHTML=html;}
    function renderProducts(){state.products=visibleProducts();renderCandidateCount();byId("activeBrandLabel").textContent=state.brandIds.length?state.brandIds.map(function(id){return BRAND_BY_ID[id].brandName;}).join("、"):"全部品牌";if(!state.products.length){byId("productGrid").innerHTML='<div class="empty" style="grid-column:1/-1"><h3>没有符合条件的饮品</h3><p>请调整品牌、分类、关键词或热量区间。</p></div>';drawWheel();return;}byId("productGrid").innerHTML=state.products.map(function(product){var calories=defaultCalories(product);var variant=defaultVariant(product);var specs=variant?FIELDS.map(function(field){return variantValue(variant,field);}).filter(Boolean).slice(0,2):[];return '<button class="product-card'+(state.selectedProductId===product.productId?' selected':'')+'" data-product="'+escapeHtml(product.productId)+'" type="button"><span class="card-top"><span class="card-brand">'+escapeHtml(product.brandName)+' · '+escapeHtml(product.displayCategory)+'</span><span class="card-calories">'+escapeHtml(formatCalories(calories))+'</span></span><h3>'+escapeHtml(product.productName)+'</h3><span class="card-meta">'+specs.map(function(spec){return '<span class="tag">'+escapeHtml(spec)+'</span>';}).join("")+'<span class="tag">'+product.variants.length+' 条规格</span></span><span class="reference">'+escapeHtml(statusText(product))+'</span></button>';}).join("");drawWheel();}
    function prefersReducedMotion(){return window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;}
    function setProduct(productId){var product=PRODUCTS.find(function(item){return item.productId===productId;});if(!product)return;state.selectedProductId=productId;state.selection=resolveSelection(product);state.toppingIds=new Set();renderProducts();renderResult();setTimeout(function(){byId("resultPanel").scrollIntoView({behavior:prefersReducedMotion()?"auto":"smooth",block:"start"});},30);}
    function renderResult(){
      var product=selectedProduct();
      if(!product||!state.selection){byId("resultPanel").innerHTML='<div class="result-empty">选择一款产品，或转动罗盘后在这里选择已有热量记录的规格。</div>';return;}
      var variant=findVariant(product,state.selection);
      var brand=BRAND_BY_ID[product.brandId];
      var optionsHtml=FIELDS.map(function(field){
        var options=validOptions(product,state.selection,field);
        if(!options.length)return "";
        return '<div class="option-group"><p class="option-title">'+FIELD_LABELS[field]+'</p><div class="option-buttons">'+options.map(function(option){return '<button class="option-button'+(state.selection[field]===option?' active':'')+'" data-field="'+field+'" data-value="'+encodeURIComponent(option)+'" type="button">'+escapeHtml(option)+'</button>';}).join("")+'</div></div>';
      }).join("");
      var toppings=brand.toppings.filter(function(topping){return product.toppings.includes(topping.toppingId);});
      var toppingHtml=toppings.length?'<div class="topping-section"><p class="section-label">额外添加小料</p><p class="disclaimer">以下为该品牌常见小料，是否支持添加以门店实际菜单为准。</p><div class="topping-grid">'+toppings.map(function(topping){var match=variant&&variant.size!==null?topping.variants.find(function(item){return item.size===variant.size;}):null;var toppingVariant=match||topping.variants.find(function(item){return item.size===null;})||topping.variants[0]||null;var calorieText=toppingVariant?formatRange(toppingVariant.calories):"暂无可靠参考热量";var unit=toppingVariant&&toppingVariant.unit?" · "+toppingVariant.unit:"";return '<label class="topping"><input type="checkbox" data-topping="'+escapeHtml(topping.toppingId)+'"'+(state.toppingIds.has(topping.toppingId)?' checked':'')+'><span class="topping-text"><span class="topping-name">'+escapeHtml(topping.name)+'</span><span class="topping-cal">'+escapeHtml(calorieText+unit)+'</span></span></label>';}).join("")+'</div><p class="disclaimer">小料热量按一份计算，实际份量可能因门店而异。</p></div>':"";
      var details=selectedToppingDetails(product,variant);
      var toppingCalories=sumToppings(details);
      var total=variant&&variant.calories!==null?{min:variant.calories+toppingCalories.min,max:variant.calories+toppingCalories.max}:null;
      var reviewWarning=variant&&variant.dataStatus==="needs_review"?'<p class="disclaimer" style="color:#8a5a12;background:#fff7df;padding:12px;border-radius:14px">该规格热量数据存在冲突，仅供参考。</p>':"";
      byId("resultPanel").innerHTML='<div class="result-head"><p class="result-brand">'+escapeHtml(product.brandName)+' · '+escapeHtml(product.displayCategory)+'</p><h2>'+escapeHtml(product.productName)+'</h2><div class="result-summary"><span>当前规格饮品基础热量</span><strong>'+escapeHtml(formatCalories(variant?variant.calories:null))+'</strong></div></div><div class="result-body">'+(optionsHtml?'<p class="section-label">选择已有热量记录的规格</p>'+optionsHtml:'<p class="section-label">该产品暂无可切换规格</p>')+reviewWarning+toppingHtml+'<div class="calorie-box"><div class="calorie-item"><span>饮品基础热量</span><strong>'+escapeHtml(formatCalories(variant?variant.calories:null))+'</strong></div><div class="calorie-item"><span>额外小料热量</span><strong>'+escapeHtml(formatRange(toppingCalories))+'</strong></div><div class="calorie-item total"><span>最终总热量</span><strong>'+escapeHtml(formatRange(total))+'</strong></div></div><p class="disclaimer">热量仅供参考，可能因杯型、配方、原料及门店制作方式不同而变化。</p></div>';
    }
    function drawWheel(){var canvas=byId("wheelCanvas");var context=canvas.getContext("2d");var size=canvas.width;var center=size/2;context.clearRect(0,0,size,size);var products=wheelProducts();if(!products.length){context.fillStyle="#e9e2d7";context.beginPath();context.arc(center,center,center-8,0,Math.PI*2);context.fill();context.fillStyle="#716d66";context.font="700 22px Microsoft YaHei UI";context.textAlign="center";context.fillText("暂无候选饮品",center,center);byId("spinButton").disabled=true;return;}byId("spinButton").disabled=state.spinning;var count=Math.min(products.length,12);var segment=Math.PI*2/count;for(var index=0;index<count;index+=1){context.beginPath();context.moveTo(center,center);context.arc(center,center,center-8,-Math.PI/2+index*segment,-Math.PI/2+(index+1)*segment);context.closePath();context.fillStyle=COLORS[index%COLORS.length];context.fill();}context.beginPath();context.arc(center,center,82,0,Math.PI*2);context.fillStyle="#173f35";context.fill();}
    function spin(){var products=wheelProducts();if(state.spinning||!products.length)return;state.spinning=true;var index=Math.floor(Math.random()*products.length);state.rotation+=1440+(index*137)%360;byId("wheelCanvas").style.transform="rotate("+state.rotation+"deg)";byId("spinButton").disabled=true;byId("spinButton").textContent="转动中";setTimeout(function(){state.spinning=false;byId("spinButton").disabled=false;byId("spinButton").textContent="再转一次";setProduct(products[index].productId);},2250);}
    function moveResultPanel(mode){var slot=byId(mode==="wheel"?"wheelResultSlot":"browseResultSlot");var panel=byId("resultPanel");if(panel.parentElement!==slot)slot.appendChild(panel);}
    function renderMode(){document.querySelectorAll("[data-mode]").forEach(function(button){button.classList.toggle("active",button.dataset.mode===state.mode);});moveResultPanel(state.mode);byId("productMode").classList.toggle("hidden",state.mode!=="products");byId("wheelMode").classList.toggle("hidden",state.mode!=="wheel");renderCandidateCount();if(state.mode==="wheel")setTimeout(drawWheel,0);}
    function renderAll(){renderBrandPills();renderCategories();renderCalorieBands();renderProducts();renderMode();renderResult();}
    function resetFilters(){state.brandIds=[];state.query="";state.categories=[];state.calorieBands=[];state.sort="source";state.selectedProductId=null;state.selection=null;state.toppingIds=new Set();byId("searchInput").value="";byId("sortSelect").value="source";renderAll();}
    function renderData(){var productCount=PRODUCTS.length;var variantCount=PRODUCTS.reduce(function(sum,product){return sum+product.variants.length;},0);var toppingCount=BRANDS.reduce(function(sum,brand){return sum+brand.toppings.length;},0);byId("heroProductCount").textContent=productCount;byId("heroVariantCount").textContent=variantCount;byId("heroToppingCount").textContent=toppingCount;byId("brandCount").textContent=BRANDS.length;byId("productCount").textContent=productCount;byId("variantCount").textContent=variantCount;byId("brandDataGrid").innerHTML=BRANDS.map(function(brand){var variants=brand.products.reduce(function(sum,product){return sum+product.variants.length;},0);return '<article class="brand-data-card"><h2>'+escapeHtml(brand.brandName)+'</h2><dl><div><dt>独立产品</dt><dd>'+brand.products.length+'</dd></div><div><dt>规格记录</dt><dd>'+variants+'</dd></div><div><dt>小料</dt><dd>'+brand.toppings.length+'</dd></div></dl></article>';}).join("");}
    function route(){var page=(location.hash||"#home").slice(1);if(!byId(page))page="home";document.querySelectorAll(".page").forEach(function(section){section.classList.toggle("active",section.id===page);});document.querySelectorAll(".nav a").forEach(function(link){link.classList.toggle("active",link.getAttribute("href")==="#"+page);});if(page==="wheel")setTimeout(drawWheel,0);window.scrollTo(0,0);}

    byId("brandPills").addEventListener("click",function(event){var button=event.target.closest("[data-brand]");if(!button)return;state.brandIds=button.dataset.brand?toggleValue(state.brandIds,button.dataset.brand):[];state.selectedProductId=null;state.selection=null;state.toppingIds=new Set();renderAll();});
    byId("searchInput").addEventListener("input",function(event){state.query=event.target.value;renderProducts();});
    byId("categoryPills").addEventListener("click",function(event){var button=event.target.closest("[data-category]");if(!button)return;state.categories=button.dataset.category?toggleValue(state.categories,button.dataset.category):[];state.selectedProductId=null;state.selection=null;state.toppingIds=new Set();renderAll();});
    byId("caloriePills").addEventListener("click",function(event){var button=event.target.closest("[data-calorie]");if(!button)return;state.calorieBands=button.dataset.calorie?toggleValue(state.calorieBands,button.dataset.calorie):[];state.selectedProductId=null;state.selection=null;state.toppingIds=new Set();renderAll();});
    byId("sortSelect").addEventListener("change",function(event){state.sort=event.target.value;renderProducts();});
    byId("milkModeSwitch").addEventListener("click",function(event){var button=event.target.closest("[data-mode]");if(!button)return;state.mode=button.dataset.mode;renderMode();});
    byId("productGrid").addEventListener("click",function(event){var button=event.target.closest("[data-product]");if(button)setProduct(button.dataset.product);});
    byId("resultPanel").addEventListener("click",function(event){var button=event.target.closest("[data-field]");var product=selectedProduct();if(!button||!product)return;state.selection=updateSelection(product,state.selection,button.dataset.field,decodeURIComponent(button.dataset.value));renderResult();});
    byId("resultPanel").addEventListener("change",function(event){var input=event.target.closest("[data-topping]");if(!input)return;if(input.checked)state.toppingIds.add(input.dataset.topping);else state.toppingIds.delete(input.dataset.topping);renderResult();});
    var backToTopFrame=0;function updateBackToTop(){backToTopFrame=0;var visible=window.scrollY>Math.min(600,window.innerHeight);var button=byId("backToTop");button.classList.toggle("visible",visible);button.setAttribute("aria-hidden",visible?"false":"true");button.tabIndex=visible?0:-1;}function scheduleBackToTop(){if(!backToTopFrame)backToTopFrame=requestAnimationFrame(updateBackToTop);}
    byId("backToTop").addEventListener("click",function(){window.scrollTo({top:0,behavior:prefersReducedMotion()?"auto":"smooth"});});
    byId("spinButton").addEventListener("click",spin);byId("resetFilters").addEventListener("click",resetFilters);window.addEventListener("hashchange",route);window.addEventListener("scroll",scheduleBackToTop,{passive:true});window.addEventListener("resize",function(){scheduleBackToTop();if(state.mode==="wheel")drawWheel();});
    renderData();renderAll();route();updateBackToTop();
  </script>
  <script>
${mealScript}
  </script>
  <script>
${canteenScript}
  </script>
  <script>
${takeoutScript}
  </script>
  <script>
${milkPersonalScript}
  </script>
</body>
</html>`;

await mkdir(outputDirectory, { recursive: true });
const finalHtml = html.replace("__BRAND_DATA__", brandData).replace("__MEAL_DATA__", mealData).replace("__CANTEEN_DATA__", canteenData).replace("__TAKEOUT_DATA__", takeoutData);
await writeFile(outputPath, finalHtml, "utf8");
await writeFile(rootOutputPath, finalHtml, "utf8");

const stats = {
  outputPath,
  rootOutputPath,
  brandCount: brands.length,
  productCount: productIds.length,
  variantCount: brands.reduce(
    (sum, brand) => sum + brand.products.reduce((count, product) => count + product.variants.length, 0),
    0,
  ),
  toppingCount: brands.reduce((sum, brand) => sum + brand.toppings.length, 0),
  mealCount: mealFoods.length,
  canteenCount: canteenCatalog.canteens.filter((item) => !item.isServicePoint).length,
  canteenDishCount: canteenCatalog.dishes.length,
  canteenSkuCount: canteenSkus.length,
  takeoutMerchantCount: takeoutCatalog.merchants.length,
};

console.log(JSON.stringify(stats, null, 2));
