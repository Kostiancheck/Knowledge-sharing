## Links
- https://webrtcforthecurious.com/
- https://ossrs.net/lts/en-us/docs/v6/doc/getting-started
- https://github.com/pion/webrtc

# Basic overview
WebRTC, short for Web Real-Time Communication, is both an API and a Protocol. The WebRTC protocol is a set of rules for two WebRTC agents to negotiate *bi-directional* secure real-time communication. 

A similar relationship would be the one between HTTP and the Fetch API. The WebRTC protocol would be HTTP, and the WebRTC API would be the Fetch API.

We can break this topic into 4 steps:
1. Signaling
2. Connecting
3. Securing
4. Communicating

These steps are sequential, which means the prior step must be 100% successful for the subsequent step to begin.

One peculiar fact about WebRTC is that each step is actually made up of many other protocols! To make WebRTC, we stitch together many existing technologies. In that sense, you can think of WebRTC as being more a combination and configuration of well-understood tech dating back to the early 2000s than as a brand-new process in its own right.

WebRTC solves a lot of problems. At first glance the technology may seem over-engineered, but the genius of WebRTC is its humility. It wasn’t created under the assumption that it could solve everything better. Instead, it embraced many existing single purpose technologies and brought them together into a streamlined, widely applicable bundle.

This allows us to examine and learn each part individually without being overwhelmed. A good way to visualize it is a ‘WebRTC Agent’ is really just an orchestrator of many different protocols.

![[Pasted image 20260311184225.png]]

# Signaling
When a WebRTC Agent starts, it has no idea who it is going to communicate with or what they are going to communicate about. The _Signaling_ step with help of **Session Description Protocol** (SDP) solves this issue! Signaling is used to bootstrap the call, allowing two independent WebRTC agents to start communicating.

![[Pasted image 20260311184049.png]]

The Session Description Protocol is defined in [RFC 8866](https://tools.ietf.org/html/rfc8866). It is a key/value protocol with a newline after each value. It will feel similar to an INI file.

## How to read SDP
Every line in a Session Description will start with a single character, this is your key. It will then be followed by an equal sign. Everything after that equal sign is the value. After the value is complete, you will have a newline.
Not all key values defined by the Session Description Protocol are used by WebRTC. Only keys used in the JavaScript Session Establishment Protocol (JSEP), defined in [RFC 8829](https://datatracker.ietf.org/doc/html/rfc8829), are important. The following seven keys are the only ones you need to understand right now:

- `v` - Version, should be equal to `0`.
- `o` - Origin, contains a unique ID useful for renegotiations.
- `s` - Session Name, should be equal to `-`.
- `t` - Timing, should be equal to `0 0`.
- `m` - Media Description (`m=<media> <port> <proto> <fmt> ...`), described in detail below.
- `a` - Attribute, a free text field. This is the most common line in WebRTC.
- `c` - Connection Data, should be equal to `IN IP4 0.0.0.0`.

## Media Descriptions detail
A Session Description can contain an unlimited number of Media Descriptions.

A Media Description definition contains a list of formats. These formats map to RTP Payload Types. The actual codec is then defined by an Attribute with the value `rtpmap` in the Media Description. The importance of RTP and RTP Payload Types is discussed later in the Media chapter. Each Media Description can contain an unlimited number of attributes.

Take this Session Description excerpt as an example:

```
v=0
m=audio 4000 RTP/AVP 111
a=rtpmap:111 OPUS/48000/2
m=video 4000 RTP/AVP 96
a=rtpmap:96 VP8/90000
a=my-sdp-value
```

You have two Media Descriptions, one of type audio with fmt `111` and one of type video with the format `96`. The first Media Description has only one attribute. This attribute maps the Payload Type `111` to Opus. The second Media Description has two attributes. The first attribute maps the Payload Type `96` to be VP8, and the second attribute is just `my-sdp-value`.

## SDP Values used by WebRTC
- **`group:BUNDLE`** — Run multiple media streams over one connection (preferred over per-stream connections).
- **`fingerprint:sha-256`** — Hash of the peer's DTLS certificate. Verified after handshake to confirm identity.
- **`setup:`** — Determines DTLS role after ICE connects:
	- `active` — DTLS Client
	- `passive` — DTLS Server
	- `actpass` — Let the other peer decide
- **`mid`** — Identifies a media stream within the session description.
- **`ice-ufrag`** — ICE user fragment; used for traffic authentication.
- **`ice-pwd`** — ICE password; used for traffic authentication.
- **`rtpmap`** — Maps a codec to an RTP Payload Type (assigned per-call by the offerer).
- **`fmtp`** — Extra parameters for a Payload Type (e.g. video profile, encoder settings).
- **`candidate`** — An ICE candidate: a possible address the agent can be reached at.
- **`ssrc`** — Identifies a single media track. `label` = stream ID, `mslabel` = container ID (can hold multiple streams).
## Full example of SDP message
```
v=0
o=- 3546004397921447048 1596742744 IN IP4 0.0.0.0
s=-
t=0 0
a=fingerprint:sha-256 0F:74:31:25:CB:A2:13:EC:28:6F:6D:2C:61:FF:5D:C2:BC:B9:DB:3D:98:14:8D:1A:BB:EA:33:0C:A4:60:A8:8E
a=group:BUNDLE 0 1
m=audio 9 UDP/TLS/RTP/SAVPF 111
c=IN IP4 0.0.0.0
a=setup:active
a=mid:0
a=ice-ufrag:CsxzEWmoKpJyscFj
a=ice-pwd:mktpbhgREmjEwUFSIJyPINPUhgDqJlSd
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:111 opus/48000/2
a=fmtp:111 minptime=10;useinbandfec=1
a=ssrc:350842737 cname:yvKPspsHcYcwGFTw
a=ssrc:350842737 msid:yvKPspsHcYcwGFTw DfQnKjQQuwceLFdV
a=ssrc:350842737 mslabel:yvKPspsHcYcwGFTw
a=ssrc:350842737 label:DfQnKjQQuwceLFdV
a=msid:yvKPspsHcYcwGFTw DfQnKjQQuwceLFdV
a=sendrecv
a=candidate:foundation 1 udp 2130706431 192.168.1.1 53165 typ host generation 0
a=candidate:foundation 2 udp 2130706431 192.168.1.1 53165 typ host generation 0
a=candidate:foundation 1 udp 1694498815 1.2.3.4 57336 typ srflx raddr 0.0.0.0 rport 57336 generation 0
a=candidate:foundation 2 udp 1694498815 1.2.3.4 57336 typ srflx raddr 0.0.0.0 rport 57336 generation 0
a=end-of-candidates
m=video 9 UDP/TLS/RTP/SAVPF 96
c=IN IP4 0.0.0.0
a=setup:active
a=mid:1
a=ice-ufrag:CsxzEWmoKpJyscFj
a=ice-pwd:mktpbhgREmjEwUFSIJyPINPUhgDqJlSd
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:96 VP8/90000
a=ssrc:2180035812 cname:XHbOTNRFnLtesHwJ
a=ssrc:2180035812 msid:XHbOTNRFnLtesHwJ JgtwEhBWNEiOnhuW
a=ssrc:2180035812 mslabel:XHbOTNRFnLtesHwJ
a=ssrc:2180035812 label:JgtwEhBWNEiOnhuW
a=msid:XHbOTNRFnLtesHwJ JgtwEhBWNEiOnhuW
a=sendrecv
```

This is what we know from this message:

- We have two media sections, one audio and one video.
- Both of them are `sendrecv` transceivers. We are getting two streams, and we can send two back.
- We have ICE Candidates and Authentication details, so we can attempt to connect.
- We have a certificate fingerprint, so we can have a secure call.

# Connecting
Most applications deployed today establish client/server connections. WebRTC doesn’t use a client/server model, it establishes peer-to-peer (P2P) connections. Establishing peer-to-peer connectivity can be difficult though. These agents could be in different networks with no direct connectivity. In situations where direct connectivity does exist you can still have other issues. In some cases, your clients don’t speak the same network protocols (UDP <-> TCP) or maybe use different IP Versions (IPv4 <-> IPv6).

## ICE
ICE is a protocol that tries to find the best way to communicate between two ICE Agents. Each ICE Agent publishes the ways it is reachable, these are known as candidates. A candidate is essentially a transport address of the agent that it believes the other peer can reach. ICE then determines the best pairing of candidates.
Most of the time the other WebRTC Agent will not even be in the same network. A typical call is usually between two WebRTC Agents in different networks with no direct connectivity.
![[Pasted image 20260311185815.png]]

> **Protocol Restrictions** 
> Some networks don’t allow UDP traffic at all, or maybe they don’t allow TCP. Some networks may have a very low MTU (Maximum Transmission Unit). There are lots of variables that network administrators can change that can make communication difficult.
> 
> **Firewall/IDS Rules**
> Another is “Deep Packet Inspection” and other intelligent filtering. Some network administrators will run software that tries to process every packet. Many times this software doesn’t understand WebRTC, so it blocks it because it doesn’t know what to do, e.g. treating WebRTC packets as suspicious UDP packets on an arbitrary port that is not whitelisted.

## NAT Mapping
NAT (Network Address Translation) is what makes WebRTC peer-to-peer connectivity possible across different subnets — without any relay or proxy.

Agent 1 (192.168.0.1) sits behind Router A (public IP 5.0.0.1), Agent 2 (192.168.0.1) behind Router B (5.0.0.2). Traffic flows directly between them through the public internet, with each router handling the address translation transparently.
![[Pasted image 20260311190157.png]]
To connect, Agent 1 opens port 7000, creating a NAT binding: `192.168.0.1:7000` → `5.0.0.1:7000`. Agent 2 can then reach Agent 1 via `5.0.0.1:7000` — essentially automatic port forwarding.

The catch: NAT mapping behavior varies across ISPs, hardware, and network configs — some may disable it entirely. The saving grace is that ICE Agents can detect and verify whatever mapping exists, including its specific behavior.

## Process of creating a mapping
Creating a mapping is the easiest part. When you send a packet to an address outside your network, a mapping is created! A NAT mapping is just a temporary public IP and port that is allocated by your NAT. The outbound message will be rewritten to have its source address given by the newly mapping address. If a message is sent to the mapping, it will be automatically routed back to the host inside the NAT that created it. 
*The details around mappings is where it gets complicated.*

**Mapping Creation**

- **Endpoint-Independent** — One mapping per sender, reused for all destinations. Best case; at least one peer must be this type for a call to work.
- **Address Dependent** — New mapping per unique remote host, but same host on different ports reuses it.
- **Address & Port Dependent** — New mapping for any change in remote IP or port.

**Mapping Filtering**

- **Endpoint-Independent** — Anyone can send to the mapping.
- **Address Dependent** — Only the original remote host can respond; others are dropped.
- **Address & Port Dependent** — Only the exact host:port the mapping was created for can respond.

**Mapping Refresh** — Unused mappings are typically destroyed after 5 minutes (ISP/hardware dependent).

## STUN
STUN (Session Traversal Utilities for NAT) is a protocol that was created just for working with NATs.
STUN solves a key problem: you can create a NAT mapping, but you don't know its public IP and port. STUN lets you both create the mapping and discover its details — which you then share with peers so they can reach you.

In short: your WebRTC agent sends a request to a STUN server (outside your NAT), which replies with the public IP:port it sees. That's your mapping — ready to share.

Every STUN packet has the following structure:
```
0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|0 0|     STUN Message Type     |         Message Length        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                         Magic Cookie                          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
|                     Transaction ID (96 bits)                  |
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                             Data                              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```
Each STUN packet has a type. For now, we only care about the following:
- Binding Request - `0x0001`
- Binding Response - `0x0101`
To create a NAT mapping we make a `Binding Request`. Then the server responds with a `Binding Response`.
#### Message Length
This is how long the `Data` section is. This section contains arbitrary data that is defined by the `Message Type`.
#### Magic Cookie
The fixed value `0x2112A442` in network byte order, it helps distinguish STUN traffic from other protocols.
#### Transaction ID
A 96-bit identifier that uniquely identifies a request/response. This helps you pair up your requests and responses.
#### Data
Data will contain a list of STUN attributes. A STUN Attribute has the following structure:

```
0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|         Type                  |            Length             |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                         Value (variable)                ....
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

The `STUN Binding Request` uses no attributes. This means a `STUN Binding Request` contains only the header.

The `STUN Binding Response` uses a `XOR-MAPPED-ADDRESS (0x0020)`. This attribute contains an IP and port. This is the IP and port of the NAT mapping that is created!

> Creating a NAT mapping using STUN just takes sending one request! You send a `STUN Binding Request` to the STUN Server. The STUN Server then responds with a `STUN Binding Response`. This `STUN Binding Response` will contain the `Mapped Address`. The `Mapped Address` is how the STUN Server sees you and is your `NAT mapping`. The `Mapped Address` is what you would share if you wanted someone to send packets to you.
> 
> People will also call the `Mapped Address` your `Public IP` or `Server Reflexive Candidate`

Unfortunately, the `Mapped Address` might not be useful in all cases. If it is `Address Dependent`, only the STUN server can send traffic back to you. If you shared it and another peer tried to send messages in they will be dropped. 😥
## TURN
> ***We don't need this in our realisation, cause we actually don't use P2P, because we have server, so this is just for knowledge*** 

TURN is the fallback when direct peer connection isn't possible — incompatible NAT types, protocol mismatch, or for privacy (hides your real IP).

A TURN server acts as a proxy: the client connects and creates an **Allocation**, receiving a temporary **Relayed Transport Address** (IP/Port/Protocol). Share this address with peers instead of your real one. Each peer needs an explicit **Permission** before they can send you traffic.

All traffic flows through the TURN server — peers see it as the source, never the real client.

**Allocations** — The core of TURN. Connect to the server (port `3478`) with username/password and chosen transport (UDP/TCP). On success you get:

- `XOR-MAPPED-ADDRESS` — Where the server forwards incoming data to you.
- `RELAYED-ADDRESS` — The address you share with peers.
- `LIFETIME` — TTL; send a `Refresh` before it expires.

**Permissions** — Before a peer can send to your relay, you must whitelist their IP:port _as seen by the TURN server_. They should run a STUN binding request against the same TURN server — using a different server creates a different mapping and all traffic gets dropped. Permissions expire after 5 minutes.

**Sending Data** — Two options:

- `SendIndication` — Self-contained, but repeats the peer's IP every message. Fine for occasional sends.
- `ChannelData` — Maps a peer to a ChannelId; server fills in the IP. Better for high-frequency traffic.

**Refresh** — Allocations auto-destroy at `LIFETIME`. Client must refresh proactively.

**Topology** — Usually one side is the TURN client, the other connects directly. If both peers block UDP, both can use TURN via TCP simultaneously.
![[Pasted image 20260311192349.png]]


## ICE one more time ))))
ICE is the protocol WebRTC uses to find and establish the best connection between two agents.

It collects all possible addresses from both peers — local IPs, NAT mappings, TURN relay addresses — and pairs them up as **Candidate Pairs**. Agents then probe each pair with STUN ping packets (connectivity checks) until one succeeds. After that, it's a normal socket connection.

**Creating an ICE Agent**

Each agent is either `Controlling` (decides the final pair; usually the offerer) or `Controlled`. Both sides exchange a `user fragment` and `password` via the Session Description before checks begin — used to authenticate and integrity-check every STUN packet.

**Candidate Gathering**

- **Host** — Direct local IP:port (UDP or TCP).
- **mDNS** — Like Host, but IP is hidden behind a UUID. Works only on the same network; better for privacy.
- **Server Reflexive** — Public IP:port returned by a STUN server (`XOR-MAPPED-ADDRESS`).
- **Peer Reflexive** — Discovered when a peer sees you from an unknown address mid-check and reflects it back.
- **Relay** — `RELAYED-ADDRESS` from a TURN server; last resort.
### Candidate Selection

The Controlling and Controlled Agent both start sending traffic on each pair. This is needed if one Agent is behind an `Address Dependent Mapping`, this will cause a `Peer Reflexive Candidate` to be created.

Each `Candidate Pair` that saw network traffic is then promoted to a `Valid Candidate` pair. The Controlling Agent then takes one `Valid Candidate` pair and nominates it. This becomes the `Nominated Pair`. The Controlling and Controlled Agent then attempt one more round of bi-directional communication. If that succeeds, the `Nominated Pair` becomes the `Selected Candidate Pair`! This pair is then used for the rest of the session.

### Restarts

If the `Selected Candidate Pair` stops working for any reason (NAT mapping expires, TURN Server crashes) the ICE Agent will go to `Failed` state. Both agents can be restarted and will do the whole process all over again.

## TODO:
- Securing
- Media/Data Communication
- SFU
- So more !