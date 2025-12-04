
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { Agente } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Definição da ferramenta de exclusão
const deleteAgentTool: FunctionDeclaration = {
  name: 'delete_agent',
  description: 'Exclui permanentemente a ficha de um agente do banco de dados do sistema.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      agentName: {
        type: Type.STRING,
        description: 'O nome exato do agente a ser excluído.',
      },
    },
    required: ['agentName'],
  },
};

export const generateNarrativeHelp = async (
  prompt: string, 
  currentAgents: Agente[] = []
): Promise<{ text: string, toolCalls?: any[] }> => {
  try {
    // Cria uma lista de nomes para o contexto da IA
    const agentNames = currentAgents.map(a => a.nome).join(', ');
    
    const fullPrompt = `
      Contexto do Sistema:
      Você é C.R.I.S., uma IA tática da Ordem Paranormal.
      Agentes registrados no banco de dados atual: [${agentNames || 'Nenhum'}].
      
      Instruções:
      1. Se o usuário pedir para excluir, apagar ou deletar um agente, USE a ferramenta 'delete_agent'.
      2. Se o nome for ambíguo, peça confirmação.
      3. Mantenha o tom sombrio, técnico e direto.
      
      Usuário: ${prompt}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: "Você é uma IA auxiliar para gestão de agentes da Ordem Paranormal.",
        temperature: 0.7,
        tools: [{ functionDeclarations: [deleteAgentTool] }],
      }
    });

    // Extração segura do resultado
    const candidate = response.candidates?.[0];
    const text = candidate?.content?.parts?.find(p => p.text)?.text || '';
    
    // Verifica se houve chamada de função
    const functionCalls = candidate?.content?.parts
      ?.filter(p => p.functionCall)
      .map(p => p.functionCall);

    return {
      text,
      toolCalls: functionCalls && functionCalls.length > 0 ? functionCalls : undefined
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "ERRO CRÍTICO NO SISTEMA. NÃO FOI POSSÍVEL PROCESSAR A SOLICITAÇÃO." };
  }
};

export const generateCreature = async (nex: number, element: string) => {
    try {
        const prompt = `Crie uma criatura paranormal breve para Ordem Paranormal RPG.
        NEX Aproximado: ${nex}%
        Elemento Principal: ${element}
        
        Forneça: Nome, Descrição Visual (assustadora), e um Ataque Principal simplificado.
        Retorne em formato JSON.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error", error);
        return null;
    }
}

export const generateRandomAgent = async (): Promise<Partial<Agente> | null> => {
  try {
    const prompt = `
      Crie um personagem jogador completo para o RPG Ordem Paranormal.
      Gere um agente aleatório com NEX entre 5% e 50%.
      
      Retorne APENAS um objeto JSON com a seguinte estrutura estrita:
      {
        "nome": "Nome do Agente",
        "origem": "Origem (ex: Policial, Acadêmico, etc)",
        "classe": "Combatente" | "Especialista" | "Ocultista",
        "trilha": "Nome da trilha ou 'Nenhuma' se nex < 10",
        "nex": number (5 a 50),
        "patente": "Recruta" | "Operador" | "Agente Especial",
        "atributos": { "agi": number, "for": number, "int": number, "pre": number, "vig": number },
        "status": {
           "pvAtual": number, "pvMax": number, 
           "sanAtual": number, "sanMax": number,
           "peAtual": number, "peMax": number
        },
        "ataques": [ { "nome": "Arma", "teste": "2d20+5", "dano": "1d8", "critico": "19", "alcance": "Curto", "especial": "" } ],
        "habilidades": [ { "nome": "Habilidade", "custo": "1 PE", "descricao": "Efeito..." } ],
        "inventario": "String descrevendo itens iniciais e uma arma",
        "detalhes": "Breve background sombrio ou traumático de 2 frases"
      }
      
      Distribua os atributos de forma lógica para a classe.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.9
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Erro ao gerar agente:", error);
    return null;
  }
};

export const generateCharacterPortrait = async (description: string, classe: string): Promise<string | null> => {
    try {
        const prompt = `Retrato de personagem de RPG de terror moderno (Ordem Paranormal).
        Classe: ${classe}.
        Descrição: ${description}.
        Estilo: Arte digital sombria, realista, iluminação dramática, estilo 'Manhunt' ou 'Dark Investigations'.
        Fundo escuro e neutro.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }]
            }
        });

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Erro ao gerar imagem:", error);
        return null;
    }
};

export const parseAgentFromPdf = async (base64Data: string, mimeType: string = 'image/png'): Promise<Partial<Agente> | null> => {
    try {
        const prompt = `
            Você é um especialista em RPG Ordem Paranormal. 
            Analise este documento (que pode ser um PDF ou imagem de uma ficha de personagem).
            Extraia TODOS os dados possíveis e retorne um JSON compatível com a seguinte estrutura.
            Se um valor não estiver visível, deixe em branco ou 0.
            
            Estrutura JSON esperada:
            {
              "nome": "string",
              "origem": "string",
              "classe": "Combatente" | "Especialista" | "Ocultista",
              "trilha": "string",
              "nex": number,
              "patente": "string",
              "atributos": { "agi": number, "for": number, "int": number, "pre": number, "vig": number },
              "status": { "pvAtual": number, "pvMax": number, "sanAtual": number, "sanMax": number, "peAtual": number, "peMax": number },
              "defesa": number,
              "deslocamento": "string",
              "protecao": "string",
              "pericias": [ { "nome": "string", "treinamento": "Destreinado" | "Treinado" | "Veterano" | "Expert", "bonus": number } ],
              "ataques": [ { "nome": "string", "teste": "string", "dano": "string", "critico": "string", "alcance": "string", "especial": "string" } ],
              "habilidades": [ { "nome": "string", "custo": "string", "descricao": "string" } ],
              "inventario": "string",
              "detalhes": "string"
            }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { text: prompt },
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                    }
                }
            ],
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.text;
        if (!text) return null;
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini PDF/Image Parse Error", error);
        return null;
    }
};
