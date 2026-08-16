export default function EventForm({
  form,
  editing,
  loading,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      className="event-form"
      onSubmit={onSubmit}
    >

      <input
        name="title"
        placeholder="Event title"
        value={form.title}
        onChange={onChange}
        required
      />

      <input
        name="location"
        placeholder="Location"
        value={
          form.location
        }
        onChange={onChange}
      />

      <input
        name="description"
        placeholder="Description"
        value={
          form.description
        }
        onChange={onChange}
      />


      <button
        className="primary-button"
        disabled={loading}
      >
        {editing
          ? "Save event"
          : "Create event"}
      </button>


      {editing && (
        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
        >
          Cancel
        </button>
      )}

    </form>
  );
}