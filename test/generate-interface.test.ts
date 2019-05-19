import { TypeBuilder } from '../src/generators';
import { SourceFile, Project } from 'ts-morph';
import { expect } from 'chai';
import { getOpenAPIConfig } from '../src/openapi';

describe('generate interface', function() {
    let source: SourceFile;
    let typeBuilder: TypeBuilder;

    function result() {
        return expect(source.getFullText());
    }

    beforeEach(() => {
        let project = new Project({ useVirtualFileSystem: true });
        source = project.createSourceFile('generated.ts');
        typeBuilder = new TypeBuilder(source);
    });
    it('should create sample interface with name', function() {
        typeBuilder.createInterface('Product', { type: 'object' });
        result().to.contains('interface Product');
    });
    it('should create properties', function() {
        typeBuilder.createInterface('Product', {
            type: 'object',
            properties: {
                sku: {
                    type: 'string'
                }
            }
        });
        result().to.be.eq('interface Product {\n    sku: string;\n}\n');
    });
    it('should create multiple types', async function() {
        let config = await getOpenAPIConfig('test/fixtures/openapi_references.yml');
        typeBuilder.createTypingsFromDocument(config);
        expect(typeBuilder.source.getFullText()).to.be.eq(`interface Order {
    id: string;
    product: Product;
}

interface Product {
    sku: string;
    name: string;
    prices: string[];
}
`);
    });

  it('should create deep literals', async function() {
      let config = await getOpenAPIConfig('test/fixtures/deep_literals.yml');
      typeBuilder.createTypingsFromDocument(config);
      expect(typeBuilder.source.getFullText()).to.be.eq(`interface Order {
    id: string;
    product: Product;
}

interface Product {
    sku: string;
    name: string;
    prices: {
            marketplace:string;price:number;
        }
        [];
}
`);
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
