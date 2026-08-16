import {
  useEffect,
  useState,
} from "react";

import {
  useAuth,
} from "../context/AuthContext.jsx";


export default function ProfilePage() {
  const {
    currentUser,
    updateProfile,
  } = useAuth();


  const [
    form,
    setForm,
  ] = useState({
    name: "",
    age: "",
  });


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    message,
    setMessage,
  ] = useState("");


  useEffect(() => {
    setForm({
      name:
        currentUser.name ||
        "",

      age:
        currentUser.age ??
        "",
    });
  }, [currentUser]);


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


  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      await updateProfile(
        form
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
            handleSubmit
          }
        >

          <div>

            <label>
              Name
            </label>

            <input
              name="name"
              value={
                form.name
              }
              onChange={
                handleChange
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
                form.age
              }
              onChange={
                handleChange
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

    </>
  );
}