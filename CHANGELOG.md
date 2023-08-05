# Change Log

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
