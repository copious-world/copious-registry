# copious-registry


This module provides several classes that may occur commonly together.

1. **Registery** - the manager of a table of objects with sorting, searching, and some index tracking.
2. **Watcher** - a class that watches for the arrival of new objects
3. **WatchFilter** - a class that the Watcher uses to determine is an object should be included in the tables
4. **ObjFileDirLoader** - a class that loads data at the start of execution and saves it before execution ends
5. **FileLists** - a fairly abstract class that provides an interface that implementations may follow for interfacing access to storage of objects.


#### changes:

> 1. The class **DirWatcherHandler** is being called Watcher. The new class is more abstract, allowing one or more types of object watching, some disk based, some pub/sub based. 
> 2. The **WatchFilter** class is new, and implements default behavior to check on the data being included in the tables. Its addition serves to allow configured classes that filter objects according to application rules.
> 3. Crash and reset capability: this is the subject of a descendant class, but the main classes submits methods to a configured crash/shutdown handler on startup. 
> 4. Interval backup: As in the case of crash and reset, the interval backup can be setup by providing backup methods to a configured state backup hankder on startup.


## Purpose

These classes allow for fielding new data objects and having them included in indexes.

Client application/descendants can request sorts, searches, pruning, caching, etc. 

This is a live object store. It provides basic disk based persistence as a default.

[notes on refactoring](file:./docs/refactoring.md)

## Repositories and Packages:

[npm package](https://www.npmjs.com/package/copious-registry)

[github](https://github.com/copious-world/copious-registry)



## Configurations

This module is written with configuration in mind.  

Storage classes, sorting operations, object injestions, and more can be configured to use the best performing 
versions of features/operations. Default operations can get the job done but they are bound by JavaScript performance.

Because this stack is configurable, it can be used as a communication framework managing the flow of information in and out of the tables, while providing calls by client code to sort and search.

More information on configuration will be given below.



## Install

For use in node.js projects: 

```
npm install -s copious-registry
```

### about hashing

There is an implicit dependency on an externally specified (configured)
hash function. **xxhash32-node-cmake** works on some of my machines. But, there are some build problems that have to be addressed with node.js 24. So, as a default **xxhash-addon** will be required. 

The **xxhash32-node-cmake** may be specified by adding the field, **xxhash** to the configuration object, *conf*, passed during construction. Otherwise, **xxhash-addon** will be loaded.

Neither module will be installed with the installation of this module. So, in order to access them, they should be installed gloabally as such:

```
npm install -g xxhash32-node-cmake
```

and/or

```
npm install -g xxhash32-addon
```


If the build is not in sync with your version of Linux, the other build may be.

These should be installed prior to using the registy class.

Originally, I made xxhash32-node-cmake to use the cmake module build and to use nan. Older versions worked fine. The mos recent is having some problems. 


### Basic Features

The classes basically control one list of objects (stored according to the FileLists implementation).

The registry provides access to sorting of the stored list. And, the application may key the lists for certain sorts. The objects are expected to have, or may be given, a field having to do with dates of creation and update. Two lists providing sort by these dates is provided by default.

Items find their way into the lists by two processes.

1. watch process - The subject of DirWatcherHandler, a class that watches for new objects that arrive into the directories controlled by the application using these classes. DirWatcherHandler adds object to the storage object containing the object list.
2. loading at startup - The class ObjFileDirLoader provides a method that loads objects from a diretory, using methods from [extra-file-classes](https://www.npmjs.com/package/extra-file-class).

## \_tracking  *(reserved field name)*

This is the name of the identifier field that is used throughout. Some thought has been given to making this field configurable. But, that may be treated as the subject of another set of classes. 

There is no loss of generality in insisting that objects have a field `_tracking`, which may be distinguished from `tracking` that some applications might use, say if the assets are in a shipping application. This field has a similar purpose.

The main requirement of the field `_tracking` is that it must be a unique ID, which may be obtained by a number of methods including cryptographic hashing. 

It is also important that `_tracking` be on the top level of an object. So, if one were to inspect a JSON file containing an object used in this application one should see `_tracking` as a field not too far removed from the initial brace. It's value will likely be some base64 representation of a large number.

## dates *(reserved field name)*

It is assumed that the top level of the objects handled by these classes will have a field ***dates***.

The dates field is itself an object with the **update** date and **created** date as fields.

Here is an example:

```
{
	"_tracking" : "sd8fwoerw8tuwrje9fu",
	"dates" : {
        "created" : Date.now(),
        "updated" : Date.now()
    }
}
```

When the object is added, the class instance will create a date for the object if it does not have one. There is an assumption that it is better for applications generating the objects to create the dates, as they will have a better handle on the time they perform their operations.

## \_x\_entry *(reserved field name)*

This is one more top level field. It's primary purpose is to sequence data. But, currently a hash of the data is being placed in the \_x\_entry field by default. 

Clients consuming lists returned as searches or as complete DB listings may overwrite this field with their own sequence numbering scheme.

This field is used in serializing queries in dependent searching modules.

## score *(may be reserved field name)*

This module sets the score field of new objects to 1.0 if the filed is not present. The method `sort_by_score` uses it. So, if an application whishes to use the method `sort_by_score`, it may control the field on the top level of the object

## \_xxzz\_removed *(reserved field name)*

This is a field that is added to the object when it is being removed. The object is being taken out of tables maintained by the Registry instance. But, the Registry does not know how to remove it from other data structures. Instead, it calls a method `app_specific_file_removal` after the object is marked with this field.

## Classes Provide

* **Registry**
* **DirWatcherHandler**
* **ObjFileDirLoader**
* **FileLists**


## Use Cases

* [copious-little-searchers](https://www.npmjs.com/package/copious-little-searcher)
* [copious-counters](https://www.npmjs.com/package/copious-counters)


## Methods - Registry

The registry keeps lists of objects. The lists may be implemented as custom iterable classes. There is also a map that maps the configured ID field to the objects, and items may be found through this map.

Several methods are provided for sorting lists and keeping those list in memory. 

Finally, there are methods for adding and removing objects. And, those methods check on the object to make sure that it is created or updated and that it has a proper ID field, etc.

The default field of the ID is **\_tracking**.

* **constructor**
* **unique\_id**
* **set\_global\_file\_list\_refs**
* **sort\_by\_updated**
* **sort\_by\_created**
* **sort\_by\_score**
* **sort\_by\_fn**
* **update\_tracking\_map**
* **update\_global\_file\_list\_quotes\_by**
* **from\_all\_files**
* **add\_just\_one**
* **remove\_just\_one**
* **fetch\_single**
* **fetch\_multiple**
* **app\_specific\_file\_removal**
* **attempt\_join\_searches**

<hr/>

## Method Details - Registry

This is the registry, the keeper of objects, most of which will described larger objects elsewhere in most applications. 

The registry keeps objects in a single iterable. But, it also may keep a map of types of sorts, lists of the objects sorted according to a particular key or functional result. 

Other classes in this module serve to put objects into and remove objects from the list this class keeps. Typically, the classes make a call to `add_just_one` to add an object and `remove_just_one` to remove an object. However, if a class is loading from backup, it may make the assumption that the object is well formed and just call the method belonging to the list, 'add' or 'push'. 


#### **`constructor `**

Sets up hashing for when it is needed. Initializes the global tables. If the configuration has the field, `file_list_class`, it will attempt to use the application defined file list object for storing its objects. The member variable, `global_file_list`, will be set to an instance of the supplied class, which must have the properties of an iterable.
		
**parameters**

* config -- an object with configuration fields

----

#### **`unique_id`**

Returns a hash of data or other value depending on the application. The default behavior is to stringify the object passed and then to make a hash of the string using an xxhash function.

**parameters**

* object -- the object providing input into making the ID. 

----

#### **`set_global_file_list_refs`**

The parameters are the storage objects that will be shared by the classes in this module and by descendants of those classes. Sharing is limited to these two objects. If the objects are to be handled in a custom way, then the configuration of this class should include a specification of the FileLists type of object. When the FileLists object is specified, the parameters of this method will be passed to it.

The construction and allocation of the storage objects passed is expected to occur in the application. The classes in this module use the storage objects but do not delete them or replace them in any way.

These classes put objects into the storage class and remove objects from the storage class. So, the application only needs to understand that the objects should not be referenced as in place objects unless the application takes care to manage the existence of the object on its own.

In fact, there calls for removing objects are not directly executed by methods in these class. But, the methods for removal are provided. 

**parameters**

* `ref_big_list` - an array or iterable that will be used to store all the objects available to applications of this class.
* `ref_big_list_by` -- a map of sort types to lists; this class will create the application storage type for these lists and place objects in these according to sorts determined by the application or defaults. 

----

#### **`sort_by_updated`**

Takes in an iterable of objects to be sorted.

This method will return and array (Array object) of objects that are sorted according to their date.update field.

If the object is an array, it will sort it, accessing the objects date.update field. If it is another sort of iterable, it will retrieve an array of values from the iterable and then recursively call this method. 

**parameters**

* iterable -- an iterable containing objects to be sorted. 

----

#### **`sort_by_created`**

Takes in an iterable of objects to be sorted.

This method will return and array (Array object) of objects that are sorted according to their date.created field.

If the object is an array, it will sort it, accessing the objects date.created field. If it is another sort of iterable, it will retrieve an array of values from the iterable and then recursively call this method. 

**parameters**

* iterable -- an iterable containing objects to be sorted. 

----

#### **`sort_by_score`**

Takes in an iterable of objects to be sorted.

This method assumes the application has supplied the objects in its storage object a ***score*** field. The ***score*** field should be a number determined by the application.

This method will return and array (Array object) of objects that are sorted according to their ***score*** field.

If the object is an array, it will sort it, accessing the objects ***score*** field. If it is another sort of iterable, it will retrieve an array of values from the iterable and then recursively call this method. 


**parameters**

* iterable -- an iterable containing objects to be sorted. 

----


#### **`sort_by_field`**

Takes in an iterable of objects to be sorted.

This method assumes the application has supplied the objects in its storage object a ***[field]*** field. The ***[field]*** field should be a number determined by the application.

This method will return and array (Array object) of objects that are sorted according to their ***[field]*** field.

If the object is an array, it will sort it, accessing the objects ***[field]*** field. If it is another sort of iterable, it will retrieve an array of values from the iterable and then recursively call this method.

Here ***[field]*** means the field accessed by the value of ***[field]*** as in `val = obj[field]`. 


**parameters**

* iterable -- an iterable containing objects to be sorted. 

----


#### **`sort_by_fn`**

Takes in an iterable of objects to be sorted. Also, it takes in a functional that will have access to two objects at a time and will return -1,0,1 according to the requirements of the Array object sort method.

This method will return and array (Array object) of objects that are sorted according to their ***score*** field.

If the object is an array, it will sort it, accessing the objects ***score*** field. If it is another sort of iterable, it will retrieve an array of values from the iterable and then recursively call this method. 

**parameters**

* iterable -- an iterable containing objects to be sorted
* func -- a two parameter functional which can evaluate whether its paramters are bigger (\=1), smaller (\=-1) or the same (\=0) according to its calculations.

----

#### **`update_tracking_map`**

Examines every object in the global file list and makes sure that it is accounted for in ther tracking map. 

**no parameters**

----

#### **`update_global_file_list_quotes_by`**

This method has a default behavior for when the application does not use a FileList class. If the application just uses arrays, then this method calls on the sort methods and touches the score fields of the objects.

This method calls on the sorting methods for soring by dates. It sets all scores to 1.0 if the score field is abscent from the object. Also, it looks for the lists mapped by the ***[field]*** parameters needed for `sort_by_field`.

If the application is using a FileList class this method defers to the `update_global_file_list_quotes_by` of that class.

**no parameters**

----

#### **`from_all_files`**

Takes the parameter that maps a field name to a list of sorted objects. Also, "create_date" and "update_date" may be the parameter passed.

This returns the list which is assumed to have been sorted at some previous time.

**parameters**

* orderby -- The field that was used to keep a sorted lists of the objects stored in the global iterable. 

----

#### **`add_just_one`**

Adds and object into the global iterable. Updates list membership in other lists as well. If the application knows that the object is a new object, the object will be added without trying to look it up. If not, this method first searches for the object and overwrites the one it finds.

In the case that the application has supplied its own iterable objects for the global iterable, this application will simply overwrite the data of a object retrieved by reference from the global iterable.

**parameters**

* object -- the object being added to the global iterable. 
* from_new -- if **true** the application will create a new entry and not  overwrite an exsiting entry.

----

#### **`remove_just_one`**

Removes an object from the global iterable and all lists that it may be found in in this module's classes. It then gives the application to remove the object by calling `app_specific_file_removal`.

**parameters**

* tracking -- the ID the object being removed.

----

#### **`fetch_single`**

Refers to the global tracking map to find the object and returns it.

**parameters**

* tracking --  the ID of an object to retrieve

----

#### **`fetch_multiple`**

Given a list of tracking IDs, this returns a submap of the global tracking map. The object that is returned also includes a field `count`, the number of objects actually found and returned.

**parameters**

* tracking_list -- a list of the IDs of objects to retrieve.

----

#### **`app_specific_file_removal`**

**parameters**

* tracking -- the ID of the object that is being removed.
* stored -- the object that is found in the global iterable and has been marked with removal flags and other indicators that may be used by applications that share the object. 

----

#### **`attempt_join_searches`**

Allows the application to work with an object when it is being added to the global iterable.

The method name is related to its original use, whereby a new object is added to the list of results of certain formal queries.

**parameters**

* object -- the object being added to the global iterables. 

----


## Methods - DirWatcherHandler

This class handles the arrivale of new data. In particular, this class takes in files that arrive in a directory that it watches. 

Subclasses of this class may take in objects via other means of communication and make use of the method for adding and removing objects. 

While wathing a disk directory is not assumed to be super fast, the planned placement for efficiency these classes provde is in accessing the objects once they are in memory. However, some ram-disk setups may provide abundant throughput.

The default field of the ID is **\_tracking**.

* **constructor**
* **start**
* **add\_just\_one\_new\_asset**
* **remove\_just\_one\_asset**
* **read\_and\_injest**
* **pass\_filter**
* **track\_list\_id**

<hr/>


## Method Details - DirWatcherHandler

#### **`constructor`**

Sets up the basic parameters and file operations.

**parameters**

* directory - the directory this instance will watch.
* element_manager - a registry object -- may be a descendant of registry
* config -- an object with configuration fields

----

#### **`start`**

This method starts watching a directory. It obtains a watcher stream from a node.js fsPromise.watch call by using the FileOperations intermediary call.

File watching is ongoing and ends when the application program shuts down.

This looks or 'change' and 'rename' events. In both cases, a file that passes any filters will be passed on to `read_and_injest`. If the file is being renamed, the previous version of the object will be removed.

**no parameters**

----


#### **`add_just_one_new_asset`**

Given that the parameter is an object, this method will call upon the registry to add it, calling `add_just_one`. If it is an array, it will assume that the first array element is an ID for the group. It will track the group by the ID, adding all the elements in the remaining of the array, and it will know of this group of elements when it is asked to be removed by maintaining a list of their IDs.

**parameters**

* obj -- an object that may be stored in the registry, or a tracking list of objecs

----


#### **`remove_just_one_asset`**

If the id passed is not a group tracking id, this will call upon the element manager to remove the element by its ID, calling `remove_just_one`. Otherwise, it will retrieve the group and remove each element.

**parameters**

* id -- an object that may be stored in the registry, or a tracking list of objecs

----


#### **`read\_and\_injest`**

This loads the JSON file (using file operations) and then calls `add_just_one_new_asset` on the resulting object. Ignores failed load attempts. 

**parameters**

* fpath -- a path to a file containing JSON.

----


#### **`pass_filter`**

This checks that the file name passed to it is a form indicating an actual file rather some systems intermediate file which may appear when watching a directory. It also checks that the extension of the file is the one being processed by the application; in this case, that is '.json'.

**parameters**

* fname -- the name of a file

----


#### **`track_list_id`**

This is an ad hoc check to see if a symbol being used for an id mentions in particular that the object represented is a list. In particular, it looks for the prefix "***TRACKLIST::***".

**parameters**

* id -- a string being used as the id of an object

----

## Methods - ObjFileDirLoader

This class deals with backing up data and then reloading it when the application restarts.

It is the intention that this class only deals with data that has already been added previously (not new data) and that has been stored by this class's instances themselves.


* **constructor**
* **item\_injector**
* **load\_directory**
* **backup\_to\_directory**
* **save**
* **remove**

<hr/>


## Method Details - ObjFileDirLoader


#### **`constructor `**

Creates an instance of a ***DirectoryCache*** from [extra-file-classes](https://www.npmjs.com/package/extra-file-class). This class acts as a proxy to the ***DirectoryCache*** instance, but provides a method for injesting the objects found in the directory that is being loaded.

**parameters**

* dirpath - the directory which has the files to be loaded and saved
* list\_ref -- the application wide iterable that will contain 
* after\_loaded\_action - determined by the application and specified by DirectoryCache
* conf -- passed on to the DirectoryCache constructor

----

#### **`item_injector`**

The item injector inspects its one parameter in order to determine if it is an array to be added or just one object to be added to the registery. It then checks to see if its own list is an iterable or an Array object so that it may 'add' or 'push' accordingly. 

Applications wishing for complex behavior may make sure that the applicatino wide iterable is carefully implemented with all the features it needs. This method will only ever call 'add' on that iterable.

**parameters**

* object -- an object or iterable of objects to be added to the registry.

----

#### **`load_directory`**

Provides the DirectoryCache loading call with parameters set up in the constructor of this class. Passes this class's item injector method as the method to be called by the DirectoryCache instance.

**no parameters**

----

#### **`backup_to_directory`**

Provides the DirectoryCache backup call with a file name constructor: `${obj._tracking}.json`. Calles the DirectoryCache instance `backup_to_directory` with the ObjFileDirLoader directory from the constuctor on the application wide iterable also provided in the constuctor.

**no parameters**

----


#### **`save`**

Saves just one object using the naming conventions established by this class.

**parameters**

* object -- the object being written to disk. 

----


#### **`remove`**

Removes an object from from disk.

**parameters**

* tracking -- the traking ID of the object. 

----


## Methods - FileList

This is the default store that keeps track of application iterable implementations. Applications wishing to make use of it should override it and call it out in the conf of the Registry class that controls it. Use the `file_list_class` field in the configuration object.

* **constructor**
* **set\_lists**
* **unique\_id**
* **values**
* **sort**
* **get**
* **add**
* **delete**
* **ordering\_table**


## Method Details - FileList


#### **`constructor`**

Sets up basic member variables. These will be resets by `set_lists`

**parameters**

* conf - This is provided for any implementations -- the default does not use it.

----


#### **set\_lists**

Assumes the application will supply the actual global iterable that this class proxies for.

**parameters**

* list_interface - the application created global iterable
* field_map_interface - the map of field to iterables for sorting by fields

----


#### **unique\_id**

Any id producing function that may use the objects passed if it whishes. 

**parameters**

* obj - TBD

----


#### **values**

Returns the values of the internal map of this class. Similar to values of the Map object.

**no parameters**


----


#### **sort**

Sorts the global iterable

**parameters**

* func - a two parameter functional that provides sorting similar to that of the Array object.

----

#### **get**

Gets an object from the global iterable, similar to Map get

**parameters**

* tracking - the tracking Id of the object being retrieved

----


#### **add**

Add an object to the globa iterable as per the application implementation of this class. Should operate similarly to a Map add.


**parameters**

* tracking - the tracking Id of the object being added
* obj -- the object itself

----


#### **delete**

Deletes an object from the global iterable as per the application implementation of this class. Should operate similarly to a Set delete.

**parameters**

* tracking - the tracking Id of the object to be deleted

----

#### **`ordering_table`**

Returns the object that maps field names and `created_date` and `update_date` to lists sorted by those field keys.

**no parameters**

----


#### **`update_global_file_list_quotes_by`**

When a FileList class is in use, this method will be called for sorting lists or iterables controlled by the class. It will be up to the implementation of this class to touch the `score` field of the objects. 

**no parameters**

----
