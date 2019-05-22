import { Project } from 'ts-morph';
import { ControllerBuilder } from '../src/plugins/openapi/controller-builder';
import { getOpenAPIConfig } from '../src/plugins/openapi/openapi';
import * as fs from 'fs';

describe('ControllerBuilder', function() {
    async function createSourceFile(file: string): Promise<string> {
        let project = new Project({ useVirtualFileSystem: true });
        let source = project.createSourceFile('generated.ts');
        let config = await getOpenAPIConfig(file);
        let typeBuilder = new ControllerBuilder(config);
        source.set({ statements: typeBuilder.createControllers() });
        return source.getFullText();
    }
    it('should generate something', async function() {
        let result = await createSourceFile('test/fixtures/openapi_1.json');
        fs.writeFileSync('./.garbage/opeanapi_1.ts', result, { encoding: 'utf-8' });
    });
});
