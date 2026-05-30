import React, { useEffect, useRef, useState } from 'react';


export default function GameScreen({
  activeLevel,
  onDetections,
  confidenceThreshold,
  gameStarted
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraState, setCameraState] = useState('off'); // off, starting, on, error, file
  const [wsState, setWsState] = useState('disconnected'); // disconnected, connecting, connected, error
  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const uploadedImgRef = useRef(null);

  // 1. WebSocket Setup
  useEffect(() => {
    connectWebSocket();
    return () => {
      disconnectWebSocket();
    };
  }, []);

  const connectWebSocket = () => {
    setWsState('connecting');
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Handle development Vite proxy and direct port 8000
    const wsHost = window.location.host.includes('3000') || window.location.host.includes('5173')
      ? 'localhost:8000'
      : window.location.host;

    const wsUrl = `${wsProtocol}//${wsHost}/ws`;
    console.log("[SortEdu WS] Connecting to:", wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[SortEdu WS] Connected!");
        setWsState('connected');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.detections) {
          // Send detections up to App.jsx
          onDetections(data.detections);
          // Draw detections on canvas
          drawDetections(data.detections);
        }
      };

      ws.onerror = (error) => {
        console.error("[SortEdu WS] Error:", error);
        setWsState('error');
      };

      ws.onclose = () => {
        console.log("[SortEdu WS] Disconnected.");
        setWsState('disconnected');
        // Auto-reconnect after 3 seconds
        setTimeout(() => {
          if (wsRef.current === null) {
            connectWebSocket();
          }
        }, 3000);
      };
    } catch (e) {
      console.error("[SortEdu WS] Connection fail:", e);
      setWsState('error');
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  // 2. Camera Setup
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraState('starting');
    stopCamera();

    try {
      // Request the best available resolution from the user's webcam.
      // 'ideal' means the browser will try to get 720p, but gracefully fall back
      // to whatever the camera supports (480p, 360p, etc.) without throwing an error.
      const constraints = {
        video: {
          width: { ideal: 1280, min: 320 },
          height: { ideal: 720, min: 240 },
          facingMode: "user"
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraState('on');
      }
    } catch (err) {
      console.error("[SortEdu Camera] Error accessing camera:", err);
      setCameraState('error');
    }
  };

  const stopCamera = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraState('off');
  };

  // 3. Frame Sender Loop
  useEffect(() => {
    if (cameraState === 'on' && wsState === 'connected') {
      // Send a frame every 100ms (10 FPS)
      frameIntervalRef.current = setInterval(sendFrame, 100);
    } else {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    }
    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
    };
  }, [cameraState, wsState]);

  const sendFrame = () => {
    const video = videoRef.current;
    const ws = wsRef.current;

    if (!video || !ws || ws.readyState !== WebSocket.OPEN) return;

    // Normalize all frames to 640x480 before sending to the backend.
    // This ensures inference always matches the training resolution (imgsz=640),
    // regardless of whether the user has a 480p, 720p, or 1080p webcam.
    // It also keeps WebSocket bandwidth low (~30KB/frame) on all connections.
    const SEND_WIDTH = 640;
    const SEND_HEIGHT = 480;

    const offCanvas = document.createElement('canvas');
    offCanvas.width = SEND_WIDTH;
    offCanvas.height = SEND_HEIGHT;
    const ctx = offCanvas.getContext('2d');

    // Draw and downscale to the fixed send resolution
    ctx.drawImage(video, 0, 0, SEND_WIDTH, SEND_HEIGHT);

    offCanvas.toBlob((blob) => {
      if (blob && ws.readyState === WebSocket.OPEN) {
        blob.arrayBuffer().then((buffer) => {
          ws.send(buffer);
        });
      }
    }, 'image/jpeg', 0.7); // 70% quality compression is enough and reduces bandwidth
  };

  // 4. Drawing Bounding Boxes & UI Overlays
  const drawDetections = (detections) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw sorting areas if level is 5
    if (activeLevel === 5 && gameStarted) {
      // Draw Mid division line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Basket Info Text on overlay
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      // Left side text background
      ctx.fillRect(10, 10, 180, 40);
      // Right side text background
      ctx.fillRect(width - 190, 10, 180, 40);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px Nunito";
      ctx.textAlign = "center";
      ctx.fillText("KERANJANG HIJAU 🍏", 100, 34);
      ctx.fillText("KERANJANG MERAH 🍅", width - 100, 34);
    }

    // Draw objects
    detections.forEach(det => {
      if (det.confidence < confidenceThreshold) return;

      const [x1, y1, x2, y2] = det.bbox;

      // Mirror X coordinates because the video is mirrored (CSS transform: scaleX(-1))
      // But the canvas is NOT mirrored, so labels draw correctly!
      const drawX1 = (1 - x2) * width;
      const drawX2 = (1 - x1) * width;
      const boxWidth = drawX2 - drawX1;
      const boxHeight = (y2 - y1) * height;
      const drawY1 = y1 * height;

      // Color scheme based on class
      let themeColor = '#5c6bc0'; // Default Blue
      if (det.class_id === 0) themeColor = '#ffb300'; // Yellow Banana
      if (det.class_id === 1) themeColor = '#f44336'; // Red Tomato
      if (det.class_id === 2) themeColor = '#4caf50'; // Green Tomato

      // Draw bounding box (Thick cartoon style)
      ctx.strokeStyle = '#2c3e50'; // Outer outline
      ctx.lineWidth = 6;
      ctx.strokeRect(drawX1, drawY1, boxWidth, boxHeight);

      ctx.strokeStyle = themeColor; // Main colored inner box
      ctx.lineWidth = 3;
      ctx.strokeRect(drawX1, drawY1, boxWidth, boxHeight);

      // Draw cartoon corner accents
      ctx.fillStyle = '#2c3e50';
      const cornerSize = 10;
      ctx.fillRect(drawX1 - 3, drawY1 - 3, cornerSize, cornerSize);
      ctx.fillRect(drawX1 + boxWidth - cornerSize + 3, drawY1 - 3, cornerSize, cornerSize);
      ctx.fillRect(drawX1 - 3, drawY1 + boxHeight - cornerSize + 3, cornerSize, cornerSize);
      ctx.fillRect(drawX1 + boxWidth - cornerSize + 3, drawY1 + boxHeight - cornerSize + 3, cornerSize, cornerSize);

      // Draw playful Label Tag
      const labelText = `${det.label} (${Math.round(det.confidence * 100)}%)`;
      ctx.font = "bold 14px Nunito";
      ctx.textAlign = "left";
      const textWidth = ctx.measureText(labelText).width;

      // Draw tag background
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(drawX1 - 3, drawY1 - 25, textWidth + 16, 25);
      ctx.fillStyle = themeColor;
      ctx.fillRect(drawX1, drawY1 - 22, textWidth + 10, 20);

      // Draw tag text
      ctx.fillStyle = det.class_id === 0 ? '#2c3e50' : '#ffffff';
      ctx.fillText(labelText, drawX1 + 5, drawY1 - 7);
    });
  };

  return (
    <div className="webcam-container">
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="webcam-feed"
        style={{ display: cameraState === 'on' ? 'block' : 'none' }}
      />

      {/* Drawing canvas */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="overlay-canvas"
        style={{ display: cameraState === 'on' ? 'block' : 'none' }}
      />

      {/* Floating sorting baskets visually in level 5 */}
      {activeLevel === 5 && cameraState === 'on' && gameStarted && (
        <>
          <div className="sorting-basket left">
            <span style={{ fontSize: '2.5rem' }}>🍏</span>
            <span>Taruh Sini</span>
          </div>
          <div className="sorting-basket right">
            <span style={{ fontSize: '2.5rem' }}>🍅</span>
            <span>Taruh Sini</span>
          </div>
        </>
      )}

      {/* Connection and Camera states displays */}
      {cameraState === 'starting' && (
        <div className="calibration-overlay">
          <div className="loading-spinner"></div>
          <p style={{ fontWeight: 800, color: 'var(--text-dark)' }}>Menghubungkan Kamera...</p>
        </div>
      )}

      {cameraState === 'error' && (
        <div className="calibration-overlay" style={{ background: '#ffebee' }}>
          <span style={{ fontSize: '48px' }}>⚠️</span>
          <p style={{ fontWeight: 800, color: 'var(--color-danger)', textAlign: 'center' }}>
            Gagal membuka Kamera.<br />
            Pastikan webcam tidak dipakai aplikasi lain.
          </p>
          <button className="btn btn-danger" onClick={startCamera}>Coba Lagi</button>
        </div>
      )}

      {cameraState === 'on' && wsState === 'connecting' && (
        <div className="calibration-overlay">
          <div className="loading-spinner"></div>
          <p style={{ fontWeight: 800 }}>Menghubungkan ke Server AI...</p>
        </div>
      )}

      {cameraState === 'on' && wsState === 'error' && (
        <div className="calibration-overlay" style={{ background: '#ffebee' }}>
          <span style={{ fontSize: '48px' }}>⚠️</span>
          <p style={{ fontWeight: 800, color: 'var(--color-danger)' }}>Gagal terhubung ke Server AI.</p>
          <button className="btn btn-danger" onClick={connectWebSocket}>Sambung Ulang</button>
        </div>
      )}
    </div>
  );
}
