'use client';

import { useEffect, useRef, useState } from 'react';
import { AGENTS, WORK_MSGS, LOUNGE_MSGS } from './agents';
import type { AgentCommand } from '@/components/OfficeRoom/OfficeRoom';

const ACTIVE_THRESHOLD_MS = 10 * 60 * 1000;   // 10 分钟内 → 工作中
const IDLE_THRESHOLD_MS   = 60 * 60 * 1000;   // 60 分钟内 → 摸鱼中
const POLL_INTERVAL_MS    = 30 * 1000;         // 每 30 秒轮询

export type RawAgentStatus = Record<string, { updatedAtMs: number; file?: string; initOnly?: boolean }>;

export interface OpenclawStatusResult {
  commands: AgentCommand[];
  rawStatus: RawAgentStatus | null;
  isConnected: boolean;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const DEEPFOCUS_THRESHOLD_MS = 2 * 60 * 1000;   // 2 分钟内 → 深度专注

function statusToCommand(agentId: string, updatedAtMs: number): AgentCommand {
  const age = Date.now() - updatedAtMs;

  if (age < DEEPFOCUS_THRESHOLD_MS) {
    return { agentId, action: 'deepfocus', message: pick(WORK_MSGS[agentId] ?? ['深度专注中...']) };
  }
  if (age < ACTIVE_THRESHOLD_MS) {
    return { agentId, action: 'work', message: pick(WORK_MSGS[agentId] ?? ['工作中...']) };
  }
  if (age < IDLE_THRESHOLD_MS) {
    return { agentId, action: 'lounge', message: pick(LOUNGE_MSGS[agentId] ?? ['休息中...']) };
  }
  return { agentId, action: 'coffee', message: '☕ 喝杯咖啡' };
}

async function fetchStatus(): Promise<RawAgentStatus | null> {
  try {
    const res = await fetch('/api/agents', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return data as RawAgentStatus;
  } catch {
    return null;
  }
}

/** 轮询真实 openclaw 状态，始终启用 */
export function useOpenclawStatus(): OpenclawStatusResult {
  const [result, setResult] = useState<OpenclawStatusResult>({
    commands: [],
    rawStatus: null,
    isConnected: false,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const tick = async () => {
      const status = await fetchStatus();

      if (!status) {
        setResult(prev => ({ ...prev, isConnected: false, rawStatus: null }));
        return;
      }

      const cmds: AgentCommand[] = AGENTS
        .filter(a => status[a.id]?.updatedAtMs && !status[a.id].initOnly)
        .map(a => statusToCommand(a.id, status[a.id].updatedAtMs));

      // initOnly agent → 发送 offline 命令让他们坐在位置上不动
      AGENTS.filter(a => status[a.id]?.initOnly).forEach(a => {
        cmds.push({ agentId: a.id, action: 'idle', message: '未启动' });
      });

      // 让活跃的 Agent 之间产生一次沟通动画
      const active = AGENTS.filter(a => {
        const s = status[a.id];
        return s && !s.initOnly && Date.now() - s.updatedAtMs < ACTIVE_THRESHOLD_MS;
      });
      if (active.length >= 2) {
        const talker = pick(active);
        const target = pick(active.filter(a => a.id !== talker.id));
        cmds.push({ agentId: talker.id, action: 'talk', message: '快速同步', targetAgentId: target.id });
      }

      setResult({ commands: cmds, rawStatus: status, isConnected: true });
    };

    tick();
    timerRef.current = setInterval(tick, POLL_INTERVAL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return result;
}
