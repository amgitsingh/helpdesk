import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';

function App() {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Helpdesk</h1>
            <p>
              API status:{' '}
              <span className={status === 'ok' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                {status ?? 'checking...'}
              </span>
            </p>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
