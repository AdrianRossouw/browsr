var couchapp = require('couchapp'),
mime = require('couchapp/mimetypes'),
path = require('path');

mime.types.woff = 'application/x-font-woff';

var ddoc = {
    _id: '_design/app',
    rewrites: require('./rewrites.json'),
    filters: {
        noDesign: function(doc, req) {
            if (doc._id === '_design/app') {
                return false;
            } else {
                return true;
            }
        }
    },
    views: {
        missing: {
            map: function(doc) {
                if (doc.images && !doc._attachments) {
                    return emit(doc._id + '?_rev=' + doc._rev, doc._id);
                }
                if (doc.images && doc._attachments) {
                    var keys = doc.images.map(function(img) {
                        return img.maxWidth+"/"+img.fileno;
                    });
                    keys.map(function(key) {
                        if (!doc._attachments[key]) {  emit(doc._id + '?_rev=' + doc._rev, key); }
                    });
                }
            }
        },
        wrongsize: {
            map: function(doc) {
                var extract = /_([0-9])*\..{3}$/;
                if (doc.images) {
                    doc.images.forEach(function(img) {
                        if (img.maxWidth === 1280) {
                            var matches = extract.exec(img.url);
                            var urlSize = parseInt(matches[1], 10);

                            if ((urlSize === 500) && (img.width > 500)) {
                                emit(doc._id, img);
                            }
                        }
                    });
                }
            }

        }
    },
    lists: {},
    shows: {}
};

couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;
