import { attempt, object, string } from 'joi';
import { SourceFile } from 'ts-morph';
import * as tm from 'ts-morph';
import { CodegenPlugin, Context, PluginResult } from '../../pipeline';
import { TypeBuilder } from './generators';
import { getOpenAPIConfig } from './openapi';
import { OpenAPIV3 } from './openapi-types';

export interface OpenapiPluginConfig {
    openapiFile: string;
    typingsFile: string;
}

const configSchema = object({
    openapiFile: string().default('./openapi.yml'),
    typingsFile: string().default('./src/openapi/generated.ts')
});

export class OpenapiPlugin implements CodegenPlugin {
    constructor(protected config: OpenapiPluginConfig) {}

    async run(context: Context): Promise<PluginResult> {
        let project = new tm.Project({
            addFilesFromTsConfig: false
        });
        let source: SourceFile = project.createSourceFile(this.config.typingsFile,'', {overwrite: true});
        let config: OpenAPIV3.Document = await getOpenAPIConfig(this.config.openapiFile);
        let builder = new TypeBuilder(config);
        let namespaceDeclaration = builder.createTypings();
        source.set({ statements: [namespaceDeclaration] });
        context.command.log('Emiting source file to ', this.config.typingsFile);
        await project.save();
        return { ok: true };
    }

    static create(config: Partial<OpenapiPluginConfig>): OpenapiPlugin {
        return new OpenapiPlugin(attempt(config, configSchema) as OpenapiPluginConfig);
    }
}
