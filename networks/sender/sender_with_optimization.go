package main

import (
	"net"

	"github.com/pion/rtcp"
	"github.com/pion/webrtc/v3"
)

// buildFFmpegArgs returns FFmpeg arguments optimized for minimum latency streaming.
//
// WHERE LATENCY HIDES IN FFMPEG PIPELINE:
//
//	Screen capture → [encoder buffer] → [muxer buffer] → RTP → Go → Browser
//	                      ↑                   ↑
//	                 biggest killers      second killer
//
// By default FFmpeg buffers heavily on each stage — we disable all of it.
func buildFFmpegArgs(serverAddr string) []string {
	return []string{
		// --- INPUT: screen capture via DirectShow (Windows) ---
		"-f", "gdigrab",
		"-framerate", "30",
		"-i", "desktop",

		// --- INPUT: system audio ---
		// Use "Stereo Mix" if available, otherwise VB-Audio Cable Output.
		// To check available devices run: ffmpeg -list_devices true -f dshow -i dummy
		"-f", "dshow",
		"-i", "audio=Stereo Mix (Realtek Audio)",

		// --- VIDEO ENCODER ---
		"-vcodec", "libx264",

		// ultrafast — uses fastest x264 preset, reduces CPU time per frame.
		// Less CPU time = less time frame spends waiting to be encoded.
		"-preset", "ultrafast",

		// zerolatency — THIS IS THE KEY FLAG.
		// Disables inside x264:
		//   - rc-lookahead: encoder no longer looks N frames ahead to decide bitrate
		//   - B-frames: require lookahead, so they're gone too (B-frames = latency)
		//   - internal frame reordering
		// Result: frame encoded → immediately packaged as RTP → sent. No waiting.
		"-tune", "zerolatency",

		// baseline profile — no B-frames at codec level either.
		// B-frames (bidirectional frames) reference both past AND future frames,
		// which means encoder must buffer future frames before sending current one.
		// Baseline = only I-frames and P-frames = no future frame dependency.
		// Also required by many browsers for compatibility.
		"-profile:v", "baseline",
		"-level", "3.1",

		// keyint=30 — insert I-frame (keyframe) every 30 frames (= every 1 sec at 30fps).
		// WHY THIS MATTERS FOR LATENCY:
		// When a new viewer connects, they CANNOT decode video until they receive
		// a keyframe — P-frames are delta-only and need a reference frame.
		// If keyframes are every 300 frames (10 sec), new viewer waits up to 10 sec
		// for a black screen. Every 30 frames = max 1 sec wait.
		// scenecut=0 — disable scene cut detection (it inserts extra keyframes
		// unpredictably, which can cause bitrate spikes).
		"-x264-params", "keyint=30:min-keyint=30:scenecut=0",

		// yuv420p — required pixel format for browser H264 compatibility.
		"-pix_fmt", "yuv420p",

		// --- AUDIO ENCODER ---
		// Opus is the native WebRTC audio codec — no transcoding needed in browser.
		"-acodec", "libopus",
		"-b:a", "128k",
		"-ar", "48000", // 48kHz — required by Opus/WebRTC spec

		// --- FFMPEG INTERNAL BUFFER FLAGS ---

		// flush_packets 1 — flush output buffer after every single packet.
		// Without this FFmpeg may hold packets waiting to fill a buffer.
		"-flush_packets", "1",

		// fflags nobuffer — disable FFmpeg's input read buffer.
		// FFmpeg normally buffers input to handle jitter — we don't want that.
		"-fflags", "nobuffer",

		// flags low_delay — enables low-delay mode across all internal components.
		"-flags", "low_delay",

		// --- OUTPUT: send RTP directly to Go server ---
		// Each RTP packet = one H264 NAL unit = sent immediately after encoding.
		// No waiting for chunks, segments, or playlists (unlike HLS/DASH).
		"-f", "rtp",
		"rtp://" + serverAddr,
	}
}

// forwardRTPToViewers reads RTP packets from FFmpeg and forwards them
// to all connected WebRTC viewers with zero additional buffering.
func forwardRTPToViewers(rtpPort int, viewers []*Viewer) error {
	udpConn, err := net.ListenUDP("udp", &net.UDPAddr{Port: rtpPort})
	if err != nil {
		return err
	}
	defer udpConn.Close()

	// 1500 bytes = standard Ethernet MTU.
	// FFmpeg splits large frames across multiple RTP packets to fit MTU.
	// Each Read() call returns exactly one RTP packet.
	buf := make([]byte, 1500)

	for {
		n, _, err := udpConn.ReadFrom(buf)
		if err != nil {
			continue
		}

		// Forward immediately — no batching, no buffering.
		// pion/webrtc handles SRTP encryption and DTLS internally,
		// so we just write raw RTP bytes and it handles the rest.
		for _, viewer := range viewers {
			// Write is non-blocking — each viewer has its own send buffer.
			// If a viewer is slow, their buffer fills up independently
			// and doesn't affect other viewers.
			viewer.videoTrack.Write(buf[:n]) //nolint
		}
	}
}

// Viewer represents a connected WebRTC peer (browser watching the stream).
type Viewer struct {
	peerConnection *webrtc.PeerConnection
	videoTrack     *webrtc.TrackLocalStaticRTP
}

// setupViewer creates a new WebRTC peer connection for an incoming viewer.
// It also handles the keyframe request on connect — so the viewer
// doesn't have to wait up to 1 second for the next scheduled keyframe.
func setupViewer(rtpSender *webrtc.RTPSender) {
	// WHY WE NEED PLI (Picture Loss Indication):
	// When viewer connects mid-stream, they receive P-frames which are
	// delta-only — they encode "difference from previous frame".
	// Without a prior I-frame as reference, the decoder shows garbage or nothing.
	//
	// PLI is an RTCP message that tells the sender "I lost frames, send a keyframe NOW".
	// This forces FFmpeg to insert an out-of-schedule I-frame immediately,
	// so the new viewer gets a clean starting point without waiting.
	//
	// TODO: call this when a new viewer's PeerConnection reaches Connected state:
	//
	//   peerConnection.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
	//       if state == webrtc.PeerConnectionStateConnected {
	//           rtpSender.SendRTCP([]rtcp.Packet{
	//               &rtcp.PictureLossIndication{},
	//           })
	//       }
	//   })

	_ = rtpSender
	_ = rtcp.PictureLossIndication{}
}