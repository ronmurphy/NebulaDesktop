# FilePicker_TODO

This document lists TODOs, must-haves, and nice-to-have features for the Nebula in-app File Picker.

## Must have

- Consistent visual styling
  - Ensure all picker buttons use Nebula button classes (e.g., `toolbar-btn`) so they inherit app-wide styles.
  - Match focus outlines and spacing with Nebula design tokens.

- Reliable open/save API
  - `window.PickerApp.open(options)` should be the canonical API.
  - The pre-existing shim `window.nebula.dialog.openFile(options)` should forward to PickerApp by default and support `options.forceNative` to use the OS dialog.

- Close/cancel correctness
  - Picker must close and resolve exactly once. Avoid races where both PickerApp and native OS dialogs could be shown or resolved.

- Filters and extensions
  - Support `options.filters = [{ name: 'BASIC', extensions: ['bas'] }]` so callers can pre-filter by extension.
  - Provide a visible "All files" switch.

- Responsive layout
  - File area must adapt to available width: dynamic column count with `auto-fit` / `minmax()` for CSS grid.
  - Filenames should wrap/truncate to a reasonable number of lines (2) with ellipsis.

- Quick-access & bookmarks
  - Provide Home/Desktop/Documents/Downloads quick links.
  - Best-effort read GTK bookmarks (`~/.config/gtk-3.0/bookmarks`, `~/.config/gtk-4.0/bookmarks`) and show them in quick access column; optional for KDE (XDG-based locations).

## Nice to have

- Favorites / pinning
  - Allow users to pin favorite folders that persist in localStorage.

- Thumbnails & previews
  - Generate and cache thumbnails for images and show them in grid view.
  - Provide larger preview on right side for selected files.

- Additional file metadata
  - Show file size, modified time, type in list view.

- Accessibility
  - Add ARIA roles and keyboard focus order.
  - Improve focus outlines and ensure contrast.

- Virtualized rendering
  - For very large directories, implement windowed/virtualized rendering to avoid performance issues.

## Making the picker global

- Approach
  - Keep `PickerApp` as the canonical in-renderer app.
  - Provide `window.PickerApp.open()` as public API.
  - Keep the preload shim `window.nebula.dialog.openFile()` to forward to `PickerApp` by default; maintain `options.forceNative` to allow OS dialogs.
  - Optionally register a global event or command (e.g., `window.dispatchEvent(new CustomEvent('nebula:openFile', { detail: options }))`) so apps can call it without importing code.

- Backwards compatibility
  - Maintain `window.NebulaFilePicker.open()` as a thin shim that calls `PickerApp.open()`.

- Packaging
  - Ensure `src/apps/PickerApp.js` is loaded early in `index.html` so it's available to any app that may call it.

## Implementation notes

- Use `window.nebula.fs.*` APIs for reads and stats; handle errors gracefully.
- Persist small UI settings in `localStorage` (showHidden, favorites list).
- Keep GTK/KDE bookmark scanning non-blocking and optional; don't prevent the picker from opening.


