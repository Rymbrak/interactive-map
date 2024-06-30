interface IIntegrationManager {
    parse(text: string): Promise<string>;
}