const db = require('../database');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
    )`);
});

module.exports = {
    createUser: (name, email, callback) => {
        db.run(`INSERT INTO users (name, email) VALUES (?, ?)`, [name, email], callback);
    },
    getUsers: (callback) => {
        db.all(`SELECT * FROM users`, [], callback);
    }
};
