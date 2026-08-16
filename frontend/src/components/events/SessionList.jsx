import {
  formatDate,
} from "../../utils/date.js";


export default function SessionList({
  sessions,
  isAdmin,
  loading,
  onBook,
  onEdit,
  onDelete,
}) {
  if (
    sessions.length === 0
  ) {
    return (
      <div className="empty">
        No sessions available.
      </div>
    );
  }


  return (
    <div className="session-list">

      {sessions.map(
        (session) => {

          const remaining =
            session.remainingPlaces ??
            Math.max(
              0,

              session.capacity -
                (
                  session.bookedCount ||
                  0
                )
            );


          return (
            <div
              className="session-card"
              key={
                session._id
              }
            >

              <div>

                <strong>
                  {formatDate(
                    session.startAt
                  )}
                </strong>

                <p>
                  Ends{" "}
                  {formatDate(
                    session.endAt
                  )}
                </p>

              </div>


              <div className="session-info">

                <span>
                  Capacity:{" "}
                  {
                    session.capacity
                  }
                </span>

                <span>
                  Available:{" "}
                  {remaining}
                </span>

                <span
                  className={
                    session.status ===
                    "available"
                      ? "status available"
                      : "status cancelled"
                  }
                >
                  {
                    session.status
                  }
                </span>

              </div>


              <div className="actions">

                {isAdmin ? (
                  <>

                    <button
                      className="edit-button"
                      onClick={() =>
                        onEdit(
                          session
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="delete-button"
                      onClick={() =>
                        onDelete(
                          session._id
                        )
                      }
                    >
                      Delete
                    </button>

                  </>
                ) : (
                  <button
                    className="primary-button"
                    disabled={
                      loading ||
                      remaining <= 0
                    }
                    onClick={() =>
                      onBook(
                        session._id
                      )
                    }
                  >
                    {remaining <= 0
                      ? "Full"
                      : "Book"}
                  </button>
                )}

              </div>

            </div>
          );
        }
      )}

    </div>
  );
}