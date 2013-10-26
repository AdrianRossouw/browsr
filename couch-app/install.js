var request = require('request');
var util    = require('../util');
var _ = require('underscore');

// load all the required json files
var config  = require('../config.json');
var mapping = require('./mapping.json');
var meta    = require('./river.json');

// set up the local config vars
var index      = util.dbUrl(config.elasticsearch);
var river   = util.riverUrl(config.elasticsearch);

meta.couchdb.db = config.couchdb.db;
meta.index.index = config.elasticsearch.db;

// short hand for the promises later
var log     = console.log.bind(console);
var del     = _.partial(util.promise, request.del);

// Attempt to delete the old rivers, but create new
// ones regardless of the outcome.
_.when(del(river), del(index))
   .then(createThings, createThings)
   .done(function(){ log('Created ES search Index'); })
   .fail(function(){ log('ES search Index failed'); });

function createThings() {
    return _.when(
        put(index, mapping),
        put(river + '/_meta', meta)
    );
}

function put(url, data) {
    return util.promise(request.put, {
        url: url,
        json: data
    });
}
