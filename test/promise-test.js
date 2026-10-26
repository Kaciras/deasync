const assert = require("assert");
const { it } = require("mocha");
const { readFile } = require("fs/promises");
const { awaitSync } = require("../index.js");

it("should just return if argument is not a Promise", () => {
	const value = new Error();
	assert.strictEqual(awaitSync(value), value);
});

it("should just return primitive value", () => {
	assert.strictEqual(awaitSync(11), 11);
});

it("should allow undefined value", () => {
	assert.strictEqual(awaitSync(undefined), undefined);
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
	} catch (e) {
		assert.strictEqual(e.message, "foobar");
	}
});

it("should work with macro task", () => {
	const start = performance.now();
	const sleeping = new Promise(resolve => setTimeout(resolve, 51));

	awaitSync(sleeping);

	const time = performance.now() - start;
	assert.ok(time >= 50, `expect greater then 50, but was ${time}`);
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
