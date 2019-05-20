import { TypeBuilder } from '../src/generators';
import { Project } from 'ts-morph';
import { expect } from 'chai';
import { getOpenAPIConfig } from '../src/openapi';
let fs = require('fs');

describe('generate interface', function() {
    async function createSourceFile(file: string): Promise<string> {
        let project = new Project({ useVirtualFileSystem: true });
        let source = project.createSourceFile('generated.ts');
        let config = await getOpenAPIConfig(file);
        let typeBuilder = new TypeBuilder(config);
        source.set({ statements: [typeBuilder.createTypings()] });
        return source.getFullText();
    }

    function readFile(file: string) {
        return fs.readFileSync(file, { encoding: 'utf-8' });
    }

    it('should create multiple types', async function() {
        expect(await createSourceFile('test/fixtures/openapi_references.yml')).to.be
            .eq(`export namespace ApiSchemas {
    export interface Order {
        id: string;
        product: Product;
    }

    export interface Product {
        sku: string;
        name: string;
        prices: string[];
    }
}
`);
    });

    it('should create deep literals', async function() {
        expect(await createSourceFile('test/fixtures/deep_literals.yml')).to.be
            .eq(`export namespace ApiSchemas {
    export interface Order {
        id: string;
        product: Product;
    }

    export interface Product {
        sku: string;
        name: string;
        prices: {
                marketplace: "amazon_de" | "amazon_it" | "amazon_uk" | "amazon_fr";
                price: number;
            }[];
    }
}
`);
    });

    it('should be able to generate from complex files', async function() {
        expect(await createSourceFile('test/fixtures/complex_types.yml')).to.be.eq(
            readFile('./test/fixtures/complex_types_result.ts.txt')
        );
    });
    it('should create types for weird type names', async function() {
        expect(await createSourceFile('test/fixtures/weird_type_names.yml')).to.be
            .eq(readFile('./test/fixtures/weird_type_names_result.ts.txt'));
    });
    it('should create types for kubernetes api', async function() {
        expect(await createSourceFile('test/fixtures/kubernetes_api.yaml')).to.be.eq(
            readFile('./test/fixtures/kubernetes_api_result.ts.txt')
        );
    });
});
describe('getConfig', function() {
    it('should getConfiguration', async function() {
        let config = await getOpenAPIConfig('test/fixtures/openapi_references.yml');
        // @ts-ignore
        let a = config.components.schemas.Product;
        // @ts-ignore
        let b = config.components.schemas.Order.properties.product;
        expect(a).to.be.eq(b);
    });
});
