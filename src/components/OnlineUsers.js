// src/components/OnlineUsers.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import './OnlineUsers.css';

function OnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('online', '==', true));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOnlineUsers(users);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="user-list">
      <h2>Online Users</h2>
      <ul>
        {onlineUsers.map(user => (
          <li key={user.id} className="user-list-item">
            <span className="online-user"></span>
            {user.username}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default OnlineUsers;
