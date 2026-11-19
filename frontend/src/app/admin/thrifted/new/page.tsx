'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/lib/toast';
import { ThriftedFormLayout, ThriftedFormData } from '@/components/admin/ThriftedFormLayout';

export default function NewThriftedPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ThriftedFormData>({
    name: '', description: '', price: '', originalPrice: '',
    condition: 'good', brand: '', size: '2y', gender: 'unisex', ageGroup: 'baby',
    image: '', image2: '', image3: '',
    isFeatured: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.image) {
      showToast('Name, price and main image are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/thrifted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to create');
      showToast('Thrifted item uploaded!', 'success');
      router.push('/admin/thrifted');
    } catch {
      showToast('Failed to upload item', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThriftedFormLayout
      title="Upload Thrifted Item"
      subtitle="Add a pre-loved piece to your mtumba collection. Each item is one-of-a-kind."
      form={form}
      setForm={setForm}
      saving={saving}
      onSubmit={handleSubmit}
      submitButtonText="Upload Item"
    />
  );
}
