// 没有实拍图时画仿真球：左上高光 → 亮色 → 暗色的径向渐变，加一圈内阴影（不是平涂色块）。
// 照 docs/design/mockups-final.html 里 bead() 的效果；输入是珠子的两个颜色 c: [亮色, 暗色]。

const FALLBACK = ['#f4f4f4', '#c9c9c9']; // 没有颜色数据时的中性灰

function paint(c) {
  const light = (c && c[0]) || FALLBACK[0];
  const dark = (c && c[1]) || FALLBACK[1];
  return 'background:'
    + 'radial-gradient(circle at 34% 28%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 26%),'
    + 'radial-gradient(circle at 64% 74%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 42%),'
    + 'radial-gradient(circle at 36% 30%, ' + light + ' 0%, ' + light + ' 45%, ' + dark + ' 100%);'
    + 'box-shadow:inset 0 0 6rpx rgba(0,0,0,0.12), inset 0 -4rpx 10rpx rgba(0,0,0,0.18);';
}

module.exports = { paint, FALLBACK };
