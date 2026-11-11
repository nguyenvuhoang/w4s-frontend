import type { ConfigFilesDictionary, JsonValidationResult } from '../types'

export const configFileText = (dictionary: ConfigFilesDictionary, key: string, fallback: string) =>
  dictionary.system_settings_modules?.[key] ?? fallback

const getLineColumnFromPosition = (value: string, position: number) => {
  const beforeError = value.slice(0, Math.max(0, position))
  const lines = beforeError.split('\n')

  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  }
}

export const validateJsonText = (value: string, dictionary: ConfigFilesDictionary): JsonValidationResult => {
  try {
    return {
      valid: true,
      parsed: JSON.parse(value),
      error: null
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : configFileText(dictionary, 'config_files_json_invalid', 'Invalid JSON.')
    const positionMatch = message.match(/position\s+(\d+)/i)

    if (positionMatch?.[1]) {
      const { line, column } = getLineColumnFromPosition(value, Number(positionMatch[1]))

      return {
        valid: false,
        parsed: null,
        error: configFileText(dictionary, 'config_files_json_invalid_with_line', 'Invalid JSON at line {line}, column {column}: {message}')
          .replace('{line}', String(line))
          .replace('{column}', String(column))
          .replace('{message}', message)
      }
    }

    return {
      valid: false,
      parsed: null,
      error: `${configFileText(dictionary, 'config_files_json_invalid', 'Invalid JSON.')}: ${message}`
    }
  }
}

export const formatJsonText = (value: string) => JSON.stringify(JSON.parse(value), null, 2)

