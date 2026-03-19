// streamer/main.go
//
// Runs FFmpeg on a local file and pushes the fragmented MP4 output
// to the streaming server over a WebSocket connection.
//
// Usage:
//   go run ./streamer -i video.mp4
//   go run ./streamer -i video.mp4 -server ws://192.168.1.10:8080/ws/push
//   go run ./streamer -i video.mp4 -bv 4000k -loop

package main

import (
	"flag"
	"io"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"syscall"

	"github.com/gorilla/websocket"
)

// chunkSize controls how many bytes we read from FFmpeg stdout per WebSocket
// message. 64 KB is a sweet spot: large enough to be efficient, small enough
// that the server sees data quickly.
const chunkSize = 64 * 1024

func main() {
	input := flag.String("i", "", "Input file path (required)")
	server := flag.String("server", "ws://localhost:8080/ws/push", "Server push endpoint")
	bv := flag.String("bv", "2500k", "Video bitrate (e.g. 2500k, 4000k)")
	ba := flag.String("ba", "128k", "Audio bitrate")
	loop := flag.Bool("loop", false, "Loop the input file indefinitely")
	flag.Parse()

	if *input == "" {
		log.Fatal("required flag: -i <input file>")
	}

	// ── Connect to server ─────────────────────────────────────────────────
	conn, _, err := websocket.DefaultDialer.Dial(*server, nil)
	if err != nil {
		log.Fatalf("connect to %s: %v", *server, err)
	}
	defer conn.Close()
	log.Printf("connected to %s", *server)

	// ── Build FFmpeg args ─────────────────────────────────────────────────
	//
	// Key flags explained:
	//   -re                  Read input at native framerate (simulates live source)
	//   -stream_loop -1      Loop the file forever (only when -loop is set)
	//   -preset ultrafast    Minimize encode latency at cost of compression
	//   -tune zerolatency    Disable B-frames and lookahead buffers
	//   -profile:v baseline  Widest decoder support; simpler NAL structure
	//   -level:v 3.1         Supports up to 1280×720 @ 30fps
	//   keyint=30            Keyframe every 30 frames → ~1s at 30fps
	//   min-keyint=30        No adaptive keyframe insertion
	//   scenecut=0           Disable scene-cut detection (keeps keyframe interval fixed)
	//   bframes=0            No B-frames → lower latency, required for baseline profile
	//   frag_keyframe        Start a new fMP4 fragment at every keyframe
	//   empty_moov           Write an empty moov box (required for streaming)
	//   default_base_moof    Simplifies fragment offsets (MSE compatibility)
	//   frag_duration        Fallback max fragment duration in microseconds (1 000 000 = 1s)
	//
	args := []string{
		"-hide_banner",
		"-loglevel", "warning",
	}

	if *loop {
		args = append(args, "-stream_loop", "-1")
	}

	args = append(args,
		"-f", "x11grab",
		"-s", "1920x1080", // твоя роздільна здатність
		"-r", "30",
		"-i", ":0.0", // або $DISPLAY

		// Video
		"-c:v", "libx264",
		"-preset", "ultrafast",
		"-tune", "zerolatency",
		"-profile:v", "baseline",
		"-level:v", "3.1",
		"-x264-params", "keyint=30:min-keyint=30:scenecut=0:bframes=0",
		"-b:v", *bv,

		// Audio
		"-c:a", "aac",
		"-ar", "44100",
		"-b:a", *ba,

		// Container: fragmented MP4 → stdout
		"-f", "mp4",
		"-movflags", "frag_keyframe+empty_moov+default_base_moof",
		"-frag_duration", "1000000",
		"pipe:1",
	)

	cmd := exec.Command("ffmpeg", args...)
	cmd.Stderr = os.Stderr // surface FFmpeg warnings/errors

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		log.Fatalf("stdout pipe: %v", err)
	}

	// ── Graceful shutdown ─────────────────────────────────────────────────
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigs
		log.Println("shutting down…")
		if cmd.Process != nil {
			cmd.Process.Kill()
		}
	}()

	if err := cmd.Start(); err != nil {
		log.Fatalf("ffmpeg start: %v", err)
	}
	log.Printf("ffmpeg started – streaming %q", *input)

	// ── Read loop: stdout → WebSocket ─────────────────────────────────────
	buf := make([]byte, chunkSize)
	for {
		n, err := stdout.Read(buf)
		if n > 0 {
			if werr := conn.WriteMessage(websocket.BinaryMessage, buf[:n]); werr != nil {
				log.Printf("websocket write: %v", werr)
				break
			}
		}
		if err != nil {
			if err != io.EOF {
				log.Printf("ffmpeg stdout: %v", err)
			}
			break
		}
	}

	cmd.Wait()
	log.Println("streaming finished")
}
