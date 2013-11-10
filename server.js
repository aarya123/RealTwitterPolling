var express = require("express");
var app = express();
var twitter = require("ntwitter");
var url = require('url');
 
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
	    var req_cookie = twit.cookie(req);
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

app.post("/askQuestion", function(req, res) {
	var twit = new twitter({
		"consumer_key": consumer_key,
		"consumer_secret": consumer_secret
	});
	twit.gatekeeper()(req,res,function(){
		console.log(req.body);
		var req_cookie = twit.cookie(req);
		twit.options.access_token_key = req_cookie.access_token_key;
		twit.options.access_token_secret = req_cookie.access_token_secret;
		twit.verifyCredentials(function (err, data) {
			res.writeHead(200, {'Content-Type': 'text/plain'});
			if(err) {
				res.write("FAIL");
			}
			else {
				res.write("OK");
				twit.updateStatus(req.body.question + 
					" " + req.body.answers.join(','), function(err, data) {
						console.log(err);
					});
				console.log("OK");
				twit.stream("statuses/mentions_timeline", {}, function(stream) {
					console.log("statuses/mentions");
					stream.on('data', console.log);
					stream.on('error', function(data, code) {
						console.log(data, code);
						stream.destroy();
					})
				});
			}
			res.end();
	    });
	});
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