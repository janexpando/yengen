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
        typeBuilder.createRootType('Product', { type: 'object' });
        result().to.contains('interface Product');
    });
    it('should create properties', function() {
        typeBuilder.createRootType('Product', {
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
            marketplace: "amazon_de" | "amazon_it" | "amazon_uk" | "amazon_fr";
            price: number;
        }[];
}
`);
    });
    it('should be able to generate from complex files', async function() {
        let config = await getOpenAPIConfig('test/fixtures/complex_types.yml');
        typeBuilder.createTypingsFromDocument(config);
        expect(typeBuilder.source.getFullText()).to.be
            .eq(`type MarketplaceName = "amazon_de" | "amazon_uk" | "amazon_it" | "amazon_fr" | "amazon_es" | "amazon_mx" | "amazon_us" | "amazon_ca" | "amazon_br" | "amazon_in" | "amazon_cn" | "amazon_jp" | "amazon_au";
type Continent = "america" | "europe";

interface DeveloperConfig {
    accessKey: string;
    secretKey: string;
    developerId: string;
    continent: Continent;
}

interface Credentials {
    marketplaceId: string;
    developerId: string;
    sellerId: string;
    token: string;
}

interface Company {
    _id: string;
}

type FeedType = "GOOGLE_PRODUCT" | "SHOPIFY" | "SHOPTET";

interface InputCompany {
    name: string;
    feedType: FeedType;
}

interface ShipmentItem {
    itemHash: string;
    itemId: string;
    quantity: number;
    sku: string;
    charges: {
        };
    fees: {
        };
    costOfPointsGranted: number;
    costOfPointsReturned: number;
    withheldTax: number;
    promotions: number;
    currency: string;
}

interface FinancialEvent {
    companyId: string;
    shipmentHash: string;
    marketplaceOrderId: string;
    marketplace: string;
    postedDate: string;
    type: string;
    items: ShipmentItem[];
}

interface ListingStatistics {
    ok: number;
    error: number;
}

interface SortParams {
    sku: 1 | -1;
    name: 1 | -1;
    ean: 1 | -1;
    price: 1 | -1;
}

interface ProductSync {
    companyId: string;
    interval: number;
    startedOn: string;
    finishedOn: string;
    isSyncing: boolean;
    feedDownloadStartedOn: string;
    feedDownloadFinishedOn: string;
    isFeedSyncing: boolean;
}

type OrderStatus = "Unshipped" | "Pending" | "Shipped" | "Canceled";
type CurrencyCode = "EUR" | "GBP" | "USD" | "CAD";

interface Address {
    name: string;
    email: string;
    addressLine: string[];
    city: string;
    country: string;
    district: string;
    stateOrRegion: string;
    zipCode: string;
    countryCode: string;
    phone: string;
    taxId: string;
}

interface OrderItem {
    sku: string;
    asin: string;
    marketplaceItemId: string;
    name: string;
    price: number;
    itemPrice: number;
    quantity: number;
    tax: number;
    promotionDiscount: number;
    promotionDiscountTax: number;
    shippingDiscount: number;
    shippingDiscountTax: number;
    shippingTax: number;
    shippingPrice: number;
}

interface Order {
    companyId: string;
    marketplaceOrderId: string;
    status: OrderStatus;
    marketplace: MarketplaceName;
    fulfillmentChannel: string;
    totalPrice: number;
    currencyCode: CurrencyCode;
    shipServiceLevel: string;
    paymentMethod: string;
    invoiceUrls: string[];
    buyer: Address;
    items: OrderItem[];
    lastChanged: string;
    purchaseDate: string;
    isPremiumOrder: boolean;
    isPrime: boolean;
    isBusinessOrder: boolean;
    isComplete: boolean;
}

interface Settings {
    companyId: string;
    synchronizePrices: boolean;
    synchronizeStock: boolean;
    listNewProducts: boolean;
    formulas: FormulaMap;
}

interface FormulaMap {
    amazon_de: Formula;
    amazon_uk: Formula;
    amazon_it: Formula;
    amazon_fr: Formula;
    amazon_es: Formula;
    amazon_mx: Formula;
    amazon_us: Formula;
    amazon_ca: Formula;
    amazon_br: Formula;
    amazon_in: Formula;
    amazon_cn: Formula;
    amazon_jp: Formula;
    amazon_au: Formula;
}

interface Formula {
    add: number;
    multiply: number;
}
`);
    });
    it('should create types for weird type names', async function() {
        let config = await getOpenAPIConfig('test/fixtures/weird_type_names.yml');
        typeBuilder.createTypingsFromDocument(config);
        expect(typeBuilder.source.getFullText()).to.be
            .eq(`interface io_k8s_apiextensions_apiserver_pkg_apis_apiextensions_v1beta1_JSONSchemaProps {
    $schema: string;
    additionalItems: {
        };
    "x-kubernetes-embedded-resource": boolean;
    "x-kubernetes-int-or-string": boolean;
    "x-kubernetes-preserve-unknown-fields": boolean;
}
`);
    });
    it('should create types for kubernetes api', async function() {
        let config = await getOpenAPIConfig('test/fixtures/kubernetes_api.yaml');
        typeBuilder.createTypingsFromDocument(config);
        expect(typeBuilder.source.getFullText()).to.be.eq(
            require('fs').readFileSync('./test/fixtures/kubernetes_api_result.ts.txt', { encoding: 'utf-8' })
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
