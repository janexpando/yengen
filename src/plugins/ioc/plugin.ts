import { CodegenPlugin, Context, PluginResult } from '../../pipeline';

interface ToInjectItem {
    name: string;
    path: string;
}

export interface IocContext extends Context {
    toInject: ToInjectItem[];
}

export interface IocConfig {
    outputFile: string;
}

export class IocPlugin implements CodegenPlugin<IocContext> {
    constructor(private config: IocConfig) {
    }

    async run(context: IocContext): Promise<PluginResult> {
        return {
            ok: true
        };
    }

    static create(config: IocConfig) {
        return new IocPlugin(config);
    }
}
