export module Integration {

    export class NoteRenderer implements INoteRenderer {

        workspace: string = "";

        setWorkspace(workspace: string): void {
            this.workspace = workspace;
        }
        
        parse(note: string): string {

            let result = note;

            return result;
        }

    }

}