import { expect } from '@oclif/test';
import { loadConfig } from '../src/pipeline';

describe('pipeline', function() {
    it('should load config from path', function() {
        let config = loadConfig('./test/fixtures/sample-config.ts');
        expect(config).to.be.ok;
    });
});
