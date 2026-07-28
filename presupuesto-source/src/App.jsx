import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  Plus, Trash2, Pencil, Check, X, LayoutDashboard, Wallet, PiggyBank,
  CreditCard, ChevronDown, ChevronUp, Info,
} from "lucide-react";

const STORAGE_KEY = "cr-budget-data-v2";
const DEFAULT_RATE = 453;

const C = {
  bg: "#12161C",
  surface: "#1A1F27",
  surface2: "#222833",
  border: "#2B323D",
  text: "#E8EBEF",
  textMuted: "#8A94A3",
  textFaint: "#5B6472",
  income: "#33C9A0",
  fixed: "#5B8DEF",
  variable: "#E3B341",
  sinking: "#A78BFA",
  debt: "#F2684B",
  danger: "#F2684B",
};

function seedData() {
  return {
    rate: DEFAULT_RATE,
    income: [{ id: "inc-1", name: "Net Monthly Income (post-pension)", amount: 1332500, currency: "CRC" }],
    budget: [
      {
        id: "fixed", label: "Fixed Expenses", type: "expense",
        items: [
          { id: "fx-1", name: "Rent", amount: 400, currency: "USD" },
          { id: "fx-2", name: "Water (your half)", amount: 6250, currency: "CRC" },
          { id: "fx-3", name: "Electricity (your half, placeholder)", amount: 12500, currency: "CRC" },
          { id: "fx-4", name: "Internet (your half)", amount: 11750, currency: "CRC" },
          { id: "fx-5", name: "Phone (service + Kolbi installment)", amount: 29500, currency: "CRC" },
          { id: "fx-6", name: "iCloud", amount: 2.19, currency: "USD" },
          { id: "fx-7", name: "Spotify", amount: 8.99, currency: "USD" },
          { id: "fx-8", name: "Claude", amount: 20, currency: "USD" },
          { id: "fx-9", name: "Smartfit", amount: 46, currency: "USD" },
          { id: "fx-10", name: "Bank Fees", amount: 2000, currency: "CRC" },
          { id: "fx-11", name: "University - Regular Classes", amount: 84500, currency: "CRC" },
        ],
      },
      {
        id: "variable", label: "Variable Expenses", type: "expense",
        items: [
          { id: "vr-1", name: "Groceries", amount: 86600, currency: "CRC" },
          { id: "vr-2", name: "Gasoline", amount: 70000, currency: "CRC" },
          { id: "vr-3", name: "Discretionary Shopping", amount: 30000, currency: "CRC" },
          { id: "vr-4", name: "Haircuts", amount: 21447, currency: "CRC" },
          { id: "vr-5", name: "Car Wash", amount: 14430, currency: "CRC" },
          { id: "vr-6", name: "Flowers (girlfriend)", amount: 17316, currency: "CRC" },
          { id: "vr-7", name: "Movie Dates", amount: 32490, currency: "CRC" },
          { id: "vr-8", name: "Dinner Dates", amount: 32490, currency: "CRC" },
          { id: "vr-9", name: "Office Breakfast", amount: 9743, currency: "CRC" },
          { id: "vr-10", name: "Office Lunch", amount: 11691, currency: "CRC" },
          { id: "vr-11", name: "Office Coke", amount: 8444, currency: "CRC" },
          { id: "vr-12", name: "Uber Eats", amount: 34640, currency: "CRC" },
          { id: "vr-13", name: "Physical Therapy", amount: 4350, currency: "CRC" },
        ],
      },
      {
        id: "onetime", label: "One-Time Expenses", type: "onetime",
        items: [
          { id: "ot-1", name: "AC Unit Final Payment", amount: 100000, currency: "CRC" },
          { id: "ot-2", name: "Promerica Prenda Release Fee", amount: 100000, currency: "CRC", deferred: true },
        ],
      },
    ],
    sinkingFunds: [
      { id: "sk-1", name: "Marchamo", totalAmount: 200000, currency: "CRC", periodMonths: 12 },
      { id: "sk-2", name: "Car Maintenance", totalAmount: 50000, currency: "CRC", periodMonths: 6 },
      { id: "sk-3", name: "Car Repair Buffer", totalAmount: 180000, currency: "CRC", periodMonths: 12 },
      { id: "sk-4", name: "Tech Replacement - MacBook Air", totalAmount: 1000, currency: "USD", periodMonths: 24 },
      { id: "sk-5", name: "Tech Replacement - iPhone", totalAmount: 800, currency: "USD", periodMonths: 30 },
      { id: "sk-6", name: "Tech Replacement - AirPods", totalAmount: 200, currency: "USD", periodMonths: 18 },
      { id: "sk-7", name: "Girlfriend Gifts", totalAmount: 300, currency: "USD", periodMonths: 12 },
      { id: "sk-8", name: "Travel Fund", totalAmount: 2000, currency: "USD", periodMonths: 12 },
      { id: "sk-9", name: "University - Suficiencia", totalAmount: 170000, currency: "CRC", periodMonths: 4 },
    ],
    debts: [
      { id: "db-1", name: "Credit Card - Colones portion", balance: 332767, currency: "CRC", rate: 36.23, minPaymentMode: "percent", minPaymentPercent: 7.27, minPaymentFloor: 15000, minPayment: 24179, extraPayment: 0 },
      { id: "db-2", name: "Credit Card - Dollars portion", balance: 120.91, currency: "USD", rate: 29.96, minPaymentMode: "percent", minPaymentPercent: 7.27, minPaymentFloor: 19, minPayment: 19, extraPayment: 0 },
      { id: "db-3", name: "Phone (Kolbi)", balance: 219096, currency: "CRC", rate: 0, minPaymentMode: "fixed", minPayment: 19000, extraPayment: 0 },
      { id: "db-4", name: "AC Unit (friend)", balance: 70000, currency: "CRC", rate: 0, minPaymentMode: "fixed", minPayment: 0, extraPayment: 0 },
    ],
  };
}

const toCRC = (amount, currency, rate) => (currency === "USD" ? amount * rate : amount);
const fmt = (n) => "₡" + Math.round(n || 0).toLocaleString("en-US");
const uid = (p) => p + "-" + Math.random().toString(36).slice(2, 9);

// Effective minimum payment (in CRC) for a debt, given its CURRENT balance in CRC.
// "percent" mode estimates the minimum as the greater of a floor and a % of balance —
// this is what lets the minimum shrink automatically as the balance drops, instead of
// staying frozen at whatever number was true the day you looked at your statement.
function effectiveMinPaymentCRC(debt, currentBalanceCRC, rate) {
  if (debt.minPaymentMode === "percent") {
    const floorCRC = toCRC(debt.minPaymentFloor || 0, debt.currency, rate);
    const pctAmount = currentBalanceCRC * ((debt.minPaymentPercent || 0) / 100);
    return Math.max(floorCRC, pctAmount);
  }
  return toCRC(debt.minPayment, debt.currency, rate);
}

function payoffSeries(balanceCRC, ratePct, extraPaymentCRC, debt, rate, maxMonths = 36) {
  const arr = [{ month: 0, balance: Math.round(balanceCRC), minPayment: null }];
  let bal = balanceCRC;
  const mRate = ratePct / 100 / 12;
  for (let m = 1; m <= maxMonths; m++) {
    if (bal <= 0) break;
    const minPay = effectiveMinPaymentCRC(debt, bal, rate);
    const interest = bal * mRate;
    bal = bal + interest - (minPay + extraPaymentCRC);
    if (bal < 0) bal = 0;
    arr.push({ month: m, balance: Math.round(bal), minPayment: Math.round(minPay) });
    if (bal <= 0) break;
  }
  return arr;
}

function growthSeries(balanceCRC, ratePct, months = 12) {
  const arr = [{ month: 0, balance: Math.round(balanceCRC) }];
  let bal = balanceCRC;
  const mRate = ratePct / 100 / 12;
  for (let m = 1; m <= months; m++) {
    bal = bal * (1 + mRate);
    arr.push({ month: m, balance: Math.round(bal) });
  }
  return arr;
}

function monthsToPayoffLabel(series, maxMonths) {
  const last = series[series.length - 1];
  if (last.balance <= 0) return `${series.length - 1} mo`;
  return `> ${maxMonths} mo`;
}

export default function BudgetApp() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        setData(res && res.value ? JSON.parse(res.value) : seedData());
      } catch (e) {
        setData(seedData());
      }
      setLoading(false);
    })();
  }, []);

  const persist = useCallback(async (next) => {
    setData(next);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(next)); } catch (e) { console.error(e); }
  }, []);

  const totals = useMemo(() => {
    if (!data) return null;
    const incomeTotal = data.income.reduce((s, i) => s + toCRC(i.amount, i.currency, data.rate), 0);

    const budgetSectionTotals = data.budget.map((sec) => ({
      ...sec,
      total: sec.items.reduce((s, i) => s + toCRC(i.amount, i.currency, data.rate), 0),
    }));
    const expenseTotal = budgetSectionTotals
      .filter((s) => s.type === "expense")
      .reduce((s, sec) => s + sec.total, 0);
    const oneTimeTotal = budgetSectionTotals
      .filter((s) => s.type === "onetime")
      .reduce((s, sec) => s + sec.total, 0);

    const sinkingItemsCalc = data.sinkingFunds.map((f) => {
      const totalCRC = toCRC(f.totalAmount, f.currency, data.rate);
      const monthly = f.periodMonths > 0 ? totalCRC / f.periodMonths : 0;
      return { ...f, monthly, quincena: monthly / 2 };
    });
    const sinkingMonthlyTotal = sinkingItemsCalc.reduce((s, f) => s + f.monthly, 0);

    const debtsCalc = data.debts.map((d) => {
      const balanceCRC = toCRC(d.balance, d.currency, data.rate);
      return {
        ...d,
        balanceCRC,
        minPaymentCRC: effectiveMinPaymentCRC(d, balanceCRC, data.rate),
        extraPaymentCRC: toCRC(d.extraPayment || 0, d.currency, data.rate),
      };
    });
    const debtMinPayments = debtsCalc.reduce((s, d) => s + d.minPaymentCRC, 0);
    const totalDebtBalance = debtsCalc.reduce((s, d) => s + d.balanceCRC, 0);

    const totalExpenses = expenseTotal + sinkingMonthlyTotal;
    const surplus = incomeTotal - totalExpenses - debtMinPayments;

    return {
      incomeTotal, budgetSectionTotals, expenseTotal, oneTimeTotal,
      sinkingItemsCalc, sinkingMonthlyTotal, debtsCalc, debtMinPayments,
      totalDebtBalance, totalExpenses, surplus,
    };
  }, [data]);

  if (loading || !data || !totals) {
    return (
      <div style={{ background: C.bg, color: C.text, minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", padding: 40 }}>
        Loading budget…
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100%", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <GlobalStyle />
      <div style={{ maxWidth: 460, margin: "0 auto", paddingBottom: 78 }}>
        <Header rate={data.rate} onRateChange={(r) => persist({ ...data, rate: r })} />
        {tab === "dashboard" && <Dashboard data={data} totals={totals} />}
        {tab === "budget" && <BudgetTab data={data} persist={persist} totals={totals} />}
        {tab === "sinking" && <SinkingTab data={data} persist={persist} totals={totals} />}
        {tab === "debts" && <DebtsTab data={data} persist={persist} totals={totals} />}
      </div>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

function GlobalStyle() {
  return (
    <style>{`
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      .num { font-variant-numeric: tabular-nums; }
      button { cursor: pointer; font-family: inherit; }
      input, select { font-family: inherit; }
      input:focus, select:focus { outline: 2px solid ${C.income}55; }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
      .field { width: 100%; padding: 9px 10px; border-radius: 8px; border: 1px solid ${C.border}; background: ${C.surface2}; color: ${C.text}; font-size: 14px; }
      .field::placeholder { color: ${C.textFaint}; }
    `}</style>
  );
}

function Header({ rate, onRateChange }) {
  return (
    <div style={{ padding: "18px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: C.income, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Wallet size={16} color="#0F1318" />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.2 }}>Presupuesto</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: "6px 9px" }}>
        <span style={{ fontSize: 11, color: C.textMuted }}>₡/$</span>
        <input
          type="number"
          value={rate}
          onChange={(e) => onRateChange(parseFloat(e.target.value) || 0)}
          className="num"
          style={{ width: 52, border: "none", background: "transparent", color: C.text, fontSize: 13, fontWeight: 600 }}
        />
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "budget", label: "Budget", icon: Wallet },
    { id: "sinking", label: "Sinking", icon: PiggyBank },
    { id: "debts", label: "Debts", icon: CreditCard },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface,
      borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "center",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      <div style={{ maxWidth: 460, width: "100%", display: "flex" }}>
        {items.map((it) => {
          const Icon = it.icon;
          const active = tab === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              style={{
                flex: 1, background: "none", border: "none", padding: "10px 4px 8px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                color: active ? C.income : C.textMuted,
              }}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Dashboard({ data, totals }) {
  const [showInfo, setShowInfo] = useState(false);
  const surplus = totals.surplus;

  const donutData = [
    { name: "Fixed", value: Math.round(totals.budgetSectionTotals.find((s) => s.id === "fixed")?.total || 0), color: C.fixed },
    { name: "Variable", value: Math.round(totals.budgetSectionTotals.find((s) => s.id === "variable")?.total || 0), color: C.variable },
    { name: "Sinking Funds", value: Math.round(totals.sinkingMonthlyTotal), color: C.sinking },
    { name: "Debt Payments", value: Math.round(totals.debtMinPayments), color: C.debt },
  ];
  if (surplus > 0) donutData.push({ name: "Surplus", value: Math.round(surplus), color: C.income });
  else if (surplus < 0) donutData.push({ name: "Shortfall", value: Math.round(-surplus), color: "#D63C2A" });

  return (
    <div style={{ padding: "4px 16px 16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <StatCard label="Income" value={fmt(totals.incomeTotal)} color={C.income} />
        <StatCard label="Total Expenses" value={fmt(totals.totalExpenses)} color={C.text} />
        <StatCard
          label="Debt Min. Payments"
          value={fmt(totals.debtMinPayments)}
          color={C.debt}
          onInfo={() => setShowInfo((v) => !v)}
        />
        <StatCard label="Monthly Surplus" value={fmt(surplus)} color={surplus >= 0 ? C.income : "#D63C2A"} />
      </div>

      {showInfo && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 12.5, color: C.textMuted, lineHeight: 1.5 }}>
          <strong style={{ color: C.text }}>What's "Debt Min. Payments"?</strong> The minimum amount your creditors require each month (credit card minimums + phone installment). It's kept separate from "Total Expenses" because it's not a lifestyle cost — it's the floor payment on debt you already owe. Surplus = Income − Expenses − this figure.
        </div>
      )}

      {totals.oneTimeTotal > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 12.5, color: C.textMuted }}>
          <strong style={{ color: C.text }}>{fmt(totals.oneTimeTotal)}</strong> in pending one-time expenses (Budget tab) — not counted in Total Expenses or Surplus above.
        </div>
      )}

      <Card title="Your whole picture — income vs. where it goes">
        <ResponsiveContainer width="100%" height={230}>
          <PieChart>
            <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2} strokeWidth={0}>
              {donutData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmt(v)} />
            <Legend wrapperStyle={{ fontSize: 11, color: C.textMuted }} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card title="By category">
        {totals.budgetSectionTotals.filter(s => s.type === "expense").map((s) => (
          <Row key={s.id} dot={s.id === "fixed" ? C.fixed : C.variable} label={s.label} value={fmt(s.total)} />
        ))}
        <Row dot={C.sinking} label="Sinking Funds (monthly avg.)" value={fmt(totals.sinkingMonthlyTotal)} />
        <Row dot={C.debt} label="Debt Min. Payments" value={fmt(totals.debtMinPayments)} last />
      </Card>
    </div>
  );
}

function StatCard({ label, value, color, onInfo }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 13px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: C.textMuted }}>{label}</span>
        {onInfo && <button onClick={onInfo} style={{ background: "none", border: "none", padding: 0, color: C.textFaint, display: "flex" }}><Info size={12} /></button>}
      </div>
      <div className="num" style={{ fontSize: 17, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 15, marginBottom: 12 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ dot, label, value, last }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: last ? "none" : `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: 4, background: dot, display: "inline-block" }} />
        <span style={{ fontSize: 13 }}>{label}</span>
      </div>
      <span className="num" style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

const tooltipStyle = { background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.text };

function BudgetTab({ data, persist, totals }) {
  const [addingTo, setAddingTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", amount: "", currency: "CRC" });
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");

  const addItem = (sectionId) => {
    if (!draft.name.trim() || draft.amount === "") return;
    const item = { id: uid("item"), name: draft.name.trim(), amount: parseFloat(draft.amount) || 0, currency: draft.currency };
    persist({
      ...data,
      budget: data.budget.map((s) => (s.id === sectionId ? { ...s, items: [...s.items, item] } : s)),
    });
    setDraft({ name: "", amount: "", currency: "CRC" });
    setAddingTo(null);
  };

  const removeItem = (sectionId, itemId) => {
    persist({
      ...data,
      budget: data.budget.map((s) => (s.id === sectionId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s)),
    });
  };

  const saveEdit = (sectionId, itemId, patch) => {
    persist({
      ...data,
      budget: data.budget.map((s) =>
        s.id === sectionId ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) } : s
      ),
    });
    setEditingId(null);
  };

  const removeSection = (sectionId) => persist({ ...data, budget: data.budget.filter((s) => s.id !== sectionId) });

  const addSection = () => {
    if (!newSectionName.trim()) return;
    persist({ ...data, budget: [...data.budget, { id: uid("sec"), label: newSectionName.trim(), type: "expense", items: [] }] });
    setNewSectionName("");
    setShowNewSection(false);
  };

  return (
    <div style={{ padding: "4px 16px 16px" }}>
      <Card title="Income">
        {data.income.map((inc) => (
          <Row key={inc.id} dot={C.income} label={inc.name} value={fmt(toCRC(inc.amount, inc.currency, data.rate))} last />
        ))}
      </Card>

      {data.budget.map((section) => {
        const secTotal = totals.budgetSectionTotals.find((s) => s.id === section.id)?.total || 0;
        return (
          <div key={section.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 15, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{section.label}</span>
                {section.type === "onetime" && (
                  <span style={{ fontSize: 9.5, color: C.textFaint, background: C.surface2, padding: "2px 6px", borderRadius: 999 }}>not in totals</span>
                )}
              </div>
              <button onClick={() => removeSection(section.id)} style={{ background: "none", border: "none", color: C.textFaint }}><Trash2 size={13} /></button>
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }} className="num">{fmt(secTotal)}/mo</div>

            {section.items.map((item) =>
              editingId === item.id ? (
                <EditRow
                  key={item.id}
                  item={item}
                  onSave={(patch) => saveEdit(section.id, item.id, patch)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13, flex: 1 }}>
                    {item.name}
                    {item.deferred && (
                      <span style={{ fontSize: 9.5, color: C.textFaint, background: C.surface2, padding: "2px 6px", borderRadius: 999, marginLeft: 6 }}>deferred</span>
                    )}
                  </span>
                  <span className="num" style={{ fontSize: 13, fontWeight: 600, marginRight: 8 }}>
                    {item.currency === "USD" ? `$${item.amount} · ` : ""}{fmt(toCRC(item.amount, item.currency, data.rate))}
                  </span>
                  <button onClick={() => setEditingId(item.id)} style={{ background: "none", border: "none", color: C.textMuted, padding: 4 }}><Pencil size={13} /></button>
                  <button onClick={() => removeItem(section.id, item.id)} style={{ background: "none", border: "none", color: C.danger, padding: 4 }}><Trash2 size={13} /></button>
                </div>
              )
            )}

            {addingTo === section.id ? (
              <AddRow draft={draft} setDraft={setDraft} onSave={() => addItem(section.id)} onCancel={() => setAddingTo(null)} />
            ) : (
              <button
                onClick={() => setAddingTo(section.id)}
                style={{ marginTop: 8, width: "100%", border: `1px dashed ${C.border}`, background: "none", color: C.income, borderRadius: 9, padding: "9px", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Plus size={14} /> Add entry
              </button>
            )}
          </div>
        );
      })}

      {showNewSection ? (
        <div style={{ display: "flex", gap: 8 }}>
          <input className="field" placeholder="Category name" value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} />
          <button onClick={addSection} style={{ border: "none", background: C.income, color: "#0F1318", borderRadius: 8, padding: "0 14px", fontWeight: 700, fontSize: 13 }}>Add</button>
          <button onClick={() => setShowNewSection(false)} style={{ border: "none", background: "none", color: C.textMuted }}><X size={16} /></button>
        </div>
      ) : (
        <button
          onClick={() => setShowNewSection(true)}
          style={{ width: "100%", border: `1px solid ${C.border}`, background: C.surface, color: C.text, borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <Plus size={14} /> Add category
        </button>
      )}
    </div>
  );
}

function AddRow({ draft, setDraft, onSave, onCancel }) {
  return (
    <div style={{ marginTop: 8, background: C.surface2, borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 7 }}>
      <input className="field" placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      <div style={{ display: "flex", gap: 7 }}>
        <input className="field" type="number" placeholder="Amount" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} style={{ flex: 1 }} />
        <select className="field" value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} style={{ width: 78 }}>
          <option value="CRC">CRC</option>
          <option value="USD">USD</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        <button onClick={onSave} style={{ flex: 1, border: "none", background: C.income, color: "#0F1318", borderRadius: 8, padding: "8px", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Check size={13} /> Save</button>
        <button onClick={onCancel} style={{ border: "none", background: "none", color: C.textMuted, padding: "8px 12px" }}><X size={14} /></button>
      </div>
    </div>
  );
}

function EditRow({ item, onSave, onCancel }) {
  const [d, setD] = useState(item);
  return (
    <div style={{ margin: "6px 0", background: C.surface2, borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 7 }}>
      <input className="field" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
      <div style={{ display: "flex", gap: 7 }}>
        <input className="field" type="number" value={d.amount} onChange={(e) => setD({ ...d, amount: parseFloat(e.target.value) || 0 })} style={{ flex: 1 }} />
        <select className="field" value={d.currency} onChange={(e) => setD({ ...d, currency: e.target.value })} style={{ width: 78 }}>
          <option value="CRC">CRC</option>
          <option value="USD">USD</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        <button onClick={() => onSave(d)} style={{ flex: 1, border: "none", background: C.income, color: "#0F1318", borderRadius: 8, padding: "8px", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Check size={13} /> Save</button>
        <button onClick={onCancel} style={{ border: "none", background: "none", color: C.textMuted, padding: "8px 12px" }}><X size={14} /></button>
      </div>
    </div>
  );
}

function SinkingTab({ data, persist, totals }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", totalAmount: "", currency: "CRC", periodMonths: "" });

  const addFund = () => {
    if (!draft.name.trim() || draft.totalAmount === "" || draft.periodMonths === "") return;
    const item = {
      id: uid("sk"), name: draft.name.trim(),
      totalAmount: parseFloat(draft.totalAmount) || 0,
      currency: draft.currency,
      periodMonths: parseFloat(draft.periodMonths) || 1,
    };
    persist({ ...data, sinkingFunds: [...data.sinkingFunds, item] });
    setDraft({ name: "", totalAmount: "", currency: "CRC", periodMonths: "" });
    setAdding(false);
  };

  const removeFund = (id) => persist({ ...data, sinkingFunds: data.sinkingFunds.filter((f) => f.id !== id) });
  const saveEdit = (id, patch) => {
    persist({ ...data, sinkingFunds: data.sinkingFunds.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
    setEditingId(null);
  };

  return (
    <div style={{ padding: "4px 16px 16px" }}>
      <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
        Enter the total cost and how many months it covers. The monthly amount and the per-quincena (biweekly) amount you should set aside are calculated automatically.
      </div>

      <Card title="Total sinking funds">
        <Row dot={C.sinking} label="Per month" value={fmt(totals.sinkingMonthlyTotal)} />
        <Row dot={C.sinking} label="Per quincena" value={fmt(totals.sinkingMonthlyTotal / 2)} last />
      </Card>

      {totals.sinkingItemsCalc.map((f) =>
        editingId === f.id ? (
          <SinkEditCard key={f.id} item={f} onSave={(patch) => saveEdit(f.id, patch)} onCancel={() => setEditingId(null)} />
        ) : (
          <div key={f.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{f.name}</div>
              <div style={{ display: "flex", gap: 2 }}>
                <button onClick={() => setEditingId(f.id)} style={{ background: "none", border: "none", color: C.textMuted, padding: 4 }}><Pencil size={13} /></button>
                <button onClick={() => removeFund(f.id)} style={{ background: "none", border: "none", color: C.danger, padding: 4 }}><Trash2 size={13} /></button>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 8 }}>
              {f.currency === "USD" ? `$${f.totalAmount}` : fmt(f.totalAmount)} total over {f.periodMonths} months
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, color: C.textMuted }}>Monthly</div>
                <div className="num" style={{ fontSize: 15, fontWeight: 700, color: C.sinking }}>{fmt(f.monthly)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.textMuted }}>Per quincena</div>
                <div className="num" style={{ fontSize: 15, fontWeight: 700 }}>{fmt(f.quincena)}</div>
              </div>
            </div>
          </div>
        )
      )}

      {adding ? (
        <div style={{ background: C.surface2, borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 7 }}>
          <input className="field" placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <div style={{ display: "flex", gap: 7 }}>
            <input className="field" type="number" placeholder="Total amount" value={draft.totalAmount} onChange={(e) => setDraft({ ...draft, totalAmount: e.target.value })} style={{ flex: 1 }} />
            <select className="field" value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} style={{ width: 78 }}>
              <option value="CRC">CRC</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <input className="field" type="number" placeholder="Period in months (e.g. 12)" value={draft.periodMonths} onChange={(e) => setDraft({ ...draft, periodMonths: e.target.value })} />
          <div style={{ display: "flex", gap: 7 }}>
            <button onClick={addFund} style={{ flex: 1, border: "none", background: C.income, color: "#0F1318", borderRadius: 8, padding: "8px", fontWeight: 700, fontSize: 13 }}>Save</button>
            <button onClick={() => setAdding(false)} style={{ border: "none", background: "none", color: C.textMuted, padding: "8px 12px" }}><X size={14} /></button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{ width: "100%", border: `1px dashed ${C.border}`, background: "none", color: C.income, borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <Plus size={14} /> Add sinking fund
        </button>
      )}
    </div>
  );
}

function SinkEditCard({ item, onSave, onCancel }) {
  const [d, setD] = useState(item);
  return (
    <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 10, display: "flex", flexDirection: "column", gap: 7 }}>
      <input className="field" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
      <div style={{ display: "flex", gap: 7 }}>
        <input className="field" type="number" value={d.totalAmount} onChange={(e) => setD({ ...d, totalAmount: parseFloat(e.target.value) || 0 })} style={{ flex: 1 }} />
        <select className="field" value={d.currency} onChange={(e) => setD({ ...d, currency: e.target.value })} style={{ width: 78 }}>
          <option value="CRC">CRC</option>
          <option value="USD">USD</option>
        </select>
      </div>
      <input className="field" type="number" value={d.periodMonths} onChange={(e) => setD({ ...d, periodMonths: parseFloat(e.target.value) || 1 })} placeholder="Period in months" />
      <div style={{ display: "flex", gap: 7 }}>
        <button onClick={() => onSave(d)} style={{ flex: 1, border: "none", background: C.income, color: "#0F1318", borderRadius: 8, padding: "8px", fontWeight: 700, fontSize: 13 }}>Save</button>
        <button onClick={onCancel} style={{ border: "none", background: "none", color: C.textMuted, padding: "8px 12px" }}><X size={14} /></button>
      </div>
    </div>
  );
}

function DebtsTab({ data, persist, totals }) {
  const [expandedId, setExpandedId] = useState(data.debts[0]?.id || null);
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", balance: "", currency: "CRC", rate: "", minPayment: "" });

  const updateDebt = (id, patch) => persist({ ...data, debts: data.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)) });
  const removeDebt = (id) => persist({ ...data, debts: data.debts.filter((d) => d.id !== id) });
  const addDebt = () => {
    if (!draft.name.trim() || draft.balance === "") return;
    const item = {
      id: uid("db"), name: draft.name.trim(),
      balance: parseFloat(draft.balance) || 0, currency: draft.currency,
      rate: parseFloat(draft.rate) || 0, minPaymentMode: "fixed",
      minPayment: parseFloat(draft.minPayment) || 0, extraPayment: 0,
    };
    persist({ ...data, debts: [...data.debts, item] });
    setDraft({ name: "", balance: "", currency: "CRC", rate: "", minPayment: "" });
    setAdding(false);
  };

  const aggregateSeries = useMemo(() => {
    const MAX = 24;
    const perDebt = totals.debtsCalc.map((d) =>
      payoffSeries(d.balanceCRC, d.rate, d.extraPaymentCRC, d, data.rate, MAX)
    );
    const out = [];
    for (let m = 0; m <= MAX; m++) {
      let sum = 0;
      perDebt.forEach((series) => {
        const lastMonth = series[series.length - 1].month;
        const point = series.find((p) => p.month === m);
        sum += m <= lastMonth ? (point ? point.balance : 0) : 0;
      });
      out.push({ month: m, balance: sum });
    }
    return out;
  }, [totals.debtsCalc]);

  return (
    <div style={{ padding: "4px 16px 16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <StatCard label="Total Debt" value={fmt(totals.totalDebtBalance)} color={C.debt} />
        <StatCard label="Min. Payments" value={fmt(totals.debtMinPayments)} color={C.text} />
      </div>

      <Card title="Total debt over time (with extra payments)">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={aggregateSeries} margin={{ left: -18, right: 8, top: 5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: C.textMuted }} label={{ value: "months", position: "insideBottom", fontSize: 10, fill: C.textFaint, dy: 10 }} />
            <YAxis tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmt(v)} labelFormatter={(m) => `Month ${m}`} />
            <Line type="monotone" dataKey="balance" stroke={C.debt} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 11, color: C.textFaint, marginTop: 6 }}>Set "Extra Payment" on each debt below to see this line drop faster.</div>
      </Card>

      {totals.debtsCalc.map((d) => (
        <DebtCard
          key={d.id}
          debt={d}
          rate={data.rate}
          expanded={expandedId === d.id}
          editing={editingId === d.id}
          onToggle={() => setExpandedId(expandedId === d.id ? null : d.id)}
          onEdit={() => setEditingId(d.id)}
          onCancelEdit={() => setEditingId(null)}
          onSave={(patch) => { updateDebt(d.id, patch); setEditingId(null); }}
          onRemove={() => removeDebt(d.id)}
          onExtraPaymentChange={(v) => updateDebt(d.id, { extraPayment: v })}
        />
      ))}

      {adding ? (
        <div style={{ background: C.surface2, borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 7 }}>
          <input className="field" placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <div style={{ display: "flex", gap: 7 }}>
            <input className="field" type="number" placeholder="Balance" value={draft.balance} onChange={(e) => setDraft({ ...draft, balance: e.target.value })} style={{ flex: 1 }} />
            <select className="field" value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} style={{ width: 78 }}>
              <option value="CRC">CRC</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            <input className="field" type="number" placeholder="Annual rate %" value={draft.rate} onChange={(e) => setDraft({ ...draft, rate: e.target.value })} style={{ flex: 1 }} />
            <input className="field" type="number" placeholder="Min payment" value={draft.minPayment} onChange={(e) => setDraft({ ...draft, minPayment: e.target.value })} style={{ flex: 1 }} />
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            <button onClick={addDebt} style={{ flex: 1, border: "none", background: C.income, color: "#0F1318", borderRadius: 8, padding: "8px", fontWeight: 700, fontSize: 13 }}>Save</button>
            <button onClick={() => setAdding(false)} style={{ border: "none", background: "none", color: C.textMuted, padding: "8px 12px" }}><X size={14} /></button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{ width: "100%", border: `1px dashed ${C.border}`, background: "none", color: C.income, borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <Plus size={14} /> Add debt
        </button>
      )}
    </div>
  );
}

function DebtCard({ debt, rate, expanded, editing, onToggle, onEdit, onCancelEdit, onSave, onRemove, onExtraPaymentChange }) {
  const [d, setD] = useState(debt);
  useEffect(() => { setD(debt); }, [editing]);

  const payoff = useMemo(() => payoffSeries(debt.balanceCRC, debt.rate, debt.extraPaymentCRC, debt, rate, 36), [debt, rate]);
  const growth = useMemo(() => growthSeries(debt.balanceCRC, debt.rate, 12), [debt]);
  const monthsLabel = monthsToPayoffLabel(payoff, 36);

  if (editing) {
    const isPercent = d.minPaymentMode === "percent";
    return (
      <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 10, display: "flex", flexDirection: "column", gap: 7 }}>
        <input className="field" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
        <div style={{ display: "flex", gap: 7 }}>
          <input className="field" type="number" value={d.balance} onChange={(e) => setD({ ...d, balance: parseFloat(e.target.value) || 0 })} style={{ flex: 1 }} />
          <select className="field" value={d.currency} onChange={(e) => setD({ ...d, currency: e.target.value })} style={{ width: 78 }}>
            <option value="CRC">CRC</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <input className="field" type="number" value={d.rate} onChange={(e) => setD({ ...d, rate: parseFloat(e.target.value) || 0 })} placeholder="Annual rate %" />

        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Minimum payment</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
          <button
            onClick={() => setD({ ...d, minPaymentMode: "fixed" })}
            style={{ flex: 1, padding: "7px", borderRadius: 7, border: `1px solid ${!isPercent ? C.income : C.border}`, background: !isPercent ? C.income + "22" : "transparent", color: !isPercent ? C.income : C.textMuted, fontSize: 12, fontWeight: 600 }}
          >
            Fixed amount
          </button>
          <button
            onClick={() => setD({ ...d, minPaymentMode: "percent" })}
            style={{ flex: 1, padding: "7px", borderRadius: 7, border: `1px solid ${isPercent ? C.income : C.border}`, background: isPercent ? C.income + "22" : "transparent", color: isPercent ? C.income : C.textMuted, fontSize: 12, fontWeight: 600 }}
          >
            Estimate (% of balance)
          </button>
        </div>

        {isPercent ? (
          <div style={{ display: "flex", gap: 7 }}>
            <input className="field" type="number" value={d.minPaymentPercent || 0} onChange={(e) => setD({ ...d, minPaymentPercent: parseFloat(e.target.value) || 0 })} placeholder="% of balance" style={{ flex: 1 }} />
            <input className="field" type="number" value={d.minPaymentFloor || 0} onChange={(e) => setD({ ...d, minPaymentFloor: parseFloat(e.target.value) || 0 })} placeholder="Floor amount" style={{ flex: 1 }} />
          </div>
        ) : (
          <input className="field" type="number" value={d.minPayment} onChange={(e) => setD({ ...d, minPayment: parseFloat(e.target.value) || 0 })} placeholder="Min payment" />
        )}

        <div style={{ display: "flex", gap: 7 }}>
          <button onClick={() => onSave(d)} style={{ flex: 1, border: "none", background: C.income, color: "#0F1318", borderRadius: 8, padding: "8px", fontWeight: 700, fontSize: 13 }}>Save</button>
          <button onClick={onCancelEdit} style={{ border: "none", background: "none", color: C.textMuted, padding: "8px 12px" }}><X size={14} /></button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{debt.name}</div>
          <div style={{ fontSize: 11, color: C.textFaint }}>
            {debt.rate}%/yr · min {fmt(debt.minPaymentCRC)}
            {debt.minPaymentMode === "percent" && (
              <span style={{ color: C.sinking }}> · estimated ({debt.minPaymentPercent}% of balance, updates as it drops)</span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          <button onClick={onEdit} style={{ background: "none", border: "none", color: C.textMuted, padding: 4 }}><Pencil size={13} /></button>
          <button onClick={onRemove} style={{ background: "none", border: "none", color: C.danger, padding: 4 }}><Trash2 size={13} /></button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: C.textMuted }}>Balance</div>
          <div className="num" style={{ fontSize: 15, fontWeight: 700 }}>{fmt(debt.balanceCRC)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: C.textMuted }}>Payoff time</div>
          <div className="num" style={{ fontSize: 15, fontWeight: 700, color: C.debt }}>{monthsLabel}</div>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Extra payment / month</div>
        <input
          type="number"
          className="field"
          value={debt.extraPayment || 0}
          onChange={(e) => onExtraPaymentChange(parseFloat(e.target.value) || 0)}
        />
      </div>

      <button
        onClick={onToggle}
        style={{ marginTop: 10, width: "100%", border: "none", background: "none", color: C.income, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "4px 0" }}
      >
        {expanded ? "Hide projections" : "View projections"} {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Balance if you pay min + extra</div>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={payoff} margin={{ left: -22, right: 8, top: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: C.textMuted }} />
              <YAxis tick={{ fontSize: 9, fill: C.textMuted }} tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmt(v)} labelFormatter={(m) => `Month ${m}`} />
              <Line type="monotone" dataKey="balance" stroke={C.income} strokeWidth={2.2} dot={false} />
            </LineChart>
          </ResponsiveContainer>

          {debt.rate > 0 && (
            <>
              <div style={{ fontSize: 11, color: C.textMuted, margin: "10px 0 4px" }}>Balance if left unpaid (interest only)</div>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={growth} margin={{ left: -22, right: 8, top: 5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: C.textMuted }} />
                  <YAxis tick={{ fontSize: 9, fill: C.textMuted }} tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmt(v)} labelFormatter={(m) => `Month ${m}`} />
                  <Line type="monotone" dataKey="balance" stroke={C.danger} strokeWidth={2.2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      )}
    </div>
  );
}
