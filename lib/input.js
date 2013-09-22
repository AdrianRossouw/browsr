var nodeio  = require('node.io');
var _ = require('underscore');


var options = {
    timeout: 10,
    max: 4,
    retries: 3   
};

exports.job = new nodeio.Job(options, {
    input: function(start, num, next) {
        if (this.options.args.length < 1) {
            console.log('format : node.io test sitename [start=1] [total=1000] [incr=100]');
            this.exit(false);
        }
        var opts = _(this.options.args).map(function(n, i) {
            if (i === 0) { return n; }
            return parseInt(n, 10);
        });

        this.options._args = _(['name', 'start', 'total', 'incr']).object(opts);
        _.defaults(this.options._args, { start: 1, total:1000, incr: 10});

        var total = this.options._args.start + this.options._args.total;
        var range = _.range(this.options._args.start, total, this.options._args.incr);

        if (start > range.length) { return false; }

        return _(range).chain()
            .rest(start)
            .first(num)
            .map(mapRes.bind(this))
            .value();


        function mapRes(n) {
            var obj = {};

            obj.name = this.options._args.name;
            obj.start = n;
            obj.incr = this.options._args.incr;
            obj.end = obj.start + obj.incr - 1;
            obj.remaining = Math.ceil((total - obj.end) / obj.incr) - 1;

            return obj;
        }
    }
});
