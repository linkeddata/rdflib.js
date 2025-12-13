export default class RDFParser {
    /** Standard namespaces that we know how to handle @final
     *  @member RDFParser
     */
    static ns: {
        RDF: string;
        RDFS: string;
    };
    /** DOM Level 2 node type magic numbers @final
     *  @member RDFParser
     */
    static nodeType: {
        ELEMENT: number;
        ATTRIBUTE: number;
        TEXT: number;
        CDATA_SECTION: number;
        ENTITY_REFERENCE: number;
        ENTITY: number;
        PROCESSING_INSTRUCTION: number;
        COMMENT: number;
        DOCUMENT: number;
        DOCUMENT_TYPE: number;
        DOCUMENT_FRAGMENT: number;
        NOTATION: number;
    };
    constructor(store: any);
    /** Our triple store reference @private */
    private store; /** Our identified blank nodes @private */
    bnodes: {}; /** A context for context-aware stores @private */
    why: any; /** Reification flag */
    reify: boolean;
    /**
     * Frame class for namespace and base URI lookups
     * Base lookups will always resolve because the parser knows
     * the default base.
     *
     * @private
     */
    private frameFactory;
    getAttributeNodeNS(node: any, uri: any, name: any): any;
    /**
     * Build our initial scope frame and parse the DOM into triples
     * @param {HTMLDocument} document The DOM to parse
     * @param {String} base The base URL to use
     * @param {Object} why The context to which this resource belongs
     */
    parse(document: HTMLDocument, base: string, why: any): boolean;
    base: string | undefined;
    parseDOM(frame: any): void;
    /**
     * Cleans out state from a previous parse run
     * @private
     */
    private cleanParser;
    /**
     * Builds scope frame
     * @private
     */
    private buildFrame;
}
