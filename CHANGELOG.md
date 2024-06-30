# Change Log

## 0.5.0

- Added support for custom marker icons. You can put SVGs in the extension's icon folder to make them available in the icon browser (bottom left button on the map).
  - Check the icon browser's help tooltip for more information.
  - The 'Show Feature' function doesn't properly work with custom icons yet.
  - These icons are currently not portable, meaning they only work as long as they are available in the icon folder. It's planned to automatically copy them to the interactive-map folder in the future.
- Support for coloring the markers exists, however no UI is provided yet. You can manually edit the color in the map JSON. A UI will be available in the next version.
- There have been slight changes in the layout to accommodate the new icon browser,
- Fixed Dendron integration not working if notes are stored in their own folder.

### Regressions

- I've disabled opening the last viewed map on start, as there seems to be a problem with saving the user's edits. This will also happen, if you reload the window. Maps that are opened manually (like from the sidebar or command) do not have this problem.

## 0.4.1

- Broken settings files will be regenerated now.

## 0.4.0

- Added support for Dendron, which requires the Dendron extension to be installed.
- Added a 'Help' panel with information for general use and the Dendron integration.
- While Bootstrap icons could have been accessed before with HTML tags, there is now proper support for them. Use @(icon-name) to access the icons in text. By default, they use the blue color used in the interface. Options for customization are planned in future versions.
- When working with multiple workspaces, make sure that your Dendron workspace is the main active workspace, first in the order (otherwise the integration will fail for now.)

Other:

- Added tests for some functions.
- Added a tokenizer for parsing and replacing tokens in text.

## 0.3.0

- 'Create Map' now uses a file save dialog.
- Added a button to open maps more conveniently with a file open dialog.
- You can now limit how many recently opened maps are shown in the interactive-map.json.
- Added support for multi-root workspaces. Each workspace has its own settings file and entries in the activity bar.

Other:

- Added some missing documentation.
- Functions were adapted for multi-root workspaces.
- Icon now uses same color as the rest of the UI.

## 0.2.1

- The Activity Bar entry now has a button for creating new maps.
- Icons are now uniform.
- Added popup, text, panning and highlight support for the remaining layers.
- Editing circles should now correctly save their radius.
  
Other:

- HTML files were missing from source, they are copied to the out folder when running the pack command.
- Moved interfaces to their own folder.
- Sidebar panels now have general functions for panel creation.
- Added a class for patching outdated map files in case of breaking changes.

## 0.2.0

- Initial release.
- Ported to Typescript.
- Added activity bar entry for recently opened maps.
