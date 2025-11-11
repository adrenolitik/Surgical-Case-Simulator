import { GoogleGenAI, Chat, Modality } from "@google/genai";
import { PATIENT_PERSONA_PROMPT, DATA_GENERATION_PROMPTS, EVALUATION_PROMPT } from '../constants';
import { DataTab } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let patientChat: Chat | null = null;

export function startPatientChat(): Chat {
    if (!patientChat) {
        patientChat = ai.chats.create({
            model: 'gemini-2.5-flash',
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
        return "Sorry, I'm not feeling well enough to answer that right now.";
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
            model: 'gemini-2.5-flash',
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
            model: 'gemini-2.5-pro',
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
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: 'Photorealistic portrait of a 22-year-old male student. He looks unwell, pale, and is in visible discomfort, consistent with symptoms of acute abdominal pain.',
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
        });
        return response.generatedImages[0].image.imageBytes;
    } catch (error) {
        console.error("Error generating patient image:", error);
        throw new Error("Could not generate patient image.");
    }
}


export async function generateSpeech(text: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
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
