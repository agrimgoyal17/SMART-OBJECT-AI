# Voice Command Setup - Step 3

## 📱 Phone Connection Methods

### Option 1: Android (Recommended) - Using ADB
**Android Debug Bridge (ADB)** allows your laptop to control an Android phone via USB.

#### Setup Steps:
1. **Enable USB Debugging on Phone:**
   - Go to Settings → About Phone
   - Tap Build Number 7 times to enable Developer Mode
   - Go back to Settings → Developer Options
   - Enable USB Debugging

2. **Install ADB on Your Laptop:**
   ```powershell
   # Using Chocolatey (if you have it)
   choco install adb
   
   # Or download Android SDK Platform Tools
   # from: https://developer.android.com/tools/releases/platform-tools
   ```

3. **Connect Phone via USB:**
   - Plug your phone into your laptop with USB cable
   - Confirm the connection prompt on your phone

4. **Test Connection:**
   ```powershell
   adb devices
   # Should show your phone's serial number
   ```

5. **Update backend (app.py):**
   ```python
   import os
   
   @app.route('/api/phone/call', methods=['POST'])
   def make_call():
       data = request.json
       phone_number = data.get('phoneNumber')
       os.system(f'adb shell am start -a android.intent.action.CALL -d tel:{phone_number}')
       return jsonify({"success": True})
   
   @app.route('/api/phone/send-message', methods=['POST'])
   def send_message():
       data = request.json
       phone_number = data.get('phoneNumber')
       message = data.get('message')
       os.system(f'adb shell am start -a android.intent.action.SENDTO -d sms:{phone_number} --es sms_body "{message}"')
       return jsonify({"success": True})
   ```

---

### Option 2: Windows Phone Link (Windows + iPhone/Android)
If you want to use Windows Phone Link:

1. **Install Phone Link:**
   - Open Microsoft Store
   - Search for "Phone Link"
   - Install it

2. **Link Your Phone:**
   - Open Phone Link on your laptop
   - Follow the setup wizard
   - Scan QR code from your phone

3. **Enable Phone Link API:**
   - Phone Link has built-in SMS sending capability
   - You can access it via Windows APIs

---

### Option 3: Custom Mobile App
Create a simple mobile app that:
- Receives REST API calls from your laptop
- Executes phone functions (calls, messages, etc.)
- Communicates via local network or internet

---

## 🎤 Voice Command Usage

### Step 1: Open Voice Control Page
```
http://localhost:5000/voice-control.html
```

### Step 2: Add Contacts
- Click "Add Contact"
- Enter name: "Mummy"
- Enter phone: "+91XXXXXXXXXX"
- Click Add

### Step 3: Start Voice Commands
- Click the microphone button or "Start Listening"
- Say: **"Call Mummy"**
- Your phone will make the call!

### Available Commands:
```
"Call [Contact Name]"      → Makes a phone call
"Message [Contact Name]"   → Opens message app
"Send message to [Name]    → Sends a text message
[Message text]"
```

---

## 🔧 Troubleshooting

### Issue: "Microphone not working"
- **Solution:** Check browser permissions for microphone access
- Go to Settings → Privacy → Microphone
- Allow your localhost/domain

### Issue: "Phone not connecting"
- **Solution:** Check ADB connection
  ```powershell
  adb devices
  adb kill-server
  adb start-server
  ```

### Issue: "Commands not executing"
- **Solution:** Check backend is running
  ```powershell
  python backend/app.py
  ```

---

## 📊 Backend API Endpoints

| Endpoint | Method | Function |
|----------|--------|----------|
| `/api/phone/call` | POST | Make a call |
| `/api/phone/message` | POST | Open message app |
| `/api/phone/send-message` | POST | Send text message |
| `/api/voice/status` | GET | Check voice system status |

---

## 🚀 Next Steps

1. Choose your phone connection method (ADB recommended for Android)
2. Update `backend/app.py` with the integration code
3. Test the voice commands
4. Add more contacts as needed
5. Extend with more commands (SMS, WhatsApp, etc.)

---

## 📝 Example Voice Command Flow

```
User: "Call Mummy"
         ↓
Browser: Records audio
         ↓
Web Speech API: Recognizes "Call Mummy"
         ↓
Frontend: Extracts contact "mummy"
         ↓
POST /api/phone/call with phone number
         ↓
Backend: Receives request
         ↓
ADB: Executes "adb shell am start -a android.intent.action.CALL"
         ↓
Phone: Makes the call ✅
```

---

## 🎯 Future Enhancements

- [ ] WhatsApp message integration
- [ ] Email sending via voice
- [ ] Alarm/Timer management
- [ ] Calendar integration
- [ ] Weather updates
- [ ] YouTube/Music control
- [ ] Smart home automation
