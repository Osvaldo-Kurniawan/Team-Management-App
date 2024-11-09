// src/components/CreateProjectForm.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import './CreateProjectForm.css';

function CreateProjectForm({ onProjectCreated }) {
  const [projectName, setProjectName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = await getDocs(collection(db, 'users'));
      const usersList = usersCollection.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    };

    fetchUsers();
  }, []);

  const handleMemberChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setSelectedMembers(selectedOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create project document
      const projectRef = await addDoc(collection(db, 'projects'), {
        name: projectName,
        createdAt: new Date()
      });

      // Add project members
      const projectMembersRef = collection(db, 'projectMembers');
      await Promise.all(selectedMembers.map(memberId => 
        addDoc(projectMembersRef, {
          projectId: projectRef.id,
          userId: memberId,
          role: 'member',
          joinedAt: new Date()
        })
      ));

      onProjectCreated({ 
        id: projectRef.id, 
        name: projectName,
        members: selectedMembers 
      });
      
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