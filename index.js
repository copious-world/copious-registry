const DirWatcherHandler = require('./lib/directory_watch_handler.js')
const ObjFileDirLoader = require('./lib/object_file_loader.js');
let CachingProcess = require('./lib/caching_process')
//
const {Registry} = require('./lib/registry.js')
//
module.exports.DirWatcherHandler = DirWatcherHandler
module.exports.CachingProcess = CachingProcess
module.exports.ObjFileDirLoader = ObjFileDirLoader
module.exports.Registry = Registry
//
