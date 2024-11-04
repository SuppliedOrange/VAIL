import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LanderPage from "./pages/LanderPage.tsx";
import Signup from "./pages/SignUpPage.tsx";
import Login from "./pages/LogInPage.tsx";
import Logout from "./pages/LogOutPage.tsx";
import Dashboard from "./pages/DashboardPage.tsx";
import Download from "./pages/DownloadPage.tsx";

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
        path: "/logout",
        element: <Logout />
    },
    {
        path: "/dashboard",
        element: <Dashboard />
    },
    {
        path: "/download",
        element: <Download />
    }
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
