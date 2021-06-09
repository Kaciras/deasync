module.exports = {
	testMatch: [
		"**/test/*-test.[jt]s",
	],
	testEnvironment: "node",
	clearMocks: true,
	coverageDirectory: "coverage",
	coverageProvider: "v8",
};
