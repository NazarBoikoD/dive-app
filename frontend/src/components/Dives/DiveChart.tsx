import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DepthRecord {
  timestamp: string;
  depth: number;
  temperature: number;
}

interface DiveChartProps {
  diveData: DepthRecord[];
}

const DiveChart: React.FC<DiveChartProps> = ({ diveData }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Dive Profile',
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Depth (m) / Temperature (°C)'
        }
      }
    }
  };

  const data = {
    labels: diveData.map(record => new Date(record.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Depth (m)',
        data: diveData.map(record => record.depth),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Temperature (°C)',
        data: diveData.map(record => record.temperature),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y',
      }
    ],
  };

  return <Line options={options} data={data} />;
};

export default DiveChart;