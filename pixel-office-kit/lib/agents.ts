export interface AgentDef {
  id: string;
  name: string;
  avatar: string;
  color: string;
  workStyle: string;
}

export const AGENTS: AgentDef[] = [
  { id: 'aria',  name: 'Aria',  avatar: '/avatars/aria.svg',  color: '#a855f7', workStyle: 'commanding'  },
  { id: 'neon',  name: 'Neon',  avatar: '/avatars/neon.svg',  color: '#06b6d4', workStyle: 'artistic'    },
  { id: 'rex',   name: 'Rex',   avatar: '/avatars/rex.svg',   color: '#f97316', workStyle: 'impulsive'   },
  { id: 'lyra',  name: 'Lyra',  avatar: '/avatars/lyra.svg',  color: '#22c55e', workStyle: 'methodical'  },
  { id: 'emma',  name: 'Emma',  avatar: '/avatars/emma.svg',  color: '#3b82f6', workStyle: 'rapid-fire'  },
  { id: 'zeph',  name: 'Zeph',  avatar: '/avatars/zeph.svg',  color: '#eab308', workStyle: 'watchful'    },
];

export const WORK_MSGS: Record<string, string[]> = {
  aria:  ['Writing specs...', 'Prioritizing backlog', 'Defining acceptance criteria', 'Reviewing PRD'],
  neon:  ['Building UI...', 'Fixing styles', 'Component review', 'Integrating API'],
  rex:   ['Deploying infra...', 'Checking k8s pods', 'CI pipeline running', 'Monitoring alerts'],
  lyra:  ['Running test suite...', 'Found an edge case', 'Writing test plan', 'Verifying fix'],
  emma:  ['Pushing to Vercel...', 'GitHub Actions running', 'Deploy checklist', 'Preview URL ready'],
  zeph:  ['Designing schema...', 'Architecture review', 'Tech stack decision', 'API boundary'],
};

export const PERSONALITY_BANTER: Record<string, string[]> = {
  aria:  ['Scope creep detected', 'Need acceptance criteria', 'Backlog grooming', 'User story ready'],
  neon:  ['This animation is smooth', 'CSS is fine art', 'Mobile looks good', 'Bundle size check'],
  rex:   ['Infra is stable', 'No incidents today', 'Automated that toil', 'GitOps all the way'],
  lyra:  ['Found a regression', 'Edge case scenario', 'Test coverage up', 'Quality gate passed'],
  emma:  ['Deployment successful', 'Preview URL live', 'Zero downtime deploy', 'CI passed ✓'],
  zeph:  ['Architecture decision', 'Next.js 15 migration', 'Server component boundary', 'Data model solid'],
};

export const COFFEE_MSGS: string[] = ['☕ Ahh...', 'Coffee time!', 'Need caffeine', 'Refueling...'];

export const CELEBRATE_MSGS: Record<string, string[]> = {
  aria:  ['Shipped on time!', 'Sprint complete!', 'Goal achieved!'],
  neon:  ['Looks perfect!', 'UI approved!', 'Clean component!'],
  rex:   ['Zero downtime!', 'Infra stable!', 'Deployed!'],
  lyra:  ['All tests pass!', 'No regressions!', 'Quality A+!'],
  emma:  ['Live in prod!', 'Deploy done!', 'URL is up!'],
  zeph:  ['Architecture approved!', 'Schema solid!', 'Design done!'],
};

export const LOUNGE_MSGS: Record<string, string[]> = {
  aria:  ['Reviewing roadmap...', 'Thinking strategy', 'Quiet planning...'],
  neon:  ['Browsing Dribbble', 'Getting inspired', 'Design exploration'],
  rex:   ['Reading dashboards', 'Passive monitoring', 'Watching metrics'],
  lyra:  ['Contemplating edge cases', 'In review mode', 'Methodical rest'],
  emma:  ['Watching deploy logs', 'CI status check', 'Pipeline idle'],
  zeph:  ['System thinking...', 'Architecture sketch', 'Deep design mode'],
};
