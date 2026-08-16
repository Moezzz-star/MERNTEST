export default function NavButton({
  active,
  onClick,
  children,
}) {
  return (
    <button
      className={
        active
          ? "nav-item active-nav"
          : "nav-item"
      }
      onClick={onClick}
    >
      {children}
    </button>
  );
}