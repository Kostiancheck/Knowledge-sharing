package main

import (
	"bytes"
	"encoding/binary"
	"flag"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// ─────────────────────────────────────────────────────────────────────────────
// MP4 Box Parser
//
// Fragmented MP4 (fMP4) layout from FFmpeg:
//   ftyp  →  moov  →  [moof + mdat] × N
//
// The ftyp+moov pair is the "initialization segment" that MSE needs once.
// Every moof+mdat pair is a "media segment" (~1 second of video+audio).
// ─────────────────────────────────────────────────────────────────────────────

type mp4Box struct {
	typ  string // e.g. "ftyp", "moov", "moof", "mdat"
	data []byte // full box bytes, including the 8-byte header
}

// parseBoxes extracts all complete MP4 boxes from buf, consuming them.
// Any trailing incomplete box bytes stay in buf for the next call.
func parseBoxes(buf *bytes.Buffer) []mp4Box {
	var out []mp4Box
	for {
		b := buf.Bytes()
		if len(b) < 8 {
			break
		}

		size32 := binary.BigEndian.Uint32(b[:4])
		typ := string(b[4:8])

		var size uint64
		switch size32 {
		case 0:
			// "box extends to EOF" – not useful while streaming
			break
		case 1:
			// 64-bit extended size
			if len(b) < 16 {
				goto done
			}
			size = binary.BigEndian.Uint64(b[8:16])
		default:
			size = uint64(size32)
		}

		if uint64(len(b)) < size {
			break // wait for more data
		}

		data := make([]byte, size)
		buf.Read(data) // advances the internal read pointer
		out = append(out, mp4Box{typ: typ, data: data})
	}
done:
	return out
}

// ─────────────────────────────────────────────────────────────────────────────
// Hub – fan-out from one streamer to N viewers
// ─────────────────────────────────────────────────────────────────────────────

type viewer struct {
	conn *websocket.Conn
	send chan []byte // buffered; write pump drains this
}

type hub struct {
	mu      sync.RWMutex
	viewers map[*viewer]struct{}
	initSeg []byte // ftyp+moov cached for late-joining viewers
}

func newHub() *hub {
	return &hub{viewers: make(map[*viewer]struct{})}
}

func (h *hub) setInitSeg(data []byte) {
	h.mu.Lock()
	h.initSeg = data
	h.mu.Unlock()
}

// addViewer registers a viewer and atomically returns the current init segment.
func (h *hub) addViewer(v *viewer) []byte {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.viewers[v] = struct{}{}
	return h.initSeg
}

func (h *hub) removeViewer(v *viewer) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.viewers, v)
}

// broadcast sends data to every viewer's channel.
// Slow viewers are skipped (non-blocking select) to avoid head-of-line blocking.
func (h *hub) broadcast(data []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for v := range h.viewers {
		clone := make([]byte, len(data))
		copy(clone, data)
		select {
		case v.send <- clone:
		default:
			log.Printf("viewer %s lagging – segment dropped", v.conn.RemoteAddr())
		}
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// WebSocket handlers
// ─────────────────────────────────────────────────────────────────────────────

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1 << 20, // 1 MB
	WriteBufferSize: 1 << 20,
	CheckOrigin:     func(*http.Request) bool { return true },
}

const (
	viewerSendBuf = 256              // frames buffered per viewer
	writeDeadline = 10 * time.Second // max time to write one message to viewer
)

// handlePush is called by the streamer. It reads raw fMP4 bytes, parses
// MP4 boxes, caches the init segment, then broadcasts moof+mdat segments.
func (h *hub) handlePush(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("push upgrade:", err)
		return
	}
	defer conn.Close()
	log.Println("streamer connected:", r.RemoteAddr)

	var (
		raw         bytes.Buffer // accumulates raw bytes across WebSocket messages
		initBuilder bytes.Buffer // accumulates ftyp + moov
		initDone    bool
		pendingMoof []byte // moof waits here until its mdat arrives
	)

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("streamer disconnected:", err)
			return
		}

		raw.Write(msg)
		boxes := parseBoxes(&raw)

		for _, bx := range boxes {
			switch bx.typ {

			// ── Initialization segment ───────────────────────────────────────
			case "ftyp":
				if !initDone {
					initBuilder.Write(bx.data)
				}

			case "moov":
				if !initDone {
					initBuilder.Write(bx.data)
					seg := make([]byte, initBuilder.Len())
					copy(seg, initBuilder.Bytes())
					h.setInitSeg(seg)
					initDone = true
					log.Printf("init segment cached: %d bytes", len(seg))
				}

			// ── Media segments ───────────────────────────────────────────────
			// moof and mdat always come as a pair; send them together so MSE
			// receives a complete, self-contained media segment each time.
			case "moof":
				pendingMoof = bx.data

			case "mdat":
				if initDone && len(pendingMoof) > 0 {
					seg := make([]byte, len(pendingMoof)+len(bx.data))
					copy(seg, pendingMoof)
					copy(seg[len(pendingMoof):], bx.data)
					h.broadcast(seg)
					log.Printf("broadcast: moof+mdat %d bytes, viewers: %d",
						len(seg), len(h.viewers))
					pendingMoof = nil
				}

			default:
				log.Printf("skip box %q (%d bytes)", bx.typ, len(bx.data))
			}
		}
	}
}

// handleView upgrades a browser connection and streams fMP4 segments.
func (h *hub) handleView(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("view upgrade:", err)
		return
	}

	v := &viewer{
		conn: conn,
		send: make(chan []byte, viewerSendBuf),
	}

	// Start write pump before registering with hub to avoid races.
	writeDone := make(chan struct{})
	go func() {
		defer close(writeDone)
		for data := range v.send {
			conn.SetWriteDeadline(time.Now().Add(writeDeadline))
			if err := conn.WriteMessage(websocket.BinaryMessage, data); err != nil {
				log.Println("viewer write error:", err)
				return
			}
		}
	}()

	// Register and immediately send the cached init segment.
	initSeg := h.addViewer(v)
	log.Printf("viewer connected: %s", r.RemoteAddr)

	if len(initSeg) > 0 {
		v.send <- append([]byte(nil), initSeg...)
	}

	// Read pump: drain ping/pong/close frames; exits on disconnect.
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}

	// Teardown: remove from hub first so broadcast stops sending to v.send,
	// then close the channel to stop the write pump, then wait for it.
	h.removeViewer(v)
	close(v.send)
	<-writeDone
	conn.Close()
	log.Printf("viewer disconnected: %s", r.RemoteAddr)
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

func main() {
	addr := flag.String("addr", ":8080", "HTTP listen address")
	flag.Parse()

	h := newHub()

	mux := http.NewServeMux()
	mux.HandleFunc("/ws/push", h.handlePush) // streamer → server
	mux.HandleFunc("/ws/view", h.handleView) // server  → browser
	mux.Handle("/", http.FileServer(http.Dir("./static")))

	log.Printf("server listening on %s", *addr)
	log.Fatal(http.ListenAndServe(*addr, mux))
}
