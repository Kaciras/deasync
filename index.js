/*!
 * deasync
 * https://github.com/abbr/deasync
 *
 * Copyright 2010-2015 Abbr
 * Released under the MIT license
 */
 
(function () {
		
	var fs = require('fs'),
		path = require('path'),
		binding;
	
	// Seed random numbers [gh-82]
	Math.random();
	
	// Look for binary for this platform
	var nodeV = 'node-' + /[0-9]+\.[0-9]+/.exec(process.versions.node)[0];
	var modPath = path.join(__dirname, 'bin', process.platform + '-' + process.arch + '-' + nodeV, 'deasync');
	try {
		fs.statSync(modPath + '.node');
		binding = require(modPath);
	}
	catch (ex) {
		binding = require('bindings')('deasync');
	}
	
	
	
	deasync = function (fn) {
		return function() {
			var done = false,
				err,
				res;
			var cb = function (e, r) {
				err = e;
				res = r;
				done = true;
			}
			var args = Array.prototype.slice.apply(arguments).concat(cb);
	
			fn.apply(this, args);
			
			//Wait until cb() has been called
			module.exports.loopUntil(function(){return !done;});
			
			if (err) throw err;
			return res;
		}
	}
	
	module.exports = deasync;
	
	module.exports.sleep = deasync(function(timeout, done) {
		setTimeout(done, timeout);
	});
	
	module.exports.runLoopOnce = function(){
		process._tickDomainCallback();
		binding.run();
	};
	
	module.exports.loopUntil = function(pred){
	  while(pred()){
		process._tickDomainCallback();
		if(pred()) binding.run();
	  }
	};

}());
