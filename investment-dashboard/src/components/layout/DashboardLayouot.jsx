import React, { useState } from "react";
import {
  BarChart3,
  PieChart,
  Settings,
  Home,
  Menu,
  X,
  Plus,
} from "lucide-react";
import AddETFForm from "../../components/portfolio/AddETFForm";
import Notification from "../ui/Notification";
import DashboardGrid from "../dashboard/DashboardGrid";
import PortfolioView from "../portfolio/PortfolioView";
import SettingsView from "../portfolio/SettingsView";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAddETFModal, setShowAddETFModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [currentView, setCurrentView] = useState("overview");

  const navigation = [
    { name: "Overview", view: "overview", icon: Home },
    { name: "Portfolio", view: "portfolio", icon: BarChart3 },
    { name: "Settings", view: "settings", icon: Settings },
  ];

  const renderCurrentView = () => {
    switch (currentView) {
      case "overview":
        return <DashboardGrid />;
      case "portfolio":
        return <PortfolioView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardGrid />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-800 bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-30
        w-64 bg-white border-r border-gray-200
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Logo Area */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">
            YieldMax Dashboard
          </h1>
          <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setCurrentView(item.view);
                setIsSidebarOpen(false);
              }}
              className={`
                w-full flex items-center px-4 py-2 rounded-lg
                ${
                  currentView === item.view
                    ? "text-gray-900 bg-gray-100"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }
              `}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-gradient-to-r from-blue-500 to-blue-600 border-b border-blue-600 flex items-center">
          <div className="flex items-center justify-between w-full px-6">
            <div className="flex items-center">
              <button
                className="lg:hidden mr-4 text-white hover:text-blue-100"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-medium text-white capitalize">
                {currentView}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddETFModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-white rounded-lg 
                  hover:bg-blue-50 transition-colors duration-150 ease-in-out shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add ETF
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">{renderCurrentView()}</div>
        </main>
      </div>

      {/* Add ETF Modal */}
      {showAddETFModal && (
        <AddETFForm
          onClose={() => setShowAddETFModal(false)}
          onSuccess={(message) => {
            setNotification({ type: "success", message });
          }}
        />
      )}

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
