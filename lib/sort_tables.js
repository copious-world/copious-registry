//
const NOISY = false

/**
 * SortedTables
 * 
 */

class SortedTables {

    constructor(conf) {}

    // ORDERING
    // 

    /**
     * sort_by_updated
     * 
     * (1)
     * Order a set of record by the time they were updated... (they must include a 'dates' structure field)
     * 
     * 
     * @param {object} iterable - JavasScript class instance with *iteratable* interface conformance
     * @returns 
     */
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
                let vals = [... iterable.values()]  // In the cheap implementation, just get an array of values and then sort the array
                return this.sort_by_updated(vals)
            } catch (e) {
                if ( NOISY ) console.log(e)
            }
        }
        return results
    }

    //

    /**
     * sort_by_created
     * 
     * (2)
     * Order a set of records by the time they were created... (they must include a 'dates' structure field)
     * 
     * @param {object} iterable - JavasScript class instance with *iteratable* interface conformance
     * @returns 
     */
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
                let vals = [... iterable.values()]  // In the cheap implementation, just get an array of values and then sort the array
                return this.sort_by_created(vals)
            } catch (e) {
                if ( NOISY ) console.log(e)
            }
        }
        return results
    }


    /**
     * sort_by_created
     * 
     * (3)
     * Order a set of records by a monotonic score... (they must include a 'score' numeric field)
     * 
     * @param {object} iterable - JavasScript class instance with *iteratable* interface conformance
     * @returns 
     */
    sort_by_score(iterable) {   // <- an array
        let results = []
        if ( Array.isArray(iterable) ) {
            results = iterable.sort((a,b) => {
                return(b.score - a.score)
            })
        } else {
            try {
                let vals = [... iterable.values()]  // In the cheap implementation, just get an array of values and then sort the array
                return this.sort_by_score(vals)
            } catch (e) {
                if ( NOISY ) console.log(e)
            }
        }
        return results
    }


    /**
     * sort_by_field
     * 
     * (4)
     * Order a set of records by a field having monotonic properties... (they must include a 'field' numeric field)
     * 
     * @param {object} iterable - JavasScript class instance with *iteratable* interface conformance
     * @returns 
     */
    sort_by_field(iterable,field) {   // <- an array <-- a string for a field name having numeric type
        let results = []
        if ( Array.isArray(iterable) ) {
            results = iterable.sort((a,b) => {
                return(b[field] - a[field])
            })
        } else {
            try {
                let vals = [... iterable.values()]  // In the cheap implementation, just get an array of values and then sort the array
                return this.sort_by_score(vals)
            } catch (e) {
                if ( NOISY ) console.log(e)
            }
        }
        return results
    }

    /**
     * sort_by_fn
     * 
     * (5)
     * Order a set of records by a monotonic score... (they must include a 'score' numeric field)
     * 
     * @param {object} iterable - JavasScript class instance with *iteratable* interface conformance
     * @returns 
     */

    sort_by_fn(iterable,func) {   // <- an array <-- to parameter func(store type,store type)
        let results = []
        if ( typeof func === 'function' ) {
            if ( Array.isArray(iterable) ) {
                results = iterable.sort(func)
            } else {
                try {
                    let vals = [... iterable.values()]  // In the cheap implementation, just get an array of values and then sort the array
                    return this.sort_by_fn(vals,func)
                } catch (e) {
                    if ( NOISY ) console.log(e)
                }
            }    
        }
        return results   // did not sort 
    }
    

    // END OF ORDERING
    
}


module.exports = SortedTables
