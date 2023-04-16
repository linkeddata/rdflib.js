export default function createSerializer(store: any): Serializer;
export class Serializer {
    constructor(store: any);
    flags: string;
    base: any;
    prefixes: string[];
    namespaces: any[];
    namespacesUsed: any[];
    keywords: string[];
    prefixchars: string;
    incoming: {} | null;
    formulas: any[];
    store: any;
    rdfFactory: any;
    xsd: {
        boolean: NamedNode;
        dateTime: NamedNode;
        decimal: NamedNode;
        double: NamedNode;
        integer: NamedNode;
        langString: NamedNode;
        string: NamedNode;
    };
    setBase(base: any): Serializer;
    setFlags(flags: any): Serializer;
    toStr(x: any): any;
    fromStr(s: any): any;
    /**
     * Defines a set of [prefix, namespace] pairs to be used by this Serializer instance.
     * Overrides previous prefixes if any
     * @param namespaces
     * @return {Serializer}
     */
    setNamespaces(namespaces: any): Serializer;
    /**
     * Defines a namespace prefix, overriding any existing prefix for that URI
     * @param prefix
     * @param uri
     */
    setPrefix(prefix: any, uri: any): void;
    suggestPrefix(prefix: any, uri: any): void;
    suggestNamespaces(namespaces: any): Serializer;
    checkIntegrity(): void;
    makeUpPrefix(uri: any): any;
    rootSubjects(sts: any): {
        roots: any[];
        subjects: {};
        rootsHash: {};
        incoming: {};
    };
    toN3(f: any): string;
    _notQNameChars: string;
    _notNameChars: string;
    explicitURI(uri: any): string;
    statementsToNTriples(sts: any): string;
    statementsToN3(sts: any): string;
    defaultNamespace: string | undefined;
    atomicTermToN3(expr: any, stats: any): any;
    validPrefix: RegExp;
    forbidden1: RegExp;
    forbidden3: RegExp;
    stringToN3(str: any, flags: any): string;
    symbolToN3(x: any): any;
    writeStore(write: any): void;
    statementsToXML(sts: any): string;
    statementsToJsonld(sts: any): string;
}
import NamedNode from './named-node';
