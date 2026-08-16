import {
  useState,
} from "react";

import {
  useAuth,
} from "../context/AuthContext.jsx";


export default function AuthPage() {
  const {
    login,
    register,
  } = useAuth();


  const [
    mode,
    setMode,
  ] = useState("login");


  const [
    form,
    setForm,
  ] = useState({
    name: "",
    email: "",
    password: "",
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
      if (
        mode === "login"
      ) {
        await login({
          email:
            form.email,

          password:
            form.password,
        });
      } else {
        await register(form);
      }

    } catch (error) {
      setMessage(
        error.message
      );

    } finally {
      setLoading(false);
    }
  }


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
            {mode === "login"
              ? "Welcome back"
              : "Create account"}
          </h2>

          <p className="muted">
            {mode === "login"
              ? "Sign in to manage your appointments."
              : "Register to start booking sessions."}
          </p>


          <div className="tabs">

            <button
              type="button"
              className={
                mode === "login"
                  ? "tab active"
                  : "tab"
              }
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
            >
              Login
            </button>

            <button
              type="button"
              className={
                mode === "register"
                  ? "tab active"
                  : "tab"
              }
              onClick={() => {
                setMode("register");
                setMessage("");
              }}
            >
              Register
            </button>

          </div>


          <form
            className="form"
            onSubmit={
              handleSubmit
            }
          >

            {mode ===
              "register" && (
              <>
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
              </>
            )}


            <label>
              Email
            </label>

            <input
              type="email"
              name="email"
              value={
                form.email
              }
              onChange={
                handleChange
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
                form.password
              }
              onChange={
                handleChange
              }
              required
            />


            {mode ===
              "register" && (
              <>
                <label>
                  Age
                </label>

                <input
                  type="number"
                  min="1"
                  name="age"
                  value={
                    form.age
                  }
                  onChange={
                    handleChange
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
                : mode === "login"
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