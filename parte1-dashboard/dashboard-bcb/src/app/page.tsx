"use client";

import { useState, useMemo, useEffect } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine, Cell
} from "recharts";

// ============================================================
// DATA - Séries do Banco Central do Brasil (BCB/SGS)
// Fonte: https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados
// Janela: 36 meses (Jan/2023 — Fev/2026)
// ============================================================
const IPCA_DATA = [
  {m:"2023-01",v:0.53},{m:"2023-02",v:0.84},{m:"2023-03",v:0.71},{m:"2023-04",v:0.61},{m:"2023-05",v:0.23},{m:"2023-06",v:-0.08},
  {m:"2023-07",v:0.12},{m:"2023-08",v:0.23},{m:"2023-09",v:0.26},{m:"2023-10",v:0.24},{m:"2023-11",v:0.28},{m:"2023-12",v:0.56},
  {m:"2024-01",v:0.42},{m:"2024-02",v:0.83},{m:"2024-03",v:0.16},{m:"2024-04",v:0.38},{m:"2024-05",v:0.46},{m:"2024-06",v:0.21},
  {m:"2024-07",v:0.38},{m:"2024-08",v:-0.02},{m:"2024-09",v:0.44},{m:"2024-10",v:0.56},{m:"2024-11",v:0.39},{m:"2024-12",v:0.52},
  {m:"2025-01",v:0.16},{m:"2025-02",v:1.31},{m:"2025-03",v:0.56},{m:"2025-04",v:0.43},{m:"2025-05",v:0.26},{m:"2025-06",v:0.24},
  {m:"2025-07",v:0.26},{m:"2025-08",v:-0.11},{m:"2025-09",v:0.48},{m:"2025-10",v:0.09},{m:"2025-11",v:0.18},{m:"2025-12",v:0.33}
];

const SELIC_DATA = [
  {m:"2023-01",v:13.75},{m:"2023-02",v:13.75},{m:"2023-03",v:13.75},{m:"2023-04",v:13.75},{m:"2023-05",v:13.75},{m:"2023-06",v:13.75},
  {m:"2023-07",v:13.75},{m:"2023-08",v:13.25},{m:"2023-09",v:12.75},{m:"2023-10",v:12.75},{m:"2023-11",v:12.25},{m:"2023-12",v:11.75},
  {m:"2024-01",v:11.75},{m:"2024-02",v:11.25},{m:"2024-03",v:10.75},{m:"2024-04",v:10.75},{m:"2024-05",v:10.50},{m:"2024-06",v:10.50},
  {m:"2024-07",v:10.50},{m:"2024-08",v:10.50},{m:"2024-09",v:10.75},{m:"2024-10",v:10.75},{m:"2024-11",v:11.25},{m:"2024-12",v:12.25},
  {m:"2025-01",v:13.25},{m:"2025-02",v:13.25},{m:"2025-03",v:14.25},{m:"2025-04",v:14.25},{m:"2025-05",v:14.75},{m:"2025-06",v:15.00},
  {m:"2025-07",v:15.00},{m:"2025-08",v:15.00},{m:"2025-09",v:15.00},{m:"2025-10",v:15.00},{m:"2025-11",v:15.00},{m:"2025-12",v:15.00},
  {m:"2026-01",v:15.00}
];

const USD_DATA = [
  {m:"2023-01",v:5.15},{m:"2023-02",v:5.20},{m:"2023-03",v:5.28},{m:"2023-04",v:5.00},{m:"2023-05",v:4.98},{m:"2023-06",v:4.82},
  {m:"2023-07",v:4.75},{m:"2023-08",v:4.90},{m:"2023-09",v:5.03},{m:"2023-10",v:5.04},{m:"2023-11",v:4.87},{m:"2023-12",v:4.85},
  {m:"2024-01",v:4.93},{m:"2024-02",v:4.98},{m:"2024-03",v:5.02},{m:"2024-04",v:5.12},{m:"2024-05",v:5.15},{m:"2024-06",v:5.38},
  {m:"2024-07",v:5.56},{m:"2024-08",v:5.52},{m:"2024-09",v:5.45},{m:"2024-10",v:5.70},{m:"2024-11",v:5.87},{m:"2024-12",v:6.18},
  {m:"2025-01",v:5.94},{m:"2025-02",v:5.78},{m:"2025-03",v:5.73},{m:"2025-04",v:5.68},{m:"2025-05",v:5.62},{m:"2025-06",v:5.58},
  {m:"2025-07",v:5.47},{m:"2025-08",v:5.51},{m:"2025-09",v:5.45},{m:"2025-10",v:5.68},{m:"2025-11",v:5.78},{m:"2025-12",v:5.83},
  {m:"2026-01",v:5.23},{m:"2026-02",v:5.26}
];

// ============================================================
// THEME COLORS - FiscALL Soluções
// ============================================================
const THEMES = {
  dark: {
    bg: "#0C1210",
    card: "#141E1A",
    cardBorder: "#1E2E28",
    surface: "#182420",
    text: "#E8E6E1",
    textMuted: "#9CA396",
    textDim: "#6B7269",
    gridLine: "#1E2E28",
  },
  light: {
    bg: "#F7F5F0",
    card: "#FFFFFF",
    cardBorder: "#E0DDD5",
    surface: "#EFEDE6",
    text: "#1A1E1B",
    textMuted: "#5C6158",
    textDim: "#8A8E87",
    gridLine: "#E0DDD5",
  },
};

// Cores de acento (iguais nos dois temas) - FiscALL Soluções
const ACCENT_COLORS = {
  accent: "#D4762C",
  accentGlow: "rgba(212,118,44,0.12)",
  green: "#3D7A4A",
  greenDim: "rgba(61,122,74,0.12)",
  red: "#C0392B",
  redDim: "rgba(192,57,43,0.12)",
  yellow: "#B8860B",
  yellowDim: "rgba(184,134,11,0.12)",
  purple: "#7B6B8A",
  orange: "#D4762C",
  cyan: "#2E8B7A",
};

// ============================================================
// HELPERS & COMPUTATIONS
// ============================================================
const MONTHS_PT: Record<string, string> = {
  "01":"Jan","02":"Fev","03":"Mar","04":"Abr","05":"Mai","06":"Jun",
  "07":"Jul","08":"Ago","09":"Set","10":"Out","11":"Nov","12":"Dez"
};

function fmtMonth(m: string) {
  const [y, mo] = m.split("-");
  return `${MONTHS_PT[mo]}/${y.slice(2)}`;
}
function fmtBRL(v: number) { return `R$ ${v.toFixed(2).replace(".", ",")}`; }
function fmtPct(v: number) { return `${v >= 0 ? "+" : ""}${v.toFixed(2).replace(".", ",")}%`; }

function computeIPCA12m(data: {m:string;v:number}[]) {
  const results = [];
  for (let i = 11; i < data.length; i++) {
    const w = data.slice(i - 11, i + 1);
    let acc = 1;
    w.forEach(d => { acc *= (1 + d.v / 100); });
    results.push({ m: data[i].m, v: Math.round((acc - 1) * 10000) / 100 });
  }
  return results;
}

function computeReturns(data: {m:string;v:number}[]) {
  const r = [];
  for (let i = 1; i < data.length; i++) {
    const ret = ((data[i].v - data[i-1].v) / data[i-1].v) * 100;
    r.push({ m: data[i].m, v: Math.round(ret * 100) / 100 });
  }
  return r;
}

function computeVolatility(returns: {m:string;v:number}[], ws = 6) {
  const r = [];
  for (let i = ws - 1; i < returns.length; i++) {
    const w = returns.slice(i - ws + 1, i + 1).map(x => x.v);
    const mean = w.reduce((a, b) => a + b, 0) / w.length;
    const variance = w.reduce((a, b) => a + (b - mean) ** 2, 0) / w.length;
    r.push({ m: returns[i].m, v: Math.round(Math.sqrt(variance) * 100) / 100 });
  }
  return r;
}

function pct(a: number, b: number) { return b !== 0 ? Math.round(((a - b) / b) * 10000) / 100 : 0; }
function last<T>(arr: T[]) { return arr[arr.length - 1]; }
function prevN<T>(arr: T[], n: number) { return arr.length > n ? arr[arr.length - 1 - n] : arr[0]; }

// ============================================================
// SUB-COMPONENTS
// ============================================================
function KPICard({ title, value, subtitle, change, changeLabel, status, theme }: {
  title: string; value: string; subtitle?: string; change?: number; changeLabel?: string;
  status?: "up"|"down"|"alert"|"neutral"; theme: "dark" | "light";
}) {
  const C = THEMES[theme];
  const statusColor = status === "up" ? ACCENT_COLORS.green : status === "down" ? ACCENT_COLORS.red : status === "alert" ? ACCENT_COLORS.yellow : ACCENT_COLORS.accent;
  const statusBg = status === "up" ? ACCENT_COLORS.greenDim : status === "down" ? ACCENT_COLORS.redDim : status === "alert" ? ACCENT_COLORS.yellowDim : ACCENT_COLORS.accentGlow;

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16,
      padding: "24px 28px", position: "relative", overflow: "hidden", transition: "border-color 0.2s ease", cursor: "default",
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = statusColor; }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.cardBorder; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: statusColor }} />
        <span style={{ color: C.textMuted, fontSize: 13, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'Inter', sans-serif" }}>{title}</span>
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, color: C.text, fontFamily: "'Fira Code', monospace", lineHeight: 1.1 }}>{value}</div>
      {subtitle && <div style={{ color: C.textDim, fontSize: 13, marginTop: 4, fontFamily: "'Inter', sans-serif" }}>{subtitle}</div>}
      {change !== undefined && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, padding: "4px 10px", borderRadius: 8,
          background: statusBg, color: statusColor, fontSize: 13, fontWeight: 600, fontFamily: "'Fira Code', monospace"
        }}>
          <span>{change >= 0 ? "▲" : "▼"}</span>
          <span>{fmtPct(change)}</span>
          {changeLabel && <span style={{ color: C.textDim, fontWeight: 400 }}>• {changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, children, span, theme }: {
  title: string; subtitle?: string; children: React.ReactNode; span?: number; theme: "dark" | "light";
}) {
  const C = THEMES[theme];
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: "24px 20px 16px",
      gridColumn: span && span > 1 ? `span ${span}` : undefined,
    }}>
      <div style={{ marginBottom: 16, paddingLeft: 8 }}>
        <div style={{ color: C.text, fontSize: 16, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>{title}</div>
        {subtitle && <div style={{ color: C.textDim, fontSize: 12, marginTop: 2, fontFamily: "'Inter', sans-serif" }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function InsightBadge({ type, text, theme }: { type: "alert"|"info"|"positive"|"warning"; text: string; theme: "dark" | "light" }) {
  const C = THEMES[theme];
  const colors = {
    alert: { bg: ACCENT_COLORS.redDim, fg: ACCENT_COLORS.red, prefix: "ALERTA:" },
    info: { bg: ACCENT_COLORS.accentGlow, fg: ACCENT_COLORS.accent, prefix: "INFO:" },
    positive: { bg: ACCENT_COLORS.greenDim, fg: ACCENT_COLORS.green, prefix: "OK:" },
    warning: { bg: ACCENT_COLORS.yellowDim, fg: ACCENT_COLORS.yellow, prefix: "ALERTA:" },
  };
  const c = colors[type];
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 16px", borderRadius: 12,
      background: c.bg, border: `1px solid ${c.fg}22`, marginBottom: 10
    }}>
      <span style={{ color: c.fg, fontSize: 13, lineHeight: 1.5, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>{c.prefix}</span>
      <span style={{ color: c.fg, fontSize: 13, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>{text}</span>
    </div>
  );
}

function TabButton({ active, onClick, children, theme }: { active: boolean; onClick: () => void; children: React.ReactNode; theme: "dark" | "light" }) {
  const C = THEMES[theme];
  return (
    <button onClick={onClick} style={{
      padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer",
      background: active ? ACCENT_COLORS.accent : "transparent", color: active ? "#fff" : C.textMuted,
      fontSize: 14, fontWeight: 600, transition: "all 0.2s", fontFamily: "'Inter', sans-serif",
    }}>{children}</button>
  );
}

function FilterPill({ active, onClick, children, theme }: { active: boolean; onClick: () => void; children: React.ReactNode; theme: "dark" | "light" }) {
  const C = THEMES[theme];
  return (
    <button onClick={onClick} style={{
      padding: "6px 14px", borderRadius: 20, border: `1px solid ${active ? ACCENT_COLORS.accent : C.cardBorder}`,
      background: active ? ACCENT_COLORS.accentGlow : "transparent", color: active ? ACCENT_COLORS.accent : C.textDim,
      fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s", fontFamily: "'Inter', sans-serif",
    }}>{children}</button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label, theme }: { active?: boolean; payload?: any[]; label?: string; theme: "dark" | "light" }) => {
  if (!active || !payload?.length) return null;
  const C = THEMES[theme];
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.cardBorder}`, borderRadius: 10,
      padding: "10px 14px", boxShadow: `0 8px 32px ${theme === "dark" ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.1)"}`
    }}>
      <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>{label}</div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
          <span style={{ color: C.textDim, fontSize: 12, fontFamily: "'Inter', sans-serif" }}>{p.name}:</span>
          <span style={{ color: C.text, fontSize: 12, fontWeight: 600, fontFamily: "'Fira Code', monospace" }}>
            {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// MAIN PAGE
// ============================================================
export default function Home() {
  const [page, setPage] = useState("exec");
  const [period, setPeriod] = useState("36m");
  const [animIn, setAnimIn] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Inicializar tema do localStorage ou preferência do sistema
  useEffect(() => {
    const stored = localStorage.getItem("theme") as "dark" | "light" | null;
    if (stored) {
      setTheme(stored);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  // Persistir tema no localStorage
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    setAnimIn(false);
    const t = setTimeout(() => setAnimIn(true), 50);
    return () => clearTimeout(t);
  }, [page]);

  const filterByPeriod = <T,>(data: T[]) => {
    const months = period === "12m" ? 12 : period === "24m" ? 24 : 36;
    return data.slice(-months);
  };

  const kpis = useMemo(() => {
    const selicNow = last(SELIC_DATA).v;
    const selicPrev = prevN(SELIC_DATA, 1).v;
    const usdNow = last(USD_DATA).v;
    const usd30d = prevN(USD_DATA, 1).v;
    const usdRet30d = pct(usdNow, usd30d);
    const ipca12m = computeIPCA12m(IPCA_DATA);
    const ipca12mNow = last(ipca12m)?.v || 0;
    const usdReturns = computeReturns(USD_DATA);
    const vol = computeVolatility(usdReturns);
    const volNow = last(vol)?.v || 0;
    const usdValues = USD_DATA.map(d => d.v).sort((a, b) => a - b);
    const belowCount = usdValues.filter(v => v <= usdNow).length;
    const percentile = Math.round((belowCount / usdValues.length) * 100);

    return {
      selicNow, selicVar30d: selicNow - selicPrev,
      usdNow, usdRet30d, volNow,
      usdPercentile: percentile,
      usdAlert: percentile >= 90 ? "ALTO" : percentile >= 75 ? "ELEVADO" : "NORMAL",
      ipcaLastMonth: last(IPCA_DATA)?.v || 0,
      ipca12m: ipca12mNow,
      ipcaVsMeta: Math.round((ipca12mNow - 3) * 100) / 100,
      ipcaAboveCeiling: ipca12mNow > 4.5,
      ipca12mSeries: ipca12m,
    };
  }, []);

  const combinedData = useMemo(() => {
    const filtered = filterByPeriod(SELIC_DATA);
    return filtered.map(s => {
      const usd = USD_DATA.find(u => u.m === s.m);
      const ipca = IPCA_DATA.find(i => i.m === s.m);
      const ipca12 = kpis.ipca12mSeries.find(i => i.m === s.m);
      return { name: fmtMonth(s.m), month: s.m, selic: s.v, usd: usd?.v || null, ipca: ipca?.v || null, ipca12m: ipca12?.v || null };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, kpis]);

  const usdReturnsData = useMemo(() => {
    const returns = computeReturns(filterByPeriod(USD_DATA));
    return returns.map(r => ({ name: fmtMonth(r.m), retorno: r.v }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const volData = useMemo(() => {
    const returns = computeReturns(USD_DATA);
    const vol = computeVolatility(returns);
    return filterByPeriod(vol).map(v => ({ name: fmtMonth(v.m), volatilidade: v.v }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const ipcaBarData = useMemo(() => {
    return filterByPeriod(IPCA_DATA).map(d => ({
      name: fmtMonth(d.m), ipca: d.v,
      fill: d.v < 0 ? ACCENT_COLORS.green : d.v > 0.5 ? ACCENT_COLORS.red : ACCENT_COLORS.accent,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const C = THEMES[theme] as typeof THEMES.dark;
  const gridLineColor = C.gridLine;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header style={{
        padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${C.cardBorder}`, background: theme === "dark" ? "rgba(12,18,16,0.8)" : "rgba(247,245,240,0.8)",
        backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: ACCENT_COLORS.accent, border: "none",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#FFFFFF",
            fontFamily: "'Inter', sans-serif",
          }}>BCB</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, fontFamily: "'Inter', sans-serif" }}>Painel Financeiro BCB</div>
            <div style={{ fontSize: 11, color: C.textDim, fontFamily: "'Inter', sans-serif" }}></div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TabButton active={page === "exec"} onClick={() => setPage("exec")} theme={theme}>Executivo</TabButton>
          <TabButton active={page === "detail"} onClick={() => setPage("detail")} theme={theme}>Detalhamento</TabButton>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <FilterPill active={period === "12m"} onClick={() => setPeriod("12m")} theme={theme}>12M</FilterPill>
          <FilterPill active={period === "24m"} onClick={() => setPeriod("24m")} theme={theme}>24M</FilterPill>
          <FilterPill active={period === "36m"} onClick={() => setPeriod("36m")} theme={theme}>36M</FilterPill>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{
            padding: "6px 12px", borderRadius: 8, border: `1px solid ${ACCENT_COLORS.accent}`,
            background: ACCENT_COLORS.accent, color: "#FFFFFF", cursor: "pointer", fontSize: 12, fontWeight: 500,
            fontFamily: "'Inter', sans-serif", transition: "all 0.2s", marginLeft: 8,
          }}>
            {theme === "dark" ? "☀ Claro" : "☾ Escuro"}
          </button>
        </div>
      </header>

      <main style={{
        padding: "28px 32px", maxWidth: 1440, margin: "0 auto",
        opacity: animIn ? 1 : 0, transform: animIn ? "translateY(0)" : "translateY(4px)", transition: "all 0.4s ease",
      }}>
        {page === "exec" && (
          <>
            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 28 }}>
              <KPICard title="SELIC Meta" value={`${kpis.selicNow.toFixed(2)}%`}
                subtitle="Taxa básica de juros (% a.a.)" change={kpis.selicVar30d} changeLabel="vs mês anterior"
                status={kpis.selicVar30d > 0 ? "up" : kpis.selicVar30d < 0 ? "down" : "neutral"} theme={theme} />
              <KPICard title="USD/BRL" value={fmtBRL(kpis.usdNow)}
                subtitle={`Percentil ${kpis.usdPercentile}% • ${kpis.usdAlert}`} change={kpis.usdRet30d} changeLabel="30 dias"
                status={kpis.usdRet30d > 2 ? "alert" : kpis.usdRet30d > 0 ? "up" : "down"} theme={theme} />
              <KPICard title="IPCA Acum. 12M" value={`${kpis.ipca12m.toFixed(2)}%`}
                subtitle="Meta CMN: 3,00% • Teto: 4,50%" change={kpis.ipcaVsMeta} changeLabel="vs meta"
                status={kpis.ipcaAboveCeiling ? "alert" : kpis.ipcaVsMeta > 0 ? "up" : "down"} theme={theme} />
              <KPICard title="Volatilidade USD 6M" value={`${kpis.volNow.toFixed(2)}%`}
                subtitle="Desvio-padrão retornos mensais"
                status={kpis.volNow > 3 ? "alert" : kpis.volNow > 2 ? "up" : "down"} theme={theme} />
              <KPICard title="IPCA Último Mês" value={`${kpis.ipcaLastMonth.toFixed(2)}%`}
                subtitle={last(IPCA_DATA).m}
                status={kpis.ipcaLastMonth > 0.5 ? "alert" : kpis.ipcaLastMonth > 0 ? "up" : "down"} theme={theme} />
            </div>

            {/* Insights */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, fontFamily: "'Inter', sans-serif" }}>
                Insights &amp; Alertas
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 10 }}>
                {kpis.ipcaAboveCeiling ? (
                  <InsightBadge type="alert" text={`IPCA acumulado 12M (${kpis.ipca12m.toFixed(2)}%) está ACIMA do teto da meta CMN de 4,50%. Pressão inflacionária justifica manutenção da SELIC em patamar restritivo.`} theme={theme} />
                ) : kpis.ipcaVsMeta > 0 ? (
                  <InsightBadge type="warning" text={`IPCA acumulado 12M (${kpis.ipca12m.toFixed(2)}%) está acima da meta de 3,00%, mas dentro do intervalo de tolerância.`} theme={theme} />
                ) : (
                  <InsightBadge type="positive" text={`IPCA acumulado 12M (${kpis.ipca12m.toFixed(2)}%) está DENTRO da meta CMN de 3,00%.`} theme={theme} />
                )}
                <InsightBadge type={kpis.usdPercentile >= 75 ? "warning" : "info"}
                  text={`USD/BRL no percentil ${kpis.usdPercentile}% da janela histórica. ${kpis.usdPercentile >= 75 ? "Câmbio em patamar elevado — atenção ao pass-through inflacionário." : "Câmbio em patamar moderado no histórico recente."}`} theme={theme} />
                <InsightBadge type="info" text="Ciclo de aperto monetário: SELIC subiu de 10,50% (mai/24) para 15,00% (jun/25) — alta de 4,50 p.p. em 7 reuniões. Copom sinaliza manutenção prolongada." theme={theme} />
                {kpis.selicNow >= 14 && kpis.usdRet30d < 0 && (
                  <InsightBadge type="positive" text={`Correlação SELIC alta vs apreciação cambial: juros elevados atraem capital externo, contribuindo para queda recente do dólar (${fmtPct(kpis.usdRet30d)} em 30d).`} theme={theme} />
                )}
              </div>
            </div>

            {/* Charts Row 1 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <ChartCard title="SELIC Meta vs USD/BRL" subtitle="Evolução comparativa — eixos duplos" theme={theme}>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={combinedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                    <XAxis dataKey="name" tick={{ fill: C.textDim, fontSize: 10, fontFamily: "'Inter', sans-serif" }} interval="preserveStartEnd" />
                    <YAxis yAxisId="left" tick={{ fill: ACCENT_COLORS.accent, fontSize: 10, fontFamily: "'Fira Code', monospace" }} domain={['auto','auto']} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: ACCENT_COLORS.cyan, fontSize: 10, fontFamily: "'Fira Code', monospace" }} domain={['auto','auto']} />
                    <Tooltip content={<CustomTooltip theme={theme} />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: C.textMuted, fontFamily: "'Inter', sans-serif" }} />
                    <Line yAxisId="left" type="stepAfter" dataKey="selic" stroke={ACCENT_COLORS.accent} name="SELIC (%)" strokeWidth={2.5} dot={false} />
                    <Area yAxisId="right" type="monotone" dataKey="usd" stroke={ACCENT_COLORS.cyan} fill={`${ACCENT_COLORS.cyan}15`} name="USD/BRL" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="IPCA Mensal" subtitle="Variação % mês a mês" theme={theme}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={ipcaBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                    <XAxis dataKey="name" tick={{ fill: C.textDim, fontSize: 10, fontFamily: "'Inter', sans-serif" }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: C.textDim, fontSize: 10, fontFamily: "'Fira Code', monospace" }} />
                    <Tooltip content={<CustomTooltip theme={theme} />} />
                    <ReferenceLine y={0} stroke={C.textDim} strokeDasharray="3 3" />
                    <Bar dataKey="ipca" name="IPCA (%)" radius={[4, 4, 0, 0]}>
                      {ipcaBarData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Charts Row 2 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <ChartCard title="IPCA Acumulado 12 Meses" subtitle="Índice vs Meta CMN (3%) e Teto (4,5%)" theme={theme}>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={combinedData.filter(d => d.ipca12m !== null)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                    <XAxis dataKey="name" tick={{ fill: C.textDim, fontSize: 10, fontFamily: "'Inter', sans-serif" }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: C.textDim, fontSize: 10, fontFamily: "'Fira Code', monospace" }} />
                    <Tooltip content={<CustomTooltip theme={theme} />} />
                    <ReferenceLine y={3} stroke={ACCENT_COLORS.green} strokeDasharray="5 5" label={{ value: "Meta 3%", fill: ACCENT_COLORS.green, fontSize: 10, position: "insideTopRight", fontFamily: "'Inter', sans-serif" }} />
                    <ReferenceLine y={4.5} stroke={ACCENT_COLORS.red} strokeDasharray="5 5" label={{ value: "Teto 4,5%", fill: ACCENT_COLORS.red, fontSize: 10, position: "insideTopRight", fontFamily: "'Inter', sans-serif" }} />
                    <Area type="monotone" dataKey="ipca12m" stroke={ACCENT_COLORS.purple} fill={`${ACCENT_COLORS.purple}20`} name="IPCA 12M (%)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="SELIC vs IPCA 12M" subtitle="Juro real e inflação acumulada" theme={theme}>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={combinedData.filter(d => d.ipca12m !== null)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                    <XAxis dataKey="name" tick={{ fill: C.textDim, fontSize: 10, fontFamily: "'Inter', sans-serif" }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: C.textDim, fontSize: 10, fontFamily: "'Fira Code', monospace" }} />
                    <Tooltip content={<CustomTooltip theme={theme} />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: C.textMuted, fontFamily: "'Inter', sans-serif" }} />
                    <Line type="stepAfter" dataKey="selic" stroke={ACCENT_COLORS.accent} name="SELIC (%)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ipca12m" stroke={ACCENT_COLORS.red} name="IPCA 12M (%)" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        )}

        {page === "detail" && (
          <>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, fontFamily: "'Inter', sans-serif" }}>Detalhamento &amp; Exploração</div>
            <div style={{ color: C.textDim, fontSize: 13, marginBottom: 24, fontFamily: "'Inter', sans-serif" }}>
              
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <ChartCard title="Retornos Mensais USD/BRL" subtitle="Variação % mês a mês" theme={theme}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={usdReturnsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                    <XAxis dataKey="name" tick={{ fill: C.textDim, fontSize: 10, fontFamily: "'Inter', sans-serif" }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: C.textDim, fontSize: 10, fontFamily: "'Fira Code', monospace" }} />
                    <Tooltip content={<CustomTooltip theme={theme} />} />
                    <ReferenceLine y={0} stroke={C.textDim} />
                    <Bar dataKey="retorno" name="Retorno (%)" radius={[3, 3, 0, 0]}>
                      {usdReturnsData.map((entry, index) => (
                        <Cell key={index} fill={entry.retorno >= 0 ? ACCENT_COLORS.red : ACCENT_COLORS.green} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Volatilidade Móvel USD/BRL (6M)" subtitle="Desvio-padrão em janela móvel de 6 meses" theme={theme}>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={volData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                    <XAxis dataKey="name" tick={{ fill: C.textDim, fontSize: 10, fontFamily: "'Inter', sans-serif" }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: C.textDim, fontSize: 10, fontFamily: "'Fira Code', monospace" }} />
                    <Tooltip content={<CustomTooltip theme={theme} />} />
                    <Area type="monotone" dataKey="volatilidade" stroke={ACCENT_COLORS.yellow} fill={`${ACCENT_COLORS.yellow}15`} name="Volatilidade (%)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <ChartCard title="USD/BRL — Série Histórica" subtitle="Com faixas de percentil P25 e P75" theme={theme}>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={combinedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                    <XAxis dataKey="name" tick={{ fill: C.textDim, fontSize: 10, fontFamily: "'Inter', sans-serif" }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: C.textDim, fontSize: 10, fontFamily: "'Fira Code', monospace" }} domain={['auto','auto']} />
                    <Tooltip content={<CustomTooltip theme={theme} />} />
                    <ReferenceLine y={USD_DATA.map(d=>d.v).sort((a,b)=>a-b)[Math.floor(USD_DATA.length*0.25)]} stroke={ACCENT_COLORS.green} strokeDasharray="4 4"
                      label={{ value: `P25`, fill: ACCENT_COLORS.green, fontSize: 10, position: "insideBottomRight", fontFamily: "'Inter', sans-serif" }} />
                    <ReferenceLine y={USD_DATA.map(d=>d.v).sort((a,b)=>a-b)[Math.floor(USD_DATA.length*0.75)]} stroke={ACCENT_COLORS.red} strokeDasharray="4 4"
                      label={{ value: `P75`, fill: ACCENT_COLORS.red, fontSize: 10, position: "insideTopRight", fontFamily: "'Inter', sans-serif" }} />
                    <Area type="monotone" dataKey="usd" stroke={ACCENT_COLORS.cyan} fill={`${ACCENT_COLORS.cyan}15`} name="USD/BRL" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Comparativo SELIC x IPCA x USD" subtitle="Todas as séries na mesma visualização" theme={theme}>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={combinedData.filter(d => d.ipca12m !== null)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                    <XAxis dataKey="name" tick={{ fill: C.textDim, fontSize: 10, fontFamily: "'Inter', sans-serif" }} interval="preserveStartEnd" />
                    <YAxis yAxisId="left" tick={{ fill: C.textDim, fontSize: 10, fontFamily: "'Fira Code', monospace" }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: C.textDim, fontSize: 10, fontFamily: "'Fira Code', monospace" }} domain={['auto','auto']} />
                    <Tooltip content={<CustomTooltip theme={theme} />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: C.textMuted, fontFamily: "'Inter', sans-serif" }} />
                    <Line yAxisId="left" type="stepAfter" dataKey="selic" stroke={ACCENT_COLORS.accent} name="SELIC" strokeWidth={2} dot={false} />
                    <Line yAxisId="left" type="monotone" dataKey="ipca12m" stroke={ACCENT_COLORS.red} name="IPCA 12M" strokeWidth={2} dot={false} />
                    <Area yAxisId="right" type="monotone" dataKey="usd" stroke={ACCENT_COLORS.cyan} fill="transparent" name="USD/BRL" strokeWidth={1.5} strokeDasharray="4 4" />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Data Table */}
            <ChartCard title="Tabela de Dados — Séries Completas" subtitle="Todos os valores por mês" span={2} theme={theme}>
              <div style={{ maxHeight: 400, overflowY: "auto", borderRadius: 8, border: `1px solid ${C.cardBorder}` }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ position: "sticky", top: 0, background: C.surface, zIndex: 1 }}>
                      {["Mês", "SELIC (%)", "USD/BRL", "IPCA Mensal (%)", "IPCA Acum. 12M (%)"].map(h => (
                        <th key={h} style={{
                          padding: "10px 14px", textAlign: "left", color: C.textMuted, fontWeight: 600, fontSize: 11,
                          textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${C.cardBorder}`,
                          fontFamily: "'Inter', sans-serif",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...combinedData].reverse().map((row, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.cardBorder}22`, transition: "background 0.15s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = ACCENT_COLORS.accentGlow; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                      >
                        <td style={{ padding: "8px 14px", color: C.text, fontWeight: 500, fontFamily: "'Fira Code', monospace" }}>{row.name}</td>
                        <td style={{ padding: "8px 14px", color: ACCENT_COLORS.accent, fontFamily: "'Fira Code', monospace" }}>{row.selic?.toFixed(2) || "—"}</td>
                        <td style={{ padding: "8px 14px", color: ACCENT_COLORS.cyan, fontFamily: "'Fira Code', monospace" }}>{row.usd?.toFixed(4) || "—"}</td>
                        <td style={{ padding: "8px 14px", fontFamily: "'Fira Code', monospace", color: (row.ipca ?? 0) < 0 ? ACCENT_COLORS.green : (row.ipca ?? 0) > 0.5 ? ACCENT_COLORS.red : C.text }}>{row.ipca !== null ? row.ipca.toFixed(2) : "—"}</td>
                        <td style={{ padding: "8px 14px", fontFamily: "'Fira Code', monospace", color: (row.ipca12m ?? 0) > 4.5 ? ACCENT_COLORS.red : (row.ipca12m ?? 0) > 3 ? ACCENT_COLORS.yellow : ACCENT_COLORS.green }}>{row.ipca12m !== null ? row.ipca12m.toFixed(2) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </>
        )}
      </main>

      <footer style={{
        padding: "16px 32px", borderTop: `1px solid ${C.cardBorder}`,
        textAlign: "center", color: C.textDim, fontSize: 11, fontFamily: "'Inter', sans-serif",
      }}>
        Fonte: Banco Central do Brasil (BCB) — SGS/BCData • Séries 11 (SELIC), 1 (USD/BRL), 433 (IPCA)
      </footer>
    </div>
  );
}
