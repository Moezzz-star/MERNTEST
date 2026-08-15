import {
  useEffect,
  useState,
} from "react";

import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL;


// ======================================================
// APP
// ======================================================

function App() {

  const [token, setToken] =
    useState(
      localStorage.getItem(
        "token"
      )
    );


  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);


  const [
    loadingSession,
    setLoadingSession,
  ] = useState(
    Boolean(token)
  );


  const [
    authMode,
    setAuthMode,
  ] = useState("login");


  const [
    authForm,
    setAuthForm,
  ] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
  });


  const [
    profileForm,
    setProfileForm,
  ] = useState({
    name: "",
    age: "",
  });


  const [
    users,
    setUsers,
  ] = useState([]);


  const [
    adminForm,
    setAdminForm,
  ] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
  });


  const [
    editingId,
    setEditingId,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    message,
    setMessage,
  ] = useState("");


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
        await apiFetch(
          "/auth/me"
        );


      if (!response.ok) {
        throw new Error(
          "Session expired"
        );
      }


      const user =
        await response.json();


      setCurrentUser(user);


      setProfileForm({
        name:
          user.name || "",

        age:
          user.age ?? "",
      });


      if (
        user.role === "admin"
      ) {
        await fetchUsers();
      }

    } catch (error) {

      logout();

    } finally {

      setLoadingSession(false);

    }
  }


  // ====================================================
  // AUTH INPUT
  // ====================================================

  function handleAuthChange(
    event
  ) {

    const {
      name,
      value,
    } = event.target;


    setAuthForm(
      previous => ({
        ...previous,
        [name]:
          value,
      })
    );
  }


  // ====================================================
  // LOGIN / REGISTER
  // ====================================================

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


      const requestBody =
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
              JSON.stringify(
                requestBody
              ),
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


      setToken(
        data.token
      );


      setCurrentUser(
        data.user
      );


      setProfileForm({
        name:
          data.user.name || "",

        age:
          data.user.age ?? "",
      });


      setAuthForm({
        name: "",
        email: "",
        password: "",
        age: "",
      });


      setMessage("");

    } catch (error) {

      setMessage(
        error.message
      );

    } finally {

      setLoading(false);

    }
  }


  // ====================================================
  // LOGOUT
  // ====================================================

  function logout() {

    localStorage.removeItem(
      "token"
    );


    setToken(null);

    setCurrentUser(null);

    setUsers([]);

    setMessage("");

    setEditingId(null);


    setAdminForm({
      name: "",
      email: "",
      password: "",
      age: "",
    });
  }


  // ====================================================
  // PROFILE FORM
  // ====================================================

  function handleProfileChange(
    event
  ) {

    const {
      name,
      value,
    } = event.target;


    setProfileForm(
      previous => ({
        ...previous,
        [name]:
          value,
      })
    );
  }


  async function updateProfile(
    event
  ) {

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

      setMessage(
        error.message
      );

    } finally {

      setLoading(false);

    }
  }


  // ====================================================
  // ADMIN USERS
  // ====================================================

  async function fetchUsers() {

    try {

      const response =
        await apiFetch(
          "/users"
        );


      const data =
        await response.json();


      if (
        response.status === 401
      ) {

        logout();
        return;

      }


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Could not load users"
        );

      }


      setUsers(data);

    } catch (error) {

      setMessage(
        error.message
      );

    }
  }


  function handleAdminChange(
    event
  ) {

    const {
      name,
      value,
    } = event.target;


    setAdminForm(
      previous => ({
        ...previous,
        [name]:
          value,
      })
    );
  }


  function resetAdminForm() {

    setEditingId(null);


    setAdminForm({
      name: "",
      email: "",
      password: "",
      age: "",
    });
  }


  function editUser(user) {

    setEditingId(
      user._id
    );


    setAdminForm({
      name:
        user.name || "",

      email:
        user.email || "",

      password: "",

      age:
        user.age ?? "",
    });


    setMessage("");


    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  async function handleAdminSubmit(
    event
  ) {

    event.preventDefault();

    setLoading(true);
    setMessage("");


    try {

      const path =
        editingId
          ? `/users/${editingId}`
          : "/users";


      const method =
        editingId
          ? "PUT"
          : "POST";


      const body =
        editingId
          ? {
              name:
                adminForm.name,

              email:
                adminForm.email,

              age:
                adminForm.age,
            }
          : adminForm;


      const response =
        await apiFetch(
          path,
          {
            method,

            body:
              JSON.stringify(
                body
              ),
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
        editingId
          ? "User updated successfully"
          : "User created successfully"
      );


      resetAdminForm();

      await fetchUsers();

    } catch (error) {

      setMessage(
        error.message
      );

    } finally {

      setLoading(false);

    }
  }


  async function deleteUser(
    id
  ) {

    const confirmed =
      window.confirm(
        "Delete this user?"
      );


    if (!confirmed) {
      return;
    }


    try {

      const response =
        await apiFetch(
          `/users/${id}`,
          {
            method:
              "DELETE",
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
        "User deleted successfully"
      );


      await fetchUsers();

    } catch (error) {

      setMessage(
        error.message
      );

    }
  }


  // ====================================================
  // LOADING SESSION
  // ====================================================

  if (loadingSession) {

    return (
      <div className="loading-page">
        <div className="loader" />

        <p>
          Loading your account...
        </p>
      </div>
    );
  }


  // ====================================================
  // AUTH SCREEN
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
              MERN PLATFORM
            </div>


            <h1>
              One platform.
              <br />
              Built for more.
            </h1>


            <p>
              React, Express and MongoDB Atlas
              working together with secure
              authentication and role-based
              access.
            </p>


            <div className="stack-row">

              <span>
                React
              </span>

              <b>→</b>

              <span>
                Express
              </span>

              <b>→</b>

              <span>
                Atlas
              </span>

            </div>

          </div>

        </section>


        <section className="auth-panel">

          <div className="auth-card">

            <div className="auth-header">

              <span className="eyebrow">
                ACCOUNT
              </span>


              <h2>
                {authMode === "login"
                  ? "Welcome back"
                  : "Create your account"}
              </h2>


              <p>
                {authMode === "login"
                  ? "Enter your credentials to continue."
                  : "Register to access the platform."}
              </p>

            </div>


            <div className="tabs">

              <button
                type="button"
                className={
                  authMode === "login"
                    ? "tab active"
                    : "tab"
                }
                onClick={() => {
                  setAuthMode(
                    "login"
                  );

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
                  setAuthMode(
                    "register"
                  );

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
                    placeholder="Your name"
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
                name="email"
                type="email"
                placeholder="you@example.com"
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
                name="password"
                type="password"
                placeholder="Minimum 8 characters"
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
                    name="age"
                    type="number"
                    min="1"
                    placeholder="24"
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
  // NORMAL USER DASHBOARD
  // ====================================================

  if (
    currentUser.role !==
    "admin"
  ) {

    return (
      <DashboardLayout
        user={
          currentUser
        }
        logout={
          logout
        }
        title="My Dashboard"
      >

        <div className="hero-card">

          <span className="eyebrow">
            WELCOME
          </span>


          <h2>
            Hello,{" "}
            {currentUser.name}
          </h2>


          <p>
            Your account is authenticated and
            ready. The booking system will be
            added next.
          </p>

        </div>


        <div className="stats">

          <Stat
            title="Account"
            value="Active"
            positive
          />

          <Stat
            title="Role"
            value="User"
          />

          <Stat
            title="Bookings"
            value="Coming next"
          />

        </div>


        <div className="card">

          <div className="card-header">

            <div>
              <h2>
                My Profile
              </h2>

              <p>
                Update your personal information.
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
                name="age"
                type="number"
                min="1"
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
              {loading
                ? "Saving..."
                : "Save profile"}
            </button>

          </form>

        </div>


        <div className="card placeholder-card">

          <span className="eyebrow">
            NEXT PHASE
          </span>


          <h2>
            Appointment booking
          </h2>


          <p>
            Next we will add events, sessions,
            available time slots and bookings
            here.
          </p>

        </div>


        {message && (
          <div className="dashboard-message">
            {message}
          </div>
        )}

      </DashboardLayout>
    );
  }


  // ====================================================
  // ADMIN DASHBOARD
  // ====================================================

  return (
    <DashboardLayout
      user={
        currentUser
      }
      logout={
        logout
      }
      title="Admin Dashboard"
    >

      <div className="stats">

        <Stat
          title="Total Users"
          value={
            users.length
          }
        />

        <Stat
          title="Authentication"
          value="Active"
          positive
        />

        <Stat
          title="Access"
          value="Administrator"
        />

      </div>


      <div className="card">

        <div className="card-header">

          <div>
            <h2>
              {editingId
                ? "Edit User"
                : "Create User"}
            </h2>

            <p>
              {editingId
                ? "Update an existing account."
                : "Create a new login-enabled account."}
            </p>
          </div>

        </div>


        <form
          className="admin-form"
          onSubmit={
            handleAdminSubmit
          }
        >

          <input
            name="name"
            placeholder="Name"
            value={
              adminForm.name
            }
            onChange={
              handleAdminChange
            }
            required
          />


          <input
            name="email"
            type="email"
            placeholder="Email"
            value={
              adminForm.email
            }
            onChange={
              handleAdminChange
            }
            required
          />


          {!editingId && (
            <input
              name="password"
              type="password"
              placeholder="Password (8+ characters)"
              value={
                adminForm.password
              }
              onChange={
                handleAdminChange
              }
              required
            />
          )}


          <input
            name="age"
            type="number"
            min="1"
            placeholder="Age"
            value={
              adminForm.age
            }
            onChange={
              handleAdminChange
            }
          />


          <button
            className="primary-button"
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : editingId
              ? "Save changes"
              : "Create user"}
          </button>


          {editingId && (
            <button
              type="button"
              className="secondary-button"
              onClick={
                resetAdminForm
              }
            >
              Cancel
            </button>
          )}

        </form>

      </div>


      {message && (
        <div className="dashboard-message">
          {message}
        </div>
      )}


      <div className="card">

        <div className="card-header">

          <div>
            <h2>
              Users
            </h2>

            <p>
              Administrator-only account
              management.
            </p>
          </div>


          <button
            className="secondary-button"
            onClick={
              fetchUsers
            }
          >
            Refresh
          </button>

        </div>


        {users.length === 0 ? (

          <div className="empty">
            No users found.
          </div>

        ) : (

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
                  user => (

                    <tr
                      key={
                        user._id
                      }
                    >

                      <td>

                        <div className="user-cell">

                          <Avatar
                            name={
                              user.name
                            }
                            small
                          />

                          <strong>
                            {user.name}
                          </strong>

                        </div>

                      </td>


                      <td>
                        {user.email}
                      </td>


                      <td>
                        {user.age ?? "-"}
                      </td>


                      <td>

                        <span
                          className={
                            user.role === "admin"
                              ? "role admin-role"
                              : "role"
                          }
                        >
                          {user.role ||
                            "user"}
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

        )}

      </div>

    </DashboardLayout>
  );
}


// ======================================================
// COMPONENTS
// ======================================================

function DashboardLayout({
  user,
  logout,
  title,
  children,
}) {

  return (
    <div className="dashboard">

      <aside className="sidebar">

        <div>

          <div className="logo">
            MERN
          </div>


          <div className="side-user">

            <Avatar
              name={
                user.name
              }
            />

            <div>

              <strong>
                {user.name}
              </strong>

              <span>
                {user.role}
              </span>

            </div>

          </div>


          <nav>

            <div className="nav-item active-nav">
              Dashboard
            </div>


            {user.role ===
              "admin" && (
              <div className="nav-item">
                Users
              </div>
            )}


            <div className="nav-item">
              Bookings
              <small>
                soon
              </small>
            </div>

          </nav>

        </div>


        <button
          className="logout-button"
          onClick={
            logout
          }
        >
          Sign out
        </button>

      </aside>


      <main className="main">

        <header className="topbar">

          <div>
            <span className="eyebrow">
              PLATFORM
            </span>

            <h1>
              {title}
            </h1>
          </div>


          <div className="top-user">

            <Avatar
              name={
                user.name
              }
              small
            />

            <div>
              <strong>
                {user.name}
              </strong>

              <span>
                {user.email}
              </span>
            </div>

          </div>

        </header>


        {children}

      </main>

    </div>
  );
}


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


export default App;