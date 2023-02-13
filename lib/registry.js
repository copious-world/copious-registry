
const {XXHash32} = require('xxhash32-node-cmake') 

// FileLists
// If files are not arrays, they are objects that have a particular interface
// similar to Map and Set types from JavaScript
//
// !! Meant to be overridden...

class FileLists {
    //
    constructor(conf) {
        this.global_file_list = []
        this.global_key_map = {}
        this.global_file_list_by = {}
        this.counter = 0        // just use a dumb counter for the id generator...
    }

    //
    set_lists(list_interface,field_map_interface) {
        this.global_file_list = list_interface
        this.global_file_list_by = field_map_interface
        for ( let ky in this.global_file_list_by ) {
            this.global_file_list_by[ky] = new FileLists(conf)
        }
    }

    unique_id(obj) {
        return this.counter++
    }

    values() {
        return this.global_file_list
    }

    sort(fn) {     // has to return an array object ... it may leave an internal representation sorted
        return this.global_file_list.sort(fn)
    }

    get(ky) {
        return this.global_key_map[ky]
    }


    add(ky,obj) {
        if ( obj === undefined ) {
            obj = ky
            ky = obj._tracking   /// default field implemented by class
        }
        this.global_key_map[ky] = obj
        this.global_file_list.push(obj)
    }

    delete(ky) {
        delete this.global_key_map[ky]
        let i = this.global_file_list.findIndex(obj => {
            return obj._tracking === ky
        })
        if ( i >= 0 ) {
            this.global_file_list.splice(i,1)
        }
    }

    
    ordering_table() {
        return this.global_file_list_by
    }

    update_global_file_list_quotes_by() {
        // implemented by descendants
    }
}


// Registry
//      a store of objects 
class Registry {

    //
    constructor(conf) {
        this.conf = conf
        this.global_file_list = []      // default data type
        //
        this.global_file_list_by = {}
        this.global_tracking_map = {}
        //
        this._FileListsClass = FileLists
        if ( conf.file_list_class !== undefined ) {
            if ( typeof conf.file_list_class === 'string' ) {
                this._FileListsClass = require(this._FileListsClass)
            } else {
                this._FileListsClass = conf.file_list_class // this may fail... 
            }
        }

        let seed = Math.floor(Math.random()*10000) + 17
        this.hasher = new XXHash32(seed)
    }


    unique_id(f_obj) {      // the original was stopgap .. this is, too.
        let hash = this.hasher.hash(JSON.stringify(f_obj))
        return hash
    }

    set_global_file_list_refs(ref_big_list,ref_big_list_by) {
        if ( Array.isArray(ref_big_list) ) {
            this.global_file_list = ref_big_list
        } else {
            try {
                this.global_file_list = new this._FileListsClass(ref_big_list,ref_big_list_by)
                this.global_file_list_by = this.global_file_list.ordering_table()  // return an object    
            } catch (e) {
                console.log(e)
                console.log("rever to default classes ... unpredictable behavior ahead")
                this.global_file_list = new FileLists(ref_big_list,ref_big_list_by)
                this.global_file_list_by = this.global_file_list.ordering_table()  // return an object    
            }
        }
        if ( ref_big_list_by.constructor.name === 'object' ) {
            this.global_file_list_by = ref_big_list_by
        } else {
            this.global_file_list_by = {} // ????
        }
        this.update_tracking_map()
    }


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
    

    //
    update_tracking_map() {
        for ( let obj of this.global_file_list ) {
            let tracking = obj._tracking
            if ( tracking !== false ) {
                this.global_tracking_map[tracking] = obj
            }
        }
    }

    update_global_file_list_quotes_by() {
        //
        if ( Array.isArray(this.global_file_list) ) {
            let c_results = this.sort_by_created(this.global_file_list)  // will return arrays
            let u_results = this.sort_by_updated(this.global_file_list)
            //
            this.global_file_list_by["create_date"] = c_results.map((item,index)=> {
                // item._x_entry = index + 1  // now assume that the entry is a unique id
                if ( item.score === undefined ) item.score = 1.0
                return(item)
            })
            //
            this.global_file_list_by["update_date"] = u_results.map((item,index)=> {
                // item._x_entry = index + 1
                if ( item.score === undefined ) item.score = 1.0
                return(item)
            })

            for ( let ky in this.global_file_list_by ) {
                let f_results = this.sort_by_field(this.global_file_list,ky)
                this.global_file_list_by[ky] = f_results.map((item,index)=> {
                    // item._x_entry = index + 1  // now assume that the entry is a unique id
                    if ( item.score === undefined ) item.score = 1.0
                    return(item)
                })    
            }
        } else {
            this.global_file_list.update_global_file_list_quotes_by()
        }
        //
        this.update_tracking_map()
    }


    from_all_files(orderby) {
        if ( orderby in this.global_file_list_by ) {
            return this.global_file_list_by[orderby]
        }
        return this.global_file_list_by["create_date"]   // default sorted by creation date
    }

    ///
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
            if ( Array.isArray(this.global_file_list) ) {
                this.global_file_list.unshift(f_obj)
                f_obj._x_entry = this.unique_id(f_obj)
                if ( f_obj.score === undefined ) f_obj.score = 1.0
                this.global_file_list_by["create_date"].unshift(f_obj)  // make the same assumption about storage as for global_file_list
                this.global_file_list_by["update_date"].unshift(f_obj)    
            } else {
                if ( f_obj.score === undefined ) f_obj.score = 1.0
                f_obj._x_entry = this.global_file_list.unique_id(f_obj)
                this.global_file_list_by["create_date"].add(f_obj)
                this.global_file_list_by["update_date"].add(f_obj)
                this.global_file_list.add(f_obj)  // ---- ---- ---- ---- ---- ---- ----
            }
            //
            this.attempt_join_searches(f_obj)
            if ( f_obj._tracking ) {
                this.global_tracking_map[tracking] = f_obj
            }
            return f_obj
        } else {        // requiring the application to specifically state it is puting in something new.
            if ( f_obj._tracking ) {
                let o_stored = this.global_tracking_map[f_obj._tracking]
                if ( o_stored !== undefined ) {
                    Object.assign(o_stored,f_obj)
                } else {
                    if ( Array.isArray(this.global_file_list) ) {
                        let found = false
                        for ( let stored of this.global_file_list ) {
                            if ( stored._tracking === f_obj._tracking ) {
                                Object.assign(stored,f_obj)
                                found = true
                                break;
                            }
                        }
                        if ( !found ) {
                            this.global_file_list.push(f_obj)
                            f_obj._x_entry = this.unique_id(f_obj)
                            if ( f_obj.score === undefined ) f_obj.score = 1.0    
                            this.attempt_join_searches(f_obj)
                        }
                    } else {
                        let stored = this.global_file_list.get(f_obj._tracking)
                        if ( stored ) {
                            Object.assign(stored,f_obj)  // just overwrite the object
                        } else {
                            this.global_file_list.add(f_obj)
                            if ( f_obj.score === undefined ) f_obj.score = 1.0
                        }
                    }
                    //
                    this.global_tracking_map[f_obj._tracking] = f_obj
                    o_stored = f_obj
                }
                this.update_global_file_list_quotes_by()  // dates changed, do the whole things (later fix this)
                return o_stored
            } else {  // without tracking, it is not placed in the global tracking map
                if ( f_obj.score === undefined ) f_obj.score = 1.0
                if ( Array.isArray(f_obj) ) {
                    this.global_file_list.push(f_obj)
                    f_obj._x_entry = this.unique_id()
                } else {
                    f_obj.global_file_list._x_entry = this.unique_id()
                }
                this.update_global_file_list_quotes_by()
                this.attempt_join_searches(f_obj)
                return f_obj
            }
        }
    }


    remove_just_one(tracking) {
        //
        delete this.global_tracking_map[tracking]
        //
        let remove_index = -1
        //
        let stored = false
        let i = 0;
        if ( Array.isArray(this.global_file_list) ) {
            //
            for ( let obj of this.global_file_list ) {     // ultra simple will be replaced....
                if ( obj._tracking === tracking ) {
                    stored = obj
                    stored._tracking = false
                    stored._xxzz_removed = true
                    remove_index = i
                    break
                }
                i++
            }
            //
            if ( remove_index >= 0 ) {
                this.global_file_list.splice(remove_index,1)
            }
            //
            for ( let ky in this.global_file_list_by ) {
                let list = this.global_file_list_by[ky]
                let i = 0;
                for ( let stored of list ) {
                    if ( stored._xxzz_removed ) {
                        remove_index = i
                        break
                    }
                    i++
                }
                if ( remove_index >= 0 ) {
                    list.splice(remove_index,1)
                }
            }    
        } else {
            //
            stored = this.global_file_list.get(tracking)
            stored._tracking = false        // assume that a ref is available in other contexts
            stored._xxzz_removed = true     // stored ... will be used by the application to remove the object from other stores...
            for ( let ky in this.global_file_list_by ) {
                let list = this.global_file_list_by[ky]
                list.delete(tracking)
            }
            this.global_file_list.delete(tracking)
        }
        //
        if ( stored !== false ) {
            this.app_specific_file_removal(tracking,stored)
        }
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ----
    fetch_single(tracking) {
        if ( tracking ) {
            let obj = this.global_tracking_map[tracking]
            if ( obj ) return obj
        }
        return false
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ----
    fetch_multiple(tracking_list) {
        let object_map = {}
        for ( let tracking of tracking_list ) {
            let obj = this.global_tracking_map[tracking]
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
    app_specific_file_removal(tracking,stored) {

        //
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ----
    // attempt_join_searches
    //
    attempt_join_searches(f_obj) {
        //  implemented in descendants
    }

}



module.exports.Registry = Registry
module.exports.FileLists = FileLists        // export a template for apps to develop by

