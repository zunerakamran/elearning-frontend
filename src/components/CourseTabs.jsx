export default function CourseTabs({ activeTab, setActiveTab, isOwner, enrolled, isAdmin }) {
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'announcements', label: 'Announcements' },
    ...(enrolled || isOwner || isAdmin ? [{ key: 'assignments', label: 'Assignments' }] : []),
    ...(enrolled || isOwner || isAdmin ? [{ key: 'discussions', label: 'Discussions' }] : []),
    { key: 'reviews', label: 'Reviews' }, ...(enrolled || isOwner ? [{ key: 'chat', label: 'Chat' }] : []),
  ];

  return (
    <div className="overflow-x-auto overflow-y-hidden border-b border-gray-200 mb-6 -mx-1">
      <div className="flex gap-1 min-w-max px-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px cursor-pointer whitespace-nowrap ${activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}