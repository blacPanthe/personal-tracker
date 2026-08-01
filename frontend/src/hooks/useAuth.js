import { useEffect, useState } from 'react';
import { getCurrentUser, signIn, signUp, signOut } from '../api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setChecking(false));
  }, []);

  const handleSignIn = async (email, password) => {
    setUser(await signIn(email, password));
  };

  const handleSignUp = async (email, password) => {
    setUser(await signUp(email, password));
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  return { user, checking, signIn: handleSignIn, signUp: handleSignUp, signOut: handleSignOut };
}
