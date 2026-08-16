export default function Stat({
  title,
  value,
  positive = false,
}) {
  return (
    <div className="stat-card">
      <span>
        {title}
      </span>

      <strong
        className={
          positive
            ? "positive"
            : ""
        }
      >
        {value}
      </strong>
    </div>
  );
}