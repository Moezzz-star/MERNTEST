import {
  apiFetch,
} from "../api/client.js";


export function createBooking(
  sessionId
) {
  return apiFetch(
    "/bookings",
    {
      method: "POST",

      body:
        JSON.stringify({
          sessionId,
        }),
    }
  );
}


export function getMyBookings() {
  return apiFetch(
    "/bookings/me"
  );
}


export function cancelBooking(
  bookingId
) {
  return apiFetch(
    `/bookings/${bookingId}`,
    {
      method: "DELETE",
    }
  );
}


export function getAllBookings() {
  return apiFetch(
    "/bookings"
  );
}