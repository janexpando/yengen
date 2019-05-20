import { OpenAPIV3 } from './openapi-types';
import { sanitizeName } from './utils';
import _ = require('lodash');

export class TypeMap {
    typeMap = new Map<object, string>();

    constructor(private document: OpenAPIV3.Document) {
        if (document.components && document.components.schemas) {
            _.forOwn(document.components.schemas, (schema, typeName) => {
                this.typeMap.set(schema, sanitizeName(typeName));
            });
        }
    }
    has(schema: OpenAPIV3.SchemaObject): boolean {
        return this.typeMap.has(schema);
    }
    get(schema: OpenAPIV3.SchemaObject): string {
        let result = this.typeMap.get(schema);
        if (!result) throw 'Missing schema object in here';
        return result;
    }
}
