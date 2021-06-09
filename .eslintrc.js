const jestConfig = require("./jest.config");

module.exports = {
	extends: ["@kaciras/core"],
	env: {
		node: true,
	},
	overrides: [
		{
			files: jestConfig.testMatch,
			extends: ["@kaciras/jest"],
		},
	],
};
