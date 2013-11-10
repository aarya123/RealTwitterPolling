usernameLength = 9;
var answers = Array();
var brs = Array();
/* TODO
** Add remove feature
** Maybe X next to each element?
** Or remove last
*/
function addAnswer() {
	element = document.createElement("input");
	element.type = "text";
	element.name = "answer["+answers.length+"]";
	element.placeholder = "#"+(answers.length+1);
	answers.push(element);
	br = document.createElement("br");
		answersDiv.appendChild(element);
		brs.push(br);
	answersDiv.appendChild(br);
		remove.disabled = (answers.length <= 2);
}

function removeLast() {
	if(answers.length > 2) {
		answersDiv.removeChild(answers.pop());
		remove.disabled = (answers.length <= 2);
		answersDiv.removeChild(brs.pop());
	}
}
function eLen(elem) {
	return elem.value.len;
}

setInterval(function(){
	var count = 25;
	count+=usernameLength;
	count+=question.value.length;
	for(i=0;i<answers.length;i++) {
		count+=answers[i].value.length;
	}
	count+=3*answers.length;
	counter.value = 140 - count;
	submit.disabled = (count > 140);
},100);

function submit() {
	var req = new XMLHttpRequest();
	req.open('POST', 'askQuestion', true);
	req.setRequestHeader("Content-type", "application/json");
	var post = {};
	post.question = question.value;
	post.answers = [];
	var total=60000;
	if(Interval.value=='s')
		total=timeLength.value*1000;
	if(Interval.value=='m')
		total=timeLength.value*60000;
	if(Interval.value=='h')
		total=timeLength.value*3600000;
	if(Interval.value=='d')
		total=timeLength.value*86400000;
	post.interval=total;
	for(var i = 0; i < answers.length; ++i) {
		post.answers[i] = answers[i].value;
	}
	console.log(post);
	req.send(JSON.stringify(post));
}