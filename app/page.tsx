import Link from "next/link";
export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <section className="relative mx-auto grid min-h-[calc(100svh-73px)] max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:py-16">
        <div className="relative z-10">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-[#176b55]">
            <span className="size-2 rounded-full bg-[#e8a54b]" />
            食物罗盘 · 奶茶第一站
          </p>
          <h1 className="mt-7 max-w-3xl font-serif text-[2.9rem] font-bold leading-[1.04] tracking-tight text-[#173f35] sm:text-6xl lg:text-7xl">
            今天喝什么？
            <span className="mt-2 block text-[#c96348]">转一下就知道。</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
            在真实产品目录里等概率抽一杯。能核验的热量如实展示，不知道的就写“待核验”——选择可以轻松，数据不必装懂。
          </p>
          <div className="mt-9">
            <Link href="/wheel" className="rounded-full bg-[#173f35] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/15 transition hover:-translate-y-0.5 hover:bg-[#0e4d3d]">
              开始转罗盘 →
            </Link>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[560px]" aria-hidden="true">
          <div className="absolute inset-[8%] rounded-full border border-stone-300" />
          <div className="absolute inset-[17%] rotate-12 rounded-full bg-[#173f35] shadow-[0_40px_90px_rgba(23,63,53,0.25)]">
            <div className="absolute inset-[9%] rounded-full border border-dashed border-emerald-100/30" />
            <div className="absolute left-1/2 top-[9%] h-[42%] w-1 -translate-x-1/2 origin-bottom rotate-[28deg] rounded-full bg-[#f6cf72] shadow-[0_0_20px_rgba(246,207,114,.5)]" />
            <div className="absolute left-1/2 top-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[10px] border-[#f8f5ee] bg-[#c96348] font-serif text-4xl font-bold text-white shadow-xl">茶</div>
            <span className="absolute left-1/2 top-[3%] -translate-x-1/2 text-sm tracking-[0.2em] text-emerald-100">果茶</span>
            <span className="absolute bottom-[8%] left-1/2 -translate-x-1/2 text-sm tracking-[0.2em] text-emerald-100">鲜奶茶</span>
            <span className="absolute left-[3%] top-1/2 -translate-y-1/2 -rotate-90 text-sm tracking-[0.2em] text-emerald-100">纯茶</span>
            <span className="absolute right-[3%] top-1/2 -translate-y-1/2 rotate-90 text-sm tracking-[0.2em] text-emerald-100">奶盖茶</span>
          </div>
          <div className="absolute left-[4%] top-[18%] border-b border-stone-400 bg-[#f8f5ee]/90 px-3 py-2 text-xs font-semibold tracking-widest text-stone-700">不编热量</div>
          <div className="absolute bottom-[15%] right-[2%] border-b border-[#c96348] bg-[#f8f5ee]/90 px-3 py-2 text-xs font-semibold tracking-widest text-stone-800">来源可追溯</div>
        </div>
      </section>
    </main>
  );
}
