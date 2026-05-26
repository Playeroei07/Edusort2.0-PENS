import os
import cv2
import time

def main():
    print("=================================================================")
    print("                SortEdu - Dataset Collector Tool                 ")
    print("=================================================================")
    print("This utility helps you capture images from your webcam to train")
    print("your custom YOLOv8 model for yellow bananas, red tomatoes, and")
    print("green tomatoes.")
    print("\nInstructions:")
    print("  - Press '1' to save a frame for: YELLOW BANANA (pisang_kuning)")
    print("  - Press '2' to save a frame for: RED TOMATO (tomat_merah)")
    print("  - Press '3' to save a frame for: GREEN TOMATO (tomat_hijau)")
    print("  - Press 'q' to quit the application")
    print("=================================================================\n")

    # Define directories
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # under SortEdu/backend/
    dataset_dir = os.path.join(base_dir, "..", "dataset", "raw")
    
    classes = {
        "1": {"name": "yellow_banana", "path": os.path.join(dataset_dir, "yellow_banana")},
        "2": {"name": "red_tomato", "path": os.path.join(dataset_dir, "red_tomato")},
        "3": {"name": "green_tomato", "path": os.path.join(dataset_dir, "green_tomato")}
    }
    
    # Create directories
    for class_key, class_info in classes.items():
        os.makedirs(class_info["path"], exist_ok=True)

    # Initialize count based on existing files
    counts = {}
    for class_key, class_info in classes.items():
        existing_files = os.listdir(class_info["path"])
        img_files = [f for f in existing_files if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        counts[class_key] = len(img_files)

    # Open webcam
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam. Make sure it's plugged in and not in use by another app.")
        return

    # Window setting
    window_name = "SortEdu Dataset Collector"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, 800, 600)

    last_saved_time = 0
    feedback_text = "Ready to capture!"
    feedback_color = (0, 255, 0) # Green

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame.")
            break

        # Mirror the frame for intuitive user interaction
        frame = cv2.flip(frame, 1)
        h, w = frame.shape[:2]

        # Clone frame to draw UI overlay without altering the saved image
        display_frame = frame.copy()

        # UI Overlay - Top Banner
        cv2.rectangle(display_frame, (0, 0), (w, 50), (40, 40, 40), -1)
        cv2.putText(display_frame, "SortEdu Dataset Capture", (15, 32),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)

        # UI Overlay - Counts & Info Box
        info_y = 70
        cv2.rectangle(display_frame, (10, info_y - 15), (280, info_y + 110), (0, 0, 0), -1)
        cv2.putText(display_frame, f"1: Banana (Yellow)  [{counts['1']} files]", (20, info_y + 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1, cv2.LINE_AA)
        cv2.putText(display_frame, f"2: Tomato (Red)     [{counts['2']} files]", (20, info_y + 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1, cv2.LINE_AA)
        cv2.putText(display_frame, f"3: Tomato (Green)   [{counts['3']} files]", (20, info_y + 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1, cv2.LINE_AA)
        cv2.putText(display_frame, "Press Q to exit", (20, info_y + 90),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)

        # Clear feedback after 1.5 seconds
        if time.time() - last_saved_time > 1.5:
            feedback_text = "Press 1, 2, or 3 to capture"
            feedback_color = (200, 200, 200)

        # UI Overlay - Feedback text at bottom
        cv2.rectangle(display_frame, (0, h - 40), (w, h), (40, 40, 40), -1)
        cv2.putText(display_frame, feedback_text, (20, h - 15),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, feedback_color, 2, cv2.LINE_AA)

        # Show frame
        cv2.imshow(window_name, display_frame)

        # Handle keyboard input
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord('q') or key == ord('Q') or cv2.getWindowProperty(window_name, cv2.WND_PROP_VISIBLE) < 1:
            break
        elif chr(key) in classes.keys():
            class_info = classes[chr(key)]
            counts[chr(key)] += 1
            filename = f"img_{int(time.time() * 1000)}.jpg"
            filepath = os.path.join(class_info["path"], filename)
            
            # Save raw frame
            cv2.imwrite(filepath, frame)
            
            feedback_text = f"SAVED: {class_info['name']} -> {filename}"
            feedback_color = (0, 255, 255) if chr(key) == '1' else ((0, 0, 255) if chr(key) == '2' else (0, 255, 0))
            last_saved_time = time.time()
            print(feedback_text)

    # Release resources
    cap.release()
    cv2.destroyAllWindows()
    print("\nCapture session ended. Files saved in:")
    for class_key, class_info in classes.items():
        print(f"  - {class_info['name']}: {class_info['path']}")
    print("\nYou can use these files to train your YOLOv8 model. See backend/model/README.md for details!")

if __name__ == "__main__":
    main()
