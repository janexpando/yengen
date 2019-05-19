import {
    OptionalKind,
    PropertySignatureStructure,
    SourceFile,
    WriterFunction,
    CodeBlockWriter
} from 'ts-morph';
import { OpenAPIV3 } from './openapi-types';
import _ = require('lodash');

function isArraySchemaObject(
    schema: OpenAPIV3.SchemaObject
): schema is OpenAPIV3.ArraySchemaObject {
    return schema.type === 'array';
}

function isNonArraySchemaObject(
    schema: OpenAPIV3.SchemaObject
): schema is OpenAPIV3.NonArraySchemaObject {
    return schema.type !== 'array';
}

export class TypeBuilder {
    typeMap = new Map<object, string>();

    constructor(public source: SourceFile) {}

    createInterface(name: string, schema: OpenAPIV3.NonArraySchemaObject) {
        if (schema.type && schema.type !== 'object')
            throw `Cannot create interface for schema.type=${schema.type}`;
        let declaration = this.source.addInterface({ name });
        let properties = schema.properties || {};
        _.forOwn(properties, (property, key) => {
            let propertyStructure: OptionalKind<PropertySignatureStructure> = {
                name: key
            };
            if (property.type) propertyStructure.type = this.createTypeLiteral(property);
            declaration.addProperty(propertyStructure);
        });
    }

    createTypingsFromDocument(document: OpenAPIV3.Document) {
        if (document.components && document.components.schemas) {
            let schemas = document.components.schemas;
            this.initTypeMap(schemas);
            _.forOwn(schemas, (schema: OpenAPIV3.SchemaObject, typeName: string) => {
                if (isNonArraySchemaObject(schema)) {
                    this.createInterface(typeName, schema);
                }
            });
        }
    }

    createTypeLiteral(schema: OpenAPIV3.SchemaObject): string | WriterFunction {
        if (this.typeMap.has(schema)) {
            return this.typeMap.get(schema) as string;
        }
        switch (schema.type) {
            case 'boolean':
                return 'boolean';
            case 'null':
                return 'null';
            case 'string':
                return 'string';
            case 'number':
            case 'integer':
                return 'number';
            case 'array':
                return (writer: CodeBlockWriter) => {
                    let result = this.createTypeLiteral(schema.items);
                    if (typeof result === 'string') {
                        writer.write(result);
                    } else {
                        result(writer);
                    }
                    writer.write('[]');
                };
            case 'object':
                return writer => {
                    writer.block(() => {
                        _.forOwn(schema.properties, (schema, key) => {
                            writer.write(key + ':');
                            let result = this.createTypeLiteral(schema);
                            if (typeof result === 'string') {
                                writer.write(result);
                            } else {
                                result(writer);
                            }
                        });
                    });
                };
        }
    }

    private initTypeMap(schemas: Record<string, OpenAPIV3.SchemaObject>) {
        if (schemas) {
            _.forOwn(schemas, (schema, typeName) => {
                this.typeMap.set(schema, typeName);
            });
        }
    }
}
