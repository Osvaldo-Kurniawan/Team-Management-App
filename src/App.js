import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CreateProject from './pages/CreateProject';
import CreateTask from './pages/CreateTask';
import TaskDetail from './pages/TaskDetail';
import UserProfile from './pages/UserProfile';
import './App.css';

const PrivateRoute = ({ component: Component }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <Component /> : <Navigate to="/" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/dashboard" element={<PrivateRoute component={Dashboard} />} />
            <Route path="/create-project" element={<PrivateRoute component={CreateProject} />} />
            <Route path="/create-task" element={<PrivateRoute component={CreateTask} />} />
            <Route path="/task/:id" element={<PrivateRoute component={TaskDetail} />} />
            <Route path="/profile" element={<PrivateRoute component={UserProfile} />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
