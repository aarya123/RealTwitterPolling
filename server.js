var express = require("express");
var app = express();
var twitter = require("ntwitter");
var url = require('url');
var twit = initTwit();
app.use(express.static(__dirname+'/public'));
app.use(express.bodyParser());
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
/* serves main page */
app.get("/", function(req, res) {
	res.sendfile('public/index.html');
});

app.get("/form", function(req, res) {
	res.sendfile('public/form.html');
});

app.get("/sign_in", function(req, res) {
	var path = url.parse(req.url, true);
	var tlog = twit.login(path.pathname, "/sign_in_callback")(req, res);
});

app.get("/sign_in_callback", function(req, res) {
	twit.gatekeeper()(req,res,function(){
		setKeys(twit.cookie(req));
		res.statusCode = 302;
		res.setHeader("Location", "/form");
		res.end();
	});
});

app.get("/GetAnswer", function(req, res) {

});

app.post("/askQuestion", function(req, res) {
	twit.gatekeeper()(req,res,function(){
		console.log(req.body);
		twit.updateStatus(req.body.question + 
			" " + req.body.answers.join(','), function(err, data) {
				console.log(err);
			});
	});
});

function initTwit(){
	return new twitter({
		"consumer_key": "cjcr0YpkTnPreVobBkQ",
		"consumer_secret": "s9OFkPoL3FaU604fBhyekPsOxxmJaFMKKlMgAiCagZ4"
	});
}
function setKeys(req_cookie){
	twit.options.access_token_key = req_cookie.access_token_key;
	twit.options.access_token_secret = req_cookie.access_token_secret; 
	twit.verifyCredentials(function (err, data) {
		if(err)
			console.log("Verification failed : " + err)
	});
}