import * as assert from "assert";
import { runLoopOnce } from "../index";

it("should run loop once", async () => {
	let micro = false;
	let macro = false;

	Promise.resolve().then(() => micro = true);
	setTimeout(() => macro = true, 1);

	// Sleep 1ms synchronously.
	const start = performance.now();
	while (performance.now() - start > 1) {}

	runLoopOnce();

	assert.strictEqual(micro, true);
	assert.strictEqual(macro, true);
});
