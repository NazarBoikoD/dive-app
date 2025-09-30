import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { FaGithub, FaInstagram, FaFacebook, FaEnvelope, FaPhone } from 'react-icons/fa';
import '../styles/Home.css';

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const [showWelcomeAlert, setShowWelcomeAlert] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomeAlert(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const socialLinks = [
    {
      icon: <FaGithub />,
      url: 'https://github.com/your-github',
      label: 'GitHub'
    },
    {
      icon: <FaInstagram />,
      url: 'https://www.instagram.com/_bonadi_n_/#',
      label: 'Instagram'
    },
    {
      icon: <FaFacebook />,
      url: 'https://www.facebook.com/people/Nazar-Boiko/pfbid02F7kjxktP1WBRaKUADyPAq3vWunCAKvPGj2gEVT8Q3nsjg5dTgk7SxvzeVmKjnQByl/',
      label: 'Facebook'
    },
    {
      icon: <FaEnvelope />,
      url: 'mailto:nezer240502@gmail.com',
      label: 'Email'
    },
    {
      icon: <FaPhone />,
      url: 'tel:+48123123123',
      label: 'Phone'
    }
  ];

  return (
    <div className="home-container">
      {showWelcomeAlert && (
        <div className="welcome-alert">
          Welcome!
        </div>
      )}
      
      <div className="content">
        <h1>Diving Session Dashboard</h1>
        <button onClick={logout} className="logout-button">Logout</button>
        
        {/* Main content sections as per layout */}
        <div className="dashboard-grid">
          <div className="chart-section">
            <div className="chart-container">
              <p>CLICK TO GENERATE CHART</p>
            </div>
            <div className="notes-section">
              <h3>Notes:</h3>
              <div className="notes-content">
                <p>WORK IN PROGRESS...</p>
              </div>
            </div>
            <div className="overview-section">
              <h3>Diving Sessions Overview:</h3>
              <div className="overview-content">
                <p>WORK IN PROGRESS...</p>
              </div>
            </div>
          </div>
          
          <div className="info-section">
            <h2>LATEST DIVE INFORMATION</h2>
            {/* Latest dive info content will go here */}
          </div>
        </div>
      </div>

      <footer className="social-footer">
        <div className="social-links">
          {socialLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
              aria-label={link.label}
            >
              {link.icon}
            </a>
          ))}
        </div>
        <div className="contact-number">
          CONTACT NUMBER: +48123123123
        </div>
      </footer>
    </div>
  );
};

export default Home; 