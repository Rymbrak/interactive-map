export module Integration {

    /**
     * Class for tokenizing strings, building a list of contained tokens.
     * Tokens are denoted by token definitions, that describe starting and ending characters, as well as functions for replacing their content.
     * The tokenizer has a build-in definition for bootstrap icons.
     */
    export class Tokenizer implements ITokenizer {

        tokenDefinitions: ITokenDefinition[] = [];

        constructor() {
            this.addBootstrapTokenDefinition();
        }

        /**
         * Adds a token definition for use of Bootstrap icons in text.
         */
        addBootstrapTokenDefinition() {
            this.addTokenDefinition({ type: "bootstrap", start: "@(", end: ")", replace: async (token: IToken) => this.bootstrapToken(token.content) ?? token.content });
        }

        /**
         * Wraps the provided icon name HTML elements and styles.
         * @param name Name of the Bootstrap icon.
         * @returns 
         */
        bootstrapToken(name: string): string {
    
            /**
             * Changed so we can use them inline
             */
            return '<i class="sidebar-icon"><i id="sidebar-icon" class="' + name + '"></i></i>';
        //    return '<div class="sidebar-icon"><i id="sidebar-icon" class="' + name + '"></i></div>';
        }

        /**
         * Returns tokens found in the provided text. Token Definitions have to be added to the tokenizer before hand.
         * A tokenizer without definitions returns the input text.
         * 
         * @param text String to tokenize, containing normal text and special character sequences that denote token starts and ends. These are defined in the Tokenizer's token definitions.
         * @returns A list of tokens found in the text.
         */
        getTokens(text: string): IToken[] {

            let tokens: IToken[] = [];

            let n = this.getDefinitionLength();

            /**
             * Search for tokens, passing "" for the end delimiter lets the function parse till the end. 
             */
            this.tokenize(text, 0, n, "", tokens);

            return tokens;
        }

        /**
         * Replaces the content of the provided tokens according to their corresponding token definition's replace function.
         * Tokens with a missing type will not have their content changed.
         * @param tokens List of tokens.
         * @returns The list of tokens with their content replaced.
         */
        async replaceTokens(tokens: IToken[]): Promise<IToken[]> {

            for (let token of tokens) {

                let definition = this.tokenDefinitions.find(i => i.type === token.type);

                if (definition) {
                    token.content = await definition?.replace(token);
                }
            }

            return tokens;
        }

        /**
        * Combines the content of all passed tokens and returns the resulting string.
        * @param tokens List of tokens.
        * @param replace If true, replaceTokens will be called on the provided tokens first. Otherwise their content is combined as is.
        * @returns A string containing the concatenated content of all passed tokens.
         */
        async combine(tokens: IToken[], replace: boolean): Promise<string> {

            if (replace) {
                await this.replaceTokens(tokens);
            }

            let result = "";

            for (let token of tokens) {
                result += token.content;
            }

            return result;
        }

        /**
         * Tokenizes the given string, adding tokens in the passed IToken list.
         * @param text Text to tokenize.
         * @param startIndex Zero-based index from where to start tokenizing. Use 0 when manually calling to start..
         * @param windowSize Size of the window used for checking token starts and ends.
         * @param end String indicating the end of  the current token type.
         * @param tokens List of current found tokens.
         * @returns The last checked character index.
         */
        tokenize(text: string, startIndex: number, windowSize: number, end: string, tokens: IToken[]): number {

            /**
             * We parse the input text and build a list of possibly nested tokens
             * We slide a window over the entire text and check for any definition start delimiters.
             * The window will have the size of the longest delimiter, shorter delimiters are checked from the window's end.
             * The tokenizer reads everything as text tokens till a different token is found.
             */
            let window = "";
            let textToken = { type: "text", content: "", children: [] };
            let textTokenStart = startIndex;

            for (let i = startIndex; i < text.length; i++) {

                window += text.charAt(i);

                if (window.length > windowSize) {
                    window = window.substring(1);
                }

                let result = this.checkDefinitions(text, window, windowSize, end, tokens, i, textTokenStart);

                if (i !== result.index || result.end) {

                    textTokenStart = result.index + 1;
                    i = result.index;

                    if (end !== "") {
                        return i;
                    }
                }
            }

            textToken.content = text.substring(textTokenStart);
            if (textToken.content.length > 0) {

                tokens.push(textToken);
            }

            return text.length;
        }

        /**
         * Check the passed window for a token definition start and build up a list of tokens.
         * Tokens can occur in nested form within the text, in which case they will be added in the order they appear in.
         * @param text String to tokenize, containing normal text and special character sequences that denote token starts and ends. These are defined in the Tokenizer's token definitions.
         * @param window String to check for definitions.
         * @param windowSize Number checked characters in the current window.
         * @param end String for the current definition end.
         * @param tokens List of current tokens which will be modified.
         * @param i Current parsed index from which to start.
         * @param textTokenStart Index of the last text token start.
         * @returns The index till which we parsed and whether a definition end was found.
         */
        checkDefinitions(text: string, window: string, windowSize: number, end: string, tokens: IToken[], i: number, textTokenStart: number) {

            let parsedTill = i;

            for (let def of this.tokenDefinitions) {

                if (def.start.length <= window.length) {
                    if (window.substring(window.length - def.start.length) === def.start) {

                        /**
                         * We store everything up to the definition start as the text token's content, since that text is not a special token. If there are no characters, then no token is created. Multiple non-text tokens can follow after each other.
                         * Do note, substring does not include the last character, that is why we add a 1, and then subtract the definition length to remove special characters.
                         */
                        let content = text.substring(textTokenStart, i - def.start.length + 1);

                        if (content.length > 0) {
                            tokens.push({ type: "text", content: content, children: [] });
                        }

                        /**
                         * A start delimiter was found, we create a new token and call the tokenizer for the remaining characters.
                         * After finding the end delimiter, we need to move our parsing index and reset the window, since every character up to the new index has been parsed.
                         * 
                         */
                        let token = { type: def.type, content: "", children: [] };

                        parsedTill = this.tokenize(text, i + 1, windowSize, def.end, token.children);
                        token.content = text.substring(i + 1, parsedTill - def.end.length + 1);
                        tokens.push(token);

                        window = "";

                        return { index: parsedTill, end: false };
                    }
                }

                if (end !== "" && window.substring(window.length - end.length) === end) {

                    /**
                     * We found the end delimiter for the last parsed token, return till which character we parsed, so the previous call can continue from there.
                     */
                    return { index: i, end: true };
                }
            }

            return { index: parsedTill, end: false };
        }

        /**
         * Adds a token definition to the tokenizer.
         * @param definition A token definition containing a start and end string, as well as a replace function.
         */
        addTokenDefinition(definition: ITokenDefinition): void {
            this.tokenDefinitions.push(definition);
        }

        /**
         * Returns the longest definition length.
         * Used to determine what the maximum window for parsing will be.
         * @returns length of the longest definition start.
         */
        getDefinitionLength(): number {

            let n = 0;

            for (let def of this.tokenDefinitions) {

                if (def.start.length > n) {
                    n = def.start.length;
                }

                if (def.end.length > n) {
                    n = def.end.length;
                }
            }

            return n;
        }
    }
}