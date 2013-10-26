var url  = require('url');
var path = require('path');
var _    = require('underscore');
var Dfr  = require('underscore.deferred');

_.mixin(Dfr);

function promise(fn) {
    var dfr = new _.Deferred();
    var args = _(arguments).rest();

    args.push(callbackFn);
    fn.apply(null, args);

    return dfr.promise();

    function callbackFn(err) {
        if (err) { return dfr.reject(err); }
        dfr.resolve(_(arguments).rest());
    }
}

function _defaults(obj) {
    return _.defaults({}, obj, {
        "protocol"   : "http:",
        "port"       : "80",
        "hostname"   : "127.0.0.1",
        "pathname"   : ""
    });

}

function dbUrl(obj) {
    obj = _defaults(obj);
    obj.db = obj.db || 'browsr';
    obj.pathname = path.join(obj.db, obj.pathname);

    return url.format(obj);
}

function riverUrl(obj) {
    obj = _defaults(obj);
    obj.river = obj.river || obj.db || 'tumble';
    obj.pathname = path.join('_river', obj.river);

    return url.format(obj);
}

function designDocUrl(obj) {
    obj = _defaults(obj);
    obj.designDoc = obj.designDoc || 'app';

    return dbUrl(obj)+"/_design/"+obj.designDoc;
}

// Create a function that returns a particular property of its parameter.
// If that property is a function, invoke it (and pass optional params).
function ƒ(name){ 
  var v,params=Array.prototype.slice.call(arguments,1);
  return function(o){
    return (typeof (v=o[name])==='function' ? v.apply(o,params) : v );
  };
}
 
// Return the first argument passed in
function I(d){ return d; } 

module.exports = {
    dbUrl          : dbUrl,
    riverUrl       : riverUrl,
    designDocUrl   : designDocUrl,
    promise        : promise,
    ƒ              : ƒ,
    I              : I
};
