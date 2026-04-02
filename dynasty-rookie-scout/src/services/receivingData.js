// Multi-perspective receiving data for WR prospects
// Sources: PFF career receiving grades and route data
// Overall perspective columns:
//   yprr, routesRun, targets, recYds, recTDs, tgtPerRR, firstDownTDPerRR
//
// Situational perspective columns (lateDown, screen, redZone, press, zone, single):
//   yprr, routesRun, targets, pctCareerRecYds (%), pctCareerRecTDs (%), tgtPerRR, firstDownTDPerRR
//
// Deep ball perspective columns (deepBall):
//   yprr, targets, receptions, pctCareerRecYds (%), pctCareerRecTDs (%), adot, contestedCatchRate (%)
//
// Perspectives: overall, lateDown, deepBall, screen, redZone, press, zone, single

export const perspectiveLabels = {
  overall: 'Overall',
  lateDown: 'Late Down',
  deepBall: 'Deep Ball',
  screen: 'Screen',
  redZone: 'Red-Zone',
  press: 'vs. Press',
  zone: 'vs. Zone',
  single: 'vs. Single',
};

export const receivingPerspectiveData = {
  "Makai Lemon": {
  },
  "Eric McAlister": {
  },
  "Jordyn Tyson": {
  },
  "Elijah Sarratt": {
  },
  "Omar Cooper Jr.": {
  },
  "Eric Rivers": {
  },
  "Griffin Wilde": {
  },
  "Jared Brown": {
  },
  "Carnell Tate": {
  },
  "Chase Roberts": {
  },
  "Kobe Prentice": {
  },
  "Ted Hurst": {
  },
  "Brenen Thompson": {
  },
  "Caullin Lacy": {
  },
  "Jeff Caldwell": {
  },
  "Skyler Bell": {
  },
  "Amare Thomas": {
  },
  "CJ Daniels": {
  },
  "Kevin Coleman Jr.": {
  },
  "Squirrel White": {
  },
  "Hank Beatty": {
  },
  "Chris Brazzell II": {
  },
  "Emmanuel Henderson Jr.": {
  },
  "Cyrus Allen": {
  },
  "Aaron Anderson": {
  },
  "KC Concepcion": {
  },
  "Zachariah Branch": {
  },
  "Denzel Boston": {
  },
  "Malachi Fields": {
  },
  "Chris Bell": {
  },
  "Antonio Williams": {
  },
  "De'Zhaun Stribling": {
  },
  "Ja'Kobi Lane": {
  },
  "Jordan Hudson": {
  },
  "Devin Voisin": {
  },
  "Lewis Bond": {
  },
  "RaRa Thomas": {
  },
  "Barion Brown": {
  },
  "Christian Leary": {
  },
  "Germie Bernard": {
  },
};

// Helper to look up perspective data by player name (case-insensitive)
export const getReceivingData = (playerName) => {
  const entry = Object.entries(receivingPerspectiveData).find(
    ([name]) => name.toLowerCase() === playerName.toLowerCase()
  );
  return entry ? entry[1] : null;
};
