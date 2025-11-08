# Pintoo - Plataforma de Desenho e Texto Online

![Logo do Pintoo](public/placeholder.svg)

Pintoo é uma aplicação web moderna para criação e compartilhamento de desenhos e textos. Com uma interface intuitiva e ferramentas poderosas, permite que usuários expressem sua criatividade de forma simples e eficiente.

## 🚀 Funcionalidades

- ✏️ Desenho livre com diferentes pincéis e padrões
- 🎨 Paleta de cores extensa com grupos organizados
- 📝 Editor de texto integrado
- 🖼️ Suporte a formatos de imagem
- 🌙 Tema claro/escuro
- 📱 Design responsivo para desktop e mobile
- ☁️ Salvamento automático na nuvem
- 🔄 Histórico de desenhos e textos

## 🛠️ Tecnologias

- [React](https://reactjs.org/) - Biblioteca JavaScript para interfaces
- [TypeScript](https://www.typescriptlang.org/) - Superset JavaScript tipado
- [Vite](https://vitejs.dev/) - Build tool e dev server
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utilitário
- [shadcn/ui](https://ui.shadcn.com/) - Componentes de UI reutilizáveis
- [Supabase](https://supabase.com/) - Backend e autenticação
- [React Router](https://reactrouter.com/) - Roteamento
- [React Query](https://tanstack.com/query/latest) - Gerenciamento de estado

## 🚀 Como Executar

1. Clone o repositório:
```bash
git clone https://github.com/Devgusta5/Pintoo-.git
cd Pintoo-
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```
Preencha o arquivo .env com suas credenciais do Supabase.

4. Execute o projeto:
```bash
npm run dev
```

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera a build de produção
- `npm run lint` - Executa o linter
- `npm run preview` - Visualiza a build de produção localmente

## 🗃️ Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
├── hooks/         # Hooks personalizados
├── lib/           # Utilitários e configurações
├── pages/         # Páginas da aplicação
└── integrations/  # Integrações com serviços externos
```

## 🌐 Ambiente de Produção

Para fazer deploy da aplicação:

1. Faça build do projeto:
```bash
npm run build
```

2. Teste a build localmente:
```bash
npm run preview
```

3. O diretório `dist` conterá os arquivos otimizados para produção.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request
