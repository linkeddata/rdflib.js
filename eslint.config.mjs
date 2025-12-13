// eslint.config.js
import { defineConfig } from "eslint/config"
import globals from "globals";

export default defineConfig([
	// matches all files ending with .js
	{
		files: ["**/*.js"],
		rules: {
			semi: ["warn", "never"],
		},
	},

	// matches all files ending with .js except those in __tests
	{
		files: ["**/*.js"],
		ignores: ["tests/**"],
		rules: {
			"no-console": "warn",
		},
	},
	{
		files: ["tests/**/*"],
		languageOptions: {
			globals: {
				...globals.mocha,
			},
		},
	},
])
