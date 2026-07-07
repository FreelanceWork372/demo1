export default function LoadingSpinner({ size = 'default', text }) {
  return (
    <div className="loading-page">
      <div className={`spinner ${size === 'lg' ? 'spinner-lg' : ''}`}></div>
      {text && <p>{text}</p>}
    </div>
  );
}
