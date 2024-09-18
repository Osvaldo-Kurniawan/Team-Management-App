// src/components/CreateTaskForm.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import './CreateTaskForm.css';

function CreateTaskForm({ projects, onTaskCreated }) {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedTo, setAssignedTo] = useState([]);
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

  const handleUserChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setAssignedTo(selectedOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'tasks'), {
        name: taskName,
        description,
        projectId,
        assignedTo,
        createdAt: new Date()
      });
      onTaskCreated({ id: docRef.id, name: taskName, description, projectId, assignedTo });
      setTaskName('');
      setDescription('');
      setProjectId('');
      setAssignedTo([]);
    } catch (error) {
      console.error("Error adding task: ", error);
    }
  };

  return (
    <form className="create-task-form" onSubmit={handleSubmit}>
      <select className="form-select" value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
        <option value="">Select Project</option>
        {projects.map(project => (
          <option key={project.id} value={project.id}>{project.name}</option>
        ))}
      </select>
      <p>Masukkan Task Name</p>
      <input
        className="form-input"
        type="text"
        placeholder="Task Name"
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        required
      />
      <p>Masukkan Deskripsi Task</p>
      <textarea
        className="form-textarea"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <p>Pilih user (hold ctrl for multiple user) : </p>
      <select className="form-select multiple" multiple value={assignedTo} onChange={handleUserChange} required>
        {users.map(user => (
          <option key={user.id} value={user.id}>
            {user.username}
          </option>
        ))}
      </select>
      <div className="assigned-users">
        {assignedTo.map(userId => {
          const user = users.find(u => u.id === userId);
          return (
            <div key={userId} className="assigned-user">
              <img src={user.avatarURL} alt={user.username} className="user-avatar" />
              <span className="user-name">{user.username}</span>
            </div>
          );
        })}
      </div>
      <button className="form-button" type="submit">Create Task</button>
    </form>
  );
}

export default CreateTaskForm;
