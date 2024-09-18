import React, { useState, useEffect } from 'react';
import { db, auth, fetchData } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import './CommentSection.css';

function CommentSection({ taskId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [users, setUsers] = useState({});

  useEffect(() => {
    const fetchComments = async () => {
      const commentsData = await fetchData('comments');
      const filteredComments = commentsData
        .filter(comment => comment.taskId === taskId)
        .sort((a, b) => {
          const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
          const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
          return dateB - dateA;
        });
      setComments(filteredComments);
      
      // Fetch user data for each comment
      const userIds = [...new Set(filteredComments.map(comment => comment.userId))];
      const userDataPromises = userIds.map(userId => getDoc(doc(db, 'users', userId)));
      const userSnapshots = await Promise.all(userDataPromises);
      const userData = userSnapshots.reduce((acc, snapshot) => {
        if (snapshot.exists()) {
          acc[snapshot.id] = snapshot.data();
        }
        return acc;
      }, {});
      setUsers(userData);
    };

    fetchComments();

    const q = query(
      collection(db, 'comments'),
      where('taskId', '==', taskId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const updatedComments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date()
      }));
      setComments(updatedComments);

      // Fetch user data for new comments
      const newUserIds = updatedComments
        .filter(comment => !users[comment.userId])
        .map(comment => comment.userId);
      
      if (newUserIds.length > 0) {
        const newUserDataPromises = newUserIds.map(userId => getDoc(doc(db, 'users', userId)));
        const newUserSnapshots = await Promise.all(newUserDataPromises);
        const newUserData = newUserSnapshots.reduce((acc, snapshot) => {
          if (snapshot.exists()) {
            acc[snapshot.id] = snapshot.data();
          }
          return acc;
        }, {});
        setUsers(prevUsers => ({ ...prevUsers, ...newUserData }));
      }
    });

    return () => unsubscribe();
  }, [taskId, users]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const newCommentDoc = await addDoc(collection(db, 'comments'), {
        taskId: taskId,
        content: newComment,
        createdAt: serverTimestamp(),
        userId: auth.currentUser.uid
      });

      // Immediately add the new comment to the state
      setComments(prevComments => [
        {
          id: newCommentDoc.id,
          taskId: taskId,
          content: newComment,
          createdAt: new Date(),
          userId: auth.currentUser.uid
        },
        ...prevComments
      ]);

      setNewComment('');
    } catch (error) {
      console.error("Error adding comment: ", error);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    
    const now = new Date();
    const commentDate = new Date(date);
    
    if (
      commentDate.getDate() === now.getDate() &&
      commentDate.getMonth() === now.getMonth() &&
      commentDate.getFullYear() === now.getFullYear()
    ) {
      // If the comment was made today, return only the time
      return commentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // If the comment was made on a different day, return only the date
      return commentDate.toLocaleDateString();
    }
  };

  return (
    <div className="comment-section task-info">
      <h3>Project comments</h3>
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
                <span className="comment-time">{formatDate(comment.createdAt)}</span>
              </div>
            </div>
            <p className="comment-content">{comment.content}</p>
          </li>
        ))}
      </ul>
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