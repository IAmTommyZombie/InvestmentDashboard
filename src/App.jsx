import React from "react";
import DashboardLayout from "./components/layout/DashboardLayouot";
import DashboardGrid from "./components/dashboard/DashboardGrid";
import { PortfolioProvider } from "./context/PortfolioContext";
import AddETFForm from "./components/portfolio/AddETFForm";

const App = () => {
  return (
    <PortfolioProvider>
      <DashboardLayout>
        <DashboardGrid />
        <AddETFForm />
      </DashboardLayout>
    </PortfolioProvider>
  );
};

export default App;
