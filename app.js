/**
 * Created by Bruce on 16/6/25.
 */
var debug = require('debug')('Express4');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var uuid = require('uuid');

var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var word = '';

io.on('connection', function(socket){
  var dicts = [
    '天坛',
    '水立方',
    '鸟巢',
    '天安门',
    '鼓楼',
    '故宫',
    '长城',
    '糖葫芦',
    '烤鸭',
    '大裤衩'
  ];
  socket.emit("hello");
  console.log('A user connected');

  socket.on('type', function (data) {
    if(data==='painter') {
      console.log('画图者加入!');
    } else {
      console.log('猜图者加入!');
    }
  });

  socket.on('drawData', function (data) {
    io.emit('showData', data);
  });
  socket.on('clear', function () {
    io.emit('clear');
  });
  socket.on('nextWord', function () {
    word = dicts.pop();
    io.emit('word', word)
  });
  socket.on('getWord', function () {
    io.emit('word', word)
  })
  
  socket.on('verify', function (data) {
    if(data === word) {
      io.emit('done')
    }
  })
  
});

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res) {
  var err = new Error('Not Found');
  res.status(err.status || 500);
  res.end(err.message);
});


app.set('port', process.env.PORT || 3001);

var server = http.listen(app.get('port'), function(){
  debug('Express server listening on port ' + server.address().port);
});