const { readFile } = require("fs");
const { isMainThread, parentPort } = require("worker_threads");
const { deasync } = require("../index");

const readFileSync = deasync(readFile);

function transferErrorCode(value) {
	if (isMainThread) {
		globalThis.value = value;
	} else {
		parentPort.postMessage(value);
	}
}

try {
	readFileSync("__non_exists__");
	transferErrorCode(null);
} catch (error) {
	transferErrorCode(error.code);
}
