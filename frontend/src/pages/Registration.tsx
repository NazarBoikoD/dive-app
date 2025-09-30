import React from 'react';
import { Link } from 'react-router-dom';
import RegistrationForm from '../components/Auth/RegistrationForm';
import './Auth.css';

const Registration: React.FC = () => {
  const handleSuccess = () => {
    // You can add a success message or redirect here
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        <RegistrationForm onSuccess={handleSuccess} />
        <div className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Registration; 