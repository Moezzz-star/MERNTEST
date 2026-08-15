import { useEffect, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [users, setUsers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    age: "",
  });

  const [editingId, setEditingId] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");


  // =================================
  // READ
  // =================================

  async function fetchUsers() {
    try {
      const response = await fetch(
        `${API_URL}/users`
      );

      const data = await response.json();

      setUsers(data);

    } catch (error) {
      console.error(error);

      setMessage(
        "Could not connect to backend"
      );
    }
  }


  useEffect(() => {
    fetchUsers();
  }, []);


  // =================================
  // INPUT CHANGE
  // =================================

  function handleChange(event) {
    const { name, value } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }


  // =================================
  // CREATE OR UPDATE
  // =================================

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      let response;

      if (editingId) {

        // UPDATE

        response = await fetch(
          `${API_URL}/users/${editingId}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(form),
          }
        );

      } else {

        // CREATE

        response = await fetch(
          `${API_URL}/users`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(form),
          }
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Request failed"
        );
      }

      setMessage(
        editingId
          ? "✅ User updated"
          : "✅ User created"
      );

      resetForm();

      await fetchUsers();

    } catch (error) {
      setMessage(
        `❌ ${error.message}`
      );

    } finally {
      setLoading(false);
    }
  }


  // =================================
  // START EDITING
  // =================================

  function editUser(user) {
    setEditingId(user._id);

    setForm({
      name: user.name,
      email: user.email,
      age: user.age,
    });

    setMessage("");
  }


  // =================================
  // DELETE
  // =================================

  async function deleteUser(id) {
    const confirmed =
      window.confirm(
        "Delete this user?"
      );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/users/${id}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message
        );
      }

      setMessage(
        "✅ User deleted"
      );

      await fetchUsers();

    } catch (error) {
      setMessage(
        `❌ ${error.message}`
      );
    }
  }


  // =================================
  // RESET FORM
  // =================================

  function resetForm() {
    setForm({
      name: "",
      email: "",
      age: "",
    });

    setEditingId(null);
  }


  return (
    <div className="container">

      <h1>
        MongoDB CRUD Test
      </h1>

      <p className="subtitle">
        React → Express → MongoDB Atlas
      </p>


      {/* FORM */}

      <div className="card">

        <h2>
          {editingId
            ? "Edit User"
            : "Create User"}
        </h2>

        <form onSubmit={handleSubmit}>

          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            name="age"
            type="number"
            placeholder="Age"
            value={form.age}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : editingId
              ? "Update User"
              : "Add User"}
          </button>

          {editingId && (
            <button
              type="button"
              className="cancel"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}

        </form>

        {message && (
          <p className="message">
            {message}
          </p>
        )}

      </div>


      {/* USERS */}

      <div className="card">

        <div className="title-row">

          <h2>
            Users
          </h2>

          <button
            onClick={fetchUsers}
          >
            Refresh
          </button>

        </div>


        {users.length === 0 ? (

          <p>
            No users in MongoDB.
          </p>

        ) : (

          <div className="users">

            {users.map((user) => (

              <div
                className="user"
                key={user._id}
              >

                <div>

                  <h3>
                    {user.name}
                  </h3>

                  <p>
                    {user.email}
                  </p>

                  <p>
                    Age: {user.age}
                  </p>

                  <small>
                    ID: {user._id}
                  </small>

                </div>


                <div className="actions">

                  <button
                    onClick={() =>
                      editUser(user)
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="delete"
                    onClick={() =>
                      deleteUser(
                        user._id
                      )
                    }
                  >
                    Delete
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default App;