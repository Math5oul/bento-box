# 🚀 Guia Rápido - Instalação em Outro Computador

Este guia mostra como rodar o **Bento Box** em qualquer computador de forma fácil usando Docker.

## 📋 Pré-requisitos

Você só precisa ter **Docker** instalado. Nada mais!

### Instalar Docker

#### Windows

1. Baixe: [Docker Desktop para Windows](https://www.docker.com/products/docker-desktop)
2. Execute o instalador
3. Reinicie o computador se necessário
4. Abra o Docker Desktop

#### Mac

1. Baixe: [Docker Desktop para Mac](https://www.docker.com/products/docker-desktop)
2. Arraste para a pasta Applications
3. Abra o Docker Desktop

#### Linux (Ubuntu/Debian)

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Faça logout e login novamente
```

### Verificar Instalação

```bash
docker --version
docker compose version
```

Se os comandos funcionarem, você está pronto! ✅

---

## 🎯 Instalação do Bento Box

### Opção 1: Com Git (Recomendado)

```bash
# 1. Clone o repositório
git clone https://github.com/Math5oul/bento-box.git
cd bento-box

# 2. Inicie o projeto
# No Windows:
docker.bat start

# No Linux/Mac:
chmod +x docker.sh
./docker.sh start
```

### Opção 2: Download Direto (Sem Git)

1. Baixe o projeto: https://github.com/Math5oul/bento-box/archive/refs/heads/master.zip
2. Extraia o arquivo ZIP
3. Abra o terminal/prompt na pasta extraída
4. Execute:
   - **Windows**: `docker.bat start`
   - **Linux/Mac**: `chmod +x docker.sh && ./docker.sh start`

---

## ⏱️ Primeira Execução

O Docker vai:

1. ✅ Baixar as imagens necessárias (Node.js, MongoDB, Nginx)
2. ✅ Compilar o código TypeScript
3. ✅ Construir o frontend Angular
4. ✅ Iniciar os 3 containers

**Isso pode levar 5-10 minutos na primeira vez** (depois é instantâneo).

Você vai ver algo assim:

```
[+] Building 120.5s (20/20) FINISHED
[+] Running 4/4
 ✔ Network bento-network         Created
 ✔ Container bento-box-mongodb    Started
 ✔ Container bento-box-backend    Started
 ✔ Container bento-box-frontend   Started
```

---

## 🌐 Acessar a Aplicação

Após iniciar, abra seu navegador:

- **Aplicação Principal**: http://localhost
- **API Backend**: http://localhost:3001
- **Central de Manutenção**: http://localhost/maintenance-hub.html
- **Gerenciar Fillers**: http://localhost/maintenance.html

---

## 📦 Popular com Dados de Exemplo

Para adicionar produtos de exemplo no banco de dados:

```bash
# Windows
docker.bat seed

# Linux/Mac
./docker.sh seed
```

Isso vai criar vários produtos de exemplo no cardápio.

---

## 🛠️ Comandos Úteis

### Ver Logs (o que está acontecendo)

```bash
# Windows
docker.bat logs

# Linux/Mac
./docker.sh logs
```

### Ver Status dos Containers

```bash
# Windows
docker.bat status

# Linux/Mac
./docker.sh status
```

### Parar a Aplicação

```bash
# Windows
docker.bat stop

# Linux/Mac
./docker.sh stop
```

### Reiniciar

```bash
# Windows
docker.bat restart

# Linux/Mac
./docker.sh restart
```

### Backup do Banco de Dados

```bash
# Windows
docker.bat backup

# Linux/Mac
./docker.sh backup
```

---

## ❓ Problemas Comuns

### Docker não inicia

**Solução**: Certifique-se que o Docker Desktop está aberto e rodando.

### Porta 80 já está em uso

**Solução**: Edite o arquivo `docker-compose.yml` e mude a porta:

```yaml
frontend:
  ports:
    - '8080:80' # Mude 80 para 8080 ou outra porta
```

Então acesse: http://localhost:8080

### MongoDB não conecta

**Solução**: Aguarde mais tempo ou veja os logs:

```bash
docker.bat logs mongodb
```

### Rebuild após mudanças

Se você mudar o código:

```bash
# Windows
docker.bat rebuild

# Linux/Mac
./docker.sh rebuild
```

---

## 🔄 Atualizações

Para atualizar o projeto com novas mudanças:

```bash
# Com Git
git pull
docker.bat rebuild  # ou ./docker.sh rebuild

# Sem Git
# Baixe novamente, extraia e execute rebuild
```

---

## 🗑️ Desinstalar Completamente

Se quiser remover tudo:

```bash
# Windows
docker.bat clean

# Linux/Mac
./docker.sh clean
```

**⚠️ ATENÇÃO**: Isso remove TODOS os dados, incluindo produtos e uploads!

---

## 📱 Acessar de Outros Dispositivos

Para acessar de celulares/tablets na mesma rede WiFi:

1. Descubra o IP do computador:
   - **Windows**: `ipconfig` (procure IPv4)
   - **Mac/Linux**: `ifconfig` ou `ip addr`

2. No dispositivo móvel, acesse:
   - `http://SEU_IP` (exemplo: http://192.168.1.100)

---

## 🎓 Próximos Passos

Depois de instalar:

1. ✅ Acesse http://localhost
2. ✅ Execute o seed para ter dados de exemplo
3. ✅ Explore a central de manutenção
4. ✅ Crie seus próprios produtos e fillers
5. ✅ Configure backup automático (opcional)

---

## 📚 Documentação Completa

- **Docker detalhado**: [DOCKER.md](./DOCKER.md)
- **README principal**: [README.md](./README.md)
- **Upload de imagens**: [UPLOAD-IMPLEMENTATION.md](./UPLOAD-IMPLEMENTATION.md)
- **Acesso mobile**: [MOBILE-ACCESS.md](./MOBILE-ACCESS.md)

---

## 💡 Dicas

- **Performance**: A primeira execução é lenta, depois fica rápido
- **Desenvolvimento**: Use `npm run dev` se quiser editar o código
- **Produção**: Use Docker para deploy final
- **Backup**: Execute backup regularmente se usar em produção

---

## 🆘 Precisa de Ajuda?

1. Veja os logs: `docker.bat logs` ou `./docker.sh logs`
2. Verifique o status: `docker.bat status`
3. Consulte [DOCKER.md](./DOCKER.md) para troubleshooting detalhado
4. Abra uma issue no GitHub

---

**Desenvolvido por [Math5oul](https://github.com/Math5oul)** 🍱

**Versão Docker**: Pronto para produção! 🐳
