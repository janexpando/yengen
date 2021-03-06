import { Project } from 'ts-morph';
import { ControllerBuilder } from '../src/plugins/openapi/controller-builder';
import { JoiSchemaBuilder } from '../src/plugins/openapi/joi-schema-builder';
import { getOpenAPIConfig } from '../src/plugins/openapi/openapi';
import * as fs from 'fs';
import { TypeBuilder } from '../src/plugins/openapi/type-builder';
import { TypeMap } from '../src/plugins/openapi/type-map';

describe('ControllerBuilder', function() {
    async function createSourceFile(file: string): Promise<string> {
        let project = new Project({ useVirtualFileSystem: true });
        let source = project.createSourceFile('generated.ts');
        let config = await getOpenAPIConfig(file);
        let typeMap = new TypeMap(config);
        let typeBuilder = new ControllerBuilder(
            config,
            new TypeBuilder(config, typeMap),
            new JoiSchemaBuilder(config, typeMap)
        );
        source.set({ statements: typeBuilder.createControllers() });
        return source.getFullText();
    }
    it('should generate something', async function() {
        let result = await createSourceFile('test/fixtures/openapi_1.json');
        fs.writeFileSync('./.garbage/opeanapi_1.ts', result, { encoding: 'utf-8' });
    });

    it('should be able generate controllers for kubernetes api', async function() {
        let result = await createSourceFile('test/fixtures/kubernetes_api.yaml');
        fs.writeFileSync('./.garbage/kubernetes_controllers.ts', result, { encoding: 'utf-8' });
    });
});
