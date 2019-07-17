import { expect } from '@oclif/test';
import { createAddressImport } from '../src/plugins/ioc/plugin';

describe('createAddressImport function', function() {
    it('should resolve relative address', function() {
        let result = createAddressImport('./src/providers.ts', {
            name: 'PROVIDERS',
            path: 'src/generated/models-plugin/providers.ts'
        }, "resolvers0");
        expect(result).deep.eq({
            "kind": 14,
            "moduleSpecifier": "../generated/models-plugin/providers.ts",
            "namedImports": [
                {
                    "alias": "resolvers0",
                    "kind": 15,
                    "name": "PROVIDERS"
                }
            ]
        });
    });
});
