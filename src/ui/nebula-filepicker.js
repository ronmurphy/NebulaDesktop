// Minimal shim for legacy NebulaFilePicker
// Forwards open() to the modern PickerApp when available, otherwise falls back
// to the native dialog exposed on window.nebula.dialog.openFile.
(function(){
    const shim = {
        open: async function(options = {}){
            if (window.PickerApp && typeof window.PickerApp.open === 'function') {
                try {
                    const res = await window.PickerApp.open(options || {});
                    return res;
                } catch(e){ console.warn('PickerApp.open failed', e); }
            }
            // fallback to native dialog
            if (window.nebula && window.nebula.dialog && typeof window.nebula.dialog.openFile === 'function') {
                try {
                    const out = await window.nebula.dialog.openFile(options || {});
                    if (out && out.filePaths) return out.filePaths.length? out.filePaths[0] : null;
                    if (Array.isArray(out) && out.length) return out[0];
                    if (typeof out === 'string') return out;
                } catch(e){ console.warn('native openFile failed', e); }
            }
            return null;
        }
    };
    window.NebulaFilePicker = shim;
})();
