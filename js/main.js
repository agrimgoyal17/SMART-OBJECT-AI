/* ===================================
   HELPER FUNCTIONS & DATABASE QUERIES
   Smart Object AI - Team BODMAS
   =================================== */

// Get user statistics
async function getStats() {
    try {
        const user = await getCurrentUser();
        if (!user) return { scans: 0, commands: 0, actions: 0 };

        // Count scanned objects
        const { count: scanCount, error: scanError } = await supabase
            .from(TABLES.SCANNED_OBJECTS)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        // Count voice commands
        const { count: commandCount, error: commandError } = await supabase
            .from(TABLES.VOICE_COMMANDS)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if (scanError || commandError) {
            console.error('Error fetching stats:', scanError || commandError);
            return { scans: 0, commands: 0, actions: 0 };
        }

        return {
            scans: scanCount || 0,
            commands: commandCount || 0,
            actions: commandCount || 0
        };
    } catch (error) {
        console.error('Get stats exception:', error);
        return { scans: 0, commands: 0, actions: 0 };
    }
}

// Get recent activity
async function getRecentActivity(limit = 10) {
    try {
        const user = await getCurrentUser();
        if (!user) return [];

        // Get recent scans
        const { data: scans, error: scanError } = await supabase
            .from(TABLES.SCANNED_OBJECTS)
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        // Get recent commands
        const { data: commands, error: commandError } = await supabase
            .from(TABLES.VOICE_COMMANDS)
            .select('*')
            .eq('user_id', user.id)
            .order('executed_at', { ascending: false })
            .limit(limit);

        if (scanError || commandError) {
            console.error('Error fetching activity:', scanError || commandError);
            return [];
        }

        // Combine and format activities
        const activities = [];

        if (scans) {
            scans.forEach(scan => {
                activities.push({
                    type: 'scan',
                    description: `Scanned ${scan.object_name}`,
                    created_at: scan.created_at
                });
            });
        }

        if (commands) {
            commands.forEach(cmd => {
                activities.push({
                    type: 'command',
                    description: `Command: ${cmd.command_text}`,
                    created_at: cmd.executed_at
                });
            });
        }

        // Sort by date and return
        return activities
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit);
    } catch (error) {
        console.error('Get activity exception:', error);
        return [];
    }
}

// Get scan history with commands
async function getScanHistory() {
    try {
        const user = await getCurrentUser();
        if (!user) return [];

        // Get all scans
        const { data: scans, error: scanError } = await supabase
            .from(TABLES.SCANNED_OBJECTS)
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (scanError) {
            console.error('Error fetching scan history:', scanError);
            return [];
        }

        // Get commands for each scan
        if (scans && scans.length > 0) {
            for (let scan of scans) {
                const { data: commands, error: cmdError } = await supabase
                    .from(TABLES.VOICE_COMMANDS)
                    .select('*')
                    .eq('user_id', user.id)
                    .order('executed_at', { ascending: false })
                    .limit(5);

                scan.commands = commands || [];
            }
        }

        return scans || [];
    } catch (error) {
        console.error('Get scan history exception:', error);
        return [];
    }
}

// Clear all history
async function clearAllHistory() {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false };

        // Delete all scans
        const { error: scanError } = await supabase
            .from(TABLES.SCANNED_OBJECTS)
            .delete()
            .eq('user_id', user.id);

        // Delete all commands
        const { error: commandError } = await supabase
            .from(TABLES.VOICE_COMMANDS)
            .delete()
            .eq('user_id', user.id);

        if (scanError || commandError) {
            console.error('Error clearing history:', scanError || commandError);
            return { success: false };
        }

        console.log('✅ History cleared');
        return { success: true };
    } catch (error) {
        console.error('Clear history exception:', error);
        return { success: false };
    }
}

// Save user preferences
async function savePreferences(preferences) {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false };

        const { data, error } = await supabase
            .from(TABLES.USER_PREFERENCES)
            .upsert([
                {
                    user_id: user.id,
                    ...preferences
                }
            ]);

        if (error) {
            console.error('Error saving preferences:', error);
            return { success: false };
        }

        console.log('✅ Preferences saved');
        return { success: true };
    } catch (error) {
        console.error('Save preferences exception:', error);
        return { success: false };
    }
}

// Get user preferences
async function getPreferences() {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from(TABLES.USER_PREFERENCES)
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error) {
            console.error('Error fetching preferences:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Get preferences exception:', error);
        return null;
    }
}

// Utility function: Format date/time
function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Utility function: Time ago
function timeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago';

    return date.toLocaleDateString();
}

// Export data as JSON
async function exportUserData() {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        const scans = await getScanHistory();
        const stats = await getStats();
        const preferences = await getPreferences();

        const exportData = {
            user: {
                email: user.email,
                name: user.user_metadata?.full_name
            },
            statistics: stats,
            preferences: preferences,
            scans: scans,
            exported_at: new Date().toISOString()
        };

        return exportData;
    } catch (error) {
        console.error('Export data exception:', error);
        return null;
    }
}

// Download data as JSON file
async function downloadExportData() {
    const data = await exportUserData();
    if (!data) {
        alert('Error exporting data');
        return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-object-ai-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✅ Data exported');
}

// Initialize tooltips
function initializeTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
        element.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = e.target.dataset.tooltip;
            document.body.appendChild(tooltip);

            const rect = e.target.getBoundingClientRect();
            tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
            tooltip.style.left = rect.left + (rect.width - tooltip.offsetWidth) / 2 + 'px';
        });

        element.addEventListener('mouseleave', () => {
            const tooltip = document.querySelector('.tooltip');
            if (tooltip) tooltip.remove();
        });
    });
}

// Check for updates
function checkForUpdates() {
    // Placeholder for future update checking
    console.log('Checking for updates...');
}

// Console welcome message
console.log(`
%c
🤖 Smart Object AI
Team BODMAS - Anand Engineering College
Version 1.0.0
%c
Making Every Object Intelligent!
`, 'color: #6366f1; font-size: 20px; font-weight: bold;', 'color: #64748b;');

// Apply theme based on preferences
function applyTheme() {
    const theme = localStorage.getItem('theme') || 'light';

    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else if (theme === 'auto') {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

// Make globally available
window.applyTheme = applyTheme;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Smart Object AI initialized');
    applyTheme(); // Apply theme immediately
    initializeTooltips();
});