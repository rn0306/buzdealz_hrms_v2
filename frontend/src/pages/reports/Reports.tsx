import React, { useState, useEffect, useMemo } from "react";
import { api } from "../../lib/api"; // Adjust the import path to your API utilities
import {toast} from "sonner";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";

interface AssignedTarget {
  id: string;
  userid: string;
  targetid: string;
  assignedby: string;
  startdate: string;
  enddate: string;
  status: "Assigned" | "In Progress" | "Completed" | "Overdue";
  remarks?: string;
  monthlytarget: number;
  smartinvesttarget: number;
  flexsavertarget: number;
  user?: {
    id: string;
    fname: string;
    lname: string;
    email: string;
  };
  assigner?: {
    fname: string;
    lname: string;
  };
  target?: {
    targetdescription: string;
    plans?: Record<string, number>;
  };
}

// Plan progress row for modal display
interface PlanProgressRow {
  planId: string;
  planName: string;
  target: number;
  verified: number;
  status: "Completed" | "In Progress" | "Pending";
}

export default function Reports() {
  // State
  const [assignedTargets, setAssignedTargets] = useState<AssignedTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [viewTarget, setViewTarget] = useState<AssignedTarget | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [verifiedSubscriptions, setVerifiedSubscriptions] = useState<any[]>([]);

  // Fetch assigned targets with date filter
  async function fetchAssignedTargets() {
    setLoading(true);
    try {
      // Assuming your API supports filtering by date query params
      let query = "";
      if (startDate) query += `startDate=${startDate}&`;
      if (endDate) query += `endDate=${endDate}&`;

      const res = await api.get(`/employeeTargets?${query}`);
      setAssignedTargets(res.data || []);
    } catch (err: any) {
      toast.error("Failed to load employee targets");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAssignedTargets();
  }, [startDate, endDate]);

  // Compute status counts for summary cards
  const statusCounts = useMemo(() => {
    const counts = { Completed: 0, "In Progress": 0, Assigned: 0, Overdue: 0 };
    assignedTargets.forEach((target) => {
      counts[target.status] = (counts[target.status] || 0) + 1;
    });
    return counts;
  }, [assignedTargets]);

  // Helper to get employee full name or email fallback
  function getEmployeeName(assigned: AssignedTarget) {
    if (assigned.user) {
      const fullName = [assigned.user.fname, assigned.user.lname].filter(Boolean).join(" ");
      return fullName || assigned.user.email || "Unknown";
    }
    return "Unknown";
  }

  // Helper to get target description
  function getTargetDescription(assigned: AssignedTarget) {
    return assigned.target?.targetdescription || "Unknown Target";
  }

  // Fetch verified subscription data for plan progress modal
  async function handleView(assigned: AssignedTarget) {
    setViewTarget(assigned);
    setViewOpen(true);
    try {
      const res = await api.get(`/intern-subscriptions/user/${assigned.userid}`);
      // Filter only VERIFIED submissions within assigned date range
      const filtered = (res.data || []).filter((s: any) => {
        const subDate = new Date(s.createdat).getTime();
        const start = new Date(assigned.startdate).getTime();
        const end = new Date(assigned.enddate).getTime();
        return s.validationstatus === "VERIFIED" && subDate >= start && subDate <= end;
      });
      setVerifiedSubscriptions(filtered);
    } catch (err) {
      toast.error("Failed to load subscription progress");
    }
  }

  // Plan progress rows for modal display
  const planProgress: PlanProgressRow[] = useMemo(() => {
    if (!viewTarget?.target?.plans) return [];
    return Object.entries(viewTarget.target.plans).map(([planId, targetCount]) => {
      const planName = planId; // You can map to a proper plan name if needed
      const verifiedCount = verifiedSubscriptions.filter(
        (s) => s.subscriptionplan === planName
      ).length;
      let status: PlanProgressRow["status"] = "Pending";
      if (verifiedCount >= targetCount) status = "Completed";
      else if (verifiedCount > 0) status = "In Progress";
      return {
        planId,
        planName,
        target: targetCount,
        verified: verifiedCount,
        status,
      };
    });
  }, [viewTarget, verifiedSubscriptions]);

  return (
    <section className="space-y-6 p-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Reports & Analytics
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">Generate and view detailed reports of your HR operations</p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <Button onClick={() => alert("Export functionality to be integrated")}>Export Report</Button>
        </div>
      </header>

      {/* Date Filters */}
      <div className="flex gap-4 flex-wrap mb-6 items-end">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            id="startDate"
            type="date"
            className="mt-1 block w-auto rounded-md border border-gray-300 px-3 py-2"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            id="endDate"
            type="date"
            className="mt-1 block w-auto rounded-md border border-gray-300 px-3 py-2"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button
          onClick={() => {
            setStartDate("");
            setEndDate("");
          }}
          className="text-sm px-3 py-2 rounded bg-red-100 text-red-700 hover:bg-red-200"
        >
          Clear Filters
        </button>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {Object.entries(statusCounts).map(([status, count]) => {
          const colors = {
            Completed: "green",
            "In Progress": "blue",
            Assigned: "purple",
            Overdue: "red",
          } as const;
          return (
            <div
              key={status}
              className={`bg-${colors[status]}-50 border border-${colors[status]}-200 rounded-xl p-6 shadow-sm`}
            >
              <p className={`text-sm font-medium text-${colors[status]}-700`}>{status}</p>
              <p className={`text-2xl font-bold text-${colors[status]}-700 mt-2`}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Assigned Targets Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Employee</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Target Description</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Timeline</th>
              <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Status</th>
              <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="text-center py-12" colSpan={5}>
                  Loading...
                </td>
              </tr>
            ) : assignedTargets.length === 0 ? (
              <tr>
                <td className="text-center py-12 text-gray-500" colSpan={5}>
                  No targets assigned yet.
                </td>
              </tr>
            ) : (
              assignedTargets.map((assigned) => (
                <tr key={assigned.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="font-medium text-gray-900">{getEmployeeName(assigned)}</div>
                    {assigned.user?.email && (
                      <div className="text-sm text-gray-500">{assigned.user.email}</div>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 max-w-md overflow-hidden text-ellipsis whitespace-nowrap">
                    {getTargetDescription(assigned)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                    {new Date(assigned.startdate).toLocaleDateString()} - {new Date(assigned.enddate).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        assigned.status === "Completed"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : assigned.status === "In Progress"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : assigned.status === "Assigned"
                          ? "bg-purple-100 text-purple-800 border-purple-200"
                          : "bg-red-100 text-red-800 border-red-200"
                      }`}
                    >
                      {assigned.status}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <button
                      className="text-indigo-600 hover:text-indigo-900 underline"
                      onClick={() => handleView(assigned)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Target Progress Modal */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} title="Assigned Target Details">
        {viewTarget ? (
          <>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Employee</p>
                <p className="font-medium text-gray-900">{getEmployeeName(viewTarget)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Assigned By</p>
                <p className="font-medium text-gray-900">{viewTarget.assigner ? `${viewTarget.assigner.fname} ${viewTarget.assigner.lname}` : "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Target</p>
                <p className="font-medium text-gray-900">{getTargetDescription(viewTarget)}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium text-gray-900">{new Date(viewTarget.startdate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium text-gray-900">{new Date(viewTarget.enddate).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium text-gray-900">{viewTarget.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Remarks</p>
                <p className="font-medium text-gray-900">{viewTarget.remarks || "-"}</p>
              </div>

              {/* Plan Progress Table */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">
                  Plan Progress <br />
                  <span className="text-xs text-gray-400">
                    Only verified submissions between assigned dates are counted.
                  </span>
                </p>
                {planProgress.length > 0 ? (
                  <table className="min-w-full border rounded-lg text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold border">Plan</th>
                        <th className="px-3 py-2 text-center font-semibold border">Target</th>
                        <th className="px-3 py-2 text-center font-semibold border">Verified</th>
                        <th className="px-3 py-2 text-center font-semibold border">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planProgress.map((row) => (
                        <tr key={row.planId} className="border-t">
                          <td className="px-3 py-2">{row.planName}</td>
                          <td className="px-3 py-2 text-center">{row.target}</td>
                          <td className="px-3 py-2 text-center">{row.verified}</td>
                          <td className="px-3 py-2 text-center">
                            <span
                              className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                                row.status === "Completed"
                                  ? "bg-green-100 text-green-800"
                                  : row.status === "In Progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 text-sm mt-1">No plan targets configured or no verified submissions for this period.</p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setViewOpen(false)}>Close</Button>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-12">No details to show</div>
        )}
      </Dialog>
    </section>
  );
}
