// Função para melhorar uma mensagem de commit
export async function improveCommitMessage(message: string): Promise<string> {
  try {
    const response = await fetch('/api/improve-commit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Erro ao melhorar mensagem:', error);
      return message;
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error('Erro ao melhorar mensagem:', error);
    return message;
  }
} 