/**
 * Feature gating middleware.
 * Checks user's subscription tier before allowing access to premium features.
 *
 * Tiers:
 *   free  — default for all users
 *   pro   — paid tier (unlocks advanced features)
 *
 * Usage: router.get('/premium-route', requireAuth, requireTier('pro'), handler)
 */

const pool = require('../db/pool');

const TIER_FEATURES = {
  free: {
    maxBoards: 2,
    canShareBoards: false,
    canViewAdvancedStats: false,
    canExportData: false,
  },
  pro: {
    maxBoards: 50,
    canShareBoards: true,
    canViewAdvancedStats: true,
    canExportData: true,
  },
};

const getUserTier = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT plan, status, current_period_end FROM subscriptions
       WHERE user_id = $1 AND status = 'active' AND current_period_end > NOW()
       ORDER BY current_period_end DESC LIMIT 1`,
      [userId]
    );
    return result.rows.length > 0 ? result.rows[0].plan : 'free';
  } catch {
    return 'free';
  }
};

const requireTier = (tier) => async (req, res, next) => {
  const userTier = await getUserTier(req.user.id);
  const tierRank = { free: 0, pro: 1 };
  if ((tierRank[userTier] || 0) < (tierRank[tier] || 0)) {
    return res.status(403).json({
      error: 'Upgrade required',
      requiredTier: tier,
      currentTier: userTier,
    });
  }
  req.userTier = userTier;
  next();
};

module.exports = { getUserTier, requireTier, TIER_FEATURES };
