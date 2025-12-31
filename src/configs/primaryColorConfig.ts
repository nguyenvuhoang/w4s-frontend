export type PrimaryColorConfig = {
  name?: string
  light?: string
  main: string
  dark?: string
}

// Primary color config object - Vietnix Color Palette
const primaryColorConfig: PrimaryColorConfig[] = [
  {
    name: 'primary-1',
    light: '#6EC2F7',
    main: '#225087',
    dark: '#1780AC'
  },
  {
    name: 'primary-2',
    light: '#9FD7F9',
    main: '#3EAEF4',
    dark: '#225087'
  },
  {
    name: 'primary-3',
    light: '#BDC8F4',
    main: '#91A8ED',
    dark: '#5C8BED'
  },
  {
    name: 'primary-4',
    light: '#CFEBFC',
    main: '#9FD7F9',
    dark: '#6EC2F7'
  },
  {
    name: 'primary-5',
    light: '#6EC2F7',
    main: '#5C8BED',
    dark: '#1780AC'
  }
]

export default primaryColorConfig
