// 
const path = require('path');
const {FileOperations} = require('extra-file-class')


/**
 * DirWatcherHandler
 * 
 * DirWatcherHandler is one kind of class that can add new items into the grand list of objects
 * that is used by Searching (for instance) or other descendents of Registry
 * 
 * This class sets up a directory watcher for a configured directory. When it the directoy gets a new file, 
 * this responds by adding the object. When the directory loses the file (by an app deleting the file),
 * this class removes the object. 
 * 
 * The way this class adds an object is to call `add_just_one`, which is a method of the element_manager
 * The way this class removes an object is to call remove_just_one, which is a method of the element_manager
 * 
 * Typically, the element_manager, set into this._el_manager, will be an instance of the Searching class (a descendant class instance).
 * 
 * This class is exemplary. Other classes of a similar nature may be implemented, using other forms of communication, such as subscriptiong 
 * to a topic, or as a client to an object producer service.
 * 
 * All such classes must implement processes that use an element_manager that makes available the methods `add_just_one` and `remove_just_one`.
 */


class DirWatcherHandler {

    constructor(directory,element_manager,conf) {
        //
        this._dir = directory
        this._el_manager = element_manager
        this._single_file_type = '.json'
        //
        // maps a group tracking number to a list of tracking numbers
        // This is not the global tracking map, which tracks individualt elements
        // Used in later serialization having made a record of which files are arrays
        //
        this._tracking_list_map = new Map()        // if the file is an array of meta objects, then map a single tracking number for the file to a list of all individual tracks in the file

        this.fos = new FileOperations(conf)
    }

    /**
     * track_list_id
     * 
     * checks to see if a name is a an ID for a tracklist by syntax
     * 
     * @param {string} name_id 
     * @returns boolean
     */
    track_list_id(name_id) {
        // should be application defined... here is a default
        const track_key = "TRACKLIST::"
        if ( (typeof name_id === "string") && (name_id.substring(track_key.length) === track_key) ) {
            return(true)
        } else {
            return(false)
        }
    }


    tracking_map() {
        return this._tracking_list_map
    }

    //
    //
    /**
     * start
     * 
     * Called on application startup. Sets up directory watching. 
     * Does not actually returnd except that it is a promise and yields to the rest of the thread.
     * 
     * Translates watch events to actions having to with loading and deleting files.
     * This gives local control to the maintenance process governing the assets (meta descriptors).
     * 
     * Does not directly interact with pub/sub operations.
     * 
    */
    async start() {
        try {
            const watcher = this.fos.watch(this._dir);      // WATCH THIS DIRECTORY
            if ( watcher !== false ) {
                for await (const event of watcher) {        // await events in the directory (async)
                    //
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
                    //
                }
            }
        } catch (err) {
            if ( err.name === 'AbortError' ) return;
            throw err;
        }
    }

    //
    /**
     * pass_filter
     * 
     * filter out the wrong files. There is just one type of file extension allowed, and OS based shadow files are ignored.
     * Many of the OS or application state files should be cleaned from directories by other processes.
     * 
     * @param {string} fname 
     * @returns boolean
     */
    pass_filter(fname) {
        if ( fname.substring(0,2) === '._' ) return(false)
        if ( path.extname(fname) !==  this._single_file_type ) return(false)
        return(true)
    }

    /**
     * read_and_injest
     * 
     * Read the file that has just been added to the directory...
     * 
     * @param {string} fpath 
     */
    async read_and_injest(fpath) {
        if ( fpath ) {
            let f_obj = await this.fos.load_json_data_at_path(fpath)
            if ( f_obj ) {
                this.add_just_one_new_asset(f_obj)
            }
        }
    }
    //


    /**
     * initial_array_to_tracking_map
     * 
     * for startup loading, handle array tracking and give the rest of the array back to the loader
     * 
     * @param {Array} ary 
     * @returns 
     */
    initial_array_to_tracking_map(ary) {
        let tracking = ary.shift()  // here is a convention... this is an id for the group...
        let new_tracks = []
        this._tracking_list_map.set(tracking,new_tracks)   // [tracking] = new_tracks
        for ( let fobj of ary ) {
            new_tracks.push(fobj._tracking)
        }
        return ary
    }

    //
    /**
     * add_just_one_new_asset
     * 
     * 
     * @param {object} f_obj 
     * @returns object | false - false if an object(s) cannot be added to the element manager
     */
    add_just_one_new_asset(f_obj) {
        if ( typeof f_obj !== 'object' ) return false
        if ( this._el_manager != false ) { // the purpose of this method is to put items into the search manager and possibly other types of managers
            try {
                if ( Array.isArray(f_obj) ) {
                    if ( this._el_manager ) {
                        let tracking = f_obj.shift()  // here is a convention... this is an id for the group...
                        let new_tracks = []
                        this._tracking_list_map.set(tracking,new_tracks)
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
    /**
     * remove_just_one_asset
     * 
     * Given all IDs can be assertained, call upon the element manager to remove an element from its operations.
     * 
     * @param {string} name_id 
     */
    remove_just_one_asset(name_id) {
        if ( this._el_manager ) {
            if ( this.track_list_id(name_id) ) {    // groups of objects have a special group ID with application defined syntax
                 // remove an array completely
                let tracks = this._tracking_list_map.get(name_id)
                if ( tracks ) {
                    this._tracking_list_map.delete(name_id)
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