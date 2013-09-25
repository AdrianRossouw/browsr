var nodeio  = require('node.io');
var jobs    = require('./jobs');
var express = require('express');
var http    = require('http');
var url     = require('url');
var path    = require('path');
var request = require('request');
var _       = require('underscore');
var app     = express();

_.mixin(require('underscore.deferred'));
//app.use(express.urlencoded());
//app.use(express.json());


var couchUrl = {
    "protocol"   : "http:",
    "port"       : "5984",
    "hostname"   : "127.0.0.1",
    "pathname"   : "/pvt2/_design/app/_rewrite"
};

var esUrl = {
  "protocol" : "http:",
  "port"     : "9200",
  "hostname" : "127.0.0.1",
  "pathname" : "/"
};

app.get('/js/*'    , passthrough(couchUrl));
app.get('/fonts/*' , passthrough(couchUrl));
app.get('/css/*'   , passthrough(couchUrl));
app.get('/views/*' , passthrough(couchUrl));
app.all('/api/*'   , passthrough(couchUrl));
app.all('/search/*', passthrough(esUrl, '/search'));


var _jobs = [];

function promiseJob(job, args) {
    var dfr = new _.Deferred();

    return dfr.promise();
}

app.get('/jobs/:driver/*?', function(req, res, next) {
    var driver = req.params.driver;
    var args = (req.params[0]) ? req.params[0].split('/') : [];
    var key = [driver].concat(args).join('/');


    if (!jobs[driver]) { 
        return res.send(404, {status: 'no such job'});
    }

    if (_jobs[key]) {
        console.log(_jobs[key]);
        var state = _jobs[key].state();
        var _stateMap = {
            'rejected': 500,
            'resolved': 200,
            'pending': 202
        };

        res.send(_stateMap[state], {status: state});
    } else {
        _jobs[key] = promiseJob(jobs[driver].job, args);

        res.send(201, {status: 'started'});
    }
});


app.get('/' , getIndex);
app.get('/*', getIndex); // catch-all

app.listen(5000);

// pass the request through unhindered,
// with it's additional pathname specified.
function passthrough(targetUrl, pathChange) {
    return function(req, res, next) {
        var passUrl = {};
        _.defaults(passUrl, targetUrl);
        passUrl.pathname = path.join(targetUrl.pathname, req.url);

        if (pathChange) {
            passUrl.pathname = passUrl.pathname.replace(pathChange, '');
        }
        var _url = url.format(passUrl);
        req.pipe(request(_url)).pipe(res);
    };
}

// all requests will return only the index page.
// this allows for html5 pushState in angular.
function getIndex(req, res, next) {
    var _url = url.format(couchUrl);
    req.pipe(request(_url)).pipe(res);
}
