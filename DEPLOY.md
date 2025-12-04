# 📦 Guia de Deploy no Vercel

Este documento fornece instruções detalhadas para fazer o deploy da aplicação **O Outro Lado - Ordem Paranormal Companion** no Vercel.

## 🎯 Pré-requisitos

Antes de começar, você precisará:

1. **Conta no Vercel** - Crie uma conta gratuita em [vercel.com](https://vercel.com)
2. **Chave da API do Gemini** - Obtenha em [ai.google.dev](https://ai.google.dev)
3. **Git instalado** (para deploy via GitHub)
4. **Node.js 18+** (para testes locais)

## 🚀 Método 1: Deploy Direto via Vercel Dashboard

### Passo 1: Preparar o Código

1. Certifique-se de que todos os arquivos estão no diretório do projeto
2. Verifique se o arquivo `vercel.json` está presente na raiz

### Passo 2: Fazer Upload no Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique em **"Browse"** ou arraste a pasta do projeto
3. O Vercel detectará automaticamente que é um projeto Vite

### Passo 3: Configurar Variáveis de Ambiente

Antes de fazer o deploy, adicione as variáveis de ambiente:

1. Na tela de configuração do projeto, expanda **"Environment Variables"**
2. Adicione a seguinte variável:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** Sua chave da API do Gemini
   - **Environment:** Selecione todas (Production, Preview, Development)

### Passo 4: Deploy

1. Clique em **"Deploy"**
2. Aguarde o processo de build (geralmente 1-2 minutos)
3. Quando concluído, você receberá uma URL pública

## 🔗 Método 2: Deploy via GitHub (Recomendado)

### Passo 1: Criar Repositório no GitHub

1. Crie um novo repositório no GitHub
2. No terminal, dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/seu-repositorio.git
git push -u origin main
```

### Passo 2: Conectar ao Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique em **"Import Git Repository"**
3. Selecione seu repositório do GitHub
4. Autorize o Vercel a acessar o repositório

### Passo 3: Configurar o Projeto

O Vercel detectará automaticamente as configurações do Vite. Confirme:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Passo 4: Adicionar Variáveis de Ambiente

1. Expanda **"Environment Variables"**
2. Adicione:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** Sua chave da API do Gemini
   - Marque todas as opções (Production, Preview, Development)

### Passo 5: Deploy

1. Clique em **"Deploy"**
2. O Vercel fará o build e deploy automaticamente
3. Após a conclusão, você terá uma URL pública

### 🔄 Atualizações Automáticas

Com o deploy via GitHub:
- Cada push na branch `main` cria um novo deploy em produção
- Pull requests criam deploys de preview automaticamente
- Você pode visualizar e testar antes de fazer merge

## 🛠️ Método 3: Deploy via Vercel CLI

### Passo 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Passo 2: Login

```bash
vercel login
```

Siga as instruções para autenticar via email ou GitHub.

### Passo 3: Deploy

No diretório do projeto, execute:

```bash
vercel
```

Responda às perguntas:
- **Set up and deploy?** → Yes
- **Which scope?** → Selecione sua conta
- **Link to existing project?** → No
- **Project name?** → Pressione Enter ou digite um nome
- **Directory?** → Pressione Enter (usa o diretório atual)
- **Override settings?** → No

### Passo 4: Adicionar Variáveis de Ambiente

```bash
vercel env add GEMINI_API_KEY
```

Quando solicitado:
- Cole sua chave da API do Gemini
- Selecione os ambientes: Production, Preview, Development

### Passo 5: Deploy em Produção

```bash
vercel --prod
```

## ✅ Verificação Pós-Deploy

Após o deploy, verifique:

1. **Acesse a URL fornecida** pelo Vercel
2. **Teste o login** (se aplicável)
3. **Verifique as funcionalidades principais:**
   - Gerenciador de Campanhas
   - Fichas de Personagens
   - Rolador de Dados
   - Assistente de Investigador (IA)
4. **Abra o Console do navegador** (F12) e verifique se não há erros

## 🔧 Configurações Adicionais no Vercel

### Domínio Personalizado

1. Acesse o dashboard do projeto no Vercel
2. Vá em **Settings** → **Domains**
3. Adicione seu domínio personalizado
4. Configure os registros DNS conforme instruído

### Variáveis de Ambiente Adicionais

Se precisar adicionar mais variáveis:

1. **Via Dashboard:**
   - Settings → Environment Variables → Add

2. **Via CLI:**
   ```bash
   vercel env add NOME_DA_VARIAVEL
   ```

### Configurações de Build

Se precisar ajustar as configurações de build:

1. Edite o arquivo `vercel.json`
2. Faça commit e push das alterações
3. O Vercel fará redeploy automaticamente

## 🐛 Solução de Problemas

### Build Falha

**Problema:** Erro durante o build no Vercel

**Solução:**
1. Verifique se todas as dependências estão no `package.json`
2. Teste o build localmente: `npm run build`
3. Verifique os logs de erro no dashboard do Vercel

### Variável de Ambiente Não Funciona

**Problema:** A API do Gemini não responde

**Solução:**
1. Verifique se `GEMINI_API_KEY` está configurada corretamente
2. Certifique-se de que está marcada para "Production"
3. Faça um redeploy: Settings → Deployments → ... → Redeploy

### Página em Branco

**Problema:** A aplicação carrega mas mostra tela branca

**Solução:**
1. Abra o Console do navegador (F12)
2. Verifique erros de JavaScript
3. Verifique se o `base` no `vite.config.ts` está como `'/'`

### Rotas Não Funcionam

**Problema:** Erro 404 ao navegar

**Solução:**
1. Verifique se o `vercel.json` contém as regras de rewrite
2. Certifique-se de que o arquivo está na raiz do projeto

## 📊 Monitoramento

### Analytics

O Vercel oferece analytics gratuito:
1. Acesse o dashboard do projeto
2. Clique em **Analytics**
3. Visualize métricas de performance e uso

### Logs

Para visualizar logs em tempo real:

```bash
vercel logs [deployment-url]
```

Ou acesse via dashboard: Deployments → Selecione um deploy → Logs

## 🎉 Pronto!

Sua aplicação agora está no ar! Compartilhe a URL com seus jogadores e divirta-se!

## 📞 Suporte

- **Documentação do Vercel:** [vercel.com/docs](https://vercel.com/docs)
- **Comunidade Vercel:** [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Documentação do Vite:** [vitejs.dev](https://vitejs.dev)
