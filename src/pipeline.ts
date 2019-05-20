import { Command } from '@oclif/command';
import * as path from 'path';

export interface Context {
    command: Command;
}

export interface PluginResult {
    ok: boolean;
}
export interface CodegenPlugin<Ctx extends Context = any> {
    run(context: Ctx): Promise<PluginResult>;
}

export interface Config<Ctx extends Context = any> {
    context?: Ctx;
    pipeline: CodegenPlugin[];
}

export async function runPipeline(config: Config) {
    let ctx = config.context || {};
    for (let plugin of config.pipeline) {
        await plugin.run(ctx);
    }
}

export function loadConfig(file: string): Config {
    let filePath = path.resolve(process.cwd(), file);
    let configModule = require(filePath);
    return configModule.default || configModule.config;
}

export async function loadConfigAndRunPipeline(file: string) {

}
