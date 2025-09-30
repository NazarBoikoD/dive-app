import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const AboutContainer = styled.div`
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
`;

const BackButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  background: #5c6bc0;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;

  &:hover {
    background: #3949ab;
  }

  i {
    font-size: 16px;
  }
`;

const Title = styled.h1`
  color: #5c6bc0;
  margin-bottom: 30px;
  text-align: center;
`;

const Section = styled.section`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h2`
  color: #3949ab;
  margin-bottom: 15px;
`;

const Text = styled.p`
  line-height: 1.6;
  margin-bottom: 15px;
  color: #333;
`;

const About: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AboutContainer>
      <BackButton onClick={() => navigate('/')}>
        <i className="fas fa-arrow-left"></i>
        Back to Dashboard
      </BackButton>
      
      <Title>About Our Diving Project</Title>
      
      <Section>
        <SectionTitle>Our Story</SectionTitle>
        <Text>
          This diving application was born from a passion for underwater exploration and 
          the need for a modern, user-friendly tool to track diving experiences. Created 
          by diving enthusiasts for diving enthusiasts, our platform aims to make dive 
          logging and analysis more accessible and informative.
        </Text>
      </Section>

      <Section>
        <SectionTitle>Features</SectionTitle>
        <Text>
          • Comprehensive dive logging with depth profiles
          • Real-time dive data visualization
          • Personal diving statistics and analysis
          • Export capabilities in multiple formats
          • Social sharing and community features
        </Text>
      </Section>

      <Section>
        <SectionTitle>Technology</SectionTitle>
        <Text>
          Built using modern web technologies including React, TypeScript, and Node.js, 
          our application ensures a smooth and responsive experience while maintaining 
          the highest standards of data security and reliability.
        </Text>
      </Section>

      <Section>
        <SectionTitle>Future Vision</SectionTitle>
        <Text>
          We're continuously working to enhance the platform with new features and 
          improvements based on user feedback and emerging diving technology trends. 
          Our goal is to create the most comprehensive diving companion application 
          for the global diving community.
        </Text>
      </Section>
    </AboutContainer>
  );
};

export default About; 