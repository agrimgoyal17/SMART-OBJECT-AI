/* ===================================
   SUPABASE CONFIGURATION
   Smart Object AI - Team BODMAS
   =================================== */

// Supabase credentials - Replace with your actual values
const SUPABASE_URL = 'https://qqawdvpirqkzmzkuicjp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYXdkdnBpcnFrem16a3VpY2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzQyMTIsImV4cCI6MjA4NDc1MDIxMn0.VDB3JJUZ-xyW-lUKu_FONFXaM_z9NqkSdrhr4CSzXng';

// Wait for page to load, then initialize Supabase
if (typeof window.supabase !== 'undefined') {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabase = window.supabaseClient;
    console.log('✅ Supabase initialized');
} else {
    console.error('❌ Supabase library not loaded');
}

// Database table names
const TABLES = {
    SCANNED_OBJECTS: 'scanned_objects',
    VOICE_COMMANDS: 'voice_commands',
    USER_PREFERENCES: 'user_preferences'
};

// Object database with smart commands and actions
const OBJECT_DATABASE = {
    phone: {
        name: '📱 Smartphone',
        type: 'Electronic Device',
        icon: '📱',
        commands: ['call', 'message', 'open app', 'take photo', 'record video'],
        actions: {
            'call': { result: 'Dialing...', icon: '📞', color: '#10b981' },
            'message': { result: 'Opening messages', icon: '💬', color: '#10b981' },
            'open': { result: 'Opening app', icon: '🚀', color: '#10b981' },
            'photo': { result: 'Camera opened', icon: '📸', color: '#10b981' },
            'record': { result: 'Recording started', icon: '🎥', color: '#10b981' }
        }
    },
    laptop: {
        name: '💻 Laptop',
        type: 'Computing Device',
        icon: '💻',
        commands: ['open', 'close', 'screenshot', 'search', 'download'],
        actions: {
            'open': { result: 'Application opened', icon: '🖥️', color: '#3b82f6' },
            'close': { result: 'Application closed', icon: '❌', color: '#ef4444' },
            'screenshot': { result: 'Screenshot taken', icon: '📸', color: '#3b82f6' },
            'search': { result: 'Opening search', icon: '🔍', color: '#3b82f6' },
            'download': { result: 'Download started', icon: '⬇️', color: '#3b82f6' }
        }
    },
    tv: {
        name: '📺 Television',
        type: 'Entertainment Device',
        icon: '📺',
        commands: ['power on', 'power off', 'volume up', 'volume down', 'change channel'],
        actions: {
            'power': { result: 'TV powered on/off', icon: '⚡', color: '#8b5cf6' },
            'volume': { result: 'Volume adjusted', icon: '🔊', color: '#8b5cf6' },
            'channel': { result: 'Channel changed', icon: '📡', color: '#8b5cf6' },
            'on': { result: 'TV powered on', icon: '✅', color: '#10b981' },
            'off': { result: 'TV powered off', icon: '⏹️', color: '#ef4444' }
        }
    },
    light: {
        name: '💡 Light Bulb',
        type: 'Lighting Device',
        icon: '💡',
        commands: ['turn on', 'turn off', 'brightness', 'color', 'schedule'],
        actions: {
            'on': { result: 'Light turned on', icon: '💡', color: '#fbbf24' },
            'off': { result: 'Light turned off', icon: '🌙', color: '#64748b' },
            'brightness': { result: 'Brightness adjusted', icon: '✨', color: '#fbbf24' },
            'color': { result: 'Color changed', icon: '🎨', color: '#fbbf24' },
            'schedule': { result: 'Schedule set', icon: '⏰', color: '#fbbf24' }
        }
    },
    bottle: {
        name: '🍷 Bottle',
        type: 'Container',
        icon: '🍷',
        commands: ['fill', 'empty', 'recycle', 'analyze content'],
        actions: {
            'fill': { result: 'Refilling...', icon: '💧', color: '#06b6d4' },
            'empty': { result: 'Container emptied', icon: '♻️', color: '#06b6d4' },
            'recycle': { result: 'Marked for recycling', icon: '🔄', color: '#06b6d4' },
            'analyze': { result: 'Content analyzed', icon: '🔬', color: '#06b6d4' }
        }
    },
    ac: {
        name: '❄️ Air Conditioner',
        type: 'Climate Control',
        icon: '❄️',
        commands: ['power on', 'power off', 'temperature', 'mode', 'fan speed'],
        actions: {
            'on': { result: 'AC powered on', icon: '❄️', color: '#06b6d4' },
            'off': { result: 'AC powered off', icon: '🛑', color: '#ef4444' },
            'temperature': { result: 'Temperature set', icon: '🌡️', color: '#06b6d4' },
            'mode': { result: 'Mode changed', icon: '⚙️', color: '#06b6d4' },
            'fan': { result: 'Fan speed adjusted', icon: '💨', color: '#06b6d4' }
        }
    },
    mic: {
        name: '🎤 Microphone',
        type: 'Audio Device',
        icon: '🎤',
        commands: ['record', 'mute', 'unmute', 'test', 'stream'],
        actions: {
            'record': { result: 'Recording started', icon: '🔴', color: '#ef4444' },
            'mute': { result: 'Microphone muted', icon: '🔇', color: '#64748b' },
            'unmute': { result: 'Microphone unmuted', icon: '🔊', color: '#10b981' },
            'test': { result: 'Microphone test running', icon: '✅', color: '#3b82f6' },
            'stream': { result: 'Stream started', icon: '📡', color: '#3b82f6' }
        }
    },
    fan: {
        name: '🌀 Fan',
        type: 'Ventilation Device',
        icon: '🌀',
        commands: ['power on', 'power off', 'speed up', 'speed down', 'oscillate'],
        actions: {
            'on': { result: 'Fan powered on', icon: '💨', color: '#10b981' },
            'off': { result: 'Fan powered off', icon: '⏹️', color: '#ef4444' },
            'speed': { result: 'Speed adjusted', icon: '⚡', color: '#10b981' },
            'oscillate': { result: 'Oscillation toggled', icon: '🌀', color: '#10b981' }
        }
    },
    other: {
        name: '❓ Unknown Object',
        type: 'Other Device',
        icon: '❓',
        commands: ['identify', 'analyze', 'search', 'learn more'],
        actions: {
            'identify': { result: 'Searching database...', icon: '🔍', color: '#a855f7' },
            'analyze': { result: 'Analyzing object...', icon: '📊', color: '#a855f7' },
            'search': { result: 'Searching online...', icon: '🌐', color: '#a855f7' },
            'learn': { result: 'Learning mode activated', icon: '📚', color: '#a855f7' }
        }
    }
};