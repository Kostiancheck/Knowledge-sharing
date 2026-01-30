The basic idea of streaming is:
- capture a frame
- send it over the Internet to another client
- display the frame
Let's try to focus on #1 first
# Windows
There are two primary APIs you can use for frame capture in Windows:
- [Windows.Graphics.Capture](https://learn.microsoft.com/en-us/uwp/api/windows.graphics.capture?view=winrt-26100)
- [Desktop Duplication API](https://learn.microsoft.com/en-us/windows/win32/direct3ddxgi/desktop-dup-api)

Desktop Duplication API has **GetFrameMoveRects** and **GetFrameDirtyRects** methods. Unfortunately, they might not do what you think they do.

GetFrameMoveRects does NOT tell you which 500x500 pixel block or whatever did not change but rather moved or rotated (which would be a great compression tool for top-down games, maps etc). Instead, it tells you when the entire application window moved or minimized/maximized. Totally useless for our purposes.

GetFrameDirtyRects does what you think it does. It sends you only the regions where pixels changed since the last frame. Unfortunately, it more often than not marks the entire screen as 1 'changed' region. Especially when you have one maximized application running.

Even if it had smarter region detection algorithm in place, it would still be mostly useless for us, since pixels as they are do change a lot. However, if we could compress colors *before* detecting changed regions, that would save us a lot of space. But that is a discussion for another day.

Windows.Graphics.Capture is a newer one. From what I've read, it might be a tiny bit less efficient than Desktop Duplication API, and it only allows capturing entire frame (entire desktop / entire application window / fixed region). But it should be easier to use, thus have wider library support. Initially I wanted to go with Desktop Duplication API, but since it doesn't do what I thought it does, we might as well choose a hotter younger option.
# Linux
Gotcha. I love Linux, but it is not relevant for our application today.
# Output
When you capture a frame with Windows.Graphics.Capture, it is literally a single array of length (screen_width\*screen_height) that contains uint8 numbers representing currently displayed image in BGRA8 format. It's trivial to convert to RGBA if needed, and you can make it a matrix if you like, but that's about it.

For my monitor, that would be more than 3.5\*4 million integers. Even with all the smart stuff like leveraging the fact that they're unsigned and limited to 0-255 range, it is still a lot of data per frame. So we need to compress it.
# Encoding

![[Pasted image 20260129154740.png]]

![[Pasted image 20260129154813.png]]

A good example of *intraframe* algorithm is MJPEG, which is literally a sequence of JPEG images. It has several advantages because of that:
1) you can send them as they come, with or without batching
2) you can view them individually
3) you can fast-forward / jump to any frame easily
MJPEG is popular among older software and stuff like webcam footage. A lot of open source 'streaming' projects also use MJPEG, probably due to simplicity of implementation and wide range of compatible clients. But it is obviously not a good fit for our purposes.

Among *interframe* algorithms, the most popular are h.264 (AVC) and h.265 (HEVC). They have *key frames*, which are full frames, and inter frames, which are all the frames in between key frames. The lengthier the distance between keyframes, the more efficient the compression. It also depends on content too (i.e. how many pixels actually changed).

Unlike inter frames, key frames are actual independent images. So in theory they can be displayed individually, like a JPEG. For h.264 key frame format is called IDR (or I-frame). For h.265 - HEIC.

There is also [AV1](https://en.wikipedia.org/wiki/AV1). It is the most modern codec, is open source, even more space-efficient than h.265. Unfortunately, my GPU does not support it. GPU support only starts from 40-series. But I think AV1 is the correct choice for the future applications. Key frame format is AVIF.

In terms of tradeoffs, it is fairly simple.

| Codec/image format | Age     | Space efficiency | Compute required                                                       |
| ------------------ | ------- | ---------------- | ---------------------------------------------------------------------- |
| MJPEG/JPEG         | ancient | low              | depends on input; in our case high (requires BGRA -> YCbCr conversion) |
| h.264/IDR          | old     | okay             | low                                                                    |
| h.265/HEIC         | new-ish | good             | medium                                                                 |
| AV1/AVIF           | newest  | amazing          | high                                                                   |

If we want to stream 1080p60fps, it is probably the best to encode on the GPU side. Therefore, we don't care much about compute, but do care about space efficiency. AV1 is clear winner, but for me personally it won't work. So h.265 it is.

# Just use FFmpeg!
FFmpeg even has an [official guide](https://trac.ffmpeg.org/wiki/Capture/Desktop) on desktop capture, and it is actively maintained. Actually, most of the info for Windows was added over the last year or so. So, let's just copy paste recommended command?

``` bash
ffmpeg -filter_complex gfxcapture=monitor_idx=0:width=1920:height=1080:resize_mode=scale_aspect:output_fmt=10bit -c:v hevc_nvenc -cq 15 capture.mp4
```

Okay, that's cool. Let's break down the options here
- `filter_complex` is something like an input source, which is [gfxcapture](https://ffmpeg.org/ffmpeg-filters.html#gfxcapture) here
- `monitor_idx` is self-explanatory, index starts at 0
- `width` and `height` specifies output size (canvas); that's the part when 'filter' starts to make sense
- `scale_aspect` makes image fit canvas and preserve aspect ratio, leftover area filled with black
- `output_fmt` specifies format inside the D3D11 hardware frames; it can be either 8-, 10- or 16-bit
- `-c` stands for codec
- `-c:v` specifies codec for video stream; here we use `h.265 (hevc)` codec with hardware acceleration (nvenc)
- `-cq` [is not obvious](https://docs.nvidia.com/metropolis/deepstream/dev-guide/text/DS_plugin_gst-nvvideo4linux2.html), but it stands for Constant Quality and specifies target quality for Nvidia GPU; values range from 0 to 51 (and only God knows why)
	- upd: 51 being the lowest (why God, why?)
- `capture.mp4` is not just an output file; here, we implicitly specify container - .mp4

Jumping ahead a bit, I can make following judgement calls
1. nvenc is the right choice for us, if we have Nvidia GPU available
2. hevc (h.265) is better quality per MB compared to h.264, but requires more compute; if GPU can handle this, then OK
3. 10bit is probably unnecessary
4. cq needs to be figured out empirically

Knowing this, let's try to adjust the options
``` sh
ffmpeg -filter_complex gfxcapture=monitor_idx=0:width=1920:height=1080:resize_mode=scale_aspect:output_fmt=8bit -c:v hevc_nvenc -cq 10 capture.mp4
```

It seems like my GPU has no problem maintaining 60 fps for h.265 stream. So, success?

Not quite. A bit over 10 seconds of such footage take up 19.2 MB of space. Let's put it at 2 MB/sec for simplification.

Let's try lowering the quality (cq=30).

Yep, that gives us ~0.8 MB/sec. Much better.

But, that's more like recording a video rather than streaming. To stream, we would need to split video in chunks and send them over the network. This means that chunk length is the minimum latency of our stream. Let's try to aim at 200ms for now.

``` sh
ffmpeg -filter_complex gfxcapture=monitor_idx=0:width=1920:height=1080:resize_mode=scale_aspect:output_fmt=8bit -c:v hevc_nvenc -cq 30 -f segment -segment_time 0.2 -g 12 -reset_timestamps 0 capture/capture%3d.mp4
```
- `-segment_time` gives us 200ms segment length
- `-g` is 'group of frames' before labelling a keyframe; I don't really understand what this means, but it must be framerate multiplied by segment_time, so 12
- `-reset_timestamps 0` means that each segment 'starts' at previous segments' 'end'; this way we can figure out where we are at the timeline
# Sources
1. https://trac.ffmpeg.org/wiki/Capture/Desktop
2. https://www.youtube.com/watch?v=-4NXxY4maYc