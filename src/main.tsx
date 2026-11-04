import { StrictMode, type FC } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/launchme.css';
import AppLauncher from '@/AppLauncher';
import AppNotch from '@/AppNotch';
import { VisibilityPauseProvider } from '@/context/VisibilityPauseContext';
import { LauncherStateProvider } from '@/context/LauncherStateContext';
import { getWindowLabel, type WindowLabel } from '@/services/tauriBridge';

function resolveWindowLabel(): WindowLabel {
  const label = getWindowLabel();
  if (label === 'launcher' || label === 'notch') return label;
  if (label !== null) {
    console.warn(`[main] label finestra sconosciuta '${label}', fallback su 'launcher'.`);
    return 'launcher';
  }
  const fromQuery = new URLSearchParams(window.location.search).get('window');
  if (fromQuery === 'notch') return 'notch';
  return 'launcher';
}

const Root: FC = () => {
  const label = resolveWindowLabel();
  return (
    <VisibilityPauseProvider>
      <LauncherStateProvider>{label === 'notch' ? <AppNotch /> : <AppLauncher />}</LauncherStateProvider>
    </VisibilityPauseProvider>
  );
};

const container = document.getElementById('root');
if (container === null) {
  throw new Error('[main] elemento #root non trovato in index.html');
}

createRoot(container).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
