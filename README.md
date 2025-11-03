# 🍱 Bento Box - Sistema de Grid Dinâmico para Cardápios Digitais

<p align="center">
  <img src="public/imgs/bento-logo.png" alt="Bento Box Logo" width="200"/>
</p>

<p align="center">
  <strong>Sistema inovador de gerenciamento de cardápios com grid personalizável</strong><br>
  Desenvolvido com Angular 20 + Node.js + MongoDB
</p>

<p align="center">
  <a href="#-funcionalidades">Funcionalidades</a> •
  <a href="#%EF%B8%8F-tecnologias">Tecnologias</a> •
  <a href="#-instalação">Instalação</a> •
  <a href="#-uso-do-sistema">Uso</a> •
  <a href="#-scripts-disponíveis">Scripts</a> •
  <a href="#-estrutura-do-projeto">Estrutura</a>
</p>

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Elementos Filler](#-elementos-filler---design-visual-inteligente)
- [Tecnologias](#%EF%B8%8F-tecnologias)
- [Instalação](#-instalação)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Uso do Sistema](#-uso-do-sistema)
- [Acesso Mobile](#-acesso-mobile)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Troubleshooting](#-troubleshooting)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Visão Geral

**Bento Box** é um sistema de gestão de cardápio digital para restaurantes, inspirado nas tradicionais marmitas japonesas bento. Assim como uma bento box organiza diferentes alimentos em compartimentos, nosso sistema organiza produtos em um grid dinâmico e totalmente personalizável.

### Por que Bento Box?

- 📱 **QR Code para Mesas**: Cada mesa possui um QR Code único que leva os clientes diretamente ao cardápio
- 🎨 **Grid Dinâmico e Responsivo**: Layout totalmente personalizável e adaptável a qualquer dispositivo, com produtos de diferentes tamanhos (1x1, 1x2, 2x1, 2x2)
- 👥 **Pedidos listados por Cliente**: Os pedidos são organizados por cliente, mesmo agrupados por mesa, facilitando o acompanhamento individualizado e o atendimento personalizado
- ⏩ **Avanço de Status pelo Garçom e pela Cozinha**: Os paineis do garçom e cozinha permitem avançar o status dos pedidos
- 🔄 **Edição em Tempo Real**: Reorganize produtos por drag-and-drop e veja as mudanças instantaneamente
- 🛒 **Sistema de Pedidos**: Carrinho integrado com histórico de pedidos e notificações
- 🖼️ **Gerenciamento de Imagens**: Upload e otimização automática de imagens de produtos
- 📊 **Persistência MongoDB**: Dados seguros e escaláveis

---

### ✨ Funcionalidades & Diferenciais

#### 🎨 Grid Dinâmico e Responsivo

- Grid responsivo com células configuráveis
- Tamanhos personalizados por item (colSpan x rowSpan)
- Formatos disponíveis: 1x1, 1x2, 2x1, 2x2
- Drag & Drop para reorganizar itens (Desktop e Mobile)
- Modo de edição com feedback visual em tempo real
- Auto-ajuste e otimização de layout

#### 👥 Pedidos listados por Cliente

- Os pedidos são exibidos agrupados por cliente, mesmo organizados por mesa, facilitando o acompanhamento individual e o histórico de cada cliente

#### ⏩ Avanço de Status do pedido

- Nos paineis do garçom e da cozinha é possivel avançar o status dos pedidos, igual ao dashboard da cozinha, tornando o fluxo mais ágil

#### 🍔 Gerenciamento Completo de Produtos

- ✅ Criação, edição e exclusão de produtos
- 🖼️ Upload de múltiplas imagens
- 💰 Controle de preços e promoções
- 📝 Descrições detalhadas com suporte a HTML
- 🏷️ Sistema de categorias
- 🔍 Busca e filtros avançados

#### 📱 QR Code e Mesas

- Geração automática de QR Codes para cada mesa
- Acesso direto ao cardápio via QR Code
- Identificação automática da mesa
- Regeneração de QR Codes via script

#### 🛒 Sistema de Pedidos

- Carrinho de compras interativo
- Adição de observações aos pedidos
- Controle de quantidade
- Histórico completo de pedidos
- Notificações em tempo real
- Interface intuitiva para clientes

#### � Autenticação e Autorização

- Sistema JWT para autenticação segura
- Níveis de acesso: Admin, Cozinha, Cliente
- Route Guards para proteção de rotas
- Sessões persistentes
- Logout automático por inatividade

#### 📊 Painel Administrativo

- Dashboard com estatísticas
- Gerenciamento de produtos e categorias
- Visualização de pedidos em tempo real
- Ferramentas de manutenção
- Central de testes integrada (Test Hub)
- Documentação interativa

---

> 💡 **Diferencial:** Os pedidos são listados por cliente (mesmo agrupados por mesa), facilitando o atendimento personalizado e o acompanhamento individual. O painel do garçom agora também pode avançar o status dos pedidos, igual ao dashboard da cozinha. O grid é totalmente responsivo e adaptado para mobile.

---

## 📦 Elementos Filler - Design Visual Inteligente

### O que são Fillers?

**Fillers** (preenchedores) são elementos decorativos que ocupam automaticamente espaços vazios no grid, transformando lacunas em oportunidades de design. São componentes não-interativos que adicionam personalidade e estrutura visual ao cardápio.

### Por que usar Fillers?

#### 1. 🎨 **Harmonia Visual**

Grids com espaços vazios podem parecer incompletos ou desorganizados. Fillers preenchem essas lacunas, criando uma composição visual harmoniosa e profissional.

**Exemplo de Grid:**

```
Sem Filler:          Com Filler:
┌─────┬─────┐       ┌─────┬─────┐
│ P1  │     │       │ P1  │ TXT │
├─────┼─────┤  →    ├─────┼─────┤
│ P2  │ P3  │       │ P2  │ P3  │
└─────┴─────┘       └─────┴─────┘
```

#### 2. 📖 **Storytelling Visual**

Imagens e vídeos como fillers contam histórias:

- 👨‍🍳 Foto do chef preparando o prato
- 🏠 Vídeo mostrando o ambiente do restaurante
- 🥗 Imagens dos ingredientes frescos
- ⭐ Depoimentos de clientes satisfeitos

#### 3. 👁️ **Direcionamento de Atenção**

Fillers estrategicamente posicionados guiam o olhar do cliente:

- 🔥 Texto colorido chama atenção para promoções
- 📸 Imagens grandes criam pontos focais
- 🎥 Vídeos adicionam movimento e dinamismo

#### 4. 🎯 **Branding e Identidade**

Reforce a identidade visual da marca:

- Logo da empresa
- Cores corporativas
- Slogans e mensagens
- Elementos decorativos temáticos

### Tipos de Fillers Disponíveis

#### 📝 **Texto (Filler)**

- Títulos de seções ("🔥 Mais Vendidos", "✨ Novidades")
- Descrições e informações úteis
- Promoções e ofertas especiais
- Mensagens motivacionais
- Horários e avisos

**Casos de uso:**

```
"🔥 Mais Vendidos"
"Horário: 11h às 23h"
"10% OFF na primeira compra!"
```

#### 🖼️ **Imagem (Filler)**

- Fotos decorativas do estabelecimento
- Logos e branding
- Imagens de ingredientes frescos
- Ambiente e decoração
- Banners promocionais

**Casos de uso:**

- Foto do restaurante
- Imagem de ingredientes orgânicos
- Banner de desconto sazonal

#### 🎥 **Vídeo (Filler)**

- Preparação de pratos (5-15 segundos)
- Tour virtual do estabelecimento
- Depoimentos de clientes
- Conteúdo promocional
- Receitas rápidas

**Casos de uso:**

- Vídeo mostrando como é preparado um prato especial
- Tour 360° do ambiente
- Chef apresentando o menu do dia

### Boas Práticas com Fillers

#### ✅ **Faça:**

- ✔️ Mantenha consistência no estilo (cores, fontes, tom)
- ✔️ Posicione fillers estrategicamente entre produtos
- ✔️ Use textos curtos e objetivos (máximo 2-3 linhas)
- ✔️ Escolha imagens de alta qualidade
- ✔️ Vídeos curtos (5-15 segundos)
- ✔️ Atualize conteúdo regularmente

#### ❌ **Evite:**

- ❌ Excesso de fillers que ofuscam os produtos
- ❌ Textos muito longos que não cabem bem
- ❌ Imagens de baixa qualidade ou pixelizadas
- ❌ Vídeos muito longos (acima de 20 segundos)
- ❌ Informações desatualizadas
- ❌ Cores que conflitam com a identidade visual

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

### ⚠️ Prioridade dos Produtos

**Importante:** Fillers NUNCA ofuscam os produtos principais. Eles são adicionados automaticamente apenas nos espaços disponíveis do grid que sobram após a disposição de todos os produtos. Desta forma:

- ✅ Produtos sempre têm prioridade no layout
- ✅ Fillers complementam, não competem
- ✅ Grid permanece focado no cardápio
- ✅ Design mantém harmonia visual

---

## 🛠️ Tecnologias

### Frontend

| Tecnologia     | Versão | Descrição                                |
| -------------- | ------ | ---------------------------------------- |
| **Angular**    | 20.3   | Framework frontend moderno               |
| **TypeScript** | 5.8    | Superset JavaScript com tipagem estática |
| **SCSS**       | -      | Pré-processador CSS                      |
| **RxJS**       | 7.8    | Programação reativa                      |
| **Signals**    | -      | Sistema de reatividade do Angular        |

### Backend

| Tecnologia     | Versão | Descrição                     |
| -------------- | ------ | ----------------------------- |
| **Node.js**    | 18+    | Runtime JavaScript            |
| **Express**    | 4.18   | Framework web                 |
| **TypeScript** | 5.8    | Linguagem de programação      |
| **JWT**        | 9.0    | Autenticação via tokens       |
| **Multer**     | 2.0    | Upload de arquivos            |
| **Bcrypt**     | 6.0    | Hashing de senhas             |
| **CORS**       | 2.8    | Cross-Origin Resource Sharing |

### Banco de Dados

| Tecnologia   | Versão | Descrição            |
| ------------ | ------ | -------------------- |
| **MongoDB**  | 8+     | Banco de dados NoSQL |
| **Mongoose** | 8.19   | ODM para MongoDB     |

### Ferramentas

| Ferramenta       | Descrição                    |
| ---------------- | ---------------------------- |
| **Angular CLI**  | CLI oficial do Angular       |
| **ts-node-dev**  | Desenvolvimento TypeScript   |
| **Concurrently** | Execução paralela de scripts |
| **Prettier**     | Formatação de código         |
| **Husky**        | Git hooks                    |
| **QRCode**       | Geração de QR Codes          |

---

## 🚀 Instalação

### Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- ✅ **Node.js** 18 ou superior ([Download](https://nodejs.org/))
- ✅ **MongoDB** 8 ou superior ([Download](https://www.mongodb.com/try/download/community))
- ✅ **Git** ([Download](https://git-scm.com/))
- ✅ **npm** ou **yarn** (incluído com Node.js)

### Passos de Instalação

#### 1️⃣ Clone o Repositório

```bash
git clone https://github.com/Math5oul/bento-box.git
cd bento-box
```

#### 2️⃣ Instale as Dependências

```bash
npm install
```

#### 3️⃣ Configure as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Servidor
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:4200

# MongoDB
MONGODB_URI=mongodb://localhost:27017/bento-box

# JWT
JWT_SECRET=seu_secret_aqui_mude_em_producao
JWT_EXPIRES_IN=7d

# Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

#### 4️⃣ Inicie o MongoDB

**Windows:**

```bash
mongod
```

**Linux/Mac:**

```bash
sudo systemctl start mongod
# ou
brew services start mongodb-community
```

#### 5️⃣ Inicie o Servidor de Desenvolvimento

```bash
npm run dev
```

Isso iniciará:

- 🌐 **Frontend:** http://localhost:4200
- 🔌 **Backend API:** http://localhost:3001

#### 6️⃣ Acesse o Sistema

Abra seu navegador e acesse:

```
http://localhost:4200
```

---

## 📜 Scripts Disponíveis para desenvolvimento

| Script                       | Descrição                                 |
| ---------------------------- | ----------------------------------------- |
| `npm start`                  | Inicia apenas o Angular (porta 4200)      |
| `npm run backend`            | Inicia apenas o backend (porta 3001)      |
| `npm run dev`                | Inicia Angular + Backend simultaneamente  |
| `npm run dev:mobile`         | Dev server com acesso externo para mobile |
| `npm run build`              | Build de produção do frontend             |
| `npm run build:backend`      | Compila TypeScript do backend             |
| `npm test`                   | Executa testes unitários com Karma        |
| `npm run watch`              | Build em modo watch (desenvolvimento)     |
| `npm run regenerate:qrcodes` | Regenera QR Codes de todas as mesas       |
| `npm run format`             | Formata código com Prettier               |
| `npm run format:check`       | Verifica formatação sem modificar         |

### Exemplos de Uso

```bash
# Desenvolvimento completo (recomendado)
npm run dev

# Apenas frontend
npm start

# Apenas backend
npm run backend

# Para acesso mobile
npm run dev:mobile

# Build de produção
npm run build
npm run build:backend

# Testes
npm test

# Regenerar QR Codes
npm run regenerate:qrcodes
```

---

## 💡 Uso do Sistema

### Para Administradores

#### 1. Acesso ao Sistema

1. Acesse `http://localhost:4200`
2. Faça login com credenciais de administrador
3. Você será redirecionado para o painel admin

#### 2. Gerenciar Produtos

**Adicionar Novo Produto:**

1. Clique em **"Modo Edição"** na toolbar
2. Clique em **"Novo Item"**
3. Preencha os dados:
   - Nome do produto
   - Descrição
   - Preço
   - Categoria
   - Formato (1x1, 1x2, 2x1, 2x2)
4. Faça upload da imagem
5. Clique em **"Criar Item"**

**Editar Produto:**

1. Entre no **Modo Edição**
2. Clique no produto desejado
3. Clique em **"Editar"** na toolbar
4. Modifique os campos necessários
5. Clique em **"Salvar"**

**Deletar Produto:**

1. Entre no **Modo Edição**
2. Selecione o produto
3. Clique em **"Deletar"**
4. Confirme a ação

#### 3. Reorganizar o Grid

1. Entre no **Modo Edição**
2. Clique e arraste os produtos para reposicioná-los
3. Produtos se reorganizam automaticamente
4. Clique em **"Salvar"** para persistir no MongoDB

#### 4. Gerenciar Fillers

1. Acesse **Painel Admin → Fillers**
2. Crie fillers de texto, imagem ou vídeo
3. Configure categoria e tamanho
4. Fillers aparecem automaticamente nos espaços vazios

### Para Clientes

#### 1. Acessar o Cardápio

**Via QR Code:**

1. Escaneie o QR Code da mesa com seu smartphone
2. Você será direcionado para o cardápio automaticamente

**Acesso Direto:**

```
http://localhost:4200/table/[numero-da-mesa]
```

#### 2. Fazer Pedidos

1. Navegue pelo cardápio em grid
2. Clique em um produto para ver detalhes
3. Ajuste a quantidade
4. Adicione observações (opcional)
5. Clique em **"Adicionar ao Pedido"**

#### 3. Finalizar Pedido

1. Clique no ícone do carrinho (canto superior direito)
2. Revise os itens selecionados
3. Modifique quantidades se necessário
4. Clique em **"Finalizar Pedido"**
5. Aguarde confirmação (o pedido é enviado para a cozinha)

---

## 📱 Acesso Mobile

Para acessar o sistema pelo celular na mesma rede Wi-Fi:

### Configuração Rápida

#### 1️⃣ Execute o servidor mobile

```bash
npm run dev:mobile
```

#### 2️⃣ Descubra o IP do seu PC

**Windows:**

```bash
ipconfig
```

Procure por `IPv4 Address` da sua rede Wi-Fi.

**Linux/Mac:**

```bash
ip addr    # Linux
ifconfig   # Mac
```

#### 3️⃣ Libere as portas no firewall

**Windows Firewall:**

- Porta **4200** (Angular)
- Porta **3001** (Backend)

**Linux (ufw):**

```bash
sudo ufw allow 4200
sudo ufw allow 3001
```

#### 4️⃣ Acesse no celular

```
http://SEU_IP:4200
```

**Exemplo:**

```
http://192.168.1.100:4200
```

### Dicas

- ✅ Certifique-se de que PC e celular estão na mesma rede Wi-Fi
- ✅ Use o IP local (192.168.x.x ou 10.0.x.x)
- ✅ Desative VPNs que possam bloquear a conexão
- ✅ Verifique se o firewall não está bloqueando as portas

**Documentação completa:** Consulte `MOBILE-ACCESS.md`

---

## 📁 Estrutura do Projeto

```
bento-box/
├── backend/                      # API Node.js + Express
│   ├── server.ts                # Servidor principal
│   ├── config/
│   │   └── database.ts          # Configuração MongoDB
│   ├── middleware/
│   │   ├── auth.ts              # Autenticação JWT
│   │   ├── errorHandler.ts     # Tratamento de erros
│   │   ├── validate.ts          # Validação de dados
│   │   └── index.ts
│   ├── models/                  # Modelos Mongoose
│   │   ├── Category.ts
│   │   ├── Filler.ts
│   │   ├── Order.ts
│   │   ├── Product.ts
│   │   ├── Table.ts
│   │   ├── User.ts
│   │   └── index.ts
│   ├── routes/                  # Rotas da API
│   │   ├── admin.ts
│   │   ├── auth.ts
│   │   ├── categories.ts
│   │   ├── fillers.ts
│   │   ├── orders.ts
│   │   ├── products.ts
│   │   ├── table.ts
│   │   └── upload.ts
│   ├── scripts/                 # Scripts de manutenção
│   │   ├── check-order.ts
│   │   ├── check-orders.ts
│   │   ├── regenerate-qrcodes.ts
│   │   ├── seed-categories.ts
│   │   └── seed-products.ts
│   ├── sockets/                 # WebSockets (futuro)
│   └── utils/
│       └── jwt.ts               # Utilitários JWT
├── src/
│   ├── app/
│   │   ├── bento-module/             # Módulo principal
│   │   │   ├── bento-box/            # Componente do grid
│   │   │   ├── bento-toolbar/        # Barra de ferramentas
│   │   │   ├── header/               # Cabeçalho
│   │   │   └── new-item-modal/       # Modal de novo item
│   │   ├── components/               # Componentes
│   │   │   ├── admin-maintenance-components/
│   │   │   │   ├── docs/             # Documentação
│   │   │   │   └── test-hub/         # Central de testes
│   │   │   ├── admin-panel-components/
│   │   │   ├── cart/                 # Carrinho
│   │   │   ├── footer/
│   │   │   ├── login-modal/
│   │   │   ├── order-history/
│   │   │   └── user-menu/
│   │   ├── guards/                   # Route Guards
│   │   │   ├── admin.guard.ts
│   │   │   └── kitchen.guard.ts
│   │   ├── interfaces/               # Interfaces TypeScript
│   │   │   ├── api-response.interface.ts
│   │   │   ├── bento-box.interface.ts
│   │   │   ├── category.interface.ts
│   │   │   ├── filler.interface.ts
│   │   │   ├── order.interface.ts
│   │   │   ├── product.interface.ts
│   │   │   ├── table.interface.ts
│   │   │   ├── user.interface.ts
│   │   │   └── index.ts
│   │   ├── services/                 # Serviços Angular
│   │   │   ├── auth-service/
│   │   │   ├── cart-service/
│   │   │   ├── category-service/
│   │   │   ├── filler-service/
│   │   │   ├── grid-service/
│   │   │   └── image-upload/
│   │   ├── pipes/
│   │   │   └── sanitize.pipe.ts
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── assets/                       # Assets estáticos
│   │   ├── images/
│   │   └── sounds/
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── public/                      # Arquivos públicos
│   ├── maintenance.html        # Página de manutenção
│   └── imgs/                   # Logos e imagens públicas
│       ├── bento-logo.png
│       └── bento-logo-mini.png
├── uploads/                    # Uploads de usuários (gerado)
├── angular.json               # Configuração Angular
├── package.json               # Dependências npm
├── tsconfig.json              # Config TypeScript principal
├── tsconfig.app.json          # Config TS frontend
├── tsconfig.backend.json      # Config TS backend
├── proxy.conf.json            # Configuração proxy
├── .env                       # Variáveis de ambiente (criar)
├── .env.example               # Exemplo de .env
├── LICENSE                    # Licença proprietária
└── README.md                  # Este arquivo
```

---

## 🔧 Troubleshooting

### ❌ Erro: "ECONNREFUSED" no proxy

**Sintomas:**

```
[vite] http proxy error: /api/categories
AggregateError [ECONNREFUSED]
```

**Causa:** Backend não está rodando ou não acessível na porta 3001.

**Solução:**

```bash
# Certifique-se de que o backend está rodando
npm run backend

# Ou use o comando completo
npm run dev
```

---

### ❌ Erro: MongoDB Connection Failed

**Sintomas:**

```
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

**Causa:** MongoDB não está rodando ou string de conexão incorreta.

**Solução:**

```bash
# Inicie o MongoDB
mongod

# Ou no Linux
sudo systemctl start mongod

# Mac (com Homebrew)
brew services start mongodb-community

# Verifique a conexão
mongosh
```

Verifique também o `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/bento-box
```

---

### ❌ Imagens não aparecem

**Sintomas:** Produtos sem imagem ou imagens quebradas.

**Solução:**

1. Verifique se a pasta `uploads/` existe
2. Confirme permissões de leitura/escrita
3. Verifique o proxy em `proxy.conf.json`:

```json
{
  "/assets/images": {
    "target": "http://localhost:3001",
    "secure": false
  }
}
```

4. Reinicie o servidor

---

### ❌ Modo de edição não salva

**Sintomas:** Mudanças no grid não são persistidas.

**Solução:**

1. Certifique-se de clicar em **"Salvar"** após reorganizar
2. Verifique o console do navegador (F12) para erros
3. Confirme que você está autenticado como admin
4. Verifique se o backend está respondendo:

```bash
curl http://localhost:3001/api/health
```

---

### ❌ Porta já em uso

**Sintomas:**

```
Error: listen EADDRINUSE: address already in use :::4200
```

**Solução:**

**Windows:**

```bash
# Encontre o processo usando a porta
netstat -ano | findstr :4200

# Mate o processo (substitua <PID>)
taskkill /PID <PID> /F
```

**Linux/Mac:**

```bash
# Encontre o processo
lsof -ti:4200

# Mate o processo
kill -9 $(lsof -ti:4200)
```

---

### ❌ Erro de CORS

**Sintomas:**

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solução:**

Verifique a configuração CORS no backend (`backend/server.ts`):

```typescript
app.use(
  cors({
    origin: process.env['FRONTEND_URL'] || 'http://localhost:4200',
    credentials: true,
  })
);
```

---

## 🤝 Contribuindo

**Nota:** Este é um projeto proprietário. Contribuições são aceitas mas estão sujeitas aos termos da licença proprietária.

### Como Contribuir

1. **Entre em contato** com o autor para discutir a contribuição
2. **Fork** o projeto (apenas para desenvolvimento)
3. **Crie uma branch**: `git checkout -b feature/MinhaFeature`
4. **Commit** suas mudanças: `git commit -m 'Adiciona MinhaFeature'`
5. **Push** para a branch: `git push origin feature/MinhaFeature`
6. **Abra um Pull Request**

### Diretrizes de Contribuição

- ✅ Siga o estilo de código existente (use Prettier)
- ✅ Adicione testes para novas funcionalidades
- ✅ Documente mudanças significativas
- ✅ Atualize o README se necessário
- ✅ Teste localmente antes de enviar PR

### ⚠️ Importante

**Ao contribuir, você concorda em transferir os direitos autorais das contribuições para o proprietário do projeto.**

---

## 📄 Licença

**Licença Proprietária - Todos os Direitos Reservados**

Copyright © 2024-2025 **Math5oul**. Todos os direitos reservados.

Este software é proprietário e está protegido por leis de direitos autorais. O uso deste software está sujeito aos termos da licença proprietária incluída no arquivo [LICENSE](./LICENSE).

### Resumo (não substitui a licença completa)

- ❌ Você **NÃO PODE** copiar, modificar ou distribuir este software sem permissão
- ❌ Você **NÃO PODE** usar este software para fins comerciais sem licença
- ✅ Você **PODE** usar para estudo pessoal (com restrições)
- ✅ Contribuições são aceitas (direitos transferidos ao autor)

**Para licenciamento comercial, entre em contato com o autor.**

---

## 👨‍💻 Autor

**Math5oul**

- 🌐 GitHub: [@Math5oul](https://github.com/Math5oul)
- 📦 Repository: [Math5oul/bento-box](https://github.com/Math5oul/bento-box)
- 📧 Contato: [Abra uma issue](https://github.com/Math5oul/bento-box/issues)

---

## 🙏 Agradecimentos

- Inspirado nas tradicionais bento boxes japonesas 🍱
- Comunidade Angular pela documentação excelente
- MongoDB pela plataforma robusta
- Todos que contribuíram com feedback e sugestões

---

<p align="center">
  Feito com ❤️ por <a href="https://github.com/Math5oul">Math5oul</a>
</p>

<p align="center">
  <strong>⭐ Se este projeto foi útil, considere dar uma estrela!</strong>
</p>
