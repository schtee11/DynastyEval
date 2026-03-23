// Multi-perspective receiving data for WR prospects
// Sources: PFF career receiving grades and route data
// Each perspective has identical columns:
//   yprr: Yards per Route Run
//   routesRun: Total routes run
//   targets: Total targets
//   recYds: Receiving yards
//   recTDs: Receiving touchdowns
//   tgtPerRR: Targets per Route Run (%)
//   firstDownTDPerRR: 1st Down + TD per Route Run
//   recGrade: PFF Receiving Grade
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
    overall: { yprr: 3.02, routesRun: 664, targets: 184, recYds: 2008, recTDs: 14, tgtPerRR: 27.7, firstDownTDPerRR: 0.15, recGrade: 92.0 },
  },
  "Eric McAlister": {
    overall: { yprr: 2.86, routesRun: 1072, targets: 291, recYds: 3067, recTDs: 24, tgtPerRR: 27.2, firstDownTDPerRR: 0.14, recGrade: 90.1 },
  },
  "Jordyn Tyson": {
    overall: { yprr: 2.71, routesRun: 841, targets: 262, recYds: 2275, recTDs: 22, tgtPerRR: 31.2, firstDownTDPerRR: 0.15, recGrade: 89.3 },
  },
  "Elijah Sarratt": {
    overall: { yprr: 2.70, routesRun: 1102, targets: 270, recYds: 2980, recTDs: 31, tgtPerRR: 24.5, firstDownTDPerRR: 0.16, recGrade: 92.4 },
  },
  "Omar Cooper Jr.": {
    overall: { yprr: 2.47, routesRun: 728, targets: 171, recYds: 1798, recTDs: 22, tgtPerRR: 23.5, firstDownTDPerRR: 0.14, recGrade: 87.6 },
  },
  "Eric Rivers": {
    overall: { yprr: 2.40, routesRun: 900, targets: 208, recYds: 2158, recTDs: 16, tgtPerRR: 23.1, firstDownTDPerRR: 0.12, recGrade: 81.2 },
  },
  "Griffin Wilde": {
    overall: { yprr: 2.40, routesRun: 366, targets: 107, recYds: 880, recTDs: 8, tgtPerRR: 29.2, firstDownTDPerRR: 0.15, recGrade: 80.2 },
  },
  "Jared Brown": {
    overall: { yprr: 2.35, routesRun: 800, targets: 195, recYds: 1877, recTDs: 11, tgtPerRR: 24.4, firstDownTDPerRR: 0.10, recGrade: 75.2 },
  },
  "Carnell Tate": {
    overall: { yprr: 2.27, routesRun: 826, targets: 161, recYds: 1872, recTDs: 14, tgtPerRR: 19.5, firstDownTDPerRR: 0.12, recGrade: 82.2 },
  },
  "Chase Roberts": {
    overall: { yprr: 2.26, routesRun: 1138, targets: 273, recYds: 2571, recTDs: 18, tgtPerRR: 24.0, firstDownTDPerRR: 0.13, recGrade: 84.3 },
  },
  "Kobe Prentice": {
    overall: { yprr: 2.26, routesRun: 514, targets: 119, recYds: 1160, recTDs: 11, tgtPerRR: 23.2, firstDownTDPerRR: 0.11, recGrade: 78.5 },
  },
  "Ted Hurst": {
    overall: { yprr: 2.25, routesRun: 873, targets: 224, recYds: 1960, recTDs: 15, tgtPerRR: 25.7, firstDownTDPerRR: 0.12, recGrade: 82.3 },
  },
  "Brenen Thompson": {
    overall: { yprr: 2.21, routesRun: 706, targets: 140, recYds: 1557, recTDs: 10, tgtPerRR: 19.8, firstDownTDPerRR: 0.09, recGrade: 74.7 },
  },
  "Caullin Lacy": {
    overall: { yprr: 2.17, routesRun: 1356, targets: 317, recYds: 2949, recTDs: 16, tgtPerRR: 23.4, firstDownTDPerRR: 0.10, recGrade: 82.6 },
  },
  "Jeff Caldwell": {
    overall: { yprr: 2.16, routesRun: 221, targets: 58, recYds: 478, recTDs: 6, tgtPerRR: 26.2, firstDownTDPerRR: 0.14, recGrade: 71.5 },
  },
  "Skyler Bell": {
    overall: { yprr: 2.15, routesRun: 1336, targets: 346, recYds: 2879, recTDs: 24, tgtPerRR: 25.9, firstDownTDPerRR: 0.10, recGrade: 75.3 },
  },
  "Amare Thomas": {
    overall: { yprr: 2.15, routesRun: 969, targets: 261, recYds: 2088, recTDs: 23, tgtPerRR: 26.9, firstDownTDPerRR: 0.13, recGrade: 81.1 },
  },
  "CJ Daniels": {
    overall: { yprr: 2.14, routesRun: 1000, targets: 210, recYds: 2139, recTDs: 18, tgtPerRR: 21.0, firstDownTDPerRR: 0.11, recGrade: 81.3 },
  },
  "Kevin Coleman Jr.": {
    overall: { yprr: 2.14, routesRun: 951, targets: 223, recYds: 2039, recTDs: 9, tgtPerRR: 23.4, firstDownTDPerRR: 0.11, recGrade: 82.7 },
  },
  "Squirrel White": {
    overall: { yprr: 2.11, routesRun: 809, targets: 206, recYds: 1711, recTDs: 6, tgtPerRR: 25.5, firstDownTDPerRR: 0.09, recGrade: 71.1 },
  },
  "Hank Beatty": {
    overall: { yprr: 2.09, routesRun: 597, targets: 138, recYds: 1245, recTDs: 4, tgtPerRR: 23.1, firstDownTDPerRR: 0.10, recGrade: 77.6 },
  },
  "Chris Brazzell II": {
    overall: { yprr: 2.09, routesRun: 986, targets: 215, recYds: 2061, recTDs: 16, tgtPerRR: 21.8, firstDownTDPerRR: 0.12, recGrade: 78.0 },
  },
  "Emmanuel Henderson Jr.": {
    overall: { yprr: 2.08, routesRun: 414, targets: 79, recYds: 862, recTDs: 5, tgtPerRR: 19.1, firstDownTDPerRR: 0.09, recGrade: 70.0 },
  },
  "Cyrus Allen": {
    overall: { yprr: 2.07, routesRun: 1072, targets: 227, recYds: 2214, recTDs: 21, tgtPerRR: 21.2, firstDownTDPerRR: 0.10, recGrade: 73.6 },
  },
  "Aaron Anderson": {
    overall: { yprr: 2.06, routesRun: 645, targets: 154, recYds: 1331, recTDs: 5, tgtPerRR: 23.9, firstDownTDPerRR: 0.10, recGrade: 72.9 },
  },
  "KC Concepcion": {
    overall: { yprr: 2.03, routesRun: 1096, targets: 294, recYds: 2224, recTDs: 25, tgtPerRR: 26.8, firstDownTDPerRR: 0.12, recGrade: 77.8 },
  },
  "Zachariah Branch": {
    overall: { yprr: 2.03, routesRun: 806, targets: 211, recYds: 1634, recTDs: 9, tgtPerRR: 26.2, firstDownTDPerRR: 0.11, recGrade: 79.4 },
  },
  "Denzel Boston": {
    overall: { yprr: 2.02, routesRun: 881, targets: 204, recYds: 1781, recTDs: 20, tgtPerRR: 23.2, firstDownTDPerRR: 0.14, recGrade: 85.8 },
  },
  "Malachi Fields": {
    overall: { yprr: 2.01, routesRun: 1146, targets: 263, recYds: 2307, recTDs: 16, tgtPerRR: 22.9, firstDownTDPerRR: 0.11, recGrade: 81.5 },
  },
  "Chris Bell": {
    overall: { yprr: 2.01, routesRun: 1078, targets: 223, recYds: 2166, recTDs: 12, tgtPerRR: 20.7, firstDownTDPerRR: 0.10, recGrade: 77.4 },
  },
  "Antonio Williams": {
    overall: { yprr: 1.97, routesRun: 1181, targets: 275, recYds: 2331, recTDs: 21, tgtPerRR: 23.3, firstDownTDPerRR: 0.11, recGrade: 80.4 },
  },
  "De'Zhaun Stribling": {
    overall: { yprr: 1.95, routesRun: 1279, targets: 272, recYds: 2493, recTDs: 18, tgtPerRR: 21.3, firstDownTDPerRR: 0.10, recGrade: 81.1 },
  },
  "Ja'Kobi Lane": {
    overall: { yprr: 1.95, routesRun: 702, targets: 149, recYds: 1368, recTDs: 18, tgtPerRR: 21.2, firstDownTDPerRR: 0.13, recGrade: 81.0 },
  },
  "Jordan Hudson": {
    overall: { yprr: 1.93, routesRun: 934, targets: 221, recYds: 1804, recTDs: 21, tgtPerRR: 23.7, firstDownTDPerRR: 0.11, recGrade: 76.0 },
  },
  "Devin Voisin": {
    overall: { yprr: 1.92, routesRun: 1107, targets: 243, recYds: 2130, recTDs: 10, tgtPerRR: 21.9, firstDownTDPerRR: 0.10, recGrade: 76.4 },
  },
  "Lewis Bond": {
    overall: { yprr: 1.92, routesRun: 1237, targets: 287, recYds: 2380, recTDs: 11, tgtPerRR: 23.2, firstDownTDPerRR: 0.10, recGrade: 79.3 },
  },
  "RaRa Thomas": {
    overall: { yprr: 1.91, routesRun: 852, targets: 176, recYds: 1626, recTDs: 13, tgtPerRR: 20.7, firstDownTDPerRR: 0.10, recGrade: 71.9 },
  },
  "Barion Brown": {
    overall: { yprr: 1.91, routesRun: 1078, targets: 296, recYds: 2063, recTDs: 12, tgtPerRR: 27.5, firstDownTDPerRR: 0.09, recGrade: 70.1 },
  },
  "Christian Leary": {
    overall: { yprr: 1.90, routesRun: 241, targets: 60, recYds: 459, recTDs: 2, tgtPerRR: 24.9, firstDownTDPerRR: 0.10, recGrade: 73.2 },
  },
  "Germie Bernard": {
    overall: { yprr: 1.90, routesRun: 1167, targets: 232, recYds: 2214, recTDs: 13, tgtPerRR: 19.9, firstDownTDPerRR: 0.10, recGrade: 80.2 },
  },
};

// Helper to look up perspective data by player name (case-insensitive)
export const getReceivingData = (playerName) => {
  const entry = Object.entries(receivingPerspectiveData).find(
    ([name]) => name.toLowerCase() === playerName.toLowerCase()
  );
  return entry ? entry[1] : null;
};
