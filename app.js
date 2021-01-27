var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var { sequelize } = require('./models');

// Test the connection to the database
(async () => {  
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    // If connection is succesful then sync the database
    await sequelize.sync();
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/static', express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error();
  err.status = 404;
  err.message = "Oops! It seems the page could not be found...";
  res.render('page-not-found', {err, title: "Page Not Found"});
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message || "Oops! It seems like there was a problem...";
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.log(err.status, err.message);
  res.render('error', {err, title: "Server Error"});
});

module.exports = app;
