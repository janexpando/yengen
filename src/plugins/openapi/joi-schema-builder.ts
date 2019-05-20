import * as joi from 'joi';
import {
    StatementStructures,
    StructureKind,
    VariableStatementStructure,
    WriterFunction
} from 'ts-morph';
import { OpenAPIV3 } from './openapi-types';
import { TypeMap } from './type-map';
import _ = require('lodash');

export class JoiSchemaBuilder {
    constructor(private document: OpenAPIV3.Document, private typeMap: TypeMap) {}

    async createJoiSchemas(): Promise<StatementStructures[]> {
        let result: StatementStructures[] = [];
        _.forOwn(this.document.components!.schemas, (schema: OpenAPIV3.SchemaObject, name) => {
            result.push(this.createJoiSchema(name, schema));
        });
        return [
            {
                kind: StructureKind.ImportDeclaration,
                moduleSpecifier: 'joi',
                defaultImport: '* as joi'
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
        | 'joi.ObjectSchema'
        | 'joi.ArraySchema'
        | 'joi.AnySchema'
        | 'joi.BooleanSchema'
        | 'joi.BinarySchema'
        | 'joi.DateSchema'
        | 'joi.NumberSchema'
        | 'joi.StringSchema' {
        switch (schema.type) {
            case 'string':
                return 'joi.StringSchema';
            case 'number':
                return 'joi.NumberSchema';
            case 'integer':
                return 'joi.NumberSchema';
            case 'boolean':
                return 'joi.BooleanSchema';
            case 'object':
                return 'joi.ObjectSchema';
            case 'array':
                return 'joi.ArraySchema';
            case 'null':
            default:
                return 'joi.AnySchema';
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
                    name,
                    type: this.getJoiSchemaType(schema),
                    initializer: this.schemaWriter(schema)
                }
            ]
        };
    }

    private schemaWriter(schema: OpenAPIV3.SchemaObject): WriterFunction {
        return writer => {
            switch (schema.type) {
                case 'array':
                    writer.write('joi.array()');
                    if (schema.items) {
                        writer.write('.items(');
                        this.schemaWriter(schema.items)(writer);
                        writer.write(')');
                    }
                    return;
                case 'object':
                    writer
                        .write('joi.object(')
                        .inlineBlock(() => {
                            _.forOwn(schema.properties, (schema, name) => {
                                writer.write(name).write(': ');
                                this.schemaWriter(schema)(writer);
                                writer.write(',').newLine();
                            });
                        })
                        .write(')');

                    return;
                case 'boolean':
                    // language=TypeScript
                    return writer.write('joi.boolean()');
                case 'integer':
                    // language=TypeScript
                    return writer.write('joi.number().integer()');
                case 'number':
                    // language=TypeScript
                    return writer.write('joi.number()');
                case 'string':
                    // language=TypeScript
                    return writer.write('joi.string()');
                case 'null':
                default:
                    // language=TypeScript
                    return writer.write('joi.any()');
            }
        };
    }
}
