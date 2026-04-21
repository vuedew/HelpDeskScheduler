console.log("THIS IS MY SERVER FILE");

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to MySQL ');
  }
});

//  Root route
app.get('/', (req, res) => {
  res.send('Backend is running ');
});


// ================= USERS =================
app.get('/users', (req, res) => {
  db.query('SELECT user_id, name, email, role FROM users', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});


// ================= SHIFTS =================
app.get('/shifts', (req, res) => {
  const query = `
    SELECT 
      s.shift_id,
      s.schedule_id AS assignment_id,
      DATE_FORMAT(s.date, '%Y-%m-%d') AS date,
      TIME_FORMAT(s.start_time, '%H:%i') AS start_time,
      TIME_FORMAT(s.end_time, '%H:%i') AS end_time,
      u.name AS assigned_user_name
    FROM shifts s
    JOIN users u ON s.assigned_user_id = u.user_id
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});
// ================= REQUESTS =================

// GET all requests
app.get('/requests', (req, res) => {
  const query = `
    SELECT 
      tr.request_id,
      tr.shift_id AS assignment_id,
      u.name AS requester_name,
      tr.type,
      tr.status,
      tr.timestamp AS created_at
    FROM trade_requests tr
    JOIN users u ON tr.requesting_user_id = u.user_id
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});


// POST new request
app.post('/requests', (req, res) => {
  const { assignment_id, requester_id, type, reason } = req.body;

  if (!assignment_id || !requester_id || !type) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const query = `
    INSERT INTO trade_requests (shift_id, requesting_user_id, type, reason)
    VALUES (?, ?, ?, ?)
  `;

  db.query(query, [assignment_id, requester_id, type, reason], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json({
      request_id: result.insertId,
      message: 'Request created successfully'
    });
  });
});


// PATCH request status (approve/deny)
app.patch('/requests/:id', (req, res) => {
  const { id } = req.params;
  const { status, approved_by } = req.body;

  if (!status || !approved_by) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const updateQuery = `
    UPDATE trade_requests
    SET status = ?
    WHERE request_id = ?
  `;

  db.query(updateQuery, [status, id], (err) => {
    if (err) return res.status(500).json(err);

    const approvalQuery = `
      INSERT INTO approvals (request_id, approved_by, decision)
      VALUES (?, ?, ?)
    `;

    db.query(approvalQuery, [id, approved_by, status], (err2) => {
      if (err2) return res.status(500).json(err2);

      res.json({ message: `Request ${status}` });
    });
  });
});


// ================= LOGIN =================
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json(err);

    if (results.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = results[0];

    if (password === user.password_hash) {
      res.json({
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } else {
      res.status(401).json({ message: 'Invalid password' });
    }
  });
});


// ================= START SERVER =================
app.listen(process.env.PORT, '0.0.0.0', () => { 
   console.log(`Server running on port ${process.env.PORT} `);
});