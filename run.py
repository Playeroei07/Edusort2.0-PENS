import os
import sys
import subprocess
import webbrowser
import time

def check_requirements():
    print("[SortEdu] Checking Python packages...")
    try:
        import fastapi
        import uvicorn
        import ultralytics
        import cv2
        import websockets
        import numpy
        print("[SortEdu] All Python packages are installed!")
    except ImportError as e:
        print(f"[SortEdu] Missing package: {e.name}. Installing requirements...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
            print("[SortEdu] Requirements installed successfully!")
        except Exception as err:
            print(f"[SortEdu] Failed to install requirements automatically: {err}")
            print("[SortEdu] Please run: pip install -r requirements.txt manually.")
            sys.exit(1)

def build_frontend():
    frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
    dist_dir = os.path.join(os.path.dirname(__file__), "backend", "dist")
    
    if os.path.exists(dist_dir) and os.listdir(dist_dir):
        print("[SortEdu] Frontend build already exists. Skipping build. (Delete 'backend/dist' to rebuild)")
        return
        
    print("[SortEdu] Frontend build not found. Building now...")
    if not os.path.exists(frontend_dir):
        print(f"[SortEdu] Error: Frontend directory not found at {frontend_dir}!")
        sys.exit(1)
        
    try:
        print("[SortEdu] Running 'npm install' in frontend...")
        subprocess.check_call("npm install", shell=True, cwd=frontend_dir)
        print("[SortEdu] Running 'npm run build' in frontend...")
        subprocess.check_call("npm run build", shell=True, cwd=frontend_dir)
        print("[SortEdu] Frontend built successfully!")
    except Exception as err:
        print(f"[SortEdu] Error building frontend: {err}")
        print("[SortEdu] Please make sure Node.js and npm are installed and run 'npm install && npm run build' in the frontend folder manually.")
        sys.exit(1)

def main():
    # 1. Check requirements
    check_requirements()
    
    # 2. Build frontend if needed
    build_frontend()
    
    # 3. Launch browser after a short delay
    print("[SortEdu] Launching browser to http://localhost:8000 in 3 seconds...")
    time.sleep(1)
    
    # Run uvicorn server
    print("[SortEdu] Starting FastAPI server on http://localhost:8000...")
    try:
        # We start the browser async and then run uvicorn
        import threading
        def open_browser():
            time.sleep(2)
            webbrowser.open("http://localhost:8000")
            
        t = threading.Thread(target=open_browser)
        t.daemon = True
        t.start()
        
        # Start server
        import uvicorn
        uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)
    except KeyboardInterrupt:
        print("\n[SortEdu] Server stopped.")
    except Exception as err:
        print(f"[SortEdu] Server error: {err}")

if __name__ == "__main__":
    main()
