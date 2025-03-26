import React, { useState, useEffect } from 'react';
import { auth, googleAuthProvider, db } from '../models/firebase';
import { signInWithPopup } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';

const Auth = ({ children }) => {
  const [user, setUser] = useState(null);
  const [allowedEmails, setAllowedEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load allowed emails from Realtime DB
  useEffect(() => {
    const allowedEmailsRef = ref(db, 'allowedEmails');
    const unsubscribeEmails = onValue(allowedEmailsRef, (snapshot) => {
      const data = snapshot.val();
      const emailsArray = data ? Object.values(data) : [];
      setAllowedEmails(emailsArray);
    });
    return () => unsubscribeEmails();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    if (allowedEmails.length === 0) return;
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u) {
        console.log("🚀 ~ unsubscribe ~ allowedEmails:", allowedEmails);
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
    signInWithPopup(auth, googleAuthProvider).catch((error) => {
      console.error("Error during sign in:", error);
    });
  };

  const signOut = () => {
    auth.signOut();
  };

  if (loading) {
    return <p style={styles.loading}>טוען...</p>;
  }

  // Pass auth state and methods to children as a render prop
  return children({ user, signIn, signOut });
};

const styles = {
  loading: {
    textAlign: 'center',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
};

export default Auth;