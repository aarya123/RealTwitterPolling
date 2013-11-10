var express = require("express");
var app = express();
 
 /* serves main page */
 app.get("/", function(req, res) {
    res.sendfile('index.html')
 });
 
 var port = process.env.PORT || 80;
 app.listen(port, function() {
   console.log("Listening on " + port + " " + __dirname);
 });