// src/components/TaskCard.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchUserDetails } from '../firebase';
import './TaskCard.css';

function TaskCard({ task }) {
  const [userAvatars, setUserAvatars] = useState([]);

  useEffect(() => {
    const fetchAvatars = async () => {
      if (task.assignedTo && task.assignedTo.length > 0) {
        try {
          const users = await fetchUserDetails(task.assignedTo);
          setUserAvatars(users);
        } catch (error) {
          console.error('Error fetching user details:', error);
        }
      }
    };
    
    fetchAvatars();
  }, [task.assignedTo]);

  return (
    <div className="task-card">
      <h3>{task.name}</h3>
      <div className="task-info">
        <p className="task-description">{task.description.substring(0, 100)}...</p>
        <div className="task-status">
          <strong>Status:</strong> {task.status || 'Not Started'}
        </div>
      </div>
      <div className="task-assigned-to">
        <strong>Assigned To:</strong>
        <div className="user-avatars">
          {userAvatars.map(user => (
            <img
              key={user.id}
              src={user.avatarURL}
              alt={user.username}
              className="user-avatar"
            />
          ))}
        </div>
      </div>
      <Link to={`/task/${task.id}`} className="view-details-link">View Details</Link>
    </div>
  );
}

export default TaskCard;
