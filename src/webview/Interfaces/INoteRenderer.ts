interface INoteRenderer {

    setWorkspace(workspace: string): void;
    parse(note: string): string;

}