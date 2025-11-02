#!/bin/bash
# Script para iniciar backend + frontend + ngrok simultaneamente
# Uso: ./start-with-ngrok.sh [backend|frontend]

TARGET=${1:-backend}

echo "🚀 Iniciando serviços..."
echo ""

# Função para cleanup ao sair
cleanup() {
    echo ""
    echo "🛑 Encerrando todos os processos..."
    pkill -f "ng serve" 2>/dev/null
    pkill -f "ts-node-dev" 2>/dev/null
    pkill -f "ngrok http" 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Inicia backend
echo "📡 Iniciando backend na porta 3001..."
npm run backend &
BACKEND_PID=$!
sleep 3

# Inicia frontend
echo "🎨 Iniciando frontend na porta 4200..."
echo "⏳ Aguarde, o Angular está compilando (pode levar 10-15 segundos)..."
ng serve --host 0.0.0.0 &
FRONTEND_PID=$!

# Aguarda o Angular compilar
sleep 15

# Verifica se o frontend está respondendo
echo "🔍 Verificando se o frontend está pronto..."
for i in {1..10}; do
    if curl -s http://localhost:4200 > /dev/null 2>&1; then
        echo "✅ Frontend está respondendo!"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "⚠️  Frontend não respondeu após 10 tentativas"
        echo "   Continuando mesmo assim..."
    fi
    sleep 2
done

# Inicia ngrok
if [ "$TARGET" == "frontend" ]; then
    echo ""
    echo "🌐 Iniciando túnel ngrok para FRONTEND (porta 4200)..."
    PORT=4200
    SERVICE="Frontend"
else
    echo ""
    echo "🌐 Iniciando túnel ngrok para BACKEND (porta 3001)..."
    PORT=3001
    SERVICE="Backend"
fi

ngrok http $PORT &
NGROK_PID=$!

# Aguarda ngrok inicializar
sleep 3

# Busca a URL do túnel via API do ngrok
echo "🔍 Buscando URL pública do túnel..."
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo ""
    echo "⚠️  Não foi possível obter a URL automaticamente."
    echo "   Acesse http://127.0.0.1:4040 para ver a URL do túnel"
    echo ""
else
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "✅ TODOS OS SERVIÇOS RODANDO!"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "📊 Backend API:     http://localhost:3001"
    echo "🎨 Frontend App:    http://localhost:4200"
    echo "🌐 Túnel Público:   $NGROK_URL"
    echo "📈 Ngrok Dashboard: http://127.0.0.1:4040"
    echo ""
    echo "🎯 Expondo: $SERVICE via ngrok"
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "Pressione Ctrl+C para encerrar todos os processos"
    echo "════════════════════════════════════════════════════════════"
fi

echo ""

# Mantém o script rodando e mostra logs
wait
