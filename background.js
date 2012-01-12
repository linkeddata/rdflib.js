/* requests */

function onBeforeSendHeaders(d) {}

/* responses */

var _r = {};
function init(d) { _r[d.requestId] = true; }
function tracking(d) { return _r[d.requestId] == true; }
function finish(d) {
    if (tracking(d)) {
        chrome.tabs.update(d.tabId, {
            url: chrome.extension.getURL('tabulator.html?url='+encodeURI(d.url))
        });
    }
    delete _r[d.requestId];
}

function onHeadersReceived(d) {
    for (var i in d.responseHeaders) {
        var header = d.responseHeaders[i];
        if (header.name && header.name.match(/content-type/i) && header.value.match(/text\/(n3|turtle)/)) {
            init(d);
            return { cancel: true };
        }
    }
}

function onBeforeRedirect(d) {}
function onCompleted(d) { return finish(d); }
function onErrorOccurred(d) { return finish(d); }

var events = ['onHeadersReceived', 'onCompleted'];
(function setup(api) {
    api.onErrorOccurred.addListener(onErrorOccurred, {types: ['main_frame']});
    for (j in events)
        if (api[events[j]])
            api[events[j]].addListener(eval(events[j]), {types: ["main_frame"]}, ['responseHeaders' /*TODO:,'blocking'*/]);
})(chrome.webRequest || chrome.experimental.webRequest);
