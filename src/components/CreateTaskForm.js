// src/components/CreateTaskForm.js
import React, { useState, useEffect } from 'react';
import { fetchProjectMembers, createTask } from '../firebase';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './CreateTaskForm.css';

function CreateTaskForm({ projects, onTaskCreated }) {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedTo, setAssignedTo] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [deadline, setDeadline] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProjectMembers = async () => {
      if (!projectId) {
        setProjectMembers([]);
        setAssignedTo([]);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const members = await fetchProjectMembers(projectId);
        setProjectMembers(members);
      } catch (error) {
        console.error("Error fetching project members:", error);
        setError('Failed to load project members');
      } finally {
        setLoading(false);
      }
    };

    loadProjectMembers();
  }, [projectId]);

  const handleProjectChange = (e) => {
    setProjectId(e.target.value);
    setAssignedTo([]);
  };

  const handleUserChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setAssignedTo(selectedOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const taskData = {
        name: taskName,
        description,
        projectId,
        assignedTo,
        deadline: deadline ? deadline.toISOString() : null
      };

      const task = await createTask(taskData);
      
      onTaskCreated(task);
      
      setTaskName('');
      setDescription('');
      setProjectId('');
      setAssignedTo([]);
      setDeadline(null);
    } catch (error) {
      console.error("Error adding task: ", error);
      setError('Failed to create task. Please try again.');
    }
  };

  return (
    <form className="create-task-form" onSubmit={handleSubmit}>
      <select 
        className="form-select" 
        value={projectId} 
        onChange={handleProjectChange}
        required
      >
        <option value="">Select Project</option>
        {projects.map(project => (
          <option key={project.id} value={project.id}>{project.name}</option>
        ))}
      </select>

      <p>Task Name</p>
      <input
        className="form-input"
        type="text"
        placeholder="Task Name"
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        required
      />

      <p>Task Description</p>
      <textarea
        className="form-textarea"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />

      <p>Assign To (hold Ctrl for multiple)</p>
      {loading ? (
        <div>Loading project members...</div>
      ) : (
        <>
          <select 
            className="form-select multiple" 
            multiple 
            value={assignedTo} 
            onChange={handleUserChange}
            required
            disabled={!projectId || loading}
          >
            {projectMembers.map(member => (
              <option key={member.id} value={member.id}>
                {member.username || member.email}
              </option>
            ))}
          </select>

          {projectMembers.length === 0 && projectId && !loading && (
            <div className="info-message">No members found in this project</div>
          )}
        </>
      )}

      {assignedTo.length > 0 && (
        <div className="assigned-users">
          {assignedTo.map(userId => {
            const user = projectMembers.find(u => u.id === userId);
            return user && (
              <div key={userId} className="assigned-user">
                {user.avatarURL && (
                  <img 
                    src={user.avatarURL} 
                    alt={user.username || user.email} 
                    className="user-avatar" 
                  />
                )}
                <span className="user-name">{user.username || user.email}</span>
              </div>
            );
          })}
        </div>
      )}

      <p>Deadline</p>
      <DatePicker
        selected={deadline}
        onChange={(date) => setDeadline(date)}
        dateFormat="dd/MM/yyyy"
        className="form-input"
        placeholderText="Select a deadline"
        required
        minDate={new Date()}
      />

      {error && <div className="error-message">{error}</div>}
      
      <button 
        className="form-button" 
        type="submit"
        disabled={loading}
      >
        Create Task
      </button>
    </form>
  );
}

export default CreateTaskForm;