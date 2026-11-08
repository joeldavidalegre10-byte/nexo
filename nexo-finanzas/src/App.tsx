import { createElement, useEffect, useMemo, useState, type ReactNode } from "react";
import { load, save } from "./api";

/* ───────── Tipos ───────── */
type TabId = "inicio" | "mov" | "presup" | "analisis" | "config";
type Tone = "g" | "r" | "b" | "o" | "p" | "m" | "k";
type Filter = "todo" | "in" | "out";
type Period = "mensual" | "trimestral" | "anual";
interface Mov { id: number; title: string; sub: string; amt: number; icon: string; tone: Tone }
interface Budget { name: string; icon: string; tone: Tone; spent: number; limit: number }
interface Cat { name: string; sub: string; icon: string; tone: Tone }
interface Store { inc: number; gas: number; cats: Cat[] }

/* ───────── Datos ───────── */
const TONE: Record<Tone, string> = { g: "#22e08a", r: "#ff5a6a", b: "#3b82f6", o: "#ff9f2e", p: "#8b5cf6", m: "#c155f0", k: "#7d8a99" };
const MOVS: Mov[] = [
  { id: 1, title: "Sueldo", sub: "Hoy, 09:15", amt: 3000000, icon: "briefcase", tone: "g" },
  { id: 2, title: "Supermercado", sub: "Ayer, 18:30", amt: -245000, icon: "cart", tone: "r" },
  { id: 3, title: "Alquiler", sub: "25/05/2026", amt: -1500000, icon: "home", tone: "b" },
  { id: 4, title: "Transferencia", sub: "24/05/2026", amt: 500000, icon: "swap", tone: "g" },
  { id: 5, title: "Restaurante", sub: "22/05/2026", amt: -180000, icon: "fork", tone: "o" },
  { id: 6, title: "Combustible", sub: "20/05/2026", amt: -150000, icon: "car", tone: "r" },
  { id: 7, title: "Trabajo extra", sub: "18/05/2026", amt: 200000, icon: "gift", tone: "g" },
  { id: 8, title: "Farmacia", sub: "16/05/2026", amt: -95000, icon: "cross", tone: "r" },
];
const BUDGETS: Budget[] = [
  { name: "Hogar", icon: "home", tone: "b", spent: 1600000, limit: 2000000 },
  { name: "Alimentación", icon: "fork", tone: "o", spent: 930000, limit: 1500000 },
  { name: "Transporte", icon: "car", tone: "p", spent: 450000, limit: 1000000 },
  { name: "Salud", icon: "cross", tone: "m", spent: 270000, limit: 900000 },
  { name: "Ocio", icon: "gamepad", tone: "r", spent: 375000, limit: 500000 },
];
const CATS: Cat[] = [
  { name: "Alquiler", sub: "Vivienda", icon: "home", tone: "b" },
  { name: "Supermercado", sub: "Compras del hogar", icon: "cart", tone: "r" },
  { name: "Servicios", sub: "Luz, agua, internet", icon: "bolt", tone: "o" },
  { name: "Combustible", sub: "Nafta", icon: "car", tone: "r" },
  { name: "Alimentación", sub: "Comidas", icon: "fork", tone: "o" },
];
const PERIODS: Record<Period, { labels: string[]; vals: number[]; total: number; delta: number; inc: number }> = {
  mensual: { labels: ["Feb", "Mar", "Abr", "May"], vals: [4.8, 5.8, 6.3, 5.65], total: 5650000, delta: 8, inc: 8500000 },
  trimestral: { labels: ["T3", "T4", "T1", "T2"], vals: [16, 17.5, 18, 16.9], total: 16900000, delta: 6, inc: 25500000 },
  anual: { labels: ["2023", "2024", "2025", "2026"], vals: [58, 64, 70, 68], total: 68000000, delta: 3, inc: 102000000 },
};
const DONUT = [["Hogar", 34, "g"], ["Alimentación", 28, "o"], ["Transporte", 18, "b"], ["Salud", 12, "p"], ["Otros", 8, "k"]] as const;

const fmt = (n: number) => "Gs. " + Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const smooth = (p: [number, number][]) =>
  p.map((q, i) => (i ? `C${(p[i - 1][0] + q[0]) / 2} ${p[i - 1][1]} ${(p[i - 1][0] + q[0]) / 2} ${q[1]} ${q[0]} ${q[1]}` : `M${q[0]} ${q[1]}`)).join("");

/* ───────── Iconos (línea, 24×24) ───────── */
const IC: Record<string, string> = {
  bars: '<path d="M5 20v-7M12 20V5M19 20v-10" stroke-width="3.4"/>', bell: '<path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 004 0"/>',
  back: '<path d="M15 5l-7 7 7 7"/>', cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', eyeoff: '<path d="M3 3l18 18M6.500 7C4 8.700 2 12 2 12s4 7 10 7c1.500 0 2.800-.4 4-1M10 5.100A9 9 0 0112 5c6 0 10 7 10 7a17 17 0 01-3 3.500"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/>', briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18"/>',
  cart: '<circle cx="9" cy="20" r="1.500"/><circle cx="18" cy="20" r="1.500"/><path d="M2 3h3l2.500 12h11L21 7H6"/>', home: '<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>',
  swap: '<path d="M4 7h15l-3-3M20 17H5l3 3"/>', fork: '<path d="M7 3v8M5 3v5a2 2 0 004 0V3M7 11v10M17 21V3c-3 2-3 8 0 9"/>',
  car: '<path d="M5 16v-5l2-5h10l2 5v5M3 16h18M7 19v-3M17 19v-3M6 12h12"/>', gift: '<rect x="3" y="8" width="18" height="4"/><path d="M12 8v13M5 12v8h14v-8M12 8c-3 0-4-4-1-4s2 4 1 4zm0 0c3 0 4-4 1-4"/>',
  cross: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>', target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.500"/>',
  chart: '<path d="M4 20h16M7 20v-7M12 20V6M17 20v-10"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.900 4.900L7 7M17 17l2.100 2.100M19.100 4.900L17 7M7 17l-2.100 2.100"/>',
  plus: '<path d="M12 5v14M5 12h14" stroke-width="2.600"/>', chev: '<path d="M9 5l7 7-7 7"/>', up: '<path d="M12 19V5M6 11l6-6 6 6"/>', down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  pencil: '<path d="M4 20l1-5L16 4l4 4L9 19z"/>', camera: '<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13" r="3.500"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', gamepad: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10v5M4.500 12.500h5M16 11h.01M18 14h.01"/>',
  chevdown: '<path d="M6 9l6 6 6-6"/>', money: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.500 10c0-2.500 5-2.500 5 0s-5 2-5 4.500"/>', dot: '<circle cx="12" cy="12" r="4" fill="currentColor"/>',
};
const SHAPES: Record<string, ReactNode[]> = {};
const shapes = (n: string): ReactNode[] =>
  (SHAPES[n] ??= Array.from((IC[n] ?? "").matchAll(/<(\w+)([^>]*?)\/>/g)).map((m, k) => {
    const props: Record<string, string> = { key: String(k) };
    for (const a of m[2].matchAll(/([\w-]+)="([^"]*)"/g)) props[a[1] === "stroke-width" ? "strokeWidth" : a[1]] = a[2];
    return createElement(m[1], props);
  }));
const Icon = ({ n, size = 20 }: { n: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{ display: "block", flex: "none" }}>
    {shapes(n)}
  </svg>
);
const Chip = ({ n, tone, size = 44 }: { n: string; tone: Tone; size?: number }) => (
  <span className="chip" style={{ width: size, height: size, color: TONE[tone], background: TONE[tone] + "22" }}><Icon n={n} size={size * 0.46} /></span>
);

/* ───────── Gráficos ───────── */
function Donut({ segs, size = 110, stroke = 20, children }: { segs: [number, string][]; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {segs.map(([v, col], i) => {
          const len = (v / 100) * c, el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke} strokeDasharray={`${Math.max(0, len - 2)} ${c}`} strokeDashoffset={-acc} />;
          acc += len;
          return el;
        })}
      </svg>
      <div className="mid">{children}</div>
    </div>
  );
}
function Flow() {
  const mk = (a: number[]): [number, number][] => a.map((v, i) => [10 + (i * 300) / (a.length - 1), 100 - v]);
  const inc = smooth(mk([22, 33, 36, 46, 50, 48, 54, 60, 66, 62, 76, 80])), gas = smooth(mk([8, 17, 16, 20, 23, 20, 22, 30, 38, 45, 47, 52]));
  return (
    <svg viewBox="0 0 320 120" width="100%">
      <defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#22e08a" stopOpacity=".35" /><stop offset="1" stopColor="#22e08a" stopOpacity="0" /></linearGradient></defs>
      {[20, 60, 100].map((y) => <line key={y} x1="10" x2="310" y1={y} y2={y} stroke="#1a2735" />)}
      <path d={`${inc} V100 H10Z`} fill="url(#fg)" /><path d={inc} fill="none" stroke="#22e08a" strokeWidth="2.500" /><path d={gas} fill="none" stroke="#3b82f6" strokeWidth="2.500" />
    </svg>
  );
}

/* ───────── Estilos ───────── */
const CSS = `
.nx{--bg:#060b12;--card:#0b141f;--line:#16222f;--tx:#f2f6fa;--mut:#7d8a99;--g:#22e08a;--r:#ff5a6a;background:var(--bg);color:var(--tx);font-family:"Inter","Segoe UI",system-ui,sans-serif;min-height:100vh;max-width:560px;margin:0 auto;position:relative;padding:0 18px 100px;-webkit-text-size-adjust:100%;overflow-x:hidden}
.nx *{box-sizing:border-box}.nx button,.nx input{font-family:inherit;color:inherit}.nx button{cursor:pointer}
.hd{display:flex;align-items:center;justify-content:space-between;padding:20px 0 14px}.logo{display:flex;align-items:center;gap:10px;color:var(--g)}.logo b{color:var(--tx);font-size:16px;display:block;line-height:1}.logo small{display:block;font-size:8px;letter-spacing:2.2px;color:var(--mut);margin-top:3px}
.ib{width:42px;height:42px;border-radius:13px;border:1px solid var(--line);background:var(--card);display:grid;place-items:center;position:relative}.ib.g{background:#0f2a22;border-color:#1b4a3a;color:var(--g)}.ib i{position:absolute;top:8px;right:9px;width:7px;height:7px;border-radius:50%;background:var(--r)}
.kick{color:var(--g);font-size:11.5px;letter-spacing:1.5px;font-weight:600;margin-top:6px}h1{font-size:27px;margin:4px 0;font-weight:800;letter-spacing:-.5px}.sub{color:var(--mut);font-size:13px}
.card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:16px;margin-bottom:12px}.hero{background:linear-gradient(135deg,#0f3b2c,#0b1d1a 60%);border-color:#1b5a43;position:relative}
.big{font-size:30px;font-weight:800;letter-spacing:-.5px;margin:10px 0 4px}.up{color:var(--g);font-size:11px;font-weight:600}.two{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}.two .card{margin:0}
.lbl{font-size:12px;color:#5aa0ff;margin:12px 0 4px}.amt{font-size:17px;font-weight:800}.chip{display:grid;place-items:center;border-radius:14px;flex:none}
.sec{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:16px;margin-bottom:10px}.sec a,.sec button{color:var(--g);font-size:12.5px;font-weight:500;background:none;border:0}
.sel{background:#101c2a;border:1px solid var(--line);border-radius:10px;padding:7px 11px;font-size:11px;display:flex;gap:6px;align-items:center}.leg{display:flex;gap:14px;font-size:11.5px;color:var(--mut);margin:6px 0}.leg i{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px}
.xs{display:flex;justify-content:space-between;font-size:11px;color:var(--mut);padding:0 8px}
.row{display:flex;align-items:center;gap:14px;padding:13px 0;width:100%;background:none;border:0;text-align:left}.row+.row,.list>*+*{border-top:1px solid var(--line)}.row .t{flex:1;font-weight:700;font-size:14px}.row .t small{display:block;color:var(--mut);font-weight:400;font-size:11.5px;margin-top:3px}.row .a{font-weight:800;font-size:14px}
.search{display:flex;gap:10px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:0 14px;height:50px;color:var(--mut);margin-bottom:14px}.search input{flex:1;background:none;border:0;outline:0;font-size:14px}
.pills{display:flex;gap:8px;align-items:center;margin-bottom:8px}.pills button{padding:10px 20px;border-radius:99px;border:1px solid #243445;background:none;font-size:13px;font-weight:600}.pills button.on{background:var(--g);border-color:var(--g);color:#04130c}.pills .ib{margin-left:auto}
.meta{display:flex;justify-content:space-between;font-size:11px;color:var(--mut);margin-bottom:10px}
.cta{width:100%;border:0;border-radius:16px;background:var(--g);color:#04130c!important;font-weight:800;font-size:14px;padding:16px;display:flex;gap:10px;align-items:center;justify-content:center;margin-bottom:22px}
.bar{height:6px;border-radius:9px;background:#1a2735;overflow:hidden;margin:7px 0 5px}.bar i{display:block;height:100%;border-radius:9px}
.mid{position:absolute;inset:0;display:grid;place-items:center;text-align:center}
.tabs{display:flex;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:5px;margin-bottom:14px}.tabs button{flex:1;border:0;background:none;padding:12px;border-radius:12px;font-size:12px;font-weight:600;color:var(--mut)}.tabs .on{background:var(--g);color:#04130c}
.cols{display:flex;align-items:flex-end;justify-content:space-around;height:110px;margin-top:14px;border-bottom:1px solid #1a2735}.cols div{width:34px;border-radius:7px 7px 0 0;background:linear-gradient(#5b6a85,#3a4660)}.cols div.now{background:linear-gradient(var(--g),#0f7a4c)}
.ld{display:flex;justify-content:space-between;font-size:12.5px;margin:7px 0}.ld span{display:flex;gap:8px;align-items:center}.ld i{width:7px;height:7px;border-radius:50%}
.tip{display:flex;gap:14px;align-items:center;border-color:#1c3552;background:#0c1b2c}
.set{display:flex;gap:12px;align-items:center;padding:14px;border:1px solid var(--line);border-radius:16px;background:var(--card);margin-bottom:8px;width:100%;text-align:left}.set .t{flex:1;font-weight:700;font-size:13px}.set .t small{display:block;color:var(--mut);font-weight:400;font-size:11.5px;margin-top:2px}
.pf{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}.pf>div{display:flex;gap:10px;align-items:center;padding:12px;border-radius:14px;border:1px solid var(--line)}.pf small{font-size:11px;color:#5aa0ff;display:block}.pf input{width:100%;background:none;border:0;border-bottom:1px solid var(--g);font-weight:800;font-size:12px;outline:0}
.pen{width:30px;height:30px;border-radius:50%;border:1px solid #1b4a3a;background:#0f2a22;color:var(--g);display:grid;place-items:center;flex:none}.add{width:34px;height:34px;border-radius:50%;background:var(--g);border:0;color:#04130c;display:grid;place-items:center}
.nav{position:fixed;bottom:0;left:0;right:0;margin:0 auto;width:100%;max-width:560px;display:flex;justify-content:space-around;padding:10px 4px calc(14px + env(safe-area-inset-bottom,0px));background:#070d15;border-top:1px solid var(--line);z-index:20}
.nav button{background:none;border:0;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11px;color:var(--mut);min-width:60px;position:relative;font-weight:500}.nav .on{color:var(--g);font-weight:700}.nav .on:before{content:"";position:absolute;top:-11px;width:26px;height:3px;border-radius:3px;background:var(--g)}
.cf{display:flex;gap:8px;margin-bottom:10px}.cf input{flex:1;height:44px;border-radius:12px;border:1px solid var(--line);background:var(--card);padding:0 12px;outline:0}
.side{display:none}.main{min-width:0}
@media (min-width:900px){
.nx{max-width:none;margin:0;padding:0;display:grid;grid-template-columns:250px minmax(0,1fr);min-height:100vh}
.side{display:flex;flex-direction:column;gap:6px;padding:26px 16px;border-right:1px solid var(--line);position:sticky;top:0;height:100vh}
.side .logo{padding:0 10px 26px}.side .logo b{font-size:20px}
.side .item{display:flex;align-items:center;gap:14px;padding:13px 14px;border-radius:14px;border:0;background:none;color:var(--mut);font-size:14px;font-weight:600;text-align:left}
.side .item:hover{background:#0f1a27;color:var(--tx)}.side .item.on{background:#0f2a22;color:var(--g)}
.side .foot{margin-top:auto;font-size:11px;color:var(--mut);padding:0 10px}
.nav{display:none}
.main{padding:8px 44px 56px;max-width:1240px;width:100%}
.hd .logo{display:none}.hd{justify-content:flex-end;padding:22px 0 0}
h1{font-size:32px}.card{padding:20px}.big{font-size:34px}.cols{height:170px}
.p-inicio,.p-analisis,.p-presup,.p-config{display:grid;gap:0 18px;align-items:start}
.p-inicio{grid-template-columns:1.35fr 1fr}.p-inicio>:nth-child(-n+3){grid-column:1/-1}.p-inicio>:nth-child(5){align-self:stretch}
.p-analisis{grid-template-columns:1fr 1fr}.p-analisis>:nth-child(-n+2){grid-column:1/-1}
.p-presup{grid-template-columns:minmax(320px,420px) 1fr}.p-presup>:first-child{grid-column:1/-1}
.bgrid{display:grid;grid-template-columns:1fr 1fr;gap:6px 28px}
.p-config{grid-template-columns:380px 1fr}.p-config>:first-child{grid-column:1/-1}.p-config>:nth-child(3){grid-column:2;grid-row:2 / span 2}
.p-mov{max-width:900px}
}
`;

/* ───────── Pantallas ───────── */
const Row = ({ m }: { m: Mov }) => (
  <div className="row">
    <Chip n={m.icon} tone={m.tone} />
    <div className="t">{m.title}<small>{m.sub}</small></div>
    <div className="a" style={{ color: m.amt > 0 ? TONE.g : TONE.r }}>{m.amt > 0 ? "+ " : "- "}{fmt(m.amt)}</div>
  </div>
);

function Inicio({ go }: { go: (t: TabId) => void }) {
  const [hide, setHide] = useState(false);
  const inc = MOVS.filter((m) => m.amt > 0).length ? 8500000 : 0, gas = 5650000;
  return (
    <div className="p-inicio">
      <div className="kick">MIÉRCOLES, 27 DE MAYO</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Hola, buenos días</h1><span className="ib g" style={{ width: 38, height: 38, fontSize: 11, fontWeight: 800 }}>LM</span>
      </div>
      <p className="sub" style={{ margin: "0 0 16px" }}>Este es el resumen de tus finanzas.</p>
      <div className="card hero">
        <div className="sub" style={{ display: "flex", gap: 8, alignItems: "center", color: "#cfe9dd" }}>Saldo total <button style={{ background: "none", border: 0 }} onClick={() => setHide(!hide)} aria-label="Mostrar u ocultar saldo"><Icon n={hide ? "eyeoff" : "eye"} size={16} /></button></div>
        <div className="big">{hide ? "Gs. ••••••••" : "Gs. 24.850.000"}</div><div className="up">↑ 12% vs. mes anterior</div>
        <span className="chip" style={{ position: "absolute", right: 18, bottom: 22, width: 54, height: 54, background: "#1c3a4a", color: "#8fb4c8" }}><Icon n="wallet" size={28} /></span>
      </div>
      <div className="two">
        <div className="card"><Chip n="down" tone="g" size={36} /><div className="lbl">Ingresos</div><div className="amt">{fmt(inc)}</div></div>
        <div className="card"><Chip n="up" tone="r" size={36} /><div className="lbl" style={{ color: "#ff8793" }}>Gastos</div><div className="amt">{fmt(gas)}</div></div>
      </div>
      <div className="card">
        <div className="sec">Flujo del mes<span className="sel">Este mes <Icon n="chevdown" size={12} /></span></div>
        <div className="leg"><span><i style={{ background: TONE.g }} />Ingresos</span><span><i style={{ background: TONE.b }} />Gastos</span></div>
        <Flow /><div className="xs"><span>1</span><span>7</span><span>14</span><span>21</span><span>31</span></div>
      </div>
      <div className="card">
        <div className="sec">Últimos movimientos<button onClick={() => go("mov")}>Ver todos →</button></div>
        <div className="list">{MOVS.slice(0, 3).map((m) => <Row key={m.id} m={m} />)}</div>
      </div>
    </div>
  );
}

function Movimientos() {
  const [q, setQ] = useState(""), [f, setF] = useState<Filter>("todo");
  const list = useMemo(() => MOVS.filter((m) => (f === "todo" || (f === "in" ? m.amt > 0 : m.amt < 0)) && m.title.toLowerCase().includes(q.toLowerCase())), [q, f]);
  const bal = list.reduce((a, m) => a + m.amt, 0);
  return (
    <div className="p-mov">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0 18px" }}><h1 style={{ fontSize: 28 }}>Movimientos</h1><span className="ib"><Icon n="cal" /></span></div>
      <label className="search"><Icon n="search" /><input placeholder="Buscar movimiento..." value={q} onChange={(e) => setQ(e.target.value)} /></label>
      <div className="pills">
        {([["todo", "Todo"], ["in", "Ingresos"], ["out", "Gastos"]] as [Filter, string][]).map(([k, l]) => <button key={k} className={f === k ? "on" : ""} onClick={() => setF(k)}>{l}</button>)}
        <span className="ib"><Icon n="sliders" /></span>
      </div>
      <div className="meta"><span>Mostrando {list.length} movimientos</span><b style={{ color: bal >= 0 ? TONE.g : TONE.r }}>Balance: {bal >= 0 ? "+" : "-"} {fmt(bal)}</b></div>
      <div className="card list" style={{ padding: "4px 16px" }}>{list.map((m) => <Row key={m.id} m={m} />)}{!list.length && <p className="sub">Sin resultados.</p>}</div>
    </div>
  );
}

function Presupuesto() {
  const spent = BUDGETS.reduce((a, b) => a + b.spent, 0), total = BUDGETS.reduce((a, b) => a + b.limit, 0), pct = Math.round((spent / total) * 100);
  return (
    <div className="p-presup">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><div className="kick">MAYO 2026</div><h1>Presupuesto</h1></div><span className="ib g"><Icon n="target" /></span>
      </div>
      <div>
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 26, padding: 22, margin: "14px 0" }}>
        <Donut size={120} stroke={16} segs={[[pct, TONE.g], [100 - pct, "#243445"]]}><div><b style={{ fontSize: 26 }}>{pct}%</b><div className="sub" style={{ fontSize: 10 }}>del presupuesto<br />del mes</div></div></Donut>
        <div><div className="sub" style={{ fontSize: 11.5 }}><i style={{ color: TONE.g }}>● </i>Gastado</div><b>{fmt(spent)}</b><div className="sub" style={{ fontSize: 11.5, marginTop: 14 }}><i>● </i>Restante</div><b>{fmt(total - spent)}</b></div>
      </div>
      <button className="cta"><Icon n="sliders" size={18} />Configurar presupuesto</button>
      </div>
      <div>
      <div className="sec">Por categoría<span className="sub">{fmt(total)} total</span></div>
      <div className="bgrid">{BUDGETS.map((b) => {
        const p = Math.round((b.spent / b.limit) * 100);
        return (
          <div key={b.name} style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
            <Chip n={b.icon} tone={b.tone} size={46} />
            <div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 13 }}>{b.name}<span>{p}%</span></div>
              <div className="bar"><i style={{ width: p + "%", background: TONE[b.tone] }} /></div><div className="sub" style={{ fontSize: 11 }}>{fmt(b.spent)} / {fmt(b.limit)}</div></div>
          </div>
        );
      })}</div>
      </div>
    </div>
  );
}

function Analisis() {
  const [per, setPer] = useState<Period>("mensual"), d = PERIODS[per], mx = Math.max(...d.vals);
  return (
    <div className="p-analisis">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0 16px" }}><h1>Análisis</h1><span className="ib g"><Icon n="chart" /></span></div>
      <div className="tabs">{(["mensual", "trimestral", "anual"] as Period[]).map((p) => <button key={p} className={per === p ? "on" : ""} onClick={() => setPer(p)}>{p[0].toUpperCase() + p.slice(1)}</button>)}</div>
      <div className="card">
        <div className="sub" style={{ fontSize: 11.5 }}>Gastos de este período</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div className="big" style={{ fontSize: 24 }}>{fmt(d.total)}</div><span className="up">↓ {d.delta}%</span></div>
        <div className="cols">{d.vals.map((v, i) => <div key={i} className={i === 3 ? "now" : ""} style={{ height: (v / mx) * 100 + "%" }} />)}</div>
        <div className="xs" style={{ marginTop: 6, justifyContent: "space-around" }}>{d.labels.map((l) => <span key={l}>{l}</span>)}</div>
      </div>
      <div className="card">
        <div className="sec">Gastos por categoría</div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Donut size={104} stroke={22} segs={DONUT.map((x) => [x[1], TONE[x[2]]] as [number, string])} />
          <div style={{ flex: 1 }}>{DONUT.map((x) => <div className="ld" key={x[0]}><span><i style={{ background: TONE[x[2]] }} />{x[0]}</span><b>{x[1]}%</b></div>)}</div>
        </div>
      </div>
      <div className="card tip"><Chip n="dot" tone="o" size={40} /><div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>Gastaste {d.delta}% menos</b><div className="sub" style={{ fontSize: 11.5, marginTop: 3 }}>que el período anterior. ¡Excelente control de tus gastos!</div></div><Icon n="chev" /></div>
      <div className="card">
        <div className="sec">Ingresos vs. gastos<span className="sub" style={{ textTransform: "capitalize" }}>{per}</span></div>
        {([["Ingresos", d.inc, TONE.g], ["Gastos", d.total, TONE.r]] as [string, number, string][]).map(([l, v, c]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11.5, margin: "10px 0" }}>
            <span style={{ width: 46, color: "#5aa0ff" }}>{l}</span><div className="bar" style={{ flex: 1, margin: 0 }}><i style={{ width: (v / (d.inc * 1.28)) * 100 + "%", background: c }} /></div><b>{fmt(v)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function Config({ back }: { back: () => void }) {
  const [open, setOpen] = useState(true), [edit, setEdit] = useState<"inc" | "gas" | null>(null);
  const [inc, setInc] = useState(6500000), [gas, setGas] = useState(4800000);
  const [cats, setCats] = useState<Cat[]>(CATS), [adding, setAdding] = useState(false), [nm, setNm] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    load<Store>({ inc: 6500000, gas: 4800000, cats: CATS }).then((d) => { setInc(d.inc); setGas(d.gas); setCats(d.cats); setReady(true); });
  }, []);
  useEffect(() => { if (ready) void save<Store>({ inc, gas, cats }); }, [ready, inc, gas, cats]);
  const addCat = () => { if (nm.trim()) setCats([...cats, { name: nm.trim(), sub: "Personalizada", icon: "money", tone: "k" }]); setNm(""); setAdding(false); };
  const fld = (k: "inc" | "gas", label: string, v: number, set: (n: number) => void, ic: string, t: Tone) => (
    <div><Chip n={ic} tone={t} size={38} /><div style={{ flex: 1, minWidth: 0 }}><small>{label}</small>
      {edit === k ? <input autoFocus type="number" defaultValue={v} onBlur={(e) => { set(+e.target.value || v); setEdit(null); }} /> : <b style={{ fontSize: 12 }}>{fmt(v)}</b>}</div>
      <button className="pen" aria-label="Editar" onClick={() => setEdit(k)}><Icon n="pencil" size={13} /></button></div>
  );
  return (
    <div className="p-config">
      <div style={{ display: "flex", gap: 14, alignItems: "center", margin: "10px 0 16px" }}>
        <button className="ib" onClick={back} aria-label="Volver"><Icon n="back" /></button>
        <div style={{ flex: 1 }}><h1 style={{ fontSize: 22, margin: 0 }}>Configuración</h1><div className="sub" style={{ fontSize: 11.5 }}>Personaliza tu experiencia financiera</div></div><span className="ib"><Icon n="gear" /></span>
      </div>
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 16, padding: 18 }}>
        <span style={{ position: "relative", width: 64, height: 64, borderRadius: "50%", border: "2px solid " + TONE.g, display: "grid", placeItems: "center" }}><Icon n="user" size={34} /><span style={{ position: "absolute", right: -4, bottom: -4, width: 24, height: 24, borderRadius: "50%", background: "#fff", color: "#000", display: "grid", placeItems: "center" }}><Icon n="camera" size={13} /></span></span>
        <div style={{ flex: 1 }}><b style={{ fontSize: 16 }}>Juan Pérez</b><div className="sub" style={{ fontSize: 11.5, marginTop: 6 }}>juan.perez@email.com</div></div><Icon n="chev" />
      </div>
      <div className="card">
        <button className="row" style={{ padding: 0 }} onClick={() => setOpen(!open)}>
          <Chip n="wallet" tone="g" size={42} /><div className="t">Mi Perfil Financiero<small>Define tu ingreso y tus gastos principales</small></div><span style={{ transform: open ? "rotate(180deg)" : "none" }}><Icon n="chevdown" /></span>
        </button>
        {open && <div className="pf">{fld("inc", "Ingreso Mensual", inc, setInc, "briefcase", "g")}{fld("gas", "Gastos Estimados", gas, setGas, "wallet", "r")}</div>}
        <div className="sec" style={{ marginTop: 10 }}>Categorías de Ingresos<button className="add" aria-label="Agregar"><Icon n="plus" size={16} /></button></div>
        <button className="set"><Chip n="money" tone="g" size={38} /><div className="t">Salario / Trabajo<small>Ingreso principal</small></div><Icon n="chev" size={16} /></button>
        <div className="sec" style={{ marginTop: 16 }}>Categorías de Egresos<button className="add" aria-label="Agregar categoría" onClick={() => setAdding(!adding)}><Icon n="plus" size={16} /></button></div>
        {adding && <div className="cf"><input autoFocus placeholder="Nombre de la categoría" value={nm} onChange={(e) => setNm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCat()} /><button className="add" style={{ width: 44, height: 44, borderRadius: 12 }} onClick={addCat} aria-label="Guardar">✓</button></div>}
        {cats.map((c) => <button className="set" key={c.name}><Chip n={c.icon} tone={c.tone} size={38} /><div className="t">{c.name}<small>{c.sub}</small></div><Icon n="chev" size={16} /></button>)}
      </div>
    </div>
  );
}

/* ───────── App ───────── */
const NAV: [TabId, string, string][] = [["inicio", "home", "Inicio"], ["mov", "swap", "Movim."], ["presup", "target", "Presup."], ["analisis", "chart", "Análisis"], ["config", "gear", "Config."]];

const LONG: Record<TabId, string> = { inicio: "Inicio", mov: "Movimientos", presup: "Presupuesto", analisis: "Análisis", config: "Configuración" };

export default function App() {
  const [tab, setTab] = useState<TabId>("inicio");
  const logo = (<div className="logo"><Icon n="bars" size={30} /><div><b>NEXO</b><small>FINANZAS</small></div></div>);
  return (
    <div className="nx">
      <style>{CSS}</style>
      <aside className="side">
        {logo}
        {NAV.map(([id, ic]) => <button key={id} className={"item" + (tab === id ? " on" : "")} onClick={() => setTab(id)}><Icon n={ic} size={20} />{LONG[id]}</button>)}
        <div className="foot">NEXO Finanzas</div>
      </aside>
      <main className="main">
        {tab !== "config" && (
          <header className="hd">
            {logo}
            <button className="ib" aria-label="Notificaciones"><Icon n="bell" /><i /></button>
          </header>
        )}
        {tab === "inicio" && <Inicio go={setTab} />}
        {tab === "mov" && <Movimientos />}
        {tab === "presup" && <Presupuesto />}
        {tab === "analisis" && <Analisis />}
        {tab === "config" && <Config back={() => setTab("inicio")} />}
      </main>
      <nav className="nav">
        {NAV.map(([id, ic, l]) => <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}><Icon n={ic} size={24} />{l}</button>)}
      </nav>
    </div>
  );
}
