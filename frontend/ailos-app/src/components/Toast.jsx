export default function Toast({ message, type, onClose }) {
  return (
    <div className={`toast ${type}`} onClick={onClose}>
      {message}
    </div>
  );
}