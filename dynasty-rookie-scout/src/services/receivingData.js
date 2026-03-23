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
    redZone: { yprr: 1.19, routesRun: 85, targets: 17, pctCareerRecYds: 5.0, pctCareerRecTDs: 57.1, tgtPerRR: 20.0, firstDownTDPerRR: 0.21, recGrade: 72.8 },
    press: { yprr: 3.3, routesRun: 442, targets: 125, pctCareerRecYds: 72.6, pctCareerRecTDs: 78.6, tgtPerRR: 28.3, firstDownTDPerRR: 0.15, recGrade: 90.9 },
    zone: { yprr: 3.13, routesRun: 410, targets: 111, pctCareerRecYds: 63.9, pctCareerRecTDs: 28.6, tgtPerRR: 27.1, firstDownTDPerRR: 0.14, recGrade: 90.6 },
  },
  "Eric McAlister": {
    overall: { yprr: 2.86, routesRun: 1072, targets: 291, recYds: 3067, recTDs: 24, tgtPerRR: 27.2, firstDownTDPerRR: 0.14, recGrade: 90.1 },
    lateDown: { yprr: 2.66, routesRun: 325, targets: 80, pctCareerRecYds: 28.2, pctCareerRecTDs: 41.7, tgtPerRR: 24.6, firstDownTDPerRR: 0.16, recGrade: 79.9 },
    deepBall: { yprr: 14.38, targets: 73, receptions: 30, pctCareerRecYds: 34.2, pctCareerRecTDs: 50.0, adot: 29.7, contestedCatchRate: 58.1, recGrade: 95.0 },
    press: { yprr: 3.16, routesRun: 645, targets: 182, pctCareerRecYds: 66.5, pctCareerRecTDs: 70.8, tgtPerRR: 28.2, firstDownTDPerRR: 0.16, recGrade: 90 },
    zone: { yprr: 2.57, routesRun: 725, targets: 188, pctCareerRecYds: 60.6, pctCareerRecTDs: 41.7, tgtPerRR: 25.9, firstDownTDPerRR: 0.13, recGrade: 85.7 },
  },
  "Jordyn Tyson": {
    overall: { yprr: 2.71, routesRun: 841, targets: 262, recYds: 2275, recTDs: 22, tgtPerRR: 31.2, firstDownTDPerRR: 0.15, recGrade: 89.3 },
    lateDown: { yprr: 2.84, routesRun: 247, targets: 80, pctCareerRecYds: 30.9, pctCareerRecTDs: 40.9, tgtPerRR: 32.4, firstDownTDPerRR: 0.17, recGrade: 84.7 },
    screen: { yprr: 1.55, routesRun: 137, targets: 35, pctCareerRecYds: 9.3, pctCareerRecTDs: 9.1, tgtPerRR: 25.6, firstDownTDPerRR: 0.06, recGrade: 65.0 },
    redZone: { yprr: 2.19, routesRun: 90, targets: 45, pctCareerRecYds: 8.7, pctCareerRecTDs: 54.5, tgtPerRR: 50.0, firstDownTDPerRR: 0.32, recGrade: 81.6 },
    press: { yprr: 2.9, routesRun: 520, targets: 183, pctCareerRecYds: 66.3, pctCareerRecTDs: 68.2, tgtPerRR: 35.2, firstDownTDPerRR: 0.17, recGrade: 89.1 },
    zone: { yprr: 2.22, routesRun: 480, targets: 119, pctCareerRecYds: 46.9, pctCareerRecTDs: 22.7, tgtPerRR: 24.8, firstDownTDPerRR: 0.1, recGrade: 75.2 },
  },
  "Elijah Sarratt": {
    overall: { yprr: 2.70, routesRun: 1102, targets: 270, recYds: 2980, recTDs: 31, tgtPerRR: 24.5, firstDownTDPerRR: 0.16, recGrade: 92.4 },
    lateDown: { yprr: 2.55, routesRun: 300, targets: 69, pctCareerRecYds: 25.7, pctCareerRecTDs: 41.9, tgtPerRR: 23.0, firstDownTDPerRR: 0.18, recGrade: 87.9 },
    deepBall: { yprr: 19.43, targets: 40, receptions: 25, pctCareerRecYds: 26.1, pctCareerRecTDs: 29.0, adot: 26.4, contestedCatchRate: 55.6, recGrade: 93.1 },
    redZone: { yprr: 1.28, routesRun: 169, targets: 37, pctCareerRecYds: 7.3, pctCareerRecTDs: 61.3, tgtPerRR: 21.9, firstDownTDPerRR: 0.24, recGrade: 80.2 },
    press: { yprr: 2.57, routesRun: 694, targets: 167, pctCareerRecYds: 59.8, pctCareerRecTDs: 83.9, tgtPerRR: 24.1, firstDownTDPerRR: 0.16, recGrade: 90.2 },
    zone: { yprr: 2.53, routesRun: 674, targets: 146, pctCareerRecYds: 57.2, pctCareerRecTDs: 29, tgtPerRR: 21.7, firstDownTDPerRR: 0.13, recGrade: 85.4 },
  },
  "Omar Cooper Jr.": {
    overall: { yprr: 2.47, routesRun: 728, targets: 171, recYds: 1798, recTDs: 22, tgtPerRR: 23.5, firstDownTDPerRR: 0.14, recGrade: 87.6 },
    lateDown: { yprr: 1.82, routesRun: 212, targets: 46, pctCareerRecYds: 21.5, pctCareerRecTDs: 13.6, tgtPerRR: 21.7, firstDownTDPerRR: 0.11, recGrade: 70.4 },
    screen: { yprr: 2.11, routesRun: 81, targets: 26, pctCareerRecYds: 9.5, pctCareerRecTDs: 9.1, tgtPerRR: 32.1, firstDownTDPerRR: 0.06, recGrade: 73.7 },
    redZone: { yprr: 1.27, routesRun: 94, targets: 24, pctCareerRecYds: 6.6, pctCareerRecTDs: 45.5, tgtPerRR: 25.5, firstDownTDPerRR: 0.22, recGrade: 72.9 },
    press: { yprr: 2.06, routesRun: 479, targets: 111, pctCareerRecYds: 54.8, pctCareerRecTDs: 63.6, tgtPerRR: 23.2, firstDownTDPerRR: 0.13, recGrade: 76 },
    zone: { yprr: 2.77, routesRun: 414, targets: 97, pctCareerRecYds: 63.8, pctCareerRecTDs: 40.9, tgtPerRR: 23.4, firstDownTDPerRR: 0.14, recGrade: 87.1 },
  },
  "Eric Rivers": {
    overall: { yprr: 2.40, routesRun: 900, targets: 208, recYds: 2158, recTDs: 16, tgtPerRR: 23.1, firstDownTDPerRR: 0.12, recGrade: 81.2 },
    lateDown: { yprr: 2.01, routesRun: 259, targets: 49, pctCareerRecYds: 24.1, pctCareerRecTDs: 37.5, tgtPerRR: 18.9, firstDownTDPerRR: 0.12, recGrade: 72.6 },
    deepBall: { yprr: 17.25, targets: 51, receptions: 21, pctCareerRecYds: 40.8, pctCareerRecTDs: 56.3, adot: 34.1, contestedCatchRate: 27.3, recGrade: 90.8 },
    redZone: { yprr: 1.16, routesRun: 92, targets: 23, pctCareerRecYds: 5.0, pctCareerRecTDs: 43.8, tgtPerRR: 25.0, firstDownTDPerRR: 0.16, recGrade: 61.2 },
    press: { yprr: 2.39, routesRun: 496, targets: 111, pctCareerRecYds: 55, pctCareerRecTDs: 75, tgtPerRR: 22.4, firstDownTDPerRR: 0.12, recGrade: 74.2 },
    zone: { yprr: 2.42, routesRun: 611, targets: 125, pctCareerRecYds: 68.6, pctCareerRecTDs: 43.8, tgtPerRR: 20.5, firstDownTDPerRR: 0.11, recGrade: 81.1 },
  },
  "Griffin Wilde": {
    overall: { yprr: 2.40, routesRun: 366, targets: 107, recYds: 880, recTDs: 8, tgtPerRR: 29.2, firstDownTDPerRR: 0.15, recGrade: 80.2 },
    lateDown: { yprr: 1.94, routesRun: 120, targets: 34, pctCareerRecYds: 26.5, pctCareerRecTDs: 37.5, tgtPerRR: 28.3, firstDownTDPerRR: 0.18, recGrade: 81.6 },
    redZone: { yprr: 1.33, routesRun: 48, targets: 14, pctCareerRecYds: 7.3, pctCareerRecTDs: 62.5, tgtPerRR: 29.2, firstDownTDPerRR: 0.25, recGrade: 65.1 },
    press: { yprr: 2.42, routesRun: 233, targets: 70, pctCareerRecYds: 64, pctCareerRecTDs: 100, tgtPerRR: 30, firstDownTDPerRR: 0.19, recGrade: 85.2 },
    zone: { yprr: 2.75, routesRun: 185, targets: 53, pctCareerRecYds: 57.8, pctCareerRecTDs: 12.5, tgtPerRR: 28.6, firstDownTDPerRR: 0.14, recGrade: 77.8 },
  },
  "Jared Brown": {
    overall: { yprr: 2.35, routesRun: 800, targets: 195, recYds: 1877, recTDs: 11, tgtPerRR: 24.4, firstDownTDPerRR: 0.10, recGrade: 75.2 },
    lateDown: { yprr: 1.95, routesRun: 233, targets: 53, pctCareerRecYds: 24.2, pctCareerRecTDs: 9.1, tgtPerRR: 22.8, firstDownTDPerRR: 0.10, recGrade: 67.4 },
    deepBall: { yprr: 18.57, targets: 37, receptions: 15, pctCareerRecYds: 36.6, pctCareerRecTDs: 45.5, adot: 30.3, contestedCatchRate: 60.0, recGrade: 87.3 },
    screen: { yprr: 4.43, routesRun: 121, targets: 62, pctCareerRecYds: 28.6, pctCareerRecTDs: 36.4, tgtPerRR: 51.2, firstDownTDPerRR: 0.04, recGrade: 89.7 },
    press: { yprr: 1.93, routesRun: 380, targets: 98, pctCareerRecYds: 39.2, pctCareerRecTDs: 27.3, tgtPerRR: 25.8, firstDownTDPerRR: 0.08, recGrade: 69.9 },
    zone: { yprr: 2.32, routesRun: 580, targets: 140, pctCareerRecYds: 71.8, pctCareerRecTDs: 72.7, tgtPerRR: 24.1, firstDownTDPerRR: 0.09, recGrade: 70.8 },
  },
  "Carnell Tate": {
    overall: { yprr: 2.27, routesRun: 826, targets: 161, recYds: 1872, recTDs: 14, tgtPerRR: 19.5, firstDownTDPerRR: 0.12, recGrade: 82.2 },
    deepBall: { yprr: 22.00, targets: 31, receptions: 18, pctCareerRecYds: 36.4, pctCareerRecTDs: 64.3, adot: 33.3, contestedCatchRate: 60.0, recGrade: 92.1 },
    screen: { yprr: 1.24, routesRun: 104, targets: 17, pctCareerRecYds: 6.9, pctCareerRecTDs: 0.0, tgtPerRR: 16.4, firstDownTDPerRR: 0.04, recGrade: 64.4 },
    press: { yprr: 2.19, routesRun: 521, targets: 102, pctCareerRecYds: 61, pctCareerRecTDs: 57.1, tgtPerRR: 19.6, firstDownTDPerRR: 0.11, recGrade: 77.1 },
    zone: { yprr: 2.48, routesRun: 584, targets: 105, pctCareerRecYds: 77.4, pctCareerRecTDs: 57.1, tgtPerRR: 18, firstDownTDPerRR: 0.12, recGrade: 82.7 },
  },
  "Chase Roberts": {
    overall: { yprr: 2.26, routesRun: 1138, targets: 273, recYds: 2571, recTDs: 18, tgtPerRR: 24.0, firstDownTDPerRR: 0.13, recGrade: 84.3 },
    lateDown: { yprr: 1.71, routesRun: 320, targets: 80, pctCareerRecYds: 21.3, pctCareerRecTDs: 27.8, tgtPerRR: 25.0, firstDownTDPerRR: 0.13, recGrade: 72.7 },
    redZone: { yprr: 1.28, routesRun: 136, targets: 33, pctCareerRecYds: 6.8, pctCareerRecTDs: 66.7, tgtPerRR: 24.3, firstDownTDPerRR: 0.21, recGrade: 69.7 },
    press: { yprr: 2.09, routesRun: 661, targets: 160, pctCareerRecYds: 53.8, pctCareerRecTDs: 66.7, tgtPerRR: 24.2, firstDownTDPerRR: 0.13, recGrade: 79.7 },
    zone: { yprr: 2.39, routesRun: 773, targets: 177, pctCareerRecYds: 71.9, pctCareerRecTDs: 38.9, tgtPerRR: 22.9, firstDownTDPerRR: 0.12, recGrade: 81.2 },
  },
  "Kobe Prentice": {
    overall: { yprr: 2.26, routesRun: 514, targets: 119, recYds: 1160, recTDs: 11, tgtPerRR: 23.2, firstDownTDPerRR: 0.11, recGrade: 78.5 },
    lateDown: { yprr: 2.58, routesRun: 166, targets: 28, pctCareerRecYds: 37.0, pctCareerRecTDs: 63.6, tgtPerRR: 16.9, firstDownTDPerRR: 0.13, recGrade: 73.4 },
    deepBall: { yprr: 21.38, targets: 21, receptions: 11, pctCareerRecYds: 38.7, pctCareerRecTDs: 54.5, adot: 33.0, contestedCatchRate: 100.0, recGrade: 89.8 },
    screen: { yprr: 2.17, routesRun: 60, targets: 30, pctCareerRecYds: 11.2, pctCareerRecTDs: 9.1, tgtPerRR: 50.0, firstDownTDPerRR: 0.06, recGrade: 73.6 },
    press: { yprr: 2.47, routesRun: 340, targets: 77, pctCareerRecYds: 72.3, pctCareerRecTDs: 72.7, tgtPerRR: 22.7, firstDownTDPerRR: 0.11, recGrade: 79 },
    zone: { yprr: 2.65, routesRun: 350, targets: 91, pctCareerRecYds: 80, pctCareerRecTDs: 81.8, tgtPerRR: 26, firstDownTDPerRR: 0.12, recGrade: 80.3 },
  },
  "Ted Hurst": {
    overall: { yprr: 2.25, routesRun: 873, targets: 224, recYds: 1960, recTDs: 15, tgtPerRR: 25.7, firstDownTDPerRR: 0.12, recGrade: 82.3 },
    lateDown: { yprr: 1.92, routesRun: 281, targets: 77, pctCareerRecYds: 27.6, pctCareerRecTDs: 33.3, tgtPerRR: 27.4, firstDownTDPerRR: 0.14, recGrade: 76.2 },
    deepBall: { yprr: 14.27, targets: 64, receptions: 27, pctCareerRecYds: 46.6, pctCareerRecTDs: 40.0, adot: 31.1, contestedCatchRate: 59.1, recGrade: 97.6 },
    redZone: { yprr: 0.95, routesRun: 101, targets: 30, pctCareerRecYds: 4.9, pctCareerRecTDs: 60.0, tgtPerRR: 29.7, firstDownTDPerRR: 0.19, recGrade: 77.2 },
    press: { yprr: 2.61, routesRun: 449, targets: 140, pctCareerRecYds: 59.7, pctCareerRecTDs: 86.7, tgtPerRR: 31.2, firstDownTDPerRR: 0.15, recGrade: 85.2 },
    zone: { yprr: 2.47, routesRun: 593, targets: 147, pctCareerRecYds: 74.6, pctCareerRecTDs: 40, tgtPerRR: 24.8, firstDownTDPerRR: 0.12, recGrade: 80.1 },
  },
  "Brenen Thompson": {
    overall: { yprr: 2.21, routesRun: 706, targets: 140, recYds: 1557, recTDs: 10, tgtPerRR: 19.8, firstDownTDPerRR: 0.09, recGrade: 74.7 },
    lateDown: { yprr: 1.88, routesRun: 212, targets: 35, pctCareerRecYds: 25.6, pctCareerRecTDs: 30.0, tgtPerRR: 16.5, firstDownTDPerRR: 0.10, recGrade: 69.9 },
    deepBall: { yprr: 18.00, targets: 43, receptions: 17, pctCareerRecYds: 49.7, pctCareerRecTDs: 80.0, adot: 41.4, contestedCatchRate: 20.0, recGrade: 93.8 },
    press: { yprr: 1.92, routesRun: 386, targets: 65, pctCareerRecYds: 47.6, pctCareerRecTDs: 40, tgtPerRR: 16.8, firstDownTDPerRR: 0.08, recGrade: 70.1 },
    zone: { yprr: 2.32, routesRun: 451, targets: 96, pctCareerRecYds: 67.3, pctCareerRecTDs: 40, tgtPerRR: 21.3, firstDownTDPerRR: 0.1, recGrade: 74 },
  },
  "Caullin Lacy": {
    overall: { yprr: 2.17, routesRun: 1356, targets: 317, recYds: 2949, recTDs: 16, tgtPerRR: 23.4, firstDownTDPerRR: 0.10, recGrade: 82.6 },
    lateDown: { yprr: 2.38, routesRun: 406, targets: 93, pctCareerRecYds: 32.8, pctCareerRecTDs: 37.5, tgtPerRR: 22.9, firstDownTDPerRR: 0.11, recGrade: 77.8 },
    deepBall: { yprr: 17.22, targets: 54, receptions: 25, pctCareerRecYds: 31.5, pctCareerRecTDs: 43.8, adot: 30.0, contestedCatchRate: 33.3, recGrade: 93.8 },
    screen: { yprr: 3.25, routesRun: 229, targets: 85, pctCareerRecYds: 25.2, pctCareerRecTDs: 18.8, tgtPerRR: 37.1, firstDownTDPerRR: 0.05, recGrade: 88.9 },
    press: { yprr: 2.29, routesRun: 720, targets: 173, pctCareerRecYds: 55.9, pctCareerRecTDs: 62.5, tgtPerRR: 24, firstDownTDPerRR: 0.11, recGrade: 78.4 },
    zone: { yprr: 2.13, routesRun: 992, targets: 226, pctCareerRecYds: 71.6, pctCareerRecTDs: 50, tgtPerRR: 22.8, firstDownTDPerRR: 0.1, recGrade: 83.1 },
  },
  "Jeff Caldwell": {
    overall: { yprr: 2.16, routesRun: 221, targets: 58, recYds: 478, recTDs: 6, tgtPerRR: 26.2, firstDownTDPerRR: 0.14, recGrade: 71.5 },
    redZone: { yprr: 2.27, routesRun: 30, targets: 10, pctCareerRecYds: 14.2, pctCareerRecTDs: 83.3, tgtPerRR: 33.3, firstDownTDPerRR: 0.33, recGrade: 67.7 },
    zone: { yprr: 2.3, routesRun: 127, targets: 28, pctCareerRecYds: 61.1, pctCareerRecTDs: 33.3, tgtPerRR: 22.1, firstDownTDPerRR: 0.13, recGrade: 71.1 },
  },
  "Skyler Bell": {
    overall: { yprr: 2.15, routesRun: 1336, targets: 346, recYds: 2879, recTDs: 24, tgtPerRR: 25.9, firstDownTDPerRR: 0.10, recGrade: 75.3 },
    lateDown: { yprr: 1.81, routesRun: 430, targets: 101, pctCareerRecYds: 27.0, pctCareerRecTDs: 29.2, tgtPerRR: 23.5, firstDownTDPerRR: 0.10, recGrade: 67.4 },
    screen: { yprr: 2.35, routesRun: 167, targets: 59, pctCareerRecYds: 13.6, pctCareerRecTDs: 8.3, tgtPerRR: 35.3, firstDownTDPerRR: 0.04, recGrade: 73.1 },
    redZone: { yprr: 1.39, routesRun: 154, targets: 36, pctCareerRecYds: 7.4, pctCareerRecTDs: 50.0, tgtPerRR: 23.4, firstDownTDPerRR: 0.18, recGrade: 68.2 },
    press: { yprr: 2.04, routesRun: 801, targets: 211, pctCareerRecYds: 56.8, pctCareerRecTDs: 54.2, tgtPerRR: 26.3, firstDownTDPerRR: 0.1, recGrade: 70.4 },
    zone: { yprr: 2.3, routesRun: 817, targets: 205, pctCareerRecYds: 65.4, pctCareerRecTDs: 50, tgtPerRR: 25.1, firstDownTDPerRR: 0.1, recGrade: 76.7 },
  },
  "Amare Thomas": {
    overall: { yprr: 2.15, routesRun: 969, targets: 261, recYds: 2088, recTDs: 23, tgtPerRR: 26.9, firstDownTDPerRR: 0.13, recGrade: 81.1 },
    lateDown: { yprr: 2.33, routesRun: 311, targets: 85, pctCareerRecYds: 34.8, pctCareerRecTDs: 39.1, tgtPerRR: 27.3, firstDownTDPerRR: 0.16, recGrade: 81.1 },
    deepBall: { yprr: 17.81, targets: 27, receptions: 14, pctCareerRecYds: 23.0, pctCareerRecTDs: 17.4, adot: 26.9, contestedCatchRate: 50.0, recGrade: 87.3 },
    screen: { yprr: 2.62, routesRun: 151, targets: 63, pctCareerRecYds: 19.0, pctCareerRecTDs: 13.0, tgtPerRR: 41.7, firstDownTDPerRR: 0.05, recGrade: 78.6 },
    redZone: { yprr: 1.63, routesRun: 109, targets: 36, pctCareerRecYds: 8.5, pctCareerRecTDs: 65.2, tgtPerRR: 33.0, firstDownTDPerRR: 0.29, recGrade: 80.3 },
    press: { yprr: 2.27, routesRun: 512, targets: 142, pctCareerRecYds: 55.7, pctCareerRecTDs: 69.6, tgtPerRR: 27.7, firstDownTDPerRR: 0.15, recGrade: 79.6 },
    zone: { yprr: 2, routesRun: 636, targets: 163, pctCareerRecYds: 61, pctCareerRecTDs: 26.1, tgtPerRR: 25.6, firstDownTDPerRR: 0.1, recGrade: 72.7 },
  },
  "CJ Daniels": {
    overall: { yprr: 2.14, routesRun: 1000, targets: 210, recYds: 2139, recTDs: 18, tgtPerRR: 21.0, firstDownTDPerRR: 0.11, recGrade: 81.3 },
    lateDown: { yprr: 2.18, routesRun: 296, targets: 58, pctCareerRecYds: 30.2, pctCareerRecTDs: 38.9, tgtPerRR: 19.6, firstDownTDPerRR: 0.14, recGrade: 76.9 },
    deepBall: { yprr: 17.17, targets: 53, receptions: 26, pctCareerRecYds: 42.5, pctCareerRecTDs: 66.7, adot: 31.8, contestedCatchRate: 72.7, recGrade: 93.2 },
    press: { yprr: 2.14, routesRun: 634, targets: 134, pctCareerRecYds: 63.5, pctCareerRecTDs: 66.7, tgtPerRR: 21.1, firstDownTDPerRR: 0.12, recGrade: 77.5 },
    zone: { yprr: 2.29, routesRun: 699, targets: 143, pctCareerRecYds: 75, pctCareerRecTDs: 50, tgtPerRR: 20.5, firstDownTDPerRR: 0.11, recGrade: 79 },
  },
  "Kevin Coleman Jr.": {
    overall: { yprr: 2.14, routesRun: 951, targets: 223, recYds: 2039, recTDs: 9, tgtPerRR: 23.4, firstDownTDPerRR: 0.11, recGrade: 82.7 },
    lateDown: { yprr: 1.86, routesRun: 291, targets: 69, pctCareerRecYds: 26.6, pctCareerRecTDs: 44.4, tgtPerRR: 23.7, firstDownTDPerRR: 0.13, recGrade: 75.1 },
    screen: { yprr: 3.70, routesRun: 108, targets: 55, pctCareerRecYds: 19.6, pctCareerRecTDs: 33.3, tgtPerRR: 50.9, firstDownTDPerRR: 0.05, recGrade: 87.7 },
    press: { yprr: 2.06, routesRun: 601, targets: 138, pctCareerRecYds: 60.7, pctCareerRecTDs: 88.9, tgtPerRR: 23, firstDownTDPerRR: 0.11, recGrade: 76.2 },
    zone: { yprr: 1.97, routesRun: 580, targets: 139, pctCareerRecYds: 56.2, pctCareerRecTDs: 22.2, tgtPerRR: 24, firstDownTDPerRR: 0.1, recGrade: 80.3 },
  },
  "Squirrel White": {
    overall: { yprr: 2.11, routesRun: 809, targets: 206, recYds: 1711, recTDs: 6, tgtPerRR: 25.5, firstDownTDPerRR: 0.09, recGrade: 71.1 },
    lateDown: { yprr: 1.65, routesRun: 211, targets: 49, pctCareerRecYds: 20.4, pctCareerRecTDs: 50.0, tgtPerRR: 23.2, firstDownTDPerRR: 0.09, recGrade: 61.4 },
    deepBall: { yprr: 16.54, targets: 41, receptions: 14, pctCareerRecYds: 39.6, pctCareerRecTDs: 83.3, adot: 40.1, contestedCatchRate: 28.6, recGrade: 87.8 },
    screen: { yprr: 2.12, routesRun: 190, targets: 71, pctCareerRecYds: 23.5, pctCareerRecTDs: 16.7, tgtPerRR: 37.4, firstDownTDPerRR: 0.05, recGrade: 71.0 },
    press: { yprr: 1.93, routesRun: 409, targets: 98, pctCareerRecYds: 46.1, pctCareerRecTDs: 33.3, tgtPerRR: 24, firstDownTDPerRR: 0.09, recGrade: 69.4 },
    zone: { yprr: 2.07, routesRun: 530, targets: 129, pctCareerRecYds: 64, pctCareerRecTDs: 66.7, tgtPerRR: 24.3, firstDownTDPerRR: 0.09, recGrade: 70.4 },
  },
  "Hank Beatty": {
    overall: { yprr: 2.09, routesRun: 597, targets: 138, recYds: 1245, recTDs: 4, tgtPerRR: 23.1, firstDownTDPerRR: 0.10, recGrade: 77.6 },
    deepBall: { yprr: 16.13, targets: 16, receptions: 7, pctCareerRecYds: 20.7, pctCareerRecTDs: 0.0, adot: 26.4, contestedCatchRate: 0.0, recGrade: 73.1 },
    screen: { yprr: 1.67, routesRun: 97, targets: 33, pctCareerRecYds: 13.0, pctCareerRecTDs: 0.0, tgtPerRR: 34.0, firstDownTDPerRR: 0.02, recGrade: 66.3 },
    press: { yprr: 1.86, routesRun: 370, targets: 82, pctCareerRecYds: 55.2, pctCareerRecTDs: 75, tgtPerRR: 22.2, firstDownTDPerRR: 0.1, recGrade: 72.2 },
    zone: { yprr: 2.21, routesRun: 396, targets: 88, pctCareerRecYds: 70.4, pctCareerRecTDs: 25, tgtPerRR: 22.2, firstDownTDPerRR: 0.09, recGrade: 75.4 },
  },
  "Chris Brazzell II": {
    overall: { yprr: 2.09, routesRun: 986, targets: 215, recYds: 2061, recTDs: 16, tgtPerRR: 21.8, firstDownTDPerRR: 0.12, recGrade: 78.0 },
    lateDown: { yprr: 1.84, routesRun: 274, targets: 57, pctCareerRecYds: 24.4, pctCareerRecTDs: 31.3, tgtPerRR: 20.8, firstDownTDPerRR: 0.13, recGrade: 72.4 },
    deepBall: { yprr: 16.05, targets: 55, receptions: 24, pctCareerRecYds: 42.8, pctCareerRecTDs: 50.0, adot: 34.6, contestedCatchRate: 58.3, recGrade: 89.9 },
    redZone: { yprr: 0.97, routesRun: 130, targets: 32, pctCareerRecYds: 6.1, pctCareerRecTDs: 62.5, tgtPerRR: 24.6, firstDownTDPerRR: 0.17, recGrade: 68.0 },
    press: { yprr: 2.19, routesRun: 447, targets: 100, pctCareerRecYds: 47.4, pctCareerRecTDs: 75, tgtPerRR: 22.4, firstDownTDPerRR: 0.13, recGrade: 76.8 },
    zone: { yprr: 2.12, routesRun: 690, targets: 145, pctCareerRecYds: 71, pctCareerRecTDs: 37.5, tgtPerRR: 21, firstDownTDPerRR: 0.11, recGrade: 76.5 },
  },
  "Emmanuel Henderson Jr.": {
    overall: { yprr: 2.08, routesRun: 414, targets: 79, recYds: 862, recTDs: 5, tgtPerRR: 19.1, firstDownTDPerRR: 0.09, recGrade: 70.0 },
    deepBall: { yprr: 14.91, targets: 32, receptions: 13, pctCareerRecYds: 55.3, pctCareerRecTDs: 60.0, adot: 29.9, contestedCatchRate: 57.1, recGrade: 91.1 },
    press: { yprr: 1.91, routesRun: 211, targets: 42, pctCareerRecYds: 46.8, pctCareerRecTDs: 40, tgtPerRR: 19.9, firstDownTDPerRR: 0.08, recGrade: 64.4 },
  },
  "Cyrus Allen": {
    overall: { yprr: 2.07, routesRun: 1072, targets: 227, recYds: 2214, recTDs: 21, tgtPerRR: 21.2, firstDownTDPerRR: 0.10, recGrade: 73.6 },
    deepBall: { yprr: 16.81, targets: 68, receptions: 30, pctCareerRecYds: 51.6, pctCareerRecTDs: 66.7, adot: 31.6, contestedCatchRate: 52.4, recGrade: 93.5 },
    redZone: { yprr: 0.89, routesRun: 115, targets: 29, pctCareerRecYds: 4.6, pctCareerRecTDs: 42.9, tgtPerRR: 25.2, firstDownTDPerRR: 0.17, recGrade: 64.1 },
    press: { yprr: 1.91, routesRun: 654, targets: 142, pctCareerRecYds: 56.3, pctCareerRecTDs: 66.7, tgtPerRR: 21.7, firstDownTDPerRR: 0.11, recGrade: 71.7 },
    zone: { yprr: 2.04, routesRun: 705, targets: 142, pctCareerRecYds: 64.9, pctCareerRecTDs: 28.6, tgtPerRR: 20.1, firstDownTDPerRR: 0.08, recGrade: 68.8 },
  },
  "Aaron Anderson": {
    overall: { yprr: 2.06, routesRun: 645, targets: 154, recYds: 1331, recTDs: 5, tgtPerRR: 23.9, firstDownTDPerRR: 0.10, recGrade: 72.9 },
    lateDown: { yprr: 1.99, routesRun: 199, targets: 44, pctCareerRecYds: 29.8, pctCareerRecTDs: 60.0, tgtPerRR: 22.1, firstDownTDPerRR: 0.14, recGrade: 72.9 },
    deepBall: { yprr: 14.22, targets: 27, receptions: 13, pctCareerRecYds: 28.9, pctCareerRecTDs: 60.0, adot: 25.9, contestedCatchRate: 57.1, recGrade: 76.7 },
    screen: { yprr: 2.77, routesRun: 81, targets: 42, pctCareerRecYds: 16.8, pctCareerRecTDs: 0.0, tgtPerRR: 51.8, firstDownTDPerRR: 0.03, recGrade: 71.3 },
    press: { yprr: 2.41, routesRun: 445, targets: 109, pctCareerRecYds: 80.7, pctCareerRecTDs: 80, tgtPerRR: 24.5, firstDownTDPerRR: 0.12, recGrade: 76.4 },
    zone: { yprr: 2.14, routesRun: 460, targets: 107, pctCareerRecYds: 73.9, pctCareerRecTDs: 60, tgtPerRR: 23.3, firstDownTDPerRR: 0.09, recGrade: 71.7 },
  },
  "KC Concepcion": {
    overall: { yprr: 2.03, routesRun: 1096, targets: 294, recYds: 2224, recTDs: 25, tgtPerRR: 26.8, firstDownTDPerRR: 0.12, recGrade: 77.8 },
    lateDown: { yprr: 1.78, routesRun: 319, targets: 71, pctCareerRecYds: 25.5, pctCareerRecTDs: 48.0, tgtPerRR: 22.3, firstDownTDPerRR: 0.14, recGrade: 71.6 },
    screen: { yprr: 2.40, routesRun: 142, targets: 59, pctCareerRecYds: 15.3, pctCareerRecTDs: 12.0, tgtPerRR: 41.5, firstDownTDPerRR: 0.05, recGrade: 72.9 },
    redZone: { yprr: 1.67, routesRun: 135, targets: 47, pctCareerRecYds: 10.2, pctCareerRecTDs: 72.0, tgtPerRR: 34.8, firstDownTDPerRR: 0.28, recGrade: 73.2 },
    press: { yprr: 2.07, routesRun: 680, targets: 183, pctCareerRecYds: 63.2, pctCareerRecTDs: 64, tgtPerRR: 26.9, firstDownTDPerRR: 0.12, recGrade: 74.7 },
  },
  "Zachariah Branch": {
    overall: { yprr: 2.03, routesRun: 806, targets: 211, recYds: 1634, recTDs: 9, tgtPerRR: 26.2, firstDownTDPerRR: 0.11, recGrade: 79.4 },
    lateDown: { yprr: 2.41, routesRun: 223, targets: 53, pctCareerRecYds: 32.9, pctCareerRecTDs: 33.3, tgtPerRR: 23.8, firstDownTDPerRR: 0.14, recGrade: 73.6 },
    screen: { yprr: 3.41, routesRun: 172, targets: 91, pctCareerRecYds: 35.9, pctCareerRecTDs: 55.6, tgtPerRR: 52.9, firstDownTDPerRR: 0.06, recGrade: 89.4 },
    press: { yprr: 1.83, routesRun: 536, targets: 128, pctCareerRecYds: 60, pctCareerRecTDs: 44.4, tgtPerRR: 23.9, firstDownTDPerRR: 0.1, recGrade: 73.4 },
  },
  "Denzel Boston": {
    overall: { yprr: 2.02, routesRun: 881, targets: 204, recYds: 1781, recTDs: 20, tgtPerRR: 23.2, firstDownTDPerRR: 0.14, recGrade: 85.8 },
    lateDown: { yprr: 1.67, routesRun: 235, targets: 59, pctCareerRecYds: 22.0, pctCareerRecTDs: 20.0, tgtPerRR: 25.1, firstDownTDPerRR: 0.13, recGrade: 77.0 },
    redZone: { yprr: 1.19, routesRun: 121, targets: 33, pctCareerRecYds: 8.1, pctCareerRecTDs: 70.0, tgtPerRR: 27.3, firstDownTDPerRR: 0.25, recGrade: 76.9 },
    press: { yprr: 1.94, routesRun: 554, targets: 131, pctCareerRecYds: 60.3, pctCareerRecTDs: 85, tgtPerRR: 23.6, firstDownTDPerRR: 0.15, recGrade: 83.7 },
    zone: { yprr: 1.99, routesRun: 586, targets: 122, pctCareerRecYds: 65.6, pctCareerRecTDs: 25, tgtPerRR: 20.8, firstDownTDPerRR: 0.1, recGrade: 76 },
  },
  "Malachi Fields": {
    overall: { yprr: 2.01, routesRun: 1146, targets: 263, recYds: 2307, recTDs: 16, tgtPerRR: 22.9, firstDownTDPerRR: 0.11, recGrade: 81.5 },
    lateDown: { yprr: 1.91, routesRun: 336, targets: 83, pctCareerRecYds: 27.8, pctCareerRecTDs: 37.5, tgtPerRR: 24.7, firstDownTDPerRR: 0.13, recGrade: 74.4 },
    zone: { yprr: 2.19, routesRun: 701, targets: 153, pctCareerRecYds: 66.7, pctCareerRecTDs: 37.5, tgtPerRR: 21.8, firstDownTDPerRR: 0.1, recGrade: 80.7 },
  },
  "Chris Bell": {
    overall: { yprr: 2.01, routesRun: 1078, targets: 223, recYds: 2166, recTDs: 12, tgtPerRR: 20.7, firstDownTDPerRR: 0.10, recGrade: 77.4 },
    lateDown: { yprr: 1.62, routesRun: 300, targets: 56, pctCareerRecYds: 22.4, pctCareerRecTDs: 33.3, tgtPerRR: 18.7, firstDownTDPerRR: 0.10, recGrade: 70.5 },
    press: { yprr: 2.12, routesRun: 733, targets: 156, pctCareerRecYds: 71.9, pctCareerRecTDs: 91.7, tgtPerRR: 21.3, firstDownTDPerRR: 0.11, recGrade: 78.7 },
    zone: { yprr: 1.94, routesRun: 698, targets: 129, pctCareerRecYds: 62.4, pctCareerRecTDs: 50, tgtPerRR: 18.5, firstDownTDPerRR: 0.09, recGrade: 73.4 },
  },
  "Antonio Williams": {
    overall: { yprr: 1.97, routesRun: 1181, targets: 275, recYds: 2331, recTDs: 21, tgtPerRR: 23.3, firstDownTDPerRR: 0.11, recGrade: 80.4 },
    lateDown: { yprr: 1.97, routesRun: 326, targets: 77, pctCareerRecYds: 27.5, pctCareerRecTDs: 19.0, tgtPerRR: 23.6, firstDownTDPerRR: 0.13, recGrade: 77.5 },
    deepBall: { yprr: 17.25, targets: 44, receptions: 23, pctCareerRecYds: 32.6, pctCareerRecTDs: 52.4, adot: 28.7, contestedCatchRate: 54.5, recGrade: 90.8 },
    screen: { yprr: 1.75, routesRun: 185, targets: 64, pctCareerRecYds: 13.9, pctCareerRecTDs: 4.8, tgtPerRR: 34.6, firstDownTDPerRR: 0.05, recGrade: 69.7 },
    redZone: { yprr: 1.29, routesRun: 143, targets: 39, pctCareerRecYds: 7.9, pctCareerRecTDs: 47.6, tgtPerRR: 27.3, firstDownTDPerRR: 0.17, recGrade: 64.8 },
    press: { yprr: 2.09, routesRun: 741, targets: 176, pctCareerRecYds: 66.6, pctCareerRecTDs: 71.4, tgtPerRR: 23.8, firstDownTDPerRR: 0.12, recGrade: 79.5 },
  },
  "De'Zhaun Stribling": {
    overall: { yprr: 1.95, routesRun: 1279, targets: 272, recYds: 2493, recTDs: 18, tgtPerRR: 21.3, firstDownTDPerRR: 0.10, recGrade: 81.1 },
    redZone: { yprr: 1.23, routesRun: 167, targets: 34, pctCareerRecYds: 8.2, pctCareerRecTDs: 61.1, tgtPerRR: 20.4, firstDownTDPerRR: 0.16, recGrade: 71.2 },
    zone: { yprr: 2.20, routesRun: 815, targets: 170, pctCareerRecYds: 72.0, pctCareerRecTDs: 61.1, tgtPerRR: 20.9, firstDownTDPerRR: 0.11, recGrade: 82.0 },
  },
  "Ja'Kobi Lane": {
    overall: { yprr: 1.95, routesRun: 702, targets: 149, recYds: 1368, recTDs: 18, tgtPerRR: 21.2, firstDownTDPerRR: 0.13, recGrade: 81.0 },
    lateDown: { yprr: 2.74, routesRun: 189, targets: 50, pctCareerRecYds: 37.8, pctCareerRecTDs: 33.3, tgtPerRR: 26.5, firstDownTDPerRR: 0.18, recGrade: 83.7 },
    deepBall: { yprr: 15.85, targets: 27, receptions: 12, pctCareerRecYds: 31.3, pctCareerRecTDs: 33.3, adot: 27.9, contestedCatchRate: 40.0, recGrade: 80.9 },
    redZone: { yprr: 1.77, routesRun: 105, targets: 30, pctCareerRecYds: 13.6, pctCareerRecTDs: 66.7, tgtPerRR: 28.6, firstDownTDPerRR: 0.29, recGrade: 89.1 },
    press: { yprr: 2.18, routesRun: 485, targets: 114, pctCareerRecYds: 77.2, pctCareerRecTDs: 88.9, tgtPerRR: 23.5, firstDownTDPerRR: 0.15, recGrade: 84.4 },
  },
  "Jordan Hudson": {
    overall: { yprr: 1.93, routesRun: 934, targets: 221, recYds: 1804, recTDs: 21, tgtPerRR: 23.7, firstDownTDPerRR: 0.11, recGrade: 76.0 },
    screen: { yprr: 1.44, routesRun: 189, targets: 51, pctCareerRecYds: 15.1, pctCareerRecTDs: 9.5, tgtPerRR: 27.0, firstDownTDPerRR: 0.05, recGrade: 64.9 },
    redZone: { yprr: 1.35, routesRun: 104, targets: 30, pctCareerRecYds: 7.8, pctCareerRecTDs: 52.4, tgtPerRR: 28.8, firstDownTDPerRR: 0.22, recGrade: 72.0 },
  },
  "Devin Voisin": {
    overall: { yprr: 1.92, routesRun: 1107, targets: 243, recYds: 2130, recTDs: 10, tgtPerRR: 21.9, firstDownTDPerRR: 0.10, recGrade: 76.4 },
    lateDown: { yprr: 1.78, routesRun: 324, targets: 64, pctCareerRecYds: 27.1, pctCareerRecTDs: 50.0, tgtPerRR: 19.8, firstDownTDPerRR: 0.12, recGrade: 72.3 },
    zone: { yprr: 2.01, routesRun: 839, targets: 189, pctCareerRecYds: 79.2, pctCareerRecTDs: 60, tgtPerRR: 22.5, firstDownTDPerRR: 0.1, recGrade: 75.7 },
  },
  "Lewis Bond": {
    overall: { yprr: 1.92, routesRun: 1237, targets: 287, recYds: 2380, recTDs: 11, tgtPerRR: 23.2, firstDownTDPerRR: 0.10, recGrade: 79.3 },
    lateDown: { yprr: 1.80, routesRun: 405, targets: 91, pctCareerRecYds: 30.6, pctCareerRecTDs: 36.4, tgtPerRR: 22.5, firstDownTDPerRR: 0.12, recGrade: 76.2 },
    screen: { yprr: 2.46, routesRun: 154, targets: 57, pctCareerRecYds: 15.9, pctCareerRecTDs: 9.1, tgtPerRR: 37.0, firstDownTDPerRR: 0.04, recGrade: 73.7 },
    zone: { yprr: 2.04, routesRun: 825, targets: 191, pctCareerRecYds: 70.8, pctCareerRecTDs: 54.5, tgtPerRR: 23.2, firstDownTDPerRR: 0.1, recGrade: 76.6 },
  },
  "RaRa Thomas": {
    overall: { yprr: 1.91, routesRun: 852, targets: 176, recYds: 1626, recTDs: 13, tgtPerRR: 20.7, firstDownTDPerRR: 0.10, recGrade: 71.9 },
    deepBall: { yprr: 16.56, targets: 34, receptions: 14, pctCareerRecYds: 34.6, pctCareerRecTDs: 46.2, adot: 32.1, contestedCatchRate: 53.3, recGrade: 89.1 },
    redZone: { yprr: 1.22, routesRun: 89, targets: 25, pctCareerRecYds: 6.7, pctCareerRecTDs: 38.5, tgtPerRR: 28.1, firstDownTDPerRR: 0.16, recGrade: 62.0 },
    press: { yprr: 2.18, routesRun: 505, targets: 108, pctCareerRecYds: 67.8, pctCareerRecTDs: 84.6, tgtPerRR: 21.4, firstDownTDPerRR: 0.11, recGrade: 73.7 },
  },
  "Barion Brown": {
    overall: { yprr: 1.91, routesRun: 1078, targets: 296, recYds: 2063, recTDs: 12, tgtPerRR: 27.5, firstDownTDPerRR: 0.09, recGrade: 70.1 },
    lateDown: { yprr: 1.72, routesRun: 352, targets: 66, pctCareerRecYds: 29.4, pctCareerRecTDs: 33.3, tgtPerRR: 18.8, firstDownTDPerRR: 0.08, recGrade: 64.8 },
    screen: { yprr: 2.28, routesRun: 162, targets: 75, pctCareerRecYds: 17.9, pctCareerRecTDs: 16.7, tgtPerRR: 46.3, firstDownTDPerRR: 0.05, recGrade: 70.8 },
    redZone: { yprr: 1.11, routesRun: 118, targets: 32, pctCareerRecYds: 6.3, pctCareerRecTDs: 75.0, tgtPerRR: 27.1, firstDownTDPerRR: 0.16, recGrade: 63.3 },
    press: { yprr: 1.98, routesRun: 592, targets: 159, pctCareerRecYds: 57, pctCareerRecTDs: 41.7, tgtPerRR: 26.9, firstDownTDPerRR: 0.1, recGrade: 69.7 },
  },
  "Christian Leary": {
    overall: { yprr: 1.90, routesRun: 241, targets: 60, recYds: 459, recTDs: 2, tgtPerRR: 24.9, firstDownTDPerRR: 0.10, recGrade: 73.2 },
    screen: { yprr: 2.38, routesRun: 40, targets: 18, pctCareerRecYds: 20.7, pctCareerRecTDs: 0.0, tgtPerRR: 45.0, firstDownTDPerRR: 0.05, recGrade: 74.1 },
    press: { yprr: 1.89, routesRun: 111, targets: 28, pctCareerRecYds: 45.8, pctCareerRecTDs: 100, tgtPerRR: 25.2, firstDownTDPerRR: 0.1, recGrade: 67 },
    zone: { yprr: 2.3, routesRun: 165, targets: 46, pctCareerRecYds: 82.6, pctCareerRecTDs: 50, tgtPerRR: 27.9, firstDownTDPerRR: 0.12, recGrade: 78.4 },
  },
  "Germie Bernard": {
    overall: { yprr: 1.90, routesRun: 1167, targets: 232, recYds: 2214, recTDs: 13, tgtPerRR: 19.9, firstDownTDPerRR: 0.10, recGrade: 80.2 },
    screen: { yprr: 1.70, routesRun: 174, targets: 42, pctCareerRecYds: 13.4, pctCareerRecTDs: 23.1, tgtPerRR: 24.1, firstDownTDPerRR: 0.06, recGrade: 72.5 },
    zone: { yprr: 2.02, routesRun: 806, targets: 150, pctCareerRecYds: 73.4, pctCareerRecTDs: 46.2, tgtPerRR: 18.6, firstDownTDPerRR: 0.1, recGrade: 79.2 },
  },
};

// Helper to look up perspective data by player name (case-insensitive)
export const getReceivingData = (playerName) => {
  const entry = Object.entries(receivingPerspectiveData).find(
    ([name]) => name.toLowerCase() === playerName.toLowerCase()
  );
  return entry ? entry[1] : null;
};
