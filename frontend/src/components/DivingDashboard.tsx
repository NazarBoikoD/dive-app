import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { diveApi } from '../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MainContainer = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 140px);
`;

const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const GraphContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  min-height: 400px;
`;

const DiveInfoContainer = styled.div`
  padding: 20px;
  background: white;
  border-radius: 8px;
  margin-top: 20px;
`;

const WarningText = styled.p`
  color: #d32f2f;
  margin: 5px 0;
`;

const InfoSection = styled.div`
  margin: 15px 0;
  padding-top: 15px;
  border-top: 1px solid #eee;
`;

const InfoTitle = styled.h4`
  margin: 0 0 10px 0;
  color: #333;
`;

const UserPanel = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

interface DeviceStatusProps {
  connected: boolean;
}

const DeviceStatus = styled.div<DeviceStatusProps>`
  background: ${props => props.connected ? '#4caf50' : '#ff9800'};
  color: white;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  text-align: center;
`;

const DiveHistory = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex-grow: 1;
  overflow-y: auto;
  max-height: 500px;
`;

const DiveEntry = styled.div<{ active?: boolean }>`
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 10px;
  cursor: pointer;
  background: ${props => props.active ? '#e3f2fd' : '#f8f9fa'};
  border: 1px solid ${props => props.active ? '#2196f3' : '#dee2e6'};
  
  &:hover {
    background: #e3f2fd;
  }
`;

const ExportButton = styled.button`
  background: #5c6bc0;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  margin: 5px 0;
  width: 100%;
  
  &:hover {
    background: #3f51b5;
  }
`;

const Footer = styled.footer`
  background: #1a237e;
  color: white;
  padding: 20px;
  margin-top: auto;
`;

const ContactInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 15px;
`;

const SocialLink = styled.a`
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const AdminInputForm = styled.form`
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 4px;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 4px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 4px;
  min-height: 100px;
`;

const SaveButton = styled.button`
  background: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background: #388e3c;
  }
`;

interface DiveSession {
  id: number;
  date: string;
  location: string;
  max_depth: number;
  duration: number;
  water_temp?: number;
  water_type?: string;
  notes?: string;
  depth_data: number[];
  time_data: string[];
  start_pressure?: number;
  end_pressure?: number;
  tank_volume?: number;
  air_consumption?: number;
  oxygen_percentage?: number;
  nitrogen_percentage?: number;
  helium_percentage?: number;
  gas_type?: string;
  decompression_info?: {
    no_deco_limit: number;
    pressure_group: string;
    total_deco_time: number;
    stops: Array<{ depth: number; duration: number }>;
    requires_safety_stop: boolean;
    is_deco_dive: boolean;
    gas_info: {
      ppo2_at_depth: number;
      end: number;
      warnings: string[];
    };
  };
}

interface NewDiveData {
  location: string;
  date: string;
  max_depth: number;
  duration: number;
  water_temp?: number;
  water_type?: string;
  notes?: string;
  start_pressure?: number;
  end_pressure?: number;
  tank_volume?: number;
  oxygen_percentage?: number;
  nitrogen_percentage?: number;
  helium_percentage?: number;
  gas_type?: string;
}

const DivingApp: React.FC = () => {
  const { user } = useAuth();
  const [selectedDive, setSelectedDive] = useState<DiveSession | null>(null);
  const [dives, setDives] = useState<DiveSession[]>([]);
  const [isDeviceConnected, setIsDeviceConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [tempDives, setTempDives] = useState<NewDiveData[]>([]);
  const [newDiveData, setNewDiveData] = useState<NewDiveData>({
    location: '',
    date: new Date().toISOString().slice(0, 16),
    max_depth: 0,
    duration: 0,
    water_temp: undefined,
    water_type: '',
    notes: '',
    start_pressure: undefined,
    end_pressure: undefined,
    tank_volume: undefined,
    oxygen_percentage: undefined,
    nitrogen_percentage: undefined,
    helium_percentage: undefined,
    gas_type: undefined
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDives = async () => {
      try {
        const response = await diveApi.getDives();
        setDives(response.data);
      } catch (err) {
        console.error('Error fetching dives:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDives();
  }, []);

  const handleExport = async (format: 'PDF' | 'CSV' | 'XML') => {
    try {
      const response = await diveApi.exportDives(format.toLowerCase());
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dive_log.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Error exporting ${format}:`, err);
      alert(`Failed to export ${format}. Please try again.`);
    }
  };

  const renderDepthGraph = () => {
    if (!selectedDive) return <div>Select a dive to view details</div>;

    // Format time data for better display
    const formattedTimeData = selectedDive.time_data.map(time => {
      const [minutes, seconds] = time.split(':').map(Number);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    });

    // Create annotations for decompression stops
    const annotations = selectedDive.decompression_info?.stops?.map((stop, index) => ({
      type: 'line' as const,
      mode: 'horizontal' as const,
      scaleID: 'y',
      value: stop.depth,
      borderColor: '#ff4444',
      borderWidth: 2,
      label: {
        enabled: true,
        content: `${stop.duration}min stop at ${stop.depth}m`,
        position: 'right'
      }
    })) || [];

    const data = {
      labels: formattedTimeData,
      datasets: [
        {
          label: 'Depth (m)',
          data: selectedDive.depth_data,
          fill: true,
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0,
          stepped: false,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#2196f3',
          segment: {
            borderColor: (ctx: any) => '#2196f3',
            borderWidth: 2
          }
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          type: 'linear' as const,
          reverse: true,
          title: {
            display: true,
            text: 'Depth (m)'
          },
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
            drawBorder: true
          }
        },
        x: {
          type: 'category' as const,
          title: {
            display: true,
            text: 'Time (mm:ss)'
          },
          grid: {
            display: true,
            drawOnChartArea: true,
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10
          }
        }
      },
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: 'Depth Profile with Decompression Stops'
        },
        annotation: {
          annotations: annotations
        }
      },
      elements: {
        line: {
          tension: 0
        }
      }
    };

    return (
      <div>
        <div style={{ height: '400px' }}>
          <Line data={data} options={options} />
        </div>
        {selectedDive.decompression_info && (
          <div style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: selectedDive.decompression_info.is_deco_dive ? '#ffebee' : '#e8f5e9',
            borderRadius: '4px'
          }}>
            <h4>Decompression Information</h4>
            <p>No-Decompression Limit: {selectedDive.decompression_info.no_deco_limit} minutes</p>
            <p>Pressure Group: {selectedDive.decompression_info.pressure_group}</p>
            {selectedDive.decompression_info.is_deco_dive ? (
              <>
                <p style={{ color: '#d32f2f' }}>⚠️ Decompression dive</p>
                <p>Total decompression time: {selectedDive.decompression_info.total_deco_time} minutes</p>
                <div>Required stops:</div>
                <ul>
                  {selectedDive.decompression_info.stops.map((stop, index) => (
                    <li key={index}>{stop.duration} minutes at {stop.depth}m</li>
                  ))}
                </ul>
              </>
            ) : selectedDive.decompression_info.requires_safety_stop ? (
              <p style={{ color: '#f57c00' }}>⚠️ Safety stop recommended: 3 minutes at 5m</p>
            ) : (
              <p style={{ color: '#2e7d32' }}>✓ No decompression stops required</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleLearnMore = () => {
    navigate('/about');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDiveData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitDive = async (e: React.FormEvent) => {
    e.preventDefault();
    setTempDives(prev => [...prev, { ...newDiveData }]);
    setNewDiveData({
      location: '',
      date: new Date().toISOString().slice(0, 16),
      max_depth: 0,
      duration: 0,
      water_temp: undefined,
      water_type: '',
      notes: '',
      start_pressure: undefined,
      end_pressure: undefined,
      tank_volume: undefined,
      oxygen_percentage: undefined,
      nitrogen_percentage: undefined,
      helium_percentage: undefined,
      gas_type: undefined
    });
  };

  const handleSaveAllDives = async () => {
    try {
      const savedDives: DiveSession[] = [];
      for (const diveData of tempDives) {
        // Generate points for a straight-line dive profile
        const numPoints = 6; // Reduced number of points for clearer straight lines
        const timeInterval = diveData.duration / (numPoints - 1);
        const depth_data: number[] = [];
        const time_data: string[] = [];

        // Define key points for straight-line segments
        const profilePoints = [
          { time: 0, depth: 0 },                    // Surface start
          { time: timeInterval, depth: diveData.max_depth },  // Descent complete
          { time: timeInterval * 3, depth: diveData.max_depth }, // Bottom time
          { time: timeInterval * 4, depth: diveData.max_depth }, // Start ascent
          { time: timeInterval * 5, depth: 5 },     // Safety stop if needed
          { time: diveData.duration, depth: 0 }     // Surface end
        ];

        // Generate data points for straight lines
        profilePoints.forEach(point => {
          const minutes = Math.floor(point.time);
          const seconds = Math.round((point.time - minutes) * 60);
          time_data.push(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          depth_data.push(point.depth);
        });

        // Ensure all required fields are present
        const divePayload = {
          ...diveData,
          depth_data,
          time_data,
          oxygen_percentage: diveData.oxygen_percentage || 21.0,
          nitrogen_percentage: diveData.nitrogen_percentage || 79.0,
          helium_percentage: 0.0,
          gas_type: diveData.gas_type || 'Air'
        };

        const response = await diveApi.createDive(divePayload);
        if (response.data) {
          savedDives.push(response.data);
        }
      }

      // Update the dives state with the new dives
      setDives(prev => [...prev, ...savedDives]);
      setTempDives([]); // Clear temporary dives after saving
      alert('All dive records have been saved successfully!');
    } catch (error) {
      console.error('Error saving dives:', error);
      alert('Failed to save dive records. Please try again.');
    }
  };

  const handleRemoveTempDive = (index: number) => {
    setTempDives(prev => prev.filter((_, i) => i !== index));
  };

  const renderAdminForm = () => {
    return (
      <div>
        <AdminInputForm onSubmit={handleSubmitDive}>
          <h3>Add New Dive Record</h3>
          <FormGroup>
            <label>Location:</label>
            <Input
              type="text"
              name="location"
              value={newDiveData.location}
              onChange={handleInputChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <label>Date and Time:</label>
            <Input
              type="datetime-local"
              name="date"
              value={newDiveData.date}
              onChange={handleInputChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <label>Maximum Depth (m):</label>
            <Input
              type="number"
              name="max_depth"
              value={newDiveData.max_depth}
              onChange={handleInputChange}
              required
              min="0"
              step="0.1"
            />
          </FormGroup>
          <FormGroup>
            <label>Duration (minutes):</label>
            <Input
              type="number"
              name="duration"
              value={newDiveData.duration}
              onChange={handleInputChange}
              required
              min="0"
            />
          </FormGroup>
          <FormGroup>
            <label>Water Temperature (°C):</label>
            <Input
              type="number"
              name="water_temp"
              value={newDiveData.water_temp || ''}
              onChange={handleInputChange}
              step="0.1"
            />
          </FormGroup>
          <FormGroup>
            <label>Water Type:</label>
            <Select
              name="water_type"
              value={newDiveData.water_type || ''}
              onChange={handleInputChange}
            >
              <option value="">Select water type</option>
              <option value="Fresh">Fresh</option>
              <option value="Salt">Salt</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <label>Gas Type:</label>
            <Select
              name="gas_type"
              value={newDiveData.gas_type || 'Air'}
              onChange={handleInputChange}
            >
              <option value="Air">Air</option>
              <option value="Nitrox">Nitrox</option>
            </Select>
          </FormGroup>

          {newDiveData.gas_type === 'Nitrox' && (
            <>
              <FormGroup>
                <label>Oxygen Percentage (%):</label>
                <Input
                  type="number"
                  name="oxygen_percentage"
                  value={newDiveData.oxygen_percentage || 21}
                  onChange={handleInputChange}
                  min="21"
                  max="40"
                  step="0.1"
                />
              </FormGroup>
              <FormGroup>
                <label>Nitrogen Percentage (%):</label>
                <Input
                  type="number"
                  name="nitrogen_percentage"
                  value={newDiveData.nitrogen_percentage || 79}
                  onChange={handleInputChange}
                  min="60"
                  max="79"
                  step="0.1"
                />
              </FormGroup>
            </>
          )}

          <FormGroup>
            <label>Tank Volume (L):</label>
            <Input
              type="number"
              name="tank_volume"
              value={newDiveData.tank_volume || ''}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              max="20"
            />
          </FormGroup>
          <FormGroup>
            <label>Starting Air Pressure (bar):</label>
            <Input
              type="number"
              name="start_pressure"
              value={newDiveData.start_pressure || ''}
              onChange={handleInputChange}
              min="0"
              max="300"
            />
          </FormGroup>
          <FormGroup>
            <label>Ending Air Pressure (bar):</label>
            <Input
              type="number"
              name="end_pressure"
              value={newDiveData.end_pressure || ''}
              onChange={handleInputChange}
              min="0"
              max="300"
            />
          </FormGroup>
          <FormGroup>
            <label>Notes:</label>
            <TextArea
              name="notes"
              value={newDiveData.notes || ''}
              onChange={handleInputChange}
            />
          </FormGroup>
          <SaveButton type="submit">Add to List</SaveButton>
        </AdminInputForm>

        {tempDives.length > 0 && (
          <TempDivesContainer>
            <h4>Pending Dives</h4>
            {tempDives.map((tempDive: NewDiveData, idx: number) => (
              <TempDiveCard key={idx}>
                <p>Location: {tempDive.location}</p>
                <p>Date: {format(new Date(tempDive.date), 'dd/MM/yyyy HH:mm')}</p>
                <p>Max Depth: {tempDive.max_depth}m</p>
                <p>Duration: {tempDive.duration} minutes</p>
                {tempDive.gas_type === 'Nitrox' && (
                  <p>Gas Mix: Nitrox (O₂: {tempDive.oxygen_percentage}%, N₂: {tempDive.nitrogen_percentage}%)</p>
                )}
                <RemoveButton onClick={() => handleRemoveTempDive(idx)}>Remove</RemoveButton>
              </TempDiveCard>
            ))}
            <SaveAllButton onClick={handleSaveAllDives}>Save All Dives</SaveAllButton>
          </TempDivesContainer>
        )}
      </div>
    );
  };

  // Add styled components at the top of the file with other styled components
  const TempDivesContainer = styled.div`
    margin-top: 20px;
    padding: 20px;
    background: white;
    border-radius: 8px;
  `;

  const TempDiveCard = styled.div`
    padding: 10px;
    margin: 10px 0;
    border: 1px solid #ddd;
    border-radius: 4px;
  `;

  const RemoveButton = styled.button`
    background: #ff4444;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    
    &:hover {
      background: #cc0000;
    }
  `;

  const SaveAllButton = styled.button`
    background: #4CAF50;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
    margin-top: 10px;
    
    &:hover {
      background: #388e3c;
    }
  `;

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <MainContainer>
        <LeftPanel>
          <GraphContainer>
            {selectedDive ? (
              renderDepthGraph()
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                Select a dive session to view the depth graph
              </div>
            )}
          </GraphContainer>
          <DiveInfoContainer>
            {selectedDive ? (
              <>
                <h3>Dive Details</h3>
                <p>Location: {selectedDive.location}</p>
                <p>Date: {format(new Date(selectedDive.date), 'dd/MM/yyyy HH:mm')}</p>
                <p>Max Depth: {selectedDive.max_depth}m</p>
                <p>Duration: {selectedDive.duration} minutes</p>
                {selectedDive.water_temp && <p>Water Temperature: {selectedDive.water_temp}°C</p>}
                {selectedDive.water_type && <p>Water Type: {selectedDive.water_type}</p>}

                <InfoSection>
                  <InfoTitle>Gas Information</InfoTitle>
                  <p>Type: {selectedDive.gas_type || 'Air'}</p>
                  {selectedDive.gas_type === 'Nitrox' ? (
                    <>
                      <p>O₂: {selectedDive.oxygen_percentage}%</p>
                      <p>N₂: {selectedDive.nitrogen_percentage}%</p>
                      {selectedDive.decompression_info?.gas_info && (
                        <>
                          <p>PPO₂ at depth: {selectedDive.decompression_info.gas_info.ppo2_at_depth} bar</p>
                          <p>END: {selectedDive.decompression_info.gas_info.end}m</p>
                          {selectedDive.decompression_info.gas_info.warnings.map((warning, idx) => (
                            <WarningText key={idx}>{warning}</WarningText>
                          ))}
                        </>
                      )}
                    </>
                  ) : (
                    <p>Standard air mix (21% O₂, 79% N₂)</p>
                  )}
                </InfoSection>

                <InfoSection>
                  <InfoTitle>Equipment</InfoTitle>
                  {selectedDive.tank_volume && <p>Tank Volume: {selectedDive.tank_volume}L</p>}
                  {selectedDive.start_pressure && <p>Starting Pressure: {selectedDive.start_pressure} bar</p>}
                  {selectedDive.end_pressure && <p>Ending Pressure: {selectedDive.end_pressure} bar</p>}
                  {selectedDive.air_consumption && (
                    <p>Air Consumption Rate: {selectedDive.air_consumption.toFixed(2)} L/min</p>
                  )}
                </InfoSection>

                <InfoSection>
                  <InfoTitle>Decompression Information</InfoTitle>
                  {selectedDive.decompression_info && (
                    <>
                      <p>No-Decompression Limit: {selectedDive.decompression_info.no_deco_limit} minutes</p>
                      <p>Pressure Group: {selectedDive.decompression_info.pressure_group}</p>
                      {selectedDive.decompression_info.is_deco_dive ? (
                        <>
                          <WarningText>⚠️ Decompression dive</WarningText>
                          <p>Total decompression time: {selectedDive.decompression_info.total_deco_time} minutes</p>
                          <div>Required stops:</div>
                          <ul>
                            {selectedDive.decompression_info.stops.map((stop, idx) => (
                              <li key={idx}>{stop.duration} minutes at {stop.depth}m</li>
                            ))}
                          </ul>
                        </>
                      ) : selectedDive.decompression_info.requires_safety_stop ? (
                        <p style={{ color: '#f57c00' }}>⚠️ Safety stop recommended: 3 minutes at 5m</p>
                      ) : (
                        <p style={{ color: '#2e7d32' }}>✓ No decompression stops required</p>
                      )}
                    </>
                  )}
                </InfoSection>

                {selectedDive.notes && (
                  <InfoSection>
                    <InfoTitle>Notes</InfoTitle>
                    <p>{selectedDive.notes}</p>
                  </InfoSection>
                )}
              </>
            ) : (
              <p>Select a dive to view details</p>
            )}
          </DiveInfoContainer>
        </LeftPanel>

        <RightPanel>
          <UserPanel>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{user?.name}</h3>
              <div>
                <div>{format(new Date(), 'HH:mm')}</div>
                <div>{format(new Date(), 'dd/MM/yyyy')}</div>
              </div>
            </div>
            <DeviceStatus connected={isDeviceConnected}>
              {isDeviceConnected ? 'Device Connected: Suunto D5' : 'Connect your device'}
            </DeviceStatus>
          </UserPanel>

          {user?.is_admin && (
            <div>
              <ExportButton 
                onClick={() => setShowAdminForm(!showAdminForm)}
                style={{ marginBottom: '20px' }}
              >
                {showAdminForm ? 'Hide Input Form' : 'Add New Dive Record'}
              </ExportButton>
              {showAdminForm && renderAdminForm()}
            </div>
          )}

          <DiveHistory>
            <h3>Diving Logs</h3>
            {dives.map(dive => (
              <DiveEntry
                key={dive.id}
                active={selectedDive?.id === dive.id}
                onClick={() => setSelectedDive(dive)}
              >
                <div>Location: {dive.location}</div>
                <div>Date: {format(new Date(dive.date), 'dd/MM/yyyy HH:mm')}</div>
                <div>Max Depth: {dive.max_depth}m</div>
              </DiveEntry>
            ))}
          </DiveHistory>

          <div>
            <ExportButton onClick={() => handleExport('PDF')}>Generate PDF Report</ExportButton>
            <ExportButton onClick={() => handleExport('CSV')}>Download CSV</ExportButton>
            <ExportButton onClick={() => handleExport('XML')}>Download XML</ExportButton>
          </div>
        </RightPanel>
      </MainContainer>

      <Footer>
        <ContactInfo>
          <div>
            <h4>Contact Information</h4>
            <p>Phone: +48 123 456 789</p>
          </div>
          <SocialLinks>
            <SocialLink href="https://github.com/NazarBoikoD/dive_project" target="_blank">
              <i className="fab fa-github"></i> GitHub
            </SocialLink>
            <SocialLink href="https://instagram.com/your-profile" target="_blank">
              <i className="fab fa-instagram"></i> Instagram
            </SocialLink>
            <SocialLink href="https://discord.gg/your-server" target="_blank">
              <i className="fab fa-discord"></i> Discord
            </SocialLink>
            <SocialLink href="mailto:nazar.boiko.d@gmail.com">
              <i className="fas fa-envelope"></i> Email
            </SocialLink>
          </SocialLinks>
        </ContactInfo>
      </Footer>
    </>
  );
};

export default DivingApp; 