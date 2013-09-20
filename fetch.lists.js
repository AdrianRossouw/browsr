var cheerio = require('cheerio');
var nodeio  = require('node.io');
var request = require('request');
var debug   = require('debug')('tumblr:fetch.lists');
var async   = require('async');
var path    = require('path');
var url     = require('url');
var db      = require('nano')('http://localhost:5984/tumblr');
var _       = require('underscore');

_.templateSettings = { interpolate: /\{\{(.+?)\}\}/g };

var defaults = {
    name: 'tof34',
    count: 50,
    start: 1
};

var options = {
    timeout: 10,
    max: 4,
    retries: 3   
};
var tpl = _.template('http://{{name}}.tumblr.com/api/read?type=photo&num={{count}}&start={{start}}');

exports.job = new nodeio.Job({
    input: _.range(2000, 3500, 50),
    run: function (num) {
        var options = { start: num };
        _.defaults(options, defaults);
        var url = tpl(options);
        console.log(url);
        this.get(url, function(err, data, headers) {
            if (err) { return this.fail(err); }

            var $ = cheerio.load(data);
            var posts = $('tumblr post').map(mapJson(options, $));
            debug('fetched post count', posts.length);

            async.filter(posts, filterExisting, doEachLimit.bind(this));
        });
    }
});

function filterExisting(post, next) { db.head(post._id, next); }

function doEachLimit(posts) {
    debug('new post count', posts.length);
    async.eachLimit(posts, 5, doWaterfall, completed.bind(this)); 
}

function doWaterfall(post, next) {
    debug('waterfall', post._id);
    async.waterfall([
        async.apply(saveDocument, post),
        streamAttachment
    ], next);
}

function saveDocument(post, next) {
    debug('saveDocument', post._id);
    db.insert(post, post._id, function(err, data) {
        next(err, _.extend({}, post, data));
    });
}

function streamAttachment(post, next) {
    debug('streamAttachment', post.image, post._id, post.rev);

    var reader = request.get(post.image);
    var writer = db.attachment.insert(
        post._id, 'image.' + post.extension,
        null, 'image/' + post.extension,
        { rev: post.rev }, next);

    reader.pipe(writer);
}

function completed(err, result) {
    debug('completed', result);
    if (err) { return this.fail(err); }
    this.emit(result);
}

function mapJson(options, $) {
    return function mapFn() {
        var $el = $(this);

        var id = options.name + '--' + $el.attr('id') ;
        var img = $el.find('photo-url[max-width=1280]').text();
        var tags = $el.find('tag').map(function() { return $(this).text(); });
        var ext = path.extname(url.parse(img).pathname);

        return {
            _id       : id,
            id        : id,
            url       : $el.attr('url'),
            type      : 'photo',
            date      : $el.attr('date-gmt'),
            timestamp : $el.attr('unix-timestamp'),
            width     : $el.attr('width'),
            height    : $el.attr('height'),
            reblogKey : $el.attr('reblog-key'),
            image     : img,
            extension : ext.replace(/^\./,''),
            tags      : tags
        };
    };
}

