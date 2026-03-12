package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"sync"

	"github.com/pion/webrtc/v3"
)

const (
	videoRTPPort = 5004
	httpPort     = ":8080"
)

var (
	videoViewers []*webrtc.TrackLocalStaticRTP
	viewersMu    sync.Mutex
)

func main() {
	http.HandleFunc("/watch", watchHandler)
	http.HandleFunc("/offer", offerHandler)

	go listenRTP("video", videoRTPPort, &videoViewers)

	log.Printf("Server running — open http://<your-vps-ip>%s/watch in a browser", httpPort)
	log.Fatal(http.ListenAndServe(httpPort, nil))
}

// listenRTP reads UDP packets and forwards to all connected viewer tracks.
func listenRTP(kind string, port int, tracks *[]*webrtc.TrackLocalStaticRTP) {
	conn, err := net.ListenUDP("udp", &net.UDPAddr{Port: port})
	if err != nil {
		log.Fatalf("Failed to listen on UDP %d: %v", port, err)
	}
	defer conn.Close()
	log.Printf("Listening for %s RTP on UDP :%d", kind, port)

	buf := make([]byte, 1500)
	for {
		n, _, err := conn.ReadFrom(buf)
		if err != nil {
			log.Printf("RTP %s read error: %v", kind, err)
			continue
		}

		viewersMu.Lock()
		for _, track := range *tracks {
			if _, err := track.Write(buf[:n]); err != nil {
				log.Printf("Track %s write error: %v", kind, err)
			}
		}
		viewersMu.Unlock()
	}
}

func offerHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == http.MethodOptions {
		return
	}

	var offer webrtc.SessionDescription
	if err := json.NewDecoder(r.Body).Decode(&offer); err != nil {
		http.Error(w, "bad offer: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Register H.264
	m := &webrtc.MediaEngine{}
	if err := m.RegisterCodec(webrtc.RTPCodecParameters{
		RTPCodecCapability: webrtc.RTPCodecCapability{
			MimeType:    webrtc.MimeTypeH264,
			ClockRate:   90000,
			SDPFmtpLine: "level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f",
		},
		PayloadType: 96,
	}, webrtc.RTPCodecTypeVideo); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	api := webrtc.NewAPI(webrtc.WithMediaEngine(m))
	pc, err := api.NewPeerConnection(webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{URLs: []string{"stun:stun.l.google.com:19302"}},
		},
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Create video track
	videoTrack, err := webrtc.NewTrackLocalStaticRTP(
		webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeH264},
		"video", "gamestream-video",
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Register tracks
	viewersMu.Lock()
	videoViewers = append(videoViewers, videoTrack)
	viewersMu.Unlock()

	// Clean up on disconnect
	pc.OnConnectionStateChange(func(s webrtc.PeerConnectionState) {
		log.Printf("Viewer state: %s", s)
		if s == webrtc.PeerConnectionStateFailed || s == webrtc.PeerConnectionStateClosed {
			viewersMu.Lock()
			for i, t := range videoViewers {
				if t == videoTrack {
					videoViewers = append(videoViewers[:i], videoViewers[i+1:]...)
					break
				}
			}
			viewersMu.Unlock()
		}
	})

	if _, err = pc.AddTrack(videoTrack); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err = pc.SetRemoteDescription(offer); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	answer, err := pc.CreateAnswer(nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	gatherDone := webrtc.GatheringCompletePromise(pc)
	if err = pc.SetLocalDescription(answer); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	<-gatherDone

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pc.LocalDescription())
}

func watchHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html")
	fmt.Fprint(w, viewerHTML)
}

const viewerHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>GameStream</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --blue:    #00d4ff;
      --blue-dim: rgba(0, 212, 255, 0.15);
      --red:     #ff3c3c;
      --bg:      #080a0e;
      --surface: #0d1117;
      --border:  rgba(0, 212, 255, 0.18);
    }

    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: var(--bg);
      color: #e0e8f0;
      font-family: 'Rajdhani', sans-serif;
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* subtle noise grain overlay */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
      pointer-events: none;
      z-index: 100;
      opacity: 0.35;
    }

    /* ── TOP BAR ─────────────────────────────── */
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 52px;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
      flex-shrink: 0;
    }

    .logo {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #fff;
    }
    .logo span { color: var(--blue); }

    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    /* live badge */
    .live-badge {
      display: flex;
      align-items: center;
      gap: 7px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.14em;
      color: var(--red);
      opacity: 0;
      transition: opacity 0.4s;
    }
    .live-badge.visible { opacity: 1; }
    .live-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--red);
      box-shadow: 0 0 8px var(--red);
      animation: pulse 1.4s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.4; transform: scale(0.7); }
    }

    /* clock */
    #clock {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: rgba(255,255,255,0.35);
      letter-spacing: 0.08em;
    }

    /* ── MAIN STAGE ─────────────────────────── */
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px 24px;
      gap: 16px;
      position: relative;
    }

    /* corner glow behind video */
    main::before {
      content: '';
      position: absolute;
      width: 600px; height: 300px;
      background: radial-gradient(ellipse, rgba(0,212,255,0.07) 0%, transparent 70%);
      top: 10%; left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
    }

    .video-shell {
      position: relative;
      width: 100%;
      max-width: 1100px;
      border: 1px solid var(--border);
      background: #000;
      box-shadow: 0 0 0 1px rgba(0,212,255,0.06), 0 24px 80px rgba(0,0,0,0.7);
      border-radius: 4px;
      overflow: hidden;
    }

    /* thin top accent line */
    .video-shell::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--blue), transparent);
      z-index: 2;
    }

    video {
      width: 100%;
      display: block;
      aspect-ratio: 16/9;
      background: #000;
    }

    /* connecting overlay */
    .overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      background: rgba(8,10,14,0.92);
      z-index: 5;
      transition: opacity 0.6s;
    }
    .overlay.hidden { opacity: 0; pointer-events: none; }

    .spinner {
      width: 36px; height: 36px;
      border: 2px solid rgba(0,212,255,0.15);
      border-top-color: var(--blue);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .overlay-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      letter-spacing: 0.14em;
      color: rgba(0,212,255,0.7);
      text-transform: uppercase;
    }

    /* ── BOTTOM STATUS BAR ─────────────────── */
    .statusbar {
      display: flex;
      align-items: center;
      gap: 28px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: rgba(255,255,255,0.3);
      letter-spacing: 0.06em;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .stat-label { color: rgba(0,212,255,0.5); text-transform: uppercase; }
    .stat-value { color: rgba(255,255,255,0.55); }
    .stat-value.good { color: #4dffb4; }
    .stat-value.bad  { color: var(--red); }

    .sep {
      width: 1px; height: 14px;
      background: rgba(255,255,255,0.1);
    }
  </style>
</head>
<body>

<header>
  <div class="logo">Game<span>Stream</span></div>
  <div class="header-right">
    <div class="live-badge" id="liveBadge">
      <div class="live-dot"></div>LIVE
    </div>
    <div id="clock">--:--:--</div>
  </div>
</header>

<main>
  <div class="video-shell">
    <video id="video" autoplay playsinline muted></video>
    <div class="overlay" id="overlay">
      <div class="spinner"></div>
      <div class="overlay-text" id="overlayText">Connecting…</div>
    </div>
    <div class="overlay" id="playOverlay" style="display:none; cursor:pointer; background:rgba(8,10,14,0.75);" onclick="startPlay()">
      <div style="font-size:64px; line-height:1; color:var(--blue); filter:drop-shadow(0 0 20px var(--blue));">▶</div>
      <div class="overlay-text" style="margin-top:12px;">CLICK TO WATCH</div>
    </div>
  </div>

  <div class="statusbar">
    <div class="stat">
      <span class="stat-label">ICE</span>
      <span class="stat-value" id="statIce">—</span>
    </div>
    <div class="sep"></div>
    <div class="stat">
      <span class="stat-label">State</span>
      <span class="stat-value" id="statConn">—</span>
    </div>
    <div class="sep"></div>
    <div class="stat">
      <span class="stat-label">Resolution</span>
      <span class="stat-value" id="statRes">—</span>
    </div>
    <div class="sep"></div>
    <div class="stat">
      <span class="stat-label">FPS</span>
      <span class="stat-value" id="statFps">—</span>
    </div>
  </div>
</main>

<script>
  // ── Clock ──────────────────────────────────────────────
  const clockEl = document.getElementById('clock');
  function updateClock() {
    clockEl.textContent = new Date().toLocaleTimeString('en-GB');
  }
  updateClock();
  setInterval(updateClock, 1000);

  // ── WebRTC ─────────────────────────────────────────────
  const video      = document.getElementById('video');
  const overlay    = document.getElementById('overlay');
  const overlayTxt = document.getElementById('overlayText');
  const liveBadge  = document.getElementById('liveBadge');
  const statIce    = document.getElementById('statIce');
  const statConn   = document.getElementById('statConn');
  const statRes    = document.getElementById('statRes');
  const statFps    = document.getElementById('statFps');

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  const playOverlay = document.getElementById('playOverlay');

  function startPlay() {
    video.muted = false;
    video.play();
    playOverlay.style.display = 'none';
    liveBadge.classList.add('visible');
    startStatsLoop();
  }

  pc.ontrack = (e) => {
    video.srcObject = e.streams[0];
    overlay.classList.add('hidden');
    // Try autoplay (works if user already interacted with page)
    video.play().then(() => {
      liveBadge.classList.add('visible');
      startStatsLoop();
    }).catch(() => {
      // Autoplay blocked — show click-to-play overlay
      playOverlay.style.display = 'flex';
    });
  };

  pc.oniceconnectionstatechange = () => {
    const s = pc.iceConnectionState;
    statIce.textContent = s;
    statIce.className = 'stat-value' + (s === 'connected' || s === 'completed' ? ' good' : s === 'failed' ? ' bad' : '');
    if (s === 'failed' || s === 'disconnected') {
      overlayTxt.textContent = s.toUpperCase();
      overlay.classList.remove('hidden');
      liveBadge.classList.remove('visible');
    }
  };

  pc.onconnectionstatechange = () => {
    const s = pc.connectionState;
    statConn.textContent = s;
    statConn.className = 'stat-value' + (s === 'connected' ? ' good' : s === 'failed' ? ' bad' : '');
    if (s !== 'connected') overlayTxt.textContent = s.toUpperCase();
  };

  pc.addTransceiver('video', { direction: 'recvonly' });
  pc.addTransceiver('audio', { direction: 'recvonly' });

  async function start() {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const resp = await fetch('/offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offer),
    });
    const answer = await resp.json();
    await pc.setRemoteDescription(answer);
  }

  start().catch(err => {
    overlayTxt.textContent = 'Error: ' + err.message;
    console.error(err);
  });

  // ── Stats loop (resolution + fps via getStats) ──────────
  let lastFrames = 0;
  function startStatsLoop() {
    setInterval(async () => {
      const stats = await pc.getStats();
      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          if (report.frameWidth)  statRes.textContent = report.frameWidth + '×' + report.frameHeight;
          const fps = report.framesPerSecond || (report.framesDecoded - lastFrames);
          lastFrames = report.framesDecoded;
          statFps.textContent = Math.round(fps);
          statFps.className = 'stat-value' + (fps >= 25 ? ' good' : fps < 15 ? ' bad' : '');
        }
      });
    }, 1000);
  }
</script>
</body>
</html>`
