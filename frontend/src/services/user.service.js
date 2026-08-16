import {
  apiFetch,
} from "../api/client.js";


export function getUsers() {
  return apiFetch(
    "/users"
  );
}


export function createUser(
  user
) {
  return apiFetch(
    "/users",
    {
      method: "POST",

      body:
        JSON.stringify(user),
    }
  );
}


export function updateUser(
  id,
  user
) {
  return apiFetch(
    `/users/${id}`,
    {
      method: "PUT",

      body:
        JSON.stringify(user),
    }
  );
}


export function deleteUser(
  id
) {
  return apiFetch(
    `/users/${id}`,
    {
      method: "DELETE",
    }
  );
}