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
    views: {},
    lists: {},
    shows: {}
};

couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;
