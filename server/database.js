
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create or connect to SQLite database
const dbPath = path.join(__dirname, 'retrodb.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Retrospectives table
  db.run(`CREATE TABLE IF NOT EXISTS retrospectives (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    team TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_anonymous BOOLEAN DEFAULT 1
  )`);

  // Retro cards table
  db.run(`CREATE TABLE IF NOT EXISTS retro_cards (
    id TEXT PRIMARY KEY,
    retro_id TEXT NOT NULL,
    type TEXT NOT NULL,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    group_id TEXT,
    FOREIGN KEY (retro_id) REFERENCES retrospectives (id)
  )`);

  // Card votes table
  db.run(`CREATE TABLE IF NOT EXISTS retro_card_votes (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES retro_cards (id)
  )`);

  // Comments table
  db.run(`CREATE TABLE IF NOT EXISTS retro_comments (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES retro_cards (id)
  )`);

  // Actions table
  db.run(`CREATE TABLE IF NOT EXISTS retro_actions (
    id TEXT PRIMARY KEY,
    retro_id TEXT NOT NULL,
    text TEXT NOT NULL,
    assignee TEXT,
    completed BOOLEAN DEFAULT 0,
    linked_card_id TEXT,
    linked_card_content TEXT,
    linked_card_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (retro_id) REFERENCES retrospectives (id)
  )`);

  // Card groups table
  db.run(`CREATE TABLE IF NOT EXISTS retro_card_groups (
    id TEXT PRIMARY KEY,
    retro_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (retro_id) REFERENCES retrospectives (id)
  )`);
});

module.exports = db;
