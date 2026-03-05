'use client';

import type { AgentDef } from '@/lib/agents';
import type { AgentCommand } from './OfficeRoom/OfficeRoom';
import type { OfficeAgentState } from './OfficeRoom/engine/types';

const ACTIONS: { label: string; action: OfficeAgentState; emoji: string }[] = [
  { label: '专注',  action: 'deepfocus', emoji: '🔮' },
  { label: '工作',  action: 'work',      emoji: '💻' },
  { label: '休息',  action: 'coffee',    emoji: '☕' },
  { label: '摸鱼',  action: 'lounge',    emoji: '🛋️' },
  { label: '庆祝',  action: 'celebrate', emoji: '🎉' },
];

const ACTION_MESSAGES: Record<string, string> = {
  deepfocus: '深度专注中...',
  work:      '专注工作中...',
  coffee:    '喝杯咖啡！',
  lounge:    '摸会儿鱼',
  celebrate: '耶！',
};

interface ControlPanelProps {
  agents: AgentDef[];
  onCommand: (cmd: AgentCommand) => void;
  activeCmd: { agentId: string; action: string } | null;
}

export function ControlPanel({ agents, onCommand, activeCmd }: ControlPanelProps) {
  return (
    <div style={{
      marginTop: 16,
      padding: 16,
      borderRadius: 12,
      background: '#0f172a',
      border: '1px solid #1e293b',
    }}>
      <div style={{ color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        手动触发动画
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {agents.map((agent) => (
          <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: agent.color, flexShrink: 0,
            }} />
            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, width: 44, flexShrink: 0 }}>
              {agent.name}
            </span>
            <span style={{ color: '#334155', fontSize: 10, width: 56, flexShrink: 0 }}>
              {agent.role}
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
                      border: isActive ? `1px solid ${agent.color}80` : '1px solid #1e293b',
                      background: isActive ? `${agent.color}20` : '#0f172a',
                      color: isActive ? agent.color : '#475569',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      transform: isActive ? 'scale(0.93)' : 'scale(1)',
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
    </div>
  );
}
