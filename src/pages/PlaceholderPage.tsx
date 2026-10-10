import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
  moduleId: string;
}

export function PlaceholderPage({ title, description, moduleId }: PlaceholderPageProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-50 ring-1 ring-primary-200">
          <Construction className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-deep">{title}</h1>
        <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 shadow-soft">
          <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
          <span className="text-xs font-medium text-muted">Module {moduleId} — Coming Next</span>
        </div>
      </div>
    </div>
  );
}
