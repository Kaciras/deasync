import * as assert from "assert";
import { Worker } from "worker_threads";
import * as vm from "vm";
import { join } from "path";
import { readFileSync } from "fs";

const filename = join(__dirname, "worker.js");

it("should run in worker threads", async () => {
	const worker = new Worker(filename);
	const value = await new Promise<string>((resolve, reject) => worker.on("message", resolve).on("error", reject));
	assert.strictEqual(value, "ENOENT");
});

it("should run in new vm context", () => {
	const code = readFileSync(filename, "utf8");
	const context: any = { require };
	vm.runInNewContext(code, context);
	assert.strictEqual(context.value, "ENOENT");
});
