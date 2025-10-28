import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode
} from 'react';
import { DateTime } from 'luxon';

interface VpsRecord {
  id: number;
  name: string;
  ops: string;
  cookie: string;
  valid_until: string | null;
  ip: string | null;
  location: string | null;
  creation_date: string | null;
  cookie_status: 'Normal' | 'Invalid';
  update_time: string | null;
}

interface VpsFormData {
  name: string;
  ops: string;
  cookie: string;
}

const OPS_OPTIONS = ['Hax'];
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const TABLE_HEADERS = [
  'Name',
  'Operator',
  'Cookie Status',
  'Expiry Time',
  'Last Query Time',
  'Location',
  'Creation Date',
  'IP Address',
  'Actions'
];

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

function formatDate(value: string | null, includeZone = false): string {
  if (!value) {
    return '—';
  }

  const dt = DateTime.fromISO(value, { zone: 'Asia/Kuala_Lumpur' });
  if (!dt.isValid) {
    return value;
  }

  const base = dt.toFormat('dd LLL yyyy, h:mm a');
  return includeZone ? `${base} MYT` : base;
}

function statusStyle(status: 'Normal' | 'Invalid'): string {
  return status === 'Normal'
    ? 'bg-green-100 text-green-800 border border-green-200'
    : 'bg-red-100 text-red-800 border border-red-200';
}

function Modal({
  title,
  children,
  onClose
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function VpsForm({
  initial,
  onSubmit,
  onCancel,
  submitting
}: {
  initial: VpsFormData;
  onSubmit: (data: VpsFormData) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState<VpsFormData>(initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(initial);
    setError(null);
  }, [initial]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }

    if (!form.cookie.trim()) {
      setError('Cookie is required.');
      return;
    }

    try {
      await onSubmit({ ...form, name: form.name.trim(), cookie: form.cookie.trim() });
    } catch (err) {
      console.error(err);
      setError('Failed to save VPS details.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
          VPS Name
        </label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="e.g. Production VPS"
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="ops" className="block text-sm font-semibold text-slate-700">
          Operator
        </label>
        <select
          id="ops"
          name="ops"
          value={form.ops}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          {OPS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="cookie" className="block text-sm font-semibold text-slate-700">
          Authentication Cookie
        </label>
        <textarea
          id="cookie"
          name="cookie"
          rows={4}
          value={form.cookie}
          onChange={handleChange}
          placeholder="Paste the cookie string used for Hax.co.id"
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <p className="text-xs text-slate-500">
          Ensure the cookie remains valid so the system can access the VPS information page.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {submitting ? 'Saving…' : 'Save VPS'}
        </button>
      </div>
    </form>
  );
}

export default function App() {
  const [vpsList, setVpsList] = useState<VpsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<VpsRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<VpsRecord | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const defaultFormData = useMemo<VpsFormData>(() => ({
    name: editing?.name ?? '',
    ops: editing?.ops ?? OPS_OPTIONS[0],
    cookie: editing?.cookie ?? ''
  }), [editing]);

  const loadVps = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(apiUrl('/api/vps'));
      if (!response.ok) {
        throw new Error('Failed to load VPS records');
      }
      const data = (await response.json()) as VpsRecord[];
      setVpsList(data);
    } catch (err) {
      console.error(err);
      setError('Unable to load VPS records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVps();
  }, []);

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const showToast = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (record: VpsRecord) => {
    setEditing(record);
    setShowForm(true);
  };

  const handleDelete = async (record: VpsRecord) => {
    try {
      const response = await fetch(apiUrl(`/api/vps/${record.id}`), {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete VPS');
      }
      setVpsList((prev) => prev.filter((item) => item.id !== record.id));
      showToast('VPS removed successfully.');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete VPS.');
    } finally {
      setConfirmDelete(null);
    }
  };

  const upsertVps = (record: VpsRecord) => {
    setVpsList((prev) => {
      const exists = prev.some((item) => item.id === record.id);
      if (exists) {
        return prev.map((item) => (item.id === record.id ? record : item));
      }
      return [record, ...prev];
    });
  };

  const handleSubmit = async (formData: VpsFormData) => {
    setSubmitting(true);

    try {
      const isEdit = Boolean(editing);
      const response = await fetch(
        apiUrl(isEdit ? `/api/vps/${editing?.id}` : '/api/vps'),
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save VPS');
      }

      const saved = (await response.json()) as VpsRecord;
      upsertVps(saved);
      await loadVps();
      showToast(isEdit ? 'VPS updated successfully.' : 'VPS created successfully.');
      closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async (record: VpsRecord) => {
    try {
      const response = await fetch(apiUrl(`/api/vps/${record.id}/refresh`), {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Refresh failed');
      }
      const updated = (await response.json()) as VpsRecord;
      upsertVps(updated);
      showToast('VPS data refreshed.');
    } catch (err) {
      console.error(err);
      showToast('Failed to refresh VPS.');
    }
  };

  const handleRefreshAll = async () => {
    try {
      const response = await fetch(apiUrl('/api/vps/refresh-all'), {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Refresh all failed');
      }
      const refreshed = (await response.json()) as VpsRecord[];
      setVpsList(refreshed);
      showToast('All VPS entries refreshed.');
    } catch (err) {
      console.error(err);
      showToast('Failed to refresh all VPS entries.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">VPS Monitoring Dashboard</h1>
            <p className="text-sm text-slate-500">
              Track VPS renewal dates, locations, and connection details scraped from Hax.co.id.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefreshAll}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-500 hover:text-blue-600"
            >
              ⟳ Refresh All
            </button>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Add VPS
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-6xl px-4">
        {feedback ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {feedback}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {TABLE_HEADERS.map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-4 py-12 text-center text-sm text-slate-500">
                    Loading VPS information…
                  </td>
                </tr>
              ) : vpsList.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-4 py-12 text-center text-sm text-slate-500">
                    No VPS entries yet. Add a VPS to begin monitoring.
                  </td>
                </tr>
              ) : (
                vpsList.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">{record.name}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{record.ops}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                          record.cookie_status
                        )}`}
                      >
                        {record.cookie_status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{formatDate(record.valid_until)}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{formatDate(record.update_time, true)}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{record.location ?? '—'}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{formatDate(record.creation_date)}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{record.ip ?? '—'}</td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleRefresh(record)}
                          className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
                        >
                          Refresh
                        </button>
                        <button
                          onClick={() => handleEdit(record)}
                          className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDelete(record)}
                          className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {showForm ? (
        <Modal title={editing ? 'Edit VPS' : 'Add VPS'} onClose={closeForm}>
          <VpsForm initial={defaultFormData} onSubmit={handleSubmit} onCancel={closeForm} submitting={submitting} />
        </Modal>
      ) : null}

      {confirmDelete ? (
        <Modal title="Delete VPS" onClose={() => setConfirmDelete(null)}>
          <div className="space-y-5">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete <span className="font-semibold text-slate-900">{confirmDelete.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Delete VPS
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
