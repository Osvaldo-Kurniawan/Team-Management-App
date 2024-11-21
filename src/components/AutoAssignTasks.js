// src/components/AutoAssignTasks.js
import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { autoAssignTasks } from '../firebase';

function AutoAssignTasks({ projectId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalInfo, setModalInfo] = useState(null);

  const downloadTemplate = () => {
    const sampleData = [
      {
        name: 'Task 1',
        description: 'Sample task description',
        estimatedDuration: 3, // days
        deadline: '2024-12-31'
      }
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'task_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = useCallback(async (event) => {
    try {
      setLoading(true);
      setError('');
      setModalInfo(null);

      const file = event.target.files[0];
      if (!file) return;

      // Parse CSV
      const tasks = await new Promise((resolve) => {
        Papa.parse(file, {
          header: true,
          complete: (results) => resolve(results.data.filter(task => 
            task.name && 
            task.estimatedDuration && 
            task.deadline
          ))
        });
      });

      // Sort tasks by deadline and duration
      const sortedTasks = tasks.sort((a, b) => {
        const deadlineDiff = new Date(a.deadline) - new Date(b.deadline);
        return deadlineDiff || (parseInt(b.estimatedDuration) - parseInt(a.estimatedDuration));
      });

      // Auto-assign tasks
      const { assignedTasks, unassignableTasks } = await autoAssignTasks(sortedTasks, projectId);

      // Show results modal with workload summary
      setModalInfo({
        success: true,
        assigned: assignedTasks,
        unassigned: unassignableTasks
      });

    } catch (error) {
      console.error('Error in auto-assign:', error);
      setError(error.message || 'Failed to assign tasks');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  }, [projectId]);

  return (
    <div className="auto-assign-container">
      {/* Rest of the component remains the same */}
      <div className="template-section">
        <button onClick={downloadTemplate} className="template-button">
          Download Template
        </button>
        <div className="template-info">
          <p>Expected CSV columns:</p>
          <ul>
            <li>name (Task name)</li>
            <li>description (Task details)</li>
            <li>estimatedDuration (Working days)</li>
            <li>deadline (YYYY-MM-DD)</li>
          </ul>
        </div>
      </div>

      <div className="file-input-wrapper">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={loading}
          className="file-input"
        />
      </div>

      {loading && <div className="loading">Processing tasks...</div>}
      {error && <div className="error-message">{error}</div>}
      
      {/* Results Modal */}
      {modalInfo && (
        <div className="modal">
          <div className="modal-content">
            <h2>Task Assignment Results</h2>
            
            <div className="assigned-tasks">
              <h3>Successfully Assigned Tasks ({modalInfo.assigned.length})</h3>
              <ul>
                {modalInfo.assigned.map(task => (
                  <li key={task.id}>
                    {task.name} - Assigned to user {task.assignedTo[0]}
                    <br />
                    Duration: {task.estimatedDuration} days
                    <br />
                    Start: {new Date(task.startDate).toLocaleDateString()}
                    <br />
                    End: {new Date(task.deadline).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </div>

            {modalInfo.unassigned.length > 0 && (
              <div className="unassigned-tasks">
                <h3>Unassignable Tasks ({modalInfo.unassigned.length})</h3>
                <ul>
                  {modalInfo.unassigned.map((task, index) => (
                    <li key={index}>
                      {task.name} - Duration: {task.estimatedDuration} days,
                      Requested deadline: {new Date(task.deadline).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
                <p>These tasks could not be assigned due to capacity or deadline constraints.</p>
              </div>
            )}

            <button onClick={() => setModalInfo(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AutoAssignTasks;