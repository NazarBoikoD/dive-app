import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface Report {
  id: number;
  session_id: number;
  generated_at: string;
}

const ReportList: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await api.get('/reports/');
        setReports(response.data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) return <div>Loading reports...</div>;

  return (
    <div className="report-list">
      <h3>Generated Reports</h3>
      {reports.length === 0 ? (
        <div>No reports found</div>
      ) : (
        <ul>
          {reports.map((report) => (
            <li key={report.id}>
              <div>Session ID: {report.session_id}</div>
              <div>Generated: {new Date(report.generated_at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReportList;