'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useThreats } from '@/hooks/useApi';
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

function severityBg(s) {
  if (s >= 80) return '#FEF2F2';
  if (s >= 60) return '#FFFBEB';
  if (s >= 40) return '#EFF6FF';
  return '#F1F5F9';
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ThreatsPage() {
  const router = useRouter();
  const { brandId, brandName } = useBrandContext();
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('severity');

  const { data: threats, loading, error, refetch } = useThreats(brandId, {
    status: statusFilter || undefined,
  });

  const threatList = Array.isArray(threats) ? threats : [];

  // Sort client-side
  const sorted = [...threatList].sort((a, b) => {
    if (sortBy === 'severity') return (b.severity_score || 0) - (a.severity_score || 0);
    if (sortBy === 'revenue') return (b.revenue_at_risk_monthly || 0) - (a.revenue_at_risk_monthly || 0);
    if (sortBy === 'recent') return new Date(b.last_seen_at || 0) - new Date(a.last_seen_at || 0);
    return 0;
  });

  if (!brandId) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
        No brand selected. Go to the dashboard to set up a brand.
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0F172A' }}>Threat Queue</h1>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: '4px 0 0' }}>
            {threatList.length} threat{threatList.length !== 1 ? 's' : ''} detected for {brandName || 'your brand'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
            background: 'white', fontSize: 13, color: '#64748B', cursor: 'pointer',
          }}
        >
          <option value="">All Statuses</option>
          <option value="detected">Detected</option>
          <option value="confirmed">Confirmed</option>
          <option value="investigating">Investigating</option>
          <option value="takedown_pending">Takedown Pending</option>
          <option value="takedown_submitted">Takedown Submitted</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
            background: 'white', fontSize: 13, color: '#64748B', cursor: 'pointer',
          }}
        >
          <option value="severity">Sort: Severity</option>
          <option value="revenue">Sort: Revenue at Risk</option>
          <option value="recent">Sort: Most Recent</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%', margin: '0 auto 12px',
            border: '2px solid #E2E8F0', borderTopColor: '#2563EB',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ color: '#64748B', fontSize: 13 }}>Loading threats...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : error ? (
        <div style={{
          padding: 20, borderRadius: 12, background: '#FEF2F2',
          border: '1px solid #FECACA', color: '#DC2626', fontSize: 14,
        }}>
          Failed to load threats: {error}
        </div>
      ) : (
        <div style={{
          background: 'white', borderRadius: 16, border: '1px solid #F1F5F9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflow: 'hidden',
        }}>
          {sorted.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                  {['Domain', 'Type', 'Severity', 'Revenue at Risk', 'Status', 'First Seen', 'Last Seen'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 600,
                      color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((t) => {
                  const sev = Number(t.severity_score) || 0;
                  const rev = Number(t.revenue_at_risk_monthly) || 0;
                  const status = t.status || 'detected';
                  const st = statusMap[status] || statusMap.detected;
                  const type = t.threat_type || 'other';

                  return (
                    <tr
                      key={t.id}
                      onClick={() => router.push(`/threats/${t.id}`)}
                      style={{ borderBottom: '1px solid #F8FAFC', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFBFC'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{
                        padding: '14px', fontWeight: 600, color: '#0F172A',
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                      }}>
                        {t.domain}
                      </td>
                      <td style={{ padding: '14px', color: '#64748B' }}>
                        {typeLabels[type] || type}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          display: 'inline-flex', padding: '3px 10px', borderRadius: 20,
                          fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                          background: severityBg(sev), color: severityColor(sev),
                        }}>
                          {sev}
                        </span>
                      </td>
                      <td style={{
                        padding: '14px', fontWeight: 600, color: '#D97706',
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                      }}>
                        ${rev.toLocaleString()}/mo
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: st.bg, color: st.color,
                        }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px', color: '#94A3B8', fontSize: 12 }}>
                        {formatDate(t.first_seen_at)}
                      </td>
                      <td style={{ padding: '14px', color: '#94A3B8', fontSize: 12 }}>
                        {formatDate(t.last_seen_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>No threats found</div>
              <div style={{ fontSize: 13, color: '#94A3B8' }}>
                {statusFilter ? 'No threats match this filter. Try a different status.' : 'Your brand is looking clean!'}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
