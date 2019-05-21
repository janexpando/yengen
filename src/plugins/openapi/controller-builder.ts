import { pascalCase } from 'change-case';
import {
    ClassDeclarationStructure,
    CodeBlockWriter,
    StatementStructures,
    StructureKind
} from 'ts-morph';
import { OpenAPIV3 } from './openapi-types';
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
    constructor(private document: OpenAPIV3.Document) {}

    createControllers(): StatementStructures[] {
        const statements: ClassDeclarationStructure[] = [];
        _.forOwn(this.document.paths, (pathItem: OpenAPIV3.PathItemObject, path: string) => {
            statements.push(this.createController(path, pathItem));
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
            {
                kind: StructureKind.Namespace,
                name: 'KoaControllers',
                isExported: true,
                statements
            }
        ];
    }

    private pathToControllerName(path: string): string {
        let prefix = path
            .replace(/[\{\}]/g, '')
            .split('/')
            .map(value => {
                return pascalCase(value);
            })
            .join('');
        return `${prefix}Controller`;
    }

    createController(path: string, pathItem: OpenAPIV3.PathItemObject): ClassDeclarationStructure {
        return {
            kind: StructureKind.Class,
            isExported: true,
            name: this.pathToControllerName(path),
            isAbstract: true,
            methods: [
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
        };
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
                    .write('handler: (ctx: koa.Context)=>')
                    .block(() => {
                        writer.write('ctx.status = 200;');
                    });
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
