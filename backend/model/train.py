import os
import shutil
from ultralytics import YOLO

def main():
    print("=================================================================")
    print("                  SortEdu - YOLOv8 Model Trainer                 ")
    print("=================================================================")
    print("This script will train a YOLOv8 Nano model on your custom fruit")
    print("dataset (yellow_banana, red_tomato, green_tomato) and copy")
    print("the resulting weights so the FastAPI server picks them up.")
    print("=================================================================\n")

    base_dir = os.path.dirname(os.path.abspath(__file__)) # SortEdu/backend/model
    root_dir = os.path.join(base_dir, "..", "..") # SortEdu/
    
    # Path to dataset.yaml
    yaml_path = os.path.join(root_dir, "dataset", "dataset.yaml")
    
    if not os.path.exists(yaml_path):
        print(f"Error: {yaml_path} not found!")
        print("Please prepare your dataset and create the dataset.yaml configuration file.")
        print("See backend/model/README.md for instructions.")
        return

    print(f"[SortEdu Train] Found dataset config at: {yaml_path}")
    print("[SortEdu Train] Loading pre-trained YOLOv8n model as base...")
    
    # Load base model
    model = YOLO("yolov8n.pt")

    # Start training
    # Note: adjust epochs and device as needed.
    # epochs=50 is a good trade-off for custom fruit classification/detection tasks.
    # If a GPU is available, device=0 is automatically selected, otherwise device='cpu'.
    print("[SortEdu Train] Starting training...")
    try:
        results = model.train(
            data=yaml_path,
            epochs=50,
            imgsz=640,
            batch=16,
            device=0 if os.environ.get("CUDA_VISIBLE_DEVICES") or shutil.which("nvcc") else "cpu",
            project="runs/detect",
            name="sortedu_model"
        )
        print("[SortEdu Train] Training completed successfully!")
    except Exception as e:
        print(f"[SortEdu Train] Error occurred during training: {e}")
        print("Falling back to CPU if GPU failed...")
        results = model.train(
            data=yaml_path,
            epochs=50,
            imgsz=640,
            batch=8,
            device="cpu",
            project="runs/detect",
            name="sortedu_model"
        )
        print("[SortEdu Train] Training completed successfully on CPU!")

    # Find the trained weights
    best_weights_path = os.path.join(root_dir, "runs", "detect", "sortedu_model", "weights", "best.pt")
    target_weights_path = os.path.join(base_dir, "custom_yolo.pt")

    if os.path.exists(best_weights_path):
        print(f"[SortEdu Train] Copying best weights to target destination: {target_weights_path}")
        shutil.copy(best_weights_path, target_weights_path)
        print("[SortEdu Train] Done! The web application will now use your newly trained custom model.")
    else:
        print(f"Error: Could not locate trained weights at {best_weights_path}")

if __name__ == "__main__":
    main()
