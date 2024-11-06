import * as assert from "assert";
import { readFile } from "fs";
import { callbackify } from "util";
import { deasync } from "../index";

it("should pass arguments correctly", () => {

	function testFn(this: any, ...args: any[]) {
		const i = args.length - 1;
		const callback = args[i];
		callback(null, { self: this, args });
	}

	const object = { testFn: deasync(testFn) as any };
	const { self, args } = object.testFn("foo", "bar");

	assert.strictEqual(args.length, 3);
	assert.strictEqual(self, object);
	assert.strictEqual(args[0], "foo");
	assert.strictEqual(args[1], "bar");
	assert.strictEqual(typeof args[2], "function");
});

it("should work with sync function", () => {
	const fn = deasync<void, [], number>(callback => callback(null, 114514));
	assert.strictEqual(fn(), 114514);
});

it("should throw error from sync function", () => {
	const fn = deasync<void, [], void>(callback => callback(new Error("foobar")));
	try {
		fn();
		assert.fail("Shouldn't run here");
	} catch (err) {
		assert.strictEqual(err.message, "foobar");
	}
});

it("should work with macro task", () => {
	const sleep = deasync((timeout: number, done: any) => setTimeout(done, timeout));
	const start = performance.now();

	// setTimeout() may trigger earlier than expected, so we make the timeout a little longer.
	// More detail: https://stackoverflow.com/a/49879089
	sleep(51);

	const time = performance.now() - start;
	assert.ok(time >= 50, `expect greater then 50, but was ${time}`);
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
	const sleep = () => new Promise<void>(resolve => setTimeout(resolve, 51));
	const sleepSync = deasync<void, [], void>(callbackify(sleep));

	const start = performance.now();
	sleepSync();
	const time = performance.now() - start;

	assert.ok(time >= 50, `expect greater then 50, but was ${time}`);
});
