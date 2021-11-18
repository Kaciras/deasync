import { awaitSync } from "../index";

declare function type<T>(): T;
declare function expectType<T>(_: T): void;

// Test awaitSync with nested Promise
{
	const nested = type<Promise<Promise<number>>>();
	expectType<number>(awaitSync(nested));
}

// Test awaitSync with union type
{
	const union = type<string | Promise<number>>();
	const awaited = awaitSync(union);

	expectType<string | number>(awaited);

	/*
	 * The string|number parameter accept string, number, and string|number all,
	 * so we need additional assertions to exclude single types.
	 */

	// @ts-expect-error string | number is not assignable to number
	expectType<number>(awaited);
	// @ts-expect-error string | number is not assignable to string
	expectType<string>(awaited);
}
