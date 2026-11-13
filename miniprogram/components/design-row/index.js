// 手串摘要行（任务卡 C0h，稿 02、19、45）：左边缩略图（复用 bracelet-thumb + thumb-cache，
// 不改它们的对外行为），右边名字、一句寓意、一行小字（调用方传 sub），右侧插槽。
// 名字和一句寓意的字号、位置写死（09 第 31 条）。
if (typeof Component === 'function') {
  Component({
    options: { styleIsolation: 'apply-shared', multipleSlots: true },
    properties: {
      design: { type: Object, value: null },  // {name, line, beads}
      catalog: { type: Array, value: [] },     // bracelet-thumb 需要
      sub: { type: String, value: '' },        // 一行小字（颗数等），调用方传
    },
  })
}
