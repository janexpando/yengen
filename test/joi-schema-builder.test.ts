import { expect } from '@oclif/test';
import { describe } from 'mocha';
import { Project } from 'ts-morph';
import { JoiSchemaBuilder } from '../src/plugins/openapi/joi-schema-builder';
import { getOpenAPIConfig } from '../src/plugins/openapi/openapi';
import { TypeMap } from '../src/plugins/openapi/type-map';
import { readFile } from './utils';

describe('JoiSchemaBuilder', function() {
    async function createSourceFile(file: string): Promise<string> {
        let project = new Project({ useVirtualFileSystem: true });
        let source = project.createSourceFile('generated.ts');
        let config = await getOpenAPIConfig(file);
        let typeBuilder = new JoiSchemaBuilder(config, new TypeMap(config));
        let statements = await typeBuilder.createJoiSchemas();
        source.set({ statements });
        return source.getFullText();
    }
    it('should create simple schema', async function() {
        expect(await createSourceFile('./test/fixtures/openapi_1.json')).to.be.eq(
            `import { ObjectSchema, ArraySchema, AnySchema, BooleanSchema, BinarySchema, DateSchema, NumberSchema, StringSchema, lazy, array, object, boolean, number, string, any } from "joi";\n\nexport namespace JoiSchemas {\n    export let Product: ObjectSchema = object({\n            sku: string(),\n            name: string(),\n            prices: array().items(string()),\n        });\n}\n`
        );
    });
    it('should create schema with references', async function() {
        expect(await createSourceFile('./test/fixtures/deep_literals.yml')).to.be.eq(
            `import { ObjectSchema, ArraySchema, AnySchema, BooleanSchema, BinarySchema, DateSchema, NumberSchema, StringSchema, lazy, array, object, boolean, number, string, any } from "joi";\n\nexport namespace JoiSchemas {\n    export let Order: ObjectSchema = object({\n            id: string(),\n            product: lazy(()=>Product),\n        });\n    export let Product: ObjectSchema = object({\n            sku: string(),\n            name: string(),\n            prices: array().items(object({\n                marketplace: string(),\n                price: number(),\n            })),\n        });\n}\n`
        );
    });
    it('should generate joi schemas for kubernetes api', async function() {
        expect(await createSourceFile('test/fixtures/kubernetes_api.yaml')).to.be.eq(
            readFile('test/fixtures/kubernetes_api_joi_result.ts.txt')
        );
    });
});
