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

function isEnum(schema: OpenAPIV3.SchemaObject) {
    return schema.enum && schema.enum.length > 0;
}

export class TypeBuilder {
    typeMap = new Map<object, string>();

    constructor(public source: SourceFile) {}

    createRootType(name: string, schema: OpenAPIV3.NonArraySchemaObject) {
        name = this.sanitizeName(name);
        if (isEnum(schema)) {
            this.source.addTypeAlias({
                name,
                type: this.createUnionLiteral(schema)
            });
            return;
        }
        switch (schema.type) {
            case 'object':
                let declaration = this.source.addInterface({ name });
                let properties = schema.properties || {};
                _.forOwn(properties, (property, key) => {
                    if (/-/.test(key)) {
                        key = `"${key.replace(/"/g, `\\\"`)}"`;
                    }
                    let propertyStructure: OptionalKind<PropertySignatureStructure> = {
                        name: key
                    };
                    if (property.type) propertyStructure.type = this.createTypeLiteral(property);
                    declaration.addProperty(propertyStructure);
                });
                break;
            case 'integer':
            case 'number':
            case 'null':
            case 'string':
            case 'boolean':
                this.source.addTypeAlias({
                    name,
                    type: schema.type
                });
                break;
        }
    }

    createTypingsFromDocument(document: OpenAPIV3.Document) {
        if (document.components && document.components.schemas) {
            let schemas = document.components.schemas;
            this.initTypeMap(schemas);
            _.forOwn(schemas, (schema: OpenAPIV3.SchemaObject, typeName: string) => {
                if (isNonArraySchemaObject(schema)) {
                    this.createRootType(typeName, schema);
                }
            });
        }
    }

    createUnionLiteral(schema: OpenAPIV3.SchemaObject): WriterFunction {
        return writer => {
            let choices = schema.enum as any[];
            for (let i = 0; i < choices.length; i++) {
                let choice = choices[i];
                if (typeof choice === 'string') {
                    writer
                        .quote()
                        .write(choice)
                        .quote();
                } else {
                    writer.write(choice.toString());
                }
                if (i !== choices.length - 1) writer.write(' | ');
            }
        };
    }

    createTypeLiteral(schema: OpenAPIV3.SchemaObject): WriterFunction {
        return (writer: CodeBlockWriter): void => {
            if (this.typeMap.has(schema)) {
                writer.write(this.typeMap.get(schema) as string);
                return;
            }
            if (isEnum(schema)) {
                this.createUnionLiteral(schema)(writer);
                return;
            }
            switch (schema.type) {
                case 'boolean':
                    writer.write('boolean');
                    break;
                case 'null':
                    writer.write('null');
                    break;
                case 'string':
                    writer.write('string');
                    break;
                case 'number':
                case 'integer':
                    writer.write('number');
                    break;
                case 'array':
                    let result = this.createTypeLiteral(schema.items);
                    result(writer);
                    writer.write('[]');
                    break;
                case 'object':
                    writer.inlineBlock(() => {
                        _.forOwn(schema.properties, (schema, key) => {
                            writer.write(key + ': ');
                            this.createTypeLiteral(schema)(writer);
                            writer.write(';').newLineIfLastNot();
                        });
                    });
                    break;
                case undefined:
                case null:
                    writer.write('any');
                    break;
            }
        };
    }

    sanitizeName(name: string): string {
        return name.replace(/[-.]/g, '_');
    }

    private initTypeMap(schemas: Record<string, OpenAPIV3.SchemaObject>) {
        if (schemas) {
            _.forOwn(schemas, (schema, typeName) => {
                this.typeMap.set(schema, this.sanitizeName(typeName));
            });
        }
    }
}
