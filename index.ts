/// <reference types="./missing-types" />
import { run } from "./build/Release/binding.node";

function loopWhile(pred: () => boolean) {
	while (pred()) {
		process._tickCallback();
		if (pred()) run();
	}
}

/**
 * Determine whether the value is a Promise.
 *
 * @see https://promisesaplus.com/
 */
function isThenable<T>(value: any): value is PromiseLike<T> {
	return typeof value.then === "function";
}

/**
 * A generic replacement of the `Function` type.
 */
type Fn<T, A extends any[], R> = (this: T, ...args: A) => R;

// Can't use enum as async-to-sync breaks the control flow analyzing.

const Pending = 0;
const Fulfilled = 1;
const Rejected = 2;

/**
 * Generic wrapper of async function with conventional API signature
 * `function (...args, (error, result) => {})`.
 *
 * Returns `result` and throws `error` as exception if not null.
 *
 * @param fn the original callback style function
 * @return the wrapped function
 */
export function deasync<T, R = any>(fn: Fn<T, any[], void>) {

	return function (this: T, ...args: any[]) {
		let state = Pending;
		let resultOrError: unknown;

		args.push((err: unknown, res: R) => {
			if (err) {
				resultOrError = err;
				state = Rejected;
			} else {
				resultOrError = res;
				state = Fulfilled;
			}
		});

		fn.apply(this, args as any);
		loopWhile(() => state === Pending);

		if (state === Rejected) {
			throw resultOrError;
		} else {
			return resultOrError as R;
		}
	};
}

/**
 * Similar with the keyword `await` but synchronously.
 *
 * @param promise A Promise or any value to wait for
 * @return Returns the fulfilled value of the promise, or the value itself if it's not a Promise.
 */
export function awaitSync<T>(promise: T) {
	let state = Pending;
	let resultOrError: unknown;

	if (!isThenable(promise)) {
		return promise as Awaited<T>;
	}

	promise.then(res => {
		resultOrError = res;
		state = Fulfilled;
	}, err => {
		resultOrError = err;
		state = Rejected;
	});

	loopWhile(() => state === Pending);

	if (state === Rejected) {
		throw resultOrError;
	} else {
		return resultOrError as Awaited<T>;
	}
}
