/* SPARQL Update */

%lex

digit                       [0-9]
id                          [a-zA-Z][a-zA-Z0-9]*

%%
"<"[^<>\"{}|^`\\]*">"       return 'IRIREF';
"'"[^\x27\x5c\x0a\x0d]*"'"  return 'STRING_LITERAL1';
'"'[^\x22\x5c\x0a\x0d]*'"'  return 'STRING_LITERAL2';
"\\"[tbnrf\\"']             return 'ECHAR';
"BASE"                      return 'BASE';
"PREFIX"                    return 'PREFIX';
"DATA"                      return 'DATA';
"WHERE"                     return 'WHERE';
"LOAD"                      return 'LOAD';
"INSERT"                    return 'INSERT';
"DELETE"                    return 'DELETE';
"?"{id}                     return 'VAR1';
"$"{id}                     return 'VAR2';
{id}                        return 'ID';
"@"                         return '@';
"_"                         return '_';
":"                         return ':';
"{"                         return '{';
"}"                         return '}';
"("                         return '(';
")"                         return ')';
"["                         return '[';
"]"                         return ']';
"<"                         return '<';
">"                         return '>';
","                         return ',';
";"                         return ';';
"."                         return '.';
\s*\n\s*                    /* skip */
\s+                         /* skip */
<<EOF>>                     return 'EOF';

/lex

%right '{'
%right '<'
%right '['
%right '('
%left '}'
%left '>'
%left ']'
%left ')'
%left ';'

%start input
%%

id
    : ID
    ;

input
    : Queries EOF
        { console.log(require('util').inspect($Queries, false, null)); return $Queries; }
    ;

Prologue
    : BaseDecl? PrefixDecl*
    | PrefixDecl*
    ;

BaseDecl: BASE IRIREF ;
PrefixDecl: PREFIX PNAME_NS IRIREF ;

Queries
    : Queries ';' Query
        { $$ = $Queries; $$.push($Query); }
    | Prologue Query
        { $$ = [$Query]; }
    ;

Query: QueryBody | ;
QueryBody: Load | InsertData | DeleteData | DeleteWhere | Modify ;

Load
    : LOAD
    ;

InsertData
    : INSERT DATA QuadData -> { 'insert': [{ triples: $QuadData }] }
    ;

DeleteData
    : DELETE DATA QuadData -> { 'delete': [{ triples: $QuadData }] }
    ;

DeleteWhere
    : DELETE WHERE QuadPattern -> { 'delete': [{ pattern: $QuadPattern }] }
    ;

Modify
    : DeleteClause InsertClause WHERE GroupGraphPattern
    | DeleteClause WHERE GroupGraphPattern
    | InsertClause WHERE GroupGraphPattern
    ;

DeleteClause: DELETE QuadPattern ;
InsertClause: INSERT QuadPattern ;

QuadPattern
    : '{' Quads '}' -> $Quads
    ;

QuadData
    : '{' Quads '}' -> $Quads
    ;

Quads
    : TriplesTemplate? QuadsNotTriples '.'? TriplesTemplate?
    | TriplesTemplate?
    ;

TriplesTemplate
    : TriplesSameSubject '.' TriplesTemplate?
    | TriplesSameSubject '.'
    | TriplesSameSubject
    ;

GroupGraphPattern
    : '{' GroupGraphPatternSub '}'
    | RSREF
    ;

GroupGraphPatternSub
    : TriplesBlock? GraphPatternNotTriples '.'? TriplesBlock?
    | TriplesBlock?
    ;

TriplesBlock
    : TriplesBlock '.' TriplesSameSubjectPath
    | TriplesSameSubjectPath '.'
    | TriplesSameSubjectPath
    ;

GraphPatternNotTriples: GroupOrUnionGraphPattern | OptionalGraphPattern | MinusGraphPattern | GraphGraphPattern | ServiceGraphPattern | SADIinvocation | Filter | Bind | InlineData | Print ;

TriplesSameSubject
    : VarOrTerm PropertyListNotEmpty
        { var r = {}; r[$VarOrTerm.value] = $PropertyListNotEmpty; $$ = r; }
    | TriplesNode PropertyList
    ;

PropertyList: PropertyListNotEmpty? ;

PropertyListNotEmpty
    : Verb ObjectList ';' ( Verb ObjectList )?
        {
            var r = {};
            r[$Verb1.value] = $ObjectList1;
            if (!r[$Verb2.value])
                r[$Verb2.value] = $ObjectList2;
            else
                Array.prototype.push.apply(r[$Verb2.value], $ObjectList2);
            $$ = r;
        }
    | Verb ObjectList
        { var r = {}; r[$Verb.value] = $ObjectList; $$ = r; }
    ;

Verb: VarOrIri | 'a' ;

ObjectList
    : ObjectList ',' Object -> $ObjectList.concat([$Object])
    | Object -> [$Object]
    ;

Object: GraphNode ;

TriplesSameSubjectPath
    : VarOrTerm PropertyListPathNotEmpty
    | TriplesNodePath PropertyListPath
    ;

PropertyListPath: PropertyListPathNotEmpty? ;

PropertyListPathNotEmpty
    : PropertyListPathNotEmpty ';' ( VerbPath | VerbSimple ) ObjectListPath
    | VerbPath ObjectListPath
    | VerbSimple ObjectListPath
    ;

VerbPath: Path ;
VerbSimple: Var ;

ObjectListPath
    : ObjectListPath ',' ObjectPath
    | ObjectPath
    ;

ObjectPath: GraphNodePath ;
Path: PathAlternative ;
PathAlternative
    : PathAlternative '|' PathSequence
    | PathSequence
    ;

PathSequence
    : PathSequence '/' PathEltOrInverse
    | PathEltOrInverse
    ;

PathElt: PathPrimary PathMod? ;
PathEltOrInverse: PathElt | '^' PathElt ;
PathMod: '?' | '*' | '+' ;
PathPrimary: iri | 'a' | '(' Path ')' ;

TriplesNode: Generator | BlankNodePropertyList ;

BlankNodePropertyList: '[' PropertyListNotEmpty ']' ;

Generator: '(' GraphNode+ ')' ;

GraphNode: VarOrTerm | TriplesNode ;

VarOrTerm: Var | GraphTerm ;

VarOrIri: Var | iri ;

Var
    : VAR1
    | VAR2 ;

GraphTerm: iri | RDFLiteral | NumericLiteral | BooleanLiteral | BlankNode | NIL ;

RDFLiteral
    : String '^^' iri
    | String LANGTAG
    | String
    ;

String: STRING_LITERAL1 | STRING_LITERAL2 ;

iri
    : IRIREF -> { type: 'uri', value: yytext.slice(1,-1) }
    | PrefixedName
    ;

PrefixedName: PNAME_LN | PNAME_NS ;

PNAME_NS
    : PN_PREFIX ':'
    | ':'
    ;

PNAME_LN: PNAME_NS PN_LOCAL ;

/*LANGTAG: '@' [a-zA-Z]+ ('-' [a-zA-Z0-9]+)* ;*/
INTEGER: [0-9]+ ;
DECIMAL: [0-9]* '.' [0-9]+ ;

PN_CHARS_BASE
    : id
    ;

PN_CHARS_U: PN_CHARS_BASE | '_' ;

VARNAME: PN_CHARS_U* ;

PN_CHARS: PN_CHARS_U | '-' | [0-9] ;
PN_CHARS_DOT: PN_CHARS | '.' ;

PN_PREFIX
    : PN_CHARS_BASE PN_CHARS_DOT* PN_CHARS
    | PN_CHARS_BASE PN_CHARS
    | PN_CHARS_BASE
    ;

/*
[A-Za-z0-9] | [\x00C0-\x00D6] | [\x00D8-\x00F6] | [\x00F8-\x02FF] | [\x0370-\x037D] | [\x037F-\x1FFF] | [\x200C-\x200D] | [\x2070-\x218F] | [\x2C00-\x2FEF] | [\x3001-\xD7FF] | [\xF900-\xFDCF] | [\xFDF0-\xFFFD] | [\x10000-\xEFFFF]
*/
