'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Clock, GitBranch, Loader2, Save } from 'lucide-react';

interface Settings {
  workStartTime: string;
  workEndTime: string;
  workDays: string[];
  monitoredRepos: string[];
}

const WORK_DAYS = [
  { value: 'MONDAY', label: 'Segunda' },
  { value: 'TUESDAY', label: 'Terça' },
  { value: 'WEDNESDAY', label: 'Quarta' },
  { value: 'THURSDAY', label: 'Quinta' },
  { value: 'FRIDAY', label: 'Sexta' },
  { value: 'SATURDAY', label: 'Sábado' },
  { value: 'SUNDAY', label: 'Domingo' },
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({
    workStartTime: '09:00',
    workEndTime: '18:00',
    workDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    monitoredRepos: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error('Falha ao carregar configurações');
        }
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        setError('Não foi possível carregar suas configurações');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchSettings();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar configurações');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setError('Não foi possível salvar suas configurações');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie suas preferências de monitoramento
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="card p-6">
            <div className="mb-6 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                Horário de Trabalho
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="workStartTime"
                  className="block text-sm font-medium text-foreground"
                >
                  Início do Expediente
                </label>
                <input
                  type="time"
                  id="workStartTime"
                  value={settings.workStartTime}
                  onChange={(e) =>
                    setSettings({ ...settings, workStartTime: e.target.value })
                  }
                  className="input mt-1"
                />
              </div>

              <div>
                <label
                  htmlFor="workEndTime"
                  className="block text-sm font-medium text-foreground"
                >
                  Fim do Expediente
                </label>
                <input
                  type="time"
                  id="workEndTime"
                  value={settings.workEndTime}
                  onChange={(e) =>
                    setSettings({ ...settings, workEndTime: e.target.value })
                  }
                  className="input mt-1"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-foreground">
                Dias de Trabalho
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                {WORK_DAYS.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      checked={settings.workDays.includes(day.value)}
                      onChange={(e) => {
                        const newWorkDays = e.target.checked
                          ? [...settings.workDays, day.value]
                          : settings.workDays.filter((d) => d !== day.value);
                        setSettings({ ...settings, workDays: newWorkDays });
                      }}
                      className="checkbox"
                    />
                    <span className="text-sm text-foreground">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="card p-6">
            <div className="mb-6 flex items-center">
              <GitBranch className="mr-2 h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                Repositórios Monitorados
              </h2>
            </div>

            <div className="space-y-4">
              {settings.monitoredRepos.map((repo, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-4"
                >
                  <span className="text-foreground">{repo}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        monitoredRepos: settings.monitoredRepos.filter(
                          (_, i) => i !== index
                        ),
                      })
                    }
                    className="text-destructive hover:text-destructive/80"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </section>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-emerald-500/10 p-4 text-emerald-500">
              Configurações salvas com sucesso!
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary flex items-center"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 