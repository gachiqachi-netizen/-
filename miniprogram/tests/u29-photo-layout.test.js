const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const page = fs.readFileSync(path.join(__dirname, '../pages/photo/photo.wxml'), 'utf8')
const styles = fs.readFileSync(path.join(__dirname, '../pages/photo/photo.wxss'), 'utf8')

test('选择页两个动作铺满弹层，结果页用统一价格底栏', () => {
  assert.match(page, /class="c-btn c-btn--block" bindtap="useExact"/)
  assert.match(page, /class="c-btn c-btn--sec c-btn--block" bindtap="useFeeling"/)
  assert.match(page, /<c-bar layout="price"><view slot="left">¥{{price}}<\/view>/)
  assert.match(page, /bindtap="edit">按 15cm 排一条<\/button>/)
  assert.match(page, /bindtap="order">就要这条<\/button>/)
  assert.doesNotMatch(styles, /\.result-bottom button\s*\{/)
})

test('本地估算明确标注来源，不显示气质文案或识别标题', () => {
  assert.match(page, /wx:if="{{result.source === 'local'}}" class="local-notice">没连上识别服务，下面是按照片颜色估的，材料可能不对，请核对或放到工作台改/)
  assert.match(page, /wx:if="{{result.source !== 'local'}}" class="meaning"/)
  assert.match(page, /result.source === 'local' \? '按颜色估的珠子' : '认出来的珠子'/)
})
