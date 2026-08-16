import {
  useEffect,
  useState,
} from "react";

import {
  useAuth,
} from "../context/AuthContext.jsx";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/user.service.js";


export default function UsersPage() {
  const {
    currentUser,
  } = useAuth();


  const [
    users,
    setUsers,
  ] = useState([]);


  const [
    editingUserId,
    setEditingUserId,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    message,
    setMessage,
  ] = useState("");


  const [
    form,
    setForm,
  ] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
  });


  useEffect(() => {
    loadUsers();
  }, []);


  async function loadUsers() {
    try {
      const data =
        await getUsers();

      setUsers(data);

    } catch (error) {
      setMessage(
        error.message
      );
    }
  }


  function handleChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  }


  function editUser(
    user
  ) {
    setEditingUserId(
      user._id
    );

    setForm({
      name:
        user.name || "",

      email:
        user.email || "",

      password: "",

      age:
        user.age ?? "",
    });
  }


  function resetForm() {
    setEditingUserId(null);

    setForm({
      name: "",
      email: "",
      password: "",
      age: "",
    });
  }


  async function saveUser(
    event
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      if (
        editingUserId
      ) {
        await updateUser(
          editingUserId,
          {
            name:
              form.name,

            email:
              form.email,

            age:
              form.age,
          }
        );

        setMessage(
          "User updated"
        );

      } else {
        await createUser(form);

        setMessage(
          "User created"
        );
      }


      resetForm();

      await loadUsers();

    } catch (error) {
      setMessage(
        error.message
      );

    } finally {
      setLoading(false);
    }
  }


  async function removeUser(
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
      await deleteUser(id);

      setMessage(
        "User deleted"
      );

      await loadUsers();

    } catch (error) {
      setMessage(
        error.message
      );
    }
  }


  return (
    <>

      {message && (
        <div className="dashboard-message">
          {message}
        </div>
      )}


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
              form.name
            }
            onChange={
              handleChange
            }
            required
          />


          <input
            type="email"
            name="email"
            placeholder="Email"
            value={
              form.email
            }
            onChange={
              handleChange
            }
            required
          />


          {!editingUserId && (
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={
                form.password
              }
              onChange={
                handleChange
              }
              required
            />
          )}


          <input
            type="number"
            name="age"
            placeholder="Age"
            value={
              form.age
            }
            onChange={
              handleChange
            }
          />


          <button
            className="primary-button"
            disabled={loading}
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
                resetForm
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
                      {
                        user.name
                      }
                    </td>

                    <td>
                      {
                        user.email
                      }
                    </td>

                    <td>
                      {user.age ??
                        "-"}
                    </td>

                    <td>
                      <span className="role">
                        {
                          user.role
                        }
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
                            removeUser(
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
  );
}