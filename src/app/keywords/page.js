'use client';
import { useState } from 'react';
import { useKeywords } from '@/hooks/useApi';
import { useBrandContext } from '@/lib/BrandContext';
import * as api from '@/lib/api';

const typeLabels = {
  exact_brand: 'Brand',
  brand_modifier: 'Modifier',
  product: 'Product',
  misspelling: 'Misspelling',
  long_tail: 'Long Tail',
};

const typeBg = {
  exact_brand: '#EFF6FF',
  brand_modifier: '#F5F3FF',
  product: '#F0FDF4',
  misspelling: '#FFFBEB',
  long_tail: '#F1F5F9',
};

const typeColor = {
  exact_brand: '#2563EB',
  brand_modifier: '#7C3AED',
  product: '#16A34A',
  misspelling: '#D97706',
  long_tail: '#64748B',
};

function formatInterval(hours) {
  if (!hours) return '—';
  if (hours < 24) return `${hours}h`;
  if (hours < 168) return `${Math.round(hours / 24)}d`;
  return `${Math.round(hours / 168)}w`;
}

function formatDate(iso) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function KeywordsPage() {
  const { brandId, brandName } = useBrandContext();
  const { data: keywords, loading, error, refetch } = useKeywords(brandId);
  const [sortBy, setSortBy] = useState('priority');
  const [typeFilter, setTypeFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [newTerms, setNewTerms] = useState('');
  const [adding, setAdding] = useState(false);

  const kwList = Array.isArray(keywords) ? keywords : [];

  // Filter and sort
  const filtered = kwList.filter(k => !typeFilter || k.keyword_type === typeFilter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'priority') return (Number(b.priority_score) || 0) - (Number(a.priority_score) || 0);
    if (sortBy === 'volume') return (b.monthly_volume || 0) - (a.monthly_volume || 0);
    if (sortBy === 'cpc') return (Number(b.avg_cpc) || 0) - (Number(a.avg_cpc) || 0);
    return 0;
  });

  // Stats
  const totalVolume = kwList.reduce((s, k) => s + (k.monthly_volume || 0), 0);
  const activeCount = kwList.filter(k => k.is_active).length;
  const withThreats = kwList.filter(k => k.last_threat_at).length;

  const handleAddKeywords = async () => {
    if (!newTerms.trim()) return;
    setAdding(true);
    try {
      const terms = newTerms.split('\n').map(t => t.trim()).filter(Boolean);
      await api.addKeywords(brandId, terms);
      setNewTerms('');
      setAddOpen(false);
      refetch();
    } catch (err) {
      alert('Failed to add keywords: ' + err.message);
    } finally {
      setAdding(false);
    }
  };

  if (!brandId) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>No brand selected.</div>;
  }

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0F172A' }}>Keywords</h1>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: '4px 0 0' }}>
            {kwList.length} keywords monitored for {brandName || 'your brand'}
          </p>
        </div>
        <button
          onClick={() => setAddOpen(!addOpen)}
          style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: '#2563EB', color: 'white', fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          + Add Keywords
        </button>
      </div>

      {/* Add Keywords Panel */}
      {addOpen && (
        <div style={{
          background: 'white', borderRadius: 12, padding: 20, marginBottom: 20,
          border: '1px solid #DBEAFE', boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>Add keywords (one per line)</div>
          <textarea
            value={newTerms}
            onChange={e => setNewTerms(e.target.value)}
            placeholder="athletic greens review&#10;ag1 discount code&#10;athletic greens vs"
            style={{
              width: '100%', minHeight: 100, padding: 12, borderRadius: 8,
              border: '1px solid #E2E8F0', fontSize: 13, resize: 'vertical',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={handleAddKeywords}
              disabled={adding}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: '#2563EB', color: 'white', fontSize: 13,
                fontWeight: 600, cursor: 'pointer', opacity: adding ? 0.6 : 1,
              }}
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
            <button
              onClick={() => { setAddOpen(false); setNewTerms(''); }}
              style={{
                padding: '8px 20px', borderRadius: 8, border: '1px solid #E2E8F0',
                background: 'white', fontSize: 13, color: '#64748B', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Volume', value: totalVolume.toLocaleString() + '/mo', icon: '📊' },
          { label: 'Active Monitoring', value: activeCount, icon: '🔍' },
          { label: 'With Threat History', value: withThreats, icon: '⚠️' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'white', borderRadius: 12, padding: '16px 20px',
            border: '1px solid #F1F5F9',
          }}>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>{s.icon} {s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', fontFamily: "'JetBrains Mono', monospace" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
            background: 'white', fontSize: 13, color: '#64748B', cursor: 'pointer',
          }}
        >
          <option value="">All Types</option>
          <option value="exact_brand">Brand</option>
          <option value="brand_modifier">Modifier</option>
          <option value="product">Product</option>
          <option value="misspelling">Misspelling</option>
          <option value="long_tail">Long Tail</option>
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
            background: 'white', fontSize: 13, color: '#64748B', cursor: 'pointer',
          }}
        >
          <option value="priority">Sort: Priority Score</option>
          <option value="volume">Sort: Search Volume</option>
          <option value="cpc">Sort: CPC</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ color: '#64748B', fontSize: 13 }}>Loading keywords...</div>
        </div>
      ) : (
        <div style={{
          background: 'white', borderRadius: 16, border: '1px solid #F1F5F9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                {['Keyword', 'Type', 'Volume', 'CPC', 'Priority', 'Interval', 'Last Checked', 'Status'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 600,
                    color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(k => {
                const type = k.keyword_type || 'long_tail';
                return (
                  <tr key={k.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                    <td style={{
                      padding: '12px 14px', fontWeight: 500, color: '#0F172A',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                    }}>
                      {k.term}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: typeBg[type] || '#F1F5F9', color: typeColor[type] || '#64748B',
                      }}>
                        {typeLabels[type] || type}
                      </span>
                    </td>
                    <td style={{
                      padding: '12px 14px', fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12, color: '#1E293B',
                    }}>
                      {(k.monthly_volume || 0).toLocaleString()}
                    </td>
                    <td style={{
                      padding: '12px 14px', fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12, color: '#64748B',
                    }}>
                      ${Number(k.avg_cpc || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 50, height: 6, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${Math.min(100, Number(k.priority_score) || 0)}%`, height: '100%', borderRadius: 3,
                            background: Number(k.priority_score) >= 70 ? '#EF4444' : Number(k.priority_score) >= 40 ? '#F59E0B' : '#22C55E',
                          }} />
                        </div>
                        <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#64748B' }}>
                          {Number(k.priority_score || 0).toFixed(0)}
                        </span>
                      </div>
                    </td>
                    <td style={{
                      padding: '12px 14px', fontSize: 12, color: '#94A3B8',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {formatInterval(k.check_interval_hours)}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#94A3B8' }}>
                      {formatDate(k.last_checked_at)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                        background: k.is_active ? '#22C55E' : '#CBD5E1',
                      }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
