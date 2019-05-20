import { expect } from '@oclif/test';
import { describe } from 'mocha';
import { Project } from 'ts-morph';
import { JoiSchemaBuilder } from '../src/plugins/openapi/joi-schema-builder';
import { getOpenAPIConfig } from '../src/plugins/openapi/openapi';
import { TypeMap } from '../src/plugins/openapi/type-map';

describe('JoiSchemaBuilder', function() {
    async function createSourceFile(file: string): Promise<string> {
        let project = new Project({ useVirtualFileSystem: true });
        let source = project.createSourceFile('generated.ts');
        let config = await getOpenAPIConfig(file);
        let typeBuilder = new JoiSchemaBuilder(config, new TypeMap(config));
        source.set({ statements: await typeBuilder.createJoiSchemas() });
        return source.getFullText();
    }
    it('should create simple schema', async function() {
        expect(await createSourceFile('./test/fixtures/openapi_1.json')).to.be.eq(
            `import * as joi from "joi";\n\nexport namespace JoiSchemas {\n    export let Product: joi.ObjectSchema = joi.object({\n            sku: joi.string(),\n            name: joi.string(),\n            prices: joi.array().items(joi.string()),\n        });\n}\n`
        );
    });
    it('should create schema with references', async function() {
        expect(await createSourceFile('./test/fixtures/deep_literals.yml')).to.be.eq(
            `import * as joi from "joi";\n\nexport namespace JoiSchemas {\n    export let Order: joi.ObjectSchema = joi.object({\n            id: joi.string(),\n            product: Product,\n        });\n    export let Product: joi.ObjectSchema = joi.object({\n            sku: joi.string(),\n            name: joi.string(),\n            prices: joi.array().items(joi.object({\n                marketplace: joi.string(),\n                price: joi.number(),\n            })),\n        });\n}\n`
        );
    });
    it.skip('should generate joi schemas for kubernetes api', async function() {
        expect(await createSourceFile('test/fixtures/kubernetes_api.yaml')).to.be.eq('');
        //TODO: solve problem with circular code
    });
});
