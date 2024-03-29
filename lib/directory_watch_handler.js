// 
const path = require('path');
const {FileOperations} = require('extra-file-class')


// DirWatcherHandler
//
// DirWatcherHandler is one kind of class that can add new items into the grand list of object
// that is used by Searching.  
//
// This class sets up a directory watcher for a configured directory. When it the directoy gets a new file, 
// this responds by adding the object. When the directory loses the file (by an app deleting the file),
// this class removes the object. 
//
// The way this class adds an object is to call add_just_one, which is a method of the element_manager
// The way this class removes an object is to call remove_just_one, which is a method of the element_manager
//
// Typically, the element_manager, set into this._el_manager, will be an instance of the Searching class (a descendant class instance).
//
// This class is exemplary. Other classes of a similar nature may be implemented, using other forms of communication, such as subscriptiong 
// to a topic, or as a client to an object producer service.
//
// All such classes must implement processes that use an element_manager that makes available the methods add_just_one and remove_just_one.
//


class DirWatcherHandler {

    constructor(directory,element_manager,conf) {
        //
        this._dir = directory
        this._el_manager = element_manager
        this._single_file_type = '.json'
        //
        this._tracking_list_map = {}

        this.fos = new FileOperations(conf)
    }

    track_list_id(name_id) {
        // should be application defined... here is a default
        const track_key = "TRACKLIST::"
        if ( (typeof name_id === "string") && (name_id.substring(track_key.length) === track_key) ) {
            return(true)
        } else {
            return(false)
        }
    }

    //
    //
    async start() {
        try {
            const watcher = this.fos.watch(this._dir);
            if ( watcher !== false ) {
                for await (const event of watcher) {
                    let {eventType,filename} = event
                    let fname = filename.trim()
                    if ( !(this.pass_filter(fname)) ) {
                        continue; // don't do anything
                    }
                    //
                    let fpath = this._dir + '/' + fname
                    //
                    if ( eventType === 'change' ) {
                        await this.read_and_injest(fpath)
                    } else if ( eventType === 'rename' ) {
                        try {
                            await this.read_and_injest(fpath)
                            continue
                        } catch (e) {
                        }
                        this.remove_just_one_asset(fname)
                    }
                }
            }
        } catch (err) {
            if (err.name === 'AbortError')
                return;
            throw err;
        }
    }

    //
    pass_filter(fname) {
        if ( fname.substr(0,2) === '._' ) return(false)
        if ( path.extname(fname) !==  this._single_file_type ) return(false)
        return(true)
    }

    async read_and_injest(fpath) {
        if ( fpath ) {
            let f_obj = await this.fos.load_json_data_at_path(fpath)
            if ( f_obj ) {
                this.add_just_one_new_asset(f_obj)
            }
        }
    }
    //

    //
    add_just_one_new_asset(f_obj) {
        if ( typeof f_obj !== 'object' ) return false
        if ( this._el_manager != false ) {
            try {
                if ( Array.isArray(f_obj) ) {
                    if ( this._el_manager ) {
                        let tracking = f_obj.shift()  // here is a convention... this is an id for the group...
                        let new_tracks = []
                        this._tracking_list_map[tracking] = new_tracks
                        for ( let fobj of f_obj ) {
                            this._el_manager.add_just_one(fobj)
                            new_tracks.push(fobj._tracking)
                        }
                    }
                } else {
                    if ( this._el_manager ) this._el_manager.add_just_one(f_obj)
                }
                return(f_obj)
            } catch (e) {
                console.log(e)
                return(false)
            }
        } else {
            console.log(`not adding data ${data}`)
            return(false)
        }
    }

    //
    remove_just_one_asset(name_id) {
        if ( this._el_manager ) {
            if ( this.track_list_id(name_id) ) {  // remove an array completely
                let tracks = this._tracking_list_map[name_id]
                if ( tracks ) {
                    delete this._tracking_list_map[name_id]
                    for ( let track of tracks ) {
                        this._el_manager.remove_just_one(track)
                    }
                }
            } else {
                this._el_manager.remove_just_one(name_id)
            }
        }
    }
}


module.exports = DirWatcherHandler