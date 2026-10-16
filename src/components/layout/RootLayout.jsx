import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import Navber from "../common/Navber";
import Sideber from "../common/Sideber";
import PrivateRoute from "../private/PrivateRoute";
import { useAuthStore } from "../zustendstore/AuthStore";

/**
 * Keeps each role on its own pages: merchants live under /merchant, and
 * administrators everywhere else. This is only for navigation — the API
 * refuses the other role's requests regardless.
 */
function RoleGate({ children }) {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const isMerchant = user?.role === "merchant";
  const inMerchantArea = pathname === "/merchant" || pathname.startsWith("/merchant/");

  if (isMerchant && !inMerchantArea) return <Navigate to="/merchant" replace />;
  if (!isMerchant && inMerchantArea) return <Navigate to="/" replace />;
  return children;
}

const RootLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <PrivateRoute>
      <RoleGate>
        <Navber onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex">
          <div className="no-print w-0 md:w-[20%]">
            <Sideber open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </div>
          <div className="print-full w-full min-w-0 md:w-[80%]">
            <Outlet />
          </div>
        </div>
      </RoleGate>
    </PrivateRoute>
  );
};

export default RootLayout;
