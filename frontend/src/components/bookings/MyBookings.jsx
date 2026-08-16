import {
  formatDate,
} from "../../utils/date.js";


export default function MyBookings({
  bookings,
  onCancel,
}) {
  if (
    bookings.length === 0
  ) {
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
              {
                booking.event.title
              }
            </h3>

            <p>
              {
                booking.event.location
              }
            </p>

            <strong>
              {formatDate(
                booking.session
                  .startAt
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