var couchapp = require('couchapp'),
    path = require('path');

var ddoc = {
  _id: '_design/tumblr-browsr',
  rewrites: require('./rewrites.json'),
  views: {},
  lists: {},
  shows: {}
};

couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;