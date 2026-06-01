import { useTranslation } from 'react-i18next'

export default function LangToggle({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation()
  const isEN = i18n.language === 'en'

  const toggle = () => {
    const next = isEN ? 'es' : 'en'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  return (
    <button
      onClick={toggle}
      className={`text-xs font-semibold border rounded-lg px-2.5 py-1.5 transition-colors text-gray-500 hover:text-indigo-600 border-gray-200 hover:border-indigo-300 ${className}`}
      title={isEN ? 'Cambiar a español' : 'Switch to English'}
    >
      {isEN ? 'ES' : 'EN'}
    </button>
  )
}
