#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando ambiente de desenvolvimento...${NC}"

# Verificar se o arquivo .env.local existe
if [ ! -f .env.local ]; then
  echo -e "${RED}Arquivo .env.local não encontrado!${NC}"
  echo -e "${YELLOW}Criando arquivo .env.local com valores padrão...${NC}"
  
  # Criar arquivo .env.local com valores padrão
  cat > .env.local << EOL
# Configurações do NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu_secret_aqui

# Configurações do GitHub OAuth
GITHUB_ID=seu_github_id_aqui
GITHUB_SECRET=seu_github_secret_aqui

# Configurações do banco de dados
DATABASE_URL="file:./dev.db"
EOL
  
  echo -e "${GREEN}Arquivo .env.local criado com sucesso!${NC}"
  echo -e "${YELLOW}Por favor, edite o arquivo .env.local com suas credenciais reais.${NC}"
fi

# Limpar cache do Next.js
echo -e "${YELLOW}Limpando cache do Next.js...${NC}"
rm -rf .next

# Gerar Prisma Client
echo -e "${YELLOW}Gerando Prisma Client...${NC}"
npx prisma generate

# Iniciar servidor de desenvolvimento
echo -e "${GREEN}Iniciando servidor de desenvolvimento...${NC}"
NODE_ENV=development next dev 