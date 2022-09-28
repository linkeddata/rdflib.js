import { ObjectType } from '../types';
import Collection from '../collection';
import IndexedFormula from '../store';
import Statement from '../statement';
import { BlankNode, Quad_Graph, Literal, NamedNode, Quad_Object, Quad_Predicate, Quad, Quad_Subject, Term, Variable } from '../tf-types';
/** TypeGuard for RDFLib Statements */
export declare function isStatement(obj: any): obj is Statement;
/** TypeGuard for RDFlib Stores */
export declare function isStore(obj: any): obj is IndexedFormula;
/** TypeGuard for RDFLib Collections */
export declare function isCollection(obj: any): obj is Collection<any>;
/** TypeGuard for valid RDFlib Object types, also allows Collections, Graphs */
export declare function isRDFlibObject(obj: any): obj is ObjectType;
/** TypeGuard for valid RDFlib Subject types, same as Object as RDFLib symmetrical.
*/
export declare function isRDFlibSubject(obj: any): obj is ObjectType;
/** TypeGuard for valid RDF/JS spec Predicate types */
export declare function isRDFlibPredicate(obj: any): obj is Quad_Predicate;
/** TypeGuard for RDFLib Variables */
export declare function isVariable(obj: any): obj is Variable;
/** TypeGuard for RDF/JS spec Terms */
export declare function isTerm(obj: any): obj is Term;
/** TypeGuard for RDF/JS spec Literals */
export declare function isLiteral(value: any): value is Literal;
/** TypeGuard for RDF/JS spec Quads */
export declare function isQuad(obj: any): obj is Quad<any, any, any, any>;
/** TypeGuard for RDF/JS spec NamedNodes */
export declare function isNamedNode(obj: any): obj is NamedNode;
/** TypeGuard for RDF/JS spec BlankNodes */
export declare function isBlankNode(obj: any): obj is BlankNode;
/** TypeGuard for valid RDF/JS spec Subject types */
export declare function isSubject(obj: any): obj is Quad_Subject;
/** TypeGuard for valid RDF/JS spec Predicate types */
export declare function isPredicate(obj: any): obj is Quad_Predicate;
/** TypeGuard for valid RDF/JS spec Object types */
export declare function isRDFObject(obj: any): obj is Quad_Object;
/** TypeGuard for valid RDF/JS Graph types */
export declare function isGraph(obj: any): obj is Quad_Graph;
