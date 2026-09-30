"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * Mounts the react-toastify container once in the root layout. The visual card
 * lives in `<ToastBody />`; here we only own positioning and the shell.
 */
export default function Toaster() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={4600}
      newestOnTop
      closeOnClick={false}
      pauseOnHover
      draggable
      limit={4}
      closeButton={false}
      icon={false}
      theme="light"
      className="sc-toast-container"
    />
  );
}
