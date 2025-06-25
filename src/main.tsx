import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { scan } from 'react-scan';

scan({ enabled: true });

createRoot(document.getElementById('root')!).render(<App />);
