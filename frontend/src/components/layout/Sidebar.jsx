import {
  useAuth,
} from "../../context/AuthContext.jsx";

import Avatar
  from "../common/Avatar.jsx";

import NavButton
  from "../common/NavButton.jsx";


export default function Sidebar({
  activeView,
  setActiveView,
}) {
  const {
    currentUser,
    isAdmin,
    logout,
  } = useAuth();


  return (
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
              {
                currentUser.name
              }
            </strong>

            <span>
              {
                currentUser.role
              }
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
            onClick={() =>
              setActiveView(
                "events"
              )
            }
          >
            Events
          </NavButton>


          <NavButton
            active={
              activeView ===
              "bookings"
            }
            onClick={() =>
              setActiveView(
                "bookings"
              )
            }
          >
            Bookings
          </NavButton>


          {isAdmin && (
            <NavButton
              active={
                activeView ===
                "users"
              }
              onClick={() =>
                setActiveView(
                  "users"
                )
              }
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
  );
}