// Anthropic API service for AI scouting summaries
// Uses claude-sonnet-4-20250514 model
// API key must be provided via REACT_APP_ANTHROPIC_API_KEY env var

import { getDraftRangeLabel } from '../utils/helpers';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const buildScoutingPrompt = (player) => {
  const positionStats = getPositionStats(player);

  return `You are an expert dynasty fantasy football scout. Analyze this NFL rookie prospect and provide a scouting summary.

Player: ${player.name}
Position: ${player.position}
College: ${player.college || 'Unknown'}
Draft Projection: ${player.draftRound ? `Projected ${getDraftRangeLabel(player.draftRound, player.draftPick) || 'TBD'}` : 'Pre-draft prospect'}
Age: ${player.age || 'Unknown'}

${positionStats}

Breakout Age: ${player.breakoutAge || 'N/A'}
Dominator Rating: ${player.dominatorRating}%
${player.targetShare ? `Target Share: ${player.targetShare}%` : ''}
${player.yprr ? `YPRR: ${player.yprr}` : ''}
${player.yacPerRR ? `YAC/RR: ${player.yacPerRR}` : ''}

Injuries: ${player.injuries.length > 0 ? player.injuries.map(i => `${i.type} (${i.date}, ${i.severity}, ${i.gamesOut} games missed)`).join('; ') : 'None'}

Dynasty ADP: 1QB #${player.dynastyADP.oneQB}, Superflex #${player.dynastyADP.superflex}

Provide a 3-4 sentence scouting summary that covers:
1. Key strengths and concerns based on the stat profile
2. Fantasy outlook for 1QB leagues
3. Fantasy outlook for Superflex leagues
4. Any injury risk or age-related concerns

Be specific with stat references. Be direct and opinionated — scouts don't hedge.`;
};

const getPositionStats = (player) => {
  const s = player.stats;
  switch (player.position) {
    case 'QB':
      return `EPA: ${s.epa}
CPOE: ${s.cpoe}
Passing: ${s.passingYards} yards, ${s.passingTDs} TDs, ${s.interceptions} INTs
Completion %: ${s.completionPct}%
Rushing: ${s.rushingYards} yards, ${s.rushingTDs} TDs`;
    case 'RB':
      return `EPA: ${s.epa}
Rushing: ${s.rushingYards} yards, ${s.rushingTDs} TDs
YPC: ${s.yardsPerCarry}
Receiving: ${s.receptions} rec, ${s.receivingYards} yards, ${s.receivingTDs} TDs`;
    case 'WR':
    case 'TE':
      return `EPA: ${s.epa}
Receiving: ${s.receptions} rec, ${s.receivingYards} yards, ${s.receivingTDs} TDs
Targets: ${s.targets}`;
    default:
      return `EPA: ${s.epa}`;
  }
};

export const generateScoutingSummary = async (player) => {
  const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;

  if (!apiKey) {
    return getFallbackSummary(player);
  }

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: buildScoutingPrompt(player)
        }]
      })
    });

    if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);

    const data = await res.json();
    return data.content[0].text;
  } catch (err) {
    console.error('Anthropic API call failed:', err);
    return getFallbackSummary(player);
  }
};

const getFallbackSummary = (player) => {
  const { position, name, draftPick, breakoutAge, stats } = player;
  const capital = draftPick <= 10 ? 'elite' : draftPick <= 32 ? 'strong Day 1' : draftPick <= 64 ? 'Day 2' : 'Day 3';
  const breakout = breakoutAge ? (breakoutAge <= 20 ? 'elite early' : breakoutAge <= 21 ? 'solid' : 'late') : 'unknown';
  const injuryNote = player.injuries.length > 0
    ? ` Injury history (${player.injuries.map(i => i.type).join(', ')}) adds risk.`
    : '';

  if (position === 'QB') {
    return `${name} brings ${capital} draft capital with a ${stats.cpoe > 3 ? 'plus' : 'average'} CPOE of ${stats.cpoe} and ${stats.rushingYards > 400 ? 'significant rushing upside' : 'a pocket-first approach'}. ${breakout} breakout profile. In Superflex leagues, the premium draft capital makes him a must-target in the first round of rookie drafts. In 1QB formats, the value drops unless you're building around a long-term QB1.${injuryNote}`;
  }
  if (position === 'RB') {
    return `${name} posted ${stats.rushingYards} rushing yards at ${stats.yardsPerCarry} YPC with ${capital} draft capital — a ${breakout} breakout producer. ${stats.receptions > 25 ? 'Receiving work adds PPR upside.' : 'Limited receiving profile caps PPR ceiling.'} Valued similarly in 1QB and SF formats, though the positional shelf life demands a quicker return on investment.${injuryNote}`;
  }
  if (position === 'WR') {
    return `${name} profiles as a ${player.yprr > 2.5 ? 'high-efficiency' : 'developing'} route runner (${player.yprr} YPRR) with a ${player.dominatorRating > 30 ? 'dominant' : 'modest'} ${player.dominatorRating}% dominator rating and ${breakout} breakout age. ${capital} draft capital confirms NFL evaluators believe in the talent. Premium asset in both 1QB and SF rookie drafts — WR is the safest dynasty position.${injuryNote}`;
  }
  if (position === 'TE') {
    return `${name} is a ${player.yprr > 2.0 ? 'productive' : 'developmental'} tight end prospect (${player.yprr} YPRR) with ${capital} draft capital. ${breakout} breakout age and ${player.dominatorRating}% dominator rating. TE is a patience position in dynasty — expect a 2-year runway before consistent production. Value is comparable across 1QB and SF formats.${injuryNote}`;
  }
  return `${name} is a prospect with ${capital} draft capital. Evaluate based on landing spot and usage projections.`;
};

export default generateScoutingSummary;
