import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './../assets/styles/ProfileSetupDialog.css';

const defaultAvatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria&size=128&backgroundColor=4CAF50',
  'https://api.dicebear.com/7.x/micah/svg?seed=Blaze&size=128&backgroundColor=2196F3',
  'https://api.dicebear.com/7.x/personas/svg?seed=Cora&size=128&backgroundColor=FF9800',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Dax&size=128&backgroundColor=9C27B0',
  'https://api.dicebear.com/7.x/croodles/svg?seed=Eira&size=128&backgroundColor=00BCD4',
  'https://api.dicebear.com/7.x/avataaars/svg?svg?seed=Finn&size=128&backgroundColor=FF5722',
  'https://api.dicebear.com/7.x/micah/svg?seed=Gale&size=128&backgroundColor=673AB7',
  'https://api.dicebear.com/7.x/personas/svg?svg?seed=Hana&size=128&background=Color=F44336',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Iden&size=128&backgroundColor=3F51B5',
  'https://api.dicebear.com/7.x/croodles/svg?seed=Jade&size=128&backgroundColor=009688',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Kai&size=128&backgroundColor=FFCA28',
  'https://api.dicebear.com/7.x/micah/svg?seed=Luna&size=128&backgroundColor=03A9F4',
  'https://api.dicebear.com/7.x/personas/svg?seed=Milo&size=128&backgroundColor=FF5722',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Nova&size=128&backgroundColor=8BC34A',
  'https://api.dicebear.com/7.x/croodles/svg?seed=Opal&size=128&backgroundColor=E91E63',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Quinn&size=128&backgroundColor=4CAF50',
  'https://api.dicebear.com/7.x/micah/svg?seed=Remy&size=128&backgroundColor=2196F3',
  'https://api.dicebear.com/7.x/personas/svg?seed=Sienna&size=128&backgroundColor=FF9800',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Taro&size=128&backgroundColor=9C27B0',
  'https://api.dicebear.com/7.x/croodles/svg?seed=Vera&size=128&backgroundColor=00BCD4',
];

const ProfileSetupDialog = ({ onClose }) => {
  const { currentUser, updateUserProfileAndDB } = useAuth();
  const [name, setName] = useState(currentUser?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.photoURL || defaultAvatars[0]);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!selectedAvatar) {
      setError('Please select a profile picture.');
      return;
    }

    setIsUpdating(true);
    try {
      await updateUserProfileAndDB(name, selectedAvatar);
      onClose();
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error("Profile update error:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="profile-dialog-overlay">
      <div className="profile-dialog-content animate__animated animate__zoomIn">
        {/* Close Button - Updated Class and Icon */}
        <button className="close-button" onClick={onClose} disabled={isUpdating}>X </button>

        <h2>Complete Your Profile</h2>
        <p>Just a quick step to personalize your experience!</p>

        {error && <p className="profile-dialog-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Your Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              disabled={isUpdating}
            />
          </div>

          <div className="form-group">
            <label>Select a Profile Picture:</label>
            <div className="avatar-selection-grid">
              {defaultAvatars.map((avatarUrl, index) => (
                <img
                  key={index}
                  src={avatarUrl}
                  alt={`Avatar ${index + 1}`}
                  className={`avatar-option ${selectedAvatar === avatarUrl ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(avatarUrl)}
                  title="Click to select"
                />
              ))}
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupDialog;