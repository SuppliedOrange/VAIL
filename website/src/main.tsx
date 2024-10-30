import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LanderPage from "./pages/LanderPage.tsx";
import Signup from "./pages/SignUpPage.tsx";
import Login from "./pages/LogInPage.tsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <LanderPage />
    },
    {
        path: "/signup",
        element: <Signup/>
    },
    {
        path: "/login",
        element: <Login/>
    },
    {
        path: "/template_page",
        element: <App />
    }
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
