import { SidebarContent } from '@/app/shell/SidebarContent';

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 border-e border-border bg-surface-2/70 lg:block">
      <SidebarContent />
    </aside>
  );
}
