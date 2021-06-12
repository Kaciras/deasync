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
export function deasync<T, R>(fn: Fn<T, any[], R>) {

	return function (this: T, ...args: any[]) {
		let state = State.Pending;
		let value: unknown;

		args.push((err: unknown, res: R) => {
			if (err) {
				value = err;
				state = State.Rejected;
			} else {
				value = res;
				state = State.Fulfilled;
			}
		});

		fn.apply(this, args);
		loopWhile(() => state === State.Pending);

		if (state === State.Rejected) {
			throw value;
		} else if (state === State.Fulfilled) {
			return value as R;
		} else {
			throw new Error("Invalid state, it's a bug in @kaciras/deasync");
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
	let value: unknown;

	if (!isThenable(promise)) {
		return promise;
	}

	promise.then(res => {
		value = res;
		state = State.Fulfilled;
	}, err => {
		value = err;
		state = State.Rejected;
	});

	loopWhile(() => state === State.Pending);

	if (state === State.Rejected) {
		throw value;
	} else if (state === State.Fulfilled) {
		return value as T;
	} else {
		throw new Error("Invalid state, it's a bug in @kaciras/deasync");
	}
}
