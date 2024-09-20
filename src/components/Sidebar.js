import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteProjectAndTasks } from '../firebase';
import './Sidebar.css';

function Sidebar({ projects, onSelectProject, onProjectDeleted }) {
  const [activeProject, setActiveProject] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const handleProjectClick = (project) => {
    setActiveProject(project.id);
    onSelectProject(project);
  };

  const handleDeleteClick = (e, project) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setShowConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting || !projectToDelete) return;

    setIsDeleting(true);
    try {
      await deleteProjectAndTasks(projectToDelete.id);
      onProjectDeleted(projectToDelete.id);
      setActiveProject(null);
      onSelectProject(null);
      alert('Project deleted successfully');
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowConfirmation(false);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="sidebar">
      <h2>Projects</h2>
      <ul className="links">
        {projects.map((project) => (
          <li 
            key={project.id} 
            onClick={() => handleProjectClick(project)}
            className={activeProject === project.id ? 'active' : ''}
          >
            <span className="project-name">{project.name}</span>
            <button 
              className="delete-project-button"
              onClick={(e) => handleDeleteClick(e, project)}
              disabled={isDeleting}
            >
              {isDeleting ? '...' : '×'}
            </button>
          </li>
        ))}
      </ul>
      <Link to="/create-project" className="add-project-button">
        Add Project
      </Link>
      {showConfirmation && (
        <div className="confirmation-modal">
          <p>Are you sure you want to delete this project?</p>
          <button onClick={handleConfirmDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Confirm'}
          </button>
          <button onClick={() => setShowConfirmation(false)} disabled={isDeleting}>Cancel</button>
        </div>
      )}
    </div>
  );
}

export default Sidebar;