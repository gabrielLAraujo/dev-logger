import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { message: 'Mensagem é obrigatória' },
        { status: 400 }
      );
    }

    // Verificar se o token está configurado
    const token = process.env.HUGGINGFACE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { message: 'Serviço não configurado' },
        { status: 503 }
      );
    }

    // Adicionar um pequeno atraso para evitar problemas de rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));

    const response = await fetch(
      HUGGINGFACE_API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
      
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { message: 'Erro de autenticação com o serviço' },
          { status: 401 }
        );
      }
      
      if (response.status === 429) {
        return NextResponse.json(
          { message: 'Limite de requisições excedido. Tente novamente mais tarde.' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { message: 'Erro ao melhorar mensagem' },
        { status: 500 }
      );
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
      return NextResponse.json({ message });
    }
    
    return NextResponse.json({ message: improvedMessage });
  } catch (error) {
    console.error('Erro ao melhorar mensagem:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 