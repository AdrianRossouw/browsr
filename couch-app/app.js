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
    },
    updates: {
        "update_0": function(doc, req) {
            var message = 'no change';
            if (!doc.dbVersion && doc._id !== '_design/app') {
                doc.dbVersion = 1;
                message = 'initialized dbVersion field';
            }

            return [doc, message];
        },
        "update_1": function(doc, req) {
            var message = 'no change';
            if (doc.dbVersion < 2 && doc._id !== '_design/app') {
                doc.dbVersion = 2;

                if (doc.favorite) {
                    doc.rating = 3;
                }
                if (doc.favorDate) {
                    doc.lastSeen = doc.favorDate;
                }
                message = 'migrated to new rating format';
            }

            return [doc, message];
        },
        "lastSeen": function(doc, req) {
            var now = Date.now();
            var fiveMinAgo = now - 300000;

            if (!doc.lastSeen || (doc.lastSeen < fiveMinAgo)) {
                doc.lastSeen = now;
                return [doc, "last seen updated"];
            }

            return [null, 'seen recently'];
        }
    },
    lists: {},
    shows: {}
};

couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;
