// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchData } from '../firebase';
import Sidebar from '../components/Sidebar';
import OnlineUsers from '../components/OnlineUsers';
import TaskCard from '../components/TaskCard';
import './Dashboard.css';

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const loadProjects = async () => {
      const projectsData = await fetchData('projects');
      setProjects(projectsData);
    };
    loadProjects();
  }, []);

  useEffect(() => {
    const loadTasks = async () => {
      if (selectedProject) {
        const tasksData = await fetchData('tasks');
        const filteredTasks = tasksData.filter(task => task.projectId === selectedProject.id);
        setTasks(filteredTasks);
      } else {
        setTasks([]);
      }
    };
    loadTasks();
  }, [selectedProject]);

  const handleProjectDeleted = (deletedProjectId) => {
    setProjects(projects.filter(project => project.id !== deletedProjectId));
    if (selectedProject && selectedProject.id === deletedProjectId) {
      setSelectedProject(null);
    }
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <Sidebar 
          projects={projects} 
          onSelectProject={setSelectedProject} 
          onProjectDeleted={handleProjectDeleted}
        />
      </div>
      <div className="main-content">
        <h1>Dashboard</h1>
        {selectedProject ? (
          <div>
            <div className="fab-container">
              <Link to="/create-task" className="fab">
                <span className="plus-icon">+</span>
                <span className="fab-text">Add Task</span>
              </Link>
            </div>
            <div className="task-container">
              {tasks.length > 0 ? (
                tasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))
              ) : (
                <p className="no-tasks-warning">No tasks available for this project. Please add a task.</p>
              )}
            </div>
          </div>
        ) : (
          <p>Select a project to view tasks</p>
        )}
      </div>
      <div className="online-users">
        <OnlineUsers />
      </div>
    </div>
  );
}

export default Dashboard;
