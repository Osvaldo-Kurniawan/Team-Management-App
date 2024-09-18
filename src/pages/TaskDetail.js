import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import CommentSection from '../components/CommentSection';
import './TaskDetail.css';

function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchTask = async () => {
      const taskDoc = await getDoc(doc(db, 'tasks', id));
      if (taskDoc.exists()) {
        setTask({ id: taskDoc.id, ...taskDoc.data() });
        setStatus(taskDoc.data().status || 'In Progress');
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

  return (
    <div className="task-detail">
      <div className="task-content">
        <div className="task-info">
          <h2>{task.name}</h2>
          <p className="task-meta">By {task.createdBy}</p>
          <p className="task-meta">Project due by {task.dueDate}</p>
          <p className="task-description">{task.description}</p>
          <div className="status-container">
            <strong>Status:</strong>
            <select value={status} onChange={handleStatusChange} className="status-select">
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
          <div className="assigned-to">
            <p>project is Assigned to:</p>
            <div className="avatar-group">
              {task.assignedTo && task.assignedTo.map((user, index) => (
                <img key={index} src={user.avatarUrl} alt={user.name} className="avatar" />
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