// src/components/SignupForm.js
import React, { useState } from 'react';
import { auth, storage, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { setDoc, doc } from 'firebase/firestore';
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

  const createUserDocument = async (userId, userData) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        ...userData,
        createdAt: new Date().toISOString(),
        online: true
      });
      return true;
    } catch (error) {
      console.error('Error creating user document:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData = {
        username,
        email,
        avatarURL: '', 
      };

      const userDocCreated = await createUserDocument(user.uid, userData);
      
      if (!userDocCreated) {
        throw new Error('Failed to create user document');
      }

      console.log('Selected avatar file:', avatar);

      if (avatar) {
        try {
          const avatarRef = ref(storage, `avatars/${user.uid}`);
          await uploadBytes(avatarRef, avatar);
          const avatarURL = await getDownloadURL(avatarRef);
          
          console.log('Avatar URL:', avatarURL); // Log avatar URL
          
          // Update the user document with avatar URL
          await setDoc(doc(db, 'users', user.uid), {
            ...userData,
            avatarURL,
          }, { merge: true });

          console.log('User document updated with avatar URL');
        } catch (avatarError) {
          console.error('Error uploading avatar:', avatarError);
          throw avatarError;
        }
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to create account');
    } finally {
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