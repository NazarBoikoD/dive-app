import React from 'react';
import DiveList from '../components/Dives/DiveList';

const Dives: React.FC = () => {
  return (
    <div className="dives-page">
      <h1>My Dives</h1>
      <DiveList />
    </div>
  );
};

export default Dives;