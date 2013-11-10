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

var responses = {};
var streams = {};

var hashtagRegex = /[#]+[A-Za-z0-9-_]+/g

app.post("/askQuestion", function(req, res) {
	var twit = new twitter({
		"consumer_key": consumer_key,
		"consumer_secret": consumer_secret
	});
	twit.gatekeeper()(req,res,function(){
		console.log(req.body);
		var req_cookie = twit.cookie(req);
		//not secure at all, but whatever
		twit.options.access_token_key = req_cookie.access_token_key;
		twit.options.access_token_secret = req_cookie.access_token_secret;
		if(!responses[req_cookie.user_id]) {
			responses[req_cookie.user_id] = {};
		}
		twit.verifyCredentials(function (err, data) {
			res.writeHead(200, {'Content-Type': 'text/plain'});
			if(err) {
				res.write("FAIL");
			}
			else {
				var matches = req.body.question.match(hashtagRegex);
				if(matches.length == 1) {
					res.write("OK");
					var questionMatch = matches[0];
					twit.updateStatus(req.body.question + 
						" #" + req.body.answers.join(' , #'), function(err, data) {
							if(!err) {
								responses[req_cookie.user_id][questionMatch] = {};
								var question = responses[req_cookie.user_id][questionMatch];
								for(var i = 0; i < req.body.answers.length; ++i) {
									question[req.body.answers[i]] = 0;
								}
							}
					});
					if(!streams[req_cookie.user_id]) {
						stream = twit.stream("user", function(stream) {
							function cleanup() {
								stream.destroy()
								console.log(1);
								delete streams[req_cookie.user_id];
								console.log(2);
								var question = responses[req_cookie.user_id][questionMatch];
								var votes = Object.keys(question).length - req.body.answers.length;
								var status;
								if(votes != 0) {
									status = "Results for " + req.body.question + " -";
									console.log(3);
									for(var i = 0; i < req.body.answers.length; ++i) {
										var answer = req.body.answers[i];
										console.log(answer, question[answer], votes);
										status += " #" + answer + " = " + 
										(((question[answer] / votes) * 10000) / 100) + "%";
									}
								}
								else {
									status = "No votes for poll " + req.body.question + "!";
								}
								twit.updateStatus(status, function(err, data) {

								});
								console.log(4);
							}
							stream.on('data', function(data) {
								console.log(data.text);
								if(data.in_reply_to_user_id_str == req_cookie.user_id) {
									//terrible
									var matches = data.text.match(hashtagRegex);
									console.log(data.text, matches);
									if(matches && matches.length == 2) {
										var question = matches[0], answer = matches[1];
										answer = answer.replace("#","");
										console.log(responses[req_cookie.user_id][question]);
										if(responses[req_cookie.user_id][question]) {
											var curQuestion = responses[req_cookie.user_id][question];
											if(curQuestion[answer] >= 0) {
												if(!curQuestion[data.user.id]) {
													curQuestion[answer]++;
													curQuestion[data.user.id] = true;
													console.log(curQuestion);
												}
												else {
													twit.updateStatus("@" + data.user.screen_name +
														" you already voted in my poll", function(err, data) {}); 
												}
											}
											else {
												twit.updateStatus("@" + data.user.screen_name + 
													" I couldn't understand " +
													"your reply to my poll. Try voting again", function(err, data) {});
											}
										}
									}
								}
							});
							stream.on('error', function(data, code) {
								console.log("error", data, code);
								cleanup();
							});
							//stream.on('destroy', cleanup);
							//stream.on('end', cleanup);
							setTimeout(cleanup, 60000);
						});
					}
					else {
						res.write("FAIL");
					}
				}
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