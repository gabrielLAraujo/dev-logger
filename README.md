# Dev Logger

Uma aplicação web para rastrear automaticamente as atividades de desenvolvedores baseadas em commits do GitHub.

## 🚀 Funcionalidades

- Login com GitHub
- Dashboard protegido com dados do usuário
- Configurações personalizadas
- Monitoramento de commits
- Integração futura com Google Sheets

## 🛠️ Tecnologias

- Next.js (App Router)
- NextAuth.js
- Prisma (PostgreSQL)
- Tailwind CSS
- TypeScript

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL
- Conta no GitHub com acesso a OAuth

## 🔧 Configuração

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
- Copie o arquivo `.env.example` para `.env.local`
- Preencha as variáveis necessárias:
  - `DATABASE_URL`: URL de conexão com o PostgreSQL
  - `NEXTAUTH_URL`: URL da aplicação (ex: http://localhost:3000)
  - `NEXTAUTH_SECRET`: Chave secreta para sessões
  - `GITHUB_ID`: ID do OAuth do GitHub
  - `GITHUB_SECRET`: Secret do OAuth do GitHub

4. Configure o banco de dados:
```bash
npx prisma generate
npx prisma db push
```

## 🚀 Executando o Projeto

### Ambiente de Desenvolvimento

#### Usando os scripts automatizados:

**No macOS/Linux:**
```bash
./dev.sh
```

**No Windows:**
```bash
dev.bat
```

#### Usando os comandos npm:

**Desenvolvimento normal:**
```bash
npm run dev
```

**Desenvolvimento com geração do Prisma Client:**
```bash
npm run dev:local
```

**Desenvolvimento com limpeza de cache:**
```bash
npm run dev:clean
```

**No Windows:**
```bash
npm run dev:clean:win
```

### Build e Produção

Para criar uma build de produção:
```bash
npm run build
```

Para iniciar o servidor de produção:
```bash
npm run start
```

## 🔐 Configuração do GitHub OAuth

1. Acesse [GitHub Developer Settings](https://github.com/settings/developers)
2. Crie uma nova aplicação OAuth
3. Configure a URL de callback: `http://localhost:3000/api/auth/callback/github`
4. Copie o Client ID e Client Secret para o arquivo `.env.local`

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
