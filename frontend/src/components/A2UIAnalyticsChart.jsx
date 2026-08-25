import { useState } from 'react';
import {
  BarChart3,
  PieChart,
  Lightbulb,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

/* ── Color Palette Helper ─────────────────────────────────────────────────── */
const ICA_PALETTE = [
  '#e11d48', // Rose / ICA Red
  '#059669', // Emerald / KRAV Green
  '#d97706', // Warm Amber
  '#0284c7', // Sky Blue
  '#7c3aed', // Electric Purple
  '#475569', // Slate
];

const FASHION_PALETTE = [
  '#4f46e5', // Royal Indigo
  '#7c3aed', // Deep Violet
  '#db2777', // Rose Pink
  '#0891b2', // Cyan
  '#f59e0b', // Amber Gold
  '#64748b', // Slate
];

export default function A2UIAnalyticsChart({ chart, activeClient }) {
  const [activeMetric, setActiveMetric] = useState('primary'); // 'primary' | 'secondary'
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedChartType, setSelectedChartType] = useState(chart?.chart_type || 'horizontal_bar');

  if (!chart || !chart.data_points || chart.data_points.length === 0) {
    return null;
  }

  const isIca = chart.client_type === 'ica_sweden' || activeClient?.client_id === 'ica_sweden';
  const palette = isIca ? ICA_PALETTE : FASHION_PALETTE;
  const brandName = isIca ? 'ICA Sverige' : 'Crazy Fashion';

  const hasSecondary = chart.data_points.some(d => d.secondary_value !== null && d.secondary_value !== undefined);
  const primaryMetricName = chart.primary_metric_label || 'Primary Metric';
  const secondaryMetricName = chart.secondary_metric_label || 'Secondary Metric';

  // Calculate totals and max for scaling
  const currentValues = chart.data_points.map(d => 
    activeMetric === 'primary' ? Number(d.value || 0) : Number(d.secondary_value || 0)
  );
  const totalValue = currentValues.reduce((acc, v) => acc + v, 0);
  const maxValue = Math.max(...currentValues, 1);

  const formatNumber = (num, isCurrency = true) => {
    if (isNaN(num)) return '0';
    if (isCurrency) {
      if (isIca) {
        return Math.round(num).toLocaleString('sv-SE') + ' kr';
      }
      return '€' + Number(num).toLocaleString('en-US', { minimumFractionDigits: num % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });
    }
    return Number(num).toLocaleString();
  };

  return (
    <div
      className="a2ui-analytics-card"
      style={{
        margin: '1.25rem 0',
        borderRadius: '16px',
        background: 'var(--card-bg, #ffffff)',
        border: '1.5px solid ' + (isIca ? 'rgba(225, 29, 72, 0.25)' : 'rgba(79, 70, 229, 0.25)'),
        boxShadow: isIca
          ? '0 12px 32px -8px rgba(225, 29, 72, 0.08), 0 4px 16px -2px rgba(0,0,0,0.04)'
          : '0 12px 32px -8px rgba(79, 70, 229, 0.08), 0 4px 16px -2px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        position: 'relative'
      }}
    >
      {/* ── Top Header Banner ──────────────────────────────────────────────── */}
      <div
        style={{
          padding: '1.1rem 1.4rem',
          background: isIca
            ? 'linear-gradient(135deg, rgba(225, 29, 72, 0.06) 0%, rgba(244, 63, 94, 0.02) 100%)'
            : 'linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(124, 58, 237, 0.02) 100%)',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.8rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: isIca ? '#e11d48' : '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: isIca ? '0 4px 12px rgba(225, 29, 72, 0.3)' : '0 4px 12px rgba(79, 70, 229, 0.3)'
            }}
          >
            <BarChart3 size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: isIca ? '#e11d48' : '#4f46e5'
                }}
              >
                A2UI ANALYTICS INSIGHT • {brandName}
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '6px',
                  background: isIca ? 'rgba(225, 29, 72, 0.1)' : 'rgba(79, 70, 229, 0.1)',
                  color: isIca ? '#e11d48' : '#4f46e5',
                  fontWeight: 600
                }}
              >
                Live BigQuery
              </span>
            </div>
            <h3
              style={{
                margin: '0.2rem 0 0 0',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--text-main, #0f172a)'
              }}
            >
              {chart.title}
            </h3>
            {chart.subtitle && (
              <p
                style={{
                  margin: '0.15rem 0 0 0',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted, #64748b)'
                }}
              >
                {chart.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Chart View Switchers & Metric Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {hasSecondary && (
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--bg-secondary, #f1f5f9)',
                padding: '2px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveMetric('primary')}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeMetric === 'primary' ? 'var(--card-bg, #ffffff)' : 'transparent',
                  color: activeMetric === 'primary' ? (isIca ? '#e11d48' : '#4f46e5') : 'var(--text-muted, #64748b)',
                  boxShadow: activeMetric === 'primary' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {primaryMetricName}
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('secondary')}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeMetric === 'secondary' ? 'var(--card-bg, #ffffff)' : 'transparent',
                  color: activeMetric === 'secondary' ? (isIca ? '#e11d48' : '#4f46e5') : 'var(--text-muted, #64748b)',
                  boxShadow: activeMetric === 'secondary' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {secondaryMetricName}
              </button>
            </div>
          )}

          {/* Chart Type Selector */}
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--bg-secondary, #f1f5f9)',
              padding: '2px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #cbd5e1)'
            }}
          >
            <button
              type="button"
              title="Horizontal Bar Chart"
              onClick={() => setSelectedChartType('horizontal_bar')}
              style={{
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: selectedChartType === 'horizontal_bar' ? 'var(--card-bg, #ffffff)' : 'transparent',
                color: selectedChartType === 'horizontal_bar' ? (isIca ? '#e11d48' : '#4f46e5') : 'var(--text-muted, #64748b)',
                boxShadow: selectedChartType === 'horizontal_bar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <BarChart3 size={14} style={{ transform: 'rotate(90deg)' }} />
            </button>
            <button
              type="button"
              title="Vertical Column Chart"
              onClick={() => setSelectedChartType('bar')}
              style={{
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: selectedChartType === 'bar' ? 'var(--card-bg, #ffffff)' : 'transparent',
                color: selectedChartType === 'bar' ? (isIca ? '#e11d48' : '#4f46e5') : 'var(--text-muted, #64748b)',
                boxShadow: selectedChartType === 'bar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <BarChart3 size={14} />
            </button>
            <button
              type="button"
              title="Donut Distribution"
              onClick={() => setSelectedChartType('donut')}
              style={{
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: selectedChartType === 'donut' ? 'var(--card-bg, #ffffff)' : 'transparent',
                color: selectedChartType === 'donut' ? (isIca ? '#e11d48' : '#4f46e5') : 'var(--text-muted, #64748b)',
                boxShadow: selectedChartType === 'donut' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <PieChart size={14} />
            </button>
            <button
              type="button"
              title="Metric Grid"
              onClick={() => setSelectedChartType('metric_grid')}
              style={{
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: selectedChartType === 'metric_grid' ? 'var(--card-bg, #ffffff)' : 'transparent',
                color: selectedChartType === 'metric_grid' ? (isIca ? '#e11d48' : '#4f46e5') : 'var(--text-muted, #64748b)',
                boxShadow: selectedChartType === 'metric_grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Layers size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Summary Cards (if provided) ─────────────────────────────────── */}
      {chart.kpis && chart.kpis.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(' + Math.min(chart.kpis.length, 4) + ', 1fr)',
            gap: '0.85rem',
            padding: '1rem 1.4rem 0.4rem 1.4rem'
          }}
        >
          {chart.kpis.map((kpi, idx) => {
            const isPositive = kpi.status === 'positive' || (kpi.change_pct && kpi.change_pct.startsWith('+'));
            const isNegative = kpi.status === 'negative' || (kpi.change_pct && kpi.change_pct.startsWith('-'));

            return (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-secondary, #f8fafc)',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
                    {kpi.label}
                  </span>
                  {kpi.change_pct && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.35rem',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                        background: isPositive
                          ? 'rgba(34, 197, 94, 0.12)'
                          : isNegative
                          ? 'rgba(239, 68, 68, 0.12)'
                          : 'rgba(100, 116, 139, 0.12)',
                        color: isPositive ? '#16a34a' : isNegative ? '#dc2626' : '#475569'
                      }}
                    >
                      {isPositive ? <ArrowUpRight size={10} /> : isNegative ? <ArrowDownRight size={10} /> : null}
                      {kpi.change_pct}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                  {kpi.value}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Main Chart Canvas Area ─────────────────────────────────────────── */}
      <div style={{ padding: '1.2rem 1.4rem' }}>
        {/* 1. HORIZONTAL BAR CHART (Default & Highly Readable) */}
        {selectedChartType === 'horizontal_bar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {chart.data_points.map((point, idx) => {
              const val = activeMetric === 'primary' ? Number(point.value || 0) : Number(point.secondary_value || 0);
              const pct = totalValue > 0 ? (val / totalValue) * 100 : 0;
              const barWidthPct = maxValue > 0 ? Math.max((val / maxValue) * 100, 3) : 3;
              const barColor = point.color || palette[idx % palette.length];
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    padding: '0.5rem 0.65rem',
                    borderRadius: '8px',
                    background: isHovered ? 'var(--bg-secondary, #f8fafc)' : 'transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '3px',
                          background: barColor,
                          display: 'inline-block',
                          flexShrink: 0
                        }}
                      />
                      <span style={{ fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                        {point.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {hasSecondary && activeMetric === 'primary' && point.secondary_value !== undefined && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                          {point.secondary_value} {secondaryMetricName.toLowerCase()}
                        </span>
                      )}
                      <span style={{ fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                        {activeMetric === 'primary' && point.formatted_value
                          ? point.formatted_value
                          : formatNumber(val, activeMetric === 'primary')}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: barColor,
                          background: barColor + '15',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          minWidth: '42px',
                          textAlign: 'right'
                        }}
                      >
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Bar Track & Fill */}
                  <div
                    style={{
                      width: '100%',
                      height: '9px',
                      borderRadius: '5px',
                      background: 'var(--border-color, #e2e8f0)',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        width: barWidthPct + '%',
                        height: '100%',
                        borderRadius: '5px',
                        background: 'linear-gradient(90deg, ' + barColor + ' 0%, ' + barColor + 'dd 100%)',
                        transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. VERTICAL COLUMN BAR CHART */}
        {selectedChartType === 'bar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                height: '190px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
                gap: '1rem',
                paddingTop: '2rem',
                borderBottom: '1.5px solid var(--border-color, #cbd5e1)'
              }}
            >
              {chart.data_points.map((point, idx) => {
                const val = activeMetric === 'primary' ? Number(point.value || 0) : Number(point.secondary_value || 0);
                const heightPct = maxValue > 0 ? Math.max((val / maxValue) * 100, 6) : 6;
                const barColor = point.color || palette[idx % palette.length];
                const isHovered = hoveredIndex === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Floating Value Pill on Top */}
                    <div
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: 'var(--text-main, #0f172a)',
                        marginBottom: '0.35rem',
                        whiteSpace: 'nowrap',
                        opacity: isHovered ? 1 : 0.85,
                        transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {activeMetric === 'primary' && point.formatted_value
                        ? point.formatted_value
                        : formatNumber(val, activeMetric === 'primary')}
                    </div>

                    {/* Bar Fill Column */}
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '48px',
                        height: heightPct + '%',
                        borderRadius: '6px 6px 0 0',
                        background: isHovered
                          ? 'linear-gradient(180deg, ' + barColor + ' 0%, ' + barColor + 'bb 100%)'
                          : 'linear-gradient(180deg, ' + barColor + 'dd 0%, ' + barColor + '99 100%)',
                        boxShadow: isHovered ? '0 -4px 12px ' + barColor + '40' : 'none',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Bottom Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: '1rem' }}>
              {chart.data_points.map((point, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: 'var(--text-muted, #64748b)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {point.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. DONUT DISTRIBUTION CHART */}
        {selectedChartType === 'donut' && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2rem',
              padding: '0.5rem 0'
            }}
          >
            {/* SVG Donut */}
            <div style={{ position: 'relative', width: '180px', height: '180px' }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                {(() => {
                  let accumulatedPercent = 0;
                  return chart.data_points.map((point, idx) => {
                    const val = activeMetric === 'primary' ? Number(point.value || 0) : Number(point.secondary_value || 0);
                    const pct = totalValue > 0 ? (val / totalValue) * 100 : 0;
                    const strokeDasharray = pct + ' ' + (100 - pct);
                    const strokeDashoffset = -accumulatedPercent;
                    accumulatedPercent += pct;
                    const sliceColor = point.color || palette[idx % palette.length];
                    const isHovered = hoveredIndex === idx;

                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={sliceColor}
                        strokeWidth={isHovered ? '24' : '20'}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        pathLength="100"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        style={{
                          transition: 'all 0.25s ease',
                          cursor: 'pointer'
                        }}
                      />
                    );
                  });
                })()}
              </svg>

              {/* Center Donut Label */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>
                  Total {primaryMetricName}
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                  {formatNumber(totalValue, activeMetric === 'primary')}
                </span>
              </div>
            </div>

            {/* Donut Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '180px' }}>
              {chart.data_points.map((point, idx) => {
                const val = activeMetric === 'primary' ? Number(point.value || 0) : Number(point.secondary_value || 0);
                const pct = totalValue > 0 ? (val / totalValue) * 100 : 0;
                const sliceColor = point.color || palette[idx % palette.length];
                const isHovered = hoveredIndex === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      background: isHovered ? 'var(--bg-secondary, #f8fafc)' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '3px',
                          background: sliceColor,
                          flexShrink: 0
                        }}
                      />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                        {point.label}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: sliceColor }}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. METRIC GRID CARDS */}
        {selectedChartType === 'metric_grid' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.85rem'
            }}
          >
            {chart.data_points.map((point, idx) => {
              const val = activeMetric === 'primary' ? Number(point.value || 0) : Number(point.secondary_value || 0);
              const cardColor = point.color || palette[idx % palette.length];

              return (
                <div
                  key={idx}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    background: 'var(--bg-secondary, #f8fafc)',
                    borderTop: '1.5px solid ' + cardColor + '30',
                    borderRight: '1.5px solid ' + cardColor + '30',
                    borderBottom: '1.5px solid ' + cardColor + '30',
                    borderLeft: '4px solid ' + cardColor,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #64748b)' }}>
                    {point.label}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                    {point.formatted_value || formatNumber(val, activeMetric === 'primary')}
                  </div>
                  {hasSecondary && point.secondary_value !== undefined && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>
                      {secondaryMetricName}: <strong style={{ color: 'var(--text-main)' }}>{point.secondary_value}</strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Key Strategic Insights / Takeaways Box ──────────────────────────── */}
      {chart.key_insights && chart.key_insights.length > 0 && (
        <div
          style={{
            margin: '0.4rem 1.4rem 1.2rem 1.4rem',
            padding: '0.9rem 1.1rem',
            borderRadius: '12px',
            background: isIca ? 'rgba(225, 29, 72, 0.05)' : 'rgba(79, 70, 229, 0.05)',
            border: '1px dashed ' + (isIca ? 'rgba(225, 29, 72, 0.3)' : 'rgba(79, 70, 229, 0.3)'),
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Lightbulb size={16} color={isIca ? '#e11d48' : '#4f46e5'} />
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: isIca ? '#e11d48' : '#4f46e5',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}
            >
              Key Strategic Takeaways
            </span>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem',
              fontSize: '0.8rem',
              color: 'var(--text-main, #334155)',
              lineHeight: 1.45
            }}
          >
            {chart.key_insights.map((insight, idx) => (
              <li key={idx}>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
