export interface AgentDef {
  id: string;
  name: string;
  avatar: string;
  color: string;
  workStyle: string;
  role: string;
}

export const AGENTS: AgentDef[] = [
  { id: 'main',  name: '智多星', avatar: '/avatars/main.svg',  color: '#f8fafc', workStyle: 'orchestrating', role: '主 Agent'   },
  { id: 'aria',  name: 'Aria',  avatar: '/avatars/aria.svg',  color: '#a855f7', workStyle: 'commanding', role: '产品经理'   },
  { id: 'neon',  name: 'Neon',  avatar: '/avatars/neon.svg',  color: '#06b6d4', workStyle: 'artistic',   role: '前端工程师'  },
  { id: 'rex',   name: 'Rex',   avatar: '/avatars/rex.svg',   color: '#f97316', workStyle: 'impulsive',  role: 'DevOps'    },
  { id: 'lyra',  name: 'Lyra',  avatar: '/avatars/lyra.svg',  color: '#22c55e', workStyle: 'methodical', role: 'QA 工程师'  },
  { id: 'emma',  name: 'Emma',  avatar: '/avatars/emma.svg',  color: '#3b82f6', workStyle: 'rapid-fire', role: '部署工程师'  },
  { id: 'zeph',  name: 'Zeph',  avatar: '/avatars/zeph.svg',  color: '#eab308', workStyle: 'watchful',   role: '架构师'     },
  { id: 'nova',  name: 'Nova',  avatar: '/avatars/nova.svg',  color: '#f43f5e', workStyle: 'creative',   role: 'UI/UX 设计师' },
];

export const WORK_MSGS: Record<string, string[]> = {
  main:  ['调度任务中...', '协调各 Agent', '分析用户指令', '整合团队进度'],
  aria:  ['撰写需求文档...', '整理产品 Backlog', '定义验收标准', '审查 PRD 中'],
  neon:  ['搭建 UI 组件...', '调试样式', '组件代码审查', '对接 API 中'],
  rex:   ['部署基础设施...', '检查 k8s 状态', 'CI 流水线运行中', '处理监控告警'],
  lyra:  ['运行测试套件...', '发现边界 case', '编写测试计划', '验证修复结果'],
  emma:  ['推送到 Vercel...', 'GitHub Actions 运行中', '执行部署清单', '预览链接就绪'],
  zeph:  ['设计数据库 Schema...', '进行架构评审', '技术选型讨论', '定义 API 边界'],
  nova:  ['绘制 Wireframe...', '打磨交互细节', '设计组件规范', '产出视觉稿'],
};

export const PERSONALITY_BANTER: Record<string, string[]> = {
  main:  ['任务已分派', '团队进度同步中', '优先级已调整', '汇报给 Evan 中'],
  aria:  ['检测到需求蔓延', '需要补充验收标准', 'Backlog 梳理完毕', '用户故事已就绪'],
  neon:  ['动画好丝滑', 'CSS 是一门艺术', '移动端适配不错', '检查打包体积'],
  rex:   ['基础设施稳定', '今天零故障', '重复操作已自动化', 'GitOps 一把梭'],
  lyra:  ['发现了回归问题', '边界场景分析', '测试覆盖率提升了', '质量门禁通过'],
  emma:  ['部署成功上线', '预览地址已激活', '零停机部署完成', 'CI 全部通过 ✓'],
  zeph:  ['架构决策完成', 'Next.js 15 迁移中', '服务端组件边界明确', '数据模型稳固'],
  nova:  ['设计语言统一', '组件库更新了', '视觉稿通过评审', '动效方案确定'],
};

export const COFFEE_MSGS: string[] = ['☕ 啊...', '喝杯咖啡！', '需要补充咖啡因', '续命中...'];

export const CELEBRATE_MSGS: Record<string, string[]> = {
  main:  ['任务全部完成！', '团队配合完美！', '用户满意！'],
  aria:  ['按时交付！', 'Sprint 完成！', '目标达成！'],
  neon:  ['效果完美！', 'UI 审查通过！', '组件真香！'],
  rex:   ['零停机！', '基础设施稳！', '部署成功！'],
  lyra:  ['全部测试通过！', '零回归问题！', '质量 A+！'],
  emma:  ['已上生产！', '部署完成！', '链接可访问！'],
  zeph:  ['架构通过审批！', 'Schema 稳了！', '设计完成！'],
  nova:  ['设计稿超美！', '交互流畅！', '视觉效果拉满！'],
};

export const LOUNGE_MSGS: Record<string, string[]> = {
  main:  ['等待新任务...', '监听各频道中', '准备下一轮调度'],
  aria:  ['回顾产品路线图...', '思考战略方向', '静静规划中...'],
  neon:  ['刷 Dribbble 找灵感', '沉浸在设计美学里', '探索新的设计风格'],
  rex:   ['盯着监控面板', '被动观察中', '看指标发呆'],
  lyra:  ['思考边界条件...', '代码审查模式', '有序地休息中'],
  emma:  ['看部署日志', '检查 CI 状态', '流水线空闲中'],
  zeph:  ['系统性思考...', '草画架构图', '深度设计模式'],
  nova:  ['刷设计案例找灵感', '沉浸在色彩里', '漫无目的地美化'],
};
