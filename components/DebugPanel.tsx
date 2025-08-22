export default function DebugPanel() {
  return (
    <div style={{
      padding: "1rem",
      margin: "1rem",
      border: "1px solid #ccc",
      borderRadius: "8px",
      background: "#f9f9f9"
    }}>
      <h3>Debug Panel</h3>
      <p>Environment keys loaded:</p>
      <ul>
        <li>API Key: {import.meta.env.VITE_API_KEY ? "✅ Found" : "❌ Missing"}</li>
        <li>Pinterest Client ID: {import.meta.env.VITE_PINTEREST_CLIENT_ID ? "✅ Found" : "❌ Missing"}</li>
        <li>Pinterest Secret: {import.meta.env.VITE_PINTEREST_CLIENT_SECRET ? "✅ Found" : "❌ Missing"}</li>
        <li>Pinterest Redirect URI: {import.meta.env.VITE_PINTEREST_REDIRECT_URI ? "✅ Found" : "❌ Missing"}</li>
      </ul>
    </div>
  );
}