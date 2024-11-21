// src/components/CommentSection.js
import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase';
import { fetchComments, addComment, fetchCommentUsers, formatCommentDate } from '../firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import './CommentSection.css';

function CommentSection({ taskId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [users, setUsers] = useState({});

  const updateUsers = useCallback(async (commentList) => {
    const newUserIds = commentList
      .filter(comment => !users[comment.userId])
      .map(comment => comment.userId);
    
    if (newUserIds.length > 0) {
      const newUserData = await fetchCommentUsers(commentList);
      setUsers(prevUsers => ({ ...prevUsers, ...newUserData }));
    }
  }, [users]);

  useEffect(() => {
    const loadComments = async () => {
      try {
        const initialComments = await fetchComments(taskId);
        setComments(initialComments);

        const userData = await fetchCommentUsers(initialComments);
        setUsers(userData);
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    };

    loadComments();

    const commentsQuery = query(
      collection(db, 'comments'),
      where('taskId', '==', taskId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(commentsQuery, async (querySnapshot) => {
      const updatedComments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date()
      }));
      setComments(updatedComments);
      await updateUsers(updatedComments);
    });

    return () => unsubscribe();
  }, [taskId, updateUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const newCommentDoc = await addComment(
        taskId, 
        newComment, 
        auth.currentUser.uid
      );

      const newCommentData = {
        id: newCommentDoc.id,
        taskId: taskId,
        content: newComment,
        createdAt: new Date(),
        userId: auth.currentUser.uid
      };

      setComments(prevComments => [newCommentData, ...prevComments]);
      setNewComment('');
    } catch (error) {
      console.error("Error adding comment: ", error);
    }
  };

  return (
    <div className="comment-section task-info">
      <h3>Project comments</h3>
      {comments.length > 0 ? (
        <ul className="comment-list">
          {comments.map(comment => (
            <li key={comment.id} className="comment">
              <div className="comment-header">
                <img 
                  src={users[comment.userId]?.avatarURL || '/default-avatar.png'} 
                  alt={users[comment.userId]?.username || 'User'} 
                  className="user-avatar"
                />
                <div className="comment-meta">
                  <strong>{users[comment.userId]?.username || 'Anonymous'}</strong>
                  <span className="comment-time">
                    {formatCommentDate(comment.createdAt)}
                  </span>
                </div>
              </div>
              <p className="comment-content">{comment.content}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-comments-message">No comments available for this task.</p>
      )}
      <form onSubmit={handleSubmit} className="comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add new comment"
          className="comment-input"
        />
        <button type="submit" className="submit-comment">
          Add comment
        </button>
      </form>
    </div>
  );
}

export default CommentSection;