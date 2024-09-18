// src/pages/CreateProject.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CreateProjectForm from '../components/CreateProjectForm';
import './CreateProject.css';

function CreateProject() {
  const navigate = useNavigate();

  const handleProjectCreated = () => {
    navigate('/dashboard');
  };

  return (
    <div className="create-project-page">
      <div className="create-project-container">
        <h2>Create New Project</h2>
        <CreateProjectForm onProjectCreated={handleProjectCreated} />
      </div>
    </div>
  );
}

export default CreateProject;
