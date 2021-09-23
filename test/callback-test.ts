import * as assert from "assert";
import { readFile } from "fs";
import { performance } from "perf_hooks";
import { callbackify } from "util";
import { deasync } from "../index";

it("should pass arguments correctly", () => {

	function testFn(this: any, ...args: any[]) {
		const i = args.length - 1;
		const callback = args[i];
		callback(null, { self: this, args });
	}

	const object = { testFn: deasync(testFn) };
	const { self, args } = object.testFn("foo", "bar");

	assert.strictEqual(args.length, 3);
	assert.strictEqual(self, object);
	assert.strictEqual(args[0], "foo");
	assert.strictEqual(args[1], "bar");
	assert.strictEqual(typeof args[2], "function");
});

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

	// setTimeout() may triggers earlier than expected, so we need make the timeout a little longer.
	// More detail: https://stackoverflow.com/a/49879089
	sleep(101);

	const time = performance.now() - start;
	assert.ok(time >= 100, `expect greater then 100, but was ${time}`);
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

it("should work with combined Promise and callback", () => {
	const sleep = deasync(callbackify(() => new Promise(resolve => setTimeout(resolve, 100))));
	const start = performance.now();

	sleep(101);

	const time = performance.now() - start;
	assert.ok(time >= 100, `expect greater then 100, but was ${time}`);
});
