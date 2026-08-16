import {
  apiFetch,
} from "../api/client.js";


export function getEvents() {
  return apiFetch(
    "/events"
  );
}


export function getEvent(id) {
  return apiFetch(
    `/events/${id}`
  );
}


export function createEvent(
  event
) {
  return apiFetch(
    "/events",
    {
      method: "POST",

      body:
        JSON.stringify(
          event
        ),
    }
  );
}


export function updateEvent(
  id,
  event
) {
  return apiFetch(
    `/events/${id}`,
    {
      method: "PUT",

      body:
        JSON.stringify(
          event
        ),
    }
  );
}


export function deleteEvent(
  id
) {
  return apiFetch(
    `/events/${id}`,
    {
      method: "DELETE",
    }
  );
}


export function getSessions(
  eventId
) {
  return apiFetch(
    `/events/${eventId}/sessions`
  );
}


export function createSession(
  eventId,
  session
) {
  return apiFetch(
    `/events/${eventId}/sessions`,
    {
      method: "POST",

      body:
        JSON.stringify(
          session
        ),
    }
  );
}


export function updateSession(
  id,
  session
) {
  return apiFetch(
    `/sessions/${id}`,
    {
      method: "PUT",

      body:
        JSON.stringify(
          session
        ),
    }
  );
}


export function deleteSession(
  id
) {
  return apiFetch(
    `/sessions/${id}`,
    {
      method: "DELETE",
    }
  );
}