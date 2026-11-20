const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const {spawnSync} = require('node:child_process')
const root = path.join(__dirname, '..')
let page
let navigated = ''
global.Page = definition => { page = definition }
global.wx = {navigateTo({url}){navigated=url}}
global.getApp = () => ({globalData:{apiBase:'http://localhost'}})
require('../pages/diy/diy')

test('工作台更多菜单只有清空手串和落珠声，作品入口函数仍可跳转',()=>{
  const markup=fs.readFileSync(path.join(root,'pages/diy/diy.wxml'),'utf8')
  const menu=markup.match(/<c-sheet show="\{\{moreOpen\}\}"[^]*?<\/c-sheet>/)[0]
  assert.deepEqual([...menu.matchAll(/class="more-option" bindtap="([^"]+)"/g)].map(x=>x[1]),['openClear','toggleSound'])
  const p={...page,data:{...page.data,moreOpen:true,saveDot:true},setData(patch){Object.assign(this.data,patch)}}
  p.works()
  assert.equal(navigated,'/features/works/works')
  assert.equal(p.data.moreOpen,false)
  assert.doesNotMatch(markup, /<c-nav-bar\b|class="topbar"/)
  const config=JSON.parse(fs.readFileSync(path.join(root,'pages/diy/diy.json')))
  assert.equal(config.navigationBarTitleText,'自己串')
  assert.equal(config.navigationStyle,'custom')
})

test('指定页面标题统一且不超过六字',()=>{
  const titles={'features/address/address':'收货地址','features/review/review':'写评价','pages/share/share':'分享海报','features/doc/doc':'说明','features/article/article':'小知识'}
  for(const [name,title] of Object.entries(titles)){
    const config=JSON.parse(fs.readFileSync(path.join(root,name+'.json')))
    assert.equal(config.navigationBarTitleText,title)
    assert.ok(title.length<=6)
  }
  assert.doesNotMatch(fs.readFileSync(path.join(root,'features/doc/doc.wxml'),'utf8'),/<view class="title">\{\{title\}\}<\/view>/)
})

function navCheck(app, files){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'u33-nav-'))
  try{
    fs.mkdirSync(path.join(temp,'miniprogram'),{recursive:true})
    fs.writeFileSync(path.join(temp,'miniprogram/app.json'),JSON.stringify(app))
    for(const [name,config] of Object.entries(files)){
      const file=path.join(temp,'miniprogram',name+'.json')
      fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(config))
    }
    const script=`import importlib.util, pathlib, sys\nspec=importlib.util.spec_from_file_location('check_ui',sys.argv[1]); mod=importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)\nfor error in mod.navigation_violations(pathlib.Path(sys.argv[2])): print(error)`
    const result=spawnSync('python3',['-c',script,path.join(__dirname,'../../tools/check-ui.py'),temp],{encoding:'utf8'})
    assert.equal(result.status,0,result.stderr)
    return result.stdout.trim()
  }finally{fs.rmSync(temp,{recursive:true,force:true})}
}
test('check-ui 接受每页标题和 app 默认标题',()=>{
  assert.equal(navCheck({pages:['pages/a/a'],subPackages:[{root:'features',pages:['b/b']}],window:{navigationBarTitleText:'默认'}},{'pages/a/a':{navigationBarTitleText:'页面甲'},'features/b/b':{}}),'')
})
test('check-ui 拒绝 custom 和缺少标题',()=>{
  const custom=navCheck({pages:['pages/a/a'],window:{navigationBarTitleText:'默认'}},{'pages/a/a':{navigationStyle:'custom'}})
  assert.match(custom,/navigationStyle:不能使用 custom/)
  const missing=navCheck({pages:['pages/a/a'],window:{}},{'pages/a/a':{}})
  assert.match(missing,/navigationBarTitleText:没有页面标题/)
})
test('check-ui 只允许工作台 custom，其他页面仍拦截',()=>{
  const workbench=navCheck({pages:['pages/diy/diy'],window:{navigationBarTitleText:'默认'}},{'pages/diy/diy':{navigationStyle:'custom',navigationBarTitleText:'自己串'}})
  assert.equal(workbench,'')
  const other=navCheck({pages:['pages/a/a'],window:{navigationBarTitleText:'默认'}},{'pages/a/a':{navigationStyle:'custom'}})
  assert.match(other,/不能使用 custom/)
})
