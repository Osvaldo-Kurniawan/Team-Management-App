import React, { useState, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Papa from 'papaparse';

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

  // Helper function to add working days to a date
  const addWorkingDays = (date, days) => {
    const result = new Date(date);
    let remainingDays = days;
    
    while (remainingDays > 0) {
      result.setDate(result.getDate() + 1);
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        remainingDays--;
      }
    }
    
    return result;
  };

  const findBestSlotForTask = useCallback(async (task, projectMembers, assignedWorkloads) => {
    const calculateUserAvailability = async (userId, startDate) => {
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('assignedTo', 'array-contains', userId),
        where('status', '!=', 'completed')
      );
  
      const tasksDocs = await getDocs(tasksQuery);
      const assignedTasks = tasksDocs.docs.map(doc => ({
        ...doc.data(),
        startDate: new Date(doc.data().startDate),
        deadline: new Date(doc.data().deadline),
        estimatedDuration: parseInt(doc.data().estimatedDuration) // days
      }));
  
      // Sort tasks by start date
      assignedTasks.sort((a, b) => a.startDate - b.startDate);
  
      // Find available time slots
      let currentDate = new Date(startDate);
      let availableSlots = [];
      let previousEndDate = currentDate;
  
      for (const task of assignedTasks) {
        if (task.startDate > previousEndDate) {
          // Calculate working days between dates
          let workingDays = 0;
          let tempDate = new Date(previousEndDate);
          while (tempDate < task.startDate) {
            if (tempDate.getDay() !== 0 && tempDate.getDay() !== 6) {
              workingDays++;
            }
            tempDate.setDate(tempDate.getDate() + 1);
          }
  
          availableSlots.push({
            start: previousEndDate,
            end: task.startDate,
            duration: workingDays
          });
        }
        previousEndDate = new Date(Math.max(
          previousEndDate.getTime(),
          task.deadline.getTime()
        ));
      }
  
      // Add final slot after last task (consider next 60 working days)
      availableSlots.push({
        start: previousEndDate,
        end: addWorkingDays(previousEndDate, 60),
        duration: 60
      });
  
      return availableSlots;
    };
  
    const taskDuration = parseInt(task.estimatedDuration);
    const originalDeadline = new Date(task.deadline);
    let bestAssignment = null;
    let lowestWorkload = Infinity;
  
    // Sort members by current workload
    const membersWithWorkload = projectMembers.map(member => ({
      ...member,
      currentWorkload: assignedWorkloads[member.userId] || 0
    }));
  
    membersWithWorkload.sort((a, b) => a.currentWorkload - b.currentWorkload);
  
    // Try to assign to member with lowest workload first
    for (const member of membersWithWorkload) {
      const availableSlots = await calculateUserAvailability(
        member.userId,
        new Date()
      );
  
      for (const slot of availableSlots) {
        if (slot.duration >= taskDuration) {
          const proposedEndDate = addWorkingDays(slot.start, taskDuration);
  
          if (proposedEndDate <= originalDeadline) {
            const totalWorkload = member.currentWorkload + taskDuration;
  
            if (totalWorkload < lowestWorkload) {
              lowestWorkload = totalWorkload;
              bestAssignment = {
                userId: member.userId,
                startDate: slot.start,
                endDate: proposedEndDate,
                workload: totalWorkload
              };
            }
          }
        }
      }
    }
  
    return bestAssignment;
  }, []);   

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

      // Get project members
      const membersQuery = query(
        collection(db, 'projectMembers'),
        where('projectId', '==', projectId)
      );
      const membersDocs = await getDocs(membersQuery);
      const projectMembers = membersDocs.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));

      // Initialize workload tracking
      const assignedWorkloads = {};
      projectMembers.forEach(member => {
        assignedWorkloads[member.userId] = 0;
      });

      // Sort tasks by deadline and duration
      const sortedTasks = tasks.sort((a, b) => {
        const deadlineDiff = new Date(a.deadline) - new Date(b.deadline);
        return deadlineDiff || (parseInt(b.estimatedDuration) - parseInt(a.estimatedDuration));
      });

      const assignedTasks = [];
      const unassignableTasks = [];

      // Try to assign each task
      for (const task of sortedTasks) {
        const assignment = await findBestSlotForTask(task, projectMembers, assignedWorkloads);

        if (assignment) {
          // Update workload tracking
          assignedWorkloads[assignment.userId] = assignment.workload;

          // Add task to Firebase
          const taskData = {
            name: task.name,
            description: task.description,
            projectId,
            assignedTo: [assignment.userId],
            startDate: assignment.startDate.toISOString(),
            deadline: assignment.endDate.toISOString(),
            estimatedDuration: parseInt(task.estimatedDuration),
            status: 'pending',
            createdAt: new Date().toISOString()
          };

          const docRef = await addDoc(collection(db, 'tasks'), taskData);
          assignedTasks.push({
            ...taskData,
            id: docRef.id
          });
        } else {
          unassignableTasks.push(task);
        }
      }

      // Show results modal with workload summary
      setModalInfo({
        success: true,
        assigned: assignedTasks,
        unassigned: unassignableTasks,
        workloadSummary: assignedWorkloads
      });

    } catch (error) {
      console.error('Error in auto-assign:', error);
      setError(error.message || 'Failed to assign tasks');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  }, [projectId, findBestSlotForTask]);

  return (
    <div className="auto-assign-container">
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