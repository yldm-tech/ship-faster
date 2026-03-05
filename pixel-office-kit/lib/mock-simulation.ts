'use client';

import { useEffect, useRef, useState } from 'react';
import { AGENTS } from './agents';
import type { OfficeAgentState } from '@/components/OfficeRoom/engine/types';
import type { AgentCommand } from '@/components/OfficeRoom/OfficeRoom';

const ACTIONS: { action: OfficeAgentState; message: string }[] = [
  { action: 'work', message: '专注工作中...' },
  { action: 'coffee', message: '喝杯咖啡！' },
  { action: 'lounge', message: '摸会儿鱼' },
  { action: 'celebrate', message: '里程碑达成！' },
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useDemoSimulation(enabled: boolean): AgentCommand[] {
  const [commands, setCommands] = useState<AgentCommand[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCommands([]);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const tick = () => {
      const agent = pick(AGENTS);
      const roll = Math.random();

      if (roll < 0.2) {
        const others = AGENTS.filter(a => a.id !== agent.id);
        const target = pick(others);
        setCommands([{
          agentId: agent.id,
          action: 'talk',
          message: '快速同步一下',
          targetAgentId: target.id,
        }]);
      } else {
        const action = pick(ACTIONS);
        setCommands([{
          agentId: agent.id,
          action: action.action,
          message: action.message,
        }]);
      }
    };

    timerRef.current = setInterval(tick, 8000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled]);

  return commands;
}
