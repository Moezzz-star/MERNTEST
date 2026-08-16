import {
  useEffect,
  useState,
} from "react";

import {
  useAuth,
} from "../context/AuthContext.jsx";

import {
  getEvents,
  getSessions,
  createEvent,
  updateEvent,
  deleteEvent,
  createSession,
  updateSession,
  deleteSession,
} from "../services/event.service.js";

import {
  createBooking,
} from "../services/booking.service.js";

import {
  toDateInput,
} from "../utils/date.js";

import EventGrid
  from "../components/events/EventGrid.jsx";

import EventForm
  from "../components/events/EventForm.jsx";

import SessionForm
  from "../components/events/SessionForm.jsx";

import SessionList
  from "../components/events/SessionList.jsx";


export default function EventsPage({
  selectedEvent,
  setSelectedEvent,
}) {
  const {
    isAdmin,
  } = useAuth();


  const [
    events,
    setEvents,
  ] = useState([]);


  const [
    sessions,
    setSessions,
  ] = useState([]);


  const [
    message,
    setMessage,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    editingEventId,
    setEditingEventId,
  ] = useState(null);


  const [
    eventForm,
    setEventForm,
  ] = useState({
    title: "",
    description: "",
    location: "",
  });


  const [
    editingSessionId,
    setEditingSessionId,
  ] = useState(null);


  const [
    sessionForm,
    setSessionForm,
  ] = useState({
    startAt: "",
    endAt: "",
    capacity: "",
    status:
      "available",
  });


  useEffect(() => {
    loadEvents();
  }, []);


  const selectedEventId =
    selectedEvent?._id;


  useEffect(() => {
    if (
      selectedEventId
    ) {
      loadSessions(
        selectedEventId
      );
    } else {
      setSessions([]);
    }
  }, [selectedEventId]);


  async function loadEvents() {
    try {
      const data =
        await getEvents();

      setEvents(data);

    } catch (error) {
      setMessage(
        error.message
      );
    }
  }


  async function loadSessions(
    eventId
  ) {
    try {
      const data =
        await getSessions(
          eventId
        );

      setSessions(data);

    } catch (error) {
      setMessage(
        error.message
      );
    }
  }


  function openEvent(event) {
    setSelectedEvent(event);
    setMessage("");
  }


  // ====================================================
  // EVENT FORM
  // ====================================================

  function handleEventChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target;

    setEventForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  }


  function editEvent(event) {
    setEditingEventId(
      event._id
    );

    setEventForm({
      title:
        event.title || "",

      description:
        event.description ||
        "",

      location:
        event.location || "",
    });
  }


  function resetEventForm() {
    setEditingEventId(null);

    setEventForm({
      title: "",
      description: "",
      location: "",
    });
  }


  async function saveEvent(
    event
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      if (
        editingEventId
      ) {
        const data =
          await updateEvent(
            editingEventId,
            eventForm
          );

        if (
          selectedEvent?._id ===
          editingEventId
        ) {
          setSelectedEvent(
            data.event
          );
        }

        setMessage(
          "Event updated"
        );

      } else {
        await createEvent(
          eventForm
        );

        setMessage(
          "Event created"
        );
      }


      resetEventForm();

      await loadEvents();

    } catch (error) {
      setMessage(
        error.message
      );

    } finally {
      setLoading(false);
    }
  }


  async function removeEvent(
    id
  ) {
    const confirmed =
      window.confirm(
        "Delete this event and its sessions?"
      );

    if (!confirmed) {
      return;
    }


    try {
      await deleteEvent(id);

      if (
        selectedEvent?._id ===
        id
      ) {
        setSelectedEvent(null);
        setSessions([]);
      }

      setMessage(
        "Event deleted"
      );

      await loadEvents();

    } catch (error) {
      setMessage(
        error.message
      );
    }
  }


  // ====================================================
  // SESSION FORM
  // ====================================================

  function handleSessionChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target;

    setSessionForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  }


  function editSession(
    session
  ) {
    setEditingSessionId(
      session._id
    );

    setSessionForm({
      startAt:
        toDateInput(
          session.startAt
        ),

      endAt:
        toDateInput(
          session.endAt
        ),

      capacity:
        session.capacity,

      status:
        session.status ||
        "available",
    });
  }


  function resetSessionForm() {
    setEditingSessionId(null);

    setSessionForm({
      startAt: "",
      endAt: "",
      capacity: "",
      status:
        "available",
    });
  }


  async function saveSession(
    event
  ) {
    event.preventDefault();

    if (!selectedEvent) {
      setMessage(
        "Select an event first"
      );

      return;
    }


    setLoading(true);
    setMessage("");


    try {
      const body = {
        startAt:
          new Date(
            sessionForm.startAt
          ).toISOString(),

        endAt:
          new Date(
            sessionForm.endAt
          ).toISOString(),

        capacity:
          Number(
            sessionForm.capacity
          ),
      };


      if (
        editingSessionId
      ) {
        await updateSession(
          editingSessionId,
          {
            ...body,

            status:
              sessionForm.status,
          }
        );

        setMessage(
          "Session updated"
        );

      } else {
        await createSession(
          selectedEvent._id,
          body
        );

        setMessage(
          "Session created"
        );
      }


      resetSessionForm();

      await loadSessions(
        selectedEvent._id
      );

    } catch (error) {
      setMessage(
        error.message
      );

    } finally {
      setLoading(false);
    }
  }


  async function removeSession(
    id
  ) {
    const confirmed =
      window.confirm(
        "Delete this session?"
      );

    if (!confirmed) {
      return;
    }


    try {
      await deleteSession(id);

      setMessage(
        "Session deleted"
      );

      await loadSessions(
        selectedEvent._id
      );

    } catch (error) {
      setMessage(
        error.message
      );
    }
  }


  // ====================================================
  // USER BOOKING
  // ====================================================

  async function bookSession(
    sessionId
  ) {
    setLoading(true);
    setMessage("");

    try {
      await createBooking(
        sessionId
      );

      setMessage(
        "Booking confirmed successfully"
      );

      await loadSessions(
        selectedEvent._id
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


      {isAdmin && (
        <div className="card">

          <div className="card-header">

            <div>

              <h2>
                {editingEventId
                  ? "Edit Event"
                  : "Create Event"}
              </h2>

              <p>
                Manage bookable
                events.
              </p>

            </div>

          </div>


          <EventForm
            form={eventForm}
            editing={
              Boolean(
                editingEventId
              )
            }
            loading={loading}
            onChange={
              handleEventChange
            }
            onSubmit={
              saveEvent
            }
            onCancel={
              resetEventForm
            }
          />

        </div>
      )}


      <div className="card">

        <div className="card-header">

          <div>

            <h2>
              Events
            </h2>

            <p>
              Browse the available
              events.
            </p>

          </div>

        </div>


        <EventGrid
          events={events}
          onOpen={
            openEvent
          }
          isAdmin={isAdmin}
          onEdit={
            editEvent
          }
          onDelete={
            removeEvent
          }
        />

      </div>


      {selectedEvent && (
        <div className="card">

          <div className="card-header">

            <div>

              <span className="eyebrow">
                SELECTED EVENT
              </span>

              <h2>
                {
                  selectedEvent.title
                }
              </h2>

              <p>
                {
                  selectedEvent.location
                }
              </p>

            </div>

          </div>


          {isAdmin && (
            <SessionForm
              form={
                sessionForm
              }
              editing={
                Boolean(
                  editingSessionId
                )
              }
              loading={loading}
              onChange={
                handleSessionChange
              }
              onSubmit={
                saveSession
              }
              onCancel={
                resetSessionForm
              }
            />
          )}


          <SessionList
            sessions={sessions}
            isAdmin={isAdmin}
            loading={loading}
            onBook={
              bookSession
            }
            onEdit={
              editSession
            }
            onDelete={
              removeSession
            }
          />

        </div>
      )}

    </>
  );
}