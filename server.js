var express = require("express");
var app = express();
var twitter = require("ntwitter");
var mongojs = require('mongojs');
var db = mongojs('db')
var url = require('url');
var collection = db.collection("test");
 
 app.use(express.static(__dirname+'/public'));

 /* serves main page */
 app.get("/", function(req, res) {
    res.sendfile('public/index.html');
 });

 app.get("/form", function(req, res) {
 	res.sendfile('public/form.html');
 })

 app.get("/auth", function(req, res) {
 	var twit = new twitter({
 		consumer_key: "cjcr0YpkTnPreVobBkQ",
 		consumer_secret: "s9OFkPoL3FaU604fBhyekPsOxxmJaFMKKlMgAiCagZ4"
 	});
 	var path = url.parse(req.url, true);
 	var tlog = twit.login(path.pathname, "/form")(req, res);
 })

 app.get("/GetAnswer", function(req, res) {

 });

 app.get("/AskQuestion", function(req, res) {

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