from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import numpy as np
import base64

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load YOLOv8 model (pretrained on COCO)
try:
    print("⏳ Loading YOLOv8 model...")
    model = YOLO("yolov8n.pt")  # small model for speed
    print("✅ YOLOv8 model loaded")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

@app.route('/detect', methods=['POST'])
def detect_object():
    if not model:
        return jsonify({"error": "Model not loaded"}), 500

    try:
        data = request.json
        image_data = data.get('image')

        if not image_data:
            return jsonify({"error": "No image provided"}), 400

        # Decode base64 image
        encoded_data = image_data.split(',')[1]
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Run inference
        results = model(img)
        
        # Process results
        detections = []
        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                label = model.names[class_id]
                
                detections.append({
                    "class": label,
                    "confidence": confidence
                })

        # Sort by confidence
        detections.sort(key=lambda x: x['confidence'], reverse=True)

        return jsonify({
            "success": True,
            "predictions": detections
        })

    except Exception as e:
        print(f"Server Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
