// src/components/Sidebar.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ projects, onSelectProject }) {
  return (
    <div className="sidebar">
      <h2>Projects</h2>
      <ul className="links">
        {projects.map((project) => (
          <li key={project.id} onClick={() => onSelectProject(project)}>
            {project.name}
          </li>
        ))}
      </ul>
      <Link to="/create-project" className="add-project-button">
        Add Project
      </Link>
    </div>
  );
}

export default Sidebar;
