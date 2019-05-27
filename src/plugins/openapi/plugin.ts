import { attempt, boolean, object, string } from 'joi';
import { SourceFile, StatementStructures } from 'ts-morph';
import * as tm from 'ts-morph';
import { CodegenPlugin, Context, PluginResult } from '../../pipeline';
import { JoiSchemaBuilder } from './joi-schema-builder';
import { TypeBuilder } from './type-builder';
import { getOpenAPIConfig } from './openapi';
import { OpenAPIV3 } from './openapi-types';
import { TypeMap } from './type-map';

export interface OpenapiPluginConfig {
    openapiFile: string;
    outputFile: string;
    createTypings: boolean;
    createJoiSchemas: boolean;
    createControllers: boolean;
}

const configSchema = object({
    openapiFile: string().default('./openapi.yml'),
    outputFile: string().default('./src/openapi/generated.ts'),
    createTypings: boolean().default(true),
    createJoiSchemas: boolean().default(true),
    createControllers: boolean().default(true),
});

export class OpenapiPlugin implements CodegenPlugin {
    constructor(protected config: OpenapiPluginConfig) {}

    async run(context: Context): Promise<PluginResult> {
        let project = new tm.Project({
            addFilesFromTsConfig: false
        });
        let source: SourceFile = project.createSourceFile(this.config.outputFile, '', {
            overwrite: true
        });
        const statements: StatementStructures[] = [];

        let config: OpenAPIV3.Document = await getOpenAPIConfig(this.config.openapiFile);
        let typeMap = new TypeMap(config);
        if (this.config.createTypings) {
            let builder = new TypeBuilder(config, typeMap);
            statements.push(builder.createTypings());
        }
        if (this.config.createJoiSchemas) {
            let joiBuilder = new JoiSchemaBuilder(config, typeMap);
            let joiStatements = joiBuilder.createJoiSchemas();
            statements.push(...joiStatements);
        }
        source.set({ statements });
        context.command.log('Emiting source file to ', this.config.outputFile);
        await project.save();
        return { ok: true };
    }

    static create(config: Partial<OpenapiPluginConfig>): OpenapiPlugin {
        return new OpenapiPlugin(attempt(config, configSchema) as OpenapiPluginConfig);
    }
}
