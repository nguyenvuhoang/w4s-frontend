export const getBase64FromPublic = async (relativePath: string): Promise<string> => {
    const response = await fetch(relativePath)
    const blob = await response.blob()

    return await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}
