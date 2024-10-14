const babel = require("@rollup/plugin-babel");
const resolve = require("@rollup/plugin-node-resolve");
const commonJS = require("@rollup/plugin-commonjs");
const terser = require("@rollup/plugin-terser");
const json = require("@rollup/plugin-json");

module.exports = {
	input: './src/index.js',
	output: {
		format: 'iife',
		file: 'build/cp-codemirror-editor.js',
		name: 'CodeEditor'
	},
	plugins: [
		babel({
			babelHelpers: 'bundled'
		}),
		resolve({
			preferBuiltins: false
		}),
		commonJS({
			include: 'node_modules/**'
		}),
		terser(),
		json()
	]
};
