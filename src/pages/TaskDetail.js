// src/pages/TaskDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { getTaskById, getUsersByIds } from '../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import CommentSection from '../components/CommentSection';
import './TaskDetail.css';

function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [status, setStatus] = useState('');
  const [assignedUsers, setAssignedUsers] = useState({});

  useEffect(() => {
    const fetchTask = async () => {
      const taskData = await getTaskById(id);
      if (taskData) {
        setTask(taskData);
        setStatus(taskData.status || 'In Progress');

        if (taskData.assignedTo) {
          const userData = await getUsersByIds(taskData.assignedTo);
          setAssignedUsers(userData);
        }
      }
    };
    fetchTask();
  }, [id]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    await updateDoc(doc(db, 'tasks', id), { status: newStatus });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteDoc(doc(db, 'tasks', id));
      navigate('/');
    }
  };

  if (!task) return <div className="loading">Loading...</div>;

  const formattedDeadline = task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline set';

  return (
    <div className="task-detail">
      <div className="task-content">
        <div className="task-info">
          <h2>{task.name}</h2>
          <p className="task-description">{task.description}</p>
          <div className="deadline-container">
            <strong>Deadline:</strong> {formattedDeadline}
          </div>
          <div className="status-container">
            <strong>Status:</strong>
            <select value={status} onChange={handleStatusChange} className="status-select">
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
          <div className="assigned-to">
            <p>Assigned to:</p>
            <div className="avatar-group">
              {task.assignedTo && task.assignedTo.map((userId, index) => (
                <img 
                  key={index} 
                  src={assignedUsers[userId]?.avatarURL || '/default-avatar.png'}
                  alt={assignedUsers[userId]?.name || 'User'} 
                  className="avatar" 
                />
              ))}
            </div>
          </div>
          <button onClick={handleDelete} className="delete-button">
            Delete Task
          </button>
        </div>
        <CommentSection taskId={id} />
      </div>
    </div>
  );
}

export default TaskDetail;
