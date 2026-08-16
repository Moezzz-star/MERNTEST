export default function SessionForm({
  form,
  editing,
  loading,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      className="session-form"
      onSubmit={onSubmit}
    >

      <input
        type="datetime-local"
        name="startAt"
        value={
          form.startAt
        }
        onChange={onChange}
        required
      />

      <input
        type="datetime-local"
        name="endAt"
        value={
          form.endAt
        }
        onChange={onChange}
        required
      />

      <input
        type="number"
        min="1"
        name="capacity"
        placeholder="Capacity"
        value={
          form.capacity
        }
        onChange={onChange}
        required
      />


      {editing && (
        <select
          name="status"
          value={
            form.status
          }
          onChange={onChange}
        >

          <option value="available">
            Available
          </option>

          <option value="cancelled">
            Cancelled
          </option>

        </select>
      )}


      <button
        className="primary-button"
        disabled={loading}
      >
        {editing
          ? "Save session"
          : "Add session"}
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