import React, { useEffect, useState } from "react";
import axios from "axios";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";
import { toast } from "sonner";

interface SubmittedSubscription {
  id: string;
  subscriberName: string;
  subscriptionId: string;
  subscriptionPlan: string;
  proofFileUrl: string;
  status: "Pending" | "Verified" | "Duplicate" | "Invalid" | "Completed";
  verifiedDate?: string;
}

interface SubscriptionTableProps {
  refreshTrigger: number; // change to refetch list
}

const statusColors: Record<SubmittedSubscription["status"], string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Verified: "bg-green-100 text-green-800",
  Duplicate: "bg-red-100 text-red-800",
  Invalid: "bg-gray-100 text-gray-800",
  Completed: "bg-blue-100 text-blue-800",
};

export default function SubscriptionTable({ refreshTrigger }: SubscriptionTableProps) {
  const [subscriptions, setSubscriptions] = useState<SubmittedSubscription[]>([]);
  const [filteredStatus, setFilteredStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Fetch subscriptions on refreshTrigger change
  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await axios.get("/intern-subscriptions?intern_id=current");
        // normalize API response: accept array directly or object with data property
        const payload = res && (res.data ?? res);
        if (Array.isArray(payload)) {
          setSubscriptions(payload);
        } else if (payload && Array.isArray(payload.data)) {
          setSubscriptions(payload.data);
        } else {
          console.warn('Unexpected subscriptions response shape, falling back to empty array', payload);
          setSubscriptions([]);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load submitted subscriptions.");
      }
    };
    fetchList();
  }, [refreshTrigger]);

  // Filter & search logic
  const subsArray = Array.isArray(subscriptions) ? subscriptions : [];
  const filtered = subsArray.filter((sub) => {
    const matchStatus = filteredStatus ? sub.status === filteredStatus : true;
    const matchSearch =
      (sub.subscriberName || "").toString().toLowerCase().includes(search.toLowerCase()) ||
      (sub.subscriptionId || "").toString().toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Pagination slice
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  // Pagination controls
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
      <div className="rounded-2xl shadow-sm bg-white p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold">Submitted Subscriptions</h2>
            <p className="text-sm text-gray-500">Review incoming subscriptions and verify proofs.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <Input
                id="sub-search"
                type="search"
                placeholder="Search name or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-72"
              />
            </div>
            <div>
              <select
                value={filteredStatus}
                onChange={(e) => setFilteredStatus(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-48"
                aria-label="Filter status"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Duplicate">Duplicate</option>
                <option value="Invalid">Invalid</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <Button variant="outline" onClick={() => toast.success('Open upload modal (not implemented)')}>
              Upload
            </Button>
          </div>
        </div>
          <Table>
            <THead>
              <TR>
                <TH>Subscriber Name</TH>
                <TH>Subscription ID</TH>
                <TH>Plan Type</TH>
                <TH>Proof</TH>
                <TH>Status</TH>
                <TH>Verified Date</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {paginated.length === 0 ? (
                <TR>
                  <TD colSpan={7} className="text-center py-4 text-gray-500">
                    No subscriptions found.
                  </TD>
                </TR>
              ) : (
                paginated.map((sub) => (
                  <TR key={sub.id}>
                    <TD>{sub.subscriberName}</TD>
                    <TD>{sub.subscriptionId}</TD>
                    <TD>{sub.subscriptionPlan}</TD>
                    <TD>
                      <a
                        href={sub.proofFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        View
                      </a>
                    </TD>
                    <TD>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusColors[sub.status]}`}
                      >
                        {sub.status}
                      </span>
                    </TD>
                    <TD>{sub.verifiedDate || "-"}</TD>
                    <TD>
                      {/* Placeholder for future actions like re-upload */}
                      <Button disabled className="px-3 py-1 text-sm">
                        Re-Upload
                      </Button>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <Button
                onClick={() => canPrev && setPage(page - 1)}
                disabled={!canPrev}
                variant="outline"
                className="px-3 py-1 text-sm"
              >
                Previous
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                onClick={() => canNext && setPage(page + 1)}
                disabled={!canNext}
                variant="outline"
                className="px-3 py-1 text-sm"
              >
                Next
              </Button>
            </div>
          )}
      </div>
  );
}
