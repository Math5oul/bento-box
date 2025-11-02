#!/bin/bash
# Script inteligente que configura o Angular com a URL exata do ngrok
# Uso: ./start-ngrok-smart.sh [backend|frontend]

TARGET=${1:-frontend}

echo "🚀 Iniciando configuração inteligente do ngrok..."
echo ""

# Função para cleanup
cleanup() {
    echo ""
    echo "🛑 Encerrando todos os processos..."
    pkill -f "ng serve" 2>/dev/null
    pkill -f "ts-node-dev" 2>/dev/null
    pkill -f "ngrok http" 2>/dev/null
    rm -f vite.config.temp.ts 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Inicia backend
echo "📡 Iniciando backend na porta 3001..."
npm run backend &
sleep 3

# Define a porta baseada no target
if [ "$TARGET" == "frontend" ]; then
    PORT=4200
    SERVICE="Frontend"
else
    PORT=3001
    SERVICE="Backend"
fi

# Inicia ngrok primeiro (em background silencioso)
echo "🌐 Iniciando ngrok para $SERVICE (porta $PORT)..."
ngrok http $PORT > /dev/null 2>&1 &
NGROK_PID=$!

# Aguarda ngrok inicializar
sleep 4

# Busca a URL do ngrok via API
echo "🔍 Obtendo URL do túnel ngrok..."
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Erro: Não foi possível obter a URL do ngrok!"
    echo "   Verifique se o ngrok está rodando: http://127.0.0.1:4040"
    cleanup
fi

# Extrai o hostname da URL do ngrok
NGROK_HOST=$(echo $NGROK_URL | sed 's|https://||' | sed 's|/.*||')

echo "✅ URL do ngrok obtida: $NGROK_URL"
echo "🔧 Hostname extraído: $NGROK_HOST"
echo ""

# Cria um vite.config.ts temporário com o host exato
cat > vite.config.ts << EOF
/// <reference types="vite/client" />
import { defineConfig } from 'vite';

// Configuração automática gerada pelo script
// Host do ngrok: $NGROK_HOST
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 4200,
    strictPort: false,
    allowedHosts: [
      '$NGROK_HOST',
      '.ngrok-free.dev',
      '.ngrok-free.app',
      '.ngrok.io',
      'localhost',
      '127.0.0.1'
    ],
    hmr: {
      clientPort: 443,
      protocol: 'wss'
    },
    cors: {
      origin: '*',
      credentials: true
    }
  }
});
EOF

echo "📝 Arquivo vite.config.ts atualizado com: $NGROK_HOST"
echo ""

if [ "$TARGET" == "frontend" ]; then
    echo "🎨 Iniciando frontend na porta 4200..."
    echo "⏳ Aguarde a compilação do Angular (10-15 segundos)..."
    ng serve --host 0.0.0.0 &
    FRONTEND_PID=$!

    # Aguarda o frontend compilar
    sleep 15

    # Verifica se está respondendo
    echo "🔍 Verificando se o frontend está pronto..."
    for i in {1..10}; do
        if curl -s http://localhost:4200 > /dev/null 2>&1; then
            echo "✅ Frontend está respondendo!"
            break
        fi
        if [ $i -eq 10 ]; then
            echo "⚠️  Frontend não respondeu, mas continuando..."
        fi
        sleep 2
    done
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ TUDO CONFIGURADO E RODANDO!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📊 Backend API:     http://localhost:3001"
echo "🎨 Frontend App:    http://localhost:4200"
echo "🌐 Túnel Público:   $NGROK_URL"
echo "📈 Ngrok Dashboard: http://127.0.0.1:4040"
echo ""
echo "🎯 Expondo: $SERVICE"
echo "🔧 Host configurado: $NGROK_HOST"
echo ""
echo "════════════════════════════════════════════════════════════"
echo "⚠️  IMPORTANTE: Não feche este terminal!"
echo "   Pressione Ctrl+C para encerrar tudo"
echo "════════════════════════════════════════════════════════════"
echo ""

# Mantém rodando
wait
