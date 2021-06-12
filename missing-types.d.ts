declare module "*.node" {

	export function run(): void;
}

declare namespace NodeJS {

	interface Process {
		_tickCallback(): void;
	}
}
