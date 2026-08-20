import { useState, useEffect, useCallback } from 'react';
import { Database, RefreshCw, Layers, Users, Table } from 'lucide-react';

export default function BigQueryDataViewer() {
  const [tables, setTables] = useState([
    { id: 'customer_rfm_summary', name: 'Customer RFM Segmentation Summary' },
    { id: 'customer_demographics_360', name: 'Customer Demographics & 360 Profiles' },
    { id: 'customer_transactions', name: 'Real-time Customer Transaction Stream' }
  ]);
  const [selectedTable, setSelectedTable] = useState('customer_rfm_summary');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSample = useCallback((tableName) => {
    setLoading(true);
    fetch(`/api/bigquery/sample?table_name=${tableName}`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch('/api/bigquery/tables')
      .then(res => res.json())
      .then(resData => {
        if (!ignore && resData.tables) setTables(resData.tables);
      })
      .catch(err => console.error(err));

    fetch(`/api/bigquery/sample?table_name=${selectedTable}`)
      .then(res => res.json())
      .then(resData => {
        if (!ignore) {
          setData(resData);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [selectedTable]);

  const handleTableChange = (e) => {
    const newTable = e.target.value;
    setSelectedTable(newTable);
    fetchSample(newTable);
  };

  const rows = data?.sample_data || data?.rows || [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.4rem', height: '100%', overflowY: 'auto', width: '100%' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', color: 'var(--text-main)' }}>
            <Database size={22} color="var(--color-success)" />
            Google BigQuery Customer Dataset Inspector
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Live view of dataset <code style={{ color: 'var(--color-success)', background: 'rgba(52,168,83,0.12)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
              {data?.dataset || 'marketing_analytics'}.{selectedTable}
            </code>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          {/* Table Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Table:</span>
            <select
              value={selectedTable}
              onChange={handleTableChange}
              style={{
                background: 'var(--chip-bg)',
                border: '1px solid var(--border-highlight)',
                color: 'var(--text-main)',
                padding: '0.55rem 0.9rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {tables.map(t => (
                <option key={t.id} value={t.id} style={{ background: 'var(--dropdown-bg)', color: 'var(--text-main)' }}>
                  📊 {t.name} ({t.id})
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => fetchSample(selectedTable)}
            disabled={loading}
            style={{
              background: 'var(--chip-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '0.55rem 1rem',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.82rem',
              fontWeight: 600
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            Refresh Table Sample
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem' }}>
        <div style={kpiCardStyle('var(--color-success)')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Cohort Size</span>
            <Users size={18} color="var(--color-success)" />
          </div>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.3rem 0' }}>
            {data?.total_rows !== undefined ? data.total_rows.toLocaleString() : '200'}
          </span>
          <span style={{ fontSize: '0.74rem', color: 'var(--color-success)', fontWeight: 600 }}>Active Customer Records</span>
        </div>

        <div style={kpiCardStyle('var(--color-primary)')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Selected Table</span>
            <Table size={18} color="var(--color-primary)" />
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)', margin: '0.3rem 0' }}>{selectedTable}</span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{rows.length} Sample Rows Returned</span>
        </div>

        <div style={kpiCardStyle('var(--color-warning)')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>BigQuery Engine Status</span>
            <Layers size={18} color="var(--color-warning)" />
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-warning)', margin: '0.3rem 0' }}>LIVE BIGQUERY</span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Project: agent-demo-09</span>
        </div>
      </div>

      {/* Dynamic Data Table Container */}
      <div style={{
        background: 'var(--panel-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
      }}>
        <div style={{ padding: '0.9rem 1.2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Table size={16} color="var(--color-primary)" />
            Table Sample Output: <code style={{ color: 'var(--color-success)' }}>{selectedTable}</code>
          </span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Showing up to 10 live rows</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--chip-bg)', borderBottom: '1px solid var(--border-color)' }}>
                {columns.map((col, idx) => (
                  <th key={idx} style={thStyle}>
                    {formatColHeader(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-color)', background: rIdx % 2 === 0 ? 'transparent' : 'var(--chip-bg)' }}>
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} style={tdStyle}>
                        {renderCellValue(col, row[col])}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length || 6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {loading ? 'Fetching BigQuery table sample...' : 'No records found for table.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function kpiCardStyle(color) {
  return {
    background: 'var(--panel-bg)',
    border: `1px solid ${color}`,
    borderRadius: '12px',
    padding: '1.1rem',
    display: 'flex',
    flexDirection: 'column'
  };
}

const thStyle = {
  padding: '0.85rem 1.1rem',
  color: 'var(--text-muted)',
  fontWeight: 700,
  fontSize: '0.78rem',
  whiteSpace: 'nowrap'
};

const tdStyle = {
  padding: '0.8rem 1.1rem',
  color: 'var(--text-main)',
  whiteSpace: 'nowrap'
};

function formatColHeader(col) {
  return col.replace(/_/g, ' ').toUpperCase();
}

function renderCellValue(col, val) {
  if (val === null || val === undefined) return <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>null</span>;

  if (col.includes('id')) {
    return <code style={{ color: 'var(--color-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{String(val)}</code>;
  }

  if (col.includes('monetary') || col.includes('amount') || col.includes('spend')) {
    return <strong style={{ color: 'var(--color-success)' }}>${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>;
  }

  if (col.includes('segment')) {
    let color = 'var(--color-primary)';
    if (String(val).includes('At-Risk')) color = 'var(--color-danger)';
    if (String(val).includes('Champions')) color = 'var(--color-success)';
    return (
      <span style={{
        fontSize: '0.72rem',
        fontWeight: 600,
        color: color,
        background: 'rgba(66,133,244,0.12)',
        padding: '0.2rem 0.6rem',
        borderRadius: '6px',
        border: `1px solid ${color}`
      }}>
        {String(val)}
      </span>
    );
  }

  if (typeof val === 'number') {
    return val.toLocaleString();
  }

  return String(val);
}
