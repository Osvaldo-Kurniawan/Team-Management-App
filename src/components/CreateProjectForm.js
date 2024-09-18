// src/components/CreateProjectForm.js
import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import './CreateProjectForm.css';

function CreateProjectForm({ onProjectCreated }) {
  const [projectName, setProjectName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        name: projectName,
        createdAt: new Date()
      });
      onProjectCreated({ id: docRef.id, name: projectName });
      setProjectName('');
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
        />
        <button type="submit">Create Project</button>
      </form>
    </div>
  );
}

export default CreateProjectForm;
