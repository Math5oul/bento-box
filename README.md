# 🍱 BentoBox - Sistema de Grid Dinâmico para Cardápios

Sistema inovador de gerenciamento de cardápios com grid personalizável, desenvolvido com Angular 20.

🐳 **Agora com Docker!** Instale e rode em qualquer máquina com 3 comandos. [Ver guia rápido →](./QUICK-START.md)

## 📋 Índice

- [Instalação Rápida (Docker)](#-instalação-rápida-docker)
- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Elementos Filler](#elementos-filler)
- [Instalação Manual](#instalação)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Acesso Mobile](#acesso-mobile)
- [Estrutura do Projeto](#estrutura-do-projeto)

---

## 🚀 Instalação Rápida (Docker)

```bash
# 1. Clone o projeto
git clone https://github.com/Math5oul/bento-box.git
cd bento-box

# 2. Inicie (escolha seu sistema)
./docker.sh start    # Linux/Mac
docker.bat start     # Windows

# 3. Acesse
# Frontend: http://localhost
# Manutenção: http://localhost/maintenance-hub.html
```

📚 **Documentação completa**: [QUICK-START.md](./QUICK-START.md) | [DOCKER.md](./DOCKER.md)

---

## 🎯 Visão Geral

BentoBox é um sistema de gerenciamento de cardápios que permite criar layouts personalizados usando um grid dinâmico. Cada produto pode ocupar diferentes tamanhos no grid (1x1, 2x1, 2x2, etc.), criando um layout visual atraente e organizado.

### Tecnologias

- **Angular 20** - Framework frontend
- **TypeScript** - Linguagem de programação
- **Node.js + Express** - Backend API
- **MongoDB** - Banco de dados
- **SCSS** - Estilos
- **Multer** - Upload de imagens

---

## ✨ Funcionalidades

### 🎨 Grid Personalizável

- Grid responsivo com células configuráveis
- Tamanhos personalizados por item (colSpan x rowSpan)
- Drag & Drop para reorganizar itens (Desktop e Mobile)
- Modo de edição com feedback visual

### 🍔 Gerenciamento de Produtos

- Criação, edição e exclusão de produtos
- Upload de imagens para produtos
- Campos: nome, descrição, preço, imagem
- Validação de dados

### 📱 Interface Moderna

- Design responsivo
- Animações suaves
- Feedback visual intuitivo
- Suporte completo a touch (mobile)

### 🔧 Ferramentas de Desenvolvimento

- Hot reload
- Modo de edição visual
- Central de testes integrada
- Sistema de busca de produtos

---

## 📦 Elementos Filler - A Importância do Design Visual

### O que são Fillers?

**Fillers** (preenchedores) são elementos decorativos que ocupam espaços vazios no grid, transformando lacunas em oportunidades de design. São componentes não-interativos que adicionam personalidade e estrutura visual ao seu cardápio.

### Por que usar Fillers?

#### 1. **Harmonia Visual** 🎨

Grids com espaços vazios podem parecer incompletos ou desorganizados. Fillers preenchem essas lacunas, criando uma composição visual harmoniosa e profissional.

**Exemplo:**

```
Sem Filler:          Com Filler:
┌─────┬─────┐       ┌─────┬─────┐
│ P1  │     │       │ P1  │ TXT │
├─────┼─────┤  →    ├─────┼─────┤
│ P2  │ P3  │       │ P2  │ P3  │
└─────┴─────┘       └─────┴─────┘
```

#### 2. **Storytelling Visual** 📖

Imagens e vídeos como fillers contam histórias:

- Foto do chef preparando o prato
- Vídeo mostrando o ambiente do restaurante
- Imagens dos ingredientes frescos
- Depoimentos de clientes satisfeitos

#### 3. **Direcionamento de Atenção** 👁️

Fillers estrategicamente posicionados guiam o olhar do cliente:

- Texto colorido chama atenção para promoções
- Imagens grandes criam pontos focais
- Vídeos adicionam movimento e dinamismo

#### 4. **Branding e Identidade** 🎯

Reforce a identidade visual da marca:

- Logo da empresa
- Cores corporativas
- Slogans e mensagens
- Elementos decorativos temáticos

### Tipos de Fillers Disponíveis

#### 📝 **Texto (Filler)**

- Títulos de seções
- Descrições longas
- Promoções e ofertas
- Mensagens motivacionais
- Informações adicionais

**Casos de uso:**

- "🔥 Mais Vendidos"
- "Novidades da Semana"
- "Horário: 11h às 23h"

#### 🖼️ **Imagem (Filler)**

- Fotos decorativas
- Logos e branding
- Ingredientes
- Ambiente do estabelecimento
- Banners promocionais

**Casos de uso:**

- Foto do restaurante
- Imagem de ingredientes frescos
- Banner de desconto

#### 🎥 **Vídeo (Filler)**

- Preparação de pratos
- Tour virtual
- Depoimentos
- Conteúdo promocional
- Receitas rápidas

**Casos de uso:**

- Vídeo mostrando como é feito o prato
- Tour 360° do ambiente
- Chef apresentando o cardápio

### Boas Práticas com Fillers

#### ✅ Faça:

- Mantenha consistência no estilo (cores, fontes, tom)
- Posicione fillers estrategicamente entre produtos
- Use textos curtos e objetivos
- Escolha imagens de alta qualidade

#### ❌ Evite:

- Excesso de fillers que ofuscam os produtos
- Textos muito longos que não cabem bem
- Imagens de baixa qualidade ou pixelizadas
- Vídeos muito longos (mantenha entre 5-15s)
- Informações desatualizadas

### Exemplo de Layout Balanceado

```
┌─────────┬─────────┬─────────┐
│ "MENU"  │ Produto │ Produto │
│ (Texto) │    1    │    2    │
├─────────┼─────────┴─────────┤
│  Logo   │    Produto 3      │
│ (Img)   │     (2x2)         │
├─────────┼─────────┬─────────┤
│ Produto │ "Novo!" │ Produto │
│    4    │ (Texto) │    5    │
└─────────┴─────────┴─────────┘
```

## Os Fillers NUNCA ofuscam os produtos principais. Eles são adicionados automaticamente apenas nos espaços disponíveis do grid que sobrarem após a disposição de todos os produtos. Desta forma, seus produtos sempre têm prioridade e os fillers servem apenas para complementar o layout.

## 🚀 Instalação

### 🐳 Opção 1: Docker (Recomendado)

A maneira mais fácil e rápida de rodar o projeto!

**Pré-requisitos:**

- Docker e Docker Compose instalados

**Início Rápido:**

```bash
# Clone o repositório
git clone https://github.com/Math5oul/bento-box.git
cd bento-box

# Inicie com Docker (Linux/Mac)
./docker.sh start

# Ou no Windows
docker.bat start
```

Pronto! Acesse:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001
- **Manutenção**: http://localhost/maintenance-hub.html

📚 **Documentação completa**: [DOCKER.md](./DOCKER.md)

---

### 💻 Opção 2: Instalação Manual

**Pré-requisitos:**

- Node.js 18+
- MongoDB 8+
- Git

**Passos:**

1. **Clone o repositório**

```bash
git clone https://github.com/Math5oul/bento-box.git
cd bento-box
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

```bash
cp .env.example .env
# Edite .env conforme necessário
```

4. **Configure o MongoDB**

- Inicie o MongoDB localmente ou configure uma conexão remota
- O sistema criará o banco automaticamente

5. **Inicie o servidor de desenvolvimento**

```bash
npm run dev
```

6. **Acesse no navegador**

```
http://localhost:4200
```

---

## 📜 Scripts Disponíveis

| Script               | Descrição                                 |
| -------------------- | ----------------------------------------- |
| `npm start`          | Inicia apenas o Angular (sem backend)     |
| `npm run dev`        | Inicia Angular + Backend simultaneamente  |
| `npm run dev:mobile` | Dev server com acesso externo para mobile |
| `npm run backend`    | Inicia apenas o backend na porta 3001     |
| `npm run build`      | Build de produção                         |
| `npm test`           | Executa testes unitários                  |

---

## 📱 Acesso Mobile

Para acessar o projeto no celular, consulte o guia completo em [MOBILE-ACCESS.md](./MOBILE-ACCESS.md).

**Resumo rápido:**

1. Descubra o IP do seu PC: `ipconfig`
2. Libere as portas no firewall (4200 e 3001)
3. Execute: `npm run dev:mobile`
4. Acesse no celular: `http://SEU_IP:4200`

### Funcionalidades Mobile

- ✅ Drag & Drop com touch
- ✅ Interface responsiva
- ✅ Feedback visual otimizado
- ✅ Elemento ghost durante arrastar

---

## 📁 Estrutura do Projeto

```
bento-box/
├── backend/              # API Node.js + Express
│   ├── server.ts        # Servidor principal
│   ├── routes/          # Rotas da API
│   ├── models/          # Modelos MongoDB
│   └── middleware/      # Middlewares
├── src/
│   ├── app/
│   │   ├── bento-module/     # Módulo principal
│   │   │   ├── bento-box/    # Componente do grid
│   │   │   ├── bento-toolbar/# Barra de ferramentas
│   │   │   ├── cart/         # Carrinho
│   │   │   └── header/       # Cabeçalho
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── services/         # Serviços Angular
│   │   └── interfaces/       # Interfaces TypeScript
│   └── assets/               # Recursos estáticos
├── public/              # Arquivos públicos
│   ├── docs.html       # Documentação da API
│   └── test-*.html     # Páginas de teste
└── uploads/            # Imagens dos produtos
```

---

## 🎨 Guias Adicionais

- [� FILLERS-GUIDE.md](./FILLERS-GUIDE.md) - **Guia completo sobre elementos Filler**
- [�📸 IMAGES-GUIDE.md](./IMAGES-GUIDE.md) - Como gerenciar imagens
- [📱 MOBILE-ACCESS.md](./MOBILE-ACCESS.md) - Acesso em dispositivos móveis
- [📤 UPLOAD-IMPLEMENTATION.md](./UPLOAD-IMPLEMENTATION.md) - Sistema de upload

---

## 🤝 Contribuindo

**Nota**: Este é um projeto proprietário. Contribuições são aceitas mas estão sujeitas aos termos da licença proprietária.

Para contribuir:

1. Entre em contato com o autor para discutir a contribuição
2. Fork o projeto (apenas para desenvolvimento)
3. Crie uma branch (`git checkout -b feature/MinhaFeature`)
4. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
5. Push para a branch (`git push origin feature/MinhaFeature`)
6. Abra um Pull Request

**Importante**: Ao contribuir, você concorda em transferir os direitos autorais das contribuições para o proprietário do projeto.

---

## 📄 Licença

**Licença Proprietária - Todos os Direitos Reservados**

Copyright (c) 2024-2025 Math5oul. Todos os direitos reservados.

Este software é proprietário e está protegido por leis de direitos autorais. O uso deste software está sujeito aos termos da licença proprietária incluída no arquivo [LICENSE](./LICENSE).

### ⚠️ Restrições Importantes

- ❌ **Proibido uso comercial** sem licença comercial
- ❌ **Proibida redistribuição** ou sublicenciamento
- ❌ **Proibida engenharia reversa**
- ❌ **Proibido criar produtos derivados** sem autorização
- ✅ **Permitido uso para avaliação e portfólio**

### 💼 Licenças Comerciais Disponíveis

Este projeto está disponível para licenciamento comercial. Se você deseja:

- ✅ Usar em produção comercial
- ✅ Revender ou integrar em seu produto
- ✅ Customizar para seu negócio
- ✅ Suporte e atualizações

**Entre em contato para discutir opções de licenciamento:**

- GitHub: [@Math5oul](https://github.com/Math5oul)
- Consulte o arquivo [LICENSE](./LICENSE) para detalhes completos

### 📋 Tipos de Licença

1. **Licença de Uso Único** (Single Site License) - Para um estabelecimento
2. **Licença Empresarial** (Enterprise License) - Múltiplos estabelecimentos
3. **Licença de Revenda** (Reseller License) - Para revendedores
4. **Licença OEM** - Para fabricantes de equipamentos

---

## 👨‍💻 Autor

**Math5oul**

- GitHub: [@Math5oul](https://github.com/Math5oul)

---

## 🙏 Agradecimentos

- Angular Team
- MongoDB
- Comunidade de Desenvolvedores

---

**Última atualização**: Outubro 2025
