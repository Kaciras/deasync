import core from "@kaciras/eslint-config-core";
import typescript from "@kaciras/eslint-config-typescript";

export default [
	{ ignores: ["coverage/**", "index.js"] },
	...core,
	...typescript.map(config => ({ ...config, files: ["**/*.ts"] })),
];
