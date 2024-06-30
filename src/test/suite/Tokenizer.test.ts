import * as assert from 'assert';
import { after, describe, it } from 'mocha';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { Integration } from '../../integration/Tokenizer';
// import * as myExtension from '../extension';


function text() {
    /**
     * 5 tokens with 2 variants of wiki links.
     */
    return "I learn in this letter that [[Don Pedro of Arragon | characters.pedro.don]] comes this night to [[places.messina]].";
}

let textBootstrap = 'Bootstrap Icons can be embedded : @(bi-patch-question-fill).';

function createTokenizer() {
    let tokenizer = new Integration.Tokenizer();
    tokenizer.addTokenDefinition({ type: "ref", start: "[[", end: "]]", replace: async (token: IToken) => token.content });
    return tokenizer;
}

suite('Extension Test Suite', () => {

    let tokenizer = createTokenizer();
    let tokens = tokenizer.getTokens(text());
    let tokensBootstrap = tokenizer.getTokens(textBootstrap);

    after(() => {
        vscode.window.showInformationMessage('Tokenizer tests done!');
    });

    test('Definition Length', () => {

        assert.strictEqual(tokenizer.getDefinitionLength(), 2);
    });

    test('Token Count', () => {
        /**
         * The tokenizer should find 5 tokens.
         */
        assert.strictEqual(tokens.length, 5);
    });

    test('Token Content', () => {

        assert.strictEqual(tokens[0].content, "I learn in this letter that ");
        assert.strictEqual(tokens[1].content, "Don Pedro of Arragon | characters.pedro.don");
        assert.strictEqual(tokens[2].content, " comes this night to ");
        assert.strictEqual(tokens[3].content, "places.messina");
        assert.strictEqual(tokens[4].content, ".");

    });

    test('Token Type', () => {

        assert.strictEqual(tokens[0].type, "text");
        assert.strictEqual(tokens[1].type, "ref");
        assert.strictEqual(tokens[2].type, "text");
        assert.strictEqual(tokens[3].type, "ref");
        assert.strictEqual(tokens[4].type, "text");
    });

    test('Bootstrap Token', () => {

        /**
         * Check token types and token content.
         * We expect 'Bootstrap Icons can be embedded : <div class="sidebar-icon"><i id="sidebar-icon" class="bi-patch-question-fill"></i> </div>.'
         * in total. The bootstrap icon name should be replaced with the respective html element.
         */
        assert.strictEqual(tokensBootstrap.length, 3);
        assert.strictEqual(tokensBootstrap[0].type, "text");
        assert.strictEqual(tokensBootstrap[1].type, "bootstrap");
        assert.strictEqual(tokensBootstrap[2].type, "text");

        assert.strictEqual(tokensBootstrap[0].content, 'Bootstrap Icons can be embedded : ');
        assert.strictEqual(tokensBootstrap[1].content, 'bi-patch-question-fill');
        assert.strictEqual(tokensBootstrap[2].content, ".");
        describe('Async Test' , () => { it("Replace and Combine", async function () {
            assert.strictEqual(await tokenizer.combine(tokensBootstrap, true), 'Bootstrap Icons can be embedded : <i class="sidebar-icon"><i id="sidebar-icon" class="bi-patch-question-fill"></i></i>.');
        });
    });
    });

});
