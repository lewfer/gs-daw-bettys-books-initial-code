// Import express and ejs
var express = require('express');
var ejs = require('ejs');
var session = require('express-session');
var validator = require('express-validator');

// Import mysql module
var mysql = require('mysql2');

// Create the express application object
const app = express();
const port = 8000;
const expressSanitizer = require('express-sanitizer');

// Create a session
app.use(session({
    secret: 'somerandomstuff',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));

// Create an input sanitizer
app.use(expressSanitizer());

// Middleware to make user info available in all templates
app.use((req, res, next) => {
    res.locals.user = req.session.userId ? { username: req.session.userId } : null;
    next();
});

// Tell Express that we want to use EJS as the templating engine
app.set('view engine', 'ejs');

// Set up the body parser 
app.use(express.urlencoded({ extended: true }));

// Set up public folder (for css and static js)
app.use(express.static(__dirname + '/public'));

// Define the database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'appuser',
    password: 'app2027',
    database: 'bettys_movies'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});
global.db = db;

// Define our application-specific data
app.locals.shopData = { shopName: "Betty's Movies" };

// Load the route handlers
const mainRoutes = require("./routes/main");
app.use('/', mainRoutes);
// Load the route handler for /api-provision
app.use('/api-provision', mainRoutes); 

// Load the route handlers for /users
const usersRoutes = require('./routes/users');
app.use('/users', usersRoutes);

// Load the route handlers for /movies
const moviesRoutes = require('./routes/movies');
app.use('/movies', moviesRoutes);

// Load the route handler for /api
const recommendationRoute = require('./routes/recommendationRoute'); 
app.use('/api', recommendationRoute);



// Start the web app listening
app.listen(port, () => console.log(`Node app listening on port ${port}!`));
