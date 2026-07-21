import { createBrowserRouter } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";
import GuestRoute from "./features/auth/components/GuestRoute";
import Home from "./features/interview/pages/Home";
import Analyze from "./features/interview/pages/Analyze";
import Recent from "./features/interview/pages/Recent";
import Interview from "./features/interview/pages/interview";
import SharedReport from "./features/interview/pages/SharedReport";
import Dashboard from "./features/interview/pages/Dashboard";
import AppLayout from "./components/Layout/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import NotFound from "./components/NotFound/NotFound";

import VerifyEmail from "./features/auth/pages/VerifyEmail";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import ResetPassword from "./features/auth/pages/ResetPassword";
import MockInterview from "./features/mockInterview/pages/MockInterview";
import AtsChecker from "./features/atsChecker/pages/AtsChecker";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/interview",
        element: (
          <Protected>
            <Analyze />
          </Protected>
        ),
      },
      {
        path: "/login",
        element: (
          <GuestRoute>
            <Login />
          </GuestRoute>
        ),
      },
      {
        path: "/register",
        element: (
          <GuestRoute>
            <Register />
          </GuestRoute>
        ),
      },
      {
        path: "/forgot-password",
        element: (
          <GuestRoute>
            <ForgotPassword />
          </GuestRoute>
        ),
      },
      {
        path: "/reset-password",
        element: (
          <GuestRoute>
            <ResetPassword />
          </GuestRoute>
        ),
      },
      {
        path: "/verify-email",
        element: (
          <Protected allowUnverified={true}>
            <VerifyEmail />
          </Protected>
        ),
      },
      {
        path: "/mock-interview",
        element: (
          <Protected>
            <MockInterview />
          </Protected>
        ),
      },
      {
        path: "/ats-check",
        element: (
          <Protected allowUnverified={true}>
            <AtsChecker />
          </Protected>
        ),
      },
      {
        path: "/interview/:interviewId",
        element: (
          <Protected>
            <Interview />
          </Protected>
        ),
      },
      {
        path: "/shared/:shareToken",
        element: <SharedReport />,
      },
      {
        path: "/recent",
        element: (
          <Protected>
            <Recent />
          </Protected>
        ),
      },
      {
        path: "/dashboard",
        element: (
          <Protected>
            <Dashboard />
          </Protected>
        ),
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);
