const dotenv = require("dotenv");
const { Server } = require("socket.io");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./database");
const path = require("path");
const { promisify } = require("util");
const http = require("http");
const typingStatus = {};


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:####", // Disconnect for now abeg
    methods: ["GET", "POST"],
  },
});
const PORT = 5000;
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
db.getAsync = promisify(db.get).bind(db);
db.allAsync = promisify(db.all);
db.runAsync = promisify(db.run);

// Middleware
app.use(express.json());
app.use(express.static('uploads'));
app.use(cors());
app.use("/uploads", express.static("uploads")); // Serve images

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Listen for joining a chat room
  socket.on("joinChat", (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined conversation: ${conversationId}`);
  });

  // Listen for new messages
  socket.on("newMessage", (message) => {
    console.log("New message received:", message);

    // Mark message as read if receiver is online in the chat
    db.run(
      `UPDATE messages SET is_read = 1 WHERE id = ? AND receiver_id = ?`,
      [message.id, message.receiver_id],
      function (err) {
        if (err) {
          console.error("Error updating message:", err);
        } else {
          console.log(`Message ID ${message.id} marked as read.`);
          io.to(message.conversation_id).emit("messageRead", { messageId: message.id });
        }
      }
    );
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Middleware to verify JWT and get user ID
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ success: false, error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Extract token after "Bearer"

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: "Forbidden: Invalid token" });
    }
    req.user = user; // Attach user data to request
    next();
  });
};
// Check Database Connection
db.get("SELECT name FROM sqlite_master WHERE type='table'", (err, row) => {
  if (err) console.error("Error checking database:", err.message);
  else console.log("✅ Database Connected");
});

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

// Get logged-in user details
app.get("/user", authenticateToken, (req, res) => {
  const userId = req.user.id; // Extract user ID from decoded token

  const query = "SELECT id, name, email, profile_pic FROM users WHERE id = ?";
  db.get(query, [userId], (err, user) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    res.json(user);
  });
});

// **Update user online status**
app.put("/api/users/update-status", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

  const query = `UPDATE users SET is_online = 1, last_seen = datetime('now') WHERE id = ?`;
  db.run(query, [userId], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "User status updated" });
  });
});

// **Set user offline on exit**
app.put("/api/users/set-offline", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

  const query = `UPDATE users SET is_online = 0, last_seen = datetime('now') WHERE id = ?`;
  db.run(query, [userId], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "User set offline" });
  });
});

// **Fetch online users**
app.get("/api/users/online", (req, res) => {
  const query = `SELECT id, name, profile_pic FROM users WHERE is_online = 1`;
  db.all(query, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
  });
});

app.get("/user-status/:userId", async (req, res) => {
  const { userId } = req.params;
  const user = await db.getAsync("SELECT is_online, last_seen FROM users WHERE id = ?", [userId]);

  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({
      is_online: user.is_online,
      last_seen: user.last_seen,
  });
});

app.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db.getAsync("SELECT * FROM users WHERE id = ?", [id]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// sign up
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  
  // Check if the email already exists
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (user) return res.status(400).json({ error: "User already exists!" });

    // Hash the password and insert the user
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
      function (err) {
        if (err) return res.status(500).json({ error: "Failed to store user" });

        // Generate JWT token
        const token = jwt.sign(
          { id: this.lastID, name, email },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );
        res.json({ message: "Signup successful!", token, user: { id: this.lastID, name, email } });
      }
    );
  });
});

// Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Fetch user from database
    const user = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!user) return res.status(401).json({ error: "User not found" });

    if (!user.password) {
      return res.status(500).json({ error: "Server error: Password not found in database" });
    }

    // Compare hashed passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    // Generate JWT with only user ID
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Store a new post
app.post("/create-post", upload.array("images", 5), (req, res) => {
  const { user_id, content } = req.body;
  const imagePaths = req.files.map((file) => `/uploads/${file.filename}`);

  db.run(
    "INSERT INTO posts (user_id, content, image_paths, timestamp, likes, comments) VALUES (?, ?, ?, ?, 0, '[]')",
    [user_id, content, JSON.stringify(imagePaths), Date.now()],
    function (err) {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, post_id: this.lastID, image_paths: imagePaths });
    }
  );
});

// API to fetch all posts with user data
app.get("/posts", (req, res) => {
  const query = `
    SELECT posts.*, 
           users.name AS user_name, 
           COALESCE(users.profile_pic, 'http://localhost:5000/uploads/default-avatar.png') AS profile_pic 
    FROM posts 
    LEFT JOIN users ON posts.user_id = users.id 
    ORDER BY posts.timestamp DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    rows.forEach((post) => {
      post.image_paths = JSON.parse(post.image_paths || "[]").map((img) => {
        return img.startsWith("http") ? img : `http://localhost:5000${img}`;
      });

      // Ensure comments are parsed correctly
      try {
        post.comments = JSON.parse(post.comments || "[]");
      } catch (error) {
        console.error("Error parsing comments:", error);
        post.comments = [];
      }
    });

    res.json(rows);
  });
});

// API to fetch a single post by ID with user data
app.get("/post/:id", (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT posts.*, users.name, users.profile_pic 
    FROM posts 
    JOIN users ON posts.user_id = users.id 
    WHERE posts.id = ?
  `;

  db.get(query, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Post not found" });

    row.image_paths = JSON.parse(row.image_paths || "[]").map(
      (img) => `http://localhost:5000/uploads/${img}`
    );

    res.json(row);
  });
});

//like a post
app.post("/posts/:id/like", (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  console.log(`Like request received for Post ID: ${id} by User ID: ${user_id}`);

  if (!user_id) {
    return res.status(400).json({ success: false, error: "User ID is required" });
  }

  db.get("SELECT likes, liked_by FROM posts WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!row) {
      console.error("Post not found:", id);
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    console.log("Post data before update:", row);

    let likedBy = [];
    try {
      likedBy = JSON.parse(row.liked_by || "[]");
    } catch (parseErr) {
      console.error("JSON parsing error:", parseErr.message);
      return res.status(500).json({ success: false, error: "Invalid liked_by data format" });
    }

    let newLikes = row.likes;
    let liked = likedBy.includes(user_id);

    if (liked) {
      likedBy = likedBy.filter(uid => uid !== user_id);
      newLikes--;
    } else {
      likedBy.push(user_id);
      newLikes++;
    }

    db.run(
      "UPDATE posts SET likes = ?, liked_by = ? WHERE id = ?",
      [newLikes, JSON.stringify(likedBy), id],
      (updateErr) => {
        if (updateErr) {
          console.error("Database update error:", updateErr.message);
          return res.status(500).json({ success: false, error: updateErr.message });
        }

        console.log(`Post ${id} updated successfully. New likes: ${newLikes}`);
        res.json({ success: true, likes: newLikes, liked: !liked });
      }
    );
  });
});


// Suggested Friends API - Fetch all users except the logged-in one
app.get("/suggested-friends", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Extract logged-in user's ID from token

    // Step 1: Fetch all users except the current user
    const getUsersQuery = `
      SELECT id, name, profile_pic 
      FROM users 
      WHERE id != ? 
      ORDER BY name ASC
    `;

    db.all(getUsersQuery, [userId], (err, users) => {
      if (err) {
        console.error("Database error (Fetching users):", err);
        return res.status(500).json({ success: false, error: "Internal Server Error" });
      }

      if (!users.length) {
        console.log("No users found.");
        return res.json({ success: true, friends: [] }); // No users available
      }

      // Step 2: Extract user IDs for conversation checking
      const userIds = users.map(user => user.id);

      // Prevent empty userIds from causing SQL errors
      if (userIds.length === 0) {
        console.log("No suggested users available.");
        return res.json({ success: true, friends: users });
      }

      // Step 3: Fetch existing conversations
      const placeholders = userIds.map(() => "?").join(",");
      const getExistingConversationsQuery = `
        SELECT user1_id, user2_id 
        FROM conversations 
        WHERE (user1_id = ? AND user2_id IN (${placeholders}))
           OR (user2_id = ? AND user1_id IN (${placeholders}))
      `;

      db.all(getExistingConversationsQuery, [userId, ...userIds, userId, ...userIds], (err, conversations) => {
        if (err) {
          console.error("Database error (Fetching conversations):", err);
          return res.status(500).json({ success: false, error: "Internal Server Error" });
        }

        console.log("Conversations found:", conversations);

        // Step 4: Identify users with existing conversations
        const existingConversationUserIds = new Set();
        conversations.forEach(convo => {
          if (convo.user1_id === userId) existingConversationUserIds.add(convo.user2_id);
          if (convo.user2_id === userId) existingConversationUserIds.add(convo.user1_id);
        });

        // Step 5: Filter suggested users (exclude those in existing conversations)
        const suggestedFriends = users.filter(user => !existingConversationUserIds.has(user.id));

        console.log("Suggested Friends:", suggestedFriends);
        return res.json({ success: true, friends: suggestedFriends });
      });
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

////////////////////////
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

  db.all(query, [userId, userId, userId, userId, userId, userId, userId, userId], (err, rows) => {
      if (err) {
          console.error("Database error fetching conversations:", err);
          return res.status(500).json({ error: "Failed to load conversations" });
      }
      res.json(rows);
  });
});

app.post("/conversations/start", authenticateToken, (req, res) => {
  const { receiver_id } = req.body;
  const userId = req.user.id;

  if (!receiver_id) {
    return res.status(400).json({ error: "Receiver ID is required" });
  }

  // Check if conversation already exists
  db.get(
    `SELECT * FROM conversations WHERE 
    (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`,
    [userId, receiver_id, receiver_id, userId],
    (err, existingChat) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error", details: err.message });
      }

      if (existingChat) {
        console.log("Existing conversation found:", existingChat);

        // **Mark received messages as read**
        db.run(
          `UPDATE messages 
           SET is_read = 1 
           WHERE conversation_id = ? 
           AND receiver_id = ? 
           AND is_read = 0`,
          [existingChat.id, userId],
          (updateErr) => {
            if (updateErr) {
              console.error("Error updating message read status:", updateErr);
            }
          }
        );

        return res.json({ success: true, conversation: existingChat });
      }

      // No existing conversation found, so create one
      db.run(
        `INSERT INTO conversations (user1_id, user2_id, last_message, last_timestamp) 
         VALUES (?, ?, '', datetime('now'))`,
        [userId, receiver_id],
        function (insertErr) {
          if (insertErr) {
            console.error("Error creating conversation:", insertErr);
            return res.status(500).json({ error: "Failed to create conversation", details: insertErr.message });
          }

          // Fetch the newly created conversation
          db.get(
            `SELECT * FROM conversations WHERE id = ?`,
            [this.lastID],
            (fetchErr, newChat) => {
              if (fetchErr) {
                console.error("Error retrieving new conversation:", fetchErr);
                return res.status(500).json({ error: "Failed to fetch new conversation" });
              }
              res.json({ success: true, conversation: newChat });
            }
          );
        }
      );
    }
  );
});

app.get("/messages/:conversation_id", authenticateToken, async (req, res) => {
  const { conversation_id } = req.params;
  const user_id = req.user.id; // Get logged-in user

  try {
    // Check if the conversation exists between two unique users
    const conversation = await db.getAsync(
      `SELECT user1_id, user2_id FROM conversations WHERE id = ?`,
      [conversation_id]
    );

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Ensure the logged-in user is part of this conversation
    if (conversation.user1_id !== user_id && conversation.user2_id !== user_id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Fetch messages between these two users in the selected conversation
    const messages = await db.allAsync(
      `SELECT * FROM messages 
       WHERE conversation_id = ? 
       ORDER BY timestamp ASC`,
      [conversation_id]
    );

    res.json(messages);
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
    // Check if a conversation already exists
    let conversation = await new Promise((resolve, reject) => {
      db.get(
        `SELECT id FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`,
        [sender_id, receiver_id, receiver_id, sender_id],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });

    let conversation_id;

    if (conversation) {
      conversation_id = conversation.id;
    } else {
      const result = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO conversations (user1_id, user2_id, last_message, last_timestamp) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
          [sender_id, receiver_id, message],
          function (err) {
            if (err) reject(err);
            else resolve(this);
          }
        );
      });

      conversation_id = result.lastID;
    }

    // Insert message with reply reference
    const messageResult = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO messages (conversation_id, sender_id, receiver_id, message, timestamp, is_read, reply_to_message_id, reply_to_sender_id, reply_to_message) 
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 0, ?, ?, ?)`,
        [conversation_id, sender_id, receiver_id, message, reply_to_message_id || null, reply_to_sender_id || null, reply_to_message || null],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    // Update last_message and timestamp in conversations table
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE conversations SET last_message = ?, last_timestamp = CURRENT_TIMESTAMP WHERE id = ?`,
        [message, conversation_id],
        (err) => (err ? reject(err) : resolve())
      );
    });

    res.json({
      id: messageResult.id,
      conversation_id,
      reply_to_message_id,
      reply_to_sender_id,
      reply_to_message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.post("/messages/markAsRead", async (req, res) => {
  const { conversation_id } = req.body;
  try {
    await db.runAsync(`UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND is_read = 0`, [conversation_id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update read status" });
  }
});

app.patch("/messages/read", async (req, res) => {
  try {
    const { senderId } = req.body; // The sender whose messages should be marked as read
    const userId = req.user.id; // Current user

    await db.runAsync(
      `UPDATE messages 
       SET is_read = 1 
       WHERE sender_id = ? AND receiver_id = ? AND is_read = 0`,
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
    const message = await db.getAsync("SELECT * FROM messages WHERE id = ?", [messageId]);
    if (!message) return res.json({ success: false, error: "Message not found" });

    if (deleteType === "everyone" && message.sender_id === userId) {
      // Sender deletes for both users (soft delete for visibility)
      await db.runAsync(
        `UPDATE messages 
         SET is_deleted_for_sender = 1, 
             is_deleted_for_receiver = 1, 
             is_deleted_for_everyone = 1 
         WHERE id = ?`, 
        [messageId]
      );
    } else if (deleteType === "me") {
      if (message.sender_id === userId) {
        // Soft delete for sender
        await db.runAsync("UPDATE messages SET is_deleted_for_sender = 1 WHERE id = ?", [messageId]);
      } else {
        // Soft delete for receiver
        await db.runAsync("UPDATE messages SET is_deleted_for_receiver = 1 WHERE id = ?", [messageId]);
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
    const message = await db.getAsync("SELECT * FROM messages WHERE id = ?", [messageId]);
    if (!message) return res.json({ success: false, error: "Message not found" });

    if (deleteType === "everyone" && message.sender_id === userId) {
      // Sender deletes for both users (soft delete for visibility)
      await db.runAsync(
        `UPDATE messages 
         SET is_deleted_for_sender = 0, 
             is_deleted_for_receiver = 0, 
             is_deleted_for_everyone = 0 
         WHERE id = ?`, 
        [messageId]
      );
    } else if (deleteType === "me") {
      if (message.sender_id === userId) {
        // Soft delete for sender
        await db.runAsync("UPDATE messages SET is_deleted_for_sender = 0 WHERE id = ?", [messageId]);
      } else {
        // Soft delete for receiver
        await db.runAsync("UPDATE messages SET is_deleted_for_receiver = 0 WHERE id = ?", [messageId]);
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
      // Update the message text and mark it as edited
      await db.runAsync(
          `UPDATE messages SET message = ?, edited = 1 WHERE id = ?`,
          [newText, messageId]
      );

      // Update the last message in the conversation
      await db.runAsync(
          `UPDATE conversations SET last_message = ? WHERE id = ?`,
          [newText, conversationId]
      );

      res.json({ success: true, message: 'Message updated' });
  } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
  }
});

// POST /conversations/:id/typing
app.post('/conversations/:id/typing', async (req, res) => {
  const { userId, isTyping } = req.body;
  const conversationId = req.params.id;

  // Store typing status in-memory or DB (lightweight cache is best)
  typingStatus[conversationId] = { userId, isTyping, timestamp: Date.now() };

  res.sendStatus(200);
});

// GET /conversations/:id/typing
app.get('/conversations/:id/typing', async (req, res) => {
  const conversationId = req.params.id;

  const status = typingStatus[conversationId];
  // Clear stale typing status after 5 seconds
  if (status && Date.now() - status.timestamp > 5000) {
    delete typingStatus[conversationId];
    return res.json({ isTyping: false });
  }

  res.json(status || { isTyping: false });
});


// Start Server
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
