// Multi-perspective receiving data for WR prospects
// Sources: PFF career receiving grades and route data
// Overall perspective columns:
//   yprr, routesRun, targets, recYds, recTDs, tgtPerRR, firstDownTDPerRR, recGrade
//
// Situational perspective columns (lateDown, screen, redZone, press, zone, single):
//   yprr, routesRun, targets, pctCareerRecYds (%), pctCareerRecTDs (%), tgtPerRR, firstDownTDPerRR, recGrade
//
// Deep ball perspective columns (deepBall):
//   yprr, targets, receptions, pctCareerRecYds (%), pctCareerRecTDs (%), adot, contestedCatchRate (%), recGrade
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
    deepBall: { yprr: 19.19, targets: 43, receptions: 25, pctCareerRecYds: 41.1, pctCareerRecTDs: 42.9, adot: 28.2, contestedCatchRate: 57.1, recGrade: 97.6 },
    screen: { yprr: 2.04, routesRun: 126, targets: 45, pctCareerRecYds: 12.8, pctCareerRecTDs: 7.1, tgtPerRR: 35.7, firstDownTDPerRR: 0.06, recGrade: 74.5 },
  },
  "Eric McAlister": {
    overall: { yprr: 2.86, routesRun: 1072, targets: 291, recYds: 3067, recTDs: 24, tgtPerRR: 27.2, firstDownTDPerRR: 0.14, recGrade: 90.1 },
    lateDown: { yprr: 2.66, routesRun: 325, targets: 80, pctCareerRecYds: 28.2, pctCareerRecTDs: 41.7, tgtPerRR: 24.6, firstDownTDPerRR: 0.16, recGrade: 79.9 },
    deepBall: { yprr: 14.38, targets: 73, receptions: 30, pctCareerRecYds: 34.2, pctCareerRecTDs: 50.0, adot: 29.7, contestedCatchRate: 58.1, recGrade: 95.0 },
  },
  "Jordyn Tyson": {
    overall: { yprr: 2.71, routesRun: 841, targets: 262, recYds: 2275, recTDs: 22, tgtPerRR: 31.2, firstDownTDPerRR: 0.15, recGrade: 89.3 },
    lateDown: { yprr: 2.84, routesRun: 247, targets: 80, pctCareerRecYds: 30.9, pctCareerRecTDs: 40.9, tgtPerRR: 32.4, firstDownTDPerRR: 0.17, recGrade: 84.7 },
    screen: { yprr: 1.55, routesRun: 137, targets: 35, pctCareerRecYds: 9.3, pctCareerRecTDs: 9.1, tgtPerRR: 25.6, firstDownTDPerRR: 0.06, recGrade: 65.0 },
  },
  "Elijah Sarratt": {
    overall: { yprr: 2.70, routesRun: 1102, targets: 270, recYds: 2980, recTDs: 31, tgtPerRR: 24.5, firstDownTDPerRR: 0.16, recGrade: 92.4 },
    lateDown: { yprr: 2.55, routesRun: 300, targets: 69, pctCareerRecYds: 25.7, pctCareerRecTDs: 41.9, tgtPerRR: 23.0, firstDownTDPerRR: 0.18, recGrade: 87.9 },
    deepBall: { yprr: 19.43, targets: 40, receptions: 25, pctCareerRecYds: 26.1, pctCareerRecTDs: 29.0, adot: 26.4, contestedCatchRate: 55.6, recGrade: 93.1 },
    screen: { yprr: 1.97, routesRun: 226, targets: 67, pctCareerRecYds: 25.0, pctCareerRecTDs: 9.1, tgtPerRR: 29.6, firstDownTDPerRR: 0.05, recGrade: 69.0 },
  },
  "Omar Cooper Jr.": {
    overall: { yprr: 2.47, routesRun: 728, targets: 171, recYds: 1798, recTDs: 22, tgtPerRR: 23.5, firstDownTDPerRR: 0.14, recGrade: 87.6 },
    lateDown: { yprr: 1.82, routesRun: 212, targets: 46, pctCareerRecYds: 21.5, pctCareerRecTDs: 13.6, tgtPerRR: 21.7, firstDownTDPerRR: 0.11, recGrade: 70.4 },
    screen: { yprr: 2.11, routesRun: 81, targets: 26, pctCareerRecYds: 9.5, pctCareerRecTDs: 9.1, tgtPerRR: 32.1, firstDownTDPerRR: 0.06, recGrade: 73.7 },
  },
  "Eric Rivers": {
    overall: { yprr: 2.40, routesRun: 900, targets: 208, recYds: 2158, recTDs: 16, tgtPerRR: 23.1, firstDownTDPerRR: 0.12, recGrade: 81.2 },
    lateDown: { yprr: 2.01, routesRun: 259, targets: 49, pctCareerRecYds: 24.1, pctCareerRecTDs: 37.5, tgtPerRR: 18.9, firstDownTDPerRR: 0.12, recGrade: 72.6 },
    deepBall: { yprr: 17.25, targets: 51, receptions: 21, pctCareerRecYds: 40.8, pctCareerRecTDs: 56.3, adot: 34.1, contestedCatchRate: 27.3, recGrade: 90.8 },
    screen: { yprr: 1.97, routesRun: 64, targets: 25, pctCareerRecYds: 18.4, pctCareerRecTDs: 20.0, tgtPerRR: 39.1, firstDownTDPerRR: 0.05, recGrade: 63.9 },
  },
  "Griffin Wilde": {
    overall: { yprr: 2.40, routesRun: 366, targets: 107, recYds: 880, recTDs: 8, tgtPerRR: 29.2, firstDownTDPerRR: 0.15, recGrade: 80.2 },
    lateDown: { yprr: 1.94, routesRun: 120, targets: 34, pctCareerRecYds: 26.5, pctCareerRecTDs: 37.5, tgtPerRR: 28.3, firstDownTDPerRR: 0.18, recGrade: 81.6 },
  },
  "Jared Brown": {
    overall: { yprr: 2.35, routesRun: 800, targets: 195, recYds: 1877, recTDs: 11, tgtPerRR: 24.4, firstDownTDPerRR: 0.10, recGrade: 75.2 },
    lateDown: { yprr: 1.95, routesRun: 233, targets: 53, pctCareerRecYds: 24.2, pctCareerRecTDs: 9.1, tgtPerRR: 22.8, firstDownTDPerRR: 0.10, recGrade: 67.4 },
    deepBall: { yprr: 18.57, targets: 37, receptions: 15, pctCareerRecYds: 36.6, pctCareerRecTDs: 45.5, adot: 30.3, contestedCatchRate: 60.0, recGrade: 87.3 },
    screen: { yprr: 4.43, routesRun: 121, targets: 62, pctCareerRecYds: 28.6, pctCareerRecTDs: 36.4, tgtPerRR: 51.2, firstDownTDPerRR: 0.04, recGrade: 89.7 },
  },
  "Carnell Tate": {
    overall: { yprr: 2.27, routesRun: 826, targets: 161, recYds: 1872, recTDs: 14, tgtPerRR: 19.5, firstDownTDPerRR: 0.12, recGrade: 82.2 },
    deepBall: { yprr: 22.00, targets: 31, receptions: 18, pctCareerRecYds: 36.4, pctCareerRecTDs: 64.3, adot: 33.3, contestedCatchRate: 60.0, recGrade: 92.1 },
    screen: { yprr: 1.24, routesRun: 104, targets: 17, pctCareerRecYds: 6.9, pctCareerRecTDs: 0.0, tgtPerRR: 16.4, firstDownTDPerRR: 0.04, recGrade: 64.4 },
  },
  "Chase Roberts": {
    overall: { yprr: 2.26, routesRun: 1138, targets: 273, recYds: 2571, recTDs: 18, tgtPerRR: 24.0, firstDownTDPerRR: 0.13, recGrade: 84.3 },
    lateDown: { yprr: 1.71, routesRun: 320, targets: 80, pctCareerRecYds: 21.3, pctCareerRecTDs: 27.8, tgtPerRR: 25.0, firstDownTDPerRR: 0.13, recGrade: 72.7 },
  },
  "Kobe Prentice": {
    overall: { yprr: 2.26, routesRun: 514, targets: 119, recYds: 1160, recTDs: 11, tgtPerRR: 23.2, firstDownTDPerRR: 0.11, recGrade: 78.5 },
    lateDown: { yprr: 2.58, routesRun: 166, targets: 28, pctCareerRecYds: 37.0, pctCareerRecTDs: 63.6, tgtPerRR: 16.9, firstDownTDPerRR: 0.13, recGrade: 73.4 },
    deepBall: { yprr: 21.38, targets: 21, receptions: 11, pctCareerRecYds: 38.7, pctCareerRecTDs: 54.5, adot: 33.0, contestedCatchRate: 100.0, recGrade: 89.8 },
    screen: { yprr: 2.17, routesRun: 60, targets: 30, pctCareerRecYds: 11.2, pctCareerRecTDs: 9.1, tgtPerRR: 50.0, firstDownTDPerRR: 0.06, recGrade: 73.6 },
  },
  "Ted Hurst": {
    overall: { yprr: 2.25, routesRun: 873, targets: 224, recYds: 1960, recTDs: 15, tgtPerRR: 25.7, firstDownTDPerRR: 0.12, recGrade: 82.3 },
    lateDown: { yprr: 1.92, routesRun: 281, targets: 77, pctCareerRecYds: 27.6, pctCareerRecTDs: 33.3, tgtPerRR: 27.4, firstDownTDPerRR: 0.14, recGrade: 76.2 },
    deepBall: { yprr: 14.27, targets: 64, receptions: 27, pctCareerRecYds: 46.6, pctCareerRecTDs: 40.0, adot: 31.1, contestedCatchRate: 59.1, recGrade: 97.6 },
    screen: { yprr: 1.65, routesRun: 54, targets: 11, pctCareerRecYds: 26.0, pctCareerRecTDs: 50.0, tgtPerRR: 20.4, firstDownTDPerRR: 0.04, recGrade: 60.7 },
  },
  "Brenen Thompson": {
    overall: { yprr: 2.21, routesRun: 706, targets: 140, recYds: 1557, recTDs: 10, tgtPerRR: 19.8, firstDownTDPerRR: 0.09, recGrade: 74.7 },
    lateDown: { yprr: 1.88, routesRun: 212, targets: 35, pctCareerRecYds: 25.6, pctCareerRecTDs: 30.0, tgtPerRR: 16.5, firstDownTDPerRR: 0.10, recGrade: 69.9 },
    deepBall: { yprr: 18.00, targets: 43, receptions: 17, pctCareerRecYds: 49.7, pctCareerRecTDs: 80.0, adot: 41.4, contestedCatchRate: 20.0, recGrade: 93.8 },
  },
  "Caullin Lacy": {
    overall: { yprr: 2.17, routesRun: 1356, targets: 317, recYds: 2949, recTDs: 16, tgtPerRR: 23.4, firstDownTDPerRR: 0.10, recGrade: 82.6 },
    lateDown: { yprr: 2.38, routesRun: 406, targets: 93, pctCareerRecYds: 32.8, pctCareerRecTDs: 37.5, tgtPerRR: 22.9, firstDownTDPerRR: 0.11, recGrade: 77.8 },
    deepBall: { yprr: 17.22, targets: 54, receptions: 25, pctCareerRecYds: 31.5, pctCareerRecTDs: 43.8, adot: 30.0, contestedCatchRate: 33.3, recGrade: 93.8 },
    screen: { yprr: 3.25, routesRun: 229, targets: 85, pctCareerRecYds: 25.2, pctCareerRecTDs: 18.8, tgtPerRR: 37.1, firstDownTDPerRR: 0.05, recGrade: 88.9 },
  },
  "Jeff Caldwell": {
    overall: { yprr: 2.16, routesRun: 221, targets: 58, recYds: 478, recTDs: 6, tgtPerRR: 26.2, firstDownTDPerRR: 0.14, recGrade: 71.5 },
  },
  "Skyler Bell": {
    overall: { yprr: 2.15, routesRun: 1336, targets: 346, recYds: 2879, recTDs: 24, tgtPerRR: 25.9, firstDownTDPerRR: 0.10, recGrade: 75.3 },
    lateDown: { yprr: 1.81, routesRun: 430, targets: 101, pctCareerRecYds: 27.0, pctCareerRecTDs: 29.2, tgtPerRR: 23.5, firstDownTDPerRR: 0.10, recGrade: 67.4 },
    screen: { yprr: 2.35, routesRun: 167, targets: 59, pctCareerRecYds: 13.6, pctCareerRecTDs: 8.3, tgtPerRR: 35.3, firstDownTDPerRR: 0.04, recGrade: 73.1 },
  },
  "Amare Thomas": {
    overall: { yprr: 2.15, routesRun: 969, targets: 261, recYds: 2088, recTDs: 23, tgtPerRR: 26.9, firstDownTDPerRR: 0.13, recGrade: 81.1 },
    lateDown: { yprr: 2.33, routesRun: 311, targets: 85, pctCareerRecYds: 34.8, pctCareerRecTDs: 39.1, tgtPerRR: 27.3, firstDownTDPerRR: 0.16, recGrade: 81.1 },
    deepBall: { yprr: 17.81, targets: 27, receptions: 14, pctCareerRecYds: 23.0, pctCareerRecTDs: 17.4, adot: 26.9, contestedCatchRate: 50.0, recGrade: 87.3 },
    screen: { yprr: 2.62, routesRun: 151, targets: 63, pctCareerRecYds: 19.0, pctCareerRecTDs: 13.0, tgtPerRR: 41.7, firstDownTDPerRR: 0.05, recGrade: 78.6 },
  },
  "CJ Daniels": {
    overall: { yprr: 2.14, routesRun: 1000, targets: 210, recYds: 2139, recTDs: 18, tgtPerRR: 21.0, firstDownTDPerRR: 0.11, recGrade: 81.3 },
    lateDown: { yprr: 2.18, routesRun: 296, targets: 58, pctCareerRecYds: 30.2, pctCareerRecTDs: 38.9, tgtPerRR: 19.6, firstDownTDPerRR: 0.14, recGrade: 76.9 },
    deepBall: { yprr: 17.17, targets: 53, receptions: 26, pctCareerRecYds: 42.5, pctCareerRecTDs: 66.7, adot: 31.8, contestedCatchRate: 72.7, recGrade: 93.2 },
  },
  "Kevin Coleman Jr.": {
    overall: { yprr: 2.14, routesRun: 951, targets: 223, recYds: 2039, recTDs: 9, tgtPerRR: 23.4, firstDownTDPerRR: 0.11, recGrade: 82.7 },
    lateDown: { yprr: 1.86, routesRun: 291, targets: 69, pctCareerRecYds: 26.6, pctCareerRecTDs: 44.4, tgtPerRR: 23.7, firstDownTDPerRR: 0.13, recGrade: 75.1 },
    screen: { yprr: 3.70, routesRun: 108, targets: 55, pctCareerRecYds: 19.6, pctCareerRecTDs: 33.3, tgtPerRR: 50.9, firstDownTDPerRR: 0.05, recGrade: 87.7 },
  },
  "Squirrel White": {
    overall: { yprr: 2.11, routesRun: 809, targets: 206, recYds: 1711, recTDs: 6, tgtPerRR: 25.5, firstDownTDPerRR: 0.09, recGrade: 71.1 },
    lateDown: { yprr: 1.65, routesRun: 211, targets: 49, pctCareerRecYds: 20.4, pctCareerRecTDs: 50.0, tgtPerRR: 23.2, firstDownTDPerRR: 0.09, recGrade: 61.4 },
    deepBall: { yprr: 16.54, targets: 41, receptions: 14, pctCareerRecYds: 39.6, pctCareerRecTDs: 83.3, adot: 40.1, contestedCatchRate: 28.6, recGrade: 87.8 },
    screen: { yprr: 2.12, routesRun: 190, targets: 71, pctCareerRecYds: 23.5, pctCareerRecTDs: 16.7, tgtPerRR: 37.4, firstDownTDPerRR: 0.05, recGrade: 71.0 },
  },
  "Hank Beatty": {
    overall: { yprr: 2.09, routesRun: 597, targets: 138, recYds: 1245, recTDs: 4, tgtPerRR: 23.1, firstDownTDPerRR: 0.10, recGrade: 77.6 },
    deepBall: { yprr: 16.13, targets: 16, receptions: 7, pctCareerRecYds: 20.7, pctCareerRecTDs: 0.0, adot: 26.4, contestedCatchRate: 0.0, recGrade: 73.1 },
    screen: { yprr: 1.67, routesRun: 97, targets: 33, pctCareerRecYds: 13.0, pctCareerRecTDs: 0.0, tgtPerRR: 34.0, firstDownTDPerRR: 0.02, recGrade: 66.3 },
  },
  "Chris Brazzell II": {
    overall: { yprr: 2.09, routesRun: 986, targets: 215, recYds: 2061, recTDs: 16, tgtPerRR: 21.8, firstDownTDPerRR: 0.12, recGrade: 78.0 },
    lateDown: { yprr: 1.84, routesRun: 274, targets: 57, pctCareerRecYds: 24.4, pctCareerRecTDs: 31.3, tgtPerRR: 20.8, firstDownTDPerRR: 0.13, recGrade: 72.4 },
    deepBall: { yprr: 16.05, targets: 55, receptions: 24, pctCareerRecYds: 42.8, pctCareerRecTDs: 50.0, adot: 34.6, contestedCatchRate: 58.3, recGrade: 89.9 },
    screen: { yprr: 2.22, routesRun: 73, targets: 30, pctCareerRecYds: 17.2, pctCareerRecTDs: 0.0, tgtPerRR: 41.1, firstDownTDPerRR: 0.06, recGrade: 69.1 },
  },
  "Emmanuel Henderson Jr.": {
    overall: { yprr: 2.08, routesRun: 414, targets: 79, recYds: 862, recTDs: 5, tgtPerRR: 19.1, firstDownTDPerRR: 0.09, recGrade: 70.0 },
    deepBall: { yprr: 14.91, targets: 32, receptions: 13, pctCareerRecYds: 55.3, pctCareerRecTDs: 60.0, adot: 29.9, contestedCatchRate: 57.1, recGrade: 91.1 },
  },
  "Cyrus Allen": {
    overall: { yprr: 2.07, routesRun: 1072, targets: 227, recYds: 2214, recTDs: 21, tgtPerRR: 21.2, firstDownTDPerRR: 0.10, recGrade: 73.6 },
    deepBall: { yprr: 16.81, targets: 68, receptions: 30, pctCareerRecYds: 51.6, pctCareerRecTDs: 66.7, adot: 31.6, contestedCatchRate: 52.4, recGrade: 93.5 },
  },
  "Aaron Anderson": {
    overall: { yprr: 2.06, routesRun: 645, targets: 154, recYds: 1331, recTDs: 5, tgtPerRR: 23.9, firstDownTDPerRR: 0.10, recGrade: 72.9 },
    lateDown: { yprr: 1.99, routesRun: 199, targets: 44, pctCareerRecYds: 29.8, pctCareerRecTDs: 60.0, tgtPerRR: 22.1, firstDownTDPerRR: 0.14, recGrade: 72.9 },
    deepBall: { yprr: 14.22, targets: 27, receptions: 13, pctCareerRecYds: 28.9, pctCareerRecTDs: 60.0, adot: 25.9, contestedCatchRate: 57.1, recGrade: 76.7 },
    screen: { yprr: 2.77, routesRun: 81, targets: 42, pctCareerRecYds: 16.8, pctCareerRecTDs: 0.0, tgtPerRR: 51.8, firstDownTDPerRR: 0.03, recGrade: 71.3 },
  },
  "KC Concepcion": {
    overall: { yprr: 2.03, routesRun: 1096, targets: 294, recYds: 2224, recTDs: 25, tgtPerRR: 26.8, firstDownTDPerRR: 0.12, recGrade: 77.8 },
    lateDown: { yprr: 1.78, routesRun: 319, targets: 71, pctCareerRecYds: 25.5, pctCareerRecTDs: 48.0, tgtPerRR: 22.3, firstDownTDPerRR: 0.14, recGrade: 71.6 },
    screen: { yprr: 2.40, routesRun: 142, targets: 59, pctCareerRecYds: 15.3, pctCareerRecTDs: 12.0, tgtPerRR: 41.5, firstDownTDPerRR: 0.05, recGrade: 72.9 },
  },
  "Zachariah Branch": {
    overall: { yprr: 2.03, routesRun: 806, targets: 211, recYds: 1634, recTDs: 9, tgtPerRR: 26.2, firstDownTDPerRR: 0.11, recGrade: 79.4 },
    lateDown: { yprr: 2.41, routesRun: 223, targets: 53, pctCareerRecYds: 32.9, pctCareerRecTDs: 33.3, tgtPerRR: 23.8, firstDownTDPerRR: 0.14, recGrade: 73.6 },
    screen: { yprr: 3.41, routesRun: 172, targets: 91, pctCareerRecYds: 35.9, pctCareerRecTDs: 55.6, tgtPerRR: 52.9, firstDownTDPerRR: 0.06, recGrade: 89.4 },
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
    deepBall: { yprr: 17.25, targets: 44, receptions: 23, pctCareerRecYds: 32.6, pctCareerRecTDs: 52.4, adot: 28.7, contestedCatchRate: 54.5, recGrade: 90.8 },
    screen: { yprr: 1.75, routesRun: 185, targets: 64, pctCareerRecYds: 13.9, pctCareerRecTDs: 4.8, tgtPerRR: 34.6, firstDownTDPerRR: 0.05, recGrade: 69.7 },
  },
  "De'Zhaun Stribling": {
    overall: { yprr: 1.95, routesRun: 1279, targets: 272, recYds: 2493, recTDs: 18, tgtPerRR: 21.3, firstDownTDPerRR: 0.10, recGrade: 81.1 },
  },
  "Ja'Kobi Lane": {
    overall: { yprr: 1.95, routesRun: 702, targets: 149, recYds: 1368, recTDs: 18, tgtPerRR: 21.2, firstDownTDPerRR: 0.13, recGrade: 81.0 },
    lateDown: { yprr: 2.74, routesRun: 189, targets: 50, pctCareerRecYds: 37.8, pctCareerRecTDs: 33.3, tgtPerRR: 26.5, firstDownTDPerRR: 0.18, recGrade: 83.7 },
    deepBall: { yprr: 15.85, targets: 27, receptions: 12, pctCareerRecYds: 31.3, pctCareerRecTDs: 33.3, adot: 27.9, contestedCatchRate: 40.0, recGrade: 80.9 },
    screen: { yprr: 2.33, routesRun: 52, targets: 18, pctCareerRecYds: 26.0, pctCareerRecTDs: 33.3, tgtPerRR: 34.6, firstDownTDPerRR: 0.06, recGrade: 65.5 },
  },
  "Jordan Hudson": {
    overall: { yprr: 1.93, routesRun: 934, targets: 221, recYds: 1804, recTDs: 21, tgtPerRR: 23.7, firstDownTDPerRR: 0.11, recGrade: 76.0 },
    screen: { yprr: 1.44, routesRun: 189, targets: 51, pctCareerRecYds: 15.1, pctCareerRecTDs: 9.5, tgtPerRR: 27.0, firstDownTDPerRR: 0.05, recGrade: 64.9 },
  },
  "Devin Voisin": {
    overall: { yprr: 1.92, routesRun: 1107, targets: 243, recYds: 2130, recTDs: 10, tgtPerRR: 21.9, firstDownTDPerRR: 0.10, recGrade: 76.4 },
    lateDown: { yprr: 1.78, routesRun: 324, targets: 64, pctCareerRecYds: 27.1, pctCareerRecTDs: 50.0, tgtPerRR: 19.8, firstDownTDPerRR: 0.12, recGrade: 72.3 },
  },
  "Lewis Bond": {
    overall: { yprr: 1.92, routesRun: 1237, targets: 287, recYds: 2380, recTDs: 11, tgtPerRR: 23.2, firstDownTDPerRR: 0.10, recGrade: 79.3 },
    lateDown: { yprr: 1.80, routesRun: 405, targets: 91, pctCareerRecYds: 30.6, pctCareerRecTDs: 36.4, tgtPerRR: 22.5, firstDownTDPerRR: 0.12, recGrade: 76.2 },
    screen: { yprr: 2.46, routesRun: 154, targets: 57, pctCareerRecYds: 15.9, pctCareerRecTDs: 9.1, tgtPerRR: 37.0, firstDownTDPerRR: 0.04, recGrade: 73.7 },
  },
  "RaRa Thomas": {
    overall: { yprr: 1.91, routesRun: 852, targets: 176, recYds: 1626, recTDs: 13, tgtPerRR: 20.7, firstDownTDPerRR: 0.10, recGrade: 71.9 },
    deepBall: { yprr: 16.56, targets: 34, receptions: 14, pctCareerRecYds: 34.6, pctCareerRecTDs: 46.2, adot: 32.1, contestedCatchRate: 53.3, recGrade: 89.1 },
  },
  "Barion Brown": {
    overall: { yprr: 1.91, routesRun: 1078, targets: 296, recYds: 2063, recTDs: 12, tgtPerRR: 27.5, firstDownTDPerRR: 0.09, recGrade: 70.1 },
    lateDown: { yprr: 1.72, routesRun: 352, targets: 66, pctCareerRecYds: 29.4, pctCareerRecTDs: 33.3, tgtPerRR: 18.8, firstDownTDPerRR: 0.08, recGrade: 64.8 },
    screen: { yprr: 2.28, routesRun: 162, targets: 75, pctCareerRecYds: 17.9, pctCareerRecTDs: 16.7, tgtPerRR: 46.3, firstDownTDPerRR: 0.05, recGrade: 70.8 },
  },
  "Christian Leary": {
    overall: { yprr: 1.90, routesRun: 241, targets: 60, recYds: 459, recTDs: 2, tgtPerRR: 24.9, firstDownTDPerRR: 0.10, recGrade: 73.2 },
    screen: { yprr: 2.38, routesRun: 40, targets: 18, pctCareerRecYds: 20.7, pctCareerRecTDs: 0.0, tgtPerRR: 45.0, firstDownTDPerRR: 0.05, recGrade: 74.1 },
  },
  "Germie Bernard": {
    overall: { yprr: 1.90, routesRun: 1167, targets: 232, recYds: 2214, recTDs: 13, tgtPerRR: 19.9, firstDownTDPerRR: 0.10, recGrade: 80.2 },
    screen: { yprr: 1.70, routesRun: 174, targets: 42, pctCareerRecYds: 13.4, pctCareerRecTDs: 23.1, tgtPerRR: 24.1, firstDownTDPerRR: 0.06, recGrade: 72.5 },
  },
  "Kendrick Law": {
    screen: { yprr: 3.73, routesRun: 104, targets: 46, pctCareerRecYds: 43.9, pctCareerRecTDs: 50.0, tgtPerRR: 44.2, firstDownTDPerRR: 0.04, recGrade: 90.0 },
  },
  "Ryan Niblett": {
    screen: { yprr: 3.65, routesRun: 23, targets: 11, pctCareerRecYds: 100.0, pctCareerRecTDs: null, tgtPerRR: 47.8, firstDownTDPerRR: 0.06, recGrade: 79.0 },
  },
  "Jayden McGowan": {
    screen: { yprr: 3.18, routesRun: 76, targets: 39, pctCareerRecYds: 28.5, pctCareerRecTDs: 0.0, tgtPerRR: 51.3, firstDownTDPerRR: 0.03, recGrade: 69.7 },
  },
  "Kaden Wetjen": {
    screen: { yprr: 2.88, routesRun: 33, targets: 17, pctCareerRecYds: 46.6, pctCareerRecTDs: 0.0, tgtPerRR: 51.5, firstDownTDPerRR: 0.04, recGrade: 64.1 },
  },
  "Kaleb Brown": {
    screen: { yprr: 2.33, routesRun: 52, targets: 18, pctCareerRecYds: 26.0, pctCareerRecTDs: 33.3, tgtPerRR: 34.6, firstDownTDPerRR: 0.06, recGrade: 65.5 },
  },
  "Trebor Pena": {
    screen: { yprr: 2.28, routesRun: 161, targets: 59, pctCareerRecYds: 21.8, pctCareerRecTDs: 9.1, tgtPerRR: 36.6, firstDownTDPerRR: 0.06, recGrade: 78.1 },
  },
  "Anthony Evans III": {
    screen: { yprr: 2.22, routesRun: 73, targets: 30, pctCareerRecYds: 17.2, pctCareerRecTDs: 0.0, tgtPerRR: 41.1, firstDownTDPerRR: 0.06, recGrade: 69.1 },
  },
  "Mikey Matthews": {
    screen: { yprr: 1.58, routesRun: 92, targets: 36, pctCareerRecYds: 16.5, pctCareerRecTDs: 0.0, tgtPerRR: 39.1, firstDownTDPerRR: 0.03, recGrade: 64.5 },
  },
  "Joseph Manjack IV": {
    screen: { yprr: 1.51, routesRun: 157, targets: 35, pctCareerRecYds: 14.3, pctCareerRecTDs: 7.7, tgtPerRR: 22.3, firstDownTDPerRR: 0.06, recGrade: 71.1 },
  },
  "Justus Ross-Simmons": {
    screen: { yprr: 1.48, routesRun: 117, targets: 24, pctCareerRecYds: 10.5, pctCareerRecTDs: 0.0, tgtPerRR: 20.5, firstDownTDPerRR: 0.05, recGrade: 63.7 },
  },
  "Brandon Inniss": {
    screen: { yprr: 1.48, routesRun: 48, targets: 15, pctCareerRecYds: 14.1, pctCareerRecTDs: 0.0, tgtPerRR: 31.3, firstDownTDPerRR: 0.06, recGrade: 65.3 },
  },
  "Colbie Young": {
    screen: { yprr: 1.31, routesRun: 147, targets: 28, pctCareerRecYds: 13.0, pctCareerRecTDs: 7.7, tgtPerRR: 19.1, firstDownTDPerRR: 0.05, recGrade: 63.8 },
  },
  "Deion Burks": {
    screen: { yprr: 1.29, routesRun: 149, targets: 40, pctCareerRecYds: 11.8, pctCareerRecTDs: 21.4, tgtPerRR: 26.9, firstDownTDPerRR: 0.06, recGrade: 60.8 },
  },
  "Ja'Varrius Johnson": {
    screen: { yprr: 1.27, routesRun: 55, targets: 13, pctCareerRecYds: 7.8, pctCareerRecTDs: 0.0, tgtPerRR: 23.6, firstDownTDPerRR: 0.07, recGrade: 69.6 },
  },
  "Braylin Presley": {
    screen: { yprr: 1.24, routesRun: 38, targets: 22, pctCareerRecYds: 14.6, pctCareerRecTDs: 0.0, tgtPerRR: 57.9, firstDownTDPerRR: 0.06, recGrade: 54.4 },
  },
  "Jaquaize Pettaway": {
    screen: { yprr: 1.68, routesRun: 41, targets: 21, pctCareerRecYds: 36.5, pctCareerRecTDs: null, tgtPerRR: 51.2, firstDownTDPerRR: 0.03, recGrade: 66.8 },
  },
};

// Helper to look up perspective data by player name (case-insensitive)
export const getReceivingData = (playerName) => {
  const entry = Object.entries(receivingPerspectiveData).find(
    ([name]) => name.toLowerCase() === playerName.toLowerCase()
  );
  return entry ? entry[1] : null;
};
