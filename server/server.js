const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const db = require('./database');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Helper function to promisify database operations
const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// API Routes

// Get retrospective
app.get('/api/retro/:id', async (req, res) => {
  try {
    const retro = await dbGet('SELECT * FROM retrospectives WHERE id = ?', [req.params.id]);
    if (!retro) {
      return res.status(404).json({ error: 'Retrospective not found' });
    }
    res.json(retro);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create retrospective
app.post('/api/retro', async (req, res) => {
  try {
    const { id, name, team, created_by, is_anonymous } = req.body;
    await dbRun(
      'INSERT INTO retrospectives (id, name, team, created_by, is_anonymous) VALUES (?, ?, ?, ?, ?)',
      [id, name, team, created_by, is_anonymous]
    );
    res.json({ id, name, team, created_by, is_anonymous });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cards for retro
app.get('/api/retro/:id/cards', async (req, res) => {
  try {
    const cards = await dbAll(`
      SELECT 
        c.*,
        GROUP_CONCAT(DISTINCT co.id || '|' || co.author || '|' || co.content || '|' || co.created_at, ';;') as comments,
        COUNT(DISTINCT v.id) as votes
      FROM retro_cards c
      LEFT JOIN retro_comments co ON c.id = co.card_id
      LEFT JOIN retro_card_votes v ON c.id = v.card_id
      WHERE c.retro_id = ?
      GROUP BY c.id
      ORDER BY c.created_at
    `, [req.params.id]);

    const processedCards = cards.map(card => ({
      ...card,
      retro_comments: card.comments ? card.comments.split(';;').map(comment => {
        const [id, author, content, created_at] = comment.split('|');
        return { id, author, content, created_at };
      }).filter(c => c.id) : [],
      retro_card_votes: Array(card.votes).fill(null).map((_, i) => ({ id: i }))
    }));

    res.json(processedCards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add card
app.post('/api/retro/:id/cards', async (req, res) => {
  try {
    const { type, content, author } = req.body;
    const cardId = uuidv4();
    await dbRun(
      'INSERT INTO retro_cards (id, retro_id, type, content, author) VALUES (?, ?, ?, ?, ?)',
      [cardId, req.params.id, type, content, author]
    );
    
    const newCard = { id: cardId, retro_id: req.params.id, type, content, author };
    io.emit('card_added', newCard);
    
    res.json(newCard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle vote
app.post('/api/cards/:cardId/vote', async (req, res) => {
  try {
    const { user_id } = req.body;
    const existingVote = await dbGet(
      'SELECT id FROM retro_card_votes WHERE card_id = ? AND user_id = ?',
      [req.params.cardId, user_id]
    );

    if (existingVote) {
      await dbRun('DELETE FROM retro_card_votes WHERE id = ?', [existingVote.id]);
    } else {
      await dbRun(
        'INSERT INTO retro_card_votes (id, card_id, user_id) VALUES (?, ?, ?)',
        [uuidv4(), req.params.cardId, user_id]
      );
    }

    io.emit('vote_changed', { cardId: req.params.cardId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment
app.post('/api/cards/:cardId/comments', async (req, res) => {
  try {
    const { author, content } = req.body;
    const commentId = uuidv4();
    await dbRun(
      'INSERT INTO retro_comments (id, card_id, author, content) VALUES (?, ?, ?, ?)',
      [commentId, req.params.cardId, author, content]
    );

    io.emit('comment_added', { cardId: req.params.cardId });
    res.json({ id: commentId, card_id: req.params.cardId, author, content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get action items
app.get('/api/retro/:id/actions', async (req, res) => {
  try {
    const actions = await dbAll('SELECT * FROM retro_actions WHERE retro_id = ? ORDER BY created_at', [req.params.id]);
    res.json(actions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create action
app.post('/api/retro/:id/actions', async (req, res) => {
  try {
    const { text, assignee, linked_card_id, linked_card_content, linked_card_type } = req.body;
    const actionId = uuidv4();
    await dbRun(
      'INSERT INTO retro_actions (id, retro_id, text, assignee, linked_card_id, linked_card_content, linked_card_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [actionId, req.params.id, text, assignee, linked_card_id, linked_card_content, linked_card_type]
    );

    const newAction = { 
      id: actionId, 
      retro_id: req.params.id, 
      text, 
      assignee, 
      completed: false,
      linked_card_id, 
      linked_card_content, 
      linked_card_type 
    };
    
    io.emit('action_added', newAction);
    res.json(newAction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle action completion
app.put('/api/actions/:id/toggle', async (req, res) => {
  try {
    const action = await dbGet('SELECT completed FROM retro_actions WHERE id = ?', [req.params.id]);
    const newStatus = !action.completed;
    
    await dbRun('UPDATE retro_actions SET completed = ? WHERE id = ?', [newStatus, req.params.id]);
    
    io.emit('action_updated', { id: req.params.id, completed: newStatus });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete action
app.delete('/api/actions/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM retro_actions WHERE id = ?', [req.params.id]);
    io.emit('action_deleted', { id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get card groups
app.get('/api/retro/:id/groups', async (req, res) => {
  try {
    const groups = await dbAll('SELECT * FROM retro_card_groups WHERE retro_id = ? ORDER BY created_at', [req.params.id]);
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_retro', (retroId) => {
    socket.join(retroId);
    console.log(`User ${socket.id} joined retro ${retroId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
