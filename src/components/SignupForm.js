// src/components/SignupForm.js
import React, { useState } from 'react';
import { signupUser } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './SignupForm.css';

function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userData = {
        email,
        password,
        username,
        avatar
      };

      await signupUser(userData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to create account');
      setIsLoading(false);
    }
  };

  return (
    <div className='sign-up-form'>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={isLoading}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          minLength="6"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setAvatar(e.target.files[0])}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default SignupForm;