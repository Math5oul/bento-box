# 🐳 Docker - Guia de Instalação e Uso

Este guia explica como usar Docker para rodar o **Bento Box** de forma fácil e consistente em qualquer máquina.

## 📋 Pré-requisitos

- **Docker** instalado (versão 20.10 ou superior)
- **Docker Compose** instalado (versão 2.0 ou superior)
- **Git** (para clonar o repositório)

### Instalação do Docker

- **Windows/Mac**: [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: [Docker Engine](https://docs.docker.com/engine/install/)

Verifique a instalação:

```bash
docker --version
docker compose version
```

## 🚀 Início Rápido

### 1. Clone o repositório

```bash
git clone https://github.com/Math5oul/bento-box.git
cd bento-box
```

### 2. Configure variáveis de ambiente (opcional)

Crie um arquivo `.env` na raiz do projeto:

```env
JWT_SECRET=seu-secret-jwt-super-seguro-mude-isso
```

### 3. Inicie os containers

```bash
docker compose up -d
```

### 4. Acesse a aplicação

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **MongoDB**: localhost:27017

## 📦 Arquitetura Docker

O projeto usa 3 containers:

### 1. **MongoDB** (mongo:8.0)

- Porta: `27017`
- Volume persistente: `mongodb_data`
- Database: `bento-box`

### 2. **Backend** (Node.js/Express)

- Porta: `3001`
- Volume para uploads: `uploads_data`
- Conecta ao MongoDB via network interna

### 3. **Frontend** (Angular + Nginx)

- Porta: `80`
- Proxy reverso para API `/api/*`
- Serve arquivos estáticos buildados

## 🛠️ Comandos Úteis

### Iniciar containers

```bash
docker compose up -d
```

### Parar containers

```bash
docker compose down
```

### Ver logs em tempo real

```bash
# Todos os containers
docker compose logs -f

# Apenas backend
docker compose logs -f backend

# Apenas frontend
docker compose logs -f frontend

# Apenas MongoDB
docker compose logs -f mongodb
```

### Verificar status dos containers

```bash
docker compose ps
```

### Rebuild dos containers (após mudanças no código)

```bash
docker compose up -d --build
```

### Rebuild apenas um serviço

```bash
docker compose up -d --build backend
docker compose up -d --build frontend
```

### Acessar shell de um container

```bash
# Backend
docker exec -it bento-box-backend sh

# MongoDB
docker exec -it bento-box-mongodb mongosh bento-box
```

### Limpar tudo (containers, volumes, imagens)

```bash
# Remove containers e networks
docker compose down

# Remove containers, networks E volumes (CUIDADO: apaga dados!)
docker compose down -v

# Remove também imagens
docker compose down --rmi all
```

## 🌱 Seed do Banco de Dados

Após iniciar os containers, você pode popular o banco com dados de exemplo:

```bash
# Acesse o container do backend
docker exec -it bento-box-backend sh

# Execute o seed
node dist/backend/scripts/seed-products.js

# Saia do container
exit
```

Ou em uma linha:

```bash
docker exec bento-box-backend node dist/backend/scripts/seed-products.js
```

## 📊 Monitoramento

### Healthchecks

Todos os containers têm healthchecks configurados:

```bash
# Ver status de saúde
docker compose ps
```

Status possíveis:

- `healthy` ✅ - Container funcionando corretamente
- `unhealthy` ❌ - Container com problemas
- `starting` ⏳ - Container iniciando

### Ver uso de recursos

```bash
docker stats
```

## 🔧 Desenvolvimento com Docker

### Modo de desenvolvimento com hot-reload

Para desenvolvimento, você pode usar volumes para montar o código fonte:

Crie um `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
      target: builder # Para no stage de build
    command: npm run dev
    volumes:
      - ./backend:/app/backend
      - ./server.ts:/app/server.ts
    environment:
      NODE_ENV: development

  frontend:
    image: node:20-alpine
    working_dir: /app
    command: npm start
    volumes:
      - .:/app
    ports:
      - '4200:4200'
    environment:
      NODE_ENV: development
```

Use com:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## 🗄️ Backup e Restore

### Backup do MongoDB

```bash
# Criar backup
docker exec bento-box-mongodb mongodump --db bento-box --out /data/backup

# Copiar backup para host
docker cp bento-box-mongodb:/data/backup ./backup-$(date +%Y%m%d)
```

### Restore do MongoDB

```bash
# Copiar backup para container
docker cp ./backup bento-box-mongodb:/data/restore

# Restaurar
docker exec bento-box-mongodb mongorestore --db bento-box /data/restore/bento-box
```

### Backup dos uploads

```bash
# Criar backup do volume de uploads
docker run --rm -v bento-box_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .
```

## 🔒 Segurança

### Produção

Para produção, lembre-se de:

1. **Mudar o JWT_SECRET** no `.env`
2. **Usar HTTPS** (adicione um reverse proxy como Traefik ou Nginx)
3. **Restringir portas** (não exponha MongoDB publicamente)
4. **Usar secrets** do Docker Swarm/Kubernetes para credenciais
5. **Atualizar imagens** regularmente

### Exemplo com HTTPS (Traefik)

```yaml
services:
  frontend:
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.bento.rule=Host(`seu-dominio.com`)'
      - 'traefik.http.routers.bento.entrypoints=websecure'
      - 'traefik.http.routers.bento.tls.certresolver=letsencrypt'
```

## ❓ Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker compose logs backend
docker compose logs frontend
```

### MongoDB não conecta

```bash
# Verificar se MongoDB está healthy
docker compose ps

# Ver logs do MongoDB
docker compose logs mongodb

# Testar conexão manualmente
docker exec -it bento-box-backend sh
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://mongodb:27017/bento-box').then(() => console.log('OK')).catch(e => console.error(e))"
```

### Porta já em uso

Se a porta 80 ou 3001 já estiver em uso, edite o `docker-compose.yml`:

```yaml
ports:
  - '8080:80' # Frontend na porta 8080
  - '3002:3001' # Backend na porta 3002
```

### Rebuild não funciona

```bash
# Limpe cache do Docker
docker builder prune

# Rebuild sem cache
docker compose build --no-cache
docker compose up -d
```

### Permissões de arquivo (Linux)

```bash
# Ajustar permissões do volume de uploads
docker exec -u root bento-box-backend chown -R nodejs:nodejs /app/uploads
```

## 📚 Recursos Adicionais

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Best Practices for Dockerfiles](https://docs.docker.com/develop/dev-best-practices/)

## 🎯 Próximos Passos

Após configurar o Docker:

1. ✅ Acesse http://localhost para ver a aplicação
2. ✅ Execute o seed do banco de dados
3. ✅ Acesse http://localhost/maintenance-hub.html para gerenciar fillers
4. ✅ Configure backup automático
5. ✅ Configure monitoring (Prometheus + Grafana) se necessário

---

**Desenvolvido por [Math5oul](https://github.com/Math5oul)** 🍱
