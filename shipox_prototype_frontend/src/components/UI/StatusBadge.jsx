export default function StatusBadge({ status }) {
  const normalizedStatus = status?.replace(/_/g, '-') || 'unknown';
  const displayText = status?.replace(/_/g, ' ') || 'Unknown';

  return (
    <span className={`badge badge-${normalizedStatus}`}>
      {displayText}
    </span>
  );
}
