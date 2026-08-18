import React, { memo, useDeferredValue, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Accessibility, BadgeDollarSign, BusFront, CalendarDays, ChevronDown,
  ChevronUp, CircleHelp, ExternalLink, FileCheck2, Gift, HandHeart, HeartPulse,
  History, Info, Landmark, LockKeyhole, MapPin, Pencil, Phone, Search,
  ShieldCheck, UserRound,
} from 'lucide-react'
import { benefits, categoryNames, counties } from './data'
import { filterBenefits, likelyStatus } from './benefitSearch'
import './styles.css'

const commonFilters = [
  ['all', '全部'],
  ['health_insurance', '健保補助'],
  ['cash_assistance', '現金補助'],
  ['transportation', '交通優惠'],
  ['long_term_care', '長照服務'],
]
const commonFilterKeys = new Set(commonFilters.map(([key]) => key))
const moreFilters = Object.entries(categoryNames).filter(([key]) => !commonFilterKeys.has(key))

const categoryIcons = {
  cash_assistance: BadgeDollarSign,
  health_insurance: ShieldCheck,
  healthcare: HeartPulse,
  transportation: BusFront,
  long_term_care: HandHeart,
}

const statusLabels = {
  likely: '您可能符合', confirm: '需要再確認', unlikely: '資格可能不符', inactive: '已截止',
}

const verificationLabels = {
  verified: '政府資料已核驗', pending_confirmation: '待主管機關確認',
  conflicting_sources: '政府資料內容有衝突', expired: '已截止', planned: '尚未生效', needs_review: '需要重新核對',
}

const availabilityLabels = {
  available: '目前可申請', unknown: '即時狀態需確認', quota_limited: '名額或量能有限',
  closed: '目前已截止', seasonal: '期間限定',
}

const initialProfile = {
  county: '', age: '', indigenous: 'unknown', income: 'unknown',
  disability: 'unknown', longTermCare: 'unknown',
}

function Choice({ value, onChange, options, label }) {
  return <div className="choice" role="group" aria-label={label}>
    {options.map(([key, text]) => <button key={key} type="button"
      className={value === key ? 'selected' : ''} aria-pressed={value === key}
      onClick={() => onChange(key)}>{text}</button>)}
  </div>
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

function matchReason(program, profile) {
  const scope = program.government_level === 'central' ? '中央福利' : `${profile.county}福利`
  return `依您 ${profile.age} 歲及居住${profile.county}的回答，列入${scope}初步整理`
}

const ResultItem = memo(function ResultItem({ program, profile, open, onToggle }) {
  const status = likelyStatus(program, profile)
  const Icon = categoryIcons[program.category] || Landmark
  const phone = program.application?.phone
  const amount = amountText(program.benefit || {})
  const displayName = program.plain_name || program.name
  const verifiedAt = program.verification?.last_verified_at || '待確認'

  return <article className={`result-item ${open ? 'open' : ''}`}>
    <button className="result-summary" type="button" onClick={onToggle}
      aria-expanded={open} aria-controls={`detail-${program.program_id}`}>
      <span className="result-topline">
        <span className="result-icon" aria-hidden="true"><Icon /></span>
        <span className="result-title">
          <strong>{displayName}</strong>
          <small>{program.jurisdiction}｜{categoryNames[program.category] || program.category}</small>
        </span>
        <span className={`status ${status}`}>{statusLabels[status]}</span>
      </span>
      <span className="benefit-preview"><Gift aria-hidden="true" />{program.benefit?.summary || '補助內容依主管機關核定。'}</span>
      <span className="match-reason"><UserRound aria-hidden="true" />{matchReason(program, profile)}</span>
      <span className="result-action">查看資格與申請方式 {open ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}</span>
      <span className="verification-note"><FileCheck2 aria-hidden="true" />政府資料・核對日期 {verifiedAt}</span>
    </button>

    {open ? <div className="result-detail" id={`detail-${program.program_id}`}>
      {program.name !== program.plain_name ? <p className="official-name"><strong>政府正式名稱：</strong>{program.name}</p> : null}
      <dl>
        <DetailRow icon={HandHeart} label="可以獲得什麼">
          <p>{program.benefit?.summary || '依主管機關核定。'}</p>
          <OptionalFacts items={[
            ['資料類型', program.benefit?.type], ['結構化金額', amount], ['發放／使用頻率', program.benefit?.frequency],
          ]} />
        </DetailRow>
        <DetailRow icon={UserRound} label="哪些人可以申請">
          <p>{program.eligibility?.summary || '請洽主管機關確認。'}</p>
          <OptionalFacts items={[
            ['一般最低年齡', program.eligibility?.minimum_age ? `${program.eligibility.minimum_age} 歲` : null],
            ['原住民最低年齡', program.eligibility?.indigenous_minimum_age ? `${program.eligibility.indigenous_minimum_age} 歲` : null],
            ['戶籍／居住', program.eligibility?.residency], ['所得條件', program.eligibility?.income],
            ['財產條件', program.eligibility?.assets], ['身分條件', program.eligibility?.identity],
            ['評估條件', program.eligibility?.assessment], ['排除條件', program.eligibility?.exclusions],
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
          <span>{source.title}<small>{source.publisher}・{source.source_type}</small></span><ExternalLink aria-hidden="true" />
        </a>)}</div>
      </section>
      <div className="detail-footer">
        <span><CalendarDays aria-hidden="true" />資料核對日：{verifiedAt}</span>
        <div className="detail-actions">
          {phone ? <a className="phone-link" href={`tel:${phone}`}><Phone aria-hidden="true" />撥打 {phone}</a> : null}
        </div>
      </div>
    </div> : null}
  </article>
})

function ProfileForm({ profile, onUpdate, onSubmit, errors, advancedOpen, onToggleAdvanced, finderRef }) {
  return <section className="finder" aria-labelledby="finder-title" ref={finderRef}>
    <h1 id="finder-title">查查看我有哪些福利</h1>
    <p>請選擇居住縣市和年齡，我們會整理中央與居住縣市的福利。</p>
    <form onSubmit={onSubmit} noValidate>
      <label className="field" htmlFor="county">
        <span><MapPin aria-hidden="true" />居住縣市</span>
        <select id="county" value={profile.county} onChange={event => onUpdate('county', event.target.value)}
          aria-invalid={Boolean(errors.county)} aria-describedby={errors.county ? 'county-error' : undefined}>
          <option value="">請選擇縣市</option>
          {counties.map(county => <option key={county}>{county}</option>)}
        </select>
        {errors.county ? <span className="field-error" id="county-error">{errors.county}</span> : null}
      </label>
      <label className="field" htmlFor="age">
        <span><UserRound aria-hidden="true" />年齡</span>
        <span className="age-input"><input id="age" type="number" inputMode="numeric" min="50" max="120"
          placeholder="請輸入年齡" value={profile.age} onChange={event => onUpdate('age', event.target.value)}
          aria-invalid={Boolean(errors.age)} aria-describedby={errors.age ? 'age-error' : undefined} /><em>歲</em></span>
        {errors.age ? <span className="field-error" id="age-error">{errors.age}</span> : null}
      </label>

      {!advancedOpen ? <button className="submit-button" type="submit"><Search aria-hidden="true" />開始查詢</button> : null}

      <button className="advanced-toggle" type="button" aria-expanded={advancedOpen} aria-controls="advanced-fields"
        onClick={onToggleAdvanced}>
        <CircleHelp aria-hidden="true" /><span>想查得更準？再回答幾個問題</span>
        {advancedOpen ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
      </button>

      {advancedOpen ? <div className="advanced-fields" id="advanced-fields">
        <div className="field"><span><UserRound aria-hidden="true" />是否具原住民身分</span>
          <Choice label="是否具原住民身分" value={profile.indigenous} onChange={value => onUpdate('indigenous', value)}
            options={[["yes", "是"], ["no", "否"], ["unknown", "不確定"]]} />
        </div>
        <div className="field"><span><BadgeDollarSign aria-hidden="true" />經濟狀況</span>
          <Choice label="經濟狀況" value={profile.income} onChange={value => onUpdate('income', value)}
            options={[["general", "一般"], ["midlow", "中低收入"], ["low", "低收入"], ["unknown", "不確定"]]} />
        </div>
        <div className="field"><span><Accessibility aria-hidden="true" />是否持有身心障礙證明</span>
          <Choice label="是否持有身心障礙證明" value={profile.disability} onChange={value => onUpdate('disability', value)}
            options={[["yes", "是"], ["no", "否"], ["unknown", "不確定"]]} />
        </div>
        <div className="field"><span><HandHeart aria-hidden="true" />是否需要長照服務</span>
          <Choice label="是否需要長照服務" value={profile.longTermCare} onChange={value => onUpdate('longTermCare', value)}
            options={[["yes", "是"], ["no", "否"], ["unknown", "不確定"]]} />
        </div>
      </div> : null}

      {advancedOpen ? <button className="submit-button after-advanced" type="submit"><Search aria-hidden="true" />開始查詢</button> : null}

      <p className="privacy-note"><LockKeyhole aria-hidden="true" />這些資料只用於本次查詢，不會儲存。</p>
    </form>
  </section>
}

function ResultsPanel({ profile, resultsRef, onEdit }) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [browseAll, setBrowseAll] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [showMoreCategories, setShowMoreCategories] = useState(false)
  const [visibleCount, setVisibleCount] = useState(10)
  const deferredQuery = useDeferredValue(query)

  const matches = useMemo(() => filterBenefits(benefits, {
    profile, category: filter, query: deferredQuery, browseAll,
  }), [profile, filter, deferredQuery, browseAll])
  const visibleMatches = matches.slice(0, visibleCount)

  const chooseFilter = key => {
    setFilter(key)
    setExpanded(null)
    setVisibleCount(10)
  }

  return <section className="results" id="results" tabIndex="-1" aria-labelledby="results-title" ref={resultsRef}>
    <div className="results-heading">
      <div><h2 id="results-title">您可能符合的福利</h2><p>已依您的回答完成初步整理，共 {matches.length} 項</p></div>
      <button className="edit-query" type="button" onClick={onEdit}><Pencil aria-hidden="true" />修改查詢條件</button>
    </div>

    <div className="result-tools">
      <label className="search-field"><Search aria-hidden="true" /><span className="sr-only">搜尋福利</span>
        <input type="search" value={query} onChange={event => { setQuery(event.target.value); setVisibleCount(10); setExpanded(null) }}
          placeholder="搜尋福利名稱或主管機關" />
      </label>
      <label className="toggle"><input type="checkbox" checked={browseAll}
        onChange={event => { setBrowseAll(event.target.checked); setVisibleCount(10); setExpanded(null) }} />
        <span>顯示此縣市其他可能需要確認的福利</span></label>
    </div>

    <nav className="filters" aria-label="常用福利類別">
      {commonFilters.map(([key, text]) => <button key={key} className={filter === key ? 'active' : ''}
        type="button" aria-pressed={filter === key} onClick={() => chooseFilter(key)}>{text}</button>)}
      <button className={showMoreCategories ? 'more-categories active' : 'more-categories'} type="button"
        aria-expanded={showMoreCategories} aria-controls="more-category-filters"
        onClick={() => setShowMoreCategories(value => !value)}>更多類別 {showMoreCategories ? <ChevronUp /> : <ChevronDown />}</button>
    </nav>
    {showMoreCategories ? <nav className="filters secondary-filters" id="more-category-filters" aria-label="更多福利類別">
      {moreFilters.map(([key, text]) => <button key={key} className={filter === key ? 'active' : ''}
        type="button" aria-pressed={filter === key} onClick={() => chooseFilter(key)}>{text}</button>)}
    </nav> : null}

    <div className="result-list" aria-live="polite">
      {visibleMatches.map(program => <ResultItem key={program.program_id} program={program} profile={profile}
        open={expanded === program.program_id}
        onToggle={() => setExpanded(current => current === program.program_id ? null : program.program_id)} />)}
      {matches.length === 0 ? <div className="empty"><CircleHelp aria-hidden="true" /><h3>目前沒有相符項目</h3><p>請調整搜尋或類別，也可以修改查詢條件。</p></div> : null}
    </div>
    {visibleCount < matches.length ? <button className="show-more" type="button"
      onClick={() => setVisibleCount(count => count + 10)}>顯示更多福利（尚有 {matches.length - visibleCount} 項）</button> : null}
  </section>
}

function App() {
  const [profile, setProfile] = useState(initialProfile)
  const [submittedProfile, setSubmittedProfile] = useState(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [errors, setErrors] = useState({})
  const finderRef = useRef(null)
  const resultsRef = useRef(null)

  const updateProfile = (key, value) => {
    setProfile(current => ({ ...current, [key]: value }))
    setErrors(current => current[key] ? { ...current, [key]: undefined } : current)
  }

  const submitProfile = event => {
    event.preventDefault()
    const age = Number(profile.age)
    const nextErrors = {}
    if (!profile.county) nextErrors.county = '請先選擇居住縣市。'
    if (!profile.age) nextErrors.age = '請輸入年齡。'
    else if (!Number.isInteger(age) || age < 50 || age > 120) nextErrors.age = '請輸入 50 至 120 歲的整數年齡。'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      const firstInvalid = nextErrors.county ? 'county' : 'age'
      document.getElementById(firstInvalid)?.focus()
      return
    }
    setSubmittedProfile({ ...profile, age })
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const firstResult = resultsRef.current?.querySelector('.result-item')
      const firstSummary = firstResult?.querySelector('.result-summary')
      if (firstResult && firstSummary) {
        firstSummary.focus({ preventScroll: true })
        firstResult.scrollIntoView({ block: 'start' })
      } else {
        resultsRef.current?.focus()
      }
    }))
  }

  const editProfile = () => {
    finderRef.current?.scrollIntoView({ block: 'start' })
    document.getElementById('county')?.focus()
  }

  return <>
    <a className="skip-link" href="#main-content">跳到主要內容</a>
    <header className="site-header">
      <div className="brand"><Accessibility aria-hidden="true" /><span>長福通</span></div>
      <div className="trust"><ShieldCheck aria-hidden="true" /><span>資料以政府主管機關公告為準</span></div>
    </header>

    <main className={`app-layout ${submittedProfile ? 'has-results' : ''}`} id="main-content">
      <ProfileForm profile={profile} onUpdate={updateProfile} onSubmit={submitProfile} errors={errors}
        advancedOpen={advancedOpen} onToggleAdvanced={() => setAdvancedOpen(value => !value)} finderRef={finderRef} />
      {submittedProfile ? <ResultsPanel key={`${submittedProfile.county}-${submittedProfile.age}-${submittedProfile.indigenous}-${submittedProfile.income}-${submittedProfile.disability}-${submittedProfile.longTermCare}`}
        profile={submittedProfile} resultsRef={resultsRef} onEdit={editProfile} /> : null}
    </main>

    <aside className="warning"><span aria-hidden="true">!</span><strong>申請資格與金額可能調整，送件前請再向主管機關確認。</strong></aside>
    <footer><span>目前共 {benefits.length} 筆福利資料</span><span>資料核對日：2026-08-18</span><span>長照專線：1966</span></footer>
  </>
}

const root = window.__seniorBenefitsRoot ??= createRoot(document.getElementById('root'))
root.render(<React.StrictMode><App /></React.StrictMode>)
