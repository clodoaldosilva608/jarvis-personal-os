import type { BriefingData } from "@/types/briefing";

/**
 * Mocked briefing data — matches the user's reference video.
 *
 * In production these would come from real integrations:
 *   - weather: open-meteo
 *   - agenda: Google Calendar iCal
 *   - emails: Gmail API
 *   - news: Google News RSS
 *
 * For now, we ship realistic mock data so the cinematic flow works.
 *
 * The narration is split into segments — each segment triggers the
 * corresponding card to appear (progressive reveal synced with TTS).
 */

export const MORNING_BRIEFING: BriefingData = {
  date: new Date().toISOString(),
  weather: {
    location: "Maragogi",
    temp: 26.7,
    min: 23.3,
    max: 27.5,
    humidity: 78,
    rainChance: 62,
    windSpeed: 16.3,
    condition: "Parcialmente nublado",
    icon: "cloud-sun",
  },
  agenda: {
    status: "free",
    events: [],
  },
  emails: {
    total: 20,
    priorityCount: 5,
    items: [
      {
        id: "e1",
        from: "Stripe",
        subject: "Atualize seus dados comerciais",
        summary: "Solicita atualização dos dados comerciais e envio do documento antes de 22/10/2026 para evitar impacto nos pagamentos.",
        priority: "high",
        due: "2026-10-22",
      },
      {
        id: "e2",
        from: "Santander",
        subject: "Fatura próxima do vencimento",
        summary: "Fatura do cartão vence em 3 dias. Pagamento mínimo: R$ 480,00.",
        priority: "high",
      },
      {
        id: "e3",
        from: "Estreme",
        subject: "Contrato comercial",
        summary: "Revisão contratual pendente — favor responder com proposta até sexta.",
        priority: "medium",
      },
      {
        id: "e4",
        from: "C6 Bank",
        subject: "Transação suspeita",
        summary: "Detectamos uma transação incomum. Confirme se foi você.",
        priority: "high",
      },
      {
        id: "e5",
        from: "Portal e-Cidadania",
        subject: "Nova manifestação",
        summary: "Sua manifestação foi protocolada. Acompanhe o andamento no portal.",
        priority: "medium",
      },
    ],
  },
  news: [
    {
      id: "n1",
      category: "Tecnologia",
      title: "A felicidade surge quando pensamento, palavra e ação estão em harmonia.",
      source: "Correio Braziliense",
      summary: "Reflexão sobre tecnologia e bem-estar.",
      quote: "A felicidade surge quando o que você pensa, o que você diz e o que você faz estão em harmonia.",
    },
    {
      id: "n2",
      category: "Inteligência Artificial",
      title: "OpenAI freia lançamento de novo modelo",
      source: "G1",
      summary: "Empresa adia lançamento de novo modelo de IA diante de riscos de segurança identificados durante testes internos.",
    },
    {
      id: "n3",
      category: "Política",
      title: "Atlas Intel aponta mudança no cenário",
      source: "Veja · Atlas Intel",
      summary: "Pesquisa indica inflexão no discurso político nas últimas 48h, com foco em pautas econômicas.",
    },
  ],
  healthObservations: 20,
  narration: [
    {
      revealCard: "panorama",
      revealDelayMs: 200,
      text: "Bom dia, senhor. Revisei o que já está consolidado desde ontem. Sem desvios relevantes — nada exige interromper sua manhã antes do briefing.",
    },
    {
      revealCard: "weather",
      revealDelayMs: 300,
      text: "Em Maragogi, a temperatura atual é de 26,7 graus. A mínima será de 23,3 e a máxima de 27,5, com 62% de chance de chuva e umidade de 78%.",
    },
    {
      revealCard: "agenda",
      revealDelayMs: 300,
      text: "A agenda de hoje está livre, senhor. Nenhum compromisso registrado.",
    },
    {
      revealCard: "emails",
      revealDelayMs: 300,
      text: "Há 20 e-mails na caixa, dos quais cinco merecem atenção. O principal solicita a atualização dos dados comerciais e o envio do documento à Stripe antes de 22 de outubro de 2026 para evitar impacto nos pagamentos. A fatura do Santander está próxima do vencimento.",
    },
    {
      revealCard: "news",
      revealDelayMs: 400,
      text: "Nas notícias de tecnologia, destaque para uma reflexão: a felicidade surge quando o que você pensa, o que você diz e o que você faz estão em harmonia. Em inteligência artificial, a OpenAI freou o lançamento de um novo modelo diante de riscos de segurança. Na política, a Atlas Intel aponta mudança no cenário com foco em pautas econômicas.",
    },
    {
      revealCard: "health",
      revealDelayMs: 200,
      text: "Tenho 20 observações sobre seus dados de saúde. O senhor quer ouvi-las?",
    },
    {
      revealCard: "closing",
      revealDelayMs: 200,
      text: "Por ora, mantenha o foco no essencial. Estou à disposição.",
    },
  ],
};

/** Default user image (Face ID identification visual). Replace with real user photo URL. */
export const DEFAULT_USER_IMAGE = "https://i.pravatar.cc/300?img=12";
