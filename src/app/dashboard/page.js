'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/hooks/useApi';
import { useBrandContext } from '@/lib/BrandContext';

const statusMap = {
  detected: { label: 'Detected', bg: '#FEF2F2', color: '#DC2626' },
  confirmed: { label: 'Confirmed', bg: '#FEF2F2', color: '#DC2626' },
  investigating: { label: 'Investigating', bg: '#FFFBEB', color: '#D97706' },
  takedown_pending: { label: 'Pending', bg: '#EFF6FF', color: '#2563EB' },
  takedown_submitted: { label: 'Submitted', bg: '#EFF6FF', color: '#2563EB' },
  resolved: { label: 'Resolved', bg: '#F0FDF4', color: '#16A34A' },
  dismissed: { label: 'Dismissed', bg: '#F1F5F9', color: '#64748B' },
};

const typeLabels = {
  paid_ad: 'Paid Ad',
  organic_clone: 'Clone',
  organic_misleading: 'Misleading',
  shopping_listing: 'Shopping',
  other: 'Other',
};

function severityColor(s) {
  if (s >= 80) return '#DC2626';
  if (s >= 60) return '#D97706';
  if (s >= 40) return '#2563EB';
  return '#64748B';
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
  const router = useRouter();
  const { brandId, brandName } = useBrandContext();
  const { data, loading, error } = useDashboard(brandId);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // If no brand selected, prompt to set one up
  if (!brandId) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#0F172A', marginBottom: 12 }}>
          No brand selected
        </h2>
        <p style={{ color: '#64748B', marginBottom: 24 }}>
          Set up your first brand to start monitoring threats.
        </p>
        <button
          onClick={() => router.push('/onboarding')}
          style={{
            padding: '12px 28px', borderRadius: 10, border: 'none',
            background: '#2563EB', color: 'white', fontSize: 14,
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          + Add Brand
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            border: '2px solid #E2E8F0', borderTopColor: '#2563EB',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ color: '#64748B', fontSize: 14 }}>Loading dashboard...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <div style={{
          padding: 20, borderRadius: 12, background: '#FEF2F2',
          border: '1px solid #FECACA', color: '#DC2626', fontSize: 14,
        }}>
          Failed to load dashboard: {error}
        </div>
      </div>
    );
  }

  const m = data?.metrics || {};
  const threats = data?.threats || [];
  const chartData = data?.chartData || [];
  const activity = data?.activity || [];
  const bName = data?.brand?.name || brandName || 'Your Brand';

  const maxChart = Math.max(...chartData.map(c => c.threats), 1);

  // SVG chart
  const chartW = 480, chartH = 120, padX = 0, padY = 8;
  const stepX = chartData.length > 1 ? chartW / (chartData.length - 1) : chartW;
  const threatPoints = chartData.map((c, i) => [padX + i * stepX, padY + chartH - (c.threats / maxChart) * chartH]);
  const resolvedPoints = chartData.map((c, i) => [padX + i * stepX, padY + chartH - (c.resolved / maxChart) * chartH]);
  const toPath = (pts) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const toArea = (pts) => toPath(pts) + ` L${pts[pts.length-1][0]},${padY+chartH} L${pts[0][0]},${padY+chartH} Z`;

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#0F172A', letterSpacing: '-0.02em' }}>
            {greeting}! 👋
          </h1>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: '4px 0 0' }}>
            Here's what's happening with <strong style={{ color: '#64748B' }}>{bName}</strong> today
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 10, background: 'white',
            border: '1px solid #E2E8F0', fontSize: 13, color: '#64748B',
          }}>
            📅 {dateStr}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { icon: '⚠️', label: 'Active Threats', value: m.activeThreats || 0, bg: '#FEF2F2' },
          { icon: '💰', label: 'Revenue at Risk', value: `$${(m.revenueAtRisk || 0).toLocaleString()}`, bg: '#FFFBEB' },
          { icon: '✅', label: 'Resolved This Month', value: m.resolvedMonth || 0, bg: '#F0FDF4' },
          { icon: '📤', label: 'Pending Takedowns', value: m.pendingTakedowns || 0, bg: '#EFF6FF' },
        ].map((card, i) => (
          <div key={i} style={{
            background: 'white', borderRadius: 16, padding: '22px 24px',
            border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(10px)',
            transition: `all 0.4s ease ${i * 0.06}s`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, background: card.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>{card.icon}</div>
              <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>{card.label}</span>
            </div>
            <div style={{
              fontSize: 30, fontWeight: 700, color: '#0F172A',
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em',
            }}>{card.value}</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>
              {i === 0 && `${m.totalKeywords || 0} keywords monitored`}
              {i === 1 && 'estimated monthly loss'}
              {i === 2 && 'this month'}
              {i === 3 && 'awaiting approval'}
            </div>
          </div>
        ))}
      </div>

      {/* Charts + Activity Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Trend Chart */}
        <div style={{
          background: 'white', borderRadius: 16, padding: 24,
          border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>Threat Trends</div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: '#EF4444' }} />
                <span style={{ color: '#64748B' }}>New Threats</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: '#22C55E' }} />
                <span style={{ color: '#64748B' }}>Resolved</span>
              </div>
            </div>
          </div>
          {chartData.length > 0 ? (
            <svg viewBox={`0 0 ${chartW} ${chartH + 40}`} style={{ width: '100%', height: 'auto' }}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                <line key={i} x1={0} y1={padY + chartH * (1 - pct)} x2={chartW} y2={padY + chartH * (1 - pct)} stroke="#F1F5F9" strokeWidth={1} />
              ))}
              {/* Area fills */}
              <path d={toArea(threatPoints)} fill="#FEE2E2" opacity={0.4} />
              <path d={toArea(resolvedPoints)} fill="#DCFCE7" opacity={0.4} />
              {/* Lines */}
              <path d={toPath(threatPoints)} fill="none" stroke="#EF4444" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              <path d={toPath(resolvedPoints)} fill="none" stroke="#22C55E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              {/* Dots */}
              {threatPoints.map((p, i) => <circle key={`t${i}`} cx={p[0]} cy={p[1]} r={3.5} fill="#EF4444" />)}
              {resolvedPoints.map((p, i) => <circle key={`r${i}`} cx={p[0]} cy={p[1]} r={3.5} fill="#22C55E" />)}
              {/* X-axis labels */}
              {chartData.map((c, i) => (
                <text key={i} x={padX + i * stepX} y={chartH + 30} textAnchor="middle" fontSize={11} fill="#94A3B8" fontFamily="DM Sans">{c.month}</text>
              ))}
            </svg>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              No trend data yet — threats will appear here as they're detected
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div style={{
          background: 'white', borderRadius: 16, padding: 24,
          border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>Recent Activity</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {activity.length > 0 ? activity.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0',
                borderBottom: i < activity.length - 1 ? '1px solid #F8FAFC' : 'none',
              }}>
                <span style={{ fontSize: 16, marginTop: 1 }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.5 }}>{a.text}</div>
                  <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            )) : (
              <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                No activity yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Critical Threats Table */}
      <div style={{
        background: 'white', borderRadius: 16, padding: 24,
        border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>
            Critical Threats
          </div>
          <button
            onClick={() => router.push('/threats')}
            style={{
              padding: '6px 16px', borderRadius: 8, border: '1px solid #E2E8F0',
              background: 'white', fontSize: 13, color: '#64748B', cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            View All →
          </button>
        </div>

        {threats.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  {['Domain', 'Type', 'Severity', 'Revenue at Risk', 'Status', 'First Seen'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600,
                      color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {threats.map((t) => {
                  const st = statusMap[t.status] || statusMap.detected;
                  return (
                    <tr
                      key={t.id}
                      onClick={() => router.push(`/threats/${t.id}`)}
                      style={{ borderBottom: '1px solid #F8FAFC', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFBFC'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 12px', fontWeight: 600, color: '#0F172A', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                        {t.domain}
                      </td>
                      <td style={{ padding: '14px 12px', color: '#64748B' }}>
                        {typeLabels[t.type] || t.type}
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          fontFamily: "'JetBrains Mono', monospace",
                          background: t.severity >= 70 ? '#FEF2F2' : t.severity >= 40 ? '#FFFBEB' : '#F1F5F9',
                          color: severityColor(t.severity),
                        }}>
                          {t.severity}
                        </span>
                      </td>
                      <td style={{
                        padding: '14px 12px', fontWeight: 600, color: '#D97706',
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                      }}>
                        ${(t.revenue || 0).toLocaleString()}/mo
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: st.bg, color: st.color,
                        }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px', color: '#94A3B8', fontSize: 12 }}>
                        {formatDate(t.first_seen)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>No active threats</div>
            <div style={{ fontSize: 13, color: '#94A3B8' }}>Your brand is looking clean right now</div>
          </div>
        )}
      </div>
    </>
  );
}
