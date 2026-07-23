import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "说明" };

export default function AboutPage() {
  return <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
    <p className="text-xs font-semibold tracking-[0.18em] text-[#176b55]">ABOUT THE PROJECT</p>
    <h1 className="mt-3 font-serif text-4xl font-bold text-[#173f35] sm:text-5xl">让选择轻一点，也让边界说清楚。</h1>
    <div className="mt-10 space-y-7 text-base leading-8 text-stone-700">
      <section><h2 className="font-serif text-2xl font-bold text-stone-900">今天吃什么</h2><p className="mt-3">价格、口味、出餐时间、饱腹程度和场景标签基于常见情况设置，仅用于缩小候选范围，不代表具体门店实际价格、配方或等待时间。</p><p className="mt-3">饮食排除条件不能替代过敏原核验。如有过敏、宗教饮食或严格素食要求，请以商家实际配料信息为准。</p></section>
      <section className="border-t border-stone-300 pt-7"><h2 className="font-serif text-2xl font-bold text-stone-900">北大食堂</h2><p className="mt-3">官方当前资料、官方历史页面、GitHub 历史记录、推断和待核验信息分开保存。GitHub 价格与每份营养均为历史参考，具体采集日期、份量克重和测算方式未注明。</p><p className="mt-3">网站不声称提供实时菜单、实时拥挤度或当前价格；涉及严格素食、过敏原及营养控制时请以现场信息为准。</p></section>
      <section className="border-t border-stone-300 pt-7"><h2 className="font-serif text-2xl font-bold text-stone-900">外卖罗盘</h2><p className="mt-3">外卖商户、距离、营业时间和人均仅为公开资料或估算参考；A级表示近期官方、商场或政府资料确认，B级表示公开地图候选。距离为直线距离，部分使用商圈或楼宇中心估算。</p><p className="mt-3">本模块未接入美团或饿了么，所有内置商户均为“配送待平台确认”，不能据此判断当前是否可送、营业或在售。</p></section>
      <section className="border-y border-stone-300 py-7"><h2 className="font-serif text-2xl font-bold text-stone-900">奶茶罗盘</h2><p className="mt-3">产品与规格分层保存，缺失组合保持缺失，不用平均值补齐。额外小料按原表单位累计，是否支持添加以门店实际菜单为准。</p></section>
      <section><h2 className="font-serif text-2xl font-bold text-stone-900">本地数据与当前边界</h2><p className="mt-3">自定义条目、收藏、排除和最近记录只保存在当前浏览器中，网站不会上传。清除浏览器数据后记录可能丢失，可使用 JSON 导出备份。</p><ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7"><li>不提供定位、地图、实时价格或外卖平台实时数据。</li><li>不提供医疗、减重或专业营养建议。</li><li>不使用联网 AI 操控随机结果。</li></ul></section>
    </div>
    <div className="mt-10 flex flex-wrap gap-3"><Link href="/meals" className="rounded-full bg-[#c96348] px-6 py-3 text-sm font-semibold text-white">去选一顿 →</Link><Link href="/canteens" className="rounded-full bg-[#e8a54b] px-6 py-3 text-sm font-semibold text-[#173f35]">去逛食堂 →</Link><Link href="/takeout" className="rounded-full bg-[#176b55] px-6 py-3 text-sm font-semibold text-white">去抽外卖 →</Link><Link href="/wheel" className="rounded-full bg-[#173f35] px-6 py-3 text-sm font-semibold text-white">去选一杯 →</Link><Link href="/data" className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700">查看数据边界</Link></div>
  </main>;
}
