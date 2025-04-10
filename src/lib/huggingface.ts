// Token do Hugging Face para acessar a API de modelos de linguagem
// Substitua pelo seu token real ou use uma variável de ambiente
export const HUGGINGFACE_TOKEN = process.env.NEXT_PUBLIC_HUGGINGFACE_TOKEN || 'hf_xxx';

// URL da API do Hugging Face
export const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';

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