/// <reference types="./missing-types" />
import { run } from "./build/Release/binding.node";

function loopWhile(pred: () => boolean) {
	while (pred()) {
		process._tickCallback();
		if (pred()) run();
	}
}

function isThenable<T>(value: any): value is PromiseLike<T> {
	return typeof value.then === "function";
}

type Fn<T, A extends any[], R> = (this: T, ...args: A) => R;

// Can't use enum as async-to-sync breaks the control flow analyzing.
const State = {
	Pending: 0,
	Fulfilled: 1,
	Rejected: 2,
};

/**
 * Generic wrapper of async function with conventional API signature
 * `function (p1,...pn, (error, result) => {})`.
 *
 * Returns `result` and throws `error` as exception if not null
 *
 * @param fn the original callback style function
 * @return wrapped function
 */
export function deasync<T, R = any>(fn: Fn<T, any[], void>) {

	return function (this: T, ...args: any[]) {
		let state = State.Pending;
		let valueOrError: unknown;

		args.push((err: unknown, res: R) => {
			if (err) {
				valueOrError = err;
				state = State.Rejected;
			} else {
				valueOrError = res;
				state = State.Fulfilled;
			}
		});

		fn.apply(this, args);
		loopWhile(() => state === State.Pending);

		if (state === State.Rejected) {
			throw valueOrError;
		} else {
			return valueOrError as R;
		}
	};
}

/**
 * Similar with keyword `await` but synchronously.
 *
 * @param promise A Promise or any value to wait for
 * @return Returns the fulfilled value of the promise, or the value itself if it's not a Promise.
 */
export function awaitSync<T>(promise: PromiseLike<T> | T) {
	let state = State.Pending;
	let valueOrError: unknown;

	if (!isThenable(promise)) {
		return promise;
	}

	promise.then(res => {
		valueOrError = res;
		state = State.Fulfilled;
	}, err => {
		valueOrError = err;
		state = State.Rejected;
	});

	loopWhile(() => state === State.Pending);

	if (state === State.Rejected) {
		throw valueOrError;
	} else {
		return valueOrError as T;
	}
}
