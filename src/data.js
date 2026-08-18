import central from '../data/benefits.central.json'
import assistive from '../data/benefits.assistive.json'
import dental from '../data/benefits.dental.json'
import local from '../data/benefits.local.json'
import localChongyang from '../data/benefits.local.chongyang.json'
import localHealthAids from '../data/benefits.local.health-aids.json'
import localHealthCheck from '../data/benefits.local.health-check.json'
import localRehabBus from '../data/benefits.local.rehab-bus.json'
import localSupport from '../data/benefits.local.support.json'
import localTransport from '../data/benefits.local.transport.json'

export const benefits = [
  ...central,
  ...assistive,
  ...dental,
  ...local,
  ...localChongyang,
  ...localHealthAids,
  ...localHealthCheck,
  ...localRehabBus,
  ...localSupport,
  ...localTransport,
]

export const counties = [
  '臺北市', '新北市', '桃園市', '臺中市', '臺南市', '高雄市',
  '基隆市', '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣',
  '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
  '臺東縣', '澎湖縣', '金門縣', '連江縣',
]

export const categoryNames = {
  cash_assistance: '現金補助',
  pension_retirement: '年金退休',
  health_insurance: '健保補助',
  housing: '住宅協助',
  long_term_care: '長照服務',
  healthcare: '醫療照護',
  vaccination: '疫苗接種',
  transportation: '交通優惠',
  culture_recreation: '文化優惠',
  community_support: '社區支持',
  protection: '保護服務',
  tax: '稅務優惠',
}
