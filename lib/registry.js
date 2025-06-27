
const FileLists = require('./file_list')


/**
 * Registry
 * 
 * a store of objects
 * 
 * 
 * 
 */

class Registry {

    //
    constructor(conf) {
        this.conf = conf
        //
        this.global_file_list = []      // default data type  -- this is an index stored in memory 
        //
        this.global_file_list_by = {}           // this is an index stored in memory
        this.global_tracking_map = new Map()
        //
        this._FileListsClass = FileLists
        if ( conf.file_list_class !== undefined ) {
            if ( typeof conf.file_list_class === 'string' ) {
                this._FileListsClass = require(this._FileListsClass)
            } else {
                this._FileListsClass = conf.file_list_class // this may fail... 
            }
        }
        //
        //
        let apiKeys = false
        apiKeys = conf.apiKeys ? conf.apiKeys : apiKeys
        let xxHash32Class = false
        let seeder = 0
        if ( conf.xxhash === "cmake" ) {
            const {XXHash32} = require('xxhash32-node-cmake')
            xxHash32Class = XXHash32
        } else {
            const { XXHash32 } = require('xxhash-addon');
            xxHash32Class = XXHash32
            if ( apiKeys && apiKeys.hash_seed && Array.isArray(apiKeys.hash_seed) && (apiKeys.hash_seed.length === 4) ) {
                seeder = Buffer.from(apiKeys.hash_seed)
            } else {
                seeder = Buffer.from([0, 0, 0, 0])
            }
        }
        //
        let seed = (apiKeys && apiKeys.hash_seed) ? apiKeys.hash_seed : seeder        // Math.floor(Math.random()*10000) + 17
        this.hasher = new xxHash32Class(seed)

        this.registry_waiting = false
        //
        this.set_global_file_list_refs(this.global_file_list,this.global_file_list_by)
    }



    // -@- Registry
    /**
    /**
     * set_hasher
     * 
     * An application may choose a different hash function
     * 
     * @param {Function} hasher 
     */
    set_hasher(hasher) {
        if ( typeof hasher === 'function' ) {
            this.hasher = hasher
        }
    }

    // -@- Registry
    /**
     * unique_id
     * @param {object} f_obj 
     * @returns string - a hash of the stringified object
     */

    unique_id(f_obj) {      // the original was stopgap .. this is, too.
        let hash = this.hasher.hash(JSON.stringify(f_obj))
        return hash
    }


    // -@- Registry
    /**
     * set_global_tracking_map
     * @param {*} map_type_object 
     */
    set_global_tracking_map(map_type_object) {
        this.global_tracking_map = map_type_object
    }

    /**
     * get_global_tracking_map
     * 
     * The tracking map 
     * 
     * @returns object
     */
    get_global_tracking_map() {
        return this.global_tracking_map
    }

    // -@- Registry
    /**
     * swap_out_tracking_storage
     * 
     * Swapping out storage is invasive, causes the server to pause.
     * This provided to allow some maintenance without shutdown (problems noted)
     * 
     * @param {object} new_storage_instance 
     */
    swap_out_tracking_storage(new_storage_instance) {
        //
        let current_map = this.global_tracking_map
        if ( (typeof new_storage_instance === 'object') && (new_storage_instance.constructor.name === 'object') ) {
            for ( let [key,value] of current_map.entries() ) {
                new_storage_instance[key] = value
            }    
        } else {
            for ( let [key,value] of current_map.entries() ) {
                new_storage_instance.add(key,value)
            }    
        }
        this.global_tracking_map = new_storage_instance
        current_map = null
        //
    }



    // -@- Registry
    /**
     * swap_out_global_file_list
     * 
     * Swapping out storage is invasive, causes the server to pause.
     * This provided to allow some maintenance without shutdown (problems noted)
     * 
     * @param {object} new_storage_instance 
     */
    swap_out_global_file_list(new_storage_instance) {
        //
        let current_list = this.global_tracking_map
        if ( Array.isArray(new_storage_instance) && Array.isArray(current_list) ) {
            new_storage_instance = new_storage_instance.concat(current_list)
        } else if ( Array.isArray(new_storage_instance) && !(Array.isArray(current_list)) ) {
            new_storage_instance = new_storage_instance.concat(current_list.values())
        } else if ( !(Array.isArray(new_storage_instance)) && Array.isArray(current_list) ) {
            new_storage_instance.add_array(current_list)
        } else if ( !(Array.isArray(new_storage_instance)) && !(Array.isArray(current_list)) ) {
             let value_list = current_list.values()
             new_storage_instance.add_array(value_list)
        }
        //
        this.global_tracking_map = new_storage_instance
        current_map = null
        //
    }



    // -@- Registry
    /**
     * set_global_file_list_refs
     * 
     * The method should be called by the application
     * 
     * @param {object|Array} ref_big_list   -- may be an array
     * @param {object} ref_big_list_by -- this is a map type of object
     */

    set_global_file_list_refs(ref_big_list,ref_big_list_by) {
        if ( ref_big_list_by["create_date"] === undefined ) {
            ref_big_list_by["create_date"] = true
        }
        if ( ref_big_list_by["update_date"] === undefined ) {
            ref_big_list_by["update_date"] = true
        }
        if ( Array.isArray(ref_big_list) ) {
            this.global_file_list = new FileLists()  // 
            this.global_file_list.set_lists(ref_big_list,ref_big_list_by)
            this.global_file_list_by = this.global_file_list.ordering_table()  // return an object
            this.global_file_list.set_hasher(this.hasher)
        } else {
            try {
                this.global_file_list = new this._FileListsClass(ref_big_list,ref_big_list_by)
                this.global_file_list_by = this.global_file_list.ordering_table()  // return an object    
                this.global_file_list.set_hasher(this.hasher)
            } catch (e) {
                console.log(e)
                console.log("rever to default classes ... unpredictable behavior ahead")
                this.global_file_list = new FileLists(ref_big_list,ref_big_list_by)
                this.global_file_list_by = this.global_file_list.ordering_table()  // return an object    
                this.global_file_list.set_hasher(this.hasher)
            }
        }
        this.update_tracking_map()
    }


    /**
     * get_global_file_list
     * 
     * @returns object - type this._FileListsClass (defualt = FileLists)
     */
    get_global_file_list() {
        return this.global_file_list
    }



    // -@- Registry
    //
    /**
     * update_tracking_map
     * 
     * this.global_tracking_map - maps tracking number to objects (type asset meta)
     */
    update_tracking_map() {
        for ( let obj of this.global_file_list.values() ) {
            let tracking = obj._tracking
            if ( tracking !== false ) {
                this.global_tracking_map.set(tracking,obj)
            }
        }
    }



    // ORDERING
    // -@- Registry
    // Order a set of record by the time they were updated... (they must include a 'dates' structure field)
    sort_by_updated(iterable) {
        return this.global_file_list.sort_by_updated(iterable)
    }


    // Order a set of record by the time they were created... (they must include a 'dates' structure field)
    sort_by_created(iterable) {
        return this.global_file_list.sort_by_created(iterable)
    }

    // Order a set of record by a monotonic score... (they must include a 'score' numeric field)
    sort_by_score(iterable) {   // <- an array
        return this.global_file_list.sort_by_score(iterable)
    }


    // Order a set of record by a field having monotonic properties... (they must include a 'field' numeric field)
    sort_by_field(iterable,field) {   // <- an array <-- a string for a field name having numeric type
        return this.global_file_list.sort_by_field(iterable,field)
    }

    
    // Order a set of record by a monotonic score... (they must include a 'score' numeric field)
    sort_by_fn(iterable,func) {   // <- an array <-- to parameter func(store type,store type)
        return this.global_file_list.sort_by_fn(iterable,func)
    }
    

    // END OF ORDERING
    

    // -@- Registry
    /**
     * update_global_file_list_quotes_by
     * 
     * @param {object} f_obj -- passed in for handling single entry updates
     * 
     */
    update_global_file_list_quotes_by() {
        this.global_file_list.update_global_file_list_quotes_by()
    }


    // -@- Registry
    /**
     * from_all_files
     * 
     * 
     * 
     * @param {string} orderby 
     * @returns Array
     */
    from_all_files(orderby) {
        if ( orderby in this.global_file_list_by ) {
            return this.global_file_list_by[orderby]
        }
        return this.global_file_list_by["create_date"]   // default sorted by creation date
    }

    ///
    // -@- Registry
    //
    /**
     * add_just_one
     * 
     * Add an object describing an asset (this should have a tracking number)
     * 
     * If the object is new the `_x_entry` field will be set with a unique id (using the application hashing function).
     * The object is added to file lists and any ongoing searches that it may satisfy.
     * The object can only be tracked by the global tracking map if it has a filed `_tracking`.
     * 
     * If the object is not new according to the caller and if the object does not have `_tracking`, then 
     * the object will be treated as new. (A recursive call is made with the `from_new` parameter set to true)
     * 
     * Givent the object has a `_tracking` field, there is a possibility that it is already stored.
     * If the object can be found, then it is updated by overwriting fields of the stored object.
     * 
     * If it cannot be found, the method checks to see if the object is stored in the list and has been omitted 
     * from the tracking map. If it is no stored, the object is treated as new.
     * 
     * Finally, the object is reinsterted into the global tracking map.
     * 
     * @param {object} f_obj -- the object to be added
     * @param {boolean} from_new -- if the application can tell use this is new
     * @returns 
     */
    add_just_one(f_obj,from_new) {
        //
        while ( this.registry_waiting ) {
            let self = this
            this.setTimeout(() => {
                self.add_just_one(f_obj,from_new)
            }, 60);
        }
        //
        let is_new = from_new == undefined ? false : from_new
        if ( f_obj.dates === undefined ) {  // object have to have dates to be sorted
            is_new = true
            f_obj.dates = {
                "created" : Date.now(),
                "updated" : Date.now()
            }
        }
        // 
        if ( is_new ) {
            // don't forget the storage class makes its own id
            f_obj._x_entry = this.global_file_list.unique_id(f_obj)
            //
            if ( f_obj.score === undefined ) f_obj.score = 1.0
            this.global_file_list_by["create_date"].add(f_obj)      // assume the custom containers work out sorting
            this.global_file_list_by["update_date"].add(f_obj)
            this.global_file_list.set(f_obj)  // ---- ---- ---- ---- ---- ---- ----
            //
            this.attempt_join_searches(f_obj)   // JOIN SEARCHES 
            //
            if ( f_obj._tracking ) {
                this.global_tracking_map.set(f_obj._tracking,f_obj)
            }
            return f_obj
        } else {        // requiring the application to specifically state it is puting in something new.
            if ( f_obj._tracking ) {  // should be able to find it
                //
                let o_stored = this.global_tracking_map.get(f_obj._tracking)  // an UPDATE... can be tracked
                if ( o_stored !== undefined ) {     // o_stored is a referenc
                    Object.assign(o_stored,f_obj)   // update the fields ... the same reference is in the global lists
                } else { 
                    // Has yet to be tracked or no tracking assigned.
                    // check to see if this is default storage... (small operations)
                    let stored = this.global_file_list.get(f_obj._tracking)
                    if ( stored ) {
                        Object.assign(stored,f_obj)  // just overwrite the object
                    } else {
                        return this.add_just_one(f_obj,true)
                    }
                    //
                    this.global_tracking_map.set(f_obj._tracking,f_obj)
                    o_stored = f_obj
                }
                // given updates, list should be out of sort... (this is very slow ... )  -- f_obj now passed for next implementation
                this.update_global_file_list_quotes_by()  // dates changed, do the whole things (later fix this)
                //
                return o_stored
            } else {  // without tracking, it is not placed in the global tracking map
                return this.add_just_one(f_obj,true)
            }
        }
    }


    // -@- Registry
    /**
     * remove_just_one
     * 
     * @param {object} tracking 
     */
    remove_just_one(tracking) {
        while ( this.registry_waiting ) {
            let self = this
            this.setTimeout(() => {
                self.remove_just_one(tracking)
            }, 60);
        }
        //
        this.global_tracking_map.delete(tracking)
        //
        let stored = this.global_file_list.get(tracking)
        for ( let ky in this.global_file_list_by ) {
            let list = this.global_file_list_by[ky]
            list.delete(tracking)
        }
        this.global_file_list.delete(tracking)
        if ( stored !== false ) {
            this.app_specific_file_removal(tracking,stored)
        }

        stored._xxzz_removed = true     // stored ... will be used by the application to remove the object from other stores...
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ----

    // -@- Registry
    /**
     * fetch_single
     * 
     * @param {string} tracking 
     * @returns object | false
     */
    fetch_single(tracking) {
        if ( tracking ) {
            let obj = this.global_tracking_map.get(tracking)
            if ( obj ) return obj
        }
        return false
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ----

    // -@- Registry
    /**
     * fetch_multiple
     * 
     * Finds all objcts tracked by tracking numbers in the `tracking_list` parameter
     * 
     * @param {*} tracking_list 
     * @returns object
     */
    fetch_multiple(tracking_list) {
        let object_map = {}
        for ( let tracking of tracking_list ) {
            let obj = this.global_tracking_map.get(tracking)
            if ( obj ) {
                object_map[tracking] = obj
            }
        }
        object_map.count = Object.keys(object_map).length
        object_map.diff =  object_map.count - tracking_list.length  // number without identified tracking that were requested
        if ( object_map.count ) {
            return object_map
        }
        return false
    }
    

    // ---- ---- ---- ---- ---- ---- ---- ---- ----
    // app_specific_file_removal
    //
    // -@- Registry
    app_specific_file_removal(tracking,stored) {
        //
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ----
    // attempt_join_searches
    //
    // -@- Registry
    attempt_join_searches(f_obj) {
        //  implemented in descendants
    }


    registry_waits() {
        this.registry_waiting = true
    }


    registry_runs() {
        this.registry_waiting = false
    }

}



module.exports.Registry = Registry
module.exports.FileLists = FileLists        // export a template for apps to develop by

