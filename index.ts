import { run } from "./build/Release/binding.node";

function loopWhile(pred: () => boolean) {
	while (pred()) {
		process._tickCallback();
		if (pred()) run();
	}
}

type Fn<T, A extends any[], R> = (this: T, ...args: A) => R;

// Don't use enum as TS can't analyze the async-to-sync control flow.
const State = {
	Pending: 0,
	Fulfilled: 1,
	Rejected: 2,
};

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

export function awaitSync<T>(promise: Promise<T> | PromiseLike<T>) {
	let value: unknown;
	let state = State.Pending;

	promise.then(res => {
		value = res;
		state = State.Fulfilled;
	});

	if ("catch" in promise) {
		promise.catch(err => {
			value = err;
			state = State.Rejected;
		});
	}

	loopWhile(() => state === State.Pending);

	if (state === State.Rejected) {
		throw value;
	} else if (state === State.Fulfilled) {
		return value as T;
	} else {
		throw new Error("Invalid state, it's a bug in @kaciras/deasync");
	}
}
