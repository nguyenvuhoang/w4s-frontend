import { Alert, AlertTitle } from '@mui/material'

type BackendPendingNoticeProps = {
  title: string
  description: string
}

/** Explains that a screen's saving action waits for a backend workflow (no API is invented or mocked). */
const BackendPendingNotice = ({ title, description }: BackendPendingNoticeProps) => (
  <Alert severity='info' variant='outlined' sx={{ borderRadius: 2 }}>
    <AlertTitle sx={{ fontWeight: 700 }}>{title}</AlertTitle>
    {description}
  </Alert>
)

export default BackendPendingNotice
