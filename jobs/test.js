var nodeio         = require('node.io');
var Input          = require('../lib/input').job;

exports.job = new Input.extend({
    run: function(input) {
        console.log(input);
        this.emit(input);
    }
});
