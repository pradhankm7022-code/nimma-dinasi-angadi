import { useParams } from 'react-router-dom'

export function useStorePath() {
  const { slug } = useParams<{ slug: string }>()
  return (path: string) => `/s/${slug}${path}`
}
