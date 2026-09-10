import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import AppV4 from './AppV4.jsx';

class RuntimeBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Storefront Builder runtime error', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'Arial, sans-serif', color: '#1f2328' }}>
          <h1 style={{ fontSize: 20, margin: '0 0 10px' }}>Storefront Builder не загрузился</h1>
          <p style={{ fontSize: 13, margin: '0 0 12px' }}>Произошла ошибка интерфейса. Обновите страницу; техническая информация показана ниже.</p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, background: '#f6f8fa', padding: 12, borderRadius: 8 }}>{String(this.state.error?.stack || this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RuntimeBoundary>
      <AppV4 />
    </RuntimeBoundary>
  </React.StrictMode>,
);
