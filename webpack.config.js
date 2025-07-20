//@ts-check
'use strict';

const path = require('path');
const webpack = require('webpack');

const CopyPlugin = require('copy-webpack-plugin');

const webExtensionConfig = {
	mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
	target: 'webworker', // extensions run in a webworker context
	entry: {
		'extension': './src/web/extension.ts',
		'test/suite/index': './src/web/test/suite/index.ts'
	},
	output: {
		filename: '[name].js',
		path: path.join(__dirname, './dist/web'),
		libraryTarget: 'commonjs',
		devtoolModuleFilenameTemplate: '../../[resource-path]'
	},
	resolve: {
		mainFields: ['browser', 'module', 'main'], // look for `browser` entry point in imported node modules
		extensions: ['.ts', '.tsx', '.js'], // support ts-files and js-files
		alias: {
			// provides alternate implementation for node module and source files
		},
		fallback: {
			// Webpack 5 no longer polyfills Node.js core modules automatically.
			// see https://webpack.js.org/configuration/resolve/#resolvefallback
			// for the list of Node.js core module polyfills.
			'assert': require.resolve('assert')
		}
	},
	module: {
		rules: [{
			test: /\.tsx?$/,
			exclude: [ /node_modules/, /\.test\.tsx?$/, /\.d\.ts$/ ],
			use: [{
				loader: 'ts-loader'
			}]
		}]
	},
	plugins: [
		new webpack.optimize.LimitChunkCountPlugin({
			maxChunks: 1 // disable chunks by default since web extensions must be a single bundle
		}),
		new webpack.ProvidePlugin({
			process: 'process/browser', // provide a shim for the global `process` variable
		}),
	],
	externals: {
		'vscode': 'commonjs vscode', // ignored because it doesn't exist
	},
	performance: {
		hints: false
	},
	devtool: 'nosources-source-map', // create a source map that points to the original source file
	infrastructureLogging: {
		level: "log", // enables logging required for problem matchers
	},
};

const webviewConfig = {
	mode: 'none',
	target: 'web',
	entry: {
		'webview': './src/web/view/main.tsx'
	},
	output: {
		filename: '[name].js',
		path: path.join(__dirname, './dist/web'),
		libraryTarget: 'window', // Changed to 'window' for browser compatibility
	},
	resolve: {
		mainFields: ['browser', 'module', 'main'],
		extensions: ['.ts', '.tsx', '.js'],
	},
	module: {
		rules: [{
			test: /\.tsx?$/,
			exclude: [ /node_modules/, /\.test\.tsx?$/ ],
			use: [{
				loader: 'ts-loader'
			}]
		}, {
			test: /\.css$/,
			use: ['style-loader', 'css-loader']
		}]
	},
	plugins: [
		new webpack.ProvidePlugin({
			process: 'process/browser',
		}),
		new CopyPlugin({
			patterns: [
				{ from: './src/web/view/index.html', to: 'index.html' }
			]
		})
	],
	performance: {
		hints: false
	},
	devtool: 'nosources-source-map',
    devServer: {
        hot: true,
        port: 3000,
        headers: {
            'Access-Control-Allow-Origin': '*'
        }
    }
};


module.exports = [ webExtensionConfig, webviewConfig ];