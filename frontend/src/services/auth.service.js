import {
  apiFetch,
} from "../api/client.js";

export function login(
  credentials
) {
  return apiFetch(
    "/auth/login",
    {
      method: "POST",

      body:
        JSON.stringify(
          credentials
        ),
    }
  );
}

export function register(
  user
) {
  return apiFetch(
    "/auth/register",
    {
      method: "POST",

      body:
        JSON.stringify(user),
    }
  );
}

export function getMe() {
  return apiFetch(
    "/auth/me"
  );
}

export function updateMe(
  profile
) {
  return apiFetch(
    "/auth/me",
    {
      method: "PUT",

      body:
        JSON.stringify(
          profile
        ),
    }
  );
}