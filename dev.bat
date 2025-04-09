@echo off
echo Iniciando ambiente de desenvolvimento...

REM Verificar se o arquivo .env.local existe
if not exist .env.local (
  echo Arquivo .env.local nao encontrado!
  echo Criando arquivo .env.local com valores padrao...
  
  REM Criar arquivo .env.local com valores padrão
  (
    echo # Configuracoes do NextAuth
    echo NEXTAUTH_URL=http://localhost:3000
    echo NEXTAUTH_SECRET=seu_secret_aqui
    echo.
    echo # Configuracoes do GitHub OAuth
    echo GITHUB_ID=seu_github_id_aqui
    echo GITHUB_SECRET=seu_github_secret_aqui
    echo.
    echo # Configuracoes do banco de dados
    echo DATABASE_URL="file:./dev.db"
  ) > .env.local
  
  echo Arquivo .env.local criado com sucesso!
  echo Por favor, edite o arquivo .env.local com suas credenciais reais.
)

REM Limpar cache do Next.js
echo Limpando cache do Next.js...
if exist .next rmdir /s /q .next

REM Gerar Prisma Client
echo Gerando Prisma Client...
npx prisma generate

REM Iniciar servidor de desenvolvimento
echo Iniciando servidor de desenvolvimento...
set NODE_ENV=development
npx next dev 