const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

// ✅ Define database file
const dbPath = path.join(__dirname, "database.db");

// ✅ Check if database exists
const isNewDatabase = !fs.existsSync(dbPath);
if (isNewDatabase) {
  console.log("⚠️ Database not found. Creating a new one...");
} else {
  console.log("✅ Database found: database.db");
}

// ✅ Connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Error connecting to database:", err.message);
  } else {
    console.log("✅ Connected to SQLite database.");
  }
});

// ✅ Create Tables
db.serialize(() => {
  // Users Table
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      profile_pic TEXT DEFAULT 'http://localhost:5000/uploads/default-profile.png',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_online BOOLEAN DEFAULT 0,
      last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) console.error("❌ Error creating users table:", err.message);
      else console.log("✅ Users table is ready.");
    }
  );
  

  // Posts Table
  db.run(
    `CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      content TEXT,
      image_paths TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      liked_by TEXT DEFAULT '[]',
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
    (err) => {
      if (err) console.error("❌ Error creating posts table:", err.message);
      else console.log("✅ Posts table is ready.");
    }
  );

  // Comments Table
  db.run(
    `CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      user_id INTEGER,
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    (err) => {
      if (err) console.error("❌ Error creating comments table:", err.message);
      else console.log("✅ Comments table is ready.");
    }
  );

  // Conversations Table
  db.run(
    `CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1_id INTEGER NOT NULL,
      user2_id INTEGER NOT NULL,
      last_message TEXT DEFAULT '',
      last_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (user1_id, user2_id) -- Prevents duplicate conversations
    )`,
    (err) => {
      if (err) console.error("❌ Error creating conversations table:", err.message);
      else console.log("✅ Conversations table is ready.");
    }
  );  

  // Messages Table
  db.run(
    `CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- Can be 'text', 'image', 'video', 'audio', 'file'
  media_url TEXT DEFAULT NULL, -- Stores the URL/path for media files
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_read INTEGER DEFAULT 0,
  is_deleted_for_sender INTEGER DEFAULT 0, -- 0 = visible, 1 = hidden for sender
  is_deleted_for_receiver INTEGER DEFAULT 0, -- 0 = visible, 1 = hidden for receiver
  is_deleted_for_everyone INTEGER DEFAULT 0,
  edited BOOLEAN DEFAULT 0,
  reply_to_message_id INTEGER DEFAULT NULL,
  reply_to_sender_id INTEGER DEFAULT NULL,
  reply_to_message TEXT DEFAULT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
)`,
    (err) => {
      if (err) console.error("❌ Error creating messages table:", err.message);
      else console.log("✅ Messages table is ready.");
    }
  );   
});

module.exports = db;
