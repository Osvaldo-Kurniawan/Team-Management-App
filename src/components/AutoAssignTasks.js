import React, { useState, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Papa from 'papaparse';

function AutoAssignTasks({ projectId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Function to download CSV template
  const downloadTemplate = () => {
    // Create sample data
    const sampleData = [
      {
        name: 'Example Task 1',
        description: 'This is a sample task description',
        deadline: '2025-12-31'
      },
      {
        name: 'Example Task 2',
        description: 'Another sample task description',
        deadline: '2025-12-11'
      }
    ];

    // Convert to CSV
    const csv = Papa.unparse(sampleData);
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'task_template.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to parse CSV file
  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error)
      });
    });
  };

  // Get available users (those who have completed tasks or no tasks)
  const getAvailableUsers = async (projectMembers) => {
    const availableUsers = [];
    
    for (const member of projectMembers) {
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('assignedTo', 'array-contains', member.userId),
        where('status', '!=', 'completed')
      );
      
      const tasksDocs = await getDocs(tasksQuery);
      
      if (tasksDocs.empty) {
        availableUsers.push(member.userId);
      }
    }
    
    return availableUsers;
  };

  // Sort tasks by deadline
  const sortTasksByDeadline = (tasks) => {
    return tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  };

  // Main function to handle file upload and task assignment
  const handleFileUpload = useCallback(async (event) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const file = event.target.files[0];
      if (!file) return;

      // Parse CSV file
      const tasks = await parseCSV(file);
      
      // Validate CSV data
      const validTasks = tasks.filter(task => 
        task.name && 
        task.description && 
        task.deadline &&
        new Date(task.deadline) > new Date()
      );

      if (validTasks.length === 0) {
        throw new Error('No valid tasks found in CSV');
      }

      // Get project members
      const membersQuery = query(
        collection(db, 'projectMembers'),
        where('projectId', '==', projectId)
      );
      const membersDocs = await getDocs(membersQuery);
      const projectMembers = membersDocs.docs.map(doc => doc.data());

      // Get available users
      const availableUsers = await getAvailableUsers(projectMembers);
      
      if (availableUsers.length === 0) {
        throw new Error('No available users found');
      }

      // Sort tasks by deadline
      const sortedTasks = sortTasksByDeadline(validTasks);

      // Assign tasks using greedy approach
      let currentUserIndex = 0;
      const assignments = [];

      for (const task of sortedTasks) {
        // Rotate through available users
        const assignedUser = availableUsers[currentUserIndex];
        
        const taskData = {
          name: task.name,
          description: task.description,
          projectId,
          assignedTo: [assignedUser],
          deadline: new Date(task.deadline).toISOString(),
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'tasks'), taskData);
        assignments.push({ taskId: docRef.id, userId: assignedUser });

        // Move to next user
        currentUserIndex = (currentUserIndex + 1) % availableUsers.length;
      }

      setSuccess(`Successfully assigned ${assignments.length} tasks`);
    } catch (error) {
      console.error('Error in auto-assign:', error);
      setError(error.message || 'Failed to assign tasks');
    } finally {
      setLoading(false);
      // Reset file input
      event.target.value = '';
    }
  }, [projectId]);

  return (
    <div className="auto-assign-container">
      <div className="template-section">
        <button 
          onClick={downloadTemplate}
          className="template-button"
          title="Download CSV template"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download Template
        </button>
        <div className="template-info">
          <p>Expected CSV columns:</p>
          <ul>
            <li>name (Task name)</li>
            <li>description (Task details)</li>
            <li>deadline (Format: YYYY-MM-DD)</li>
          </ul>
        </div>
      </div>

      <div className="file-input-wrapper tooltip">
        <button className="file-input-button" disabled={loading}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Upload Tasks CSV
        </button>
        <span className="tooltip-text">Upload CSV file with task name, description, and deadline</span>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={loading}
          className="file-input"
        />
      </div>

      {loading && (
        <div className="loading">
          Processing tasks...
        </div>
      )}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
}

export default AutoAssignTasks;