import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { TasksProvider } from './TasksContext.tsx';
import { HabitsProvider } from './contexts/HabitsContext.tsx';
import { UserProvider } from './UserContext.tsx';
import './index.css';

// Apply the user's saved theme preference immediately on startup to prevent flash
const savedTheme = localStorage.getItem("tempo-theme") || "midnight-black";
document.documentElement.className = savedTheme;

const savedAccent = localStorage.getItem("tempo-accent-color") || "#3b82f6";
document.documentElement.style.setProperty('--color-accent', savedAccent);

const savedFontScale = localStorage.getItem("tempo-font-scale") || "medium";
const fontSizes: Record<string, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
  xl: '20px'
};
document.documentElement.style.fontSize = fontSizes[savedFontScale] || '16px';

const savedColors = localStorage.getItem("tempo-category-colors");
if (savedColors) {
  try {
    const parsed = JSON.parse(savedColors);
    if (parsed.deep) document.documentElement.style.setProperty('--color-deep', parsed.deep);
    if (parsed.light) document.documentElement.style.setProperty('--color-light', parsed.light);
    if (parsed.admin) document.documentElement.style.setProperty('--color-admin', parsed.admin);
    if (parsed.creative) document.documentElement.style.setProperty('--color-creative', parsed.creative);
    if (parsed.social) document.documentElement.style.setProperty('--color-social', parsed.social);
  } catch (e) {
    // ignore
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <TasksProvider>
        <HabitsProvider>
          <App />
        </HabitsProvider>
      </TasksProvider>
    </UserProvider>
  </StrictMode>,
);

