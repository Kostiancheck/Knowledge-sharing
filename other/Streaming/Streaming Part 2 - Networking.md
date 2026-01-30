# Theory

There are basically only 3 approaches

**Send full frame**
Encode each frame as a full individual image. Open UDP connection, send images as they come. If one of them is lost along the way, who cares.
e.g. MJPEG streams

**Send video segment**
Wait until we've got 10 frames or so. Encode them with interframe algorithm like h.265 into a single video. Open TCP connection, send video. Keep connection open for sending more videos as they come.
e.g. h.264 streams

**Send changes only**
This is basically a distributed version of interframe algorithm. I think something similar is called 'Distributed Video Coding', but it seems they mostly focus on environments with low-power encoder (drone, webcam etc).
Is it underexplored territory?
# Protocols
We are already familiar with the most important ones

**UDP**: just send packet
**TCP**: keep sending packet until received

But there is a specialized protocol developed specifically for our use case.

[**RTP**](https://developer.mozilla.org/en-US/docs/Glossary/RTP): Real-time Transport Protocol

RTP is specifically designed for low-latency, sends sequence-numbered and timestamped packets for reassembly if received out of order. It should support 'multicast' (One->One->Many), so could be useful.

Ironically, many articles around RTP focus on WebRTC, so it's hard to find relevant information.
# How pros do it
It's really hard to know how Twitch streams, because they have to use CDN due to their volumes. You can see that several times per second they make two consequential requests: one gives them list of CDN links with timestamps, and the other request is to the CDN. The only thing I can tell is that segments are about 2 seconds. I guess it's okay latency for One->Many type of streams.

Rezka, on the other hand, is much more transparent. They also stream in segments, the original file is in .mp4 container (likely h.264 encoded). They also use [HLS](https://www.cloudflare.com/learning/video/what-is-http-live-streaming/) (HTTP Live Streaming). HLS is basically streaming h.264 / h.265 video segments over the open HTTP connection. The issue with this is that it uses TCP. The argument for this is 'The modern Internet is more reliable and more efficient than it was when streaming was first developed' and 'A few extra seconds of lag does not impact the user experience as much as missing video frames would'. It is true for Rezka, but not so much for us. I am not yet convinced it will be an issue. It might be.

YouTube live streams use [HTTP/3](https://github.com/gsuberland/UMP_Format/blob/main/UMP_Format.md) with custom [UMP](https://github.com/gsuberland/UMP_Format/blob/main/UMP_Format.md) data format. A connection stays open for several seconds. I don't know if handshake is being done on the next request, but they do appear as separate requests in dev tools. HTTP/3 uses UDP, which might be good for us in terms of latency. However, everything has to be encrypted and 'easy network switch' feature is useless for us (does it add overhead for us?). Also, it is not clear how we can utilize it, unless we stream literally every frame. 

YouTube approach seems to be the best, but also the hardest. It requires either sending entire frames (intraframe encoding), or some sophisticated client stuff. 

# Sources
1. https://developer.mozilla.org/en-US/docs/Glossary/RTP
2. https://www.cloudflare.com/learning/video/what-is-http-live-streaming/
3. https://github.com/bluenviron/mediamtx