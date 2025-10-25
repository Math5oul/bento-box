# 📦 Como Rodar o Bento Box em Outro Computador

## Resumo Rápido

Com **Docker**, você só precisa de **3 comandos** para rodar o projeto completo em qualquer computador!

---

## Pré-requisito: Docker

### Instalar Docker Desktop

**Windows ou Mac:**
1. Baixe: https://www.docker.com/products/docker-desktop
2. Instale normalmente
3. Abra o Docker Desktop

**Linux:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

**Verificar instalação:**
```bash
docker --version
docker compose version
```

Se aparecer a versão, está pronto! ✅

---

## Instalação do Bento Box

### Método 1: Com Git

```bash
# 1. Clone
git clone https://github.com/Math5oul/bento-box.git
cd bento-box

# 2. Inicie
# Windows:
docker.bat start

# Linux/Mac:
chmod +x docker.sh
./docker.sh start
```

### Método 2: Sem Git

1. Baixe: https://github.com/Math5oul/bento-box/archive/refs/heads/master.zip
2. Extraia o ZIP
3. Abra terminal/cmd na pasta
4. Execute `docker.bat start` (Windows) ou `./docker.sh start` (Linux/Mac)

---

## Primeira Execução

⏱️ **Tempo**: 5-10 minutos (só na primeira vez)

O que acontece:
- Download das imagens Docker
- Compilação do código
- Build do frontend
- Inicialização dos containers

Depois disso, inicia em **segundos**!

---

## Acessar a Aplicação

Abra no navegador:

- **Aplicação**: http://localhost
- **API**: http://localhost:3001
- **Manutenção**: http://localhost/maintenance-hub.html

---

## Adicionar Dados de Exemplo

```bash
# Windows
docker.bat seed

# Linux/Mac
./docker.sh seed
```

---

## Comandos Principais

| Ação | Windows | Linux/Mac |
|------|---------|-----------|
| Iniciar | `docker.bat start` | `./docker.sh start` |
| Parar | `docker.bat stop` | `./docker.sh stop` |
| Ver logs | `docker.bat logs` | `./docker.sh logs` |
| Status | `docker.bat status` | `./docker.sh status` |
| Backup | `docker.bat backup` | `./docker.sh backup` |
| Seed | `docker.bat seed` | `./docker.sh seed` |

---

## Vantagens do Docker

✅ **Fácil**: 3 comandos e está rodando
✅ **Consistente**: Funciona igual em Windows, Mac e Linux
✅ **Completo**: Inclui banco de dados, backend e frontend
✅ **Isolado**: Não interfere com outras instalações
✅ **Profissional**: Pronto para produção

---

## O Que Está Incluído?

Quando você roda com Docker, você tem:

- ✅ MongoDB 8.0 (banco de dados)
- ✅ Backend Node.js/Express (API na porta 3001)
- ✅ Frontend Angular + Nginx (app na porta 80)
- ✅ Volumes persistentes (dados não são perdidos)
- ✅ Healthchecks (monitora se está funcionando)

---

## Troubleshooting

### Docker não inicia
→ Abra o Docker Desktop primeiro

### Porta 80 já está em uso
→ Edite `docker-compose.yml` e mude para 8080:
```yaml
frontend:
  ports:
    - "8080:80"
```

### Ver o que está acontecendo
```bash
docker.bat logs       # Windows
./docker.sh logs      # Linux/Mac
```

### Rebuild após mudanças
```bash
docker.bat rebuild    # Windows
./docker.sh rebuild   # Linux/Mac
```

---

## Acessar de Outros Dispositivos

Para acessar do celular/tablet na mesma rede WiFi:

1. Descubra o IP do computador:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`

2. No celular, acesse: `http://SEU_IP`
   Exemplo: `http://192.168.1.100`

---

## Documentação Completa

- 📖 [QUICK-START.md](./QUICK-START.md) - Guia passo a passo
- 🐳 [DOCKER.md](./DOCKER.md) - Documentação completa Docker
- 📚 [README.md](./README.md) - README principal
- 📄 [INSTALACAO.txt](./INSTALACAO.txt) - Checklist visual

---

## Comparação: Docker vs Manual

| Aspecto | Com Docker | Sem Docker |
|---------|-----------|------------|
| **Instalação** | 1 comando | 5+ passos |
| **Pré-requisitos** | Só Docker | Node, MongoDB, Git |
| **Tempo setup** | 10 min (1ª vez) | 30-60 min |
| **Consistência** | ✅ Sempre igual | ⚠️ Varia por máquina |
| **Produção** | ✅ Pronto | ❌ Precisa configurar |
| **Portabilidade** | ✅ Roda em qualquer lugar | ⚠️ Depende do ambiente |

---

## 🎯 Resumo Final

**Para rodar em outro computador:**

1. Instale Docker Desktop
2. Clone ou baixe o projeto
3. Execute `docker.bat start` ou `./docker.sh start`
4. Acesse http://localhost

**É isso!** 🎉

Simples, rápido e profissional.

---

**Desenvolvido por [Math5oul](https://github.com/Math5oul)** 🍱
