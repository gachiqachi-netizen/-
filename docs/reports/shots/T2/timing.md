# 小程序页面加载耗时

从打开页面到 `ready: true`；旧页面回退到骨架消失。单位：毫秒。

| 页面 | 冷启动 | 有缓存 | 警告 |
| --- | ---: | ---: | --- |
| home | 4177 (no-skeleton) | 4127 (no-skeleton) | 无 |
| workbench | 4151 (no-skeleton) | 4112 (no-skeleton) | 无 |
| bracelet-detail | 4142 (no-skeleton) | 4162 (no-skeleton) | 无 |
| ai-match | 4079 (no-skeleton) | 4041 (no-skeleton) | 无 |
| order-confirm | 4134 (no-skeleton) | 4054 (no-skeleton) | 无 |
| order-success | 4251 (no-skeleton) | 4075 (no-skeleton) | 无 |
| order-detail-pending | 4074 (no-skeleton) | 4083 (no-skeleton) | 无 |
| order-detail-transit | 4148 (no-skeleton) | 4123 (no-skeleton) | 无 |
| order-detail-after-sale | 4083 (no-skeleton) | 4100 (no-skeleton) | 无 |
| my-orders | 4081 (no-skeleton) | 4073 (no-skeleton) | 无 |
| mine | 4047 (no-skeleton) | 4040 (no-skeleton) | 无 |
| write-review | 4097 (no-skeleton) | 4084 (no-skeleton) | 无 |
| after-sale-type | 4101 (no-skeleton) | 4128 (no-skeleton) | 无 |
| after-sale-apply | 4112 (no-skeleton) | 4127 (no-skeleton) | 无 |
| after-sale-detail | 4493 (no-skeleton) | 4108 (no-skeleton) | 无 |
| friend-landing | 4164 (no-skeleton) | 4073 (no-skeleton) | 无 |
| share-poster | 3276 (ready) | 3243 (ready) | 无 |
| address-edit | 4070 (no-skeleton) | 4082 (no-skeleton) | 无 |
