import { useState, ReactNode } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface Tab {
  id: string
  label: string
  icon?: ReactNode
  content: ReactNode
  disabled?: boolean
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  variant?: 'default' | 'pills' | 'underline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onTabChange?: (tabId: string) => void
}

const variants = {
  default: {
    list: 'border-b border-gray-200',
    tab: 'border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300',
    activeTab: 'border-blue-500 text-blue-600'
  },
  pills: {
    list: 'space-x-2',
    tab: 'rounded-lg hover:bg-gray-100',
    activeTab: 'bg-blue-100 text-blue-700'
  },
  underline: {
    list: '',
    tab: 'border-b-2 border-transparent hover:text-gray-700',
    activeTab: 'border-blue-500 text-blue-600'
  }
}

const sizes = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-base px-4 py-2',
  lg: 'text-lg px-6 py-3'
}

export function Tabs({
  tabs,
  defaultTab,
  variant = 'default',
  size = 'md',
  className,
  onTabChange
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    onTabChange?.(tabId)
  }

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content

  return (
    <div className={className}>
      <div className={twMerge('flex', variants[variant].list)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            disabled={tab.disabled}
            className={twMerge(
              clsx(
                'inline-flex items-center font-medium transition-colors duration-200',
                sizes[size],
                variants[variant].tab,
                activeTab === tab.id && variants[variant].activeTab,
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )
            )}
          >
            {tab.icon && (
              <span className="mr-2">{tab.icon}</span>
            )}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {activeTabContent}
      </div>
    </div>
  )
}

interface TabPanelProps {
  children: ReactNode
  className?: string
}

export function TabPanel({ children, className }: TabPanelProps) {
  return (
    <div className={twMerge('focus:outline-none', className)}>
      {children}
    </div>
  )
}

export default Tabs