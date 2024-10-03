import * as assert from "assert";
import { runLoopOnce } from "../index";

it("should run loop once", async () => {
	let micro = false;
	let macro = false;

	Promise.resolve().then(() => micro = true);
	setImmediate(() => macro = true);

	runLoopOnce();

	assert.ok(micro, "Micro task has not run");
	assert.ok(macro, "Macro task has not run");
});

it("should run all micro task callbacks", () => {
	let callNumber = 0;
	Promise.resolve().then(() => callNumber += 1);
	Promise.resolve().then(() => callNumber += 1);

	runLoopOnce();
	assert.strictEqual(callNumber, 2);
});

it("should drain nested micro task callbacks", () => {
	let called = false;
	Promise.resolve().then(() => {
		Promise.resolve().then(() => called = true);
	});

	runLoopOnce();
	assert.ok(called, "Nested micro task has not run");
});

it("should run all macro task callbacks", () => {
	let callNumber = 0;
	setImmediate(() => callNumber += 1);
	setImmediate(() => callNumber += 1);

	runLoopOnce();
	assert.strictEqual(callNumber, 2);
});

it("should not run nested macro task callbacks", () => {
	let notCalled = true;
	setImmediate(() => {
		setImmediate(() => notCalled = false);
	});

	runLoopOnce();
	assert.ok(notCalled, "Callback add in another was called");
});
