const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'appuser', 
    password: 'app2027',  
    database: 'bettys_movies'  
});

connection.connect(err => {
    if (err) throw err;
    console.log('Database connected!');
});

module.exports = connection;
