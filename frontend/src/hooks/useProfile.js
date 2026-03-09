import { useState } from 'react';

const useProfile = (authFetch, setUsername, requestAlert) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '', role: 'User' });
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      const resp = await authFetch('http://127.0.0.1:8000/auth/me');
      if (resp.ok) {
        const data = await resp.json();
        setProfileData(data);
      }
    } catch {
      console.error("Failed to fetch profile:");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileUpdateLoading(true);
    try {
      const payload = {
        name: profileData.name,
        email: profileData.email
      };
      if (newPassword) payload.password = newPassword;

      const resp = await authFetch('http://127.0.0.1:8000/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        const data = await resp.json();
        setProfileData(data);
        setUsername(data.name);
        sessionStorage.setItem('scs_user', data.name);
        setIsEditingProfile(false);
        setNewPassword('');
        requestAlert("Profile Updated", "Your profile details have been saved successfully.");
      } else {
        const errorData = await resp.json();
        requestAlert("Update Failed", errorData.detail || "Update failed", true);
      }
    } catch {
      requestAlert("Update Failed", "An error occurred during update", true);
    } finally {
      setProfileUpdateLoading(false);
    }
  };

  const openProfileModal = () => {
    fetchProfile();
    setIsProfileModalOpen(true);
    setIsEditingProfile(false);
  };

  return {
    isProfileModalOpen, setIsProfileModalOpen,
    isEditingProfile, setIsEditingProfile,
    profileData, setProfileData,
    profileUpdateLoading, handleUpdateProfile,
    newPassword, setNewPassword,
    showPassword, setShowPassword,
    openProfileModal
  };
};

export default useProfile;
