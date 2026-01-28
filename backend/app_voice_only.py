from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import subprocess
import json
from datetime import datetime

# Add ADB to PATH
os.environ['PATH'] = os.environ.get('PATH', '') + ';C:\\tools\\platform-tools'

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), '..'), static_url_path='')
CORS(app)

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
        """Send SMS via ADB using input text method"""
        try:
            import time
            
            # Extract only digits from phone number
            clean_number = ''.join(filter(str.isdigit, phone_number))
            
            # Step 1: Open SMS app with contact number
            command = f'adb shell am start -a android.intent.action.SENDTO -d sms:{clean_number}'
            subprocess.run(command, shell=True, capture_output=True, timeout=5)
            time.sleep(1.5)
            
            # Step 2: Clear compose field (DEL key press)
            subprocess.run('adb shell input keyevent 67', shell=True, capture_output=True, timeout=2)
            time.sleep(0.5)
            
            # Step 3: Type message using 'input text' (better for special characters)
            # URL encode the message for safety
            import urllib.parse
            escaped_msg = message.replace("'", "\\'").replace('"', '\\"').replace('$', '\\$')
            cmd_text = f'adb shell input text "{escaped_msg}"'
            subprocess.run(cmd_text, shell=True, capture_output=True, timeout=5)
            time.sleep(0.5)
            
            # Step 4: Send message (press ENTER or find Send button)
            # Try Tab key to move to Send button
            subprocess.run('adb shell input keyevent 9', shell=True, capture_output=True, timeout=2)
            time.sleep(0.3)
            # Press Enter/Send
            subprocess.run('adb shell input keyevent 66', shell=True, capture_output=True, timeout=2)
            
            return True
            
        except subprocess.TimeoutExpired:
            print("SMS command timeout")
            return False
        except Exception as e:
            print(f"SMS Error: {e}")
            return False

phone_controller = PhoneController()

@app.route('/', methods=['GET'])
def index():
    """Home endpoint"""
    return jsonify({
        "message": "Smart Object AI Backend - Voice Control",
        "status": "running",
        "version": "1.0"
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


@app.route('/api/phone/status', methods=['GET'])
def phone_status():
    """Check if phone is connected"""
    try:
        device = PhoneController.get_connected_device()
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
    except Exception as e:
        print(f"❌ Phone status error: {e}")
        return jsonify({
            "status": "disconnected",
            "error": str(e)
        }), 500


@app.route('/api/phone/connect', methods=['POST'])
def connect_phone():
    """Connect to phone via wireless ADB"""
    try:
        data = request.json or {}
        ip = data.get('ip', '192.168.29.67')
        port = data.get('port', '5555')
        
        # Try to connect
        cmd = f'adb connect {ip}:{port}'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        
        import time
        time.sleep(1)
        
        # Check if connected
        device = phone_controller.get_connected_device()
        if device:
            return jsonify({
                "success": True,
                "message": f"Connected to {ip}:{port}",
                "device": device
            })
        else:
            return jsonify({
                "success": False,
                "message": result.stdout or result.stderr or "Connection failed"
            }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/phone/disconnect', methods=['POST'])
def disconnect_phone():
    """Disconnect from phone"""
    try:
        device = PhoneController.get_connected_device()
        if device:
            cmd = f'adb disconnect {device}'
            subprocess.run(cmd, shell=True, capture_output=True, timeout=5)
            
            import time
            time.sleep(1)
            
            return jsonify({
                "success": True,
                "message": f"Disconnected from {device}"
            })
        else:
            return jsonify({
                "success": True,
                "message": "No device to disconnect"
            })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
def make_call():
    """Make a call from connected phone"""
    try:
        device = PhoneController.get_connected_device()
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
        
        print(f"📞 Initiating call to {contact} ({phone_number})")
        success = PhoneController.make_call(phone_number)
        
        if success:
            print(f"✅ Call initiated")
            return jsonify({
                "success": True,
                "message": f"Calling {contact}",
                "contact": contact,
                "phone_number": phone_number,
                "device": device
            })
        else:
            return jsonify({
                "success": False,
                "error": "Failed to execute call command"
            }), 500
            
    except Exception as e:
        print(f"❌ Error: {e}")
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
        
        print(f"💬 Opening message app")
        success = phone_controller.open_sms_app(phone_number)
        
        if success:
            print(f"✅ Message app opened")
            return jsonify({
                "success": True,
                "message": f"Message app opened for {contact}",
                "contact": contact,
                "phone_number": phone_number,
                "device": device
            })
        else:
            return jsonify({
                "success": False,
                "error": "Failed to open message app"
            }), 500
            
    except Exception as e:
        print(f"❌ Error: {e}")
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
        
        print(f"📨 Sending message to {contact}")
        success = phone_controller.send_sms(phone_number, message)
        
        if success:
            print(f"✅ Message operation completed")
            return jsonify({
                "success": True,
                "message": "Message sent",
                "contact": contact,
                "phone_number": phone_number,
                "device": device
            })
        else:
            phone_controller.open_sms_app(phone_number)
            return jsonify({
                "success": True,
                "message": "Message app opened - please send manually",
                "contact": contact,
                "phone_number": phone_number,
                "device": device
            })
            
    except Exception as e:
        print(f"❌ Error: {e}")
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
    success, stdout, stderr = PhoneController.execute_adb_command('adb devices')
    return jsonify({
        "adb_available": success,
        "output": stdout,
        "error": stderr,
        "device_connected": PhoneController.get_connected_device() is not None
    })


if __name__ == '__main__':
    print("🚀 Starting Voice Control Backend...")
    print("✅ No YOLO model needed - Voice commands only")
    app.run(host='0.0.0.0', port=5000, debug=True)
