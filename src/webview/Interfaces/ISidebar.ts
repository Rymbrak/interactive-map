interface ISidebar {
    populateSidebarFeatures(): void;  
    createPanel(panelId: string, icon: string, content: string, title: string): void;
}