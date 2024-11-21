// src/components/CreateProjectForm.js
import React, { useState, useEffect } from 'react';
import { fetchAllUsers, createProject } from '../firebase';
import './CreateProjectForm.css';

function CreateProjectForm({ onProjectCreated }) {
  const [projectName, setProjectName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      const usersList = await fetchAllUsers();
      setUsers(usersList);
    };

    loadUsers();
  }, []);

  const handleMemberChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setSelectedMembers(selectedOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const project = await createProject(projectName, selectedMembers);
      
      onProjectCreated(project);
      
      setProjectName('');
      setSelectedMembers([]);
    } catch (error) {
      console.error("Error adding project: ", error);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter Project Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          required
          className="form-input"
        />
        <strong>Select Project Members (hold Ctrl for multiple)</strong>
        <select
          multiple
          value={selectedMembers}
          onChange={handleMemberChange}
          required
          className="form-select multiple"
        >
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.username}
            </option>
          ))}
        </select>
        <div className="selected-members">
          {selectedMembers.map(memberId => {
            const user = users.find(u => u.id === memberId);
            return user && (
              <div key={memberId} className="selected-member">
                <img src={user.avatarURL} alt={user.username} className="member-avatar" />
                <span>{user.username}</span>
              </div>
            );
          })}
        </div>
        <button type="submit" className="form-button">Create Project</button>
      </form>
    </div>
  );
}

export default CreateProjectForm;