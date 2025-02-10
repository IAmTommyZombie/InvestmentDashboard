import React from "react";
import { Bell, Eye, Sun, Moon, Download, Database, Lock } from "lucide-react";

const SettingsView = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Settings</h3>
        </div>

        <div className="p-6 space-y-8">
          {/* Notifications */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  Email Notifications
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  Dividend Payment Alerts
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  Price Change Alerts
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Display
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Dark Mode</span>
                <button className="p-2 rounded-lg hover:bg-gray-100">
                  <Sun className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Compact View</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
              <Database className="w-4 h-4 mr-2" />
              Data Management
            </h4>
            <div className="space-y-4">
              <div>
                <button className="flex items-center text-sm text-gray-700 hover:text-gray-900">
                  <Download className="w-4 h-4 mr-2" />
                  Export Portfolio Data
                </button>
              </div>
              <div>
                <button className="flex items-center text-sm text-red-600 hover:text-red-700">
                  Clear All Data
                </button>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
              <Lock className="w-4 h-4 mr-2" />
              Security
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  Save Login Information
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div>
                <button className="text-sm text-blue-600 hover:text-blue-700">
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
