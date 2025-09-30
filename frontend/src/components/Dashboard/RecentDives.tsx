import React from 'react';

const RecentDives: React.FC = () => {
  return (
    <div className="recent-dives">
      <h3>Recent Dives</h3>
      <div className="dive-list">
        {/* Dive items will be populated from API */}
        <div className="dive-item">No recent dives</div>
      </div>
    </div>
  );
};

export default RecentDives;