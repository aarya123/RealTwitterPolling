var express = require("express");
var app = express();
var twitter = require("ntwitter");
var url = require('url');

//make public directory statically served and turn on body parser for the questions
app.use(express.static(__dirname+'/public'));
app.use(express.bodyParser());

/* serves main page */
app.get("/", function(req, res) {
	res.sendfile('public/index.html');
});

app.get("/form", function(req, res) {
	res.sendfile('public/form.html');
})

//1st leg of oauth
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


//2nd leg of oauth
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
	      if(err) //TODO: actually stop here
	      	console.log("Verification failed : " + err)
	  });
	    //3rd leg
	    res.statusCode = 302;
	    res.setHeader("Location", "/form");
	    res.end();
	});
});

//TODO: statistics
app.get("/GetAnswer", function(req, res) {

});

//responses to questions are stored here
var responses = {};
//try to store only 1 user stream per user
var streams = {};

//convenient regex for hashtags
var hashtagRegex = /[#]+[A-Za-z0-9-_]+/g

app.post("/askQuestion", function(req, res) {
	var twit = new twitter({
		"consumer_key": consumer_key,
		"consumer_secret": consumer_secret
	});
	twit.gatekeeper()(req,res,function(){
		console.log(req.body);
		var req_cookie = twit.cookie(req);
		var user_id = req_cookie.user_id;
		//not secure at all, but whatever
		twit.options.access_token_key = req_cookie.access_token_key;
		twit.options.access_token_secret = req_cookie.access_token_secret;
		//make sure each user has their own array inside the response array
		if(!responses[user_id]) {
			responses[user_id] = {};
		}
		//TODO: reorganize logic so it isn't inside verifyCredentials
		twit.verifyCredentials(function (err, data) {
			res.writeHead(200, {'Content-Type': 'text/plain'});
			if(err) {
				res.write("FAIL");
			}
			else {
				//We are only OK if there is exactly 1 hash tag in the question
				var matches = req.body.question.match(hashtagRegex);
				if(matches && matches.length == 1) {
					res.write("OK");
					var questionMatch = matches[0];
					//initial question status
					twit.updateStatus(req.body.question + 
						" #" + req.body.answers.join(' , #'), function(err, data) {
							if(!err) {
								//Make the specific question be its own array inside the user sub array
								responses[user_id][questionMatch] = {};
								//initialize all answers to 0
								var question = responses[user_id][questionMatch];
								for(var i = 0; i < req.body.answers.length; ++i) {
									question[req.body.answers[i]] = 0;
								}
							}
						});
					//if we don't already have a active user stream for this user, make a new one
					if(!streams[user_id]) {
						stream = twit.stream("user", function(stream) {
							//cleanup clears the stream from the stream array and outputs the final tally of answers
							function cleanup() {
								stream.destroy()
								delete streams[user_id];
								var question = responses[user_id][questionMatch];
								//# of votes is # of people who answered + # of answers - # of answers
								var votes = Object.keys(question).length - req.body.answers.length;
								var status;
								if(votes != 0) {
									//TODO: make this look better
									status = "Results for " + req.body.question + " -";
									for(var i = 0; i < req.body.answers.length; ++i) {
										var answer = req.body.answers[i];
										console.log(answer, question[answer]);
										status += " #" + answer + " = " + 
										(((question[answer] / votes) * 10000) / 100) + "%";
									}
								}
								else {
									status = "No votes for poll " + req.body.question + "!";
								}
								twit.updateStatus(status, function(err, data) {

								});
							}
							stream.on('data', function(data) {
								console.log(data.text);
								//if this user is talking to our user, check for a potential question being answered
								if(data.in_reply_to_user_id_str == user_id) {
									var matches = data.text.match(hashtagRegex);
									if(matches && matches.length == 2) {
										//question should be the 1st match and answer should be the second
										var question = matches[0], answer = matches[1];
										answer = answer.replace("#","");
										//if this question was asked by the user
										if(responses[user_id][question]) {
											var curQuestion = responses[user_id][question];
											//if the answer is valid
											if(curQuestion[answer] >= 0) {
												//if this user hasn't already voted
												if(!curQuestion[data.user.id]) {
													curQuestion[answer]++;
													curQuestion[data.user.id] = true;
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
										console.log(responses[user_id][question]);
									}
								}
							});
stream.on('error', function(data, code) {
	console.log("error", data, code);
	cleanup();
});
							//stream.on('destroy', cleanup);
							//stream.on('end', cleanup);
							//TODO: questions should be able to last longer than 1:40
							setTimeout(cleanup, 100000);
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
