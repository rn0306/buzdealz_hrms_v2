import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";
import { toast } from "sonner";
import { CheckCircle, Clock, AlertTriangle, Slash, Search, Download } from "lucide-react";
import { getUser } from "../../utils/auth";

type SubscriptionPlanOption = "Monthly Plan" | "Smart Invest Plan" | "Flex Saver Plan";

interface SubscriptionDetails {
  subscriptionId: string;
  subscriberName: string;
  email: string;
  phone: string;
  subscriptionPlan: SubscriptionPlanOption;
}

type SubmissionStatus = "Verified" | "Pending" | "Duplicate" | "Invalid";

interface Submission {
  id: string;
  subscriberName: string;
  subscriptionId: string;
  planType: SubscriptionPlanOption;
  proofFileUrl: string;
  status: SubmissionStatus;
  submissionDate: string;
  proofFileName?: string;
}

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

export default function AddSubscription() {
  const [subscriptionId, setSubscriptionId] = useState("");
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [validationError, setValidationError] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<SubmissionStatus | "">("");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const user = getUser();

  useEffect(() => {
      const fetchSubmissions = async () => {
        try {
          // Load submissions for the currently-authenticated user
          if (!user || !user.id) {
            setSubmissions([]);
            return;
          }
          const res = await api.get(`/api/intern-subscriptions/user/${user.id}`);
          const payload = res && (res.data ?? res);
          // backend typically returns { data: [...] }
          const rows = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.data?.data)
            ? payload.data.data
            : [];

          // Normalize backend (snake_case) -> frontend Submission shape
          const mapped: Submission[] = (rows as any[]).map((r) => ({
            id: r.id,
            subscriberName: r.subscriber_name ?? r.subscriberName ?? '',
            subscriptionId: r.subscription_id ?? r.subscriptionId ?? '',
            planType: r.subscription_plan ?? r.subscriptionPlan ?? (r.planType ?? ''),
            proofFileUrl: r.proof_file_url ?? r.proofFileUrl ?? null,
            status: (r.validation_status || r.status || 'PENDING')
              .toString()
              .toUpperCase() === 'PENDING'
              ? 'Pending'
              : (r.validation_status || r.status || 'PENDING')
                  .toString()
                  .toUpperCase() === 'VERIFIED'
              ? 'Verified'
              : (r.validation_status || r.status || 'PENDING')
                  .toString()
                  .toUpperCase() === 'DUPLICATE'
              ? 'Duplicate'
              : (r.validation_status || r.status || 'PENDING')
                  .toString()
                  .toUpperCase() === 'INVALID'
              ? 'Invalid'
              : (r.validation_status || r.status || 'PENDING')
                  .toString()
                  .toUpperCase() === 'COMPLETED'
              ? 'Verified'
              : 'Pending',
            submissionDate: r.submission_date ?? r.created_at ?? r.updated_at ?? null,
            proofFileName: r.proof_file_name ?? r.proofFileName ?? null,
          }));

          setSubmissions(mapped);
        } catch (err) {
          console.error(err);
          toast.error('Failed to load submissions.');
          setSubmissions([]);
        }
      };
    fetchSubmissions();
  }, [refreshFlag]);

  useEffect(() => {
    if (!subscriptionId.trim()) {
      setSubscriptionDetails(null);
      setValidationError("");
      setIsSubmitDisabled(true);
      return;
    }
    setLoadingCheck(true);
    const t = setTimeout(async () => {
      try {
        // Backend returns { subscription: { ... } } for GET /api/subscriptions/:subscriptionId
  const resp = await api.get(`/api/subscriptions/${subscriptionId.trim()}`);
  const payload = resp && (resp.data ?? resp);
        const found = payload && (payload.subscription ?? payload);

  const dup = await api.get(`/api/intern-subscriptions?subscriptionId=${subscriptionId.trim()}`);
  const dupPayload = dup && (dup.data ?? dup);
        if (Array.isArray(dupPayload) && dupPayload.length > 0) {
          setSubscriptionDetails(null);
          setValidationError("Duplicate Subscription ID");
          setIsSubmitDisabled(true);
          toast.error("Duplicate Subscription ID");
        } else if (!found) {
          setSubscriptionDetails(null);
          setValidationError("No record found.");
          setIsSubmitDisabled(true);
        } else {
          // map backend snake_case to frontend camelCase shape
          const mapped: SubscriptionDetails = {
            subscriptionId: (found.subscription_id ?? found.subscriptionId) as string,
            subscriberName: (found.subscriber_name ?? found.subscriberName) as string,
            email: (found.email ?? found.email_address ?? '') as string,
            phone: (found.phone ?? found.phone_number ?? '') as string,
            subscriptionPlan: (found.subscription_plan ?? found.subscriptionPlan) as SubscriptionPlanOption,
          };
          setSubscriptionDetails(mapped);
          setIsSubmitDisabled(false);
        }
      } catch (err) {
        setSubscriptionDetails(null);
        setValidationError("No record found.");
        setIsSubmitDisabled(true);
      } finally {
        setLoadingCheck(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [subscriptionId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setProofFile(f);
    if (!f) { setProofPreviewUrl(""); return; }
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') { setProofPreviewUrl(''); return; }
    if (['jpg','jpeg','png'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = () => setProofPreviewUrl(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriptionDetails) { toast.error('Verify a subscription first'); return; }
    try {
      // If a proof file is provided, upload it first. Otherwise submit without proof.
      let proofUrl: string | null = null;
      let proofName: string | null = null;
      if (proofFile) {
        const fd = new FormData(); fd.append('file', proofFile);
        const upl = await api.post('/api/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        proofUrl = upl?.data?.url ?? null;
        proofName = proofFile.name;
      }

      const res = await api.post('/api/intern-subscriptions', {
        subscriptionId: subscriptionDetails.subscriptionId,
        subscriberName: subscriptionDetails.subscriberName,
        email: subscriptionDetails.email,
        phone: subscriptionDetails.phone,
        subscriptionPlan: subscriptionDetails.subscriptionPlan,
        proofFileUrl: proofUrl,
        proofFileName: proofName,
        status: 'Pending',
        submissionDate: new Date().toISOString(),
      });

      // Check if backend returned success with message (e.g., already verified)
      if (res?.data?.message) {
        toast.success(res.data.message);
      } else {
        toast.success('Submitted');
      }

      setSubscriptionId(''); setSubscriptionDetails(null); setProofFile(null); setProofPreviewUrl(''); setRemarks('');
      setRefreshFlag(r => r+1);
    } catch (err) { console.error(err); toast.error('Submit failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pending submission?')) return;
  try { await api.delete(`/api/intern-subscriptions/${id}`); toast.success('Deleted'); setRefreshFlag(r=>r+1); } catch { toast.error('Delete failed'); }
  };

  const subsArray = Array.isArray(submissions) ? submissions : [];
  const filtered = useMemo(() => subsArray.filter(s => {
    const statusMatch = filterStatus ? s.status === filterStatus : true;
    const searchMatch = (s.subscriberName||'').toString().toLowerCase().includes(search.toLowerCase()) || (s.subscriptionId||'').toString().toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  }), [subsArray, filterStatus, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page-1)*pageSize, page*pageSize);

  const exportCsv = (rows: Submission[]) => {
    if (!rows || rows.length === 0) { toast.error('No rows'); return; }
    const header = ['Subscriber','Subscription ID','Plan','Status','Date','ProofUrl'];
    const lines = [header.join(',')].concat(rows.map(r => [
      `"${(r.subscriberName||'').replace(/"/g,'""')}"`, `"${(r.subscriptionId||'').replace(/"/g,'""')}"`, `"${r.planType}"`, `"${r.status}"`, `"${r.submissionDate}"`, `"${r.proofFileUrl}"`
    ].join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `subs_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Subscriptions</h1>
        <p className="text-gray-600">Verify subscriber entries and manage your submissions.</p>
      </header>

      <section className="rounded-lg bg-white shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Verify & Submit</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative md:col-span-2">
            <label className="block text-sm font-medium mb-1">Subscription ID</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input id="sub-id" className="pl-9" value={subscriptionId} onChange={e=>setSubscriptionId(e.target.value)} placeholder="Enter subscription ID" />
            </div>
            {loadingCheck && <p className="text-sm text-blue-600 mt-1">Checking...</p>}
            {validationError && <p className="text-sm text-red-600 mt-1 font-semibold">{validationError}</p>}
          </div>

          {subscriptionDetails && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Subscriber</label>
                <Input readOnly value={subscriptionDetails.subscriberName} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input readOnly value={subscriptionDetails.email} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input readOnly value={subscriptionDetails.phone} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Plan</label>
                <Input readOnly value={subscriptionDetails.subscriptionPlan} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Proof (pdf / image)</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                {proofFile && proofPreviewUrl && <img src={proofPreviewUrl} className="mt-2 max-h-40 rounded" />}
                {proofFile && !proofPreviewUrl && <p className="mt-2">{proofFile.name}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <textarea className="w-full rounded border px-3 py-2" rows={3} value={remarks} onChange={e=>setRemarks(e.target.value)} />
              </div>
            </>
          )}

          <div className="md:col-span-2 flex items-center gap-3 justify-end">
            <Button variant="outline" onClick={()=>{ setSubscriptionId(''); setSubscriptionDetails(null); setProofFile(null); setProofPreviewUrl(''); setRemarks(''); }} className="px-3 py-2">Clear</Button>
            <Button type="submit" disabled={isSubmitDisabled} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700">Submit</Button>
          </div>
        </form>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <div className="text-sm text-gray-600">Verified <span className="font-semibold ml-2">{submissions.filter(s=>s.status==='Verified').length}</span></div>
            <div className="text-sm text-gray-600">Pending <span className="font-semibold ml-2">{submissions.filter(s=>s.status==='Pending').length}</span></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input className="pl-9" placeholder="Search name or ID" value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <select className="border px-3 py-2 rounded" value={filterStatus} onChange={e=>setFilterStatus(e.target.value as SubmissionStatus | "")}> 
              <option value="">All Statuses</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
              <option value="Duplicate">Duplicate</option>
              <option value="Invalid">Invalid</option>
            </select>
            <Button variant="outline" className="px-3 py-2" onClick={()=>exportCsv(filtered)}> <Download size={16} className="inline mr-2"/> Export CSV</Button>
          </div>
        </div>

        <div className="rounded-lg bg-white border border-gray-200 overflow-auto">
          <Table className="w-full">
            <THead>
              <TR>
                <TH>Subscriber</TH>
                <TH>Subscription ID</TH>
                <TH>Plan</TH>
                <TH>Proof</TH>
                <TH>Status</TH>
                <TH>Date</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {paginated.length === 0 ? (
                <TR><TD colSpan={7} className="text-center py-6 text-gray-500">No submissions</TD></TR>
              ) : (
                paginated.map(s => (
                  <TR key={s.id} className="hover:bg-gray-50">
                    <TD>{s.subscriberName}</TD>
                    <TD>{s.subscriptionId}</TD>
                    <TD>{s.planType}</TD>
                    <TD><a href={s.proofFileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">View</a></TD>
                    <TD><span className={`inline-flex items-center px-3 py-1 rounded text-sm font-semibold ${statusColors[s.status]}`}>{statusIcons[s.status]}{s.status}</span></TD>
                    <TD>{new Date(s.submissionDate).toLocaleDateString()}</TD>
                    <TD>
                      {s.status === 'Pending' ? (
                        <Button variant="outline" className="px-3 py-1 text-sm" onClick={()=>handleDelete(s.id)}>Delete</Button>
                      ) : (
                        <Button variant="outline" className="px-3 py-1 text-sm" disabled>Delete</Button>
                      )}
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div />
          <div className="flex items-center gap-3">
            <Button variant="outline" className="px-3 py-1 text-sm" disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Previous</Button>
            <div>Page {page} of {totalPages}</div>
            <Button variant="outline" className="px-3 py-1 text-sm" disabled={page===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

// SummaryCard was removed because it's not used in this file.
