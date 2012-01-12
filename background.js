/* requests */

function onBeforeSendHeaders(d) {
    for (var i in d.requestHeaders) {
        var header = d.requestHeaders[i];
        if (header.name && header.name.toLowerCase() == 'accept') {
            header.value += ',text/turtle,application/rdf+xml';
            break;
        }
    }
    return {requestHeaders: d.requestHeaders};
}

/* responses */

var _r = {};
function init(d) { _r[d.requestId] = true; }
function tracking(d) { return _r[d.requestId] == true; }
function finish(d) {
    if (tracking(d)) {
        chrome.tabs.update(d.tabId, {
            url: chrome.extension.getURL('tabulator.html?uri='+encodeURIComponent(d.url))
        });
        delete _r[d.requestId];
        return { cancel: true };
    }
}

function onHeadersReceived(d) {
    for (var i in d.responseHeaders) {
        var header = d.responseHeaders[i];
        if (header.name && header.name.match(/content-type/i)
                        && header.value.match(/\/(n3|rdf|turtle)/))
            init(d);
    }
    return finish(d);
}

function onBeforeRedirect(d) {}

function onCompleted(d) { return finish(d); }
function onErrorOccurred(d) { return finish(d); }

var events = {
    'onBeforeSendHeaders': ['requestHeaders', 'blocking'],
    'onHeadersReceived': ['responseHeaders', 'blocking']
    //'onCompleted': ['responseHeaders']
};
(function setup(api) {
    api.onErrorOccurred.addListener(onErrorOccurred, {types: ['main_frame']});
    for (j in events)
        if (api[j])
            api[j].addListener(eval(j), {types: ["main_frame"]}, events[j]);
})(chrome.webRequest || chrome.experimental.webRequest);
