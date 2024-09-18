// src/pages/Auth.js
import React, { useState } from 'react';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';
import './Auth.css';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className='auth-page'>
      <div className='image-section'>
        <img src="/logo512.png" alt="Background" className="background-image" />
      </div>
      <div className='form-section'>
        <div className="card">
          <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
          {isLogin ? <LoginForm /> : <SignupForm />}
          <button className="card-button" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Need to create an account?' : 'Already have an account?'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;
