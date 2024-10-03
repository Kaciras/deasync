declare module "*.node" {

	export function uvRun(): void;
}

declare namespace NodeJS {

	interface Process {
		_tickCallback(): void;
	}
}
