// CSV-to-JS field mappings for each position.
// Keys are the JS property names in collegeStats2025.js.
// Values are the CSV column names.
//
// Nested keys use dot notation: 'passing.YDS' → { passing: { YDS: value } }
// All values are parsed as numbers (floats). Empty/missing → omitted.

module.exports = {
  QB: {
    csvFile: 'passing_summary.csv',
    positionFilter: ['QB'],
    fields: {
      'passing.YDS':      'yards',
      'passing.TD':       'touchdowns',
      'passing.INT':      'interceptions',
      'passing.ATT':      'attempts',
      'passing.COMP':     'completions',
      'passing.PCT':      'completion_percent',
      'pffPassGrade':     'grades_pass',
      'pffOffGrade':      'grades_offense',
      'pffRunGrade':      'grades_run',
      'bttRate':          'btt_rate',
      'twpRate':          'twp_rate',
      'yardsPerAttempt':  'ypa',
      'adot':             'avg_depth_of_target',
      'accuracy':         'accuracy_percent',
      'qbRating':         'qb_rating',
      'sacks':            'sacks',
      'scrambles':        'scrambles',
      'gamesPlayed':      'player_game_count',
    },
    // QB rushing stats come from a second CSV
    rushingCsvFile: 'rushing_summary (1).csv',
    rushingPositionFilter: ['QB'],
    rushingFields: {
      'rushing.YDS':       'yards',
      'rushing.TD':        'touchdowns',
      'rushing.CAR':       'attempts',
    },
  },

  RB: {
    csvFile: 'rushing_summary (1).csv',
    positionFilter: ['HB', 'FB'],
    // RB receiving stats come from a second CSV
    receivingCsvFile: 'receiving_summary.csv',
    receivingPositionFilter: ['HB', 'FB'],
    fields: {
      'rushing.YDS':       'yards',
      'rushing.TD':        'touchdowns',
      'rushing.CAR':       'attempts',
      'pffGrade':          'grades_offense',
      'pffRunGrade':       'grades_run',
      'elusiveRating':     'elusive_rating',
      'yardsAfterContact': 'yards_after_contact',
      'avoidedTackles':    'avoided_tackles',
      'ycoPerAttempt':     'yco_attempt',
      'explosiveRuns':     'explosive',
      'longest':           'longest',
      'gamesPlayed':       'player_game_count',
    },
    receivingFields: {
      'receiving.REC':     'receptions',
      'receiving.YDS':     'yards',
      'receiving.TD':      'touchdowns',
      'receiving.TARGETS': 'targets',
    },
  },

  TE: {
    csvFile: 'receiving_summary.csv',
    positionFilter: ['TE'],
    fields: {
      'receiving.REC':     'receptions',
      'receiving.YDS':     'yards',
      'receiving.TD':      'touchdowns',
      'receiving.TARGETS': 'targets',
      'routesRun':                 'routes',
      'firstDowns':                'first_downs',
      'pffYprr':                   'yprr',
      'yardsAfterCatch':           'yards_after_catch',
      'yardsAfterCatchPerRec':     'yards_after_catch_per_reception',
      'slotRate':                  'slot_rate',
      'wideRate':                  'wide_rate',
      'inlineRate':                'inline_rate',
      'contestedCatchRate':        'contested_catch_rate',
      'contestedReceptions':       'contested_receptions',
      'recGrade':                  'grades_offense',
      'routeGrade':                'grades_pass_route',
      'gamesPlayed':               'player_game_count',
    },
  },

  WR: {
    csvFile: 'receiving_summary.csv',
    positionFilter: ['WR'],
    fields: {
      'receiving.REC':     'receptions',
      'receiving.YDS':     'yards',
      'receiving.TD':      'touchdowns',
      'receiving.TARGETS': 'targets',
      'routesRun':                 'routes',
      'firstDowns':                'first_downs',
      'pffYprr':                   'yprr',
      'yardsAfterCatch':           'yards_after_catch',
      'yardsAfterCatchPerRec':     'yards_after_catch_per_reception',
      'slotRate':                  'slot_rate',
      'wideRate':                  'wide_rate',
      'inlineRate':                'inline_rate',
      'contestedCatchRate':        'contested_catch_rate',
      'contestedReceptions':       'contested_receptions',
      'recGrade':                  'grades_offense',
      'routeGrade':                'grades_pass_route',
      'gamesPlayed':               'player_game_count',
    },
  },
};
