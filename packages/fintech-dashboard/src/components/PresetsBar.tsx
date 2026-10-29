import React from 'react';
import { FINTECH_PRESETS, StartupPreset } from '../engine/presets';

interface PresetsBarProps {
  activePresetId: string;
  onSelectPreset: (preset: StartupPreset) => void;
}

export const PresetsBar: React.FC<PresetsBarProps> = ({ activePresetId, onSelectPreset }) => {
  return (
    <section
      role="region"
      aria-label="1-Click Startup Presets"
      style={{
        backgroundColor: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 8,
        padding: '16px 20px',
        marginBottom: 24,
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#f0f6fc' }}>
          1-Click Employer Demonstration Presets
        </h3>
        <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#8b949e' }}>
          Select a startup stage to instantly populate financial telemetry, runway metrics, and AI Coach context:
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        {FINTECH_PRESETS.map((preset) => {
          const isActive = preset.id === activePresetId;
          const statusColor =
            preset.status === 'CRITICAL'
              ? '#f85149'
              : preset.status === 'DEFAULT_ALIVE'
              ? '#3fb950'
              : '#58a6ff';

          return (
            <button
              key={preset.id}
              type="button"
              data-testid={`preset-${preset.id}`}
              onClick={() => onSelectPreset(preset)}
              style={{
                textAlign: 'left',
                backgroundColor: isActive ? '#21262d' : '#0d1117',
                border: `2px solid ${isActive ? statusColor : '#30363d'}`,
                borderRadius: 6,
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f6fc' }}>
                  {preset.name}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 12,
                    backgroundColor: `${statusColor}22`,
                    color: statusColor,
                    border: `1px solid ${statusColor}55`,
                  }}
                >
                  {preset.badgeLabel}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#8b949e' }}>{preset.tagline}</div>
              <div style={{ fontSize: 11, color: '#58a6ff', marginTop: 4 }}>
                Cash: ${(preset.cashBalanceCents / 100).toLocaleString()} · Headcount: {preset.headcount}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
