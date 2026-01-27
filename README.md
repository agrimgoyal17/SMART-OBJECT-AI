# 🤖 Smart Object AI

**Making Every Object Intelligent**

A revolutionary software-only platform enabling digital interaction with real-world objects through AI-powered image recognition and voice commands.

---

## 👥 Team BODMAS

**Anand Engineering College (A.K.T.U. Affiliated)**

- **Prince Goyal** - Team Leader
- **Paarth Agarwal** - Team Member
- **Agrim Goyal** - Team Member
- **Sakshi Kaushik** - Team Member
- **Jay Singh** - Team Member

---

## ❌ Problem Statement

Traditional Smart Systems Face Critical Barriers:
- **Hardware Dependency** - Expensive IoT sensors and devices required
- **Installation Complexity** - Professional setup needed for each object
- **Limited Scalability** - Can't make everyday objects "smart" easily
- **High Cost** - Hardware investment prohibits mass adoption

**Core Challenge:** "How can we interact with physical objects digitally WITHOUT modifying them?"

---

## ✅ Our Solution

A purely software-based platform that transforms ANY ordinary object into a smart, interactive entity:

- ✅ **Zero Hardware** - No IoT devices needed
- ✅ **Image Recognition** - Identify objects through smartphone camera
- ✅ **Voice Commands** - Natural language interaction
- ✅ **Instant Deployment** - No installation required
- ✅ **Universal Access** - Works on mobile, tablet, and desktop

---

## 🛠️ Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Responsive Design
- Camera API
- Speech Recognition API

### Backend
- Supabase (PostgreSQL Database)
- Authentication & User Management
- Real-time Data Sync
- Cloud Storage

### Deployment
- Web-based Platform
- Cross-platform Compatible
- Progressive Web App (PWA) Ready

---

## 🚀 Setup Instructions

### Prerequisites
- VS Code (or any code editor)
- Git installed
- GitHub account
- Supabase account (free)

### Step 1: Clone/Download Project
```bash
git clone <your-repo-url>
cd smart-object-ai
```

### Step 2: Supabase Setup

1. **Create Supabase Account**
   - Go to https://supabase.com
   - Click "Start your project"
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Name: `smart-object-ai`
   - Database Password: Create a strong password
   - Region: Choose nearest to you
   - Click "Create new project" (takes 2 minutes)

3. **Get API Keys**
   - Go to Project Settings → API
   - Copy `Project URL` and `anon/public key`

4. **Create Database Tables**
   - Go to SQL Editor
   - Click "New Query"
   - Copy and paste this SQL:

```sql
-- Create scanned_objects table
CREATE TABLE scanned_objects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    object_name TEXT NOT NULL,
    object_type TEXT,
    image_url TEXT,
    confidence_score DECIMAL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create voice_commands table
CREATE TABLE voice_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    command_text TEXT NOT NULL,
    action_result TEXT,
    executed_at TIMESTAMP DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT false,
    voice_feedback BOOLEAN DEFAULT true,
    auto_save BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE scanned_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for scanned_objects
CREATE POLICY "Users can view own scans" ON scanned_objects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans" ON scanned_objects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scans" ON scanned_objects
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for voice_commands
CREATE POLICY "Users can view own commands" ON voice_commands
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commands" ON voice_commands
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own commands" ON voice_commands
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for user_preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);
```

   - Click "Run" or press F5

5. **Configure Authentication**
   - Go to Authentication → Providers
   - Enable "Email" provider
   - Confirm email: OFF (for easier testing)
   - Click "Save"

### Step 3: Update Config File

Open `js/config.js` and replace:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';
```

With your actual Supabase credentials:

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### Step 4: Test Locally

1. Open `index.html` in your browser
2. OR use VS Code Live Server:
   - Install "Live Server" extension
   - Right-click `index.html`
   - Select "Open with Live Server"

---

## 🌐 Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI** (optional)
```bash
npm install -g vercel
```

2. **Deploy via GitHub**
   - Push code to GitHub
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repo
   - Click "Deploy"
   - Done! 🎉

### Option 2: Netlify

1. Go to https://netlify.com
2. Drag & drop your `smart-object-ai` folder
3. OR connect GitHub repo
4. Deploy! 🚀

### Option 3: GitHub Pages

1. Push code to GitHub
2. Go to Repository Settings
3. Pages → Source → `main` branch
4. Save and wait for deployment

---

## 📱 Features

### 1. User Authentication
- Email/Password signup and login
- Secure session management
- Password reset (coming soon)

### 2. Object Scanner
- Camera capture or image upload
- AI object recognition (simulated)
- Confidence score display

### 3. Voice Commands
- Real-time speech recognition
- Natural language processing
- Suggested command chips

### 4. Action Execution
- Visual feedback animations
- Real-time status updates
- Action history tracking

### 5. Scan History
- View all scanned objects
- Search and filter
- Command history per object

### 6. Settings & Preferences
- Profile management
- Theme preferences
- Notification settings
- Data export

---

## 🎯 Use Cases

- 🏠 **Smart Homes** - Control everyday objects without IoT devices
- 📚 **Education** - Interactive learning tools for classrooms
- 💼 **Offices** - Productivity enhancement and automation
- ♿ **Assistive Technology** - Accessibility for people with disabilities
- 🥽 **AR/VR** - Foundation for digital twins and smart environments

---

## 📊 Database Schema

```
users (Supabase Auth)
├── id (UUID)
├── email
└── user_metadata { full_name }

scanned_objects
├── id (UUID)
├── user_id (FK → users.id)
├── object_name
├── object_type
├── image_url
├── confidence_score
└── created_at

voice_commands
├── id (UUID)
├── user_id (FK → users.id)
├── command_text
├── action_result
└── executed_at

user_preferences
├── id (UUID)
├── user_id (FK → users.id)
├── theme
├── notifications_enabled
├── voice_feedback
├── auto_save
└── updated_at
```

---

## 🐛 Troubleshooting

### Camera not working?
- Check browser permissions
- Use HTTPS (camera requires secure connection)
- Try image upload instead

### Voice recognition not working?
- Only works on Chrome/Edge browsers
- Requires microphone permission
- Use suggested command chips as alternative

### Supabase errors?
- Check if API keys are correct in `config.js`
- Verify database tables are created
- Check RLS policies are enabled

### Deploy issues?
- Make sure all files are uploaded
- Check `config.js` has correct credentials
- Verify HTTPS is enabled

---

## 📞 Support

For issues or questions:
- Email: [Your email]
- GitHub: [Your GitHub]
- Institution: Anand Engineering College

---

## 📜 License

© 2025 Team BODMAS - Smart Object AI
All Rights Reserved

---

## 🙏 Acknowledgments

- Anand Engineering College
- A.K.T.U.
- Hackathon Organizers
- Supabase Team

---

## 🌟 Future Enhancements

- [ ] Real AI/ML object detection (TensorFlow.js)
- [ ] Actual IoT device integration
- [ ] Multi-language support
- [ ] AR visualization
- [ ] Mobile app (React Native)
- [ ] Team collaboration features
- [ ] Advanced analytics dashboard

---

**Built with ❤️ by Team BODMAS**

*Making Every Object Intelligent - Zero Hardware Required!*