export default function Avatar({
  name,
  small = false,
}) {
  return (
    <div
      className={
        small
          ? "avatar avatar-small"
          : "avatar"
      }
    >
      {name
        ?.charAt(0)
        .toUpperCase() ||
        "U"}
    </div>
  );
}