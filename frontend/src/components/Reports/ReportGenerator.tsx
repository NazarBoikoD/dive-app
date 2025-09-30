import React, { useState } from 'react';
import api from '../../services/api';

const ReportGenerator: React.FC = () => {
  const [sessionId, setSessionId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    if (!sessionId) return;
    
    setIsGenerating(true);
    try {
      const response = await api.get(`/reports/generate/${sessionId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dive-report-${sessionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="report-generator">
      <h3>Generate PDF Report</h3>
      <div>
        <input
          type="text"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="Enter Dive Session ID"
        />
        <button onClick={generateReport} disabled={isGenerating || !sessionId}>
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
    </div>
  );
};

export default ReportGenerator;