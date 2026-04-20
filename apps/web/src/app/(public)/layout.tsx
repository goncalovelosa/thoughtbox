import { PublicFooter } from '@/components/nav/public-footer'
import { PublicNav } from '@/components/nav/public-nav'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
