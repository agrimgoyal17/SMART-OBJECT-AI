📱 WIRELESS ADB SETUP - STEP BY STEP
===================================

## ⚠️ IMPORTANT: USB Cable First, Then Wireless!

Wireless ADB enable karne ke liye **pehle USB cable se connect karna padta hai**.

---

## STEP 1: USB Cable Se Connect Karo

Phone ko USB cable se laptop mein plug karo:

```powershell
$env:Path = $env:Path + ";C:\tools\platform-tools"
adb devices
```

Should show phone serial number

---

## STEP 2: Phone Mein Wireless Debugging Enable Karo

**Phone Settings:**
1. Go to Settings → Developer Options
2. Look for **"Wireless debugging"** (ya "Wireless ADB debugging")
3. **Turn it ON** ✅
4. You'll see a dialog with IP and port

---

## STEP 3: Get Phone Details

Jab wireless debugging ON karo, phone pe dikhai dega:
```
IP: 192.168.x.x
Port: 5555
```

Ya check karo:
```
Settings → Developer Options → Wireless Debugging
→ Should show IP address
```

---

## STEP 4: Enable Wireless Debugging via ADB (USB Cable Connected)

PowerShell mein (USB still connected):

```powershell
$env:Path = $env:Path + ";C:\tools\platform-tools"

# Enable wireless debugging (USB connected)
adb tcpip 5555

# You'll see: restarting in TCP mode
```

---

## STEP 5: Now Disconnect USB and Connect Wirelessly

Ab USB cable nikal do aur Wi-Fi se connect karo:

```powershell
# Connect via Wi-Fi (IP from step 3)
adb connect 192.168.29.67:5555

# Check
adb devices
```

Should show:
```
List of attached devices
192.168.29.67:5555         device
```

---

## 🎯 COMPLETE WORKFLOW

```powershell
# 1. USB cable connected
adb devices
# Shows: ABC123XYZ    device

# 2. Enable TCP/IP (USB still connected)
adb tcpip 5555
# Shows: restarting in TCP mode port: 5555

# 3. Disconnect USB cable

# 4. Connect via Wi-Fi
adb connect 192.168.29.67:5555
# Shows: connected to 192.168.29.67:5555

# 5. Verify
adb devices
# Shows: 192.168.29.67:5555    device
```

---

## ❌ If Connection Fails

**Try these steps:**

```powershell
# Kill ADB daemon
adb kill-server

# Wait
Start-Sleep -Seconds 2

# Start again
adb start-server

# Try connecting again
adb connect 192.168.29.67:5555
```

---

## 📋 TROUBLESHOOTING

**Issue: "Connection refused"**
- USB cable nahi lagaya pehle
- Wireless debugging disable hai phone pe
- Port 5555 blocked hai
- Solution: USB se connect karke phir wireless enable karo

**Issue: "Cannot resolve host"**
- IP address galat hai
- Phone disconnected Wi-Fi se
- Solution: Confirm phone IP again

**Issue: "unauthorized"**
- Phone pe authorization diya nahi
- Solution: Check phone screen for prompt

---

## ✅ SUCCESS

Jab connected hoga:

```powershell
adb devices
# Output:
List of attached devices
192.168.29.67:5555         device
```

---

## 🎤 VOICE COMMANDS READY!

Ab browser kholo:
```
http://localhost:5000/voice-control.html
```

Should show:
```
✅ Phone Connected
```

Phir:
1. Add contacts
2. Say: "Call Mummy"
3. Phone will dial! 📞

---

**Ab USB cable laga ke try karte hain!** 🔌
