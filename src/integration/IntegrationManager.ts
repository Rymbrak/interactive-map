import { Dendron } from "./Dendron";

export module Integration {

    export class IntegrationManager {

        dendron: IIntegrator;

        constructor() {
            this.dendron = new Dendron();
        }

        async parseNote(note: string) {

            return await this.dendron.parse(note);

        }

        setWorkspace(workspace: string){
            this.dendron.setWorkspace(workspace);
        }

    }
}