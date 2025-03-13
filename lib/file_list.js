

const SortedTables = require('./sort_tables')

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



/**
 * FileLists
 * 
 * This the default storage class for the registry
 * 
 */
class FileLists extends SortedTables {

    //
    constructor(conf) {
        super(conf)
        //
        // Data storage proper
        this._class_file_list = []
        this._global_key_map = {}        // Maps the main key `_tracking` to the object. 
        //
        // sorted versions of
        this._class_file_list_by = {}
        this.counter = 0        // just use a dumb counter for the id generator...
    }

    /**
     * set_lists
     * @param {*} list_interface 
     * @param {*} field_map_interface 
     */
    set_lists(list_interface,field_map_interface) {
        this._class_file_list = list_interface
        this._class_file_list_by = field_map_interface
        for ( let ky in this._class_file_list_by ) {
            this._class_file_list_by[ky] = new WrapArray()
        }
    }

    // -@- FileLists
    /**
     * set_hasher
     * 
     * The FileList class does not initialize or declare its own hasher.
     * 
     * @param {Function} hasher 
     */
    set_hasher(hasher) {
        if ( typeof hasher === 'object' ) {
            this.hasher = hasher
        }
    }

    /**
     * unique_id
     * @param {object} f_obj 
     * @returns number - the hash number of the stringification of the object
     */
    unique_id(f_obj) {      // the original was stopgap .. this is, too.
        let hash = this.hasher.hash(JSON.stringify(f_obj))
        return hash
    }


    /**
     * values
     * 
     * These are all the values collected into the FileList object at any point in time.
     * In the Registry, the ongoing collection of records is handled by *ServiceEntryWatcher*
     * 
     * @returns Array
     */
    values() {
        return this._class_file_list
    }

    /**
     * keys
     * 
     * Similar to the keys method of a Map object. Reads the file list and returns the values of the `_tracking` field.
     * 
     * @returns Array
     */
    keys() {
        return Object.keys(this._global_key_map)
    }

    /**
     * sort
     * 
     * calls the array sort on _class_file_list
     * Again, this is default behavior. Other implementations of a FileLists class might use other storage types.
     * 
     * @param {Function} fn 
     * @returns Array - sorted instance of `_class_file_list`
     */
    sort(fn) {     // has to return an array object ... it may leave an internal representation sorted
        return this._class_file_list.sort(fn)
    }


    /**
     * get
     * 
     * `ky` should be a `_tracking` number.
     * 
     * @param {string} ky 
     * @returns object | undefined
     */
    get(ky) {
        return this._global_key_map[ky]
    }


    /**
     * add
     * @param {string} ky 
     * @param {object} obj 
     */
    add(ky,obj) {
        if ( obj === undefined ) {   // may pass a single parameter, an object with a special key, `_tracking`
            obj = ky
            ky = obj._tracking   /// default field implemented by class
        }
        this._global_key_map[ky] = obj
        this._class_file_list.push(obj)
    }

    set(ky,obj) {
        this.add(ky,obj)
    }

    /**
     * add_array
     * 
     * @param {Iterable} source 
     */
    add_array(source) {
        for ( let value of source ) {
            this.add(value)
        }
    }

    /**
     * delete
     * 
     * @param {string} ky 
     */
    delete(ky) {
        delete this._global_key_map[ky]
        let i = this._class_file_list.findIndex(obj => {
            return obj._tracking === ky
        })
        if ( i >= 0 ) {
            this._class_file_list.splice(i,1)
        }
    }

    /**
     * ordering_table
     * 
     * The standard JavaScript object whose keys indicate a sorting order or field in the data used for sorting
     * 
     * @returns object
     */
    ordering_table() {
        return this._class_file_list_by
    }


    /**
     * filter
     * 
     * Must return an array 
     * 
     * @param {Function} test_fn 
     * @returns 
     */
    filter(test_fn) {
        let flist = this._class_file_list
        if ( Array.isArray(flist) ) {
            let results = flist.filter(test_fn)
            return results
        } else {
            try {
                let vals = this.values()  // In the cheap implementation, just get an array of values and then sort the array
                return vals.filter(func)
            } catch (e) {}
        }
        return []
    }


    /**
     * update_global_file_list_quotes_by
     * 
     * Updates the sorted lists, sorting and scoring the entries for later queries. 
     * 
     */
    update_global_file_list_quotes_by() {
        if ( Array.isArray(this._class_file_list) ) {
            //
            let c_results = this.sort_by_created(this._class_file_list)  // will return arrays
            //
            let cdary = new WrapArray()
            this._class_file_list_by["create_date"] = cdary
            cdary.push(... c_results.map((item,index)=> {
                if ( item.score === undefined ) item.score = 1.0
                return(item)
            }))
            //
            let u_results = this.sort_by_updated(this._class_file_list)
            //
            let udary = new WrapArray()
            this._class_file_list_by["update_date"] = udary
            udary.push(... u_results.map((item,index)=> {
                if ( item.score === undefined ) item.score = 1.0
                return(item)
            }))
            //
            for ( let ky in this._class_file_list_by ) {
                if ( (ky !== "create_date") && (ky !== "update_date") ) {
                    let f_results = this.sort_by_field(this._class_file_list,ky)
                    //
                    let fdary = new WrapArray()
                    this._class_file_list_by[ky] = fdary
                    fdary.push(... f_results.map((item,index)=> {
                        if ( item.score === undefined ) item.score = 1.0
                        return(item)
                    }))
                }
            }
            //
        } else {
            // implemented by descendants
            console.log("FileLists ... custom storage implemented in descendents for `update_global_file_list_quotes_by`")
        }
    }
}


module.exports = FileLists        // export a template for apps to develop by

