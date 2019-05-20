import { expect } from '@oclif/test';
import { Identifier, Project, VariableDeclaration } from 'ts-morph';

describe('getting references', function() {
    it('should get declaration from thing', function() {
        let project = new Project({useVirtualFileSystem: true});
        let source = project.createSourceFile("ref.ts",`
        const x = 5;
        const result = x + x;`);
        let yDeclaration = source.getVariableDeclarationOrThrow('result');
        let identifier: Identifier = yDeclaration.getInitializerOrThrow().getChildren()[0] as any;
        const xDeclaration: VariableDeclaration = identifier.getDefinitions()[0].getDeclarationNode()! as any;
        xDeclaration.findReferencesAsNodes().forEach(ref=>ref.replaceWithText(xDeclaration.getStructure().initializer as string));
        expect(source.print()).to.be.eq('const x = 5;\nconst result = 5 + 5;\n');
    });
});
