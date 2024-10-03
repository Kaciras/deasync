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
