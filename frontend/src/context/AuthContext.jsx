import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  login as loginRequest,
  register as registerRequest,
  getMe,
  updateMe,
} from "../services/auth.service.js";


const AuthContext =
  createContext(null);


export function AuthProvider({
  children,
}) {
  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);

  const [
    loadingSession,
    setLoadingSession,
  ] = useState(true);


  useEffect(() => {
    restoreSession();
  }, []);


  async function restoreSession() {
    const token =
      localStorage.getItem(
        "token"
      );

    if (!token) {
      setLoadingSession(false);
      return;
    }

    try {
      const user =
        await getMe();

      setCurrentUser(user);

    } catch {
      localStorage.removeItem(
        "token"
      );

      setCurrentUser(null);

    } finally {
      setLoadingSession(false);
    }
  }


  async function login(
    credentials
  ) {
    const data =
      await loginRequest(
        credentials
      );

    localStorage.setItem(
      "token",
      data.token
    );

    setCurrentUser(
      data.user
    );

    return data;
  }


  async function register(
    account
  ) {
    const data =
      await registerRequest(
        account
      );

    localStorage.setItem(
      "token",
      data.token
    );

    setCurrentUser(
      data.user
    );

    return data;
  }


  function logout() {
    localStorage.removeItem(
      "token"
    );

    setCurrentUser(null);
  }


  async function updateProfile(
    profile
  ) {
    const data =
      await updateMe(
        profile
      );

    setCurrentUser(
      data.user
    );

    return data;
  }


  const isAdmin =
    currentUser?.role ===
    "admin";


  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loadingSession,
        isAdmin,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}