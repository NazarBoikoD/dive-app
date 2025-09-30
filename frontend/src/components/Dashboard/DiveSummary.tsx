import React from 'react';

const DiveSummary: React.FC = () => {
  return (
    <div className="dive-summary">
      <h3>Dive Summary</h3>
      <div className="summary-stats">
        {/* Stats will be populated from API */}
        <div>Total Dives: 0</div>
        <div>Max Depth: 0m</div>
        <div>Total Time: 0min</div>
      </div>
    </div>
  );
};

export default DiveSummary;