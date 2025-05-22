const dotenv = require("dotenv");
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

dotenv.config();
const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// MySQL Database Connection
const connectToServer = require("./database-mysql");

let db;

(async () => {
  db = await connectToServer(); // <-- Await the connection
  try {
    const [rows] = await db.query("SHOW TABLES");
    console.log("✅ Database Connected", rows);
  } catch (error) {
    console.error("❌ Database Connection Failed:", error.message);
  }
})();

// Middleware
app.use(express.json());
app.use(express.static('uploads'));
app.use(cors());
app.use("/uploads", express.static("uploads"));

// Check Database Connection
(async () => {
  try {
    const [rows] = await db.query("SHOW TABLES");
    console.log("✅ Database Connected", rows);
  } catch (error) {
    console.error("❌ Database Connection Failed:", error.message);
  }
})();

// Root Route
app.get("/", (req, res) => res.send("🚀 Server is running!"));

// Token Verification Route
app.get("/verify-token", (req, res) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(401).json({ error: "Unauthorized: No token provided" });
  
    jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(401).json({ error: "Unauthorized: Invalid token" });
      res.json({ user: decoded });
    });
  });
  
  // Multer Storage Setup
  const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
  });
  const upload = multer({ storage });
  
  // Middleware for token authentication
  const authenticateToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(401).json({ error: "Unauthorized: No token provided" });
  
    jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = decoded;
      next();
    });
  };
  
  // Get logged-in user details
  app.get("/user", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const [rows] = await db.query("SELECT id, name, email, profile_pic FROM users WHERE id = ?", [userId]);
  
      if (rows.length === 0) return res.status(404).json({ success: false, error: "User not found" });
  
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // **Update user online status**
  app.put("/api/users/update-status", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });
  
    try {
      await db.query("UPDATE users SET is_online = 1, last_seen = NOW() WHERE id = ?", [userId]);
      res.json({ message: "User status updated" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // **Set user offline on exit**
  app.put("/api/users/set-offline", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });
  
    try {
      await db.query("UPDATE users SET is_online = 0, last_seen = NOW() WHERE id = ?", [userId]);
      res.json({ message: "User set offline" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // **Fetch online users**
  app.get("/api/users/online", async (req, res) => {
    try {
      const [rows] = await db.query("SELECT id, name, profile_pic FROM users WHERE is_online = 1");
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // **Get user status**
  app.get("/user-status/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const [rows] = await db.query("SELECT is_online, last_seen FROM users WHERE id = ?", [userId]);
  
      if (rows.length === 0) return res.status(404).json({ message: "User not found" });
  
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // **Get user details by ID**
  app.get("/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  
      if (rows.length === 0) return res.status(404).json({ error: "User not found" });
  
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  // **Signup Route**
  app.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;
  
    try {
      const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
      if (existingUser.length > 0) return res.status(400).json({ error: "User already exists!" });
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await db.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hashedPassword]);
  
      const token = jwt.sign({ id: result.insertId, name, email }, process.env.JWT_SECRET, { expiresIn: "1h" });
  
      res.json({ message: "Signup successful!", token, user: { id: result.insertId, name, email } });
    } catch (error) {
      res.status(500).json({ error: "Failed to store user" });
    }
  });
  
  // **Login Route**
  app.post("/login", async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
      if (rows.length === 0) return res.status(401).json({ error: "User not found" });
  
      const user = rows[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ error: "Invalid password" });
  
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  
      delete user.password; // Remove password from response
      res.json({ token, user });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

// Store a new post
app.post("/create-post", upload.array("images", 5), (req, res) => {
    const { user_id, content } = req.body;
    const imagePaths = req.files.map((file) => `/uploads/${file.filename}`);
  
    const query = `
      INSERT INTO posts (user_id, content, image_paths, timestamp, likes, comments, liked_by) 
      VALUES (?, ?, ?, NOW(), 0, '[]', '[]')
    `;
  
    db.query(query, [user_id, content, JSON.stringify(imagePaths)], (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
  
      res.json({ success: true, post_id: result.insertId, image_paths: imagePaths });
    });
  });
  
  // Fetch all posts with user data
app.get("/posts", (req, res) => {
    const query = `
      SELECT posts.*, 
             users.name AS user_name, 
             COALESCE(users.profile_pic, 'http://localhost:5000/uploads/default-avatar.png') AS profile_pic
      FROM posts
      LEFT JOIN users ON posts.user_id = users.id
      ORDER BY posts.timestamp DESC
    `;
  
    db.query(query, (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
  
      rows.forEach((post) => {
        try {
          post.image_paths = JSON.parse(post.image_paths || "[]").map((img) =>
            img.startsWith("http") ? img : `http://localhost:5000${img}`
          );
          post.comments = JSON.parse(post.comments || "[]");
        } catch (error) {
          console.error("Error parsing JSON:", error);
          post.image_paths = [];
          post.comments = [];
        }
      });
  
      res.json(rows);
    });
  });
  
  // Fetch a single post by ID
app.get("/post/:id", (req, res) => {
    const { id } = req.params;
  
    const query = `
      SELECT posts.*, users.name, users.profile_pic
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE posts.id = ?
    `;
  
    db.query(query, [id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0) return res.status(404).json({ error: "Post not found" });
  
      const post = rows[0];
      try {
        post.image_paths = JSON.parse(post.image_paths || "[]").map((img) =>
          img.startsWith("http") ? img : `http://localhost:5000${img}`
        );
        post.comments = JSON.parse(post.comments || "[]");
      } catch (error) {
        console.error("Error parsing JSON:", error);
        post.image_paths = [];
        post.comments = [];
      }
  
      res.json(post);
    });
  });
  
  // Like/Unlike a post
app.post("/posts/:id/like", (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;
  
    if (!user_id) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }
  
    const selectQuery = "SELECT likes, liked_by FROM posts WHERE id = ?";
  
    db.query(selectQuery, [id], (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (rows.length === 0) return res.status(404).json({ success: false, error: "Post not found" });
  
      let { likes, liked_by } = rows[0];
      let likedBy = [];
  
      try {
        likedBy = JSON.parse(liked_by || "[]");
      } catch (error) {
        return res.status(500).json({ success: false, error: "Invalid liked_by format" });
      }
  
      const hasLiked = likedBy.includes(user_id);
  
      if (hasLiked) {
        // Unlike the post
        likedBy = likedBy.filter((uid) => uid !== user_id);
        likes--;
      } else {
        // Like the post
        likedBy.push(user_id);
        likes++;
      }
  
      const updateQuery = "UPDATE posts SET likes = ?, liked_by = ? WHERE id = ?";
      db.query(updateQuery, [likes, JSON.stringify(likedBy), id], (updateErr) => {
        if (updateErr) return res.status(500).json({ success: false, error: updateErr.message });
  
        res.json({ success: true, likes, liked: !hasLiked });
      });
    });
  });
  
  app.get("/suggested-friends", authenticateToken, (req, res) => {
    try {
      const userId = req.user.id;
  
      const getUsersQuery = `
        SELECT id, name, profile_pic 
        FROM users 
        WHERE id != ? 
        ORDER BY name ASC
      `;
  
      db.query(getUsersQuery, [userId], (err, users) => {
        if (err) return res.status(500).json({ success: false, error: "Internal Server Error" });
        if (!users.length) return res.json({ success: true, friends: [] });
  
        const userIds = users.map(user => user.id);
        if (userIds.length === 0) return res.json({ success: true, friends: users });
  
        const placeholders = userIds.map(() => "?").join(",");
        const getExistingConversationsQuery = `
          SELECT user1_id, user2_id 
          FROM conversations 
          WHERE (user1_id = ? AND user2_id IN (${placeholders}))
             OR (user2_id = ? AND user1_id IN (${placeholders}))
        `;
  
        db.query(getExistingConversationsQuery, [userId, ...userIds, userId, ...userIds], (err, conversations) => {
          if (err) return res.status(500).json({ success: false, error: "Internal Server Error" });
  
          const existingConversationUserIds = new Set();
          conversations.forEach(convo => {
            if (convo.user1_id === userId) existingConversationUserIds.add(convo.user2_id);
            if (convo.user2_id === userId) existingConversationUserIds.add(convo.user1_id);
          });
  
          const suggestedFriends = users.filter(user => !existingConversationUserIds.has(user.id));
          res.json({ success: true, friends: suggestedFriends });
        });
      });
  
    } catch (error) {
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  });
  
  app.get("/conversations", authenticateToken, (req, res) => {
    const userId = req.user.id;
  
    const query = `
      SELECT 
        c.id AS conversation_id,
        CASE 
          WHEN c.user1_id = ? THEN c.user2_id
          ELSE c.user1_id
        END AS chat_partner_id,
        u.name AS chat_partner_name,
        u.is_online AS is_partner_online,
        u.last_seen,
        u.profile_pic,
        c.last_message,
        c.last_timestamp,
        c.user1_id,
        c.user2_id,
        (
          SELECT COUNT(*)
          FROM messages
          WHERE messages.conversation_id = c.id
            AND messages.receiver_id = ?
            AND messages.is_read = 0
        ) AS unread_count,
        (
          SELECT m.is_read
          FROM messages m
          WHERE m.conversation_id = c.id
            AND m.sender_id = ?
          ORDER BY m.timestamp DESC
          LIMIT 1
        ) AS is_read,
        (
          SELECT m.sender_id
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.timestamp DESC
          LIMIT 1
        ) AS last_message_sender_id,
        (
          SELECT 
            CASE 
              WHEN (m.is_deleted_for_sender = 1 AND m.sender_id = ?)
              OR (m.is_deleted_for_receiver = 1 AND m.receiver_id = ?)
              THEN 1 ELSE 0 
            END
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.timestamp DESC
          LIMIT 1
        ) AS message_was_deleted_for_you,
        (
          SELECT 
            CASE WHEN m.is_deleted_for_everyone = 1 THEN 1 ELSE 0 END
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.timestamp DESC
          LIMIT 1
        ) AS message_was_deleted_for_everyone
      FROM conversations c
      JOIN users u ON u.id = (
        CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END
      )
      WHERE (c.user1_id = ? OR c.user2_id = ?)
      ORDER BY c.last_timestamp DESC;
    `;
  
    db.query(
      query,
      [userId, userId, userId, userId, userId, userId, userId, userId],
      (err, rows) => {
        if (err) {
          console.error("Database error fetching conversations:", err);
          return res.status(500).json({ error: "Failed to load conversations" });
        }
        res.json(rows);
      }
    );
  });
  
  app.post("/conversations/start", authenticateToken, (req, res) => {
    const { receiver_id } = req.body;
    const userId = req.user.id;
  
    if (!receiver_id) {
      return res.status(400).json({ error: "Receiver ID is required" });
    }
  
    const findConversationQuery = `
      SELECT * FROM conversations 
      WHERE (user1_id = ? AND user2_id = ?) 
         OR (user1_id = ? AND user2_id = ?)
    `;
  
    db.query(
      findConversationQuery,
      [userId, receiver_id, receiver_id, userId],
      (err, results) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Database error", details: err.message });
        }
  
        if (results.length) {
          const existingChat = results[0];
  
          // Mark unread messages as read
          const markReadQuery = `
            UPDATE messages
            SET is_read = 1
            WHERE conversation_id = ? 
              AND receiver_id = ?
              AND is_read = 0
          `;
  
          db.query(markReadQuery, [existingChat.id, userId]);
  
          return res.json({ success: true, conversation: existingChat });
        }
  
        // Create a new conversation
        const createConversationQuery = `
          INSERT INTO conversations (user1_id, user2_id, last_message, last_timestamp)
          VALUES (?, ?, '', NOW())
        `;
  
        db.query(createConversationQuery, [userId, receiver_id], (insertErr, result) => {
          if (insertErr) {
            console.error("Error creating conversation:", insertErr);
            return res.status(500).json({ error: "Failed to create conversation", details: insertErr.message });
          }
  
          const newConversationId = result.insertId;
  
          // Fetch the newly created conversation
          db.query(`SELECT * FROM conversations WHERE id = ?`, [newConversationId], (fetchErr, newChat) => {
            if (fetchErr) {
              console.error("Error retrieving new conversation:", fetchErr);
              return res.status(500).json({ error: "Failed to fetch new conversation" });
            }
  
            res.json({ success: true, conversation: newChat[0] });
          });
        });
      }
    );
  });
  
  app.get("/messages/:conversation_id", authenticateToken, async (req, res) => {
    const { conversation_id } = req.params;
    const user_id = req.user.id;
  
    try {
      const conversationQuery = `
        SELECT user1_id, user2_id
        FROM conversations
        WHERE id = ?
      `;
  
      db.query(conversationQuery, [conversation_id], (err, results) => {
        if (err) throw err;
        if (!results.length) return res.status(404).json({ error: "Conversation not found" });
  
        const { user1_id, user2_id } = results[0];
        if (user_id !== user1_id && user_id !== user2_id) {
          return res.status(403).json({ error: "Access denied" });
        }
  
        const messagesQuery = `
          SELECT * FROM messages
          WHERE conversation_id = ?
          ORDER BY timestamp ASC
        `;
  
        db.query(messagesQuery, [conversation_id], (msgErr, messages) => {
          if (msgErr) throw msgErr;
          res.json(messages);
        });
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/messages/send", authenticateToken, async (req, res) => {
    const { receiver_id, message, reply_to_message_id, reply_to_sender_id, reply_to_message } = req.body;
    const sender_id = req.user.id;
  
    if (!receiver_id || !message.trim()) {
      return res.status(400).json({ error: "Invalid request data" });
    }
  
    try {
      const findConversationQuery = `
        SELECT id FROM conversations
        WHERE (user1_id = ? AND user2_id = ?) 
           OR (user1_id = ? AND user2_id = ?)
      `;
  
      db.query(findConversationQuery, [sender_id, receiver_id, receiver_id, sender_id], (err, results) => {
        if (err) throw err;
  
        const conversation_id = results.length ? results[0].id : null;
  
        if (!conversation_id) {
          const createConversationQuery = `
            INSERT INTO conversations (user1_id, user2_id, last_message, last_timestamp)
            VALUES (?, ?, ?, NOW())
          `;
  
          db.query(createConversationQuery, [sender_id, receiver_id, message], (insertErr, result) => {
            if (insertErr) throw insertErr;
            sendMessage(result.insertId);
          });
        } else {
          sendMessage(conversation_id);
        }
      });
  
      function sendMessage(conversation_id) {
        const insertMessageQuery = `
          INSERT INTO messages (conversation_id, sender_id, receiver_id, message, timestamp, is_read, reply_to_message_id, reply_to_sender_id, reply_to_message)
          VALUES (?, ?, ?, ?, NOW(), 0, ?, ?, ?)
        `;
  
        db.query(insertMessageQuery, [conversation_id, sender_id, receiver_id, message, reply_to_message_id || null, reply_to_sender_id || null, reply_to_message || null]);
        res.json({ success: true });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });
  
  app.post("/messages/markAsRead", async (req, res) => {
    const { conversation_id } = req.body;
    try {
      await db.query(
        `UPDATE messages 
         SET is_read = 1 
         WHERE conversation_id = ? 
         AND is_read = 0`, 
        [conversation_id]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update read status" });
    }
  });
  
  app.patch("/messages/read", async (req, res) => {
    try {
      const { senderId } = req.body; // Sender whose messages are marked as read
      const userId = req.user.id;    // Current user (receiver)
  
      await db.query(
        `UPDATE messages 
         SET is_read = 1 
         WHERE sender_id = ? 
         AND receiver_id = ? 
         AND is_read = 0`, 
        [senderId, userId]
      );
  
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  app.post("/api/delete-message", async (req, res) => {
    const { messageId, userId, deleteType } = req.body;
  
    try {
      const [message] = await db.query(
        "SELECT * FROM messages WHERE id = ?", 
        [messageId]
      );
      if (!message) return res.json({ success: false, error: "Message not found" });
  
      if (deleteType === "everyone" && message.sender_id === userId) {
        // Delete for both users (soft delete)
        await db.query(
          `UPDATE messages 
           SET is_deleted_for_sender = 1, 
               is_deleted_for_receiver = 1, 
               is_deleted_for_everyone = 1 
           WHERE id = ?`, 
          [messageId]
        );
      } else if (deleteType === "me") {
        if (message.sender_id === userId) {
          // Delete for sender only
          await db.query(
            "UPDATE messages SET is_deleted_for_sender = 1 WHERE id = ?", 
            [messageId]
          );
        } else {
          // Delete for receiver only
          await db.query(
            "UPDATE messages SET is_deleted_for_receiver = 1 WHERE id = ?", 
            [messageId]
          );
        }
      }
  
      return res.json({ success: true });
    } catch (error) {
      console.error("Delete message error:", error);
      return res.json({ success: false, error: "Database error" });
    }
  });
  
  app.post("/api/undo-delete-message", async (req, res) => {
    const { messageId, userId, deleteType } = req.body;
  
    try {
      const [message] = await db.query(
        "SELECT * FROM messages WHERE id = ?", 
        [messageId]
      );
      if (!message) return res.json({ success: false, error: "Message not found" });
  
      if (deleteType === "everyone" && message.sender_id === userId) {
        // Restore message for both users
        await db.query(
          `UPDATE messages 
           SET is_deleted_for_sender = 0, 
               is_deleted_for_receiver = 0, 
               is_deleted_for_everyone = 0 
           WHERE id = ?`, 
          [messageId]
        );
      } else if (deleteType === "me") {
        if (message.sender_id === userId) {
          // Restore for sender only
          await db.query(
            "UPDATE messages SET is_deleted_for_sender = 0 WHERE id = ?", 
            [messageId]
          );
        } else {
          // Restore for receiver only
          await db.query(
            "UPDATE messages SET is_deleted_for_receiver = 0 WHERE id = ?", 
            [messageId]
          );
        }
      }
  
      return res.json({ success: true });
    } catch (error) {
      console.error("Undo delete message error:", error);
      return res.json({ success: false, error: "Database error" });
    }
  });
  
  app.put('/api/messages/edit', async (req, res) => {
    const { messageId, newText, conversationId } = req.body;
  
    if (!messageId || !newText || !conversationId) {
      return res.status(400).json({ error: 'Invalid request' });
    }
  
    try {
      // Update the message content and mark as edited
      await db.query(
        `UPDATE messages 
         SET message = ?, edited = 1 
         WHERE id = ?`, 
        [newText, messageId]
      );
  
      // Update last message in the conversation
      await db.query(
        `UPDATE conversations 
         SET last_message = ? 
         WHERE id = ?`, 
        [newText, conversationId]
      );
  
      res.json({ success: true, message: 'Message updated' });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });
  
  // Store typing status temporarily in-memory (use Redis for production)
const typingStatus = {};

app.post('/conversations/:id/typing', async (req, res) => {
  const { userId, isTyping } = req.body;
  const conversationId = req.params.id;

  typingStatus[conversationId] = { userId, isTyping, timestamp: Date.now() };

  res.sendStatus(200);
});

app.get('/conversations/:id/typing', async (req, res) => {
    const conversationId = req.params.id;
  
    const status = typingStatus[conversationId];
    // Remove stale typing status after 5 seconds
    if (status && Date.now() - status.timestamp > 5000) {
      delete typingStatus[conversationId];
      return res.json({ isTyping: false });
    }
  
    res.json(status || { isTyping: false });
  });
  
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
