import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  loading?: boolean;
}

export function StatCard({ title, value, icon: Icon, loading = false }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-primary/10 p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {loading ? (
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
} 