import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/layouts/AppShell";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ProtectedRoute } from "@/features/auth";
import {
  HomePage,
  LoginPage,
  SignupPage,
  PatientDashboard,
  PatientHistory,
  PatientReports,
  PatientAppointments,
  PatientNotes,
  PatientAlerts,
  PatientDeviceSettings,
  DoctorDashboard,
  DoctorPatients,
  DoctorPatientDetail,
  DoctorAlerts,
  DoctorAppointments,
  NotFoundPage,
} from "@/pages";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell variant="public" title="Home" />,
    children: [{ index: true, element: <HomePage /> }],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/signup", element: <SignupPage /> },
    ],
  },
  {
    path: "/patient",
    element: (
      <ProtectedRoute allowedRoles={["patient"]}>
        <AppShell variant="patient" title="Patient Portal" />
      </ProtectedRoute>
    ),
    children: [
      { path: "dashboard", element: <PatientDashboard /> },
      { path: "history", element: <PatientHistory /> },
      { path: "reports", element: <PatientReports /> },
      { path: "appointments", element: <PatientAppointments /> },
      { path: "notes", element: <PatientNotes /> },
      { path: "alerts", element: <PatientAlerts /> },
      { path: "device-settings", element: <PatientDeviceSettings /> },
    ],
  },
  {
    path: "/doctor",
    element: (
      <ProtectedRoute allowedRoles={["doctor"]}>
        <AppShell variant="doctor" title="Doctor Portal" />
      </ProtectedRoute>
    ),
    children: [
      { path: "dashboard", element: <DoctorDashboard /> },
      { path: "patients", element: <DoctorPatients /> },
      { path: "patients/:id", element: <DoctorPatientDetail /> },
      { path: "alerts", element: <DoctorAlerts /> },
      { path: "appointments", element: <DoctorAppointments /> },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
