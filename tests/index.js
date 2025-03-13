



async function test_sort_tables() {
    //
    let SortClass = require('../lib/sort_tables')

    let sc = new SortClass()
    let output = sc.sort_by_updated()
    console.dir(output)

    let objects = []
    let N = 6
    let start_date = Date.now()
    for ( let i = 0; i < N; i++ ) {
        let R = Math.trunc(Math.random()*10000)
        let C = Math.trunc(Math.random()*2000)
        let obj = {
            "dates" : {
                "updated" : start_date + R,
                "created" : start_date + (R - C)
            },
            "field" : String.fromCharCode("A".charCodeAt(0) + i),
            "code" : ("A".charCodeAt(0) + i)
        }
        objects.push(obj)
    }

    // --- sort
    output = sc.sort_by_updated(objects)
    console.dir(output)

    output = sc.sort_by_created(objects)
    console.dir(output)

    output = sc.sort_by_field(objects,'code')
    console.dir(output)

    output = sc.sort_by_fn(objects,(a,b) => {
        let bc = Math.log(b['code'])
        let ac = Math.log(a['code'])
        return(bc - ac)
    })
    console.dir(output)
    
    //
    console.log("ITERABLES ...")
    let mobjap = new Map()
    for ( let obj of objects ) {
        mobjap.set(obj.field,obj)
    }

    //
    output = sc.sort_by_updated(mobjap)
    console.dir(output)


    output = sc.sort_by_created(mobjap)
    console.dir(output)

    output = sc.sort_by_field(mobjap,'code')
    console.dir(output)

    output = sc.sort_by_fn(mobjap,(a,b) => {
        let bc = Math.log(b['code'])
        let ac = Math.log(a['code'])
        return(bc - ac)
    })
    console.dir(output)

    console.log([... [1,2,3]])
    console.log(Array.isArray([... [1,2,3]]))
}


async function test_file_list() {

    const {XXHash32} = require('xxhash32-node-cmake')
    const FileLists = require('../lib/file_list')

    console.log("FILE LIST TESTS")

    // File lists require a fiedl `_tracking`

    let flist = new FileLists()

    let hasher = new XXHash32(99759837)
    flist.set_hasher(hasher)

    let N = 6
    let start_date = Date.now()
    let tracks = []
    for ( let i = 0; i < N; i++ ) {
        let R = Math.trunc(Math.random()*10000)
        let C = Math.trunc(Math.random()*20000)
        let obj = {
            "dates" : {
                "updated" : start_date + R,
                "created" : start_date + (R - C)
            },
            "field" : String.fromCharCode("A".charCodeAt(0) + i),
            "_tracking" : ("A".charCodeAt(0) + i)
        }

        obj._tracking = flist.unique_id(obj)
        tracks.push(obj._tracking)
        flist.add(obj)
    }

    let obj = flist.get(tracks[1])

    console.log(flist.values())

    console.log(tracks[1])
    console.dir(obj)

    flist.delete(tracks[1])
    console.log(flist.values())

    flist.update_global_file_list_quotes_by()
    console.log(typeof flist.values(),Array.isArray(flist.values()))
    console.dir(flist.ordering_table(),{ depth : 3})

    console.log("-----------------")
    console.log(typeof  flist._class_file_list_by["create_date"], flist._class_file_list_by["create_date"].constructor.name)

}


function test_registry() {

    const {Registry} = require('../lib/registry')
    let registry = new Registry({})

    let N = 6
    let start_date = Date.now()
    let tracks = []
    for ( let i = 0; i < N; i++ ) {
        let R = Math.trunc(Math.random()*10000)
        let C = Math.trunc(Math.random()*20000)
        let obj = {
            "dates" : {
                "updated" : start_date + R,
                "created" : start_date + (R - C)
            },
            "field" : String.fromCharCode("A".charCodeAt(0) + i),
            "_tracking" : ("A".charCodeAt(0) + i)
        }

        obj._tracking = registry.unique_id(obj)
        tracks.push(obj)
    }

    for ( let fobj of tracks ) {
        registry.add_just_one(fobj)    
    }

    registry.remove_just_one(tracks[1]._tracking)

    console.dir(registry.global_file_list_by)
    console.dir(registry.global_tracking_map)

}

// ---- ---- ---- ---- ---- ----

test_sort_tables()
test_file_list()
test_registry()

// ---- ---- ---- ---- ---- ----
