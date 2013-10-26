var nodeio  = require('node.io');
var jobs    = require('./jobs');
var express = require('express');
var http    = require('http');
var url     = require('url');
var path    = require('path');
var request = require('request');
var util    = require('./util');
var _       = require('underscore');
var app     = express();
var config  = require('./config');

var couchUrl = util.designDocUrl(config.couchdb) + '/_rewrite';
var esUrl = util.dbUrl(config.elasticsearch);

app.get('/js/*'    , passthrough(couchUrl));
app.get('/fonts/*' , passthrough(couchUrl));
app.get('/css/*'   , passthrough(couchUrl));
app.get('/img/*'   , passthrough(couchUrl));
app.get('/views/*' , passthrough(couchUrl));
app.all('/api/*'   , passthrough(couchUrl));
app.all('/search/*', passthrough(esUrl, 'search/pvt2/'));

var _jobs = [];

app.get('/jobs/:driver/*?', function(req, res, next) {
    var driver = req.params.driver;
    var args = (req.params[0]) ? req.params[0].split('/') : [];
    var key = [driver].concat(args).join('/');

    if (!jobs[driver]) { 
        return res.send(404, {status: 'no such job'});
    }

    if (_jobs[key]) {
        var state = _jobs[key].state();
        var _stateMap = {
            'rejected' : 500,
            'resolved' : 200,
            'pending'  : 202
        };

        res.send(_stateMap[state], {status: state});
    } else {
        _jobs[key] = util.promise(
            nodeio.start,
            jobs[driver].job,
            {args: args}
        );

        res.send(201, {status: 'started'});
    }
});

app.get('/' , getIndex);
app.get('/*', getIndex); // catch-all

app.listen(5000);

// pass the request through unhindered,
// with it's additional pathname specified.
function passthrough(targetUrl, match, replace) {
    return function(req, res, next) {
        var _url = targetUrl;
        _url += !match ? req.url : req.url.replace(match, replace || '');
        req.pipe(request(_url)).pipe(res);
    };
}

// all requests will return only the index page.
// this allows for html5 pushState in angular.
function getIndex(req, res, next) {
    req.pipe(request(couchUrl)).pipe(res);
}
