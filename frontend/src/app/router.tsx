/* eslint-disable react-refresh/only-export-components -- router modules export route configuration by design */
import { lazy, Suspense } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import { ConsoleLayout } from "./ConsoleLayout";

const KeysPage = lazy(() =>
  import("../features/api-keys/KeysPage").then((module) => ({ default: module.KeysPage })),
);
const UsagePage = lazy(() =>
  import("../features/usage/UsagePage").then((module) => ({ default: module.UsagePage })),
);

function routeElement(element: React.ReactNode) {
  return <Suspense fallback={<div className="state-panel">Loading console…</div>}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/console",
    element: <ConsoleLayout />,
    children: [
      { index: true, element: <Navigate to="keys" replace /> },
      { path: "keys", element: routeElement(<KeysPage />) },
      { path: "usage", element: routeElement(<UsagePage />) },
    ],
  },
  { path: "*", element: <Navigate to="/console/keys" replace /> },
]);
