# Dev Logger

Uma aplicação para registrar e acompanhar commits do GitHub em projetos.

## Configuração do Ambiente

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
   - Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
   - Edite o arquivo `.env` com suas configurações:
     - `NEXTAUTH_URL`: URL base da aplicação (ex: http://localhost:3000)
     - `NEXTAUTH_SECRET`: Chave secreta para o NextAuth (gere uma com `openssl rand -base64 32`)
     - `GITHUB_ID`: ID do cliente OAuth do GitHub
     - `GITHUB_SECRET`: Segredo do cliente OAuth do GitHub
     - `DATABASE_URL`: URL de conexão com o banco de dados PostgreSQL
     - `NEXT_PUBLIC_APP_URL`: URL pública da aplicação
     - `NEXT_PUBLIC_HUGGINGFACE_TOKEN`: Token para acessar a API do Hugging Face (opcional, para melhorar mensagens de commit)

4. Configure o banco de dados:
```bash
npx prisma migrate dev
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Configuração do GitHub OAuth

1. Acesse [GitHub Developer Settings](https://github.com/settings/developers)
2. Clique em "New OAuth App"
3. Preencha os campos:
   - Application name: Dev Logger
   - Homepage URL: http://localhost:3000
   - Authorization callback URL: http://localhost:3000/api/auth/callback/github
4. Clique em "Register application"
5. Copie o Client ID e Client Secret para o arquivo `.env`

## Configuração do Hugging Face (opcional)

Para usar a funcionalidade de melhorar mensagens de commit:

1. Crie uma conta no [Hugging Face](https://huggingface.co/)
2. Acesse [Access Tokens](https://huggingface.co/settings/tokens)
3. Crie um novo token com permissões de leitura
4. Copie o token para o arquivo `.env` como `NEXT_PUBLIC_HUGGINGFACE_TOKEN`

## Funcionalidades

- **Autenticação com GitHub**: Login e autorização usando OAuth do GitHub
- **Gerenciamento de Projetos**: Crie e gerencie projetos para rastrear commits
- **Sincronização de Commits**: Sincronize automaticamente commits do GitHub para seus projetos
- **Relatórios de Trabalho**: Gere relatórios de trabalho com base nos commits e horários configurados
- **Exportação para Excel**: Exporte relatórios para planilhas Excel
- **Melhoria de Mensagens de Commit**: Use IA para melhorar automaticamente as mensagens de commit

## Tecnologias

- Next.js 14
- React
- TypeScript
- Prisma
- PostgreSQL
- NextAuth.js
- Tailwind CSS

## Licença

MIT 