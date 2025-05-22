const express = require('express');
const router = express.Router();
const { createUser, getUsers } = require('../models/user');

router.post('/users', (req, res) => {
    const { name, email } = req.body;
    createUser(name, email, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'User created' });
    });
});

router.get('/users', (req, res) => {
    getUsers((err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;
