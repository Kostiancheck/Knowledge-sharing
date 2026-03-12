package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"syscall"
)

// Usage: go run main.go <vps-ip>
// Example: go run main.go 123.45.67.89

const (
	videoPort = "5004"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run main.go <vps-ip>")
		os.Exit(1)
	}

	vpsIP := os.Args[1]

	videoCmd := makeVideoCmd(vpsIP)
	videoCmd.Stdout = os.Stdout
	videoCmd.Stderr = os.Stderr

	log.Printf("Starting video stream → %s:%s", vpsIP, videoPort)
	if err := videoCmd.Start(); err != nil {
		log.Fatal("Failed to start ffmpeg (video):", err)
	}

	log.Println("Streaming — press Ctrl+C to stop")

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig

	log.Println("Stopping...")
	videoCmd.Process.Kill()
}

func makeVideoCmd(vpsIP string) *exec.Cmd {
	return exec.Command("ffmpeg",
		"-re",
		"-i", "../video.mp4",
		"-an", // no audio in this stream
		"-c:v", "libx264",
		"-preset", "ultrafast",
		"-tune", "zerolatency",
		"-profile:v", "baseline", // most compatible H.264 profile for browsers
		"-level", "3.1",
		"-g", "1000", // keyframe every 30 frames (1s at 30fps) — critical for WebRTC
		"-keyint_min", "1000", // no shorter keyframe intervals
		"-sc_threshold", "0", // disable scene-change keyframes (consistent intervals)
		"-b:v", "3M",
		"-pkt_size", "1200",
		"-f", "rtp",
		fmt.Sprintf("rtp://%s:%s", vpsIP, videoPort),
	)
}
