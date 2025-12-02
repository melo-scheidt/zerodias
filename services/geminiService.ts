
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { Agente } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
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
        "inventario": "String descrevendo itens iniciais e uma arma",
        "detalhes": "Breve background sombrio ou traumático de 2 frases"
      }
      
      Distribua os atributos de forma lógica para a classe (Total de pontos de atributo: 5 a 10).
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

export const generateCharacterPortrait = async (description: string, className: string): Promise<string | null> => {
  try {
    const prompt = `A highly detailed, cinematic character portrait of a ${className} from a modern dark fantasy horror RPG (Ordem Paranormal style).
    Dark atmosphere, dramatic lighting, gritty texture.
    Character Description: ${description}.
    The character is facing the camera, serious expression. High quality, digital art.`;

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    const base64Data = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64Data) {
      return `data:image/jpeg;base64,${base64Data}`;
    }
    return null;

  } catch (error) {
    console.error("Erro ao gerar imagem:", error);
    return null;
  }
};
