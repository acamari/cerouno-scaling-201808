var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var { spawnSync } = require('child_process');
var cmd = spawnSync('hostname');
var hostname = cmd.stdout.toString();
hostname = hostname.replace(/[^a-z0-9-]/gi, '');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), {
	setHeaders: res => res.set('x-hostname', `${hostname}`)
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/slow/:ms', async (req, res, next) => {
	const { ms = 1000 } = req.params;
	const slow = async (ms) => new Promise(resolve => {
		let i = 0;
		let stop = 0;
		let timer;

		setTimeout(() => {
			stop = 1;
			clearInterval(timer);
			resolve(i);
		}, ms);
		timer = setInterval(() => {
			const initial = i;
			while (!stop && i < (initial + 100)) {
				i = i + 0.0001
			}
		}, 1)
	})
	res.json({ host: hostname, i: await slow(ms) });
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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

module.exports = app;
