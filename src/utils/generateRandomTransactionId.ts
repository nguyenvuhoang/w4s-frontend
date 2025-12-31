export const generateRandomTransactionId = () => {
    const randomId = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10));
    return randomId;
};
