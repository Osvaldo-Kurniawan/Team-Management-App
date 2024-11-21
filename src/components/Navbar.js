// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { setUserOnlineStatus } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import './Navbar.css';

function Navbar() {
  const [user, loading, error] = useAuthState(auth);

  const handleLogout = async () => {
    try {
      await setUserOnlineStatus(user, false);
      await auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error.message}</div>;
  }

  return (
    <nav className="navbar">
      <div className="navbar-header">
        <Link to="/" className="app-name-link">
          <h1 className="app-name">Team Project Management App</h1>
        </Link>
      </div>
      <ul className="navbar-links">
        {user && (
          <>
            <li><button className="logout-button" onClick={handleLogout}>Logout</button></li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;