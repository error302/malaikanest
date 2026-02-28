'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎁 AI Bundle Builder
          </h1>
          <p className="text-gray-600 text-lg">
            Let our AI create the perfect baby product bundle for you
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= s
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-20 h-1 ${
                      step > s ? 'bg-amber-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Select Preferences */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">What do you need?</h2>
            
            <div className="space-y-6">
              {/* Bundle Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Bundle Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {BUNDLE_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() =>
                        setSelections({ ...selections, bundleType: type.id })
                      }
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selections.bundleType === type.id
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      <p className="font-medium text-gray-800">{type.name}</p>
                      <p className="text-sm text-gray-500">{type.age}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Baby's Age
                </label>
                <div className="flex gap-3">
                  {AGE_GROUPS.map((age) => (
                    <button
                      key={age.id}
                      onClick={() =>
                        setSelections({ ...selections, ageGroup: age.id })
                      }
                      className={`px-6 py-3 rounded-full border-2 transition-all ${
                        selections.ageGroup === age.id
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      {age.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Gender Preference
                </label>
                <div className="flex gap-3">
                  {GENDERS.map((gender) => (
                    <button
                      key={gender.id}
                      onClick={() =>
                        setSelections({ ...selections, gender: gender.id })
                      }
                      className={`px-6 py-3 rounded-full border-2 transition-all ${
                        selections.gender === gender.id
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      {gender.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Budget (KSh)
                </label>
                <input
                  type="range"
                  min="1000"
                  max="20000"
                  step="1000"
                  value={selections.budget}
                  onChange={(e) =>
                    setSelections({
                      ...selections,
                      budget: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>KSh 1,000</span>
                  <span className="text-amber-600 font-bold">
                    KSh {selections.budget.toLocaleString()}
                  </span>
                  <span>KSh 20,000</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full mt-8 bg-amber-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-amber-700 transition"
            >
              Generate My Bundle ✨
            </button>
          </div>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Confirm Your Selection</h2>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Bundle Type</p>
                  <p className="font-medium">
                    {BUNDLE_TYPES.find((t) => t.id === selections.bundleType)?.name || 'Custom Bundle'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Age Group</p>
                  <p className="font-medium">
                    {AGE_GROUPS.find((a) => a.id === selections.ageGroup)?.label}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium capitalize">{selections.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Budget</p>
                  <p className="font-medium text-amber-600">
                    KSh {selections.budget.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-xl font-bold border-2 border-gray-300 hover:border-gray-400 transition"
              >
                Back
              </button>
              <button
                onClick={generateBundle}
                disabled={loading}
                className="flex-1 bg-amber-600 text-white py-4 rounded-xl font-bold hover:bg-amber-700 transition disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Bundle 🤖'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && bundle && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🎁</div>
              <h2 className="text-2xl font-bold">{bundle.name}</h2>
              <p className="text-gray-600">{bundle.description}</p>
            </div>

            <div className="space-y-4 mb-8">
              {bundle.products.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                >
                  <span className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <div className="w-16 h-16 bg-white rounded-lg overflow-hidden">
                    {product.images?.[0]?.image ? (
                      <img
                        src={product.images[0].image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-amber-600 font-bold">
                      KSh {parseFloat(product.price).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 rounded-xl p-6 mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Total Value:</span>
                <span className="line-through text-gray-500">
                  KSh {bundle.total_price.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Your Price:</span>
                <span className="text-2xl font-bold text-amber-600">
                  KSh {(bundle.total_price - bundle.savings).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">You Save:</span>
                <span className="text-green-600 font-bold">
                  KSh {bundle.savings.toLocaleString()}!
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-xl font-bold border-2 border-gray-300 hover:border-gray-400 transition"
              >
                Start Over
              </button>
              <button
                onClick={addBundleToCart}
                disabled={addingToCart}
                className="flex-1 bg-amber-600 text-white py-4 rounded-xl font-bold hover:bg-amber-700 transition disabled:opacity-50"
              >
                {addingToCart ? 'Adding...' : 'Add All to Cart 🛒'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
