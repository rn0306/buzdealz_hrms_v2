import React, { useState, useMemo } from "react";
import Select from "../../components/ui/Select";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";

// Mock Data
const mockEmployees = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Aarav Singh" },
  { id: 3, name: "Meera Patel" },
];

const mockAssignedTargets = [
  {
    id: 1,
    employeeId: 1,
    targetDescription: "Increase Smart Invest Plans",
    startDate: "2025-11-01",
    endDate: "2025-11-30",
    status: "In Progress",
    monthlyPlansCount: 10,
    smartInvestPlansCount: 15,
    flexSaverPlansCount: 5,
  },
  {
    id: 2,
    employeeId: 1,
    targetDescription: "Boost Flex Saver Subscriptions",
    startDate: "2025-10-10",
    endDate: "2025-11-10",
    status: "Completed",
    monthlyPlansCount: 5,
    smartInvestPlansCount: 8,
    flexSaverPlansCount: 10,
  },
  {
    id: 3,
    employeeId: 2,
    targetDescription: "Increase Monthly Plans",
    startDate: "2025-11-05",
    endDate: "2025-12-05",
    status: "Assigned",
    monthlyPlansCount: 20,
    smartInvestPlansCount: 0,
    flexSaverPlansCount: 0,
  },
];

// Helpers
function calculateProgress(target: any): number {
  const start = new Date(target.startDate);
  const end = new Date(target.endDate);
  const today = new Date();
  const total = end.getTime() - start.getTime();
  const done = today.getTime() - start.getTime();
  return Math.min(Math.max((done / total) * 100, 0), 100);
}

function getStatusColor(status: string): string {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-700";
    case "In Progress":
      return "bg-yellow-100 text-yellow-700";
    case "Assigned":
      return "bg-blue-100 text-blue-700";
    case "Overdue":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

const EmployeeTargetProgress: React.FC = () => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | "">("");

  // Filter assigned targets for selected employee
  const filteredTargets = useMemo(() => {
    if (!selectedEmployeeId) return [];
    const today = new Date();
    return mockAssignedTargets.filter((t) => {
      if (t.employeeId !== selectedEmployeeId) return false;
      // Update status for "Overdue" if endDate has passed and not completed
      if (
        new Date(t.endDate) < today &&
        t.status !== "Completed" &&
        t.status !== "Overdue"
      ) {
        t.status = "Overdue"; // directly mutate mock data here just for demo
      }
      return true;
    });
  }, [selectedEmployeeId]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = {
      Completed: 0,
      "In Progress": 0,
      Assigned: 0,
      Overdue: 0,
    };
    filteredTargets.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [filteredTargets]);

  const totalTargets = filteredTargets.length;
  const completed = statusCounts.Completed;
  const progressPercent = totalTargets > 0 ? (completed / totalTargets) * 100 : 0;

  return (
    <div className="p-6 bg-white rounded shadow">
      {/* Header Section */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Employee Target Progress</h1>
        <p className="text-gray-500">
          Track and analyze target achievements by employee
        </p>
      </header>

      {/* Filters Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
        <Select
          label="Select Employee"
          id="employee-select"
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
          className="w-full sm:w-72 mb-4 sm:mb-0"
        >
          <option value="">-- Select Employee --</option>
          {mockEmployees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </Select>

        {/* Placeholder for Month/ Date Range filter */}
        <div className="w-full sm:w-48 border border-gray-300 rounded px-3 py-2 text-gray-400 cursor-not-allowed select-none">
          Date Range Filter (Coming soon)
        </div>
      </div>

      {selectedEmployeeId && (
        <>
          {/* Summary Cards Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded shadow bg-green-50">
              <h3 className="text-green-700 font-semibold">🟢 Completed</h3>
              <p className="text-3xl font-bold">{statusCounts.Completed}</p>
            </div>
            <div className="p-4 rounded shadow bg-yellow-50">
              <h3 className="text-yellow-700 font-semibold">🟡 In Progress</h3>
              <p className="text-3xl font-bold">{statusCounts["In Progress"]}</p>
            </div>
            <div className="p-4 rounded shadow bg-blue-50">
              <h3 className="text-blue-700 font-semibold">🔵 Assigned</h3>
              <p className="text-3xl font-bold">{statusCounts.Assigned}</p>
            </div>
            <div className="p-4 rounded shadow bg-red-50">
              <h3 className="text-red-700 font-semibold">🔴 Overdue</h3>
              <p className="text-3xl font-bold">{statusCounts.Overdue}</p>
            </div>
          </div>

          {/* Employee Summary Bar */}
          <div className="mb-6">
            <p className="mb-2 font-semibold">
              {
                mockEmployees.find((e) => e.id === selectedEmployeeId)?.name ||
                ""
              }{" "}
              has completed {completed} / {totalTargets} targets (
              {progressPercent.toFixed(0)}%) overall.
            </p>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${progressPercent}%` }}
                title={`${progressPercent.toFixed(0)}% completed`}
              />
            </div>
          </div>

          {/* Detailed Progress Cards */}
          <div className="space-y-4 mb-6">
            {filteredTargets.map((t) => {
              const progress = calculateProgress(t);
              const remainingDays = Math.max(
                0,
                Math.floor(
                  (new Date(t.endDate).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              );

              return (
                <div
                  key={t.id}
                  className="p-4 rounded shadow border border-gray-200"
                  aria-label={`Target progress: ${t.targetDescription}`}
                >
                  <h3 className="font-semibold text-lg mb-1">
                    🎯 Target: {t.targetDescription}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    📅 {t.startDate} - {t.endDate} &nbsp;&nbsp;|&nbsp;&nbsp;{" "}
                    {remainingDays} days remaining ({progress.toFixed(0)}% done)
                  </p>
                  <div className="mb-2">
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${progress}%` }}
                        title={`${progress.toFixed(0)}% completed`}
                      />
                    </div>
                  </div>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                      t.status
                    )}`}
                  >
                    {t.status}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Table View */}
          <Table>
            <THead>
              <TR>
                <TH>Target Description</TH>
                <TH>Start Date</TH>
                <TH>End Date</TH>
                <TH>Days Remaining</TH>
                <TH>Status</TH>
                <TH>Progress (%)</TH>
              </TR>
            </THead>
            <TBody>
              {filteredTargets.length === 0 ? (
                <TR>
                  <TD colSpan={6} className="text-center py-4 text-gray-500">
                    No targets found.
                  </TD>
                </TR>
              ) : (
                filteredTargets.map((t) => {
                  const progress = calculateProgress(t);
                  const remainingDays = Math.max(
                    0,
                    Math.floor(
                      (new Date(t.endDate).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  );
                  return (
                    <TR key={t.id}>
                      <TD>{t.targetDescription}</TD>
                      <TD>{t.startDate}</TD>
                      <TD>{t.endDate}</TD>
                      <TD>{remainingDays}</TD>
                      <TD>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                            t.status
                          )}`}
                        >
                          {t.status}
                        </span>
                      </TD>
                      <TD>{progress.toFixed(0)}%</TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        </>
      )}
    </div>
  );
};

export default EmployeeTargetProgress;
