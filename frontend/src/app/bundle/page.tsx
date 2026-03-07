'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import api from '@/lib/api'

interface BundleProduct {
  id: number
  name: string
  slug: string
  price: string
  images: { image: string }[]
}

interface Bundle {
  type: string
  name: string
  description: string
  products: BundleProduct[]
  total_price: number
  savings: number
}

const BUNDLE_TYPES = [
  { id: 'newborn_starter', name: 'Newborn Starter Kit', age: '0-3 months' },
  { id: 'infant_essentials', name: 'Infant Essentials', age: '3-12 months' },
  { id: 'toddler_adventure', name: 'Toddler Adventure', age: '1-3 years' },
  { id: 'feeding_set', name: 'Feeding Set', age: 'All ages' },
  { id: 'bath_time_fun', name: 'Bath Time Fun', age: 'All ages' },
  { id: 'sleep_time', name: 'Sleep Time Bundle', age: 'All ages' },
]

const AGE_GROUPS = [
  { id: 'newborn', label: 'Newborn (0-3 months)' },
  { id: 'infant', label: 'Infant (3-12 months)' },
  { id: 'toddler', label: 'Toddler (1-3 years)' },
]

const GENDERS = [
  { id: 'boy', label: 'Boy' },
  { id: 'girl', label: 'Girl' },
  { id: 'unisex', label: 'Unisex' },
]

export default function BundleBuilderPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selections, setSelections] = useState({
    bundleType: '',
    ageGroup: 'newborn',
    gender: 'unisex',
    budget: 5000,
  })
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [loading, setLoading] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  const generateBundle = async () => {
    setLoading(true)
    try {
      const res = await api.post('/api/ai/bundle/', {
        type: selections.bundleType || 'newborn_starter',
        budget: selections.budget,
        age_group: selections.ageGroup,
        gender: selections.gender,
      })
      setBundle(res.data)
      setStep(3)
    } catch (error) {
      console.error('Failed to generate bundle:', error)
    } finally {
      setLoading(false)
    }
  }

  const addBundleToCart = async () => {
    if (!bundle) return
    setAddingToCart(true)

    for (const product of bundle.products) {
      try {
        await api.post('/api/orders/cart/add/', {
          product_id: product.id,
          quantity: 1,
        })
      } catch (error) {
        console.error('Failed to add to cart:', error)
      }
    }

    setTimeout(() => {
      setAddingToCart(false)
      router.push('/cart')
    }, 1000)
  }

  const selectedBundleName = BUNDLE_TYPES.find((t) => t.id === selections.bundleType)?.name || 'Custom Bundle'
  const selectedAge = AGE_GROUPS.find((a) => a.id === selections.ageGroup)?.label || 'Newborn'

  return (
    <div className="pb-20 pt-10">
      <div className="container-shell">
        <header className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Personalized Shopping</p>
          <h1 className="font-display mt-3 text-[48px] text-[var(--text-primary)]">AI Bundle Builder</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[18px] text-[var(--text-secondary)]">
            Build a curated baby bundle based on age, gender preference, and budget.
          </p>
        </header>

        <div className="mb-8 flex items-center justify-center gap-3">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${step >= s ? 'bg-[var(--text-primary)] text-white border-[var(--text-primary)]' : 'bg-[var(--bg-soft)] text-[var(--text-secondary)] border-default'}`}>
                {s}
              </span>
              {s < 3 && <span className={`h-1 w-12 rounded ${step > s ? 'bg-[var(--text-primary)]' : 'bg-[var(--border)]'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <section className="card-soft p-6 md:p-8">
            <h2 className="text-[28px] font-semibold text-[var(--text-primary)]">Select Preferences</h2>

            <div className="mt-6 space-y-6">
              <div>
                <label className="mb-3 block text-sm font-medium text-[var(--text-primary)]">Bundle Type</label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {BUNDLE_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelections({ ...selections, bundleType: type.id })}
                      className={`rounded-[12px] border p-4 text-left transition ${selections.bundleType === type.id ? 'border-[var(--text-primary)] bg-[var(--bg-soft)]' : 'border-default hover:border-[var(--accent-primary)]'}`}
                    >
                      <p className="font-semibold text-[var(--text-primary)]">{type.name}</p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{type.age}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-[var(--text-primary)]">Baby's Age</label>
                <div className="flex flex-wrap gap-2">
                  {AGE_GROUPS.map((age) => (
                    <button
                      key={age.id}
                      onClick={() => setSelections({ ...selections, ageGroup: age.id })}
                      className={`rounded-full border px-4 py-2 text-sm transition ${selections.ageGroup === age.id ? 'border-[var(--text-primary)] bg-[var(--bg-soft)] text-[var(--text-primary)]' : 'border-default text-[var(--text-secondary)] hover:border-[var(--accent-primary)]'}`}
                    >
                      {age.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-[var(--text-primary)]">Gender Preference</label>
                <div className="flex flex-wrap gap-2">
                  {GENDERS.map((gender) => (
                    <button
                      key={gender.id}
                      onClick={() => setSelections({ ...selections, gender: gender.id })}
                      className={`rounded-full border px-4 py-2 text-sm transition ${selections.gender === gender.id ? 'border-[var(--text-primary)] bg-[var(--bg-soft)] text-[var(--text-primary)]' : 'border-default text-[var(--text-secondary)] hover:border-[var(--accent-primary)]'}`}
                    >
                      {gender.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-[var(--text-primary)]">Budget (KES)</label>
                <input
                  type="range"
                  min="1000"
                  max="20000"
                  step="1000"
                  value={selections.budget}
                  onChange={(e) => setSelections({ ...selections, budget: parseInt(e.target.value) })}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[var(--border)]"
                />
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">KES 1,000</span>
                  <span className="font-semibold text-[var(--text-primary)]">KES {selections.budget.toLocaleString()}</span>
                  <span className="text-[var(--text-secondary)]">KES 20,000</span>
                </div>
              </div>
            </div>

            <button onClick={() => setStep(2)} className="btn-primary mt-8 w-full">Review Bundle</button>
          </section>
        )}

        {step === 2 && (
          <section className="card-soft p-6 md:p-8">
            <h2 className="text-[28px] font-semibold text-[var(--text-primary)]">Confirm Selection</h2>

            <div className="mt-5 rounded-[12px] border border-default bg-[var(--bg-soft)] p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Bundle Type</p>
                  <p className="font-semibold text-[var(--text-primary)]">{selectedBundleName}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Age Group</p>
                  <p className="font-semibold text-[var(--text-primary)]">{selectedAge}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Gender</p>
                  <p className="font-semibold capitalize text-[var(--text-primary)]">{selections.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Budget</p>
                  <p className="font-semibold text-[var(--text-primary)]">KES {selections.budget.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
              <button onClick={generateBundle} disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
                {loading ? 'Generating...' : 'Generate Bundle'}
              </button>
            </div>
          </section>
        )}

        {step === 3 && bundle && (
          <section className="card-soft p-6 md:p-8">
            <div className="text-center">
              <h2 className="font-display text-[36px] text-[var(--text-primary)]">{bundle.name}</h2>
              <p className="mt-2 text-[16px] text-[var(--text-secondary)]">{bundle.description}</p>
            </div>

            <div className="mt-6 space-y-3">
              {bundle.products.map((product, index) => (
                <article key={product.id} className="flex items-center gap-3 rounded-[12px] border border-default bg-[var(--bg-soft)] p-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-secondary)] text-sm font-semibold text-[var(--text-primary)]">{index + 1}</span>
                  <div className="h-14 w-14 overflow-hidden rounded-lg border border-default bg-surface">
                    {product.images?.[0]?.image ? (
                      <Image width={112} height={112} src={product.images[0].image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-[var(--border)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-medium text-[var(--text-primary)]">{product.name}</p>
                    <p className="text-sm text-[var(--text-secondary)]">KES {parseFloat(product.price).toLocaleString()}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 rounded-[12px] border border-default bg-[var(--bg-soft)] p-5">
              <div className="mb-2 flex items-center justify-between text-sm text-[var(--text-secondary)]">
                <span>Total Value</span>
                <span className="line-through">KES {bundle.total_price.toLocaleString()}</span>
              </div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Your Price</span>
                <span className="text-2xl font-semibold text-[var(--text-primary)]">KES {(bundle.total_price - bundle.savings).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">You Save</span>
                <span className="font-semibold text-green-700">KES {bundle.savings.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">Start Over</button>
              <button onClick={addBundleToCart} disabled={addingToCart} className="btn-primary flex-1 disabled:opacity-60">
                {addingToCart ? 'Adding...' : 'Add All to Cart'}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
