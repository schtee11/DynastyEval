const express = require('express');
const pool = require('../db/pool');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/discussions?player_id=X — list discussions for a player
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { player_id, sort = 'new', limit = 20, offset = 0 } = req.query;

    let orderBy = 'created_at DESC';
    if (sort === 'top') orderBy = 'upvote_count DESC, created_at DESC';
    if (sort === 'hot') orderBy = '(upvote_count + comment_count) DESC, created_at DESC';

    let query = `
      SELECT d.*, u.username, u.avatar_url
      FROM discussions d
      LEFT JOIN users u ON d.author_id = u.id
    `;
    const params = [];

    if (player_id) {
      params.push(player_id);
      query += ` WHERE d.player_id = $${params.length}`;
    }

    query += ` ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    // If user is logged in, fetch their votes
    let userVotes = {};
    if (req.user) {
      const voteResult = await pool.query(
        `SELECT votable_id, direction FROM votes
         WHERE user_id = $1 AND votable_type = 'discussion'
         AND votable_id = ANY($2::int[])`,
        [req.user.id, result.rows.map(r => r.id)]
      );
      for (const v of voteResult.rows) {
        userVotes[v.votable_id] = v.direction;
      }
    }

    res.json({
      discussions: result.rows.map(d => ({ ...d, userVote: userVotes[d.id] || 0 })),
    });
  } catch (err) {
    console.error('[Discussions] List error:', err.message);
    res.status(500).json({ error: 'Failed to fetch discussions' });
  }
});

// POST /api/discussions — create a discussion
router.post('/', requireAuth, async (req, res) => {
  try {
    const { player_id, title, content, url } = req.body;

    if (!player_id || !title) {
      return res.status(400).json({ error: 'player_id and title are required' });
    }
    if (title.length > 300) {
      return res.status(400).json({ error: 'Title must be under 300 characters' });
    }

    const result = await pool.query(
      `INSERT INTO discussions (player_id, author_id, title, content, url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [player_id, req.user.id, title.trim(), content?.trim() || null, url?.trim() || null]
    );

    res.status(201).json({ discussion: result.rows[0] });
  } catch (err) {
    console.error('[Discussions] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create discussion' });
  }
});

// GET /api/discussions/:id — get discussion with comments
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const dResult = await pool.query(
      `SELECT d.*, u.username, u.avatar_url
       FROM discussions d LEFT JOIN users u ON d.author_id = u.id
       WHERE d.id = $1`,
      [id]
    );

    if (dResult.rows.length === 0) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    const cResult = await pool.query(
      `SELECT c.*, u.username, u.avatar_url
       FROM comments c LEFT JOIN users u ON c.author_id = u.id
       WHERE c.discussion_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );

    res.json({
      discussion: dResult.rows[0],
      comments: cResult.rows,
    });
  } catch (err) {
    console.error('[Discussions] Get error:', err.message);
    res.status(500).json({ error: 'Failed to fetch discussion' });
  }
});

// POST /api/discussions/:id/comments — add comment
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parent_id } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const result = await pool.query(
      `INSERT INTO comments (discussion_id, author_id, parent_id, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, req.user.id, parent_id || null, content.trim()]
    );

    // Update comment count
    await pool.query(
      'UPDATE discussions SET comment_count = comment_count + 1 WHERE id = $1',
      [id]
    );

    res.status(201).json({ comment: result.rows[0] });
  } catch (err) {
    console.error('[Discussions] Comment error:', err.message);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// POST /api/discussions/:id/vote — upvote/downvote discussion
router.post('/:id/vote', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body; // 1 or -1

    if (direction !== 1 && direction !== -1) {
      return res.status(400).json({ error: 'Direction must be 1 or -1' });
    }

    // Upsert vote
    const existing = await pool.query(
      'SELECT id, direction FROM votes WHERE user_id = $1 AND votable_type = $2 AND votable_id = $3',
      [req.user.id, 'discussion', id]
    );

    if (existing.rows.length > 0) {
      const old = existing.rows[0];
      if (old.direction === direction) {
        // Remove vote (toggle off)
        await pool.query('DELETE FROM votes WHERE id = $1', [old.id]);
        await pool.query(
          'UPDATE discussions SET upvote_count = upvote_count - $1 WHERE id = $2',
          [direction, id]
        );
        return res.json({ vote: 0 });
      } else {
        // Change direction
        await pool.query('UPDATE votes SET direction = $1 WHERE id = $2', [direction, old.id]);
        await pool.query(
          'UPDATE discussions SET upvote_count = upvote_count + $1 WHERE id = $2',
          [direction * 2, id] // swing from -1 to +1 = net +2
        );
        return res.json({ vote: direction });
      }
    }

    // New vote
    await pool.query(
      'INSERT INTO votes (user_id, votable_type, votable_id, direction) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'discussion', id, direction]
    );
    await pool.query(
      'UPDATE discussions SET upvote_count = upvote_count + $1 WHERE id = $2',
      [direction, id]
    );

    res.json({ vote: direction });
  } catch (err) {
    console.error('[Discussions] Vote error:', err.message);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

module.exports = router;
