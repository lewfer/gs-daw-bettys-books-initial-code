// Create a new router
const express = require("express")
const router = express.Router()

router.get('/register', function (req, res, next) {
    res.render('register.ejs')                                                               
})    

router.post('/registered', function (req, res, next) {
    // saving data in database
    res.send(' Hello '+ req.body.first + ' '+ req.body.last +' you are now registered!  We will send an email to you at ' + req.body.email)                                                                           
})

// Export the router object so index.js can access it
module.exports = router