import { useState, useMemo, useEffect } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine, Cell
} from "recharts";

// ============================================================
// DATA - Séries do Banco Central do Brasil (BCB/SGS)
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
// COMPUTED DATA & KPIs
// ============================================================
function computeIPCA12m(data) {
  const results = [];
  for (let i = 11; i < data.length; i++) {
    const window = data.slice(i - 11, i + 1);
    let acc = 1;
    window.forEach(d => { acc *= (1 + d.v / 100); });
    results.push({ m: data[i].m, v: Math.round((acc - 1) * 10000) / 100 });
  }
  return results;
}

function computeReturns(data) {
  const results = [];
  for (let i = 1; i < data.length; i++) {
    const ret = ((data[i].v - data[i-1].v) / data[i-1].v) * 100;
    results.push({ m: data[i].m, v: Math.round(ret * 100) / 100 });
  }
  return results;
}

function computeVolatility(returns, windowSize = 6) {
  const results = [];
  for (let i = windowSize - 1; i < returns.length; i++) {
    const w = returns.slice(i - windowSize + 1, i + 1).map(r => r.v);
    const mean = w.reduce((a, b) => a + b, 0) / w.length;
    const variance = w.reduce((a, b) => a + (b - mean) ** 2, 0) / w.length;
    results.push({ m: returns[i].m, v: Math.round(Math.sqrt(variance) * 100) / 100 });
  }
  return results;
}

function pct(a, b) { return b !== 0 ? Math.round(((a - b) / b) * 10000) / 100 : 0; }
function last(arr) { return arr[arr.length - 1]; }
function prevN(arr, n) { return arr.length > n ? arr[arr.length - 1 - n] : arr[0]; }

// ============================================================
// THEME & STYLING
// ============================================================
const C = {
  bg: "#0B0F1A",
  card: "#111827",
  cardBorder: "#1E293B",
  surface: "#1A2332",
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  textDim: "#64748B",
  accent: "#3B82F6",
  accentGlow: "rgba(59,130,246,0.15)",
  green: "#10B981",
  greenDim: "rgba(16,185,129,0.15)",
  red: "#EF4444",
  redDim: "rgba(239,68,68,0.15)",
  yellow: "#F59E0B",
  yellowDim: "rgba(245,158,11,0.15)",
  purple: "#8B5CF6",
  orange: "#F97316",
  cyan: "#06B6D4",
  gridLine: "#1E293B",
};

const MONTHS_PT = {
  "01":"Jan","02":"Fev","03":"Mar","04":"Abr","05":"Mai","06":"Jun",
  "07":"Jul","08":"Ago","09":"Set","10":"Out","11":"Nov","12":"Dez"
};

function fmtMonth(m) {
  const [y, mo] = m.split("-");
  return `${MONTHS_PT[mo]}/${y.slice(2)}`;
}

function fmtBRL(v) { return `R$ ${v.toFixed(2).replace(".", ",")}`; }
function fmtPct(v) { return `${v >= 0 ? "+" : ""}${v.toFixed(2).replace(".", ",")}%`; }

// ============================================================
// COMPONENTS
// ============================================================

function KPICard({ title, value, subtitle, change, changeLabel, status, icon }) {
  const statusColor = status === "up" ? C.green : status === "down" ? C.red : status === "alert" ? C.yellow : C.accent;
  const statusBg = status === "up" ? C.greenDim : status === "down" ? C.redDim : status === "alert" ? C.yellowDim : C.accentGlow;

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.cardBorder}`,
      borderRadius: 16,
      padding: "24px 28px",
      position: "relative",
      overflow: "hidden",
      transition: "all 0.3s ease",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = statusColor; e.currentTarget.style.boxShadow = `0 0 30px ${statusBg}`; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: statusBg, borderRadius: "0 16px 0 80px", opacity: 0.5 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ color: C.textMuted, fontSize: 13, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>{title}</span>
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, color: C.text, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.1 }}>
        {value}
      </div>
      {subtitle && <div style={{ color: C.textDim, fontSize: 13, marginTop: 4 }}>{subtitle}</div>}
      {change !== undefined && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          marginTop: 12, padding: "4px 10px", borderRadius: 8,
          background: statusBg, color: statusColor, fontSize: 13, fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace"
        }}>
          <span>{change >= 0 ? "▲" : "▼"}</span>
          <span>{fmtPct(change)}</span>
          {changeLabel && <span style={{ color: C.textDim, fontWeight: 400, fontFamily: "inherit" }}>• {changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, children, span = 1 }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.cardBorder}`,
      borderRadius: 16,
      padding: "24px 20px 16px",
      gridColumn: span > 1 ? `span ${span}` : undefined,
    }}>
      <div style={{ marginBottom: 16, paddingLeft: 8 }}>
        <div style={{ color: C.text, fontSize: 16, fontWeight: 600 }}>{title}</div>
        {subtitle && <div style={{ color: C.textDim, fontSize: 12, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function InsightBadge({ type, text }) {
  const colors = {
    alert: { bg: C.redDim, fg: C.red, icon: "⚠️" },
    info: { bg: C.accentGlow, fg: C.accent, icon: "ℹ️" },
    positive: { bg: C.greenDim, fg: C.green, icon: "✅" },
    warning: { bg: C.yellowDim, fg: C.yellow, icon: "⚡" },
  };
  const c = colors[type] || colors.info;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "14px 16px", borderRadius: 12,
      background: c.bg, border: `1px solid ${c.fg}22`,
      marginBottom: 10
    }}>
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
      <span style={{ color: c.fg, fontSize: 13, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer",
      background: active ? C.accent : "transparent",
      color: active ? "#fff" : C.textMuted,
      fontSize: 14, fontWeight: 600, transition: "all 0.2s",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {children}
    </button>
  );
}

function FilterPill({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 14px", borderRadius: 20, border: `1px solid ${active ? C.accent : C.cardBorder}`,
      background: active ? C.accentGlow : "transparent",
      color: active ? C.accent : C.textDim,
      fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {children}
    </button>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1A2332", border: `1px solid ${C.cardBorder}`,
      borderRadius: 10, padding: "10px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
    }}>
      <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
          <span style={{ color: C.textDim, fontSize: 12 }}>{p.name}:</span>
          <span style={{ color: C.text, fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
            {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// MAIN APP
// ============================================================
export default function Dashboard() {
  const [page, setPage] = useState("exec");
  const [period, setPeriod] = useState("36m");
  const [animIn, setAnimIn] = useState(true);

  useEffect(() => {
    setAnimIn(false);
    const t = setTimeout(() => setAnimIn(true), 50);
    return () => clearTimeout(t);
  }, [page]);

  // Filter data by period
  const filterByPeriod = (data) => {
    const months = period === "12m" ? 12 : period === "24m" ? 24 : 36;
    return data.slice(-months);
  };

  // Compute KPIs
  const kpis = useMemo(() => {
    const selicNow = last(SELIC_DATA).v;
    const selicPrev = prevN(SELIC_DATA, 1).v;
    const usdNow = last(USD_DATA).v;
    const usd7d = prevN(USD_DATA, 0).v; // same month for monthly
    const usd30d = prevN(USD_DATA, 1).v;
    const usdRet7d = pct(usdNow, usd7d);
    const usdRet30d = pct(usdNow, usd30d);

    const ipca12m = computeIPCA12m(IPCA_DATA);
    const ipca12mNow = last(ipca12m)?.v || 0;

    const usdReturns = computeReturns(USD_DATA);
    const vol = computeVolatility(usdReturns);
    const volNow = last(vol)?.v || 0;

    // Percentile of USD
    const usdValues = USD_DATA.map(d => d.v).sort((a, b) => a - b);
    const belowCount = usdValues.filter(v => v <= usdNow).length;
    const percentile = Math.round((belowCount / usdValues.length) * 100);

    return {
      selicNow, selicVar30d: selicNow - selicPrev,
      usdNow, usdRet7d, usdRet30d, volNow,
      usdPercentile: percentile,
      usdAlert: percentile >= 90 ? "ALTO" : percentile >= 75 ? "ELEVADO" : "NORMAL",
      ipcaLastMonth: last(IPCA_DATA)?.v || 0,
      ipca12m: ipca12mNow,
      ipcaVsMeta: Math.round((ipca12mNow - 3) * 100) / 100,
      ipcaAboveCeiling: ipca12mNow > 4.5,
      ipca12mSeries: ipca12m,
    };
  }, []);

  // Combined chart data
  const combinedData = useMemo(() => {
    const filtered = filterByPeriod(SELIC_DATA);
    return filtered.map(s => {
      const usd = USD_DATA.find(u => u.m === s.m);
      const ipca = IPCA_DATA.find(i => i.m === s.m);
      const ipca12 = kpis.ipca12mSeries.find(i => i.m === s.m);
      return {
        name: fmtMonth(s.m),
        month: s.m,
        selic: s.v,
        usd: usd?.v || null,
        ipca: ipca?.v || null,
        ipca12m: ipca12?.v || null,
      };
    });
  }, [period, kpis]);

  // USD returns for volatility chart
  const usdReturnsData = useMemo(() => {
    const returns = computeReturns(filterByPeriod(USD_DATA));
    return returns.map(r => ({ name: fmtMonth(r.m), retorno: r.v }));
  }, [period]);

  const volData = useMemo(() => {
    const returns = computeReturns(USD_DATA);
    const vol = computeVolatility(returns);
    return filterByPeriod(vol).map(v => ({ name: fmtMonth(v.m), volatilidade: v.v }));
  }, [period]);

  // IPCA bar chart
  const ipcaBarData = useMemo(() => {
    return filterByPeriod(IPCA_DATA).map(d => ({
      name: fmtMonth(d.m),
      ipca: d.v,
      fill: d.v < 0 ? C.green : d.v > 0.5 ? C.red : C.accent,
    }));
  }, [period]);

  // Correlation data (SELIC vs USD scatter-like)
  const corrData = useMemo(() => {
    return combinedData.filter(d => d.selic && d.usd).map(d => ({
      name: d.name,
      selic: d.selic,
      usd: d.usd,
    }));
  }, [combinedData]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{
        padding: "20px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${C.cardBorder}`,
        background: "rgba(11,15,26,0.8)",
        backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 700, color: "#fff",
          }}>₿</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>
              Painel Financeiro BCB
            </div>
            <div style={{ fontSize: 11, color: C.textDim }}>
              
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TabButton active={page === "exec"} onClick={() => setPage("exec")}>
            📊 Executivo
          </TabButton>
          <TabButton active={page === "detail"} onClick={() => setPage("detail")}>
            🔍 Detalhamento
          </TabButton>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <FilterPill active={period === "12m"} onClick={() => setPeriod("12m")}>12M</FilterPill>
          <FilterPill active={period === "24m"} onClick={() => setPeriod("24m")}>24M</FilterPill>
          <FilterPill active={period === "36m"} onClick={() => setPeriod("36m")}>36M</FilterPill>
        </div>
      </header>

      <main style={{
        padding: "28px 32px",
        maxWidth: 1440, margin: "0 auto",
        opacity: animIn ? 1 : 0,
        transform: animIn ? "translateY(0)" : "translateY(8px)",
        transition: "all 0.4s ease",
      }}>

        {page === "exec" && (
          <>
            {/* KPI Cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16, marginBottom: 28,
            }}>
              <KPICard
                title="SELIC Meta"
                icon="🎯"
                value={`${kpis.selicNow.toFixed(2)}%`}
                subtitle="Taxa básica de juros (% a.a.)"
                change={kpis.selicVar30d}
                changeLabel="vs mês anterior"
                status={kpis.selicVar30d > 0 ? "up" : kpis.selicVar30d < 0 ? "down" : "alert"}
              />
              <KPICard
                title="USD/BRL"
                icon="💵"
                value={fmtBRL(kpis.usdNow)}
                subtitle={`Percentil ${kpis.usdPercentile}% • ${kpis.usdAlert}`}
                change={kpis.usdRet30d}
                changeLabel="30 dias"
                status={kpis.usdRet30d > 2 ? "alert" : kpis.usdRet30d > 0 ? "up" : "down"}
              />
              <KPICard
                title="IPCA Acum. 12M"
                icon="📈"
                value={`${kpis.ipca12m.toFixed(2)}%`}
                subtitle={`Meta CMN: 3,00% • Teto: 4,50%`}
                change={kpis.ipcaVsMeta}
                changeLabel="vs meta"
                status={kpis.ipcaAboveCeiling ? "alert" : kpis.ipcaVsMeta > 0 ? "up" : "down"}
              />
              <KPICard
                title="Volatilidade USD 6M"
                icon="⚡"
                value={`${kpis.volNow.toFixed(2)}%`}
                subtitle="Desvio-padrão dos retornos mensais"
                status={kpis.volNow > 3 ? "alert" : kpis.volNow > 2 ? "up" : "down"}
              />
              <KPICard
                title="IPCA Último Mês"
                icon="🔥"
                value={`${kpis.ipcaLastMonth.toFixed(2)}%`}
                subtitle={`${last(IPCA_DATA).m}`}
                status={kpis.ipcaLastMonth > 0.5 ? "alert" : kpis.ipcaLastMonth > 0 ? "up" : "down"}
              />
            </div>

            {/* Insights */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span>💡</span> Insights & Alertas
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 10 }}>
                {kpis.ipcaAboveCeiling && (
                  <InsightBadge type="alert"
                    text={`IPCA acumulado 12M (${kpis.ipca12m.toFixed(2)}%) está ACIMA do teto da meta CMN de 4,50%. Pressão inflacionária justifica manutenção da SELIC em patamar restritivo.`}
                  />
                )}
                {!kpis.ipcaAboveCeiling && kpis.ipcaVsMeta > 0 && (
                  <InsightBadge type="warning"
                    text={`IPCA acumulado 12M (${kpis.ipca12m.toFixed(2)}%) está acima da meta de 3,00%, mas dentro do intervalo de tolerância. Vigilância necessária.`}
                  />
                )}
                {!kpis.ipcaAboveCeiling && kpis.ipcaVsMeta <= 0 && (
                  <InsightBadge type="positive"
                    text={`IPCA acumulado 12M (${kpis.ipca12m.toFixed(2)}%) está DENTRO da meta CMN de 3,00%. Cenário favorável para flexibilização monetária.`}
                  />
                )}
                <InsightBadge type={kpis.usdPercentile >= 75 ? "warning" : "info"}
                  text={`USD/BRL no percentil ${kpis.usdPercentile}% da janela histórica. ${kpis.usdPercentile >= 75 ? "Câmbio em patamar elevado — atenção ao pass-through inflacionário." : "Câmbio em patamar moderado no histórico recente."}`}
                />
                <InsightBadge type="info"
                  text={`Ciclo de aperto monetário: SELIC subiu de 10,50% (mai/24) para 15,00% (jun/25) — alta de 4,50 p.p. em 7 reuniões. Copom sinaliza manutenção prolongada.`}
                />
                {kpis.selicNow >= 14 && kpis.usdRet30d < 0 && (
                  <InsightBadge type="positive"
                    text={`Correlação SELIC alta vs apreciação cambial: juros elevados atraem capital externo, contribuindo para queda recente do dólar (${fmtPct(kpis.usdRet30d)} em 30d).`}
                  />
                )}
              </div>
            </div>

            {/* Main Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <ChartCard title="SELIC Meta vs USD/BRL" subtitle="Evolução comparativa — eixos duplos">
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={combinedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} />
                    <XAxis dataKey="name" tick={{ fill: C.textDim, fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis yAxisId="left" tick={{ fill: C.accent, fontSize: 10 }} domain={['auto','auto']} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: C.orange, fontSize: 10 }} domain={['auto','auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: C.textMuted }} />
                    <Line yAxisId="left" type="stepAfter" dataKey="selic" stroke={C.accent} name="SELIC (%)" strokeWidth={2.5} dot={false} />
                    <Area yAxisId="right" type="monotone" dataKey="usd" stroke={C.orange} fill={`${C.orange}15`} name="USD/BRL" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="IPCA Mensal" subtitle="Variação % mês a mês com destaque para deflações">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={ipcaBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} />
                    <XAxis dataKey="name" tick={{ fill: C.textDim, fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: C.textDim, fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <ChartCard title="IPCA Acumulado 12 Meses" subtitle="Índice vs Meta CMN (3,00%) e Teto (4,50%)">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={combinedData.filter(d => d.ipca12m !== null)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} />
                    <XAxis dataKey="name" tick={{ fill: C.textDim, fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: C.textDim, fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={3} stroke={C.green} strokeDasharray="5 5" label={{ value: "Meta 3%", fill: C.green, fontSize: 10, position: "insideTopRight" }} />
                    <ReferenceLine y={4.5} stroke={C.red} strokeDasharray="5 5" label={{ value: "Teto 4,5%", fill: C.red, fontSize: 10, position: "insideTopRight" }} />
                    <Area type="monotone" dataKey="ipca12m" stroke={C.purple} fill={`${C.purple}20`} name="IPCA 12M (%)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="SELIC vs IPCA 12M" subtitle="Relação entre juro real e inflação acumulada">
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={combinedData.filter(d => d.ipca12m !== null)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} />
                    <XAxis dataKey="name" tick={{ fill: C.textDim, fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: C.textDim, fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: C.textMuted }} />
                    <Line type="stepAfter" dataKey="selic" stroke={C.accent} name="SELIC (%)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ipca12m" stroke={C.red} name="IPCA 12M (%)" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        )}

        {page === "detail" && (
          <>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              Detalhamento & Exploração
            </div>
            <div style={{ color: C.textDim, fontSize: 13, marginBottom: 24 }}>
              Análise aprofundada das séries com volatilidade, retornos e decomposição temporal
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <ChartCard title="Retornos Mensais USD/BRL" subtitle="Variação % mês a mês">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={usdReturnsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} />
                    <XAxis dataKey="name" tick={{ fill: C.textDim, fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: C.textDim, fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke={C.textDim} />
                    <Bar dataKey="retorno" name="Retorno (%)" radius={[3, 3, 0, 0]}>
                      {usdReturnsData.map((entry, index) => (
                        <Cell key={index} fill={entry.retorno >= 0 ? C.red : C.green} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Volatilidade Móvel USD/BRL (6M)" subtitle="Desvio-padrão dos retornos em janela móvel de 6 meses">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={volData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} />
                    <XAxis dataKey="name" tick={{ fill: C.textDim, fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: C.textDim, fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="volatilidade" stroke={C.yellow} fill={`${C.yellow}15`} name="Volatilidade (%)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <ChartCard title="USD/BRL — Série Histórica" subtitle="Evolução do câmbio com faixas de percentil">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={combinedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} />
                    <XAxis dataKey="name" tick={{ fill: C.textDim, fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: C.textDim, fontSize: 10 }} domain={['auto','auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    {(() => {
                      const vals = USD_DATA.map(d => d.v).sort((a, b) => a - b);
                      const p25 = vals[Math.floor(vals.length * 0.25)];
                      const p75 = vals[Math.floor(vals.length * 0.75)];
                      return (
                        <>
                          <ReferenceLine y={p25} stroke={C.green} strokeDasharray="4 4" label={{ value: `P25: ${p25.toFixed(2)}`, fill: C.green, fontSize: 10, position: "insideBottomRight" }} />
                          <ReferenceLine y={p75} stroke={C.red} strokeDasharray="4 4" label={{ value: `P75: ${p75.toFixed(2)}`, fill: C.red, fontSize: 10, position: "insideTopRight" }} />
                        </>
                      );
                    })()}
                    <Area type="monotone" dataKey="usd" stroke={C.cyan} fill={`${C.cyan}15`} name="USD/BRL" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Comparativo SELIC x IPCA x USD" subtitle="Todas as séries normalizadas na mesma visualização">
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={combinedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} />
                    <XAxis dataKey="name" tick={{ fill: C.textDim, fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis yAxisId="left" tick={{ fill: C.textDim, fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: C.textDim, fontSize: 10 }} domain={['auto','auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: C.textMuted }} />
                    <Line yAxisId="left" type="stepAfter" dataKey="selic" stroke={C.accent} name="SELIC" strokeWidth={2} dot={false} />
                    <Line yAxisId="left" type="monotone" dataKey="ipca12m" stroke={C.red} name="IPCA 12M" strokeWidth={2} dot={false} />
                    <Area yAxisId="right" type="monotone" dataKey="usd" stroke={C.orange} fill="transparent" name="USD/BRL" strokeWidth={1.5} strokeDasharray="4 4" />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Data Table */}
            <ChartCard title="Tabela de Dados — Séries Completas" subtitle="Todos os valores por mês" span={2}>
              <div style={{ maxHeight: 400, overflowY: "auto", borderRadius: 8, border: `1px solid ${C.cardBorder}` }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ position: "sticky", top: 0, background: C.surface, zIndex: 1 }}>
                      {["Mês", "SELIC (%)", "USD/BRL", "IPCA Mensal (%)", "IPCA Acum. 12M (%)"].map(h => (
                        <th key={h} style={{
                          padding: "10px 14px", textAlign: "left",
                          color: C.textMuted, fontWeight: 600, fontSize: 11,
                          textTransform: "uppercase", letterSpacing: 0.5,
                          borderBottom: `1px solid ${C.cardBorder}`,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...combinedData].reverse().map((row, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.cardBorder}22` }}
                        onMouseEnter={e => e.currentTarget.style.background = C.accentGlow}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "8px 14px", color: C.text, fontWeight: 500, fontFamily: "'JetBrains Mono', monospace" }}>{row.name}</td>
                        <td style={{ padding: "8px 14px", color: C.accent, fontFamily: "'JetBrains Mono', monospace" }}>{row.selic?.toFixed(2) || "—"}</td>
                        <td style={{ padding: "8px 14px", color: C.orange, fontFamily: "'JetBrains Mono', monospace" }}>{row.usd?.toFixed(4) || "—"}</td>
                        <td style={{ padding: "8px 14px", fontFamily: "'JetBrains Mono', monospace", color: row.ipca < 0 ? C.green : row.ipca > 0.5 ? C.red : C.text }}>{row.ipca !== null ? row.ipca.toFixed(2) : "—"}</td>
                        <td style={{ padding: "8px 14px", fontFamily: "'JetBrains Mono', monospace", color: row.ipca12m > 4.5 ? C.red : row.ipca12m > 3 ? C.yellow : C.green }}>{row.ipca12m !== null ? row.ipca12m.toFixed(2) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        padding: "16px 32px", borderTop: `1px solid ${C.cardBorder}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        color: C.textDim, fontSize: 11,
      }}>
        <span>
          Fonte: Banco Central do Brasil (BCB) — SGS/BCData • Séries 11 (SELIC), 1 (USD/BRL), 433 (IPCA)
        </span>
        <span>
          Pipeline: Python (requests + pandas) → JSON → React Dashboard
        </span>
      </footer>
    </div>
  );
}
