import * as assert from "assert";
import { readFile } from "fs/promises";
import { performance } from "perf_hooks";
import { awaitSync } from "../index";

it("should just return if argument is not a Promise", () => {
	const value = new Error();
	assert.strictEqual(awaitSync(value), value);
});

it("should work with Promise.resolve", () => {
	const result = awaitSync(Promise.resolve(114514));
	assert.strictEqual(result, 114514);
});

it("should throw on Promise.reject", () => {
	const promise = Promise.reject(new Error("foobar"));
	try {
		awaitSync(promise);
		assert.fail("Shouldn't run here");
	} catch (err) {
		assert.strictEqual(err.message, "foobar");
	}
});

it("should work with macro task", () => {
	const start = performance.now();
	const sleeping = new Promise<void>(resolve => setTimeout(resolve, 101));

	awaitSync(sleeping);

	const time = performance.now() - start;
	assert.ok(time >= 100, `expect greater then 100, but was ${time}`);
});

it("should throw error from macro task", () => {
	const promise = readFile("__non_exists__");
	try {
		awaitSync(promise);
		assert.fail("Shouldn't run here");
	} catch (err) {
		assert.strictEqual(err.code, "ENOENT");
	}
});
