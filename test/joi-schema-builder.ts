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
        expect(await createSourceFile('./test/fixtures/openapi_1.json')).to.be.eq(`import * as joi from "joi";

export namespace JoiSchemas {
    export let Product: joi.ObjectSchema = joi.object({
            sku: joi.string(),
            name: joi.string(),
            prices: joi.array().items(joi.string()),
        });
}
`);
    });
});
