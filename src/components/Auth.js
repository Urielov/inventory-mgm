// src/components/Auth.js
import React, { useState, useEffect } from 'react';
import { auth, googleAuthProvider } from '../models/firebase';
import { signInWithPopup } from 'firebase/auth';

// רשימת אימיילים מאושרים – עדכן לפי הצורך
const allowedEmails = ['urieloved@gmail.com', 'your_allowed_email2@gmail.com'];

const Auth = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u) {
        if (allowedEmails.includes(u.email)) {
          setUser(u);
        } else {
          alert("אינך מורשה לגשת לאפליקציה זו");
          auth.signOut();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = () => {
    signInWithPopup(auth, googleAuthProvider)
      .catch((error) => {
        console.error("Error during sign in:", error);
      });
  };

  const signOut = () => {
    auth.signOut();
  };

  if (loading) return <p>טוען...</p>;

  if (!user) {
    return (
      <div>
        <p>אנא היכנס עם חשבון גוגל מאושר.</p>
        <button onClick={signIn}>התחבר עם Google</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <p>שלום, {user.displayName} ({user.email})</p>
        <button onClick={signOut}>התנתק</button>
      </div>
      {children}
    </div>
  );
};

export default Auth;
