import { test } from '@oclif/test';
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import { promisify } from 'util';

describe('new:project', () => {
    test.command(['new:project', './.garbage/project'])
        .it('creates project', async ctx => {
            fs.existsSync('./.garbage/project/tsconfig.json');
            fs.existsSync('./.garbage/project/package.json');
            fs.existsSync('./.garbage/project/src/index.ts');
            await promisify(rimraf)('./.garbage/project');
        });
});
