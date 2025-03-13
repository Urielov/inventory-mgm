// src/components/Auth.js
import React, { useState, useEffect } from 'react';
import { auth, googleAuthProvider, db } from '../models/firebase';
import { signInWithPopup } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';

const Auth = ({ children }) => {
  const [user, setUser] = useState(null);
  const [allowedEmails, setAllowedEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  // טוען את רשימת האימיילים המורשים מ־Realtime DB וממיר למערך אם צריך
  useEffect(() => {
    const allowedEmailsRef = ref(db, 'allowedEmails');
    const unsubscribeEmails = onValue(allowedEmailsRef, (snapshot) => {
      const data = snapshot.val();
      // מאחר שהנתונים נשמרים כאובייקט {0: "...", 1: "...", 2: "..."}
      // נמיר אותם למערך בעזרת Object.values
      const emailsArray = data ? Object.values(data) : [];
      setAllowedEmails(emailsArray);
    });
    return () => unsubscribeEmails();
  }, []);

  // מאזין לשינויי אימות המשתמש
  useEffect(() => {
    // אם עדיין לא טענו את רשימת האימיילים, נחכה לפני שאנחנו בודקים
    if (allowedEmails.length === 0) return;
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u) {
        console.log("🚀 ~ unsubscribe ~ allowedEmails:", allowedEmails)

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
  }, [allowedEmails]);

  const signIn = () => {
    signInWithPopup(auth, googleAuthProvider)
      .catch((error) => {
        console.error("Error during sign in:", error);
      });
  };

  const signOut = () => {
    auth.signOut();
  };

  if (loading) {
    return <p style={styles.loading}>טוען...</p>;
  }

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
