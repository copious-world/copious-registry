
const fsPromises = require('fs/promises')

// https://github.com/multiformats/multicodec/blob/master/table.csv
// https://github.com/trezor/trezor-crypto
// https://github.com/bitcoin/libbase58/blob/master/base58.c

function last_char_is(str,c) {
    let lc = str[str.len - 1]
    return ( lc === c)
}

async function ensure_dirs(path) {
    let dirs = path.split('/')
    let top_dir = ''
    for ( let dr of dirs ) {
        let subdr = top_dir + '/' + dr
        try {
            await fsPromises.mkdir(subdr)
        } catch(e)  {
            if ( e.code !== 'EEXIST') console.error(e)
        }
    }
}

async function make_path(output_dir,output_file) {
    let front = output_dir
    if ( (last_char_is(front,c) !== '/') && (output_file[0] !== '/') ) {
        front += '/'
    }
    return front + output_file
}

//

class CachingProcess {

    constructor(conf) {
        //
        this.cache_dir = conf.cache_dir
        this.interval = conf.cache_interval
        this.interval_id = null
        //
        this.user_directory = conf.user_directory
        this._type_directories = {}
        if ( conf.directories ) {
            this._type_directories = Object.assign({},conf.directories)
        }
        //
        this.init_cache_directories()
    }


    // ----  ----  ----  ----  ----  ---- 

    async init_cache_directories() {
        //
        let cache_path = make_path(this.cache_dir,this.user_directory)
        await ensure_dirs(cache_path)
        //
        for ( let dr in this._type_directories ) {
            let cache_path = make_path(this.cache_dir,this._type_directories[dr])
            await ensure_dirs(cache_path)
        }
    }


    // ----  ----  ----  ----  ----  ---- 

    async dirCopy(src_in,dst_in) {
        //
        let entries = await fsPromises.readdir(src)
        let allPromises = []
        for ( let entry of entries ) {
            let src = src_in + entry
            let dst = dst_in + entry
            let p = fsPromises.copy(src,dst)
            allPromises.push(p)
        }
        //
        await Promise.all(allPromises)
    }


    async copyAll() {
        let src = this.user_directory
        let dst = make_path(this.cache_dir,this.user_directory)
        await this.dirCopy(src,dst)
        //
        let allPromises = []
        for ( let ky in this._type_directories ) {
            let src = this._type_directories[ky]
            let dst = make_path(this.cache_dir,this._type_directories[ky])
            let p = this.dirCopy(src,dst)
            allPromises.push(p)        
        }
        await Promise.all(allPromises)
    }

    async startupAll() {
        let src = make_path(this.cache_dir,this.user_directory)
        let dst = this.user_directory
        await this.dirCopy(src,dst)
        //
        let allPromises = []
        for ( let ky in this._type_directories ) {
            let src = make_path(this.cache_dir,this._type_directories[ky])
            let dst = this._type_directories[ky]
            let p = this.dirCopy(src,dst)
            allPromises.push(p)        
        }
        await Promise.all(allPromises)
    }

    //
    async startup_sync() {
        await this.startupAll()
        let interval = this.interval
        this.interval_id = setInterval(() => {
            this.copyAll()
        },interval)
    }

    stop_sync() {
        if ( this.interval_id !== null ) {
            clearInterval(this.interval_id)
            this.interval_id = null
        }
    }

}


module.exports = CachingProcess
