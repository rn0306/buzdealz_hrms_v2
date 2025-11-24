import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";
import { toast } from "sonner";
import { CheckCircle, Clock, AlertTriangle, Slash, Search } from "lucide-react";
import { getUser } from "../../utils/auth";

type SubscriptionPlanOption = "Monthly Plan" | "Smart Invest Plan" | "Flex Saver Plan";

type SubmissionStatus = "Verified" | "Pending" | "Duplicate" | "Invalid";

interface Submission {
  id: string;
  subscriberName: string;
  subscriptionId: string;
  planType: SubscriptionPlanOption;
  proofFileUrl: string;
  submissionDate: string;
  proofFileName?: string;
}

export default function AddSubscription() {
  const user = getUser();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [refreshFlag, setRefreshFlag] = useState(0);

  // Modal states
  const [open, setOpen] = useState(false);

  // Form fields (all editable now)
  const [subscriptionId, setSubscriptionId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [plan, setPlan] = useState("");
  const [remarks, setRemarks] = useState("");

  // Proof File
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState("");

  // Search
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Map colors/icons
  const statusColors: Record<SubmissionStatus, string> = {
    Verified: "bg-green-100 text-green-800",
    Pending: "bg-blue-100 text-blue-800",
    Duplicate: "bg-orange-100 text-orange-800",
    Invalid: "bg-red-100 text-red-800",
  };

  const statusIcons: Record<SubmissionStatus, React.ReactNode> = {
    Verified: <CheckCircle className="inline mr-1" size={16} />,
    Pending: <Clock className="inline mr-1" size={16} />,
    Duplicate: <AlertTriangle className="inline mr-1" size={16} />,
    Invalid: <Slash className="inline mr-1" size={16} />,
  };

  // Load submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        if (!user?.id) return;

        const res = await api.get(`/api/intern-subscriptions/user/${user.id}`);
        const data = res?.data?.data || [];

        const mapped: Submission[] = data.map((r: any) => ({
          id: r.id,
          subscriberName: r.subscriber_name ?? "",
          subscriptionId: r.subscription_id ?? "",
          planType: r.subscription_plan,
          proofFileUrl: r.proof_file_url,
          status:
            r.validation_status === "VERIFIED"
              ? "Verified"
              : r.validation_status === "INVALID"
              ? "Invalid"
              : r.validation_status === "DUPLICATE"
              ? "Duplicate"
              : "Pending",
          submissionDate: r.submission_date ?? r.created_at,
          proofFileName: r.proof_file_name ?? "",
        }));

        setSubmissions(mapped);
      } catch (err) {
        toast.error("Failed to load submissions");
      }
    };
    fetchSubmissions();
  }, [refreshFlag]);

  // File upload preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setProofFile(f);

    if (!f) return setProofPreviewUrl("");

    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return setProofPreviewUrl("");

    const reader = new FileReader();
    reader.onload = () => setProofPreviewUrl(reader.result as string);
    reader.readAsDataURL(f);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let proofUrl = null;
      let proofName = null;

      if (proofFile) {
        const fd = new FormData();
        fd.append("file", proofFile);
        const upload = await api.post("/api/uploads", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        proofUrl = upload.data.url;
        proofName = proofFile.name;
      }

      await api.post("/api/intern-subscriptions", {
        subscriptionId,
        subscriberName: "N/A", // Subscriber name removed
        email,
        phone,
        subscriptionPlan: plan,
        proofFileUrl: proofUrl,
        proofFileName: proofName,
        remarks,
        status: "Pending",
        submissionDate: new Date().toISOString(),
      });

      toast.success("Submission added");

      // Reset
      setSubscriptionId("");
      setEmail("");
      setPhone("");
      setPlan("");
      setRemarks("");
      setProofFile(null);
      setProofPreviewUrl("");
      setOpen(false);

      setRefreshFlag((p) => p + 1);
    } catch (err) {
      toast.error((err.response.data.mismatches)? err.response.data.mismatches :"Submit failed");
    }
  };

  // Table filtering
  const filtered = useMemo(
    () =>
      submissions.filter((s) =>
        `${s.subscriptionId} ${s.subscriberName}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [submissions, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* HEADER */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Subscriptions</h1>
          <p className="text-gray-600">
            Verify subscriber entries and manage your submissions.
          </p>
        </div>

        <Button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => setOpen(true)}
        >
          + Add Submission
        </Button>
      </header>

      {/* MODAL - Verify & Submit */}
      <Dialog open={open} onClose={() => setOpen(false)} title="Verify & Submit">
        <form onSubmit={handleSubmit} className="space-y-4 p-2">
          {/* Subscription ID */}
          <div>
            <label className="block text-sm font-medium mb-1">Subscription ID</label>
            <Input
              value={subscriptionId}
              onChange={(e) => setSubscriptionId(e.target.value)}
              placeholder="Enter Subscription ID"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} 
             placeholder="Enter Email "/>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)}
             placeholder="Enter Phone Number" />
          </div>

          {/* Plan Type */}
          <div>
             <label className="block text-sm font-medium mb-1">Plan</label>
            <Input value={plan} onChange={(e) => setPlan(e.target.value)} 
             placeholder="Enter Plan Type"/>
          </div>

          {/* Proof */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Proof File (Image/PDF)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
            {proofPreviewUrl && (
              <img
                src={proofPreviewUrl}
                className="mt-2 max-h-40 rounded border"
              />
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium mb-1">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="border w-full px-3 py-2 rounded"
              placeholder="Enter Remarks"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button className="bg-blue-600 text-white px-4 py-2">
              Submit
            </Button>
          </div>
        </form>
      </Dialog>

      {/* LIST SECTION */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <div className="text-sm text-gray-600">
              Verified:{" "}
              <span className="font-semibold">
                {submissions.filter((s) => s.status === "Verified").length}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Pending:{" "}
              <span className="font-semibold">
                {submissions.filter((s) => s.status === "Pending").length}
              </span>
            </div>
          </div>

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <Input
              className="pl-9"
              placeholder="Search name or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="rounded-lg bg-white border overflow-auto">
          <Table className="w-full">
            <THead>
              <TR>
                <TH>Subscription ID</TH>
                <TH>Plan</TH>
                <TH>Proof</TH>
                <TH>Status</TH>
                <TH>Date</TH>
              </TR>
            </THead>
            <TBody>
              {paginated.length === 0 ? (
                <TR>
                  <TD colSpan={6} className="text-center py-6 text-gray-500">
                    No submissions
                  </TD>
                </TR>
              ) : (
                paginated.map((s) => (
                  <TR key={s.id}>
                    <TD>{s.subscriptionId}</TD>
                    <TD>{s.planType}</TD>
                    <TD>
                      <a
                        href={s.proofFileUrl}
                        target="_blank"
                        className="text-blue-600 underline"
                      >
                        View
                      </a>
                    </TD>
                    <TD>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded text-sm font-semibold ${statusColors[s.status]}`}
                      >
                        {statusIcons[s.status]} {s.status}
                      </span>
                    </TD>
                    <TD>{new Date(s.submissionDate).toLocaleDateString()}</TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </div>

        {/* PAGINATION */}
        <div className="flex items-center justify-between mt-4">
          <div />
          <div className="flex gap-4">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>

            <div>
              Page {page} of {totalPages}
            </div>

            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
