import { Command, flags } from '@oclif/command';
import { IArg } from '@oclif/parser/lib/args';
import { exec } from 'child_process';
import * as fs from 'fs';
import { Project } from 'ts-morph';

export default class NewProject extends Command {
    static description = 'describe the command here';

    static flags = {
        help: flags.help({ char: 'h' })
    };

    static args: IArg[] = [{ name: 'dirPath', required: true }];

    async run() {
        let originalCwd = process.cwd();
        try {
            const { args, flags } = this.parse(NewProject);
            let dirPath = args.dirPath;
            if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
            process.chdir(dirPath);

            exec('npm init --force');
            let tsConfigFilePath = 'tsconfig.json';
            // fs.mkdirSync(join('src'));
            fs.writeFileSync(
                tsConfigFilePath,
                JSON.stringify(
                    {
                        compilerOptions: {
                            declaration: true,
                            importHelpers: true,
                            module: 'commonjs',
                            outDir: 'lib',
                            rootDir: 'src',
                            strict: true,
                            target: 'es2017',
                            composite: true,
                            inlineSourceMap: true,
                            inlineSources: true
                        },
                        include: ['src/**/*']
                    },
                    undefined,
                    2
                )
            );
            let project = new Project({
                tsConfigFilePath: tsConfigFilePath,
                compilerOptions: { project: '' }
            });
            project.createSourceFile('src/index.ts');
            project.createSourceFile(
                '.prettierrc.json',
                JSON.stringify(
                    {
                        semi: true,
                        singleQuote: true,
                        tabWidth: 4,
                        printWidth: 100,
                        overrides: [
                            {
                                files: ['*.yml'],
                                options: {
                                    tabWidth: 2
                                }
                            }
                        ]
                    },
                    undefined,
                    2
                )
            );
            project.saveSync();
            this.log(`Project created in ${dirPath}`);
        } finally {
            process.chdir(originalCwd);
        }
    }
}
