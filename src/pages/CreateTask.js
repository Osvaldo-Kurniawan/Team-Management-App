// src/pages/CreateTask.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchData } from '../firebase'; 
import CreateTaskForm from '../components/CreateTaskForm';
import './CreateTask.css';

function CreateTask() {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProjects = async () => {
      const projectsData = await fetchData('projects');
      setProjects(projectsData);
    };
    loadProjects();
  }, []);

  const handleTaskCreated = () => {
    navigate('/dashboard');
  };

  return (
    <div className="create-task-container">
      <h2 className="create-task-title">Create New Task</h2>
      <CreateTaskForm projects={projects} onTaskCreated={handleTaskCreated} />
    </div>
  );
}

export default CreateTask;
