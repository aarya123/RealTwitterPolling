var express = require("express");
var app = express();
var twitter = require("ntwitter");
var url = require('url');
var btoa = require('btoa');
var atob = require('atob');

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
app.get("/results", function(req, res) {
	res.sendfile("public/results.html");
});
app.get("/graphData", function(req, res) {
	console.log(graphData);
	if(req.query && req.query.id) {
		res.setHeader('content-type', 'application/json');
		res.write(JSON.stringify(graphData[req.query.id]));
		res.end();
	}
	/*if(graphData[atob(req.query.id)]) {
		
	}
	else {
		res.statusCode = 404;
		res.end();
	}*/
});

//try to store only 1 user stream per user
var streams = {};

//graph data
var graphData = {};


function Question(id_str, question, answers) {
	this.id_str = id_str.toString();
	this.rawQuestionText = question;
	var hashTags = question.match(hashtagRegex);
	if(hashTags && hashTags.length == 1) {
		this.questionText = hashTags[0];
	}
	else {
		throw "Invalid question " + question;
	}
	this.answers = {};
	for(var i = 0; i < answers.length; ++i) {
		if(answers[i].indexOf("#") != -1) {
			throw "Invalid answer " + answer;
		}
		this.answers[answers[i]] = 0;
	}
	this.voters = {};
}

Question.prototype.isQuestionMatch = function(question) {
	return this.id_str == question.id_str && this.questionText == question.questionText;
}

function Answer(rawAnswer) {
	this.addr_id_str = rawAnswer.in_reply_to_user_id_str;
	if(!this.addr_id_str) {
		throw "Invalid answer " + rawAnswer.text + " no id";
	}
	this.id_str = rawAnswer.user.id_str;
	var hashTags = rawAnswer.text.match(hashtagRegex);
	console.log(hashTags);
	if(hashTags && hashTags.length == 2) {
		this.questionText = hashTags[0];
		this.answerText = hashTags[1];
		this.answerText = this.answerText.replace("#","");
	}
	else {
		throw "Invalid answer " + rawAnswer.text + " no hash tag";
	}
}

Question.prototype.isAnswerMatch = function(answer) {
	console.log(answer.addr_id_str == this.id_str);
	console.log(answer.questionText == this.questionText);
	console.log(answer.answerText);
	console.log(this.answers[answer.answerText]);
	return answer.addr_id_str == this.id_str && 
	answer.questionText == this.questionText && 
	this.answers[answer.answerText] >= 0 &&
	!this.voters[answer.id_str];
}

Question.prototype.doAnswerMatch = function(answer) {
	this.answers[answer.answerText]++;
	this.voters[answer.id_str] = true;
}

Question.prototype.toString = function() {
	return [this.id_str, this.questionText, this.answers].toString();
}

Answer.prototype.toString = function() {
	return [this.addr_id_str, this.id_str, this.questionText, this.answerText].toString();
}

Question.prototype.getAnswerString = function() {
	var answerString = "Results of " + this.questionText + ":";
	for(var answer in this.answers) {
		answerString += " #" + answer + " = " + this.answers[answer];
	}
	return answerString;
}

Question.prototype.getQuestionString = function() {
	var questionString = "Poll: " + this.rawQuestionText;
	questionString += " Answers:";
	for(var answer in this.answers) {
		questionString += " #" + answer;
	}
	return questionString;
}

function UserStream(twit, user_id) {
	var self = this;
	this.questions = [];
	this.twit = twit;
	twit.stream("statuses/filter", {"follow": user_id}, function(stream) {
		self.stream = stream;
		stream.on('data', function(data) {
			try {
				self.onData(data);
			}
			catch(e) {
				console.log(e);
			}
		})
	});
	
}

UserStream.prototype.addQuestion = function(newQuestion,interval) {
	for(var i = 0; i < this.questions.length; ++i) {
		if(newQuestion.isQuestionMatch(this.questions[i])) {
			throw "found duplicate question " + newQuestion.toString();
		}
	}
	this.questions.push(newQuestion);
	var self = this;
	console.log(interval);
	setTimeout(function() {
		console.log(newQuestion);
		self.finishQuestion(newQuestion);
	}, interval);

}

UserStream.prototype.finishQuestion = function(question) {
	var answerString = question.getAnswerString();
	var id = Math.floor(Math.random() * 10000000);
	graphData[id] = {};
	graphData[id].answers = question.answers;
	graphData[id].question = question.questionText;
	console.log(answerString);
	this.twit.updateStatus(answerString, function(err, data) {});
	this.twit.updateStatus("Check out the results at " +
		"localhost/results?id=" + id, function(err, data) {});
	this.questions = this.questions.splice(
		this.questions.indexOf(question), 1
		);
	if(this.questions.length == 0) {
		this.stream.destroy();
		delete streams[this.user_id];
	}
}

UserStream.prototype.onData = function(data) {
	var newAnswer = new Answer(data);
	console.log(newAnswer);
	for(var i = 0; i < this.questions.length; ++i) {
		console.log(this.questions[i]);
		if(this.questions[i].isAnswerMatch(newAnswer)) {
			this.questions[i].doAnswerMatch(newAnswer);
			console.log("match!");
		}
		else {
			console.log("no match!");
		}
	}
}


//convenient regex for hashtags
var hashtagRegex = /\S*#(?:\[[^\]]+\]|\S+)/g;


app.post("/askQuestion", function(req, res) {
	var twit = new twitter({
		"consumer_key": consumer_key,
		"consumer_secret": consumer_secret
	});
	if(twit.gatekeeper()(req,res,function(){
		console.log(req.body);
		var req_cookie = twit.cookie(req);
		var user_id = req_cookie.user_id;
		//not secure at all, but whatever
		twit.options.access_token_key = req_cookie.access_token_key;
		twit.options.access_token_secret = req_cookie.access_token_secret;
		var newQuestion, interval;
		try {
			newQuestion = new Question(req_cookie.user_id,
				req.body.question,
				req.body.answers);
			interval=req.body.interval;
		}
		catch(e) {
			console.log(e);
			return false;
		}
		if(!streams[user_id]) {
			streams[user_id] = new UserStream(twit, user_id);
		}
		streams[user_id].addQuestion(newQuestion,interval);
		twit.updateStatus(newQuestion.getQuestionString()
			, function(err, data) {});
		return true;
	})) {
		res.write("OK");
	}
	else {
		res.write("FAIL");
	}
	res.end();
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
