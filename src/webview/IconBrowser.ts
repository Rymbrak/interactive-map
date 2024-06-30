import * as L from 'leaflet';
import path = require('path');

export module IconBrowser {
    export class IconBrowser extends L.Control {

        iconManager: IIconManager;
        /**
         * Origin for the icon browser window.
         */
        root: HTMLDivElement | undefined;
        /**
         * Panel with UI elements
         */
        panel: HTMLDivElement | undefined;
        /**
         * Bar with icons.
         */
        iconBar: HTMLDivElement | undefined;
        /**
         * Button for opening and closing the icon browser. 
         */
        collapsible: HTMLButtonElement | undefined;
        /**
         * Searchbar for searching icons.
         */
        searchbar: HTMLInputElement | undefined;
        /**
         * Main window for the icon browser.
         */
        window: HTMLDivElement | undefined;
        iconRoot: HTMLDivElement | undefined;
        pathLabel: HTMLElement | undefined;

        helpText = "SVG images put in the extension's 'icons' folder will be available in the icon browser for use.\n" +
            "Make sure to put images in a folder, images at the root of the icons folder are ignored. \n"+
            "Note: SVGs with multiple colors will be recolored to a single color, possibly breaking them.\n" +
            "Left click an image to select it, click again to unselect.\n" +
            "Right click a marker in the sidebar to set it's icon to the selected image.\n" +
            "When no image is selected, the marker will be reset to the default icon instead.\n" +
            "Colors can be set in the map's json file, proper support with a color selector will be available in the next version.";


        pathList: string[] = ['/'];

        folderRoot: HTMLDivElement | undefined;

        /**
         * Map containing the container roots for each folder's content.
         * These will be used to show and hide content based on the currently navigated path.
         */
        folderContentContainers: Map<string, HTMLDivElement> = new Map<string, HTMLDivElement>();

        /**
         * Map containing all icons that are currently loaded. Icons are children of their respective folder's containers.
         */
        activeIcons: Map<HTMLDivElement, HTMLButtonElement[]> = new Map<HTMLDivElement, HTMLButtonElement[]>();

        currentFolder: HTMLDivElement | undefined = undefined;
        currentIcon: string = "";
        currentButton: HTMLButtonElement | undefined;

        folderPaths: string[] = [];
        folderContent: string[][] = [];

        onAdd(map: L.Map) {

            this.root = L.DomUtil.create('div', "icon-browser-root ");
            this.window = this.createBrowser();
            this.panel = this.createPanel();

            this.root.appendChild(this.panel);
            this.root.appendChild(this.window);

            L.DomEvent.disableClickPropagation(this.root);
            L.DomEvent.disableScrollPropagation(this.root);

            return this.root;
        }

        onRemove(map: L.Map) {
            // Nothing to do here
        }

        constructor(iconManager: IIconManager, options?: L.ControlOptions) {
            super(options);
            this.iconManager = iconManager;
        }

        /**
         * Creates a panel containing UI elements for the icon browser.
         * @returns 
         */
        createPanel(): HTMLDivElement {

            let panel = L.DomUtil.create('div', "icon-browser-panel ");
            this.collapsible = L.DomUtil.create('button', "icon-browser-collapsible");

            this.collapsible.addEventListener("click", () => {
                if (this.window) {
                    if (this.window.style.display === 'none') {

                        this.window.style.display = 'inline';

                        if (this.iconBar) {
                            this.iconBar.style.display = 'grid';
                        }

                        if (this.root) {
                            this.root.style.height = 'auto';
                        }
                    } else {
                        this.window.style.display = 'none';

                        if (this.iconBar) {
                            this.iconBar.style.display = 'none';
                        }
                        if (this.root) {
                            this.root.style.height = '50px';
                        }
                    }
                }
            });

            this.iconBar = this.createControl();
            panel.appendChild(this.iconBar);
            panel.appendChild(this.collapsible);
            this.collapsible.innerHTML = this.iconManager.getIcon("file-image-fill", "");

            if (this.root) {
                this.root.style.height = '50px';
            }
            if (this.iconBar) {
                this.iconBar.style.display = 'none';
            }
            if (this.window) {
                this.window.style.display = 'none';
            }

            return panel;
        }

        /**
         * Creates a window for browsing icons alongside with a search bar.
         * @returns The root element for the browser window
         */
        createBrowser(): HTMLDivElement {

            let window = L.DomUtil.create('div', "icon-browser-background icon-browser-window");

            this.iconRoot = L.DomUtil.create('div', "");
            this.folderRoot = L.DomUtil.create('div', "icon-browser-background icon-browser-folders ");
            this.iconRoot.appendChild(this.folderRoot);

            let hr = L.DomUtil.create("hr", "");
            this.searchbar = L.DomUtil.create('input', "searchbar");

            this.searchbar.type = "text";
            this.searchbar.placeholder = "Search...";
            this.searchbar.addEventListener('change', () => this.filterIcons());

            window.appendChild(this.createUI());
            window.appendChild(hr);
            window.appendChild(this.iconRoot);
            window.appendChild(this.searchbar);
            return window;
        }

        /**
         *  Creates a control bar with buttons.
         *  Contains a button for collapsing the window, marking icons as favorites and going back a folder.
         * @returns The root element for the control bar.
         */
        createControl(): HTMLDivElement {

            let bar = L.DomUtil.create('div', "icon-browser-control");
            let back = L.DomUtil.create('button', "backButton");

            let favorite = L.DomUtil.create('button', "favorite");
            let help = L.DomUtil.create('button', "backButton");

            back.innerHTML = this.iconManager.getIcon("arrow-left", "");
            back.addEventListener('click', () => this.previousFolder());

            help.innerHTML = this.iconManager.getIcon("help", "");
            help.title = this.helpText;
            favorite.innerHTML = this.iconManager.getIcon("suit-heart-fill", "");

            bar.appendChild(back);
            bar.appendChild(favorite);
            bar.appendChild(help);
            return bar;
        }

        /**
         * Creates a elements for displaying the currently viewed folder.
         * @returns The root elements for the browser ui.
         */
        createUI(): HTMLElement {

            let uiRoot = L.DomUtil.create('div');
            this.pathLabel = L.DomUtil.create('label', "path");
            this.pathLabel.textContent = '/';

            uiRoot.appendChild(this.pathLabel);
            return uiRoot;
        }

        /**
         * Draws all folders found in the provided path
         * @param path Root path for which to draw the folders..
         */
        drawFolder(path: string) {

            if (this.folderRoot) {

                const element = path;
                let button = L.DomUtil.create('button', "icon-browser-folder");
                button.innerHTML = this.iconManager.getIcon("folder-fill", "") + " " + element;
                button.addEventListener("click", () => this.openFolder(element));
                this.folderRoot.appendChild(button);
            }
        }

        /**
         * 
         * @param paths Paths for all icons to draw.
         */
        public drawIcons(paths: string[] | undefined) {

            if (paths !== undefined) {
                if (this.iconRoot) {

                    let currentPath = this.pathList[this.pathList.length - 1];
                    let container: HTMLDivElement | undefined = this.folderContentContainers.get(currentPath);


                    if (container) {

                        container.style.display = 'grid';
                        this.currentFolder = container;
                    } else {

                        container = L.DomUtil.create('div', 'icon-browser-background icon-browser-icon-grid');
                        this.iconRoot.appendChild(container);

                        this.folderContentContainers.set(currentPath, container);
                        let iconList: HTMLButtonElement[] = [];

                        for (let i = 0; i < paths.length; i++) {
                            const element: string = paths[i];

                            let button = L.DomUtil.create('button', "icon-browser-button");
                            //button.style.background = 'url(' + element + ')';
                            button.addEventListener('click', () => this.selectIcon(element, button));
                            button.title = element.split('/').pop() || element.split('\\').pop() || "";

                            let image = L.DomUtil.create('img', 'icon-browser-image');
                            image.loading = 'lazy';
                            image.src = element;
                            button.appendChild(image);
                            container.appendChild(button);
                            iconList.push(button);
                        }

                        this.activeIcons.set(container, iconList);
                        this.currentFolder = container;
                    }
                }
            }
        }

        setFolderContent(paths: string[], content: string[][]) {

            this.folderPaths = paths;
            this.folderContent = content;
        }

        showHome() {
            this.folderPaths.forEach(element => {
                this.drawFolder(element);
            });
        }

        /**
         * Opens a folder and displays all icons contained in it and its subfolders.
         * @param path 
         */
        openFolder(path: string) {
            let length: number = this.pathList.length - 1;
            let previousPath: string = length > 0 ? this.pathList[length] : '';

            this.pathList.push(previousPath + '/' + path);

            if (this.pathLabel) {
                this.pathLabel.textContent = this.pathList[length + 1];
            }

            this.drawIcons(this.folderContent[this.folderPaths.indexOf(path)]);
            this.filterIcons();
            if (this.folderRoot) {

                this.folderRoot.style.display = 'none';
            }
        }

        /**
         * Returns to the previous folder, hiding the current folder's content.
         */
        previousFolder() {
            if (this.pathList.length > 1) {
                this.pathList.pop();
            }
            if (this.currentFolder) {
                this.currentFolder.style.display = 'none';
            }
            if (this.folderRoot) {
                this.folderRoot.style.display = 'grid';
            }
            if (this.pathLabel) {
                this.pathLabel.textContent = this.pathList[this.pathList.length - 1];
            }
        }

        /**
         * Selects an image to use for icons. Selecting the same image twice deselects it.
         * @param path 
         * @param button 
         */
        selectIcon(path: string, button: HTMLButtonElement) {

            if (button !== this.currentButton) {

                if (this.currentButton) {
                    this.currentButton.style.borderColor = '';
                    this.currentButton = undefined;
                }

                this.currentIcon = path;
                button.style.borderColor = 'yellow';
                this.currentButton = button;
            } else {
                this.currentIcon = "";
                this.currentButton.style.borderColor = '';
                this.currentButton = undefined;
            }
        }

        setFavorite() {

        }

        /**
         * Filters all active icons based on the searchbar's value.
         */
        filterIcons() {

            if (this.searchbar) {

                let filter: string = this.searchbar?.value;

                if (this.currentFolder) {

                    let iconList = this.activeIcons.get(this.currentFolder);

                    if (iconList) {

                        iconList.forEach(element => {
                            if (element.title.includes(filter)) {

                                element.style.display = 'block';
                            } else {

                                element.style.display = 'none';
                            }
                        });
                    }
                }
            }
        }
    }
}