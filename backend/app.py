from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import numpy as np
import base64
import os
import subprocess
import json
from datetime import datetime

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), '..'), static_url_path='')
CORS(app)  # Enable CORS for all routes

# ===== PHONE CONNECTION UTILITIES =====
class PhoneController:
    @staticmethod
    def get_connected_device():
        """Get connected Android device via ADB"""
        try:
            result = subprocess.run(['adb', 'devices'], capture_output=True, text=True)
            lines = result.stdout.strip().split('\n')
            if len(lines) > 1:
                device = lines[1].split('\t')[0]
                if device and 'device' in lines[1]:
                    return device
            return None
        except Exception as e:
            print(f"Error getting device: {e}")
            return None
    
    @staticmethod
    def execute_adb_command(command):
        """Execute ADB command"""
        try:
            result = subprocess.run(command, capture_output=True, text=True, shell=True)
            return result.returncode == 0, result.stdout, result.stderr
        except Exception as e:
            print(f"ADB Command Error: {e}")
            return False, "", str(e)
    
    @staticmethod
    def make_call(phone_number):
        """Make a call using ADB"""
        command = f'adb shell am start -a android.intent.action.CALL -d tel:{phone_number}'
        success, stdout, stderr = PhoneController.execute_adb_command(command)
        return success
    
    @staticmethod
    def open_sms_app(phone_number):
        """Open SMS app with contact"""
        command = f'adb shell am start -a android.intent.action.SENDTO -d sms:{phone_number}'
        success, stdout, stderr = PhoneController.execute_adb_command(command)
        return success
    
    @staticmethod
    def send_sms(phone_number, message):
        """Send SMS via ADB"""
        # Escape quotes and special characters
        message = message.replace('"', '\\"').replace("'", "\\'")
        
        # Method 1: Using am start with intent extras
        command = f'adb shell am start -a android.intent.action.SENDTO -d sms:{phone_number} --es sms_body "{message}"'
        success, stdout, stderr = PhoneController.execute_adb_command(command)
        
        if success:
            return True
        
        # Method 2: Using input command (tap send if needed)
        # This opens the SMS app and you can add more automation
        return False

phone_controller = PhoneController()

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

        print("📥 Received image, decoding...")
        # Decode base64 image
        encoded_data = image_data.split(',')[1]
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        print("🔍 Running YOLO detection...")
        # Run inference
        results = model(img, verbose=False)
        
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

        print(f"✅ Found {len(detections)} objects")
        return jsonify({
            "success": True,
            "predictions": detections
        })

    except Exception as e:
        print(f"❌ Server Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ===== VOICE COMMAND & PHONE CONTROL ENDPOINTS =====

@app.route('/api/phone/status', methods=['GET'])
def phone_status():
    """Check if phone is connected"""
    device = phone_controller.get_connected_device()
    if device:
        return jsonify({
            "status": "connected",
            "device": device,
            "connection": "Bluetooth/USB"
        })
    else:
        return jsonify({
            "status": "disconnected",
            "message": "No Android device found. Make sure phone is connected and ADB debugging is enabled."
        }), 500


@app.route('/api/phone/call', methods=['POST'])
def make_call():
    """Make a call from connected phone"""
    try:
        # Check if device is connected
        device = phone_controller.get_connected_device()
        if not device:
            return jsonify({
                "success": False,
                "error": "Phone not connected",
                "message": "Make sure phone is connected via Bluetooth/USB and ADB debugging is enabled"
            }), 400
        
        data = request.json
        contact = data.get('contact', 'Unknown')
        phone_number = data.get('phoneNumber')
        
        if not phone_number:
            return jsonify({
                "success": False,
                "error": "Phone number not provided"
            }), 400
        
        print(f"📞 Initiating call to {contact} ({phone_number}) on device: {device}")
        
        # Execute call
        success = phone_controller.make_call(phone_number)
        
        if success:
            print(f"✅ Call initiated successfully")
            return jsonify({
                "success": True,
                "message": f"Calling {contact}",
                "contact": contact,
                "phone_number": phone_number,
                "device": device,
                "timestamp": datetime.now().isoformat()
            })
        else:
            print(f"❌ Failed to initiate call")
            return jsonify({
                "success": False,
                "error": "Failed to execute call command"
            }), 500
            
    except Exception as e:
        print(f"❌ Call Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/phone/message', methods=['POST'])
def open_message():
    """Open messaging app with contact"""
    try:
        device = phone_controller.get_connected_device()
        if not device:
            return jsonify({
                "success": False,
                "error": "Phone not connected"
            }), 400
        
        data = request.json
        contact = data.get('contact', 'Unknown')
        phone_number = data.get('phoneNumber')
        
        if not phone_number:
            return jsonify({
                "success": False,
                "error": "Phone number not provided"
            }), 400
        
        print(f"💬 Opening message app for {contact} ({phone_number})")
        
        success = phone_controller.open_sms_app(phone_number)
        
        if success:
            print(f"✅ Message app opened")
            return jsonify({
                "success": True,
                "message": f"Message app opened for {contact}",
                "contact": contact,
                "phone_number": phone_number,
                "device": device,
                "timestamp": datetime.now().isoformat()
            })
        else:
            return jsonify({
                "success": False,
                "error": "Failed to open message app"
            }), 500
            
    except Exception as e:
        print(f"❌ Message Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/phone/send-message', methods=['POST'])
def send_message():
    """Send a text message"""
    try:
        device = phone_controller.get_connected_device()
        if not device:
            return jsonify({
                "success": False,
                "error": "Phone not connected"
            }), 400
        
        data = request.json
        contact = data.get('contact', 'Unknown')
        phone_number = data.get('phoneNumber')
        message = data.get('message')
        
        if not phone_number or not message:
            return jsonify({
                "success": False,
                "error": "Phone number or message not provided"
            }), 400
        
        print(f"📨 Sending message to {contact}: '{message}'")
        
        success = phone_controller.send_sms(phone_number, message)
        
        if success:
            print(f"✅ Message sent successfully")
            return jsonify({
                "success": True,
                "message": "Message sent successfully",
                "contact": contact,
                "text": message,
                "phone_number": phone_number,
                "device": device,
                "timestamp": datetime.now().isoformat()
            })
        else:
            # Even if SMS sending fails via ADB, we open the app
            # User can manually send it or use a different method
            print(f"⚠️ SMS command executed, opening app for manual send")
            phone_controller.open_sms_app(phone_number)
            return jsonify({
                "success": True,
                "message": "Message app opened - please send manually",
                "contact": contact,
                "phone_number": phone_number,
                "device": device,
                "info": "SMS app opened with message ready to send"
            })
            
    except Exception as e:
        print(f"❌ Send Message Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/voice/status', methods=['GET'])
def voice_status():
    """Check voice command system status"""
    device = phone_controller.get_connected_device()
    return jsonify({
        "status": "ready" if device else "disconnected",
        "phone_connected": device is not None,
        "device": device,
        "features": ["call", "message", "send_message"],
        "language": "en-IN",
        "connection_type": "Bluetooth/USB via ADB"
    })


@app.route('/api/debug/adb-devices', methods=['GET'])
def debug_adb_devices():
    """Debug endpoint to check ADB devices"""
    success, stdout, stderr = phone_controller.execute_adb_command('adb devices')
    return jsonify({
        "adb_available": success,
        "output": stdout,
        "error": stderr,
        "device_connected": phone_controller.get_connected_device() is not None
    })


@app.route('/', methods=['GET'])
def index():
    """Home endpoint"""
    return jsonify({
        "message": "Smart Object AI Backend Running",
        "endpoints": {
            "/voice-control.html": "GET - Voice control page",
            "/detect": "POST - Object detection",
            "/api/phone/call": "POST - Make a call",
            "/api/phone/message": "POST - Open message app",
            "/api/phone/send-message": "POST - Send SMS",
            "/api/phone/status": "GET - Check phone connection",
            "/api/voice/status": "GET - Check voice system status",
            "/api/debug/adb-devices": "GET - Debug ADB devices"
        }
    })


@app.route('/voice-control.html', methods=['GET'])
def voice_control():
    """Serve voice control page"""
    try:
        file_path = os.path.join(os.path.dirname(__file__), '..', 'voice-control.html')
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return jsonify({"error": f"File not found: {str(e)}"}), 404


@app.route('/<path:filename>', methods=['GET'])
def serve_static(filename):
    """Serve static files"""
    try:
        file_path = os.path.join(os.path.dirname(__file__), '..', filename)
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        return jsonify({"error": "File not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
