import {
  useEffect,
  useState,
} from "react";

import {
  useAuth,
} from "../context/AuthContext.jsx";

import {
  getMyBookings,
  getAllBookings,
  cancelBooking,
} from "../services/booking.service.js";

import MyBookings
  from "../components/bookings/MyBookings.jsx";

import AdminBookings
  from "../components/bookings/AdminBookings.jsx";


export default function BookingsPage() {
  const {
    isAdmin,
  } = useAuth();


  const [
    bookings,
    setBookings,
  ] = useState([]);


  const [
    message,
    setMessage,
  ] = useState("");


  useEffect(() => {
    loadBookings();
  }, [isAdmin]);


  async function loadBookings() {
    try {
      const data =
        isAdmin
          ? await getAllBookings()
          : await getMyBookings();

      setBookings(data);

    } catch (error) {
      setMessage(
        error.message
      );
    }
  }


  async function handleCancel(
    id
  ) {
    const confirmed =
      window.confirm(
        "Cancel this appointment?"
      );

    if (!confirmed) {
      return;
    }


    try {
      await cancelBooking(id);

      setMessage(
        "Booking cancelled"
      );

      await loadBookings();

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
              bookings
            }
          />
        ) : (
          <MyBookings
            bookings={
              bookings
            }
            onCancel={
              handleCancel
            }
          />
        )}

      </div>

    </>
  );
}