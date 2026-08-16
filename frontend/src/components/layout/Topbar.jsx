import {
  useAuth,
} from "../../context/AuthContext.jsx";

import Avatar
  from "../common/Avatar.jsx";


export default function Topbar() {
  const {
    currentUser,
    isAdmin,
  } = useAuth();


  return (
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
            {
              currentUser.name
            }
          </strong>

          <span>
            {
              currentUser.email
            }
          </span>

        </div>

      </div>

    </header>
  );
}