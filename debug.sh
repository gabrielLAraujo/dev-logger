#!/bin/bash

# Limpa o cache do Next.js
rm -rf .next

# Inicia o servidor em modo debug
NODE_OPTIONS='--inspect' npm run dev 