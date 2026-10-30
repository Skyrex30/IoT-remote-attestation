import "../styles/ExpectedHashForm.css";

interface ExpectedHashFormProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  isLoading: boolean;
}

export function ExpectedHashForm({
  value,
  onChange,
  onSave,
  isLoading,
}: ExpectedHashFormProps) {
  return (
    <div className="card">
      <h2>Expected Firmware Hash</h2>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="64-char SHA-256 hash, or empty to disable check"
      />

      <button onClick={onSave} disabled={isLoading}>
        Save hash
      </button>
    </div>
  );
}
