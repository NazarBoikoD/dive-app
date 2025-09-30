import React from 'react';
import DiveSummary from '../components/Dashboard/DiveSummary';
import RecentDives from '../components/Dashboard/RecentDives';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <h1>Dive Dashboard</h1>
      <div className="dashboard-content">
        <DiveSummary />
        <RecentDives />
      </div>
    </div>
  );
};

export default Dashboard;