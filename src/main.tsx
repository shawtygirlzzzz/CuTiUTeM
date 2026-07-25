import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { LangProvider } from './hooks/useLang';
import { ProgramProvider } from './hooks/useProgram';
import { CalendarProvider } from './hooks/useCalendar';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Lang + Program read URL params, so they live inside the Router. */}
      <LangProvider>
        <ProgramProvider>
          <CalendarProvider>
            <App />
          </CalendarProvider>
        </ProgramProvider>
      </LangProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
