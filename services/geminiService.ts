
import { GoogleGenAI, Chat, Modality } from "@google/genai";
import { PATIENT_PERSONA_PROMPT, DATA_GENERATION_PROMPTS, EVALUATION_PROMPT } from '../constants';
import { DataTab } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let patientChat: Chat | null = null;

export function startPatientChat(): Chat {
    if (!patientChat) {
        patientChat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: PATIENT_PERSONA_PROMPT,
            },
        });
    }
    return patientChat;
}

export async function getPatientResponse(chat: Chat, message: string): Promise<string> {
    try {
        const result = await chat.sendMessage({ message });
        return result.text;
    } catch (error) {
        console.error("Error getting patient response:", error);
        return "I... I'm really hurting. Can you help me?";
    }
}

export async function generatePatientData(dataType: DataTab): Promise<string> {
    const prompt = DATA_GENERATION_PROMPTS[dataType];
    if (!prompt) {
        console.error("No prompt for data type:", dataType);
        return "Error generating data.";
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error(`Error generating ${dataType}:`, error);
        return `Error generating data for ${dataType}. Please try again.`;
    }
}

export async function evaluateDiagnosis(submission: string): Promise<string> {
    const fullPrompt = `${EVALUATION_PROMPT}\n\nStudent's Submission:\n---\n${submission}\n---`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: fullPrompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error during evaluation:", error);
        return "Error performing evaluation. Please try again.";
    }
}

export async function generatePatientImage(): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        text: 'Photorealistic medical portrait of Arjun, a 22-year-old young man from India. He has dark hair, brown eyes, and tan skin. He looks visibly unwell, pale, and in significant discomfort, holding his lower abdomen. Professional clinical photography style, emergency room background, realistic textures.',
                    },
                ],
            },
            config: {
                imageConfig: {
                    aspectRatio: "1:1"
                }
            }
        });

        let base64Image = "";
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                base64Image = part.inlineData.data;
                break;
            }
        }
        
        if (!base64Image) throw new Error("No image data in response.");
        return base64Image;
    } catch (error) {
        console.error("Error generating patient image:", error);
        throw new Error("Could not generate patient image.");
    }
}


export async function generateSpeech(text: string, voiceName: 'Kore' | 'Puck' = 'Kore'): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data returned.");
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("Could not generate speech.");
    }
}
