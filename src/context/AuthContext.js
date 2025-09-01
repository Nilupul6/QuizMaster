// import React, { createContext, useContext, useEffect, useState } from "react";
// import { onAuthStateChanged } from "firebase/auth";
// import { auth } from "../services/firebase";

// const AuthContext = createContext();
// export const useAuth = () => useContext(AuthContext);

// export const AuthProvider = ({ children }) => {
//   const [currentUser, setCurrentUser] = useState(null);
//   const [loading, setLoading] = useState(true);   // NEW
//   const [isAdmin, setIsAdmin] = useState(false);  // NEW: Track admin status

//   const adminEmail = "admin@example.com"; // Hardcoded, consistent with Login.js

//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, (user) => {
//       setCurrentUser(user);
//       if (user && user.email) {
//         setIsAdmin(user.email.toLowerCase() === adminEmail.toLowerCase());
//       } else {
//         setIsAdmin(false);
//       }
//       setLoading(false);           // auth status now known
//     });
//     return unsub;
//   }, []);

//   return (
//     <AuthContext.Provider value={{ currentUser, loading, isAdmin }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// src/context/AuthContext.js
import React, { useContext, useState, useEffect, createContext } from "react";
import {
  auth,
  db, // Import rtdb for Realtime Database operations
  timestamp, // Import timestamp for RTDB
} from "./../services/firebase"; // Make sure firebase.js exports 'auth', 'rtdb', 'timestamp'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile, // Import updateProfile to update user's display name and photoURL
} from "firebase/auth";
import { ref as dbRef, set, onValue } from "firebase/database"; // RTDB functions

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Hardcoded admin email - ensure this matches your admin user's email
  const adminEmail = "admin@example.com";

  // Function to register a new user
  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // Function to log in an existing user
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Function to log out the current user
  function logout() {
    return signOut(auth);
  }

  // Function to update user profile (display name & photoURL) in Auth and RTDB
  async function updateUserProfileAndDB(name, photoURL) {
    // Crucial check: Ensure auth.currentUser exists and is the actual Firebase User object
    if (!auth.currentUser) {
      console.error("No current Firebase Auth user to update profile for.");
      throw new Error("No user logged in or user object is invalid.");
    }

    try {
      // 1. Update Firebase Authentication user profile
      // FIX IS HERE: Use auth.currentUser directly for updateProfile
      await updateProfile(auth.currentUser, {
        displayName: name,
        photoURL: photoURL, // Use the provided photoURL directly
      });
      console.log("Firebase Auth profile updated.");

      // 2. Update Realtime Database with profile info and a 'profileSetupCompleted' flag
      const userDbRef = dbRef(db, `users/${auth.currentUser.uid}`);
      await set(userDbRef, {
        uid: auth.currentUser.uid,
        name: name,
        email: auth.currentUser.email,
        photoURL: photoURL,
        profileSetupCompleted: true, // Mark profile as completed
        createdAt: timestamp(), // Record when profile was set up/updated
      });
      console.log("Realtime Database profile updated.");

      // The onAuthStateChanged listener will automatically pick up the update
      // and re-trigger setCurrentUser, updating the React state with the latest user object.

    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error; // Re-throw to handle in component
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Always set the base user first
      setCurrentUser(user);
      setLoading(false); // Authentication status is now known

      if (user) {
        // Check admin status
        setIsAdmin(user.email.toLowerCase() === adminEmail.toLowerCase());

        // Setup a listener for user's profile data in Realtime Database
        const userProfileRef = dbRef(db, `users/${user.uid}`);
        const profileUnsubscribe = onValue(userProfileRef, (snapshot) => {
          let updatedUser = { ...user }; // Create a copy to add custom flags
          if (snapshot.exists()) {
            const profileData = snapshot.val();
            // Attach Realtime DB profile data and the 'profileSetupNeeded' flag
            updatedUser = {
                ...updatedUser,
                // Prioritize displayName and photoURL from the Firebase Auth user object directly
                displayName: user.displayName || profileData.name,
                photoURL: user.photoURL || profileData.photoURL,
                // If profileSetupCompleted is explicitly false or not set, it's incomplete
                profileSetupNeeded: profileData.profileSetupCompleted === false || profileData.profileSetupCompleted === undefined
            };
          } else {
            // If no user data exists in RTDB, then profile setup is needed
            updatedUser = { ...updatedUser, profileSetupNeeded: true };
          }
          setCurrentUser(updatedUser); // Update currentUser with profile flags/data
        });

        // Cleanup for the profile listener when user logs out or component unmounts
        return () => profileUnsubscribe();
      } else {
        setIsAdmin(false); // Not an admin if no user
        // Ensure profileSetupNeeded is reset if user logs out
        setCurrentUser(null); // Explicitly set to null if no user
      }
    });

    // Cleanup for the main auth state listener
    return unsubscribe;
  }, []); // Empty dependency array means this effect runs once on mount

  const value = {
    currentUser,
    loading,
    isAdmin,
    signup,
    login,
    logout,
    updateUserProfileAndDB, // Expose the function to update profile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Render children only when auth loading is complete */}
    </AuthContext.Provider>
  );
}