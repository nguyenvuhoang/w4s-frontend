import { xmlNodeToJson } from "./xmlNodeToJson";

export const xmlToJson = (xmlString: string) => {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        const json = xmlNodeToJson(xmlDoc.documentElement);
        return json;
    } catch (error) {
        console.error('Invalid XML string:', error);
        return {};
    }
};
