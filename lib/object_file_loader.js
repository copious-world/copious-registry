const {DirectoryCache} = require('extra-file-class')

// Purpose: This is for initalization of the total list of all objects used by the Searching class (and may be used to reload the list).
//
// ObjFileDirLoader loads existing directories of meta data objects.
// It is left up to the application to call upon it and to make it available.
//
// When the ObjFileDirLoader impementation is constructed, a reference to a shared lists (shared among lib objecst)
// is past. This list if filled with object that are found in the configured directory.
// 
// The application makes the external data structures available and expects the loader, load_directory.  to 
// put objects from the directory into the list.
//
// The only extra functionality other than reading a directory is that each file, always in JSON format, may contain a single object
// or it may be an array of objects. The injector will add objects of the array to the list _list (externally constructed) or it will
// be adding a single object to the list. 


function default_file_namer(object) {
    if ( object._tracking ) return `${object._tracking}.json`
    return `${Date.now()}.json`
}

class ObjFileDirLoader {
    //
    constructor(dirpath,list_ref,after_loaded_action,conf) {
        this._dir = dirpath
        this._list = list_ref
        this.dir_fos = new DirectoryCache({
            "default_directory" : dirpath,
            "noisy"  : (conf && conf.noisy_files) ? true : false,
            "crash_cant_load" : (conf && conf.crash_program_on_failing_load_from_cache) ? true : false,
            "use_caching" : false,
            "backup_interval" : (conf && conf.backup_interval) ? conf.backup_interval : false,
            "object_list" : this._list,
            "file_namer" : (conf && conf.file_namer && (typeof conf.file_namer === 'function') ) ?  conf.file_namer : default_file_namer
        })
        this.fos = this.dir_fos.get_fos()
        this._after_action = after_loaded_action
    }

    // -- item_injector
    // --       push onto a shared list...

    item_injector(obj) {
        if ( Array.isArray(obj) ) {
            for ( let fobj of obj ) {
                this.item_injector(fobj)
            }
        } else {
            if ( Array.isArray(this._list) ) {
                this._list.push(obj)
            } else {
                try {
                    this._list.add(obj)
                } catch (e) {
                }
            }
        }
    }

    // -- load_directory
    // --       load all items in from a directory...

    async load_directory() {
        await this.dir_fos.load_directory('',this.item_injector,this._dir,this._after_action)
    }
    
    // -- backup_to_directory
    // --       save objects to the backup dir.

    async backup_to_directory() {
        let file_namer = (obj) => {
            return `${obj._tracking}.json`
        }
        await this.dir_fos.backup_to_directory(file_namer,this._dir,this._list)
    }

    async save(data_obj) {
        let fpath = `${data_obj._tracking}.json`
        await this.fos.output_json(fpath,obj,{},this._dir)
    }

    async remove(tracking) {
        let fpath = `${this._dir}/${tracking}.json`
        await this.fos.file_remover(fpath)
    }
}

module.exports = ObjFileDirLoader
