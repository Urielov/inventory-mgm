// src/components/Auth.js
import React, { useState, useEffect } from 'react';
import { auth, googleAuthProvider } from '../models/firebase';
import { signInWithPopup } from 'firebase/auth';

// רשימת אימיילים מאושרים – עדכן לפי הצורך
const allowedEmails = ['urieloved@gmail.com', 'hodaya12311@gmail.com', 'gabioved10@gmail.com'];

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

  if (loading)
    return <p style={styles.loading}>טוען...</p>;

  if (!user) {
    return (
      <div style={styles.authContainer}>
        <p style={styles.authMessage}>אנא היכנס עם חשבון גוגל מאושר.</p>
        <button style={styles.authButton} onClick={signIn}>
          התחבר עם Google
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <p style={styles.userInfo}>
          שלום, {user.displayName} ({user.email})
        </p>
        <button style={styles.signOutButton} onClick={signOut}>
          התנתק
        </button>
      </div>
      {children}
    </div>
  );
};

const styles = {
  container: {
    direction: 'rtl',
    textAlign: 'right',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '20px'
  },
  userInfo: {
    fontSize: '16px',
    color: '#333',
    margin: 0
  },
  signOutButton: {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  authContainer: {
    direction: 'rtl',
    textAlign: 'center',
    padding: '40px',
    fontFamily: 'Arial, sans-serif'
  },
  authMessage: {
    fontSize: '24px',
    color: '#333',
    marginBottom: '20px'
  },
  authButton: {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '15px 25px',
    cursor: 'pointer',
    fontSize: '20px'
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  }
};

export default Auth;
