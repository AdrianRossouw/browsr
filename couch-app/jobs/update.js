var nodeio    = require('node.io');
var _         = require('underscore');
var nano      = require('nano');
var config    = require('../../config.json');
var util      = require('../../util.js');

var db        = require('nano')(util.dbUrl(config.couchdb));
var designDoc = config.couchdb.designDoc || 'app';

var options = {
    timeout : 10,
    max     : 50,
    retries : 3
};

exports.job = new nodeio.Job(options, {
    input: function(start, num, next) {
        var error = next.bind(null, false);
        util.promise(db.list, {limit: num, skip: start})
            .then(parseList, error);

        function parseList(result) {
            var keys = _(result.rows).chain()
                .pluck('id')
                .reject(isDesignDoc)
                .value();

            util.promise(db.fetch, {keys:keys}, {include_docs: true})
                .then(parseDocs, error);
        }

        function parseDocs(result) {
            var docs = _(result.rows).chain()
                .pluck('doc')
                .map(_defaults)
                .map(_pick)
                .value();

            next(docs);

            function _defaults(obj) {
                return _.defaults(obj, { dbVersion: 0 });
            }
            function _pick(obj) {
                return _.pick(obj, '_id', 'dbVersion');
            }
        }
    },

    run: function(input) {
        var emit = this.emit.bind(this);
        var fail = this.fail.bind(this);

        var updatesMissing = _.range(input.dbVersion, config.couchdb.dbVersion);

        var promises = _(updatesMissing).map(atomicUpdate);

        _.when(promises).then(emit, fail);

        function atomicUpdate(num) {
            var msg = 'update ' + num + ' on ' + input._id;
            return util.promise(db.atomic, designDoc, "update_"+num, input._id)
               .then(message('[success] ' + msg), message('[error]  ' + msg));
        }
    }
});

function message(msg) {
    return function() { return msg; };
}

function isDesignDoc(key) {
    return (/^_design\//).test(key);
}
