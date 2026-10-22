import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/inter';
import './index.css';
import { App } from './App';
import { ToastProvider } from './components/Toast';
import { AuthProvider } from './context/AuthContext';
import { CatalogProvider } from './context/CatalogContext';
import { DataSyncProvider } from './context/DataSyncContext';
import { FavoritesProvider } from './context/FavoritesContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <DataSyncProvider>
            <CatalogProvider>
              <FavoritesProvider>
                <App />
              </FavoritesProvider>
            </CatalogProvider>
          </DataSyncProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
