const mysql = require('mysql2/promise');

// ✅ Initial connection (without specifying database)
const connectToServer = async () => {
  try {
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '3572860139Mb*'
    });
    console.log('✅ Connected to MySQL server.');

    // ✅ Ensure database exists
    const databaseName = 'lt_database';
    await db.query(`CREATE DATABASE IF NOT EXISTS ${databaseName}`);
    console.log(`✅ Database "${databaseName}" ensured.`);

    // ✅ Reconnect with the database
    const dbWithDatabase = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '3572860139Mb*',
      database: databaseName
    });
    console.log(`✅ Connected to MySQL database "${databaseName}".`);

    await createTables(dbWithDatabase);
    return dbWithDatabase;
  } catch (err) {
    console.error('❌ Database Connection Failed:', err.message);
  }
};

// ✅ Create Tables in proper order
const createTables = async (db) => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      profile_pic VARCHAR(255) DEFAULT 'http://localhost:5000/uploads/default-profile.png',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_online BOOLEAN DEFAULT 0,
      last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      content TEXT,
      image_paths TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      likes INT DEFAULT 0,
      comments INT DEFAULT 0,
      liked_by JSON,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user1_id INT NOT NULL,
      user2_id INT NOT NULL,
      last_message TEXT,
      last_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (user1_id, user2_id)
    )`,

    `CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      conversation_id INT NOT NULL,
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      message TEXT NOT NULL,
      message_type VARCHAR(50) DEFAULT 'text',
      media_url VARCHAR(255) DEFAULT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_read BOOLEAN DEFAULT 0,
      is_deleted_for_sender BOOLEAN DEFAULT 0,
      is_deleted_for_receiver BOOLEAN DEFAULT 0,
      is_deleted_for_everyone BOOLEAN DEFAULT 0,
      edited BOOLEAN DEFAULT 0,
      reply_to_message_id INT DEFAULT NULL,
      reply_to_sender_id INT DEFAULT NULL,
      reply_to_message TEXT DEFAULT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  ];

  for (const query of queries) {
    try {
      await db.query(query);
      console.log('✅ Table ready.');
    } catch (err) {
      console.error('❌ Error creating table:', err.message);
    }
  }
};

module.exports = connectToServer;
