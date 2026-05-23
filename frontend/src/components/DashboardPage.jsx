const DashboardPage = ({ title, description, children, action }) => {
  return (
    <div className="max-w-5xl mx-auto animate-fade-up">
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              {title}
            </h1>
            {description && (
              <p className="text-[#8b8ba3] text-lg">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0 mt-1">{action}</div>}
        </div>
      </header>
      {children}
    </div>
  );
};

export default DashboardPage;
