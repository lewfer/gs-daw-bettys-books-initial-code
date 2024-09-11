// Create a new router
const express = require("express");
const router = express.Router();

// Handle our routes
router.get('/',function(req,res){
    res.render('index.ejs')
});

router.get('/about',function(req,res){
    res.render('about.ejs');
});

// Export the router object so index.js can access it
module.exports = router;