declare class RDFaProcessor {
    static parseRDFaDOM(dom: any, kb: any, base: any): void;
    static tokenize(str: any): any;
    static trim(str: any): any;
    constructor(kb: any, options: any);
    options: any;
    kb: any;
    target: any;
    blankNodes: any[];
    htmlOptions: {
        selfClosing: string;
    };
    theOne: string;
    language: any;
    vocabulary: any;
    blankCounter: number;
    langAttributes: {
        namespaceURI: string;
        localName: string;
    }[];
    inXHTMLMode: boolean;
    absURIRE: RegExp;
    finishedHandlers: any[];
    addTriple(origin: any, subject: any, predicate: any, object: any): void;
    ancestorPath(node: any): string;
    copyMappings(mappings: any): {};
    copyProperties(): void;
    deriveDateTimeType(value: any): string | null;
    init(): void;
    newBlankNode(): string;
    newSubjectOrigin(origin: any, subject: any): void;
    parseCURIE(value: any, prefixes: any, base: any): any;
    parseCURIEOrURI(value: any, prefixes: any, base: any): any;
    parsePredicate(value: any, defaultVocabulary: any, terms: any, prefixes: any, base: any, ignoreTerms: any): any;
    parsePrefixMappings(str: any, target: any): void;
    parseSafeCURIEOrCURIEOrURI(value: any, prefixes: any, base: any): any;
    parseTermOrCURIEOrAbsURI(value: any, defaultVocabulary: any, terms: any, prefixes: any, base: any): any;
    parseTermOrCURIEOrURI(value: any, defaultVocabulary: any, terms: any, prefixes: any, base: any): any;
    parseURI(uri: any): any;
    process(node: any, options: any): void;
    push(parent: any, subject: any): {
        parent: any;
        subject: any;
        parentObject: null;
        incomplete: never[];
        listMapping: any;
        language: any;
        prefixes: any;
        terms: any;
        vocabulary: any;
    };
    resolveAndNormalize(base: any, uri: any): string;
    setContext(node: any): void;
    setHTMLContext(): void;
    inHTMLMode: boolean | undefined;
    setInitialContext(): void;
    setXHTMLContext(): void;
    setXMLContext(): void;
    tokenize(str: any): any;
    toRDFNodeObject(x: any): any;
    trim(str: any): any;
}
declare namespace RDFaProcessor {
    let XMLLiteralURI: string;
    let HTMLLiteralURI: string;
    let PlainLiteralURI: string;
    let objectURI: string;
    let typeURI: string;
    let nameChar: string;
    let nameStartChar: string;
    let NCNAME: RegExp;
    let dateTimeTypes: {
        pattern: RegExp;
        type: string;
    }[];
}
export default RDFaProcessor;
export function parseRDFaDOM(dom: any, kb: any, base: any): void;
