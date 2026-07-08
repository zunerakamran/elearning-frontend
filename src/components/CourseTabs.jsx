export default function CourseTabs({ activeTab, setActiveTab, isOwner, enrolled }) {
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'announcements', label: 'Announcements' },
    ...(enrolled || isOwner ? [{ key: 'assignments', label: 'Assignments' }] : []),
    { key: 'reviews', label: 'Reviews' },
  ];

  return (
    <div className="flex gap-1 border-b border-gray-200 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px cursor-pointer ${
            activeTab === tab.key
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}