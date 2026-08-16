export function formatDate(
  value
) {
  if (!value) {
    return "-";
  }

  return new Date(
    value
  ).toLocaleString(
    [],
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );
}


export function toDateInput(
  value
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  const offset =
    date.getTimezoneOffset() *
    60000;

  return new Date(
    date.getTime() -
      offset
  )
    .toISOString()
    .slice(0, 16);
}