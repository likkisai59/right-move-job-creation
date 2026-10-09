import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import ToastContainer from './components/common/ToastContainer';
import { Toaster } from 'react-hot-toast';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <ToastContainer />
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
