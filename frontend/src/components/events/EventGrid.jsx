export default function EventGrid({
  events,
  onOpen,
  isAdmin = false,
  onEdit,
  onDelete,
}) {
  if (
    events.length === 0
  ) {
    return (
      <div className="empty">
        No events available.
      </div>
    );
  }


  return (
    <div className="event-grid">

      {events.map(
        (event) => (

          <div
            className="event-card"
            key={
              event._id
            }
          >

            <span className="eyebrow">
              EVENT
            </span>

            <h3>
              {event.title}
            </h3>

            <p>
              {event.description ||
                "No description"}
            </p>

            <div className="event-location">
              {event.location ||
                "Location TBD"}
            </div>


            <div className="actions">

              <button
                className="primary-button"
                onClick={() =>
                  onOpen(event)
                }
              >
                View sessions
              </button>


              {isAdmin && (
                <>
                  <button
                    className="edit-button"
                    onClick={() =>
                      onEdit(event)
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="delete-button"
                    onClick={() =>
                      onDelete(
                        event._id
                      )
                    }
                  >
                    Delete
                  </button>
                </>
              )}

            </div>

          </div>

        )
      )}

    </div>
  );
}