interface SidebarProps {
  currentPage: string;
  onNavigate: (page: "dashboard" | "services" | "quotes" | "documents" | "new-quote") => void;
  user: any;
  onLogout: () => void;
}

export function Sidebar({ currentPage, onNavigate, user, onLogout }: SidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "services", label: "Services", icon: "🧬" },
    { id: "quotes", label: "Quotes & Invoices", icon: "📄" },
    { id: "documents", label: "Documents", icon: "📁" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Celljevity</h1>
        <p className="text-sm text-gray-500">Longevity OS</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
              currentPage === item.id
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </button>
        ))}

        {/* New Quote Button */}
        <button
          onClick={() => onNavigate("new-quote")}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <span>+</span>
          New Quote
        </button>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
            {user?.name?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || "Admin"}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || "admin@celljevity.com"}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
