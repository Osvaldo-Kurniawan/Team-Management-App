// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CreateProject from './pages/CreateProject';
import CreateTask from './pages/CreateTask';
import TaskDetail from './pages/TaskDetail';
import AutoAssignPage from './pages/AutoAssignPage';
import './App.css';
import ShortcutHandler from './components/ShortcutHandler';

const PrivateRoute = ({ component: Component }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <Component /> : <Navigate to="/" />;
};

const PublicRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <Navigate to="/dashboard" /> : <Auth />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <ShortcutHandler />
          <Navbar />
          <Routes>
            <Route path="/" element={<PublicRoute />} />
            <Route path="/dashboard" element={<PrivateRoute component={Dashboard} />} />
            <Route path="/create-project" element={<PrivateRoute component={CreateProject} />} />
            <Route path="/create-task" element={<PrivateRoute component={CreateTask} />} />
            <Route path="/task/:id" element={<PrivateRoute component={TaskDetail} />} />
            <Route path="/auto-assign/:projectId" element={<AutoAssignPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
