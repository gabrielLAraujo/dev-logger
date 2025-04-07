"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Settings {
  id?: string;
  workStartTime: string;
  workEndTime: string;
  workDays: string[];
  monitoredRepos: string[];
}

interface SettingsFormProps {
  initialSettings: Settings | null;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(
    initialSettings || {
      workStartTime: "09:00",
      workEndTime: "18:00",
      workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      monitoredRepos: [],
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    }
  };

  const handleWorkDaysChange = (day: string) => {
    setSettings((prev) => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter((d) => d !== day)
        : [...prev.workDays, day],
    }));
  };

  const handleRepoAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value) {
      e.preventDefault();
      setSettings((prev) => ({
        ...prev,
        monitoredRepos: [...prev.monitoredRepos, e.currentTarget.value],
      }));
      e.currentTarget.value = "";
    }
  };

  const handleRepoRemove = (repo: string) => {
    setSettings((prev) => ({
      ...prev,
      monitoredRepos: prev.monitoredRepos.filter((r) => r !== repo),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Horário de Início
        </label>
        <input
          type="time"
          value={settings.workStartTime}
          onChange={(e) =>
            setSettings((prev) => ({ ...prev, workStartTime: e.target.value }))
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Horário de Término
        </label>
        <input
          type="time"
          value={settings.workEndTime}
          onChange={(e) =>
            setSettings((prev) => ({ ...prev, workEndTime: e.target.value }))
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dias de Trabalho
        </label>
        <div className="space-y-2">
          {["monday", "tuesday", "wednesday", "thursday", "friday"].map((day) => (
            <label key={day} className="flex items-center">
              <input
                type="checkbox"
                checked={settings.workDays.includes(day)}
                onChange={() => handleWorkDaysChange(day)}
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Repositórios Monitorados
        </label>
        <input
          type="text"
          placeholder="Digite o nome do repositório e pressione Enter"
          onKeyDown={handleRepoAdd}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {settings.monitoredRepos.map((repo) => (
            <span
              key={repo}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
            >
              {repo}
              <button
                type="button"
                onClick={() => handleRepoRemove(repo)}
                className="ml-1 text-indigo-600 hover:text-indigo-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Salvar Configurações
        </button>
      </div>
    </form>
  );
} 