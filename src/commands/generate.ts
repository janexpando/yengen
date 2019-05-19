import { Command, flags } from '@oclif/command';
import { SourceFile } from 'ts-morph';
import * as tm from 'ts-morph';
import { TypeBuilder } from '../generators';

import { getOpenAPIConfig } from '../openapi';
import { OpenAPIV3 } from '../openapi-types';

export default class Generate extends Command {
    static description = 'describe the command here';

    static flags = {
        help: flags.help({ char: 'h' }),
        log: flags.boolean({ char: 'l', description: 'log to stdout' })
    };

    static args: any[] = [
        {
            name: 'file',
            default: './openapi.json',
            description: 'OpenAPI file location'
        }
    ];

    async run() {
        const { args } = this.parse(Generate);

        let project = new tm.Project({
            useVirtualFileSystem: true,
            addFilesFromTsConfig: false
        });
        let source: SourceFile = project.createSourceFile('generated.ts');
        let config: OpenAPIV3.Document = await getOpenAPIConfig(args.file);
        let builder = new TypeBuilder(source);
        builder.createTypingsFromDocument(config);
        this.log(source.getFullText());
    }
}
