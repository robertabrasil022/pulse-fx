import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FxRateData {
  code: string;
  bid_value: number;
  ask_value: number;
  pct_change: number | null;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rates } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prepare rate data summary for AI
    const ratesSummary = (rates as FxRateData[]).map(r => ({
      pair: r.code,
      bid: r.bid_value,
      change: r.pct_change ? `${r.pct_change > 0 ? '+' : ''}${r.pct_change.toFixed(2)}%` : 'N/A',
    }));

    const systemPrompt = `Você é um analista de câmbio especializado em commodities para o mercado brasileiro B2B.
Sua função é analisar taxas de câmbio e fornecer insights acionáveis para importadores/exportadores.

Responda SEMPRE em português brasileiro.
Seja conciso e direto ao ponto.
Foque em oportunidades e riscos reais baseados nos dados.

Formato da resposta (JSON):
{
  "summary": "Resumo geral do mercado em 1-2 frases",
  "insights": [
    {
      "title": "Título curto do insight",
      "message": "Descrição detalhada do insight (máx 2 frases)",
      "type": "opportunity" | "risk" | "neutral",
      "currency": "USD/BRL ou outro par relevante",
      "action": "Ação sugerida em 1 frase"
    }
  ],
  "recommendation": "Recomendação geral para o momento"
}

Limite: máximo 4 insights mais relevantes.`;

    const userPrompt = `Analise as seguintes taxas de câmbio atuais e gere insights para importadores/exportadores de commodities:

${JSON.stringify(ratesSummary, null, 2)}

Considere:
- Variações percentuais significativas
- Oportunidades de compra/venda
- Riscos cambiais
- Tendências de curto prazo`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar insights" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Empty response from AI");
    }

    // Parse the JSON response from AI
    let parsedInsights;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedInsights = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return a fallback response
      parsedInsights = {
        summary: "Análise de mercado temporariamente indisponível.",
        insights: [],
        recommendation: "Tente novamente em alguns instantes."
      };
    }

    return new Response(JSON.stringify(parsedInsights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("generate-fx-insights error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
