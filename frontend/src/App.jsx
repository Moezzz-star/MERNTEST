import { useEffect, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;


// ======================================================
// HELPERS
// ======================================================

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}


function toDateInput(value) {
  if (!value) return "";

  const date = new Date(value);

  const offset =
    date.getTimezoneOffset() * 60000;

  return new Date(
    date.getTime() - offset
  )
    .toISOString()
    .slice(0, 16);
}


// ======================================================
// APP
// ======================================================

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const [currentUser, setCurrentUser] =
    useState(null);

  const [loadingSession, setLoadingSession] =
    useState(Boolean(token));

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [activeView, setActiveView] =
    useState("dashboard");


  // ====================================================
  // AUTH STATE
  // ====================================================

  const [authMode, setAuthMode] =
    useState("login");

  const [authForm, setAuthForm] =
    useState({
      name: "",
      email: "",
      password: "",
      age: "",
    });


  // ====================================================
  // PROFILE
  // ====================================================

  const [profileForm, setProfileForm] =
    useState({
      name: "",
      age: "",
    });


  // ====================================================
  // EVENTS + SESSIONS
  // ====================================================

  const [events, setEvents] =
    useState([]);

  const [selectedEvent, setSelectedEvent] =
    useState(null);

  const [sessions, setSessions] =
    useState([]);


  // ====================================================
  // BOOKINGS
  // ====================================================

  const [myBookings, setMyBookings] =
    useState([]);

  const [allBookings, setAllBookings] =
    useState([]);


  // ====================================================
  // ADMIN USERS
  // ====================================================

  const [users, setUsers] =
    useState([]);

  const [editingUserId, setEditingUserId] =
    useState(null);

  const [userForm, setUserForm] =
    useState({
      name: "",
      email: "",
      password: "",
      age: "",
    });


  // ====================================================
  // ADMIN EVENTS
  // ====================================================

  const [editingEventId, setEditingEventId] =
    useState(null);

  const [eventForm, setEventForm] =
    useState({
      title: "",
      description: "",
      location: "",
    });


  // ====================================================
  // ADMIN SESSIONS
  // ====================================================

  const [
    editingSessionId,
    setEditingSessionId,
  ] = useState(null);

  const [sessionForm, setSessionForm] =
    useState({
      startAt: "",
      endAt: "",
      capacity: "",
      status: "available",
    });


  // ====================================================
  // API HELPER
  // ====================================================

  async function apiFetch(
    path,
    options = {}
  ) {
    const headers = {
      ...(options.body
        ? {
            "Content-Type":
              "application/json",
          }
        : {}),

      ...(options.headers || {}),
    };

    if (token) {
      headers.Authorization =
        `Bearer ${token}`;
    }

    return fetch(
      `${API_URL}${path}`,
      {
        ...options,
        headers,
      }
    );
  }


  // ====================================================
  // SESSION
  // ====================================================

  useEffect(() => {
    if (token) {
      loadSession();
    } else {
      setLoadingSession(false);
    }
  }, [token]);


  async function loadSession() {
    setLoadingSession(true);

    try {
      const response =
        await apiFetch("/auth/me");

      if (!response.ok) {
        throw new Error(
          "Session expired"
        );
      }

      const user =
        await response.json();

      setCurrentUser(user);

      setProfileForm({
        name: user.name || "",
        age: user.age ?? "",
      });

      await fetchEvents();

      if (user.role === "admin") {
        await Promise.all([
          fetchUsers(),
          fetchAllBookings(),
        ]);
      } else {
        await fetchMyBookings();
      }

    } catch (error) {
      logout();

    } finally {
      setLoadingSession(false);
    }
  }


  // ====================================================
  // AUTH
  // ====================================================

  function handleAuthChange(event) {
    const { name, value } =
      event.target;

    setAuthForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }


  async function handleAuthSubmit(
    event
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const endpoint =
        authMode === "register"
          ? "/auth/register"
          : "/auth/login";

      const body =
        authMode === "register"
          ? authForm
          : {
              email:
                authForm.email,

              password:
                authForm.password,
            };

      const response =
        await fetch(
          `${API_URL}${endpoint}`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(body),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Authentication failed"
        );
      }

      localStorage.setItem(
        "token",
        data.token
      );

      setToken(data.token);

      setAuthForm({
        name: "",
        email: "",
        password: "",
        age: "",
      });

    } catch (error) {
      setMessage(error.message);

    } finally {
      setLoading(false);
    }
  }


  function logout() {
    localStorage.removeItem(
      "token"
    );

    setToken(null);
    setCurrentUser(null);

    setEvents([]);
    setSessions([]);
    setMyBookings([]);
    setAllBookings([]);
    setUsers([]);

    setSelectedEvent(null);
    setActiveView("dashboard");

    setMessage("");
  }


  // ====================================================
  // PROFILE
  // ====================================================

  function handleProfileChange(event) {
    const { name, value } =
      event.target;

    setProfileForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  }


  async function updateProfile(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response =
        await apiFetch(
          "/auth/me",
          {
            method: "PUT",

            body:
              JSON.stringify(
                profileForm
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not update profile"
        );
      }

      setCurrentUser(
        data.user
      );

      setMessage(
        "Profile updated successfully"
      );

    } catch (error) {
      setMessage(error.message);

    } finally {
      setLoading(false);
    }
  }


  // ====================================================
  // EVENTS
  // ====================================================

  async function fetchEvents() {
    try {
      const response =
        await apiFetch(
          "/events"
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not load events"
        );
      }

      setEvents(data);

    } catch (error) {
      setMessage(error.message);
    }
  }


  async function openEvent(event) {
    setSelectedEvent(event);

    setActiveView("events");

    await fetchSessions(
      event._id
    );
  }


  async function fetchSessions(
    eventId
  ) {
    try {
      const response =
        await apiFetch(
          `/events/${eventId}/sessions`
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not load sessions"
        );
      }

      setSessions(data);

    } catch (error) {
      setMessage(error.message);
    }
  }


  // ====================================================
  // USER BOOKINGS
  // ====================================================

  async function fetchMyBookings() {
    try {
      const response =
        await apiFetch(
          "/bookings/me"
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not load bookings"
        );
      }

      setMyBookings(data);

    } catch (error) {
      setMessage(error.message);
    }
  }


  async function bookSession(
    sessionId
  ) {
    setLoading(true);
    setMessage("");

    try {
      const response =
        await apiFetch(
          "/bookings",
          {
            method: "POST",

            body:
              JSON.stringify({
                sessionId,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Booking failed"
        );
      }

      setMessage(
        "Booking confirmed successfully"
      );

      await fetchMyBookings();

      if (selectedEvent) {
        await fetchSessions(
          selectedEvent._id
        );
      }

    } catch (error) {
      setMessage(error.message);

    } finally {
      setLoading(false);
    }
  }


  async function cancelBooking(
    bookingId
  ) {
    const confirmed =
      window.confirm(
        "Cancel this appointment?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await apiFetch(
          `/bookings/${bookingId}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Cancellation failed"
        );
      }

      setMessage(
        "Booking cancelled"
      );

      await fetchMyBookings();

      if (selectedEvent) {
        await fetchSessions(
          selectedEvent._id
        );
      }

    } catch (error) {
      setMessage(error.message);
    }
  }


  // ====================================================
  // ADMIN USERS
  // ====================================================

  async function fetchUsers() {
    try {
      const response =
        await apiFetch("/users");

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not load users"
        );
      }

      setUsers(data);

    } catch (error) {
      setMessage(error.message);
    }
  }


  function handleUserChange(event) {
    const { name, value } =
      event.target;

    setUserForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }


  function editUser(user) {
    setEditingUserId(user._id);

    setUserForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      age: user.age ?? "",
    });
  }


  function resetUserForm() {
    setEditingUserId(null);

    setUserForm({
      name: "",
      email: "",
      password: "",
      age: "",
    });
  }


  async function saveUser(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const path =
        editingUserId
          ? `/users/${editingUserId}`
          : "/users";

      const method =
        editingUserId
          ? "PUT"
          : "POST";

      const body =
        editingUserId
          ? {
              name:
                userForm.name,

              email:
                userForm.email,

              age:
                userForm.age,
            }
          : userForm;

      const response =
        await apiFetch(
          path,
          {
            method,

            body:
              JSON.stringify(body),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Operation failed"
        );
      }

      setMessage(
        editingUserId
          ? "User updated"
          : "User created"
      );

      resetUserForm();

      await fetchUsers();

    } catch (error) {
      setMessage(error.message);

    } finally {
      setLoading(false);
    }
  }


  async function deleteUser(id) {
    const confirmed =
      window.confirm(
        "Delete this user?"
      );

    if (!confirmed) return;

    try {
      const response =
        await apiFetch(
          `/users/${id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Delete failed"
        );
      }

      setMessage(
        "User deleted"
      );

      await fetchUsers();

    } catch (error) {
      setMessage(error.message);
    }
  }


  // ====================================================
  // ADMIN EVENTS
  // ====================================================

  function handleEventChange(event) {
    const { name, value } =
      event.target;

    setEventForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }


  function editEvent(event) {
    setEditingEventId(event._id);

    setEventForm({
      title:
        event.title || "",

      description:
        event.description || "",

      location:
        event.location || "",
    });

    setActiveView("events");
  }


  function resetEventForm() {
    setEditingEventId(null);

    setEventForm({
      title: "",
      description: "",
      location: "",
    });
  }


  async function saveEvent(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const path =
        editingEventId
          ? `/events/${editingEventId}`
          : "/events";

      const method =
        editingEventId
          ? "PUT"
          : "POST";

      const response =
        await apiFetch(
          path,
          {
            method,

            body:
              JSON.stringify(
                eventForm
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not save event"
        );
      }

      setMessage(
        editingEventId
          ? "Event updated"
          : "Event created"
      );

      resetEventForm();

      await fetchEvents();

    } catch (error) {
      setMessage(error.message);

    } finally {
      setLoading(false);
    }
  }


  async function deleteEvent(id) {
    const confirmed =
      window.confirm(
        "Delete this event and its sessions?"
      );

    if (!confirmed) return;

    try {
      const response =
        await apiFetch(
          `/events/${id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not delete event"
        );
      }

      if (
        selectedEvent?._id === id
      ) {
        setSelectedEvent(null);
        setSessions([]);
      }

      setMessage(
        "Event deleted"
      );

      await fetchEvents();

    } catch (error) {
      setMessage(error.message);
    }
  }


  // ====================================================
  // ADMIN SESSIONS
  // ====================================================

  function handleSessionChange(
    event
  ) {
    const { name, value } =
      event.target;

    setSessionForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  }


  function editSession(session) {
    setEditingSessionId(
      session._id
    );

    setSessionForm({
      startAt:
        toDateInput(
          session.startAt
        ),

      endAt:
        toDateInput(
          session.endAt
        ),

      capacity:
        session.capacity,

      status:
        session.status ||
        "available",
    });
  }


  function resetSessionForm() {
    setEditingSessionId(null);

    setSessionForm({
      startAt: "",
      endAt: "",
      capacity: "",
      status: "available",
    });
  }


  async function saveSession(event) {
    event.preventDefault();

    if (!selectedEvent) {
      setMessage(
        "Select an event first"
      );

      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const body = {
        startAt:
          new Date(
            sessionForm.startAt
          ).toISOString(),

        endAt:
          new Date(
            sessionForm.endAt
          ).toISOString(),

        capacity:
          Number(
            sessionForm.capacity
          ),

        status:
          sessionForm.status,
      };

      let path;
      let method;

      if (editingSessionId) {
        path =
          `/sessions/${editingSessionId}`;

        method = "PUT";

      } else {
        path =
          `/events/${selectedEvent._id}/sessions`;

        method = "POST";

        delete body.status;
      }

      const response =
        await apiFetch(
          path,
          {
            method,

            body:
              JSON.stringify(body),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not save session"
        );
      }

      setMessage(
        editingSessionId
          ? "Session updated"
          : "Session created"
      );

      resetSessionForm();

      await fetchSessions(
        selectedEvent._id
      );

    } catch (error) {
      setMessage(error.message);

    } finally {
      setLoading(false);
    }
  }


  async function deleteSession(id) {
    const confirmed =
      window.confirm(
        "Delete this session?"
      );

    if (!confirmed) return;

    try {
      const response =
        await apiFetch(
          `/sessions/${id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not delete session"
        );
      }

      setMessage(
        "Session deleted"
      );

      await fetchSessions(
        selectedEvent._id
      );

    } catch (error) {
      setMessage(error.message);
    }
  }


  // ====================================================
  // ADMIN BOOKINGS
  // ====================================================

  async function fetchAllBookings() {
    try {
      const response =
        await apiFetch(
          "/bookings"
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not load bookings"
        );
      }

      setAllBookings(data);

    } catch (error) {
      setMessage(error.message);
    }
  }


  // ====================================================
  // LOADING
  // ====================================================

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


  // ====================================================
  // AUTH PAGE
  // ====================================================

  if (
    !token ||
    !currentUser
  ) {
    return (
      <div className="auth-page">

        <section className="brand-panel">

          <div className="brand-content">

            <div className="brand-chip">
              BOOKING PLATFORM
            </div>

            <h1>
              Book your
              <br />
              next session.
            </h1>

            <p>
              Discover events, choose an
              available session and manage
              your appointments from one
              place.
            </p>

            <div className="stack-row">
              <span>React</span>
              <b>→</b>
              <span>Express</span>
              <b>→</b>
              <span>MongoDB</span>
            </div>

          </div>

        </section>


        <section className="auth-panel">

          <div className="auth-card">

            <span className="eyebrow">
              ACCOUNT
            </span>

            <h2>
              {authMode === "login"
                ? "Welcome back"
                : "Create account"}
            </h2>

            <p className="muted">
              {authMode === "login"
                ? "Sign in to manage your appointments."
                : "Register to start booking sessions."}
            </p>


            <div className="tabs">

              <button
                type="button"
                className={
                  authMode === "login"
                    ? "tab active"
                    : "tab"
                }
                onClick={() => {
                  setAuthMode("login");
                  setMessage("");
                }}
              >
                Login
              </button>

              <button
                type="button"
                className={
                  authMode === "register"
                    ? "tab active"
                    : "tab"
                }
                onClick={() => {
                  setAuthMode("register");
                  setMessage("");
                }}
              >
                Register
              </button>

            </div>


            <form
              className="form"
              onSubmit={
                handleAuthSubmit
              }
            >

              {authMode ===
                "register" && (
                <>
                  <label>
                    Name
                  </label>

                  <input
                    name="name"
                    value={
                      authForm.name
                    }
                    onChange={
                      handleAuthChange
                    }
                    required
                  />
                </>
              )}


              <label>
                Email
              </label>

              <input
                type="email"
                name="email"
                value={
                  authForm.email
                }
                onChange={
                  handleAuthChange
                }
                required
              />


              <label>
                Password
              </label>

              <input
                type="password"
                name="password"
                value={
                  authForm.password
                }
                onChange={
                  handleAuthChange
                }
                required
              />


              {authMode ===
                "register" && (
                <>
                  <label>
                    Age
                  </label>

                  <input
                    type="number"
                    name="age"
                    min="1"
                    value={
                      authForm.age
                    }
                    onChange={
                      handleAuthChange
                    }
                  />
                </>
              )}


              <button
                className="primary-button"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : authMode === "login"
                  ? "Sign in"
                  : "Create account"}
              </button>

            </form>


            {message && (
              <div className="message">
                {message}
              </div>
            )}

          </div>

        </section>

      </div>
    );
  }


  // ====================================================
  // DASHBOARD
  // ====================================================

  const isAdmin =
    currentUser.role ===
    "admin";


  return (
    <div className="dashboard">

      <aside className="sidebar">

        <div>

          <div className="logo">
            BOOKLY
          </div>


          <div className="side-user">

            <Avatar
              name={
                currentUser.name
              }
            />

            <div>
              <strong>
                {currentUser.name}
              </strong>

              <span>
                {currentUser.role}
              </span>
            </div>

          </div>


          <nav>

            <NavButton
              active={
                activeView ===
                "dashboard"
              }
              onClick={() =>
                setActiveView(
                  "dashboard"
                )
              }
            >
              Dashboard
            </NavButton>


            <NavButton
              active={
                activeView ===
                "events"
              }
              onClick={() => {
                setActiveView(
                  "events"
                );

                fetchEvents();
              }}
            >
              Events
            </NavButton>


            <NavButton
              active={
                activeView ===
                "bookings"
              }
              onClick={() => {
                setActiveView(
                  "bookings"
                );

                if (isAdmin) {
                  fetchAllBookings();
                } else {
                  fetchMyBookings();
                }
              }}
            >
              Bookings
            </NavButton>


            {isAdmin && (
              <NavButton
                active={
                  activeView ===
                  "users"
                }
                onClick={() => {
                  setActiveView(
                    "users"
                  );

                  fetchUsers();
                }}
              >
                Users
              </NavButton>
            )}


            <NavButton
              active={
                activeView ===
                "profile"
              }
              onClick={() =>
                setActiveView(
                  "profile"
                )
              }
            >
              Profile
            </NavButton>

          </nav>

        </div>


        <button
          className="logout-button"
          onClick={logout}
        >
          Sign out
        </button>

      </aside>


      <main className="main">

        <header className="topbar">

          <div>
            <span className="eyebrow">
              {isAdmin
                ? "ADMINISTRATION"
                : "MY ACCOUNT"}
            </span>

            <h1>
              {isAdmin
                ? "Admin Dashboard"
                : "Booking Dashboard"}
            </h1>
          </div>


          <div className="top-user">

            <Avatar
              name={
                currentUser.name
              }
              small
            />

            <div>
              <strong>
                {currentUser.name}
              </strong>

              <span>
                {currentUser.email}
              </span>
            </div>

          </div>

        </header>


        {message && (
          <div className="dashboard-message">
            {message}
          </div>
        )}


        {/* ============================================
            DASHBOARD
        ============================================ */}

        {activeView ===
          "dashboard" && (
          <>

            <div className="hero-card">

              <span className="eyebrow">
                WELCOME
              </span>

              <h2>
                Hello,{" "}
                {currentUser.name}
              </h2>

              <p>
                {isAdmin
                  ? "Manage users, events, sessions and bookings."
                  : "Browse available events and manage your appointments."}
              </p>

            </div>


            <div className="stats">

              <Stat
                title="Events"
                value={
                  events.length
                }
              />

              <Stat
                title={
                  isAdmin
                    ? "Users"
                    : "My Bookings"
                }
                value={
                  isAdmin
                    ? users.length
                    : myBookings.length
                }
              />

              <Stat
                title="Account"
                value="Active"
                positive
              />

            </div>


            <div className="card">

              <div className="card-header">

                <div>
                  <h2>
                    Upcoming events
                  </h2>

                  <p>
                    Select an event to
                    view its sessions.
                  </p>
                </div>

              </div>


              <EventGrid
                events={events}
                onOpen={openEvent}
              />

            </div>

          </>
        )}


        {/* ============================================
            EVENTS
        ============================================ */}

        {activeView ===
          "events" && (
          <>

            {isAdmin && (
              <div className="card">

                <div className="card-header">

                  <div>
                    <h2>
                      {editingEventId
                        ? "Edit Event"
                        : "Create Event"}
                    </h2>

                    <p>
                      Manage bookable
                      events.
                    </p>
                  </div>

                </div>


                <form
                  className="event-form"
                  onSubmit={
                    saveEvent
                  }
                >

                  <input
                    name="title"
                    placeholder="Event title"
                    value={
                      eventForm.title
                    }
                    onChange={
                      handleEventChange
                    }
                    required
                  />

                  <input
                    name="location"
                    placeholder="Location"
                    value={
                      eventForm.location
                    }
                    onChange={
                      handleEventChange
                    }
                  />

                  <input
                    name="description"
                    placeholder="Description"
                    value={
                      eventForm.description
                    }
                    onChange={
                      handleEventChange
                    }
                  />

                  <button
                    className="primary-button"
                  >
                    {editingEventId
                      ? "Save event"
                      : "Create event"}
                  </button>

                  {editingEventId && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={
                        resetEventForm
                      }
                    >
                      Cancel
                    </button>
                  )}

                </form>

              </div>
            )}


            <div className="card">

              <div className="card-header">

                <div>
                  <h2>
                    Events
                  </h2>

                  <p>
                    Browse the available
                    events.
                  </p>
                </div>

              </div>


              {events.length === 0 ? (
                <div className="empty">
                  No events available.
                </div>
              ) : (
                <div className="event-grid">

                  {events.map(
                    (event) => (

                      <div
                        className="event-card"
                        key={
                          event._id
                        }
                      >

                        <span className="eyebrow">
                          EVENT
                        </span>

                        <h3>
                          {event.title}
                        </h3>

                        <p>
                          {event.description ||
                            "No description"}
                        </p>

                        <div className="event-location">
                          {event.location ||
                            "Online / TBD"}
                        </div>


                        <div className="actions">

                          <button
                            className="primary-button"
                            onClick={() =>
                              openEvent(
                                event
                              )
                            }
                          >
                            Sessions
                          </button>


                          {isAdmin && (
                            <>
                              <button
                                className="edit-button"
                                onClick={() =>
                                  editEvent(
                                    event
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                className="delete-button"
                                onClick={() =>
                                  deleteEvent(
                                    event._id
                                  )
                                }
                              >
                                Delete
                              </button>
                            </>
                          )}

                        </div>

                      </div>

                    )
                  )}

                </div>
              )}

            </div>


            {selectedEvent && (
              <div className="card">

                <div className="card-header">

                  <div>
                    <span className="eyebrow">
                      SELECTED EVENT
                    </span>

                    <h2>
                      {
                        selectedEvent.title
                      }
                    </h2>

                    <p>
                      {
                        selectedEvent.location
                      }
                    </p>
                  </div>

                </div>


                {isAdmin && (
                  <form
                    className="session-form"
                    onSubmit={
                      saveSession
                    }
                  >

                    <input
                      type="datetime-local"
                      name="startAt"
                      value={
                        sessionForm.startAt
                      }
                      onChange={
                        handleSessionChange
                      }
                      required
                    />

                    <input
                      type="datetime-local"
                      name="endAt"
                      value={
                        sessionForm.endAt
                      }
                      onChange={
                        handleSessionChange
                      }
                      required
                    />

                    <input
                      type="number"
                      min="1"
                      name="capacity"
                      placeholder="Capacity"
                      value={
                        sessionForm.capacity
                      }
                      onChange={
                        handleSessionChange
                      }
                      required
                    />


                    {editingSessionId && (
                      <select
                        name="status"
                        value={
                          sessionForm.status
                        }
                        onChange={
                          handleSessionChange
                        }
                      >
                        <option value="available">
                          Available
                        </option>

                        <option value="cancelled">
                          Cancelled
                        </option>
                      </select>
                    )}


                    <button
                      className="primary-button"
                    >
                      {editingSessionId
                        ? "Save session"
                        : "Add session"}
                    </button>


                    {editingSessionId && (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={
                          resetSessionForm
                        }
                      >
                        Cancel
                      </button>
                    )}

                  </form>
                )}


                <SessionList
                  sessions={sessions}
                  isAdmin={isAdmin}
                  loading={loading}
                  onBook={
                    bookSession
                  }
                  onEdit={
                    editSession
                  }
                  onDelete={
                    deleteSession
                  }
                />

              </div>
            )}

          </>
        )}


        {/* ============================================
            BOOKINGS
        ============================================ */}

        {activeView ===
          "bookings" && (
          <div className="card">

            <div className="card-header">

              <div>
                <h2>
                  {isAdmin
                    ? "All Bookings"
                    : "My Appointments"}
                </h2>

                <p>
                  {isAdmin
                    ? "Bookings across the platform."
                    : "Your confirmed sessions."}
                </p>
              </div>

            </div>


            {isAdmin ? (
              <AdminBookings
                bookings={
                  allBookings
                }
              />
            ) : (
              <MyBookings
                bookings={
                  myBookings
                }
                onCancel={
                  cancelBooking
                }
              />
            )}

          </div>
        )}


        {/* ============================================
            USERS - ADMIN
        ============================================ */}

        {activeView ===
          "users" &&
          isAdmin && (
          <>

            <div className="card">

              <div className="card-header">

                <div>
                  <h2>
                    {editingUserId
                      ? "Edit User"
                      : "Create User"}
                  </h2>
                </div>

              </div>


              <form
                className="user-form"
                onSubmit={
                  saveUser
                }
              >

                <input
                  name="name"
                  placeholder="Name"
                  value={
                    userForm.name
                  }
                  onChange={
                    handleUserChange
                  }
                  required
                />

                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={
                    userForm.email
                  }
                  onChange={
                    handleUserChange
                  }
                  required
                />


                {!editingUserId && (
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={
                      userForm.password
                    }
                    onChange={
                      handleUserChange
                    }
                    required
                  />
                )}


                <input
                  type="number"
                  name="age"
                  placeholder="Age"
                  value={
                    userForm.age
                  }
                  onChange={
                    handleUserChange
                  }
                />


                <button
                  className="primary-button"
                >
                  {editingUserId
                    ? "Save"
                    : "Create"}
                </button>


                {editingUserId && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      resetUserForm
                    }
                  >
                    Cancel
                  </button>
                )}

              </form>

            </div>


            <div className="card">

              <div className="card-header">

                <div>
                  <h2>
                    Users
                  </h2>

                  <p>
                    Registered platform
                    accounts.
                  </p>
                </div>

              </div>


              <div className="table-wrapper">

                <table>

                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Age</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>


                  <tbody>

                    {users.map(
                      (user) => (

                        <tr
                          key={
                            user._id
                          }
                        >

                          <td>
                            {user.name}
                          </td>

                          <td>
                            {user.email}
                          </td>

                          <td>
                            {user.age ??
                              "-"}
                          </td>

                          <td>
                            <span className="role">
                              {user.role}
                            </span>
                          </td>

                          <td>
                            <div className="actions">

                              <button
                                className="edit-button"
                                onClick={() =>
                                  editUser(
                                    user
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                className="delete-button"
                                disabled={
                                  user._id ===
                                  currentUser._id
                                }
                                onClick={() =>
                                  deleteUser(
                                    user._id
                                  )
                                }
                              >
                                Delete
                              </button>

                            </div>
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </>
        )}


        {/* ============================================
            PROFILE
        ============================================ */}

        {activeView ===
          "profile" && (
          <div className="card">

            <div className="card-header">

              <div>
                <h2>
                  My Profile
                </h2>

                <p>
                  Update your personal
                  information.
                </p>
              </div>

            </div>


            <form
              className="profile-form"
              onSubmit={
                updateProfile
              }
            >

              <div>
                <label>
                  Name
                </label>

                <input
                  name="name"
                  value={
                    profileForm.name
                  }
                  onChange={
                    handleProfileChange
                  }
                  required
                />
              </div>


              <div>
                <label>
                  Email
                </label>

                <input
                  value={
                    currentUser.email
                  }
                  disabled
                />
              </div>


              <div>
                <label>
                  Age
                </label>

                <input
                  type="number"
                  name="age"
                  value={
                    profileForm.age
                  }
                  onChange={
                    handleProfileChange
                  }
                />
              </div>


              <button
                className="primary-button"
                disabled={loading}
              >
                Save profile
              </button>

            </form>

          </div>
        )}

      </main>

    </div>
  );
}


// ======================================================
// COMPONENTS
// ======================================================

function Avatar({
  name,
  small = false,
}) {
  return (
    <div
      className={
        small
          ? "avatar avatar-small"
          : "avatar"
      }
    >
      {name
        ?.charAt(0)
        .toUpperCase() ||
        "U"}
    </div>
  );
}


function NavButton({
  active,
  onClick,
  children,
}) {
  return (
    <button
      className={
        active
          ? "nav-item active-nav"
          : "nav-item"
      }
      onClick={onClick}
    >
      {children}
    </button>
  );
}


function Stat({
  title,
  value,
  positive,
}) {
  return (
    <div className="stat-card">

      <span>
        {title}
      </span>

      <strong
        className={
          positive
            ? "positive"
            : ""
        }
      >
        {value}
      </strong>

    </div>
  );
}


function EventGrid({
  events,
  onOpen,
}) {
  if (events.length === 0) {
    return (
      <div className="empty">
        No events available.
      </div>
    );
  }

  return (
    <div className="event-grid">

      {events.map((event) => (

        <div
          className="event-card"
          key={event._id}
        >

          <span className="eyebrow">
            EVENT
          </span>

          <h3>
            {event.title}
          </h3>

          <p>
            {event.description ||
              "No description"}
          </p>

          <div className="event-location">
            {event.location ||
              "Location TBD"}
          </div>

          <button
            className="primary-button"
            onClick={() =>
              onOpen(event)
            }
          >
            View sessions
          </button>

        </div>

      ))}

    </div>
  );
}


function SessionList({
  sessions,
  isAdmin,
  loading,
  onBook,
  onEdit,
  onDelete,
}) {
  if (sessions.length === 0) {
    return (
      <div className="empty">
        No sessions available.
      </div>
    );
  }

  return (
    <div className="session-list">

      {sessions.map(
        (session) => {

          const remaining =
            session.remainingPlaces ??
            Math.max(
              0,
              session.capacity -
                (session.bookedCount ||
                  0)
            );

          return (
            <div
              className="session-card"
              key={
                session._id
              }
            >

              <div>

                <strong>
                  {formatDate(
                    session.startAt
                  )}
                </strong>

                <p>
                  Ends{" "}
                  {formatDate(
                    session.endAt
                  )}
                </p>

              </div>


              <div className="session-info">

                <span>
                  Capacity:
                  {" "}
                  {session.capacity}
                </span>

                <span>
                  Available:
                  {" "}
                  {remaining}
                </span>

                <span
                  className={
                    session.status ===
                    "available"
                      ? "status available"
                      : "status cancelled"
                  }
                >
                  {session.status}
                </span>

              </div>


              <div className="actions">

                {isAdmin ? (
                  <>
                    <button
                      className="edit-button"
                      onClick={() =>
                        onEdit(
                          session
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="delete-button"
                      onClick={() =>
                        onDelete(
                          session._id
                        )
                      }
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    className="primary-button"
                    disabled={
                      loading ||
                      remaining <= 0
                    }
                    onClick={() =>
                      onBook(
                        session._id
                      )
                    }
                  >
                    {remaining <= 0
                      ? "Full"
                      : "Book"}
                  </button>
                )}

              </div>

            </div>
          );
        }
      )}

    </div>
  );
}


function MyBookings({
  bookings,
  onCancel,
}) {
  if (bookings.length === 0) {
    return (
      <div className="empty">
        You have no appointments.
      </div>
    );
  }

  return (
    <div className="booking-grid">

      {bookings.map(
        (booking) => (

          <div
            className="booking-card"
            key={
              booking._id
            }
          >

            <span className="eyebrow">
              CONFIRMED
            </span>

            <h3>
              {booking.event.title}
            </h3>

            <p>
              {booking.event.location}
            </p>

            <strong>
              {formatDate(
                booking.session.startAt
              )}
            </strong>

            <button
              className="delete-button"
              onClick={() =>
                onCancel(
                  booking._id
                )
              }
            >
              Cancel booking
            </button>

          </div>

        )
      )}

    </div>
  );
}


function AdminBookings({
  bookings,
}) {
  if (bookings.length === 0) {
    return (
      <div className="empty">
        No bookings yet.
      </div>
    );
  }

  return (
    <div className="table-wrapper">

      <table>

        <thead>
          <tr>
            <th>User</th>
            <th>Event</th>
            <th>Session</th>
            <th>Status</th>
          </tr>
        </thead>


        <tbody>

          {bookings.map(
            (booking) => (

              <tr
                key={
                  booking._id
                }
              >

                <td>
                  <strong>
                    {
                      booking.user.name
                    }
                  </strong>

                  <div className="small-text">
                    {
                      booking.user.email
                    }
                  </div>
                </td>

                <td>
                  {
                    booking.event.title
                  }
                </td>

                <td>
                  {formatDate(
                    booking.session
                      .startAt
                  )}
                </td>

                <td>
                  <span className="status available">
                    {
                      booking.status
                    }
                  </span>
                </td>

              </tr>

            )
          )}

        </tbody>

      </table>

    </div>
  );
}


export default App;