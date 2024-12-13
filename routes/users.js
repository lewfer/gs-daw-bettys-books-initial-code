const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const saltRounds = 10;
const { check, validationResult } = require("express-validator");

// Middleware to redirect if the user is not logged in
const redirectLogin = (req, res, next) => {
    if (!req.session.userId) {
        res.redirect('/users/login');  // Ensure the login route is correctly handled
    } else {
        next();
    }
};

// Render the registration page
router.get('/register', (req, res) => {
    res.render('register.ejs', { errors: [], previousData: {} });
});

router.post('/registered', [
    check('email').isEmail().withMessage('Invalid email address'),
    check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    check('username').notEmpty().withMessage('Username is required'),
    check('first').notEmpty().withMessage('First name is required'),
    check('last').notEmpty().withMessage('Last name is required')
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('register.ejs', { 
            errors: errors.array(), 
            previousData: req.body
        });
    }

    const plainPassword = req.body.password;
    bcrypt.hash(plainPassword, saltRounds, (err, hashedPassword) => {
        if (err) {
            return next(err);
        }

        const query = 'INSERT INTO users (username, first_name, last_name, email, hashed_password) VALUES (?, ?, ?, ?, ?)';
        const values = [req.body.username, req.body.first, req.body.last, req.body.email, hashedPassword];
        db.query(query, values, (err, result) => {
            if (err) {
                return next(err);
            }

            res.send(`Hello ${req.body.first} ${req.body.last}, you are now registered! We will send an email to you at ${req.body.email}. <a href="/users/login">Login here</a>`);
        });
    });
});

// Handle Reset Password Route (GET)
router.get('/resetpassword', (req, res) => {
    res.render('resetpassword.ejs', { error: null });
});

// Handle Reset Password (POST)
router.post('/resetpassword', (req, res, next) => {
    const email = req.body.email;
    const newPassword = req.body.newPassword;

    if (newPassword.length < 8) {
        return res.render('resetpassword.ejs', { error: 'Password must be at least 8 characters long' });
    }

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], (err, result) => {
        if (err) {
            return next(err);
        }

        if (result.length === 0) {
            return res.render('resetpassword.ejs', { error: 'No user found with this email' });
        }

        bcrypt.hash(newPassword, saltRounds, (err, hashedPassword) => {
            if (err) {
                return next(err);
            }

            const updateQuery = 'UPDATE users SET hashed_password = ? WHERE email = ?';
            db.query(updateQuery, [hashedPassword, email], (err, result) => {
                if (err) {
                    return next(err);
                }

                res.send(`Your password has been reset successfully. You can now log in with your new password. <a href="/users/login">Login here</a>`);
            });
        });
    });
});

// Render the login page
router.get('/login', (req, res) => {
    res.render('login.ejs');
});

// Handle login logic
router.post('/loggedin', (req, res, next) => {
    const username = req.body.username;
    const plainPassword = req.body.password;

    const query = 'SELECT id, username, first_name, hashed_password FROM users WHERE username = ?';
    db.query(query, [username], (err, result) => {
        if (err || result.length === 0) {
            return res.send('Invalid username or password.');
        }

        const user = result[0]; // Extracting user data from the result
        const hashedPassword = user.hashed_password;

        // Compare the hashed password with the plain password
        bcrypt.compare(plainPassword, hashedPassword, (err, match) => {
            if (err) {
                return next(err);
            }

            if (match) {
                // Store user data in session (id, username, and first name)
                req.session.userId = user.id; // Store userId
                req.session.username = user.username; // Store username
                req.session.firstName = user.first_name; // Store firstName

                res.redirect('/usr/416/');  // Redirect to the correct home page URL
            } else {
                res.send('Invalid username or password.');
            }
        });
    });
});


// Handle logout logic
router.get('/logout', redirectLogin, (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('index.ejs');
        }
        res.redirect('/usr/416/');  // Redirect to the correct home page URL
    });
});

module.exports = router;
