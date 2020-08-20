var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var modelRouter = require('./routes/model');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api/model', modelRouter);
app.use(function(req, res, next) {
    res.sendStatus(404);
});

module.exports = app;
