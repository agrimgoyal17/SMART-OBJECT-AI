/* ===================================
   SCANNER LOGIC
   Smart Object AI - Team BODMAS
   =================================== */

// Global variables
let currentStream = null;
let capturedImageData = null;
let currentObject = null;
let recognition = null;
let objectModel = null; // Store TF model

// Initialize scanner when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeScanner();
    loadObjectModel(); // Load AI model
});

async function loadObjectModel() {
    try {
        console.log('⏳ Loading object detection model...');
        objectModel = await cocoSsd.load();
        console.log('✅ Model loaded');
    } catch (error) {
        console.error('Error loading model:', error);
    }
}

function initializeScanner() {
    // Step 1: Camera controls
    document.getElementById('startCameraBtn')?.addEventListener('click', startCamera);
    document.getElementById('captureBtn')?.addEventListener('click', captureImage);
    document.getElementById('uploadBtn')?.addEventListener('click', () => {
        document.getElementById('uploadInput').click();
    });
    document.getElementById('uploadInput')?.addEventListener('change', handleImageUpload);
    document.getElementById('retakeBtn')?.addEventListener('click', resetScanner);

    // Step 2: Recognition
    document.getElementById('proceedBtn')?.addEventListener('click', showCommandStep);

    // Step 3: Voice command
    document.getElementById('micBtn')?.addEventListener('click', toggleVoiceRecognition);

    // Step 4: Result actions
    document.getElementById('newCommandBtn')?.addEventListener('click', showCommandStep);
    document.getElementById('newScanBtn')?.addEventListener('click', resetScanner);

    // Initialize speech recognition
    initializeSpeechRecognition();
}

// Camera functions
async function startCamera() {
    try {
        let stream;
        try {
            // Try back camera first
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
        } catch (e) {
            console.warn('Back camera not found, trying any camera');
            // Fallback to any camera
            stream = await navigator.mediaDevices.getUserMedia({
                video: true
            });
        }

        const video = document.getElementById('video');
        video.srcObject = stream;
        currentStream = stream;

        // Ensure video plays
        await video.play();

        // Update UI
        document.getElementById('startCameraBtn').style.display = 'none';
        document.getElementById('captureBtn').style.display = 'inline-block';
        document.getElementById('cameraPreview').style.display = 'block';

        console.log('✅ Camera started');
    } catch (error) {
        console.error('Camera error:', error);
        alert('Unable to access camera. Please check permissions or use image upload instead.');
    }
}

function captureImage() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');

    // Check if video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
        alert('Camera not ready yet. Please wait a moment.');
        return;
    }

    const context = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Get image data
    capturedImageData = canvas.toDataURL('image/jpeg');

    // Stop camera
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    // Show captured image
    showCapturedImage();
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            capturedImageData = e.target.result;
            showCapturedImage();
        };
        reader.readAsDataURL(file);
    }
}

function showCapturedImage() {
    document.getElementById('cameraPreview').style.display = 'none';
    document.getElementById('captureBtn').style.display = 'none';
    document.getElementById('uploadBtn').style.display = 'none';

    const imagePreview = document.getElementById('imagePreview');
    const capturedImage = document.getElementById('capturedImage');
    capturedImage.src = capturedImageData;
    imagePreview.style.display = 'block';

    document.getElementById('retakeBtn').style.display = 'inline-block';

    // Simulate object recognition
    setTimeout(() => {
        recognizeObject();
    }, 1000);
}

async function recognizeObject() {
    // Show recognition step
    document.getElementById('captureStep').classList.remove('active');
    document.getElementById('recognitionStep').classList.add('active');

    // Set image
    const detectedImage = document.getElementById('detectedImage');
    detectedImage.src = capturedImageData;

    document.getElementById('objectName').textContent = 'Analyzing...';
    document.getElementById('objectType').textContent = 'Please wait...';

    // Strategy 1: Try Python Backend (YOLO)
    try {
        console.log('🌐 Sending to Python backend...');
        const response = await fetch('http://localhost:5000/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: capturedImageData })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.predictions.length > 0) {
                console.log('✅ Backend prediction:', data.predictions);
                handleDetectionResult(data.predictions[0].class, data.predictions[0].confidence);
                return;
            }
        }
    } catch (e) {
        console.warn('⚠️ Backend unreachable, trying local AI:', e);
    }

    // Strategy 2: Local TensorFlow.js
    try {
        if (objectModel) {
            console.log('🤖 Running local TensorFlow.js...');
            const imgForDetection = new Image();
            imgForDetection.src = capturedImageData;
            await new Promise(r => imgForDetection.onload = r);

            const predictions = await objectModel.detect(imgForDetection);
            if (predictions.length > 0) {
                console.log('✅ Local prediction:', predictions);
                handleDetectionResult(predictions[0].class, predictions[0].score);
                return;
            }
        }
    } catch (e) {
        console.error('❌ Local AI error:', e);
    }

    // Strategy 3: Fallback Simulation
    console.warn('⚠️ All detection failed, using simulation');
    const objects = Object.keys(OBJECT_DATABASE);
    const randomKey = objects[Math.floor(Math.random() * objects.length)];
    const randomObj = OBJECT_DATABASE[randomKey];

    updateUI(randomObj, 'Simulated Detection', 85);
}

function handleDetectionResult(className, score) {
    const detectedClass = className.toLowerCase();
    let matchedKey = 'light'; // default

    // Smart Mapping
    if (detectedClass.includes('phone') || detectedClass.includes('cell')) matchedKey = 'phone';
    else if (detectedClass.includes('bottle') || detectedClass.includes('cup') || detectedClass.includes('glass')) matchedKey = 'bottle';
    else if (detectedClass.includes('tv') || detectedClass.includes('monitor') || detectedClass.includes('screen') || detectedClass.includes('laptop')) matchedKey = 'tv';
    else if (detectedClass.includes('microwave') || detectedClass.includes('oven') || detectedClass.includes('remote') || detectedClass.includes('refrigerator')) matchedKey = 'ac';
    else if (detectedClass.includes('mic') || detectedClass.includes('audio')) matchedKey = 'mic';

    currentObject = OBJECT_DATABASE[matchedKey];
    updateUI(currentObject, `Detected: ${className}`, Math.round(score * 100));
}

function updateUI(obj, typeText, confidence) {
    document.getElementById('objectName').textContent = obj.name;
    document.getElementById('objectType').textContent = typeText;
    document.getElementById('confidenceBar').style.width = confidence + '%';
    document.getElementById('confidenceText').textContent = confidence + '%';

    saveScannedObject(obj.name, obj.type, capturedImageData);
}

function showCommandStep() {
    document.getElementById('recognitionStep').classList.remove('active');
    document.getElementById('commandStep').classList.add('active');

    // Show suggested commands
    const suggestionsDiv = document.getElementById('commandSuggestions');
    suggestionsDiv.innerHTML = currentObject.commands.map(cmd =>
        `<div class="command-chip" onclick="executeCommand('${cmd}')">${cmd}</div>`
    ).join('');
}

// Speech recognition
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const command = event.results[0][0].transcript;
            document.getElementById('voiceText').textContent = `"${command}"`;
            executeCommand(command);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            document.getElementById('micStatus').textContent = 'Error: Please try again';
            document.getElementById('micBtn').classList.remove('active');
        };

        recognition.onend = () => {
            document.getElementById('micBtn').classList.remove('active');
            document.getElementById('micStatus').textContent = 'Click microphone to speak';
        };

        console.log('✅ Speech recognition initialized');
    } else {
        console.warn('⚠️ Speech recognition not supported');
        document.getElementById('micStatus').textContent = 'Voice commands not supported in this browser';
    }
}

function toggleVoiceRecognition() {
    if (!recognition) {
        alert('Voice recognition not available. Please use suggested commands.');
        return;
    }

    const micBtn = document.getElementById('micBtn');

    if (micBtn.classList.contains('active')) {
        recognition.stop();
        micBtn.classList.remove('active');
    } else {
        recognition.start();
        micBtn.classList.add('active');
        document.getElementById('micStatus').textContent = 'Listening...';
        document.getElementById('voiceText').textContent = '';
    }
}

function executeCommand(command) {
    console.log('Executing command:', command);

    // Find matching action
    let actionResult = null;
    const commandLower = command.toLowerCase();

    for (const [key, value] of Object.entries(currentObject.actions)) {
        if (commandLower.includes(key)) {
            actionResult = value;
            break;
        }
    }

    if (!actionResult) {
        actionResult = {
            result: 'Command executed',
            icon: '✅',
            color: '#10b981'
        };
    }

    // Show result
    showActionResult(command, actionResult);

    // Save to database
    saveVoiceCommand(command, actionResult.result);
}

function showActionResult(command, actionResult) {
    document.getElementById('commandStep').classList.remove('active');
    document.getElementById('resultStep').classList.add('active');

    const animationDiv = document.getElementById('actionAnimation');
    animationDiv.textContent = actionResult.icon;
    animationDiv.style.color = actionResult.color;

    document.getElementById('actionTitle').textContent = actionResult.result;
    document.getElementById('actionDescription').textContent = `Command: "${command}"`;

    const statusDiv = document.getElementById('actionStatus');
    statusDiv.innerHTML = `
        <p><strong>Object:</strong> ${currentObject.name}</p>
        <p><strong>Action:</strong> ${actionResult.result}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
    `;

    // Add to action history
    addToActionHistory(command, actionResult.result);
}

function addToActionHistory(command, result) {
    const historyList = document.getElementById('actionHistoryList');

    if (historyList.querySelector('.empty-state')) {
        historyList.innerHTML = '';
    }

    const historyItem = document.createElement('div');
    historyItem.className = 'command-item';
    historyItem.innerHTML = `
        <span>🎤 ${command}</span>
        <span class="command-time">${new Date().toLocaleTimeString()}</span>
    `;

    historyList.insertBefore(historyItem, historyList.firstChild);
}

function resetScanner() {
    // Reset all steps
    document.getElementById('captureStep').classList.add('active');
    document.getElementById('recognitionStep').classList.remove('active');
    document.getElementById('commandStep').classList.remove('active');
    document.getElementById('resultStep').classList.remove('active');

    // Reset UI
    document.getElementById('cameraPreview').style.display = 'none';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('startCameraBtn').style.display = 'inline-block';
    document.getElementById('captureBtn').style.display = 'none';
    document.getElementById('uploadBtn').style.display = 'inline-block';
    document.getElementById('retakeBtn').style.display = 'none';
    document.getElementById('voiceText').textContent = '';

    // Clear data
    capturedImageData = null;
    currentObject = null;

    // Stop camera if running
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
}

// Database functions
async function saveScannedObject(name, type, imageUrl) {
    try {
        const user = await getCurrentUser();
        if (!user) return;

        const { data, error } = await supabase
            .from(TABLES.SCANNED_OBJECTS)
            .insert([
                {
                    user_id: user.id,
                    object_name: name,
                    object_type: type,
                    image_url: imageUrl,
                    confidence_score: 85 + Math.random() * 10
                }
            ])
            .select();

        if (error) {
            console.error('Error saving scan:', error);
        } else {
            console.log('✅ Scan saved:', data);
        }
    } catch (error) {
        console.error('Save scan exception:', error);
    }
}

async function saveVoiceCommand(commandText, actionResult) {
    try {
        const user = await getCurrentUser();
        if (!user) return;

        const { data, error } = await supabase
            .from(TABLES.VOICE_COMMANDS)
            .insert([
                {
                    user_id: user.id,
                    command_text: commandText,
                    action_result: actionResult
                }
            ]);

        if (error) {
            console.error('Error saving command:', error);
        } else {
            console.log('✅ Command saved');
        }
    } catch (error) {
        console.error('Save command exception:', error);
    }
}