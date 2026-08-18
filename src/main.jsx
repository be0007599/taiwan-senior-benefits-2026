import React, { memo, useDeferredValue, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Accessibility, BadgeDollarSign, BusFront, CalendarDays, ChevronDown,
  ChevronUp, CircleHelp, ExternalLink, FileCheck2, HandHeart, HeartPulse,
  History, Info, Landmark, MapPin, Phone, Search, ShieldCheck, UserRound,
} from 'lucide-react'
import { benefits, categoryNames, counties } from './data'
import { filterBenefits, likelyStatus } from './benefitSearch'
import './styles.css'

const filters = [['all', '全部'], ...Object.entries(categoryNames)]

const categoryIcons = {
  cash_assistance: BadgeDollarSign,
  health_insurance: ShieldCheck,
  healthcare: HeartPulse,
  transportation: BusFront,
  long_term_care: HandHeart,
}

function Choice({ value, onChange, options, label }) {
  return <div className="choice" role="group" aria-label={label}>
    {options.map(([key, text]) => <button key={key} type="button"
      className={value === key ? 'selected' : ''} aria-pressed={value === key}
      onClick={() => onChange(key)}>{text}</button>)}
  </div>
}

const statusLabels = {
  likely: '可能符合', confirm: '需要確認', unlikely: '資格可能不符', inactive: '已截止',
}

const verificationLabels = {
  verified: '政府資料已核驗', pending_confirmation: '待主管機關確認',
  conflicting_sources: '政府資料內容有衝突', expired: '已截止', planned: '尚未生效', needs_review: '需要重新核對',
}

const availabilityLabels = {
  available: '目前可申請', unknown: '即時狀態需確認', quota_limited: '名額或量能有限',
  closed: '目前已截止', seasonal: '期間限定',
}

function DetailRow({ icon: Icon, label, children }) {
  return <div><dt>{Icon ? <Icon aria-hidden="true" /> : null}{label}</dt><dd>{children}</dd></div>
}

function OptionalFacts({ items }) {
  const visible = items.filter(([, value]) => value !== null && value !== undefined && value !== '')
  return visible.length ? <ul className="fact-list">{visible.map(([label, value]) => <li key={label}><strong>{label}：</strong>{value}</li>)}</ul> : null
}

function amountText(benefit) {
  if (benefit.amount_twd !== null && benefit.amount_twd !== undefined) return `新臺幣 ${Number(benefit.amount_twd).toLocaleString('zh-TW')} 元`
  if (benefit.amount_twd_min !== null && benefit.amount_twd_min !== undefined && benefit.amount_twd_max !== null && benefit.amount_twd_max !== undefined) {
    return `新臺幣 ${Number(benefit.amount_twd_min).toLocaleString('zh-TW')} 至 ${Number(benefit.amount_twd_max).toLocaleString('zh-TW')} 元`
  }
  return null
}

const ResultItem = memo(function ResultItem({ program, profile, open, onToggle }) {
  const status = likelyStatus(program, profile)
  const Icon = categoryIcons[program.category] || Landmark
  const phone = program.application?.phone
  const amount = amountText(program.benefit || {})
  return <article className={`result-item ${open ? 'open' : ''}`}>
    <button className="result-summary" type="button" onClick={onToggle}
      aria-expanded={open} aria-controls={`detail-${program.program_id}`}>
      <span className="result-icon" aria-hidden="true"><Icon /></span>
      <span className="result-title">
        <strong>{program.plain_name || program.name}</strong>
        <small>{categoryNames[program.category] || program.category} ・ {program.authority}</small>
      </span>
      <span className={`status ${status}`}>{statusLabels[status]}</span>
      {open ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
    </button>
    {open && <div className="result-detail" id={`detail-${program.program_id}`}>
      {program.name !== program.plain_name && <p className="official-name"><strong>政府正式名稱：</strong>{program.name}</p>}
      <dl>
        <DetailRow icon={UserRound} label="資格重點">
          <p>{program.eligibility?.summary || '請洽主管機關確認。'}</p>
          <OptionalFacts items={[
            ['一般最低年齡', program.eligibility?.minimum_age ? `${program.eligibility.minimum_age} 歲` : null],
            ['原住民最低年齡', program.eligibility?.indigenous_minimum_age ? `${program.eligibility.indigenous_minimum_age} 歲` : null],
            ['戶籍／居住', program.eligibility?.residency], ['所得條件', program.eligibility?.income],
            ['財產條件', program.eligibility?.assets], ['身分條件', program.eligibility?.identity],
            ['評估條件', program.eligibility?.assessment], ['排除條件', program.eligibility?.exclusions],
          ]} />
        </DetailRow>
        <DetailRow icon={HandHeart} label="補助內容">
          <p>{program.benefit?.summary || '依主管機關核定。'}</p>
          <OptionalFacts items={[
            ['資料類型', program.benefit?.type], ['結構化金額', amount], ['發放／使用頻率', program.benefit?.frequency],
          ]} />
        </DetailRow>
        <DetailRow icon={Landmark} label="如何申請">
          <p>{program.application?.summary || '請洽主管機關。'}</p>
          <OptionalFacts items={[
            ['辦理方式', program.application?.automatic === true ? '依政府名冊自動辦理' : program.application?.automatic === false ? '需提出申請' : null],
            ['聯絡電話', phone],
          ]} />
        </DetailRow>
        <DetailRow icon={CalendarDays} label="有效期間">
          <OptionalFacts items={[
            ['生效日', program.validity?.effective_from || '未標定固定起日'],
            ['截止日', program.validity?.effective_to || '未標定固定截止日'],
          ]} />
        </DetailRow>
        <DetailRow icon={Info} label="名額與即時狀態">
          <p>{availabilityLabels[program.availability?.status] || program.availability?.status || '需確認'}</p>
          <OptionalFacts items={[
            ['狀態核對日', program.availability?.as_of],
            ['申請前是否須再確認', program.availability?.check_required ? '是' : '否'],
            ['說明', program.availability?.notes],
          ]} />
        </DetailRow>
        <DetailRow icon={FileCheck2} label="資料核驗">
          <p>{verificationLabels[program.verification?.status] || program.verification?.status}</p>
          <OptionalFacts items={[
            ['最後核對日', program.verification?.last_verified_at], ['核驗備註', program.verification?.notes],
            ['資料範圍', program.jurisdiction], ['政府層級', program.government_level],
            ['主管機關', program.authority], ['資料編號', program.program_id],
          ]} />
        </DetailRow>
        {program.stacking_notes ? <DetailRow icon={History} label="重複領取限制">{program.stacking_notes}</DetailRow> : null}
      </dl>
      <section className="source-section" aria-label="政府官方來源">
        <h3>政府官方來源（{program.official_sources?.length || 0}）</h3>
        <div className="source-list">{program.official_sources?.map((source, index) => <a key={`${source.url}-${index}`} className="source-link"
          href={source.url} target="_blank" rel="noreferrer">
          <span>{source.title}<small>{source.publisher} ・ {source.source_type}</small></span><ExternalLink aria-hidden="true" />
        </a>)}</div>
      </section>
      <div className="detail-footer">
        <span><CalendarDays />資料核對日：{program.verification?.last_verified_at || '待確認'}</span>
        <div className="detail-actions">
          {phone && <a className="phone-link" href={`tel:${phone}`}><Phone />撥打 {phone}</a>}
        </div>
      </div>
    </div>}
  </article>
})

function App() {
  const [profile, setProfile] = useState({
    county: '臺北市', age: 68, indigenous: 'no', income: 'general',
    disability: 'no', longTermCare: 'no',
  })
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [browseAll, setBrowseAll] = useState(false)
  const [includeExpired, setIncludeExpired] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const deferredQuery = useDeferredValue(query)

  const matches = useMemo(() => filterBenefits(benefits, {
    profile, category: filter, query: deferredQuery, browseAll, includeExpired,
  }), [profile, filter, deferredQuery, browseAll, includeExpired])

  const update = key => value => setProfile(p => ({ ...p, [key]: value }))

  return <>
    <header className="site-header">
      <div className="brand"><Accessibility aria-hidden="true" /><span>長輩福利查詢</span></div>
      <div className="trust"><ShieldCheck aria-hidden="true" />資料以政府主管機關公告為準</div>
    </header>

    <main className="app-layout">
      <section className="finder" aria-labelledby="finder-title">
        <h1 id="finder-title">找出您可能符合的福利</h1>
        <p>回答幾個簡單問題，我們會整理中央與居住縣市的福利。</p>
        <form onSubmit={e => { e.preventDefault(); document.querySelector('#results')?.focus() }}>
          <label className="field"><span><MapPin />居住縣市</span>
            <select value={profile.county} onChange={e => update('county')(e.target.value)}>
              {counties.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="field"><span><UserRound />年齡</span>
            <span className="age-input"><input type="number" min="50" max="120" value={profile.age}
              onChange={e => update('age')(e.target.value)} /><em>歲</em></span>
          </label>
          <div className="field"><span><UserRound />是否具原住民身分</span>
            <Choice label="是否具原住民身分" value={profile.indigenous} onChange={update('indigenous')} options={[["yes","是"],["no","否"]]} />
          </div>
          <div className="field"><span><BadgeDollarSign />經濟狀況</span>
            <Choice label="經濟狀況" value={profile.income} onChange={update('income')} options={[["general","一般"],["midlow","中低收入"],["low","低收入"]]} />
          </div>
          <div className="field"><span><Accessibility />是否持有身心障礙證明</span>
            <Choice label="是否持有身心障礙證明" value={profile.disability} onChange={update('disability')} options={[["yes","是"],["no","否"]]} />
          </div>
          <div className="field"><span><HandHeart />是否需要長照服務</span>
            <Choice label="是否需要長照服務" value={profile.longTermCare} onChange={update('longTermCare')} options={[["yes","是"],["no","否"],["unknown","不確定"]]} />
          </div>
          <button className="submit-button" type="submit"><Search />開始查詢</button>
        </form>
      </section>

      <section className="results" id="results" tabIndex="-1" aria-labelledby="results-title">
        <div className="results-heading"><div><h2 id="results-title">{browseAll ? '瀏覽福利資料' : '您可能符合的福利'}</h2>
          <p>共 {matches.length} 項{query ? `，搜尋「${query}」` : browseAll ? '，包含資格可能不符的項目' : '，依目前回答初步整理'}</p></div>
          <span className="county-chip">{profile.county}</span></div>
        <div className="result-tools">
          <label className="search-field"><Search aria-hidden="true" /><span className="sr-only">搜尋福利</span>
            <input type="search" value={query} onChange={event => setQuery(event.target.value)}
              placeholder="搜尋福利名稱、主管機關或資格關鍵字" />
          </label>
          <div className="browse-options">
            <label className="toggle"><input type="checkbox" checked={browseAll} onChange={event => setBrowseAll(event.target.checked)} />
              <span>瀏覽此縣市全部福利，不依資格隱藏</span></label>
            <label className="toggle"><input type="checkbox" checked={includeExpired} onChange={event => setIncludeExpired(event.target.checked)} />
              <span>包含已截止的歷史資料</span></label>
          </div>
        </div>
        <nav className="filters" aria-label="福利類別">
          {filters.map(([key, text]) => <button key={key} className={filter === key ? 'active' : ''}
            type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>{text}</button>)}
        </nav>
        <div className="result-list" aria-live="polite">
          {matches.map(program => <ResultItem key={program.program_id}
            program={program} profile={profile} open={(expanded ?? matches[0]?.program_id) === program.program_id}
            onToggle={() => setExpanded(current => (current ?? matches[0]?.program_id) === program.program_id ? '' : program.program_id)} />)}
          {matches.length === 0 && <div className="empty"><CircleHelp /><h3>目前沒有相符項目</h3><p>請調整條件，或直接洽戶籍所在地社會局（處）詢問。</p></div>}
        </div>
      </section>
    </main>

    <aside className="warning"><span aria-hidden="true">!</span><strong>申請資格與金額可能調整，送件前請再向主管機關確認。</strong></aside>
    <footer><span>目前共 {benefits.length} 筆福利資料</span><span>資料核對日：2026-08-18</span><span>長照專線：1966</span></footer>
  </>
}

const root = window.__seniorBenefitsRoot ??= createRoot(document.getElementById('root'))
root.render(<React.StrictMode><App /></React.StrictMode>)
