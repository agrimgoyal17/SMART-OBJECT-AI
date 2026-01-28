// Voice Command Handler for Phone Control
class VoiceCommandHandler {
    constructor() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.isListening = false;
            this.setupRecognition();
            this.phoneConnected = false;
            this.checkPhoneConnection();
            this.contacts = {
                'mummy': '+91XXXXXXXXXX',
                'daddy': '+91XXXXXXXXXX',
                'brother': '+91XXXXXXXXXX',
                'sister': '+91XXXXXXXXXX'
            };
            console.log('✅ VoiceCommandHandler initialized');
        } catch (e) {
            console.error('❌ Error initializing:', e);
            alert('Speech Recognition not supported!');
        }
    }

    checkPhoneConnection() {
        // Check if phone is connected to backend
        fetch('/api/phone/status')
            .then(response => response.json())
            .then(data => {
                this.phoneConnected = data.connected === true;
                console.log(`📱 Phone Connected: ${this.phoneConnected}`);
                this.updateConnectionStatus();
            })
            .catch(error => {
                console.error('Error checking phone status:', error);
                this.phoneConnected = false;
                this.updateConnectionStatus();
            });
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('phone-connection-status');
        if (statusElement) {
            if (this.phoneConnected) {
                statusElement.innerHTML = '✅ Phone Connected';
                statusElement.style.color = '#51cf66';
            } else {
                statusElement.innerHTML = '❌ Phone Not Connected - Enable USB Debugging/Bluetooth';
                statusElement.style.color = '#ff6b6b';
            }
        }
    }

    setupRecognition() {
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-IN'; // Hindi-English mix

        this.recognition.onstart = () => {
            this.isListening = true;
            console.log('Voice recognition started...');
            this.updateUI('listening');
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            console.log('Command:', finalTranscript || interimTranscript);
            
            if (finalTranscript) {
                this.processCommand(finalTranscript.toLowerCase());
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.updateUI('error', event.error);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            console.log('Voice recognition ended');
            this.updateUI('idle');
        };
    }

    startListening() {
        if (!this.phoneConnected) {
            this.updateUI('error', 'Phone not connected. Enable USB Debugging/Bluetooth.');
            this.speak('Phone is not connected. Please check your Bluetooth or USB connection.');
            return;
        }
        if (!this.isListening) {
            this.recognition.start();
        }
    }

    stopListening() {
        try {
            if (this.recognition) {
                // Use abort() instead of stop() for immediate stop
                this.recognition.abort();
                this.isListening = false;
                this.updateUI('idle', 'Stopped');
                console.log('⏹️ Listening stopped (aborted)');
            }
        } catch (e) {
            console.error('Error stopping:', e);
        }
    }

    processCommand(command) {
        console.log('Processing command:', command);

        // Call command: "call mummy" or "call daddy"
        if (command.includes('call')) {
            const contact = this.extractContact(command);
            if (contact) {
                this.executeCall(contact);
            }
        }
        // Message command: "message mummy" or "msg daddy"
        else if (command.includes('message') || command.includes('msg')) {
            const contact = this.extractContact(command);
            if (contact) {
                this.executeMessage(contact);
            }
        }
        // Send message with text: "message mummy hi how are you"
        else if (command.includes('tell') || command.includes('send')) {
            this.handleComplexCommand(command);
        }
    }

    extractContact(command) {
        for (let contact in this.contacts) {
            if (command.includes(contact)) {
                return contact;
            }
        }
        return null;
    }

    executeCall(contact) {
        const phoneNumber = this.contacts[contact];
        console.log(`Calling ${contact}: ${phoneNumber}`);
        
        this.updateUI('loading', `Calling ${contact}...`);
        
        fetch('/api/phone/call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contact: contact,
                phoneNumber: phoneNumber,
                type: 'call'
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Call initiated:', data);
                this.updateUI('success', `Calling ${contact}...`);
                this.speak(`Calling ${contact}`);
            } else {
                console.error('Call failed:', data.error);
                this.updateUI('error', `Failed: ${data.error}`);
                this.speak(`Failed to call ${contact}. ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.updateUI('error', 'Network error - check if backend is running');
            this.speak('Network error. Check your connection.');
        });
    }

    executeMessage(contact) {
        const phoneNumber = this.contacts[contact];
        console.log(`Opening message for ${contact}: ${phoneNumber}`);
        
        this.updateUI('loading', `Opening message app...`);
        
        fetch('/api/phone/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contact: contact,
                phoneNumber: phoneNumber,
                type: 'message'
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Message opened:', data);
                this.updateUI('success', `Message app opened for ${contact}`);
                this.speak(`Message app opened for ${contact}`);
            } else {
                console.error('Message failed:', data.error);
                this.updateUI('error', `Failed: ${data.error}`);
                this.speak(`Failed to open message app. ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.updateUI('error', 'Network error');
            this.speak('Network error. Check your connection.');
        });
    }

    handleComplexCommand(command) {
        // Example: "tell mummy hello" or "send message to mummy"
        const contact = this.extractContact(command);
        if (contact) {
            const message = command.replace(/tell|send|message|to|mummy|daddy|brother|sister/gi, '').trim();
            console.log(`Sending message to ${contact}: "${message}"`);
            
            if (!message) {
                this.updateUI('error', 'Please specify a message to send');
                this.speak('Please specify what message you want to send');
                return;
            }
            
            this.updateUI('loading', `Sending message to ${contact}...`);
            
            fetch('/api/phone/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contact: contact,
                    phoneNumber: this.contacts[contact],
                    message: message
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Message sent:', data);
                    this.updateUI('success', `Message sent to ${contact}`);
                    this.speak(`Message sent to ${contact}`);
                } else {
                    console.error('Send failed:', data.error);
                    this.updateUI('error', `Failed: ${data.error}`);
                    this.speak(`Failed to send message. ${data.error}`);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                this.updateUI('error', 'Network error');
                this.speak('Network error. Check your connection.');
            });
        }
    }

    speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-IN';
        window.speechSynthesis.speak(utterance);
    }

    updateUI(status, message = '') {
        const statusElement = document.getElementById('voice-status');
        if (statusElement) {
            statusElement.textContent = status.toUpperCase() + (message ? ': ' + message : '');
            statusElement.className = `voice-status ${status}`;
        }
    }

    addContact(name, phoneNumber) {
        this.contacts[name.toLowerCase()] = phoneNumber;
        console.log(`Contact added: ${name} - ${phoneNumber}`);
    }

    removeContact(name) {
        delete this.contacts[name.toLowerCase()];
        console.log(`Contact removed: ${name}`);
    }

    getContacts() {
        return this.contacts;
    }
}

// Initialize when page loads
let voiceHandler;
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Page loaded, initializing voice handler...');
    try {
        voiceHandler = new VoiceCommandHandler();
        console.log('✅ Voice handler initialized');
        
        // Refresh phone connection status every 5 seconds
        setInterval(() => {
            if (voiceHandler) {
                voiceHandler.checkPhoneConnection();
            }
        }, 5000);
    } catch (e) {
        console.error('❌ Initialization error:', e);
    }
});

// Global functions for HTML onclick handlers
function toggleVoice() {
    if (voiceHandler && voiceHandler.isListening) {
        voiceHandler.stopListening();
    } else if (voiceHandler) {
        voiceHandler.startListening();
    }
}

function startVoiceCommand() {
    console.log('Start clicked');
    if (voiceHandler) {
        voiceHandler.startListening();
    }
}

function stopVoiceCommand() {
    console.log('Stop clicked');
    if (voiceHandler) {
        voiceHandler.stopListening();
    }
}

async function connectPhone() {
    console.log('🔗 Connecting phone...');
    try {
        const response = await fetch('/api/phone/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip: '192.168.29.67', port: '5555' })
        });
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            alert('✅ Phone connected: ' + data.device);
            if (voiceHandler) voiceHandler.checkPhoneConnection();
        } else {
            alert('❌ Connection failed: ' + (data.message || data.error || 'Unknown error'));
        }
    } catch (e) {
        console.error('Fetch error:', e);
        alert('❌ Error: ' + e.message);
    }
}

async function disconnectPhone() {
    console.log('🔌 Disconnecting phone...');
    try {
        const response = await fetch('/api/phone/disconnect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            alert('✅ Phone disconnected');
            if (voiceHandler) voiceHandler.checkPhoneConnection();
        } else {
            alert('❌ Disconnection failed: ' + (data.error || 'Unknown error'));
        }
    } catch (e) {
        console.error('Fetch error:', e);
        alert('❌ Error: ' + e.message);
    }
}
