var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');


var index = require('./routes/index');
var chat = require('./routes/chat');

var app = express();

//create server
var server = http.createServer(app);

//create socket
var io = require('socket.io')(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/chat', chat);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var db = mongoose.createConnection('localhost', 'chat');
db.on('error', function(err) {
  console.log(err);
});

var Schema = mongoose.Schema;

var chatHistory = new Schema({
  username: String,
  content: String,
  time: String
});

var chatHistoryModel = db.model('history', chatHistory);

users = [];
connections = [];

io.on('connection', function(socket) {
  connections.push(socket);
  console.log('%s sockets connected', connections.length);
  socket.on('join', function(user) {
    socket.username = user;
    users.push(user);
    var messages = chatHistoryModel.find(function(err, list) {
      if(err) return console.log(err);
      socket.emit('show history', list);
    });
    io.emit('system', user, 'joins');
    updateUser();
  });
  socket.on('send', function(user, message) {
    var time = new Date(Date.now()).toLocaleString();
    var chatting = new chatHistoryModel({
      username: user,
      content: message,
      time: time
    });
    chatting.save(function(err, res) {
      if(err) return console.log(err);
      console.log(res);
    });
    io.emit('chat', user, message, time);
  });
  socket.on('disconnect', function() {
    users.splice(users.indexOf(socket.username), 1);
    connections.splice(connections.indexOf(socket), 1);
    updateUser();
    io.emit('system', socket.username, 'leaves');
  });

  function updateUser() {
    io.emit('list user', users);
  }
});

module.exports = {app: app, server:server};
