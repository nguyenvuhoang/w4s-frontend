export const xmlNodeToJson = (node: Element): any => {

    const obj: any = {};
    if (node.hasAttributes()) {
        Array.from(node.attributes).forEach(attr => {
            obj[`@${attr.name}`] = attr.value;
        });
    }
    if (node.hasChildNodes()) {
        Array.from(node.childNodes).forEach(child => {
            if (child.nodeType === 3) { // Text node
                const text = child.textContent?.trim();
                if (text) {
                    obj['#text'] = text;
                }
            } else if (child.nodeType === 1) { // Element node
                const childName = child.nodeName;
                const childJson = xmlNodeToJson(child as Element);
                if (obj[childName]) {
                    if (!Array.isArray(obj[childName])) {
                        obj[childName] = [obj[childName]];
                    }
                    obj[childName].push(childJson);
                } else {
                    obj[childName] = childJson;
                }
            }
        });
    }
    return obj;
};
