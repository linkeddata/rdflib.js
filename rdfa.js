//   RDFa processor shell for  rdflib.js to use RDFaProcessor.js 
//  from green-turtle
//

GraphRDFaProcessor = new Object(); // @@@

GraphRDFaProcessor.prototype = new RDFaProcessor();
GraphRDFaProcessor.prototype.constructor=RDFaProcessor;

GraphRDFaProcessor = function(kb, doc) {
   RDFaProcessor.call(this,kb);
   this.doc = doc;
}

/*
GraphRDFaProcessor.prototype.getObjectSize = function(obj) {
   var size = 0;
   for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
         size++;
      }
   }
   return size;
};
*/

GraphRDFaProcessor.prototype.init = function() {
   var thisObj = this;
   this.finishedHandlers.push(function(node) {
      for (var subject in thisObj.target.graph.subjects) {
         var snode = thisObj.target.graph.subjects[subject];
         if (thisObj.getObjectSize(snode.predicates)==0) {
            delete thisObj.target.graph.subjects[subject];
         }
      }
   });
}

GraphRDFaProcessor.prototype.newBlankNode = function() {
   return this.kb.bnode();
}

GraphRDFaProcessor.prototype.newSubjectOrigin = function(origin,subject) {
    console.log(' newSubjectOrigin '+ origin + subject );
}

GraphRDFaProcessor.prototype.newSubject = function(origin,subject) {
   return this.sym(subject);
}


GraphRDFaProcessor.prototype.addTriple = function(origin,subject,predicate,object) {
    this.kb.add(subject, kb.sym(predicate), $rdf.literal(object.value, $rdf.sym(object.type)), this.doc);
    return;
}

/*
GraphRDFaProcessor.rdfaCopyPredicate = "http://www.w3.org/ns/rdfa#copy";
GraphRDFaProcessor.rdfaPatternType = "http://www.w3.org/ns/rdfa#Pattern";
*/
GraphRDFaProcessor.prototype.copyProperties = function() {
    // @@ check not needed  -- olnly in HTML mode
};

$rdf.parseDOM_RDFa = function(dom, kb, doc, options) {
    var p = new GraphRDFaProcessor(kb, doc);
    p.process(dom, options);
}
