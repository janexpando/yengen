import { camelCase, pascalCase } from 'change-case';
import {
    CodeBlockWriter,
    InterfaceDeclarationStructure,
    MethodDeclarationStructure,
    PropertySignatureStructure,
    StatementStructures,
    StructureKind,
    WriterFunction
} from 'ts-morph';
import { OpenAPIV3 } from './openapi-types';
import { TypeBuilder } from './type-builder';
import _ = require('lodash');

type HttpOperation = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';
const HTTP_OPERATIONS: HttpOperation[] = [
    'get',
    'put',
    'post',
    'delete',
    'options',
    'head',
    'patch',
    'trace'
];
export class ControllerBuilder {
    constructor(private document: OpenAPIV3.Document, private typeBuilder: TypeBuilder) {}

    createControllers(): StatementStructures[] {
        const statements: StatementStructures[] = [];
        _.forOwn(this.document.paths, (pathItem: OpenAPIV3.PathItemObject, path: string) => {
            statements.push(...this.createController(path, pathItem));
        });
        return [
            {
                kind: StructureKind.ImportDeclaration,
                moduleSpecifier: 'koa-joi-router',
                defaultImport: '* as createRouter'
            },
            {
                kind: StructureKind.ImportDeclaration,
                moduleSpecifier: 'koa',
                defaultImport: '* as koa'
            },
            this.typeBuilder.createTypings(),
            {
                kind: StructureKind.Namespace,
                name: 'KoaControllers',
                isExported: true,
                statements
            }
        ];
    }

    private toTypeName(path: string, method: string, suffix: string) {
        let pathName = this.toPathName(path);
        return `${pascalCase(method)}${pathName}${suffix}`;
    }

    private pathToControllerName(path: string): string {
        let prefix = this.toPathName(path);
        return `${prefix}Controller`;
    }

    private toPathName(path: string) {
        return path
            .replace(/[\{\}]/g, '')
            .split('/')
            .map(value => {
                return pascalCase(value);
            })
            .join('');
    }

    private createRouteContextType(
        path: string,
        method: HttpOperation,
        pathItem: OpenAPIV3.PathItemObject
    ): InterfaceDeclarationStructure[] {
        let operation: OpenAPIV3.OperationObject = pathItem[method]!;
        function writeParams(typeBuilder: TypeBuilder, paramsIn: string): WriterFunction {
            return writer => {
                writer.write('{');
                for (let parameter of operation.parameters || []) {
                    if (parameter.in === paramsIn) {
                        writer.write(parameter.name);
                        if (parameter.schema) {
                            writer.write(':');
                            typeBuilder.createTypeLiteral(parameter.schema)(writer);
                        }
                        writer.write(',');
                    }
                }
                writer.write('}');
            };
        }
        let query: PropertySignatureStructure = {
            kind: StructureKind.PropertySignature,
            name: 'query',
            type: writeParams(this.typeBuilder, 'query')
        };
        let params: PropertySignatureStructure = {
            kind: StructureKind.PropertySignature,
            name: 'headers',
            type: writeParams(this.typeBuilder, 'header')
        };
        return [
            {
                kind: StructureKind.Interface,
                name: this.toTypeName(path, method, 'Context'),
                extends: ['koa.Context'],
                isExported: true,
                properties: [query, params]
            }
        ];
    }

    private createContextTypes(
        path: string,
        pathItem: OpenAPIV3.PathItemObject
    ): InterfaceDeclarationStructure[] {
        let result: InterfaceDeclarationStructure[] = [];
        for (let method of HTTP_OPERATIONS) {
            if (pathItem[method]) {
                result.push(...this.createRouteContextType(path, method, pathItem));
            }
        }
        return result;
    }

    private createHandleMethod(
        path: string,
        method: string,
        pahtItem: OpenAPIV3.PathItemObject
    ): MethodDeclarationStructure {
        return {
            kind: StructureKind.Method,
            name: camelCase(`handle ${method}`),
            returnType: 'void',
            isAbstract: true,
            parameters: [
                {
                    name: 'ctx',
                    type: this.toTypeName(path, method, 'Context')
                }
            ]
        };
    }

    private createHandleMethods(
        path: string,
        pathItem: OpenAPIV3.PathItemObject
    ): MethodDeclarationStructure[] {
        return HTTP_OPERATIONS.filter(path => pathItem[path]).map(method =>
            this.createHandleMethod(path, method, pathItem)
        );
    }

    createController(path: string, pathItem: OpenAPIV3.PathItemObject): StatementStructures[] {
        return [
            ...this.createContextTypes(path, pathItem),
            {
                kind: StructureKind.Class,
                isExported: true,
                name: this.pathToControllerName(path),
                isAbstract: true,
                methods: [
                    ...this.createHandleMethods(path, pathItem),
                    {
                        name: 'createRouter',
                        returnType: 'createRouter.Router',
                        statements: writer => {
                            writer.write('return').space();
                            this.writeRouter(writer, path, pathItem);
                            writer.write(';');
                        }
                    }
                ]
            }
        ];
    }

    private writeRoute(
        writer: CodeBlockWriter,
        path: string,
        pathItem: OpenAPIV3.PathItemObject,
        method: HttpOperation
    ) {
        writer
            .write('.route(')
            .inlineBlock(() => {
                writer
                    .write('path: "')
                    .write(path)
                    .write('",')
                    .newLine()
                    .write('method: "')
                    .write(method)
                    .write('",')
                    .newLine()
                    .write('validate: ')
                    .inlineBlock()
                    .write(',')
                    .newLine()
                    .write('handler: ')
                    .write(`this.handle${pascalCase(method)}.bind(this)`);
            })
            .write(')');
    }

    private writeRouter(writer: CodeBlockWriter, path: string, pathItem: OpenAPIV3.PathItemObject) {
        writer.write('createRouter()');
        for (let method of HTTP_OPERATIONS) {
            if (pathItem[method]) {
                this.writeRoute(writer, path, pathItem, method);
            }
        }
    }
}
