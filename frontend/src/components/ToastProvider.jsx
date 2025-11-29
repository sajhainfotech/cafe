'use client';

import { Toaster } from 'react-hot-toast';



const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      autoClose={2000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnHover
      theme="light"
    />
  );
};

export default ToastProvider;
