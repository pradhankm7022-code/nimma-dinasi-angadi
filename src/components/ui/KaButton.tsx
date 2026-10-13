import { useLang } from '../../contexts/LangContext'

export function KaButton() {
  const { lang, toggle } = useLang()
  return (
    <button
      onClick={toggle}
      className={`text-sm font-bold px-2 py-1 rounded-lg transition-colors ${
        lang === 'kn'
          ? 'bg-green-600 text-white'
          : 'bg-gray-100 text-gray-500'
      }`}
      title={lang === 'kn' ? 'Switch to English' : 'Switch to Kannada'}
    >
      ಕ
    </button>
  )
}
