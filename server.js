/*
 * =============================================
 * || EXPRESS.JS BACKEND (COMPLETE WITH AUTH) ||
 * =============================================
 * This is the final, complete server file. It includes user authentication,
 * JWT security, and all API endpoints for the entire application.
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000; // Changed port to 3001 to avoid conflicts

app.use(cors());
app.use(express.json());

const dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'finance_dashboard',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- AUTHENTICATION ROUTES (NEW) ---

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 */
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        const [existingUsers] = await dbPool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const [result] = await dbPool.query(
            'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
            [name, email, passwordHash]
        );
        
        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 */
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        const [users] = await dbPool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const payload = { user: { id: user.id } };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'a_very_secure_secret_key', // Use a secure secret from .env in production
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, userId: user.id, message: 'Login successful' });
            }
        );

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});


// --- AUTHENTICATION MIDDLEWARE (NEW) ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
    if (token == null) return res.sendStatus(401); // Unauthorized if no token

    jwt.verify(token, process.env.JWT_SECRET || 'a_very_secure_secret_key', (err, payload) => {
        if (err) return res.sendStatus(403); // Forbidden if token is invalid
        req.userId = payload.user.id; // Add user id from token payload to the request object
        next();
    });
}


// --- PROTECTED API ROUTES (UPDATED) ---
// All routes that handle user data are now protected by the authenticateToken middleware.
// The ':userId' URL parameter is removed and replaced with 'req.userId' from the token.

// Summary Endpoint
app.get('/api/summary', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    try {
        const [balanceRows] = await dbPool.query('SELECT SUM(balance) as totalBalance FROM accounts WHERE user_id = ?', [userId]);
        const [incomeRows] = await dbPool.query(`SELECT SUM(amount) as totalIncome FROM transactions WHERE user_id = ? AND type = 'income' AND MONTH(date) = ? AND YEAR(date) = ?`, [userId, currentMonth, currentYear]);
        const [expenseRows] = await dbPool.query(`SELECT SUM(amount) as totalExpenses FROM transactions WHERE user_id = ? AND type = 'expense' AND MONTH(date) = ? AND YEAR(date) = ?`, [userId, currentMonth, currentYear]);
        const totalBalance = balanceRows[0]?.totalBalance || 0;
        const totalIncome = incomeRows[0]?.totalIncome || 0;
        const totalExpenses = expenseRows[0]?.totalExpenses || 0;
        res.json({ totalBalance, totalIncome, totalExpenses, savings: totalIncome - totalExpenses });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching summary data.' });
    }
});

// NEW Chart Data Endpoint
app.get('/api/chart-data', authenticateToken, async (req, res) => {
    const userId = req.userId;
    try {
        const query = `
            SELECT
                YEAR(date) as year,
                MONTH(date) as month,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpenses
            FROM
                transactions
            WHERE
                user_id = ? AND date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY
                YEAR(date), MONTH(date)
            ORDER BY
                year, month;
        `;
        const [rows] = await dbPool.query(query, [userId]);

        // Process data for the chart
        const labels = [];
        const monthMap = new Map();

        // Initialize map for the last 12 months to ensure all months are present
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const key = `${year}-${String(month).padStart(2, '0')}`;
            const monthName = d.toLocaleString('default', { month: 'short' });
            labels.push(monthName);
            monthMap.set(key, { income: 0, expense: 0 });
        }

        // Populate the map with data from the database
        rows.forEach(row => {
            const key = `${row.year}-${String(row.month).padStart(2, '0')}`;
            if (monthMap.has(key)) {
                monthMap.set(key, {
                    income: parseFloat(row.totalIncome) || 0,
                    expense: parseFloat(row.totalExpenses) || 0
                });
            }
        });
        
        const incomeData = [];
        const expenseData = [];
        for (const value of monthMap.values()) {
            incomeData.push(value.income);
            expenseData.push(value.expense);
        }

        res.json({ labels, incomeData, expenseData });

    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ message: 'Could not fetch chart data' });
    }
});


/*
 * =======================================================
 * || NEW ENDPOINT FOR DELETING CARDS                   ||
 * =======================================================
 */

// Add this new endpoint to your existing server.js file,
// ideally with the other card-related endpoints.

/**
 * @route   DELETE /api/cards/:cardId
 * @desc    Deletes a specific card for the logged-in user.
 * @access  Private
 */
app.delete('/api/cards/:cardId', authenticateToken, async (req, res) => {
    const { cardId } = req.params;
    const userId = req.userId; // from authenticateToken middleware

    try {
        // The `user_id = ?` check is a crucial security measure.
        // It ensures that a user can only delete their own cards.
        const [result] = await dbPool.query(
            'DELETE FROM cards WHERE id = ? AND user_id = ?',
            [cardId, userId]
        );

        // Check if a row was actually deleted
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Card not found or you do not have permission to delete it.' });
        }

        res.json({ message: 'Card deleted successfully' });
    } catch (error) {
        console.error('Error deleting card:', error);
        res.status(500).json({ message: 'Failed to delete card.' });
    }
});



// Transactions Endpoints
app.get('/api/transactions/all', authenticateToken, async (req, res) => {
    try {
        const [rows] = await dbPool.query(`SELECT t.id, t.description, t.amount, t.type, t.date, c.name as category FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.user_id = ? ORDER BY t.date DESC`, [req.userId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transactions.' });
    }
});

app.get('/api/transactions', authenticateToken, async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    try {
        const [rows] = await dbPool.query(`SELECT t.id, t.description, t.amount, t.type, t.date, c.name as category, c.icon FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.user_id = ? ORDER BY t.date DESC LIMIT ?`, [req.userId, limit]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching recent transactions.' });
    }
});

app.post('/api/transactions', authenticateToken, async (req, res) => {
    const { description, amount, type, category_id, account_id } = req.body;
    try {
        await dbPool.query('INSERT INTO transactions (user_id, account_id, category_id, description, amount, type, date) VALUES (?, ?, ?, ?, ?, ?, NOW())', [req.userId, account_id, category_id, description, amount, type]);
        const updateAmount = type === 'income' ? amount : -amount;
        await dbPool.query('UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?', [updateAmount, account_id, req.userId]);
        res.status(201).json({ message: 'Transaction added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add transaction.' });
    }
});

// Cards Endpoints
app.get('/api/cards', authenticateToken, async (req, res) => {
    try {
        const [rows] = await dbPool.query('SELECT id, card_holder, last4, expiry_date, type FROM cards WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cards.' });
    }
});

app.post('/api/cards', authenticateToken, async (req, res) => {
    const { card_number, card_holder, expiry_date, type } = req.body;
    const last4 = card_number.slice(-4);
    try {
        await dbPool.query('INSERT INTO cards (user_id, card_holder, last4, expiry_date, type) VALUES (?, ?, ?, ?, ?)', [req.userId, card_holder, last4, expiry_date, type]);
        res.status(201).json({ message: 'Card added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add card.' });
    }
});

// Savings Endpoints
app.get('/api/savings', authenticateToken, async (req, res) => {
    try {
        const [rows] = await dbPool.query('SELECT id, name, target_amount, current_amount FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching savings goals.' });
    }
});

app.post('/api/savings', authenticateToken, async (req, res) => {
    const { name, target_amount, current_amount } = req.body;
    try {
        await dbPool.query('INSERT INTO savings_goals (user_id, name, target_amount, current_amount) VALUES (?, ?, ?, ?)', [req.userId, name, target_amount, current_amount || 0]);
        res.status(201).json({ message: 'Savings goal added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add savings goal.' });
    }
});

// Settings / User Endpoints
app.get('/api/user', authenticateToken, async (req, res) => {
    try {
        const [rows] = await dbPool.query('SELECT name, email FROM users WHERE id = ?', [req.userId]);
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user data.' });
    }
});

app.put('/api/user', authenticateToken, async (req, res) => {
    const { name, email } = req.body;
    try {
        await dbPool.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.userId]);
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user data.' });
    }
});

app.put('/api/user/password', authenticateToken, async (req, res) => {
    const { current_password, new_password } = req.body;
    try {
        const [rows] = await dbPool.query('SELECT password_hash FROM users WHERE id = ?', [req.userId]);
        const isMatch = await bcrypt.compare(current_password, rows[0].password_hash);
        if (!isMatch) return res.status(403).json({ message: 'Incorrect current password.' });
        
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(new_password, salt);
        await dbPool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, req.userId]);
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating password.' });
    }
});


/*
 * =======================================================
 * || NEW ENDPOINTS FOR AVATAR & PREFERENCES            ||
 * =======================================================
 */

// Add these new endpoints to your existing server.js file.

/**
 * @route   PUT /api/user/avatar
 * @desc    Updates the user's avatar URL.
 * @access  Private
 */
app.put('/api/user/avatar', authenticateToken, async (req, res) => {
    const { avatar_url } = req.body;
    if (!avatar_url) {
        return res.status(400).json({ message: 'Avatar URL is required.' });
    }
    try {
        await dbPool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatar_url, req.userId]);
        res.json({ message: 'Avatar updated successfully' });
    } catch (error) {
        console.error('Error updating avatar:', error);
        res.status(500).json({ message: 'Error updating avatar.' });
    }
});

/**
 * @route   PUT /api/user/preferences
 * @desc    Updates user preferences like theme.
 * @access  Private
 */
app.put('/api/user/preferences', authenticateToken, async (req, res) => {
    const { theme } = req.body;
    if (!theme) {
        return res.status(400).json({ message: 'Theme preference is required.' });
    }
    try {
        await dbPool.query('UPDATE users SET theme = ? WHERE id = ?', [theme, req.userId]);
        res.json({ message: 'Preferences updated successfully' });
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ message: 'Error updating preferences.' });
    }
});


// ALSO, you must update your main GET /api/user endpoint to return these new fields.
// Replace your old '/api/user' endpoint with this one:

/**
 * @route   GET /api/user
 * @desc    Fetches a user's profile information, including avatar and theme.
 * @access  Private
 */
app.get('/api/user', authenticateToken, async (req, res) => {
    try {
        const [rows] = await dbPool.query(
            'SELECT name, email, avatar_url, theme FROM users WHERE id = ?',
            [req.userId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Error fetching user data.' });
    }
});






// --- START THE SERVER ---
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
