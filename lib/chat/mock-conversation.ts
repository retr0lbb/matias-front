import type { ChatMessage } from "./types";

export const MOCK_CHAT_TITLE = "Jogos de matemática — 6º ano";

/** Demo thread that exercises every message component on the page. */
export const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    text: "Crie uma avaliação de História para o 9º ano sobre a Guerra Fria, com base na ementa. 8 questões: 5 objetivas e 3 discursivas, com gabarito.",
    attachments: [
      { name: "Ementa_Historia_9ano.pdf", meta: "PDF · 24 páginas" },
    ],
  },
  {
    id: "m2",
    role: "assistant",
    blocks: [
      {
        type: "paragraph",
        text: "Montei a avaliação a partir da Unidade 3 da ementa (O mundo bipolar). As questões objetivas cobrem a Doutrina Truman, o Plano Marshall e a corrida espacial; as discursivas pedem análise de fontes.",
      },
      {
        type: "document",
        title: "Avaliação — Guerra Fria · 9º ano",
        detail: "Documento · 8 questões · versão 1",
        open: true,
      },
    ],
  },
  {
    id: "m3",
    role: "user",
    text: "Na questão 3, troque por uma análise do discurso da Cortina de Ferro, mais desafiadora.",
  },
  {
    id: "m4",
    role: "assistant",
    blocks: [
      {
        type: "paragraph",
        text: "Reescrevi a questão 3 com o trecho do discurso de Churchill em Fulton (1946). Agora o aluno precisa interpretar a metáfora e relacioná-la à divisão da Europa. O valor subiu para 1,5 ponto.",
      },
      { type: "change-summary", label: "1 questão alterada · versão 2" },
    ],
  },
  {
    id: "m5",
    role: "user",
    text: "Preciso de 3 jogos de matemática e estatística para o 6º ano, para fazer em grupos de 4 alunos, em uma aula de 50 minutos. A turma tem 32 alunos.",
  },
  {
    id: "m6",
    role: "assistant",
    thinking: {
      seconds: 14,
      steps: [
        {
          title: "Entendendo o pedido",
          text: "São 32 alunos em grupos de 4: 8 grupos jogando ao mesmo tempo. Em 50 minutos, cada jogo precisa caber em uns 12, com tempo para as regras e o fechamento.",
        },
        {
          title: "Conferindo a BNCC do 6º ano",
          text: "EF06MA32 pede ler e montar tabelas e gráficos; EF06MA07 e EF06MA13 cobrem frações e porcentagens. Um tema por jogo.",
        },
        {
          title: "Escolhendo os materiais",
          text: "Só o que existe em qualquer sala: dados, cartas impressas e papel quadriculado. Nada de celular.",
        },
      ],
    },
    blocks: [
      {
        type: "paragraph",
        text: "Aqui estão três jogos para 8 grupos de 4 alunos, cada um com cerca de 12 minutos:",
      },
      {
        type: "numbered-list",
        items: [
          {
            title: "Corrida das frações",
            detail:
              "Cada grupo lança dois dados e monta uma fração; a maior fração do turno avança no tabuleiro.",
          },
          {
            title: "Pesquisa relâmpago",
            detail:
              "Os grupos fazem uma pergunta à turma, anotam em tabela e desenham um gráfico de barras.",
          },
          {
            title: "Bingo das porcentagens",
            detail:
              "Cartelas com 25%, 50%, 10%… e a professora sorteia situações como “metade de 40 alunos”.",
          },
        ],
      },
    ],
  },
];
