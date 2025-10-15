const DirWatcherHandler = require('./lib/directory_watch_handler.js')
const ObjFileDirLoader = require('./lib/object_file_loader.js');
//
const {Registry,FileLists} = require('./lib/registry.js')
//
module.exports.DirWatcherHandler = DirWatcherHandler
module.exports.ObjFileDirLoader = ObjFileDirLoader
module.exports.Registry = Registry
module.exports.FileLists = FileLists
//
/**
 * This module provides a basic search infrastructure that can be configured.
 * 
 * The module gets data by observing events dealing with the publication of the 
 * to directories. The basic behavior for endpoint operations and pub/sub can be configured by extending 
 * the watcher classes.
 * 
 * It builds indexes which are sorted according to configurable matching algorithms.
 * 
 * It provides data backup and reloading. (Serialization and deserialization)
 * And, manages file lists.
 * 
 * 
 */