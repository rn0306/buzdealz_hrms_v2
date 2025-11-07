import { NavLink } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { sidebarMenus, iconMap, type Role } from '../config/menus'

type SidebarProps = { role: Role }

const linkBase = 'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200'
const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `${linkBase} ${isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'}`

export default function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const menus = useMemo(() => sidebarMenus[role] ?? [], [role])

  const toggleGroup = (label: string) =>
    setOpenGroups((s) => ({ ...s, [label]: !s[label] }))

  return (
    <aside className={`${
      collapsed ? 'w-20' : 'w-64'
    } h-full flex flex-col border-r border-gray-200 bg-white shadow-lg transition-all duration-300`}>
      <div className="flex h-16 items-center justify-between border-b border-gray-100 bg-white/80 px-4 backdrop-blur-sm supports-[backdrop-filter]:bg-white/60">
        <div className={`flex items-center ${collapsed ? 'justify-center w-full' : ''}`}>
          {!collapsed ? (
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              HRMS
            </span>
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md">
              H
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={`${
            collapsed ? 'absolute -right-3 top-7' : ''
          } rounded-full border border-gray-200 bg-white p-1.5 text-gray-500 shadow-md hover:bg-gray-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200`}
          aria-label="Toggle sidebar"
        >
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
        {menus.map((item) => {
          const Icon = item.icon ? iconMap[item.icon] : undefined
          if (item.path) {
            return (
              <NavLink 
                key={item.label} 
                to={item.path} 
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                {Icon && (
                  <Icon
                    size={20}
                    className={collapsed ? 'mx-auto' : 'min-w-[20px]'}
                  />
                )}
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            )
          }
          return (
            <div key={item.label}>
              <button
                onClick={() => toggleGroup(item.label)}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                  openGroups[item.label]
                    ? 'bg-gray-50 text-gray-900 font-medium'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={collapsed ? item.label : undefined}
              >
                {Icon && (
                  <Icon
                    size={20}
                    className={collapsed ? 'mx-auto' : 'min-w-[20px]'}
                  />
                )}
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    <svg
                      className={`h-4 w-4 transition-transform duration-200 ${
                        openGroups[item.label] ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
              {!collapsed && openGroups[item.label] && item.children && (
                <div className="mt-1 ml-8 space-y-1">
                  {item.children.map((c) => (
                    <NavLink
                      key={c.path}
                      to={c.path}
                      className={({ isActive }) =>
                        `block rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                        }`
                      }
                    >
                      {c.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}


