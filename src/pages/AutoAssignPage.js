import React from 'react';
import { useNavigate } from 'react-router-dom';
import AutoAssignTasks from '../components/AutoAssignTasks';
import './AutoAssignPage.css';

import { useParams } from 'react-router-dom';

function AutoAssignPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  if (!projectId) {
    return (
      <div className="auto-assign-page">
        <div className="header">
          <button onClick={() => navigate(-1)} className="back-button">
            ← Back to Dashboard
          </button>
        </div>
        <div className="content">
          <p className="error-message">Invalid URL. Please select a project from the dashboard and try again.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="auto-assign-page">
      <div className="header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back to Dashboard
        </button>
        <h1>Auto Assign Tasks</h1>
      </div>
      <div className="content">
        <AutoAssignTasks projectId={projectId} />
      </div>
    </div>
  );
}

export default AutoAssignPage;