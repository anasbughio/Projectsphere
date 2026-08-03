import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, opts = {}) => {
    const id = ++idCounter;
    const toast = { id, message, type: opts.type || 'info', duration: opts.duration || 4000 };
    setToasts((s) => [toast, ...s]);
    if (toast.duration > 0) setTimeout(() => setToasts((s) => s.filter(t => t.id !== id)), toast.duration);
    return id;
  }, []);

  const remove = useCallback((id) => setToasts((s) => s.filter(t => t.id !== id)), []);

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <div style={{ position: 'fixed', right: 16, top: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ minWidth: 260, background: t.type === 'error' ? 'rgba(255,80,80,0.08)' : 'rgba(16,185,129,0.06)', border: t.type === 'error' ? '1px solid rgba(255,80,80,0.18)' : '1px solid rgba(16,185,129,0.12)', color: t.type === 'error' ? '#ff8a8a' : '#10b981', padding: '10px 12px', borderRadius: 8, boxShadow: '0 6px 18px rgba(2,6,23,0.6)', fontSize: 13 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.type === 'error' ? 'Error' : 'Info'}</div>
            <div style={{ color: '#cbd5e1' }}>{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
