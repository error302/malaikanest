import { Providers } from '@/lib/providers'
import Navbar from '@/components/layout/Navbar'
import TrustBar from '@/components/layout/TrustBar'
import Footer from '@/components/layout/Footer'
import { ToastContainer } from '@/components/Toast'
import Chatbot from '@/components/Chatbot'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <TrustBar />
        <Footer />
      </div>
      <Chatbot />
      <ToastContainer />
    </Providers>
  )
}
