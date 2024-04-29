import { awaitSync, deasync } from "../index";

declare function type<T>(): T;

declare function expectAssignable<T>(_: T): void;

// Test types for returned function of deasync().
{
	function stub(a: string, b: number, c: (err: Error, info: boolean) => void) {}

	const wrapped = deasync(stub);

	// @ts-expect-error Expected 2 arguments, but got 0.
	wrapped();
	// @ts-expect-error Expected 2 arguments, but got 1.
	wrapped(11);
	// @ts-expect-error Argument of type 'null' is not assignable to parameter of type 'string'.
	wrapped(null, null);
	// @ts-expect-error Expected 2 arguments, but got 3.
	wrapped("", 0, "extra");

	// @ts-expect-error Argument of type 'boolean' is not assignable to parameter of type 'string'.
	expectAssignable<string>(wrapped("", 0));

	expectAssignable<boolean>(wrapped("", 0));
}

// Test awaitSync with nested Promise
{
	const nested = type<Promise<Promise<number>>>();
	expectAssignable<number>(awaitSync(nested));
}

// Test awaitSync with union type
{
	const union = type<string | Promise<number>>();
	const awaited = awaitSync(union);

	expectAssignable<string | number>(awaited);

	/*
	 * The string|number parameter accept string, number, and string|number all,
	 * so we need additional assertions to exclude single types.
	 */

	// @ts-expect-error string | number is not assignable to number
	expectAssignable<number>(awaited);
	// @ts-expect-error string | number is not assignable to string
	expectAssignable<string>(awaited);
}
