var express = require("express");
var app = express();
 
 app.use(express.static(__dirname+'/public'));

 /* serves main page */
 app.get("/", function(req, res) {
    res.sendfile('public/form.html')
 });
 

 var port;
 if(process.argv.length >= 3) {
 	port = process.argv[2];
 }
 else {
 	port = 5000;
 }
 app.listen(port, function() {
   console.log("Listening on " + port + " " + __dirname);
 });