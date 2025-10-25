#!/bin/bash

# Bento Box Docker - Script de Inicialização
# Este script facilita o gerenciamento dos containers Docker

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de utilidade
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  🍱 Bento Box - Docker Manager${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Verifica se Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker não está instalado!"
        echo "Instale Docker Desktop: https://www.docker.com/products/docker-desktop"
        exit 1
    fi

    if ! command -v docker compose &> /dev/null; then
        print_error "Docker Compose não está instalado!"
        exit 1
    fi

    print_success "Docker está instalado"
}

# Inicia os containers
start() {
    print_header
    print_info "Iniciando containers..."
    docker compose up -d

    echo ""
    print_info "Aguardando containers ficarem prontos..."
    sleep 10

    echo ""
    docker compose ps

    echo ""
    print_success "Containers iniciados!"
    echo ""
    echo "🌐 Frontend: http://localhost"
    echo "🔌 Backend API: http://localhost:3001"
    echo "🗄️  MongoDB: localhost:27017"
    echo "🛠️  Maintenance: http://localhost/maintenance-hub.html"
    echo ""
    print_info "Use './docker.sh logs' para ver logs em tempo real"
}

# Para os containers
stop() {
    print_header
    print_info "Parando containers..."
    docker compose down
    print_success "Containers parados!"
}

# Restart dos containers
restart() {
    print_header
    print_info "Reiniciando containers..."
    docker compose restart
    print_success "Containers reiniciados!"
}

# Rebuild e restart
rebuild() {
    print_header
    print_info "Rebuilding containers..."
    docker compose up -d --build
    print_success "Rebuild completo!"
}

# Ver logs
logs() {
    print_header
    if [ -z "$1" ]; then
        print_info "Exibindo logs de todos os containers (Ctrl+C para sair)..."
        docker compose logs -f
    else
        print_info "Exibindo logs do container: $1 (Ctrl+C para sair)..."
        docker compose logs -f "$1"
    fi
}

# Status dos containers
status() {
    print_header
    echo "📊 Status dos Containers:"
    echo ""
    docker compose ps

    echo ""
    echo "💾 Volumes:"
    docker volume ls | grep bento-box

    echo ""
    echo "🌐 Networks:"
    docker network ls | grep bento
}

# Seed do banco de dados
seed() {
    print_header
    print_info "Executando seed do banco de dados..."

    # Verifica se backend está rodando
    if ! docker compose ps | grep -q "bento-box-backend.*Up"; then
        print_error "Backend não está rodando! Execute './docker.sh start' primeiro"
        exit 1
    fi

    docker exec bento-box-backend node dist/backend/scripts/seed-products.js
    print_success "Seed executado com sucesso!"
}

# Backup do MongoDB
backup() {
    print_header
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

    print_info "Criando backup em: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"

    docker exec bento-box-mongodb mongodump --db bento-box --out /data/backup
    docker cp bento-box-mongodb:/data/backup "$BACKUP_DIR"

    print_success "Backup criado em: $BACKUP_DIR"
}

# Limpar tudo
clean() {
    print_header
    print_error "⚠️  ATENÇÃO: Isso vai remover TODOS os containers, volumes e dados!"
    read -p "Tem certeza? (digite 'yes' para confirmar): " confirm

    if [ "$confirm" = "yes" ]; then
        print_info "Removendo containers, volumes e dados..."
        docker compose down -v --rmi all
        print_success "Limpeza completa!"
    else
        print_info "Operação cancelada"
    fi
}

# Shell no container
shell() {
    print_header
    if [ -z "$1" ]; then
        print_error "Especifique o container: backend, frontend, ou mongodb"
        exit 1
    fi

    case "$1" in
        backend)
            print_info "Abrindo shell no backend..."
            docker exec -it bento-box-backend sh
            ;;
        mongodb)
            print_info "Abrindo mongosh..."
            docker exec -it bento-box-mongodb mongosh bento-box
            ;;
        *)
            print_error "Container inválido. Use: backend, frontend, ou mongodb"
            exit 1
            ;;
    esac
}

# Ajuda
help() {
    print_header
    echo "Uso: ./docker.sh [comando] [opções]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  start          - Inicia todos os containers"
    echo "  stop           - Para todos os containers"
    echo "  restart        - Reinicia todos os containers"
    echo "  rebuild        - Rebuilda e reinicia os containers"
    echo "  logs [service] - Exibe logs (opcionalmente de um serviço específico)"
    echo "  status         - Mostra status dos containers, volumes e networks"
    echo "  seed           - Popula o banco de dados com dados de exemplo"
    echo "  backup         - Cria backup do MongoDB"
    echo "  clean          - Remove tudo (containers, volumes, dados)"
    echo "  shell [name]   - Abre shell no container (backend, mongodb)"
    echo "  help           - Exibe esta mensagem"
    echo ""
    echo "Exemplos:"
    echo "  ./docker.sh start"
    echo "  ./docker.sh logs backend"
    echo "  ./docker.sh shell mongodb"
    echo ""
}

# Main
main() {
    check_docker

    case "${1:-help}" in
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        rebuild)
            rebuild
            ;;
        logs)
            logs "$2"
            ;;
        status)
            status
            ;;
        seed)
            seed
            ;;
        backup)
            backup
            ;;
        clean)
            clean
            ;;
        shell)
            shell "$2"
            ;;
        help|*)
            help
            ;;
    esac
}

main "$@"
