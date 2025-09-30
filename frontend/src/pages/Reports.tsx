import React from 'react';
import ReportGenerator from '../components/Reports/ReportGenerator';
import ReportList from '../components/Reports/ReportList';

const Reports: React.FC = () => {
  return (
    <div className="reports-page">
      <h1>Dive Reports</h1>
      <ReportGenerator />
      <ReportList />
    </div>
  );
};

export default Reports;