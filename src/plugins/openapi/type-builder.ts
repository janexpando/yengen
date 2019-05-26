import {
    CodeBlockWriter,
    NamespaceDeclarationStructure,
    OptionalKind,
    PropertySignatureStructure,
    StatementStructures,
    StructureKind,
    WriterFunction
} from 'ts-morph';
import { isEnum, isNonArraySchemaObject, OpenAPIV3 } from './openapi-types';
import { TypeMap } from './type-map';
import _ = require('lodash');
import { sanitizeName } from './utils';

export class TypeBuilder {
    constructor(private document: OpenAPIV3.Document, private typeMap: TypeMap) {}

    private createRootType(
        name: string,
        schema: OpenAPIV3.NonArraySchemaObject
    ): StatementStructures | null {
        name = sanitizeName(name);
        if (isEnum(schema)) {
            return {
                kind: StructureKind.TypeAlias,
                name,
                type: this.createUnionLiteral(schema),
                isExported: true
            };
        }
        switch (schema.type) {
            case 'object':
                const properties: OptionalKind<PropertySignatureStructure>[] = [];
                let propertySchemas = schema.properties || {};
                _.forOwn(propertySchemas, (schema, key) => {
                    if (/-/.test(key)) {
                        key = `"${key.replace(/"/g, `\\\"`)}"`;
                    }
                    let propertyStructure: OptionalKind<PropertySignatureStructure> = {
                        name: key
                    };
                    if (schema.type) propertyStructure.type = this.createTypeLiteral(schema);
                    properties.push(propertyStructure);
                });
                return {
                    kind: StructureKind.Interface,
                    name: sanitizeName(name),
                    properties,
                    isExported: true
                };
            case 'integer':
            case 'number':
            case 'null':
            case 'string':
            case 'boolean':
                return {
                    kind: StructureKind.TypeAlias,
                    name,
                    type: schema.type,
                    isExported: true
                };
        }
        return null;
    }

    createTypings(): NamespaceDeclarationStructure {
        let statements: StatementStructures[] = [];
        if (this.document.components && this.document.components.schemas) {
            let schemas = this.document.components.schemas;
            _.forOwn(schemas, (schema: OpenAPIV3.SchemaObject, typeName: string) => {
                if (isNonArraySchemaObject(schema)) {
                    let statement = this.createRootType(typeName, schema);
                    if (statement) statements.push(statement);
                }
            });
        }
        return {
            kind: StructureKind.Namespace,
            name: 'ApiSchemas',
            statements: statements,
            isExported: true
        };
    }

    private createUnionLiteral(schema: OpenAPIV3.SchemaObject): WriterFunction {
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
                writer.write(sanitizeName(this.typeMap.get(schema)));
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
}
