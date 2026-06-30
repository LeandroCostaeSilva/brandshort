/**
 * Validação de segurança para URLs de destino (Long URLs) na plataforma BrandShort.
 */
export async function validateUrlSecurity(
  longUrl: string,
  userId?: string,
  ip?: string
): Promise<{ isValid: boolean; status?: number; error?: string }> {
  // 1. Validar se a URL foi fornecida
  if (!longUrl) {
    return {
      isValid: false,
      status: 400,
      error: 'A URL original é obrigatória.',
    };
  }

  const trimmedUrl = longUrl.trim();

  // Camada 1: Validação Local de Protocolo (HTTPS)
  // A URL deve iniciar estritamente com https:// (case-insensitive)
  if (!trimmedUrl.toLowerCase().startsWith('https://')) {
    return {
      isValid: false,
      status: 400,
      error: 'Por motivos de segurança, apenas links com certificado HTTPS válido são permitidos na plataforma BrandShort.',
    };
  }

  // Validar se a estrutura da URL é parseável
  try {
    new URL(trimmedUrl);
  } catch {
    return {
      isValid: false,
      status: 400,
      error: 'A URL informada é inválida.',
    };
  }

  // Camada 2: Integração com Google Safe Browsing API (Lookup API v4)
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

  if (!apiKey) {
    console.warn(
      `[SECURITY WARNING] GOOGLE_SAFE_BROWSING_API_KEY não configurada. Ignorando validação externa para a URL: ${trimmedUrl}`
    );
    return { isValid: true };
  }

  try {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client: {
            clientId: 'brandshort-saas',
            clientVersion: '1.0.0',
          },
          threatInfo: {
            threatTypes: [
              'MALWARE',
              'SOCIAL_ENGINEERING',
              'UNWANTED_SOFTWARE',
              'POTENTIALLY_HARMFUL_APPLICATION',
            ],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url: trimmedUrl }],
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(
        `[SECURITY WARNING] Google Safe Browsing API respondeu com status ${response.status}. Ignorando validação externa.`
      );
      return { isValid: true };
    }

    const result = await response.json();

    // Camada 3: Tomada de Decisão e Resposta
    // Se a API retornar matches na resposta, a URL é considerada insegura.
    if (result.matches && result.matches.length > 0) {
      console.warn(
        `[SECURITY ALERT] URL bloqueada por ameaça detectada. URL: ${trimmedUrl} | User ID: ${
          userId || 'anonymous'
        } | IP: ${ip || 'unknown'} | Ameaças: ${result.matches
          .map((m: any) => m.threatType)
          .join(', ')}`
      );

      return {
        isValid: false,
        status: 403,
        error: 'A URL informada foi identificada como insegura pelos nossos sistemas de proteção contra Phishing e Malware.',
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error(
      `[SECURITY WARNING] Erro ao se conectar com a API Google Safe Browsing. Ignorando validação externa. Erro:`,
      error
    );
    // Postura segura: fail-open (permite com log de aviso)
    return { isValid: true };
  }
}
