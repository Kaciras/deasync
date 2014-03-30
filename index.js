var binding = require('bindings')('deasync');

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
