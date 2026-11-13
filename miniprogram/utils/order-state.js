// 订单状态只显示后端给的 customerStatus / progress / allowedActions（A2），前端不再自己推算。
// 文字表来自 utils/contract.js（A1 导出，tools/export_contract.py 生成）。
const contract = require('./contract')

const FALLBACK_VIEW = {
  label: '订单正在处理',
  desc: '',
  tone: 'normal',
  primaryAction: null,
  progress: { show: false, steps: [] },
  actions: [],
}

const PRIMARY_ACTIONS = { pay_order: true, confirm_receipt: true }

function view(order) {
  const source = order || {}
  const cs = source.customerStatus
  if (!cs || typeof cs !== 'object') return Object.assign({}, FALLBACK_VIEW)
  const progress = source.progress && typeof source.progress === 'object'
    ? { show: !!source.progress.show, steps: Array.isArray(source.progress.steps) ? source.progress.steps : [] }
    : { show: false, steps: [] }
  const names = contract.actions || {}
  const actions = (Array.isArray(source.allowedActions) ? source.allowedActions : [])
    .map(function (action) {
      const code = typeof action === 'string' ? action : action && action.code
      if (!code || typeof code !== 'string') return null
      return { code: code, label: names[code] || code, style: PRIMARY_ACTIONS[code] ? 'primary' : 'secondary' }
    })
    .filter(Boolean)
  return {
    code: cs.code || '',
    label: cs.label || FALLBACK_VIEW.label,
    desc: cs.desc || '',
    tone: cs.tone || 'normal',
    primaryAction: cs.primaryAction || null,
    progress: progress,
    actions: actions,
  }
}

// 旧调用处（pages/mine/mine.js 等，不在本卡改动范围）用的薄适配层：
// 只从 view() 映射字段，不含任何状态推算。states 恒为空数组（五组明细已由后端 customerStatus 取代）。
function decorate(order) {
  const source = order || {}
  const v = view(source)
  return Object.assign({}, source, {
    stateView: { label: v.label, tone: v.tone, description: v.desc, states: [] },
    actionViews: v.actions,
  })
}

module.exports = { view: view, decorate: decorate }
