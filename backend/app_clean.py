#!/usr/bin/env python3
import os
import sys
import subprocess
import time
from flask import Flask, jsonify, request
from flask_cors import CORS

print("🚀 Starting Voice Control Backend...")
print("✅ No YOLO model needed - Voice commands only")

# Configure ADB PATH
os.environ['PATH'] += ';C:\\tools\\platform-tools'

app = Flask(__name__)
CORS(app)

class PhoneController:
    """Android phone control via ADB"""
    
    @staticmethod
    def get_connected_device():
        """Get currently connected device ID"""
        try:
            cmd = 'adb devices'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=3)
            lines = result.stdout.strip().split('\n')
            
            for line in lines[1:]:  # Skip header
                if 'device' in line and not line.startswith('*'):
                    device_id = line.split()[0]
                    if device_id and device_id != 'List':
                        return device_id
            return None
        except Exception as e:
            print(f"❌ Error getting device: {e}")
            return None
    
    @staticmethod
    def execute_adb_command(command):
        """Execute ADB command"""
        try:
            result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=5)
            return result.returncode == 0, result.stdout, result.stderr
        except Exception as e:
            return False, "", str(e)
    
    @staticmethod
    def make_call(phone_number):
        """Make a call"""
        device = PhoneController.get_connected_device()
        if not device:
            return False
        
        try:
            cmd = f'adb -s {device} shell am start -a android.intent.action.CALL -d tel:{phone_number}'
            subprocess.run(cmd, shell=True, capture_output=True, timeout=5)
            return True
        except Exception as e:
            print(f"Call error: {e}")
            return False
    
    @staticmethod
    def open_sms_app(phone_number):
        """Open SMS app with contact"""
        device = PhoneController.get_connected_device()
        if not device:
            return False
        
        try:
            cmd = f'adb -s {device} shell am start -a android.intent.action.SENDTO -d sms:{phone_number}'
            subprocess.run(cmd, shell=True, capture_output=True, timeout=5)
            return True
        except Exception as e:
            print(f"SMS open error: {e}")
            return False
    
    @staticmethod
    def send_sms(phone_number, message):
        """Send SMS via ADB"""
        try:
            device = PhoneController.get_connected_device()
            if not device:
                return False
            
            # Clean number
            clean_number = ''.join(filter(str.isdigit, phone_number))
            
            # Open SMS app
            cmd = f'adb -s {device} shell am start -a android.intent.action.SENDTO -d sms:{clean_number}'
            subprocess.run(cmd, shell=True, capture_output=True, timeout=5)
            time.sleep(1.5)
            
            # Clear field
            subprocess.run(f'adb -s {device} shell input keyevent 67', shell=True, capture_output=True, timeout=2)
            time.sleep(0.5)
            
            # Type message
            escaped_msg = message.replace("'", "\\'").replace('"', '\\"').replace('$', '\\$')
            cmd_text = f'adb -s {device} shell input text "{escaped_msg}"'
            subprocess.run(cmd_text, shell=True, capture_output=True, timeout=5)
            time.sleep(0.5)
            
            # Send
            subprocess.run(f'adb -s {device} shell input keyevent 9', shell=True, capture_output=True, timeout=2)
            time.sleep(0.3)
            subprocess.run(f'adb -s {device} shell input keyevent 66', shell=True, capture_output=True, timeout=2)
            
            return True
        except Exception as e:
            print(f"SMS send error: {e}")
            return False


# Routes
@app.route('/', methods=['GET'])
def index():
    return jsonify({"message": "Smart Object AI Backend - Voice Control", "status": "running"})


@app.route('/voice-control.html', methods=['GET'])
def voice_control():
    try:
        file_path = os.path.join(os.path.dirname(__file__), '..', 'voice-control.html')
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return jsonify({"error": f"File not found: {str(e)}"}), 404


@app.route('/<path:filename>', methods=['GET'])
def serve_static(filename):
    try:
        file_path = os.path.join(os.path.dirname(__file__), '..', filename)
        if os.path.isfile(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        return jsonify({"error": "File not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/phone/status', methods=['GET'])
def get_status():
    """Check phone connection status"""
    try:
        device = PhoneController.get_connected_device()
        if device:
            return jsonify({"connected": True, "device": device})
        else:
            return jsonify({"connected": False, "device": None})
    except Exception as e:
        print(f"Error in status: {e}")
        return jsonify({"connected": False, "error": str(e)})


@app.route('/api/phone/connect', methods=['POST'])
def connect_device():
    """Connect to phone"""
    try:
        data = request.json or {}
        ip = data.get('ip', '192.168.29.67')
        port = data.get('port', '5555')
        
        print(f"🔗 Connecting to {ip}:{port}...")
        cmd = f'adb connect {ip}:{port}'
        result = subprocess.run(cmd, shell=True, capture_output=True, timeout=5, text=True)
        print(f"Connect output: {result.stdout} | Error: {result.stderr}")
        
        time.sleep(1)
        
        device = PhoneController.get_connected_device()
        if device:
            print(f"✅ Connected device: {device}")
            return jsonify({"success": True, "device": device})
        else:
            print(f"❌ No device found after connect")
            return jsonify({"success": False, "message": "Connection failed"}), 400
    except subprocess.TimeoutExpired:
        print("❌ ADB connect timeout")
        return jsonify({"success": False, "error": "Connection timeout"}), 500
    except Exception as e:
        print(f"❌ Connect error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/phone/disconnect', methods=['POST'])
def disconnect_device():
    """Disconnect from phone"""
    try:
        device = PhoneController.get_connected_device()
        if device:
            cmd = f'adb disconnect {device}'
            subprocess.run(cmd, shell=True, capture_output=True, timeout=5)
            time.sleep(1)
        
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/phone/call', methods=['POST'])
def make_call():
    """Make a call"""
    try:
        device = PhoneController.get_connected_device()
        if not device:
            return jsonify({"success": False, "error": "Phone not connected"}), 400
        
        data = request.json
        phone_number = data.get('phoneNumber')
        contact = data.get('contact', 'Unknown')
        
        if not phone_number:
            return jsonify({"success": False, "error": "No phone number"}), 400
        
        success = PhoneController.make_call(phone_number)
        if success:
            return jsonify({"success": True, "message": f"Calling {contact}"})
        else:
            return jsonify({"success": False, "error": "Call failed"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/phone/message', methods=['POST'])
def open_message():
    """Open message app"""
    try:
        device = PhoneController.get_connected_device()
        if not device:
            return jsonify({"success": False, "error": "Phone not connected"}), 400
        
        data = request.json
        phone_number = data.get('phoneNumber')
        contact = data.get('contact', 'Unknown')
        
        if not phone_number:
            return jsonify({"success": False, "error": "No phone number"}), 400
        
        success = PhoneController.open_sms_app(phone_number)
        if success:
            return jsonify({"success": True, "message": f"SMS app opened for {contact}"})
        else:
            return jsonify({"success": False, "error": "Failed to open SMS"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/phone/send-message', methods=['POST'])
def send_message():
    """Send SMS message"""
    try:
        device = PhoneController.get_connected_device()
        if not device:
            return jsonify({"success": False, "error": "Phone not connected"}), 400
        
        data = request.json
        phone_number = data.get('phoneNumber')
        message = data.get('message', '')
        contact = data.get('contact', 'Unknown')
        
        if not phone_number:
            return jsonify({"success": False, "error": "No phone number"}), 400
        
        success = PhoneController.send_sms(phone_number, message)
        if success:
            return jsonify({"success": True, "message": f"SMS sent to {contact}"})
        else:
            return jsonify({"success": False, "error": "SMS failed"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
