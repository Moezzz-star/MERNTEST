import {
  formatDate,
} from "../../utils/date.js";


export default function AdminBookings({
  bookings,
}) {
  if (
    bookings.length === 0
  ) {
    return (
      <div className="empty">
        No bookings yet.
      </div>
    );
  }


  return (
    <div className="table-wrapper">

      <table>

        <thead>
          <tr>
            <th>User</th>
            <th>Event</th>
            <th>Session</th>
            <th>Status</th>
          </tr>
        </thead>


        <tbody>

          {bookings.map(
            (booking) => (

              <tr
                key={
                  booking._id
                }
              >

                <td>

                  <strong>
                    {
                      booking.user.name
                    }
                  </strong>

                  <div className="small-text">
                    {
                      booking.user.email
                    }
                  </div>

                </td>

                <td>
                  {
                    booking.event.title
                  }
                </td>

                <td>
                  {formatDate(
                    booking.session
                      .startAt
                  )}
                </td>

                <td>
                  <span className="status available">
                    {
                      booking.status
                    }
                  </span>
                </td>

              </tr>

            )
          )}

        </tbody>

      </table>

    </div>
  );
}