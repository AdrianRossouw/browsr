var express = require('express');
var http    = require('http');
var url     = require('url');
var path     = require('path');
var request = require('request');
var _       = require('underscore');
var app     = express();

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
app.all('/search/*' , passthrough(esUrl, '/search'));

app.get('/'  , getIndex);
app.get('/*' , getIndex); // catch-all

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
