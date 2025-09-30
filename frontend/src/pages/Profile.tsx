import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

const ProfileContainer = styled.div`
  max-width: 800px;
  margin: 40px auto;
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 30px;
  margin-bottom: 40px;
`;

const ProfilePhotoContainer = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
`;

const ProfilePhoto = styled.div<{ $hasImage?: string }>`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${props => props.$hasImage ? `url(${props.$hasImage}) center/cover` : '#e0e0e0'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: #757575;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background-color: ${props => props.$hasImage ? '' : '#d0d0d0'};
    
    &::after {
      content: 'Change Photo';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      font-size: 14px;
      padding: 4px;
      text-align: center;
      border-bottom-left-radius: 50%;
      border-bottom-right-radius: 50%;
    }
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const UploadOverlay = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  background: #5c6bc0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: background 0.2s;

  &:hover {
    background: #3949ab;
  }
`;

const UserInfo = styled.div`
  flex-grow: 1;
`;

const Name = styled.h1`
  color: #5c6bc0;
  margin-bottom: 10px;
`;

const Email = styled.p`
  color: #757575;
  font-size: 16px;
`;

const Section = styled.section`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h2`
  color: #3949ab;
  margin-bottom: 20px;
  font-size: 20px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  gap: 20px;
`;

const InputGroup = styled.div`
  flex: 1;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #616161;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #5c6bc0;
  }
`;

const Button = styled.button`
  background: #5c6bc0;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #3949ab;
  }
`;

const DivingStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const StatCard = styled.div`
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #5c6bc0;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  color: #616161;
`;

const ErrorMessage = styled.div`
  color: #f44336;
  margin-top: 10px;
`;

const SuccessMessage = styled.div`
  color: #4caf50;
  margin-top: 10px;
`;

const EditButton = styled.button`
  background: #5c6bc0;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #3949ab;
  }
`;

const SaveButton = styled.button`
  background: #5c6bc0;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #3949ab;
  }
`;

const Title = styled.h1`
  color: #5c6bc0;
  margin-bottom: 10px;
`;

const Container = styled.div`
  max-width: 800px;
  margin: 40px auto;
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone_number || '',
    age: user?.age?.toString() || '',
    emergencyContact: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name,
        email: user.email,
        phone: user.phone_number,
        age: user.age.toString(),
        emergencyContact: ''
      });
    }
  }, [user]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Create FormData
      const formData = new FormData();
      formData.append('profilePicture', file);

      // Upload to server
      const response = await fetch('http://localhost:8000/api/users/profile-picture', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      const data: { profilePictureUrl: string } = await response.json();
      
      // Update user context with new profile picture URL
      // setUser((currentUser: User | null) => 
      //   currentUser ? { ...currentUser, profilePicture: data.profilePictureUrl } : null
      // );
      setSuccess('Profile picture updated successfully!');
    } catch (err) {
      setError('Failed to upload profile picture. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // TODO: Implement profile update API call
      // const response = await updateProfile(profileData);
      
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <Header>
        <Title>Profile</Title>
        <EditButton onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </EditButton>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <Section>
        <SectionTitle>Profile Information</SectionTitle>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <InputGroup>
              <Label>Full Name</Label>
              <Input
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </InputGroup>
            <InputGroup>
              <Label>Email</Label>
              <Input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </InputGroup>
          </FormGroup>

          <FormGroup>
            <InputGroup>
              <Label>Phone Number</Label>
              <Input
                type="tel"
                name="phone"
                value={profileData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </InputGroup>
            <InputGroup>
              <Label>Age</Label>
              <Input
                type="number"
                name="age"
                value={profileData.age}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </InputGroup>
          </FormGroup>

          <FormGroup>
            <InputGroup>
              <Label>Emergency Contact</Label>
              <Input
                type="tel"
                name="emergencyContact"
                value={profileData.emergencyContact}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </InputGroup>
          </FormGroup>

          {isEditing && (
            <SaveButton type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </SaveButton>
          )}
        </Form>
      </Section>
    </Container>
  );
};

export default Profile; 