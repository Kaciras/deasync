import * as assert from "assert";
import { readFile } from "fs";
import { performance } from "perf_hooks";
import { deasync } from "../index";

it("should work with sync function", () => {
	const fn = deasync(callback => callback(null, 114514));
	assert.strictEqual(fn(), 114514);
});

it("should throw error from sync function", () => {
	const fn = deasync(callback => callback(new Error("foobar")));
	try {
		fn();
		assert.fail("Shouldn't run here");
	} catch (err) {
		assert.strictEqual(err.message, "foobar");
	}
});

it("should work with macro task", () => {
	const sleep = deasync((timeout, done) => setTimeout(done, timeout));

	const start = performance.now();
	sleep(400);
	assert(performance.now() - start > 400);
});

it("should throw error from macro task", () => {
	const readFileSync = deasync(readFile);
	try {
		readFileSync("__non_exists__");
		assert.fail("Shouldn't run here");
	} catch (err) {
		assert.strictEqual(err.code, "ENOENT");
	}
});
