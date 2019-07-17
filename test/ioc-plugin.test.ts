import { expect } from '@oclif/test';
import { Config, runPipeline } from '../src/pipeline';
import { createAddressImport, IocPlugin } from '../src/plugins/ioc/plugin';
import * as fs from 'fs';

describe('createAddressImport function', function() {
    it('should resolve relative address', function() {
        let result = createAddressImport(
            './src/providers.ts',
            {
                name: 'PROVIDERS',
                path: 'src/generated/models-plugin/providers.ts'
            },
            'resolvers0'
        );
        expect(result).deep.eq({
            kind: 14,
            moduleSpecifier: '../generated/models-plugin/providers.ts',
            namedImports: [
                {
                    alias: 'resolvers0',
                    kind: 15,
                    name: 'PROVIDERS'
                }
            ]
        });
    });
    it('should generate providers file', async function() {
        let config: Config = {
            context: {
                toProvide: [
                    { name: 'PROVIDERS', path: 'src/model/things.ts' },
                    { name: 'PROVIDERS', path: 'src/controllers.ts' }
                ]
            },
            pipeline: [new IocPlugin({ outputFile: '.garbage/providers.ts' })]
        };
        await runPipeline(config);
        expect(
            fs.readFileSync('.garbage/providers.ts', { encoding: 'utf-8' })
        ).to.be.eq(
            'import { Provider } from "injection-js";\n' +
                'import { PROVIDERS as providers_0 } from "../../src/model/things.ts";\n' +
                'import { PROVIDERS as providers_1 } from "../../src/controllers.ts";\n' +
                'export const PROVIDERS: Provider[] = [ providers_0, providers_1 ];\n'
        );
    });
});
