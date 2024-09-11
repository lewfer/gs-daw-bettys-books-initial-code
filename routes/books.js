const express = require("express");
const router = express.Router();

router.get('/search',function(req,res){
    res.render("search.ejs");
});

router.get('/search-result', function (req, res) {
    //searching in the database
    //res.send("You searched for: " + req.query.keyword);

    let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.query.keyword + "%'"; // query database to get all the books
    // execute sql query
    db.query(sqlquery, (err, result) => {
        if (err) {
            res.redirect('./'); 
        }
        res.render("list.ejs", {availableBooks:result})
     });        
});


router.get('/list', function(req, res) {
    let sqlquery = "SELECT * FROM books"; // query database to get all the books
    // execute sql query
    db.query(sqlquery, (err, result) => {
        if (err) {
            res.redirect('./'); 
        }
          res.render("list.ejs", {availableBooks:result})
     });
});

router.get('/addbook', function (req, res) {
    res.render('addbook.ejs');
 });

router.post('/bookadded', function (req,res) {
    // saving data in database
    let sqlquery = "INSERT INTO books (name, price) VALUES (?,?)";
    // execute sql query
    let newrecord = [req.body.name, req.body.price];
    db.query(sqlquery, newrecord, (err, result) => {
        if (err) {
            return console.error(err.message);
        }
        else
            res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.price);
    });
});    

router.get('/bargainbooks', function(req, res) {
    let sqlquery = "SELECT * FROM books WHERE price < 20";
    db.query(sqlquery, (err, result) => {
      if (err) {
         res.redirect('./');
      }
      res.render("bargains.ejs", {availableBooks:result})
    });
});   


// Export the router object so index.js can access it
module.exports = router;