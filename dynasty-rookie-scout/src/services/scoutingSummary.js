// Static scouting summary generator — no external API calls

export const generateScoutingSummary = (player) => {
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
    return `${name} profiles as a ${player.yprr > 2.5 ? 'high-efficiency' : 'developing'} route runner (${player.yprr} YPRR) with ${player.targetShare ? `a ${player.targetShare}% target share and ` : ''}${breakout} breakout age. ${capital} draft capital confirms NFL evaluators believe in the talent. Premium asset in both 1QB and SF rookie drafts — WR is the safest dynasty position.${injuryNote}`;
  }
  if (position === 'TE') {
    return `${name} is a ${breakout} tight end prospect${player.yprr ? ` (${player.yprr} YPRR)` : ''} with ${capital} draft capital. ${player.targetShare ? `${player.targetShare}% target share. ` : ''}TE is a patience position in dynasty — expect a 2-year runway before consistent production. Value is comparable across 1QB and SF formats.${injuryNote}`;
  }
  return `${name} is a prospect with ${capital} draft capital. Evaluate based on landing spot and usage projections.`;
};
