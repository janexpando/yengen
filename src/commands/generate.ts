import { Command, flags } from '@oclif/command';
import { loadConfig, runPipeline } from '../pipeline';

export default class Generate extends Command {
    static description = 'describe the command here';

    static flags = {
        help: flags.help({ char: 'h' })
    };

    static args: any[] = [
        {
            name: 'file',
            default: './generate.ts',
            description: 'OpenAPI file location'
        }
    ];

    async run() {
        const { args } = this.parse(Generate);
        let config = loadConfig(args.file);
        if (!config.context) config.context = {};
        config.context.command = this;
        await runPipeline(config);
    }
}
