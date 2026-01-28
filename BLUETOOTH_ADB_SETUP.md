# Bluetooth Android Phone Setup - ADB Configuration

## 🔧 Prerequisites
- Android Phone (Aapka phone)
- USB Cable (Micro USB ya USB-C)
- Windows Laptop
- Python installed
- ADB installed

---

## ⚙️ STEP 1: Install ADB (Android Debug Bridge)

### Option A: Using Chocolatey (Recommended)
```powershell
# Run PowerShell as Administrator
choco install adb -y
```

### Option B: Manual Installation
1. Download: https://developer.android.com/tools/releases/platform-tools
2. Extract to `C:\platform-tools`
3. Add to PATH:
   - Settings → Environment Variables
   - Add: `C:\platform-tools`
   - Restart PowerShell

### Verify Installation
```powershell
adb version
# Should show: Android Debug Bridge version X.X.X
```

---

## 📱 STEP 2: Enable USB Debugging on Your Android Phone

1. **Open Settings** → **About Phone**
2. Tap **Build Number** 7 times quickly
3. Go back to Settings → **Developer Options** (now visible)
4. Enable **USB Debugging**
5. (Optional) Enable **Bluetooth Debugging** if available

---

## 🔗 STEP 3: Connect Your Phone to Laptop

### Option A: USB Connection (Faster)
1. Plug phone into laptop with USB cable
2. Choose "File Transfer" mode on phone (if prompted)
3. Allow USB Debugging on phone when prompted

### Option B: Bluetooth Connection
1. Pair phone with laptop via Bluetooth first
2. Then connect ADB over Bluetooth

#### Connect via Bluetooth ADB:
```powershell
# On phone terminal or via ADB:
adb connect <phone_ip_address>:5555

# OR if already paired via Bluetooth:
adb connect 127.0.0.1:5555
```

---

## ✅ STEP 4: Verify Connection

```powershell
# Check connected devices
adb devices

# Output should show:
# List of attached devices
# XXXXXXXXXXXXXX    device
# (or offline if connection issue)
```

If shows **offline**:
```powershell
# Restart ADB
adb kill-server
adb start-server
adb devices
```

---

## 🎯 STEP 5: Update requirements.txt

Add ADB dependency to your Python project:

```bash
pip install adb-shell
pip install ppadb
```

Or just keep using subprocess calls (already implemented).

---

## 🚀 STEP 6: Test Backend Commands

Run your Flask backend:
```powershell
cd d:\Smart Object AI
python backend\app.py
```

### Test Phone Connection:
```powershell
# In another PowerShell window
curl http://localhost:5000/api/phone/status
```

Expected response:
```json
{
    "status": "connected",
    "device": "XXXXXXXXXXXXXX",
    "connection": "Bluetooth/USB via ADB"
}
```

### Test Call Command:
```powershell
$body = @{
    contact = "Mummy"
    phoneNumber = "+919876543210"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/phone/call" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

### Test Message Command:
```powershell
$body = @{
    contact = "Mummy"
    phoneNumber = "+919876543210"
    message = "Hi Mummy, this is from my laptop!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/phone/send-message" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

---

## 🎤 STEP 7: Use Voice Commands

1. Open in browser: `http://localhost:5000/voice-control.html`
2. Check phone connection status (should show ✅ Connected)
3. Click microphone
4. Say: **"Call Mummy"**
5. Phone should make the call!

---

## 🔍 Troubleshooting

### Problem: "adb devices" shows "List of attached devices" but no devices

**Solution 1:** Check USB Debugging
- Go to Phone Settings → Developer Options
- Verify "USB Debugging" is enabled
- Unplug and replug USB cable
- Run `adb devices` again

**Solution 2:** Restart ADB
```powershell
adb kill-server
adb start-server
adb devices
```

**Solution 3:** Update ADB drivers
- Download latest Android SDK Platform Tools
- Replace old adb.exe file

---

### Problem: "Permission denied" when making calls

**Solution:** Grant permissions via ADB
```powershell
adb shell pm grant android.permission.CALL_PHONE
adb shell pm grant android.permission.SEND_SMS
```

---

### Problem: Voice commands not working

**Check:**
1. Microphone permission in browser (Settings → Privacy → Microphone)
2. Phone connection status shows ✅ Connected
3. Backend is running (`python backend/app.py`)
4. Add actual phone numbers in contacts

---

### Problem: Messages not sending

**Option 1:** Manual Send
- SMS opens automatically
- You can type message and send manually

**Option 2:** Use SMS API
```python
# Install Twilio
pip install twilio

# Update backend to use Twilio
```

---

## 📋 Commands Cheatsheet

```powershell
# Check connection
adb devices

# Restart services
adb kill-server
adb start-server

# Make call
adb shell am start -a android.intent.action.CALL -d tel:+919876543210

# Open SMS app
adb shell am start -a android.intent.action.SENDTO -d sms:+919876543210

# Send SMS
adb shell am start -a android.intent.action.SENDTO -d sms:+919876543210 --es sms_body "Your message here"

# Get phone info
adb shell getprop ro.product.model

# Unlock screen
adb shell input keyevent 82

# Take screenshot
adb shell screencap -p /sdcard/screenshot.png
```

---

## ✨ Next Steps

1. ✅ Install ADB
2. ✅ Enable USB Debugging
3. ✅ Connect phone
4. ✅ Verify connection
5. ✅ Run backend
6. ✅ Test voice commands
7. Add more contacts
8. Extend with more features (WhatsApp, Email, etc.)

---

## 🎯 Complete Example Flow

```
User says: "Call Mummy"
    ↓
Browser records audio
    ↓
Web Speech API recognizes: "call mummy"
    ↓
Frontend extracts: contact = "mummy", phone = "+919876543210"
    ↓
POST /api/phone/call
    ↓
Backend receives request
    ↓
ADB executes: adb shell am start -a android.intent.action.CALL -d tel:+919876543210
    ↓
Phone: Makes call to Mummy ✅
    ↓
Backend returns: {"success": true, "message": "Calling Mummy"}
    ↓
Frontend plays sound: "Calling Mummy"
    ↓
User sees: ✅ SUCCESS: Calling Mummy...
```

---

## 💡 Pro Tips

1. **Keep phone screen on** during testing (Settings → Developer Options → Stay Awake)
2. **Add multiple contacts** - "Mummy", "Daddy", "Brother", "Sister"
3. **Test with USB first**, then try Bluetooth
4. **Use Chrome/Edge browser** for best voice recognition
5. **Keep backend running** in background while testing

---

## 📞 Common Phone Numbers Format

- India: +919876543210
- US: +14155552671
- UK: +442071838750

Always include country code (+) and area code!
