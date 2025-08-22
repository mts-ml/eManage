# 🏢 eManage - Sistema de Gestão Empresarial

<div align="center">
  <img src="clients/public/assets/images/eManage.png" alt="eManage Logo" width="120" height="120">
  
  <h3>Sistema completo de gestão para empresas do setor alimentício</h3>
  
  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React 19">
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript 5.8">
    <img src="https://img.shields.io/badge/Node.js-18-339933?style=for-the-badge&logo=nodedotjs" alt="Node.js 18">
    <img src="https://img.shields.io/badge/MongoDB-8-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB 8">
    <img src="https://img.shields.io/badge/Electron-37-47848F?style=for-the-badge&logo=electron" alt="Electron 37">
  </p>
</div>

---

## 📋 Índice

- [🏢 Sobre o Projeto](#-sobre-o-projeto)
- [✨ Funcionalidades](#-funcionalidades)
- [🛠️ Tecnologias Utilizadas](#️-tecnologias-utilizadas)
- [🏗️ Arquitetura](#️-arquitetura)
- [🔐 Segurança](#-segurança)
- [📱 Interface e UX](#-interface-e-ux)
- [🚀 Como Executar](#-como-executar)
- [📄 Licença](#-licença)

---

## 🏢 Sobre o Projeto

O **eManage** é um sistema de gestão empresarial completo desenvolvido especificamente para empresas do setor alimentício. O projeto combina uma aplicação web moderna com uma versão desktop usando Electron, oferecendo flexibilidade total para os usuários.

### 🎯 Objetivos do Sistema

- **Gestão completa** de clientes, fornecedores e produtos
- **Controle financeiro** com contas a pagar e receber
- **Sistema de vendas** com parcelamento e histórico
- **Gestão de compras** e controle de estoque
- **Relatórios PDF** para análise e auditoria
- **Controle de acesso** baseado em roles e permissões

---

## ✨ Funcionalidades

### 🔐 **Sistema de Autenticação**
- ✅ Login e registro de usuários
- ✅ Autenticação JWT com refresh tokens
- ✅ Controle de acesso baseado em roles (Admin, Editor, User)
- ✅ Logout seguro com invalidação de tokens
- ✅ Cookies HTTP-only para máxima segurança

### 👥 **Gestão de Pessoas**
- ✅ **Clientes**: Cadastro completo com CPF/CNPJ, endereço, contatos
- ✅ **Fornecedores**: Gestão de parceiros comerciais
- ✅ **Usuários**: Sistema de roles e permissões

### 📦 **Gestão de Produtos**
- ✅ Catálogo completo de produtos
- ✅ Controle de preços (compra e venda)
- ✅ Gestão de estoque
- ✅ Categorização por grupos
- ✅ Atualização automática de estoque

### 💰 **Sistema Financeiro**
- ✅ **Vendas**: Registro com parcelamento e histórico
- ✅ **Compras**: Gestão de fornecedores e pagamentos
- ✅ **Contas a Receber**: Acompanhamento de recebimentos
- ✅ **Contas a Pagar**: Controle de obrigações
- ✅ **Despesas**: Gestão de gastos operacionais
- ✅ **Caixa**: Visão consolidada do fluxo financeiro

### 📊 **Relatórios e Análises**
- ✅ Geração de relatórios em PDF
- ✅ Histórico completo de vendas e compras
- ✅ Controle de pagamentos em atraso
- ✅ Dashboard com métricas financeiras

---

## 🛠️ Tecnologias Utilizadas

### 🎨 **Frontend**
- **React 19** - Biblioteca para interfaces de usuário
- **TypeScript 5.8** - Tipagem estática para JavaScript
- **Vite 7** - Build tool e dev server ultra-rápido
- **Tailwind CSS 4** - Framework CSS utility-first
- **React Router DOM 7** - Roteamento client-side
- **Lucide React** - Ícones modernos e consistentes

### ⚡ **Backend**
- **Node.js** - Runtime JavaScript server-side
- **Express 5** - Framework web minimalista
- **TypeScript 5.8** - Tipagem estática
- **MongoDB** - Banco de dados NoSQL
- **Mongoose 8** - ODM para MongoDB
- **JWT** - Autenticação stateless

### ️ **Desktop App**
- **Electron 37** - Framework para apps desktop
- **Electron Builder** - Empacotamento multiplataforma

### 🔧 **Ferramentas e Bibliotecas**
- **Axios** - Cliente HTTP com interceptors
- **jsPDF** - Geração de relatórios PDF
- **bcrypt** - Hash de senhas seguro
- **Cookie Parser** - Gerenciamento de cookies
- **CORS** - Configuração de origens permitidas

---

## 🏗️ Arquitetura

### 🎯 **Padrão de Arquitetura**
- **Frontend**: Componentes funcionais com hooks React
- **Backend**: API REST com controllers, models e middleware
- **Banco**: MongoDB com Mongoose para modelagem
- **Estado**: Context API para gerenciamento global
- **Roteamento**: React Router com proteção de rotas

### 🔄 **Fluxo de Dados**
```
Frontend ↔ Context API ↔ Axios ↔ Express ↔ Mongoose ↔ MongoDB
```
## 🔐 Segurança

### 🛡️ **Medidas Implementadas**

#### **Autenticação e Autorização**
- ✅ **JWT Tokens**: Access e refresh tokens separados
- ✅ **Cookies HTTP-only**: Proteção contra XSS
- ✅ **Verificação de roles**: Controle granular de acesso
- ✅ **Validação de entrada**: Sanitização de dados
- ✅ **Hash de senhas**: bcrypt com salt

#### **Proteção de Dados**
- ✅ **Variáveis de ambiente**: Configurações sensíveis protegidas
- ✅ **CORS configurado**: Origem restrita
- ✅ **Validação de campos**: Middleware de validação
- ✅ **Sanitização**: Filtros de entrada
- ✅ **Rate limiting**: Proteção contra ataques

#### **Segurança do Cliente**
- ✅ **Context isolation**: Electron configurado
- ✅ **Node integration**: Desabilitado
- ✅ **HTTPS em produção**: Comunicação criptografada

---

## 📱 Interface e UX

### 🎨 **Design System**
- **Paleta de cores**: Esquema emerald (verde) consistente
- **Tipografia**: Hierarquia clara e legível
- **Componentes**: Design system unificado
- **Responsividade**: Adaptação para diferentes telas

### 🚀 **Experiência do Usuário**
- **Navegação intuitiva**: Cards organizados por funcionalidade
- **Feedback visual**: Estados de loading e confirmações
- **Acessibilidade**: Semântica HTML e ARIA labels
- **Performance**: Lazy loading na Home para carregamento otimizado

### 📱 **Responsividade**
- **Mobile-first**: Design otimizado para dispositivos móveis
- **Breakpoints**: Adaptação para tablets e desktops
- **Touch-friendly**: Interface otimizada para toque
---

## 🚀 Como Executar

### 📋 **Pré-requisitos**
- Node.js 18+ 
- npm ou yarn
- MongoDB rodando localmente ou Atlas
- Git

### 🔧 **Instalação e Configuração**

#### **1. Clone o repositório**
```bash
git clone https://github.com/mts-ml/eManage
cd emanage
```

#### **2. Configure o servidor**
```bash
cd server
npm install

# Crie o arquivo .env
cp .env.example .env
# Edite as variáveis de ambiente
```

#### **3. Configure o cliente**
```bash
cd ../client
npm install

# Crie o arquivo .env
cp .env.example .env
# Edite as variáveis de ambiente
```

#### **4. Execute o projeto**
```bash
# Terminal 1 - Servidor
cd server
npm run dev

# Terminal 2 - Cliente
cd client
npm run dev
```
---

#### **Desktop App**
```bash
# Windows
npm run dist:win

# macOS
npm run dist:mac

# Linux
npm run dist:linux
```

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
  <p>⭐ <strong>Se este projeto te ajudou, considere dar uma estrela!</strong> ⭐</p>
</div>
