# O Outro Lado - Ordem Paranormal Companion

Aplicação companion para RPG de Ordem Paranormal, construída com React, TypeScript e Vite.

## 🚀 Deploy no Vercel

### Opção 1: Deploy via Vercel CLI

1. Instale o Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Faça login no Vercel:
   ```bash
   vercel login
   ```

3. Deploy o projeto:
   ```bash
   vercel
   ```

4. Configure a variável de ambiente no Vercel:
   - Acesse o dashboard do seu projeto no Vercel
   - Vá em **Settings** → **Environment Variables**
   - Adicione: `GEMINI_API_KEY` com sua chave da API do Gemini

### Opção 2: Deploy via GitHub

1. Faça push do código para um repositório GitHub

2. Acesse [vercel.com](https://vercel.com) e faça login

3. Clique em **Add New Project**

4. Importe seu repositório do GitHub

5. Configure as variáveis de ambiente:
   - `GEMINI_API_KEY`: Sua chave da API do Gemini

6. Clique em **Deploy**

## 💻 Desenvolvimento Local

### Pré-requisitos

- Node.js 18+ instalado

### Instalação

1. Clone o repositório

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie um arquivo `.env.local` na raiz do projeto:
   ```
   GEMINI_API_KEY=sua_chave_api_aqui
   ```

4. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

5. Abra [http://localhost:3000](http://localhost:3000) no navegador

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm run preview` - Visualiza a build de produção localmente

## 📦 Tecnologias

- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS (via CDN)
- **Google Gemini AI** - Integração com IA
- **Supabase** - Backend e banco de dados

## 🔐 Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `GEMINI_API_KEY` | Chave da API do Google Gemini | Sim |

## 📝 Estrutura do Projeto

```
.
├── components/          # Componentes React
├── services/           # Serviços (API, Database)
├── App.tsx            # Componente principal
├── constants.tsx      # Constantes da aplicação
├── types.ts           # Tipos TypeScript
├── index.tsx          # Ponto de entrada
├── index.html         # Template HTML
├── vite.config.ts     # Configuração do Vite
└── vercel.json        # Configuração do Vercel
```

## 🌐 Funcionalidades

- ✅ Gerenciador de Campanhas
- ✅ Fichas de Personagens
- ✅ Rolador de Dados
- ✅ Assistente de Investigador (IA)
- ✅ Explorador de Mapas
- ✅ Referência de Mecânicas
- ✅ Biblioteca de PDFs
- ✅ Galeria de Personagens

## 📄 Licença

Este projeto foi criado para fins educacionais e de entretenimento.
