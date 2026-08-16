import {
  useState,
} from "react";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext.jsx";

import DashboardLayout
  from "./components/layout/DashboardLayout.jsx";

import AuthPage
  from "./pages/AuthPage.jsx";

import DashboardPage
  from "./pages/DashboardPage.jsx";

import EventsPage
  from "./pages/EventsPage.jsx";

import BookingsPage
  from "./pages/BookingsPage.jsx";

import UsersPage
  from "./pages/UsersPage.jsx";

import ProfilePage
  from "./pages/ProfilePage.jsx";

import "./App.css";


function Application() {
  const {
    currentUser,
    loadingSession,
    isAdmin,
  } = useAuth();


  const [
    activeView,
    setActiveView,
  ] = useState(
    "dashboard"
  );


  const [
    selectedEvent,
    setSelectedEvent,
  ] = useState(null);


  if (loadingSession) {
    return (
      <div className="loading-page">

        <div className="loader" />

        <p>
          Loading account...
        </p>

      </div>
    );
  }


  if (!currentUser) {
    return (
      <AuthPage />
    );
  }


  function openEvent(
    event
  ) {
    setSelectedEvent(
      event
    );

    setActiveView(
      "events"
    );
  }


  return (
    <DashboardLayout
      activeView={
        activeView
      }
      setActiveView={
        setActiveView
      }
    >

      {activeView ===
        "dashboard" && (
        <DashboardPage
          onOpenEvent={
            openEvent
          }
        />
      )}


      {activeView ===
        "events" && (
        <EventsPage
          selectedEvent={
            selectedEvent
          }
          setSelectedEvent={
            setSelectedEvent
          }
        />
      )}


      {activeView ===
        "bookings" && (
        <BookingsPage />
      )}


      {activeView ===
        "users" &&
        isAdmin && (
        <UsersPage />
      )}


      {activeView ===
        "profile" && (
        <ProfilePage />
      )}

    </DashboardLayout>
  );
}


export default function App() {
  return (
    <AuthProvider>

      <Application />

    </AuthProvider>
  );
}