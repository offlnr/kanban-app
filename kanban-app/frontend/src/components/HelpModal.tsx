import { useTranslation } from 'react-i18next'

interface Props {
  onClose: () => void
}

export default function HelpModal({ onClose }: Props) {
  const { t } = useTranslation()
  const columns: string[] = t('help.columns_example', { returnObjects: true }) as string[]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <h2 className="font-semibold text-gray-900">{t('help.title')}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {[
            { titleKey: 'help.step1_title', content: (
              <>
                <p className="text-sm text-gray-600 ml-8">{t('help.step1_desc')}</p>
                <ul className="mt-2 ml-8 space-y-1.5 text-sm text-gray-600">
                  <li className="flex gap-2"><span className="text-indigo-500 font-bold shrink-0">{t('help.step1_phase')}</span><span>{t('help.step1_phase_desc')}</span></li>
                  <li className="flex gap-2"><span className="text-indigo-500 font-bold shrink-0">{t('help.step1_wp')}</span><span>{t('help.step1_wp_desc')}</span></li>
                </ul>
                <p className="mt-2 ml-8 text-xs text-gray-400">{t('help.step1_hint')}</p>
              </>
            )},
            { titleKey: 'help.step2_title', content: (
              <>
                <p className="text-sm text-gray-600 ml-8">{t('help.step2_desc')}</p>
                <div className="mt-2 ml-8 flex gap-2 flex-wrap">
                  {columns.map((s) => <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{s}</span>)}
                </div>
                <p className="mt-2 ml-8 text-xs text-gray-400">{t('help.step2_hint')}</p>
              </>
            )},
            { titleKey: 'help.step3_title', content: <p className="text-sm text-gray-600 ml-8">{t('help.step3_desc')}</p> },
            { titleKey: 'help.step4_title', content: <p className="text-sm text-gray-600 ml-8">{t('help.step4_desc')}</p> },
          ].map(({ titleKey, content }, i) => (
            <section key={titleKey}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">{i + 1}</span>
                <h3 className="font-semibold text-gray-900">{t(titleKey)}</h3>
              </div>
              {content}
            </section>
          ))}

          <section className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('help.tips_title')}</p>
            <ul className="space-y-1 text-sm text-gray-600">
              {['tip1','tip2','tip3','tip4'].map((k) => <li key={k}>• {t(`help.${k}`)}</li>)}
            </ul>
          </section>
        </div>

        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl py-2.5 text-sm transition-colors">
            {t('help.got_it')}
          </button>
        </div>
      </div>
    </div>
  )
}
