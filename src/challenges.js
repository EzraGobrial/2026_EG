// ═══════════════════════════════════════════════
// Gary's Life — Daily Challenge System
// 3 random challenges generated each day
// ═══════════════════════════════════════════════

function makeCheck(type, target) {
  switch (type) {
    case 'kill_count':   return (s) => s.totalKills >= target;
    case 'combo_streak': return (s) => s.maxCombo >= target;
    case 'speed_kill':   return (s) => s.earlyKills >= target;
    case 'no_miss':      return (s) => s.totalKills > 0 && s.missCount === 0;
    case 'boss_kill':    return (s) => s.bossKills >= target;
    case 'money_earned': return (s) => s.moneyEarned >= target;
    default:             return () => false;
  }
}

const CHALLENGE_GENERATORS = [
  {
    type: 'kill_count',
    gen: (rng) => {
      const x = 5 + Math.floor(rng() * 11);
      return { desc: `Kill ${x} birds`, target: x, reward: x * 10 };
    }
  },
  {
    type: 'combo_streak',
    gen: (rng) => {
      const x = 3 + Math.floor(rng() * 3);
      return { desc: `Get a ${x}-hit combo`, target: x, reward: 50 + (x - 3) * 50 };
    }
  },
  {
    type: 'speed_kill',
    gen: (rng) => {
      const x = 2 + Math.floor(rng() * 3);
      return { desc: `Kill ${x} birds in first 20s`, target: x, reward: 75 + (x - 2) * 40 };
    }
  },
  {
    type: 'no_miss',
    gen: () => ({ desc: 'Complete a hunt without missing', target: 0, reward: 200 })
  },
  {
    type: 'boss_kill',
    gen: () => ({ desc: 'Kill a boss bird', target: 1, reward: 150 })
  },
  {
    type: 'money_earned',
    gen: (rng) => {
      const x = 50 + Math.floor(rng() * 5) * 25;
      return { desc: `Earn $${x}+ in one hunt`, target: x, reward: Math.floor(x * 0.5) };
    }
  }
];

// Seeded PRNG for consistent daily generation
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function generateDailyChallenges(day, dimension) {
  const rng = seededRandom(day * 7919 + dimension * 31);
  const available = [...CHALLENGE_GENERATORS];
  const challenges = [];

  for (let i = 0; i < 3 && available.length > 0; i++) {
    const idx = Math.floor(rng() * available.length);
    const template = available.splice(idx, 1)[0];
    const c = template.gen(rng);
    challenges.push({
      type: template.type,
      desc: c.desc,
      target: c.target,
      reward: c.reward,
      completed: false,
      claimed: false,
      check: makeCheck(template.type, c.target)
    });
  }
  return challenges;
}

export function checkChallenges(challenges, huntStats) {
  let totalReward = 0;
  for (const c of challenges) {
    if (!c.completed && c.check && c.check(huntStats)) {
      c.completed = true;
      totalReward += c.reward;
    }
  }
  return totalReward;
}

export function serializeChallenges(challenges) {
  return challenges.map(c => ({
    type: c.type, desc: c.desc, target: c.target,
    reward: c.reward, completed: c.completed, claimed: c.claimed
  }));
}

export function deserializeChallenges(saved) {
  if (!saved || !saved.length) return [];
  return saved.map(s => ({
    ...s,
    check: makeCheck(s.type, s.target)
  }));
}
