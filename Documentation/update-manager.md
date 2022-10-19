## How the UpdateManager Works

### Non-http(s) URI

  * is editable if 

    * document has triple declaring itself a ont:MachineEditableDocument
    * or wac-allow header for document supports write for current user

  * is updated using SPARQL PATCH if

    * the response has one of the accept-patch or ms-author-via headers listed below

  * otherwise, is updated using PUT


### Http(s) URI

  * is editable if    

    * wac-allow header for document supports write for current user
    * and the response has one of the accept-patch or ms-author-via headers listed below 

  * is updated using SPARQL PATCH if

    * accept patch header is "application/sparql-update" 
    * or accept patch header is "application/sparql-update-single-match"
    * or ms-author-via header contains the word "SPARQL"

  * is updated using PUT if the ms-author-via header contains the word "DAV"

Note : currently rdflib does not support N3-PATCH although it is, AFAIK, the only method of update mentioned in the specs.  To fix this would require changes to the editable function to accept an N3-PATCH header and changes to the fire function to be able to submit an N3-PATCH.  See https://github.com/SolidOS/solidos/issues/185.
