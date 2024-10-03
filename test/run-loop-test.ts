import * as assert from "assert";
import { runLoopOnce } from "../index";

it("should run loop once", async () => {
	let micro = false;
	let macro = false;

	Promise.resolve().then(() => micro = true);
	setTimeout(() => macro = true, 1);

	// Sleep 1ms synchronously.
	const start = performance.now();
	while (performance.now() - start > 5) {}

	runLoopOnce();
	runLoopOnce();

	assert.ok(micro, "Micro task has not run");
	assert.ok(macro, "Macro task has not run");
});
