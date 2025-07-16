'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { 
  Palette, 
  Bell, 
  Shield, 
  User, 
  Mail, 
  Lock, 
  Trash2, 
  LogOut,
  Save,
  AlertTriangle
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notifications, setNotifications] = useState({
    weeklyReminder: true,
    communityUpdates: false,
    achievements: true,
  });
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile({
        full_name: data.full_name || '',
        email: data.email || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          email: profile.email,
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Show success message (you could add a toast here)
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // In a real app, you'd want to implement proper account deletion
      // This would involve deleting user data and then the user account
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) throw error;
      
      // Sign out after deletion
      await signOut();
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const settingSections = [
    {
      title: 'Profile',
      icon: User,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
              className="weekly-form__input"
              placeholder="Enter your full name"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
              className="weekly-form__input"
              placeholder="Enter your email"
            />
          </div>
          
          <button
            onClick={handleSaveProfile}
            disabled={loading}
            className="btn-primary"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )
    },
    {
      title: 'Appearance',
      icon: Palette,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Theme</label>
            <p className="text-sm text-muted-foreground">
              Choose your preferred theme or use system setting
            </p>
            <ThemeToggle />
          </div>
        </div>
      )
    },
    {
      title: 'Notifications',
      icon: Bell,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Weekly Reminder</div>
              <div className="text-sm text-muted-foreground">
                Get reminded to submit your weekly entry
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={notifications.weeklyReminder}
                onChange={(e) => setNotifications(prev => ({ 
                  ...prev, 
                  weeklyReminder: e.target.checked 
                }))}
              />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Community Updates</div>
              <div className="text-sm text-muted-foreground">
                Get notified about new entries from your team
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={notifications.communityUpdates}
                onChange={(e) => setNotifications(prev => ({ 
                  ...prev, 
                  communityUpdates: e.target.checked 
                }))}
              />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Achievements</div>
              <div className="text-sm text-muted-foreground">
                Get notified about streaks and milestones
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={notifications.achievements}
                onChange={(e) => setNotifications(prev => ({ 
                  ...prev, 
                  achievements: e.target.checked 
                }))}
              />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      )
    },
    {
      title: 'Privacy & Security',
      icon: Shield,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="font-medium">Profile Visibility</div>
            <p className="text-sm text-muted-foreground">
              Your profile and published entries are visible to all team members
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="font-medium">Data Export</div>
            <p className="text-sm text-muted-foreground">
              Download all your data in JSON format
            </p>
            <button className="btn-outline">
              Export Data
            </button>
          </div>
        </div>
      )
    },
    {
      title: 'Account',
      icon: Lock,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="font-medium">Sign Out</div>
            <p className="text-sm text-muted-foreground">
              Sign out of your account on this device
            </p>
            <button onClick={signOut} className="btn-outline">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="font-medium text-destructive">Delete Account</div>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-outline border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="space-y-6">
        {settingSections.map((section) => (
          <div key={section.title} className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <section.icon className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">{section.title}</h2>
            </div>
            {section.content}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <h3 className="text-lg font-semibold">Delete Account</h3>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="btn-primary bg-destructive hover:bg-destructive/90 flex-1"
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}