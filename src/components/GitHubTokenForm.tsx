'use client';

import { useState } from 'react';

export default function GitHubTokenForm() {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ githubToken: token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Falha ao salvar token');
      }

      setSuccess(true);
      setToken('');
      
      // Aguarda 1 segundo antes de recarregar para mostrar a mensagem de sucesso
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao salvar o token');
      console.error('Erro ao salvar token:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Configure seu Token do GitHub
      </h3>
      
      <p className="text-sm text-gray-600 mb-4">
        Para acessar seus repositórios privados, você precisa configurar um token de acesso pessoal do GitHub.
        Certifique-se de incluir as permissões: <code>repo</code> e <code>read:user</code>.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-medium">Erro: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
            <strong className="font-medium">Sucesso! </strong>
            <span className="block sm:inline">Token configurado com sucesso!</span>
          </div>
        )}

        <div>
          <label htmlFor="token" className="block text-sm font-medium text-gray-700">
            Token de Acesso Pessoal
          </label>
          <input
            type="password"
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="ghp_..."
          />
          <p className="mt-2 text-sm text-gray-500">
            O token deve começar com &quot;ghp_&quot;
          </p>
        </div>

        <div className="flex items-center justify-between">
          <a
            href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=Dev Logger App"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Criar novo token →
          </a>
          <button
            type="submit"
            disabled={isLoading || !token.startsWith('ghp_')}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Salvando...' : 'Salvar Token'}
          </button>
        </div>
      </form>
    </div>
  );
} 