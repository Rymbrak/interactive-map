interface ISidebar {
    populateSidebarMarkers(): void;
    createPanel(panelId: string, icon: string, content: string, title: string): void;
}