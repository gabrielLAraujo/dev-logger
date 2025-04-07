const { execSync } = require('child_process');

try {
  console.log('Gerando Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prisma Client gerado com sucesso!');

  console.log('Gerando Tailwind CSS...');
  execSync('npx tailwindcss init -p', { stdio: 'inherit' });
  console.log('Tailwind CSS gerado com sucesso!');
} catch (error) {
  console.error('Erro ao gerar Prisma Client ou Tailwind CSS:', error);
  process.exit(1);
} 