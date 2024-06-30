interface IIntegrator {
    parse(note: string): Promise<string>;
    init(): void;
    setWorkspace(workspace: string):void;
}