

### Refactoring

This code originated in a small searching application for a local website searching capability. It was extracted since it is fairly common behavior. The search application using this as a default might configure another module in its place. Issues relating to optimization and 
improved configuration may be addressed here rather in a focussed context.

#### Origination

The original purpose of the searching application is handling receipt and management of publication of meta data. The meta data are just JSON objects. The JSON objects keep references to other data, that might be sizeable blobs or live streaming conduits. 

The objects that refer to other data may contain protocol based paths, URLs, to assets which may be used to fetch data via the protocols. The meta data objects are supposed to contain descriptions a human can read in a web UI. Often, paramatized links are to services that can negotiate a connection to a stream.

The JSON object may store data themselves. However, the application developer should keep in mind that the classes provided here make some attempt to keep all the objects in memory. When the data refers to some larger object, e.g. BLOB, it can be assumed the BLOB will not be called in by this module, but a service will handle the link in order to set up streaming to a client.


Example: 
1. One use has objects refering to the data with IDs (UCWIDs) that can be used to access BLOB assets over a repository bridge for streaming.
2. Another is a document retrieval of MarkDown, where the MarkDown is not stored in the meta-object but ina file local to the web service.

