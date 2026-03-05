'use client';

import { useEffect, useRef, useState } from 'react';
import { OfficeRoom } from './OfficeRoom/OfficeRoom';
import { ControlPanel } from './ControlPanel';
import { AGENTS, WORK_MSGS, PERSONALITY_BANTER, COFFEE_MSGS, CELEBRATE_MSGS, LOUNGE_MSGS } from '@/lib/agents';
import { useOpenclawStatus, inferFromFile } from '@/lib/openclaw-status';
import type { AgentCommand } from './OfficeRoom/OfficeRoom';

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
    wave: '打招呼', idle: '待机', offline: '离线', think: '思考中',
  };
  return map[action] ?? action;
}

function actionColor(action: string): string {
  const map: Record<string, string> = {
    work: '#22c55e', deepfocus: '#34d399', coffee: '#f59e0b',
    lounge: '#6b7280', celebrate: '#ec4899', talk: '#06b6d4',
    wave: '#8b5cf6', idle: '#374151', offline: '#475569', think: '#a78bfa',
  };
  return map[action] ?? '#4b5563';
}

/** 根据文件路径 + 时间推断当前状态（显示层） */
function inferAction(updatedAtMs: number, file?: string, initOnly?: boolean): string {
  if (initOnly) return 'idle';
  const age = Date.now() - updatedAtMs;
  const fromFile = inferFromFile(file, age);
  if (fromFile && age < 10 * 60 * 1000) return fromFile.action;
  if (age < 2 * 60 * 1000) return 'deepfocus';
  if (age < 10 * 60 * 1000) return 'work';
  if (age < 60 * 60 * 1000) return 'lounge';
  return 'coffee';
}

export function DemoShell() {
  const { commands: realCommands, rawStatus, isConnected, isLoading, lastPolledAt } = useOpenclawStatus();
  const [manualCommands, setManualCommands] = useState<AgentCommand[]>([]);
  const [activeCmd, setActiveCmd] = useState<{ agentId: string; action: string } | null>(null);
  const activeCmdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activityLog, setActivityLog] = useState<LogEntry[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const logIdRef = useRef(0);
  // 追踪每个 agent 上次记录的 action，避免无变化时刷屏
  const prevActionRef = useRef<Record<string, string>>({});

  // 监听 rawStatus 变化：仅在 action 发生转变时写入日志
  useEffect(() => {
    if (!rawStatus) return;
    const now = Date.now();
    const newEntries: LogEntry[] = [];

    AGENTS.forEach(agent => {
      const s = rawStatus[agent.id];
      if (!s) return;
      const action = inferAction(s.updatedAtMs, s.file, s.initOnly);
      const fileResult = inferFromFile(s.file, Date.now() - s.updatedAtMs);
      // 用文件推断的具体描述做 diff key，避免同为 work 但实际活动变化时漏记
      const displayKey = fileResult?.msg ?? action;
      if (prevActionRef.current[agent.id] === displayKey) return;
      prevActionRef.current[agent.id] = displayKey;

      const msgMap: Record<string, string> = {
        deepfocus: '深度专注中',
        work: '开始工作',
        think: '深度思考中',
        lounge: '进入摸鱼模式',
        coffee: '去喝咖啡了',
      };
      newEntries.push({
        id: ++logIdRef.current,
        agentId: agent.id,
        action,
        message: fileResult?.msg ?? msgMap[action] ?? action,
        ts: s.updatedAtMs,
      });
    });

    if (newEntries.length > 0) {
      setEventCount(c => c + newEntries.length);
      setActivityLog(prev => [...newEntries, ...prev].slice(0, 30));
    }
  }, [rawStatus]);

  const handleManualCommand = (cmd: AgentCommand) => {
    setManualCommands(prev => [...prev.slice(-5), cmd]);
    setActiveCmd({ agentId: cmd.agentId, action: cmd.action });

    const now = Date.now();
    setEventCount(c => c + 1);
    setActivityLog(prev => [{
      id: ++logIdRef.current,
      agentId: cmd.agentId,
      action: cmd.action,
      message: `[手动] ${cmd.message ?? ''}`,
      ts: now,
    }, ...prev].slice(0, 30));

    if (activeCmdTimerRef.current) clearTimeout(activeCmdTimerRef.current);
    activeCmdTimerRef.current = setTimeout(() => {
      setActiveCmd(null);
      activeCmdTimerRef.current = null;
    }, 1200);
  };

  useEffect(() => {
    return () => { if (activeCmdTimerRef.current) clearTimeout(activeCmdTimerRef.current); };
  }, []);

  // isLoading 期间让所有 agent 坐着等待，避免首次 poll 前随机乱跑
  const loadingIdleCmds = isLoading
    ? AGENTS.map(a => ({ agentId: a.id, action: 'idle' as const, message: '' }))
    : [];
  // OfficeRoom 同时接收真实命令 + 最近手动命令
  const officeCommands = isLoading
    ? loadingIdleCmds
    : [...realCommands, ...manualCommands.slice(-3)];

  const activeCount = rawStatus
    ? AGENTS.filter(a => {
        const s = rawStatus[a.id];
        return s && !s.initOnly && Date.now() - s.updatedAtMs < 10 * 60 * 1000;
      }).length
    : 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px', fontFamily: 'ui-monospace, monospace' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.3px' }}>
            OpenClaw 团队工作台
          </h1>
          <p style={{ color: '#64748b', fontSize: 12, marginTop: 5, marginBottom: 0, lineHeight: 1.6 }}>
            {AGENTS.length} 个 AI Agent 实时协同工作 · 基于文件系统活跃度追踪 · 每 30 秒更新
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <span style={{
            padding: '3px 10px', borderRadius: 20,
            background: isLoading ? '#0f172a' : isConnected ? '#052e16' : '#1c1917',
            color: isLoading ? '#64748b' : isConnected ? '#4ade80' : '#ef4444',
            fontSize: 10, fontWeight: 700,
            border: `1px solid ${isLoading ? '#1e293b' : isConnected ? '#166534' : '#7f1d1d'}`,
          }}>
            {isLoading ? '○ 连接中' : isConnected ? '● 已连接' : '● 未连接'}
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

      {/* ── 未连接提示（首次加载完成后才显示） ── */}
      {!isLoading && !isConnected && (
        <div style={{
          marginBottom: 16, padding: '12px 16px', borderRadius: 10,
          background: '#1c0a00', border: '1px solid #7c2d12', color: '#fb923c', fontSize: 12,
        }}>
          ⚠️ 无法连接到 openclaw stage server（stage.yldm.tech/status）。请按照 <code>scripts/SETUP.md</code> 完成 macmini 配置。
        </div>
      )}

      {/* ── Stats bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: '当前活跃', value: isLoading ? '…' : isConnected ? `${activeCount} / ${AGENTS.length}` : '—', sub: '名 Agent 工作中（10 分钟内）' },
          { label: '状态切换', value: String(eventCount), sub: '次状态变化已记录' },
          { label: '上次同步', value: lastPolledAt ? timeAgo(lastPolledAt) : '—', sub: isLoading ? '连接中...' : isConnected ? 'stage.yldm.tech/status · 30s 轮询' : '等待连接...' },
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
          agentCommands={officeCommands}
          workMsgs={WORK_MSGS}
          personalityBanter={PERSONALITY_BANTER}
          coffeeMsgs={COFFEE_MSGS}
          celebrateMsgs={CELEBRATE_MSGS}
          loungeMsgs={LOUNGE_MSGS}
        />
      </div>

      {/* ── Agent Cards + Activity Log ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 12, marginBottom: 16 }}>

        {/* Agent status cards — 直接读 rawStatus 真实时间戳 */}
        <div>
          <div style={{ color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Agent 状态
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {AGENTS.map(agent => {
              const s = rawStatus?.[agent.id];
              const action = s ? inferAction(s.updatedAtMs, s.file, s.initOnly) : 'offline';
              const isActive = action === 'work' || action === 'deepfocus' || action === 'think';
              const dotColor = actionColor(action);

              return (
                <div key={agent.id} style={{
                  background: '#0f172a',
                  border: `1px solid ${isActive ? agent.color + '35' : '#1e293b'}`,
                  borderRadius: 10,
                  padding: '11px 13px',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: !s ? 0.45 : 1,
                }}>
                  {isActive && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                      background: `linear-gradient(90deg, transparent, ${agent.color}80, transparent)`,
                    }} />
                  )}

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

                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: dotColor, display: 'inline-block', flexShrink: 0,
                      boxShadow: isActive ? `0 0 6px ${dotColor}` : 'none',
                    }} />
                    <span style={{ color: dotColor, fontSize: 10, fontWeight: 600 }}>
                      {actionLabel(action)}
                    </span>
                  </div>

                  <div style={{ color: isActive ? '#4ade80' : '#334155', fontSize: 10, minHeight: 14 }}>
                    {s?.initOnly ? '待命中'
                      : s ? (inferFromFile(s.file, Date.now() - s.updatedAtMs)?.msg ?? timeAgo(s.updatedAtMs))
                      : (isLoading ? '...' : isConnected ? '暂无数据' : '未连接')}
                  </div>
                  {s?.file && !s.initOnly && (
                    <div style={{
                      color: isActive ? '#1d5c3a' : '#2d3e52', fontSize: 9, marginTop: 3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }} title={s.file}>
                      {s.file.split('/').pop()} · {timeAgo(s.updatedAtMs)}
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
            状态变化记录
          </div>
          <div style={{
            background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10,
            height: 208, overflowY: 'auto', scrollbarWidth: 'thin',
          }}>
            {activityLog.length === 0 ? (
              <div style={{ color: '#1e293b', fontSize: 11, textAlign: 'center', paddingTop: 70 }}>
                {isLoading ? '连接中...' : isConnected ? '等待状态变化...' : '未连接'}
              </div>
            ) : activityLog.map(entry => {
              const agent = AGENTS.find(a => a.id === entry.agentId);
              return (
                <div key={entry.id} style={{
                  padding: '5px 12px',
                  display: 'grid',
                  gridTemplateColumns: '36px 1fr',
                  gap: 6,
                  borderBottom: '1px solid #0d1117',
                }}>
                  <span style={{ color: '#1e293b', fontSize: 9, fontFamily: 'monospace', paddingTop: 2 }}>
                    {new Date(entry.ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div>
                    <span style={{ color: agent?.color ?? '#94a3b8', fontSize: 10, fontWeight: 700 }}>
                      {agent?.name ?? entry.agentId}
                    </span>
                    {' '}
                    <span style={{ color: '#475569', fontSize: 10 }}>{entry.message}</span>
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
        onCommand={handleManualCommand}
        activeCmd={activeCmd}
      />
    </div>
  );
}
