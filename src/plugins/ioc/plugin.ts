import * as path from 'path';
import * as tm from 'ts-morph';
import {
    ImportDeclarationStructure,
    StatementStructures,
    StructureKind,
    VariableDeclarationKind
} from 'ts-morph';
import { CodegenPlugin, Context, PluginResult } from '../../pipeline';

/**
 * The object should be structured that from process root you can do
 * import { [name] } from '[path]';
 */
interface ImportAddress {
    /**
     * name of the exported variable
     */
    name: string;
    /**
     * path to file from pwd
     */
    path: string;
}

export interface IocContext extends Context {
    toProvide: ImportAddress[];
}

export interface IocConfig {
    outputFile?: string;
}

export function createAddressImport(
    location: string,
    address: ImportAddress,
    importAs: string
): ImportDeclarationStructure {
    let relativeLocation = path.relative(location, address.path);
    return {
        kind: StructureKind.ImportDeclaration,
        namedImports: [
            {
                kind: StructureKind.ImportSpecifier,
                alias: importAs,
                name: address.name
            }
        ],
        moduleSpecifier: relativeLocation
    };
}

export function createProviders(
    context: IocContext,
    location: string
): StatementStructures[] {
    let imports: StatementStructures[] = [];
    let providers: string[] = [];
    for (let i = 0; i < context.toProvide.length; i++) {
        let address = context.toProvide[i];
        let providerName = `providers_${i}`;
        imports.push(createAddressImport(location, address, providerName));
        providers.push(providerName);
    }
    return [
        ...imports,
        {
            kind: StructureKind.VariableStatement,
            declarationKind: VariableDeclarationKind.Const,
            isExported: true,
            declarations: [
                {
                    type: 'Provider[]',
                    name: 'PROVIDERS',
                    initializer: `[ ${providers.join(', ')} ]`
                }
            ]
        }
    ];
}

export class IocPlugin implements CodegenPlugin<IocContext> {
    constructor(private config: IocConfig) {
        if (!config.outputFile)
            this.config.outputFile = 'src/generated/providers.ts';
    }

    async run(context: IocContext): Promise<PluginResult> {
        let project = new tm.Project({
            addFilesFromTsConfig: false
        });
        project.createSourceFile(
            this.config.outputFile!,
            {
                statements: [
                    {
                        kind: StructureKind.ImportDeclaration,
                        namedImports: [{ name: 'Provider' }],
                        moduleSpecifier: 'injection-js'
                    },
                    ...createProviders(context, this.config.outputFile!)
                ]
            },
            { overwrite: true }
        );
        await project.save();
        return {
            ok: true
        };
    }

    static create(config: IocConfig) {
        return new IocPlugin(config);
    }
}
