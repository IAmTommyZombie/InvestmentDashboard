import React from "react";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardGrid from "./components/dashboard/DashboardGrid";
import { PortfolioProvider } from "./context/PortfolioContext";
import AddETFForm from "./components/portfolio/AddETFForm";
import DistributionAdmin from "./components/admin/DistributionAdmin";
import { AuthProvider } from "./context/AuthContext";
import { DistributionProvider } from "./context/DistributionContext";

const App = () => {
  return (
    <AuthProvider>
      <DistributionProvider>
        <PortfolioProvider>
          <DashboardLayout>
            <DashboardGrid />
            <AddETFForm />
          </DashboardLayout>
        </PortfolioProvider>
      </DistributionProvider>
    </AuthProvider>
  );
};

export default App;
