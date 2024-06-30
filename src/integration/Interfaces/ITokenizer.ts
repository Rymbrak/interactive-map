interface ITokenizer {
    getTokens(text: string): IToken[];
    replaceTokens(tokens: IToken[]): Promise<IToken[]>;
    combine(tokens: IToken[], replace: boolean): Promise<string>;
    addTokenDefinition(definition: ITokenDefinition): void;
}

interface IToken {
    type: string;
    content: string;
    children: IToken[];
}

interface ITokenDefinition {
    type:string;
    start: string;
    end: string;
    replace(token: IToken): Promise<string>;
}