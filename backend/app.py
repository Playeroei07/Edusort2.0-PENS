import os
import io
import cv2
import json
import numpy as np
import threading
import signal
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from ultralytics import YOLO
import requests
import tempfile
import wave
try:
    from piper import PiperVoice
except ImportError:
    PiperVoice = None

# Initialize FastAPI
app = FastAPI(title="SortEdu Real-time Object Detection Server")

# Dynamic directory check for static build
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
dist_path = os.path.join(BASE_DIR, "dist")
if not os.path.exists(dist_path):
    os.makedirs(dist_path)
    # Write temporary index.html to prevent startup crashes before build
    with open(os.path.join(dist_path, "index.html"), "w", encoding="utf-8") as f:
        f.write("<html><body><h1>SortEdu Frontend building... Please refresh in a moment.</h1></body></html>")

# Load YOLO model
# We look for a custom trained model first. If not found, use yolov8n.pt as fallback.
custom_model_path = os.path.join(BASE_DIR, "model", "custom_yolo.pt")
is_custom_model = False

if os.path.exists(custom_model_path):
    print(f"[SortEdu Model] Loading custom trained YOLO model from {custom_model_path}...")
    try:
        model = YOLO(custom_model_path)
        is_custom_model = True
        print("[SortEdu Model] Custom model loaded successfully!")
    except Exception as e:
        print(f"[SortEdu Model] Failed to load custom model: {e}. Falling back to default yolov8n.pt...")
        model = YOLO("yolov8n.pt")
else:
    print("[SortEdu Model] Custom model not found at backend/model/custom_yolo.pt.")
    print("[SortEdu Model] Loading default yolov8n.pt for sandbox/fallback mode...")
    model = YOLO("yolov8n.pt")

# Piper TTS Setup
piper_model_dir = os.path.join(BASE_DIR, "model", "piper")
os.makedirs(piper_model_dir, exist_ok=True)
onnx_file = os.path.join(piper_model_dir, "id_ID-news_tts-medium.onnx")
json_file = os.path.join(piper_model_dir, "id_ID-news_tts-medium.onnx.json")

# Download model if not exists
if PiperVoice is not None and (not os.path.exists(onnx_file) or not os.path.exists(json_file)):
    print("[SortEdu TTS] Downloading Piper TTS Model (id_ID-news_tts-medium)... This may take a moment.")
    onnx_url = "https://huggingface.co/rhasspy/piper-voices/resolve/main/id/id_ID/news_tts/medium/id_ID-news_tts-medium.onnx"
    json_url = "https://huggingface.co/rhasspy/piper-voices/resolve/main/id/id_ID/news_tts/medium/id_ID-news_tts-medium.onnx.json"
    
    try:
        r_onnx = requests.get(onnx_url, allow_redirects=True)
        with open(onnx_file, "wb") as f: f.write(r_onnx.content)
        r_json = requests.get(json_url, allow_redirects=True)
        with open(json_file, "wb") as f: f.write(r_json.content)
        print("[SortEdu TTS] Download complete.")
    except Exception as e:
        print(f"[SortEdu TTS] Failed to download model: {e}")

# Initialize Piper
piper_voice = None
if PiperVoice is not None and os.path.exists(onnx_file) and os.path.exists(json_file):
    print("[SortEdu TTS] Loading Piper TTS model...")
    try:
        piper_voice = PiperVoice.load(onnx_file, config_path=json_file)
        print("[SortEdu TTS] Piper loaded successfully.")
    except Exception as e:
        print(f"[SortEdu TTS] Error loading Piper: {e}")

def classify_color_heuristic(crop_img):
    """
    Heuristic to classify a cropped image of an apple/tomato as Red or Green.
    Uses HSV color space.
    """
    if crop_img is None or crop_img.size == 0:
        return "red"
    
    hsv = cv2.cvtColor(crop_img, cv2.COLOR_BGR2HSV)
    
    # Red boundaries (Red wraps around 0 and 180 in Hue)
    lower_red1 = np.array([0, 50, 50])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([170, 50, 50])
    upper_red2 = np.array([180, 255, 255])
    
    # Green boundaries
    lower_green = np.array([35, 40, 40])
    upper_green = np.array([85, 255, 255])
    
    mask_red1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask_red2 = cv2.inRange(hsv, lower_red2, upper_red2)
    mask_red = mask_red1 | mask_red2
    
    mask_green = cv2.inRange(hsv, lower_green, upper_green)
    
    red_pixels = cv2.countNonZero(mask_red)
    green_pixels = cv2.countNonZero(mask_green)
    
    # Return dominant color
    if green_pixels > red_pixels and green_pixels > 10:
        return "green"
    return "red"

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[SortEdu WebSocket] Client connected.")
    try:
        while True:
            # Receive image frame bytes from frontend
            data = await websocket.receive_bytes()
            
            # Decode the image bytes
            nparr = np.frombuffer(data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                await websocket.send_json({"detections": [], "error": "Invalid image frame"})
                continue
                
            height, width = img.shape[:2]
            
            # Run YOLOv8 model inference
            # verbose=False reduces logging noise in terminal
            results = model(img, verbose=False)
            
            detections = []
            
            # Process results
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    # Get box coordinates, confidence, and class
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    conf = float(box.conf[0])
                    class_id = int(box.cls[0])
                    
                    # Convert to normalized coordinates (0.0 to 1.0)
                    # This lets frontend draw bounding boxes responsively on any canvas size
                    norm_x1 = x1 / width
                    norm_y1 = y1 / height
                    norm_x2 = x2 / width
                    norm_y2 = y2 / height
                    
                    label = ""
                    mapped_class_id = -1
                    
                    if is_custom_model:
                        # Custom trained classes:
                        # Assuming 0 = yellow_banana, 1 = red_tomato, 2 = green_tomato
                        mapped_class_id = class_id
                        if class_id == 0:
                            label = "Pisang Kuning 🍌"
                        elif class_id == 1:
                            label = "Tomat Merah 🍅"
                        elif class_id == 2:
                            label = "Tomat Hijau 🍏"
                        else:
                            label = f"Objek Lain ({class_id})"
                    else:
                        # Fallback using coco pre-trained weights
                        # Class 46: banana
                        # Class 47: apple, Class 49: orange, Class 32: sports ball
                        coco_label = model.names[class_id]
                        
                        if class_id == 46: # banana
                            label = "Pisang Kuning 🍌"
                            mapped_class_id = 0
                        elif class_id in [47, 49]: # apple or orange (testing for red/green tomatoes)
                            # Let's perform a color heuristic on the cropped region
                            # to determine if it is red (tomat merah) or green (tomat hijau)
                            ix1, iy1, ix2, iy2 = max(0, int(x1)), max(0, int(y1)), min(width, int(x2)), min(height, int(y2))
                            crop = img[iy1:iy2, ix1:ix2]
                            
                            color = classify_color_heuristic(crop)
                            if color == "green":
                                label = "Tomat Hijau 🍏"
                                mapped_class_id = 2
                            else:
                                label = "Tomat Merah 🍅"
                                mapped_class_id = 1
                        elif class_id == 32: # sports ball (could represent green tomato in sandbox)
                            label = "Tomat Hijau 🍏"
                            mapped_class_id = 2
                        else:
                            # Skip other objects to keep the UI clean, unless they are high confidence
                            continue
                    
                    # Filter low confidence detections (e.g. < 40%)
                    if conf < 0.40:
                        continue
                        
                    detections.append({
                        "bbox": [norm_x1, norm_y1, norm_x2, norm_y2],
                        "confidence": conf,
                        "class_id": mapped_class_id,
                        "label": label
                    })
            
            # Send detection results back to client
            await websocket.send_json({
                "detections": detections,
                "is_custom": is_custom_model
            })
            
    except WebSocketDisconnect:
        print("[SortEdu WebSocket] Client disconnected.")
    except Exception as e:
        print(f"[SortEdu WebSocket] Error: {e}")

def cleanup_file(path):
    try:
        os.unlink(path)
    except:
        pass

@app.get("/api/tts")
async def generate_tts(text: str):
    if not piper_voice:
        return {"error": "TTS Model not loaded or piper-tts not installed"}
    
    tts_cache_dir = os.path.join(BASE_DIR, "tts_cache")
    os.makedirs(tts_cache_dir, exist_ok=True)
    
    import hashlib
    text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()
    cache_path = os.path.join(tts_cache_dir, f"{text_hash}.wav")
    
    if os.path.exists(cache_path):
        return FileResponse(cache_path, media_type="audio/wav")
    
    try:
        with wave.open(cache_path, 'wb') as wav_file:
            piper_voice.synthesize_wav(text, wav_file)
        
        return FileResponse(cache_path, media_type="audio/wav")
    except Exception as e:
        if os.path.exists(cache_path):
            cleanup_file(cache_path)
        return {"error": f"TTS generation failed: {str(e)}"}

def kill_server():
    time.sleep(1)
    os.kill(os.getpid(), signal.SIGTERM)

@app.post("/api/shutdown")
async def shutdown_server():
    print("[SortEdu] Menerima perintah mematikan sistem dari antarmuka...")
    threading.Thread(target=kill_server).start()
    return {"message": "Sistem sedang dimatikan..."}

# Mount static React frontend build folder
# Must be mounted AFTER websocket endpoint to ensure proper routing priority
app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")

@app.exception_handler(404)
async def custom_404_handler(request, exc):
    # Serve index.html for React SPA router if routes aren't found
    return FileResponse(os.path.join(dist_path, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
