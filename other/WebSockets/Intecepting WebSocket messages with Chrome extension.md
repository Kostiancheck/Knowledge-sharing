# Problem
I want to analyze my GeoGuessr party games. I am looking for game history, and find none. I am sad.
# Solution
Obviously, I need to collect this data myself while we are playing. Since GeoGuessr is a browser game, browser extension looks like a way to go.

Unfortunately, browsers do not expose WebSocket messages the same way they do it for regular HTTP requests[1]. So we'll need to turn to hacks.
## Chrome
Good thing is that both Chrome and Firefox expose open WebSocket connections and their messages in a debugger. But only Chrome allows inspecting debugger from extension. 

![[Pasted image 20240821165058.png]]

Core piece of code to intercept WebSocket messages in Chrome looks like this:
``` js
chrome.debugger.onEvent.addListener(function (source, method, params) {

    if (method === "Network.webSocketFrameReceived") {

        data = JSON.parse(params["response"]["payloadData"]);

        console.log("WebSocket Frame Received:", data);

        doSomething(data);
    }

});
```

# Firefox
According to this[2] SO answer, you can monkey-patch WebSocket constructor to trigger some function when receiving messages:
```javascript
(function() {
    var OrigWebSocket = window.WebSocket;
    var callWebSocket = OrigWebSocket.apply.bind(OrigWebSocket);
    var wsAddListener = OrigWebSocket.prototype.addEventListener;
    wsAddListener = wsAddListener.call.bind(wsAddListener);
    window.WebSocket = function WebSocket(url, protocols) {
        var ws;
        if (!(this instanceof WebSocket)) {
            // Called without 'new' (browsers will throw an error).
            ws = callWebSocket(this, arguments);
        } else if (arguments.length === 1) {
            ws = new OrigWebSocket(url);
        } else if (arguments.length >= 2) {
            ws = new OrigWebSocket(url, protocols);
        } else { // No arguments (browsers will throw an error)
            ws = new OrigWebSocket();
        }

        wsAddListener(ws, 'message', function(event) {
            // TODO: Do something with event.data (received data) if you wish.
        });
        return ws;
    }.bind();
    window.WebSocket.prototype = OrigWebSocket.prototype;
    window.WebSocket.prototype.constructor = window.WebSocket;

    var wsSend = OrigWebSocket.prototype.send;
    wsSend = wsSend.apply.bind(wsSend);
    OrigWebSocket.prototype.send = function(data) {
        // TODO: Do something with the sent data if you wish.
        return wsSend(this, arguments);
    };
})();
```


# Conclusion
Intercepting WebSocket messages turned out to be not so straightforward as I expected, but it is still doable.
# Sources
1. Intercepting HTTP requests https://demaga.github.io/jekyll/update/2024/05/29/crusade-against-youtube-shorts.html
2. Intercepting WebSocket messages https://stackoverflow.com/questions/31181651/inspecting-websocket-frames-in-an-undetectable-way