export class UpdatesSocket {
    constructor(parent: any, via: any);
    parent: any;
    via: any;
    connected: boolean;
    pending: {};
    subscribed: {};
    socket: {};
    _decode(q: any): {};
    _send(method: any, uri: any, data: any): any;
    _subscribe(uri: any): any;
    onClose(e: any): {};
    onError(e: any): void;
    onMessage(e: any): any;
    onOpen(e: any): any[];
    subscribe(uri: any): any;
}
export class UpdatesVia {
    constructor(fetcher: any);
    fetcher: any;
    graph: {};
    via: {};
    onHeaders(d: any): boolean;
    onUpdate(uri: any, d: any): any;
    register(via: any, uri: any): any;
}
