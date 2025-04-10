// Token do Hugging Face para acessar a API de modelos de linguagem
// Substitua pelo seu token real ou use uma variável de ambiente
export const HUGGINGFACE_TOKEN = process.env.NEXT_PUBLIC_HUGGINGFACE_TOKEN || 'hf_xxx';

// URL da API do Hugging Face
export const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';

// Função para melhorar uma mensagem de commit
export async function improveCommitMessage(message: string): Promise<string> {
  try {
    // Verificar se o token está configurado
    if (!HUGGINGFACE_TOKEN || HUGGINGFACE_TOKEN === 'hf_xxx') {
      console.warn('Token do Hugging Face não configurado. Retornando mensagem original.');
      return message;
    }

    // Adicionar um pequeno atraso para evitar problemas de rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));

    const response = await fetch(
      HUGGINGFACE_API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HUGGINGFACE_TOKEN}`
        },
        body: JSON.stringify({
          inputs: `Melhore a seguinte mensagem de commit para ser mais profissional e descritiva: ${message}`,
          parameters: {
            max_length: 100,
            min_length: 30,
            do_sample: false
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro ao melhorar mensagem:', response.status, errorText);
      
      // Se for erro de autenticação, retornar mensagem original
      if (response.status === 401 || response.status === 403) {
        console.warn('Erro de autenticação com o Hugging Face. Verifique seu token.');
        return message;
      }
      
      // Se for erro de rate limiting, retornar mensagem original
      if (response.status === 429) {
        console.warn('Limite de requisições excedido no Hugging Face. Tente novamente mais tarde.');
        return message;
      }
      
      return message; // Retorna a mensagem original em caso de erro
    }

    const data = await response.json();
    let improvedMessage = data[0].summary_text || message;
    
    // Remover a instrução da mensagem melhorada, se presente
    const instructionPrefix = "Melhore a seguinte mensagem de commit para ser mais profissional e descritiva:";
    if (improvedMessage.startsWith(instructionPrefix)) {
      improvedMessage = improvedMessage.substring(instructionPrefix.length).trim();
    }
    
    // Remover qualquer ocorrência da instrução no meio da mensagem
    improvedMessage = improvedMessage.replace(new RegExp(instructionPrefix, 'g'), '');
    
    // Se a mensagem melhorada estiver vazia após a limpeza, retornar a original
    if (!improvedMessage.trim()) {
      return message;
    }
    
    return improvedMessage;
  } catch (error) {
    console.error('Erro ao melhorar mensagem:', error);
    return message; // Retorna a mensagem original em caso de erro
  }
} 