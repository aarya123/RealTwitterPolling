var express = require("express");
var app = express();
var twitter = require("ntwitter");
var mongojs = require('mongojs');
var db = mongojs('db')
var url = require('url');
var collection = db.collection("test");
 
app.use(express.static(__dirname+'/public'));
app.use(express.bodyParser());

/* serves main page */
app.get("/", function(req, res) {
	res.sendfile('public/index.html');
});

app.get("/form", function(req, res) {
	res.sendfile('public/form.html');
})

var consumer_key = "cjcr0YpkTnPreVobBkQ";
var consumer_secret = "s9OFkPoL3FaU604fBhyekPsOxxmJaFMKKlMgAiCagZ4";
app.get("/sign_in", function(req, res) {
	var twit = new twitter({
		"consumer_key": consumer_key,
		"consumer_secret": consumer_secret
	});
	var path = url.parse(req.url, true);
	var tlog = twit.login(path.pathname, "/sign_in_callback")(req, res);
})

app.get("/sign_in_callback", function(req, res) {
	var twit = new twitter({
		"consumer_key": consumer_key,
		"consumer_secret": consumer_secret
	});
	twit.gatekeeper()(req,res,function(){
	    req_cookie = twit.cookie(req);
	    twit.options.access_token_key = req_cookie.access_token_key;
	    twit.options.access_token_secret = req_cookie.access_token_secret; 

	    twit.verifyCredentials(function (err, data) {
	      if(err)
	        console.log("Verification failed : " + err)
	    });
	    res.statusCode = 302;
	    res.setHeader("Location", "/form");
	    res.end();
	});
});

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