import { useState, useEffect } from 'react';

const Toast = () => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState('success');
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleToast = (event) => {
      setMessage(event.detail.message);
      setType(event.detail.type || 'success');
      setShow(true);
      setTimeout(() => setShow(false), 4000);
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  if (!show) return null;

  return (
    <div className="toast" style={{ display: 'block' }}>
      {message}
    </div>
  );
};

export const showToast = (message, type = 'success') => {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type } }));
};

export default Toast;
