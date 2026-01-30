export const toLowercaseKeys = (obj: Record<string, any>) => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key.toLowerCase()] = value;
  }
  return result;
};
