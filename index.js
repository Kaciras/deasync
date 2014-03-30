var fs = require('fs'), path = require('path');
var binding;

// Seed random numbers [gh-82]
Math.random();

// Look for binary for this platform
var modPath = path.join(__dirname, 'bin', process.platform+ '-'+ process.arch, 'deasync');
try {
	fs.statSync(modPath+ '.node');
	binding = require(modPath);
} catch (ex) {
	binding = require('bindings')('deasync');
}



function deasync(fn) {
	return function() {
		var done = false;
		var args = Array.prototype.slice.apply(arguments).concat(cb);
		var err;
		var res;

		fn.apply(this, args);

		while (!done) {
			binding.run();
		}
		if (err)
			throw err;

		return res;

		function cb(e, r) {
			err = e;
			res = r;
			done = true;
		}
	}
}

module.exports = deasync;

module.exports.sleep = deasync(function(timeout, done) {
	setTimeout(done, timeout);
});

module.exports.runLoopOnce = binding.run;
