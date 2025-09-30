import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface DiveSession {
  id: number;
  date: string;
  location: string;
  max_depth: number;
  duration: number;
}

const DiveList: React.FC = () => {
  const [dives, setDives] = useState<DiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDives = async () => {
      try {
        const response = await api.get('/dives/');
        setDives(response.data);
      } catch (error) {
        console.error('Error fetching dives:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDives();
  }, []);

  if (loading) return <div>Loading dives...</div>;

  return (
    <div className="dive-list">
      {dives.length === 0 ? (
        <div>No dive sessions found</div>
      ) : (
        <ul>
          {dives.map((dive) => (
            <li key={dive.id}>
              <div>{new Date(dive.date).toLocaleDateString()}</div>
              <div>{dive.location}</div>
              <div>Max Depth: {dive.max_depth}m</div>
              <div>Duration: {dive.duration}min</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DiveList;