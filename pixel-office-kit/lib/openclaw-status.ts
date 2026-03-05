'use client';

import { useEffect, useRef, useState } from 'react';
import { AGENTS, WORK_MSGS, CELEBRATE_MSGS, LOUNGE_MSGS } from './agents';
import type { AgentCommand } from '@/components/OfficeRoom/OfficeRoom';

// How many ms since last activity to consider an agent "working"
const ACTIVE_THRESHOLD_MS = 10 * 60 * 1000;   // 10 min
const IDLE_THRESHOLD_MS   = 60 * 60 * 1000;   // 60 min
const POLL_INTERVAL_MS    = 60 * 1000;         // poll every 60s

interface AgentStatus {
  updatedAtMs: number;  // Unix ms
}
type StatusResponse = Record<string, AgentStatus>;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function statusToCommand(agentId: string, updatedAtMs: number): AgentCommand {
  const age = Date.now() - updatedAtMs;

  if (age < ACTIVE_THRESHOLD_MS) {
    // Recently active → working
    const msgs = WORK_MSGS[agentId] ?? ['Working...'];
    return { agentId, action: 'work', message: pick(msgs) };
  }

  if (age < IDLE_THRESHOLD_MS) {
    // Idle → lounge
    const msgs = LOUNGE_MSGS[agentId] ?? ['休息中...'];
    return { agentId, action: 'lounge', message: pick(msgs) };
  }

  // Very idle → coffee or lounge
  const action = Math.random() < 0.3 ? 'coffee' : 'lounge';
  if (action === 'coffee') {
    return { agentId, action: 'coffee', message: '☕ 喝杯咖啡' };
  }
  const msgs = LOUNGE_MSGS[agentId] ?? ['休息中...'];
  return { agentId, action: 'lounge', message: pick(msgs) };
}

async function fetchStatus(): Promise<StatusResponse | null> {
  try {
    const res = await fetch('/api/agents', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return data as StatusResponse;
  } catch {
    return null;
  }
}

/**
 * Polls the real openclaw status API and returns commands for all agents.
 * Returns null when openclaw data is unavailable (caller should fall back to mock).
 */
export function useOpenclawStatus(enabled: boolean): AgentCommand[] | null {
  const [commands, setCommands] = useState<AgentCommand[] | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCommands(null);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const tick = async () => {
      const status = await fetchStatus();
      if (!status) {
        setCommands(null);
        return;
      }

      // Emit one command per known agent based on their last activity
      const cmds: AgentCommand[] = AGENTS
        .filter(a => status[a.id]?.updatedAtMs)
        .map(a => statusToCommand(a.id, status[a.id].updatedAtMs));

      // Also add a random talk event between two recently-active agents
      const active = AGENTS.filter(a => {
        const s = status[a.id];
        return s && Date.now() - s.updatedAtMs < ACTIVE_THRESHOLD_MS;
      });
      if (active.length >= 2) {
        const talker = pick(active);
        const target = pick(active.filter(a => a.id !== talker.id));
        cmds.push({ agentId: talker.id, action: 'talk', message: 'Sync', targetAgentId: target.id });
      }

      setCommands(cmds.length > 0 ? cmds : null);
    };

    tick();
    timerRef.current = setInterval(tick, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled]);

  return commands;
}
