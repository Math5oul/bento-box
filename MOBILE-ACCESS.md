# 📱 Como Acessar o Projeto no Celular

Este guia mostra como acessar o projeto Bento Box no seu celular ou tablet na mesma rede Wi-Fi.

## 🔍 Pré-requisitos

- Computador e celular conectados na **mesma rede Wi-Fi**
- Firewall do Windows configurado para permitir as portas 4200 e 3001

---

## 📋 Passo a Passo

### 1️⃣ Descobrir o IP do seu computador

No terminal (Git Bash ou PowerShell), execute:

```bash
ipconfig
```

Procure por **"Endereço IPv4"** na seção **"Adaptador Ethernet"** ou **"Adaptador de Rede Sem Fio Wi-Fi"**.

**Exemplo:**

```
Endereço IPv4. . . . . . . . . . . . . : 192.168.1.159
```

Seu IP atual é: **192.168.1.159**

---

### 2️⃣ Liberar as portas no Firewall do Windows

#### Opção A: Via Interface Gráfica

1. Abra o **Painel de Controle**
2. Vá em **Sistema e Segurança** → **Firewall do Windows Defender**
3. Clique em **Configurações avançadas** (à esquerda)
4. Clique em **Regras de Entrada** (à esquerda)
5. Clique em **Nova Regra...** (à direita)
6. Selecione **Porta** → Avançar
7. Selecione **TCP** e digite: **4200, 3001**
8. Selecione **Permitir a conexão**
9. Marque todas as opções (Domínio, Particular, Público)
10. Dê um nome: **Bento Box Dev Server**
11. Clique em **Concluir**

#### Opção B: Via PowerShell (Como Administrador)

```powershell
New-NetFirewallRule -DisplayName "Bento Box Angular" -Direction Inbound -LocalPort 4200 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Bento Box Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

---

### 3️⃣ Iniciar o servidor

No terminal do projeto, execute:

```bash
npm run dev:mobile
```

Aguarde até ver a mensagem:

```
➜  Local:   http://localhost:4200/
```

**Nota:** O Angular CLI nas versões mais recentes não mostra o endereço Network automaticamente, mas você ainda pode acessar via IP local.

---

### 4️⃣ Acessar no celular

No navegador do seu celular, digite:

```
http://192.168.1.159:4200
```

**Pronto!** 🎉 O projeto estará rodando no seu celular!

---

## 🔧 Solução de Problemas

### ❌ Não consegue acessar?

1. **Verifique se está na mesma rede Wi-Fi**
   - Computador e celular devem estar na mesma rede

2. **Verifique o firewall**
   - Execute o comando do PowerShell acima como administrador
   - Ou desative temporariamente o firewall para testar

3. **Verifique se o servidor está rodando**

   ```bash
   npm run dev:mobile
   ```

4. **Teste no computador primeiro**
   - Acesse `http://localhost:4200` no navegador do PC
   - Se funcionar, o problema é de rede/firewall

5. **Verifique o IP novamente**
   - Execute `ipconfig` e confirme o endereço IPv4
   - Às vezes o IP muda ao reconectar no Wi-Fi

### 🐌 Está lento?

- Isso é normal! A primeira vez carrega mais devagar
- O hot-reload também funciona no celular
- Se estiver muito lento, tente:
  ```bash
  npm run build
  npx http-server dist/bento-box/browser -p 4200 --host 0.0.0.0
  ```

---

## 💡 Dicas Úteis

### Adicionar à tela inicial (PWA)

1. No navegador do celular, abra o menu (⋮)
2. Toque em **"Adicionar à tela inicial"**
3. Agora você tem um atalho como app!

### Modo de Edição no Mobile

- Os botões de hover funcionam com toque longo
- É melhor usar no computador para edições complexas
- Mas funciona perfeitamente para visualizar e testar!

### QR Code para facilitar

Você pode gerar um QR Code do endereço `http://192.168.1.159:4200` em sites como:

- https://www.qr-code-generator.com/
- https://qrcode.tec-it.com/

Assim, basta escanear o QR code no celular! 📱

---

## 🚀 Scripts Disponíveis

| Script               | Descrição                                       |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Desenvolvimento local (apenas localhost)        |
| `npm run dev:mobile` | Desenvolvimento com acesso externo (rede local) |
| `npm start`          | Apenas Angular (sem backend)                    |
| `npm run backend`    | Apenas backend (porta 3001)                     |

---

## 📝 Notas

- **Segurança**: Só faça isso em redes confiáveis (sua casa)
- **IP Dinâmico**: Se o IP mudar, atualize o endereço no celular
- **Produção**: Para produção real, use `npm run build` e um servidor apropriado

---

**Última atualização**: {{ date }}
**IP Atual**: 192.168.1.159
