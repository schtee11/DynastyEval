// Multi-perspective receiving data for WR prospects
// Sources: PFF career receiving grades and route data
// Overall perspective columns:
//   yprr, routesRun, targets, recYds, recTDs, tgtPerRR, firstDownTDPerRR, recGrade
//
// Situational perspective columns (lateDown, deepBall, screen, redZone, press, zone, single):
//   yprr, routesRun, targets, pctCareerRecYds (%), pctCareerRecTDs (%), tgtPerRR, firstDownTDPerRR, recGrade
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
    lateDown: { yprr: 2.11, routesRun: 180, targets: 47, pctCareerRecYds: 18.9, pctCareerRecTDs: 28.6, tgtPerRR: 26.1, firstDownTDPerRR: 0.13, recGrade: 74.6 },
  },
  "Eric McAlister": {
    overall: { yprr: 2.86, routesRun: 1072, targets: 291, recYds: 3067, recTDs: 24, tgtPerRR: 27.2, firstDownTDPerRR: 0.14, recGrade: 90.1 },
    lateDown: { yprr: 2.66, routesRun: 325, targets: 80, pctCareerRecYds: 28.2, pctCareerRecTDs: 41.7, tgtPerRR: 24.6, firstDownTDPerRR: 0.16, recGrade: 79.9 },
  },
  "Jordyn Tyson": {
    overall: { yprr: 2.71, routesRun: 841, targets: 262, recYds: 2275, recTDs: 22, tgtPerRR: 31.2, firstDownTDPerRR: 0.15, recGrade: 89.3 },
    lateDown: { yprr: 2.84, routesRun: 247, targets: 80, pctCareerRecYds: 30.9, pctCareerRecTDs: 40.9, tgtPerRR: 32.4, firstDownTDPerRR: 0.17, recGrade: 84.7 },
  },
  "Elijah Sarratt": {
    overall: { yprr: 2.70, routesRun: 1102, targets: 270, recYds: 2980, recTDs: 31, tgtPerRR: 24.5, firstDownTDPerRR: 0.16, recGrade: 92.4 },
    lateDown: { yprr: 2.55, routesRun: 300, targets: 69, pctCareerRecYds: 25.7, pctCareerRecTDs: 41.9, tgtPerRR: 23.0, firstDownTDPerRR: 0.18, recGrade: 87.9 },
  },
  "Omar Cooper Jr.": {
    overall: { yprr: 2.47, routesRun: 728, targets: 171, recYds: 1798, recTDs: 22, tgtPerRR: 23.5, firstDownTDPerRR: 0.14, recGrade: 87.6 },
    lateDown: { yprr: 1.82, routesRun: 212, targets: 46, pctCareerRecYds: 21.5, pctCareerRecTDs: 13.6, tgtPerRR: 21.7, firstDownTDPerRR: 0.11, recGrade: 70.4 },
  },
  "Eric Rivers": {
    overall: { yprr: 2.40, routesRun: 900, targets: 208, recYds: 2158, recTDs: 16, tgtPerRR: 23.1, firstDownTDPerRR: 0.12, recGrade: 81.2 },
    lateDown: { yprr: 2.01, routesRun: 259, targets: 49, pctCareerRecYds: 24.1, pctCareerRecTDs: 37.5, tgtPerRR: 18.9, firstDownTDPerRR: 0.12, recGrade: 72.6 },
  },
  "Griffin Wilde": {
    overall: { yprr: 2.40, routesRun: 366, targets: 107, recYds: 880, recTDs: 8, tgtPerRR: 29.2, firstDownTDPerRR: 0.15, recGrade: 80.2 },
    lateDown: { yprr: 1.94, routesRun: 120, targets: 34, pctCareerRecYds: 26.5, pctCareerRecTDs: 37.5, tgtPerRR: 28.3, firstDownTDPerRR: 0.18, recGrade: 81.6 },
  },
  "Jared Brown": {
    overall: { yprr: 2.35, routesRun: 800, targets: 195, recYds: 1877, recTDs: 11, tgtPerRR: 24.4, firstDownTDPerRR: 0.10, recGrade: 75.2 },
    lateDown: { yprr: 1.95, routesRun: 233, targets: 53, pctCareerRecYds: 24.2, pctCareerRecTDs: 9.1, tgtPerRR: 22.8, firstDownTDPerRR: 0.10, recGrade: 67.4 },
  },
  "Carnell Tate": {
    overall: { yprr: 2.27, routesRun: 826, targets: 161, recYds: 1872, recTDs: 14, tgtPerRR: 19.5, firstDownTDPerRR: 0.12, recGrade: 82.2 },
  },
  "Chase Roberts": {
    overall: { yprr: 2.26, routesRun: 1138, targets: 273, recYds: 2571, recTDs: 18, tgtPerRR: 24.0, firstDownTDPerRR: 0.13, recGrade: 84.3 },
    lateDown: { yprr: 1.71, routesRun: 320, targets: 80, pctCareerRecYds: 21.3, pctCareerRecTDs: 27.8, tgtPerRR: 25.0, firstDownTDPerRR: 0.13, recGrade: 72.7 },
  },
  "Kobe Prentice": {
    overall: { yprr: 2.26, routesRun: 514, targets: 119, recYds: 1160, recTDs: 11, tgtPerRR: 23.2, firstDownTDPerRR: 0.11, recGrade: 78.5 },
    lateDown: { yprr: 2.58, routesRun: 166, targets: 28, pctCareerRecYds: 37.0, pctCareerRecTDs: 63.6, tgtPerRR: 16.9, firstDownTDPerRR: 0.13, recGrade: 73.4 },
  },
  "Ted Hurst": {
    overall: { yprr: 2.25, routesRun: 873, targets: 224, recYds: 1960, recTDs: 15, tgtPerRR: 25.7, firstDownTDPerRR: 0.12, recGrade: 82.3 },
    lateDown: { yprr: 1.92, routesRun: 281, targets: 77, pctCareerRecYds: 27.6, pctCareerRecTDs: 33.3, tgtPerRR: 27.4, firstDownTDPerRR: 0.14, recGrade: 76.2 },
  },
  "Brenen Thompson": {
    overall: { yprr: 2.21, routesRun: 706, targets: 140, recYds: 1557, recTDs: 10, tgtPerRR: 19.8, firstDownTDPerRR: 0.09, recGrade: 74.7 },
    lateDown: { yprr: 1.88, routesRun: 212, targets: 35, pctCareerRecYds: 25.6, pctCareerRecTDs: 30.0, tgtPerRR: 16.5, firstDownTDPerRR: 0.10, recGrade: 69.9 },
  },
  "Caullin Lacy": {
    overall: { yprr: 2.17, routesRun: 1356, targets: 317, recYds: 2949, recTDs: 16, tgtPerRR: 23.4, firstDownTDPerRR: 0.10, recGrade: 82.6 },
    lateDown: { yprr: 2.38, routesRun: 406, targets: 93, pctCareerRecYds: 32.8, pctCareerRecTDs: 37.5, tgtPerRR: 22.9, firstDownTDPerRR: 0.11, recGrade: 77.8 },
  },
  "Jeff Caldwell": {
    overall: { yprr: 2.16, routesRun: 221, targets: 58, recYds: 478, recTDs: 6, tgtPerRR: 26.2, firstDownTDPerRR: 0.14, recGrade: 71.5 },
  },
  "Skyler Bell": {
    overall: { yprr: 2.15, routesRun: 1336, targets: 346, recYds: 2879, recTDs: 24, tgtPerRR: 25.9, firstDownTDPerRR: 0.10, recGrade: 75.3 },
    lateDown: { yprr: 1.81, routesRun: 430, targets: 101, pctCareerRecYds: 27.0, pctCareerRecTDs: 29.2, tgtPerRR: 23.5, firstDownTDPerRR: 0.10, recGrade: 67.4 },
  },
  "Amare Thomas": {
    overall: { yprr: 2.15, routesRun: 969, targets: 261, recYds: 2088, recTDs: 23, tgtPerRR: 26.9, firstDownTDPerRR: 0.13, recGrade: 81.1 },
    lateDown: { yprr: 2.33, routesRun: 311, targets: 85, pctCareerRecYds: 34.8, pctCareerRecTDs: 39.1, tgtPerRR: 27.3, firstDownTDPerRR: 0.16, recGrade: 81.1 },
  },
  "CJ Daniels": {
    overall: { yprr: 2.14, routesRun: 1000, targets: 210, recYds: 2139, recTDs: 18, tgtPerRR: 21.0, firstDownTDPerRR: 0.11, recGrade: 81.3 },
    lateDown: { yprr: 2.18, routesRun: 296, targets: 58, pctCareerRecYds: 30.2, pctCareerRecTDs: 38.9, tgtPerRR: 19.6, firstDownTDPerRR: 0.14, recGrade: 76.9 },
  },
  "Kevin Coleman Jr.": {
    overall: { yprr: 2.14, routesRun: 951, targets: 223, recYds: 2039, recTDs: 9, tgtPerRR: 23.4, firstDownTDPerRR: 0.11, recGrade: 82.7 },
    lateDown: { yprr: 1.86, routesRun: 291, targets: 69, pctCareerRecYds: 26.6, pctCareerRecTDs: 44.4, tgtPerRR: 23.7, firstDownTDPerRR: 0.13, recGrade: 75.1 },
  },
  "Squirrel White": {
    overall: { yprr: 2.11, routesRun: 809, targets: 206, recYds: 1711, recTDs: 6, tgtPerRR: 25.5, firstDownTDPerRR: 0.09, recGrade: 71.1 },
    lateDown: { yprr: 1.65, routesRun: 211, targets: 49, pctCareerRecYds: 20.4, pctCareerRecTDs: 50.0, tgtPerRR: 23.2, firstDownTDPerRR: 0.09, recGrade: 61.4 },
  },
  "Hank Beatty": {
    overall: { yprr: 2.09, routesRun: 597, targets: 138, recYds: 1245, recTDs: 4, tgtPerRR: 23.1, firstDownTDPerRR: 0.10, recGrade: 77.6 },
  },
  "Chris Brazzell II": {
    overall: { yprr: 2.09, routesRun: 986, targets: 215, recYds: 2061, recTDs: 16, tgtPerRR: 21.8, firstDownTDPerRR: 0.12, recGrade: 78.0 },
    lateDown: { yprr: 1.84, routesRun: 274, targets: 57, pctCareerRecYds: 24.4, pctCareerRecTDs: 31.3, tgtPerRR: 20.8, firstDownTDPerRR: 0.13, recGrade: 72.4 },
  },
  "Emmanuel Henderson Jr.": {
    overall: { yprr: 2.08, routesRun: 414, targets: 79, recYds: 862, recTDs: 5, tgtPerRR: 19.1, firstDownTDPerRR: 0.09, recGrade: 70.0 },
  },
  "Cyrus Allen": {
    overall: { yprr: 2.07, routesRun: 1072, targets: 227, recYds: 2214, recTDs: 21, tgtPerRR: 21.2, firstDownTDPerRR: 0.10, recGrade: 73.6 },
  },
  "Aaron Anderson": {
    overall: { yprr: 2.06, routesRun: 645, targets: 154, recYds: 1331, recTDs: 5, tgtPerRR: 23.9, firstDownTDPerRR: 0.10, recGrade: 72.9 },
    lateDown: { yprr: 1.99, routesRun: 199, targets: 44, pctCareerRecYds: 29.8, pctCareerRecTDs: 60.0, tgtPerRR: 22.1, firstDownTDPerRR: 0.14, recGrade: 72.9 },
  },
  "KC Concepcion": {
    overall: { yprr: 2.03, routesRun: 1096, targets: 294, recYds: 2224, recTDs: 25, tgtPerRR: 26.8, firstDownTDPerRR: 0.12, recGrade: 77.8 },
    lateDown: { yprr: 1.78, routesRun: 319, targets: 71, pctCareerRecYds: 25.5, pctCareerRecTDs: 48.0, tgtPerRR: 22.3, firstDownTDPerRR: 0.14, recGrade: 71.6 },
  },
  "Zachariah Branch": {
    overall: { yprr: 2.03, routesRun: 806, targets: 211, recYds: 1634, recTDs: 9, tgtPerRR: 26.2, firstDownTDPerRR: 0.11, recGrade: 79.4 },
    lateDown: { yprr: 2.41, routesRun: 223, targets: 53, pctCareerRecYds: 32.9, pctCareerRecTDs: 33.3, tgtPerRR: 23.8, firstDownTDPerRR: 0.14, recGrade: 73.6 },
  },
  "Denzel Boston": {
    overall: { yprr: 2.02, routesRun: 881, targets: 204, recYds: 1781, recTDs: 20, tgtPerRR: 23.2, firstDownTDPerRR: 0.14, recGrade: 85.8 },
    lateDown: { yprr: 1.67, routesRun: 235, targets: 59, pctCareerRecYds: 22.0, pctCareerRecTDs: 20.0, tgtPerRR: 25.1, firstDownTDPerRR: 0.13, recGrade: 77.0 },
  },
  "Malachi Fields": {
    overall: { yprr: 2.01, routesRun: 1146, targets: 263, recYds: 2307, recTDs: 16, tgtPerRR: 22.9, firstDownTDPerRR: 0.11, recGrade: 81.5 },
    lateDown: { yprr: 1.91, routesRun: 336, targets: 83, pctCareerRecYds: 27.8, pctCareerRecTDs: 37.5, tgtPerRR: 24.7, firstDownTDPerRR: 0.13, recGrade: 74.4 },
  },
  "Chris Bell": {
    overall: { yprr: 2.01, routesRun: 1078, targets: 223, recYds: 2166, recTDs: 12, tgtPerRR: 20.7, firstDownTDPerRR: 0.10, recGrade: 77.4 },
    lateDown: { yprr: 1.62, routesRun: 300, targets: 56, pctCareerRecYds: 22.4, pctCareerRecTDs: 33.3, tgtPerRR: 18.7, firstDownTDPerRR: 0.10, recGrade: 70.5 },
  },
  "Antonio Williams": {
    overall: { yprr: 1.97, routesRun: 1181, targets: 275, recYds: 2331, recTDs: 21, tgtPerRR: 23.3, firstDownTDPerRR: 0.11, recGrade: 80.4 },
    lateDown: { yprr: 1.97, routesRun: 326, targets: 77, pctCareerRecYds: 27.5, pctCareerRecTDs: 19.0, tgtPerRR: 23.6, firstDownTDPerRR: 0.13, recGrade: 77.5 },
  },
  "De'Zhaun Stribling": {
    overall: { yprr: 1.95, routesRun: 1279, targets: 272, recYds: 2493, recTDs: 18, tgtPerRR: 21.3, firstDownTDPerRR: 0.10, recGrade: 81.1 },
  },
  "Ja'Kobi Lane": {
    overall: { yprr: 1.95, routesRun: 702, targets: 149, recYds: 1368, recTDs: 18, tgtPerRR: 21.2, firstDownTDPerRR: 0.13, recGrade: 81.0 },
    lateDown: { yprr: 2.74, routesRun: 189, targets: 50, pctCareerRecYds: 37.8, pctCareerRecTDs: 33.3, tgtPerRR: 26.5, firstDownTDPerRR: 0.18, recGrade: 83.7 },
  },
  "Jordan Hudson": {
    overall: { yprr: 1.93, routesRun: 934, targets: 221, recYds: 1804, recTDs: 21, tgtPerRR: 23.7, firstDownTDPerRR: 0.11, recGrade: 76.0 },
  },
  "Devin Voisin": {
    overall: { yprr: 1.92, routesRun: 1107, targets: 243, recYds: 2130, recTDs: 10, tgtPerRR: 21.9, firstDownTDPerRR: 0.10, recGrade: 76.4 },
    lateDown: { yprr: 1.78, routesRun: 324, targets: 64, pctCareerRecYds: 27.1, pctCareerRecTDs: 50.0, tgtPerRR: 19.8, firstDownTDPerRR: 0.12, recGrade: 72.3 },
  },
  "Lewis Bond": {
    overall: { yprr: 1.92, routesRun: 1237, targets: 287, recYds: 2380, recTDs: 11, tgtPerRR: 23.2, firstDownTDPerRR: 0.10, recGrade: 79.3 },
    lateDown: { yprr: 1.80, routesRun: 405, targets: 91, pctCareerRecYds: 30.6, pctCareerRecTDs: 36.4, tgtPerRR: 22.5, firstDownTDPerRR: 0.12, recGrade: 76.2 },
  },
  "RaRa Thomas": {
    overall: { yprr: 1.91, routesRun: 852, targets: 176, recYds: 1626, recTDs: 13, tgtPerRR: 20.7, firstDownTDPerRR: 0.10, recGrade: 71.9 },
  },
  "Barion Brown": {
    overall: { yprr: 1.91, routesRun: 1078, targets: 296, recYds: 2063, recTDs: 12, tgtPerRR: 27.5, firstDownTDPerRR: 0.09, recGrade: 70.1 },
    lateDown: { yprr: 1.72, routesRun: 352, targets: 66, pctCareerRecYds: 29.4, pctCareerRecTDs: 33.3, tgtPerRR: 18.8, firstDownTDPerRR: 0.08, recGrade: 64.8 },
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
