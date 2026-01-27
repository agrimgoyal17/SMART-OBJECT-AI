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