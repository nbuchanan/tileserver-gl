var assert = require('assert');
var debug = require('debug');
var error = debug('app:error');

// by default stderr is used
error('goes to stderr!');

var log = debug('app:log');
// set this namespace to log via console.log
log.log = console.log.bind(console); // don't forget to bind to console!
log('goes to stdout');
error('still goes to stderr!');

// set all output to go via console.info
// overrides all per-namespace log settings
debug.log = console.info.bind(console);

describe('iso-utils', function() {
    describe('#indexLayerMetadata()', function() {
        it('should do stuff', function() {
            assert.equal(-1, [1,2,3].indexOf(4));

        });
    });
});