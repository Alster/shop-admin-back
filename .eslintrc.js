// eslint-disable-next-line unicorn/prefer-module
module.exports = {
	root: true,
	parserOptions: {
		ecmaVersion: "latest",
		project: "tsconfig.json",
		// eslint-disable-next-line unicorn/prefer-module
		tsconfigRootDir: __dirname,
		sourceType: "module",
		parser: "@typescript-eslint/parser",
	},
	plugins: ["@typescript-eslint", "@typescript-eslint/eslint-plugin"],
	env: {
		es2021: true,
		node: true,
		jest: true,
	},
	extends: ["./shop-shared/.eslintrc.base.js", "./shop-shared/.eslintrc.nest.js"],
};
