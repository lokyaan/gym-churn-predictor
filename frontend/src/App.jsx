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
  Month_to_end_contract: 1, Lifetime: 6,
  Avg_class_frequency_total: 2.0,
  Avg_class_frequency_current_month: 1.5,
}

const C = {
  bg:      '#0d0d0d',
  bg2:     '#141414',
  bg3:     '#1c1c1c',
  bg4:     '#222',
  border:  '#2a2a2a',
  border2: '#383838',
  text:    '#f0ede8',
  text2:   '#a09a90',
  muted:   '#555',
  accent:  '#ff6b1a',
  accent2: '#ff8c42',
  accentG: '#ff6b1a22',
  danger:  '#ff3333',
  warn:    '#ffaa33',
  safe:    '#33cc66',
}

// Detect mobile
const isMobile = () => window.innerWidth < 768

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width: 38, height: 21, borderRadius: 11, cursor: 'pointer',
      background: value ? C.accent : C.bg4,
      border: `1px solid ${value ? C.accent : C.border2}`,
      position: 'relative', transition: 'all 0.2s', flexShrink: 0,
      boxShadow: value ? `0 0 8px ${C.accentG}` : 'none',
    }}>
      <div style={{
        width: 15, height: 15, borderRadius: 8,
        background: value ? C.bg : C.muted,
        position: 'absolute', top: 2,
        left: value ? 20 : 2, transition: 'left 0.2s',
      }} />
    </div>
  )
}

function Slider({ label, value, min, max, step, onChange, format }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: C.text2 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.accent, fontFamily: 'DM Mono, monospace' }}>
          {format ? format(value) : value}
        </span>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', top: '50%', left: 0,
          width: `${pct}%`, height: 2, background: C.accent,
          borderRadius: 1, transform: 'translateY(-50%)',
          pointerEvents: 'none', zIndex: 1,
          boxShadow: `0 0 6px ${C.accentG}`,
        }} />
        <input type="range" min={min} max={max} step={step}
          value={value} onChange={e => onChange(parseFloat(e.target.value))}
          style={{ position: 'relative', zIndex: 2, background: 'transparent', width: '100%' }}
        />
      </div>
    </div>
  )
}

function ContractToggle({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: C.text2 }}>Contract duration</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.accent, fontFamily: 'DM Mono, monospace' }}>
          {value === 1 ? '1 month' : '12 months'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[{ v: 1, label: 'MONTHLY' }, { v: 12, label: 'ANNUAL' }].map(({ v, label }) => (
          <button key={v} onClick={() => onChange(v)} style={{
            flex: 1, padding: '10px 0', fontSize: 13,
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, letterSpacing: '0.1em',
            cursor: 'pointer', borderRadius: 4, border: '1px solid',
            borderColor: value === v ? C.accent : C.border,
            background: value === v ? C.accentG : 'transparent',
            color: value === v ? C.accent : C.muted,
            transition: 'all 0.15s',
            boxShadow: value === v ? `0 0 10px ${C.accentG}` : 'none',
          }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 10, color: C.muted }}>Dataset has monthly vs annual contracts only</div>
    </div>
  )
}

function MetricBox({ label, value, accent, sub }) {
  return (
    <div style={{
      background: C.bg3, border: `1px solid ${C.border}`,
      borderRadius: 5, padding: '12px 14px', flex: 1,
    }}>
      <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, color: accent || C.text }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function RiskBar({ prob }) {
  const pct = Math.round(prob * 100)
  const color = prob > 0.70 ? C.danger : prob > 0.40 ? C.warn : C.safe
  const label = prob > 0.70 ? 'HIGH RISK' : prob > 0.40 ? 'MEDIUM RISK' : 'LOW RISK'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.1em', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600 }}>CHURN PROBABILITY</div>
          <div style={{ fontSize: 52, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, color, lineHeight: 1, letterSpacing: '-1px' }}>{pct}%</div>
        </div>
        <div style={{
          padding: '5px 14px', borderRadius: 3,
          background: color + '20', border: `1px solid ${color}40`,
          fontSize: 13, fontWeight: 700, color,
          fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em',
        }}>{label}</div>
      </div>
      <div style={{ height: 8, background: C.bg3, borderRadius: 4, overflow: 'hidden', border: `1px solid ${C.border}` }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: color,
          borderRadius: 4, transition: 'width 0.6s ease',
          boxShadow: `0 0 12px ${color}80`,
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: C.muted, fontFamily: 'DM Mono, monospace' }}>
        <span>0%</span><span style={{ color: C.warn }}>40%</span><span style={{ color: C.danger }}>70%</span><span>100%</span>
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: C.accent,
      letterSpacing: '0.15em', textTransform: 'uppercase',
      marginBottom: 12, paddingBottom: 8,
      borderBottom: `1px solid ${C.border}`,
      fontFamily: 'Barlow Condensed, sans-serif',
    }}>{children}</div>
  )
}

function Card({ children, style }) {
  return (
    <div style={{
      background: C.bg2, border: `1px solid ${C.border}`,
      borderRadius: 6, padding: '16px 18px', ...style
    }}>{children}</div>
  )
}

export default function App() {
  const [form, setForm] = useState(DEFAULTS)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [modelInfo, setModelInfo] = useState(null)
  const [tab, setTab] = useState('configure')
  const [apiStatus, setApiStatus] = useState('checking')
  const [mobile, setMobile] = useState(isMobile())

  useEffect(() => {
    const handleResize = () => setMobile(isMobile())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetch(`${API}/health`).then(r => r.json())
      .then(d => { setApiStatus(d.model_loaded ? 'ok' : 'no-model'); setModelInfo(d) })
      .catch(() => setApiStatus('offline'))
    fetch(`${API}/model/metrics`).then(r => r.json())
      .then(d => setModelInfo(m => ({ ...m, ...d })))
      .catch(() => {})
  }, [])

  const set = (key, val) => setForm(f => {
    const updated = { ...f, [key]: val }
    if (key === 'Contract_period') updated.Month_to_end_contract = Math.min(f.Month_to_end_contract, val)
    if (key === 'Month_to_end_contract') updated.Month_to_end_contract = Math.min(val, f.Contract_period)
    return updated
  })

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
      alert('API Error: ' + e.message)
    } finally { setLoading(false) }
  }, [form])

  const riskColor = r => r === 'High' ? C.danger : r === 'Medium' ? C.warn : C.safe
  const dot = { ok: C.safe, 'no-model': C.warn, offline: C.danger, checking: C.muted }
  const statusMsg = {
    ok: `API ONLINE · AUC ${modelInfo?.test_auc || '—'}`,
    'no-model': 'API ONLINE · MODEL NOT LOADED',
    offline: 'API OFFLINE',
    checking: 'CONNECTING...',
  }

  const radarData = result ? [
    { subject: 'Engagement', value: Math.min(100, form.Avg_class_frequency_total / 7 * 100) },
    { subject: 'Stability',  value: form.Contract_period === 12 ? 100 : 15 },
    { subject: 'Tenure',     value: Math.min(100, form.Lifetime / 36 * 100) },
    { subject: 'Social',     value: (form.Partner + form.Group_visits + form.Promo_friends) / 3 * 100 },
    { subject: 'Spend',      value: Math.min(100, form.Avg_additional_charges_total / 500 * 100) },
    { subject: 'Recency',    value: Math.min(100, form.Avg_class_frequency_current_month / 7 * 100) },
  ] : []

  const featureData = modelInfo?.top_features
    ? Object.entries(modelInfo.top_features).slice(0, 8)
        .map(([k, v]) => ({ name: k.replace(/_/g, ' '), value: Math.round(v * 1000) / 10 }))
        .reverse()
    : []

  const engineeredNames = ['freq drop ratio', 'near contract end', 'high engagement', 'early member']

  // TABS — mobile shows bottom nav, desktop shows top tabs
  const tabs = [
    { id: 'configure', icon: '⚙️', label: 'Configure' },
    { id: 'result',    icon: '📊', label: 'Result' },
    { id: 'model',     icon: '🧠', label: 'Model' },
  ]

  const FormSection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Contract */}
      <Card>
        <SectionLabel>📋 Contract</SectionLabel>
        <ContractToggle value={form.Contract_period} onChange={v => set('Contract_period', v)} />
        <Slider label="Months remaining" value={form.Month_to_end_contract}
          min={0} max={form.Contract_period} step={0.5}
          onChange={v => set('Month_to_end_contract', v)} />
        <Slider label="Member lifetime (months)" value={form.Lifetime}
          min={1} max={36} step={1} onChange={v => set('Lifetime', v)} />
      </Card>

      {/* Engagement */}
      <Card>
        <SectionLabel>🏋️ Engagement</SectionLabel>
        <Slider label="Avg visits / week (all time)" value={form.Avg_class_frequency_total}
          min={0} max={7} step={0.5} format={v => v.toFixed(1) + 'x'}
          onChange={v => set('Avg_class_frequency_total', v)} />
        <Slider label="Avg visits / week (this month)" value={form.Avg_class_frequency_current_month}
          min={0} max={7} step={0.5} format={v => v.toFixed(1) + 'x'}
          onChange={v => set('Avg_class_frequency_current_month', v)} />
        <Slider label="Additional services spend (₹)" value={form.Avg_additional_charges_total}
          min={0} max={500} step={10} format={v => '₹' + v}
          onChange={v => set('Avg_additional_charges_total', v)} />
      </Card>

      {/* Profile */}
      <Card>
        <SectionLabel>👤 Member Profile</SectionLabel>
        <Slider label="Age" value={form.Age} min={18} max={65} step={1}
          format={v => v + ' yrs'} onChange={v => set('Age', v)} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            ['📍 Lives near gym', 'Near_Location'],
            ['🤝 Has gym partner', 'Partner'],
            ['👥 Joined via friend', 'Promo_friends'],
            ['🧘 Attends group classes', 'Group_visits'],
            ['📞 Phone number on file', 'Phone'],
          ].map(([label, key]) => (
            <div key={key} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: `1px solid ${C.border}`,
            }}>
              <span style={{ fontSize: 13, color: C.text2 }}>{label}</span>
              <Toggle value={!!form[key]} onChange={v => set(key, v ? 1 : 0)} />
            </div>
          ))}
        </div>
      </Card>

      {/* Summary chips */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Contract', val: form.Contract_period === 1 ? 'Monthly' : 'Annual', danger: form.Contract_period === 1, icon: '📋' },
          { label: 'Visits/week', val: form.Avg_class_frequency_total.toFixed(1) + 'x', danger: form.Avg_class_frequency_total < 1.5, icon: '🏋️' },
          { label: 'Months left', val: form.Month_to_end_contract, danger: form.Month_to_end_contract <= 1, icon: '⏳' },
          { label: 'Lifetime', val: form.Lifetime + ' mo', danger: form.Lifetime <= 2, icon: '📅' },
        ].map(({ label, val, danger, icon }) => (
          <div key={label} style={{
            background: danger ? C.danger + '08' : C.bg2,
            border: `1px solid ${danger ? C.danger + '44' : C.border}`,
            borderRadius: 6, padding: '12px 14px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 16, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, color: danger ? C.danger : C.safe, marginTop: 2 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Predict button */}
      <button onClick={predict} disabled={loading} style={{
        background: loading ? C.bg3 : `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
        color: loading ? C.muted : C.bg,
        border: 'none', borderRadius: 6,
        padding: '16px 20px',
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 900, fontSize: 17,
        cursor: loading ? 'not-allowed' : 'pointer',
        width: '100%', letterSpacing: '0.1em',
        textTransform: 'uppercase',
        boxShadow: loading ? 'none' : `0 4px 20px ${C.accentG}`,
        transition: 'all 0.2s',
      }}>
        {loading ? '⏳ PREDICTING...' : '🔥 PREDICT CHURN RISK'}
      </button>
    </div>
  )

  const ResultSection = () => (
    result ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card style={{ borderColor: riskColor(result.risk_level) + '44' }}>
          <RiskBar prob={result.churn_probability} />
          <div style={{
            marginTop: 14, padding: '10px 14px',
            background: C.bg3, borderRadius: 4,
            border: `1px solid ${C.border}`,
            fontSize: 13, color: C.text2, lineHeight: 1.7,
          }}>
            <span style={{ color: C.accent, marginRight: 8, fontWeight: 700 }}>→</span>
            {result.recommendation}
          </div>
        </Card>

        {/* Radar */}
        <Card>
          <SectionLabel>Member Profile Radar</SectionLabel>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={C.border} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: C.muted, fontSize: 10 }} />
              <Radar dataKey="value" stroke={C.accent} fill={C.accent} fillOpacity={0.15} strokeWidth={1.5} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Engineered features */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {Object.entries(result.engineered_features).map(([k, v]) => {
            const isDanger = (k === 'freq_drop_ratio' && v < 0.7) || (k === 'near_contract_end' && v === 1) || (k === 'early_member' && v === 1)
            const isGood = k === 'high_engagement' && v === 1
            return (
              <MetricBox key={k}
                label={k.replace(/_/g, ' ')}
                value={typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(3) : String(v)}
                accent={isDanger ? C.danger : isGood ? C.safe : C.accent}
              />
            )
          })}
        </div>

        <Card>
          <SectionLabel>🔧 Engineered Features</SectionLabel>
          {[
            ['freq_drop_ratio', 'current month visits ÷ lifetime avg'],
            ['near_contract_end', '1 if ≤ 1 month remaining'],
            ['high_engagement', '1 if visits ≥ 3×/week'],
            ['early_member', '1 if lifetime ≤ 2 months'],
          ].map(([feat, desc]) => (
            <div key={feat} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.accent, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{feat}</span>
              <span style={{ color: C.muted, fontSize: 11 }}>{desc}</span>
            </div>
          ))}
        </Card>
      </div>
    ) : (
      <Card style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 700, color: C.muted }}>No prediction yet</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Go to Configure tab and hit Predict</div>
      </Card>
    )
  )

  const ModelSection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <MetricBox label="Model" value="XGBoost" accent={C.accent} />
        <MetricBox label="AUC" value={modelInfo?.test_auc || '—'} accent={C.safe} />
        <MetricBox label="CV" value="5-Fold" />
      </div>

      <Card>
        <SectionLabel>📊 Model Comparison</SectionLabel>
        {modelInfo?.cv_results ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart layout="vertical"
              data={Object.entries(modelInfo.cv_results).map(([name, v]) => ({ name, auc: v.mean }))}
              margin={{ left: 10, right: 40 }}>
              <XAxis type="number" domain={[0.78, 1]} tick={{ fill: C.muted, fontSize: 9 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: C.text2, fontSize: 10 }} width={130} />
              <Tooltip contentStyle={{ background: C.bg2, border: `1px solid ${C.border}`, fontSize: 11 }} />
              <Bar dataKey="auc" radius={[0, 4, 4, 0]}>
                {Object.keys(modelInfo.cv_results).map(name => (
                  <Cell key={name} fill={name === 'XGBoost' ? C.accent : C.bg4} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <div style={{ color: C.muted, fontSize: 12 }}>Run notebook first.</div>}
      </Card>

      <Card>
        <SectionLabel>🔑 Feature Importances</SectionLabel>
        {featureData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart layout="vertical" data={featureData} margin={{ left: 0, right: 40 }}>
              <XAxis type="number" tick={{ fill: C.muted, fontSize: 9 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: C.text2, fontSize: 9 }} width={140} />
              <Tooltip contentStyle={{ background: C.bg2, border: `1px solid ${C.border}`, fontSize: 11 }}
                formatter={v => [`${v}%`, 'Importance']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {featureData.map(d => (
                  <Cell key={d.name} fill={engineeredNames.includes(d.name) ? C.accent : C.bg4} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <div style={{ color: C.muted, fontSize: 12 }}>No data yet.</div>}
      </Card>

      <Card>
        <SectionLabel>⚙️ XGBoost Hyperparameters</SectionLabel>
        {[
          ['n_estimators', '300', 'Number of boosting rounds'],
          ['learning_rate', '0.05', 'Step size shrinkage'],
          ['max_depth', '5', 'Max tree depth'],
          ['subsample', '0.8', 'Row sampling per tree'],
          ['colsample_bytree', '0.8', 'Feature sampling per tree'],
          ['reg_alpha (L1)', '0.1', 'Sparsity regularization'],
          ['reg_lambda (L2)', '1.0', 'Smoothness regularization'],
          ['eval_metric', 'logloss', 'Training loss function'],
        ].map(([k, v, hint]) => (
          <div key={k} style={{ padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 12, color: C.text2 }}>{k}</span>
              <span style={{ fontSize: 12, color: C.accent, fontFamily: 'DM Mono, monospace' }}>{v}</span>
            </div>
            <div style={{ fontSize: 10, color: C.muted }}>{hint}</div>
          </div>
        ))}
      </Card>
    </div>
  )

  return (
    <div style={{
      background: C.bg, color: C.text,
      fontFamily: 'Barlow, sans-serif',
      minHeight: '100vh',
      // Mobile: single column, Desktop: sidebar layout
      display: mobile ? 'flex' : 'grid',
      flexDirection: mobile ? 'column' : undefined,
      gridTemplateColumns: mobile ? undefined : '320px 1fr',
    }}>

      {/* ── HEADER (mobile only) ── */}
      {mobile && (
        <div style={{
          background: C.bg2, borderBottom: `1px solid ${C.border}`,
          padding: '14px 16px',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, fontWeight: 900 }}>
              <span style={{ color: C.accent }}>CHURN</span>
              <span style={{ color: C.border2 }}>.</span>
              <span style={{ color: C.text }}>AI</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: dot[apiStatus], boxShadow: `0 0 6px ${dot[apiStatus]}` }} />
              <span style={{ fontSize: 10, color: C.muted, fontFamily: 'DM Mono, monospace' }}>{statusMsg[apiStatus]}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR ── */}
      {!mobile && (
        <div style={{
          background: C.bg2, borderRight: `1px solid ${C.border}`,
          height: '100vh', overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Sidebar header */}
          <div style={{
            background: C.bg, borderBottom: `1px solid ${C.border}`,
            padding: '20px 18px 16px',
            position: 'sticky', top: 0, zIndex: 10,
          }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1, marginBottom: 2 }}>
              <span style={{ color: C.accent }}>CHURN</span>
              <span style={{ color: C.border2 }}>.</span>
              <span style={{ color: C.text }}>AI</span>
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: '0.15em', verticalAlign: 'middle' }}>GYM RETENTION</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: dot[apiStatus], boxShadow: `0 0 6px ${dot[apiStatus]}` }} />
              <span style={{ fontSize: 10, color: C.muted, fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em' }}>{statusMsg[apiStatus]}</span>
            </div>
          </div>

          {/* Sidebar form */}
          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
            <ContractToggle value={form.Contract_period} onChange={v => set('Contract_period', v)} />
            <div>
              <SectionLabel>📋 Contract</SectionLabel>
              <Slider label="Months remaining" value={form.Month_to_end_contract}
                min={0} max={form.Contract_period} step={0.5}
                onChange={v => set('Month_to_end_contract', v)} />
              <Slider label="Member lifetime (months)" value={form.Lifetime}
                min={1} max={36} step={1} onChange={v => set('Lifetime', v)} />
            </div>
            <div>
              <SectionLabel>🏋️ Engagement</SectionLabel>
              <Slider label="Avg visits/week (all time)" value={form.Avg_class_frequency_total}
                min={0} max={7} step={0.5} format={v => v.toFixed(1) + 'x'}
                onChange={v => set('Avg_class_frequency_total', v)} />
              <Slider label="Avg visits/week (this month)" value={form.Avg_class_frequency_current_month}
                min={0} max={7} step={0.5} format={v => v.toFixed(1) + 'x'}
                onChange={v => set('Avg_class_frequency_current_month', v)} />
              <Slider label="Additional services spend (₹)" value={form.Avg_additional_charges_total}
                min={0} max={500} step={10} format={v => '₹' + v}
                onChange={v => set('Avg_additional_charges_total', v)} />
            </div>
            <div>
              <SectionLabel>👤 Member Profile</SectionLabel>
              <Slider label="Age" value={form.Age} min={18} max={65} step={1}
                format={v => v + ' yrs'} onChange={v => set('Age', v)} />
              {[
                ['📍 Near gym', 'Near_Location'],
                ['🤝 Has partner', 'Partner'],
                ['👥 Friend promo', 'Promo_friends'],
                ['🧘 Group classes', 'Group_visits'],
                ['📞 Phone on file', 'Phone'],
              ].map(([label, key]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: C.text2 }}>{label}</span>
                  <Toggle value={!!form[key]} onChange={v => set(key, v ? 1 : 0)} />
                </div>
              ))}
            </div>
            <button onClick={predict} disabled={loading} style={{
              background: loading ? C.bg3 : `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
              color: loading ? C.muted : C.bg,
              border: 'none', borderRadius: 5, padding: '13px 20px',
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer', width: '100%',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              boxShadow: loading ? 'none' : `0 4px 20px ${C.accentG}`,
            }}>
              {loading ? '⏳ PREDICTING...' : '🔥 PREDICT CHURN RISK'}
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{
        height: mobile ? undefined : '100vh',
        overflowY: mobile ? undefined : 'auto',
        padding: mobile ? '16px 16px 80px' : '20px 24px',
        display: 'flex', flexDirection: 'column', gap: 16,
        background: C.bg,
      }}>
        {/* Desktop tabs */}
        {!mobile && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, fontWeight: 800, color: C.text }}>Member Churn Intelligence</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>XGBoost · 5-fold CV · AUC {modelInfo?.test_auc || '—'} · 4 Engineered Features</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  padding: '7px 16px', fontSize: 13, borderRadius: 4, cursor: 'pointer',
                  border: `1px solid ${tab === t.id ? C.accent : C.border}`,
                  background: tab === t.id ? C.accentG : 'transparent',
                  color: tab === t.id ? C.accent : C.muted,
                  fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  boxShadow: tab === t.id ? `0 0 12px ${C.accentG}` : 'none',
                }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content based on tab */}
        {tab === 'configure' && (mobile ? <FormSection /> : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Contract', val: form.Contract_period === 1 ? 'Monthly' : 'Annual', danger: form.Contract_period === 1, icon: '📋' },
                { label: 'Visits/week', val: form.Avg_class_frequency_total.toFixed(1) + 'x', danger: form.Avg_class_frequency_total < 1.5, icon: '🏋️' },
                { label: 'Months left', val: form.Month_to_end_contract, danger: form.Month_to_end_contract <= 1, icon: '⏳' },
                { label: 'Lifetime', val: form.Lifetime + ' mo', danger: form.Lifetime <= 2, icon: '📅' },
              ].map(({ label, val, danger, icon }) => (
                <div key={label} style={{
                  background: danger ? C.danger + '08' : C.bg2,
                  border: `1px solid ${danger ? C.danger + '44' : C.border}`,
                  borderRadius: 6, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <span style={{ fontSize: 24 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: 20, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, color: danger ? C.danger : C.safe }}>{val}</div>
                  </div>
                </div>
              ))}
            </div>
            <Card>
              <SectionLabel>⚡ Key Churn Signals</SectionLabel>
              {[
                { icon: '📋', title: 'Month-to-month contracts', sub: 'Churn 3–4× higher than annual', color: C.danger },
                { icon: '📉', title: 'Visit frequency drop', sub: 'Recent < lifetime avg = danger', color: C.warn },
                { icon: '🧘', title: 'Group class attendance', sub: 'Group members churn at half rate', color: C.safe },
                { icon: '🤝', title: 'Partner membership', sub: 'Cuts churn by ~40%', color: C.safe },
              ].map(({ icon, title, sub, color }) => (
                <div key={title} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Barlow Condensed, sans-serif', color: C.text }}>{title}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        ))}

        {tab === 'result' && <ResultSection />}
        {tab === 'model' && <ModelSection />}
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      {mobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: C.bg2, borderTop: `1px solid ${C.border}`,
          display: 'flex', zIndex: 100,
        }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '12px 0', border: 'none',
              background: tab === t.id ? C.accentG : 'transparent',
              color: tab === t.id ? C.accent : C.muted,
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 11, cursor: 'pointer',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              borderTop: `2px solid ${tab === t.id ? C.accent : 'transparent'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
