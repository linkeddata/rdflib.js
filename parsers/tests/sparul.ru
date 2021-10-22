PREFIX foaf: <http://xmlns.com/foaf/0.1/> 

INSERT DATA { <one> <b> <c> .  } ; 
INSERT DATA { <twoP> <b1> <c1> ; <b2> <c2> .  } ; 
INSERT DATA { <twoO> <b> <c1> , <c2> .  } ; 
INSERT DATA { <twoO2> <b> <c1> ; <b> <c2> .  } ; 

DELETE DATA { <a> <b> <c> } ;

