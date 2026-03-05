'use client';

import { useEffect, useRef, useState } from 'react';
import { AGENTS, WORK_MSGS, LOUNGE_MSGS } from './agents';
import type { AgentCommand } from '@/components/OfficeRoom/OfficeRoom';

export const ACTIVE_THRESHOLD_MS = 10 * 60 * 1000;   // 10 分钟内 → 工作中
export const IDLE_THRESHOLD_MS   = 60 * 60 * 1000;   // 60 分钟内 → 摸鱼中
const POLL_INTERVAL_MS    = 30 * 1000;                // 每 30 秒轮询

export type RawAgentStatus = Record<string, { updatedAtMs: number; file?: string; initOnly?: boolean }>;

export interface OpenclawStatusResult {
  commands: AgentCommand[];
  rawStatus: RawAgentStatus | null;
  isConnected: boolean;
  isLoading: boolean;
  lastPolledAt: number | null;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const DEEPFOCUS_THRESHOLD_MS = 2 * 60 * 1000;   // 2 分钟内 → 深度专注

/**
 * 根据文件路径推断 bot 正在做什么，返回 { action, msg } 或 null（回退时间推断）。
 *
 * Bot 行为穷举（按文件路径）：
 *   memory/           → think  "整理记忆中"
 *   CLAUDE.md         → think  "读任务简报"
 *   decisions/ 等     → think  "架构决策中"
 *   *.test.ts / tests/→ deepfocus/work  "跑测试中"
 *   *.ts/tsx/py/go…   → deepfocus/work  "写代码中"
 *   *.sh              → deepfocus/work  "跑脚本中"
 *   *.md              → work   "写文档中"
 *   *.json/yaml/toml… → deepfocus/work  "调配置中"
 *   其他              → null（按时间推断：deepfocus/work/lounge/coffee）
 */
export function inferFromFile(file: string | undefined, ageMs: number): { action: string; msg: string } | null {
  if (!file) return null;
  const lower = file.toLowerCase().replace(/\\/g, '/');
  const base = lower.split('/').pop() ?? '';

  if (lower.includes('/memory/'))
    return { action: 'think', msg: '整理记忆中...' };
  if (base === 'claude.md')
    return { action: 'think', msg: '读任务简报...' };
  if (lower.includes('/decisions/') || base === 'decisions.md' || base === 'architecture.md')
    return { action: 'think', msg: '架构决策中...' };
  if (base.includes('.test.') || base.includes('.spec.') || lower.includes('/tests/') || lower.includes('/__tests__/'))
    return { action: ageMs < DEEPFOCUS_THRESHOLD_MS ? 'deepfocus' : 'work', msg: '跑测试中...' };
  if (/\.(ts|tsx|js|jsx|py|go|rs|java|cpp|c)$/.test(base))
    return { action: ageMs < DEEPFOCUS_THRESHOLD_MS ? 'deepfocus' : 'work', msg: '写代码中...' };
  if (/\.(sh|bash|zsh)$/.test(base))
    return { action: ageMs < DEEPFOCUS_THRESHOLD_MS ? 'deepfocus' : 'work', msg: '跑脚本中...' };
  if (/\.(css|scss|sass|less|styl)$/.test(base))
    return { action: ageMs < DEEPFOCUS_THRESHOLD_MS ? 'deepfocus' : 'work', msg: '调样式中...' };
  if (/\.svg$/.test(base))
    return { action: 'work', msg: '绘制图标中...' };
  if (base === 'dockerfile' || base.startsWith('dockerfile.'))
    return { action: ageMs < DEEPFOCUS_THRESHOLD_MS ? 'deepfocus' : 'work', msg: '容器化中...' };
  if (base.startsWith('docker-compose'))
    return { action: 'work', msg: '调容器编排中...' };
  if (/\.(tf|hcl)$/.test(base))
    return { action: ageMs < DEEPFOCUS_THRESHOLD_MS ? 'deepfocus' : 'work', msg: '写基础设施中...' };
  if (/\.sql$/.test(base))
    return { action: ageMs < DEEPFOCUS_THRESHOLD_MS ? 'deepfocus' : 'work', msg: '写 SQL 中...' };
  if (/\.proto$/.test(base))
    return { action: 'work', msg: '设计接口协议中...' };
  if (/\.(md|mdx)$/.test(base))
    return { action: 'work', msg: '写文档中...' };
  if (/\.(json|yaml|yml|toml|env|cfg|conf)$/.test(base))
    return { action: ageMs < DEEPFOCUS_THRESHOLD_MS ? 'deepfocus' : 'work', msg: '调配置中...' };

  return null;
}

function statusToCommand(agentId: string, updatedAtMs: number, file?: string): AgentCommand {
  const age = Date.now() - updatedAtMs;

  // 超过 1 小时 → 喝咖啡，无论文件类型
  if (age >= IDLE_THRESHOLD_MS) return { agentId, action: 'coffee', message: '喝杯咖啡' };

  const fromFile = inferFromFile(file, age);
  if (fromFile) {
    // 文件有活动但超过 10 分钟 → 摸鱼中
    if (age >= ACTIVE_THRESHOLD_MS) {
      return { agentId, action: 'lounge', message: pick(LOUNGE_MSGS[agentId] ?? ['休息中...']) };
    }
    // think 状态保留文件路径描述；work/deepfocus 用 agent 个性化消息
    const msg = fromFile.action === 'think'
      ? fromFile.msg
      : pick(WORK_MSGS[agentId] ?? [fromFile.msg]);
    return { agentId, action: fromFile.action as AgentCommand['action'], message: msg };
  }

  // 纯时间推断（文件无法识别）
  if (age < DEEPFOCUS_THRESHOLD_MS) {
    return { agentId, action: 'deepfocus', message: pick(WORK_MSGS[agentId] ?? ['深度专注中...']) };
  }
  if (age < ACTIVE_THRESHOLD_MS) {
    return { agentId, action: 'work', message: pick(WORK_MSGS[agentId] ?? ['工作中...']) };
  }
  return { agentId, action: 'lounge', message: pick(LOUNGE_MSGS[agentId] ?? ['休息中...']) };
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
    isLoading: true,
    lastPolledAt: null,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const tick = async () => {
      const status = await fetchStatus();

      if (!status) {
        setResult(prev => ({ ...prev, isConnected: false, rawStatus: null, isLoading: false, lastPolledAt: Date.now() }));
        return;
      }

      const cmds: AgentCommand[] = AGENTS
        .filter(a => status[a.id]?.updatedAtMs && !status[a.id].initOnly)
        .map(a => statusToCommand(a.id, status[a.id].updatedAtMs, status[a.id].file));

      // initOnly agent → 发送 idle 命令让他们坐在位置上待命
      AGENTS.filter(a => status[a.id]?.initOnly).forEach(a => {
        cmds.push({ agentId: a.id, action: 'idle', message: '待命中' });
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

      setResult({ commands: cmds, rawStatus: status, isConnected: true, isLoading: false, lastPolledAt: Date.now() });
    };

    tick();
    timerRef.current = setInterval(tick, POLL_INTERVAL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return result;
}
