const assert = require("assert");
const { it } = require("mocha");
const { Worker } = require("worker_threads");
const  vm = require("vm");
const { join } = require("path");
const { readFileSync } = require("fs");

const filename = join(__dirname, "worker.js");

it("should run in worker threads", async () => {
	const worker = new Worker(filename);
	const value = await new Promise((resolve, reject) => worker.on("message", resolve).on("error", reject));
	assert.strictEqual(value, "ENOENT");
});

it("should run in new vm context", () => {
	const code = readFileSync(filename, "utf8");
	const context = { require };
	vm.runInNewContext(code, context);
	assert.strictEqual(context.value, "ENOENT");
});
