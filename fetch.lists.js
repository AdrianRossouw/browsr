var cheerio        = require('cheerio');
var nodeio         = require('node.io');
var request        = require('request');
var debug          = require('debug')('tumblr:fetch.lists');
var async          = require('async');
var path           = require('path');
var url            = require('url');
var db             = require('nano')('http://localhost:5984/tumblr');
var _              = require('underscore');
var Input          = require('./lib/input').job;

_.templateSettings = { interpolate: /\{\{(.+?)\}\}/g };


var tpl = _.template('http://{{name}}.tumblr.com/api/read?type=photo&num={{incr}}&start={{start}}');

exports.job = new Input.extend({
    run: function (input) {
        var url = tpl(input);
        debug('input is ', input);
        this.get(url, function(err, data, headers) {
            if (err) { return this.fail(err); }

            var $ = cheerio.load(data);
            var posts = $('tumblr post').map(mapJson(input, $));
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

    async.eachSeries(post.images, function(image, next) {
        debug('streamAttachment', image.url, post._id, post.rev);
        // create a stream to write the attachment to.
        var writer = db.attachment.insert(
            post._id, image.maxWidth+'/'+image.fileno, null,
            image.mimetype, { rev: post.rev }, captureRev);

        // create a stream to pipe it from
        var reader = request.get(image.url, captureError);
        reader.pipe(writer);

        // keep track of the last post revision
        function captureRev(err, data) {
            if (err) { return next(err); }

            _.extend(post, data);

            _.delay(next, 2000, null, data.rev);
        }

        function captureError(err, resp, body) {
            if (err) {
                next(err);
            }
        }

    }, next);
}

function completed(err, result) {
    debug('completed', result);
    if (err) { return this.fail(err); }
    this.emit(result);
}

function mapJson(input, $) {
    return function mapFn() {
        var $el = $(this);
        var id = 'tumblr--' + input.name + '--' + $el.attr('id') ;
        var img = _([1280, 500]).reduce(imageForSize, []);
        var tags = $el.find('tag').map(getTextFn);
        var imgcount = _(img).chain().pluck('fileno').max().value() + 1;

        return {
            _id          : id,
            id           : id,
            driver       : 'tumblr',
            site         : input.name,
            url          : $el.attr('url'),
            type         : 'photo',
            caption      : $el.find('photo-caption').text(),
            date         : $el.attr('date-gmt'),
            timestamp    : $el.attr('unix-timestamp'),
            reblogKey    : $el.attr('reblog-key'),
            images       : img,
            images_count : imgcount,
            tags         : tags
        };


        function imageForSize(m, w) {
            var selector = 'photo-url[max-width='+w+']';
            var files    = $el.find(selector);
            var images   = _(files).map(imageObj);

            m = m.concat(images || []);
            return m;

            function imageObj(imgEl, i) {
                var $imgEl   = $(imgEl);
                var src      = $imgEl.text();
                var width    = $imgEl.parent().attr('width');
                var height   = $imgEl.parent().attr('height');
                var pathname = url.parse(src).pathname;
                var ext      = path.extname(pathname).replace(/^\./,'');

                return {
                    url      : src,
                    fileno   : i,
                    width    : parseInt(width, 10),
                    height   : parseInt(height, 10),
                    maxWidth : w,
                    path     : id+'/'+w+'/'+i,
                    mimetype : 'image/'+ext,
                    ext      : ext
                };
            }
        }

        function getTextFn() { return $(this).text(); }
    };
}

