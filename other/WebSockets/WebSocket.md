# Problem
We are developing GeoGuessr. People are playing, people love our product, everything's great. But there's one issue. Imagine you play Geoguessr with 2 friends. You spawn in Monaco. Everyone knows it's Monaco. Everyone clicks Monaco in 5 seconds. But... Round is 40 seconds. So everybody sits and waits for 35 seconds. That's not good.

We want the round to end automatically if everybody has already made their guess.

How do we achieve this?

# Possible solutions
## Short-polling
![[Pasted image 20240821100727.png]]

Let's make a GET request *every 3 seconds* to know if everyone has made a guess. Since we need to update UI for every player, every player has to do short-polling. 
In our party setting, we have 3 players and rounds of 40 seconds. It means that in worst-case scenario, server will receive *3 * (40 / 3)=40 GET requests*. Plus 3 POST requests for players' guesses. It's not the end of the world, but what if we have thousands of these games going on? This might be too much.
And, in worst-case scenario players might experience 3 second delay between last player making a guess and UI updating. Not good.
## Long-polling
![[Pasted image 20240821100924.png]]

Let's make a GET request, and if not all players have made their guess, we'll just leave connection open and wait until they have. Every player should have this long-polling connection, so it leaves 3 connections open. And once all players make their guess, everyone will receive a response. Not bad. We had 40 requests, now we have 3.

We implement it. It works. Yay. But then, we decide that we want to know when every individual player has made a guess. So you can see if everyone else have made their guess and hurry up. The way long-polling works, we would receive a response after any of players made a guess. So, to get a status of other players, you have to resend this request and reopen long-polling connection. In theory, for 3 players we might open/close long-polling connection 9 times. 9 requests is still better than 40, even taking into account re-opening connection.
BUT if we have 10 players, one round will have 10 * 10 = 100 requests. And those requests are even worse than regular requests, because of the hanging connection. Not so good anymore. And it grows fast. We wanted to support up to 100 players, but 100 * 100 = 10000 requests and connection re-openings is very bad. In this case, we would be better off returning to short-polling. Or...
## Server-Sent Events
![[Pasted image 20240821101518.png]]

I know how to fix it! Why don't we leave the connection open? This way, we won't have to reconnect after every player's guess.
There is a technology that achieves exactly this: Server-Sent Events (SSE).
SSE is basically an open **one-directional HTTP connection** that allows sending data from server to client through HTTP stream. Messages are always UTF-8 strings. Stream doesn't close after message has been sent. Perfect. 
So since we only guess once, we send our guess through HTTP POST request, and receive updates from other players via SSE.
This way, we make *3 HTTP requests* (1 for each player) and maintain *3 HTTP streams with 3 messages each*. Way better. And it would scale OK-ish for 100 players.

But you know, we also have this game mode where players play as a team and try to guess specific location precisely. It would really help if I knew where other players placed their pins on the map, so we can discuss potential answers. Receiving those events would be easy - I already have an HTTP stream open. But I also need to send much more events. I place a pin like 100 times each round. It means *100 * 3 = 300* more POST requests per round for 3 players. Not good.
## Websockets
![[Pasted image 20240821102348.png]]

Okay, fuck it. Let's open a bidirectional HTTP connection between each client and our server and never close it. Now, if any player makes a guess, we'll just iterate over all open connections and send other players a response. 

And you know what, since it's not really a request-response HTTP thing, we can ditch HTTP alogether. Let's make it a TCP connection and just send binary messages, without those big plaintext headers. They wouldn't carry any important information anyway.

Now, we still have those 300 "requests" for every bullseye round, but this time we already have all the connections open. And we don't waste bandwith on request/response headers. Life's good.

# Theory
WebSocket is a **protocol for bidirectional communication over TCP connection**.

![[Pasted image 20240812170956.png]]


WebSocket messages don't have much overhead like HTTP headers, status codes etc. So they fit great for transferring small simple messages quickly.

Important concepts in WS:
- It's build upon TCP stack. For WS to work, connection must stay open. So you need a **specific kind of TCP socket connection** that allows half-open[4] state (so you can reconnect), has keepalive[5] (so connection doesn't close after 1st message), 0 delay before sending messages and no timeout.
- First you perform **HTTP Upgrade** request (kind of like handshake) to establish proper WS connection.
- Since TCP connection is always open, you have to handle closing it yourself. For this, **Ping/Pong Frames** are defined[5]. Both client and sever can send a Ping Frame and the responder has to send back Pong Frame as soon as possible, so that requester knows connection is still alive. If no Ping/Pong Frame was received in the last X seconds, one of the parties may decide to close connection.
- Since it is TCP connection rather than HTTP connection, you have to handle reconnections yourself. Or use one of many WebSocket libraries like socket.io
- Data sent could be either "string", "Blob", "ArrayBuffer" or "ArrayBufferView" (see [1] -> CTRL+F "The `send(data)` method steps" for more details). This means you can send **either plaintext or binary data**.

When NOT to use WebSockets?
Well, if you don't have constant two-way messaging going on, you shouldn't. Because having an open connection is expensive. It's like being constantly long-polling for some response. Sometimes, you only need to *receive* updates. In these cases, use polling or server-sent events[8]. SSE is basically one-way open HTTP connection with simple text messages being sent via it.
Another thing to be aware: it's common for some devices, as well as for some vpn and/or network providers to shut down "idle" connections. So if your application assumes that you will have a websocket connection open for hours, it might not work as expected. Geoguessr closes connection after each game and has a stategy for reconnecting players, so it's okay.

> WebSockets are great when used in _addition to_ polling. This way, you can design a system that doesn't result in missed events. Example: have a /events?fromTS=123 endpoint.
> Use S, and then poll the event log when required (like on reconnect, etc).

It seems like WebTransport[2] is a candidate to replace WebSockets. WebTransport is an API offering low-latency, bidirectional, client-server messaging based on HTTP/3 protocol that makes heavy use of QUIC protocol under the hood.
AFAIK, most of the Internet runs on HTTP/1.1, so we are still pretty far away from WebTransport.
# Conclusion
Best tool for each task.

Don't care about latency but want to refresh data every X seconds? Sure, you can go with short-polling. Example: fetch new blog posts.
Have some long-running task and want the result as soon as it's ready? Use long-polling. Example: generating PDF from CV on job site.
Need real time notification/messages in a *web application*? Use WebSockets. Example: collaboration tool for online document editing with multiple editors.
Need to receive updates frequently, but don't need to send any data? Use Server-Sent Events (SSE)[8]. 

# Sources:
1. WebSocket spec https://websockets.spec.whatwg.org/#network-intro
2. WebTransport https://developer.chrome.com/docs/capabilities/web-apis/webtransport
3. Implementing websockets https://cookie.engineer/weblog/articles/implementers-guide-to-websockets.html#/decoding-logic
4. Half-open https://en.wikipedia.org/wiki/TCP_half-open
5. Keepalive https://tldp.org/HOWTO/TCP-Keepalive-HOWTO/overview.html#whatis
6. Ping/Pong frames https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers#pings_and_pongs_the_heartbeat_of_websockets
7. TCP/IP https://www.youtube.com/watch?v=3b_TAYtzuho
8. Server-sent events https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
9. Diagrams in SO question explaining difference https://stackoverflow.com/questions/11077857/what-are-long-polling-websockets-server-sent-events-sse-and-comet
10. Server-sent events spec https://html.spec.whatwg.org/multipage/server-sent-events.html