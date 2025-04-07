const { execSync } = require('child_process');

try {
  console.log('Gerando Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prisma Client gerado com sucesso!');
} catch (error) {
  console.error('Erro ao gerar Prisma Client:', error);
  process.exit(1);
} 