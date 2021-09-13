
class Registry {

    //
    constructor() {
        this.global_file_list = []
        this.global_file_list_by = {}
        this.global_tracking_map = {}
    }

    set_global_file_list_refs(ref_big_list,ref_big_list_by) {
        this.global_file_list = ref_big_list
        this.global_file_list_by = ref_big_list_by
        this.update_tracking_map()
    }

    // Order a set of record by the time they were updated... (they must include a 'dates' structure field)
    sort_by_updated(results) {
        results = results.sort((a,b) => {
            if ( b.dates && a.dates ) {
                if ( b.dates.updated && a.dates.updated ) {
                    return(b.dates.updated - a.dates.updated)
                }
            }
            return 0
        })
        return results
    }
    
    // Order a set of record by the time they were created... (they must include a 'dates' structure field)
    sort_by_created(results) {
        results = results.sort((a,b) => {
            if ( b.dates && a.dates ) {
                if ( b.dates.created && a.dates.created ) {
                    return(b.dates.created - a.dates.created)
                }
            }
            return 0
        })
        return results
    }

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
        let c_results = this.sort_by_created(this.global_file_list)
        let u_results = this.sort_by_updated(this.global_file_list)
        //
        this.global_file_list_by["create_date"] = c_results.map((item,index)=> {
            item.entry = index + 1
            item.score = 1.0
            return(item)
        })
        //
        this.global_file_list_by["update_date"] = u_results.map((item,index)=> {
            item.entry = index + 1
            item.score = 1.0
            return(item)
        })
        //
        this.update_tracking_map()
    }


    from_all_files(orderby) {
        if ( orderby in this.global_file_list_by ) {
            return this.global_file_list_by[orderby]
        }
        return this.global_file_list_by["create_date"]
    }

    ///
    //
    add_just_one(f_obj,from_new) {
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
            this.global_file_list.unshift(f_obj)
            f_obj.entry = this.global_file_list.length
            f_obj.score = 1.0
            this.global_file_list_by["create_date"].unshift(f_obj)
            this.global_file_list_by["update_date"].unshift(f_obj)    
            this.attempt_join_searches(f_obj)
        } else {
            if ( f_obj._tracking ) {
                let o_stored = this.global_tracking_map[f_obj._tracking]
                if ( o_stored !== undefined ) {
                    Object.assign(o_stored,f_obj)
                } else {
                    let found = false
                    let n = this.global_file_list.length
                    for ( let i = 0; i < n; i++ ) {
                        if ( this.global_file_list[i]._tracking === f_obj._tracking ) {
                            let stored = this.global_file_list[i]
                            Object.assign(stored,f_obj)
                            found = true
                            break;
                        }
                    }
                    if ( !found ) {
                        this.global_file_list.push(f_obj)
                        f_obj.entry = this.global_file_list.length
                        f_obj.score = 1.0    
                        this.attempt_join_searches(f_obj)
                    }
                    this.global_tracking_map[f_obj._tracking] = f_obj
                }
                this.update_global_file_list_quotes_by()  // dates changed, do the whole things (later fix this)
            } else {
                this.global_file_list.push(f_obj)
                f_obj.entry = this.global_file_list.length
                f_obj.score = 1.0
                this.update_global_file_list_quotes_by()
                this.attempt_join_searches(f_obj)
            }
        }
    }


    remove_just_one(tracking) {
        delete this.global_tracking_map[tracking]
        //
        let n = this.global_file_list.length
        let remove_index = -1
        //
        let stored = false
        for ( let i = 0; i < n; i++ ) {     // ultra simple will be replaced....
            if ( this.global_file_list[i]._tracking === tracking ) {
                stored = this.global_file_list[i]
                stored._tracking = false
                stored._xxzz_removed = true
                remove_index = i
                break
            }
        }
        //
        if ( remove_index >= 0 ) {
            this.global_file_list.splice(remove_index,1)
        }
        //
        for ( let ky in this.global_file_list_by ) {
            let list = this.global_file_list_by[ky]
            for ( let i = 0; i < n; i++ ) {
                if ( list[i]._xxzz_removed ) {
                    remove_index = i
                    break
                }
            }
            if ( remove_index >= 0 ) {
                list.splice(remove_index,1)
            }
        }
        //
        if ( stored !== false ) {
            this.app_specific_file_removal(tracking,stored)
        }
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ----
    app_specific_file_removal(tracking,stored) {
        //
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ----
    attempt_join_searches(f_obj) {
        //
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
    

}



module.exports.Registry = Registry
