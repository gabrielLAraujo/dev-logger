# Dev Logger

Um aplicativo para rastrear suas atividades de desenvolvimento.

## Configuração

### Pré-requisitos

- Node.js 18.x ou superior
- PostgreSQL 14.x ou superior
- Conta no GitHub para autenticação OAuth

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/dev-logger.git
cd dev-logger
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.local` para `.env.local` e preencha as variáveis:
     - `DATABASE_URL`: URL de conexão com o PostgreSQL
     - `GITHUB_ID`: ID do cliente OAuth do GitHub
     - `GITHUB_SECRET`: Segredo do cliente OAuth do GitHub
     - `NEXTAUTH_SECRET`: Chave secreta para criptografia de sessão
     - `NEXTAUTH_URL`: URL base da aplicação (http://localhost:3000 para desenvolvimento)

4. Execute as migrações do banco de dados:
```bash
npm run prisma:migrate
```

5. Gere o cliente Prisma:
```bash
npm run prisma:generate
```

## Executando o projeto

### Desenvolvimento

```bash
npm run dev
```

O aplicativo estará disponível em http://localhost:3000

### Produção

```bash
npm run deploy:prod
```

Este comando irá:
1. Gerar o cliente Prisma
2. Executar as migrações do banco de dados
3. Construir o aplicativo
4. Iniciar o servidor de produção

## Scripts disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento
- `npm run build`: Constrói o aplicativo para produção
- `npm run start`: Inicia o servidor de produção
- `npm run lint`: Executa o linter
- `npm run prisma:generate`: Gera o cliente Prisma
- `npm run prisma:migrate`: Executa as migrações do banco de dados
- `npm run prisma:studio`: Abre o Prisma Studio para gerenciar o banco de dados
- `npm run deploy:prod`: Executa o processo completo de implantação em produção

## Estrutura do projeto

- `/src/app`: Componentes e páginas da aplicação Next.js
- `/src/components`: Componentes reutilizáveis
- `/prisma`: Configuração e migrações do Prisma
- `/public`: Arquivos estáticos 