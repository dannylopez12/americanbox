import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import Home from "./pages/Home";
import LoginDifferent from "./components/LoginDifferent";
import SignIn from "./components/SignIn";
import ClientDashboard from "./components/ClientDashboard";
import AdminDashboard from "./components/admin/AdminDashboard";
import Tracking from "./components/Tracking";
import Quoter from "./components/Quoter";
import "./index.css";

function NotFound() {
  return (
    <div className="container-xl py-20 text-center">
      <h1 className="text-3xl font-bold mb-2">404</h1>
      <p className="text-slate-600">Página no encontrada</p>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      // Públicas
      { index: true, element: <Home /> },                    // "/"
      { path: "login/different", element: <LoginDifferent /> },
      { path: "signin", element: <SignIn /> },
      { path: "sign/in", element: <Navigate to="/signin" replace /> },
      { path: "register", element: <Navigate to="/signin" replace /> },

      // Dashboards (Layout ya oculta Navbar/Footer aquí)
      { path: "client", element: <ClientDashboard /> },
      { path: "dashboard", element: <AdminDashboard /> },

      // Otras páginas
      { path: "tracking", element: <Tracking /> },
      { path: "quoter", element: <Quoter /> },

      // 404
      { path: "*", element: <NotFound /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
