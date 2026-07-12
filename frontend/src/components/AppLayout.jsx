import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e1e1e',
            color: '#f0f0f0',
            border: '1px solid #2e2e2e',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#1e1e1e' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#1e1e1e' } },
        }}
      />
    </div>
  );
}
