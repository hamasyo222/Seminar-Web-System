import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Calendar, 
  ShoppingCart, 
  Users, 
  CheckSquare,
  Mail,
  Ticket,
  Settings,
  LogOut,
  Menu,
  Activity
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface AdminLayoutProps {
  children: React.ReactNode
}

const menuItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'ダッシュボード' },
  { href: '/admin/seminars', icon: Calendar, label: 'セミナー管理' },
  { href: '/admin/orders', icon: ShoppingCart, label: '注文管理' },
  { href: '/admin/participants', icon: Users, label: '参加者管理' },
  { href: '/admin/checkin', icon: CheckSquare, label: '受付チェック' },
  { href: '/admin/emails', icon: Mail, label: 'メール管理' },
  { href: '/admin/coupons', icon: Ticket, label: 'クーポン管理' },
  { href: '/admin/audit-logs', icon: Activity, label: '監査ログ' },
  { href: '/admin/settings', icon: Settings, label: '設定' },
]

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await getSession()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        {/* サイドバー */}
        <aside className="w-64 bg-gray-900 text-white flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <h1 className="text-xl font-bold">管理画面</h1>
            <p className="text-sm text-gray-400 mt-1">{user.name}</p>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors w-full text-left"
              >
                <LogOut className="w-5 h-5" />
                <span>ログアウト</span>
              </button>
            </form>
          </div>
        </aside>

        {/* メインコンテンツ */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
