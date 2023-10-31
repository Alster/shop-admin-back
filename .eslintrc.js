module.exports = {
	extends: "./shop-shared/.eslintrc.nest.js",
	parserOptions: {
		project: "tsconfig.json",
		tsconfigRootDir: __dirname,
		sourceType: "module",
	},
};
