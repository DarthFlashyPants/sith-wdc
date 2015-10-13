//modules ==========================================
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var r = require('rserve-client');
var app = express();

// Modules for handling xml requests and responses
var request = require('request');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser());
app.engine('html', require('ejs').renderFile);
app.use(cookieParser('Ronaldinho'));
app.use(session());

// Added this to allow WDC simulator running on the same machine to call in
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.get('/', function(req,res) {
	res.render('wdc.ejs', {
	});
});

app.post('/wdc/query', function (req, res) {
    // Get Cypher query text from request and pass it to an r function where it is exectued
    console.log('body: ',req.body);
    jsonObj = (req.body);
    console.log('jsonObj:', jsonObj);
    query = jsonObj["statement"];
    console.log('complete incoming query: ', query);
    inputToRserve = "createPathFromNeo4J(\"" + query + "\");";
    console.log('input parameter for client.evaluate: ', inputToRserve);
    var r = require('rserve-client');
    // Connect to Rserve on localhost, port 6311. Running with authentication disabled.
    r.connect('localhost', 6311, function (err, client) {
        // Execute query via createPathFromNeo4J() function sitting in R
        client.evaluate(inputToRserve, function (err, ans) {
            console.log("done: ", ans);
            client.end();
            // send respone to client
            res.send(ans);
        });
    });
});

app.get('/wdc', function(req,res) {
	console.log(req);
});


var port = Number(process.env.PORT || 8001);
app.listen(port);
console.log("Listening on port " + port);
