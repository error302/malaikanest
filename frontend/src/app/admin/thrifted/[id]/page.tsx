'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { showToast } from '@/lib/toast';
import { ThriftedFormLayout, ThriftedFormData } from '@/components/admin/ThriftedFormLayout';

export default function EditThriftedPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ThriftedFormData | null>(null);

  useEffect(() => {
    fetch('/api/admin/thrifted')
      .then((r) => r.json())
      .then((data) => {
        const found = (data.products || []).find((p: any) => p.id === params.id);
        if (found) {
          setForm({
            ...found,
            price: String(found.price),
            originalPrice: found.originalPrice ? String(found.originalPrice) : '',
          });
        } else {
          showToast('Item not found', 'error');
          router.push('/admin/thrifted');
        }
      })
      .catch(() => router.push('/admin/thrifted'))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/thrifted/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save');
      showToast('Thrifted item updated', 'success');
      router.push('/admin/thrifted');
    } catch {
      showToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return <div className="text-center py-20" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>;
  }

  return (
    <ThriftedFormLayout
      title="Edit Thrifted Item"
      subtitle={form.name}
      form={form}
      setForm={setForm as any}
      saving={saving}
      onSubmit={handleSubmit}
      submitButtonText="Save Changes"
    />
  );
}
