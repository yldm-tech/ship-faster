'use client';

import { useEffect, useRef, useState } from 'react';
import { OfficeRoom } from './OfficeRoom/OfficeRoom';
import { ControlPanel } from './ControlPanel';
import { AGENTS, WORK_MSGS, PERSONALITY_BANTER, COFFEE_MSGS, CELEBRATE_MSGS, LOUNGE_MSGS } from '@/lib/agents';
import { useDemoSimulation } from '@/lib/mock-simulation';
import { useOpenclawStatus } from '@/lib/openclaw-status';
import type { AgentCommand } from './OfficeRoom/OfficeRoom';

interface AgentSnapshot {
  action: string;
  message: string;
  updatedAt: number;
}

interface LogEntry {
  id: number;
  agentId: string;
  action: string;
  message: string;
  ts: number;
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  return `${Math.floor(diff / 3_600_000)} 小时前`;
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    work: '工作中', deepfocus: '专注中', coffee: '休息中',
    lounge: '摸鱼中', celebrate: '庆祝！', talk: '沟通中',
    wave: '打招呼', idle: '待机',
  };
  return map[action] ?? action;
}

function actionColor(action: string): string {
  const map: Record<string, string> = {
    work: '#22c55e', deepfocus: '#10b981', coffee: '#f59e0b',
    lounge: '#6b7280', celebrate: '#ec4899', talk: '#06b6d4',
    wave: '#8b5cf6', idle: '#374151',
  };
  return map[action] ?? '#4b5563';
}

const LOG_ACTIONS = new Set(['work', 'deepfocus', 'celebrate', 'talk']);

export function DemoShell() {
  const [autoMode, setAutoMode] = useState(true);
  const mockCommands = useDemoSimulation(autoMode);
  const realCommands = useOpenclawStatus(autoMode);
  const isRealData = realCommands !== null;
  const autoCommands = realCommands ?? mockCommands;
  const [manualCommands, setManualCommands] = useState<AgentCommand[]>([]);
  const [activeCmd, setActiveCmd] = useState<{ agentId: string; action: string } | null>(null);
  const activeCmdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [agentSnapshot, setAgentSnapshot] = useState<Record<string, AgentSnapshot>>({});
  const [activityLog, setActivityLog] = useState<LogEntry[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const logIdRef = useRef(0);
  // Track prev messages per agent to avoid duplicate log entries
  const prevMsgRef = useRef<Record<string, string>>({});

  const commands = autoMode ? autoCommands : manualCommands;

  // Update snapshot and activity log whenever commands change
  useEffect(() => {
    if (!commands || commands.length === 0) return;
    const now = Date.now();
    const newEntries: LogEntry[] = [];

    setAgentSnapshot(prev => {
      const next = { ...prev };
      commands.forEach(cmd => {
        next[cmd.agentId] = { action: cmd.action, message: cmd.message ?? '', updatedAt: now };

        // Add to log only for interesting actions with changed messages
        if (LOG_ACTIONS.has(cmd.action)) {
          const key = `${cmd.agentId}:${cmd.message}`;
          if (prevMsgRef.current[cmd.agentId] !== key) {
            prevMsgRef.current[cmd.agentId] = key;
            newEntries.push({
              id: ++logIdRef.current,
              agentId: cmd.agentId,
              action: cmd.action,
              message: cmd.message ?? '',
              ts: now,
            });
          }
        }
      });
      return next;
    });

    if (newEntries.length > 0) {
      setEventCount(c => c + newEntries.length);
      setActivityLog(prev => [...newEntries, ...prev].slice(0, 30));
    }
  }, [commands]);

  const handleManualCommand = (cmd: AgentCommand) => {
    const manualCmd = { ...cmd, manual: true } as AgentCommand & { manual: boolean };
    setManualCommands(prev => [...prev, manualCmd]);
    setActiveCmd({ agentId: cmd.agentId, action: cmd.action });

    const now = Date.now();
    setAgentSnapshot(prev => ({
      ...prev,
      [cmd.agentId]: { action: cmd.action, message: cmd.message ?? '', updatedAt: now },
    }));
    setEventCount(c => c + 1);
    setActivityLog(prev => [{
      id: ++logIdRef.current,
      agentId: cmd.agentId,
      action: cmd.action,
      message: cmd.message ?? '',
      ts: now,
    }, ...prev].slice(0, 30));

    if (activeCmdTimerRef.current) clearTimeout(activeCmdTimerRef.current);
    activeCmdTimerRef.current = setTimeout(() => {
      setActiveCmd(null);
      activeCmdTimerRef.current = null;
    }, 1200);
  };

  useEffect(() => {
    return () => {
      if (activeCmdTimerRef.current) clearTimeout(activeCmdTimerRef.current);
    };
  }, []);

  const activeCount = Object.values(agentSnapshot).filter(
    s => s.action === 'work' || s.action === 'deepfocus'
  ).length;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px', fontFamily: 'ui-monospace, monospace' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.3px' }}>
            OpenClaw 团队工作台
          </h1>
          <p style={{ color: '#64748b', fontSize: 12, marginTop: 5, marginBottom: 0, lineHeight: 1.6 }}>
            6 个 AI Agent 实时协同工作 · 基于文件系统活跃度追踪
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <span style={{
            padding: '3px 10px', borderRadius: 20,
            background: isRealData ? '#052e16' : '#1c1917',
            color: isRealData ? '#4ade80' : '#78716c',
            fontSize: 10, fontWeight: 700,
            border: `1px solid ${isRealData ? '#166534' : '#44403c'}`,
          }}>
            {isRealData ? '● 真实数据' : '● 模拟演示'}
          </span>
          <span style={{
            padding: '3px 10px', borderRadius: 20,
            background: '#0c1a2e', color: '#60a5fa',
            fontSize: 10, fontWeight: 700, border: '1px solid #1e3a5f',
          }}>
            LIVE
          </span>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: '当前活跃', value: `${activeCount} / 6`, sub: '名 Agent 工作中' },
          { label: '今日事件', value: String(eventCount), sub: '次活动已记录' },
          { label: '数据来源', value: isRealData ? 'Openclaw' : 'Mock', sub: isRealData ? '实时文件系统' : '随机模拟' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '12px 16px',
          }}>
            <div style={{ color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {stat.label}
            </div>
            <div style={{ color: '#f8fafc', fontSize: 20, fontWeight: 800, marginTop: 3 }}>{stat.value}</div>
            <div style={{ color: '#334155', fontSize: 10, marginTop: 2 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Office Room ── */}
      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #1e293b', marginBottom: 16 }}>
        <OfficeRoom
          agents={AGENTS}
          isActive={true}
          activityLevel={10}
          agentCommands={commands}
          workMsgs={WORK_MSGS}
          personalityBanter={PERSONALITY_BANTER}
          coffeeMsgs={COFFEE_MSGS}
          celebrateMsgs={CELEBRATE_MSGS}
          loungeMsgs={LOUNGE_MSGS}
        />
      </div>

      {/* ── Agent Cards + Activity Log ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 12, marginBottom: 16 }}>

        {/* Agent status cards */}
        <div>
          <div style={{ color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Agent 状态
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {AGENTS.map(agent => {
              const snap = agentSnapshot[agent.id];
              const isActive = snap?.action === 'work' || snap?.action === 'deepfocus';
              const dotColor = snap ? actionColor(snap.action) : '#1e293b';

              return (
                <div key={agent.id} style={{
                  background: '#0f172a',
                  border: `1px solid ${isActive ? agent.color + '35' : '#1e293b'}`,
                  borderRadius: 10,
                  padding: '11px 13px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.3s',
                }}>
                  {isActive && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                      background: `linear-gradient(90deg, transparent, ${agent.color}80, transparent)`,
                    }} />
                  )}

                  {/* Name + avatar row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      width={30}
                      height={30}
                      style={{ borderRadius: 6, border: `2px solid ${agent.color}40`, flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: '#f1f5f9', fontSize: 12, fontWeight: 700 }}>{agent.name}</div>
                      <div style={{ color: '#475569', fontSize: 10 }}>{agent.role}</div>
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: dotColor, display: 'inline-block', flexShrink: 0,
                      boxShadow: isActive ? `0 0 6px ${dotColor}` : 'none',
                    }} />
                    <span style={{ color: dotColor, fontSize: 10, fontWeight: 600 }}>
                      {snap ? actionLabel(snap.action) : '待机'}
                    </span>
                  </div>

                  {/* Last message */}
                  <div style={{
                    color: '#334155', fontSize: 10, lineHeight: 1.3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    minHeight: 14,
                  }}>
                    {snap?.message ?? '—'}
                  </div>

                  {/* Time ago */}
                  {snap?.updatedAt && (
                    <div style={{ color: '#1e293b', fontSize: 9, marginTop: 3 }}>
                      {timeAgo(snap.updatedAt)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity log */}
        <div>
          <div style={{ color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            实时动态
          </div>
          <div style={{
            background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10,
            height: 208, overflowY: 'auto', scrollbarWidth: 'thin',
          }}>
            {activityLog.length === 0 ? (
              <div style={{ color: '#1e293b', fontSize: 11, textAlign: 'center', paddingTop: 70 }}>
                等待活动事件…
              </div>
            ) : activityLog.map(entry => {
              const agent = AGENTS.find(a => a.id === entry.agentId);
              return (
                <div key={entry.id} style={{
                  padding: '5px 12px',
                  display: 'grid',
                  gridTemplateColumns: '36px 1fr',
                  gap: 6,
                  borderBottom: '1px solid #0f172a',
                }}>
                  <span style={{ color: '#1e293b', fontSize: 9, fontFamily: 'monospace', paddingTop: 2, flexShrink: 0 }}>
                    {new Date(entry.ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div>
                    <span style={{ color: agent?.color ?? '#94a3b8', fontSize: 10, fontWeight: 700 }}>
                      {agent?.name ?? entry.agentId}
                    </span>
                    {' '}
                    <span style={{ color: '#475569', fontSize: 10 }}>
                      {entry.message}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Control Panel ── */}
      <ControlPanel
        agents={AGENTS}
        autoMode={autoMode}
        onToggleAuto={() => setAutoMode(v => !v)}
        onCommand={handleManualCommand}
        activeCmd={activeCmd}
      />
    </div>
  );
}
