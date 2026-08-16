import {
  useEffect,
  useState,
} from "react";

import {
  useAuth,
} from "../context/AuthContext.jsx";

import {
  getEvents,
} from "../services/event.service.js";

import {
  getUsers,
} from "../services/user.service.js";

import {
  getMyBookings,
} from "../services/booking.service.js";

import Stat
  from "../components/common/Stat.jsx";

import EventGrid
  from "../components/events/EventGrid.jsx";


export default function DashboardPage({
  onOpenEvent,
}) {
  const {
    currentUser,
    isAdmin,
  } = useAuth();


  const [
    events,
    setEvents,
  ] = useState([]);


  const [
    secondaryCount,
    setSecondaryCount,
  ] = useState(0);


  const [
    message,
    setMessage,
  ] = useState("");


  useEffect(() => {
    loadDashboard();
  }, []);


  async function loadDashboard() {
    try {
      const eventData =
        await getEvents();

      setEvents(
        eventData
      );


      if (isAdmin) {
        const userData =
          await getUsers();

        setSecondaryCount(
          userData.length
        );
      } else {
        const bookingData =
          await getMyBookings();

        setSecondaryCount(
          bookingData.length
        );
      }

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


      <div className="hero-card">

        <span className="eyebrow">
          WELCOME
        </span>

        <h2>
          Hello,{" "}
          {
            currentUser.name
          }
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
            secondaryCount
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
          onOpen={
            onOpenEvent
          }
        />

      </div>

    </>
  );
}