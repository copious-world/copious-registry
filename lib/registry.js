
const {XXHash32} = require('xxhash32-node-cmake') 



class SortedTables {

    constructor(conf) {}

    // ORDERING
    // Order a set of record by the time they were updated... (they must include a 'dates' structure field)
    sort_by_updated(iterable) {
        let results = []
        if ( Array.isArray(iterable) ) {
            results = iterable.sort((a,b) => {
                if ( b.dates && a.dates ) {
                    if ( b.dates.updated && a.dates.updated ) {
                        return(b.dates.updated - a.dates.updated)
                    }
                }
                return 0
            })    
        } else {
            try {
                let vals = iterable.values()
                return this.sort_by_updated(vals)
            } catch (e) {}
        }
        return results
    }


    // Order a set of record by the time they were created... (they must include a 'dates' structure field)
    sort_by_created(iterable) {
        let results = []
        if ( Array.isArray(iterable) ) {
            results = iterable.sort((a,b) => {
                if ( b.dates && a.dates ) {
                    if ( b.dates.created && a.dates.created ) {
                        return(b.dates.created - a.dates.created)
                    }
                }
                return 0
            })
        } else {
            try {
                let vals = iterable.values()
                return this.sort_by_created(vals)
            } catch (e) {}
        }
        return results
    }

    // Order a set of record by a monotonic score... (they must include a 'score' numeric field)
    sort_by_score(iterable) {   // <- an array
        let results = []
        if ( Array.isArray(iterable) ) {
            results = iterable.sort((a,b) => {
                return(b.score - a.score)
            })
        } else {
            try {
                let vals = iterable.values()
                return this.sort_by_score(vals)
            } catch (e) {}
        }
        return results
    }


    // Order a set of record by a field having monotonic properties... (they must include a 'field' numeric field)
    sort_by_field(iterable,field) {   // <- an array <-- a string for a field name having numeric type
        let results = []
        if ( Array.isArray(iterable) ) {
            results = iterable.sort((a,b) => {
                return(b[field] - a[field])
            })
        } else {
            try {
                let vals = iterable.values()
                return this.sort_by_score(vals)
            } catch (e) {}
        }
        return results
    }

    
    // Order a set of record by a monotonic score... (they must include a 'score' numeric field)
    sort_by_fn(iterable,func) {   // <- an array <-- to parameter func(store type,store type)
        let results = []
        if ( typeof func === 'function' ) {
            if ( Array.isArray(iterable) ) {
                results = iterable.sort(func)
            } else {
                try {
                    let vals = iterable.values()
                    return this.sort_by_fn(vals,func)
                } catch (e) {}
            }    
        }
        return results   // did not sort 
    }
    

    // END OF ORDERING
    
}

// FileLists
// If files are not arrays, they are objects that have a particular interface
// similar to Map and Set types from JavaScript
//
// !! Meant to be overridden...


class WrapArray extends Array {
    constructor() {
        super()
    }

    add(f_obj) {
        this.unshift(f_obj)
    }

    delete(tracking) {
        let index = this.findIndex((obj) => {
            return (obj._tracking === tracking)
        })
        if ( index >= 0 ) {
            this.splice(index,1)
        }
    }
}


class FileLists extends SortedTables {
    //
    constructor(conf) {
        super(conf)
        //
        this._class_file_list = []
        this.global_key_map = {}
        this._class_file_list_by = {}
        this.counter = 0        // just use a dumb counter for the id generator...
    }

    //
    set_lists(list_interface,field_map_interface) {
        this._class_file_list = list_interface
        this._class_file_list_by = field_map_interface
        for ( let ky in this._class_file_list_by ) {
            this._class_file_list_by[ky] = new WrapArray()
        }
    }

    set_hasher(hasher) {
        this.hasher = hasher
    }


    unique_id(f_obj) {      // the original was stopgap .. this is, too.
        let hash = this.hasher.hash(JSON.stringify(f_obj))
        return hash
    }

    values() {
        return this._class_file_list
    }

    sort(fn) {     // has to return an array object ... it may leave an internal representation sorted
        return this._class_file_list.sort(fn)
    }

    get(ky) {
        return this.global_key_map[ky]
    }


    add(ky,obj) {
        if ( obj === undefined ) {   // may pass a single parameter, an object with a special key, `_tracking`
            obj = ky
            ky = obj._tracking   /// default field implemented by class
        }
        this.global_key_map[ky] = obj
        this._class_file_list.push(obj)
    }

    add_array(source) {
        for ( let value of source ) {
            this.add(value)
        }
    }

    delete(ky) {
        delete this.global_key_map[ky]
        let i = this._class_file_list.findIndex(obj => {
            return obj._tracking === ky
        })
        if ( i >= 0 ) {
            this._class_file_list.splice(i,1)
        }
    }

    
    ordering_table() {
        return this._class_file_list_by
    }


    update_global_file_list_quotes_by(f_obj) {
        if ( Array.isArray(this._class_file_list) ) {
            //
            let c_results = this.sort_by_created(this._class_file_list)  // will return arrays
            let u_results = this.sort_by_updated(this._class_file_list)
            //
            this._class_file_list_by["create_date"] = c_results.map((item,index)=> {
                if ( item.score === undefined ) item.score = 1.0
                return(item)
            })
            //
            this._class_file_list_by["update_date"] = u_results.map((item,index)=> {
                if ( item.score === undefined ) item.score = 1.0
                return(item)
            })
            //
            for ( let ky in this._class_file_list_by ) {
                if ( (ky !== "create_date") && (ky !== "update_date") ) {
                    let f_results = this.sort_by_field(this._class_file_list,ky)
                    this._class_file_list_by[ky] = f_results.map((item,index)=> {
                        if ( item.score === undefined ) item.score = 1.0
                        return(item)
                    })    
                }
            }
            //
        } else {
            // implemented by descendants
            console.log("FileLists ... custom storage implemented in descendents for `update_global_file_list_quotes_by`")
        }
    }
}

/**
 * Registry
 * 
 * a store of objects 
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
        let seed = Math.floor(Math.random()*10000) + 17
        this.hasher = new XXHash32(seed)
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
     * @param {object|Array} ref_big_list   -- may be an array
     * @param {object} ref_big_list_by -- this is a map type of object
     */

    set_global_file_list_refs(ref_big_list,ref_big_list_by) {
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


    get_global_file_list() {
        return this.global_file_list
    }



    // -@- Registry
    //
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
    update_global_file_list_quotes_by(f_obj) {
        this.global_file_list.update_global_file_list_quotes_by(f_obj)
    }


    // -@- Registry
    from_all_files(orderby) {
        if ( orderby in this.global_file_list_by ) {
            return this.global_file_list_by[orderby]
        }
        return this.global_file_list_by["create_date"]   // default sorted by creation date
    }

    ///
    // -@- Registry
    //
    add_just_one(f_obj,from_new) {
        //
        let is_new = from_new == undefined ? false : from_new
        if ( f_obj.dates === undefined ) {
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
            this.global_file_list.add(f_obj)  // ---- ---- ---- ---- ---- ---- ----
            //
            this.attempt_join_searches(f_obj)   // JOIN SEARCHES 
            //
            if ( f_obj._tracking ) {
                this.global_tracking_map.set(tracking,f_obj)
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
                        this.global_file_list.add(f_obj)
                        if ( f_obj.score === undefined ) f_obj.score = 1.0
                    }
                    //
                    this.global_tracking_map.set(f_obj._tracking,f_obj)
                    o_stored = f_obj
                }
                // given updates, list should be out of sort... (this is very slow ... )  -- f_obj now passed for next implementation
                this.update_global_file_list_quotes_by(f_obj)  // dates changed, do the whole things (later fix this)
                //
                return o_stored
            } else {  // without tracking, it is not placed in the global tracking map
                if ( f_obj.score === undefined ) f_obj.score = 1.0
                //
                f_obj._x_entry = this.global_file_list.unique_id(f_obj)
                this.global_file_list.add(f_obj)  
                // ---- ---- ---- ---- ---- ---- ----
                // given updates, list should be out of sort... (this is very slow ... )  -- f_obj now passed for next implementation
                this.update_global_file_list_quotes_by(f_obj) // dates changed, do the whole things (later fix this)
                //
                this.attempt_join_searches(f_obj)
                return f_obj
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
        //
        this.global_tracking_map.delete(tracking)
        //
        let stored = this.global_file_list.get(tracking)
        stored._tracking = false        // assume that a ref is available in other contexts
        stored._xxzz_removed = true     // stored ... will be used by the application to remove the object from other stores...
        for ( let ky in this.global_file_list_by ) {
            let list = this.global_file_list_by[ky]
            list.delete(tracking)
        }
        this.global_file_list.delete(tracking)
        if ( stored !== false ) {
            this.app_specific_file_removal(tracking,stored)
        }
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ----

    // -@- Registry
    fetch_single(tracking) {
        if ( tracking ) {
            let obj = this.global_tracking_map.get(tracking)
            if ( obj ) return obj
        }
        return false
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ----

    // -@- Registry
    fetch_multiple(tracking_list) {
        let object_map = {}
        for ( let tracking of tracking_list ) {
            let obj = this.global_tracking_map.get(tracking)
            if ( obj ) {
                object_map[tracking] = obj
            }
        }
        object_map.count = Object.keys(object_map).length
        object_map.diff =  object_map.count - tracking_list.length
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

}



module.exports.Registry = Registry
module.exports.FileLists = FileLists        // export a template for apps to develop by

