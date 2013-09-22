var couchapp = require('couchapp'),
    mime = require('couchapp/mimetypes'),
    path = require('path');

mime.types.woff = 'application/x-font-woff';

var ddoc = {
  _id: '_design/app',
  rewrites: require('./rewrites.json'),
  views: {},
  lists: {},
  shows: {}
};

couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;
