import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  doc,
  setDoc,
  query,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import axios from "axios";

export function UpdateButton() {
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState("");
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [detailedStatus, setDetailedStatus] = useState([]);
  const [currentRunId, setCurrentRunId] = useState(null);
  const [updatedPrices, setUpdatedPrices] = useState([]);
  const [previousPrices, setPreviousPrices] = useState({});

  const GITHUB_USERNAME = "IAmTommyZombie";
  const REPO_NAME = "InvestmentDashboard";

  // Get previous prices when starting update
  useEffect(() => {
    if (updating) {
      const fetchPreviousPrices = async () => {
        const prices = {};
        const pricesRef = collection(db, "prices");
        const snapshot = await getDocs(pricesRef);
        snapshot.forEach((doc) => {
          prices[doc.id] = doc.data().currentPrice;
        });
        setPreviousPrices(prices);
      };
      fetchPreviousPrices();
    }
  }, [updating]);

  // Listen for real-time price updates
  useEffect(() => {
    if (updating) {
      const pricesQuery = query(collection(db, "prices"));

      const unsubscribe = onSnapshot(pricesQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const priceData = change.doc.data();
          const previousPrice =
            previousPrices[priceData.ticker] || priceData.currentPrice;

          // Calculate changes after we have the data
          const priceChange = priceData.currentPrice - previousPrice;
          const percentChange =
            ((priceData.currentPrice - previousPrice) / previousPrice) * 100;

          setUpdatedPrices((prev) => {
            const filtered = prev.filter((p) => p.ticker !== priceData.ticker);
            return [
              ...filtered,
              {
                ticker: priceData.ticker,
                price: priceData.currentPrice,
                previousPrice,
                priceChange,
                percentChange,
                timestamp: priceData.lastUpdated,
              },
            ]
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 10);
          });
        });
      });

      return () => unsubscribe();
    } else {
      setUpdatedPrices([]);
    }
  }, [updating, previousPrices]);

  // Check workflow status
  const checkWorkflowStatus = async (workflowRunId) => {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/actions/runs/${workflowRunId}`,
        {
          headers: {
            Authorization: `token ${import.meta.env.VITE_GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch workflow status");

      const data = await response.json();
      console.log(
        "Workflow status:",
        data.status,
        "Conclusion:",
        data.conclusion
      );

      if (data.status === "completed") {
        if (data.conclusion === "success") {
          setStatus("✅ Prices updated successfully!");
          setLastUpdateTime(new Date().toLocaleString());
          setUpdating(false);
        } else {
          const message =
            data.conclusion === "cancelled"
              ? '⚠️ Update was cancelled. Click "Update Data" to try again.'
              : `❌ Update failed (${data.conclusion}). Click "Update Data" to retry.`;
          setStatus(message);
          setUpdating(false);
        }
      } else {
        // Still running
        setStatus(`⏳ Update in progress... (Status: ${data.status})`);
        // Check again in 5 seconds
        setTimeout(() => checkWorkflowStatus(workflowRunId), 5000);
      }
    } catch (error) {
      console.error("Error checking workflow status:", error);
      // Keep checking even if there's an error
      setTimeout(() => checkWorkflowStatus(workflowRunId), 5000);
    }
  };

  const triggerGitHubAction = async () => {
    try {
      setStatus("🚀 Triggering update...");

      // Cancel any existing runs first
      const runsResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/actions/runs?event=repository_dispatch&status=in_progress`,
        {
          headers: {
            Authorization: `token ${import.meta.env.VITE_GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      const runsData = await runsResponse.json();
      if (runsData.workflow_runs) {
        for (const run of runsData.workflow_runs) {
          await fetch(
            `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/actions/runs/${run.id}/cancel`,
            {
              method: "POST",
              headers: {
                Authorization: `token ${import.meta.env.VITE_GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json",
              },
            }
          );
        }
      }

      // Start new run
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/dispatches`,
        {
          method: "POST",
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `token ${import.meta.env.VITE_GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_type: "update-prices",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to trigger update: ${response.status}`);
      }

      setStatus("⏳ Waiting for workflow to start...");

      // Wait for the workflow to start
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Get the new run
      const newRunsResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/actions/runs?event=repository_dispatch`,
        {
          headers: {
            Authorization: `token ${import.meta.env.VITE_GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      const newRunsData = await newRunsResponse.json();
      if (newRunsData.workflow_runs && newRunsData.workflow_runs.length > 0) {
        const latestRun = newRunsData.workflow_runs[0];
        checkWorkflowStatus(latestRun.id);
      } else {
        throw new Error("No workflow run found");
      }
    } catch (error) {
      console.error("Error triggering update:", error);
      setStatus('❌ Failed to start update. Click "Update Data" to try again.');
      setUpdating(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    setStatus("🚀 Starting price updates...");
    await triggerGitHubAction();
  };

  // Load last update time from localStorage on component mount
  useEffect(() => {
    const savedTime = localStorage.getItem("lastUpdateTime");
    if (savedTime) {
      setLastUpdateTime(savedTime);
    }
  }, []);

  // Save last update time to localStorage when it changes
  useEffect(() => {
    if (lastUpdateTime) {
      localStorage.setItem("lastUpdateTime", lastUpdateTime);
    }
  }, [lastUpdateTime]);

  const getPriceChangeColor = (change) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  const formatChange = (value) => {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}`;
  };

  const handleUpdateSingleETF = async (ticker) => {
    if (!ticker) return;

    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/dispatches`,
        {
          method: "POST",
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `token ${import.meta.env.VITE_GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_type: "update-single-etf",
            client_payload: {
              ticker: ticker,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to trigger update for ${ticker}`);
      }

      setStatus(`⏳ Updating ${ticker}...`);
    } catch (error) {
      console.error(`Error updating ${ticker}:`, error);
      setStatus(`❌ Failed to update ${ticker}`);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleUpdate}
        disabled={updating}
        className={`px-4 py-2 rounded-md text-white ${
          updating
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {updating ? "⏳ Updating..." : "🔄 Update Data"}
      </button>

      {status && (
        <p
          className={`text-sm ${
            status.includes("✅")
              ? "text-green-600"
              : status.includes("❌")
              ? "text-red-600"
              : status.includes("⚠️")
              ? "text-yellow-600"
              : "text-gray-600"
          }`}
        >
          {status}
        </p>
      )}

      {detailedStatus.length > 0 && (
        <div className="text-sm text-gray-600 flex flex-col items-center">
          <p>Recently processed:</p>
          <div className="flex flex-wrap gap-2 justify-center mt-1">
            {detailedStatus.map((ticker, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 rounded-md">
                {ticker}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Real-time price updates with change indicators */}
      {updating && updatedPrices.length > 0 && (
        <div className="w-full max-w-md p-4 bg-gray-50 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Latest Price Updates:
          </h3>
          <div className="space-y-2">
            {updatedPrices.map((price) => (
              <div
                key={price.ticker}
                className="flex justify-between items-center p-2 bg-white rounded border border-gray-100"
              >
                <span className="font-mono text-gray-800">{price.ticker}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600">
                    ${price.price.toFixed(2)}
                  </span>
                  <div className="flex flex-col items-end">
                    <span
                      className={`text-sm ${getPriceChangeColor(
                        price.priceChange
                      )}`}
                    >
                      {price.priceChange > 0
                        ? "↑"
                        : price.priceChange < 0
                        ? "↓"
                        : "−"}{" "}
                      ${formatChange(Math.abs(price.priceChange))}
                    </span>
                    <span
                      className={`text-xs ${getPriceChangeColor(
                        price.percentChange
                      )}`}
                    >
                      ({formatChange(price.percentChange)}%)
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(price.timestamp.toDate()).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lastUpdateTime && (
        <p className="text-sm text-gray-600">
          🕒 Last successful update: {lastUpdateTime}
        </p>
      )}

      {workflowStatus && (
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              workflowStatus === "completed"
                ? "bg-green-500"
                : workflowStatus === "in_progress"
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          />
          <span className="text-sm text-gray-600">
            {workflowStatus === "completed"
              ? "Completed"
              : workflowStatus === "in_progress"
              ? "Running"
              : "Failed"}
          </span>
        </div>
      )}

      {updating && (
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span className="text-sm text-gray-600">Checking progress...</span>
        </div>
      )}
    </div>
  );
}
