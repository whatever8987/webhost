import { Link, useLocation } from "wouter";

interface Tab {
  name: string;
  href: string;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab?: string;
}

export function TabNavigation({ tabs, activeTab }: TabNavigationProps) {
  const [location] = useLocation();

  const isActive = (href: string) => {
    return location === href || activeTab === href;
  };

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 mb-6">
      <div className="overflow-x-auto flex-nowrap flex -mb-px">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            href={tab.href}
            className={`${
              isActive(tab.href)
                ? "text-primary border-primary font-semibold relative after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-px after:h-[3px] after:rounded-t-full after:bg-gradient-to-r after:from-primary after:to-secondary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-slate-300 dark:hover:border-slate-600"
            } whitespace-nowrap px-4 py-3 border-b-2 font-medium text-sm flex items-center transition-colors`}
            aria-current={isActive(tab.href) ? "page" : undefined}
          >
            {tab.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
