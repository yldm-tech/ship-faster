'use client';

import type { AgentDef } from '@/lib/agents';
import type { AgentCommand } from './OfficeRoom/OfficeRoom';
import type { OfficeAgentState } from './OfficeRoom/engine/types';

const ACTIONS: { label: string; action: OfficeAgentState; emoji: string }[] = [
  { label: '工作',  action: 'work',      emoji: '💻' },
  { label: '休息',  action: 'coffee',    emoji: '☕' },
  { label: '摸鱼',  action: 'lounge',    emoji: '🛋️' },
  { label: '庆祝',  action: 'celebrate', emoji: '🎉' },
];

const ACTION_MESSAGES: Record<string, string> = {
  work:      '专注工作中...',
  coffee:    '喝杯咖啡！',
  lounge:    '摸会儿鱼',
  celebrate: '耶！',
};

interface ControlPanelProps {
  agents: AgentDef[];
  autoMode: boolean;
  onToggleAuto: () => void;
  onCommand: (cmd: AgentCommand) => void;
  activeCmd: { agentId: string; action: string } | null;
}

export function ControlPanel({ agents, autoMode, onToggleAuto, onCommand, activeCmd }: ControlPanelProps) {
  return (
    <div style={{
      marginTop: 16,
      padding: 16,
      borderRadius: 12,
      background: '#0f1117',
      border: '1px solid #1e293b',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ color: '#9ca3af', fontSize: 13, fontWeight: 600 }}>模式：</span>
        <button
          type="button"
          onClick={onToggleAuto}
          style={{
            padding: '4px 12px',
            borderRadius: 8,
            border: '1px solid #334155',
            background: autoMode ? '#1e40af' : '#1e293b',
            color: autoMode ? '#93c5fd' : '#9ca3af',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {autoMode ? '自动（运行中）' : '手动'}
        </button>
      </div>

      {!autoMode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {agents.map((agent) => (
            <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: agent.color, flexShrink: 0,
              }} />
              <span style={{ color: '#e5e7eb', fontSize: 12, fontWeight: 600, width: 90 }}>
                {agent.name}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {ACTIONS.map((act) => {
                  const isActive = activeCmd?.agentId === agent.id && activeCmd?.action === act.action;
                  return (
                    <button
                      key={act.action}
                      type="button"
                      onClick={() => onCommand({
                        agentId: agent.id,
                        action: act.action,
                        message: ACTION_MESSAGES[act.action],
                      })}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: isActive ? '1px solid #60a5fa' : '1px solid #334155',
                        background: isActive ? '#1e3a5f' : '#1e293b',
                        color: isActive ? '#93c5fd' : '#d1d5db',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        transform: isActive ? 'scale(0.93)' : 'scale(1)',
                        boxShadow: isActive ? '0 0 8px rgba(96,165,250,0.3)' : 'none',
                      }}
                    >
                      {act.emoji} {act.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
