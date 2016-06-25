/**
 * Created by Bruce on 16/6/25.
 */
var debug = require('debug')('Express4');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function(socket){
  socket.emit("hello");
  console.log('a user connected');
});

app.use(function (req, res, next) {
  req.socket = io;
  next()
});

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res) {
  var err = new Error('Not Found');
  err.status = 404;
  res.status(err.status || 500);
  res.end(err.message);
});


app.set('port', process.env.PORT || 3001);

var server = http.listen(app.get('port'), function(){
  debug('Express server listening on port ' + server.address().port);
});