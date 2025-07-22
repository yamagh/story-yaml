import 'mocha/mocha';

export function run(): Promise<void> {

	return new Promise((c, e) => {
		mocha.setup({
			ui: 'tdd',
			reporter: undefined
		});

		// Bundles all files in the current directory matching `*.test`
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const importAll = (r: __WebpackModuleApi.RequireContext) => r.keys().forEach(r);
		importAll(require.context('.', true, /\.test$/));

		try {
			// Run the mocha test
			mocha.run(failures => {
				if (failures > 0) {
					e(new Error(`${failures} tests failed.`));
				} else {
					c();
				}
			});
		} catch (err) {
			console.error(err);
			e(err);
		}
	});
}
