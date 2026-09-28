import type { ReactNode } from "react";
import { ShareIcon } from "@/components/icons";

// Keep this text identical to docs/SETUP-GUIDES-PT.md.

export type GuideId = "android" | "iphone" | "ipad" | "pc" | "prof";

export const GUIDE_TABS: { id: GuideId; label: string }[] = [
  { id: "android", label: "Android" },
  { id: "iphone", label: "iPhone" },
  { id: "ipad", label: "iPad" },
  { id: "pc", label: "Computador" },
  { id: "prof", label: "Professor" },
];

type Step = { title: string; body: ReactNode };

const K = ({ children }: { children: ReactNode }) => <span className="kbd">{children}</span>;

const installMeetIos: Step = {
  title: "Instale o Google Meet",
  body: (
    <>
      Abra a <K>App Store</K>, procure <b>Google Meet</b> e toque em <K>Obter</K>. Abra o app uma vez e depois feche.
    </>
  ),
};

const enableIos: Step = {
  title: "Entre e ative os avisos",
  body: (
    <>
      Digite seu código de acesso. Toque em <K>Ativar avisos</K> e depois em <K>Permitir</K>.
    </>
  ),
};

const doneMobile: Step = {
  title: "Pronto!",
  body: (
    <>
      Quando a aula começar, chega um aviso. Toque no aviso e depois no botão amarelo <K>Entrar na aula</K>.
    </>
  ),
};

export const GUIDES: Record<GuideId, { steps: Step[]; warning?: ReactNode }> = {
  android: {
    steps: [
      {
        title: "Instale o Google Meet",
        body: (
          <>
            Abra a <K>Play Store</K>, procure <b>Google Meet</b> e toque em <K>Instalar</K>. Abra o app uma vez e depois
            feche.
          </>
        ),
      },
      { title: "Abra o link da escola", body: "Toque no link que a escola mandou no WhatsApp. Ele abre no Chrome." },
      {
        title: "Digite seu código",
        body: (
          <>
            Coloque o código de acesso que a escola te deu e toque em <K>Entrar</K>.
          </>
        ),
      },
      {
        title: "Instale o Wiz Aula",
        body: (
          <>
            Toque em <K>Instalar aplicativo</K> quando aparecer. Se não aparecer, toque nos <K>⋮</K> no canto de cima e
            depois em <K>Adicionar à tela inicial</K>.
          </>
        ),
      },
      {
        title: "Ative os avisos",
        body: (
          <>
            Abra o Wiz Aula pelo ícone novo na tela do celular. Toque em <K>Ativar avisos</K> e depois em{" "}
            <K>Permitir</K>.
          </>
        ),
      },
      doneMobile,
    ],
  },
  iphone: {
    steps: [
      installMeetIos,
      {
        title: "Abra o link no Safari",
        body: (
          <>
            Toque no link da escola. Se ele abrir dentro do WhatsApp, toque no ícone de bússola ou em{" "}
            <K>Abrir no Safari</K>.
          </>
        ),
      },
      {
        title: "Adicione à Tela de Início",
        body: (
          <>
            Toque no botão{" "}
            <K>
              <ShareIcon />
              Compartilhar
            </K>{" "}
            (quadrado com seta para cima). Role para baixo, toque em <K>Adicionar à Tela de Início</K> e depois em{" "}
            <K>Adicionar</K>.
          </>
        ),
      },
      {
        title: "Abra pelo ícone novo",
        body: (
          <>
            Feche o Safari e abra o <b>Wiz Aula</b> pelo ícone na tela do iPhone. Isso é importante: pelo Safari os
            avisos não funcionam.
          </>
        ),
      },
      enableIos,
      doneMobile,
    ],
    warning: (
      <>
        Os avisos precisam do iOS 16.4 ou mais novo. Para ver a sua versão: <b>Ajustes › Geral › Sobre</b>.
      </>
    ),
  },
  ipad: {
    steps: [
      installMeetIos,
      {
        title: "Abra o link no Safari",
        body: (
          <>
            Toque no link da escola. Se ele abrir dentro do WhatsApp, toque em <K>Abrir no Safari</K>.
          </>
        ),
      },
      {
        title: "Adicione à Tela de Início",
        body: (
          <>
            No iPad, o botão{" "}
            <K>
              <ShareIcon />
              Compartilhar
            </K>{" "}
            fica <b>em cima, à direita</b>, ao lado do endereço. Toque nele, depois em{" "}
            <K>Adicionar à Tela de Início</K> e em <K>Adicionar</K>.
          </>
        ),
      },
      {
        title: "Abra pelo ícone novo",
        body: (
          <>
            Feche o Safari e abra o <b>Wiz Aula</b> pelo ícone na tela do iPad. Pelo Safari os avisos não funcionam.
          </>
        ),
      },
      enableIos,
      doneMobile,
    ],
    warning: (
      <>
        Os avisos precisam do iPadOS 16.4 ou mais novo. Para ver a sua versão: <b>Ajustes › Geral › Sobre</b>.
      </>
    ),
  },
  pc: {
    steps: [
      {
        title: "Use um navegador atualizado",
        body: (
          <>
            No Windows ou no Chromebook, use o <K>Google Chrome</K> ou o <K>Microsoft Edge</K>. No Mac, use o Chrome ou o{" "}
            <K>Safari</K>. Não precisa instalar o Google Meet.
          </>
        ),
      },
      {
        title: "Abra o link e entre",
        body: "Clique no link da escola e digite o código de acesso que a escola te deu.",
      },
      {
        title: "Instale o Wiz Aula",
        body: (
          <>
            No Chrome ou no Edge, clique no ícone de <K>Instalar</K> no fim da barra de endereço e confirme. No Safari do
            Mac, clique em <K>Arquivo › Adicionar ao Dock</K>.
          </>
        ),
      },
      {
        title: "Ative os avisos",
        body: (
          <>
            Clique em <K>Ativar avisos</K> e depois em <K>Permitir</K>. No Windows, confira se as notificações estão
            ligadas em <K>Configurações › Sistema › Notificações</K>.
          </>
        ),
      },
      {
        title: "Na hora da aula",
        body: (
          <>
            Clique em <K>Entrar na aula</K>. O Meet abre numa nova aba. Clique em <K>Permitir</K> para câmera e microfone e
            depois em <K>Participar agora</K>.
          </>
        ),
      },
      {
        title: "Deixe o computador ligado",
        body: "Os avisos chegam com o computador ligado e conectado à internet. Um fone de ouvido ajuda a ouvir melhor a aula.",
      },
    ],
  },
  prof: {
    steps: [
      {
        title: "Crie um link fixo para cada turma",
        body: "No Google Agenda, crie um evento repetido da turma com Google Meet. O link fica o mesmo toda semana. Copie esse link.",
      },
      {
        title: "Guarde o link na turma",
        body: (
          <>
            No Wiz Aula, em <K>Professor › Turmas</K>, crie a turma e cole o link fixo.
          </>
        ),
      },
      {
        title: "Libere a entrada",
        body: (
          <>
            No Meet, abra os controles do organizador. Se a opção existir na sua conta, deixe o acesso como <K>Aberto</K>
            . Se não, aceite cada aluno quando ele pedir para participar.
          </>
        ),
      },
      {
        title: "Aula agendada",
        body: (
          <>
            Escolha dia e horário e toque em <K>Agendar</K>. O botão do aluno acende 10 minutos antes.
          </>
        ),
      },
      {
        title: "Aula relâmpago",
        body: (
          <>
            Cole o link e toque em <K>Começar agora</K>. Todos recebem o aviso na hora.
          </>
        ),
      },
      {
        title: "Terminou?",
        body: (
          <>
            Toque em <K>Encerrar</K> para o botão do aluno apagar.
          </>
        ),
      },
    ],
  },
};

export const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "Pediu para fazer login no Google",
    a: (
      <>
        Toque em <b>Participar como convidado</b>, escreva seu nome e toque em <b>Pedir para participar</b>. O professor
        deixa você entrar.
      </>
    ),
  },
  {
    q: "Abriu a loja pedindo para baixar o Meet",
    a: (
      <>
        Instale o Google Meet (passo 1) e toque de novo em <b>Entrar na aula</b>.
      </>
    ),
  },
  {
    q: "O aviso não chegou",
    a: "Abra o Wiz Aula pelo ícone da tela inicial. Nos ajustes do aparelho, confira se as notificações do Wiz Aula estão ligadas.",
  },
  {
    q: "No computador, a câmera ou o microfone não funcionam",
    a: "Clique no cadeado ao lado do endereço do site, permita câmera e microfone e recarregue a página.",
  },
  {
    q: "Crianças sem conta Google",
    a: "Podem entrar como convidadas, sem conta. O professor aceita a entrada na hora da aula.",
  },
];
