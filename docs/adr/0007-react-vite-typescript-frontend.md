# Frontend: React 18 + Vite + TypeScript

React 18 com Vite pra dev server instantâneo e build otimizado, TypeScript strict pra type safety. Stack mínimo pra SPA: React Router (rotas), sem SSR, sem meta-framework. Alternativa: Next.js — overkill pra Planning Poker que é puro client real-time sem SEO nem SSR. Trade-off: React 18 exige cuidado com renderização em updates de WebSocket frequentes (memos, selectors Zustand); não usar Context API pra sala state — vira gargalo.
