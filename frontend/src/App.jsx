import { useState, useEffect, useCallback } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const API = 'https://gym-churn-predictorr.onrender.com'

const DEFAULTS = {
  gender: 1, Near_Location: 1, Partner: 0, Promo_friends: 0,
  Phone: 1, Contract_period: 1, Group_visits: 0,
  Age: 30, Avg_additional_charges_total: 120,
  Month_to_end_contract: 2, Lifetime: 6,
  Avg_class_frequency_total: 2.0,
  Avg_class_frequency_current_month: 1.5,
}

const S = {
  // KEY FIX: app is now height:100vh with overflow hidden, sidebar scrolls independently
  app: {
    display: 'grid', gridTemplateColumns: '340px 1fr',
    height: '100vh', overflow: 'hidden',
  },
  sidebar: {
    background: '#111', borderRight: '1px solid #1e1e1e',
    padding: '24px 20px',
    // KEY FIX: sidebar is independently scrollable
    overflowY: 'auto', overflowX: 'hidden',
    height: '100vh',
    display: 'flex', flexDirection: 'column', gap: 20,
    boxSizing: 'border-box',
  },
  main: {
    padding: '24px', display: 'flex', flexDirection: 'column', gap: 20,
    overflowY: 'auto', height: '100vh', boxSizing: 'border-box',
  },
  logo: {
    fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700,
    color: '#c8f135', letterSpacing: '-0.5px', marginBottom: 4,
  },
  tagline: { color: '#555', fontSize: 11 },
  sectionLabel: {
    fontSize: 10, fontWeight: 500, color: '#444', letterSpacing: '0.12em',
    textTransform: 'uppercase', marginBottom: 10, paddingBottom: 6,
    borderBottom: '1px solid #1e1e1e',
  },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 },
  fieldRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 12, color: '#888' },
  val: { fontSize: 12, fontWeight: 500, color: '#c8f135', fontFamily: 'DM Mono, monospace' },
  toggleRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '7px 0', borderBottom: '1px solid #1a1a1a',
  },
  card: {
    background: '#111', border: '1px solid #1e1e1e', borderRadius: 6,
    padding: '16px 18px',
  },
  riskBig: {
    fontFamily: 'Syne, sans-serif', fontSize: 48, fontWeight: 700,
    lineHeight: 1, letterSpacing: '-2px',
  },
  badge: {
    display: 'inline-block', padding: '3px 10px', borderRadius: 3,
    fontSize: 11, fontWeight: 500, fontFamily: 'Syne, sans-serif',
    letterSpacing: '0.06em',
  },
  btn: {
    background: '#c8f135', color: '#0a0a0a', border: 'none', borderRadius: 4,
    padding: '10px 20px', fontFamily: 'Syne, sans-serif', fontWeight: 700,
    fontSize: 12, cursor: 'pointer', width: '100%', letterSpacing: '0.04em',
    transition: 'opacity 0.15s', marginTop: 'auto', flexShrink: 0,
  },
  metricBox: {
    background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 5,
    padding: '12px 16px', flex: 1,
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 },
  tabs: { display: 'flex', gap: 4, marginBottom: 16 },
  tab: {
    padding: '6px 14px', fontSize: 12, borderRadius: 4, cursor: 'pointer',
    border: '1px solid #222', background: 'transparent', color: '#555',
    fontFamily: 'Syne, sans-serif', fontWeight: 500,
  },
  tabActive: {
    padding: '6px 14px', fontSize: 12, borderRadius: 4, cursor: 'pointer',
    border: '1px solid #c8f135', background: '#c8f13515', color: '#c8f135',
    fontFamily: 'Syne, sans-serif', fontWeight: 500,
  },
}

function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
        background: value ? '#c8f135' : '#222',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        width: 14, height: 14, borderRadius: 7,
        background: value ? '#0a0a0a' : '#555',
        position: 'absolute', top: 3,
        left: value ? 19 : 3, transition: 'left 0.2s',
      }} />
    </div>
  )
}

function Slider({ label, value, min, max, step, onChange, format }) {
  const display = format ? format(value) : value
  return (
    <div style={S.fieldWrap}>
      <div style={S.fieldRow}>
        <span style={S.label}>{label}</span>
        <span style={S.val}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step}
        value={value} onChange={e => onChange(parseFloat(e.target.value))} />
    </div>
  )
}

// KEY FIX: Contract period is now two clickable buttons instead of a broken slider
function ContractToggle({ value, onChange }) {
  return (
    <div style={S.fieldWrap}>
      <div style={S.fieldRow}>
        <span style={S.label}>Contract duration</span>
        <span style={S.val}>{value === 1 ? '1 month' : '12 months'}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        {[1, 12].map(v => (
          <button
            key={v}
            onClick={() => onChange(v)}
            style={{
              flex: 1, padding: '6px 0', fontSize: 12,
              fontFamily: 'DM Mono, monospace', cursor: 'pointer',
              borderRadius: 4, border: '1px solid',
              borderColor: value === v ? '#c8f135' : '#2a2a2a',
              background: value === v ? '#c8f13518' : 'transparent',
              color: value === v ? '#c8f135' : '#555',
              transition: 'all 0.15s',
            }}
          >
            {v === 1 ? 'Monthly' : 'Annual'}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 10, color: '#333', marginTop: 5 }}>
        Dataset has monthly vs annual contracts only
      </div>
    </div>
  )
}

function MetricBox({ label, value, accent }) {
  return (
    <div style={S.metricBox}>
      <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: accent || '#e8e8e8' }}>{value}</div>
    </div>
  )
}

function ProbBar({ prob }) {
  const pct = Math.round(prob * 100)
  const color = prob > 0.70 ? '#ff4d4d' : prob > 0.40 ? '#ffaa33' : '#4dff91'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: '#555' }}>Churn probability</span>
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

export default function App() {
  const [form, setForm] = useState(DEFAULTS)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [modelInfo, setModelInfo] = useState(null)
  const [tab, setTab] = useState('predict')
  const [apiStatus, setApiStatus] = useState('checking')

  useEffect(() => {
    fetch(`${API}/health`).then(r => r.json())
      .then(d => {
        setApiStatus(d.model_loaded ? 'ok' : 'no-model')
        setModelInfo(d)
      })
      .catch(() => setApiStatus('offline'))

    fetch(`${API}/model/metrics`).then(r => r.json())
      .then(d => setModelInfo(m => ({ ...m, ...d })))
      .catch(() => {})
  }, [])

  const predict = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(await res.text())
      setResult(await res.json())
      setTab('result')
    } catch (e) {
      alert('API error: ' + e.message + '\n\nMake sure the FastAPI server is running:\ncd api && uvicorn main:app --reload')
    } finally {
      setLoading(false)
    }
  }, [form])

  const set = (key, val) => setForm(f => {
    const updated = { ...f, [key]: val }
    if (key === 'Contract_period') {
      updated.Month_to_end_contract = Math.min(f.Month_to_end_contract, val)
    }
    if (key === 'Month_to_end_contract') {
      updated.Month_to_end_contract = Math.min(val, f.Contract_period)
    }
    return updated
  })

  const riskColor = r => r === 'High' ? '#ff4d4d' : r === 'Medium' ? '#ffaa33' : '#4dff91'
  const statusColor = { ok: '#4dff91', 'no-model': '#ffaa33', offline: '#ff4d4d', checking: '#666' }

  const radarData = result ? [
    { subject: 'Engagement', value: Math.min(100, form.Avg_class_frequency_total / 7 * 100) },
    { subject: 'Stability', value: form.Contract_period === 12 ? 100 : 20 },
    { subject: 'Tenure', value: Math.min(100, form.Lifetime / 36 * 100) },
    { subject: 'Social', value: (form.Partner + form.Group_visits + form.Promo_friends) / 3 * 100 },
    { subject: 'Spend', value: Math.min(100, form.Avg_additional_charges_total / 500 * 100) },
    { subject: 'Recency', value: Math.min(100, form.Avg_class_frequency_current_month / 7 * 100) },
  ] : []

  const featureData = modelInfo?.top_features
    ? Object.entries(modelInfo.top_features).slice(0, 8).map(([k, v]) => ({
        name: k.replace(/_/g, ' ').replace('Avg class frequency', 'Freq'),
        value: Math.round(v * 1000) / 10,
      })).reverse()
    : []

  const liveProb = (() => {
    let s = 0
    if (form.Contract_period === 1) s += 0.30
    if (form.Month_to_end_contract <= 1) s += 0.15
    if (form.Avg_class_frequency_total < 1.5) s += 0.15
    else if (form.Avg_class_frequency_total >= 3) s -= 0.12
    const drop = form.Avg_class_frequency_total > 0
      ? form.Avg_class_frequency_current_month / form.Avg_class_frequency_total : 1
    if (drop < 0.6) s += 0.12
    if (form.Lifetime < 3) s += 0.08
    if (!form.Partner) s += 0.06
    if (!form.Group_visits) s += 0.07
    if (form.Near_Location) s -= 0.04
    return Math.max(0.04, Math.min(0.96, 0.32 + s))
  })()

  return (
    <div style={S.app}>
      {/* ── SIDEBAR ── */}
      <div style={S.sidebar}>
        {/* Header */}
        <div style={{ flexShrink: 0 }}>
          <div style={S.logo}>CHURN<span style={{ color: '#333' }}>.</span>AI</div>
          <div style={S.tagline}>Gym Member Retention Predictor</div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: statusColor[apiStatus], flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: '#444' }}>
              {apiStatus === 'ok' ? `XGBoost · AUC ${modelInfo?.test_auc || '—'}`
                : apiStatus === 'no-model' ? 'API online · run notebook first'
                : apiStatus === 'offline' ? 'API offline · start uvicorn'
                : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Contract */}
        <div style={{ flexShrink: 0 }}>
          <div style={S.sectionLabel}>Contract</div>
          {/* FIXED: button toggle instead of broken slider */}
          <ContractToggle value={form.Contract_period} onChange={v => set('Contract_period', v)} />
          <Slider label="Months to end" value={form.Month_to_end_contract}
            min={0} max={form.Contract_period} step={0.5} onChange={v => set('Month_to_end_contract', v)} />
          <Slider label="Member lifetime (mo)" value={form.Lifetime}
            min={1} max={36} step={1} onChange={v => set('Lifetime', v)} />
        </div>

        {/* Engagement */}
        <div style={{ flexShrink: 0 }}>
          <div style={S.sectionLabel}>Engagement</div>
          <Slider label="Visits/week (lifetime)" value={form.Avg_class_frequency_total}
            min={0} max={7} step={0.5} format={v => v.toFixed(1)}
            onChange={v => set('Avg_class_frequency_total', v)} />
          <Slider label="Visits/week (this month)" value={form.Avg_class_frequency_current_month}
            min={0} max={7} step={0.5} format={v => v.toFixed(1)}
            onChange={v => set('Avg_class_frequency_current_month', v)} />
          <Slider label="Extra spend (₹)" value={form.Avg_additional_charges_total}
            min={0} max={500} step={10} onChange={v => set('Avg_additional_charges_total', v)} />
        </div>

        {/* Demographics */}
        <div style={{ flexShrink: 0 }}>
          <div style={S.sectionLabel}>Demographics</div>
          <Slider label="Age" value={form.Age} min={18} max={65} step={1}
            onChange={v => set('Age', v)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              ['Near location', 'Near_Location'],
              ['Has partner', 'Partner'],
              ['Friend promo', 'Promo_friends'],
              ['Group classes', 'Group_visits'],
              ['Phone on file', 'Phone'],
            ].map(([label, key]) => (
              <div key={key} style={S.toggleRow}>
                <span style={S.label}>{label}</span>
                <Toggle value={!!form[key]} onChange={v => set(key, v ? 1 : 0)} />
              </div>
            ))}
          </div>
        </div>

        {/* Predict button — always visible at bottom */}
        <button style={S.btn} onClick={predict} disabled={loading}>
          {loading ? 'PREDICTING...' : 'PREDICT CHURN RISK →'}
        </button>
      </div>

      {/* ── MAIN ── */}
      <div style={S.main}>
        {/* TABS */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {['predict', 'result', 'model'].map(t => (
            <button key={t} style={tab === t ? S.tabActive : S.tab} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── PREDICT TAB ── */}
        {tab === 'predict' && (
          <>
            <div style={{ ...S.card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 40 }}>🏋️</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#e8e8e8' }}>
                Configure a member profile
              </div>
              <div style={{ fontSize: 12, color: '#444', lineHeight: 1.7, maxWidth: 320 }}>
                Adjust the sliders and toggles in the sidebar, then click
                <span style={{ color: '#c8f135', fontWeight: 600 }}> PREDICT CHURN RISK </span>
                to get the real XGBoost score with engineered features.
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
                {[
                  { label: 'Contract type', val: form.Contract_period === 1 ? 'Monthly ⚠️' : 'Annual ✅', danger: form.Contract_period === 1 },
                  { label: 'Visits/week', val: form.Avg_class_frequency_total.toFixed(1), danger: form.Avg_class_frequency_total < 1.5 },
                  { label: 'Months left', val: form.Month_to_end_contract, danger: form.Month_to_end_contract <= 1 },
                  { label: 'Lifetime', val: form.Lifetime + ' mo', danger: form.Lifetime <= 2 },
                ].map(({ label, val, danger }) => (
                  <div key={label} style={{
                    background: '#0f0f0f', border: '1px solid',
                    borderColor: danger ? '#ff4d4d33' : '#1e1e1e',
                    borderRadius: 5, padding: '8px 14px', minWidth: 100,
                  }}>
                    <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: danger ? '#ff4d4d' : '#4dff91' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={S.grid3}>
              <MetricBox label="Best Model" value="XGBoost" accent="#c8f135" />
              <MetricBox label="Test AUC" value={modelInfo?.test_auc || '—'} accent="#c8f135" />
              <MetricBox label="CV Folds" value="5-Fold" />
            </div>

            <div style={S.card}>
              <div style={S.sectionLabel}>Key Churn Signals</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: '◆', title: 'Month-to-month contracts', sub: 'Churn 3–4x higher than annual contracts', color: '#ff4d4d' },
                  { icon: '▼', title: 'Visit frequency drop', sub: 'Current month < lifetime avg is a strong warning signal', color: '#ffaa33' },
                  { icon: '◉', title: 'Group class participation', sub: 'Attendees churn at half the rate of solo gym-goers', color: '#4dff91' },
                  { icon: '◈', title: 'Partner membership', sub: 'Social accountability reduces churn by ~40%', color: '#4dff91' },
                ].map(({ icon, title, sub, color }) => (
                  <div key={title} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #1a1a1a' }}>
                    <span style={{ color, fontSize: 14, marginTop: 1 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, fontFamily: 'Syne, sans-serif', color: '#ddd' }}>{title}</div>
                      <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── RESULT TAB ── */}
        {tab === 'result' && (
          result ? (
            <>
              <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={S.sectionLabel}>Prediction Result</div>
                    <div style={{ ...S.riskBig, color: riskColor(result.risk_level) }}>
                      {Math.round(result.churn_probability * 100)}%
                    </div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ ...S.badge, background: riskColor(result.risk_level) + '20', color: riskColor(result.risk_level) }}>
                        {result.risk_level.toUpperCase()} RISK
                      </span>
                      <span style={{ fontSize: 11, color: '#444' }}>
                        {result.churn_prediction === 1 ? 'Will churn' : 'Will retain'}
                      </span>
                    </div>
                  </div>
                  <div style={{ width: 180, height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#1e1e1e" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#444', fontSize: 10 }} />
                        <Radar dataKey="value" stroke="#c8f135" fill="#c8f135" fillOpacity={0.15} strokeWidth={1.5} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 4, padding: '10px 14px', fontSize: 12, color: '#aaa', lineHeight: 1.6 }}>
                  <span style={{ color: '#c8f135', marginRight: 8 }}>→</span>
                  {result.recommendation}
                </div>
              </div>

              <div style={S.grid2}>
                {Object.entries(result.engineered_features).map(([k, v]) => (
                  <MetricBox key={k}
                    label={k.replace(/_/g, ' ')}
                    value={typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(3) : String(v)}
                    accent={k === 'freq_drop_ratio' && v < 0.7 ? '#ff4d4d' : '#c8f135'}
                  />
                ))}
              </div>

              <div style={S.card}>
                <div style={S.sectionLabel}>Engineered Feature Explanation</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ['freq_drop_ratio', '= current_month_visits / lifetime_avg — detects engagement decline'],
                    ['near_contract_end', '= 1 if ≤1 month left — highest churn window'],
                    ['high_engagement', '= 1 if visits ≥3/week — strong retention signal'],
                    ['early_member', '= 1 if lifetime ≤2 months — onboarding churn risk'],
                  ].map(([feat, desc]) => (
                    <div key={feat} style={{ display: 'flex', gap: 10, fontSize: 12, paddingBottom: 6, borderBottom: '1px solid #1a1a1a' }}>
                      <span style={{ color: '#c8f135', minWidth: 150, flexShrink: 0 }}>{feat}</span>
                      <span style={{ color: '#555' }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ ...S.card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 48, color: '#333' }}>
              <div style={{ fontSize: 32 }}>◎</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14 }}>No prediction yet</div>
              <div style={{ fontSize: 12, color: '#333' }}>Configure a customer in the sidebar and click Predict</div>
            </div>
          )
        )}

        {/* ── MODEL TAB ── */}
        {tab === 'model' && (
          <>
            <div style={S.card}>
              <div style={S.sectionLabel}>Model CV Comparison (ROC-AUC)</div>
              {modelInfo?.cv_results ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart layout="vertical"
                      data={Object.entries(modelInfo.cv_results).map(([name, v]) => ({ name, auc: v.mean }))}
                      margin={{ left: 20, right: 30 }}>
                      <XAxis type="number" domain={[0.78, 1]} tick={{ fill: '#444', fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#888', fontSize: 11 }} width={140} />
                      <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', fontSize: 11 }} />
                      <Bar dataKey="auc" radius={[0, 3, 3, 0]}>
                        {Object.keys(modelInfo.cv_results).map((name) => (
                          <Cell key={name} fill={name === 'XGBoost' ? '#c8f135' : '#2a2a2a'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {Object.entries(modelInfo.cv_results).map(([name, v]) => (
                      <div key={name} style={{ ...S.metricBox, minWidth: 80 }}>
                        <div style={{ fontSize: 10, color: '#444', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {name}
                        </div>
                        <div style={{ fontSize: 16, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: name === 'XGBoost' ? '#c8f135' : '#888' }}>
                          {v.mean.toFixed(3)}
                        </div>
                        <div style={{ fontSize: 10, color: '#333' }}>±{v.std.toFixed(3)}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ color: '#333', fontSize: 12, padding: '20px 0' }}>Run the notebook to train models first.</div>
              )}
            </div>

            <div style={S.card}>
              <div style={S.sectionLabel}>Top Feature Importances</div>
              {featureData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart layout="vertical" data={featureData} margin={{ left: 10, right: 30 }}>
                    <XAxis type="number" tick={{ fill: '#444', fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#888', fontSize: 10 }} width={150} />
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', fontSize: 11 }}
                      formatter={v => [`${v}%`, 'Importance']} />
                    <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                      {featureData.map((d) => (
                        <Cell key={d.name}
                          fill={['freq drop ratio', 'near contract end', 'high engagement', 'early member'].includes(d.name)
                            ? '#c8f135' : '#2a2a2a'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ color: '#333', fontSize: 12, padding: '20px 0' }}>No feature data yet.</div>
              )}
              <div style={{ fontSize: 10, color: '#444', marginTop: 8 }}>
                <span style={{ color: '#c8f135' }}>■</span> Engineered features &nbsp;
                <span style={{ background: '#2a2a2a', display: 'inline-block', width: 10, height: 10, verticalAlign: 'middle' }}></span> Raw features
              </div>
            </div>

            <div style={S.card}>
              <div style={S.sectionLabel}>XGBoost Hyperparameters</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px' }}>
                {[
                  ['n_estimators', '300', 'Number of boosting rounds'],
                  ['learning_rate', '0.05', 'Step size shrinkage'],
                  ['max_depth', '5', 'Max depth per tree'],
                  ['subsample', '0.8', 'Row sampling per tree'],
                  ['colsample_bytree', '0.8', 'Feature sampling per tree'],
                  ['reg_alpha (L1)', '0.1', 'Sparsity regularization'],
                  ['reg_lambda (L2)', '1.0', 'Smoothness regularization'],
                  ['eval_metric', 'logloss', 'Training loss function'],
                ].map(([k, v, hint]) => (
                  <div key={k} style={{ padding: '7px 0', borderBottom: '1px solid #1a1a1a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#555' }}>{k}</span>
                      <span style={{ color: '#c8f135', fontFamily: 'DM Mono, monospace' }}>{v}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#333', marginTop: 2 }}>{hint}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
