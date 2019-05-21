import * as joi from 'joi';
import {
    StatementStructures,
    StructureKind,
    VariableStatementStructure,
    WriterFunction
} from 'ts-morph';
import { OpenAPIV3 } from './openapi-types';
import { TypeMap } from './type-map';
import { sanitizeName } from './utils';
import _ = require('lodash');

export class JoiSchemaBuilder {
    constructor(private document: OpenAPIV3.Document, private typeMap: TypeMap) {}

    createJoiSchemas(): StatementStructures[] {
        let result: StatementStructures[] = [];
        _.forOwn(this.document.components!.schemas, (schema: OpenAPIV3.SchemaObject, name) => {
            result.push(this.createJoiSchema(name, schema));
        });
        return [
            {
                kind: StructureKind.ImportDeclaration,
                moduleSpecifier: 'joi',
                namedImports: [
                    'ObjectSchema',
                    'ArraySchema',
                    'AnySchema',
                    'BooleanSchema',
                    'BinarySchema',
                    'DateSchema',
                    'NumberSchema',
                    'StringSchema',
                    'lazy',
                    'array',
                    'object',
                    'boolean',
                    'number',
                    'string',
                    'any'
                ]
            },
            {
                kind: StructureKind.Namespace,
                isExported: true,
                statements: result,
                name: 'JoiSchemas'
            }
        ];
    }

    private getJoiSchemaType(
        schema: OpenAPIV3.SchemaObject
    ):
        | 'ObjectSchema'
        | 'ArraySchema'
        | 'AnySchema'
        | 'BooleanSchema'
        | 'BinarySchema'
        | 'DateSchema'
        | 'NumberSchema'
        | 'StringSchema' {
        switch (schema.type) {
            case 'string':
                return 'StringSchema';
            case 'number':
                return 'NumberSchema';
            case 'integer':
                return 'NumberSchema';
            case 'boolean':
                return 'BooleanSchema';
            case 'object':
                return 'ObjectSchema';
            case 'array':
                return 'ArraySchema';
            case 'null':
            default:
                return 'AnySchema';
        }
    }

    private createJoiSchema(
        name: string,
        schema: OpenAPIV3.SchemaObject
    ): VariableStatementStructure {
        return {
            kind: StructureKind.VariableStatement,
            isExported: true,
            declarations: [
                {
                    name: sanitizeName(name),
                    type: this.getJoiSchemaType(schema),
                    initializer: this.schemaWriter(schema, true)
                }
            ]
        };
    }

    private schemaWriter(schema: OpenAPIV3.SchemaObject, skipTypeMap?: boolean): WriterFunction {
        return writer => {
            if (!skipTypeMap && this.typeMap.has(schema)) {
                return writer
                    .write('lazy(()=>')
                    .write(sanitizeName(this.typeMap.get(schema)))
                    .write(')');
            }
            switch (schema.type) {
                case 'array':
                    writer.write('array()');
                    if (schema.items) {
                        writer.write('.items(');
                        this.schemaWriter(schema.items)(writer);
                        writer.write(')');
                    }
                    return;
                case 'object':
                    writer
                        .write('object(')
                        .inlineBlock(() => {
                            _.forOwn(schema.properties, (schema, name) => {
                                writer.write(sanitizeName(name)).write(': ');
                                this.schemaWriter(schema)(writer);
                                writer.write(',').newLine();
                            });
                        })
                        .write(')');

                    return;
                case 'boolean':
                    return writer.write('boolean()');
                case 'integer':
                    return writer.write('number().integer()');
                case 'number':
                    return writer.write('number()');
                case 'string':
                    return writer.write('string()');
                case 'null':
                default:
                    return writer.write('any()');
            }
        };
    }
}
