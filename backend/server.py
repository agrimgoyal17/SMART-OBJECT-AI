#!/usr/bin/env python3
import os
import subprocess
import time
from flask import Flask, jsonify, request
from flask_cors import CORS

# Setup
os.environ['PATH'] += ';C:\\tools\\platform-tools'
app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)

print("🚀 Backend Starting...")
print(f"📁 Root: {ROOT_DIR}")

@app.route('/')
def index():
    return jsonify({"ok": True})

@app.route('/voice-control.html')
def page():
    try:
        path = os.path.join(ROOT_DIR, 'voice-control.html')
        with open(path, 'r', encoding='utf-8-sig') as f:
            return f.read()
    except UnicodeDecodeError:
        try:
            with open(path, 'r', encoding='latin-1') as f:
                return f.read()
        except Exception as e:
            print(f"❌ Error loading page: {e}")
            return f"Error: {e}", 404
    except Exception as e:
        print(f"❌ Error loading page: {e}")
        return f"Error: {e}", 404

@app.route('/<path:file>')
def files(file):
    try:
        path = os.path.join(ROOT_DIR, file)
        # Use utf-8-sig to handle BOM
        with open(path, 'r', encoding='utf-8-sig') as f:
            return f.read()
    except UnicodeDecodeError:
        # Fallback to latin-1 if utf-8 fails
        try:
            with open(path, 'r', encoding='latin-1') as f:
                return f.read()
        except Exception as e:
            print(f"❌ Error loading {file}: {e}")
            return f"File error: {e}", 404
    except Exception as e:
        print(f"❌ Error loading {file}: {e}")
        return f"File not found: {file}", 404

@app.route('/api/phone/status')
def status():
    try:
        result = subprocess.run('adb devices', shell=True, capture_output=True, text=True, timeout=2)
        # Check if 192.168.29.67 appears with "device" status (not "offline")
        if '192.168.29.67' in result.stdout and 'device' in result.stdout and 'offline' not in result.stdout:
            return jsonify({"connected": True})
        return jsonify({"connected": False})
    except:
        return jsonify({"connected": False})

@app.route('/api/phone/connect', methods=['POST'])
def connect():
    try:
        subprocess.run('adb connect 192.168.29.67:5555', shell=True, capture_output=True, timeout=5)
        time.sleep(1)
        return jsonify({"success": True, "device": "192.168.29.67:5555"})
    except:
        return jsonify({"success": False}), 400

@app.route('/api/phone/disconnect', methods=['POST'])
def disconnect():
    try:
        subprocess.run('adb disconnect 192.168.29.67:5555', shell=True, capture_output=True, timeout=5)
        return jsonify({"success": True})
    except:
        return jsonify({"success": False}), 400

@app.route('/api/phone/call', methods=['POST'])
def call():
    try:
        data = request.json
        num = data.get('phoneNumber', '')
        subprocess.run(f'adb shell am start -a android.intent.action.CALL -d tel:{num}', shell=True, capture_output=True, timeout=2)
        return jsonify({"success": True})
    except:
        return jsonify({"success": False}), 400

@app.route('/api/phone/message', methods=['POST'])
def message():
    try:
        data = request.json
        num = data.get('phoneNumber', '')
        subprocess.run(f'adb shell am start -a android.intent.action.SENDTO -d sms:{num}', shell=True, capture_output=True, timeout=2)
        return jsonify({"success": True})
    except:
        return jsonify({"success": False}), 400

@app.route('/api/phone/send-message', methods=['POST'])
def send_msg():
    try:
        data = request.json
        num = data.get('phoneNumber', '')
        msg = data.get('message', '')
        
        subprocess.run(f'adb shell am start -a android.intent.action.SENDTO -d sms:{num}', shell=True, capture_output=True, timeout=2)
        time.sleep(1)
        subprocess.run('adb shell input keyevent 67', shell=True, capture_output=True, timeout=1)
        time.sleep(0.3)
        
        escaped = msg.replace("'", "\\'").replace('"', '\\"')
        subprocess.run(f'adb shell input text "{escaped}"', shell=True, capture_output=True, timeout=2)
        time.sleep(0.3)
        subprocess.run('adb shell input keyevent 9', shell=True, capture_output=True, timeout=1)
        time.sleep(0.2)
        subprocess.run('adb shell input keyevent 66', shell=True, capture_output=True, timeout=1)
        
        return jsonify({"success": True})
    except:
        return jsonify({"success": False}), 400

if __name__ == '__main__':
    print("✅ Running on http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
