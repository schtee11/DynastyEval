import { computePercentile } from './helpers';

// ── QB Archetypes ─────────────────────────────────────────────────────────────
const classifyQB = (player, peers) => {
  const s = player.stats || {};
  const rushYds = s.rushingYards || 0;
  const rushTDs = s.rushingTDs || 0;
  const compPct = s.completionPct || 0;
  const accuracy = s.accuracy || 0;
  const adot = s.adot || 0;
  const bttRate = s.bttRate || 0;

  const isDualThreat = rushYds >= 400 || rushTDs >= 4;
  const isGunslinger = adot >= 9.5 && bttRate >= 4.5;
  const isAccurate = compPct >= 68 && accuracy >= 76;

  if (isDualThreat && isAccurate) return 'Dual-Threat Playmaker';
  if (isDualThreat && isGunslinger) return 'Athletic Gunslinger';
  if (isDualThreat) return 'Mobile Quarterback';
  if (isGunslinger) return 'Aggressive Passer';
  if (isAccurate) return 'Precision Passer';
  if (compPct >= 64) return 'Pocket Passer';
  return 'Developmental QB';
};

// ── RB Archetypes ─────────────────────────────────────────────────────────────
const classifyRB = (player, peers) => {
  const s = player.stats || {};
  const ypc = s.yardsPerCarry || 0;
  const rushYds = s.rushingYards || 0;
  const recYds = s.receivingYards || 0;
  const receptions = s.receptions || 0;
  const elusive = s.elusiveRating || 0;

  const isExplosive = ypc >= 5.5 || elusive >= 90;
  const isReceiver = receptions >= 30 || recYds >= 300;
  const isWorkhorse = rushYds >= 1000;
  const isPowerful = (player.weight || 0) >= 220;

  if (isExplosive && isReceiver) return 'Explosive Pass-Catcher';
  if (isWorkhorse && isReceiver) return 'Three-Down Workhorse';
  if (isExplosive && isWorkhorse) return 'Explosive Workhorse';
  if (isExplosive) return 'Big-Play Runner';
  if (isReceiver) return 'Versatile Back';
  if (isPowerful && isWorkhorse) return 'Power Back';
  if (isWorkhorse) return 'Volume Runner';
  if (isPowerful) return 'Between-the-Tackles Grinder';
  return 'Change-of-Pace Back';
};

// ── WR Archetypes ─────────────────────────────────────────────────────────────
const classifyWR = (player) => {
  const yprr = player.yprr || player.advancedStats?.yprr || 0;
  const tgtShare = player.targetShare || player.advancedStats?.targetShare || 0;
  const contested = player.contestedCatchRate || 0;
  const yac = player.yardsAfterCatchPerRec || 0;
  const height = parseInt((player.height || '').split('-')[0]) * 12 + parseInt((player.height || '').split('-')[1] || 0);
  const isTall = height >= 74; // 6-2+
  const slotRate = player.slotRate || 0;

  const isRouteRunner = yprr >= 2.3;
  const isTargetHog = tgtShare >= 25;
  const isContested = contested >= 45 || isTall;
  const isYAC = yac >= 5.5;

  if (isRouteRunner && isTargetHog && isTall) return 'Alpha X Receiver';
  if (isRouteRunner && isTargetHog) return 'Alpha Route Runner';
  if (isRouteRunner && isYAC) return 'Explosive Separator';
  if (isContested && isTargetHog) return 'Contested-Catch Alpha';
  if (isYAC && slotRate >= 50) return 'YAC Slot Weapon';
  if (isRouteRunner) return 'Polished Route Runner';
  if (isTargetHog) return 'High-Volume Target';
  if (isTall && isContested) return 'Big-Bodied Playmaker';
  if (isYAC) return 'After-the-Catch Threat';
  return 'Developing Receiver';
};

// ── TE Archetypes ─────────────────────────────────────────────────────────────
const classifyTE = (player, peers) => {
  const s = player.stats || {};
  const yprr = player.yprr || player.advancedStats?.yprr || 0;
  const tgtShare = player.targetShare || player.advancedStats?.targetShare || 0;
  const recYds = s.receivingYards || 0;
  const tds = s.receivingTDs || 0;

  const isReceivingTE = yprr >= 1.8 || recYds >= 600;
  const isRedZone = tds >= 6;
  const isHighVolume = tgtShare >= 18;

  if (isReceivingTE && isRedZone) return 'Matchup Nightmare';
  if (isReceivingTE && isHighVolume) return 'Seam-Stretching Weapon';
  if (isReceivingTE) return 'Receiving Tight End';
  if (isRedZone) return 'Red Zone Target';
  return 'Developing Tight End';
};

export const getArchetype = (player, peers = []) => {
  switch (player.position) {
    case 'QB': return classifyQB(player, peers);
    case 'RB': return classifyRB(player, peers);
    case 'WR': return classifyWR(player);
    case 'TE': return classifyTE(player, peers);
    default: return 'Prospect';
  }
};

// ── Strength Tags ─────────────────────────────────────────────────────────────
// Returns 2-4 short tags like "Elite YPRR", "Day 1 Capital", "Young Breakout"

export const getStrengthTags = (player, allPlayers = []) => {
  const tags = [];
  const peers = allPlayers.filter(p => p.position === player.position);
  const s = player.stats || {};
  const peerVals = (accessor) => peers.map(accessor).filter(v => v != null && !isNaN(v) && v > 0);

  // Draft capital
  const pick = player.draftPick;
  if (pick && pick <= 10) tags.push({ label: 'Elite Capital', tier: 'elite' });
  else if (pick && pick <= 32) tags.push({ label: 'Day 1 Capital', tier: 'good' });

  // Breakout age
  const ba = player.breakoutAge;
  if (ba && ba <= 19) tags.push({ label: 'Elite Breakout', tier: 'elite' });
  else if (ba && ba <= 20) tags.push({ label: 'Young Breakout', tier: 'good' });

  // Position-specific stat strengths
  if (player.position === 'QB') {
    const compPct = computePercentile(s.completionPct, peerVals(p => p.stats?.completionPct));
    const passTD = computePercentile(s.passingTDs, peerVals(p => p.stats?.passingTDs));
    const rushYds = computePercentile(s.rushingYards, peerVals(p => p.stats?.rushingYards));
    const btt = computePercentile(s.bttRate, peerVals(p => p.stats?.bttRate));

    if (compPct >= 80) tags.push({ label: 'Elite Accuracy', tier: 'elite' });
    if (passTD >= 80) tags.push({ label: 'TD Machine', tier: 'elite' });
    if (rushYds >= 75) tags.push({ label: 'Rushing Upside', tier: 'good' });
    if (btt >= 80) tags.push({ label: 'Playmaker Arm', tier: 'elite' });
  }

  if (player.position === 'RB') {
    const ypc = computePercentile(s.yardsPerCarry, peerVals(p => p.stats?.yardsPerCarry));
    const rushYds = computePercentile(s.rushingYards, peerVals(p => p.stats?.rushingYards));
    const recYds = computePercentile(s.receivingYards, peerVals(p => p.stats?.receivingYards));
    const elusive = computePercentile(s.elusiveRating, peerVals(p => p.stats?.elusiveRating));

    if (ypc >= 80) tags.push({ label: 'Elite Efficiency', tier: 'elite' });
    if (rushYds >= 80) tags.push({ label: 'Volume Producer', tier: 'good' });
    if (recYds >= 75) tags.push({ label: 'Pass-Game Weapon', tier: 'good' });
    if (elusive >= 80) tags.push({ label: 'Elusive Runner', tier: 'elite' });
  }

  if (player.position === 'WR') {
    const yprr = player.yprr || player.advancedStats?.yprr;
    const yprrPct = computePercentile(yprr, peerVals(p => p.yprr || p.advancedStats?.yprr));
    const tgtShare = player.targetShare || player.advancedStats?.targetShare;
    const tgtPct = computePercentile(tgtShare, peerVals(p => p.targetShare || p.advancedStats?.targetShare));
    const contested = computePercentile(player.contestedCatchRate, peerVals(p => p.contestedCatchRate));

    if (yprrPct >= 80) tags.push({ label: 'Elite YPRR', tier: 'elite' });
    if (tgtPct >= 75) tags.push({ label: 'Target Hog', tier: 'good' });
    if (contested >= 80) tags.push({ label: 'Contested King', tier: 'elite' });
  }

  if (player.position === 'TE') {
    const yprr = player.yprr || player.advancedStats?.yprr;
    const yprrPct = computePercentile(yprr, peerVals(p => p.yprr || p.advancedStats?.yprr));
    const tgtPct = computePercentile(
      player.targetShare || player.advancedStats?.targetShare,
      peerVals(p => p.targetShare || p.advancedStats?.targetShare)
    );
    if (yprrPct >= 75) tags.push({ label: 'Elite Route Runner', tier: 'elite' });
    if (tgtPct >= 75) tags.push({ label: 'High Target Share', tier: 'good' });
  }

  // Age advantage
  if (player.age && player.age <= 20) tags.push({ label: 'Age Advantage', tier: 'good' });

  return tags.slice(0, 4);
};
