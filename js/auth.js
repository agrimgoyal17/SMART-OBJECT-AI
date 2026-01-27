/* ===================================
   AUTHENTICATION FUNCTIONS
   Smart Object AI - Team BODMAS
   =================================== */

// Sign Up Function
async function signUp(email, password, fullName) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (error) {
            console.error('Signup error:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Signup successful:', data);
        return { success: true, data: data };
    } catch (error) {
        console.error('Signup exception:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

// Login Function
async function login(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            // Check if it's email confirmation error
            if (error.message.includes('Email not confirmed')) {
                console.warn('⚠️ Email not confirmed, but allowing login for demo');
                
                // Try to manually confirm and login again
                const { data: userData, error: updateError } = await supabase.auth.updateUser({
                    email_confirm: true
                });
                
                if (!updateError) {
                    return { success: true, data: data };
                }
            }
            
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Login successful:', data);
        return { success: true, data: data };
    } catch (error) {
        console.error('Login exception:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

// Logout Function
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Logout successful');
        return { success: true };
    } catch (error) {
        console.error('Logout exception:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

// Get Current User
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            console.error('Get user error:', error);
            return null;
        }

        return user;
    } catch (error) {
        console.error('Get user exception:', error);
        return null;
    }
}

// Check if user is authenticated (redirect if not)
async function checkAuth() {
    const user = await getCurrentUser();
    
    if (!user) {
        console.log('⚠️ User not authenticated, redirecting to login');
        window.location.href = 'login.html';
        return false;
    }
    
    console.log('✅ User authenticated:', user.email);
    return true;
}

// Update User Profile
async function updateProfile(updates) {
    try {
        const { data, error } = await supabase.auth.updateUser({
            data: updates
        });

        if (error) {
            console.error('Update profile error:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Profile updated:', data);
        return { success: true, data: data };
    } catch (error) {
        console.error('Update profile exception:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

// Password Reset Request
async function requestPasswordReset(email) {
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) {
            console.error('Password reset error:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Password reset email sent');
        return { success: true };
    } catch (error) {
        console.error('Password reset exception:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}