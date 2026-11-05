var Ck=Object.create,ql=Object.defineProperty;var kk=Object.getOwnPropertyDescriptor;var Nk=Object.getOwnPropertyNames;var Sk=Object.getPrototypeOf,Ek=Object.prototype.hasOwnProperty;var Dx=r=>ql(r,"__esModule",{value:!0});var He=(r,e)=>()=>(e||r((e={exports:{}}).exports,e),e.exports),re=(r,e)=>{for(var t in e)ql(r,t,{get:e[t],enumerable:!0})},Ik=(r,e,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let o of Nk(e))!Ek.call(r,o)&&o!=="default"&&ql(r,o,{get:()=>e[o],enumerable:!(t=kk(e,o))||t.enumerable});return r},ds=r=>Ik(Dx(ql(r!=null?Ck(Sk(r)):{},"default",r&&r.__esModule&&"default"in r?{get:()=>r.default,enumerable:!0}:{value:r,enumerable:!0})),r);var Yx=He((a3,Xx)=>{Xx.exports=we;var Et=null;try{Et=new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([0,97,115,109,1,0,0,0,1,13,2,96,0,1,127,96,4,127,127,127,127,1,127,3,7,6,0,1,1,1,1,1,6,6,1,127,1,65,0,11,7,50,6,3,109,117,108,0,1,5,100,105,118,95,115,0,2,5,100,105,118,95,117,0,3,5,114,101,109,95,115,0,4,5,114,101,109,95,117,0,5,8,103,101,116,95,104,105,103,104,0,0,10,191,1,6,4,0,35,0,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,126,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,127,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,128,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,129,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,130,34,4,66,32,135,167,36,0,32,4,167,11])),{}).exports}catch(r){}function we(r,e,t){this.low=r|0,this.high=e|0,this.unsigned=!!t}we.prototype.__isLong__;Object.defineProperty(we.prototype,"__isLong__",{value:!0});function mt(r){return(r&&r.__isLong__)===!0}we.isLong=mt;var Vx={},Gx={};function Ro(r,e){var t,o,n;return e?(r>>>=0,(n=0<=r&&r<256)&&(o=Gx[r],o)?o:(t=ve(r,(r|0)<0?-1:0,!0),n&&(Gx[r]=t),t)):(r|=0,(n=-128<=r&&r<128)&&(o=Vx[r],o)?o:(t=ve(r,r<0?-1:0,!1),n&&(Vx[r]=t),t))}we.fromInt=Ro;function It(r,e){if(isNaN(r))return e?Do:$t;if(e){if(r<0)return Do;if(r>=Ux)return Kx}else{if(r<=-Wx)return ft;if(r+1>=Wx)return qx}return r<0?It(-r,e).neg():ve(r%On|0,r/On|0,e)}we.fromNumber=It;function ve(r,e,t){return new we(r,e,t)}we.fromBits=ve;var Jl=Math.pow;function rp(r,e,t){if(r.length===0)throw Error("empty string");if(r==="NaN"||r==="Infinity"||r==="+Infinity"||r==="-Infinity")return $t;if(typeof e=="number"?(t=e,e=!1):e=!!e,t=t||10,t<2||36<t)throw RangeError("radix");var o;if((o=r.indexOf("-"))>0)throw Error("interior hyphen");if(o===0)return rp(r.substring(1),e,t).neg();for(var n=It(Jl(t,8)),s=$t,i=0;i<r.length;i+=8){var a=Math.min(8,r.length-i),l=parseInt(r.substring(i,i+a),t);if(a<8){var u=It(Jl(t,a));s=s.mul(u).add(It(l))}else s=s.mul(n),s=s.add(It(l))}return s.unsigned=e,s}we.fromString=rp;function zt(r,e){return typeof r=="number"?It(r,e):typeof r=="string"?rp(r,e):ve(r.low,r.high,typeof e=="boolean"?e:r.unsigned)}we.fromValue=zt;var zx=1<<16,cN=1<<24,On=zx*zx,Ux=On*On,Wx=Ux/2,jx=Ro(cN),$t=Ro(0);we.ZERO=$t;var Do=Ro(0,!0);we.UZERO=Do;var Pn=Ro(1);we.ONE=Pn;var Hx=Ro(1,!0);we.UONE=Hx;var op=Ro(-1);we.NEG_ONE=op;var qx=ve(4294967295|0,2147483647|0,!1);we.MAX_VALUE=qx;var Kx=ve(4294967295|0,4294967295|0,!0);we.MAX_UNSIGNED_VALUE=Kx;var ft=ve(0,2147483648|0,!1);we.MIN_VALUE=ft;var M=we.prototype;M.toInt=function(){return this.unsigned?this.low>>>0:this.low};M.toNumber=function(){return this.unsigned?(this.high>>>0)*On+(this.low>>>0):this.high*On+(this.low>>>0)};M.toString=function(e){if(e=e||10,e<2||36<e)throw RangeError("radix");if(this.isZero())return"0";if(this.isNegative())if(this.eq(ft)){var t=It(e),o=this.div(t),n=o.mul(t).sub(this);return o.toString(e)+n.toInt().toString(e)}else return"-"+this.neg().toString(e);for(var s=It(Jl(e,6),this.unsigned),i=this,a="";;){var l=i.div(s),u=i.sub(l.mul(s)).toInt()>>>0,c=u.toString(e);if(i=l,i.isZero())return c+a;for(;c.length<6;)c="0"+c;a=""+c+a}};M.getHighBits=function(){return this.high};M.getHighBitsUnsigned=function(){return this.high>>>0};M.getLowBits=function(){return this.low};M.getLowBitsUnsigned=function(){return this.low>>>0};M.getNumBitsAbs=function(){if(this.isNegative())return this.eq(ft)?64:this.neg().getNumBitsAbs();for(var e=this.high!=0?this.high:this.low,t=31;t>0&&(e&1<<t)==0;t--);return this.high!=0?t+33:t+1};M.isZero=function(){return this.high===0&&this.low===0};M.eqz=M.isZero;M.isNegative=function(){return!this.unsigned&&this.high<0};M.isPositive=function(){return this.unsigned||this.high>=0};M.isOdd=function(){return(this.low&1)==1};M.isEven=function(){return(this.low&1)==0};M.equals=function(e){return mt(e)||(e=zt(e)),this.unsigned!==e.unsigned&&this.high>>>31==1&&e.high>>>31==1?!1:this.high===e.high&&this.low===e.low};M.eq=M.equals;M.notEquals=function(e){return!this.eq(e)};M.neq=M.notEquals;M.ne=M.notEquals;M.lessThan=function(e){return this.comp(e)<0};M.lt=M.lessThan;M.lessThanOrEqual=function(e){return this.comp(e)<=0};M.lte=M.lessThanOrEqual;M.le=M.lessThanOrEqual;M.greaterThan=function(e){return this.comp(e)>0};M.gt=M.greaterThan;M.greaterThanOrEqual=function(e){return this.comp(e)>=0};M.gte=M.greaterThanOrEqual;M.ge=M.greaterThanOrEqual;M.compare=function(e){if(mt(e)||(e=zt(e)),this.eq(e))return 0;var t=this.isNegative(),o=e.isNegative();return t&&!o?-1:!t&&o?1:this.unsigned?e.high>>>0>this.high>>>0||e.high===this.high&&e.low>>>0>this.low>>>0?-1:1:this.sub(e).isNegative()?-1:1};M.comp=M.compare;M.negate=function(){return!this.unsigned&&this.eq(ft)?ft:this.not().add(Pn)};M.neg=M.negate;M.add=function(e){mt(e)||(e=zt(e));var t=this.high>>>16,o=this.high&65535,n=this.low>>>16,s=this.low&65535,i=e.high>>>16,a=e.high&65535,l=e.low>>>16,u=e.low&65535,c=0,p=0,m=0,f=0;return f+=s+u,m+=f>>>16,f&=65535,m+=n+l,p+=m>>>16,m&=65535,p+=o+a,c+=p>>>16,p&=65535,c+=t+i,c&=65535,ve(m<<16|f,c<<16|p,this.unsigned)};M.subtract=function(e){return mt(e)||(e=zt(e)),this.add(e.neg())};M.sub=M.subtract;M.multiply=function(e){if(this.isZero())return $t;if(mt(e)||(e=zt(e)),Et){var t=Et.mul(this.low,this.high,e.low,e.high);return ve(t,Et.get_high(),this.unsigned)}if(e.isZero())return $t;if(this.eq(ft))return e.isOdd()?ft:$t;if(e.eq(ft))return this.isOdd()?ft:$t;if(this.isNegative())return e.isNegative()?this.neg().mul(e.neg()):this.neg().mul(e).neg();if(e.isNegative())return this.mul(e.neg()).neg();if(this.lt(jx)&&e.lt(jx))return It(this.toNumber()*e.toNumber(),this.unsigned);var o=this.high>>>16,n=this.high&65535,s=this.low>>>16,i=this.low&65535,a=e.high>>>16,l=e.high&65535,u=e.low>>>16,c=e.low&65535,p=0,m=0,f=0,d=0;return d+=i*c,f+=d>>>16,d&=65535,f+=s*c,m+=f>>>16,f&=65535,f+=i*u,m+=f>>>16,f&=65535,m+=n*c,p+=m>>>16,m&=65535,m+=s*u,p+=m>>>16,m&=65535,m+=i*l,p+=m>>>16,m&=65535,p+=o*c+n*u+s*l+i*a,p&=65535,ve(f<<16|d,p<<16|m,this.unsigned)};M.mul=M.multiply;M.divide=function(e){if(mt(e)||(e=zt(e)),e.isZero())throw Error("division by zero");if(Et){if(!this.unsigned&&this.high===-2147483648&&e.low===-1&&e.high===-1)return this;var t=(this.unsigned?Et.div_u:Et.div_s)(this.low,this.high,e.low,e.high);return ve(t,Et.get_high(),this.unsigned)}if(this.isZero())return this.unsigned?Do:$t;var o,n,s;if(this.unsigned){if(e.unsigned||(e=e.toUnsigned()),e.gt(this))return Do;if(e.gt(this.shru(1)))return Hx;s=Do}else{if(this.eq(ft)){if(e.eq(Pn)||e.eq(op))return ft;if(e.eq(ft))return Pn;var i=this.shr(1);return o=i.div(e).shl(1),o.eq($t)?e.isNegative()?Pn:op:(n=this.sub(e.mul(o)),s=o.add(n.div(e)),s)}else if(e.eq(ft))return this.unsigned?Do:$t;if(this.isNegative())return e.isNegative()?this.neg().div(e.neg()):this.neg().div(e).neg();if(e.isNegative())return this.div(e.neg()).neg();s=$t}for(n=this;n.gte(e);){o=Math.max(1,Math.floor(n.toNumber()/e.toNumber()));for(var a=Math.ceil(Math.log(o)/Math.LN2),l=a<=48?1:Jl(2,a-48),u=It(o),c=u.mul(e);c.isNegative()||c.gt(n);)o-=l,u=It(o,this.unsigned),c=u.mul(e);u.isZero()&&(u=Pn),s=s.add(u),n=n.sub(c)}return s};M.div=M.divide;M.modulo=function(e){if(mt(e)||(e=zt(e)),Et){var t=(this.unsigned?Et.rem_u:Et.rem_s)(this.low,this.high,e.low,e.high);return ve(t,Et.get_high(),this.unsigned)}return this.sub(this.div(e).mul(e))};M.mod=M.modulo;M.rem=M.modulo;M.not=function(){return ve(~this.low,~this.high,this.unsigned)};M.and=function(e){return mt(e)||(e=zt(e)),ve(this.low&e.low,this.high&e.high,this.unsigned)};M.or=function(e){return mt(e)||(e=zt(e)),ve(this.low|e.low,this.high|e.high,this.unsigned)};M.xor=function(e){return mt(e)||(e=zt(e)),ve(this.low^e.low,this.high^e.high,this.unsigned)};M.shiftLeft=function(e){return mt(e)&&(e=e.toInt()),(e&=63)===0?this:e<32?ve(this.low<<e,this.high<<e|this.low>>>32-e,this.unsigned):ve(0,this.low<<e-32,this.unsigned)};M.shl=M.shiftLeft;M.shiftRight=function(e){return mt(e)&&(e=e.toInt()),(e&=63)===0?this:e<32?ve(this.low>>>e|this.high<<32-e,this.high>>e,this.unsigned):ve(this.high>>e-32,this.high>=0?0:-1,this.unsigned)};M.shr=M.shiftRight;M.shiftRightUnsigned=function(e){if(mt(e)&&(e=e.toInt()),e&=63,e===0)return this;var t=this.high;if(e<32){var o=this.low;return ve(o>>>e|t<<32-e,t>>>e,this.unsigned)}else return e===32?ve(t,0,this.unsigned):ve(t>>>e-32,0,this.unsigned)};M.shru=M.shiftRightUnsigned;M.shr_u=M.shiftRightUnsigned;M.toSigned=function(){return this.unsigned?ve(this.low,this.high,!1):this};M.toUnsigned=function(){return this.unsigned?this:ve(this.low,this.high,!0)};M.toBytes=function(e){return e?this.toBytesLE():this.toBytesBE()};M.toBytesLE=function(){var e=this.high,t=this.low;return[t&255,t>>>8&255,t>>>16&255,t>>>24,e&255,e>>>8&255,e>>>16&255,e>>>24]};M.toBytesBE=function(){var e=this.high,t=this.low;return[e>>>24,e>>>16&255,e>>>8&255,e&255,t>>>24,t>>>16&255,t>>>8&255,t&255]};we.fromBytes=function(e,t,o){return o?we.fromBytesLE(e,t):we.fromBytesBE(e,t)};we.fromBytesLE=function(e,t){return new we(e[0]|e[1]<<8|e[2]<<16|e[3]<<24,e[4]|e[5]<<8|e[6]<<16|e[7]<<24,t)};we.fromBytesBE=function(e,t){return new we(e[4]<<24|e[5]<<16|e[6]<<8|e[7],e[0]<<24|e[1]<<16|e[2]<<8|e[3],t)}});var Dy=He(()=>{});var Fy=He(()=>{});var kb=He((Cb,pf)=>{(function(r,e,t){function o(a){var l=this,u=i();l.next=function(){var c=2091639*l.s0+l.c*23283064365386963e-26;return l.s0=l.s1,l.s1=l.s2,l.s2=c-(l.c=c|0)},l.c=1,l.s0=u(" "),l.s1=u(" "),l.s2=u(" "),l.s0-=u(a),l.s0<0&&(l.s0+=1),l.s1-=u(a),l.s1<0&&(l.s1+=1),l.s2-=u(a),l.s2<0&&(l.s2+=1),u=null}function n(a,l){return l.c=a.c,l.s0=a.s0,l.s1=a.s1,l.s2=a.s2,l}function s(a,l){var u=new o(a),c=l&&l.state,p=u.next;return p.int32=function(){return u.next()*4294967296|0},p.double=function(){return p()+(p()*2097152|0)*11102230246251565e-32},p.quick=p,c&&(typeof c=="object"&&n(c,u),p.state=function(){return n(u,{})}),p}function i(){var a=4022871197,l=function(u){u=String(u);for(var c=0;c<u.length;c++){a+=u.charCodeAt(c);var p=.02519603282416938*a;a=p>>>0,p-=a,p*=a,a=p>>>0,p-=a,a+=p*4294967296}return(a>>>0)*23283064365386963e-26};return l}e&&e.exports?e.exports=s:t&&t.amd?t(function(){return s}):this.alea=s})(Cb,typeof pf=="object"&&pf,typeof define=="function"&&define)});var Sb=He((Nb,mf)=>{(function(r,e,t){function o(i){var a=this,l="";a.x=0,a.y=0,a.z=0,a.w=0,a.next=function(){var c=a.x^a.x<<11;return a.x=a.y,a.y=a.z,a.z=a.w,a.w^=a.w>>>19^c^c>>>8},i===(i|0)?a.x=i:l+=i;for(var u=0;u<l.length+64;u++)a.x^=l.charCodeAt(u)|0,a.next()}function n(i,a){return a.x=i.x,a.y=i.y,a.z=i.z,a.w=i.w,a}function s(i,a){var l=new o(i),u=a&&a.state,c=function(){return(l.next()>>>0)/4294967296};return c.double=function(){do var p=l.next()>>>11,m=(l.next()>>>0)/4294967296,f=(p+m)/(1<<21);while(f===0);return f},c.int32=l.next,c.quick=c,u&&(typeof u=="object"&&n(u,l),c.state=function(){return n(l,{})}),c}e&&e.exports?e.exports=s:t&&t.amd?t(function(){return s}):this.xor128=s})(Nb,typeof mf=="object"&&mf,typeof define=="function"&&define)});var Ib=He((Eb,ff)=>{(function(r,e,t){function o(i){var a=this,l="";a.next=function(){var c=a.x^a.x>>>2;return a.x=a.y,a.y=a.z,a.z=a.w,a.w=a.v,(a.d=a.d+362437|0)+(a.v=a.v^a.v<<4^(c^c<<1))|0},a.x=0,a.y=0,a.z=0,a.w=0,a.v=0,i===(i|0)?a.x=i:l+=i;for(var u=0;u<l.length+64;u++)a.x^=l.charCodeAt(u)|0,u==l.length&&(a.d=a.x<<10^a.x>>>4),a.next()}function n(i,a){return a.x=i.x,a.y=i.y,a.z=i.z,a.w=i.w,a.v=i.v,a.d=i.d,a}function s(i,a){var l=new o(i),u=a&&a.state,c=function(){return(l.next()>>>0)/4294967296};return c.double=function(){do var p=l.next()>>>11,m=(l.next()>>>0)/4294967296,f=(p+m)/(1<<21);while(f===0);return f},c.int32=l.next,c.quick=c,u&&(typeof u=="object"&&n(u,l),c.state=function(){return n(l,{})}),c}e&&e.exports?e.exports=s:t&&t.amd?t(function(){return s}):this.xorwow=s})(Eb,typeof ff=="object"&&ff,typeof define=="function"&&define)});var Ab=He(($b,df)=>{(function(r,e,t){function o(i){var a=this;a.next=function(){var u=a.x,c=a.i,p,m,f;return p=u[c],p^=p>>>7,m=p^p<<24,p=u[c+1&7],m^=p^p>>>10,p=u[c+3&7],m^=p^p>>>3,p=u[c+4&7],m^=p^p<<7,p=u[c+7&7],p=p^p<<13,m^=p^p<<9,u[c]=m,a.i=c+1&7,m};function l(u,c){var p,m,f=[];if(c===(c|0))m=f[0]=c;else for(c=""+c,p=0;p<c.length;++p)f[p&7]=f[p&7]<<15^c.charCodeAt(p)+f[p+1&7]<<13;for(;f.length<8;)f.push(0);for(p=0;p<8&&f[p]===0;++p);for(p==8?m=f[7]=-1:m=f[p],u.x=f,u.i=0,p=256;p>0;--p)u.next()}l(a,i)}function n(i,a){return a.x=i.x.slice(),a.i=i.i,a}function s(i,a){i==null&&(i=+new Date);var l=new o(i),u=a&&a.state,c=function(){return(l.next()>>>0)/4294967296};return c.double=function(){do var p=l.next()>>>11,m=(l.next()>>>0)/4294967296,f=(p+m)/(1<<21);while(f===0);return f},c.int32=l.next,c.quick=c,u&&(u.x&&n(u,l),c.state=function(){return n(l,{})}),c}e&&e.exports?e.exports=s:t&&t.amd?t(function(){return s}):this.xorshift7=s})($b,typeof df=="object"&&df,typeof define=="function"&&define)});var Db=He((Rb,hf)=>{(function(r,e,t){function o(i){var a=this;a.next=function(){var u=a.w,c=a.X,p=a.i,m,f;return a.w=u=u+1640531527|0,f=c[p+34&127],m=c[p=p+1&127],f^=f<<13,m^=m<<17,f^=f>>>15,m^=m>>>12,f=c[p]=f^m,a.i=p,f+(u^u>>>16)|0};function l(u,c){var p,m,f,d,g,h=[],b=128;for(c===(c|0)?(m=c,c=null):(c=c+"\0",m=0,b=Math.max(b,c.length)),f=0,d=-32;d<b;++d)c&&(m^=c.charCodeAt((d+32)%c.length)),d===0&&(g=m),m^=m<<10,m^=m>>>15,m^=m<<4,m^=m>>>13,d>=0&&(g=g+1640531527|0,p=h[d&127]^=m+g,f=p==0?f+1:0);for(f>=128&&(h[(c&&c.length||0)&127]=-1),f=127,d=4*128;d>0;--d)m=h[f+34&127],p=h[f=f+1&127],m^=m<<13,p^=p<<17,m^=m>>>15,p^=p>>>12,h[f]=m^p;u.w=g,u.X=h,u.i=f}l(a,i)}function n(i,a){return a.i=i.i,a.w=i.w,a.X=i.X.slice(),a}function s(i,a){i==null&&(i=+new Date);var l=new o(i),u=a&&a.state,c=function(){return(l.next()>>>0)/4294967296};return c.double=function(){do var p=l.next()>>>11,m=(l.next()>>>0)/4294967296,f=(p+m)/(1<<21);while(f===0);return f},c.int32=l.next,c.quick=c,u&&(u.X&&n(u,l),c.state=function(){return n(l,{})}),c}e&&e.exports?e.exports=s:t&&t.amd?t(function(){return s}):this.xor4096=s})(Rb,typeof hf=="object"&&hf,typeof define=="function"&&define)});var Ob=He((Fb,gf)=>{(function(r,e,t){function o(i){var a=this,l="";a.next=function(){var c=a.b,p=a.c,m=a.d,f=a.a;return c=c<<25^c>>>7^p,p=p-m|0,m=m<<24^m>>>8^f,f=f-c|0,a.b=c=c<<20^c>>>12^p,a.c=p=p-m|0,a.d=m<<16^p>>>16^f,a.a=f-c|0},a.a=0,a.b=0,a.c=2654435769|0,a.d=1367130551,i===Math.floor(i)?(a.a=i/4294967296|0,a.b=i|0):l+=i;for(var u=0;u<l.length+20;u++)a.b^=l.charCodeAt(u)|0,a.next()}function n(i,a){return a.a=i.a,a.b=i.b,a.c=i.c,a.d=i.d,a}function s(i,a){var l=new o(i),u=a&&a.state,c=function(){return(l.next()>>>0)/4294967296};return c.double=function(){do var p=l.next()>>>11,m=(l.next()>>>0)/4294967296,f=(p+m)/(1<<21);while(f===0);return f},c.int32=l.next,c.quick=c,u&&(typeof u=="object"&&n(u,l),c.state=function(){return n(l,{})}),c}e&&e.exports?e.exports=s:t&&t.amd?t(function(){return s}):this.tychei=s})(Fb,typeof gf=="object"&&gf,typeof define=="function"&&define)});var Pb=He(()=>{});var Bb=He((Lb,wu)=>{(function(r,e,t){var o=256,n=6,s=52,i="random",a=t.pow(o,n),l=t.pow(2,s),u=l*2,c=o-1,p;function m(k,S,I){var A=[];S=S==!0?{entropy:!0}:S||{};var R=h(g(S.entropy?[k,T(e)]:k==null?b():k,3),A),D=new f(A),P=function(){for(var L=D.g(n),z=a,B=0;L<l;)L=(L+B)*o,z*=o,B=D.g(1);for(;L>=u;)L/=2,z/=2,B>>>=1;return(L+B)/z};return P.int32=function(){return D.g(4)|0},P.quick=function(){return D.g(4)/4294967296},P.double=P,h(T(D.S),e),(S.pass||I||function(L,z,B,K){return K&&(K.S&&d(K,D),L.state=function(){return d(D,{})}),B?(t[i]=L,z):L})(P,R,"global"in S?S.global:this==t,S.state)}function f(k){var S,I=k.length,A=this,R=0,D=A.i=A.j=0,P=A.S=[];for(I||(k=[I++]);R<o;)P[R]=R++;for(R=0;R<o;R++)P[R]=P[D=c&D+k[R%I]+(S=P[R])],P[D]=S;(A.g=function(L){for(var z,B=0,K=A.i,W=A.j,X=A.S;L--;)z=X[K=c&K+1],B=B*o+X[c&(X[K]=X[W=c&W+z])+(X[W]=z)];return A.i=K,A.j=W,B})(o)}function d(k,S){return S.i=k.i,S.j=k.j,S.S=k.S.slice(),S}function g(k,S){var I=[],A=typeof k,R;if(S&&A=="object")for(R in k)try{I.push(g(k[R],S-1))}catch(D){}return I.length?I:A=="string"?k:k+"\0"}function h(k,S){for(var I=k+"",A,R=0;R<I.length;)S[c&R]=c&(A^=S[c&R]*19)+I.charCodeAt(R++);return T(S)}function b(){try{var k;return p&&(k=p.randomBytes)?k=k(o):(k=new Uint8Array(o),(r.crypto||r.msCrypto).getRandomValues(k)),T(k)}catch(A){var S=r.navigator,I=S&&S.plugins;return[+new Date,r,I,r.screen,T(e)]}}function T(k){return String.fromCharCode.apply(0,k)}if(h(t.random(),e),typeof wu=="object"&&wu.exports){wu.exports=m;try{p=Pb()}catch(k){}}else typeof define=="function"&&define.amd?define(function(){return m}):t["seed"+i]=m})(typeof self!="undefined"?self:Lb,[],Math)});var Vb=He((RQ,Mb)=>{var v$=kb(),T$=Sb(),C$=Ib(),k$=Ab(),N$=Db(),S$=Ob(),Ho=Bb();Ho.alea=v$;Ho.xor128=T$;Ho.xorwow=C$;Ho.xorshift7=k$;Ho.xor4096=N$;Ho.tychei=S$;Mb.exports=Ho});var ik=He((jVe,sk)=>{"use strict";function RB(r){if(arguments.length===0)throw new TypeError("1 argument required, but only 0 present.");if(r=`${r}`,r=r.replace(/[ \t\n\f\r]/g,""),r.length%4==0&&(r=r.replace(/==?$/,"")),r.length%4==1||/[^+/0-9A-Za-z]/.test(r))return null;let e="",t=0,o=0;for(let n=0;n<r.length;n++)t<<=6,t|=FB(r[n]),o+=6,o===24&&(e+=String.fromCharCode((t&16711680)>>16),e+=String.fromCharCode((t&65280)>>8),e+=String.fromCharCode(t&255),t=o=0);return o===12?(t>>=4,e+=String.fromCharCode(t)):o===18&&(t>>=2,e+=String.fromCharCode((t&65280)>>8),e+=String.fromCharCode(t&255)),e}var DB="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function FB(r){let e=DB.indexOf(r);return e<0?void 0:e}sk.exports=RB});var lk=He((HVe,ak)=>{"use strict";function OB(r){if(arguments.length===0)throw new TypeError("1 argument required, but only 0 present.");let e;for(r=`${r}`,e=0;e<r.length;e++)if(r.charCodeAt(e)>255)return null;let t="";for(e=0;e<r.length;e+=3){let o=[void 0,void 0,void 0,void 0];o[0]=r.charCodeAt(e)>>2,o[1]=(r.charCodeAt(e)&3)<<4,r.length>e+1&&(o[1]|=r.charCodeAt(e+1)>>4,o[2]=(r.charCodeAt(e+1)&15)<<2),r.length>e+2&&(o[2]|=r.charCodeAt(e+2)>>6,o[3]=r.charCodeAt(e+2)&63);for(let n=0;n<o.length;n++)typeof o[n]=="undefined"?t+="=":t+=LB(o[n])}return t}var PB="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function LB(r){if(r>=0&&r<64)return PB[r]}ak.exports=OB});var ck=He((qVe,uk)=>{"use strict";var BB=ik(),MB=lk();uk.exports={atob:BB,btoa:MB}});var fk=He((KVe,mk)=>{var pk=["utf8","utf-8","unicode-1-1-utf-8"];function VB(r){if(pk.indexOf(r)<0&&typeof r!="undefined"&&r!=null)throw new RangeError("Invalid encoding type. Only utf-8 is supported");this.encoding="utf-8",this.encode=function(e){if(typeof e!="string")throw new TypeError("passed argument must be of tye string");var t=unescape(encodeURIComponent(e)),o=new Uint8Array(t.length);let n=t.split("");for(let s=0;s<n.length;s++)o[s]=n[s].charCodeAt(0);return o}}function GB(r){if(pk.indexOf(r)<0&&typeof r!="undefined"&&r!=null)throw new RangeError("Invalid encoding type. Only utf-8 is supported");this.encoding="utf-8",this.decode=function(e,t){if(typeof e=="undefined")return"";var o=typeof t!="undefined"&&o in t?t.stream:!1;if(typeof o!="boolean")throw new TypeError("stream option must be boolean");if(ArrayBuffer.isView(e)){var n=new Uint8Array(e.buffer,e.byteOffset,e.byteLength),s=new Array(n.length);for(let i=0;i<n.length;i++)s[i]=String.fromCharCode(n[i]);return decodeURIComponent(escape(s.join("")))}else throw new TypeError("passed argument must be an array buffer view")}}mk.exports={TextEncoder:VB,TextDecoder:GB}});var vk=He((YVe,wk)=>{var yk="beadloop-model://",bk=24*1024*1024,_k=2e4;function jB(r={},e="develop"){let t=r.modelVersion||"v1";if(!/^[a-zA-Z0-9_-]+$/.test(t))throw new Error("\u624B\u90E8\u6A21\u578B\u7248\u672C\u914D\u7F6E\u65E0\u6548");let o=(r.modelBase||(e==="develop"?r.apiBase?r.apiBase.replace(/\/$/,"")+"/models":"":"https://static.example.com")).replace(/\/$/,"");if(!o||!(e==="develop"?/^https?:\/\//:/^https:\/\//).test(o))throw new Error("\u8BF7\u5148\u914D\u7F6E\u624B\u90E8\u6A21\u578B\u670D\u52A1\u5730\u5740");return{base:o,version:t}}function HB(r,e,t=()=>{},o={}){let n=r.getFileSystemManager(),s=r.env.USER_DATA_PATH+"/beadloop-handpose",i=s+"/"+e.version,a=i+"/complete.json",l=new Set,u=!1,c=0,p=0,m=-1,f=[],d=()=>{},g=o.limitBytes||bk,h=o.timeoutMs||_k,b=B=>{let K=Math.max(m,Math.min(100,Math.floor(B)));K!==m&&!u&&(m=K,t(K))},T=B=>{try{return n.accessSync(B),!0}catch(K){return!1}},k=B=>{try{n.unlinkSync(B)}catch(K){}},S=B=>{if(!/^(anchors\.json|(?:handdetector|handskeleton)\/[\w.-]+)$/.test(B)||B.includes(".."))throw new Error("\u624B\u90E8\u6A21\u578B\u6587\u4EF6\u8DEF\u5F84\u65E0\u6548");return i+"/"+B};function I(){u=!0;for(let B of l){B.reject(new Error("\u6A21\u578B\u52A0\u8F7D\u5DF2\u53D6\u6D88"));try{B.task.abort()}catch(K){}}l.clear()}function A(B){return JSON.parse(n.readFileSync(B,"utf8"))}function R(){try{let B=A(a);if(B.version!==e.version||!Array.isArray(B.files)||B.files.length<5)return!1;let K=new Set(B.files.map(X=>X.name));for(let X of["anchors.json","handdetector/model.json","handskeleton/model.json"])if(!K.has(X))return!1;let W=0;for(let X of B.files){if(!(X.size>0)||n.statSync(S(X.name)).size!==X.size)return!1;W+=X.size}if(W>g)return!1;for(let X of["handdetector","handskeleton"]){let se=A(S(X+"/model.json"));if(!Array.isArray(se.weightsManifest))return!1;for(let me of se.weightsManifest)for(let fe of me.paths)if(!K.has(X+"/"+fe))return!1}return Array.isArray(A(S("anchors.json")))?(f=B.files,!0):!1}catch(B){return!1}}function D(B){if(u)return Promise.reject(new Error("\u6A21\u578B\u52A0\u8F7D\u5DF2\u53D6\u6D88"));let K=S(B),W=K+".part";return new Promise((X,se)=>{let me=!1,fe={task:null,reject:De=>Ee(De)};function Ee(De){me||(me=!0,l.delete(fe),De||d(),De?(k(W),se(De)):X())}fe.task=r.downloadFile({url:e.base+"/handpose/"+e.version+"/"+B,filePath:W,timeout:h,success(De){if(u)return Ee(new Error("\u6A21\u578B\u52A0\u8F7D\u5DF2\u53D6\u6D88"));if(De.statusCode!==200)return Ee(new Error("\u624B\u90E8\u6A21\u578B\u4E0B\u8F7D\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u6216\u6539\u7528\u7167\u7247\u8BD5\u6234"));try{let at=n.statSync(W).size;if(!at||c+at>g)throw new Error("\u624B\u90E8\u6A21\u578B\u7F13\u5B58\u7A7A\u95F4\u4E0D\u8DB3\uFF0C\u8BF7\u6E05\u7406\u5B58\u50A8\u6216\u6539\u7528\u7167\u7247\u8BD5\u6234");/\.json$/.test(B)&&A(W),n.renameSync(W,K),f.push({name:B,size:at}),c+=at,p++,b(Math.min(99,p/7*100)),Ee()}catch(at){Ee(new Error(/space|quota|limit|空间/i.test(at.message||at.errMsg||"")?"\u624B\u90E8\u6A21\u578B\u7F13\u5B58\u7A7A\u95F4\u4E0D\u8DB3\uFF0C\u8BF7\u6E05\u7406\u5B58\u50A8\u6216\u6539\u7528\u7167\u7247\u8BD5\u6234":"\u624B\u90E8\u6A21\u578B\u7F13\u5B58\u5199\u5165\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u6216\u6539\u7528\u7167\u7247\u8BD5\u6234"))}},fail(De){Ee(new Error(/space|quota|limit/i.test(De.errMsg||"")?"\u624B\u90E8\u6A21\u578B\u7F13\u5B58\u7A7A\u95F4\u4E0D\u8DB3\uFF0C\u8BF7\u6E05\u7406\u5B58\u50A8\u6216\u6539\u7528\u7167\u7247\u8BD5\u6234":"\u624B\u90E8\u6A21\u578B\u4E0B\u8F7D\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u6216\u6539\u7528\u7167\u7247\u8BD5\u6234"))}}),me||l.add(fe),fe.task&&fe.task.onProgressUpdate&&fe.task.onProgressUpdate(De=>{if(!(u||me)){if(d(),c+(De.totalBytesExpectedToWrite||0)>g){Ee(new Error("\u624B\u90E8\u6A21\u578B\u7F13\u5B58\u7A7A\u95F4\u4E0D\u8DB3\uFF0C\u8BF7\u6E05\u7406\u5B58\u50A8\u6216\u6539\u7528\u7167\u7247\u8BD5\u6234"));try{fe.task.abort()}catch(at){}return}b(Math.min(99,(p+(De.progress||0)/100)/7*100))}})})}async function P(){if(b(0),R()){b(100);return}try{T(s)||n.mkdirSync(s,!0);for(let W of n.readdirSync(s))W!==e.version&&/^[\w-]+$/.test(W)&&n.rmdirSync(s+"/"+W,!0);n.mkdirSync(i+"/handdetector",!0),n.mkdirSync(i+"/handskeleton",!0)}catch(W){throw new Error("\u624B\u90E8\u6A21\u578B\u7F13\u5B58\u7A7A\u95F4\u4E0D\u53EF\u7528\uFF0C\u8BF7\u6E05\u7406\u5B58\u50A8\u6216\u6539\u7528\u7167\u7247\u8BD5\u6234")}f=[],c=0,p=0;let B=W=>{let X=S(W);try{let se=n.statSync(X).size;if(!se||c+se>g)throw new Error("invalid size");return/\.json$/.test(W)&&A(X),f.push({name:W,size:se}),c+=se,p++,b(Math.min(99,p/7*100)),d(),!0}catch(se){return k(X),!1}},K=async W=>{B(W)||await D(W)};for(let W of["handdetector","handskeleton"]){await K(W+"/model.json");let X=A(S(W+"/model.json"));if(!Array.isArray(X.weightsManifest))throw new Error("\u624B\u90E8\u6A21\u578B\u6587\u4EF6\u65E0\u6548");for(let se of X.weightsManifest){if(!Array.isArray(se.paths))throw new Error("\u624B\u90E8\u6A21\u578B\u6587\u4EF6\u65E0\u6548");for(let me of se.paths)await K(W+"/"+me)}}if(await K("anchors.json"),!Array.isArray(A(S("anchors.json"))))throw new Error("\u624B\u90E8\u6A21\u578B\u6587\u4EF6\u65E0\u6548");if(u)throw new Error("\u6A21\u578B\u52A0\u8F7D\u5DF2\u53D6\u6D88");try{n.writeFileSync(a,JSON.stringify({version:e.version,files:f}),"utf8")}catch(W){throw new Error("\u624B\u90E8\u6A21\u578B\u7F13\u5B58\u7A7A\u95F4\u4E0D\u8DB3\uFF0C\u8BF7\u6E05\u7406\u5B58\u50A8\u6216\u6539\u7528\u7167\u7247\u8BD5\u6234")}b(100)}async function L(){let B,K=!1,W=new Promise((X,se)=>{let me=()=>{clearTimeout(B),B=setTimeout(()=>{K=!0,I(),se(new Error("\u624B\u90E8\u6A21\u578B\u4E0B\u8F7D\u8FDE\u7EED 20 \u79D2\u65E0\u8FDB\u5EA6\uFF0C\u53EF\u91CD\u8BD5\u6216\u6539\u7528\u7167\u7247\u8BD5\u6234"))},h)};d=me,me()});try{await Promise.race([P(),W])}catch(X){throw I(),K?new Error("\u624B\u90E8\u6A21\u578B\u4E0B\u8F7D\u8FDE\u7EED 20 \u79D2\u65E0\u8FDB\u5EA6\uFF0C\u53EF\u91CD\u8BD5\u6216\u6539\u7528\u7167\u7247\u8BD5\u6234"):X}finally{clearTimeout(B),d=()=>{}}}async function z(B){if(u)throw new Error("\u6A21\u578B\u52A0\u8F7D\u5DF2\u53D6\u6D88");if(!B.startsWith(yk))throw new Error("\u624B\u90E8\u6A21\u578B\u5730\u5740\u65E0\u6548");let K=B.slice(yk.length),W=S(K),X=/\.json$/.test(K),se=n.readFileSync(W,X?"utf8":void 0);return{ok:!0,status:200,json:async()=>JSON.parse(se),text:async()=>se,arrayBuffer:async()=>se,headers:{get:()=>null}}}return{prepare:L,fetch:z,cancel:I}}wk.exports={resolveModelConfig:jB,createModelLoader:HB,LOAD_TIMEOUT:_k,LIMIT_BYTES:bk}});Dx(exports);re(exports,{createTracker:()=>qB});var Zf={};re(Zf,{Abs:()=>Tn,Acos:()=>ws,Acosh:()=>vs,AdadeltaOptimizer:()=>Jo,AdagradOptimizer:()=>en,AdamOptimizer:()=>tn,AdamaxOptimizer:()=>rn,Add:()=>xr,AddN:()=>Ts,All:()=>Cs,Any:()=>ks,ArgMax:()=>Ns,ArgMin:()=>Ss,Asin:()=>Es,Asinh:()=>Is,Atan:()=>$s,Atan2:()=>Rs,Atanh:()=>As,AvgPool:()=>Ds,AvgPool3D:()=>Fs,AvgPool3DGrad:()=>Hc,AvgPoolGrad:()=>jc,BatchMatMul:()=>Os,BatchToSpaceND:()=>Ps,Bincount:()=>Ls,BroadcastArgs:()=>Bs,BroadcastTo:()=>Qk,Cast:()=>Gr,Ceil:()=>co,ClipByValue:()=>Ms,Complex:()=>Cn,ComplexAbs:()=>Vs,Concat:()=>Gs,Conv2D:()=>zs,Conv2DBackpropFilter:()=>Us,Conv2DBackpropInput:()=>Ws,Conv3D:()=>js,Conv3DBackpropFilterV2:()=>qc,Conv3DBackpropInputV2:()=>Hs,Cos:()=>qs,Cosh:()=>Ks,CropAndResize:()=>Qs,Cumprod:()=>Xs,Cumsum:()=>Ys,DataStorage:()=>hs,DenseBincount:()=>Zs,DepthToSpace:()=>Js,DepthwiseConv2dNative:()=>ei,DepthwiseConv2dNativeBackpropFilter:()=>ti,DepthwiseConv2dNativeBackpropInput:()=>ri,Diag:()=>oi,Dilation2D:()=>ni,Dilation2DBackpropFilter:()=>Jk,Dilation2DBackpropInput:()=>Zk,ENV:()=>Yl,Einsum:()=>ii,Elu:()=>ai,EluGrad:()=>Kc,Environment:()=>bs,Equal:()=>po,Erf:()=>li,Exp:()=>mo,ExpandDims:()=>ui,Expm1:()=>fo,FFT:()=>ci,Fill:()=>pi,FlipLeftRight:()=>mi,Floor:()=>ho,FloorDiv:()=>fi,FromPixels:()=>In,FusedBatchNorm:()=>di,FusedConv2D:()=>An,FusedDepthwiseConv2D:()=>Rn,GatherNd:()=>gi,GatherV2:()=>hi,Greater:()=>go,GreaterEqual:()=>xo,IFFT:()=>xi,Identity:()=>zr,Imag:()=>yi,IsFinite:()=>bi,IsInf:()=>_i,IsNan:()=>wi,KernelBackend:()=>ao,LRN:()=>Ei,LRNGrad:()=>Xc,LeakyRelu:()=>vi,Less:()=>yo,LessEqual:()=>bo,LinSpace:()=>Ti,Log:()=>_o,Log1p:()=>Ci,LogSoftmax:()=>tN,LogicalAnd:()=>ki,LogicalNot:()=>Ni,LogicalOr:()=>Si,LogicalXor:()=>eN,LowerBound:()=>rN,Max:()=>Ii,MaxPool:()=>$i,MaxPool3D:()=>Ai,MaxPool3DGrad:()=>Qc,MaxPoolGrad:()=>Yc,MaxPoolWithArgmax:()=>Ri,Maximum:()=>wo,Mean:()=>Di,Min:()=>Fi,Minimum:()=>vo,MirrorPad:()=>Oi,Mod:()=>Pi,MomentumOptimizer:()=>on,Multinomial:()=>Li,Multiply:()=>To,Neg:()=>kn,NonMaxSuppressionV3:()=>Bi,NonMaxSuppressionV4:()=>Mi,NonMaxSuppressionV5:()=>Vi,NotEqual:()=>Co,OP_SCOPE_SUFFIX:()=>ou,OneHot:()=>zi,OnesLike:()=>Gi,Optimizer:()=>ot,OptimizerConstructors:()=>Yt,Pack:()=>Ui,PadV2:()=>Wi,Pool:()=>oN,Pow:()=>ji,Prelu:()=>Hi,Prod:()=>Nn,RMSPropOptimizer:()=>nn,RaggedGather:()=>qi,RaggedTensorToTensor:()=>Ki,Range:()=>Xi,Rank:()=>ru,Real:()=>Sn,RealDiv:()=>si,Reciprocal:()=>Yi,Reduction:()=>Te,Relu:()=>Qi,Relu6:()=>ta,Reshape:()=>Zi,ResizeBilinear:()=>ea,ResizeBilinearGrad:()=>Jc,ResizeNearestNeighbor:()=>Ji,ResizeNearestNeighborGrad:()=>Zc,Reverse:()=>ra,RotateWithOffset:()=>Fa,Round:()=>oa,Rsqrt:()=>ko,SGDOptimizer:()=>Dr,ScatterNd:()=>na,SearchSorted:()=>sa,Select:()=>ia,Selu:()=>aa,Sigmoid:()=>No,Sign:()=>ca,Sin:()=>la,Sinh:()=>ua,Slice:()=>En,Softmax:()=>ha,Softplus:()=>pa,SpaceToBatchND:()=>fa,SparseFillEmptyRows:()=>ga,SparseReshape:()=>xa,SparseSegmentMean:()=>ya,SparseSegmentSum:()=>ba,SparseToDense:()=>_a,SplitV:()=>da,Sqrt:()=>So,Square:()=>ep,SquaredDifference:()=>Eo,Step:()=>Da,StridedSlice:()=>wa,StringNGrams:()=>va,StringSplit:()=>Ta,StringToHashBucketFast:()=>Ca,Sub:()=>Io,Sum:()=>ma,Tan:()=>ka,Tanh:()=>Na,Tensor:()=>ue,TensorBuffer:()=>Ut,Tile:()=>$o,TopK:()=>Sa,Transform:()=>Ea,Transpose:()=>Ao,Unique:()=>Ia,Unpack:()=>$a,UnsortedSegmentSum:()=>Aa,UpperBound:()=>nN,Variable:()=>yr,ZerosLike:()=>Ra,_FusedMatMul:()=>$n,abs:()=>Le,acos:()=>Wp,acosh:()=>jp,add:()=>G,addN:()=>Hp,all:()=>qp,any:()=>Kp,argMax:()=>Xp,argMin:()=>Yp,asin:()=>Qp,asinh:()=>Zp,atan:()=>Jp,atan2:()=>em,atanh:()=>tm,avgPool:()=>Ka,avgPool3d:()=>sm,backend:()=>fS,backend_util:()=>N,basicLSTMCell:()=>im,batchNorm:()=>kr,batchNorm2d:()=>am,batchNorm3d:()=>lm,batchNorm4d:()=>um,batchToSpaceND:()=>Xa,bincount:()=>Ya,booleanMaskAsync:()=>Gb,broadcastArgs:()=>cm,broadcastTo:()=>Nr,broadcast_util:()=>Wa,browser:()=>Ha,buffer:()=>te,cast:()=>oe,ceil:()=>pm,clipByValue:()=>mm,clone:()=>lt,complex:()=>Je,concat:()=>ge,concat1d:()=>fm,concat2d:()=>Qa,concat3d:()=>dm,concat4d:()=>hm,conv1d:()=>gm,conv2d:()=>Sr,conv2dTranspose:()=>xm,conv3d:()=>ym,conv3dTranspose:()=>bm,copyRegisteredKernels:()=>uN,cos:()=>_m,cosh:()=>wm,cosineWindow:()=>Zn,cumprod:()=>vm,cumsum:()=>Tm,customGrad:()=>Ye,denseBincount:()=>Cm,deprecationWarn:()=>Hy,depthToSpace:()=>km,depthwiseConv2d:()=>Wo,device_util:()=>Hr,diag:()=>Nm,dilation2d:()=>Sm,disableDeprecationWarnings:()=>lS,dispose:()=>Ie,disposeVariables:()=>uS,div:()=>Z,divNoNan:()=>Em,dot:()=>Im,dropout:()=>Kb,einsum:()=>$m,elu:()=>Ja,enableDebugMode:()=>aS,enableProdMode:()=>iS,enclosingPowerOfTwo:()=>Cu,engine:()=>Xr,env:()=>E,equal:()=>Za,erf:()=>Am,euclideanNorm:()=>Dm,exp:()=>kt,expandDims:()=>Rt,expm1:()=>Fm,eye:()=>el,fft:()=>qo,fill:()=>jt,findBackend:()=>Yy,findBackendFactory:()=>mS,floor:()=>tl,floorDiv:()=>qa,fused:()=>ku,gather:()=>rl,gatherND:()=>Hb,gather_util:()=>Op,getBackend:()=>Hn,getGradient:()=>Ql,getKernel:()=>Fn,getKernelsForBackend:()=>Pa,grad:()=>_b,grads:()=>wb,greater:()=>Qr,greaterEqual:()=>ol,ifft:()=>eo,imag:()=>Tr,image:()=>Rr,inTopKAsync:()=>Xb,io:()=>Wn,irfft:()=>_l,isFinite:()=>Om,isInf:()=>Pm,isNaN:()=>Lm,keep:()=>ht,kernel_impls:()=>Qt,leakyRelu:()=>nl,less:()=>Bm,lessEqual:()=>jo,linalg:()=>G_,linspace:()=>Mm,localResponseNormalization:()=>Vm,log:()=>ur,log1p:()=>sl,logSigmoid:()=>Gm,logSoftmax:()=>zm,logSumExp:()=>al,logicalAnd:()=>Zr,logicalNot:()=>ll,logicalOr:()=>ul,logicalXor:()=>Um,losses:()=>z_,lowerBound:()=>Wm,matMul:()=>ie,math:()=>Fp,max:()=>Ht,maxPool:()=>cl,maxPool3d:()=>jm,maxPoolWithArgmax:()=>Hm,maximum:()=>pl,mean:()=>Jr,memory:()=>qy,meshgrid:()=>qm,min:()=>Xn,minimum:()=>ml,mirrorPad:()=>Km,mod:()=>Xm,moments:()=>Ym,movingAverage:()=>zb,mul:()=>F,multiRNNCell:()=>Qm,multinomial:()=>Zm,neg:()=>Ke,nextFrame:()=>Au,norm:()=>Yr,notEqual:()=>fl,oneHot:()=>jn,ones:()=>qt,onesLike:()=>Jm,op:()=>_,outerProduct:()=>ef,pad:()=>Kt,pad1d:()=>tf,pad2d:()=>rf,pad3d:()=>of,pad4d:()=>nf,pool:()=>sf,pow:()=>lr,prelu:()=>hl,print:()=>Ua,prod:()=>af,profile:()=>cS,raggedGather:()=>lf,raggedTensorToTensor:()=>uf,rand:()=>cf,randomGamma:()=>bf,randomNormal:()=>gl,randomStandardNormal:()=>_f,randomUniform:()=>xl,range:()=>$r,ready:()=>Xy,real:()=>ar,reciprocal:()=>wf,registerBackend:()=>Dp,registerGradient:()=>iN,registerKernel:()=>Zl,relu:()=>Ar,relu6:()=>yl,removeBackend:()=>Rp,reshape:()=>$,reverse:()=>gt,reverse1d:()=>vf,reverse2d:()=>Tf,reverse3d:()=>Cf,reverse4d:()=>kf,rfft:()=>Ko,round:()=>bl,rsqrt:()=>Nf,scalar:()=>j,scatterND:()=>Ub,scatter_util:()=>Lp,searchSorted:()=>Yn,selu:()=>Sf,separableConv2d:()=>Ef,serialization:()=>Mp,setBackend:()=>Ky,setPlatform:()=>dS,setdiff1dAsync:()=>If,sigmoid:()=>Ct,sign:()=>$f,signal:()=>V_,sin:()=>Af,sinh:()=>Rf,slice:()=>J,slice1d:()=>Df,slice2d:()=>Ff,slice3d:()=>Of,slice4d:()=>Pf,slice_util:()=>tt,softmax:()=>Lf,softplus:()=>il,spaceToBatchND:()=>dl,sparse:()=>U_,sparseToDense:()=>jb,spectral:()=>M_,split:()=>cr,sqrt:()=>rt,square:()=>Be,squaredDifference:()=>wl,squeeze:()=>pr,stack:()=>Qe,step:()=>vl,stridedSlice:()=>Bf,string:()=>W_,sub:()=>H,sum:()=>le,sumOutType:()=>jr,tan:()=>Mf,tanh:()=>Kn,tensor:()=>qe,tensor1d:()=>Oe,tensor2d:()=>Xt,tensor3d:()=>ja,tensor4d:()=>Vf,tensor5d:()=>Gf,tensor6d:()=>zf,tensor_util:()=>mp,test_util:()=>Up,tidy:()=>Y,tile:()=>Ir,time:()=>pS,topk:()=>Uf,train:()=>_A,transpose:()=>Mo,truncatedNormal:()=>Wf,unique:()=>jf,unregisterGradient:()=>lN,unregisterKernel:()=>aN,unsortedSegmentSum:()=>Hf,unstack:()=>xt,upcastType:()=>Ge,upperBound:()=>qf,util:()=>C,valueAndGrad:()=>vb,valueAndGrads:()=>Tb,variable:()=>Kf,variableGrads:()=>yu,version_core:()=>fb,where:()=>At,whereAsync:()=>Tl,zeros:()=>Nt,zerosLike:()=>Ae});var $k=1e-7,Ak=1e-4,hs=class{constructor(e,t){this.backend=e,this.dataMover=t,this.data=new WeakMap,this.dataIdsCount=0}get(e){return this.data.has(e)||this.dataMover.moveData(this.backend,e),this.data.get(e)}set(e,t){this.dataIdsCount++,this.data.set(e,t)}has(e){return this.data.has(e)}delete(e){return this.dataIdsCount--,this.data.delete(e)}numDataIds(){return this.dataIdsCount}},ao=class{refCount(e){return vt("refCount")}incRef(e){return vt("incRef")}timerAvailable(){return!0}time(e){return vt("time")}read(e){return vt("read")}readSync(e){return vt("readSync")}readToGPU(e,t){return vt("readToGPU")}numDataIds(){return vt("numDataIds")}disposeData(e,t){return vt("disposeData")}write(e,t,o){return vt("write")}move(e,t,o,n,s){return vt("move")}memory(){return vt("memory")}floatPrecision(){return vt("floatPrecision")}epsilon(){return this.floatPrecision()===32?$k:Ak}dispose(){return vt("dispose")}};function vt(r){throw new Error(`'${r}' not yet implemented or not found in the registry. This kernel may not be supported by the tfjs backend you have chosen`)}function Fx(r){let e=r.length,t=0;for(;e>0;)t=Math.random()*e|0,e--,Kl(r,e,t)}function Rk(r,e){if(r.length!==e.length)throw new Error(`Array sizes must match to be shuffled together First array length was ${r.length}Second array length was ${e.length}`);let t=r.length,o=0;for(;t>0;)o=Math.random()*t|0,t--,Kl(r,t,o),Kl(e,t,o)}function bn(r,e,t){return Math.max(r,Math.min(e,t))}function Dk(r){return r%2==0?r:r+1}function Kl(r,e,t){let o=r[e];r[e]=r[t],r[t]=o}function Fk(r){let e=0;for(let t=0;t<r.length;t++)e+=r[t];return e}function Ok(r,e){let t=Math.random();return e*t+(1-t)*r}function Pk(r,e){let t=0;for(let o=0;o<r.length;o++){let n=Number(r[o])-Number(e[o]);t+=n*n}return t}function v(r,e){if(!r)throw new Error(typeof e=="string"?e:e())}function xe(r,e,t=""){v(pt(r,e),()=>t+` Shapes ${r} and ${e} must match`)}function Tt(r){v(r!=null,()=>"The input to the tensor constructor must be a non-null value.")}function Vt(r,e=[],t=!1){if(e==null&&(e=[]),Array.isArray(r)||Fe(r)&&!t)for(let o=0;o<r.length;++o)Vt(r[o],e,t);else e.push(r);return e}function ne(r){if(r.length===0)return 1;let e=r[0];for(let t=1;t<r.length;t++)e*=r[t];return e}function Lk(r){return r.length===0}function pt(r,e){if(r===e)return!0;if(r==null||e==null||r.length!==e.length)return!1;for(let t=0;t<r.length;t++)if(r[t]!==e[t])return!1;return!0}function gr(r){return r%1==0}function Bk(r){if(Math.tanh!=null)return Math.tanh(r);if(r===Infinity)return 1;if(r===-Infinity)return-1;{let e=Math.exp(2*r);return(e-1)/(e+1)}}function Mk(r){let e=Math.ceil(Math.sqrt(r));return[e,Math.ceil(r/e)]}function Vk(r){let e=new Uint32Array(r);for(let t=0;t<r;++t)e[t]=t;return Fx(e),e}function lo(r,e){return e<=r.length?r:r+" ".repeat(e-r.length)}function Gk(r,e=n=>0,t,o=setTimeout){return new Promise((n,s)=>{let i=0,a=()=>{if(r()){n();return}i++;let l=e(i);if(t!=null&&i>=t){s();return}o(a,l)};a()})}function zk(r,e){let t=1,o=-1;for(let s=0;s<r.length;++s)if(r[s]>=0)t*=r[s];else if(r[s]===-1){if(o!==-1)throw Error(`Shapes can only have 1 implicit size. Found -1 at dim ${o} and dim ${s}`);o=s}else if(r[s]<0)throw Error(`Shapes can not be < 0. Found ${r[s]} at dim ${s}`);if(o===-1){if(e>0&&e!==t)throw Error(`Size(${e}) must match the product of shape ${r}`);return r}if(t===0)throw Error(`Cannot infer the missing size in [${r}] when there are 0 elements`);if(e%t!=0)throw Error(`The implicit shape can't be a fractional number. Got ${e} / ${t}`);let n=r.slice();return n[o]=e/t,n}function Vr(r,e){let t=e.length;return r=r==null?e.map((o,n)=>n):[].concat(r),v(r.every(o=>o>=-t&&o<t),()=>`All values in axis param must be in range [-${t}, ${t}) but got axis ${r}`),v(r.every(o=>gr(o)),()=>`All values in axis param must be integers but got axis ${r}`),r.map(o=>o<0?t+o:o)}function Lc(r,e){let t=[],o=[],n=e!=null&&Array.isArray(e)&&e.length===0,s=e==null||n?null:Vr(e,r).sort(),i=0;for(let a=0;a<r.length;++a){if(s!=null){if(s[i]===a&&r[a]!==1)throw new Error(`Can't squeeze axis ${a} since its dim '${r[a]}' is not 1`);(s[i]==null||s[i]>a)&&r[a]===1&&(t.push(r[a]),o.push(a)),s[i]<=a&&i++}r[a]!==1&&(t.push(r[a]),o.push(a))}return{newShape:t,keptDims:o}}function Bc(r,e){let t=null;if(r==null||r==="float32")t=new Float32Array(e);else if(r==="int32")t=new Int32Array(e);else if(r==="bool")t=new Uint8Array(e);else throw new Error(`Unknown data type ${r}`);return t}function Mc(r,e){let t=null;if(r==null||r==="float32")t=new Float32Array(e);else if(r==="int32")t=new Int32Array(e);else if(r==="bool")t=new Uint8Array(e);else if(r==="string")t=new Array(e);else throw new Error(`Unknown data type ${r}`);return t}function Vc(r,e){for(let t=0;t<r.length;t++){let o=r[t];if(isNaN(o)||!isFinite(o))throw Error(`A tensor of type ${e} being uploaded contains ${o}.`)}}function Gc(r){return r==="bool"||r==="complex64"||r==="float32"||r==="int32"||r==="string"}function Uk(r,e){return!(e==="complex64"||e==="float32"&&r!=="complex64"||e==="int32"&&r!=="float32"&&r!=="complex64"||e==="bool"&&r==="bool")}function Fe(r){return r instanceof Float32Array||r instanceof Int32Array||r instanceof Uint8Array||r instanceof Uint8ClampedArray}function Xl(r){if(r==="float32"||r==="int32")return 4;if(r==="complex64")return 8;if(r==="bool")return 1;throw new Error(`Unknown dtype ${r}`)}function zc(r){if(r==null)return 0;let e=0;return r.forEach(t=>e+=t.length),e}function Gt(r){return typeof r=="string"||r instanceof String}function Ox(r){return typeof r=="boolean"}function Px(r){return typeof r=="number"}function _n(r){return Array.isArray(r)?_n(r[0]):r instanceof Float32Array?"float32":r instanceof Int32Array||r instanceof Uint8Array||r instanceof Uint8ClampedArray?"int32":Px(r)?"float32":Gt(r)?"string":Ox(r)?"bool":"float32"}function or(r){return!!(r&&r.constructor&&r.call&&r.apply)}function wn(r,e){for(let t=e;t<r;++t)if(r%t==0)return t;return r}function nr(r){let e=r.length;if(e<2)return[];let t=new Array(e-1);t[e-2]=r[e-1];for(let o=e-3;o>=0;--o)t[o]=t[o+1]*r[o+1];return t}function Lx(r,e,t,o=!1){let n=new Array;if(e.length===1){let s=e[0]*(o?2:1);for(let i=0;i<s;i++)n[i]=t[r+i]}else{let s=e[0],i=e.slice(1),a=i.reduce((l,u)=>l*u)*(o?2:1);for(let l=0;l<s;l++)n[l]=Lx(r+l*a,i,t,o)}return n}function uo(r,e,t=!1){if(r.length===0)return e[0];let o=r.reduce((n,s)=>n*s)*(t?2:1);if(o===0)return[];if(o!==e.length)throw new Error(`[${r}] does not match the input size ${e.length}${t?" for a complex tensor":""}.`);return Lx(0,r,e,t)}function gs(r,e){let t=vn(r,e);for(let o=0;o<t.length;o++)t[o]=1;return t}function vn(r,e){if(e==null||e==="float32"||e==="complex64")return new Float32Array(r);if(e==="int32")return new Int32Array(r);if(e==="bool")return new Uint8Array(r);throw new Error(`Unknown data type ${e}`)}function Wk(r,e){let t=r.reduce((o,n)=>o*n,1);if(e==null||e==="float32")return uo(r,new Float32Array(t));if(e==="int32")return uo(r,new Int32Array(t));if(e==="bool")return uo(r,new Uint8Array(t));throw new Error(`Unknown data type ${e}`)}function xs(r){r.forEach(e=>{v(Number.isInteger(e)&&e>=0,()=>`Tensor must have a shape comprised of positive integers but got shape [${r}].`)})}function jk(r,e,t){if(e===0)return 0;if(e===1)return r[0];let o=r[r.length-1];for(let n=0;n<r.length-1;++n)o+=t[n]*r[n];return o}function Hk(r,e,t){if(e===0)return[];if(e===1)return[r];let o=new Array(e);for(let n=0;n<o.length-1;++n)o[n]=Math.floor(r/t[n]),r-=o[n]*t[n];return o[o.length-1]=r,o}function ys(r){return r&&r.then&&typeof r.then=="function"}var Bx="tfjsflags",bs=class{constructor(e){this.global=e,this.flags={},this.flagRegistry={},this.urlFlags={},this.getQueryParams=qk,this.populateURLFlags()}setPlatform(e,t){this.platform!=null&&(E().getBool("IS_TEST")||E().getBool("PROD")||console.warn(`Platform ${this.platformName} has already been set. Overwriting the platform with ${e}.`)),this.platformName=e,this.platform=t}registerFlag(e,t,o){if(this.flagRegistry[e]={evaluationFn:t,setHook:o},this.urlFlags[e]!=null){let n=this.urlFlags[e];E().getBool("IS_TEST")||E().getBool("PROD")||console.warn(`Setting feature override from URL ${e}: ${n}.`),this.set(e,n)}}async getAsync(e){return e in this.flags?this.flags[e]:(this.flags[e]=await this.evaluateFlag(e),this.flags[e])}get(e){if(e in this.flags)return this.flags[e];let t=this.evaluateFlag(e);if(ys(t))throw new Error(`Flag ${e} cannot be synchronously evaluated. Please use getAsync() instead.`);return this.flags[e]=t,this.flags[e]}getNumber(e){return this.get(e)}getBool(e){return this.get(e)}getFlags(){return this.flags}get features(){return this.flags}set(e,t){if(this.flagRegistry[e]==null)throw new Error(`Cannot set flag ${e} as it has not been registered.`);this.flags[e]=t,this.flagRegistry[e].setHook!=null&&this.flagRegistry[e].setHook(t)}evaluateFlag(e){if(this.flagRegistry[e]==null)throw new Error(`Cannot evaluate flag '${e}': no evaluation function found.`);return this.flagRegistry[e].evaluationFn()}setFlags(e){this.flags=Object.assign({},e)}reset(){this.flags={},this.urlFlags={},this.populateURLFlags()}populateURLFlags(){if(typeof this.global=="undefined"||typeof this.global.location=="undefined"||typeof this.global.location.search=="undefined")return;let e=this.getQueryParams(this.global.location.search);Bx in e&&e[Bx].split(",").forEach(o=>{let[n,s]=o.split(":");this.urlFlags[n]=Xk(n,s)})}};function qk(r){let e={};return r.replace(/[?&]([^=?&]+)(?:=([^&]*))?/g,(t,...o)=>(Kk(e,o[0],o[1]),o.join("="))),e}function Kk(r,e,t){r[decodeURIComponent(e)]=decodeURIComponent(t||"")}function Xk(r,e){if(e=e.toLowerCase(),e==="true"||e==="false")return e==="true";if(`${+e}`===e)return+e;throw new Error(`Could not parse value flag value ${e} for flag ${r}.`)}function E(){return Yl}var Yl=null;function Mx(r){Yl=r}var Uc;function Wc(){if(Uc==null){let r;if(typeof window!="undefined")r=window;else if(typeof global!="undefined")r=global;else if(typeof process!="undefined")r=process;else if(typeof self!="undefined")r=self;else throw new Error("Could not find a global object");Uc=r}return Uc}function Yk(){let r=Wc();return r._tfGlobals==null&&(r._tfGlobals=new Map),r._tfGlobals}function _s(r,e){let t=Yk();if(t.has(r))return t.get(r);{let o=e();return t.set(r,o),t.get(r)}}var Tn="Abs",ws="Acos",vs="Acosh",xr="Add",Ts="AddN",Cs="All",ks="Any",Ns="ArgMax",Ss="ArgMin",Es="Asin",Is="Asinh",$s="Atan",As="Atanh",Rs="Atan2",Ds="AvgPool",jc="AvgPoolGrad",Fs="AvgPool3D",Hc="AvgPool3DGrad",Os="BatchMatMul",Ps="BatchToSpaceND",Ls="Bincount",Qk="BroadcastTo",Bs="BroadcastArgs",Gr="Cast",co="Ceil",Ms="ClipByValue",Cn="Complex",Vs="ComplexAbs",Gs="Concat",zs="Conv2D",Us="Conv2DBackpropFilter",Ws="Conv2DBackpropInput",js="Conv3D",qc="Conv3DBackpropFilterV2",Hs="Conv3DBackpropInputV2",qs="Cos",Ks="Cosh",Xs="Cumprod",Ys="Cumsum",Qs="CropAndResize",Zs="DenseBincount",Js="DepthToSpace",ei="DepthwiseConv2dNative",ti="DepthwiseConv2dNativeBackpropFilter",ri="DepthwiseConv2dNativeBackpropInput",oi="Diag",ni="Dilation2D",Zk="Dilation2DBackpropInput",Jk="Dilation2DBackpropFilter",si="RealDiv",ii="Einsum",ai="Elu",Kc="EluGrad",li="Erf",po="Equal",mo="Exp",ui="ExpandDims",fo="Expm1",ci="FFT",pi="Fill",mi="FlipLeftRight",ho="Floor",fi="FloorDiv",di="FusedBatchNorm",hi="GatherV2",gi="GatherNd",go="Greater",xo="GreaterEqual",zr="Identity",xi="IFFT",yi="Imag",bi="IsFinite",_i="IsInf",wi="IsNan",vi="LeakyRelu",yo="Less",bo="LessEqual",Ti="LinSpace",_o="Log",Ci="Log1p",ki="LogicalAnd",Ni="LogicalNot",Si="LogicalOr",eN="LogicalXor",tN="LogSoftmax",rN="LowerBound",Ei="LRN",Xc="LRNGrad",Ii="Max",wo="Maximum",$i="MaxPool",Yc="MaxPoolGrad",Ai="MaxPool3D",Qc="MaxPool3DGrad",Ri="MaxPoolWithArgmax",Di="Mean",Fi="Min",vo="Minimum",Oi="MirrorPad",Pi="Mod",Li="Multinomial",To="Multiply",kn="Neg",Co="NotEqual",Bi="NonMaxSuppressionV3",Mi="NonMaxSuppressionV4",Vi="NonMaxSuppressionV5",Gi="OnesLike",zi="OneHot",Ui="Pack",Wi="PadV2",oN="Pool",ji="Pow",Hi="Prelu",Nn="Prod",qi="RaggedGather",Ki="RaggedTensorToTensor",Xi="Range",Sn="Real",Yi="Reciprocal",Qi="Relu",Zi="Reshape",Ji="ResizeNearestNeighbor",Zc="ResizeNearestNeighborGrad",ea="ResizeBilinear",Jc="ResizeBilinearGrad",ta="Relu6",ra="Reverse",oa="Round",ko="Rsqrt",na="ScatterNd",sa="SearchSorted",ia="Select",aa="Selu",En="Slice",la="Sin",ua="Sinh",ca="Sign",No="Sigmoid",pa="Softplus",So="Sqrt",ma="Sum",fa="SpaceToBatchND",da="SplitV",ha="Softmax",ga="SparseFillEmptyRows",xa="SparseReshape",ya="SparseSegmentMean",ba="SparseSegmentSum",_a="SparseToDense",Eo="SquaredDifference",ep="Square",wa="StridedSlice",va="StringNGrams",Ta="StringSplit",Ca="StringToHashBucketFast",Io="Sub",ka="Tan",Na="Tanh",$o="Tile",Sa="TopK",Ea="Transform",Ao="Transpose",Ia="Unique",$a="Unpack",Aa="UnsortedSegmentSum",nN="UpperBound",Ra="ZerosLike",Da="Step",In="FromPixels",Fa="RotateWithOffset",$n="_FusedMatMul",An="FusedConv2D",Rn="FusedDepthwiseConv2D";function sr(...r){E().getBool("IS_TEST")||E().getBool("PROD")||console.warn(...r)}function sN(...r){E().getBool("IS_TEST")||E().getBool("PROD")||console.log(...r)}var Dn=_s("kernelRegistry",()=>new Map),Oa=_s("gradRegistry",()=>new Map);function Fn(r,e){let t=tp(r,e);return Dn.get(t)}function Ql(r){return Oa.get(r)}function Pa(r){let e=Dn.entries(),t=[];for(;;){let{done:o,value:n}=e.next();if(o)break;let[s,i]=n,[a]=s.split("_");a===r&&t.push(i)}return t}function Zl(r){let{kernelName:e,backendName:t}=r,o=tp(e,t);Dn.has(o)&&sr(`The kernel '${e}' for backend '${t}' is already registered`),Dn.set(o,r)}function iN(r){let{kernelName:e}=r;Oa.has(e)&&E().getBool("DEBUG")&&sr(`Overriding the gradient for '${e}'`),Oa.set(e,r)}function aN(r,e){let t=tp(r,e);if(!Dn.has(t))throw new Error(`The kernel '${r}' for backend '${e}' is not registered`);Dn.delete(t)}function lN(r){if(!Oa.has(r))throw new Error(`The gradient '${r}' for backend is not registered`);Oa.delete(r)}function uN(r,e){Pa(r).forEach(o=>{let n=Object.assign({},o,{backendName:e});Zl(n)})}function tp(r,e){return`${e}_${r}`}var C={};re(C,{arraysEqual:()=>pt,assert:()=>v,assertNonNegativeIntegerDimensions:()=>xs,assertNonNull:()=>Tt,assertShapesMatch:()=>xe,bytesFromStringArray:()=>zc,bytesPerElement:()=>Xl,checkConversionForErrors:()=>Vc,clamp:()=>bn,computeStrides:()=>nr,createScalarValue:()=>gN,createShuffledIndices:()=>Vk,decodeString:()=>Bn,distSquared:()=>Pk,encodeString:()=>Wr,fetch:()=>yN,fingerPrint64:()=>hN,flatten:()=>Vt,getArrayFromDType:()=>Mc,getTypedArrayFromDType:()=>Bc,hasEncodingLoss:()=>Uk,hexToLong:()=>La,indexToLoc:()=>Hk,inferDtype:()=>_n,inferFromImplicitShape:()=>zk,isBoolean:()=>Ox,isFunction:()=>or,isInt:()=>gr,isNumber:()=>Px,isPromise:()=>ys,isScalarShape:()=>Lk,isString:()=>Gt,isTypedArray:()=>Fe,isValidDtype:()=>Gc,locToIndex:()=>jk,makeOnesTypedArray:()=>gs,makeZerosNestedTypedArray:()=>Wk,makeZerosTypedArray:()=>vn,nearestDivisor:()=>wn,nearestLargerEven:()=>Dk,now:()=>Po,parseAxisParam:()=>Vr,randUniform:()=>Ok,repeatedTry:()=>Gk,rightPad:()=>lo,shuffle:()=>Fx,shuffleCombo:()=>Rk,sizeFromShape:()=>ne,sizeToSquarishShape:()=>Mk,squeezeShape:()=>Lc,sum:()=>Fk,swap:()=>Kl,tanh:()=>Bk,toNestedArray:()=>uo,toTypedArray:()=>Ln});var Qx=ds(Yx());var Fo=Qx.default||Qx;function La(r){return Fo.fromString(r,!0,16)}var Zx=La("c3a5c85c97cb3127"),Oo=La("b492b66fbe98f273"),Ze=La("9ae16a3b2f90404f");function np(r){return r.xor(r.shru(47))}function Jx(r,e,t){let o=r.slice(e,e+t);return Fo.fromBytes(Array.from(o),!0,!0)}function be(r,e){return Jx(r,e,8)}function ey(r,e){return Jx(r,e,4)}function Me(r,e){return e===0?r:r.shru(e).or(r.shl(64-e))}function Ur(r,e,t=La("9ddfea08eb382d69")){let o=r.xor(e).mul(t);o=o.xor(o.shru(47));let n=e.xor(o).mul(t);return n=n.xor(n.shru(47)),n=n.mul(t),n}function pN(r,e,t,o,n,s){n=n.add(r),s=Me(s.add(n).add(o),21);let i=n;return n=n.add(e),n=n.add(t),s=s.add(Me(n,44)),[n.add(o),s.add(i)]}function eu(r,e,t,o){return pN(be(r,e),be(r,e+8),be(r,e+16),be(r,e+24),t,o)}function mN(r,e=r.length){if(e>=8){let t=Ze.add(e*2),o=be(r,0).add(Ze),n=be(r,e-8),s=Me(n,37).mul(t).add(o),i=Me(o,25).add(n).mul(t);return Ur(s,i,t)}if(e>=4){let t=Ze.add(e*2),o=ey(r,0);return Ur(o.shl(3).add(e),ey(r,e-4),t)}if(e>0){let t=r[0],o=r[e>>1],n=r[e-1],s=t+(o<<8),i=e+(n<<2);return np(Ze.mul(s).xor(Zx.mul(i))).mul(Ze)}return Ze}function fN(r,e=r.length){let t=Ze.add(e*2),o=be(r,0).mul(Oo),n=be(r,8),s=be(r,e-8).mul(t),i=be(r,e-16).mul(Ze);return Ur(Me(o.add(n),43).add(Me(s,30)).add(i),o.add(Me(n.add(Ze),18)).add(s),t)}function dN(r,e=r.length){let t=Ze.add(e*2),o=be(r,0).mul(Ze),n=be(r,8),s=be(r,e-8).mul(t),i=be(r,e-16).mul(Ze),a=Me(o.add(n),43).add(Me(s,30)).add(i),l=Ur(a,o.add(Me(n.add(Ze),18)).add(s),t),u=be(r,16).mul(t),c=be(r,24),p=a.add(be(r,e-32)).mul(t),m=l.add(be(r,e-24)).mul(t);return Ur(Me(u.add(c),43).add(Me(p,30)).add(m),u.add(Me(c.add(o),18)).add(p),t)}function hN(r,e=r.length){let t=Fo.fromNumber(81,!0);if(e<=32)return e<=16?mN(r,e):fN(r,e);if(e<=64)return dN(r,e);let o=t,n=t.mul(Oo).add(113),s=np(n.mul(Ze).add(113)).mul(Ze),i=[Fo.UZERO,Fo.UZERO],a=[Fo.UZERO,Fo.UZERO];o=o.mul(Ze).add(be(r,0));let l=0,u=(e-1>>6)*64,c=u+(e-1&63)-63;do o=Me(o.add(n).add(i[0]).add(be(r,l+8)),37).mul(Oo),n=Me(n.add(i[1]).add(be(r,l+48)),42).mul(Oo),o=o.xor(a[1]),n=n.add(i[0]).add(be(r,l+40)),s=Me(s.add(a[0]),33).mul(Oo),i=eu(r,l,i[1].mul(Oo),o.add(a[0])),a=eu(r,l+32,s.add(a[1]),n.add(be(r,l+16))),[s,o]=[o,s],l+=64;while(l!==u);let p=Oo.add(s.and(255).shl(1));return l=c,a[0]=a[0].add(e-1&63),i[0]=i[0].add(a[0]),a[0]=a[0].add(i[0]),o=Me(o.add(n).add(i[0]).add(be(r,l+8)),37).mul(p),n=Me(n.add(i[1]).add(be(r,l+48)),42).mul(p),o=o.xor(a[1].mul(9)),n=n.add(i[0].mul(9).add(be(r,l+40))),s=Me(s.add(a[0]),33).mul(p),i=eu(r,l,i[1].mul(p),o.add(a[0])),a=eu(r,l+32,s.add(a[1]),n.add(be(r,l+16))),[s,o]=[o,s],Ur(Ur(i[0],a[0],p).add(np(n).mul(Zx)).add(s),Ur(i[1],a[1],p).add(o),p)}function gN(r,e){return e==="string"?Wr(r):Ln([r],e)}function xN(r,e){return r instanceof Float32Array&&e==="float32"||r instanceof Int32Array&&e==="int32"||r instanceof Uint8Array&&e==="bool"}function Ln(r,e){if(e==="string")throw new Error("Cannot convert a string[] to a TypedArray");if(Array.isArray(r)&&(r=Vt(r)),E().getBool("DEBUG")&&Vc(r,e),xN(r,e))return r;if(e==null||e==="float32"||e==="complex64")return new Float32Array(r);if(e==="int32")return new Int32Array(r);if(e==="bool"){let t=new Uint8Array(r.length);for(let o=0;o<t.length;++o)Math.round(r[o])!==0&&(t[o]=1);return t}else throw new Error(`Unknown data type ${e}`)}function Po(){return E().platform.now()}function yN(r,e){return E().platform.fetch(r,e)}function Wr(r,e="utf-8"){return e=e||"utf-8",E().platform.encode(r,e)}function Bn(r,e="utf-8"){return e=e||"utf-8",E().platform.decode(r,e)}var sp=class{constructor(e,t){this.backendTimer=e,this.logger=t,t==null&&(this.logger=new ty)}profileKernel(e,t,o){let n,s=()=>{n=o()},i,a=Po();if(this.backendTimer.timerAvailable())i=this.backendTimer.time(s);else{s();for(let u of n)u.dataSync();i=Promise.resolve({kernelMs:Po()-a})}if(E().getBool("CHECK_COMPUTATION_FOR_ERRORS"))for(let u=0;u<n.length;u++){let c=n[u];c.data().then(p=>{bN(p,c.dtype,e)})}return{kernelName:e,outputs:n,inputs:t,timeMs:i.then(u=>u.kernelMs),extraInfo:i.then(u=>u.getExtraProfileInfo!=null?u.getExtraProfileInfo():"")}}logKernelProfile(e){let{kernelName:t,outputs:o,timeMs:n,inputs:s,extraInfo:i}=e;o.forEach(a=>{Promise.all([a.data(),n,i]).then(l=>{this.logger.logKernelProfile(t,a,l[0],l[1],s,l[2])})})}};function bN(r,e,t){if(e!=="float32")return!1;for(let o=0;o<r.length;o++){let n=r[o];if(isNaN(n)||!isFinite(n))return console.warn(`Found ${n} in the result of '${t}'`),!0}return!1}var ty=class{logKernelProfile(e,t,o,n,s,i){let a=typeof n=="number"?lo(`${n}ms`,9):n.error,l=lo(e,25),u=t.rank,c=t.size,p=lo(t.shape.toString(),14),m="";for(let f in s){let d=s[f];if(d!=null){let g=d.shape||t.shape,h=g.length;m+=`${f}: ${h}D ${h>0?g:""} `}}console.log(`%c${l}	%c${a}	%c${u}D ${p}	%c${c}	%c${m}	%c${i}`,"font-weight:bold","color:red","color:blue","color: orange","color: green","color: steelblue")}};function ry(r,e,t){let o={},n={};for(let l=0;l<e.length;l++)o[e[l].id]=!0;for(let l=0;l<r.length;l++){let u=r[l],c=u.inputs;for(let p in c){let m=c[p],f=!1;for(let d=0;d<e.length;d++)if(o[m.id]){u.outputs.forEach(g=>o[g.id]=!0),f=!0,n[u.id]=!0;break}if(f)break}}let s={};s[t.id]=!0;let i={};for(let l=r.length-1;l>=0;l--){let u=r[l],c=u.inputs;for(let p=0;p<u.outputs.length;p++)if(s[u.outputs[p].id]){for(let m in c)s[c[m].id]=!0,i[u.id]=!0;break}}let a=[];for(let l=0;l<r.length;l++){let u=r[l];if(n[u.id]&&i[u.id]){let c={};for(let m in u.inputs){let f=u.inputs[m];o[f.id]&&(c[m]=f)}let p=Object.assign({},u);p.inputs=c,p.outputs=u.outputs,a.push(p)}}return a}function oy(r,e,t,o){for(let n=e.length-1;n>=0;n--){let s=e[n],i=[];if(s.outputs.forEach(l=>{let u=r[l.id];u!=null?i.push(u):i.push(null)}),s.gradient==null)throw new Error(`Cannot compute gradient: gradient function not found for ${s.kernelName}.`);let a=s.gradient(i);for(let l in s.inputs){if(!(l in a))throw new Error(`Cannot backprop through input ${l}. Available gradients found: ${Object.keys(a)}.`);let u=t(()=>a[l]());if(u.dtype!=="float32")throw new Error(`Error in gradient for op ${s.kernelName}. The gradient of input ${l} must have 'float32' dtype, but has '${u.dtype}'`);let c=s.inputs[l];if(!pt(u.shape,c.shape))throw new Error(`Error in gradient for op ${s.kernelName}. The gradient of input '${l}' has shape '${u.shape}', which does not match the shape of the input '${c.shape}'`);if(r[c.id]==null)r[c.id]=u;else{let p=r[c.id];r[c.id]=o(p,u),p.dispose()}}}}var ny=20,Ba=3,ip=7;function sy(r,e,t,o){let n=nr(e),s=_N(r,e,t,n),i=e.length,a=tu(r,e,t,n,s),l=["Tensor"];return o&&(l.push(`  dtype: ${t}`),l.push(`  rank: ${i}`),l.push(`  shape: [${e}]`),l.push("  values:")),l.push(a.map(u=>"    "+u).join(`
`)),l.join(`
`)}function _N(r,e,t,o){let n=ne(e),s=o[o.length-1],i=new Array(s).fill(0),a=e.length,l=t==="complex64"?Va(r):r;if(a>1)for(let u=0;u<n/s;u++){let c=u*s;for(let p=0;p<s;p++)i[p]=Math.max(i[p],Ma(l[c+p],0,t).length)}return i}function Ma(r,e,t){let o;return Array.isArray(r)?o=`${parseFloat(r[0].toFixed(ip))} + ${parseFloat(r[1].toFixed(ip))}j`:Gt(r)?o=`'${r}'`:t==="bool"?o=iy(r):o=parseFloat(r.toFixed(ip)).toString(),lo(o,e)}function iy(r){return r===0?"false":"true"}function tu(r,e,t,o,n,s=!0){let i=t==="complex64"?2:1,a=e[0],l=e.length;if(l===0){if(t==="complex64"){let g=Va(r);return[Ma(g[0],0,t)]}return t==="bool"?[iy(r[0])]:[r[0].toString()]}if(l===1){if(a>ny){let h=Ba*i,b=Array.from(r.slice(0,h)),T=Array.from(r.slice((a-Ba)*i,a*i));return t==="complex64"&&(b=Va(b),T=Va(T)),["["+b.map((k,S)=>Ma(k,n[S],t)).join(", ")+", ..., "+T.map((k,S)=>Ma(k,n[a-Ba+S],t)).join(", ")+"]"]}let g=t==="complex64"?Va(r):Array.from(r);return["["+g.map((h,b)=>Ma(h,n[b],t)).join(", ")+"]"]}let u=e.slice(1),c=o.slice(1),p=o[0]*i,m=[];if(a>ny){for(let g=0;g<Ba;g++){let h=g*p,b=h+p;m.push(...tu(r.slice(h,b),u,t,c,n,!1))}m.push("...");for(let g=a-Ba;g<a;g++){let h=g*p,b=h+p;m.push(...tu(r.slice(h,b),u,t,c,n,g===a-1))}}else for(let g=0;g<a;g++){let h=g*p,b=h+p;m.push(...tu(r.slice(h,b),u,t,c,n,g===a-1))}let f=l===2?",":"";m[0]="["+m[0]+f;for(let g=1;g<m.length-1;g++)m[g]=" "+m[g]+f;let d=`,
`;for(let g=2;g<l;g++)d+=`
`;return m[m.length-1]=" "+m[m.length-1]+"]"+(s?"":d),m}function Va(r){let e=[];for(let t=0;t<r.length;t+=2)e.push([r[t],r[t+1]]);return e}var Ut=class{constructor(e,t,o){if(this.dtype=t,this.shape=e.slice(),this.size=ne(e),o!=null){let n=o.length;v(n===this.size,()=>`Length of values '${n}' does not match the size inferred by the shape '${this.size}'.`)}if(t==="complex64")throw new Error("complex64 dtype TensorBuffers are not supported. Please create a TensorBuffer for the real and imaginary parts separately and call tf.complex(real, imag).");this.values=o||Mc(t,this.size),this.strides=nr(e)}set(e,...t){t.length===0&&(t=[0]),v(t.length===this.rank,()=>`The number of provided coordinates (${t.length}) must match the rank (${this.rank})`);let o=this.locToIndex(t);this.values[o]=e}get(...e){e.length===0&&(e=[0]);let t=0;for(let n of e){if(n<0||n>=this.shape[t]){let s=`Requested out of range element at ${e}.   Buffer shape=${this.shape}`;throw new Error(s)}t++}let o=e[e.length-1];for(let n=0;n<e.length-1;++n)o+=this.strides[n]*e[n];return this.values[o]}locToIndex(e){if(this.rank===0)return 0;if(this.rank===1)return e[0];let t=e[e.length-1];for(let o=0;o<e.length-1;++o)t+=this.strides[o]*e[o];return t}indexToLoc(e){if(this.rank===0)return[];if(this.rank===1)return[e];let t=new Array(this.shape.length);for(let o=0;o<t.length-1;++o)t[o]=Math.floor(e/this.strides[o]),e-=t[o]*this.strides[o];return t[t.length-1]=e,t}get rank(){return this.shape.length}toTensor(){return Wt().makeTensor(this.values,this.shape,this.dtype)}},Wt=null,Mn=null,wN=null;function ay(r){Wt=r}function ly(r){Mn=r}function uy(r){wN=r}var ue=class{constructor(e,t,o,n){this.kept=!1,this.isDisposedInternal=!1,this.shape=e.slice(),this.dtype=t||"float32",this.size=ne(e),this.strides=nr(e),this.dataId=o,this.id=n,this.rankType=this.rank<5?this.rank.toString():"higher"}get rank(){return this.shape.length}async buffer(){let e=await this.data();return Mn.buffer(this.shape,this.dtype,e)}bufferSync(){return Mn.buffer(this.shape,this.dtype,this.dataSync())}async array(){let e=await this.data();return uo(this.shape,e,this.dtype==="complex64")}arraySync(){return uo(this.shape,this.dataSync(),this.dtype==="complex64")}async data(){this.throwIfDisposed();let e=Wt().read(this.dataId);if(this.dtype==="string"){let t=await e;try{return t.map(o=>Bn(o))}catch(o){throw new Error("Failed to decode the string bytes into utf-8. To get the original bytes, call tensor.bytes().")}}return e}dataToGPU(e){return this.throwIfDisposed(),Wt().readToGPU(this.dataId,e)}dataSync(){this.throwIfDisposed();let e=Wt().readSync(this.dataId);if(this.dtype==="string")try{return e.map(t=>Bn(t))}catch(t){throw new Error("Failed to decode the string bytes into utf-8. To get the original bytes, call tensor.bytes().")}return e}async bytes(){this.throwIfDisposed();let e=await Wt().read(this.dataId);return this.dtype==="string"?e:new Uint8Array(e.buffer)}dispose(){this.isDisposed||(Wt().disposeTensor(this),this.isDisposedInternal=!0)}get isDisposed(){return this.isDisposedInternal}throwIfDisposed(){if(this.isDisposed)throw new Error("Tensor is disposed.")}print(e=!1){return Mn.print(this,e)}clone(){return this.throwIfDisposed(),Mn.clone(this)}toString(e=!1){let t=this.dataSync();return sy(t,this.shape,this.dtype,e)}cast(e){return this.throwIfDisposed(),Mn.cast(this,e)}variable(e=!0,t,o){return this.throwIfDisposed(),Wt().makeVariable(this,e,t,o)}};Object.defineProperty(ue,Symbol.hasInstance,{value:r=>!!r&&r.data!=null&&r.dataSync!=null&&r.throwIfDisposed!=null});function vN(){return _s("Tensor",()=>ue)}vN();var yr=class extends ue{constructor(e,t,o,n){super(e.shape,e.dtype,e.dataId,n);this.trainable=t,this.name=o}assign(e){if(e.dtype!==this.dtype)throw new Error(`dtype of the new value (${e.dtype}) and previous value (${this.dtype}) must match`);if(!pt(e.shape,this.shape))throw new Error(`shape of the new value (${e.shape}) and previous value (${this.shape}) must match`);Wt().disposeTensor(this),this.dataId=e.dataId,Wt().incRef(this,null)}dispose(){Wt().disposeVariable(this),this.isDisposedInternal=!0}};Object.defineProperty(yr,Symbol.hasInstance,{value:r=>r instanceof ue&&r.assign!=null&&r.assign instanceof Function});var mp={};re(mp,{assertTypesMatch:()=>pp,getTensorsInContainer:()=>Ga,isTensorInList:()=>CN,makeTypesMatch:()=>ee});var ru;(function(r){r.R0="R0",r.R1="R1",r.R2="R2",r.R3="R3",r.R4="R4",r.R5="R5",r.R6="R6"})(ru||(ru={}));var ap;(function(r){r.float32="float32",r.int32="int32",r.bool="int32",r.complex64="complex64"})(ap||(ap={}));var lp;(function(r){r.float32="float32",r.int32="int32",r.bool="bool",r.complex64="complex64"})(lp||(lp={}));var up;(function(r){r.float32="float32",r.int32="float32",r.bool="float32",r.complex64="complex64"})(up||(up={}));var cp;(function(r){r.float32="complex64",r.int32="complex64",r.bool="complex64",r.complex64="complex64"})(cp||(cp={}));var TN={float32:up,int32:ap,bool:lp,complex64:cp};function Ge(r,e){if(r==="string"||e==="string"){if(r==="string"&&e==="string")return"string";throw new Error(`Can not upcast ${r} with ${e}`)}return TN[r][e]}function jr(r){return Ge(r,"int32")}function ee(r,e){if(r.dtype===e.dtype)return[r,e];let t=Ge(r.dtype,e.dtype);return[r.cast(t),e.cast(t)]}function pp(r,e){v(r.dtype===e.dtype,()=>`The dtypes of the first(${r.dtype}) and second(${e.dtype}) input must match`)}function CN(r,e){return e.some(t=>t.id===r.id)}function Ga(r){let e=[],t=new Set;return cy(r,e,t),e}function cy(r,e,t){if(r==null)return;if(r instanceof ue){e.push(r);return}if(!kN(r))return;let o=r;for(let n in o){let s=o[n];t.has(s)||(t.add(s),cy(s,e,t))}}function kN(r){return Array.isArray(r)||typeof r=="object"}function fp(r){return r.kernelName!=null}var dp=class{constructor(){this.registeredVariables={},this.nextTapeNodeId=0,this.numBytes=0,this.numTensors=0,this.numStringTensors=0,this.numDataBuffers=0,this.gradientDepth=0,this.kernelDepth=0,this.scopeStack=[],this.numDataMovesStack=[],this.nextScopeId=0,this.tensorInfo=new WeakMap,this.profiling=!1,this.activeProfile={newBytes:0,newTensors:0,peakBytes:0,kernels:[],result:null,get kernelNames(){return Array.from(new Set(this.kernels.map(e=>e.name)))}}}dispose(){for(let e in this.registeredVariables)this.registeredVariables[e].dispose()}},Lo=class{constructor(e){this.ENV=e,this.registry={},this.registryFactory={},this.pendingBackendInitId=0,this.state=new dp}async ready(){if(this.pendingBackendInit!=null)return this.pendingBackendInit.then(()=>{});if(this.backendInstance!=null)return;let e=this.getSortedBackends();for(let t=0;t<e.length;t++){let o=e[t];if(await this.initializeBackend(o).success){await this.setBackend(o);return}}throw new Error("Could not initialize any backends, all backend initializations failed.")}get backend(){if(this.pendingBackendInit!=null)throw new Error(`Backend '${this.backendName}' has not yet been initialized. Make sure to await tf.ready() or await tf.setBackend() before calling other methods`);if(this.backendInstance==null){let{name:e,asyncInit:t}=this.initializeBackendsAndReturnBest();if(t)throw new Error(`The highest priority backend '${e}' has not yet been initialized. Make sure to await tf.ready() or await tf.setBackend() before calling other methods`);this.setBackend(e)}return this.backendInstance}backendNames(){return Object.keys(this.registryFactory)}findBackend(e){if(!(e in this.registry))if(e in this.registryFactory){let{asyncInit:t}=this.initializeBackend(e);if(t)return null}else return null;return this.registry[e]}findBackendFactory(e){return e in this.registryFactory?this.registryFactory[e].factory:null}registerBackend(e,t,o=1){return e in this.registryFactory?(sr(`${e} backend was already registered. Reusing existing backend factory.`),!1):(this.registryFactory[e]={factory:t,priority:o},!0)}async setBackend(e){if(this.registryFactory[e]==null)throw new Error(`Backend name '${e}' not found in registry`);if(this.backendName=e,this.registry[e]==null){this.backendInstance=null;let{success:t,asyncInit:o}=this.initializeBackend(e);if(!(o?await t:t))return!1}return this.backendInstance=this.registry[e],this.setupRegisteredKernels(),this.profiler=new sp(this.backendInstance),!0}setupRegisteredKernels(){Pa(this.backendName).forEach(t=>{t.setupFunc!=null&&t.setupFunc(this.backendInstance)})}disposeRegisteredKernels(e){Pa(e).forEach(o=>{o.disposeFunc!=null&&o.disposeFunc(this.registry[e])})}initializeBackend(e){let t=this.registryFactory[e];if(t==null)throw new Error(`Cannot initialize backend ${e}, no registration found.`);try{let o=t.factory();if(o&&!(o instanceof ao)&&typeof o.then=="function"){let n=++this.pendingBackendInitId,s=o.then(i=>n<this.pendingBackendInitId?!1:(this.registry[e]=i,this.pendingBackendInit=null,!0)).catch(i=>(n<this.pendingBackendInitId||(this.pendingBackendInit=null,sr(`Initialization of backend ${e} failed`),sr(i.stack||i.message)),!1));return this.pendingBackendInit=s,{success:s,asyncInit:!0}}else return this.registry[e]=o,{success:!0,asyncInit:!1}}catch(o){return sr(`Initialization of backend ${e} failed`),sr(o.stack||o.message),{success:!1,asyncInit:!1}}}removeBackend(e){if(!(e in this.registryFactory))throw new Error(`${e} backend not found in registry`);this.backendName===e&&this.pendingBackendInit!=null&&this.pendingBackendInitId++,e in this.registry&&(this.disposeRegisteredKernels(e),this.registry[e].dispose(),delete this.registry[e]),delete this.registryFactory[e],this.backendName===e&&(this.pendingBackendInit=null,this.backendName=null,this.backendInstance=null)}getSortedBackends(){if(Object.keys(this.registryFactory).length===0)throw new Error("No backend found in registry.");return Object.keys(this.registryFactory).sort((e,t)=>this.registryFactory[t].priority-this.registryFactory[e].priority)}initializeBackendsAndReturnBest(){let e=this.getSortedBackends();for(let t=0;t<e.length;t++){let o=e[t],{success:n,asyncInit:s}=this.initializeBackend(o);if(s||n)return{name:o,asyncInit:s}}throw new Error("Could not initialize any backends, all backend initializations failed.")}moveData(e,t){let o=this.state.tensorInfo.get(t),n=o.backend,s=this.readSync(t),i=n.refCount(t);n.disposeData(t,!0),o.backend=e,e.move(t,s,o.shape,o.dtype,i),this.shouldCheckForMemLeaks()&&this.state.numDataMovesStack[this.state.numDataMovesStack.length-1]++}tidy(e,t){let o=null;if(t==null){if(typeof e!="function")throw new Error("Please provide a function to tidy()");t=e}else{if(typeof e!="string"&&!(e instanceof String))throw new Error("When calling with two arguments, the first argument to tidy() must be a string");if(typeof t!="function")throw new Error("When calling with two arguments, the 2nd argument to tidy() must be a function");o=e}let n;return this.scopedRun(()=>this.startScope(o),()=>this.endScope(n),()=>(n=t(),n instanceof Promise&&console.error("Cannot return a Promise inside of tidy."),n))}scopedRun(e,t,o){e();try{let n=o();return t(),n}catch(n){throw t(),n}}nextTensorId(){return Lo.nextTensorId++}nextVariableId(){return Lo.nextVariableId++}clone(e){let t=w.runKernel(zr,{x:e}),o={x:e},n=i=>({x:()=>{let a="float32",l={x:i},u={dtype:a};return w.runKernel(Gr,l,u)}}),s=[];return this.addTapeNode(this.state.activeScope.name,o,[t],n,s,{}),t}runKernel(e,t,o){if(this.backendName==null&&this.backend,!(Fn(e,this.backendName)!=null))throw new Error(`Kernel '${e}' not registered for backend '${this.backendName}'`);return this.runKernelFunc({kernelName:e,inputs:t,attrs:o})}shouldCheckForMemLeaks(){return this.ENV.getBool("IS_TEST")}checkKernelForMemLeak(e,t,o){let n=this.backend.numDataIds(),s=0;o.forEach(l=>{s+=l.dtype==="complex64"?3:1});let i=this.state.numDataMovesStack[this.state.numDataMovesStack.length-1],a=n-t-s-i;if(a>0)throw new Error(`Backend '${this.backendName}' has an internal memory leak (${a} data ids) after running '${e}'`)}runKernelFunc(e){let t,o=[],n=this.isTapeOn(),s=this.state.numBytes,i=this.state.numTensors;this.shouldCheckForMemLeaks()&&this.state.numDataMovesStack.push(0);let a;this.backendName==null&&this.backend;let l,u=fp(e)?e.kernelName:this.state.activeScope!=null?this.state.activeScope.name:"";if(fp(e)){let{kernelName:d,inputs:g,attrs:h}=e;this.backendName==null&&this.backend;let b=Fn(d,this.backendName);v(b!=null,()=>`Cannot find registered kernel '${d}' for backend '${this.backendName}'`),a=()=>{let T=this.backend.numDataIds();l=b.kernelFunc({inputs:g,attrs:h,backend:this.backend});let k=Array.isArray(l)?l:[l];this.shouldCheckForMemLeaks()&&this.checkKernelForMemLeak(d,T,k);let S=k.map(I=>I.rank!=null?I:this.makeTensorFromTensorInfo(I));if(n){let I=this.getTensorsForGradient(d,g,S);o=this.saveTensorsForBackwardMode(I)}return S}}else{let{forwardFunc:d}=e,g=h=>{!n||(o=h.map(b=>this.keep(this.clone(b))))};a=()=>{let h=this.backend.numDataIds();l=this.tidy(()=>d(this.backend,g));let b=Array.isArray(l)?l:[l];return this.shouldCheckForMemLeaks()&&this.checkKernelForMemLeak(u,h,b),b}}let{inputs:c,attrs:p}=e,m=fp(e)?null:e.backwardsFunc,f;return this.scopedRun(()=>this.state.kernelDepth++,()=>this.state.kernelDepth--,()=>{!this.ENV.getBool("DEBUG")&&!this.state.profiling?t=a():(f=this.profiler.profileKernel(u,c,()=>a()),this.ENV.getBool("DEBUG")&&this.profiler.logKernelProfile(f),t=f.outputs)}),n&&this.addTapeNode(u,c,t,m,o,p),this.state.profiling&&this.state.activeProfile.kernels.push({name:u,bytesAdded:this.state.numBytes-s,totalBytesSnapshot:this.state.numBytes,tensorsAdded:this.state.numTensors-i,totalTensorsSnapshot:this.state.numTensors,inputShapes:Object.keys(c).map(d=>c[d]!=null?c[d].shape:null),outputShapes:t.map(d=>d.shape),kernelTimeMs:f.timeMs,extraInfo:f.extraInfo}),Array.isArray(l)?t:t[0]}saveTensorsForBackwardMode(e){return e.map(o=>this.keep(this.clone(o)))}getTensorsForGradient(e,t,o){let n=Ql(e);if(n!=null){let s=n.inputsToSave||[],i=n.outputsToSave||[],a;n.saveAllInputs?(v(Array.isArray(t),()=>"saveAllInputs is true, expected inputs to be an array."),a=Object.keys(t).map(u=>t[u])):a=s.map(u=>t[u]);let l=o.filter((u,c)=>i[c]);return a.concat(l)}return[]}makeTensor(e,t,o,n){if(e==null)throw new Error("Values passed to engine.makeTensor() are null");o=o||"float32",n=n||this.backend;let s=e;o==="string"&&Gt(e[0])&&(s=e.map(l=>Wr(l)));let i=n.write(s,t,o),a=new ue(t,o,i,this.nextTensorId());if(this.trackTensor(a,n),o==="string"){let l=this.state.tensorInfo.get(i),u=zc(s);this.state.numBytes+=u-l.bytes,l.bytes=u}return a}makeTensorFromDataId(e,t,o,n){o=o||"float32";let s={dataId:e,shape:t,dtype:o};return this.makeTensorFromTensorInfo(s,n)}makeTensorFromTensorInfo(e,t){let{dataId:o,shape:n,dtype:s}=e,i=new ue(n,s,o,this.nextTensorId());return this.trackTensor(i,t),i}makeVariable(e,t=!0,o,n){o=o||this.nextVariableId().toString(),n!=null&&n!==e.dtype&&(e=e.cast(n));let s=new yr(e,t,o,this.nextTensorId());if(this.state.registeredVariables[s.name]!=null)throw new Error(`Variable with name ${s.name} was already registered`);return this.state.registeredVariables[s.name]=s,this.incRef(s,this.backend),s}trackTensor(e,t){this.state.numTensors++,e.dtype==="string"&&this.state.numStringTensors++;let o=0;e.dtype!=="complex64"&&e.dtype!=="string"&&(o=e.size*Xl(e.dtype)),this.state.numBytes+=o,this.state.tensorInfo.has(e.dataId)||(this.state.numDataBuffers++,this.state.tensorInfo.set(e.dataId,{backend:t||this.backend,dtype:e.dtype,shape:e.shape,bytes:o})),e instanceof yr||this.track(e)}incRef(e,t){this.trackTensor(e,t),this.backend.incRef(e.dataId)}removeDataId(e,t){this.state.tensorInfo.has(e)&&this.state.tensorInfo.get(e).backend===t&&(this.state.tensorInfo.delete(e),this.state.numDataBuffers--)}disposeTensor(e){if(!this.state.tensorInfo.has(e.dataId))return;let t=this.state.tensorInfo.get(e.dataId);if(this.state.numTensors--,e.dtype==="string"&&(this.state.numStringTensors--,this.state.numBytes-=t.bytes),e.dtype!=="complex64"&&e.dtype!=="string"){let o=e.size*Xl(e.dtype);this.state.numBytes-=o}t.backend.disposeData(e.dataId)&&this.removeDataId(e.dataId,t.backend)}disposeVariables(){for(let e in this.state.registeredVariables){let t=this.state.registeredVariables[e];this.disposeVariable(t)}}disposeVariable(e){this.disposeTensor(e),this.state.registeredVariables[e.name]!=null&&delete this.state.registeredVariables[e.name]}memory(){let e=this.backend.memory();return e.numTensors=this.state.numTensors,e.numDataBuffers=this.state.numDataBuffers,e.numBytes=this.state.numBytes,this.state.numStringTensors>0&&(e.unreliable=!0,e.reasons==null&&(e.reasons=[]),e.reasons.push("Memory usage by string tensors is approximate (2 bytes per character)")),e}async profile(e){this.state.profiling=!0;let t=this.state.numBytes,o=this.state.numTensors;this.state.activeProfile.kernels=[],this.state.activeProfile.result=await e(),this.state.profiling=!1,this.state.activeProfile.peakBytes=Math.max(...this.state.activeProfile.kernels.map(n=>n.totalBytesSnapshot)),this.state.activeProfile.newBytes=this.state.numBytes-t,this.state.activeProfile.newTensors=this.state.numTensors-o;for(let n of this.state.activeProfile.kernels)n.kernelTimeMs=await n.kernelTimeMs,n.extraInfo=await n.extraInfo;return this.state.activeProfile}isTapeOn(){return this.state.gradientDepth>0&&this.state.kernelDepth===0}addTapeNode(e,t,o,n,s,i){let a={id:this.state.nextTapeNodeId++,kernelName:e,inputs:t,outputs:o,saved:s},l=Ql(e);l!=null&&(n=l.gradFunc),n!=null&&(a.gradient=u=>(u=u.map((c,p)=>{if(c==null){let m=o[p],f=vn(m.size,m.dtype);return this.makeTensor(f,m.shape,m.dtype)}return c}),n(u.length>1?u:u[0],s,i))),this.state.activeTape.push(a)}keep(e){return e.kept=!0,e}startTape(){this.state.gradientDepth===0&&(this.state.activeTape=[]),this.state.gradientDepth++}endTape(){this.state.gradientDepth--}startScope(e){let t={track:[],name:"unnamed scope",id:this.state.nextScopeId++};e&&(t.name=e),this.state.scopeStack.push(t),this.state.activeScope=t}endScope(e){let t=Ga(e),o=new Set(t.map(s=>s.id));for(let s=0;s<this.state.activeScope.track.length;s++){let i=this.state.activeScope.track[s];!i.kept&&!o.has(i.id)&&i.dispose()}let n=this.state.scopeStack.pop();this.state.activeScope=this.state.scopeStack.length===0?null:this.state.scopeStack[this.state.scopeStack.length-1],t.forEach(s=>{!s.kept&&s.scopeId===n.id&&this.track(s)})}gradients(e,t,o,n=!1){if(v(t.length>0,()=>"gradients() received an empty list of xs."),o!=null&&o.dtype!=="float32")throw new Error(`dy must have 'float32' dtype, but has '${o.dtype}'`);let s=this.scopedRun(()=>this.startTape(),()=>this.endTape(),()=>this.tidy("forward",e));v(s instanceof ue,()=>"The result y returned by f() must be a tensor.");let i=ry(this.state.activeTape,t,s);if(!n&&i.length===0&&t.length>0)throw new Error("Cannot compute gradient of y=f(x) with respect to x. Make sure that the f you passed encloses all operations that lead from x to y.");return this.tidy("backward",()=>{let a={};a[s.id]=o==null?NN(s.shape):o,oy(a,i,u=>this.tidy(u),SN);let l=t.map(u=>a[u.id]);return this.state.gradientDepth===0&&(this.state.activeTape.forEach(u=>{for(let c of u.saved)c.dispose()}),this.state.activeTape=null),{value:s,grads:l}})}customGrad(e){return v(or(e),()=>"The f passed in customGrad(f) must be a function."),(...t)=>{v(t.every(a=>a instanceof ue),()=>"The args passed in customGrad(f)(x1, x2,...) must all be tensors");let o,n={};t.forEach((a,l)=>{n[l]=a});let s=(a,l)=>(o=e(...t,l),v(o.value instanceof ue,()=>"The function f passed in customGrad(f) must return an object where `obj.value` is a tensor"),v(or(o.gradFunc),()=>"The function f passed in customGrad(f) must return an object where `obj.gradFunc` is a function."),o.value),i=(a,l)=>{let u=o.gradFunc(a,l),c=Array.isArray(u)?u:[u];v(c.length===t.length,()=>"The function f passed in customGrad(f) must return an object where `obj.gradFunc` is a function that returns the same number of tensors as inputs passed to f(...)."),v(c.every(m=>m instanceof ue),()=>"The function f passed in customGrad(f) must return an object where `obj.gradFunc` is a function that returns a list of only tensors.");let p={};return c.forEach((m,f)=>{p[f]=()=>m}),p};return this.runKernelFunc({forwardFunc:s,backwardsFunc:i,inputs:n})}}readSync(e){return this.state.tensorInfo.get(e).backend.readSync(e)}read(e){return this.state.tensorInfo.get(e).backend.read(e)}readToGPU(e,t){return this.state.tensorInfo.get(e).backend.readToGPU(e,t)}async time(e){let t=Po(),o=await this.backend.time(e);return o.wallMs=Po()-t,o}track(e){return this.state.activeScope!=null&&(e.scopeId=this.state.activeScope.id,this.state.activeScope.track.push(e)),e}get registeredVariables(){return this.state.registeredVariables}reset(){this.pendingBackendInitId++,this.state.dispose(),this.ENV.reset(),this.state=new dp;for(let e in this.registry)this.disposeRegisteredKernels(e),this.registry[e].dispose(),delete this.registry[e];this.backendName=null,this.backendInstance=null,this.pendingBackendInit=null}};Lo.nextTensorId=0;Lo.nextVariableId=0;function NN(r){let e=gs(ne(r),"float32");return w.makeTensor(e,r,"float32")}function hp(){let r=Wc();if(r._tfengine==null){let e=new bs(r);r._tfengine=new Lo(e)}return Mx(r._tfengine.ENV),ay(()=>r._tfengine),r._tfengine}var w=hp();function SN(r,e){let t={a:r,b:e};return w.runKernel(xr,t)}var Hr={};re(Hr,{isBrowser:()=>xp,isMobile:()=>$N,mockIsMobile:()=>IN});function EN(){return typeof navigator!="undefined"&&navigator!=null}var gp;function IN(r){gp=r}function $N(r){if(gp!==void 0)return gp;if(r||EN()){if(r||(r=navigator),r.product==="ReactNative")return!0;let e=r.userAgent||r.vendor||(typeof window!="undefined"?window.opera:"");if(!e){let t=r;return t.userAgentData&&t.userAgentData.mobile}return/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(e)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(e.substr(0,4))}return!1}function xp(){return typeof window!="undefined"&&window.document!=null||typeof WorkerGlobalScope!="undefined"}var dt=E();dt.registerFlag("DEBUG",()=>!1,r=>{r&&console.warn("Debugging mode is ON. The output of every math call will be downloaded to CPU and checked for NaNs. This significantly impacts performance.")});dt.registerFlag("IS_BROWSER",()=>xp());dt.registerFlag("IS_NODE",()=>typeof process!="undefined"&&typeof process.versions!="undefined"&&typeof process.versions.node!="undefined");dt.registerFlag("IS_CHROME",()=>typeof navigator!="undefined"&&navigator!=null&&navigator.userAgent!=null&&/Chrome/.test(navigator.userAgent)&&/Google Inc/.test(navigator.vendor));dt.registerFlag("PROD",()=>!1);dt.registerFlag("TENSORLIKE_CHECK_SHAPE_CONSISTENCY",()=>dt.getBool("DEBUG"));dt.registerFlag("DEPRECATION_WARNINGS_ENABLED",()=>!0);dt.registerFlag("IS_TEST",()=>!1);dt.registerFlag("CHECK_COMPUTATION_FOR_ERRORS",()=>!0);dt.registerFlag("WRAP_TO_IMAGEBITMAP",()=>!1);dt.registerFlag("ENGINE_COMPILE_ONLY",()=>!1);dt.registerFlag("CANVAS2D_WILL_READ_FREQUENTLY_FOR_GPU",()=>!1);dt.registerFlag("USE_SETTIMEOUTCUSTOM",()=>!1);function ze(r,e){let t=r;if(Fe(r))return e==="string"?[]:[r.length];if(!Array.isArray(r))return[];let o=[];for(;Array.isArray(t)||Fe(t)&&e!=="string";)o.push(t.length),t=t[0];return Array.isArray(r)&&E().getBool("TENSORLIKE_CHECK_SHAPE_CONSISTENCY")&&py(r,o,[]),o}function py(r,e,t){if(t=t||[],!Array.isArray(r)&&!Fe(r)){v(e.length===0,()=>`Element arr[${t.join("][")}] is a primitive, but should be an array/TypedArray of ${e[0]} elements`);return}v(e.length>0,()=>`Element arr[${t.join("][")}] should be a primitive, but is an array of ${r.length} elements`),v(r.length===e[0],()=>`Element arr[${t.join("][")}] should have ${e[0]} elements, but has ${r.length} elements`);let o=e.slice(1);for(let n=0;n<r.length;++n)py(r[n],o,t.concat(n))}function my(r,e,t,o){if(r!=="string_or_numeric"){if(r==null)throw new Error("Expected dtype cannot be null.");if(r!=="numeric"&&r!==e||r==="numeric"&&e==="string")throw new Error(`Argument '${t}' passed to '${o}' must be ${r} tensor, but got ${e} tensor`)}}function y(r,e,t,o="numeric"){if(r instanceof ue)return my(o,r.dtype,e,t),r;let n=_n(r);if(n!=="string"&&["bool","int32","float32"].indexOf(o)>=0&&(n=o),my(o,n,e,t),r==null||!Fe(r)&&!Array.isArray(r)&&typeof r!="number"&&typeof r!="boolean"&&typeof r!="string"){let l=r==null?"null":r.constructor.name;throw new Error(`Argument '${e}' passed to '${t}' must be a Tensor or TensorLike, but got '${l}'`)}let s=ze(r,n);!Fe(r)&&!Array.isArray(r)&&(r=[r]);let a=n!=="string"?Ln(r,n):Vt(r,[],!0);return w.makeTensor(a,s,n)}function br(r,e,t,o="numeric"){if(!Array.isArray(r))throw new Error(`Argument ${e} passed to ${t} must be a \`Tensor[]\` or \`TensorLike[]\``);return r.map((s,i)=>y(s,`${e}[${i}]`,t,o))}var ou="__op";function _(r){let e=Object.keys(r);if(e.length!==1)throw new Error(`Please provide an object with a single key (operation name) mapping to a function. Got an object with ${e.length} keys.`);let t=e[0],o=r[t];t.endsWith("_")&&(t=t.substring(0,t.length-1)),t=t+ou;let n=(...s)=>{w.startScope(t);try{let i=o(...s);return ys(i)&&console.error("Cannot return a Promise inside of tidy."),w.endScope(i),i}catch(i){throw w.endScope(null),i}};return Object.defineProperty(n,"name",{value:t,configurable:!0}),n}function AN(r,e){let t=y(r,"real","complex"),o=y(e,"imag","complex");xe(t.shape,o.shape,`real and imag shapes, ${t.shape} and ${o.shape}, must match in call to tf.complex().`);let n={real:t,imag:o};return w.runKernel(Cn,n)}var Je=_({complex_:AN});function et(r,e,t,o){if(o==null&&(o=_n(r)),o==="complex64")throw new Error("Cannot construct a complex64 tensor directly. Please use tf.complex(real, imag).");if(!Fe(r)&&!Array.isArray(r)&&typeof r!="number"&&typeof r!="boolean"&&typeof r!="string")throw new Error("values passed to tensor(values) must be a number/boolean/string or an array of numbers/booleans/strings, or a TypedArray");if(e!=null){xs(e);let n=ne(e),s=ne(t);v(n===s,()=>`Based on the provided shape, [${e}], the tensor should have ${n} values but has ${s}`);for(let i=0;i<t.length;++i){let a=t[i],l=i===t.length-1?a!==ne(e.slice(i)):!0;v(t[i]===e[i]||!l,()=>`Error creating a new Tensor. Inferred shape (${t}) does not match the provided shape (${e}). `)}}return!Fe(r)&&!Array.isArray(r)&&(r=[r]),e=e||t,r=o!=="string"?Ln(r,o):Vt(r,[],!0),w.makeTensor(r,e,o)}function qe(r,e,t){let o=ze(r,t);return et(r,e,o,t)}var za={float32:4,float16:2,int32:4,uint16:2,uint8:1,bool:1,complex64:8};var nu=4;async function fy(r,e){let t=[],o=[],n=Array.isArray(r)?r.map(i=>i.name):Object.keys(r);for(let i=0;i<n.length;++i){let a=n[i],l=Array.isArray(r)?r[i].tensor:r[a];if(l.dtype!=="float32"&&l.dtype!=="int32"&&l.dtype!=="bool"&&l.dtype!=="string"&&l.dtype!=="complex64")throw new Error(`Unsupported dtype in weight '${a}': ${l.dtype}`);let u={name:a,shape:l.shape,dtype:l.dtype};if(l.dtype==="string"){let c=new Promise(async p=>{let m=await l.bytes(),f=m.reduce((h,b)=>h+b.length,0)+nu*m.length,d=new Uint8Array(f),g=0;for(let h=0;h<m.length;h++){let b=m[h],T=new Uint8Array(new Uint32Array([b.length]).buffer);d.set(T,g),g+=nu,d.set(b,g),g+=b.length}p(d)});o.push(c)}else o.push(l.data());e!=null&&(u.group=e),t.push(u)}let s=await Promise.all(o);return{data:RN(s),specs:t}}function su(r,e){let t={},o,n=0;for(let s of e){let i=s.name,a=s.dtype,l=s.shape,u=ne(l),c;if("quantization"in s){let p=s.quantization;if(p.dtype==="uint8"||p.dtype==="uint16"){if(!("min"in p&&"scale"in p))throw new Error(`Weight ${s.name} with quantization ${p.dtype} doesn't have corresponding metadata min and scale.`)}else if(p.dtype==="float16"){if(a!=="float32")throw new Error(`Weight ${s.name} is quantized with ${p.dtype} which only supports weights of type float32 not ${a}.`)}else throw new Error(`Weight ${s.name} has unknown quantization dtype ${p.dtype}. Supported quantization dtypes are: 'uint8', 'uint16', and 'float16'.`);let m=za[p.dtype],f=r.slice(n,n+u*m),d=p.dtype==="uint8"?new Uint8Array(f):new Uint16Array(f);if(a==="float32")if(p.dtype==="uint8"||p.dtype==="uint16"){c=new Float32Array(d.length);for(let g=0;g<d.length;g++){let h=d[g];c[g]=h*p.scale+p.min}}else if(p.dtype==="float16")o===void 0&&(o=PN()),c=o(d);else throw new Error(`Unsupported quantization type ${p.dtype} for weight type float32.`);else if(a==="int32"){if(p.dtype!=="uint8"&&p.dtype!=="uint16")throw new Error(`Unsupported quantization type ${p.dtype} for weight type int32.`);c=new Int32Array(d.length);for(let g=0;g<d.length;g++){let h=d[g];c[g]=Math.round(h*p.scale+p.min)}}else throw new Error(`Unsupported dtype in weight '${i}': ${a}`);n+=u*m}else if(a==="string"){let p=ne(s.shape);c=[];for(let m=0;m<p;m++){let f=new Uint32Array(r.slice(n,n+nu))[0];n+=nu;let d=new Uint8Array(r.slice(n,n+f));c.push(d),n+=f}}else{let p=za[a],m=r.slice(n,n+u*p);if(a==="float32")c=new Float32Array(m);else if(a==="int32")c=new Int32Array(m);else if(a==="bool")c=new Uint8Array(m);else if(a==="complex64"){c=new Float32Array(m);let f=new Float32Array(c.length/2),d=new Float32Array(c.length/2);for(let b=0;b<f.length;b++)f[b]=c[b*2],d[b]=c[b*2+1];let g=qe(f,l,"float32"),h=qe(d,l,"float32");t[i]=Je(g,h),g.dispose(),h.dispose()}else throw new Error(`Unsupported dtype in weight '${i}': ${a}`);n+=u*p}a!=="complex64"&&(t[i]=qe(c,l,a))}return t}function RN(r){if(r===null)throw new Error(`Invalid input value: ${JSON.stringify(r)}`);let e=0,t=[];r.forEach(s=>{if(e+=s.byteLength,t.push(s.byteLength===s.buffer.byteLength?s:new s.constructor(s)),!(s instanceof Float32Array||s instanceof Int32Array||s instanceof Uint8Array))throw new Error(`Unsupported TypedArray subtype: ${s.constructor.name}`)});let o=new Uint8Array(e),n=0;return t.forEach(s=>{o.set(new Uint8Array(s.buffer),n),n+=s.byteLength}),o.buffer}var yp=typeof Buffer!="undefined"&&(typeof Blob=="undefined"||typeof atob=="undefined"||typeof btoa=="undefined");function dy(r){return yp?Buffer.byteLength(r):new Blob([r]).size}function hy(r){if(yp)return Buffer.from(r).toString("base64");let e=new Uint8Array(r),t="";for(let o=0,n=e.length;o<n;o++)t+=String.fromCharCode(e[o]);return btoa(t)}function gy(r){if(yp){let o=Buffer.from(r,"base64");return o.buffer.slice(o.byteOffset,o.byteOffset+o.byteLength)}let e=atob(r),t=new Uint8Array(e.length);for(let o=0;o<e.length;++o)t.set([e.charCodeAt(o)],o);return t.buffer}function Vn(r){if(r.length===1)return r[0];let e=0;r.forEach(n=>{e+=n.byteLength});let t=new Uint8Array(e),o=0;return r.forEach(n=>{t.set(new Uint8Array(n),o),o+=n.byteLength}),t.buffer}function bp(r){let e="/";for(r=r.trim();r.endsWith(e);)r=r.slice(0,r.length-1);let t=r.split(e);return t[t.length-1]}function iu(r,e){let t={modelTopology:r.modelTopology,format:r.format,generatedBy:r.generatedBy,convertedBy:r.convertedBy,weightsManifest:e};return r.signature!=null&&(t.signature=r.signature),r.userDefinedMetadata!=null&&(t.userDefinedMetadata=r.userDefinedMetadata),r.modelInitializer!=null&&(t.modelInitializer=r.modelInitializer),r.trainingConfig!=null&&(t.trainingConfig=r.trainingConfig),t}function _p(r,e,t){let o={modelTopology:r.modelTopology,format:r.format,generatedBy:r.generatedBy,convertedBy:r.convertedBy};if(r.trainingConfig!=null&&(o.trainingConfig=r.trainingConfig),r.weightsManifest!=null){if(!e)throw new Error("modelJSON has weightsManifest but weightSpecs is null");if(!t)throw new Error("modelJSON has weightsManifest but weightData is null");o.weightSpecs=e,o.weightData=t}return r.signature!=null&&(o.signature=r.signature),r.userDefinedMetadata!=null&&(o.userDefinedMetadata=r.userDefinedMetadata),r.modelInitializer!=null&&(o.modelInitializer=r.modelInitializer),o}async function Gn(r,e){let t,o;return r.weightsManifest!=null&&([t,o]=await e(r.weightsManifest)),_p(r,t,o)}function ir(r){if(r.modelTopology instanceof ArrayBuffer)throw new Error("Expected JSON model topology, received ArrayBuffer.");return{dateSaved:new Date,modelTopologyType:"JSON",modelTopologyBytes:r.modelTopology==null?0:dy(JSON.stringify(r.modelTopology)),weightSpecsBytes:r.weightSpecs==null?0:dy(JSON.stringify(r.weightSpecs)),weightDataBytes:r.weightData==null?0:r.weightData.byteLength}}function au(r){let e=[];for(let t of r)e.push(...t.weights);return e}function DN(){let r=t=>{let o=t<<13,n=0;for(;(o&8388608)==0;)n-=8388608,o<<=1;return o&=~8388608,n+=947912704,o|n},e=new Uint32Array(2048);e[0]=0;for(let t=1;t<1024;t++)e[t]=r(t);for(let t=1024;t<2048;t++)e[t]=939524096+(t-1024<<13);return e}function FN(){let r=new Uint32Array(64);r[0]=0,r[31]=1199570944,r[32]=2147483648,r[63]=3347054592;for(let e=1;e<31;e++)r[e]=e<<23;for(let e=33;e<63;e++)r[e]=2147483648+(e-32<<23);return r}function ON(){let r=new Uint32Array(64);for(let e=0;e<64;e++)r[e]=1024;return r[0]=r[32]=0,r}function PN(){let r=DN(),e=FN(),t=ON();return o=>{let n=new ArrayBuffer(4*o.length),s=new Uint32Array(n);for(let i=0;i<o.length;i++){let a=o[i],l=r[t[a>>10]+(a&1023)]+e[a>>10];s[i]=l}return new Float32Array(n)}}var he=class{constructor(){this.saveRouters=[],this.loadRouters=[]}static getInstance(){return he.instance==null&&(he.instance=new he),he.instance}static registerSaveRouter(e){he.getInstance().saveRouters.push(e)}static registerLoadRouter(e){he.getInstance().loadRouters.push(e)}static getSaveHandlers(e){return he.getHandlers(e,"save")}static getLoadHandlers(e,t){return he.getHandlers(e,"load",t)}static getHandlers(e,t,o){let n=[];return(t==="load"?he.getInstance().loadRouters:he.getInstance().saveRouters).forEach(i=>{let a=i(e,o);a!==null&&n.push(a)}),n}},xy=r=>he.registerSaveRouter(r),yy=r=>he.registerLoadRouter(r),by=r=>he.getSaveHandlers(r),_y=(r,e)=>he.getLoadHandlers(r,e);var wp="tensorflowjs",vp=1,Bo="models_store",qr="model_info_store";function wy(){if(!E().getBool("IS_BROWSER"))throw new Error("Failed to obtain IndexedDB factory because the current environmentis not a web browser.");let r=typeof window=="undefined"?self:window,e=r.indexedDB||r.mozIndexedDB||r.webkitIndexedDB||r.msIndexedDB||r.shimIndexedDB;if(e==null)throw new Error("The current browser does not appear to support IndexedDB.");return e}function Tp(r){let e=r.result;e.createObjectStore(Bo,{keyPath:"modelPath"}),e.createObjectStore(qr,{keyPath:"modelPath"})}var _r=class{constructor(e){if(this.indexedDB=wy(),e==null||!e)throw new Error("For IndexedDB, modelPath must not be null, undefined or empty.");this.modelPath=e}async save(e){if(e.modelTopology instanceof ArrayBuffer)throw new Error("BrowserLocalStorage.save() does not support saving model topology in binary formats yet.");return this.databaseAction(this.modelPath,e)}async load(){return this.databaseAction(this.modelPath)}databaseAction(e,t){return new Promise((o,n)=>{let s=this.indexedDB.open(wp,vp);s.onupgradeneeded=()=>Tp(s),s.onsuccess=()=>{let i=s.result;if(t==null){let a=i.transaction(Bo,"readonly"),u=a.objectStore(Bo).get(this.modelPath);u.onsuccess=()=>{if(u.result==null)return i.close(),n(new Error(`Cannot find model with path '${this.modelPath}' in IndexedDB.`));o(u.result.modelArtifacts)},u.onerror=c=>(i.close(),n(u.error)),a.oncomplete=()=>i.close()}else{let a=ir(t),l=i.transaction(qr,"readwrite"),u=l.objectStore(qr),c=u.put({modelPath:this.modelPath,modelArtifactsInfo:a}),p;c.onsuccess=()=>{p=i.transaction(Bo,"readwrite");let f=p.objectStore(Bo).put({modelPath:this.modelPath,modelArtifacts:t,modelArtifactsInfo:a});f.onsuccess=()=>o({modelArtifactsInfo:a}),f.onerror=d=>{u=l.objectStore(qr);let g=u.delete(this.modelPath);g.onsuccess=()=>(i.close(),n(f.error)),g.onerror=h=>(i.close(),n(f.error))}},c.onerror=m=>(i.close(),n(c.error)),l.oncomplete=()=>{p==null?i.close():p.oncomplete=()=>i.close()}}},s.onerror=i=>n(s.error)})}};_r.URL_SCHEME="indexeddb://";var vy=r=>E().getBool("IS_BROWSER")&&!Array.isArray(r)&&r.startsWith(_r.URL_SCHEME)?LN(r.slice(_r.URL_SCHEME.length)):null;he.registerSaveRouter(vy);he.registerLoadRouter(vy);function LN(r){return new _r(r)}function BN(r){return r.startsWith(_r.URL_SCHEME)?r.slice(_r.URL_SCHEME.length):r}var Cp=class{constructor(){this.indexedDB=wy()}async listModels(){return new Promise((e,t)=>{let o=this.indexedDB.open(wp,vp);o.onupgradeneeded=()=>Tp(o),o.onsuccess=()=>{let n=o.result,s=n.transaction(qr,"readonly"),a=s.objectStore(qr).getAll();a.onsuccess=()=>{let l={};for(let u of a.result)l[u.modelPath]=u.modelArtifactsInfo;e(l)},a.onerror=l=>(n.close(),t(a.error)),s.oncomplete=()=>n.close()},o.onerror=n=>t(o.error)})}async removeModel(e){return e=BN(e),new Promise((t,o)=>{let n=this.indexedDB.open(wp,vp);n.onupgradeneeded=()=>Tp(n),n.onsuccess=()=>{let s=n.result,i=s.transaction(qr,"readwrite"),a=i.objectStore(qr),l=a.get(e),u;l.onsuccess=()=>{if(l.result==null)return s.close(),o(new Error(`Cannot find model with path '${e}' in IndexedDB.`));{let c=a.delete(e),p=()=>{u=s.transaction(Bo,"readwrite");let f=u.objectStore(Bo).delete(e);f.onsuccess=()=>t(l.result.modelArtifactsInfo),f.onerror=d=>o(l.error)};c.onsuccess=p,c.onerror=m=>(p(),s.close(),o(l.error))}},l.onerror=c=>(s.close(),o(l.error)),i.oncomplete=()=>{u==null?s.close():u.oncomplete=()=>s.close()}},n.onerror=s=>o(n.error)})}};var wr="/",zn="tensorflowjs_models",Ty="info",MN="model_topology",VN="weight_specs",GN="weight_data",zN="model_metadata";function Cy(r){return{info:[zn,r,Ty].join(wr),topology:[zn,r,MN].join(wr),weightSpecs:[zn,r,VN].join(wr),weightData:[zn,r,GN].join(wr),modelMetadata:[zn,r,zN].join(wr)}}function ky(r){for(let e of Object.values(r))window.localStorage.removeItem(e)}function UN(r){let e=r.split(wr);if(e.length<3)throw new Error(`Invalid key format: ${r}`);return e.slice(1,e.length-1).join(wr)}function WN(r){return r.startsWith(vr.URL_SCHEME)?r.slice(vr.URL_SCHEME.length):r}var vr=class{constructor(e){if(!E().getBool("IS_BROWSER")||typeof window=="undefined"||typeof window.localStorage=="undefined")throw new Error("The current environment does not support local storage.");if(this.LS=window.localStorage,e==null||!e)throw new Error("For local storage, modelPath must not be null, undefined or empty.");this.modelPath=e,this.keys=Cy(this.modelPath)}async save(e){if(e.modelTopology instanceof ArrayBuffer)throw new Error("BrowserLocalStorage.save() does not support saving model topology in binary formats yet.");{let t=JSON.stringify(e.modelTopology),o=JSON.stringify(e.weightSpecs),n=ir(e);try{this.LS.setItem(this.keys.info,JSON.stringify(n)),this.LS.setItem(this.keys.topology,t),this.LS.setItem(this.keys.weightSpecs,o),this.LS.setItem(this.keys.weightData,hy(e.weightData));let s={format:e.format,generatedBy:e.generatedBy,convertedBy:e.convertedBy,signature:e.signature!=null?e.signature:void 0,userDefinedMetadata:e.userDefinedMetadata!=null?e.userDefinedMetadata:void 0,modelInitializer:e.modelInitializer!=null?e.modelInitializer:void 0,trainingConfig:e.trainingConfig!=null?e.trainingConfig:void 0};return this.LS.setItem(this.keys.modelMetadata,JSON.stringify(s)),{modelArtifactsInfo:n}}catch(s){throw ky(this.keys),new Error(`Failed to save model '${this.modelPath}' to local storage: size quota being exceeded is a possible cause of this failure: modelTopologyBytes=${n.modelTopologyBytes}, weightSpecsBytes=${n.weightSpecsBytes}, weightDataBytes=${n.weightDataBytes}.`)}}}async load(){let e=JSON.parse(this.LS.getItem(this.keys.info));if(e==null)throw new Error(`In local storage, there is no model with name '${this.modelPath}'`);if(e.modelTopologyType!=="JSON")throw new Error("BrowserLocalStorage does not support loading non-JSON model topology yet.");let t={},o=JSON.parse(this.LS.getItem(this.keys.topology));if(o==null)throw new Error(`In local storage, the topology of model '${this.modelPath}' is missing.`);t.modelTopology=o;let n=JSON.parse(this.LS.getItem(this.keys.weightSpecs));if(n==null)throw new Error(`In local storage, the weight specs of model '${this.modelPath}' are missing.`);t.weightSpecs=n;let s=this.LS.getItem(this.keys.modelMetadata);if(s!=null){let a=JSON.parse(s);t.format=a.format,t.generatedBy=a.generatedBy,t.convertedBy=a.convertedBy,a.signature!=null&&(t.signature=a.signature),a.userDefinedMetadata!=null&&(t.userDefinedMetadata=a.userDefinedMetadata),a.modelInitializer!=null&&(t.modelInitializer=a.modelInitializer),a.trainingConfig!=null&&(t.trainingConfig=a.trainingConfig)}let i=this.LS.getItem(this.keys.weightData);if(i==null)throw new Error(`In local storage, the binary weight values of model '${this.modelPath}' are missing.`);return t.weightData=gy(i),t}};vr.URL_SCHEME="localstorage://";var Ny=r=>E().getBool("IS_BROWSER")&&!Array.isArray(r)&&r.startsWith(vr.URL_SCHEME)?jN(r.slice(vr.URL_SCHEME.length)):null;he.registerSaveRouter(Ny);he.registerLoadRouter(Ny);function jN(r){return new vr(r)}var kp=class{constructor(){v(E().getBool("IS_BROWSER"),()=>"Current environment is not a web browser"),v(typeof window=="undefined"||typeof window.localStorage!="undefined",()=>"Current browser does not appear to support localStorage"),this.LS=window.localStorage}async listModels(){let e={},t=zn+wr,o=wr+Ty;for(let n=0;n<this.LS.length;++n){let s=this.LS.key(n);if(s.startsWith(t)&&s.endsWith(o)){let i=UN(s);e[i]=JSON.parse(this.LS.getItem(s))}}return e}async removeModel(e){e=WN(e);let t=Cy(e);if(this.LS.getItem(t.info)==null)throw new Error(`Cannot find model at path '${e}'`);let o=JSON.parse(this.LS.getItem(t.info));return ky(t),o}};var Un="://",Ue=class{constructor(){this.managers={}}static getInstance(){return Ue.instance==null&&(Ue.instance=new Ue),Ue.instance}static registerManager(e,t){v(e!=null,()=>"scheme must not be undefined or null."),e.endsWith(Un)&&(e=e.slice(0,e.indexOf(Un))),v(e.length>0,()=>"scheme must not be an empty string.");let o=Ue.getInstance();v(o.managers[e]==null,()=>`A model store manager is already registered for scheme '${e}'.`),o.managers[e]=t}static getManager(e){let t=Ue.getInstance().managers[e];if(t==null)throw new Error(`Cannot find model manager for scheme '${e}'`);return t}static getSchemes(){return Object.keys(Ue.getInstance().managers)}};function lu(r){if(r.indexOf(Un)===-1)throw new Error(`The url string provided does not contain a scheme. Supported schemes are: ${Ue.getSchemes().join(",")}`);return{scheme:r.split(Un)[0],path:r.split(Un)[1]}}async function Sy(r,e,t=!1){v(r!==e,()=>`Old path and new path are the same: '${r}'`);let o=he.getLoadHandlers(r);v(o.length>0,()=>`Copying failed because no load handler is found for source URL ${r}.`),v(o.length<2,()=>`Copying failed because more than one (${o.length}) load handlers for source URL ${r}.`);let n=o[0],s=he.getSaveHandlers(e);v(s.length>0,()=>`Copying failed because no save handler is found for destination URL ${e}.`),v(s.length<2,()=>`Copying failed because more than one (${o.length}) save handlers for destination URL ${e}.`);let i=s[0],a=lu(r).scheme,l=lu(r).path,u=a===lu(r).scheme,c=await n.load();t&&u&&await Ue.getManager(a).removeModel(l);let p=await i.save(c);return t&&!u&&await Ue.getManager(a).removeModel(l),p.modelArtifactsInfo}async function Ey(){let r=Ue.getSchemes(),e={};for(let t of r){let o=await Ue.getManager(t).listModels();for(let n in o){let s=t+Un+n;e[s]=o[n]}}return e}async function Iy(r){let e=lu(r);return Ue.getManager(e.scheme).removeModel(e.path)}async function $y(r,e){return Sy(r,e,!1)}async function Ay(r,e){return Sy(r,e,!0)}var Ry=class{constructor(){this.messageName="setTimeoutCustom",this.functionRefs=[],this.handledMessageCount=0,this.hasEventListener=!1}fetch(e,t){return fetch(e,t)}now(){return performance.now()}encode(e,t){if(t!=="utf-8"&&t!=="utf8")throw new Error(`Browser's encoder only supports utf-8, but got ${t}`);return this.textEncoder==null&&(this.textEncoder=new TextEncoder),this.textEncoder.encode(e)}decode(e,t){return new TextDecoder(t).decode(e)}setTimeoutCustom(e,t){if(!window||!E().getBool("USE_SETTIMEOUTCUSTOM")){setTimeout(e,t);return}this.functionRefs.push(e),setTimeout(()=>{window.postMessage({name:this.messageName,index:this.functionRefs.length-1},"*")},t),this.hasEventListener||(this.hasEventListener=!0,window.addEventListener("message",o=>{o.source===window&&o.data.name===this.messageName&&(o.stopPropagation(),this.functionRefs[o.data.index](),this.handledMessageCount++,this.handledMessageCount===this.functionRefs.length&&(this.functionRefs=[],this.handledMessageCount=0))},!0))}};if(E().get("IS_BROWSER")){E().setPlatform("browser",new Ry);try{Ue.registerManager(vr.URL_SCHEME,new kp)}catch(r){}try{Ue.registerManager(_r.URL_SCHEME,new Cp)}catch(r){}}var HN={importFetch:()=>Dy()},Np;var Oy=class{constructor(){this.util=Fy(),this.textEncoder=new this.util.TextEncoder}fetch(e,t){return E().global.fetch!=null?E().global.fetch(e,t):(Np==null&&(Np=HN.importFetch()),Np(e,t))}now(){let e=process.hrtime();return e[0]*1e3+e[1]/1e6}encode(e,t){if(t!=="utf-8"&&t!=="utf8")throw new Error(`Node built-in encoder only supports utf-8, but got ${t}`);return this.textEncoder.encode(e)}decode(e,t){return e.length===0?"":new this.util.TextDecoder(t).decode(e)}};E().get("IS_NODE")&&!E().get("IS_BROWSER")&&E().setPlatform("node",new Oy);function te(r,e="float32",t){return e=e||"float32",xs(r),new Ut(r,e,t)}function qN(r,e){let t=y(r,"x","cast");if(!Gc(e))throw new Error(`Failed to cast to unknown dtype ${e}`);if(e==="string"&&t.dtype!=="string"||e!=="string"&&t.dtype==="string")throw new Error("Only strings can be casted to strings");let o={x:t},n={dtype:e};return w.runKernel(Gr,o,n)}var oe=_({cast_:qN});function KN(r){let t={x:y(r,"x","clone","string_or_numeric")};return w.runKernel(zr,t)}var lt=_({clone_:KN});function Ua(r,e=!1){console.log(r.toString(e))}hp();var XN={buffer:te,cast:oe,clone:lt,print:Ua};ly(XN);var Wn={};re(Wn,{browserFiles:()=>By,browserHTTPRequest:()=>Gy,concatenateArrayBuffers:()=>Vn,copyModel:()=>$y,decodeWeights:()=>su,encodeWeights:()=>fy,fromMemory:()=>Uy,fromMemorySync:()=>Ap,getLoadHandlers:()=>_y,getModelArtifactsForJSON:()=>Gn,getModelArtifactsForJSONSync:()=>_p,getModelArtifactsInfoForJSON:()=>ir,getSaveHandlers:()=>by,getWeightSpecs:()=>au,http:()=>pu,isHTTPScheme:()=>cu,listModels:()=>Ey,loadWeights:()=>My,moveModel:()=>Ay,registerLoadRouter:()=>yy,registerSaveRouter:()=>xy,removeModel:()=>Iy,weightsLoaderFactory:()=>Ip,withSaveHandler:()=>Wy,withSaveHandlerSync:()=>jy});var YN="model",QN=".json",ZN=".weights.bin";function Py(r){return new Promise(e=>setTimeout(e)).then(r)}var Kr=class{constructor(e){if(!E().getBool("IS_BROWSER"))throw new Error("browserDownloads() cannot proceed because the current environment is not a browser.");e.startsWith(Kr.URL_SCHEME)&&(e=e.slice(Kr.URL_SCHEME.length)),(e==null||e.length===0)&&(e=YN),this.modelJsonFileName=e+QN,this.weightDataFileName=e+ZN}async save(e){if(typeof document=="undefined")throw new Error("Browser downloads are not supported in this environment since `document` is not present");let t=window.URL.createObjectURL(new Blob([e.weightData],{type:"application/octet-stream"}));if(e.modelTopology instanceof ArrayBuffer)throw new Error("BrowserDownloads.save() does not support saving model topology in binary formats yet.");{let o=[{paths:["./"+this.weightDataFileName],weights:e.weightSpecs}],n=iu(e,o),s=window.URL.createObjectURL(new Blob([JSON.stringify(n)],{type:"application/json"})),i=this.modelJsonAnchor==null?document.createElement("a"):this.modelJsonAnchor;if(i.download=this.modelJsonFileName,i.href=s,await Py(()=>i.dispatchEvent(new MouseEvent("click"))),e.weightData!=null){let a=this.weightDataAnchor==null?document.createElement("a"):this.weightDataAnchor;a.download=this.weightDataFileName,a.href=t,await Py(()=>a.dispatchEvent(new MouseEvent("click")))}return{modelArtifactsInfo:ir(e)}}}};Kr.URL_SCHEME="downloads://";var Ly=class{constructor(e){if(e==null||e.length<1)throw new Error(`When calling browserFiles, at least 1 file is required, but received ${e}`);this.jsonFile=e[0],this.weightsFiles=e.slice(1)}async load(){return new Promise((e,t)=>{let o=new FileReader;o.onload=n=>{let s=JSON.parse(n.target.result),i=s.modelTopology;if(i==null){t(new Error(`modelTopology field is missing from file ${this.jsonFile.name}`));return}if(s.weightsManifest==null){t(new Error(`weightManifest field is missing from file ${this.jsonFile.name}`));return}if(this.weightsFiles.length===0){e({modelTopology:i});return}let l=Gn(s,u=>this.loadWeights(u));e(l)},o.onerror=n=>t(`Failed to read model topology and weights manifest JSON from file '${this.jsonFile.name}'. BrowserFiles supports loading Keras-style tf.Model artifacts only.`),o.readAsText(this.jsonFile)})}loadWeights(e){let t=[],o=[];for(let i of e)t.push(...i.weights),o.push(...i.paths);let n=this.checkManifestAndWeightFiles(e),s=o.map(i=>this.loadWeightsFile(i,n[i]));return Promise.all(s).then(i=>[t,Vn(i)])}loadWeightsFile(e,t){return new Promise((o,n)=>{let s=new FileReader;s.onload=i=>{let a=i.target.result;o(a)},s.onerror=i=>n(`Failed to weights data from file of path '${e}'.`),s.readAsArrayBuffer(t)})}checkManifestAndWeightFiles(e){let t=[],o=this.weightsFiles.map(s=>bp(s.name)),n={};for(let s of e)s.paths.forEach(i=>{let a=bp(i);if(t.indexOf(a)!==-1)throw new Error(`Duplicate file basename found in weights manifest: '${a}'`);if(t.push(a),o.indexOf(a)===-1)throw new Error(`Weight file with basename '${a}' is not provided.`);n[i]=this.weightsFiles[o.indexOf(a)]});if(t.length!==this.weightsFiles.length)throw new Error(`Mismatch in the number of files in weights manifest (${t.length}) and the number of weight files provided (${this.weightsFiles.length}).`);return n}},JN=r=>E().getBool("IS_BROWSER")&&!Array.isArray(r)&&r.startsWith(Kr.URL_SCHEME)?eS(r.slice(Kr.URL_SCHEME.length)):null;he.registerSaveRouter(JN);function eS(r="model"){return new Kr(r)}function By(r){return new Ly(r)}function Sp(r,e,t,o){i(r),t=t==null?0:t,o=o==null?1:o,a(t,o);let n=0,s=l=>(l.then(u=>{let c=t+ ++n/r.length*(o-t);return e(c),u}),l);function i(l){v(l!=null&&Array.isArray(l)&&l.length>0,()=>"promises must be a none empty array")}function a(l,u){v(l>=0&&l<=1,()=>`Progress fraction must be in range [0, 1], but got startFraction ${l}`),v(u>=0&&u<=1,()=>`Progress fraction must be in range [0, 1], but got endFraction ${u}`),v(u>=l,()=>`startFraction must be no more than endFraction, but got startFraction ${l} and endFraction ${u}`)}return Promise.all(r.map(s))}async function Ep(r,e){e==null&&(e={});let t=e.fetchFunc==null?E().platform.fetch:e.fetchFunc,o=r.map(p=>t(p,e.requestInit,{isBinary:!0})),n=0,s=.5,a=(e.onProgress==null?await Promise.all(o):await Sp(o,e.onProgress,n,s)).map(p=>p.arrayBuffer()),l=.5,u=1;return e.onProgress==null?await Promise.all(a):await Sp(a,e.onProgress,l,u)}async function My(r,e="",t,o){return Ip(i=>Ep(i,{requestInit:o}))(r,e,t)}function Ip(r){return async(e,t="",o)=>{let n=e.map(()=>!1),s={},i=o!=null?o.map(()=>!1):[],a=[];if(e.forEach((f,d)=>{let g=0;f.weights.forEach(h=>{let b="quantization"in h?h.quantization.dtype:h.dtype,T=za[b]*ne(h.shape),k=()=>{n[d]=!0,s[d]==null&&(s[d]=[]),s[d].push({manifestEntry:h,groupOffset:g,sizeBytes:T})};o!=null?o.forEach((S,I)=>{S===h.name&&(k(),i[I]=!0)}):k(),a.push(h.name),g+=T})}),!i.every(f=>f)){let f=o.filter((d,g)=>!i[g]);throw new Error(`Could not find weights in manifest with names: ${f.join(", ")}. 
Manifest JSON has weights with names: ${a.join(", ")}.`)}let l=n.reduce((f,d,g)=>(d&&f.push(g),f),[]),u=[];l.forEach(f=>{e[f].paths.forEach(d=>{let g=t+(t.endsWith("/")?"":"/")+d;u.push(g)})});let c=await r(u),p={},m=0;return l.forEach(f=>{let d=e[f].paths.length,g=0;for(let S=0;S<d;S++)g+=c[m+S].byteLength;let h=new ArrayBuffer(g),b=new Uint8Array(h),T=0;for(let S=0;S<d;S++){let I=new Uint8Array(c[m+S]);b.set(I,T),T+=I.byteLength}s[f].forEach(S=>{let I=h.slice(S.groupOffset,S.groupOffset+S.sizeBytes),A=su(I,[S.manifestEntry]);for(let R in A)p[R]=A[R]}),m+=d}),p}}var tS="application/octet-stream",rS="application/json",uu=class{constructor(e,t){if(this.DEFAULT_METHOD="POST",t==null&&(t={}),this.weightPathPrefix=t.weightPathPrefix,this.onProgress=t.onProgress,this.weightUrlConverter=t.weightUrlConverter,t.fetchFunc!=null?(v(typeof t.fetchFunc=="function",()=>"Must pass a function that matches the signature of `fetch` (see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)"),this.fetch=t.fetchFunc):this.fetch=E().platform.fetch,v(e!=null&&e.length>0,()=>"URL path for http must not be null, undefined or empty."),Array.isArray(e)&&v(e.length===2,()=>`URL paths for http must have a length of 2, (actual length is ${e.length}).`),this.path=e,t.requestInit!=null&&t.requestInit.body!=null)throw new Error("requestInit is expected to have no pre-existing body, but has one.");this.requestInit=t.requestInit||{}}async save(e){if(e.modelTopology instanceof ArrayBuffer)throw new Error("BrowserHTTPRequest.save() does not support saving model topology in binary formats yet.");let t=Object.assign({method:this.DEFAULT_METHOD},this.requestInit);t.body=new FormData;let o=[{paths:["./model.weights.bin"],weights:e.weightSpecs}],n=iu(e,o);t.body.append("model.json",new Blob([JSON.stringify(n)],{type:rS}),"model.json"),e.weightData!=null&&t.body.append("model.weights.bin",new Blob([e.weightData],{type:tS}),"model.weights.bin");let s=await this.fetch(this.path,t);if(s.ok)return{modelArtifactsInfo:ir(e),responses:[s]};throw new Error(`BrowserHTTPRequest.save() failed due to HTTP response status ${s.status}.`)}async load(){let e=await this.fetch(this.path,this.requestInit);if(!e.ok)throw new Error(`Request to ${this.path} failed with status code ${e.status}. Please verify this URL points to the model JSON of the model to load.`);let t;try{t=await e.json()}catch(s){let i=`Failed to parse model JSON of response from ${this.path}.`;throw this.path.endsWith(".pb")?i+=" Your path contains a .pb file extension. Support for .pb models have been removed in TensorFlow.js 1.0 in favor of .json models. You can re-convert your Python TensorFlow model using the TensorFlow.js 1.0 conversion scripts or you can convert your.pb models with the 'pb2json'NPM script in the tensorflow/tfjs-converter repository.":i+=" Please make sure the server is serving valid JSON for this request.",new Error(i)}let o=t.modelTopology,n=t.weightsManifest;if(o==null&&n==null)throw new Error(`The JSON from HTTP path ${this.path} contains neither model topology or manifest for weights.`);return Gn(t,s=>this.loadWeights(s))}async loadWeights(e){let t=Array.isArray(this.path)?this.path[1]:this.path,[o,n]=oS(t),s=this.weightPathPrefix||o,i=au(e),a=[],l=[];for(let c of e)for(let p of c.paths)this.weightUrlConverter!=null?l.push(this.weightUrlConverter(p)):a.push(s+p+n);this.weightUrlConverter&&a.push(...await Promise.all(l));let u=await Ep(a,{requestInit:this.requestInit,fetchFunc:this.fetch,onProgress:this.onProgress});return[i,Vn(u)]}};uu.URL_SCHEME_REGEX=/^https?:\/\//;function oS(r){let e=r.lastIndexOf("/"),t=r.lastIndexOf("?"),o=r.substring(0,e),n=t>e?r.substring(t):"";return[o+"/",n]}function cu(r){return r.match(uu.URL_SCHEME_REGEX)!=null}var Vy=(r,e)=>{if(typeof fetch=="undefined"&&(e==null||e.fetchFunc==null))return null;{let t=!0;if(Array.isArray(r)?t=r.every(o=>cu(o)):t=cu(r),t)return pu(r,e)}return null};he.registerSaveRouter(Vy);he.registerLoadRouter(Vy);function pu(r,e){return new uu(r,e)}function Gy(r,e){return pu(r,e)}var mu=class{constructor(e){this.modelArtifacts=e}load(){return this.modelArtifacts}},$p=class{constructor(e){this.saveHandler=e}save(e){return this.saveHandler(e)}},zy=class{constructor(e){e.load&&(this.load=()=>Promise.resolve(e.load())),e.save&&(this.save=t=>Promise.resolve(e.save(t)))}};function Uy(r,e,t,o){let n=arguments;return new zy(Ap(...n))}function Ap(r,e,t,o){return arguments.length===1?r.modelTopology!=null||r.weightSpecs!=null?new mu(r):(console.warn("Please call tf.io.fromMemory() with only one argument. The argument should be of type ModelArtifacts. The multi-argument signature of tf.io.fromMemory() has been deprecated and will be removed in a future release."),new mu({modelTopology:r})):(console.warn("Please call tf.io.fromMemory() with only one argument. The argument should be of type ModelArtifacts. The multi-argument signature of tf.io.fromMemory() has been deprecated and will be removed in a future release."),new mu({modelTopology:r,weightSpecs:e,weightData:t,trainingConfig:o}))}function Wy(r){return new $p(r)}function jy(r){return new $p(r)}var Fp={};re(Fp,{confusionMatrix:()=>Qy});function nS(r,e,t=!1,o=!1){let n=y(r,"a","matMul"),s=y(e,"b","matMul");[n,s]=ee(n,s);let i={a:n,b:s},a={transposeA:t,transposeB:o};return w.runKernel(Os,i,a)}var ie=_({matMul_:nS});function sS(r,e,t=1,o=0,n="int32"){if(e<2)throw new Error(`Error in oneHot: depth must be >=2, but it is ${e}`);let i={indices:y(r,"indices","oneHot","int32")},a={dtype:n,depth:e,onValue:t,offValue:o};return w.runKernel(zi,i,a)}var jn=_({oneHot_:sS});function iS(){E().set("PROD",!0)}function aS(){E().set("DEBUG",!0)}function lS(){E().set("DEPRECATION_WARNINGS_ENABLED",!1),console.warn("TensorFlow.js deprecation warnings have been disabled.")}function Hy(r){E().getBool("DEPRECATION_WARNINGS_ENABLED")&&console.warn(r+" You can disable deprecation warnings with tf.disableDeprecationWarnings().")}uy(Hy);function uS(){w.disposeVariables()}function Xr(){return w}function qy(){return w.memory()}function cS(r){return w.profile(r)}function Y(r,e){return w.tidy(r,e)}function Ie(r){Ga(r).forEach(t=>t.dispose())}function ht(r){return w.keep(r)}function pS(r){return w.time(r)}function Ky(r){return w.setBackend(r)}function Xy(){return w.ready()}function Hn(){return w.backendName}function Rp(r){w.removeBackend(r)}function Yy(r){return w.findBackend(r)}function mS(r){return w.findBackendFactory(r)}function Dp(r,e,t=1){return w.registerBackend(r,e,t)}function fS(){return w.backend}function dS(r,e){E().setPlatform(r,e)}function hS(r){let t={input:y(r,"input","imag")};return w.runKernel(yi,t)}var Tr=_({imag_:hS});function gS(r){let t={x:y(r,"x","neg")};return w.runKernel(kn,t)}var Ke=_({neg_:gS});function xS(r){let t={input:y(r,"input","real")};return w.runKernel(Sn,t)}var ar=_({real_:xS});function yS(r,e,t){let o=y(r,"x","transpose");if(e==null&&(e=o.shape.map((i,a)=>a).reverse()),v(o.rank===e.length,()=>`Error in transpose: rank of input ${o.rank} must match length of perm ${e}.`),e.forEach(i=>{v(i>=0&&i<o.rank,()=>`All entries in 'perm' must be between 0 and ${o.rank-1} but got ${e}`)}),o.rank<=1)return o.clone();let n={x:o},s={perm:e};return o.dtype==="complex64"?Y(()=>{let i=ar(o),a=Tr(o);return i=w.runKernel(Ao,{x:i},s),a=w.runKernel(Ao,{x:a},s),t&&(a=Ke(a)),Je(i,a)}):w.runKernel(Ao,n,s)}var Mo=_({transpose_:yS});function bS(r,e,t){let o=y(r,"labels","confusionMatrix"),n=y(e,"predictions","confusionMatrix");v(t==null||t>0&&Number.isInteger(t),()=>`If provided, numClasses must be a positive integer, but got ${t}`),v(o.rank===1,()=>`Expected the rank of labels to be 1, but got ${o.rank}`),v(n.rank===1,()=>`Expected the rank of predictions to be 1, but got ${n.rank}`),v(o.shape[0]===n.shape[0],()=>`Mismatch in the number of examples: ${o.shape[0]} vs. ${n.shape[0]}. Labels and predictions should have the same number of elements.`),v(t>0&&Number.isInteger(t),()=>`numClasses is required to be a positive integer, but got ${t}`);let s=jn(oe(o,"int32"),t),i=jn(oe(n,"int32"),t),a=Mo(s),l=ie(a,i);return oe(l,"int32")}var Qy=_({confusionMatrix_:bS});var Wa={};re(Wa,{assertAndGetBroadcastShape:()=>ae,getBroadcastDims:()=>Zy,getReductionAxes:()=>fu});function Zy(r,e){let t=r.length,o=[];for(let n=0;n<t;n++){let s=t-1-n,i=r[s]||1;(e[e.length-1-n]||1)>1&&i===1&&o.unshift(s)}return o}function fu(r,e){let t=[];for(let o=0;o<e.length;o++){let n=r[r.length-o-1],s=e.length-o-1,i=e[s];(n==null||n===1&&i>1)&&t.unshift(s)}return t}function ae(r,e){let t=[],o=Math.max(r.length,e.length);for(let n=0;n<o;n++){let s=r[r.length-n-1];s==null&&(s=1);let i=e[e.length-n-1];if(i==null&&(i=1),s===1)t.unshift(i);else if(i===1)t.unshift(s);else if(s!==i){let a=`Operands could not be broadcast together with shapes ${r} and ${e}.`;throw Error(a)}else t.unshift(s)}return t}var Ha={};re(Ha,{fromPixels:()=>NS,fromPixelsAsync:()=>CS,toPixels:()=>kS});function ja(r,e,t){if(Tt(r),e!=null&&e.length!==3)throw new Error("tensor3d() requires shape to have three numbers");let o=ze(r,t);if(o.length!==3&&o.length!==1)throw new Error("tensor3d() requires values to be number[][][] or flat/TypedArray");if(o.length===1&&e==null)throw new Error("tensor3d() requires shape to be provided when `values` are a flat array");return et(r,e,o,t)}var Vo;function Jy(r,e=3){if(e>4)throw new Error("Cannot construct Tensor with more than 4 channels from pixels.");if(r==null)throw new Error("pixels passed to tf.browser.fromPixels() can not be null");let t=!1,o=!1,n=!1,s=!1,i=!1,a=!1;if(r.data instanceof Uint8Array)t=!0;else if(typeof ImageData!="undefined"&&r instanceof ImageData)o=!0;else if(typeof HTMLVideoElement!="undefined"&&r instanceof HTMLVideoElement)n=!0;else if(typeof HTMLImageElement!="undefined"&&r instanceof HTMLImageElement)s=!0;else if(r.getContext!=null)i=!0;else if(typeof ImageBitmap!="undefined"&&r instanceof ImageBitmap)a=!0;else throw new Error(`pixels passed to tf.browser.fromPixels() must be either an HTMLVideoElement, HTMLImageElement, HTMLCanvasElement, ImageData in browser, or OffscreenCanvas, ImageData in webworker or {data: Uint32Array, width: number, height: number}, but was ${r.constructor.name}`);if(Fn(In,w.backendName)!=null){let d={pixels:r},g={numChannels:e};return w.runKernel(In,d,g)}let[u,c]=n?[r.videoWidth,r.videoHeight]:[r.width,r.height],p;if(i)p=r.getContext("2d").getImageData(0,0,u,c).data;else if(o||t)p=r.data;else if(s||n||a){if(Vo==null)if(typeof document=="undefined")if(typeof OffscreenCanvas!="undefined"&&typeof OffscreenCanvasRenderingContext2D!="undefined")Vo=new OffscreenCanvas(1,1).getContext("2d");else throw new Error("Cannot parse input in current context. Reason: OffscreenCanvas Context2D rendering is not supported.");else Vo=document.createElement("canvas").getContext("2d",{willReadFrequently:!0});Vo.canvas.width=u,Vo.canvas.height=c,Vo.drawImage(r,0,0,u,c),p=Vo.getImageData(0,0,u,c).data}let m;if(e===4)m=new Int32Array(p);else{let d=u*c;m=new Int32Array(d*e);for(let g=0;g<d;g++)for(let h=0;h<e;++h)m[g*e+h]=p[g*4+h]}return ja(m,[c,u,e],"int32")}function _S(r){return r!=null&&r.data instanceof Uint8Array}function wS(){return typeof window!="undefined"&&typeof ImageBitmap!="undefined"&&window.hasOwnProperty("createImageBitmap")}function vS(r){return r!=null&&r.width!==0&&r.height!==0}function TS(r){return wS()&&!(r instanceof ImageBitmap)&&vS(r)&&!_S(r)}async function CS(r,e=3){let t=null;if(E().getBool("WRAP_TO_IMAGEBITMAP")&&TS(r)){let o;try{o=await createImageBitmap(r,{premultiplyAlpha:"none"})}catch(n){o=null}o!=null&&o.width===r.width&&o.height===r.height?t=o:t=r}else t=r;return Jy(t,e)}async function kS(r,e){let t=y(r,"img","toPixels");if(!(r instanceof ue)){let u=t;t=oe(u,"int32"),u.dispose()}if(t.rank!==2&&t.rank!==3)throw new Error(`toPixels only supports rank 2 or 3 tensors, got rank ${t.rank}.`);let[o,n]=t.shape.slice(0,2),s=t.rank===2?1:t.shape[2];if(s>4||s===2)throw new Error(`toPixels only supports depth of size 1, 3 or 4 but got ${s}`);if(t.dtype!=="float32"&&t.dtype!=="int32")throw new Error(`Unsupported type for toPixels: ${t.dtype}. Please use float32 or int32 tensors.`);let i=await t.data(),a=t.dtype==="float32"?255:1,l=new Uint8ClampedArray(n*o*4);for(let u=0;u<o*n;++u){let c=[0,0,0,255];for(let m=0;m<s;m++){let f=i[u*s+m];if(t.dtype==="float32"){if(f<0||f>1)throw new Error(`Tensor values for a float32 Tensor must be in the range [0 - 1] but encountered ${f}.`)}else if(t.dtype==="int32"&&(f<0||f>255))throw new Error(`Tensor values for a int32 Tensor must be in the range [0 - 255] but encountered ${f}.`);s===1?(c[0]=f*a,c[1]=f*a,c[2]=f*a):c[m]=f*a}let p=u*4;l[p+0]=Math.round(c[0]),l[p+1]=Math.round(c[1]),l[p+2]=Math.round(c[2]),l[p+3]=Math.round(c[3])}if(e!=null){e.width=n,e.height=o;let u=e.getContext("2d"),c=new ImageData(l,n,o);u.putImageData(c,0,0)}return t!==r&&t.dispose(),l}var NS=_({fromPixels_:Jy});var Op={};re(Op,{prepareAndValidate:()=>eb});function eb(r,e){let t=r.shape.length,o=e.shape.length;if(t<1)throw new Error(`tf.gatherND() expects the input to be rank 1 or higher, but the rank was ${t}.`);if(o<1)throw new Error(`tf.gatherND() expects the indices to be rank 1 or higher, but the rank was ${o}.`);if(e.dtype!=="int32")throw new Error(`tf.gatherND() expects the indices to be int32 type, but the dtype was ${e.dtype}.`);if(e.shape[o-1]>t)throw new Error(`index innermost dimension length must be <= tensor rank; saw: ${e.shape[o-1]} vs. ${t}`);if(ne(r.shape)===0)throw new Error(`Requested more than 0 entries, but input is empty. Input shape: ${r.shape}.`);let n=e.shape,s=n[n.length-1],i=1;for(let p=0;p<n.length-1;++p)i*=n[p];let a=r.shape,l=n.slice();l.pop();let u=1;for(let p=s;p<t;++p)u*=a[p],l.push(a[p]);let c=[...nr(r.shape).map(p=>p/u),1].slice(0,s);return[l,i,u,c]}var Lp={};re(Lp,{calculateShapes:()=>tb,validateInput:()=>du,validateUpdateShape:()=>Pp});function Pp(r,e,t){let o=e.rank>1?e.shape[e.rank-1]:1,n=e.rank>1?e.rank-1:1,s=`Must have updates.shape = indices.shape[:batchDim] + shape[sliceDim:], got updates.shape: ${t.shape}, indices.shape: ${e.shape}, shape: ${r}, sliceDim: ${o}, and batchDim: ${n}.`;if(t.rank<n)throw new Error(s+` update.rank < ${n}. `);if(r.length<o+(t.rank-n))throw new Error(s+` Output shape length < ${o+(t.rank-n)}`);if(t.rank!==n+r.length-o)throw new Error(s+` update.rank != ${n+r.length-o}`);for(let i=0;i<n;++i)if(t.shape[i]!==e.shape[i])throw new Error(s+` updates.shape[${i}] (${t.shape[i]}) != indices.shape[${i}] (${e.shape[i]}).`);for(let i=0;i<t.rank-n;++i)if(t.shape[i+n]!==r[i+o])throw new Error(s+` updates.shape[${i+n}] (${t.shape[i+n]}) != shape[${i+n}] (${r[i+n]})`)}function du(r,e,t){if(e.rank<1)throw new Error(`tf.scatterND() expects the indices to be rank 1 or higher, but the rank was ${e.rank}.`);if(r.rank<1)throw new Error(`tf.scatterND() expects the updates to be rank 1 or higher, but the rank was ${r.rank}.`);if(e.dtype!=="int32")throw new Error(`The dtype of 'indices' should be int32, but got dtype: ${e.dtype}`);if(t.length<1)throw new Error(`Output rank must be greater or equal to 1, but got shape: ${t}`);if(t.length===0){if(e.size===0)throw new Error(`Indices specified for empty output. indices shape: ${e.shape}`);if(r.size===0)throw new Error(`Updates specified for empty output. updates shape: ${r.shape}`)}Pp(t,e,r)}function tb(r,e,t){let o=e.shape.length,n=o>1?e.shape[o-1]:1,s=t.length,i=1;for(let p=n;p<s;++p)i*=t[p];let a=n<1?1:n,l=ne(e.shape)/a,u=[...nr(t.slice(0,n)),1],c=ne(t);return{sliceRank:n,numUpdates:l,sliceSize:i,strides:u,outputSize:c}}var tt={};re(tt,{assertParamsValid:()=>ES,computeFlatOffset:()=>DS,computeOutShape:()=>$S,getNormalizedAxes:()=>AS,isSliceContinous:()=>RS,maskToAxes:()=>IS,parseSliceParams:()=>FS,sliceInfo:()=>OS,startForAxis:()=>lb,startIndicesWithElidedDims:()=>sb,stopForAxis:()=>ub,stopIndicesWithElidedDims:()=>ib,stridesForAxis:()=>ab,stridesWithElidedDims:()=>rb});var Bp=-2,SS=-1;function ES(r,e,t){let o=r.shape.length;v(o===e.length,()=>`Error in slice${o}D: Length of begin ${e} must match the rank of the array (${o}).`),v(o===t.length,()=>`Error in slice${o}D: Length of size ${t} must match the rank of the array (${o}).`);for(let n=0;n<o;++n)v(e[n]+t[n]<=r.shape[n],()=>`Error in slice${o}D: begin[${n}] + size[${n}] (${e[n]+t[n]}) would overflow input.shape[${n}] (${r.shape[n]})`)}function IS(r){let e=[],t=0;for(;r>0;)r&1&&e.push(t),r/=2,t++;return e}function $S(r,e,t){let o=[];for(let n=0;n<r.length;n++)o[n]=Math.ceil((e[n]-r[n])/t[n]);return o}function rb(r,e,t,o){let n=[...r];for(let s=n.length;s<o.length;s++)n.push(1);for(let s=0;s<t;s++)s===0?n[e]=1:(n.splice(e,0,1),n.pop());return n}function ob(r,e,t){return t<=r?t:t-(e-1)}function nb(r,e){let t=[];for(let o=0;o<r;o++)t.push(e+o);return t}function AS(r,e,t,o,n,s,i,a,l){let u=r.length,c=new Array(u),p=new Array(u),m=new Array(u);if(e.length&&t>0){let f=e[0],d=t+1;c=sb(i,f,d,o,r),p=ib(a,f,d,n,r),m=rb(s,f,d,r)}else for(let f=0;f<u;f++)c[f]=lb(i,o,s,r,f,l),p[f]=ub(a,n,s,r,f,l),m[f]=ab(s,f,l);return{begin:c,end:p,strides:m}}function sb(r,e,t,o,n){let s=[...n],i=nb(t,e);for(let a=0;a<s.length;a++)if(i.indexOf(a)>-1)s[a]=0;else{let l=ob(e,t,a),u=o[l];r&1<<l&&(u=0),s[a]=u}return s}function ib(r,e,t,o,n){let s=[...n],i=nb(t,e);for(let a=0;a<s.length;a++)if(i.indexOf(a)>-1)s[a]=Number.MAX_SAFE_INTEGER;else{let l=ob(e,t,a),u=o[l];r&1<<l&&(u=Number.MAX_SAFE_INTEGER),s[a]=u}for(let a=0;a<s.length;a++){let l=n[a];s[a]<0&&(s[a]+=l),s[a]=bn(0,s[a],n[a])}return s}function ab(r,e,t){let o=r[e];return(t&1<<e||o==null)&&(o=1),o}function lb(r,e,t,o,n,s){let i=e[n],a=t[n]||1;(r&1<<n||s&1<<n||i==null)&&(a>0?i=Number.MIN_SAFE_INTEGER:i=Number.MAX_SAFE_INTEGER);let l=o[n];return i<0&&(i+=l),i=bn(0,i,l-1),i}function ub(r,e,t,o,n,s){let i=e[n],a=t[n]||1;(r&1<<n||s&1<<n||i==null)&&(a>0?i=Number.MAX_SAFE_INTEGER:i=Number.MIN_SAFE_INTEGER);let l=o[n];return i<0&&(i+=l),a>0?i=bn(0,i,l):i=bn(-1,i,l-1),i}function RS(r,e,t){let o=t.length;for(let n=0;n<t.length;n++)if(t[n]>1){o=n;break}for(let n=o+1;n<t.length;n++)if(e[n]>0||t[n]!==r[n])return!1;return!0}function DS(r,e){let t=r.length>0?r[r.length-1]:1;for(let o=0;o<r.length-1;o++)t+=r[o]*e[o];return t}function FS(r,e,t){let o,n=r.shape.length;typeof e=="number"?o=[e,...new Array(n-1).fill(0)]:e.length<n?o=e.concat(new Array(n-e.length).fill(0)):o=e.slice(),o.forEach(i=>{v(i!==-1,()=>"slice() does not support negative begin indexing.")});let s;return t==null?s=new Array(n).fill(-1):typeof t=="number"?s=[t,...new Array(n-1).fill(-1)]:t.length<n?s=t.concat(new Array(n-t.length).fill(-1)):s=t,s=s.map((i,a)=>i>=0?i:(v(i===-1,()=>`Negative size values should be exactly -1 but got ${i} for the slice() size at index ${a}.`),r.shape[a]-o[a])),[o,s]}function OS(r,e,t,o,n,s,i,a,l){let u;if(o==null?(u=new Array(e.length),u.fill(1)):u=o,i!=null&&(i&i-1)!=0)throw new Error("Multiple ellipses in slice is not allowed.");let c=!1,p={dims:u.length,numAddAxisAfterEllipsis:0,begin:e.slice(),end:t.slice(),strides:u.slice(),beginMask:n,endMask:s,ellipsisMask:i,newAxisMask:a,shrinkAxisMask:l};for(let k=0;k<p.dims;k++)c&&(1<<k&a)!=0&&p.numAddAxisAfterEllipsis++,1<<k&i&&(c=!0);c||(p.ellipsisMask|=1<<p.dims,p.dims++);let m={dims:r.length,beginMask:0,endMask:0,beginValid:!1,endValid:!1};PS(p,m);let f=!0,d=!0,g=!0,h=[],b=[];for(let k=0;k<r.length;++k){if(m.strides[k]===0)throw Error(`strides[${k}] must be non-zero`);let S=!!(m.shrinkAxisMask&1<<k),I=r[k];if(I===-1){h.push(S?1:-1);continue}let A=[m.beginMask&1<<k,m.endMask&1<<k],R=[m.strides[k]>0?0:-1,m.strides[k]>0?I:I-1];if(S&&m.strides[k]<=0)throw Error("only stride 1 allowed on non-range indexing.");g=g&&m.strides[k]===1;let D=!!(m.beginMask&1<<k&&m.endMask&1<<k);if(m.beginValid&&m.endValid){if(S){let B=m.begin[k]<0?I+m.begin[k]:m.begin[k];if(m.begin[k]=B,m.end[k]=m.begin[k]+1,B<0||B>=I)throw Error(`slice index ${m.begin[k]} of dimension ${k} out of bounds.`)}else m.begin[k]=cb(m.begin[k],0,m.strides[k],I,A,R),m.end[k]=cb(m.end[k],1,m.strides[k],I,A,R);let z=m.strides[k]===1&&m.begin[k]===0&&m.end[k]===I;f=f&&z,d=d&&(k===0&&m.strides[k]===1||z)}else f=f&&m.strides[k]===1&&D,d=d&&(k===0&&m.strides[k]===1||D);let P,L=!1;if(m.beginValid&&m.endValid?(P=m.end[k]-m.begin[k],L=!0):S?(P=1,L=!0):D&&I>=0&&(m.strides[k]<0?P=-I:P=I,L=!0),L){let z;P===0||P<0!=m.strides[k]<0?z=0:z=Math.trunc(P/m.strides[k])+(P%m.strides[k]!=0?1:0),h.push(z)}else h.push(-1)}for(let k=0;k<m.finalShapeGatherIndices.length;++k){let S=m.finalShapeGatherIndices[k];S>=0?b.push(h[S]):S===Bp&&b.push(1)}return{finalShapeSparse:b.filter((k,S)=>m.finalShapeGatherIndices[S]!==Bp),finalShape:b,isIdentity:f,sliceDim0:d,isSimpleSlice:g,begin:m.begin,end:m.end,strides:m.strides}}function PS(r,e){e.beginMask=0,e.endMask=0,e.shrinkAxisMask=0;let t=0;e.beginValid=r.begin!=null,e.endValid=r.end!=null,e.begin=new Array(e.dims),e.end=new Array(e.dims),e.strides=new Array(e.dims),e.finalShapeGatherIndices=[],e.finalShapeGatherIndicesSparse=[],e.inputShapeGatherIndicesSparse=new Array(e.dims);for(let o=0;o<r.dims;o++)if(1<<o&r.ellipsisMask){let n=Math.min(e.dims-(r.dims-o)+1+r.numAddAxisAfterEllipsis,e.dims);for(;t<n;t++)e.begin[t]=0,e.end[t]=0,e.strides[t]=1,e.beginMask|=1<<t,e.endMask|=1<<t,e.finalShapeGatherIndices.push(t),e.finalShapeGatherIndicesSparse.push(-1),e.inputShapeGatherIndicesSparse[t]=o}else if(1<<o&r.newAxisMask)e.finalShapeGatherIndices.push(Bp),e.finalShapeGatherIndicesSparse.push(-1);else{if(t===e.begin.length)throw Error(`Index out of range using input dim ${t}; input has only ${e.dims} dims, ${e.begin.length}.`);r.begin!=null&&(e.begin[t]=r.begin[o]),r.end!=null&&(e.end[t]=r.end[o]),e.strides[t]=r.strides[o],r.beginMask&1<<o&&(e.beginMask|=1<<t),r.endMask&1<<o&&(e.endMask|=1<<t),r.shrinkAxisMask&1<<o?(e.finalShapeGatherIndices.push(SS),e.finalShapeGatherIndicesSparse.push(-1),e.shrinkAxisMask|=1<<t):(e.finalShapeGatherIndices.push(t),e.finalShapeGatherIndicesSparse.push(o)),e.inputShapeGatherIndicesSparse[t]=o,t++}}function cb(r,e,t,o,n,s){if(n[e])return t>0?s[e]:s[e+1&1];{let i=r<0?o+r:r;return i<s[0]?s[0]:i>s[1]?s[1]:i}}var Mp={};re(Mp,{Serializable:()=>hu,SerializationMap:()=>Cr,registerClass:()=>ut});var hu=class{getClassName(){return this.constructor.className}static fromConfig(e,t){return new e(t)}},Cr=class{constructor(){this.classNameMap={}}static getMap(){return Cr.instance==null&&(Cr.instance=new Cr),Cr.instance}static register(e){Cr.getMap().classNameMap[e.className]=[e,e.fromConfig]}};function ut(r){v(r.className!=null,()=>"Class being registered does not have the static className property defined."),v(typeof r.className=="string",()=>"className is required to be a string, but got type "+typeof r.className),v(r.className.length>0,()=>"Class being registered has an empty-string as its className, which is disallowed."),Cr.register(r)}var Up={};re(Up,{TEST_EPSILON_FLOAT16:()=>pb,createVideoElement:()=>WS,encodeStrings:()=>mb,expectArrayBuffersEqual:()=>US,expectArraysClose:()=>BS,expectArraysEqual:()=>VS,expectNumbersClose:()=>GS,expectPromiseToFail:()=>MS,expectValuesInRange:()=>zS,play:()=>jS,testEpsilon:()=>Vp});var LS=.001,pb=.1;function BS(r,e,t){return t==null&&(t=Vp()),Gp(r,e,(o,n)=>zp(o,n,t))}function Vp(){return w.backend.floatPrecision()===32?LS:pb}function Gp(r,e,t){let o=!0;if((Fe(r)||Fe(e))&&(o=!1),Fe(r)&&Fe(e)&&(o=!0),o){let i=r.constructor.name,a=e.constructor.name;if(i!==a)throw new Error(`Arrays are of different type. Actual: ${i}. Expected: ${a}`)}if(Array.isArray(r)&&Array.isArray(e)){let i=ze(r),a=ze(e);if(!pt(i,a))throw new Error(`Arrays have different shapes. Actual: [${i}]. Expected: [${a}]`)}let n=Fe(r)?r:Vt(r),s=Fe(e)?e:Vt(e);if(n.length!==s.length)throw new Error(`Arrays have different lengths actual: ${n.length} vs expected: ${s.length}.
Actual:   ${n}.
Expected: ${s}.`);for(let i=0;i<s.length;++i){let a=n[i],l=s[i];if(!t(a,l))throw new Error(`Arrays differ: actual[${i}] = ${a}, expected[${i}] = ${l}.
Actual:   ${n}.
Expected: ${s}.`)}typeof expect!="undefined"&&expect().nothing()}function MS(r,e){r().then(()=>e.fail(),()=>e()),typeof expect!="undefined"&&expect().nothing()}function VS(r,e){let t=typeof e=="string"||typeof e=="number"||typeof e=="boolean"?[e]:e;return Gt(r)||Gt(r[0])||Gt(e)||Gt(e[0])?Gp(r,t,(o,n)=>o==n):Gp(r,e,(o,n)=>zp(o,n,0))}function GS(r,e,t){if(t==null&&(t=Vp()),!zp(r,e,t))throw new Error(`Numbers differ: actual === ${r}, expected === ${e}`);typeof expect!="undefined"&&expect().nothing()}function zp(r,e,t){return!isFinite(r)&&!isFinite(e)?!0:!(isNaN(r)||isNaN(e)||Math.abs(r-e)>t)}function zS(r,e,t){for(let o=0;o<r.length;o++)if(r[o]<e||r[o]>t)throw new Error(`Value out of range:${r[o]} low: ${e}, high: ${t}`)}function US(r,e){let t=new Float32Array(r),o=new Float32Array(e);if(t.length!==o.length)throw new Error(`Expected ArrayBuffer to be of length ${o.length}, but it was ${t.length}`);for(let n=0;n<o.length;n++)if(t[n]!==o[n])throw new Error(`Expected ArrayBuffer value at ${n} to be ${o[n]} but got ${t[n]} instead`)}function mb(r){for(let e=0;e<r.length;e++){let t=r[e];Array.isArray(t)?mb(t):r[e]=Wr(t)}return r}function WS(r){let e=document.createElement("video");return"playsInline"in e&&(e.playsInline=!0),e.muted=!0,e.loop=!0,e.style.position="fixed",e.style.left="0px",e.style.top="0px",e.preload="auto",e.appendChild(r),new Promise(t=>{e.addEventListener("loadeddata",o=>t(e)),e.load()})}async function jS(r){await r.play(),"requestVideoFrameCallback"in r&&await new Promise(e=>{r.requestVideoFrameCallback(e)})}var fb="3.21.0";function HS(r,e){let t=y(r,"a","add"),o=y(e,"b","add");[t,o]=ee(t,o);let n={a:t,b:o};return w.runKernel(xr,n)}var G=_({add_:HS});function qS(r,e){let t=y(r,"a","floorDiv"),o=y(e,"b","floorDiv");[t,o]=ee(t,o);let n={a:t,b:o};return w.runKernel(fi,n)}var qa=_({floorDiv_:qS});function KS(r,e){let t=y(r,"a","div"),o=y(e,"b","div");if([t,o]=ee(t,o),t.dtype==="int32"&&o.dtype==="int32")return qa(t,o);let n={a:t,b:o},s={};return w.runKernel(si,n,s)}var Z=_({div_:KS});function XS(r,e){let t=y(r,"a","mul"),o=y(e,"b","mul");[t,o]=ee(t,o);let n={a:t,b:o};return w.runKernel(To,n)}var F=_({mul_:XS});function YS(r){let e=y(r,"x","abs");if(e.dtype==="complex64"){let t={x:e};return w.runKernel(Vs,t)}else{let t={x:e};return w.runKernel(Tn,t)}}var Le=_({abs_:YS});function QS(r){let t={x:y(r,"x","acos")};return w.runKernel(ws,t)}var Wp=_({acos_:QS});function ZS(r){let t={x:y(r,"x","acosh")};return w.runKernel(vs,t)}var jp=_({acosh_:ZS});function JS(r){v(Array.isArray(r),()=>"The argument passed to tf.addN() must be a list of tensors"),v(r.length>=1,()=>`Must pass at least one tensor to tf.addN(), but got ${r.length}`);let e=r.map((n,s)=>y(n,`tensors${s}`,"addN")),t=e[0];e.forEach(n=>{if(n.dtype!==t.dtype)throw new Error("All tensors passed to tf.addN() must have the same dtype")}),e.forEach(n=>{if(!pt(n.shape,t.shape))throw new Error("All tensors passed to tf.addN() must have the same shape")});let o=e;return w.runKernel(Ts,o)}var Hp=_({addN_:JS});function eE(r,e=null,t=!1){let n={x:y(r,"x","all","bool")},s={axis:e,keepDims:t};return w.runKernel(Cs,n,s)}var qp=_({all_:eE});function tE(r,e=null,t=!1){let n={x:y(r,"x","any","bool")},s={axis:e,keepDims:t};return w.runKernel(ks,n,s)}var Kp=_({any_:tE});function rE(r,e=0){let o={x:y(r,"x","argMax")},n={axis:e};return w.runKernel(Ns,o,n)}var Xp=_({argMax_:rE});function oE(r,e=0){let o={x:y(r,"x","argMin")},n={axis:e};return w.runKernel(Ss,o,n)}var Yp=_({argMin_:oE});function nE(r){let t={x:y(r,"x","asin")};return w.runKernel(Es,t)}var Qp=_({asin_:nE});function sE(r){let t={x:y(r,"x","asinh")};return w.runKernel(Is,t)}var Zp=_({asinh_:sE});function iE(r){let t={x:y(r,"x","atan")};return w.runKernel($s,t)}var Jp=_({atan_:iE});function aE(r,e){let t=y(r,"a","atan2"),o=y(e,"b","atan2");[t,o]=ee(t,o);let n={a:t,b:o};return w.runKernel(Rs,n)}var em=_({atan2_:aE});function lE(r){let t={x:y(r,"x","atanh")};return w.runKernel(As,t)}var tm=_({atanh_:lE});function uE(r,e,t,o,n="NHWC",s){let i=r[3],a=[...e,i],l=hb(n);return Go(r,a,t,s,o,null,null,l)}function rm(r,e,t,o,n,s,i="channelsLast"){let[a,l]=gu(e),u;if(i==="channelsLast")u=[a,l,r[3],r[3]];else if(i==="channelsFirst")u=[a,l,r[1],r[1]];else throw new Error(`Unknown dataFormat ${i}`);return Go(r,u,t,o,n,s,!1,i)}function cE(r,e,t,o,n,s,i="NDHWC"){let[a,l,u]=nm(e),c,p;if(i==="NDHWC")p="channelsLast",c=[a,l,u,r[4],r[4]];else if(i==="NCDHW")p="channelsFirst",c=[a,l,u,r[1],r[1]];else throw new Error(`Unknown dataFormat ${i}`);return db(r,c,t,o,n,!1,p,s)}function Go(r,e,t,o,n,s,i=!1,a="channelsLast"){let[l,u,c,p]=[-1,-1,-1,-1];if(a==="channelsLast")[l,u,c,p]=r;else if(a==="channelsFirst")[l,p,u,c]=r;else throw new Error(`Unknown dataFormat ${a}`);let[m,f,,d]=e,[g,h]=gu(t),[b,T]=gu(o),k=qn(m,b),S=qn(f,T),{padInfo:I,outHeight:A,outWidth:R}=fE(n,u,c,g,h,k,S,s,a),D=i?d*p:d,P;return a==="channelsFirst"?P=[l,D,A,R]:a==="channelsLast"&&(P=[l,A,R,D]),{batchSize:l,dataFormat:a,inHeight:u,inWidth:c,inChannels:p,outHeight:A,outWidth:R,outChannels:D,padInfo:I,strideHeight:g,strideWidth:h,filterHeight:m,filterWidth:f,effectiveFilterHeight:k,effectiveFilterWidth:S,dilationHeight:b,dilationWidth:T,inShape:r,outShape:P,filterShape:e}}function db(r,e,t,o,n,s=!1,i="channelsLast",a){let[l,u,c,p,m]=[-1,-1,-1,-1,-1];if(i==="channelsLast")[l,u,c,p,m]=r;else if(i==="channelsFirst")[l,m,u,c,p]=r;else throw new Error(`Unknown dataFormat ${i}`);let[f,d,g,,h]=e,[b,T,k]=nm(t),[S,I,A]=nm(o),R=qn(f,S),D=qn(d,I),P=qn(g,A),{padInfo:L,outDepth:z,outHeight:B,outWidth:K}=dE(n,u,c,p,b,T,k,R,D,P,a),W=s?h*m:h,X;return i==="channelsFirst"?X=[l,W,z,B,K]:i==="channelsLast"&&(X=[l,z,B,K,W]),{batchSize:l,dataFormat:i,inDepth:u,inHeight:c,inWidth:p,inChannels:m,outDepth:z,outHeight:B,outWidth:K,outChannels:W,padInfo:L,strideDepth:b,strideHeight:T,strideWidth:k,filterDepth:f,filterHeight:d,filterWidth:g,effectiveFilterDepth:R,effectiveFilterHeight:D,effectiveFilterWidth:P,dilationDepth:S,dilationHeight:I,dilationWidth:A,inShape:r,outShape:X,filterShape:e}}function pE(r,e,t,o,n){o==null&&(o=om(r,e,t));let s=r[0],i=r[1],a=zo((s-e+2*o)/t+1,n),l=zo((i-e+2*o)/t+1,n);return[a,l]}function mE(r,e,t,o,n,s){n==null&&(n=om(r,e,o));let i=r[0],a=r[1],l=r[2],u=zo((i-e+2*n)/o+1,s),c=zo((a-e+2*n)/o+1,s),p=zo((l-e+2*n)/o+1,s);return[u,c,p,t]}function om(r,e,t,o=1){let n=qn(e,o);return Math.floor((r[0]*(t-1)-t+n)/2)}function gu(r){return typeof r=="number"?[r,r,r]:r.length===2?[r[0],r[1],1]:r}function nm(r){return typeof r=="number"?[r,r,r]:r}function qn(r,e){return e<=1?r:r+(r-1)*(e-1)}function fE(r,e,t,o,n,s,i,a,l){let u,c,p;if(typeof r=="number"){u={top:r,bottom:r,left:r,right:r,type:r===0?"VALID":"NUMBER"};let f=pE([e,t],s,o,r,a);c=f[0],p=f[1]}else if(r==="same"){c=Math.ceil(e/o),p=Math.ceil(t/n);let m=Math.max(0,(c-1)*o+s-e),f=Math.max(0,(p-1)*n+i-t),d=Math.floor(m/2),g=m-d,h=Math.floor(f/2),b=f-h;u={top:d,bottom:g,left:h,right:b,type:"SAME"}}else if(r==="valid")u={top:0,bottom:0,left:0,right:0,type:"VALID"},c=Math.ceil((e-s+1)/o),p=Math.ceil((t-i+1)/n);else if(typeof r=="object"){let m=l==="channelsLast"?r[1][0]:r[2][0],f=l==="channelsLast"?r[1][1]:r[2][1],d=l==="channelsLast"?r[2][0]:r[3][0],g=l==="channelsLast"?r[2][1]:r[3][1];u={top:m,bottom:f,left:d,right:g,type:m===0&&f===0&&d===0&&g===0?"VALID":"EXPLICIT"},c=zo((e-s+m+f)/o+1,a),p=zo((t-i+d+g)/n+1,a)}else throw Error(`Unknown padding parameter: ${r}`);return{padInfo:u,outHeight:c,outWidth:p}}function dE(r,e,t,o,n,s,i,a,l,u,c){let p,m,f,d;if(typeof r=="number"){p={top:r,bottom:r,left:r,right:r,front:r,back:r,type:r===0?"VALID":"NUMBER"};let h=mE([e,t,o,1],a,1,n,r,c);m=h[0],f=h[1],d=h[2]}else if(r==="same"){m=Math.ceil(e/n),f=Math.ceil(t/s),d=Math.ceil(o/i);let g=(m-1)*n+a-e,h=(f-1)*s+l-t,b=(d-1)*i+u-o,T=Math.floor(g/2),k=g-T,S=Math.floor(h/2),I=h-S,A=Math.floor(b/2),R=b-A;p={top:S,bottom:I,left:A,right:R,front:T,back:k,type:"SAME"}}else if(r==="valid")p={top:0,bottom:0,left:0,right:0,front:0,back:0,type:"VALID"},m=Math.ceil((e-a+1)/n),f=Math.ceil((t-l+1)/s),d=Math.ceil((o-u+1)/i);else throw Error(`Unknown padding parameter: ${r}`);return{padInfo:p,outDepth:m,outHeight:f,outWidth:d}}function zo(r,e){if(!e)return Math.trunc(r);switch(e){case"round":return Math.round(r);case"ceil":return Math.ceil(r);case"floor":return Math.floor(r);default:throw new Error(`Unknown roundingMode ${e}`)}}function Uo(r){let[e,t,o]=gu(r);return e===1&&t===1&&o===1}function Xe(r,e){return Uo(r)||Uo(e)}function hb(r){if(r==="NHWC")return"channelsLast";if(r==="NCHW")return"channelsFirst";throw new Error(`Unknown dataFormat ${r}`)}function $e(r,e,t){if(t!=null){if(typeof e=="string")throw Error(`Error in ${r}: pad must be an integer when using dimRoundingMode ${t} but got pad ${e}.`);if(typeof e=="number")v(gr(e),()=>`Error in ${r}: pad must be an integer when using dimRoundingMode ${t} but got pad ${e}.`);else if(typeof e=="object")e.forEach(o=>{o.forEach(n=>{v(gr(n),()=>`Error in ${r}: pad must be an integer when using dimRoundingMode ${t} but got pad ${n}.`)})});else throw Error(`Error in ${r}: Unknown padding parameter: ${e}`)}}function hE(r,e){let o={x:y(r,"x","reshape","string_or_numeric")},n={shape:e};return w.runKernel(Zi,o,n)}var $=_({reshape_:hE});function gE(r,e,t,o,n){let s=y(r,"x","avgPool","float32"),i=1;v(Xe(t,i),()=>`Error in avgPool: Either strides or dilations must be 1. Got strides ${t} and dilations '${i}'`);let a=s,l=!1;s.rank===3&&(l=!0,a=$(s,[1,s.shape[0],s.shape[1],s.shape[2]])),v(a.rank===4,()=>`Error in avgPool: x must be rank 4 but got rank ${a.rank}.`),$e("avgPool",o,n);let u={x:a},c={filterSize:e,strides:t,pad:o,dimRoundingMode:n},p=w.runKernel(Ds,u,c);return p=oe(p,s.dtype),l?$(p,[p.shape[1],p.shape[2],p.shape[3]]):p}var Ka=_({avgPool_:gE});function xE(r,e,t,o,n,s="NDHWC"){let i=y(r,"x","avgPool3d","float32"),a=i,l=!1;i.rank===4&&(l=!0,a=$(i,[1,i.shape[0],i.shape[1],i.shape[2],i.shape[3]])),v(a.rank===5,()=>`Error in avgPool3d: x must be rank 5 but got rank ${a.rank}.`),v(s==="NDHWC",()=>`Error in avgPool3d: Only NDHWC is currently supported, but got dataFormat of ${s}`),$e("avgPool3d",o,n);let u={x:a},c={filterSize:e,strides:t,pad:o,dimRoundingMode:n,dataFormat:s},p=w.runKernel(Fs,u,c);return p=oe(p,a.dtype),l?$(p,[p.shape[1],p.shape[2],p.shape[3],p.shape[4]]):p}var sm=_({avgPool3d_:xE});function yE(r,e=0){v(r.length>=1,()=>"Pass at least one tensor to concat");let t=br(r,"tensors","concat","string_or_numeric");if(t[0].dtype==="complex64"&&t.forEach(s=>{if(s.dtype!=="complex64")throw new Error(`Cannot concatenate complex64 tensors with a tensor
          with dtype ${s.dtype}. `)}),t.length===1)return lt(t[0]);let o=t,n={axis:e};return w.runKernel(Gs,o,n)}var ge=_({concat_:yE});function bE(r){let t={x:y(r,"x","sigmoid","float32")};return w.runKernel(No,t)}var Ct=_({sigmoid_:bE});function _E(r,e,t){let o=y(r,"x","slice","string_or_numeric");if(o.rank===0)throw new Error("Slicing scalar is not possible");let n={x:o},s={begin:e,size:t};return w.runKernel(En,n,s)}var J=_({slice_:_E});function wE(r){let t={x:y(r,"x","tanh","float32")};return w.runKernel(Na,t)}var Kn=_({tanh_:wE});function vE(r,e,t,o,n,s){let i=y(r,"forgetBias","basicLSTMCell"),a=y(e,"lstmKernel","basicLSTMCell"),l=y(t,"lstmBias","basicLSTMCell"),u=y(o,"data","basicLSTMCell"),c=y(n,"c","basicLSTMCell"),p=y(s,"h","basicLSTMCell"),m=ge([u,p],1),f=ie(m,a),d=G(f,l),g=d.shape[0],h=d.shape[1]/4,b=[g,h],T=J(d,[0,0],b),k=J(d,[0,h],b),S=J(d,[0,h*2],b),I=J(d,[0,h*3],b),A=G(F(Ct(T),Kn(k)),F(c,Ct(G(i,S)))),R=F(Kn(A),Ct(I));return[A,R]}var im=_({basicLSTMCell_:vE});function TE(r,e,t){let o=y(r,"x","batchToSpaceND"),n=e.reduce((a,l)=>a*l);v(o.rank>=1+e.length,()=>`input rank is ${o.rank} but should be > than blockShape.length ${e.length}`),v(t.length===e.length,()=>`crops.length is ${t.length} but should be equal to blockShape.length  ${e.length}`),v(o.shape[0]%n==0,()=>`input tensor batch is ${o.shape[0]} but is not divisible by the product of the elements of blockShape ${e.join(" * ")} === ${n}`);let s={x:o},i={blockShape:e,crops:t};return w.runKernel(Ps,s,i)}var Xa=_({batchToSpaceND_:TE});function gb(r){let e;return r.rank===0||r.rank===1?e=$(r,[1,1,1,r.size]):r.rank===2?e=$(r,[1,1,r.shape[0],r.shape[1]]):r.rank===3?e=$(r,[1,r.shape[0],r.shape[1],r.shape[2]]):e=r,e}function CE(r,e,t,o,n,s){s==null&&(s=.001);let i=y(r,"x","batchNorm"),a=y(e,"mean","batchNorm"),l=y(t,"variance","batchNorm"),u;n!=null&&(u=y(n,"scale","batchNorm"));let c;o!=null&&(c=y(o,"offset","batchNorm")),v(a.rank===l.rank,()=>"Batch normalization gradient requires mean and variance to have equal ranks."),v(c==null||a.rank===c.rank,()=>"Batch normalization gradient requires mean and offset to have equal ranks."),v(u==null||a.rank===u.rank,()=>"Batch normalization gradient requires mean and scale to have equal ranks.");let m={x:gb(i),scale:u,offset:c,mean:a,variance:l},f={varianceEpsilon:s},d=w.runKernel(di,m,f);return $(d,i.shape)}var kr=_({batchNorm_:CE});function kE(r,e,t,o,n,s){let i=y(r,"x","batchNorm"),a=y(e,"mean","batchNorm"),l=y(t,"variance","batchNorm"),u;n!=null&&(u=y(n,"scale","batchNorm"));let c;return o!=null&&(c=y(o,"offset","batchNorm")),v(i.rank===2,()=>`Error in batchNorm2D: x must be rank 2 but got rank ${i.rank}.`),v(a.rank===2||a.rank===1,()=>`Error in batchNorm2D: mean must be rank 2 or rank 1 but got rank ${a.rank}.`),v(l.rank===2||l.rank===1,()=>`Error in batchNorm2D: variance must be rank 2 or rank 1 but got rank ${l.rank}.`),u!=null&&v(u.rank===2||u.rank===1,()=>`Error in batchNorm2D: scale must be rank 2 or rank 1 but got rank ${u.rank}.`),c!=null&&v(c.rank===2||c.rank===1,()=>`Error in batchNorm2D: offset must be rank 2 or rank 1 but got rank ${c.rank}.`),kr(i,a,l,c,u,s)}var am=_({batchNorm2d_:kE});function NE(r,e,t,o,n,s){let i=y(r,"x","batchNorm"),a=y(e,"mean","batchNorm"),l=y(t,"variance","batchNorm"),u;n!=null&&(u=y(n,"scale","batchNorm"));let c;return o!=null&&(c=y(o,"offset","batchNorm")),v(i.rank===3,()=>`Error in batchNorm3D: x must be rank 3 but got rank ${i.rank}.`),v(a.rank===3||a.rank===1,()=>`Error in batchNorm3D: mean must be rank 3 or rank 1 but got rank ${a.rank}.`),v(l.rank===3||l.rank===1,()=>`Error in batchNorm3D: variance must be rank 3 or rank 1 but got rank ${l.rank}.`),u!=null&&v(u.rank===3||u.rank===1,()=>`Error in batchNorm3D: scale must be rank 3 or rank 1 but got rank ${u.rank}.`),c!=null&&v(c.rank===3||c.rank===1,()=>`Error in batchNorm3D: offset must be rank 3 or rank 1 but got rank ${c.rank}.`),kr(i,a,l,c,u,s)}var lm=_({batchNorm3d_:NE});function SE(r,e,t,o,n,s){let i=y(r,"x","batchNorm"),a=y(e,"mean","batchNorm"),l=y(t,"variance","batchNorm"),u;n!=null&&(u=y(n,"scale","batchNorm"));let c;return o!=null&&(c=y(o,"offset","batchNorm")),v(i.rank===4,()=>`Error in batchNorm4D: x must be rank 4 but got rank ${i.rank}.`),v(a.rank===4||a.rank===1,()=>`Error in batchNorm4D: mean must be rank 4 or rank 1 but got rank ${a.rank}.`),v(l.rank===4||l.rank===1,()=>`Error in batchNorm4D: variance must be rank 4 or rank 1 but got rank ${l.rank}.`),u!=null&&v(u.rank===4||u.rank===1,()=>`Error in batchNorm4D: scale must be rank 4 or rank 1 but got rank ${u.rank}.`),c!=null&&v(c.rank===4||c.rank===1,()=>`Error in batchNorm4D: offset must be rank 4 or rank 1 but got rank ${c.rank}.`),kr(i,a,l,c,u,s)}var um=_({batchNorm4d_:SE});function EE(r,e,t){let o=y(r,"x","bincount"),n=y(e,"weights","bincount");v(o.dtype==="int32",()=>`Error in bincount: input dtype must be int32, but got ${o.dtype}`),v(t>=0,()=>`size must be non-negative, but got ${t}.`),v(n.size===o.size||n.size===0,()=>`Error in bincount: weights must have the same size as input or0-length, but got input shape: ${o.shape}, weights shape: ${n.shape}.`);let s={x:o,weights:n},i={size:t};return w.runKernel(Ls,s,i)}var Ya=_({bincount_:EE});function IE(r,e){let t=y(r,"s0","broadcastArgs","int32"),o=y(e,"s1","broadcastArgs","int32");if(t.rank!==1)throw new Error(`broadcastArgs(): first input must be a vector (rank=1). Has rank ${t.rank}`);if(o.rank!==1)throw new Error(`broadcastArgs(): second input must be a vector (rank=1). Has rank ${o.rank}`);let n={s0:t,s1:o};return w.runKernel(Bs,n)}var cm=_({broadcastArgs_:IE});function $E(r,e){let t=y(r,"broadcastTo","x"),o=t.shape;if(e.some(u=>!(u>0)||u%1!=0))throw new Error(`broadcastTo(): Invalid broadcast shape [${e}].`);if(e.length<t.rank)throw new Error(`broadcastTo(): shape.length=${e.length} < input.rank=${t.rank}.`);if(e.length>t.rank){let u=t.shape.slice();for(;u.length<e.length;)u.unshift(1);t=$(t,u)}let n=t.shape,s=Array.from(e);for(let u=e.length-1;u>=0;u--)if(n[u]===e[u])s[u]=1;else if(t.shape[u]!==1)throw new Error(`broadcastTo(): [${o}] cannot be broadcast to [${e}].`);if(s.map((u,c)=>u>1?c:-1).filter(u=>u>=0).length===0)return lt(t);let a={x:t},l={reps:s};return w.runKernel($o,a,l)}var Nr=_({broadcastTo_:$E});function AE(r){let t={x:y(r,"x","ceil","float32")};return w.runKernel(co,t)}var pm=_({ceil_:AE});function jt(r,e,t){let o={shape:r,value:e,dtype:t};return w.runKernel(pi,{},o)}function RE(r,e,t){let o=y(r,"x","clipByValue");if(v(e<=t,()=>`Error in clip: min (${e}) must be less than or equal to max (${t}).`),e===t)return jt(o.shape,e,o.dtype);let n={x:o},s={clipValueMin:e,clipValueMax:t};return w.runKernel(Ms,n,s)}var mm=_({clipByValue_:RE});function DE(r){return ge(r,0)}var fm=_({concat1d_:DE});function FE(r,e){return ge(r,e)}var Qa=_({concat2d_:FE});function OE(r,e){return ge(r,e)}var dm=_({concat3d_:OE});function PE(r,e){return ge(r,e)}var hm=_({concat4d_:PE});function LE(r,e,t,o,n="NHWC",s=[1,1],i){let a=y(r,"x","conv2d","float32"),l=y(e,"filter","conv2d","float32"),u=a,c=!1;a.rank===3&&(c=!0,u=$(a,[1,a.shape[0],a.shape[1],a.shape[2]])),v(u.rank===4,()=>`Error in conv2d: input must be rank 4, but got rank ${u.rank}.`),v(l.rank===4,()=>`Error in conv2d: filter must be rank 4, but got rank ${l.rank}.`),$e("conv2d",o,i);let p=n==="NHWC"?u.shape[3]:u.shape[1];v(p===l.shape[2],()=>`Error in conv2d: depth of input (${p}) must match input depth for filter ${l.shape[2]}.`),v(Xe(t,s),()=>`Error in conv2D: Either strides or dilations must be 1. Got strides ${t} and dilations '${s}'`);let m={x:u,filter:l},f={strides:t,pad:o,dataFormat:n,dilations:s,dimRoundingMode:i},d=w.runKernel(zs,m,f);return c?$(d,[d.shape[1],d.shape[2],d.shape[3]]):d}var Sr=_({conv2d_:LE});function BE(r,e,t,o,n="NWC",s=1,i){let a=y(r,"x","conv1d"),l=y(e,"filter","conv1d"),u=a,c=!1;a.rank===2&&(c=!0,u=$(a,[1,a.shape[0],a.shape[1]])),v(u.rank===3,()=>`Error in conv1d: input must be rank 3, but got rank ${u.rank}.`),v(l.rank===3,()=>`Error in conv1d: filter must be rank 3, but got rank ${l.rank}.`),$e("conv1d",o,i),v(u.shape[2]===l.shape[1],()=>`Error in conv1d: depth of input (${u.shape[2]}) must match input depth for filter ${l.shape[1]}.`),v(Xe(t,s),()=>`Error in conv1D: Either stride or dilation must be 1. Got stride ${t} and dilation '${s}'`),v(n==="NWC",()=>`Error in conv1d: got dataFormat of ${n} but only NWC is currently supported.`);let p=$(l,[1,l.shape[0],l.shape[1],l.shape[2]]),m=$(u,[u.shape[0],1,u.shape[1],u.shape[2]]),h=Sr(m,p,[1,t],o,"NHWC",[1,s],i);return c?$(h,[h.shape[2],h.shape[3]]):$(h,[h.shape[0],h.shape[2],h.shape[3]])}var gm=_({conv1d_:BE});function ME(r,e,t,o,n,s="NHWC",i){v(r.length===e.rank,()=>`Length of inShape (${r.length}) and rank of dy (${e.rank}) must match`);let a=r,l=e,u=!1;e.rank===3&&(u=!0,l=$(e,[1,e.shape[0],e.shape[1],e.shape[2]]),a=[1,r[0],r[1],r[2]]),v(a.length===4,()=>`Error in conv2dDerInput: inShape must be length 4, but got length ${a.length}.`),v(l.rank===4,()=>`Error in conv2dDerInput: dy must be rank 4, but got rank ${l.rank}`),v(t.rank===4,()=>`Error in conv2dDerInput: filter must be rank 4, but got rank ${t.rank}`);let c=s==="NHWC"?a[3]:a[1],p=s==="NHWC"?l.shape[3]:l.shape[1];v(c===t.shape[2],()=>`Error in conv2dDerInput: depth of input (${c}) must match input depth for filter ${t.shape[2]}.`),v(p===t.shape[3],()=>`Error in conv2dDerInput: depth of output (${p}) must match output depth for filter ${t.shape[3]}.`),$e("conv2dDerInput",n,i);let m={dy:l,filter:t},f={strides:o,pad:n,dataFormat:s,dimRoundingMode:i,inputShape:a},d=w.runKernel(Ws,m,f);return u?$(d,[d.shape[1],d.shape[2],d.shape[3]]):d}var xu=_({conv2DBackpropInput_:ME});function VE(r,e,t,o,n,s){let i=y(r,"x","conv2dTranspose"),a=y(e,"filter","conv2dTranspose");return xu(t,i,a,o,n,"NHWC",s)}var xm=_({conv2dTranspose_:VE});function GE(r,e,t,o,n="NDHWC",s=[1,1,1]){let i=y(r,"x","conv3d"),a=y(e,"filter","conv3d"),l=i,u=!1;i.rank===4&&(u=!0,l=$(i,[1,i.shape[0],i.shape[1],i.shape[2],i.shape[3]])),v(l.rank===5,()=>`Error in conv3d: input must be rank 5, but got rank ${l.rank}.`),v(a.rank===5,()=>`Error in conv3d: filter must be rank 5, but got rank ${a.rank}.`),v(l.shape[4]===a.shape[3],()=>`Error in conv3d: depth of input (${l.shape[4]}) must match input depth for filter ${a.shape[3]}.`),v(Xe(t,s),()=>`Error in conv3D: Either strides or dilations must be 1. Got strides ${t} and dilations '${s}'`),v(n==="NDHWC",()=>`Error in conv3d: got dataFormat of ${n} but only NDHWC is currently supported.`);let c={x:l,filter:a},p={strides:t,pad:o,dataFormat:n,dilations:s},m=w.runKernel(js,c,p);return u?$(m,[m.shape[1],m.shape[2],m.shape[3],m.shape[4]]):m}var ym=_({conv3d_:GE});function zE(r,e,t,o,n){v(r.length===e.rank,()=>`Length of inShape (${r.length}) and rank of dy (${e.rank}) must match`);let s=r,i=e,a=!1;e.rank===4&&(a=!0,i=$(e,[1,e.shape[0],e.shape[1],e.shape[2],e.shape[3]]),s=[1,r[0],r[1],r[2],r[3]]);let l=s[4],u=i.shape[4];v(s.length===5,()=>`Error in conv3dDerInput: inShape must be length 5, but got length ${s.length}.`),v(i.rank===5,()=>`Error in conv3dDerInput: dy must be rank 5, but got rank ${i.rank}`),v(t.rank===5,()=>`Error in conv3dDerInput: filter must be rank 5, but got rank ${t.rank}`),v(l===t.shape[3],()=>`Error in conv3dDerInput: depth of input (${l}) must match input depth for filter ${t.shape[3]}.`),v(u===t.shape[4],()=>`Error in conv3dDerInput: depth of output (${u}) must match output depth for filter ${t.shape[4]}.`);let c={dy:i,filter:t},p={pad:n,strides:o,inputShape:s},m=w.runKernel(Hs,c,p);return a?$(m,[m.shape[1],m.shape[2],m.shape[3],m.shape[4]]):m}var xb=_({conv3DBackpropInput_:zE});function UE(r,e,t,o,n){let s=y(r,"x","conv3dTranspose"),i=y(e,"filter","conv3dTranspose");return xb(t,s,i,o,n)}var bm=_({conv3dTranspose_:UE});function WE(r){let t={x:y(r,"x","cos","float32")};return w.runKernel(qs,t)}var _m=_({cos_:WE});function jE(r){let t={x:y(r,"x","cosh","float32")};return w.runKernel(Ks,t)}var wm=_({cosh_:jE});function HE(r,e=0,t=!1,o=!1){let s={x:y(r,"x","cumprod")},i={axis:e,exclusive:t,reverse:o};return w.runKernel(Xs,s,i)}var vm=_({cumprod_:HE});function qE(r,e=0,t=!1,o=!1){let s={x:y(r,"x","cumsum")},i={axis:e,exclusive:t,reverse:o};return w.runKernel(Ys,s,i)}var Tm=_({cumsum_:qE});function KE(r,e,t,o=!1){let n=y(r,"x","denseBincount"),s=y(e,"weights","denseBincount");v(n.dtype==="int32",()=>`Error in denseBincount: input dtype must be int32, but got ${n.dtype}`),v(n.rank<=2,()=>`Error in denseBincount: input must be at most rank 2, but got rank ${n.rank}.`),v(t>=0,()=>`size must be non-negative, but got ${t}.`),v(s.size===n.size||s.size===0,()=>`Error in denseBincount: weights must have the same shape as x or 0-length, but got x shape: ${n.shape}, weights shape: ${s.shape}.`);let i={x:n,weights:s},a={size:t,binaryOutput:o};return w.runKernel(Zs,i,a)}var Cm=_({denseBincount_:KE});function XE(r,e,t="NHWC"){let o=y(r,"x","depthToSpace","float32"),n=t==="NHWC"?o.shape[1]:o.shape[2],s=t==="NHWC"?o.shape[2]:o.shape[3],i=t==="NHWC"?o.shape[3]:o.shape[1];v(e>1,()=>`blockSize should be > 1 for depthToSpace, but was: ${e}`),v(n*e>=0,()=>`Negative dimension size caused by overflow when multiplying
    ${n} and ${e}  for depthToSpace with input shape
    ${o.shape}`),v(s*e>=0,()=>`Negative dimension size caused by overflow when multiplying
    ${s} and ${e} for depthToSpace with input shape
        ${o.shape}`),v(i%(e*e)==0,()=>`Dimension size must be evenly divisible by ${e*e} but is ${i} for depthToSpace with input shape ${o.shape}`);let a={x:o},l={blockSize:e,dataFormat:t};return w.runKernel(Js,a,l)}var km=_({depthToSpace_:XE});function YE(r,e,t,o,n="NHWC",s=[1,1],i){let a=y(r,"x","depthwiseConv2d","float32"),l=y(e,"filter","depthwiseConv2d","float32"),u=a,c=!1;a.rank===3&&(c=!0,u=$(a,[1,a.shape[0],a.shape[1],a.shape[2]])),v(u.rank===4,()=>`Error in depthwiseConv2d: input must be rank 4, but got rank ${u.rank}.`),v(l.rank===4,()=>`Error in depthwiseConv2d: filter must be rank 4, but got rank ${l.rank}.`);let p=n==="NHWC"?u.shape[3]:u.shape[1];v(p===l.shape[2],()=>`Error in depthwiseConv2d: number of input channels (${p}) must match the inChannels dimension in filter ${l.shape[2]}.`),$e("depthwiseConv2d",o,i);let m={x:u,filter:l},f={strides:t,pad:o,dataFormat:n,dilations:s,dimRoundingMode:i},d=w.runKernel(ei,m,f);return c?$(d,[d.shape[1],d.shape[2],d.shape[3]]):d}var Wo=_({depthwiseConv2d_:YE});function QE(r){let t={x:y(r,"x","diag")};return w.runKernel(oi,t)}var Nm=_({diag_:QE});function ZE(r,e,t,o,n=[1,1],s="NHWC"){let i=y(r,"x","dilation2d"),a=y(e,"filter","dilation2d");v(i.rank===3||i.rank===4,()=>`Error in dilation2d: input must be rank 3 or 4, but got rank ${i.rank}.`),v(a.rank===3,()=>`Error in dilation2d: filter must be rank 3, but got rank ${a.rank}.`),v(s==="NHWC",()=>`Error in dilation2d: Only NHWC is currently supported, but got dataFormat of ${s}`);let l=i,u=!1;i.rank===3&&(l=$(i,[1,i.shape[0],i.shape[1],i.shape[2]]),u=!0);let c={x:l,filter:a},p={strides:t,pad:o,dilations:n},m=w.runKernel(ni,c,p);return u?$(m,[m.shape[1],m.shape[2],m.shape[3]]):m}var Sm=_({dilation2d_:ZE});function JE(r,e){let t=y(r,"a","equal","string_or_numeric"),o=y(e,"b","equal","string_or_numeric");[t,o]=ee(t,o),ae(t.shape,o.shape);let n={a:t,b:o};return w.runKernel(po,n)}var Za=_({equal_:JE});function eI(r,e,t){let o=y(e,"a","where"),n=y(t,"b","where"),s=y(r,"condition","where","bool"),i=ae(ae(s.shape,o.shape),n.shape),a=Nr(s,i),l=Nr(o,i),u=Nr(n,i),c={condition:a,t:l,e:u};return w.runKernel(ia,c)}var At=_({where_:eI});function tI(r){let t={x:y(r,"x","zerosLike")};return w.runKernel(Ra,t)}var Ae=_({zerosLike_:tI});function rI(r,e){let t=y(r,"a","div"),o=y(e,"b","div");[t,o]=ee(t,o);let n=Z(t,o),s=Ae(n),i=Za(o,s);return At(i,s,n)}var Em=_({divNoNan_:rI});function oI(r,e){let t=y(r,"t1","dot"),o=y(e,"t2","dot");v((t.rank===1||t.rank===2)&&(o.rank===1||o.rank===2),()=>`Error in dot: inputs must all be rank 1 or 2, but got ranks ${t.rank} and ${o.rank}.`);let n=t.rank===1?t.size:t.shape[1],s=o.rank===1?o.size:o.shape[0];if(v(n===s,()=>`Error in dot: inner dimensions of inputs must match, but got ${n} and ${s}.`),t.rank===1&&o.rank===1){let i=$(t,[1,-1]),a=$(o,[-1,1]),l=ie(i,a);return $(l,[])}else if(t.rank===1&&o.rank===2){let i=$(t,[1,-1]),a=$(o,[o.shape[0],o.shape[1]]),l=ie(i,a);return $(l,[l.size])}else if(t.rank===2&&o.rank===1){let i=$(o,[-1,1]),a=ie(t,i);return $(a,[a.size])}else{let i=$(o,[o.shape[0],o.shape[1]]);return ie(t,i)}}var Im=_({dot_:oI});function nI(r,...e){let t=e.map((n,s)=>y(n,`tensors${s}`,"einsum")),o={equation:r};return w.runKernel(ii,t,o)}var $m=_({einsum_:nI});function sI(r){let t={x:y(r,"x","elu","float32")};return w.runKernel(ai,t)}var Ja=_({elu_:sI});function iI(r){let e=y(r,"x","erf");v(e.dtype==="int32"||e.dtype==="float32",()=>"Input dtype must be `int32` or `float32`."),e.dtype==="int32"&&(e=oe(e,"float32"));let t={x:e};return w.runKernel(li,t)}var Am=_({erf_:iI});function Rm(r,e){for(let t=0;t<r.length;++t)if(r[r.length-t-1]!==e-1-t)return!1;return!0}function yb(r,e,t){let o=r.length+e.length,n=[],s=0,i=0;for(let a=0;a<o;a++)t.indexOf(a)===-1?n.push(r[s++]):n.push(e[i++]);return n}function aI(r,e){let t=[],o=r.length;for(let s=0;s<o;s++)e.indexOf(s)===-1&&t.push(r[s]);let n=e.map(s=>r[s]);return[t,n]}function Er(r,e){let t=e.map(o=>1);return yb(r,t,e)}function lI(r,e,t){v(Rm(e,t),()=>`${r} supports only inner-most axes for now. Got axes ${e} and rank-${t} input.`)}function uI(r,e){if(Rm(r,e))return null;let t=[];for(let o=0;o<e;++o)r.indexOf(o)===-1&&t.push(o);return r.forEach(o=>t.push(o)),t}function cI(r){return r.map((e,t)=>[t,e]).sort((e,t)=>e[1]-t[1]).map(e=>e[0])}function pI(r,e){let t=[];for(let o=e-r;o<e;++o)t.push(o);return t}function mI(r,e=null,t=!1){let n={x:y(r,"x","max")},s={reductionIndices:e,keepDims:t};return w.runKernel(Ii,n,s)}var Ht=_({max_:mI});function fI(r,e=null,t=!1){let n={x:y(r,"x","min")},s={axis:e,keepDims:t};return w.runKernel(Fi,n,s)}var Xn=_({min_:fI});function dI(r,e){let t=y(r,"base","pow"),o=y(e,"exp","pow");[t,o]=ee(t,o);let n={a:t,b:o};return w.runKernel(ji,n)}var lr=_({pow_:dI});function j(r,e){if((Fe(r)&&e!=="string"||Array.isArray(r))&&e!=="complex64")throw new Error("Error creating a new Scalar: value must be a primitive (number|boolean|string)");if(e==="string"&&Fe(r)&&!(r instanceof Uint8Array))throw new Error("When making a scalar from encoded string, the value must be `Uint8Array`.");return et(r,[],[],e)}function hI(r){let t={x:y(r,"x","sqrt","float32")};return w.runKernel(So,t)}var rt=_({sqrt_:hI});function gI(r){let e=y(r,"x","square"),t={};return w.runKernel("Square",{x:e},t)}var Be=_({square_:gI});function xI(r,e=null,t=!1){let o=y(r,"x","sum");o.dtype==="bool"&&(o=oe(o,"int32"));let n={x:o},s={axis:e,keepDims:t};return w.runKernel(ma,n,s)}var le=_({sum_:xI});function yI(r,e="euclidean",t=null,o=!1){r=y(r,"x","norm");let n=bb(r,e,t),s=n.shape;if(o){let i=Vr(t,r.shape);s=Er(n.shape,i)}return $(n,s)}function bb(r,e,t=null){if(r.rank===0)return Le(r);if(r.rank!==1&&t===null)return bb($(r,[-1]),e,t);if(r.rank===1||typeof t=="number"||Array.isArray(t)&&t.length===1){if(e===1)return le(Le(r),t);if(e===Infinity)return Ht(Le(r),t);if(e===-Infinity)return Xn(Le(r),t);if(e==="euclidean"||e===2)return rt(le(lr(Le(r),j(2,"int32")),t));throw new Error(`Error in norm: invalid ord value: ${e}`)}if(Array.isArray(t)&&t.length===2){if(e===1)return Ht(le(Le(r),t[0]),t[1]-1);if(e===Infinity)return Ht(le(Le(r),t[1]),t[0]);if(e===-Infinity)return Xn(le(Le(r),t[1]),t[0]);if(e==="fro"||e==="euclidean")return rt(le(Be(r),t));throw new Error(`Error in norm: invalid ord value: ${e}`)}throw new Error(`Error in norm: invalid axis: ${t}`)}var Yr=_({norm_:yI});function bI(r,e=null,t=!1){return Yr(r,"euclidean",e,t)}var Dm=_({euclideanNorm_:bI});function _I(r){let t={x:y(r,"x","exp")};return w.runKernel(mo,t)}var kt=_({exp_:_I});function wI(r,e=0){let t=y(r,"x","expandDims","string_or_numeric");v(e<=t.rank,()=>"Axis must be <= rank of the tensor");let o={input:t},n={dim:e};return w.runKernel(ui,o,n)}var Rt=_({expandDims_:wI});function vI(r){let t={x:y(r,"x","expm1")};return w.runKernel(fo,t)}var Fm=_({expm1_:vI});function TI(r,e){let t=y(r,"x","tile","string_or_numeric");v(t.rank===e.length,()=>`Error in transpose: rank of input ${t.rank} must match length of reps ${e}.`);let o={x:t},n={reps:e};return w.runKernel($o,o,n)}var Ir=_({tile_:TI});function CI(r,e,t,o="float32"){e==null&&(e=r);let n=te([r,e],o),s=r<=e?r:e;for(let a=0;a<s;++a)n.set(1,a,a);let i=$(n.toTensor(),[r,e]);if(t==null)return i;if(t.length===1)return Ir(Rt(i,0),[t[0],1,1]);if(t.length===2)return Ir(Rt(Rt(i,0),0),[t[0],t[1],1,1]);if(t.length===3)return Ir(Rt(Rt(Rt(i,0),0),0),[t[0],t[1],t[2],1,1]);throw new Error(`eye() currently supports only 1D and 2D batchShapes, but received ${t.length}D.`)}var el=_({eye_:CI});function kI(r){let t={x:y(r,"x","floor","float32")};return w.runKernel(ho,t)}var tl=_({floor_:kI});function NI(r,e,t=0,o=0){let n=y(r,"x","gather"),s=y(e,"indices","gather","int32"),i={x:n,indices:s},a={axis:t,batchDims:o};return w.runKernel(hi,i,a)}var rl=_({gather_:NI});function SI(r,e){let t=y(r,"a","greater","string_or_numeric"),o=y(e,"b","greater","string_or_numeric");[t,o]=ee(t,o),ae(t.shape,o.shape);let n={a:t,b:o};return w.runKernel(go,n)}var Qr=_({greater_:SI});function EI(r,e){let t=y(r,"a","greaterEqual","string_or_numeric"),o=y(e,"b","greaterEqual","string_or_numeric");[t,o]=ee(t,o),ae(t.shape,o.shape);let n={a:t,b:o};return w.runKernel(xo,n)}var ol=_({greaterEqual_:EI});function II(r){let t={x:y(r,"x","isFinite")};return w.runKernel(bi,t)}var Om=_({isFinite_:II});function $I(r){let t={x:y(r,"x","isInf")};return w.runKernel(_i,t)}var Pm=_({isInf_:$I});function AI(r){let t={x:y(r,"x","isNaN")};return w.runKernel(wi,t)}var Lm=_({isNaN_:AI});function RI(r,e=.2){let o={x:y(r,"x","leakyRelu")},n={alpha:e};return w.runKernel(vi,o,n)}var nl=_({leakyRelu_:RI});function DI(r,e){let t=y(r,"a","less","string_or_numeric"),o=y(e,"b","less","string_or_numeric");[t,o]=ee(t,o),ae(t.shape,o.shape);let n={a:t,b:o};return w.runKernel(yo,n)}var Bm=_({less_:DI});function FI(r,e){let t=y(r,"a","lessEqual","string_or_numeric"),o=y(e,"b","lessEqual","string_or_numeric");[t,o]=ee(t,o),ae(t.shape,o.shape);let n={a:t,b:o};return w.runKernel(bo,n)}var jo=_({lessEqual_:FI});function Mm(r,e,t){if(t<=0)throw new Error("The number of values should be positive.");let o={start:r,stop:e,num:t};return w.runKernel(Ti,{},o)}function OI(r,e=5,t=1,o=1,n=.5){let s=y(r,"x","localResponseNormalization");v(s.rank===4||s.rank===3,()=>`Error in localResponseNormalization: x must be rank 3 or 4 but got
               rank ${s.rank}.`),v(gr(e),()=>`Error in localResponseNormalization: depthRadius must be an integer but got depthRadius ${e}.`);let i=s,a=!1;s.rank===3&&(a=!0,i=$(s,[1,s.shape[0],s.shape[1],s.shape[2]]));let l={x:i},u={depthRadius:e,bias:t,alpha:o,beta:n},c=w.runKernel(Ei,l,u);return a?$(c,[c.shape[1],c.shape[2],c.shape[3]]):c}var Vm=_({localResponseNormalization_:OI});function PI(r){let t={x:y(r,"x","log","float32")};return w.runKernel(_o,t)}var ur=_({log_:PI});function LI(r){let t={x:y(r,"x","log1p")};return w.runKernel(Ci,t)}var sl=_({log1p_:LI});function _b(r){return v(or(r),()=>"The f passed in grad(f) must be a function"),(e,t)=>{let o=y(e,"x","tf.grad","string_or_numeric"),n=t!=null?y(t,"dy","tf.grad"):null;return w.tidy(()=>{let{value:s,grads:i}=w.gradients(()=>r(o),[o],n);return n!=null&&xe(s.shape,n.shape,"The shape of dy passed in grad(f)(x, dy) must match the shape returned by f(x)"),bu(i),i[0]})}}function wb(r){return v(or(r),()=>"The f passed in grads(f) must be a function"),(e,t)=>{v(Array.isArray(e),()=>"The args passed in grads(f)(args) must be an array of `Tensor`s or `TensorLike`s");let o=br(e,"args","tf.grads","string_or_numeric"),n=t!=null?y(t,"dy","tf.grads"):null;return w.tidy(()=>{let{value:s,grads:i}=w.gradients(()=>r(...o),o,n);return n!=null&&xe(s.shape,n.shape,"The shape of dy passed in grads(f)([x1,...], dy) must match the shape returned by f([x1,...])"),bu(i),i})}}function vb(r){return v(or(r),()=>"The f passed in valueAndGrad(f) must be a function"),(e,t)=>{v(e instanceof ue,()=>"The x passed in valueAndGrad(f)(x) must be a tensor"),v(t==null||t instanceof ue,()=>"The dy passed in valueAndGrad(f)(x, dy) must be a tensor");let{grads:o,value:n}=w.gradients(()=>r(e),[e],t);return bu(o),{grad:o[0],value:n}}}function Tb(r){return v(or(r),()=>"The f passed in valueAndGrads(f) must be a function"),(e,t)=>{v(Array.isArray(e)&&e.every(n=>n instanceof ue),()=>"The args passed in valueAndGrads(f)(args) must be array of tensors"),v(t==null||t instanceof ue,()=>"The dy passed in valueAndGrads(f)(args, dy) must be a tensor");let o=w.gradients(()=>r(...e),e,t);return t!=null&&xe(o.value.shape,t.shape,"The shape of dy passed in valueAndGrads(f)([x1,...], dy) must match the shape returned by f([x1,...])"),bu(o.grads),o}}function yu(r,e){v(or(r),()=>"The f passed in variableGrads(f) must be a function"),v(e==null||Array.isArray(e)&&e.every(u=>u instanceof yr),()=>"The varList passed in variableGrads(f, varList) must be an array of variables");let t=e!=null;if(!t){e=[];for(let u in w.registeredVariables)e.push(w.registeredVariables[u])}let o=t?e.filter(u=>!u.trainable):null,n=e.length;e=e.filter(u=>u.trainable),v(e.length>0,()=>`variableGrads() expects at least one of the input variables to be trainable, but none of the ${n} variables is trainable.`);let s=!0,{value:i,grads:a}=w.gradients(r,e,null,s);v(a.some(u=>u!=null),()=>"Cannot find a connection between any variable and the result of the loss function y=f(x). Please make sure the operations that use variables are inside the function f passed to minimize()."),v(i.rank===0,()=>`The f passed in variableGrads(f) must return a scalar, but it returned a rank-${i.rank} tensor`);let l={};return e.forEach((u,c)=>{a[c]!=null&&(l[u.name]=a[c])}),o!=null&&o.forEach(u=>l[u.name]=null),{value:i,grads:l}}function Ye(r){return w.customGrad(r)}function bu(r){if(r.filter(t=>t==null).length>0)throw new Error(`Cannot compute gradient of y=f(x) with respect to x. Make sure that
    the f you passed encloses all operations that lead from x to y.`)}function BI(r){let t={x:y(r,"x","softplus")};return w.runKernel(pa,t)}var il=_({softplus_:BI});function MI(r){let e=y(r,"x","logSigmoid");return Ye(o=>({value:Ke(il(Ke(o))),gradFunc:i=>F(i,Ct(Ke(o)))}))(e)}var Gm=_({logSigmoid_:MI});function VI(r,e){let t=y(r,"a","sub"),o=y(e,"b","sub");[t,o]=ee(t,o);let n={a:t,b:o};return w.runKernel(Io,n)}var H=_({sub_:VI});function GI(r,e=-1){let t=y(r,"logits","logSoftmax");if(e===-1&&(e=t.rank-1),e!==t.rank-1)throw Error(`Log Softmax along a non-last dimension is not yet supported. Logits was rank ${t.rank} and axis was ${e}`);return Ye((n,s)=>{let i=!0,a=Ht(n,e,!0),l=H(n,a),u=H(oe(l,"float32"),ur(le(kt(l),e,i)));return s([u]),{value:u,gradFunc:(p,m)=>{let[f]=m,d=!0,g=kt(f);return H(p,F(le(p,e,d),g))}}})(t)}var zm=_({logSoftmax_:GI});function zI(r,e=null,t=!1){let o=y(r,"x","logSumExp"),n=Vr(e,o.shape),s=Ht(o,n,!0),i=H(o,s),a=kt(i),l=le(a,n),u=ur(l),c=G($(s,u.shape),u);if(t){let p=Er(c.shape,n);return $(c,p)}return c}var al=_({logSumExp_:zI});function UI(r,e){let t=y(r,"a","logicalAnd","bool"),o=y(e,"b","logicalAnd","bool");ae(t.shape,o.shape);let n={a:t,b:o};return w.runKernel(ki,n)}var Zr=_({logicalAnd_:UI});function WI(r){let t={x:y(r,"x","logicalNot","bool")};return w.runKernel(Ni,t)}var ll=_({logicalNot_:WI});function jI(r,e){let t=y(r,"a","logicalOr","bool"),o=y(e,"b","logicalOr","bool");ae(t.shape,o.shape);let n={a:t,b:o};return w.runKernel(Si,n)}var ul=_({logicalOr_:jI});function HI(r,e){let t=y(r,"a","logicalXor","bool"),o=y(e,"b","logicalXor","bool");return ae(t.shape,o.shape),Zr(ul(r,e),ll(Zr(r,e)))}var Um=_({logicalXor_:HI});var _u=2147483648;function qI(r,e,t="left"){let o=y(r,"sortedSequence","searchSorted"),n=y(e,"values","searchSorted"),s=o.shape[o.shape.length-1],i=n.shape[n.shape.length-1],a=$(o,[-1,s]),l=$(n,[-1,i]);if(a.rank<2)throw new Error("Sorted input argument must be at least 2-dimensional");if(a.shape[0]!==l.shape[0])throw new Error("Leading dimension of 'sortedSequence' and 'values' must match.");if(ne(l.shape)>=_u)throw new Error(`values tensor size must less than ${_u}`);if(a.shape[1]>=_u)throw new Error(`trailing dim_size must less than ${_u} for int32 output type, was ${a.shape[1]}`);let u={sortedSequence:a,values:l},c={side:t};return w.runKernel(sa,u,c)}var Yn=_({searchSorted_:qI});function Wm(r,e){return Yn(r,e,"left")}function KI(r,e,t,o,n){let s=y(r,"x","maxPool"),i=1,a=s,l=!1;s.rank===3&&(l=!0,a=$(s,[1,s.shape[0],s.shape[1],s.shape[2]])),v(a.rank===4,()=>`Error in maxPool: input must be rank 4 but got rank ${a.rank}.`),v(Xe(t,i),()=>`Error in maxPool: Either strides or dilations must be 1. Got strides ${t} and dilations '${i}'`),$e("maxPool",o,n);let u={x:a},c={filterSize:e,strides:t,pad:o,dimRoundingMode:n},p=w.runKernel($i,u,c);return l?$(p,[p.shape[1],p.shape[2],p.shape[3]]):p}var cl=_({maxPool_:KI});function XI(r,e=[1,1,1],t,o,n,s="NDHWC"){let i=y(r,"x","maxPool3d"),a=i,l=!1;i.rank===4&&(l=!0,a=$(i,[1,i.shape[0],i.shape[1],i.shape[2],i.shape[3]])),v(a.rank===5,()=>`Error in maxPool3d: x must be rank 5 but got rank ${a.rank}.`),v(s==="NDHWC",()=>`Error in maxPool3d: Only NDHWC is currently supported, but got dataFormat of ${s}`),$e("maxPool3d",o,n);let u={x:a},c={filterSize:e,strides:t,pad:o,dimRoundingMode:n,dataFormat:s},p=w.runKernel(Ai,u,c);return l?$(p,[p.shape[1],p.shape[2],p.shape[3],p.shape[4]]):p}var jm=_({maxPool3d_:XI});function YI(r,e,t,o,n=!1){let i={x:y(r,"x","maxPoolWithArgmax")},a={filterSize:e,strides:t,pad:o,includeBatchInIndex:n},l=w.runKernel(Ri,i,a);return{result:l[0],indexes:l[1]}}var Hm=_({maxPoolWithArgmax_:YI});function QI(r,e){let t=y(r,"a","maximum"),o=y(e,"b","maximum");[t,o]=ee(t,o),t.dtype==="bool"&&(t=oe(t,"int32"),o=oe(o,"int32")),ae(t.shape,o.shape);let n={a:t,b:o};return w.runKernel(wo,n)}var pl=_({maximum_:QI});function ZI(r,e=null,t=!1){let n={x:y(r,"x","mean")},s={axis:e,keepDims:t};return w.runKernel(Di,n,s)}var Jr=_({mean_:ZI});function Nt(r,e="float32"){if(e==="complex64"){let o=Nt(r,"float32"),n=Nt(r,"float32");return Je(o,n)}let t=vn(ne(r),e);return w.makeTensor(t,r,e)}function qt(r,e="float32"){if(e==="complex64"){let o=qt(r,"float32"),n=Nt(r,"float32");return Je(o,n)}let t=gs(ne(r),e);return w.makeTensor(t,r,e)}function qm(r,e,{indexing:t="xy"}={}){if(t!=="xy"&&t!=="ij")throw new TypeError(`${t} is not a valid third argument to meshgrid`);if(r===void 0)return[];let o=y(r,"x","meshgrid",r instanceof ue?r.dtype:"float32");if(e===void 0)return[o];let n=y(e,"y","meshgrid",e instanceof ue?e.dtype:"float32"),s=ne(o.shape),i=ne(n.shape);return t==="xy"?(o=$(o,[1,-1]),n=$(n,[-1,1]),[ie(qt([i,1],o.dtype),o),ie(n,qt([1,s],n.dtype))]):(o=$(o,[-1,1]),n=$(n,[1,-1]),[ie(o,qt([1,i],o.dtype)),ie(qt([s,1],n.dtype),n)])}function JI(r,e){let t=y(r,"a","minimum"),o=y(e,"b","minimum");[t,o]=ee(t,o),t.dtype==="bool"&&(t=oe(t,"int32"),o=oe(o,"int32")),ae(t.shape,o.shape);let n={a:t,b:o};return w.runKernel(vo,n)}var ml=_({minimum_:JI});function e$(r,e,t){v(t==="reflect"||t==="symmetric",()=>`Invalid mode. Mode must be either reflect or symmetric. Got ${t}.`);let o=y(r,"x","mirrorPad");if(o.rank===0)throw new Error("mirrorPad(scalar) is not defined. Pass non-scalar to mirrorPad");v(e.length===o.rank,()=>`Padding doesn't match input. Must be ${o.rank}. Got ${e.length}.`);let n=t==="reflect"?1:0;for(let a=0;a<o.rank;a++)v(e[a].length===2,()=>"Invalid number of paddings. Must be length of 2 each."),v(e[a][0]>=0&&e[a][0]<=o.shape[a]-n&&e[a][1]>=0&&e[a][1]<=o.shape[a]-n,()=>`Padding in dimension ${a} cannot be greater than or equal to ${o.shape[a]-n} or less than 0 for input of shape ${o.shape}`);let s={paddings:e,mode:t},i={x:o};return w.runKernel(Oi,i,s)}var Km=_({mirrorPad_:e$});function t$(r,e){let t=y(r,"a","mod"),o=y(e,"b","mod");[t,o]=ee(t,o);let n={a:t,b:o};return w.runKernel(Pi,n)}var Xm=_({mod_:t$});function r$(r,e=null,t=!1){r=y(r,"x","moments");let o=Vr(e,r.shape),n=Jr(r,o,t),s=n.shape;t||(s=Er(n.shape,o));let i=Be(H(oe(r,"float32"),$(n,s))),a=Jr(i,o,t);return{mean:n,variance:a}}var Ym=_({moments_:r$});function o$(r,e,t,o){let n=y(e,"data","multiRNNCell"),s=br(t,"c","multiRNNCell"),i=br(o,"h","multiRNNCell"),a=n,l=[];for(let p=0;p<r.length;p++){let m=r[p](a,s[p],i[p]);l.push(m[0]),l.push(m[1]),a=m[1]}let u=[],c=[];for(let p=0;p<l.length;p+=2)u.push(l[p]),c.push(l[p+1]);return[u,c]}var Qm=_({multiRNNCell_:o$});function n$(r,e,t,o=!1){let n=y(r,"logits","multinomial"),s=n.size,i=n.rank;if(s<2)throw new Error(`Error in multinomial: you need at least 2 outcomes, but got ${s}.`);if(i>2)throw new Error(`Rank of probabilities must be 1 or 2, but is ${i}`);t=t||Math.random();let l={logits:i===1?$(n,[1,-1]):n},u={numSamples:e,seed:t,normalized:o},c=w.runKernel(Li,l,u);return i===1?$(c,[c.size]):c}var Zm=_({multinomial_:n$});function s$(r,e){let t=y(r,"a","notEqual","string_or_numeric"),o=y(e,"b","notEqual","string_or_numeric");[t,o]=ee(t,o),ae(t.shape,o.shape);let n={a:t,b:o};return w.runKernel(Co,n)}var fl=_({notEqual_:s$});function i$(r){let t={x:y(r,"x","onesLike")};return w.runKernel(Gi,t)}var Jm=_({onesLike_:i$});function a$(r,e){let t=y(r,"v1","outerProduct"),o=y(e,"v2","outerProduct");v(t.rank===1&&o.rank===1,()=>`Error in outerProduct: inputs must be rank 1, but got ranks ${t.rank} and ${o.rank}.`);let n=$(t,[-1,1]),s=$(o,[1,-1]);return ie(n,s)}var ef=_({outerProduct_:a$});function l$(r,e,t=0){let o=y(r,"x","pad");if(o.rank===0)throw new Error("pad(scalar) is not defined. Pass non-scalar to pad");let n={paddings:e,constantValue:t},s={x:o};return w.runKernel(Wi,s,n)}var Kt=_({pad_:l$});function u$(r,e,t=0){return v(e.length===2,()=>"Invalid number of paddings. Must be length of 2."),Kt(r,[e],t)}var tf=_({pad1d_:u$});function c$(r,e,t=0){return v(e.length===2&&e[0].length===2&&e[1].length===2,()=>"Invalid number of paddings. Must be length of 2 each."),Kt(r,e,t)}var rf=_({pad2d_:c$});function p$(r,e,t=0){return v(e.length===3&&e[0].length===2&&e[1].length===2&&e[2].length===2,()=>"Invalid number of paddings. Must be length of 2 each."),Kt(r,e,t)}var of=_({pad3d_:p$});function m$(r,e,t=0){return v(e.length===4&&e[0].length===2&&e[1].length===2&&e[2].length===2&&e[3].length===2,()=>"Invalid number of paddings. Must be length of 2 each."),Kt(r,e,t)}var nf=_({pad4d_:m$});function f$(r,e,t){let o=y(r,"x","spaceToBatchND");v(o.rank>=1+e.length,()=>`input rank ${o.rank} should be > than [blockShape] ${e.length}`),v(t.length===e.length,()=>`paddings.shape[0] ${t.length} must be equal to [blockShape] ${e.length}`),v(o.shape.reduce((i,a,l)=>l>0&&l<=e.length?i&&(a+t[l-1][0]+t[l-1][1])%e[l-1]==0:i,!0),()=>`input spatial dimensions ${o.shape.slice(1)} with paddings ${t.toString()} must be divisible by blockShapes ${e.toString()}`);let n={x:o},s={blockShape:e,paddings:t};return w.runKernel(fa,n,s)}var dl=_({spaceToBatchND_:f$});function d$(r,e,t,o,n,s,i){n==null&&(n=[1,1]),s==null&&(s=1),o===0&&(o="valid");let a=y(r,"x","maxPool"),l=a,u=!1;a.rank===3&&(u=!0,l=$(a,[1,a.shape[0],a.shape[1],a.shape[2]])),v(Xe(s,n),()=>`Error in pool: Either strides or dilations must be 1. Got strides ${s} and dilations '${n}'`);let c=rm(l.shape,e,s,n,o),p=[c.dilationHeight,c.dilationWidth],m;o==="same"?m=g$([c.filterHeight,c.filterWidth],p):m=[[0,0],[0,0]];let f=p[0]===1&&p[1]===1,[d,g]=h$([c.inHeight,c.inWidth],p,m),h=f?o:"valid",b=f?l:dl(l,p,d),k=(t==="avg"?()=>Ka(b,e,s,h,i):()=>cl(b,e,s,h,i))(),S=f?k:Xa(k,p,g);return u?$(S,[S.shape[1],S.shape[2],S.shape[3]]):S}function h$(r,e,t){let o=t.map(c=>c[0]),n=t.map(c=>c[1]),s=r.concat(o,n),i=e.map((c,p)=>(c-s[p]%c)%c),a=n.map((c,p)=>c+i[p]),l=e.map((c,p)=>[o[p],a[p]]),u=e.map((c,p)=>[0,i[p]]);return[l,u]}function g$(r,e){let o=r.map((i,a)=>i+(i-1)*(e[a]-1)).map(i=>i-1),n=o.map(i=>Math.floor(i/2)),s=o.map((i,a)=>i-n[a]);return o.map((i,a)=>[n[a],s[a]])}var sf=_({pool_:d$});function x$(r,e){let t=y(r,"x","prelu"),o=y(e,"alpha","prelu"),n={x:t,alpha:o};return w.runKernel(Hi,n)}var hl=_({prelu_:x$});function y$(r,e=null,t=!1){let o=y(r,"x","prod");o.dtype==="bool"&&(o=oe(o,"int32"));let n={x:o},s={axis:e,keepDims:t};return w.runKernel(Nn,n,s)}var af=_({prod_:y$});function b$(r,e,t,o){let n=r.map((c,p)=>y(c,`tensors${p}`,"raggedGather","int32")),s=y(e,"paramsDenseValues","raggedGather"),i=y(t,"indices","raggedGather","int32"),a={paramsNestedSplits:n,paramsDenseValues:s,indices:i},l={outputRaggedRank:o},u=w.runKernel(qi,a,l);return{outputNestedSplits:u.slice(0,u.length-1),outputDenseValues:u[u.length-1]}}var lf=_({raggedGather_:b$});function _$(r,e,t,o,n){let s=y(r,"shape","raggedTensorToTensor","int32"),i=y(e,"values","raggedTensorToTensor"),a=y(t,"defaultValue","raggedTensorToTensor",i.dtype),l=o.map((p,m)=>y(p,`tensors${m}`,"raggedTensorToTensor","int32")),u={shape:s,values:i,defaultValue:a,rowPartitionTensors:l},c={rowPartitionTypes:n};return w.runKernel(Ki,u,c)}var uf=_({raggedTensorToTensor_:_$});function w$(r,e,t){let o=ne(r),n=null;if(t==null||t==="float32")n=new Float32Array(o);else if(t==="int32")n=new Int32Array(o);else if(t==="bool")n=new Uint8Array(o);else throw new Error(`Unknown data type ${t}`);for(let s=0;s<o;s++)n[s]=e();return w.makeTensor(n,r,t)}var cf=_({rand_:w$});var vu=ds(Vb());var Qn=class{constructor(e,t,o,n,s){this.mean=e,this.stdDev=t,this.dtype=o,this.nextVal=NaN,this.truncated=n,this.truncated&&(this.upper=this.mean+this.stdDev*2,this.lower=this.mean-this.stdDev*2);let i=s||Math.random();this.random=vu.alea(i.toString())}nextValue(){if(!isNaN(this.nextVal)){let n=this.nextVal;return this.nextVal=NaN,n}let e,t,o=!1;for(;!o;){let n,s,i;do n=2*this.random()-1,s=2*this.random()-1,i=n*n+s*s;while(i>=1||i===0);let a=Math.sqrt(-2*Math.log(i)/i);e=this.mean+this.stdDev*n*a,t=this.mean+this.stdDev*s*a,(!this.truncated||this.isValidTruncated(e))&&(o=!0)}return(!this.truncated||this.isValidTruncated(t))&&(this.nextVal=this.convertValue(t)),this.convertValue(e)}convertValue(e){return this.dtype==null||this.dtype==="float32"?e:Math.round(e)}isValidTruncated(e){return e<=this.upper&&e>=this.lower}},xf=class{constructor(e,t,o,n){this.alpha=e,this.beta=1/t,this.dtype=o;let s=n||Math.random();this.randu=vu.alea(s.toString()),this.randn=new Qn(0,1,o,!1,this.randu()),e<1?this.d=e+2/3:this.d=e-1/3,this.c=1/Math.sqrt(9*this.d)}nextValue(){let e,t,o,n,s,i;for(;;){do n=this.randn.nextValue(),i=1+this.c*n;while(i<=0);if(i*=i*i,e=n*n,t=1-.331*e*e,o=.5*e+this.d*(1-i+Math.log(i)),s=this.randu(),s<t||Math.log(s)<o)break}return i=1/this.beta*this.d*i,this.alpha<1&&(i*=Math.pow(this.randu(),1/this.alpha)),this.convertValue(i)}convertValue(e){return this.dtype==="float32"?e:Math.round(e)}},yf=class{constructor(e=0,t=1,o,n){if(this.canReturnFloat=()=>this.dtype==null||this.dtype==="float32",this.min=e,this.range=t-e,this.dtype=o,n==null&&(n=Math.random()),typeof n=="number"&&(n=n.toString()),!this.canReturnFloat()&&this.range<=1)throw new Error(`The difference between ${e} - ${t} <= 1 and dtype is not float`);this.random=vu.alea(n)}convertValue(e){return this.canReturnFloat()?e:Math.round(e)}nextValue(){return this.convertValue(this.min+this.range*this.random())}};function E$(r,e,t=1,o="float32",n){if(t==null&&(t=1),o==null&&(o="float32"),o!=="float32"&&o!=="int32")throw new Error(`Unsupported data type ${o}`);let s=new xf(e,t,o,n),i=te(r,o);for(let a=0;a<i.values.length;a++)i.values[a]=s.nextValue();return i.toTensor()}var bf=_({randomGamma_:E$});function I$(r,e=0,t=1,o,n){if(o!=null&&o==="bool")throw new Error(`Unsupported data type ${o}`);let s=new Qn(e,t,o,!1,n),i=te(r,o);for(let a=0;a<i.values.length;a++)i.values[a]=s.nextValue();return i.toTensor()}var gl=_({randomNormal_:I$});function $$(r,e,t){if(e!=null&&e==="bool")throw new Error(`Unsupported data type ${e}`);return gl(r,0,1,e,t)}var _f=_({randomStandardNormal_:$$});function A$(r,e=0,t=1,o="float32",n){let s=te(r,o),i=new yf(e,t,null,n);for(let a=0;a<s.values.length;a++)s.values[a]=i.nextValue();return s.toTensor()}var xl=_({randomUniform_:A$});function $r(r,e,t=1,o="float32"){if(t===0)throw new Error("Cannot have a step of zero");let n={start:r,stop:e,step:t,dtype:o};return w.runKernel(Xi,{},n)}function R$(r){let t={x:y(r,"x","reciprocal")};return w.runKernel(Yi,t)}var wf=_({reciprocal_:R$});function D$(r){let t={x:y(r,"x","relu")};return w.runKernel(Qi,t)}var Ar=_({relu_:D$});function F$(r){let t={x:y(r,"x","relu6")};return w.runKernel(ta,t)}var yl=_({relu6_:F$});function O$(r,e){let o={x:y(r,"x","reverse")},n={dims:e};return w.runKernel(ra,o,n)}var gt=_({reverse_:O$});function P$(r){let e=y(r,"x","reverse");return v(e.rank===1,()=>`Error in reverse1D: x must be rank 1 but got rank ${e.rank}.`),gt(e,0)}var vf=_({reverse1d_:P$});function L$(r,e){let t=y(r,"x","reverse");return v(t.rank===2,()=>`Error in reverse2D: x must be rank 2 but got rank ${t.rank}.`),gt(t,e)}var Tf=_({reverse2d_:L$});function B$(r,e){let t=y(r,"x","reverse");return v(t.rank===3,()=>`Error in reverse3D: x must be rank 3 but got rank ${t.rank}.`),gt(t,e)}var Cf=_({reverse3d_:B$});function M$(r,e){let t=y(r,"x","reverse");return v(t.rank===4,()=>`Error in reverse4D: x must be rank 4 but got rank ${t.rank}.`),gt(t,e)}var kf=_({reverse4d_:M$});function V$(r){let t={x:y(r,"x","round")};return w.runKernel(oa,t)}var bl=_({round_:V$});function G$(r){let t={x:y(r,"x","rsqrt","float32")};return w.runKernel(ko,t)}var Nf=_({rsqrt_:G$});function z$(r){let t={x:y(r,"x","selu")};return w.runKernel(aa,t)}var Sf=_({selu_:z$});function U$(r,e,t,o,n,s=[1,1],i="NHWC"){let a=y(r,"x","separableConv2d"),l=y(e,"depthwiseFilter","separableConv2d"),u=y(t,"pointwiseFilter","separableConv2d"),c=a,p=!1;if(a.rank===3&&(p=!0,c=$(a,[1,a.shape[0],a.shape[1],a.shape[2]])),i==="NCHW")throw new Error("separableConv2d currently does not support dataFormat NCHW; only NHWC is supported");v(c.rank===4,()=>`Error in separableConv2d: input must be rank 4, but got rank ${c.rank}.`),v(l.rank===4,()=>`Error in separableConv2d: depthwise filter must be rank 4, but got rank ${l.rank}.`),v(u.rank===4,()=>`Error in separableConv2d: pointwise filter must be rank 4, but got rank ${l.rank}.`),v(u.shape[0]===1,()=>`Error in separableConv2d: the first dimension of pointwise filter  must be 1, but got ${u.shape[0]}.`),v(u.shape[1]===1,()=>`Error in separableConv2d: the second dimension of pointwise filter must be 1, but got ${u.shape[1]}.`);let m=l.shape[2],f=l.shape[3];v(u.shape[2]===m*f,()=>`Error in separableConv2d: the third dimension of pointwise filter must be ${m*f}, but got ${u.shape[2]}.`);let d=Wo(c,l,o,n,i,s),h=Sr(d,u,1,"valid",i);return p?$(h,[h.shape[1],h.shape[2],h.shape[3]]):h}var Ef=_({separableConv2d_:U$});async function W$(r,e){let t=y(r,"x","setdiff1d"),o=y(e,"y","setdiff1d");v(t.dtype===o.dtype,()=>`x and y should have the same dtype, but got x (${t.dtype}) and y (${o.dtype}).`),v(t.rank===1,()=>`x should be 1D tensor, but got x (${t.shape}).`),v(o.rank===1,()=>`y should be 1D tensor, but got y (${o.shape}).`);let n=await t.data(),s=await o.data(),i=new Set(s),a=0;for(let c=0;c<n.length;c++)i.has(n[c])||a++;let l=new Ut([a],t.dtype),u=new Ut([a],"int32");for(let c=0,p=0;c<n.length;c++)i.has(n[c])||(l.values[p]=n[c],u.values[p]=c,p++);return[l.toTensor(),u.toTensor()]}var If=W$;function j$(r){let t={x:y(r,"x","sign")};return w.runKernel(ca,t)}var $f=_({sign_:j$});function H$(r){let t={x:y(r,"x","sin","float32")};return w.runKernel(la,t)}var Af=_({sin_:H$});function q$(r){let t={x:y(r,"x","sinh")};return w.runKernel(ua,t)}var Rf=_({sinh_:q$});function K$(r,e,t){let o=y(r,"x","slice1d");return v(o.rank===1,()=>`slice1d expects a rank-1 tensor, but got a rank-${o.rank} tensor`),J(o,[e],[t])}var Df=_({slice1d_:K$});function X$(r,e,t){let o=y(r,"x","slice2d");return v(o.rank===2,()=>`slice2d expects a rank-2 tensor, but got a rank-${o.rank} tensor`),J(o,e,t)}var Ff=_({slice2d_:X$});function Y$(r,e,t){let o=y(r,"x","slice3d");return v(o.rank===3,()=>`slice3d expects a rank-3 tensor, but got a rank-${o.rank} tensor`),J(o,e,t)}var Of=_({slice3d_:Y$});function Q$(r,e,t){let o=y(r,"x","slice4d");return v(o.rank===4,()=>`slice4d expects a rank-4 tensor, but got a rank-${o.rank} tensor`),J(o,e,t)}var Pf=_({slice4d_:Q$});function Z$(r,e=-1){let t=y(r,"logits","softmax","float32");if(e===-1&&(e=t.rank-1),e!==t.rank-1)throw Error(`Softmax along a non-last dimension is not yet supported. Logits was rank ${t.rank} and dim was ${e}`);let o={logits:t},n={dim:e};return w.runKernel(ha,o,n)}var Lf=_({softmax_:Z$});function J$(r){v(r.dtype==="complex64",()=>`The dtype for tf.spectral.fft() must be complex64 but got ${r.dtype}.`);let e={input:r};return w.runKernel(ci,e)}var qo=_({fft_:J$});function e2(r){v(r.dtype==="complex64",()=>`The dtype for tf.spectral.ifft() must be complex64 but got ${r.dtype}.`);let e={input:r};return w.runKernel(xi,e)}var eo=_({ifft_:e2});function t2(r){let e=r.shape[r.shape.length-1],t=r.size/e,o;if(e<=2){let n=$(r,[t,e]);o=eo(n)}else{let n=[t,2*(e-1)],s=$(ar(r),[t,e]),i=$(Tr(r),[t,e]),a=gt(J(s,[0,1],[t,e-2]),1),l=F(gt(J(i,[0,1],[t,e-2]),1),j(-1)),u=ge([s,a],1),c=ge([i,l],1),p=$(Je(u,c),[n[0],n[1]]);o=eo(p)}if(o=ar(o),r.rank===3&&r.shape[0]!==0){let n=o,s=r.shape[0];o=$(o,[s,o.shape[0]/s,o.shape[1]]),n.dispose()}return o}var _l=_({irfft_:t2});function r2(r,e,t=0){let n={x:y(r,"x","split")},s={numOrSizeSplits:e,axis:t};return w.runKernel(da,n,s)}var cr=_({split_:r2});function o2(r,e){v(r.dtype==="float32",()=>`The dtype for rfft() must be real value but got ${r.dtype}`);let t=r.shape[r.shape.length-1],o=r.size/t,n;if(e!=null&&e<t){let d=r.shape.map(h=>0),g=r.shape.map(h=>h);g[r.shape.length-1]=e,n=J(r,d,g),t=e}else if(e!=null&&e>t){let d=r.shape.map(g=>g);d[r.shape.length-1]=e-t,n=ge([r,Nt(d)],r.shape.length-1),t=e}else n=r;let s=Ae(n),i=$(Je(n,s),[o,t]),a=qo(i),l=Math.floor(t/2)+1,u=ar(a),c=Tr(a),p=cr(u,[l,t-l],u.shape.length-1),m=cr(c,[l,t-l],c.shape.length-1),f=n.shape.slice();return f[n.shape.length-1]=l,$(Je(p[0],m[0]),f)}var Ko=_({rfft_:o2});function n2(r,e){let t=y(r,"a","squaredDifference"),o=y(e,"b","squaredDifference");[t,o]=ee(t,o),ae(t.shape,o.shape);let n={a:t,b:o},s={};return w.runKernel(Eo,n,s)}var wl=_({squaredDifference_:n2});function s2(r,e){let t=y(r,"x","squeeze","string_or_numeric");return $(t,Lc(t.shape,e).newShape)}var pr=_({squeeze_:s2});function i2(r,e=0){let t=br(r,"tensors","stack","string_or_numeric");v(t.length>=1,()=>"Pass at least one tensor to tf.stack"),t.length>0&&v(e<=t[0].rank,()=>"Axis must be <= rank of the tensor");let o=t,n={axis:e};return w.runKernel(Ui,o,n)}var Qe=_({stack_:i2});function a2(r,e=0){let o={x:y(r,"x","step")},n={alpha:e};return w.runKernel(Da,o,n)}var vl=_({step_:a2});function l2(r,e,t,o,n=0,s=0,i=0,a=0,l=0){let c={x:y(r,"x","stridedSlice","string_or_numeric")},p={begin:e,end:t,strides:o,beginMask:n,endMask:s,ellipsisMask:i,newAxisMask:a,shrinkAxisMask:l};return w.runKernel(wa,c,p)}var Bf=_({stridedSlice_:l2});function u2(r){let t={x:y(r,"x","tan","float32")};return w.runKernel(ka,t)}var Mf=_({tan_:u2});function Oe(r,e){Tt(r);let t=ze(r,e);if(t.length!==1)throw new Error("tensor1d() requires values to be a flat/TypedArray");return et(r,null,t,e)}function Xt(r,e,t){if(Tt(r),e!=null&&e.length!==2)throw new Error("tensor2d() requires shape to have two numbers");let o=ze(r,t);if(o.length!==2&&o.length!==1)throw new Error("tensor2d() requires values to be number[][] or flat/TypedArray");if(o.length===1&&e==null)throw new Error("tensor2d() requires shape to be provided when `values` are a flat/TypedArray");return et(r,e,o,t)}function Vf(r,e,t){if(Tt(r),e!=null&&e.length!==4)throw new Error("tensor4d() requires shape to have four numbers");let o=ze(r,t);if(o.length!==4&&o.length!==1)throw new Error("tensor4d() requires values to be number[][][][] or flat/TypedArray");if(o.length===1&&e==null)throw new Error("tensor4d() requires shape to be provided when `values` are a flat array");return et(r,e,o,t)}function Gf(r,e,t){if(Tt(r),e!=null&&e.length!==5)throw new Error("tensor5d() requires shape to have five numbers");let o=ze(r,t);if(o.length!==5&&o.length!==1)throw new Error("tensor5d() requires values to be number[][][][][] or flat/TypedArray");if(o.length===1&&e==null)throw new Error("tensor5d() requires shape to be provided when `values` are a flat array");return et(r,e,o,t)}function zf(r,e,t){if(Tt(r),e!=null&&e.length!==6)throw new Error("tensor6d() requires shape to have six numbers");let o=ze(r,t);if(o.length!==6&&o.length!==1)throw new Error("tensor6d() requires values to be number[][][][][][] or flat/TypedArray");if(o.length===1&&e==null)throw new Error("tensor6d() requires shape to be provided when `values` are a flat array");return e=e||o,et(r,e,o,t)}function c2(r,e=1,t=!0){let o=y(r,"x","topk");if(o.rank===0)throw new Error("topk() expects the input to be of rank 1 or higher");let n=o.shape[o.shape.length-1];if(e<0)throw new Error(`'k' passed to topk() must be >= 0 but got ${e}`);if(e>n)throw new Error(`'k' passed to topk() must be <= the last dimension (${n}) but got ${e}`);let s={x:o},i={k:e,sorted:t},[a,l]=w.runKernel(Sa,s,i);return{values:a,indices:l}}var Uf=_({topk_:c2});function p2(r,e=0,t=1,o,n){if(o!=null&&o==="bool")throw new Error("Unsupported data type $ { dtype }");let s=new Qn(e,t,o,!0,n),i=te(r,o);for(let a=0;a<i.values.length;a++)i.values[a]=s.nextValue();return i.toTensor()}var Wf=_({truncatedNormal_:p2});function m2(r,e=0){let t=y(r,"x","unique","string_or_numeric");v(t.rank>0,()=>"The input tensor must be at least 1D");let o={x:t},n={axis:e},[s,i]=w.runKernel(Ia,o,n);return{values:s,indices:i}}var jf=_({unique_:m2});function f2(r,e,t){let o=y(r,"x","unsortedSegmentSum"),n=y(e,"segmentIds","unsortedSegmentSum","int32");v(gr(t),()=>"numSegments must be of dtype int");let s={x:o,segmentIds:n},i={numSegments:t};return w.runKernel(Aa,s,i)}var Hf=_({unsortedSegmentSum_:f2});function d2(r,e=0){let t=y(r,"x","unstack","string_or_numeric");v(e>=-t.shape.length&&e<t.shape.length,()=>`Axis = ${e} is not in [-${t.shape.length}, ${t.shape.length})`);let o={value:t},n={axis:e};return w.runKernel($a,o,n)}var xt=_({unstack_:d2});function qf(r,e){return Yn(r,e,"right")}function Kf(r,e=!0,t,o){return w.makeVariable(r,e,t,o)}function Tu(r,e){let t=[];for(let s=0;s<e.length;s++)e[s]&&t.push(s);let o=te(r,"int32"),n=te([t.length,r.length],"int32");for(let s=0;s<t.length;s++){let i=o.indexToLoc(t[s]),a=s*r.length;n.values.set(i,a)}return n.toTensor()}async function h2(r){let e=y(r,"condition","whereAsync","bool"),t=await e.data(),o=Tu(e.shape,t);return r!==e&&e.dispose(),o}var Tl=h2;async function g2(r,e,t){let o=y(r,"tensor","boolMask"),n=y(e,"mask","boolMask","bool"),s=t==null?0:t,i=n.rank,a=o.shape;v(i>0,()=>"mask cannot be scalar"),xe(a.slice(s,s+i),n.shape,"mask's shape must match the first K dimensions of tensor's shape,");let l=1;for(let g=s;g<s+i;g++)l*=a[g];let u=a.slice(0,s).concat([l],a.slice(s+i)),c=$(o,u),p=$(n,[-1]),m=await Tl(p),f=pr(m,[1]),d=rl(c,f,s);return r!==o&&o.dispose(),e!==n&&n.dispose(),f.dispose(),c.dispose(),p.dispose(),m.dispose(),d}var Gb=g2;function x2(r,e,t,o,n=!0){let s=y(r,"v","movingAverage"),i=y(e,"x","movingAverage"),a=y(t,"decay","movingAverage");pp(s,i),v(pt(s.shape,i.shape),()=>"Shape mismatch in v and x");let l=j(1),u=H(l,a),c=F(H(i,s),u);if(n){v(o!=null,()=>"When using zeroDebias: true, step is required.");let p=y(o,"step","movingAverage");c=Z(c,H(l,lr(a,p)))}return G(s,c)}var zb=_({movingAverage_:x2});function y2(r,e,t){let o=y(r,"indices","scatterND","int32"),n=y(e,"updates","scatterND");du(n,o,t);let s={indices:o,updates:n},i={shape:t};return w.runKernel(na,s,i)}var Ub=_({scatterND_:y2});function Wb(r,e,t,o){if(r.dtype!=="int32")throw new Error(`tf.sparseToDense() expects the indices to be int32 type, but the dtype was ${r.dtype}.`);if(r.rank>2)throw new Error(`sparseIndices should be a scalar, vector, or matrix, but got shape ${r.shape}.`);let n=r.rank>0?r.shape[0]:1,s=r.rank>1?r.shape[1]:1;if(t.length!==s)throw new Error(`outputShape has incorrect number of elements:, ${t.length}, should be: ${s}.`);let i=e.size;if(!(e.rank===0||e.rank===1&&i===n))throw new Error(`sparseValues has incorrect shape ${e.shape}, should be [] or [${n}]`);if(e.dtype!==o.dtype)throw new Error("sparseValues.dtype must match defaultValues.dtype")}function b2(r,e,t,o=0){let n=y(r,"sparseIndices","sparseToDense","int32"),s=y(e,"sparseValues","sparseToDense","string_or_numeric"),i=y(o,"defaultValue","sparseToDense",s.dtype);Wb(n,s,t,i);let a={sparseIndices:n,sparseValues:s,defaultValue:i},l={outputShape:t};return w.runKernel(_a,a,l)}var jb=_({sparseToDense_:b2});function _2(r,e){let t=y(e,"indices","gatherND","int32"),n={params:y(r,"x","gatherND","string_or_numeric"),indices:t};return w.runKernel(gi,n)}var Hb=_({gatherND_:_2});function qb(r,e){if(e==null)return r.shape.slice();if(pt(r.shape,e))return e;if(r.shape.length===e.length){let t=[];for(let o=0;o<r.shape.length;o++)e[o]==null&&r.shape[o]!=null?t.push(r.shape[o]):t.push(e[o]);return t}return e}function w2(r,e,t,o){let n=y(r,"x","dropout");if(v(n.dtype==="float32",()=>`x has to be a floating point tensor since it's going to be scaled, but got a ${n.dtype} tensor instead.`),v(e>=0&&e<1,()=>`rate must be a float in the range [0, 1), but got ${e}.`),e===0)return r instanceof ue?n.clone():n;let s=qb(n,t),i=1-e,a=Z(tl(G(xl(s,0,1,"float32",o),i)),i);return F(n,a)}var Kb=_({dropout_:w2});function Cu(r){return Math.floor(Math.pow(2,Math.ceil(Math.log(r)/Math.log(2))))}function Zn(r,e,t){let o=1-r%2,n=new Float32Array(r);for(let s=0;s<r;++s){let i=2*Math.PI*s/(r+o-1);n[s]=e-t*Math.cos(i)}return Oe(n,"float32")}async function v2(r,e,t=1){let o=y(r,"predictions","inTopK"),n=y(e,"targets","inTopK");v(o.rank>1,()=>`inTopK() expects the predictions to be of rank 2 or higher, but got ${o.rank}`),v(o.rank-1===n.rank,()=>`predictions rank should be 1 larger than targets rank, but got predictions rank ${o.rank} and targets rank ${n.rank}`),xe(o.shape.slice(0,o.shape.length-1),n.shape,"predictions's shape should be align with the targets' shape, except the last dimension.");let s=o.shape[o.shape.length-1];v(t>0&&t<=s,()=>`'k' passed to inTopK() must be > 0 && <= the predictions last dimension (${s}), but got ${t}`);let i=await o.data(),a=await n.data(),[l,u]=[i.length/s,s],c=Bc("bool",l);for(let p=0;p<l;p++){let m=p*u,f=i.subarray(m,m+u),d=[];for(let g=0;g<f.length;g++)d.push({value:f[g],index:g});d.sort((g,h)=>h.value-g.value),c[p]=0;for(let g=0;g<t;g++)if(d[g].index===a[p]){c[p]=1;break}}return r!==o&&o.dispose(),e!==n&&n.dispose(),qe(c,n.shape,"bool")}var Xb=v2;var ku={};re(ku,{conv2d:()=>Qb,depthwiseConv2d:()=>e_,matMul:()=>t_});function T2(r,e,t,o,n,s="NHWC",i){let a=r;r.rank===3&&(a=$(r,[1,r.shape[0],r.shape[1],r.shape[2]]));let l=e;l.rank===3&&(l=$(e,[1,e.shape[0],e.shape[1],e.shape[2]])),v(a.rank===4,()=>`Error in conv2dDerFilter: input must be rank 4, but got shape ${a.shape}.`),v(l.rank===4,()=>`Error in conv2dDerFilter: dy must be rank 4, but got shape ${l.shape}.`),v(t.length===4,()=>`Error in conv2dDerFilter: filterShape must be length 4, but got ${t}.`);let u=s==="NHWC"?a.shape[3]:a.shape[1],c=s==="NHWC"?l.shape[3]:l.shape[1];v(u===t[2],()=>`Error in conv2dDerFilter: depth of input ${u}) must match input depth in filter (${t[2]}.`),v(c===t[3],()=>`Error in conv2dDerFilter: depth of dy (${c}) must match output depth for filter (${t[3]}).`),$e("conv2dDerFilter",n,i);let p={x:a,dy:l},m={strides:o,pad:n,dataFormat:s,dimRoundingMode:i,filterShape:t};return w.runKernel(Us,p,m)}var Yb=_({conv2DBackpropFilter_:T2});function Xo(r,e,t){if(t==null||t==="linear")return r;if(t==="relu")return F(r,vl(e));throw new Error(`Cannot compute gradient for fused activation ${t}.`)}function Yo(r,e){let t=e,o=fu(r.shape,e.shape);return o.length>0&&(t=le(t,o)),$(t,r.shape)}function Qo(r,e,t,o){if(e==="linear")return r;if(e==="relu")return Ar(r);if(e==="elu")return Ja(r);if(e==="relu6")return yl(r);if(e==="prelu")return hl(r,t);if(e==="leakyrelu")return nl(r,o);if(e==="sigmoid")return Ct(r);throw new Error(`Unknown fused activation ${e}.`)}var Zo=(r,e)=>!(r>0)||e==="linear";function C2({x:r,filter:e,strides:t,pad:o,dataFormat:n="NHWC",dilations:s=[1,1],dimRoundingMode:i,bias:a,activation:l="linear",preluActivationWeights:u,leakyreluAlpha:c}){if(l=l||"linear",Zo(w.state.gradientDepth,l)===!1){v(n==="NHWC",()=>`Error in fused conv2d: got dataFormat of ${n} but only NHWC is currently supported for the case of gradient depth is 0 and the activation is not linear.`);let A=Sr(r,e,t,o,n,s,i);return a!=null&&(A=G(A,a)),Qo(A,l,u,c)}let p=y(r,"x","conv2d","float32"),m=y(e,"filter","conv2d","float32"),f=p,d=!1;p.rank===3&&(d=!0,f=$(p,[1,p.shape[0],p.shape[1],p.shape[2]])),v(f.rank===4,()=>`Error in fused conv2d: input must be rank 4, but got rank ${f.rank}.`),v(m.rank===4,()=>`Error in fused conv2d: filter must be rank 4, but got rank ${m.rank}.`),$e("fused conv2d",o,i);let g=n==="NHWC"?f.shape[3]:f.shape[1];v(m.shape[2]===g,()=>`Error in conv2d: depth of input (${g}) must match input depth for filter ${m.shape[2]}.`),v(Xe(t,s),()=>`Error in conv2D: Either strides or dilations must be 1. Got strides ${t} and dilations '${s}'`);let h=Go(f.shape,m.shape,t,s,o,i),b;a!=null&&(b=y(a,"bias","fused conv2d"),[b]=ee(b,p),n==="NHWC"?ae(h.outShape,b.shape):(v(b.shape.length<=1,()=>`Error in fused conv2d: only supports scalar or 1-D Tensor bias for NCHW format but got the bias of rank-${b.shape.length}.`),v(b.shape.length===0||b.shape[0]===h.outChannels||b.shape[0]===1,()=>`Error in fused conv2d: bias shape (${b.shape}) is not compatible with the number of output channels (${h.outChannels})`)));let T;if(u!=null){let A=u.shape;if(v(A.length<=1||A.length===3,()=>`Error in fused conv2d: only supports scalar, 1-D Tensor or 3-D Tensor PReLU activation weights but got a tensor of rank-${A.length}.`),A.length===1)v(A[0]===1||A[0]===h.outChannels,()=>`Error in fused conv2d: PReLU activation weights (${A}) is not compatible with the number of output channels (${h.outChannels}).`);else if(A.length===3)try{ae(A,h.outShape)}catch(R){let D=`Error in fused conv2d: PReLU activation weights (${A}) is not compatible with the output shape of the conv2d (${h.outShape}).`;throw Error(D)}T=y(u,"prelu weights","fused conv2d")}let k=(A,R)=>{v(n==="NHWC",()=>`Error in gradient of fused conv2D: got dataFormat of ${n} but only NHWC is currently supported.`);let[D,P,L,z]=R,B=Xo(A,L,l);v(Uo(s),()=>`Error in gradient of fused conv2D: dilation rates greater than 1 are not yet supported in gradients. Got dilations '${s}'`);let K=xu(P.shape,B,D,t,o),W=Yb(P,B,D.shape,t,o),X=[K,W];if(z!=null){let se=Yo(z,B);X.push(se)}return X},S={x:f,filter:m,bias:b,preluActivationWeights:T},I={strides:t,pad:o,dataFormat:n,dilations:s,dimRoundingMode:i,activation:l,leakyreluAlpha:c};return a==null?Ye((R,D,P)=>{let L=w.runKernel(An,S,I);return P([D,R,L]),d&&(L=$(L,[L.shape[1],L.shape[2],L.shape[3]])),{value:L,gradFunc:k}})(f,m):Ye((R,D,P,L)=>{let z=w.runKernel(An,S,I);return L([D,R,z,P]),d&&(z=$(z,[z.shape[1],z.shape[2],z.shape[3]])),{value:z,gradFunc:k}})(f,m,b)}var Qb=_({fusedConv2d_:C2});function k2(r,e,t,o,n,s=[1,1],i){let a=r;r.rank===3&&(a=$(r,[1,r.shape[0],r.shape[1],r.shape[2]]));let l=e;l.rank===3&&(l=$(e,[1,e.shape[0],e.shape[1],e.shape[2]]));let u={x:a,dy:l},c={strides:o,pad:n,dimRoundingMode:i,dilations:s,filterShape:t};return w.runKernel(ti,u,c)}var Zb=_({depthwiseConv2dNativeBackpropFilter_:k2});function N2(r,e,t,o,n,s=[1,1],i){let a=e,l=!1;e.rank===3&&(l=!0,a=$(e,[1,e.shape[0],e.shape[1],e.shape[2]]));let u={dy:a,filter:t},c={strides:o,pad:n,dimRoundingMode:i,dilations:s,inputShape:r},p=w.runKernel(ri,u,c);return l?$(p,[p.shape[1],p.shape[2],p.shape[3]]):p}var Jb=_({depthwiseConv2dNativeBackpropInput_:N2});function S2({x:r,filter:e,strides:t,pad:o,dataFormat:n="NHWC",dilations:s=[1,1],dimRoundingMode:i,bias:a,activation:l="linear",preluActivationWeights:u,leakyreluAlpha:c}){if(Zo(w.state.gradientDepth,l)===!1){let I=Wo(r,e,t,o,n,s,i);return a!=null&&(I=G(I,a)),Qo(I,l,u,c)}let p=y(r,"x","depthwiseConv2d","float32"),m=y(e,"filter","depthwiseConv2d","float32"),f=p,d=!1;p.rank===3&&(d=!0,f=$(p,[1,p.shape[0],p.shape[1],p.shape[2]])),v(f.rank===4,()=>`Error in fused depthwiseConv2d: input must be rank 4, but got rank ${f.rank}.`),v(m.rank===4,()=>`Error in fused depthwiseConv2d: filter must be rank 4, but got rank ${m.rank}.`),v(f.shape[3]===m.shape[2],()=>`Error in fused depthwiseConv2d: number of input channels (${f.shape[3]}) must match the inChannels dimension in filter ${m.shape[2]}.`),s==null&&(s=[1,1]),v(Xe(t,s),()=>`Error in fused depthwiseConv2d: Either strides or dilations must be 1. Got strides ${t} and dilations '${s}'`),$e("fused depthwiseConv2d",o,i);let g=Go(f.shape,m.shape,t,s,o,i,!0),h;a!=null&&(h=y(a,"bias","fused conv2d"),[h]=ee(h,p),ae(g.outShape,h.shape));let b;u!=null&&(b=y(u,"prelu weights","fused depthwiseConv2d"));let T=(I,A)=>{v(Uo(s),()=>`Error in gradient of fused depthwiseConv2d: dilation rates greater than 1 are not yet supported. Got dilations '${s}'`);let[R,D,P,L]=A,z=Xo(I,P,l),B=Jb(D.shape,z,R,t,o,s,i),K=Zb(D,z,R.shape,t,o,s,i);if(L!=null){let W=Yo(h,z);return[B,K,W]}return[B,K]},k={x:f,filter:m,bias:h,preluActivationWeights:b},S={strides:t,pad:o,dataFormat:n,dilations:s,dimRoundingMode:i,activation:l,leakyreluAlpha:c};return a==null?Ye((A,R,D)=>{let P=w.runKernel(Rn,k,S);return D([R,A,P]),d&&(P=$(P,[P.shape[1],P.shape[2],P.shape[3]])),{value:P,gradFunc:T}})(f,m):Ye((A,R,D,P)=>{let L=w.runKernel(Rn,k,S);return P([R,A,L,D]),d&&(L=$(L,[L.shape[1],L.shape[2],L.shape[3]])),{value:L,gradFunc:T}})(f,m,h)}var e_=_({fusedDepthwiseConv2d_:S2});function E2({a:r,b:e,transposeA:t=!1,transposeB:o=!1,bias:n,activation:s="linear",preluActivationWeights:i,leakyreluAlpha:a=.2}){if(Zo(w.state.gradientDepth,s)===!1){let z=ie(r,e,t,o);return n!=null&&(z=G(z,n)),Qo(z,s,i,a)}let l=y(r,"a","fused matMul"),u=y(e,"b","fused matMul");[l,u]=ee(l,u);let c=t?l.shape[l.rank-2]:l.shape[l.rank-1],p=o?u.shape[u.rank-1]:u.shape[u.rank-2],m=t?l.shape[l.rank-1]:l.shape[l.rank-2],f=o?u.shape[u.rank-2]:u.shape[u.rank-1],d=l.shape.slice(0,-2),g=u.shape.slice(0,-2),h=ne(d),b=ne(g);v(c===p,()=>`Error in fused matMul: inner shapes (${c}) and (${p}) of Tensors with shapes ${l.shape} and ${u.shape} and transposeA=${t} and transposeB=${o} must match.`);let k=ae(l.shape.slice(0,-2),u.shape.slice(0,-2)).concat([m,f]),S=t?$(l,[h,c,m]):$(l,[h,m,c]),I=o?$(u,[b,f,p]):$(u,[b,p,f]),A;n!=null&&(A=y(n,"bias","fused matMul"),[A]=ee(A,l),ae(k,A.shape));let R;i!=null&&(R=y(i,"prelu weights","fused matMul"));let D=(z,B)=>{let[K,W,X,se]=B,me=Xo($(z,X.shape),X,s),fe,Ee;if(!t&&!o?(fe=ie(me,W,!1,!0),Ee=ie(K,me,!0,!1)):!t&&o?(fe=ie(me,W,!1,!1),Ee=ie(me,K,!0,!1)):t&&!o?(fe=ie(W,me,!1,!0),Ee=ie(K,me,!1,!1)):(fe=ie(W,me,!0,!0),Ee=ie(me,K,!0,!0)),n!=null){let De=Yo(se,me);return[fe,Ee,De]}else return[fe,Ee]},P={a:S,b:I,bias:A,preluActivationWeights:R},L={transposeA:t,transposeB:o,activation:s,leakyreluAlpha:a};return n==null?Ye((B,K,W)=>{let X=w.runKernel($n,P,L);return W([B,K,X]),{value:$(X,k),gradFunc:D}})(S,I):Ye((B,K,W,X)=>{let se=w.runKernel($n,P,L);return X([B,K,se,W]),{value:$(se,k),gradFunc:D}})(S,I,A)}var t_=_({fusedMatMul_:E2});function I2(r){return Zn(r,.54,.46)}var r_=_({hammingWindow_:I2});function $2(r){return Zn(r,.5,.5)}var Nu=_({hannWindow_:$2});function A2(r,e,t,o=!1,n=0){let s=0,i=[];for(;s+e<=r.size;)i.push(J(r,s,e)),s+=t;if(o)for(;s<r.size;){let a=s+e-r.size,l=ge([J(r,s,e-a),jt([a],n)]);i.push(l),s+=t}return i.length===0?Xt([],[0,e]):$(ge(i),[i.length,e])}var Su=_({frame_:A2});function R2(r,e,t,o,n=Nu){o==null&&(o=Cu(e));let s=Su(r,e,t),i=F(s,n(e));return Ko(i,o)}var o_=_({stft_:R2});function D2(r,e,t,o,n="bilinear",s=0){let i=y(r,"image","cropAndResize"),a=y(e,"boxes","cropAndResize","float32"),l=y(t,"boxInd","cropAndResize","int32"),u=a.shape[0];v(i.rank===4,()=>`Error in cropAndResize: image must be rank 4,but got rank ${i.rank}.`),v(a.rank===2&&a.shape[1]===4,()=>`Error in cropAndResize: boxes must be have size [${u},4] but had shape ${a.shape}.`),v(l.rank===1&&l.shape[0]===u,()=>`Error in cropAndResize: boxInd must be have size [${u}] but had shape ${a.shape}.`),v(o.length===2,()=>`Error in cropAndResize: cropSize must be of length 2, but got length ${o.length}.`),v(o[0]>=1&&o[1]>=1,()=>`cropSize must be atleast [1,1], but was ${o}`),v(n==="bilinear"||n==="nearest",()=>`method must be bilinear or nearest, but was ${n}`);let c={image:i,boxes:a,boxInd:l},p={method:n,extrapolationValue:s,cropSize:o};return w.runKernel(Qs,c,p)}var n_=_({cropAndResize_:D2});function F2(r){let e=y(r,"image","flipLeftRight","float32");v(e.rank===4,()=>`Error in flipLeftRight: image must be rank 4,but got rank ${e.rank}.`);let t={image:e};return w.runKernel(mi,t,{})}var s_=_({flipLeftRight_:F2});function O2(r){let e=y(r,"image","grayscaleToRGB"),t=e.rank-1,o=e.shape[t];v(e.rank>=2,()=>`Error in grayscaleToRGB: images must be at least rank 2, but got rank ${e.rank}.`),v(o===1,()=>`Error in grayscaleToRGB: last dimension of a grayscale image should be size 1, but got size ${o}.`);let n=new Array(e.rank);return n.fill(1,0,t),n[t]=3,Ir(e,n)}var i_=_({grayscaleToRGB_:O2});function P2(r,e,t=0,o=.5){let n=y(r,"image","rotateWithOffset","float32");v(n.rank===4,()=>`Error in rotateWithOffset: image must be rank 4,but got rank ${n.rank}.`);let s={image:n},i={radians:e,fillValue:t,center:o};return w.runKernel(Fa,s,i)}var a_=_({rotateWithOffset_:P2});function Dt(r,e,t,o,n,s){o==null&&(o=.5),n==null&&(n=Number.NEGATIVE_INFINITY),s==null&&(s=0);let i=r.shape[0];return t=Math.min(t,i),v(0<=o&&o<=1,()=>`iouThreshold must be in [0, 1], but was '${o}'`),v(r.rank===2,()=>`boxes must be a 2D tensor, but was of rank '${r.rank}'`),v(r.shape[1]===4,()=>`boxes must have 4 columns, but 2nd dimension was ${r.shape[1]}`),v(e.rank===1,()=>"scores must be a 1D tensor"),v(e.shape[0]===i,()=>`scores has incompatible shape with boxes. Expected ${i}, but was ${e.shape[0]}`),v(0<=s&&s<=1,()=>`softNmsSigma must be in [0, 1], but was '${s}'`),{maxOutputSize:t,iouThreshold:o,scoreThreshold:n,softNmsSigma:s}}function L2(r,e,t,o=.5,n=Number.NEGATIVE_INFINITY){let s=y(r,"boxes","nonMaxSuppression","float32"),i=y(e,"scores","nonMaxSuppression","float32"),a=Dt(s,i,t,o,n);t=a.maxOutputSize,o=a.iouThreshold,n=a.scoreThreshold;let l={maxOutputSize:t,iouThreshold:o,scoreThreshold:n};return w.runKernel(Bi,{boxes:s,scores:i},l)}var l_=_({nonMaxSuppression_:L2});function u_(r,e,t){let o=B2(r,e,t),n=o<0?-(o+1):o;r.splice(n,0,e)}function B2(r,e,t){return V2(r,e,t||M2)}function M2(r,e){return r>e?1:r<e?-1:0}function V2(r,e,t){let o=0,n=r.length,s=0,i=!1;for(;o<n;){s=o+(n-o>>>1);let a=t(e,r[s]);a>0?o=s+1:(n=s,i=!a)}return i?o:-o-1}function Eu(r,e,t,o,n){return Xf(r,e,t,o,n,0)}function Iu(r,e,t,o,n,s){return Xf(r,e,t,o,n,0,!1,s,!0)}function $u(r,e,t,o,n,s){return Xf(r,e,t,o,n,s,!0)}function Xf(r,e,t,o,n,s,i=!1,a=!1,l=!1){let u=[];for(let h=0;h<e.length;h++)e[h]>n&&u.push({score:e[h],boxIndex:h,suppressBeginIndex:0});u.sort(c_);let c=s>0?-.5/s:0,p=[],m=[];for(;p.length<t&&u.length>0;){let h=u.pop(),{score:b,boxIndex:T,suppressBeginIndex:k}=h;if(b<n)break;let S=!1;for(let I=p.length-1;I>=k;--I){let A=G2(r,T,p[I]);if(A>=o){S=!0;break}if(h.score=h.score*z2(o,c,A),h.score<=n)break}h.suppressBeginIndex=p.length,S||(h.score===b?(p.push(T),m.push(h.score)):h.score>n&&u_(u,h,c_))}let f=p.length,d=t-f;a&&d>0&&(p.push(...new Array(d).fill(0)),m.push(...new Array(d).fill(0)));let g={selectedIndices:p};return i&&(g.selectedScores=m),l&&(g.validOutputs=f),g}function G2(r,e,t){let o=r.subarray(e*4,e*4+4),n=r.subarray(t*4,t*4+4),s=Math.min(o[0],o[2]),i=Math.min(o[1],o[3]),a=Math.max(o[0],o[2]),l=Math.max(o[1],o[3]),u=Math.min(n[0],n[2]),c=Math.min(n[1],n[3]),p=Math.max(n[0],n[2]),m=Math.max(n[1],n[3]),f=(a-s)*(l-i),d=(p-u)*(m-c);if(f<=0||d<=0)return 0;let g=Math.max(s,u),h=Math.max(i,c),b=Math.min(a,p),T=Math.min(l,m),k=Math.max(b-g,0)*Math.max(T-h,0);return k/(f+d-k)}function z2(r,e,t){let o=Math.exp(e*t*t);return t<=r?o:0}function c_(r,e){return r.score-e.score||r.score===e.score&&e.boxIndex-r.boxIndex}async function U2(r,e,t,o=.5,n=Number.NEGATIVE_INFINITY){let s=y(r,"boxes","nonMaxSuppressionAsync"),i=y(e,"scores","nonMaxSuppressionAsync"),a=Dt(s,i,t,o,n);t=a.maxOutputSize,o=a.iouThreshold,n=a.scoreThreshold;let l=await Promise.all([s.data(),i.data()]),u=l[0],c=l[1],{selectedIndices:p}=Eu(u,c,t,o,n);return s!==r&&s.dispose(),i!==e&&i.dispose(),Oe(p,"int32")}var p_=U2;function W2(r,e,t,o=.5,n=Number.NEGATIVE_INFINITY,s=0){let i=y(r,"boxes","nonMaxSuppression"),a=y(e,"scores","nonMaxSuppression"),l=Dt(i,a,t,o,n,s);t=l.maxOutputSize,o=l.iouThreshold,n=l.scoreThreshold,s=l.softNmsSigma;let u={boxes:i,scores:a},c={maxOutputSize:t,iouThreshold:o,scoreThreshold:n,softNmsSigma:s},p=w.runKernel(Vi,u,c);return{selectedIndices:p[0],selectedScores:p[1]}}var m_=_({nonMaxSuppressionWithScore_:W2});async function j2(r,e,t,o=.5,n=Number.NEGATIVE_INFINITY,s=0){let i=y(r,"boxes","nonMaxSuppressionAsync"),a=y(e,"scores","nonMaxSuppressionAsync"),l=Dt(i,a,t,o,n,s);t=l.maxOutputSize,o=l.iouThreshold,n=l.scoreThreshold,s=l.softNmsSigma;let u=await Promise.all([i.data(),a.data()]),c=u[0],p=u[1],{selectedIndices:m,selectedScores:f}=$u(c,p,t,o,n,s);return i!==r&&i.dispose(),a!==e&&a.dispose(),{selectedIndices:Oe(m,"int32"),selectedScores:Oe(f)}}var f_=j2;function H2(r,e,t,o=.5,n=Number.NEGATIVE_INFINITY,s=!1){let i=y(r,"boxes","nonMaxSuppression"),a=y(e,"scores","nonMaxSuppression"),l=Dt(i,a,t,o,n,null),u=l.maxOutputSize,c=l.iouThreshold,p=l.scoreThreshold,m={boxes:i,scores:a},f={maxOutputSize:u,iouThreshold:c,scoreThreshold:p,padToMaxOutputSize:s},d=w.runKernel(Mi,m,f);return{selectedIndices:d[0],validOutputs:d[1]}}var d_=_({nonMaxSuppressionPadded_:H2});async function q2(r,e,t,o=.5,n=Number.NEGATIVE_INFINITY,s=!1){let i=y(r,"boxes","nonMaxSuppressionAsync"),a=y(e,"scores","nonMaxSuppressionAsync"),l=Dt(i,a,t,o,n,null),u=l.maxOutputSize,c=l.iouThreshold,p=l.scoreThreshold,[m,f]=await Promise.all([i.data(),a.data()]),{selectedIndices:d,validOutputs:g}=Iu(m,f,u,c,p,s);return i!==r&&i.dispose(),a!==e&&a.dispose(),{selectedIndices:Oe(d,"int32"),validOutputs:j(g,"int32")}}var h_=q2;function K2(r,e,t=!1,o=!1){let n=y(r,"images","resizeBilinear");v(n.rank===3||n.rank===4,()=>`Error in resizeBilinear: x must be rank 3 or 4, but got rank ${n.rank}.`),v(e.length===2,()=>`Error in resizeBilinear: new shape must 2D, but got shape ${e}.`),v(o===!1||t===!1,()=>"Error in resizeBilinear: If halfPixelCenters is true, alignCorners must be false.");let s=n,i=!1;n.rank===3&&(i=!0,s=$(n,[1,n.shape[0],n.shape[1],n.shape[2]]));let[]=e,a={images:s},l={alignCorners:t,halfPixelCenters:o,size:e},u=w.runKernel(ea,a,l);return i?$(u,[u.shape[1],u.shape[2],u.shape[3]]):u}var g_=_({resizeBilinear_:K2});function X2(r,e,t=!1,o=!1){let n=y(r,"images","resizeNearestNeighbor");v(n.rank===3||n.rank===4,()=>`Error in resizeNearestNeighbor: x must be rank 3 or 4, but got rank ${n.rank}.`),v(e.length===2,()=>`Error in resizeNearestNeighbor: new shape must 2D, but got shape ${e}.`),v(n.dtype==="float32"||n.dtype==="int32",()=>"`images` must have `int32` or `float32` as dtype"),v(o===!1||t===!1,()=>"Error in resizeNearestNeighbor: If halfPixelCenters is true, alignCorners must be false.");let s=n,i=!1;n.rank===3&&(i=!0,s=$(n,[1,n.shape[0],n.shape[1],n.shape[2]]));let[]=e,a={images:s},l={alignCorners:t,halfPixelCenters:o,size:e},u=w.runKernel(Ji,a,l);return i?$(u,[u.shape[1],u.shape[2],u.shape[3]]):u}var x_=_({resizeNearestNeighbor_:X2});function Y2(r,e="binary",t=!1,o=.5){let n=y(r,"image","threshold"),s=.2989,i=.587,a=.114,l=n.shape[0]*n.shape[1],u=F(Oe([o]),255),c,p,m,f;if(v(n.rank===3,()=>`Error in threshold: image must be rank 3,but got rank ${n.rank}.`),v(n.shape[2]===3||n.shape[2]===1,()=>`Error in threshold: image color channel must be equal to 3 or 1but got ${n.shape[2]}.`),v(n.dtype==="int32"||n.dtype==="float32",()=>`Error in dtype: image dtype must be int32 or float32,but got dtype ${n.dtype}.`),v(e==="otsu"||e==="binary",()=>`Method must be binary or otsu, but was ${e}`),n.shape[2]===3){[c,p,m]=cr(n,[1,1,1],-1);let h=F(c,s),b=F(p,i),T=F(m,a);f=G(G(h,b),T)}else f=r;if(e==="otsu"){let h=Ya(oe(bl(f),"int32"),qe([]),256);u=Q2(h,l)}let d=t?jo(f,u):Qr(f,u);return oe(F(d,255),"int32")}function Q2(r,e){let t=Oe([-1]),o=Oe([0]),n=Oe([0]),s,i,a,l,u,c;for(let p=0;p<r.size-1;p++){s=J(r,0,p+1),i=J(r,p+1),u=Z(le(s),e),c=Z(le(i),e);let m=le(F(s,$r(0,s.size)));a=Z(m,le(s));let f=jt(i.shape,s.size),d=G($r(0,i.size),f),g=F(i,d);l=Z(le(g),le(i));let h=H(a,l),b=H(a,l),T=F(u,c);n=F(F(T,h),b);let k=Qr(n,o);o=At(k,n,o),t=At(k,Oe([p]),t)}return t}var y_=_({threshold_:Y2});function Z2(r,e,t="nearest",o="constant",n=0,s){let i=y(r,"image","transform","float32"),a=y(e,"transforms","transform","float32");v(i.rank===4,()=>`Error in transform: image must be rank 4,but got rank ${i.rank}.`),v(a.rank===2&&(a.shape[0]===i.shape[0]||a.shape[0]===1)&&a.shape[1]===8,()=>"Error in transform: Input transform should be batch x 8 or 1 x 8"),v(s==null||s.length===2,()=>`Error in transform: outputShape must be [height, width] or null, but got ${s}.`);let l={image:i,transforms:a},u={interpolation:t,fillMode:o,fillValue:n,outputShape:s};return w.runKernel(Ea,l,u)}var b_=_({transform_:Z2});function J2(r,e,t){v(e%1==0,()=>`bandPart(): numLower must be an integer, got ${e}.`),v(t%1==0,()=>`bandPart(): numUpper must be an integer, got ${t}.`);let o=y(r,"a","bandPart");v(o.rank>=2,()=>`bandPart(): Rank must be at least 2, got ${o.rank}.`);let n=o.shape,[s,i]=o.shape.slice(-2);if(!(e<=s))throw new Error(`bandPart(): numLower (${e}) must not be greater than the number of rows (${s}).`);if(!(t<=i))throw new Error(`bandPart(): numUpper (${t}) must not be greater than the number of columns (${i}).`);e<0&&(e=s),t<0&&(t=i);let a=$($r(0,s,1,"int32"),[-1,1]),l=$r(0,i,1,"int32"),u=H(a,l),c=Zr(jo(u,j(+e,"int32")),ol(u,j(-t,"int32"))),p=Nt([s,i],o.dtype);return $(Qe(xt($(o,[-1,s,i])).map(m=>At(c,m,p))),n)}var __=_({bandPart_:J2});function eA(r){let e;if(Array.isArray(r)){e=!1,v(r!=null&&r.length>0,()=>"Gram-Schmidt process: input must not be null, undefined, or empty");let n=r[0].shape[0];for(let s=1;s<r.length;++s)v(r[s].shape[0]===n,()=>`Gram-Schmidt: Non-unique lengths found in the input vectors: (${r[s].shape[0]} vs. ${n})`)}else e=!0,r=cr(r,r.shape[0],0).map(n=>pr(n,[0]));v(r.length<=r[0].shape[0],()=>`Gram-Schmidt: Number of vectors (${r.length}) exceeds number of dimensions (${r[0].shape[0]}).`);let t=[],o=r;for(let n=0;n<r.length;++n)t.push(w.tidy(()=>{let s=o[n];if(n>0)for(let i=0;i<n;++i){let a=F(le(F(t[i],s)),t[i]);s=H(s,a)}return Z(s,Yr(s,"euclidean"))}));return e?Qe(t,0):t}var w_=_({gramSchmidt_:eA});function tA(r,e=!1){if(v(r.rank>=2,()=>`qr() requires input tensor to have a rank >= 2, but got rank ${r.rank}`),r.rank===2)return v_(r,e);{let t=r.shape.slice(0,r.shape.length-2).reduce((l,u)=>l*u),o=xt($(r,[t,r.shape[r.shape.length-2],r.shape[r.shape.length-1]]),0),n=[],s=[];o.forEach(l=>{let[u,c]=v_(l,e);n.push(u),s.push(c)});let i=$(Qe(n,0),r.shape),a=$(Qe(s,0),r.shape);return[i,a]}}function v_(r,e=!1){return w.tidy(()=>{v(r.shape.length===2,()=>`qr2d() requires a 2D Tensor, but got a ${r.shape.length}D Tensor.`);let t=r.shape[0],o=r.shape[1],n=el(t),s=lt(r),i=Xt([[1]],[1,1]),a=lt(i),l=t>=o?o:t;for(let u=0;u<l;++u){let c=s,p=a,m=n;[a,s,n]=w.tidy(()=>{let f=J(s,[u,u],[t-u,1]),d=Yr(f),g=J(s,[u,u],[1,1]),h=At(Qr(g,0),Xt([[-1]]),Xt([[1]])),b=H(g,F(h,d)),T=Z(f,b);T.shape[0]===1?a=lt(i):a=ge([i,J(T,[1,0],[T.shape[0]-1,T.shape[1]])],0);let k=Ke(Z(ie(h,b),d)),S=J(s,[u,0],[t-u,o]),I=F(k,a),A=Mo(a);if(u===0)s=H(S,ie(I,ie(A,S)));else{let P=H(S,ie(I,ie(A,S)));s=ge([J(s,[0,0],[u,o]),P],0)}let R=Mo(I),D=J(n,[0,u],[t,n.shape[1]-u]);if(u===0)n=H(D,ie(ie(D,a),R));else{let P=H(D,ie(ie(D,a),R));n=ge([J(n,[0,0],[t,u]),P],1)}return[a,s,n]}),Ie([c,p,m])}return!e&&t>o&&(n=J(n,[0,0],[t,o]),s=J(s,[0,0],[o,o])),[n,s]})}var T_=_({qr_:tA});var Te;(function(r){r[r.NONE=0]="NONE",r[r.MEAN=1]="MEAN",r[r.SUM=2]="SUM",r[r.SUM_BY_NONZERO_WEIGHTS=3]="SUM_BY_NONZERO_WEIGHTS"})(Te||(Te={}));function rA(r,e,t=Te.SUM_BY_NONZERO_WEIGHTS){let o=y(r,"losses","computeWeightedLoss"),n=null;e!=null&&(n=y(e,"weights","computeWeightedLoss"));let s=n==null?o:F(o,n);if(t===Te.NONE)return s;if(t===Te.SUM)return le(s);if(t===Te.MEAN){if(n==null)return Jr(s);{let i=o.size/n.size,a=Z(le(s),le(n));return i>1?Z(a,j(i)):a}}if(t===Te.SUM_BY_NONZERO_WEIGHTS){if(n==null)return Z(le(s),j(o.size));{let i=F(n,qt(o.shape)),a=oe(le(fl(i,j(0))),"float32");return Z(le(s),a)}}throw Error(`Unknown reduction: ${t}`)}var We=_({computeWeightedLoss_:rA});function oA(r,e,t,o=Te.SUM_BY_NONZERO_WEIGHTS){let n=y(r,"labels","absoluteDifference"),s=y(e,"predictions","absoluteDifference"),i=null;t!=null&&(i=y(t,"weights","absoluteDifference")),xe(n.shape,s.shape,"Error in absoluteDifference: ");let a=Le(H(n,s));return We(a,i,o)}var C_=_({absoluteDifference_:oA});function nA(r,e,t,o,n=Te.SUM_BY_NONZERO_WEIGHTS){let s=y(r,"labels","cosineDistance"),i=y(e,"predictions","cosineDistance"),a=null;o!=null&&(a=y(o,"weights","cosineDistance")),xe(s.shape,i.shape,"Error in cosineDistance: ");let l=j(1),u=H(l,le(F(s,i),t,!0));return We(u,a,n)}var k_=_({cosineDistance_:nA});function sA(r,e,t,o=Te.SUM_BY_NONZERO_WEIGHTS){let n=y(r,"labels","hingeLoss"),s=y(e,"predictions","hingeLoss"),i=null;t!=null&&(i=y(t,"weights","hingeLoss")),xe(n.shape,s.shape,"Error in hingeLoss: ");let a=j(1);n=H(F(j(2),n),a);let l=Ar(H(a,F(n,s)));return We(l,i,o)}var N_=_({hingeLoss_:sA});function iA(r,e,t,o=1,n=Te.SUM_BY_NONZERO_WEIGHTS){let s=y(r,"labels","huberLoss"),i=y(e,"predictions","huberLoss"),a=null;t!=null&&(a=y(t,"weights","huberLoss")),xe(s.shape,i.shape,"Error in huberLoss: ");let l=j(o),u=Le(H(i,s)),c=ml(u,l),p=H(u,c),m=G(F(j(.5),Be(c)),F(l,p));return We(m,a,n)}var S_=_({huberLoss_:iA});function aA(r,e,t,o=1e-7,n=Te.SUM_BY_NONZERO_WEIGHTS){let s=y(r,"labels","logLoss"),i=y(e,"predictions","logLoss"),a=null;t!=null&&(a=y(t,"weights","logLoss")),xe(s.shape,i.shape,"Error in logLoss: ");let l=j(1),u=j(o),c=Ke(F(s,ur(G(i,u)))),p=F(H(l,s),ur(G(H(l,i),u))),m=H(c,p);return We(m,a,n)}var E_=_({logLoss_:aA});function lA(r,e,t,o=Te.SUM_BY_NONZERO_WEIGHTS){let n=y(r,"labels","meanSquaredError"),s=y(e,"predictions","meanSquaredError"),i=null;t!=null&&(i=y(t,"weights","meanSquaredError")),xe(n.shape,s.shape,"Error in meanSquaredError: ");let a=wl(n,s);return We(a,i,o)}var I_=_({meanSquaredError_:lA});function uA(r,e){let t=y(r,"labels","sigmoidCrossEntropyWithLogits"),o=y(e,"logits","sigmoidCrossEntropyWithLogits");xe(t.shape,o.shape,"Error in sigmoidCrossEntropyWithLogits: ");let n=Ar(o),s=F(o,t),i=sl(kt(Ke(Le(o))));return G(H(n,s),i)}function cA(r,e,t,o=0,n=Te.SUM_BY_NONZERO_WEIGHTS){let s=y(r,"multiClassLabels","sigmoidCrossEntropy"),i=y(e,"logits","sigmoidCrossEntropy"),a=null;if(t!=null&&(a=y(t,"weights","sigmoidCrossEntropy")),xe(s.shape,i.shape,"Error in sigmoidCrossEntropy: "),o>0){let u=j(o),c=j(1),p=j(.5);s=G(F(s,H(c,u)),F(p,u))}let l=uA(s,i);return We(l,a,n)}var $_=_({sigmoidCrossEntropy_:cA});function pA(r,e,t=-1){if(t===-1&&(t=e.rank-1),t!==e.rank-1)throw Error(`Softmax cross entropy along a non-last dimension is not yet supported. Labels / logits was rank ${e.rank} and dim was ${t}`);return Ye((n,s,i)=>{let l=al(s,[t],!0),u=H(oe(s,"float32"),l);i([n,u]);let c=Ke(F(u,n));return{value:le(c,[t]),gradFunc:(f,d)=>{let[g,h]=d,b=Er(f.shape,[t]);return[F($(f,b),H(oe(g,"float32"),kt(h))),F($(f,b),H(kt(h),oe(g,"float32")))]}}})(r,e)}function mA(r,e,t,o=0,n=Te.SUM_BY_NONZERO_WEIGHTS){let s=y(r,"onehotLabels","softmaxCrossEntropy"),i=y(e,"logits","softmaxCrossEntropy"),a=null;if(t!=null&&(a=y(t,"weights","softmaxCrossEntropy")),xe(s.shape,i.shape,"Error in softmaxCrossEntropy: "),o>0){let u=j(o),c=j(1),p=j(s.shape[1]);s=G(F(s,H(c,u)),Z(u,p))}let l=pA(s,i);return We(l,a,n)}var A_=_({softmaxCrossEntropy_:mA});function fA(r,e,t,o){let n=y(r,"indices","sparseFillEmptyRows","int32"),s=y(e,"values","sparseFillEmptyRows"),i=y(t,"denseShape","sparseFillEmptyRows","int32"),a=y(o,"defaultValue","sparseFillEmptyRows",s.dtype);if(n.rank!==2)throw new Error(`Indices should be Tensor2D but received shape
        ${n.shape}`);if(s.rank!==1)throw new Error(`Values should be Tensor1D but received shape ${s.shape}`);if(i.rank!==1)throw new Error(`Dense shape should be Tensor1D but received shape ${i.shape}`);if(a.rank!==0)throw new Error(`Default value should be a scalar but received shape ${a.shape}`);let l={indices:n,values:s,denseShape:i,defaultValue:a},u=w.runKernel(ga,l);return{outputIndices:u[0],outputValues:u[1],emptyRowIndicator:u[2],reverseIndexMap:u[3]}}var R_=_({sparseFillEmptyRows_:fA});function dA(r,e,t){let o=y(r,"inputIndices","sparseReshape","int32"),n=y(e,"inputShape","sparseReshape","int32"),s=y(t,"newShape","sparseReshape","int32");if(o.rank!==2)throw new Error(`Input indices should be Tensor2D but received shape
        ${o.shape}`);if(n.rank!==1)throw new Error(`Input shape should be Tensor1D but received shape ${n.shape}`);if(s.rank!==1)throw new Error(`New shape should be Tensor1D but received shape ${s.shape}`);let i={inputIndices:o,inputShape:n,newShape:s},a=w.runKernel(xa,i);return{outputIndices:a[0],outputShape:a[1]}}var D_=_({sparseReshape_:dA});function hA(r,e,t){let o=y(r,"data","sparseSegmentMean"),n=y(e,"indices","sparseSegmentMean","int32"),s=y(t,"segmentIds","sparseSegmentMean","int32");if(o.rank<1)throw new Error("Data should be at least 1 dimensional but received scalar");if(n.rank!==1)throw new Error(`Indices should be Tensor1D but received shape
          ${n.shape}`);if(s.rank!==1)throw new Error(`Segment ids should be Tensor1D but received shape
          ${s.shape}`);let i={data:o,indices:n,segmentIds:s};return w.runKernel(ya,i)}var F_=_({sparseSegmentMean_:hA});function gA(r,e,t){let o=y(r,"data","sparseSegmentSum"),n=y(e,"indices","sparseSegmentSum","int32"),s=y(t,"segmentIds","sparseSegmentSum","int32");if(o.rank<1)throw new Error("Data should be at least 1 dimensional but received scalar");if(n.rank!==1)throw new Error(`Indices should be Tensor1D but received shape
         ${n.shape}`);if(s.rank!==1)throw new Error(`Segment ids should be Tensor1D but received shape
         ${s.shape}`);let i={data:o,indices:n,segmentIds:s};return w.runKernel(ba,i)}var O_=_({sparseSegmentSum_:gA});function xA(r,e,t,o,n,s,i,a){let l=y(r,"data","stringNGrams","string");if(l.dtype!=="string")throw new Error("Data must be of datatype string");if(l.shape.length!==1)throw new Error(`Data must be a vector, saw: ${l.shape}`);let u=y(e,"dataSplits","stringNGrams");if(u.dtype!=="int32")throw new Error("Data splits must be of datatype int32");let c={separator:t,nGramWidths:o,leftPad:n,rightPad:s,padWidth:i,preserveShortSequences:a},p={data:l,dataSplits:u},m=w.runKernel(va,p,c);return{nGrams:m[0],nGramsSplits:m[1]}}var P_=_({stringNGrams_:xA});function yA(r,e,t=!0){let o=y(r,"input","stringSplit","string"),n=y(e,"delimiter","stringSplit","string");if(o.rank!==1)throw new Error(`Input should be Tensor1D but received shape ${o.shape}`);if(n.rank!==0)throw new Error(`Delimiter should be a scalar but received shape ${n.shape}`);let s={skipEmpty:t},i={input:o,delimiter:n},a=w.runKernel(Ta,i,s);return{indices:a[0],values:a[1],shape:a[2]}}var L_=_({stringSplit_:yA});function bA(r,e){let t=y(r,"input","stringToHashBucketFast","string"),o={numBuckets:e};if(e<=0)throw new Error("Number of buckets must be at least 1");let n={input:t};return w.runKernel(Ca,n,o)}var B_=_({stringToHashBucketFast_:bA});var M_={fft:qo,ifft:eo,rfft:Ko,irfft:_l},V_={hammingWindow:r_,hannWindow:Nu,frame:Su,stft:o_},Rr={flipLeftRight:s_,grayscaleToRGB:i_,resizeNearestNeighbor:x_,resizeBilinear:g_,rotateWithOffset:a_,cropAndResize:n_,nonMaxSuppression:l_,nonMaxSuppressionAsync:p_,nonMaxSuppressionWithScore:m_,nonMaxSuppressionWithScoreAsync:f_,nonMaxSuppressionPadded:d_,nonMaxSuppressionPaddedAsync:h_,threshold:y_,transform:b_},G_={bandPart:__,gramSchmidt:w_,qr:T_},z_={absoluteDifference:C_,computeWeightedLoss:We,cosineDistance:k_,hingeLoss:N_,huberLoss:S_,logLoss:E_,meanSquaredError:I_,sigmoidCrossEntropy:$_,softmaxCrossEntropy:A_},U_={sparseFillEmptyRows:R_,sparseReshape:D_,sparseSegmentMean:F_,sparseSegmentSum:O_},W_={stringNGrams:P_,stringSplit:L_,stringToHashBucketFast:B_};var ot=class extends hu{minimize(e,t=!1,o){let{value:n,grads:s}=this.computeGradients(e,o);if(o!=null){let i=o.map(a=>({name:a.name,tensor:s[a.name]}));this.applyGradients(i)}else this.applyGradients(s);return Ie(s),t?n:(n.dispose(),null)}get iterations(){return this.iterations_==null&&(this.iterations_=0),this.iterations_}incrementIterations(){this.iterations_=this.iterations+1}computeGradients(e,t){return yu(e,t)}dispose(){this.iterations_!=null&&Ie(this.iterations_)}async saveIterations(){return this.iterations_==null&&(this.iterations_=0),{name:"iter",tensor:j(this.iterations_,"int32")}}async getWeights(){throw new Error("getWeights() is not implemented for this optimizer yet.")}async setWeights(e){throw new Error(`setWeights() is not implemented for this optimizer class ${this.getClassName()}`)}async extractIterations(e){return this.iterations_=(await e[0].tensor.data())[0],e.slice(1)}};Object.defineProperty(ot,Symbol.hasInstance,{value:r=>r.minimize!=null&&r.computeGradients!=null&&r.applyGradients!=null});var Jo=class extends ot{constructor(e,t,o=null){super();this.learningRate=e,this.rho=t,this.epsilon=o,this.accumulatedGrads=[],this.accumulatedUpdates=[],o==null&&(this.epsilon=w.backend.epsilon())}applyGradients(e){(Array.isArray(e)?e.map(o=>o.name):Object.keys(e)).forEach((o,n)=>{let s=w.registeredVariables[o],i=!1;this.accumulatedGrads[n]==null&&(this.accumulatedGrads[n]={originalName:`${o}/accum_grad`,variable:Y(()=>Ae(s).variable(i))}),this.accumulatedUpdates[n]==null&&(this.accumulatedUpdates[n]={originalName:`${o}/accum_var`,variable:Y(()=>Ae(s).variable(i))});let a=Array.isArray(e)?e[n].tensor:e[o];if(a==null)return;let l=this.accumulatedGrads[n].variable,u=this.accumulatedUpdates[n].variable;Y(()=>{let c=G(F(l,this.rho),F(Be(a),1-this.rho)),p=F(Z(rt(G(u,this.epsilon)),rt(G(l,this.epsilon))),a),m=G(F(u,this.rho),F(Be(p),1-this.rho));l.assign(c),u.assign(m);let f=G(F(p,-this.learningRate),s);s.assign(f)})}),this.incrementIterations()}dispose(){this.accumulatedUpdates!=null&&(Ie(this.accumulatedGrads.map(e=>e.variable)),Ie(this.accumulatedUpdates.map(e=>e.variable)))}async getWeights(){let e=[...this.accumulatedGrads,...this.accumulatedUpdates];return[await this.saveIterations()].concat(e.map(t=>({name:t.originalName,tensor:t.variable})))}async setWeights(e){e=await this.extractIterations(e);let t=e.length/2,o=!1;this.accumulatedGrads=e.slice(0,t).map(n=>({originalName:n.name,variable:n.tensor.variable(o)})),this.accumulatedUpdates=e.slice(t,t*2).map(n=>({originalName:n.name,variable:n.tensor.variable(o)}))}getConfig(){return{learningRate:this.learningRate,rho:this.rho,epsilon:this.epsilon}}static fromConfig(e,t){return new e(t.learningRate,t.rho,t.epsilon)}};Jo.className="Adadelta";ut(Jo);var en=class extends ot{constructor(e,t=.1){super();this.learningRate=e,this.initialAccumulatorValue=t,this.accumulatedGrads=[]}applyGradients(e){(Array.isArray(e)?e.map(o=>o.name):Object.keys(e)).forEach((o,n)=>{let s=w.registeredVariables[o];if(this.accumulatedGrads[n]==null){let l=!1;this.accumulatedGrads[n]={originalName:`${o}/accumulator`,variable:Y(()=>jt(s.shape,this.initialAccumulatorValue).variable(l))}}let i=Array.isArray(e)?e[n].tensor:e[o];if(i==null)return;let a=this.accumulatedGrads[n].variable;Y(()=>{let l=G(a,Be(i));a.assign(l);let u=G(F(Z(i,rt(G(l,w.backend.epsilon()))),-this.learningRate),s);s.assign(u)})}),this.incrementIterations()}dispose(){this.accumulatedGrads!=null&&Ie(this.accumulatedGrads.map(e=>e.variable))}async getWeights(){return[await this.saveIterations()].concat(this.accumulatedGrads.map(e=>({name:e.originalName,tensor:e.variable})))}async setWeights(e){e=await this.extractIterations(e);let t=!1;this.accumulatedGrads=e.map(o=>({originalName:o.name,variable:o.tensor.variable(t)}))}getConfig(){return{learningRate:this.learningRate,initialAccumulatorValue:this.initialAccumulatorValue}}static fromConfig(e,t){return new e(t.learningRate,t.initialAccumulatorValue)}};en.className="Adagrad";ut(en);var tn=class extends ot{constructor(e,t,o,n=null){super();this.learningRate=e,this.beta1=t,this.beta2=o,this.epsilon=n,this.accumulatedFirstMoment=[],this.accumulatedSecondMoment=[],Y(()=>{this.accBeta1=j(t).variable(),this.accBeta2=j(o).variable()}),n==null&&(this.epsilon=w.backend.epsilon())}applyGradients(e){let t=Array.isArray(e)?e.map(o=>o.name):Object.keys(e);Y(()=>{let o=H(1,this.accBeta1),n=H(1,this.accBeta2);t.forEach((s,i)=>{let a=w.registeredVariables[s],l=!1;this.accumulatedFirstMoment[i]==null&&(this.accumulatedFirstMoment[i]={originalName:`${s}/m`,variable:Y(()=>Ae(a).variable(l))}),this.accumulatedSecondMoment[i]==null&&(this.accumulatedSecondMoment[i]={originalName:`${s}/v`,variable:Y(()=>Ae(a).variable(l))});let u=Array.isArray(e)?e[i].tensor:e[s];if(u==null)return;let c=this.accumulatedFirstMoment[i].variable,p=this.accumulatedSecondMoment[i].variable,m=G(F(c,this.beta1),F(u,1-this.beta1)),f=G(F(p,this.beta2),F(Be(u),1-this.beta2)),d=Z(m,o),g=Z(f,n);c.assign(m),p.assign(f);let h=G(F(Z(d,G(rt(g),this.epsilon)),-this.learningRate),a);a.assign(h)}),this.accBeta1.assign(F(this.accBeta1,this.beta1)),this.accBeta2.assign(F(this.accBeta2,this.beta2))}),this.incrementIterations()}dispose(){this.accBeta1.dispose(),this.accBeta2.dispose(),this.accumulatedFirstMoment!=null&&Ie(this.accumulatedFirstMoment.map(e=>e.variable)),this.accumulatedSecondMoment!=null&&Ie(this.accumulatedSecondMoment.map(e=>e.variable))}async getWeights(){let e=[...this.accumulatedFirstMoment,...this.accumulatedSecondMoment];return[await this.saveIterations()].concat(e.map(t=>({name:t.originalName,tensor:t.variable})))}async setWeights(e){e=await this.extractIterations(e),Y(()=>{this.accBeta1.assign(lr(this.beta1,this.iterations_+1)),this.accBeta2.assign(lr(this.beta2,this.iterations_+1))});let t=e.length/2,o=!1;this.accumulatedFirstMoment=e.slice(0,t).map(n=>({originalName:n.name,variable:n.tensor.variable(o)})),this.accumulatedSecondMoment=e.slice(t,t*2).map(n=>({originalName:n.name,variable:n.tensor.variable(o)}))}getConfig(){return{learningRate:this.learningRate,beta1:this.beta1,beta2:this.beta2,epsilon:this.epsilon}}static fromConfig(e,t){return new e(t.learningRate,t.beta1,t.beta2,t.epsilon)}};tn.className="Adam";ut(tn);var rn=class extends ot{constructor(e,t,o,n=null,s=0){super();this.learningRate=e,this.beta1=t,this.beta2=o,this.epsilon=n,this.decay=s,this.accumulatedFirstMoment=[],this.accumulatedWeightedInfNorm=[],Y(()=>{this.iteration=j(0).variable(),this.accBeta1=j(t).variable()}),n==null&&(this.epsilon=w.backend.epsilon())}applyGradients(e){let t=Array.isArray(e)?e.map(o=>o.name):Object.keys(e);Y(()=>{let o=H(1,this.accBeta1),n=Z(-this.learningRate,G(F(this.iteration,this.decay),1));t.forEach((s,i)=>{let a=w.registeredVariables[s],l=!1;this.accumulatedFirstMoment[i]==null&&(this.accumulatedFirstMoment[i]={originalName:`${s}/m`,variable:Ae(a).variable(l)}),this.accumulatedWeightedInfNorm[i]==null&&(this.accumulatedWeightedInfNorm[i]={originalName:`${s}/v`,variable:Ae(a).variable(l)});let u=Array.isArray(e)?e[i].tensor:e[s];if(u==null)return;let c=this.accumulatedFirstMoment[i].variable,p=this.accumulatedWeightedInfNorm[i].variable,m=G(F(c,this.beta1),F(u,1-this.beta1)),f=F(p,this.beta2),d=Le(u),g=pl(f,d);c.assign(m),p.assign(g);let h=G(F(Z(n,o),Z(m,G(g,this.epsilon))),a);a.assign(h)}),this.iteration.assign(G(this.iteration,1)),this.accBeta1.assign(F(this.accBeta1,this.beta1))}),this.incrementIterations()}dispose(){this.accBeta1.dispose(),this.iteration.dispose(),this.accumulatedFirstMoment!=null&&Ie(this.accumulatedFirstMoment.map(e=>e.variable)),this.accumulatedWeightedInfNorm!=null&&Ie(this.accumulatedWeightedInfNorm.map(e=>e.variable))}async getWeights(){throw new Error("getWeights() is not implemented for Adamax yet.")}async setWeights(e){throw new Error("setWeights() is not implemented for Adamax yet.")}getConfig(){return{learningRate:this.learningRate,beta1:this.beta1,beta2:this.beta2,epsilon:this.epsilon,decay:this.decay}}static fromConfig(e,t){return new e(t.learningRate,t.beta1,t.beta2,t.epsilon,t.decay)}};rn.className="Adamax";ut(rn);var Dr=class extends ot{constructor(e){super();this.learningRate=e,this.setLearningRate(e)}applyGradients(e){(Array.isArray(e)?e.map(o=>o.name):Object.keys(e)).forEach((o,n)=>{let s=Array.isArray(e)?e[n].tensor:e[o];if(s==null)return;let i=w.registeredVariables[o];Y(()=>{let a=G(F(this.c,s),i);i.assign(a)})}),this.incrementIterations()}setLearningRate(e){this.learningRate=e,this.c!=null&&this.c.dispose(),this.c=ht(j(-e))}dispose(){this.c.dispose()}async getWeights(){return[await this.saveIterations()]}async setWeights(e){if(e=await this.extractIterations(e),e.length!==0)throw new Error("SGD optimizer does not have settable weights.")}getConfig(){return{learningRate:this.learningRate}}static fromConfig(e,t){return new e(t.learningRate)}};Dr.className="SGD";ut(Dr);var on=class extends Dr{constructor(e,t,o=!1){super(e);this.learningRate=e,this.momentum=t,this.useNesterov=o,this.accumulations=[],this.m=j(this.momentum)}applyGradients(e){(Array.isArray(e)?e.map(o=>o.name):Object.keys(e)).forEach((o,n)=>{let s=w.registeredVariables[o];if(this.accumulations[n]==null){let l=!1;this.accumulations[n]={originalName:`${o}/momentum`,variable:Y(()=>Ae(s).variable(l))}}let i=this.accumulations[n].variable,a=Array.isArray(e)?e[n].tensor:e[o];a!=null&&Y(()=>{let l,u=G(F(this.m,i),a);this.useNesterov?l=G(F(this.c,G(a,F(u,this.m))),s):l=G(F(this.c,u),s),i.assign(u),s.assign(l)})}),this.incrementIterations()}dispose(){this.m.dispose(),this.accumulations!=null&&Ie(this.accumulations.map(e=>e.variable))}setMomentum(e){this.momentum=e}async getWeights(){return[await this.saveIterations()].concat(this.accumulations.map(e=>({name:e.originalName,tensor:e.variable})))}async setWeights(e){e=await this.extractIterations(e);let t=!1;this.accumulations=e.map(o=>({originalName:o.name,variable:o.tensor.variable(t)}))}getConfig(){return{learningRate:this.learningRate,momentum:this.momentum,useNesterov:this.useNesterov}}static fromConfig(e,t){return new e(t.learningRate,t.momentum,t.useNesterov)}};on.className="Momentum";ut(on);var nn=class extends ot{constructor(e,t=.9,o=0,n=null,s=!1){super();if(this.learningRate=e,this.decay=t,this.momentum=o,this.epsilon=n,this.accumulatedMeanSquares=[],this.accumulatedMoments=[],this.accumulatedMeanGrads=[],this.centered=s,n==null&&(this.epsilon=w.backend.epsilon()),e==null)throw new Error("learningRate for RMSPropOptimizer must be defined.")}applyGradients(e){(Array.isArray(e)?e.map(o=>o.name):Object.keys(e)).forEach((o,n)=>{let s=w.registeredVariables[o],i=!1;this.accumulatedMeanSquares[n]==null&&(this.accumulatedMeanSquares[n]={originalName:`${o}/rms`,variable:Y(()=>Ae(s).variable(i))}),this.accumulatedMoments[n]==null&&(this.accumulatedMoments[n]={originalName:`${o}/momentum`,variable:Y(()=>Ae(s).variable(i))}),this.accumulatedMeanGrads[n]==null&&this.centered&&(this.accumulatedMeanGrads[n]={originalName:`${o}/mg`,variable:Y(()=>Ae(s).variable(i))});let a=Array.isArray(e)?e[n].tensor:e[o];if(a==null)return;let l=this.accumulatedMeanSquares[n].variable,u=this.accumulatedMoments[n].variable;Y(()=>{let c=G(F(l,this.decay),F(Be(a),1-this.decay));if(this.centered){let p=this.accumulatedMeanGrads[n].variable,m=G(F(p,this.decay),F(a,1-this.decay)),f=Z(F(a,this.learningRate),rt(H(c,G(Be(m),this.epsilon)))),d=G(F(u,this.momentum),f);l.assign(c),p.assign(m),u.assign(d);let g=H(s,d);s.assign(g)}else{let p=G(F(l,this.decay),F(Be(a),1-this.decay)),m=G(F(u,this.momentum),Z(F(a,this.learningRate),rt(G(p,this.epsilon))));l.assign(p),u.assign(m);let f=H(s,m);s.assign(f)}})}),this.incrementIterations()}dispose(){this.accumulatedMeanSquares!=null&&Ie(this.accumulatedMeanSquares.map(e=>e.variable)),this.accumulatedMeanGrads!=null&&this.centered&&Ie(this.accumulatedMeanGrads.map(e=>e.variable)),this.accumulatedMoments!=null&&Ie(this.accumulatedMoments.map(e=>e.variable))}async getWeights(){let e=[...this.accumulatedMeanSquares,...this.accumulatedMoments];return this.centered&&e.push(...this.accumulatedMeanGrads),[await this.saveIterations()].concat(e.map(t=>({name:t.originalName,tensor:t.variable})))}async setWeights(e){e=await this.extractIterations(e);let t=this.centered?e.length/3:e.length/2,o=!1;this.accumulatedMeanSquares=e.slice(0,t).map(n=>({originalName:n.name,variable:n.tensor.variable(o)})),this.accumulatedMoments=e.slice(t,t*2).map(n=>({originalName:n.name,variable:n.tensor.variable(o)})),this.centered&&(this.accumulatedMeanGrads=e.slice(t*2,t*3).map(n=>({originalName:n.name,variable:n.tensor.variable(o)})))}getConfig(){return{learningRate:this.learningRate,decay:this.decay,momentum:this.momentum,epsilon:this.epsilon,centered:this.centered}}static fromConfig(e,t){return new e(t.learningRate,t.decay,t.momentum,t.epsilon,t.centered)}};nn.className="RMSProp";ut(nn);var Yt=class{static sgd(e){return new Dr(e)}static momentum(e,t,o=!1){return new on(e,t,o)}static rmsprop(e,t=.9,o=0,n=null,s=!1){return new nn(e,t,o,n,s)}static adam(e=.001,t=.9,o=.999,n=null){return new tn(e,t,o,n)}static adadelta(e=.001,t=.95,o=null){return new Jo(e,t,o)}static adamax(e=.002,t=.9,o=.999,n=null,s=0){return new rn(e,t,o,n,s)}static adagrad(e,t=.1){return new en(e,t)}};var _A={sgd:Yt.sgd,momentum:Yt.momentum,adadelta:Yt.adadelta,adagrad:Yt.adagrad,rmsprop:Yt.rmsprop,adamax:Yt.adamax,adam:Yt.adam};var wA=(()=>typeof requestAnimationFrame!="undefined"?requestAnimationFrame:typeof setImmediate!="undefined"?setImmediate:r=>r())();function Au(){return new Promise(r=>wA(()=>r()))}var N={};re(N,{ERF_A1:()=>BA,ERF_A2:()=>MA,ERF_A3:()=>VA,ERF_A4:()=>GA,ERF_A5:()=>zA,ERF_P:()=>LA,PARALLELIZE_THRESHOLD:()=>Ru,RowPartitionType:()=>mr,SELU_SCALE:()=>PA,SELU_SCALEALPHA:()=>OA,applyActivation:()=>Qo,assertAndGetBroadcastShape:()=>ae,assertAxesAreInnerMostDims:()=>lI,assertParamsConsistent:()=>vA,assignToTypedArray:()=>KA,axesAreInnerMostDims:()=>Rm,calculateShapes:()=>tb,checkEinsumDimSizes:()=>eR,checkPadOnDimRoundingMode:()=>$e,combineLocations:()=>yb,combineRaggedTensorToTensorShapes:()=>CA,complexWithEvenIndex:()=>jA,complexWithOddIndex:()=>HA,computeConv2DInfo:()=>Go,computeConv3DInfo:()=>db,computeDefaultPad:()=>om,computeDilation2DInfo:()=>uE,computeOptimalWindowSize:()=>EA,computeOutAndReduceShapes:()=>aI,computeOutShape:()=>TA,computePool2DInfo:()=>rm,computePool3DInfo:()=>cE,convertConv2DDataFormat:()=>hb,decodeEinsumEquation:()=>ZA,eitherStridesOrDilationsAreOne:()=>Xe,expandShapeToKeepDim:()=>Er,exponent:()=>YA,exponents:()=>XA,fromStringArrayToUint8:()=>wR,fromUint8ToStringArray:()=>_R,getAxesPermutation:()=>uI,getBroadcastDims:()=>Zy,getComplexWithIndex:()=>qA,getEinsumComputePath:()=>tR,getEinsumPermutation:()=>JA,getFusedBiasGradient:()=>Yo,getFusedDyActivation:()=>Xo,getImageCenter:()=>IA,getInnerMostAxes:()=>pI,getPermuted:()=>AA,getRaggedRank:()=>NA,getReductionAxes:()=>fu,getReshaped:()=>$A,getReshapedPermuted:()=>RA,getRowPartitionTypesHelper:()=>kA,getSliceBeginCoords:()=>DA,getSliceSize:()=>FA,getSparseFillEmptyRowsIndicesDenseShapeMismatch:()=>sR,getSparseFillEmptyRowsNegativeIndexErrorMessage:()=>iR,getSparseFillEmptyRowsOutOfRangeIndexErrorMessage:()=>aR,getSparseReshapeEmptyTensorZeroOutputDimErrorMessage:()=>cR,getSparseReshapeInputOutputMismatchErrorMessage:()=>mR,getSparseReshapeInputOutputMultipleErrorMessage:()=>pR,getSparseReshapeMultipleNegativeOneOutputDimErrorMessage:()=>lR,getSparseReshapeNegativeOutputDimErrorMessage:()=>uR,getSparseSegmentReductionIndicesOutOfRangeErrorMessage:()=>gR,getSparseSegmentReductionNegativeSegmentIdsErrorMessage:()=>fR,getSparseSegmentReductionNonIncreasingSegmentIdsErrorMessage:()=>dR,getSparseSegmentReductionSegmentIdOutOfRangeErrorMessage:()=>hR,getUndoAxesPermutation:()=>cI,isIdentityPermutation:()=>rR,log:()=>sN,mergeRealAndImagArrays:()=>UA,prepareAndValidate:()=>eb,prepareSplitSize:()=>nR,segment_util:()=>Qf,shouldFuse:()=>Zo,slice_util:()=>tt,splitRealAndImagArrays:()=>WA,tupleValuesAreOne:()=>Uo,upcastType:()=>Ge,validateDefaultValueShape:()=>SA,validateInput:()=>du,validateUpdateShape:()=>Pp,warn:()=>sr});function vA(r,e){let t=r[0].length;r.forEach((n,s)=>{v(n.length===t,()=>`Error in concat${t}D: rank of tensors[${s}] must be the same as the rank of the rest (${t})`)}),v(e>=0&&e<t,()=>`Error in concat${t}D: axis must be between 0 and ${t-1}.`);let o=r[0];r.forEach((n,s)=>{for(let i=0;i<t;i++)v(i===e||n[i]===o[i],()=>`Error in concat${t}D: Shape of tensors[${s}] (${n}) does not match the shape of the rest (${o}) along the non-concatenated axis ${s}.`)})}function TA(r,e){let t=r[0].slice();for(let o=1;o<r.length;o++)t[e]+=r[o][e];return t}var mr;(function(r){r[r.FIRST_DIM_SIZE=0]="FIRST_DIM_SIZE",r[r.VALUE_ROWIDS=1]="VALUE_ROWIDS",r[r.ROW_LENGTHS=2]="ROW_LENGTHS",r[r.ROW_SPLITS=3]="ROW_SPLITS",r[r.ROW_LIMITS=4]="ROW_LIMITS",r[r.ROW_STARTS=5]="ROW_STARTS"})(mr||(mr={}));function CA(r,e,t){let o=new Array;if(t==null&&e==null)return o;if(e==null)for(;o.length<r+t.length;)o.push(-1);else o=e.slice();if(t==null)return o;if(r+t.length!==o.length)throw new Error(`rt input.shape and shape=${e} are incompatible: rt input.rank = ${r+t.length}, but shape.rank = ${o.length}`);for(let n=1;n<t.length;++n){let s=t[n],i=o[o.length-t.length+n],a=o[i];if(s>=0)if(a>=0){if(a!==s)throw new Error(`rt input.shape and shape=${e} are incompatible: rt input.shape[${n+r}] = ${s} but shape[${n+r}] = ${a}`)}else o[i]=s}return o}function kA(r){let e={FIRST_DIM_SIZE:mr.FIRST_DIM_SIZE,VALUE_ROWIDS:mr.VALUE_ROWIDS,ROW_LENGTHS:mr.ROW_LENGTHS,ROW_SPLITS:mr.ROW_SPLITS,ROW_LIMITS:mr.ROW_LIMITS,ROW_STARTS:mr.ROW_STARTS},t=[];for(let o of r)if(o in e)t.push(e[o]);else break;return t}function NA(r){return r.length===0?0:r[0]===mr.FIRST_DIM_SIZE?r.length-1:r.length}function SA(r,e){if(r==null||e==null)return;let t=r.length,o=e.length;if(t>=o)throw new Error(`defaultValue.shape=${r} and ragged tensor flatValues.shape=${e}, are incompatible: defaultValue.rank = ${t} must be less than ragged tensor input flatValues.rank = ${o})`);for(let n=0;n<Math.min(t,o-1);++n){let s=r[n],i=e[n+1];if(s>=0&&i>=0&&s!==1&&s!==i)throw new Error(`defaultValue.shape=${r}, and ragged tensor input flatValues.shape=${e} are incompatible: defaultValue.shape[${n-r.length}] = ${s} but ragged tensor input.flatValues.shape[${n-r.length}] = ${i}`)}}var Ru=30;function EA(r){return r<=Ru?r:wn(r,Math.floor(Math.sqrt(r)))}function IA(r,e,t){let o=t*(typeof r=="number"?r:r[0]),n=e*(typeof r=="number"?r:r[1]);return[o,n]}function $A(r,e,t,o=!0){let n=[];if(o)n=n.concat(e.slice(0)),n.push(r[0]/t),n=n.concat(r.slice(1));else{n=n.concat(r[0]);let s=e.length;for(let i=0;i<s;++i)n=n.concat([r[i+1]/e[i],e[i]]);n=n.concat(r.slice(s+1))}return n}function AA(r,e,t=!0){let o=[];if(t){o.push(e);for(let n=e+1;n<r;++n)n<=2*e?(o.push(n),o.push(n-(e+1))):o.push(n)}else{let n=[],s=[];for(let i=1;i<r;++i)i>=e*2+1||i%2==1?s.push(i):n.push(i);o.push(...n),o.push(0),o.push(...s)}return o}function RA(r,e,t,o=!0){let n=[];o?n.push(r[0]/t):n.push(r[0]*t);for(let s=1;s<r.length;++s)s<=e.length?o?n.push(e[s-1]*r[s]):n.push(r[s]/e[s-1]):n.push(r[s]);return n}function DA(r,e){let t=[0];for(let o=0;o<e;++o)t.push(r[o][0]);return t}function FA(r,e,t){let o=r.slice(0,1);for(let n=0;n<t;++n)o.push(r[n+1]-e[n][0]-e[n][1]);return o}var OA=1.7580993408473768,PA=1.0507009873554805;var LA=.3275911,BA=.254829592,MA=-.284496736,VA=1.421413741,GA=-1.453152027,zA=1.061405429;function UA(r,e){if(r.length!==e.length)throw new Error(`Cannot merge real and imag arrays of different lengths. real:${r.length}, imag: ${e.length}.`);let t=new Float32Array(r.length*2);for(let o=0;o<t.length;o+=2)t[o]=r[o/2],t[o+1]=e[o/2];return t}function WA(r){let e=new Float32Array(r.length/2),t=new Float32Array(r.length/2);for(let o=0;o<r.length;o+=2)e[o/2]=r[o],t[o/2]=r[o+1];return{real:e,imag:t}}function jA(r){let e=Math.ceil(r.length/4),t=new Float32Array(e),o=new Float32Array(e);for(let n=0;n<r.length;n+=4)t[Math.floor(n/4)]=r[n],o[Math.floor(n/4)]=r[n+1];return{real:t,imag:o}}function HA(r){let e=Math.floor(r.length/4),t=new Float32Array(e),o=new Float32Array(e);for(let n=2;n<r.length;n+=4)t[Math.floor(n/4)]=r[n],o[Math.floor(n/4)]=r[n+1];return{real:t,imag:o}}function qA(r,e){let t=r[e*2],o=r[e*2+1];return{real:t,imag:o}}function KA(r,e,t,o){r[o*2]=e,r[o*2+1]=t}function XA(r,e){let t=new Float32Array(r/2),o=new Float32Array(r/2);for(let n=0;n<Math.ceil(r/2);n++){let s=(e?2:-2)*Math.PI*(n/r);t[n]=Math.cos(s),o[n]=Math.sin(s)}return{real:t,imag:o}}function YA(r,e,t){let o=(t?2:-2)*Math.PI*(r/e),n=Math.cos(o),s=Math.sin(o);return{real:n,imag:s}}var Yf="->",QA=/->/g,j_=",",H_="...";function ZA(r,e){r=r.replace(/\s/g,"");let t=(r.length-r.replace(QA,"").length)/Yf.length;if(t<1)throw new Error("Equations without an arrow are not supported.");if(t>1)throw new Error(`Equation must contain exactly one arrow ("${Yf}").`);let[o,n]=r.split(Yf);v(o.indexOf(H_)===-1,()=>`The ellipsis notation ("${H_}") is not supported yet.`);let s=o.split(j_),i=s.length;if(e!==i)throw new Error(`Expected ${i} input tensors, received ${e}`);if(i>2)throw new Error("Support for more than 2 input tensors is not implemented yet.");let a=[];for(let m=0;m<n.length;++m){let f=n[m];if(!s.some(d=>d.indexOf(f)!==-1))throw new Error(`Output subscripts contain the label ${f} not present in the input subscripts.`);a.indexOf(f)===-1&&a.push(f)}for(let m=0;m<o.length;++m){let f=o[m];a.indexOf(f)===-1&&f!==j_&&a.push(f)}let l=new Array(s.length);for(let m=0;m<i;++m){if(new Set(s[m].split("")).size!==s[m].length)throw new Error(`Found duplicate axes in input component ${s[m]}. Support for duplicate axes in input is not implemented yet.`);l[m]=[];for(let f=0;f<s[m].length;++f)l[m].push(a.indexOf(s[m][f]))}let u=a.length,c=n.length,p=[];for(let m=c;m<u;++m)p.push(m);return{allDims:a,summedDims:p,idDims:l}}function JA(r,e){let t=new Array(r);t.fill(-1);for(let n=0;n<e.length;++n)t[e[n]]=n;let o=[];for(let n=0;n<r;++n)t[n]===-1&&o.push(n);return t=t.filter(n=>n!==-1),{permutationIndices:t,expandDims:o}}function eR(r,e,t){let o=new Array(r);for(let n=0;n<t.length;++n){let s=t[n].shape;for(let i=0;i<e[n].length;++i)o[e[n][i]]===void 0?o[e[n][i]]=s[i]:v(o[e[n][i]]===s[i],()=>`Expected dimension ${o[e[n][i]]} at axis ${i} of input shaped ${JSON.stringify(s)}, but got dimension ${s[i]}`)}}function tR(r,e){let t=r,o=[],n=0;r.length===0&&t.push(-1),n=r.length+1;for(let i=0;i<n;++i)o.push([]);let s=[];for(let i=0;i<t.length;++i){let a=t[i],l=oR(e,a);for(let u of l)s.indexOf(u)===-1&&(o[i].push(u),s.push(u))}return{path:t,steps:o}}function rR(r){return r.every((e,t)=>e===t)}function oR(r,e){let t=[];for(let o=0;o<r.length;++o)(r[o].length===0||r[o].indexOf(e)!==-1||e===-1)&&t.push(o);return t}function nR(r,e,t=0){let o=[];if(typeof e=="number")v(r.shape[t]%e==0,()=>"Number of splits must evenly divide the axis."),o=new Array(e).fill(r.shape[t]/e);else{let n=e.reduce((i,a)=>(a===-1&&(i+=1),i),0);v(n<=1,()=>"There should be only one negative value in split array.");let s=e.indexOf(-1);if(s!==-1){let i=e.reduce((a,l)=>l>0?a+l:a);e[s]=r.shape[t]-i}v(r.shape[t]===e.reduce((i,a)=>i+a),()=>"The sum of sizes must match the size of the axis dimension."),o=e}return o}function sR(r){return`Received SparseTensor with denseShape[0] = 0 but
  indices.shape[0] = ${r}`}function iR(r,e){return`indices(${r}, 0) is invalid: ${e} < 0`}function aR(r,e,t){return`indices(${r}, 0) is invalid: ${e} >= ${t}`}function lR(r,e){return`only one output dimension may be -1, not both ${r} and ${e}`}function uR(r,e){return`size ${r} must be non-negative, not ${e}`}function cR(){return"reshape cannot infer the missing input size for an empty tensor unless all specified input sizes are non-zero"}function pR(r,e){let t=ne(r),o=ne(e);return`Input to reshape is a SparseTensor with ${t}
  dense values, but the requested shape requires a multiple of ${o}. inputShape=${r} outputShape= ${e}`}function mR(r,e){let t=ne(r),o=ne(e);return`Input to reshape is a tensor with ${t} dense values, but the requested shape has ${o}. inputShape=${r} outputShape=${e}`}function fR(){return"segment ids must be >= 0"}function dR(){return"segment ids are not increasing"}function hR(r,e){return`Segment id ${r} out of range [0, ${e}), possibly because segmentIds input is not sorted.`}function gR(r,e,t){return`Bad: indices[${r}] == ${e} out of range [0, ${t})`}var Qf={};re(Qf,{collectGatherOpShapeInfo:()=>bR,computeOutShape:()=>yR,segOpComputeOptimalWindowSize:()=>xR});function xR(r,e){let t=!1,o;for(r<=Ru?(o=r,t=!0):o=wn(r,Math.floor(Math.sqrt(r)));!t;)o>e||o===r?t=!0:o=wn(r,o+1);return o}function yR(r,e,t){let o=[],n=r.length;for(let s=0;s<n;s++)s!==e?o.push(r[s]):o.push(t);return o}function bR(r,e,t,o){let n=e.shape.length,s=r.shape.length;if(o!==0&&(o<-n||o>n))throw new Error(`Expect batchDims in the range of [-${n}, ${n}], but got ${o}`);if(o<0&&(o+=n),o>s)throw new Error(`batchDims (${o}) must be less than rank(x) (
    ${s}).`);if(t<o)throw new Error(`batchDims (${o}) must be less than or equal to axis (${t}).`);for(let p=0;p<o;++p)if(r.shape[p]!==e.shape[p])throw new Error(`x.shape[${p}]: ${r.shape[p]} should be equal to indices.shape[${p}]: ${e.shape[p]}.`);let i=r.shape[t],a=[],l=1,u=1,c=1;for(let p=0;p<o;++p)a.push(r.shape[p]),l*=r.shape[p];for(let p=o;p<t;p++)a.push(r.shape[p]),u*=r.shape[p];for(let p=o;p<n;p++)a.push(e.shape[p]);for(let p=t+1;p<s;p++)a.push(r.shape[p]),c*=r.shape[p];return{batchSize:l,sliceSize:c,outerSize:u,dimSize:i,outputShape:a}}function _R(r){try{return r.map(e=>Bn(e))}catch(e){throw new Error(`Failed to decode encoded string bytes into utf-8, error: ${e}`)}}function wR(r){return r.map(e=>Wr(e))}var Qt={};re(Qt,{nonMaxSuppressionV3Impl:()=>Eu,nonMaxSuppressionV4Impl:()=>Iu,nonMaxSuppressionV5Impl:()=>$u,whereImpl:()=>Tu});var qg={};re(qg,{GPGPUContext:()=>cn,MathBackendWebGL:()=>oo,forceHalfFloat:()=>gh,gpgpu_util:()=>Wd,setWebGLContext:()=>Fu,version_webgl:()=>W0,webgl:()=>MD,webgl_util:()=>_d});var _d={};re(_d,{assertNotComplex:()=>Zt,bindCanvasToFramebuffer:()=>$R,bindColorTextureToFramebuffer:()=>Sl,bindTextureToProgramUniformSampler:()=>pd,bindTextureUnit:()=>Y_,bindVertexBufferToProgramAttribute:()=>Pu,callAndCheck:()=>V,canBeRepresented:()=>Jf,createFragmentShader:()=>td,createFramebuffer:()=>ld,createProgram:()=>rd,createStaticIndexBuffer:()=>sd,createStaticVertexBuffer:()=>nd,createTexture:()=>id,createVertexShader:()=>ed,getBatchDim:()=>Or,getExtensionOrThrow:()=>Jn,getFramebufferErrorMessage:()=>Q_,getMaxTexturesInShader:()=>dd,getNumChannels:()=>ER,getProgramUniformLocation:()=>cd,getProgramUniformLocationOrThrow:()=>ud,getRowsCols:()=>Pr,getShapeAs3D:()=>El,getTextureShapeFromLogicalShape:()=>md,getWebGLDisjointQueryTimerVersion:()=>hd,getWebGLErrorMessage:()=>X_,getWebGLMaxTextureSize:()=>fd,hasExtension:()=>bt,isCapableOfRenderingToFloatTexture:()=>gd,isDownloadFloatTextureEnabled:()=>xd,isReshapeFree:()=>ro,isWebGLFenceEnabled:()=>bd,isWebGLVersionEnabled:()=>Gu,linkProgram:()=>od,logShaderSourceAndInfoLog:()=>Ou,resetMaxTextureSize:()=>AR,resetMaxTexturesInShader:()=>RR,unbindColorTextureFromFramebuffer:()=>Lu,unbindTextureUnit:()=>IR,validateFramebuffer:()=>es,validateProgram:()=>Nl,validateTextureSize:()=>ad});var sn={},Du={alpha:!1,antialias:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1,depth:!1,stencil:!1,failIfMajorPerformanceCaveat:!0};function Fu(r,e){sn[r]=e}function yt(r,e){if(!(r in sn)||e!=null){let o=TR(r,e);if(o!==null)sn[r]=o;else return console.log("Could not get context for WebGL version",r),null}let t=sn[r];return t==null||t.isContextLost()?(delete sn[r],yt(r)):(t.disable(t.DEPTH_TEST),t.disable(t.STENCIL_TEST),t.disable(t.BLEND),t.disable(t.DITHER),t.disable(t.POLYGON_OFFSET_FILL),t.disable(t.SAMPLE_COVERAGE),t.enable(t.SCISSOR_TEST),t.enable(t.CULL_FACE),t.cullFace(t.BACK),sn[r])}function vR(r){if(typeof OffscreenCanvas!="undefined"&&r===2)return new OffscreenCanvas(300,150);if(typeof document!="undefined")return document.createElement("canvas");throw new Error("Cannot create a canvas in this context")}function TR(r,e){if(r!==1&&r!==2)throw new Error("Cannot get WebGL rendering context, WebGL is disabled.");let t=e==null?vR(r):e;return t.addEventListener("webglcontextlost",o=>{o.preventDefault(),delete sn[r]},!1),E().getBool("SOFTWARE_WEBGL_ENABLED")&&(Du.failIfMajorPerformanceCaveat=!1),r===1?t.getContext("webgl",Du)||t.getContext("experimental-webgl",Du):t.getContext("webgl2",Du)}var to;(function(r){r[r.DENSE=0]="DENSE",r[r.SHARED_BATCH=1]="SHARED_BATCH"})(to||(to={}));var je;(function(r){r[r.RENDER=0]="RENDER",r[r.UPLOAD=1]="UPLOAD",r[r.PIXELS=2]="PIXELS",r[r.DOWNLOAD=3]="DOWNLOAD"})(je||(je={}));var Ve;(function(r){r[r.UNPACKED_FLOAT16=0]="UNPACKED_FLOAT16",r[r.UNPACKED_FLOAT32=1]="UNPACKED_FLOAT32",r[r.PACKED_4X1_UNSIGNED_BYTE=2]="PACKED_4X1_UNSIGNED_BYTE",r[r.PACKED_2X2_FLOAT32=3]="PACKED_2X2_FLOAT32",r[r.PACKED_2X2_FLOAT16=4]="PACKED_2X2_FLOAT16"})(Ve||(Ve={}));function an(r,e){return[e,r]}function q_(r,e){return r*e}function Cl(r){let e=C.sizeFromShape(r),t=Math.ceil(e/4);return C.sizeToSquarishShape(t)}function fr(r,e){return[Math.max(1,Math.ceil(e/2)),Math.max(1,Math.ceil(r/2))]}function K_(r,e){let[t,o]=fr(r,e);return t*o*4}function kl(r,e){let t=r,o,n,s,i,a,l,u,c,p,m;return E().getNumber("WEBGL_VERSION")===2?(o=t.R32F,n=t.R16F,s=t.RGBA16F,i=t.RGBA32F,a=t.RED,u=4,c=1,p=t.HALF_FLOAT,m=t.FLOAT,l=t.RGBA8):(o=r.RGBA,n=r.RGBA,s=r.RGBA,i=t.RGBA,a=r.RGBA,u=4,c=4,p=e!=null?e.HALF_FLOAT_OES:null,m=r.FLOAT,l=r.RGBA),{internalFormatFloat:o,internalFormatHalfFloat:n,internalFormatPackedHalfFloat:s,internalFormatPackedFloat:i,textureFormatFloat:a,downloadTextureFormat:l,downloadUnpackNumChannels:u,defaultNumChannels:c,textureTypeHalfFloat:p,textureTypeFloat:m}}function V(r,e){let t=e();return E().getBool("DEBUG")&&CR(r),t}function CR(r){let e=r.getError();if(e!==r.NO_ERROR)throw new Error("WebGL Error: "+X_(r,e))}var kR=596e-10,NR=65504;function Jf(r){return!!(E().getBool("WEBGL_RENDER_FLOAT32_ENABLED")||r===0||kR<Math.abs(r)&&Math.abs(r)<NR)}function X_(r,e){switch(e){case r.NO_ERROR:return"NO_ERROR";case r.INVALID_ENUM:return"INVALID_ENUM";case r.INVALID_VALUE:return"INVALID_VALUE";case r.INVALID_OPERATION:return"INVALID_OPERATION";case r.INVALID_FRAMEBUFFER_OPERATION:return"INVALID_FRAMEBUFFER_OPERATION";case r.OUT_OF_MEMORY:return"OUT_OF_MEMORY";case r.CONTEXT_LOST_WEBGL:return"CONTEXT_LOST_WEBGL";default:return`Unknown error code ${e}`}}function Jn(r,e){return Fr(r,()=>r.getExtension(e),'Extension "'+e+'" not supported on this browser.')}function ed(r,e){let t=Fr(r,()=>r.createShader(r.VERTEX_SHADER),"Unable to create vertex WebGLShader.");if(V(r,()=>r.shaderSource(t,e)),V(r,()=>r.compileShader(t)),r.getShaderParameter(t,r.COMPILE_STATUS)===!1)throw console.log(r.getShaderInfoLog(t)),new Error("Failed to compile vertex shader.");return t}function td(r,e){let t=Fr(r,()=>r.createShader(r.FRAGMENT_SHADER),"Unable to create fragment WebGLShader.");if(V(r,()=>r.shaderSource(t,e)),V(r,()=>r.compileShader(t)),E().get("ENGINE_COMPILE_ONLY"))return t;if(r.getShaderParameter(t,r.COMPILE_STATUS)===!1)throw Ou(e,r.getShaderInfoLog(t)),new Error("Failed to compile fragment shader.");return t}var SR=/ERROR: [0-9]+:([0-9]+):/g;function Ou(r,e){let t=SR.exec(e);if(t==null){console.log(`Couldn't parse line number in error: ${e}`),console.log(r);return}let o=+t[1],n=r.split(`
`),s=n.length.toString().length+2,i=n.map((p,m)=>C.rightPad((m+1).toString(),s)+p),a=0;for(let p=0;p<i.length;p++)a=Math.max(i[p].length,a);let l=i.slice(0,o-1),u=i.slice(o-1,o),c=i.slice(o);console.log(l.join(`
`)),console.log(e.split(`
`)[0]),console.log(`%c ${C.rightPad(u[0],a)}`,"border:1px solid red; background-color:#e3d2d2; color:#a61717"),console.log(c.join(`
`))}function rd(r){return Fr(r,()=>r.createProgram(),"Unable to create WebGLProgram.")}function od(r,e){if(V(r,()=>r.linkProgram(e)),!E().get("ENGINE_COMPILE_ONLY")&&r.getProgramParameter(e,r.LINK_STATUS)===!1)throw console.log(r.getProgramInfoLog(e)),new Error("Failed to link vertex and fragment shaders.")}function Nl(r,e){if(V(r,()=>r.validateProgram(e)),r.getProgramParameter(e,r.VALIDATE_STATUS)===!1)throw console.log(r.getProgramInfoLog(e)),new Error("Shader program validation failed.")}function nd(r,e){let t=Fr(r,()=>r.createBuffer(),"Unable to create WebGLBuffer");return V(r,()=>r.bindBuffer(r.ARRAY_BUFFER,t)),V(r,()=>r.bufferData(r.ARRAY_BUFFER,e,r.STATIC_DRAW)),t}function sd(r,e){let t=Fr(r,()=>r.createBuffer(),"Unable to create WebGLBuffer");return V(r,()=>r.bindBuffer(r.ELEMENT_ARRAY_BUFFER,t)),V(r,()=>r.bufferData(r.ELEMENT_ARRAY_BUFFER,e,r.STATIC_DRAW)),t}function ER(){return E().getNumber("WEBGL_VERSION")===2?1:4}function id(r){return Fr(r,()=>r.createTexture(),"Unable to create WebGLTexture.")}function ad(r,e){let t=E().getNumber("WEBGL_MAX_TEXTURE_SIZE");if(r<=0||e<=0){let o=`[${r}x${e}]`;throw new Error("Requested texture size "+o+" is invalid.")}if(r>t||e>t){let o=`[${r}x${e}]`,n=`[${t}x${t}]`;throw new Error("Requested texture size "+o+" greater than WebGL maximum on this browser / GPU "+n+".")}}function ld(r){return Fr(r,()=>r.createFramebuffer(),"Unable to create WebGLFramebuffer.")}function Pu(r,e,t,o,n,s,i){let a=r.getAttribLocation(e,t);return a===-1?!1:(V(r,()=>r.bindBuffer(r.ARRAY_BUFFER,o)),V(r,()=>r.vertexAttribPointer(a,n,r.FLOAT,!1,s,i)),V(r,()=>r.enableVertexAttribArray(a)),!0)}function Y_(r,e,t){Z_(r,t),V(r,()=>r.activeTexture(r.TEXTURE0+t)),V(r,()=>r.bindTexture(r.TEXTURE_2D,e))}function IR(r,e){Z_(r,e),V(r,()=>r.activeTexture(r.TEXTURE0+e)),V(r,()=>r.bindTexture(r.TEXTURE_2D,null))}function ud(r,e,t){return Fr(r,()=>r.getUniformLocation(e,t),'uniform "'+t+'" not present in program.')}function cd(r,e,t){return r.getUniformLocation(e,t)}function pd(r,e,t,o){V(r,()=>Y_(r,e,o)),V(r,()=>r.uniform1i(t,o))}function $R(r){V(r,()=>r.bindFramebuffer(r.FRAMEBUFFER,null)),V(r,()=>r.viewport(0,0,r.canvas.width,r.canvas.height)),V(r,()=>r.scissor(0,0,r.canvas.width,r.canvas.height))}function Sl(r,e,t){V(r,()=>r.bindFramebuffer(r.FRAMEBUFFER,t)),V(r,()=>r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,e,0))}function Lu(r,e){V(r,()=>r.bindFramebuffer(r.FRAMEBUFFER,e)),V(r,()=>r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,null,0))}function es(r){let e=r.checkFramebufferStatus(r.FRAMEBUFFER);if(e!==r.FRAMEBUFFER_COMPLETE)throw new Error("Error binding framebuffer: "+Q_(r,e))}function Q_(r,e){switch(e){case r.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:return"FRAMEBUFFER_INCOMPLETE_ATTACHMENT";case r.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:return"FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";case r.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:return"FRAMEBUFFER_INCOMPLETE_DIMENSIONS";case r.FRAMEBUFFER_UNSUPPORTED:return"FRAMEBUFFER_UNSUPPORTED";default:return`unknown error ${e}`}}function Fr(r,e,t){let o=V(r,()=>e());if(o==null)throw new Error(t);return o}function Z_(r,e){let t=r.MAX_COMBINED_TEXTURE_IMAGE_UNITS-1,o=e+r.TEXTURE0;if(o<r.TEXTURE0||o>t){let n=`[gl.TEXTURE0, gl.TEXTURE${t}]`;throw new Error(`textureUnit must be in ${n}.`)}}function Or(r,e=2){return C.sizeFromShape(r.slice(0,r.length-e))}function Pr(r){if(r.length===0)throw Error("Cannot get rows and columns of an empty shape array.");return[r.length>1?r[r.length-2]:1,r[r.length-1]]}function El(r){let e=[1,1,1];return r.length===0||r.length===1&&r[0]===1||(e=[Or(r),...Pr(r)]),e}function md(r,e=!1){let t=E().getNumber("WEBGL_MAX_TEXTURE_SIZE"),o=E().getNumber("WEBGL_MAX_SIZE_FOR_NARROW_TEXTURE");o===Infinity&&E().getBool("WEBGL_AUTO_SQUARIFY_NARROW_TEXTURE_SHAPE")&&(o=t/2),e&&(t=t*2,o=o*2,r=r.map((a,l)=>l>=r.length-2?C.nearestLargerEven(r[l]):r[l]),r.length===1&&(r=[2,r[0]])),r.length!==2&&(r=C.squeezeShape(r).newShape);let n=C.sizeFromShape(r),s=null;r.length<=1&&n<=t?s=[1,n]:r.length===2&&r[0]<=t&&r[1]<=t?s=r:r.length===3&&r[0]*r[1]<=t&&r[2]<=t?s=[r[0]*r[1],r[2]]:r.length===3&&r[0]<=t&&r[1]*r[2]<=t?s=[r[0],r[1]*r[2]]:r.length===4&&r[0]*r[1]*r[2]<=t&&r[3]<=t?s=[r[0]*r[1]*r[2],r[3]]:r.length===4&&r[0]<=t&&r[1]*r[2]*r[3]<=t&&(s=[r[0],r[1]*r[2]*r[3]]);let i=s!=null&&Math.max(...s)>o&&Math.min(...s)<=(e?2:1)&&Math.min(...s)>0;if(s==null||i)if(e){let a=Or(r),l=2,u=2;r.length&&([l,u]=Pr(r)),n=a*(l/2)*(u/2),s=C.sizeToSquarishShape(n).map(c=>c*2)}else s=C.sizeToSquarishShape(n);return s}function Bu(r){return r%2==0}function ro(r,e){if(r=r.slice(-2),e=e.slice(-2),C.arraysEqual(r,e)||!r.length||!e.length||r[0]===0||r[1]===0||e[0]===0||e[1]===0)return!0;if(r.length!==e.length){let t=r.slice(-1)[0],o=e.slice(-1)[0];if(t===o||Bu(t)&&Bu(o)&&(r[0]===1||e[0]===1))return!0}return r[1]===e[1]&&Bu(r[0])&&Bu(e[0])}var Mu,Vu;function fd(r){if(Mu==null){let e=yt(r);Mu=e.getParameter(e.MAX_TEXTURE_SIZE)}return Mu}function AR(){Mu=null}function RR(){Vu=null}function dd(r){if(Vu==null){let e=yt(r);Vu=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS)}return Math.min(16,Vu)}function hd(r){if(r===0)return 0;let e,t=yt(r);return bt(t,"EXT_disjoint_timer_query_webgl2")&&r===2?e=2:bt(t,"EXT_disjoint_timer_query")?e=1:e=0,e}function bt(r,e){return r.getExtension(e)!=null}function Gu(r){try{if(yt(r)!=null)return!0}catch(e){return console.log("Error when getting WebGL context: ",e),!1}return!1}function gd(r){if(r===0)return!1;let e=yt(r);if(r===1){if(!bt(e,"OES_texture_float"))return!1}else if(!bt(e,"EXT_color_buffer_float"))return!1;return yd(e)}function xd(r){if(r===0)return!1;let e=yt(r);if(r===1){if(!bt(e,"OES_texture_float")||!bt(e,"WEBGL_color_buffer_float"))return!1}else{if(bt(e,"EXT_color_buffer_float"))return yd(e);let o="EXT_color_buffer_half_float";if(bt(e,o)){let n=e.getExtension(o);return DR(e,n)}return!1}return yd(e)}function yd(r){let e=kl(r),t=r.createTexture();r.bindTexture(r.TEXTURE_2D,t);let o=1,n=1;r.texImage2D(r.TEXTURE_2D,0,e.internalFormatFloat,o,n,0,e.textureFormatFloat,e.textureTypeFloat,null);let s=r.createFramebuffer();r.bindFramebuffer(r.FRAMEBUFFER,s),r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,t,0);let i=r.checkFramebufferStatus(r.FRAMEBUFFER)===r.FRAMEBUFFER_COMPLETE;return r.bindTexture(r.TEXTURE_2D,null),r.bindFramebuffer(r.FRAMEBUFFER,null),r.deleteTexture(t),r.deleteFramebuffer(s),i}function DR(r,e){let t=kl(r,e),o=r.createTexture();r.bindTexture(r.TEXTURE_2D,o);let n=1,s=1;r.texImage2D(r.TEXTURE_2D,0,t.internalFormatHalfFloat,n,s,0,t.textureFormatFloat,t.textureTypeHalfFloat,null);let i=r.createFramebuffer();r.bindFramebuffer(r.FRAMEBUFFER,i),r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,o,0);let a=r.checkFramebufferStatus(r.FRAMEBUFFER)===r.FRAMEBUFFER_COMPLETE;return r.bindTexture(r.TEXTURE_2D,null),r.bindFramebuffer(r.FRAMEBUFFER,null),r.deleteTexture(o),r.deleteFramebuffer(i),a}function bd(r){return r!==2?!1:yt(r).fenceSync!=null}function Zt(r,e){Array.isArray(r)||(r=[r]),r.forEach(t=>{t!=null&&C.assert(t.dtype!=="complex64",()=>`${e} does not support complex64 tensors in the WebGL backend.`)})}var q=E();q.registerFlag("HAS_WEBGL",()=>q.getNumber("WEBGL_VERSION")>0);q.registerFlag("WEBGL_VERSION",()=>Gu(2)?2:Gu(1)?1:0);q.registerFlag("WEBGL_CHECK_NUMERICAL_PROBLEMS",()=>!1);q.registerFlag("WEBGL_BUFFER_SUPPORTED",()=>q.get("WEBGL_VERSION")===2);q.registerFlag("WEBGL_CPU_FORWARD",()=>!0);q.registerFlag("WEBGL_FORCE_F16_TEXTURES",()=>!1);q.registerFlag("WEBGL_PACK",()=>q.getBool("HAS_WEBGL"));q.registerFlag("WEBGL_PACK_NORMALIZATION",()=>q.getBool("WEBGL_PACK"));q.registerFlag("WEBGL_PACK_CLIP",()=>q.getBool("WEBGL_PACK"));q.registerFlag("WEBGL_PACK_DEPTHWISECONV",()=>q.getBool("WEBGL_PACK"));q.registerFlag("WEBGL_PACK_BINARY_OPERATIONS",()=>q.getBool("WEBGL_PACK"));q.registerFlag("WEBGL_PACK_UNARY_OPERATIONS",()=>q.getBool("WEBGL_PACK"));q.registerFlag("WEBGL_PACK_ARRAY_OPERATIONS",()=>q.getBool("WEBGL_PACK"));q.registerFlag("WEBGL_PACK_IMAGE_OPERATIONS",()=>q.getBool("WEBGL_PACK"));q.registerFlag("WEBGL_PACK_REDUCE",()=>q.getBool("WEBGL_PACK"));q.registerFlag("WEBGL_LAZILY_UNPACK",()=>q.getBool("WEBGL_PACK"));q.registerFlag("WEBGL_CONV_IM2COL",()=>q.getBool("WEBGL_PACK"));q.registerFlag("WEBGL_MAX_TEXTURE_SIZE",()=>fd(q.getNumber("WEBGL_VERSION")));q.registerFlag("WEBGL_MAX_TEXTURES_IN_SHADER",()=>dd(q.getNumber("WEBGL_VERSION")));q.registerFlag("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION",()=>{let r=q.getNumber("WEBGL_VERSION");return r===0?0:hd(r)});q.registerFlag("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_RELIABLE",()=>q.getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION")>0&&!Hr.isMobile());q.registerFlag("WEBGL_RENDER_FLOAT32_CAPABLE",()=>gd(q.getNumber("WEBGL_VERSION")));q.registerFlag("WEBGL_RENDER_FLOAT32_ENABLED",()=>q.getBool("WEBGL_FORCE_F16_TEXTURES")?!1:q.getBool("WEBGL_RENDER_FLOAT32_CAPABLE"));q.registerFlag("WEBGL_DOWNLOAD_FLOAT_ENABLED",()=>xd(q.getNumber("WEBGL_VERSION")));q.registerFlag("WEBGL_FENCE_API_ENABLED",()=>bd(q.getNumber("WEBGL_VERSION")));q.registerFlag("WEBGL_SIZE_UPLOAD_UNIFORM",()=>q.getBool("WEBGL_RENDER_FLOAT32_ENABLED")?4:0);q.registerFlag("WEBGL_DELETE_TEXTURE_THRESHOLD",()=>-1,r=>{if(r<0&&r!==-1)throw new Error(`WEBGL_DELETE_TEXTURE_THRESHOLD must be -1 (indicating never delete) or at least 0, but got ${r}.`)});q.registerFlag("WEBGL_FLUSH_THRESHOLD",()=>Hr.isMobile()?1:-1,r=>{if(r<0&&r!==-1)throw new Error(`WEBGL_FLUSH_THRESHOLD must be -1 (indicating never manual flush) or at least 0, but got ${r}.`)});q.registerFlag("CPU_HANDOFF_SIZE_THRESHOLD",()=>128);q.registerFlag("WEBGL_USE_SHAPES_UNIFORMS",()=>!1);q.registerFlag("TOPK_LAST_DIM_CPU_HANDOFF_SIZE_THRESHOLD",()=>1e5);q.registerFlag("TOPK_K_CPU_HANDOFF_THRESHOLD",()=>128);q.registerFlag("WEBGL_EXP_CONV",()=>!1);q.registerFlag("SOFTWARE_WEBGL_ENABLED",()=>q.getBool("IS_TEST"));q.registerFlag("WEBGL_MAX_SIZE_FOR_NARROW_TEXTURE",()=>Infinity);q.registerFlag("WEBGL_AUTO_SQUARIFY_NARROW_TEXTURE_SHAPE",()=>!1);q.registerFlag("WEBGL2_ISNAN_CUSTOM",()=>!1);function _e(){let r,e,t,o,n,s,i,a,l,u;return E().getNumber("WEBGL_VERSION")===2?(r="#version 300 es",e="in",t="out",o="in",n="texture",s="outputColor",i="out vec4 outputColor;",a=E().getBool("WEBGL2_ISNAN_CUSTOM")?`
      bool isnan_custom(float val) {
        uint floatToUint = floatBitsToUint(val);
        return (floatToUint & 0x7fffffffu) > 0x7f800000u;
      }

      bvec4 isnan_custom(vec4 val) {
        return bvec4(isnan_custom(val.x),
          isnan_custom(val.y), isnan_custom(val.z), isnan_custom(val.w));
      }

      #define isnan(value) isnan_custom(value)
    `:"",l="",u=`
      #define round(value) newRound(value)
      int newRound(float value) {
        return int(floor(value + 0.5));
      }

      ivec4 newRound(vec4 value) {
        return ivec4(floor(value + vec4(0.5)));
      }
    `):(r="",e="attribute",t="varying",o="varying",n="texture2D",s="gl_FragColor",i="",a=`
      #define isnan(value) isnan_custom(value)
      bool isnan_custom(float val) {
        return (val > 0. || val < 1. || val == 0.) ? false : true;
      }
      bvec4 isnan_custom(vec4 val) {
        return bvec4(isnan(val.x), isnan(val.y), isnan(val.z), isnan(val.w));
      }
    `,l=`
      uniform float INFINITY;

      bool isinf(float val) {
        return abs(val) == INFINITY;
      }
      bvec4 isinf(vec4 val) {
        return equal(abs(val), vec4(INFINITY));
      }
    `,u=`
      int round(float value) {
        return int(floor(value + 0.5));
      }

      ivec4 round(vec4 value) {
        return ivec4(floor(value + vec4(0.5)));
      }
    `),{version:r,attribute:e,varyingVs:t,varyingFs:o,texture2D:n,output:s,defineOutput:i,defineSpecialNaN:a,defineSpecialInf:l,defineRound:u}}function Jt(r,e,t="index"){let o=C.computeStrides(e);return o.map((n,s)=>{let i=`int ${r[s]} = ${t} / ${n}`,a=s===o.length-1?`int ${r[s+1]} = ${t} - ${r[s]} * ${n}`:`index -= ${r[s]} * ${n}`;return`${i}; ${a};`}).join("")}function ln(r,e,t="index"){let o=C.computeStrides(e);return o.map((n,s)=>{let i=`int ${r[s]} = ${t} / outShapeStrides[${s}]`,a=s===o.length-1?`int ${r[s+1]} = ${t} - ${r[s]} * outShapeStrides[${s}]`:`index -= ${r[s]} * outShapeStrides[${s}]`;return`${i}; ${a};`}).join("")}function FR(r,e){let t=r.length,o=r.map(s=>`${e}[${s}]`),n=new Array(t-1);n[t-2]=o[t-1];for(let s=t-3;s>=0;--s)n[s]=`(${n[s+1]} * ${o[s+1]})`;return n}function J_(r,e,t="index"){let o=r.map((s,i)=>i),n=FR(o,e);return n.map((s,i)=>{let a=`int ${r[i]} = ${t} / ${n[i]}`,l=i===n.length-1?`int ${r[i+1]} = ${t} - ${r[i]} * ${n[i]}`:`index -= ${r[i]} * ${n[i]}`;return`${a}; ${l};`}).join("")}function ts(r){let e=C.computeStrides(r).map(t=>t.toString());return`
  int getFlatIndex(ivec3 coords) {
    return coords.x * ${e[0]} + coords.y * ${e[1]} + coords.z;
  }
`}function rs(){return`
  int getFlatIndex(ivec3 coords) {
    return coords.x * outShapeStrides[0] + coords.y * outShapeStrides[1] + coords.z;
  }
`}var zu=`
  const float FLOAT_MAX = 1.70141184e38;
  const float FLOAT_MIN = 1.17549435e-38;

  lowp vec4 encode_float(highp float v) {
    if (isnan(v)) {
      return vec4(255, 255, 255, 255);
    }

    highp float av = abs(v);

    if(av < FLOAT_MIN) {
      return vec4(0.0, 0.0, 0.0, 0.0);
    } else if(v > FLOAT_MAX) {
      return vec4(0.0, 0.0, 128.0, 127.0) / 255.0;
    } else if(v < -FLOAT_MAX) {
      return vec4(0.0, 0.0,  128.0, 255.0) / 255.0;
    }

    highp vec4 c = vec4(0,0,0,0);

    highp float e = floor(log2(av));
    highp float m = exp2(fract(log2(av))) - 1.0;

    c[2] = floor(128.0 * m);
    m -= c[2] / 128.0;
    c[1] = floor(32768.0 * m);
    m -= c[1] / 32768.0;
    c[0] = floor(8388608.0 * m);

    highp float ebias = e + 127.0;
    c[3] = floor(ebias / 2.0);
    ebias -= c[3] * 2.0;
    c[2] += floor(ebias) * 128.0;

    c[3] += 128.0 * step(0.0, -v);

    return c / 255.0;
  }
`;var{getBroadcastDims:ew}=N;function tw(r,e,t){let o=[];if(r.forEach(f=>{let d=C.sizeFromShape(f.shapeInfo.logicalShape);if(f.shapeInfo.isUniform?o.push(`uniform float ${f.name}${d>1?`[${d}]`:""};`):(o.push(`uniform sampler2D ${f.name};`),o.push(`uniform int offset${f.name};`)),t.enableShapeUniforms){let{uniformShape:g}=Uu(t.packedInputs,f.shapeInfo.logicalShape,f.shapeInfo.texShape);switch(g.length){case 1:o.push(`uniform int ${f.name}Shape;`);break;case 2:o.push(`uniform ivec2 ${f.name}Shape;`);break;case 3:o.push(`uniform ivec3 ${f.name}Shape;`);break;case 4:o.push(`uniform ivec4 ${f.name}Shape;`);break;default:break}o.push(`uniform ivec2 ${f.name}TexShape;`)}}),t.enableShapeUniforms){switch(e.logicalShape.length){case 1:o.push("uniform int outShape;");break;case 2:o.push("uniform ivec2 outShape;"),o.push("uniform int outShapeStrides;");break;case 3:o.push("uniform ivec3 outShape;"),o.push("uniform ivec2 outShapeStrides;");break;case 4:o.push("uniform ivec4 outShape;"),o.push("uniform ivec3 outShapeStrides;");break;default:break}o.push("uniform ivec2 outTexShape;")}t.customUniforms&&t.customUniforms.forEach(f=>{o.push(`uniform ${f.type} ${f.name}${f.arrayIndex?`[${f.arrayIndex}]`:""};`)});let n=o.join(`
`),s=r.map(f=>OR(f,e,t.packedInputs,t.enableShapeUniforms)).join(`
`),i=e.texShape,a=_e(),l=BR(a),u,c,p=GR(a);return e.isPacked?(u=PR(e.logicalShape,i,t.enableShapeUniforms),c=VR(a)):(u=LR(e.logicalShape,i,t.enableShapeUniforms),c=MR(a)),t.packedInputs&&(p+=jR),[p,l,c,n,u,s,t.userCode].join(`
`)}function os(r,e=!1){let t=r.shapeInfo.logicalShape;switch(t.length){case 0:return oD(r,e);case 1:return sD(r,e);case 2:return aD(r,e);case 3:return uD(r,e);case 4:return pD(r,e);case 5:return mD(r);case 6:return fD(r);default:throw new Error(`${t.length}-D input sampling is not yet supported`)}}function rw(r,e){switch(r.shapeInfo.logicalShape.length){case 0:return rD(r);case 1:return nD(r,e);case 2:return iD(r,e);case 3:return lD(r,e);default:return cD(r,e)}}function OR(r,e,t=!1,o){let n="";t?n+=rw(r,o):n+=os(r,o);let s=r.shapeInfo.logicalShape,i=e.logicalShape;return s.length<=i.length&&(t?n+=dD(r,e):n+=hD(r,e)),n}function PR(r,e,t){switch(r.length){case 0:return ow();case 1:return HR(r,e,t);case 2:return eD(r,e,t);case 3:return KR(r,e,t);default:return YR(r,e,t)}}function LR(r,e,t){switch(r.length){case 0:return ow();case 1:return qR(r,e,t);case 2:return tD(r,e,t);case 3:return XR(r,e,t);case 4:return QR(r,e,t);case 5:return ZR(r,e);case 6:return JR(r,e);default:throw new Error(`${r.length}-D output sampling is not yet supported`)}}function BR(r){return`
    float sampleTexture(sampler2D textureSampler, vec2 uv) {
      return ${r.texture2D}(textureSampler, uv).r;
    }
  `}function MR(r){return`
    void setOutput(float val) {
      ${r.output} = vec4(val, 0, 0, 0);
    }
  `}function VR(r){return`
    void setOutput(vec4 val) {
      ${r.output} = val;
    }
  `}function GR(r){return`${r.version}
    precision highp float;
    precision highp int;
    precision highp sampler2D;
    ${r.varyingFs} vec2 resultUV;
    ${r.defineOutput}
    const vec2 halfCR = vec2(0.5, 0.5);

    struct ivec5
    {
      int x;
      int y;
      int z;
      int w;
      int u;
    };

    struct ivec6
    {
      int x;
      int y;
      int z;
      int w;
      int u;
      int v;
    };

    uniform float NAN;
    ${r.defineSpecialNaN}
    ${r.defineSpecialInf}
    ${r.defineRound}

    int imod(int x, int y) {
      return x - y * (x / y);
    }

    int idiv(int a, int b, float sign) {
      int res = a / b;
      int mod = imod(a, b);
      if (sign < 0. && mod != 0) {
        res -= 1;
      }
      return res;
    }

    //Based on the work of Dave Hoskins
    //https://www.shadertoy.com/view/4djSRW
    #define HASHSCALE1 443.8975
    float random(float seed){
      vec2 p = resultUV * seed;
      vec3 p3  = fract(vec3(p.xyx) * HASHSCALE1);
      p3 += dot(p3, p3.yzx + 19.19);
      return fract((p3.x + p3.y) * p3.z);
    }

    ${zR}
    ${UR}
    ${WR}
  `}var zR=`
vec2 uvFromFlat(int texNumR, int texNumC, int index) {
  int texR = index / texNumC;
  int texC = index - texR * texNumC;
  return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
}
vec2 packedUVfrom1D(int texNumR, int texNumC, int index) {
  int texelIndex = index / 2;
  int texR = texelIndex / texNumC;
  int texC = texelIndex - texR * texNumC;
  return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
}
`,UR=`
vec2 packedUVfrom2D(int texelsInLogicalRow, int texNumR,
  int texNumC, int row, int col) {
  int texelIndex = (row / 2) * texelsInLogicalRow + (col / 2);
  int texR = texelIndex / texNumC;
  int texC = texelIndex - texR * texNumC;
  return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
}
`,WR=`
vec2 packedUVfrom3D(int texNumR, int texNumC,
    int texelsInBatch, int texelsInLogicalRow, int b,
    int row, int col) {
  int index = b * texelsInBatch + (row / 2) * texelsInLogicalRow + (col / 2);
  int texR = index / texNumC;
  int texC = index - texR * texNumC;
  return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
}
`,jR=`
  float getChannel(vec4 frag, vec2 innerDims) {
    vec2 modCoord = mod(innerDims, 2.);
    return modCoord.x == 0. ?
      (modCoord.y == 0. ? frag.r : frag.g) :
      (modCoord.y == 0. ? frag.b : frag.a);
  }
  float getChannel(vec4 frag, int dim) {
    float modCoord = mod(float(dim), 2.);
    return modCoord == 0. ? frag.r : frag.g;
  }
`;function ow(){return`
    int getOutputCoords() {
      return 0;
    }
  `}function HR(r,e,t){let o=[Math.ceil(e[0]/2),Math.ceil(e[1]/2)];return o[0]===1?t?`
      int getOutputCoords() {
        return 2 * int(resultUV.x * ceil(float(outTexShape[1]) / 2.0));
      }
    `:`
      int getOutputCoords() {
        return 2 * int(resultUV.x * ${o[1]}.0);
      }
    `:o[1]===1?t?`
      int getOutputCoords() {
        return 2 * int(resultUV.y * ceil(float(outTexShape[0]) / 2.0));
      }
    `:`
      int getOutputCoords() {
        return 2 * int(resultUV.y * ${o[0]}.0);
      }
    `:t?`
    int getOutputCoords() {
      ivec2 packedTexShape = ivec2(ceil(float(outTexShape[0]) / 2.0), ceil(float(outTexShape[1]) / 2.0));
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(packedTexShape[0], packedTexShape[1]));
      return 2 * (resTexRC.x * packedTexShape[1] + resTexRC.y);
    }
  `:`
    int getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${o[0]}, ${o[1]}));
      return 2 * (resTexRC.x * ${o[1]} + resTexRC.y);
    }
  `}function qR(r,e,t){return e[0]===1?t?`
      int getOutputCoords() {
        return int(resultUV.x * float(outTexShape[1]));
      }
    `:`
      int getOutputCoords() {
        return int(resultUV.x * ${e[1]}.0);
      }
    `:e[1]===1?t?`
      int getOutputCoords() {
        return int(resultUV.y * float(outTexShape[0]));
      }
    `:`
      int getOutputCoords() {
        return int(resultUV.y * ${e[0]}.0);
      }
    `:t?`
    int getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(outTexShape[0], outTexShape[1]));
      return resTexRC.x * outTexShape[1] + resTexRC.y;
    }
  `:`
    int getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${e[0]}, ${e[1]}));
      return resTexRC.x * ${e[1]} + resTexRC.y;
    }
  `}function KR(r,e,t){if(t)return`
    ivec3 getOutputCoords() {
      ivec2 packedTexShape = ivec2(ceil(float(outTexShape[0]) / 2.0), ceil(float(outTexShape[1]) / 2.0));
      int texelsInLogicalRow = int(ceil(float(outShape[2]) / 2.0));
      int texelsInBatch = texelsInLogicalRow * int(ceil(float(outShape[1]) / 2.0));
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(packedTexShape[0], packedTexShape[1]));
      int index = resTexRC.x * packedTexShape[1] + resTexRC.y;

      int b = index / texelsInBatch;
      index -= b * texelsInBatch;

      int r = 2 * (index / texelsInLogicalRow);
      int c = imod(index, texelsInLogicalRow) * 2;

      return ivec3(b, r, c);
    }
  `;let o=[Math.ceil(e[0]/2),Math.ceil(e[1]/2)],n=Math.ceil(r[2]/2),s=n*Math.ceil(r[1]/2);return`
    ivec3 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${o[0]}, ${o[1]}));
      int index = resTexRC.x * ${o[1]} + resTexRC.y;

      int b = index / ${s};
      index -= b * ${s};

      int r = 2 * (index / ${n});
      int c = imod(index, ${n}) * 2;

      return ivec3(b, r, c);
    }
  `}function XR(r,e,t){if(t)return`
  ivec3 getOutputCoords() {
    ivec2 resTexRC = ivec2(resultUV.yx *
                           vec2(outTexShape[0], outTexShape[1]));
    int index = resTexRC.x * outTexShape[1] + resTexRC.y;
    ${ln(["r","c","d"],r)}
    return ivec3(r, c, d);
  }
`;let o=Jt(["r","c","d"],r);return`
    ivec3 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${e[0]}, ${e[1]}));
      int index = resTexRC.x * ${e[1]} + resTexRC.y;
      ${o}
      return ivec3(r, c, d);
    }
  `}function YR(r,e,t){if(t)return`
    ivec4 getOutputCoords() {
      ivec2 packedTexShape = ivec2(ceil(float(outTexShape[0]) / 2.0), ceil(float(outTexShape[1]) / 2.0));
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(packedTexShape[0], packedTexShape[1]));
      int index = resTexRC.x * packedTexShape[1] + resTexRC.y;

      int texelsInLogicalRow = int(ceil(float(outShape[3]) / 2.0));
      int texelsInBatch = texelsInLogicalRow * int(ceil(float(outShape[2]) / 2.0));
      int texelsInBatchN = texelsInBatch * outShape[1];

      int b2 = index / texelsInBatchN;
      index -= b2 * texelsInBatchN;

      int b = index / texelsInBatch;
      index -= b * texelsInBatch;

      int r = 2 * (index / texelsInLogicalRow);
      int c = imod(index, texelsInLogicalRow) * 2;

      return ivec4(b2, b, r, c);
    }
  `;let o=[Math.ceil(e[0]/2),Math.ceil(e[1]/2)],n=Math.ceil(r[r.length-1]/2),s=n*Math.ceil(r[r.length-2]/2),i=s,a="",l="b, r, c";for(let u=2;u<r.length-1;u++)i*=r[r.length-u-1],a=`
      int b${u} = index / ${i};
      index -= b${u} * ${i};
    `+a,l=`b${u}, `+l;return`
    ivec${r.length} getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${o[0]}, ${o[1]}));
      int index = resTexRC.x * ${o[1]} + resTexRC.y;

      ${a}

      int b = index / ${s};
      index -= b * ${s};

      int r = 2 * (index / ${n});
      int c = imod(index, ${n}) * 2;

      return ivec${r.length}(${l});
    }
  `}function QR(r,e,t){if(t)return`
    ivec4 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
        vec2(outTexShape[0], outTexShape[1]));
      int index = resTexRC.x * outTexShape[1] + resTexRC.y;
      ${ln(["r","c","d","d2"],r)}
      return ivec4(r, c, d, d2);
    }
  `;let o=Jt(["r","c","d","d2"],r);return`
    ivec4 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
        vec2(${e[0]}, ${e[1]}));
      int index = resTexRC.x * ${e[1]} + resTexRC.y;
      ${o}
      return ivec4(r, c, d, d2);
    }
  `}function ZR(r,e){let t=Jt(["r","c","d","d2","d3"],r);return`
    ivec5 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx * vec2(${e[0]},
                             ${e[1]}));

      int index = resTexRC.x * ${e[1]} + resTexRC.y;

      ${t}

      ivec5 outShape = ivec5(r, c, d, d2, d3);
      return outShape;
    }
  `}function JR(r,e){let t=Jt(["r","c","d","d2","d3","d4"],r);return`
    ivec6 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
        vec2(${e[0]}, ${e[1]}));
      int index = resTexRC.x * ${e[1]} + resTexRC.y;

      ${t}

      ivec6 result = ivec6(r, c, d, d2, d3, d4);
      return result;
    }
  `}function eD(r,e,t){let o=[Math.ceil(e[0]/2),Math.ceil(e[1]/2)];if(C.arraysEqual(r,e))return t?`
      ivec2 getOutputCoords() {
        ivec2 packedTexShape = ivec2(ceil(float(outTexShape[0]) / 2.0), ceil(float(outTexShape[1]) / 2.0));
        return 2 * ivec2(resultUV.yx * vec2(packedTexShape[0], packedTexShape[1]));
      }
    `:`
      ivec2 getOutputCoords() {
        return 2 * ivec2(resultUV.yx * vec2(${o[0]}, ${o[1]}));
      }
    `;let n=Math.ceil(r[1]/2);return t?`
    ivec2 getOutputCoords() {
      ivec2 packedTexShape = ivec2(ceil(float(outTexShape[0]) / 2.0), ceil(float(outTexShape[1]) / 2.0));
      int texelsInLogicalRow = int(ceil(float(outShape[1]) / 2.0));
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(packedTexShape[0], packedTexShape[1]));

      int index = resTexRC.x * packedTexShape[1] + resTexRC.y;
      int r = 2 * (index / texelsInLogicalRow);
      int c = imod(index, texelsInLogicalRow) * 2;

      return ivec2(r, c);
    }
  `:`
    ivec2 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${o[0]}, ${o[1]}));

      int index = resTexRC.x * ${o[1]} + resTexRC.y;
      int r = 2 * (index / ${n});
      int c = imod(index, ${n}) * 2;

      return ivec2(r, c);
    }
  `}function tD(r,e,t){return C.arraysEqual(r,e)?t?`
      ivec2 getOutputCoords() {
        return ivec2(resultUV.yx * vec2(outTexShape[0], outTexShape[1]));
      }
    `:`
      ivec2 getOutputCoords() {
        return ivec2(resultUV.yx * vec2(${e[0]}, ${e[1]}));
      }
    `:r[1]===1?t?`
      ivec2 getOutputCoords() {
        ivec2 resTexRC = ivec2(resultUV.yx *
                               vec2(outTexShape[0], outTexShape[1]));
        int index = resTexRC.x * outTexShape[1] + resTexRC.y;
        return ivec2(index, 0);
      }
    `:`
      ivec2 getOutputCoords() {
        ivec2 resTexRC = ivec2(resultUV.yx *
                               vec2(${e[0]}, ${e[1]}));
        int index = resTexRC.x * ${e[1]} + resTexRC.y;
        return ivec2(index, 0);
      }
    `:r[0]===1?t?`
      ivec2 getOutputCoords() {
        ivec2 resTexRC = ivec2(resultUV.yx *
                               vec2(outTexShape[0], outTexShape[1]));
        int index = resTexRC.x * outTexShape[1] + resTexRC.y;
        return ivec2(0, index);
      }
    `:`
      ivec2 getOutputCoords() {
        ivec2 resTexRC = ivec2(resultUV.yx *
                               vec2(${e[0]}, ${e[1]}));
        int index = resTexRC.x * ${e[1]} + resTexRC.y;
        return ivec2(0, index);
      }
    `:t?`
    ivec2 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(outTexShape[0], outTexShape[1]));
      int index = resTexRC.x * outTexShape[1] + resTexRC.y;
      int r = index / outShape[1];
      int c = index - r * outShape[1];
      return ivec2(r, c);
    }
  `:`
    ivec2 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${e[0]}, ${e[1]}));
      int index = resTexRC.x * ${e[1]} + resTexRC.y;
      int r = index / ${r[1]};
      int c = index - r * ${r[1]};
      return ivec2(r, c);
    }
  `}function un(r){return`offset${r}`}function rD(r){let e=r.name,t="get"+e.charAt(0).toUpperCase()+e.slice(1),o=_e();return`
    vec4 ${t}() {
      return ${o.texture2D}(${e}, halfCR);
    }
  `}function oD(r,e){let t=r.name,o="get"+t.charAt(0).toUpperCase()+t.slice(1);if(r.shapeInfo.isUniform)return`float ${o}() {return ${t};}`;let[n,s]=r.shapeInfo.texShape;if(n===1&&s===1)return`
      float ${o}() {
        return sampleTexture(${t}, halfCR);
      }
    `;let i=un(t);if(e)return`
    float ${o}() {
      vec2 uv = uvFromFlat(${t}TexShape[0], ${t}TexShape[1], ${i});
      return sampleTexture(${t}, uv);
    }
  `;let[a,l]=r.shapeInfo.texShape;return`
    float ${o}() {
      vec2 uv = uvFromFlat(${a}, ${l}, ${i});
      return sampleTexture(${t}, uv);
    }
  `}function nD(r,e){let t=r.name,o="get"+t.charAt(0).toUpperCase()+t.slice(1),n=r.shapeInfo.texShape,s=_e();if(e)return`
    vec4 ${o}(int index) {
      ivec2 packedTexShape = ivec2(ceil(float(${t}TexShape[0]) / 2.0), ceil(float(${t}TexShape[1]) / 2.0));
      vec2 uv = packedUVfrom1D(
        packedTexShape[0], packedTexShape[1], index);
      return ${s.texture2D}(${t}, uv);
    }
  `;let i=[Math.ceil(n[0]/2),Math.ceil(n[1]/2)];return`
    vec4 ${o}(int index) {
      vec2 uv = packedUVfrom1D(
        ${i[0]}, ${i[1]}, index);
      return ${s.texture2D}(${t}, uv);
    }
  `}function sD(r,e){let t=r.name,o="get"+t.charAt(0).toUpperCase()+t.slice(1);if(r.shapeInfo.isUniform)return`
      float ${o}(int index) {
        ${ns(r)}
      }
    `;let n=r.shapeInfo.texShape,s=n[0],i=n[1];if(i===1&&s===1)return`
      float ${o}(int index) {
        return sampleTexture(${t}, halfCR);
      }
    `;let a=un(t);return i===1?e?`
      float ${o}(int index) {
        vec2 uv = vec2(0.5, (float(index + ${a}) + 0.5) / float(${t}TexShape[0]));
        return sampleTexture(${t}, uv);
      }
    `:`
      float ${o}(int index) {
        vec2 uv = vec2(0.5, (float(index + ${a}) + 0.5) / ${s}.0);
        return sampleTexture(${t}, uv);
      }
    `:s===1?e?`
      float ${o}(int index) {
        vec2 uv = vec2((float(index + ${a}) + 0.5) / float(${t}TexShape[1]), 0.5);
        return sampleTexture(${t}, uv);
      }
    `:`
      float ${o}(int index) {
        vec2 uv = vec2((float(index + ${a}) + 0.5) / ${i}.0, 0.5);
        return sampleTexture(${t}, uv);
      }
    `:e?`
    float ${o}(int index) {
      vec2 uv = uvFromFlat(${t}TexShape[0], ${t}TexShape[1], index + ${a});
      return sampleTexture(${t}, uv);
    }
  `:`
    float ${o}(int index) {
      vec2 uv = uvFromFlat(${s}, ${i}, index + ${a});
      return sampleTexture(${t}, uv);
    }
  `}function iD(r,e){let t=r.shapeInfo.logicalShape,o=r.name,n="get"+o.charAt(0).toUpperCase()+o.slice(1),s=r.shapeInfo.texShape,i=s[0],a=s[1],l=_e();if(s!=null&&C.arraysEqual(t,s))return e?`
      vec4 ${n}(int row, int col) {
        vec2 uv = (vec2(col, row) + halfCR) / vec2(${o}TexShape[1], ${o}TexShape[0]);

        return ${l.texture2D}(${o}, uv);
      }
    `:`
      vec4 ${n}(int row, int col) {
        vec2 uv = (vec2(col, row) + halfCR) / vec2(${a}.0, ${i}.0);

        return ${l.texture2D}(${o}, uv);
      }
    `;if(e)return`
    vec4 ${n}(int row, int col) {
      ivec2 packedTexShape = ivec2(ceil(float(${o}TexShape[0]) / 2.0), ceil(float(${o}TexShape[1]) / 2.0));
      int valuesPerRow = int(ceil(float(${o}Shape[1]) / 2.0));
      vec2 uv = packedUVfrom2D(valuesPerRow, packedTexShape[0], packedTexShape[1], row, col);
      return ${l.texture2D}(${o}, uv);
    }
  `;let u=[Math.ceil(s[0]/2),Math.ceil(s[1]/2)],c=Math.ceil(t[1]/2);return`
    vec4 ${n}(int row, int col) {
      vec2 uv = packedUVfrom2D(${c}, ${u[0]}, ${u[1]}, row, col);
      return ${l.texture2D}(${o}, uv);
    }
  `}function aD(r,e){let t=r.shapeInfo.logicalShape,o=r.name,n="get"+o.charAt(0).toUpperCase()+o.slice(1),s=r.shapeInfo.texShape;if(s!=null&&C.arraysEqual(t,s)){if(e)return`
      float ${n}(int row, int col) {
        vec2 uv = (vec2(col, row) + halfCR) / vec2(${o}TexShape[1], ${o}TexShape[0]);
        return sampleTexture(${o}, uv);
      }
    `;let m=s[0],f=s[1];return`
    float ${n}(int row, int col) {
      vec2 uv = (vec2(col, row) + halfCR) / vec2(${f}.0, ${m}.0);
      return sampleTexture(${o}, uv);
    }
  `}let{newShape:i,keptDims:a}=C.squeezeShape(t),l=i;if(l.length<t.length){let m=ss(r,l),f=["row","col"];return`
      ${os(m,e)}
      float ${n}(int row, int col) {
        return ${n}(${is(f,a)});
      }
    `}if(r.shapeInfo.isUniform)return`
      float ${n}(int row, int col) {
        int index = round(dot(vec2(row, col), vec2(${t[1]}, 1)));
        ${ns(r)}
      }
    `;let u=s[0],c=s[1],p=un(o);return c===1?e?`
      float ${n}(int row, int col) {
        float index = dot(vec3(row, col, ${p}), vec3(${o}Shape[1], 1, 1));
        vec2 uv = vec2(0.5, (index + 0.5) / float(${o}TexShape[0]));
        return sampleTexture(${o}, uv);
      }
    `:`
    float ${n}(int row, int col) {
      float index = dot(vec3(row, col, ${p}), vec3(${t[1]}, 1, 1));
      vec2 uv = vec2(0.5, (index + 0.5) / ${u}.0);
      return sampleTexture(${o}, uv);
    }
  `:u===1?e?`
      float ${n}(int row, int col) {
        float index = dot(vec3(row, col, ${p}), vec3(${o}Shape[1], 1, 1));
        vec2 uv = vec2((index + 0.5) / float(${o}TexShape[1]), 0.5);
        return sampleTexture(${o}, uv);
      }
    `:`
    float ${n}(int row, int col) {
      float index = dot(vec3(row, col, ${p}), vec3(${t[1]}, 1, 1));
      vec2 uv = vec2((index + 0.5) / ${c}.0, 0.5);
      return sampleTexture(${o}, uv);
    }
  `:e?`
      float ${n}(int row, int col) {
        // Explicitly use integer operations as dot() only works on floats.
        int index = row * ${o}Shape[1] + col + ${p};
        vec2 uv = uvFromFlat(${o}TexShape[0], ${o}TexShape[1], index);
        return sampleTexture(${o}, uv);
      }
    `:`
  float ${n}(int row, int col) {
    // Explicitly use integer operations as dot() only works on floats.
    int index = row * ${t[1]} + col + ${p};
    vec2 uv = uvFromFlat(${u}, ${c}, index);
    return sampleTexture(${o}, uv);
  }
`}function lD(r,e){let t=r.shapeInfo.logicalShape,o=r.name,n="get"+o.charAt(0).toUpperCase()+o.slice(1),s=r.shapeInfo.texShape,i=[Math.ceil(s[0]/2),Math.ceil(s[1]/2)];if(t[0]===1){let m=t.slice(1),f=[1,2],d=ss(r,m),g=["b","row","col"];return`
        ${rw(d,e)}
        vec4 ${n}(int b, int row, int col) {
          return ${n}(${is(g,f)});
        }
      `}let a=_e();if(e)return`
    vec4 ${n}(int b, int row, int col) {
      ivec2 packedTexShape = ivec2(ceil(float(${o}TexShape[0]) / 2.0), ceil(float(${o}TexShape[1]) / 2.0));
      int valuesPerRow = int(ceil(float(${o}Shape[2]) / 2.0));
      int texelsInBatch = valuesPerRow * int(ceil(float(${o}Shape[1]) / 2.0));
      vec2 uv = packedUVfrom3D(
        packedTexShape[0], packedTexShape[1], texelsInBatch, valuesPerRow, b, row, col);
      return ${a.texture2D}(${o}, uv);
    }
  `;let l=i[0],u=i[1],c=Math.ceil(t[2]/2),p=c*Math.ceil(t[1]/2);return`
    vec4 ${n}(int b, int row, int col) {
      vec2 uv = packedUVfrom3D(
        ${l}, ${u}, ${p}, ${c}, b, row, col);
      return ${a.texture2D}(${o}, uv);
    }
  `}function uD(r,e){let t=r.shapeInfo.logicalShape,o=r.name,n="get"+o.charAt(0).toUpperCase()+o.slice(1),s=t[1]*t[2],i=t[2],{newShape:a,keptDims:l}=C.squeezeShape(t),u=a;if(u.length<t.length){let g=ss(r,u),h=["row","col","depth"];return`
        ${os(g,e)}
        float ${n}(int row, int col, int depth) {
          return ${n}(${is(h,l)});
        }
      `}if(r.shapeInfo.isUniform)return`
      float ${n}(int row, int col, int depth) {
        int index = round(dot(vec3(row, col, depth),
                          vec3(${s}, ${i}, 1)));
        ${ns(r)}
      }
    `;let c=r.shapeInfo.texShape,p=c[0],m=c[1],f=r.shapeInfo.flatOffset;if(m===s&&f==null)return e?`
      float ${n}(int row, int col, int depth) {
        int stride1 = ${o}Shape[2];
        float texR = float(row);
        float texC = dot(vec2(col, depth), vec2(stride1, 1));
        vec2 uv = (vec2(texC, texR) + halfCR) /
                   vec2(${o}TexShape[1], ${o}TexShape[0]);
        return sampleTexture(${o}, uv);
      }
    `:`
        float ${n}(int row, int col, int depth) {
          float texR = float(row);
          float texC = dot(vec2(col, depth), vec2(${i}, 1));
          vec2 uv = (vec2(texC, texR) + halfCR) /
                     vec2(${m}.0, ${p}.0);
          return sampleTexture(${o}, uv);
        }
      `;if(m===i&&f==null)return e?`
      float ${n}(int row, int col, int depth) {
        float texR = dot(vec2(row, col), vec2(${o}Shape[1], 1));
        float texC = float(depth);
        vec2 uv = (vec2(texC, texR) + halfCR) / vec2(${o}TexShape[1], ${o}TexShape[0]);
        return sampleTexture(${o}, uv);
      }
    `:`
    float ${n}(int row, int col, int depth) {
      float texR = dot(vec2(row, col), vec2(${t[1]}, 1));
      float texC = float(depth);
      vec2 uv = (vec2(texC, texR) + halfCR) / vec2(${m}.0, ${p}.0);
      return sampleTexture(${o}, uv);
    }
  `;let d=un(o);return e?`
    float ${n}(int row, int col, int depth) {
      // Explicitly use integer operations as dot() only works on floats.
      int stride0 = ${o}Shape[1] * ${o}Shape[2];
      int stride1 = ${o}Shape[2];
      int index = row * stride0 + col * stride1 + depth + ${d};
      vec2 uv = uvFromFlat(${o}TexShape[0], ${o}TexShape[1], index);
      return sampleTexture(${o}, uv);
    }
    `:`
      float ${n}(int row, int col, int depth) {
        // Explicitly use integer operations as dot() only works on floats.
        int index = row * ${s} + col * ${i} + depth + ${d};
        vec2 uv = uvFromFlat(${p}, ${m}, index);
        return sampleTexture(${o}, uv);
      }
  `}function cD(r,e){let t=r.name,o="get"+t.charAt(0).toUpperCase()+t.slice(1),n=_e();if(e)return`
    vec4 ${o}(int b2, int b, int row, int col) {
      int valuesPerRow = int(ceil(float(${t}Shape[3]) / 2.0));
      int texelsInBatch = valuesPerRow * int(ceil(float(${t}Shape[2]) / 2.0));
      int index = b * texelsInBatch + (row / 2) * valuesPerRow + (col / 2);
      texelsInBatch *= ${t}Shape[1];
      index = b2 * texelsInBatch + index;
      ivec2 packedTexShape = ivec2(ceil(float(${t}TexShape[0]) / 2.0), ceil(float(${t}TexShape[1]) / 2.0));
      int texR = index / packedTexShape[1];
      int texC = index - texR * packedTexShape[1];
      vec2 uv = (vec2(texC, texR) + halfCR) / vec2(packedTexShape[1], packedTexShape[0]); return ${n.texture2D}(${t}, uv);
    }
  `;let s=r.shapeInfo.logicalShape,i=s.length,a=r.shapeInfo.texShape,l=[Math.ceil(a[0]/2),Math.ceil(a[1]/2)],u=l[0],c=l[1],p=Math.ceil(s[i-1]/2),m=p*Math.ceil(s[i-2]/2),f="int b, int row, int col",d=`b * ${m} + (row / 2) * ${p} + (col / 2)`;for(let g=2;g<i-1;g++)f=`int b${g}, `+f,m*=s[i-g-1],d=`b${g} * ${m} + `+d;return`
    vec4 ${o}(${f}) {
      int index = ${d};
      int texR = index / ${c};
      int texC = index - texR * ${c};
      vec2 uv = (vec2(texC, texR) + halfCR) / vec2(${c}, ${u});
      return ${n.texture2D}(${t}, uv);
    }
  `}function pD(r,e){let t=r.shapeInfo.logicalShape,o=r.name,n="get"+o.charAt(0).toUpperCase()+o.slice(1),s=t[3],i=t[2]*s,a=t[1]*i,{newShape:l,keptDims:u}=C.squeezeShape(t);if(l.length<t.length){let T=ss(r,l),k=["row","col","depth","depth2"];return`
      ${os(T,e)}
      float ${n}(int row, int col, int depth, int depth2) {
        return ${n}(${is(k,u)});
      }
    `}if(r.shapeInfo.isUniform)return`
      float ${n}(int row, int col, int depth, int depth2) {
        int index = round(dot(vec4(row, col, depth, depth2),
                          vec4(${a}, ${i}, ${s}, 1)));
        ${ns(r)}
      }
    `;let c=r.shapeInfo.flatOffset,p=r.shapeInfo.texShape,m=p[0],f=p[1],d=`int stride2 = ${o}Shape[3];`,g=`int stride1 = ${o}Shape[2] * stride2;`,h=`int stride0 = ${o}Shape[1] * stride1;`;if(f===a&&c==null)return e?`
      float ${n}(int row, int col, int depth, int depth2) {
        ${d}
        ${g}
        float texR = float(row);
        float texC =
            dot(vec3(col, depth, depth2),
                vec3(stride1, stride2, 1));
        vec2 uv = (vec2(texC, texR) + halfCR) /
                   vec2(${o}TexShape[1], ${o}TexShape[0]);
        return sampleTexture(${o}, uv);
      }
    `:`
      float ${n}(int row, int col, int depth, int depth2) {
        float texR = float(row);
        float texC =
            dot(vec3(col, depth, depth2),
                vec3(${i}, ${s}, 1));
        vec2 uv = (vec2(texC, texR) + halfCR) /
                   vec2(${f}.0, ${m}.0);
        return sampleTexture(${o}, uv);
      }
    `;if(f===s&&c==null)return e?`
      float ${n}(int row, int col, int depth, int depth2) {
        float texR = dot(vec3(row, col, depth),
                         vec3(${o}Shape[1] * ${o}Shape[2], ${o}Shape[2], 1));
        float texC = float(depth2);
        vec2 uv = (vec2(texC, texR) + halfCR) /
                  vec2(${o}TexShape[1], ${o}TexShape[0]);
        return sampleTexture(${o}, uv);
      }
    `:`
      float ${n}(int row, int col, int depth, int depth2) {
        float texR = dot(vec3(row, col, depth),
                         vec3(${t[1]*t[2]}, ${t[2]}, 1));
        float texC = float(depth2);
        vec2 uv = (vec2(texC, texR) + halfCR) /
                  vec2(${f}.0, ${m}.0);
        return sampleTexture(${o}, uv);
      }
    `;let b=un(o);return e?`
    float ${n}(int row, int col, int depth, int depth2) {
      // Explicitly use integer operations as dot() only works on floats.
      ${d}
      ${g}
      ${h}
      int index = row * stride0 + col * stride1 +
          depth * stride2 + depth2;
      vec2 uv = uvFromFlat(${o}TexShape[0], ${o}TexShape[1], index + ${b});
      return sampleTexture(${o}, uv);
    }
  `:`
    float ${n}(int row, int col, int depth, int depth2) {
      // Explicitly use integer operations as dot() only works on floats.
      int index = row * ${a} + col * ${i} +
          depth * ${s} + depth2;
      vec2 uv = uvFromFlat(${m}, ${f}, index + ${b});
      return sampleTexture(${o}, uv);
    }
  `}function mD(r){let e=r.shapeInfo.logicalShape,t=r.name,o="get"+t.charAt(0).toUpperCase()+t.slice(1),n=e[4],s=e[3]*n,i=e[2]*s,a=e[1]*i,{newShape:l,keptDims:u}=C.squeezeShape(e);if(l.length<e.length){let g=ss(r,l),h=["row","col","depth","depth2","depth3"];return`
      ${os(g)}
      float ${o}(int row, int col, int depth, int depth2, int depth3) {
        return ${o}(${is(h,u)});
      }
    `}if(r.shapeInfo.isUniform)return`
      float ${o}(int row, int col, int depth, int depth2, int depth3) {
        float index = dot(
          vec4(row, col, depth, depth2),
          vec4(${a}, ${i}, ${s}, ${n})) +
          depth3;
        ${ns(r)}
      }
    `;let c=r.shapeInfo.flatOffset,p=r.shapeInfo.texShape,m=p[0],f=p[1];if(f===a&&c==null)return`
      float ${o}(int row, int col, int depth, int depth2, int depth3) {
        int texR = row;
        float texC = dot(vec4(col, depth, depth2, depth3),
                         vec4(${i}, ${s}, ${n}, 1));
        vec2 uv = (vec2(texC, texR) + halfCR) /
                   vec2(${f}.0, ${m}.0);
        return sampleTexture(${t}, uv);
      }
    `;if(f===n&&c==null)return`
      float ${o}(int row, int col, int depth, int depth2, int depth3) {
        float texR = dot(
          vec4(row, col, depth, depth2),
          vec4(${e[1]*e[2]*e[3]},
               ${e[2]*e[3]}, ${e[3]}, 1));
        int texC = depth3;
        vec2 uv = (vec2(texC, texR) + halfCR) /
                  vec2(${f}.0, ${m}.0);
        return sampleTexture(${t}, uv);
      }
    `;let d=un(t);return`
    float ${o}(int row, int col, int depth, int depth2, int depth3) {
      // Explicitly use integer operations as dot() only works on floats.
      int index = row * ${a} + col * ${i} + depth * ${s} +
          depth2 * ${n} + depth3 + ${d};
      vec2 uv = uvFromFlat(${m}, ${f}, index);
      return sampleTexture(${t}, uv);
    }
  `}function fD(r){let e=r.shapeInfo.logicalShape,t=r.name,o="get"+t.charAt(0).toUpperCase()+t.slice(1),{newShape:n,keptDims:s}=C.squeezeShape(e);if(n.length<e.length){let h=ss(r,n),b=["row","col","depth","depth2","depth3","depth4"];return`
      ${os(h)}
      float ${o}(int row, int col, int depth,
                    int depth2, int depth3, int depth4) {
        return ${o}(${is(b,s)});
      }
    `}let i=e[5],a=e[4]*i,l=e[3]*a,u=e[2]*l,c=e[1]*u;if(r.shapeInfo.isUniform)return`
      float ${o}(int row, int col, int depth,
                  int depth2, int depth3, int depth4) {
        int index = round(dot(
          vec4(row, col, depth, depth2),
          vec4(${c}, ${u}, ${l}, ${a})) +
          dot(
            vec2(depth3, depth4),
            vec2(${i}, 1)));
        ${ns(r)}
      }
    `;let p=r.shapeInfo.flatOffset,m=r.shapeInfo.texShape,f=m[0],d=m[1];if(d===c&&p==null)return`
      float ${o}(int row, int col, int depth,
                    int depth2, int depth3, int depth4) {
        int texR = row;
        float texC = dot(vec4(col, depth, depth2, depth3),
          vec4(${u}, ${l}, ${a}, ${i})) +
               float(depth4);
        vec2 uv = (vec2(texC, texR) + halfCR) /
                   vec2(${d}.0, ${f}.0);
        return sampleTexture(${t}, uv);
      }
    `;if(d===i&&p==null)return`
      float ${o}(int row, int col, int depth,
                    int depth2, int depth3, int depth4) {
        float texR = dot(vec4(row, col, depth, depth2),
          vec4(${e[1]*e[2]*e[3]*e[4]},
               ${e[2]*e[3]*e[4]},
               ${e[3]*e[4]},
               ${e[4]})) + float(depth3);
        int texC = depth4;
        vec2 uv = (vec2(texC, texR) + halfCR) /
                  vec2(${d}.0, ${f}.0);
        return sampleTexture(${t}, uv);
      }
    `;let g=un(t);return`
    float ${o}(int row, int col, int depth,
                  int depth2, int depth3, int depth4) {
      // Explicitly use integer operations as dot() only works on floats.
      int index = row * ${c} + col * ${u} + depth * ${l} +
          depth2 * ${a} + depth3 * ${i} + depth4 + ${g};
      vec2 uv = uvFromFlat(${f}, ${d}, index);
      return sampleTexture(${t}, uv);
    }
  `}function ns(r){let e=r.name,t=C.sizeFromShape(r.shapeInfo.logicalShape);return t<2?`return ${e};`:`
    for (int i = 0; i < ${t}; i++) {
      if (i == index) {
        return ${e}[i];
      }
    }
  `}function dD(r,e){let t=r.name,o=t.charAt(0).toUpperCase()+t.slice(1),n="get"+o+"AtOutCoords",s=r.shapeInfo.logicalShape.length,i=e.logicalShape.length,a=ew(r.shapeInfo.logicalShape,e.logicalShape),l=Q(i),u=i-s,c,p=["x","y","z","w","u","v"];s===0?c="":i<2&&a.length>=1?c="coords = 0;":c=a.map(T=>`coords.${p[T+u]} = 0;`).join(`
`);let m="";i<2&&s>0?m="coords":m=r.shapeInfo.logicalShape.map((T,k)=>`coords.${p[k+u]}`).join(", ");let f="return outputValue;",g=C.sizeFromShape(r.shapeInfo.logicalShape)===1,b=C.sizeFromShape(e.logicalShape)===1;if(s===1&&!g&&!b)f=`
      return vec4(outputValue.xy, outputValue.xy);
    `;else if(g&&!b)i===1?f=`
        return vec4(outputValue.x, outputValue.x, 0., 0.);
      `:f=`
        return vec4(outputValue.x);
      `;else if(a.length){let T=s-2,k=s-1;a.indexOf(T)>-1&&a.indexOf(k)>-1?f="return vec4(outputValue.x);":a.indexOf(T)>-1?f="return vec4(outputValue.x, outputValue.y, outputValue.x, outputValue.y);":a.indexOf(k)>-1&&(f="return vec4(outputValue.xx, outputValue.zz);")}return`
    vec4 ${n}() {
      ${l} coords = getOutputCoords();
      ${c}
      vec4 outputValue = get${o}(${m});
      ${f}
    }
  `}function hD(r,e){let t=r.name,o=t.charAt(0).toUpperCase()+t.slice(1),n="get"+o+"AtOutCoords",s=e.texShape,i=r.shapeInfo.texShape,a=r.shapeInfo.logicalShape.length,l=e.logicalShape.length;if(!r.shapeInfo.isUniform&&a===l&&r.shapeInfo.flatOffset==null&&C.arraysEqual(i,s))return`
      float ${n}() {
        return sampleTexture(${t}, resultUV);
      }
    `;let u=Q(l),c=ew(r.shapeInfo.logicalShape,e.logicalShape),p=l-a,m,f=["x","y","z","w","u","v"];a===0?m="":l<2&&c.length>=1?m="coords = 0;":m=c.map(g=>`coords.${f[g+p]} = 0;`).join(`
`);let d="";return l<2&&a>0?d="coords":d=r.shapeInfo.logicalShape.map((g,h)=>`coords.${f[h+p]}`).join(", "),`
    float ${n}() {
      ${u} coords = getOutputCoords();
      ${m}
      return get${o}(${d});
    }
  `}function Q(r){if(r<=1)return"int";if(r===2)return"ivec2";if(r===3)return"ivec3";if(r===4)return"ivec4";if(r===5)return"ivec5";if(r===6)return"ivec6";throw Error(`GPU for rank ${r} is not yet supported`)}function Uu(r,e,t){let{newShape:o,keptDims:n}=C.squeezeShape(e),s=e.length,i=r&&s===3&&e[0]===1,a=i?e.slice(1):o,l=!r&&s>1&&!C.arraysEqual(e,t)&&o.length<s||i;return{useSqueezeShape:l,uniformShape:l?a:e,keptDims:n}}function ss(r,e){let t=JSON.parse(JSON.stringify(r));return t.shapeInfo.logicalShape=e,t}function is(r,e){return e.map(t=>r[t]).join(", ")}function nw(r,e,t,o){let n=t.map((c,p)=>{let m={logicalShape:c.shape,texShape:c.isUniform?null:c.texData.texShape,isUniform:c.isUniform,isPacked:c.isUniform?!1:c.texData.isPacked,flatOffset:null};return c.texData!=null&&c.texData.slice!=null&&c.texData.slice.flatOffset>0&&(m.flatOffset=c.texData.slice.flatOffset),{name:e.variableNames[p],shapeInfo:m}}),s=n.map(c=>c.shapeInfo),i={logicalShape:o.shape,texShape:o.texData.texShape,isUniform:!1,isPacked:o.texData.isPacked,flatOffset:null},a=tw(n,i,e),l=td(r.gl,a),u=r.createProgram(l);return E().get("ENGINE_COMPILE_ONLY")?{program:e,fragmentShader:l,source:a,webGLProgram:u,inShapeInfos:s,outShapeInfo:i,uniformLocations:null,customUniformLocations:null,infLoc:null,nanLoc:null,inShapesLocations:null,inTexShapesLocations:null,outShapeLocation:null,outShapeStridesLocation:null,outTexShapeLocation:null}:Object.assign({program:e,fragmentShader:l,source:a,webGLProgram:u,inShapeInfos:s,outShapeInfo:i},wd(r,e,u))}function wd(r,e,t){let o={},n={},s={},i=[],a,l,u,c=null,p=null;p=r.getUniformLocation(t,"NAN",!1),E().getNumber("WEBGL_VERSION")===1&&(c=r.getUniformLocation(t,"INFINITY",!1));let m=!1;for(let f=0;f<e.variableNames.length;f++){let d=e.variableNames[f];o[d]=r.getUniformLocation(t,d,m),o[`offset${d}`]=r.getUniformLocation(t,`offset${d}`,m),e.enableShapeUniforms&&(n[`${d}Shape`]=r.getUniformLocation(t,`${d}Shape`,m),s[`${d}TexShape`]=r.getUniformLocation(t,`${d}TexShape`,m))}return e.enableShapeUniforms&&(a=r.getUniformLocation(t,"outShape",m),u=r.getUniformLocation(t,"outShapeStrides",m),l=r.getUniformLocation(t,"outTexShape",m)),e.customUniforms&&e.customUniforms.forEach((f,d)=>{i[d]=r.getUniformLocation(t,f.name,m)}),{uniformLocations:o,customUniformLocations:i,infLoc:c,nanLoc:p,inShapesLocations:n,inTexShapesLocations:s,outShapeLocation:a,outShapeStridesLocation:u,outTexShapeLocation:l}}function sw(r,e){if(r.length!==e.length)throw Error(`Binary was compiled with ${r.length} inputs, but was executed with ${e.length} inputs`);r.forEach((t,o)=>{let n=t.logicalShape,s=e[o],i=s.shape;if(!C.arraysEqual(n,i))throw Error(`Binary was compiled with different shapes than the current args. Shapes ${n} and ${i} must match`);if(t.isUniform&&s.isUniform)return;let a=t.texShape,l=s.isUniform?null:s.texData.texShape;if(!C.arraysEqual(a,l))throw Error(`Binary was compiled with different texture shapes than the current args. Shape ${a} and ${l} must match`)})}function iw(r,e,t,o,n){e.program.enableShapeUniforms||(sw(e.inShapeInfos,t),sw([e.outShapeInfo],[o]));let s=o.texData.texture,i=o.texData.texShape;o.texData.isPacked?r.setOutputPackedMatrixTexture(s.texture,i[0],i[1]):r.setOutputMatrixTexture(s.texture,i[0],i[1]),r.setProgram(e.webGLProgram),E().getNumber("WEBGL_VERSION")===1&&e.infLoc!==null&&r.gl.uniform1f(e.infLoc,Infinity),e.nanLoc!==null&&r.gl.uniform1f(e.nanLoc,NaN),t.forEach((l,u)=>{let c=e.program.variableNames[u],p=e.uniformLocations[c],m=e.uniformLocations[`offset${c}`],f=e.inShapesLocations[`${c}Shape`],d=e.inTexShapesLocations[`${c}TexShape`];if(f){let{uniformShape:g}=Uu(e.program.packedInputs,l.shape,l.texData.texShape);switch(g.length){case 1:r.gl.uniform1iv(f,new Int32Array(g));break;case 2:r.gl.uniform2iv(f,new Int32Array(g));break;case 3:r.gl.uniform3iv(f,new Int32Array(g));break;case 4:r.gl.uniform4iv(f,new Int32Array(g));break;default:break}}if(d&&r.gl.uniform2i(d,l.texData.texShape[0],l.texData.texShape[1]),p!=null){if(l.isUniform){if(C.sizeFromShape(l.shape)<2)r.gl.uniform1f(p,l.uniformValues[0]);else{let g=l.uniformValues;g instanceof Float32Array||(g=new Float32Array(g)),r.gl.uniform1fv(p,g)}return}l.texData.slice!=null&&m!=null&&r.gl.uniform1i(m,l.texData.slice.flatOffset),r.setInputMatrixTexture(l.texData.texture.texture,p,u)}});let a=e.outShapeLocation;if(a)switch(o.shape.length){case 1:r.gl.uniform1iv(a,new Int32Array(o.shape));break;case 2:r.gl.uniform2iv(a,new Int32Array(o.shape));break;case 3:r.gl.uniform3iv(a,new Int32Array(o.shape));break;case 4:r.gl.uniform4iv(a,new Int32Array(o.shape));break;default:break}if(e.outShapeStridesLocation){let l=C.computeStrides(o.shape);switch(o.shape.length){case 2:r.gl.uniform1iv(e.outShapeStridesLocation,new Int32Array(l));break;case 3:r.gl.uniform2iv(e.outShapeStridesLocation,new Int32Array(l));break;case 4:r.gl.uniform3iv(e.outShapeStridesLocation,new Int32Array(l));break;default:break}}e.outTexShapeLocation&&r.gl.uniform2i(e.outTexShapeLocation,o.texData.texShape[0],o.texData.texShape[1]),e.program.customUniforms&&n&&e.program.customUniforms.forEach((l,u)=>{let c=e.customUniformLocations[u],p=n[u];if(l.type==="float")r.gl.uniform1fv(c,p);else if(l.type==="vec2")r.gl.uniform2fv(c,p);else if(l.type==="vec3")r.gl.uniform3fv(c,p);else if(l.type==="vec4")r.gl.uniform4fv(c,p);else if(l.type==="int")r.gl.uniform1iv(c,p);else if(l.type==="ivec2")r.gl.uniform2iv(c,p);else if(l.type==="ivec3")r.gl.uniform3iv(c,p);else if(l.type==="ivec4")r.gl.uniform4iv(c,p);else throw Error(`uniform type ${l.type} is not supported yet.`)}),r.executeProgram()}function aw(r,e,t){let o="";e.concat(t).forEach(i=>{let a=i.texData!=null&&i.texData.slice!=null&&i.texData.slice.flatOffset>0;if(r.enableShapeUniforms&&!i.isUniform){let l=i.texData.texShape,{useSqueezeShape:u,uniformShape:c,keptDims:p}=Uu(r.packedInputs,i.shape,l),m="",f="",d="";if(c.length===1&&r.packedInputs){let I=[Math.ceil(l[0]/2),Math.ceil(l[1]/2)];m=`${I[0]>1}_${I[1]>1}`}else if(c.length===2&&!r.packedInputs)f=`${c[0]>1}_${c[1]>1}`;else if(c.length>2&&!r.packedInputs){let I=C.computeStrides(c);d=`${I[0]===l[1]}_${I[I.length-1]===l[1]}`}let g=i.shape.length,h=c.length===2&&C.arraysEqual(i.shape,l),b=C.sizeFromShape(i.shape)===1,T=N.getBroadcastDims(i.shape,t.shape),k=!r.packedInputs&&g===t.shape.length&&C.arraysEqual(l,t.texData.texShape),S=r.packedInputs||c.length>2?"":`${l[0]>1}_${l[1]>1}`;o+=`${g}_${k}_${u?p:""}_${c.length}_${b}_${T}_${h}_${m}_${f}_${d}_${S}_${a}`}else{let l=i.isUniform?"uniform":i.texData.texShape;o+=`${i.shape}_${l}_${a}`}});let n=r.userCode,s=r.constructor.name;return s+="_"+o+"_"+n+`${E().getNumber("WEBGL_VERSION")}`,s}function de(r){return E().getBool("WEBGL_USE_SHAPES_UNIFORMS")&&r<=4}var vd=class{constructor(e){this.variableNames=["A"],this.packedInputs=!1,this.packedOutput=!0,this.outPackingScheme=to.DENSE,this.customUniforms=[{name:"texShape",type:"ivec2"}];let t=_e();this.outputShape=e,this.enableShapeUniforms=de(this.outputShape.length),this.userCode=`
      ivec3 outCoordsFromFlatIndex(int index) {
        ${this.enableShapeUniforms?ln(["r","c","d"],e):Jt(["r","c","d"],e)}
        return ivec3(r, c, d);
      }

      void main() {
        ivec2 resTexRC = ivec2(resultUV.yx * vec2(texShape[0], texShape[1]));
        int index = 4 * (resTexRC.x * texShape[1] + resTexRC.y);

        vec4 result = vec4(0.);

        for (int i=0; i<4; i++) {
          int flatIndex = index + i;
          ivec3 rc = outCoordsFromFlatIndex(flatIndex);
          result[i] = getA(rc.x, rc.y, rc.z);
        }

        ${t.output} = result;
      }
    `}};var Td=class{constructor(e){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.outPackingScheme=to.DENSE,this.customUniforms=[{name:"texShape",type:"ivec2"}];let t=_e();this.outputShape=e,this.enableShapeUniforms=de(this.outputShape.length),this.userCode=`
      ivec3 outCoordsFromFlatIndex(int index) {
        ${this.enableShapeUniforms?ln(["r","c","d"],e):Jt(["r","c","d"],e)}
        return ivec3(r, c, d);
      }

      void main() {
        ivec2 resTexRC = ivec2(resultUV.yx * vec2(texShape[0], texShape[1]));
        int index = 4 * (resTexRC.x * texShape[1] + resTexRC.y);

        vec4 result = vec4(0.);

        for (int i=0; i<4; i++) {
          int flatIndex = index + i;
          ivec3 rc = outCoordsFromFlatIndex(flatIndex);
          result[i] = getChannel(getA(rc.x, rc.y, rc.z), vec2(rc.y, rc.z));
        }

        ${t.output} = result;
      }
    `}};var Cd=class{constructor(e){this.variableNames=["A"],this.outTexUsage=je.DOWNLOAD;let t=_e();this.outputShape=e,this.userCode=`
      ${zu}

      void main() {
        float x = getAAtOutCoords();
        ${t.output} = encode_float(x);
      }
    `}};var kd=class{constructor(e){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!1,this.outTexUsage=je.DOWNLOAD;let t=_e();this.outputShape=e,this.userCode=`
      ${zu}

      void main() {
        ivec3 coords = getOutputCoords();
        float x = getChannel(getAAtOutCoords(), vec2(coords.y, coords.z));
        ${t.output} = encode_float(x);
      }
    `}};var Nd=class{constructor(e,t=!1){this.variableNames=["A"],this.customUniforms=[{name:"texShape",type:"ivec2"}];let o=_e();this.outputShape=e,this.enableShapeUniforms=de(this.outputShape.length);let n="result";t&&(n="floor(result * 255. + 0.5)"),this.userCode=`
      ${this.enableShapeUniforms?rs():ts(e)}

      void main() {
        ivec3 coords = getOutputCoords();

        int flatIndex = getFlatIndex(coords);
        int offset = imod(flatIndex, 4);

        flatIndex = idiv(flatIndex, 4, 1.);

        int r = flatIndex / texShape[1];
        int c = imod(flatIndex, texShape[1]);
        vec2 uv = (vec2(c, r) + halfCR) / vec2(texShape[1], texShape[0]);
        vec4 values = ${o.texture2D}(A, uv);

        float result;

        if(offset == 0) {
          result = values[0];
        } else if(offset == 1) {
          result = values[1];
        } else if(offset == 2) {
          result = values[2];
        } else {
          result = values[3];
        }

        ${o.output} = vec4(${n}, 0., 0., 0.);
      }
    `}};var Sd=class{constructor(e,t=!1){this.variableNames=["A"],this.packedInputs=!1,this.packedOutput=!0,this.customUniforms=[{name:"texShape",type:"ivec2"}];let o=_e();this.outputShape=e,this.enableShapeUniforms=de(this.outputShape.length);let n="",s="result";t&&(s="floor(result * 255. + 0.5)");for(let i=0;i<=1;i++)for(let a=0;a<=1;a++){let l=i*2+a;n+=`
          localCoords = coords;
          if(localCoords[2] + ${a} < ${this.enableShapeUniforms?"outShape[2]":`${e[2]}`}) {
          localCoords[2] += ${a};
          if (localCoords[1] + ${i} < ${this.enableShapeUniforms?"outShape[1]":`${e[1]}`}) {
            localCoords[1] += ${i};

            flatIndex = getFlatIndex(localCoords);
            offset = imod(flatIndex, 4);

            flatIndex = idiv(flatIndex, 4, 1.);

            int r = flatIndex / texShape[1];
            int c = imod(flatIndex, texShape[1]);
            vec2 uv = (vec2(c, r) + halfCR) / vec2(texShape[1], texShape[0]);
            values = ${o.texture2D}(A, uv);

            if (offset == 0) {
              result[${l}] = values[0];
            } else if (offset == 1) {
              result[${l}] = values[1];
            } else if (offset == 2) {
              result[${l}] = values[2];
            } else {
              result[${l}] = values[3];
            }
          }
        }
        `}this.userCode=`
        ${this.enableShapeUniforms?rs():ts(e)}

        void main() {
          ivec3 coords = getOutputCoords();

          vec4 result = vec4(0.);
          int flatIndex, r, c, offset;
          ivec3 localCoords;
          vec2 uv;
          vec4 values;

          ${n}

          ${o.output} = ${s};
        }
    `}};var Wd={};re(Wd,{bindVertexProgramAttributeStreams:()=>Pd,createBufferFromOutputTexture:()=>Md,createFloat16MatrixTexture:()=>Rd,createFloat16PackedMatrixTexture:()=>Od,createFloat32MatrixTexture:()=>Ad,createIndexBuffer:()=>$d,createPackedMatrixTexture:()=>Fd,createUnsignedBytesMatrixTexture:()=>Dd,createVertexBuffer:()=>Id,createVertexShader:()=>Ed,downloadByteEncodedFloatMatrixFromOutputTexture:()=>Gd,downloadFloat32MatrixFromBuffer:()=>Vd,downloadMatrixFromPackedOutputTexture:()=>Ud,downloadPackedMatrixFromBuffer:()=>zd,getInternalFormatForFloat16MatrixTexture:()=>ju,getInternalFormatForFloat16PackedMatrixTexture:()=>Ku,getInternalFormatForFloat32MatrixTexture:()=>Wu,getInternalFormatForPackedMatrixTexture:()=>qu,getInternalFormatForUnsignedBytesMatrixTexture:()=>Hu,uploadDenseMatrixToTexture:()=>Ld,uploadPixelDataToTexture:()=>Bd});function Ed(r){let e=_e(),t=`${e.version}
    precision highp float;
    ${e.attribute} vec3 clipSpacePos;
    ${e.attribute} vec2 uv;
    ${e.varyingVs} vec2 resultUV;

    void main() {
      gl_Position = vec4(clipSpacePos, 1);
      resultUV = uv;
    }`;return ed(r,t)}function Id(r){let e=new Float32Array([-1,1,0,0,1,-1,-1,0,0,0,1,1,0,1,1,1,-1,0,1,0]);return nd(r,e)}function $d(r){let e=new Uint16Array([0,1,2,2,1,3]);return sd(r,e)}function Il(r,e,t,o,n,s){ad(e,t);let i=id(r),a=r.TEXTURE_2D;return V(r,()=>r.bindTexture(a,i)),V(r,()=>r.texParameteri(a,r.TEXTURE_WRAP_S,r.CLAMP_TO_EDGE)),V(r,()=>r.texParameteri(a,r.TEXTURE_WRAP_T,r.CLAMP_TO_EDGE)),V(r,()=>r.texParameteri(a,r.TEXTURE_MIN_FILTER,r.NEAREST)),V(r,()=>r.texParameteri(a,r.TEXTURE_MAG_FILTER,r.NEAREST)),E().getNumber("WEBGL_VERSION")===1?V(r,()=>r.texImage2D(a,0,o,e,t,0,n,s,null)):V(r,()=>r.texStorage2D(a,1,o,e,t)),V(r,()=>r.bindTexture(r.TEXTURE_2D,null)),{texture:i,texShape:[t,e]}}function Wu(r){return r.internalFormatFloat}function Ad(r,e,t,o){let[n,s]=an(e,t);return Il(r,n,s,Wu(o),o.textureFormatFloat,r.FLOAT)}function ju(r){return r.internalFormatHalfFloat}function Rd(r,e,t,o){let[n,s]=an(e,t);return Il(r,n,s,ju(o),o.textureFormatFloat,o.textureTypeHalfFloat)}function Hu(r){return r.downloadTextureFormat}function Dd(r,e,t,o){let[n,s]=an(e,t);return Il(r,n,s,Hu(o),r.RGBA,r.UNSIGNED_BYTE)}function qu(r){return r.internalFormatPackedFloat}function Fd(r,e,t,o){let[n,s]=fr(e,t);return Il(r,n,s,qu(o),r.RGBA,r.FLOAT)}function Ku(r){return r.internalFormatPackedHalfFloat}function Od(r,e,t,o){let[n,s]=fr(e,t);return Il(r,n,s,Ku(o),r.RGBA,o.textureTypeHalfFloat)}function Pd(r,e,t){let o=0,n=3*4,s=3*4+2*4;return V(r,()=>r.bindBuffer(r.ARRAY_BUFFER,t)),Pu(r,e,"clipSpacePos",t,3,s,o)&&Pu(r,e,"uv",t,2,s,n)}function Ld(r,e,t,o,n,s){V(r,()=>r.bindTexture(r.TEXTURE_2D,e));let i,a,l;n instanceof Uint8Array?(i=new Uint8Array(t*o*4),a=r.UNSIGNED_BYTE,l=r.RGBA):(i=new Float32Array(t*o*4),a=r.FLOAT,l=s.internalFormatPackedFloat),i.set(n),E().getNumber("WEBGL_VERSION")===2?V(r,()=>r.texSubImage2D(r.TEXTURE_2D,0,0,0,t,o,r.RGBA,a,i)):V(r,()=>r.texImage2D(r.TEXTURE_2D,0,l,t,o,0,r.RGBA,a,i)),V(r,()=>r.bindTexture(r.TEXTURE_2D,null))}function Bd(r,e,t){V(r,()=>r.bindTexture(r.TEXTURE_2D,e)),t.data instanceof Uint8Array?E().getNumber("WEBGL_VERSION")===2?V(r,()=>r.texSubImage2D(r.TEXTURE_2D,0,0,0,t.width,t.height,r.RGBA,r.UNSIGNED_BYTE,t.data)):V(r,()=>r.texImage2D(r.TEXTURE_2D,0,r.RGBA,t.width,t.height,0,r.RGBA,r.UNSIGNED_BYTE,t.data)):E().getNumber("WEBGL_VERSION")===2?V(r,()=>r.texSubImage2D(r.TEXTURE_2D,0,0,0,r.RGBA,r.UNSIGNED_BYTE,t)):V(r,()=>r.texImage2D(r.TEXTURE_2D,0,r.RGBA,r.RGBA,r.UNSIGNED_BYTE,t)),V(r,()=>r.bindTexture(r.TEXTURE_2D,null))}function Md(r,e,t,o){let n=r.createBuffer();V(r,()=>r.bindBuffer(r.PIXEL_PACK_BUFFER,n));let a=4*4*e*t;return V(r,()=>r.bufferData(r.PIXEL_PACK_BUFFER,a,r.STREAM_READ)),V(r,()=>r.readPixels(0,0,t,e,r.RGBA,r.FLOAT,0)),V(r,()=>r.bindBuffer(r.PIXEL_PACK_BUFFER,null)),n}function Vd(r,e,t){let o=r,n=new Float32Array(t);return o.bindBuffer(o.PIXEL_PACK_BUFFER,e),o.getBufferSubData(o.PIXEL_PACK_BUFFER,0,n),o.bindBuffer(o.PIXEL_PACK_BUFFER,null),n}function Gd(r,e,t,o){let[n,s]=an(e,t),i=4,a=new Uint8Array(q_(e*t,i));return V(r,()=>r.readPixels(0,0,n,s,o.downloadTextureFormat,r.UNSIGNED_BYTE,a)),new Float32Array(a.buffer)}function zd(r,e,t,o,n,s,i,a){let l=r,u=new Float32Array(K_(s,i));return l.bindBuffer(l.PIXEL_PACK_BUFFER,e),l.getBufferSubData(l.PIXEL_PACK_BUFFER,0,u),l.bindBuffer(l.PIXEL_PACK_BUFFER,null),u}function Ud(r,e,t){let o=new Float32Array(e*t*4);return V(r,()=>r.readPixels(0,0,t,e,r.RGBA,r.FLOAT,o)),o}var cn=class{constructor(e){this.outputTexture=null,this.program=null,this.disposed=!1,this.vertexAttrsAreBound=!1,this.itemsToPoll=[];let t=E().getNumber("WEBGL_VERSION");e!=null?(this.gl=e,Fu(t,e)):this.gl=yt(t);let o="WEBGL_color_buffer_float",n="EXT_color_buffer_half_float";if(this.parallelCompilationExtension=this.gl.getExtension("KHR_parallel_shader_compile"),E().getNumber("WEBGL_VERSION")===1){let s="OES_texture_float",i="OES_texture_half_float";if(this.textureFloatExtension=Jn(this.gl,s),bt(this.gl,i))this.textureHalfFloatExtension=Jn(this.gl,i);else if(E().get("WEBGL_FORCE_F16_TEXTURES"))throw new Error("GL context does not support half float textures, yet the environment flag WEBGL_FORCE_F16_TEXTURES is set to true.");if(this.colorBufferFloatExtension=this.gl.getExtension(o),bt(this.gl,n))this.colorBufferHalfFloatExtension=Jn(this.gl,n);else if(E().get("WEBGL_FORCE_F16_TEXTURES"))throw new Error("GL context does not support color renderable half floats, yet the environment flag WEBGL_FORCE_F16_TEXTURES is set to true.")}else if(o="EXT_color_buffer_float",bt(this.gl,o))this.colorBufferFloatExtension=this.gl.getExtension(o);else if(bt(this.gl,n))this.colorBufferHalfFloatExtension=this.gl.getExtension(n);else throw new Error("GL context does not support color renderable floats");this.vertexBuffer=Id(this.gl),this.indexBuffer=$d(this.gl),this.framebuffer=ld(this.gl),this.textureConfig=kl(this.gl,this.textureHalfFloatExtension)}get debug(){return E().getBool("DEBUG")}dispose(){if(this.disposed)return;this.program!=null&&console.warn("Disposing a GPGPUContext that still has a bound WebGLProgram. This is probably a resource leak, delete the program with GPGPUContext.deleteProgram before disposing."),this.outputTexture!=null&&console.warn("Disposing a GPGPUContext that still has a bound output matrix texture.  This is probably a resource leak, delete the output matrix texture with GPGPUContext.deleteMatrixTexture before disposing.");let e=this.gl;V(e,()=>e.finish()),V(e,()=>e.bindFramebuffer(e.FRAMEBUFFER,null)),V(e,()=>e.deleteFramebuffer(this.framebuffer)),V(e,()=>e.bindBuffer(e.ARRAY_BUFFER,null)),V(e,()=>e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,null)),V(e,()=>e.deleteBuffer(this.indexBuffer)),this.disposed=!0}createFloat32MatrixTexture(e,t){return this.throwIfDisposed(),Ad(this.gl,e,t,this.textureConfig)}createFloat16MatrixTexture(e,t){return this.throwIfDisposed(),Rd(this.gl,e,t,this.textureConfig)}createUnsignedBytesMatrixTexture(e,t){return this.throwIfDisposed(),Dd(this.gl,e,t,this.textureConfig)}uploadPixelDataToTexture(e,t){this.throwIfDisposed(),Bd(this.gl,e,t)}uploadDenseMatrixToTexture(e,t,o,n){this.throwIfDisposed(),Ld(this.gl,e,t,o,n,this.textureConfig)}createFloat16PackedMatrixTexture(e,t){return this.throwIfDisposed(),Od(this.gl,e,t,this.textureConfig)}createPackedMatrixTexture(e,t){return this.throwIfDisposed(),Fd(this.gl,e,t,this.textureConfig)}deleteMatrixTexture(e){this.throwIfDisposed(),this.outputTexture===e&&(Lu(this.gl,this.framebuffer),this.outputTexture=null),V(this.gl,()=>this.gl.deleteTexture(e))}downloadByteEncodedFloatMatrixFromOutputTexture(e,t,o){return this.downloadMatrixDriver(e,()=>Gd(this.gl,t,o,this.textureConfig))}downloadPackedMatrixFromBuffer(e,t,o,n,s,i){return zd(this.gl,e,t,o,n,s,i,this.textureConfig)}downloadFloat32MatrixFromBuffer(e,t){return Vd(this.gl,e,t)}createBufferFromTexture(e,t,o){this.bindTextureToFrameBuffer(e);let n=Md(this.gl,t,o,this.textureConfig);return this.unbindTextureToFrameBuffer(),n}createAndWaitForFence(){let e=this.createFence(this.gl);return this.pollFence(e)}createFence(e){let t,o;if(E().getBool("WEBGL_FENCE_API_ENABLED")){let n=e,s=n.fenceSync(n.SYNC_GPU_COMMANDS_COMPLETE,0);e.flush(),o=()=>{let i=n.clientWaitSync(s,0,0);return i===n.ALREADY_SIGNALED||i===n.CONDITION_SATISFIED},t=s}else E().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION")>0?(t=this.beginQuery(),this.endQuery(),o=()=>this.isQueryAvailable(t,E().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION"))):o=()=>!0;return{query:t,isFencePassed:o}}downloadMatrixFromPackedTexture(e,t,o){return this.downloadMatrixDriver(e,()=>Ud(this.gl,t,o))}createProgram(e){this.throwIfDisposed();let t=this.gl;this.vertexShader==null&&(this.vertexShader=Ed(t));let o=rd(t);return V(t,()=>t.attachShader(o,this.vertexShader)),V(t,()=>t.attachShader(o,e)),od(t,o),this.debug&&Nl(t,o),this.vertexAttrsAreBound||(this.setProgram(o),this.vertexAttrsAreBound=Pd(t,this.program,this.vertexBuffer)),o}deleteProgram(e){this.throwIfDisposed(),e===this.program&&(this.program=null),e!=null&&V(this.gl,()=>this.gl.deleteProgram(e))}setProgram(e){this.throwIfDisposed(),this.program=e,this.program!=null&&this.debug&&Nl(this.gl,this.program),V(this.gl,()=>this.gl.useProgram(e))}getUniformLocation(e,t,o=!0){return this.throwIfDisposed(),o?ud(this.gl,e,t):cd(this.gl,e,t)}getAttributeLocation(e,t){return this.throwIfDisposed(),V(this.gl,()=>this.gl.getAttribLocation(e,t))}getUniformLocationNoThrow(e,t){return this.throwIfDisposed(),this.gl.getUniformLocation(e,t)}setInputMatrixTexture(e,t,o){this.throwIfDisposed(),this.throwIfNoProgram(),pd(this.gl,e,t,o)}setOutputMatrixTexture(e,t,o){this.setOutputMatrixTextureDriver(e,o,t)}setOutputPackedMatrixTexture(e,t,o){this.throwIfDisposed();let[n,s]=fr(t,o);this.setOutputMatrixTextureDriver(e,n,s)}setOutputMatrixWriteRegion(e,t,o,n){this.setOutputMatrixWriteRegionDriver(o,e,n,t)}setOutputPackedMatrixWriteRegion(e,t,o,n){throw new Error("setOutputPackedMatrixWriteRegion not implemented.")}debugValidate(){this.program!=null&&Nl(this.gl,this.program),es(this.gl)}executeProgram(){this.throwIfDisposed(),this.throwIfNoProgram();let e=this.gl;this.debug&&this.debugValidate(),V(e,()=>e.drawElements(e.TRIANGLES,6,e.UNSIGNED_SHORT,0))}blockUntilAllProgramsCompleted(){this.throwIfDisposed(),V(this.gl,()=>this.gl.finish())}getQueryTimerExtension(){return this.disjointQueryTimerExtension==null&&(this.disjointQueryTimerExtension=Jn(this.gl,E().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION")===2?"EXT_disjoint_timer_query_webgl2":"EXT_disjoint_timer_query")),this.disjointQueryTimerExtension}getQueryTimerExtensionWebGL2(){return this.getQueryTimerExtension()}getQueryTimerExtensionWebGL1(){return this.getQueryTimerExtension()}beginQuery(){if(E().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION")===2){let o=this.gl,n=this.getQueryTimerExtensionWebGL2(),s=o.createQuery();return o.beginQuery(n.TIME_ELAPSED_EXT,s),s}let e=this.getQueryTimerExtensionWebGL1(),t=e.createQueryEXT();return e.beginQueryEXT(e.TIME_ELAPSED_EXT,t),t}endQuery(){if(E().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION")===2){let t=this.gl,o=this.getQueryTimerExtensionWebGL2();t.endQuery(o.TIME_ELAPSED_EXT);return}let e=this.getQueryTimerExtensionWebGL1();e.endQueryEXT(e.TIME_ELAPSED_EXT)}async waitForQueryAndGetTime(e){return await C.repeatedTry(()=>this.disposed||this.isQueryAvailable(e,E().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION"))),this.getQueryTime(e,E().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION"))}getQueryTime(e,t){if(t===0)return null;if(t===2){let o=this.gl;return o.getQueryParameter(e,o.QUERY_RESULT)/1e6}else{let o=this.getQueryTimerExtensionWebGL1();return o.getQueryObjectEXT(e,o.QUERY_RESULT_EXT)/1e6}}isQueryAvailable(e,t){if(t===0)return!0;if(t===2){let o=this.gl,n=this.getQueryTimerExtensionWebGL2(),s=o.getQueryParameter(e,o.QUERY_RESULT_AVAILABLE);return this.disjoint==null&&(this.disjoint=this.gl.getParameter(n.GPU_DISJOINT_EXT)),s&&!this.disjoint}else{let o=this.getQueryTimerExtensionWebGL1(),n=o.getQueryObjectEXT(e,o.QUERY_RESULT_AVAILABLE_EXT);return this.disjoint==null&&(this.disjoint=this.gl.getParameter(o.GPU_DISJOINT_EXT)),n&&!this.disjoint}}pollFence(e){return new Promise(t=>{this.addItemToPoll(()=>e.isFencePassed(),()=>t())})}pollItems(){let e=gD(this.itemsToPoll.map(t=>t.isDoneFn));for(let t=0;t<=e;++t){let{resolveFn:o}=this.itemsToPoll[t];o()}this.itemsToPoll=this.itemsToPoll.slice(e+1)}addItemToPoll(e,t){if(this.itemsToPoll.push({isDoneFn:e,resolveFn:t}),this.itemsToPoll.length>1)return;let o;"setTimeoutCustom"in E().platform&&(o=E().platform.setTimeoutCustom.bind(E().platform)),C.repeatedTry(()=>(this.pollItems(),this.itemsToPoll.length===0),()=>0,null,o)}bindTextureToFrameBuffer(e){this.throwIfDisposed(),Sl(this.gl,e,this.framebuffer),this.debug&&es(this.gl)}unbindTextureToFrameBuffer(){this.outputTexture!=null?(Sl(this.gl,this.outputTexture,this.framebuffer),this.debug&&es(this.gl)):Lu(this.gl,this.framebuffer)}downloadMatrixDriver(e,t){this.bindTextureToFrameBuffer(e);let o=t();return this.unbindTextureToFrameBuffer(),o}setOutputMatrixTextureDriver(e,t,o){this.throwIfDisposed();let n=this.gl;Sl(n,e,this.framebuffer),this.debug&&es(n),this.outputTexture=e,V(n,()=>n.viewport(0,0,t,o)),V(n,()=>n.scissor(0,0,t,o))}setOutputMatrixWriteRegionDriver(e,t,o,n){this.throwIfDisposed(),V(this.gl,()=>this.gl.scissor(e,t,o,n))}throwIfDisposed(){if(this.disposed)throw new Error("Attempted to use disposed GPGPUContext.")}throwIfNoProgram(){if(this.program==null)throw new Error("No GPU program is currently set.")}};function gD(r){let e=0;for(;e<r.length&&r[e]();++e);return e-1}var ch={};re(ch,{addImpl:()=>qd,bincountImpl:()=>cw,bincountReduceImpl:()=>pw,castImpl:()=>Hd,ceilImpl:()=>Kd,concatImpl:()=>mw,equalImpl:()=>Xd,expImpl:()=>Yd,expm1Impl:()=>Qd,floorImpl:()=>Zd,gatherNdImpl:()=>fw,gatherV2Impl:()=>dw,greaterEqualImpl:()=>eh,greaterImpl:()=>Jd,lessEqualImpl:()=>rh,lessImpl:()=>th,linSpaceImpl:()=>hw,logImpl:()=>oh,maxImpl:()=>gw,maximumImpl:()=>nh,minimumImpl:()=>sh,multiplyImpl:()=>Rl,negImpl:()=>xw,notEqualImpl:()=>ih,prodImpl:()=>bw,raggedGatherImpl:()=>ww,raggedTensorToTensorImpl:()=>Cw,rangeImpl:()=>kw,rsqrtImpl:()=>ah,scatterImpl:()=>Nw,sigmoidImpl:()=>Sw,simpleAbsImpl:()=>lw,sliceImpl:()=>Ew,sparseFillEmptyRowsImpl:()=>Iw,sparseReshapeImpl:()=>$w,sparseSegmentReductionImpl:()=>Aw,sqrtImpl:()=>Rw,squaredDifferenceImpl:()=>lh,stridedSliceImpl:()=>Dw,stringNGramsImpl:()=>Ow,stringSplitImpl:()=>Pw,stringToHashBucketFastImpl:()=>Lw,subImpl:()=>uh,tileImpl:()=>Bw,topKImpl:()=>Vw,transposeImpl:()=>yw,uniqueImpl:()=>Gw});function $l(r,e){Array.isArray(r)||(r=[r]),r.forEach(t=>{t!=null&&C.assert(t.dtype!=="complex64",()=>`${e} does not support complex64 tensors in the CPU backend.`)})}function lw(r){let e=new Float32Array(r.length);for(let t=0;t<r.length;++t)e[t]=Math.abs(r[t]);return e}function Ce(r){return(e,t,o,n,s)=>{let i=N.assertAndGetBroadcastShape(e,t),a=i.length,l=C.computeStrides(i),u=C.sizeFromShape(i),c=C.getTypedArrayFromDType(s,u),p=e.length,m=t.length,f=C.computeStrides(e),d=C.computeStrides(t),g=N.getBroadcastDims(e,i),h=N.getBroadcastDims(t,i);if(g.length+h.length===0)for(let b=0;b<c.length;++b)c[b]=r(o[b%o.length],n[b%n.length]);else for(let b=0;b<c.length;++b){let T=C.indexToLoc(b,a,l),k=T.slice(-p);g.forEach(R=>k[R]=0);let S=C.locToIndex(k,p,f),I=T.slice(-m);h.forEach(R=>I[R]=0);let A=C.locToIndex(I,m,d);c[b]=r(o[S],n[A])}return[c,i]}}function as(r){let{inputs:e,backend:t}=r,{real:o,imag:n}=e,s=t.data.get(o.dataId).values,i=t.data.get(n.dataId).values,a=t.makeTensorInfo(o.shape,"complex64"),l=t.data.get(a.dataId);return l.complexTensorInfos={real:t.makeTensorInfo(o.shape,"float32",s),imag:t.makeTensorInfo(n.shape,"float32",i)},a}function Xu(r,e,t="float32"){if(t==="complex64"){let n=Xu(r,e,"float32"),s=Xu(r,e,"float32");return as({inputs:{real:n,imag:s},backend:r})}let o=C.makeZerosTypedArray(C.sizeFromShape(e),t);return r.makeTensorInfo(e,t,o)}function jd(r){let{inputs:e,backend:t}=r,{x:o}=e;return t.incRef(o.dataId),{dataId:o.dataId,shape:o.shape,dtype:o.dtype}}function uw(r){let{inputs:e,backend:t}=r,{input:o}=e,n=t.data.get(o.dataId).complexTensorInfos.real,s=t.data.get(n.dataId).values;return t.makeTensorInfo(n.shape,n.dtype,s)}function Hd(r,e,t,o){if(o==="int32"){let n=Int32Array.from(r);return[e,"int32",n]}if(o==="bool"){let n=C.toTypedArray([0],t),[s,i]=Ce((a,l)=>a!==l?1:0)(e,[],r,n,"bool");return[i,"bool",s]}throw new Error(`Error in Cast: failed to cast ${t} to ${o}`)}function Al(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{dtype:s}=o;if(s==="complex64"){if(n.dtype==="complex64")return jd({inputs:{x:n},backend:t});let c=Xu(t,n.shape,n.dtype),p=Al({inputs:{x:n},backend:t,attrs:{dtype:"float32"}}),m=as({inputs:{real:p,imag:c},backend:t});return t.disposeIntermediateTensorInfo(c),t.disposeIntermediateTensorInfo(p),m}if(n.dtype==="complex64"){let c=uw({inputs:{input:n},backend:t}),p=Al({inputs:{x:c},backend:t,attrs:{dtype:s}});return t.disposeIntermediateTensorInfo(c),p}if(!C.hasEncodingLoss(n.dtype,s)){let c=jd({inputs:{x:n},backend:t});return{dataId:c.dataId,shape:c.shape,dtype:s}}let i=t.data.get(n.dataId).values,[a,l,u]=Hd(i,n.shape,n.dtype,s);return t.makeTensorInfo(a,l,u)}function Se(r,e,t,o){return t==null?({inputs:n,backend:s})=>{let{a:i,b:a}=n,l=s;$l([i,a],r);let u=l.data.get(i.dataId).values,c=l.data.get(a.dataId).values,p=i.dtype==="string"?N.fromUint8ToStringArray(u):u,m=i.dtype==="string"?N.fromUint8ToStringArray(c):c,f=o||i.dtype,[d,g]=e(i.shape,a.shape,p,m,f);return l.makeTensorInfo(g,f,d)}:({inputs:n,backend:s})=>{let{a:i,b:a}=n,l=s;if(i.dtype==="complex64"||a.dtype==="complex64"){let u=Al({inputs:{x:i},backend:l,attrs:{dtype:"complex64"}}),c=l.data.get(u.dataId),p=c.complexTensorInfos.real,m=c.complexTensorInfos.imag,f=l.data.get(p.dataId).values,d=l.data.get(m.dataId).values,g=Al({inputs:{x:a},backend:l,attrs:{dtype:"complex64"}}),h=l.data.get(g.dataId),b=h.complexTensorInfos.real,T=h.complexTensorInfos.imag,k=l.data.get(b.dataId).values,S=l.data.get(T.dataId).values,[I,A,R]=t(i.shape,a.shape,f,d,k,S),D=l.makeTensorInfo(R,"float32",I),P=l.makeTensorInfo(R,"float32",A),L=as({inputs:{real:D,imag:P},backend:l});return l.disposeIntermediateTensorInfo(u),l.disposeIntermediateTensorInfo(g),l.disposeIntermediateTensorInfo(D),l.disposeIntermediateTensorInfo(P),L}else{let u=l.data.get(i.dataId).values,c=l.data.get(a.dataId).values,p=o||i.dtype,[m,f]=e(i.shape,a.shape,u,c,p);return l.makeTensorInfo(f,p,m)}}}function ls(r){return(e,t,o,n,s,i)=>{let a=N.assertAndGetBroadcastShape(e,t),l=C.sizeFromShape(a),u=a.length,c=C.computeStrides(a),p=C.getTypedArrayFromDType("float32",l),m=C.getTypedArrayFromDType("float32",l),f=N.getBroadcastDims(e,a),d=N.getBroadcastDims(t,a),g=N.mergeRealAndImagArrays(o,n),h=N.mergeRealAndImagArrays(s,i),b=e.length,T=C.computeStrides(e),k=t.length,S=C.computeStrides(t);if(f.length+d.length===0)for(let I=0;I<p.length;I++){let A=I%g.length,R=I%h.length,D=r(g[A*2],g[A*2+1],h[R*2],h[R*2+1]);p[I]=D.real,m[I]=D.imag}else for(let I=0;I<p.length;I++){let A=C.indexToLoc(I,u,c),R=A.slice(-b);f.forEach(B=>R[B]=0);let D=C.locToIndex(R,b,T),P=A.slice(-k);d.forEach(B=>P[B]=0);let L=C.locToIndex(P,k,S),z=r(g[D*2],g[D*2+1],h[L*2],h[L*2+1]);p[I]=z.real,m[I]=z.imag}return[p,m,a]}}var qd=Ce((r,e)=>r+e),xD=ls((r,e,t,o)=>({real:r+t,imag:e+o})),Vye=Se(xr,qd,xD);function cw(r,e,t,o,n){let s=C.sizeFromShape(o),i=C.makeZerosTypedArray(n,t);for(let a=0;a<r.length;a++){let l=r[a];if(l<0)throw new Error("Input x must be non-negative!");l>=n||(s>0?i[l]+=e[a]:i[l]+=1)}return i}function pw(r,e,t,o=!1){let n=r.shape[0],s=r.shape[1],i=te([n,t],e.dtype);for(let a=0;a<n;a++)for(let l=0;l<s;l++){let u=r.get(a,l);if(u<0)throw new Error("Input x must be non-negative!");u>=t||(o?i.set(1,a,u):e.size>0?i.set(i.get(a,u)+e.get(a,l),a,u):i.set(i.get(a,u)+1,a,u))}return i}function nt(r){return(e,t,o)=>{let n=C.getTypedArrayFromDType(t,e.length);for(let s=0;s<e.length;++s)n[s]=r(e[s],o);return n}}function Yu(r,e,t){return({inputs:o,attrs:n,backend:s})=>{let{x:i}=o;if($l(i,r),i.dtype==="string"||t==="string")throw new Error("unaryKernelFunc does not support string input/output");let a=s,l=a.data.get(i.dataId).values,u=C.sizeFromShape(i.shape),c=t||i.dtype,p=C.getArrayFromDType(c,u);for(let m=0;m<u;++m)p[m]=e(l[m],n);return a.makeTensorInfo(i.shape,c,p)}}function Ft(r,e,t){return({inputs:o,attrs:n,backend:s})=>{let{x:i}=o;if($l(i,r),i.dtype==="string"||t==="string")throw new Error("unaryKernelFunc does not support string input/output");let a=s,l=a.data.get(i.dataId).values,u=t||i.dtype,c=e(l,u,n);return a.makeTensorInfo(i.shape,u,c)}}var Kd=nt(r=>Math.ceil(r)),Zye=Ft(co,Kd);function mw(r,e,t,o){let n=C.getArrayFromDType(t,C.sizeFromShape(e));if(o&&t!=="string"){let s=0;r.forEach(i=>{let a=C.sizeFromShape(i.shape);n.set(i.vals,s),s+=a})}else{let s=0;r.forEach(i=>{let a=t==="string"?N.fromUint8ToStringArray(i.vals):i.vals,l=0;for(let u=0;u<i.shape[0];++u){let c=u*e[1]+s;for(let p=0;p<i.shape[1];++p)n[c+p]=a[l++]}s+=i.shape[1]})}return n}var Xd=Ce((r,e)=>r===e?1:0),sbe=Se(po,Xd,null,"bool");var Yd=nt(r=>Math.exp(r)),cbe=Ft(mo,Yd,"float32");var Qd=nt(r=>Math.expm1(r)),hbe=Ft(fo,Qd);var Zd=nt(r=>Math.floor(r)),_be=Ft(ho,Zd);function fw(r,e,t,o,n,s,i,a,l){let u=te([o,s],t);for(let c=0;c<o;c++){let p=[],m=0;for(let f=0;f<n;f++){let d=r[c*n+f];m+=d*i[f],p.push(d)}if(m<0||m>=l/s)throw new Error(`Invalid indices: ${p} does not index into ${a}`);for(let f=0;f<s;f++)u.values[c*s+f]=e.get(...e.indexToLoc(m*s+f))}return u}function dw(r,e,t){let o=te(t,r.dtype);for(let n=0;n<o.size;++n){let i=o.indexToLoc(n).slice(),a=i[0],l=i[2],u=e.locToIndex([a,l]);i[2]=e.values[u];let c=r.locToIndex(i);0<=c&&c<r.values.length&&(o.values[n]=r.values[c])}return o}var Jd=Ce((r,e)=>r>e?1:0),Ibe=Se(go,Jd,null,"bool");var eh=Ce((r,e)=>r>=e?1:0),Fbe=Se(xo,eh,null,"bool");var th=Ce((r,e)=>r<e?1:0),Mbe=Se(yo,th,null,"bool");var rh=Ce((r,e)=>r<=e?1:0),Wbe=Se(bo,rh,null,"bool");function hw(r,e,t){let o=(e-r)/(t-1),n=C.makeZerosTypedArray(t,"float32");n[0]=r;for(let s=1;s<n.length;s++)n[s]=n[s-1]+o;return n}var oh=nt(r=>Math.log(r)),Qbe=Ft(_o,oh);function gw(r,e,t,o){let n=C.getTypedArrayFromDType(o,C.sizeFromShape(t));for(let s=0;s<n.length;++s){let i=s*e,a=r[i];for(let l=0;l<e;++l){let u=r[i+l];(Number.isNaN(u)||u>a)&&(a=u)}n[s]=a}return n}var nh=Ce((r,e)=>Math.max(r,e)),n_e=Se(wo,nh);var sh=Ce((r,e)=>Math.min(r,e)),u_e=Se(vo,sh);var Rl=Ce((r,e)=>r*e),yD=ls((r,e,t,o)=>({real:r*t-e*o,imag:r*o+e*t})),d_e=Se(To,Rl,yD);function xw(r,e,t){let o=C.createScalarValue(-1,t);return Rl([],e,o,r,t)}var ih=Ce((r,e)=>r!==e?1:0),v_e=Se(Co,ih,null,"bool");function yw(r,e,t,o,n){let s=e.length,i=C.sizeFromShape(e),a=C.computeStrides(e),l=C.computeStrides(n),u=C.getTypedArrayFromDType(t,C.sizeFromShape(n));for(let c=0;c<i;++c){let p=C.indexToLoc(c,s,a),m=new Array(p.length);for(let d=0;d<m.length;d++)m[d]=p[o[d]];let f=C.locToIndex(m,s,l);u[f]=r[c]}return u}function bw(r,e,t,o){let[n,s]=N.computeOutAndReduceShapes(r,o),i=Ge(e,"int32"),a=C.makeZerosTypedArray(C.sizeFromShape(n),i),l=C.sizeFromShape(s);for(let u=0;u<a.length;++u){let c=u*l,p=1;for(let m=0;m<l;++m)p*=t[c+m];a[u]=p}return{outVals:a,outShape:n,outDtype:i}}function bD(r,e,t){r.forEach((o,n)=>{if(o<0||o>=t){let s=C.indexToLoc(n,e.length,C.computeStrides(e)).join(",");throw new Error(`indices[${s}] = ${o} is not in [0, ${t})`)}})}function _D(r,e){for(let t=0;t<r.length;++t){let o=r[t],n=t===r.length-1?e:r[t+1].length;if(o.length===0)throw new Error("Ragged splits may not be empty");if(o[0]<0)throw new Error("Ragged splits must be non-negative");if(o[o.length-1]>n)throw new Error("Ragged splits must not point past values");for(let s=1;s<o.length;++s)if(o[s-1]>o[s])throw new Error("Ragged splits must be sorted in ascending order")}}function wD(r,e,t,o){let n=[],s=0,i=e.length-1+t.length,a=new Array(i).fill(null).map(()=>[0]);_D(t,o);let l=1;for(let u=0;u<e.length-1;++u){l*=e[u];let c=e[u+1];for(let p=1;p<l+1;++p)a[u].push(p*c)}for(let u=0;u<r.length;++u){let c=r[u],p=r[u]+1;for(let m=0;m<t.length;++m){let f=t[m],d=m+e.length-1;if(d>=0){let g=a[d],h=g[g.length-1]-f[c];for(let b=c;b<p;++b)a[d].push(f[b+1]+h)}c=f[c],p=f[p]}p!==c&&(n.push([c,p]),s+=p-c)}return{outSplits:a,valueSlices:n,numValues:s}}function vD(r){let e=[];for(let t=0;t<r.length;++t){let o=r[t].length,n=C.getArrayFromDType("int32",o);e.push(n),r[t].forEach((s,i)=>n[i]=s)}return e}function _w(r,e){let t=r.slice(0,e);for(;t.length<e;)t.push(1);for(let o=e;o<r.length;o++)t[e-1]*=r[o];return t}function TD(r,e,t,o,n,s){let i=_w(e,2)[1],a=_w(s,2)[1],l=0;for(let u of t)for(let c=u[0];c<u[1];++c){for(let p=0;p<o;++p)n[l*a+p]=r[c*i+p];++l}}function CD(r,e,t,o,n){let s=e.slice();s[0]=n;let i=C.getArrayFromDType(t,C.sizeFromShape(s)),a=r.length,l=a===0?0:a/e[0];return TD(r,e,o,l,i,s),[i,s]}function ww(r,e,t,o,n,s,i,a){if(r.length===0)throw new Error("paramsNestedSplits must be non empty");if(e[0].length===0)throw new Error("Split tensors must not be scalars");let l=e[0][0]-1;if(bD(s,i,l),o.length===0)throw new Error("params.rank must be nonzero");let u=o[0],{outSplits:c,valueSlices:p,numValues:m}=wD(s,i,r,u),f=vD(c),d=CD(t,o,n,p,m);return[f,d[0],d[1]]}var Ot=N.RowPartitionType,Dl=class{constructor(e,t,o,n,s,i,a,l,u,c){this.shape=e,this.shapeShape=t,this.values=o,this.valuesShape=n,this.valuesDType=s,this.defaultValue=i,this.defaultValueShape=a,this.rowPartitionValues=l,this.rowPartitionValuesShapes=u,this.rowPartitionTypes=N.getRowPartitionTypesHelper(c),this.raggedRank=N.getRaggedRank(this.rowPartitionTypes)}getRowPartitionTypeByDimension(e){return this.rowPartitionTypes[0]===Ot.FIRST_DIM_SIZE?this.rowPartitionTypes[e+1]:this.rowPartitionTypes[e]}getRowPartitionTensor(e){return this.rowPartitionTypes[0]===Ot.FIRST_DIM_SIZE?this.rowPartitionValues[e+1]:this.rowPartitionValues[e]}getMaxWidth(e){let t=this.getRowPartitionTensor(e-1);switch(this.getRowPartitionTypeByDimension(e-1)){case Ot.VALUE_ROWIDS:return Dl.getMaxWidthValueRowID(t);case Ot.ROW_SPLITS:return Dl.getMaxWidthRowSplit(t);default:throw new Error(`Cannot handle partition type ${Ot[this.getRowPartitionTypeByDimension(e-1)]}`)}}static getMaxWidthRowSplit(e){let t=e.length;if(t===0||t===1)return 0;let o=0;for(let n=0;n<t-1;++n){let s=e[n+1]-e[n];s>o&&(o=s)}return o}static getMaxWidthValueRowID(e){let t=e.length;if(t===0)return 0;let o=0,n=e[0],s=0;for(let i=1;i<t;++i){let a=e[i];a!==n&&(n=a,s=Math.max(i-o,s),o=i)}return Math.max(t-o,s)}tensorShapeFromTensor(e,t,o=!0){if(t.length===0){if(e[0]===-1)return[];throw new Error("The only valid scalar shape tensor is the fully unknown shape specified as -1.")}return Tw(e,o)}calculateOutputSize(e){let t=this.valuesShape,o=this.defaultValueShape;N.validateDefaultValueShape(o,t);let n=this.tensorShapeFromTensor(this.shape,this.shapeShape),i=N.combineRaggedTensorToTensorShapes(this.raggedRank,n,t);i[0]<0&&(i[0]=e);for(let a=1;a<=this.raggedRank;++a)i[a]<0&&(i[a]=this.getMaxWidth(a));return i}calculateFirstParentOutputIndex(e,t,o){let n=Math.min(e,o),s=[],i=0;for(let a=0;a<n;++a,i+=t)s.push(i);for(let a=n;a<e;++a)s.push(-1);return C.assert(s.length===e,()=>"Final length of result must be equal to firstDimension."),s}calculateOutputIndexRowSplit(e,t,o,n){let s=e.length,i=[];for(let a=0;a<s-1;++a){let l=e[a+1]-e[a],u=Math.min(n,l),c=t[a];c===-1&&(u=0);for(let p=0;p<u;++p)i.push(c),c+=o;for(let p=0;p<l-u;++p)i.push(-1)}if(s>0&&i.length!==e[s-1])throw new Error("Invalid row split size.");return i}calculateOutputIndexValueRowID(e,t,o,n){let s=e.length,i=[];if(s===0)return[];let a=0,l=e[0];if(l>=t.length)throw new Error(`Got currentValueRowId=${l}, which is not less than ${t.length}`);let u=t[l];i.push(u);for(let c=1;c<s;++c){let p=e[c];if(p===l)u>=0&&(++a,a<n?u+=o:u=-1);else{if(a=0,l=p,p>=t.length)throw new Error(`Got nextValueRowId=${p} which is not less than ${t.length}`);u=t[p]}i.push(u)}if(i.length!==e.length)throw new Error("Invalid row ids.");return i}calculateOutputIndex(e,t,o,n){let s=this.getRowPartitionTensor(e),i=this.getRowPartitionTypeByDimension(e);switch(i){case Ot.VALUE_ROWIDS:return this.calculateOutputIndexValueRowID(s,t,o,n);case Ot.ROW_SPLITS:if(s.length-1>t.length)throw new Error(`Row partition size is greater than output size: ${s.length-1} > ${t.length}`);return this.calculateOutputIndexRowSplit(s,t,o,n);default:throw new Error(`Unsupported partition type: ${Ot[i]}`)}}getFirstDimensionSize(){let e=this.rowPartitionValues[0];if(this.rowPartitionTypes.length===0)throw new Error("No row_partition_types given.");let t=this.rowPartitionTypes[0];switch(t){case Ot.FIRST_DIM_SIZE:return e[0];case Ot.VALUE_ROWIDS:throw new Error("Cannot handle VALUE_ROWIDS in first dimension.");case Ot.ROW_SPLITS:return this.rowPartitionValuesShapes[0][0]-1;default:throw new Error(`Cannot handle type ${Ot[t]}`)}}compute(){if(this.rowPartitionValues[0].length<=0)throw new Error("Invalid first partition input. Tensor requires at least one element.");let t=this.getFirstDimensionSize(),o=this.calculateOutputSize(t),n=new Array(this.raggedRank+1);n[n.length-1]=1;for(let l=n.length-2;l>=0;--l)n[l]=n[l+1]*o[l+1];let s=Tw(o,!1),i=C.getArrayFromDType(this.valuesDType,C.sizeFromShape(s));if(n[0]*o[0]>0){let l=this.calculateFirstParentOutputIndex(t,n[0],o[0]);for(let u=1;u<=this.raggedRank;++u)l=this.calculateOutputIndex(u-1,l,n[u],o[u]);this.setOutput(this.raggedRank,l,i,s)}return[s,i]}setOutput(e,t,o,n){if(o.length===0)return;let s=this.values,i=o,a=n.slice();a=a.slice(e+1);let l=C.sizeFromShape(a),u=t.length,c=this.defaultValue;if(c.length!==l&&c.length!==1){let d=this.defaultValueShape;Y(()=>{let g=$(c,d);c=Nr(g,a).dataSync()})}let p=0,m=0,f=0;for(let d=0;d<=u;++d){let g=d<u?t[d]:-1;if(g===f){++f;continue}if(m<f){let h=s.subarray(p*l),b=i.subarray(m*l),T=(f-m)*l;vw(b,h,T)}if(d>=u){let h=o.length;g=Math.floor(h/l)}if(g>f)if(this.defaultValue.length===1)i.subarray(f*l,g*l).fill(this.defaultValue[0]),f=g;else for(;g>f;){let h=i.slice(f*l);vw(h,c,l),++f}g<0?(p=d+1,m=f):(p=d,m=f,f=m+1)}}};function vw(r,e,t){for(let o=0;o<t;o++)r[o]=e[o]}function Tw(r,e){let t=[];for(let o of r){if(o<0){if(!e)throw new Error(`Dimension ${o} must be >= 0`);if(o<-1)throw new Error(`Dimension ${o} must be >= -1`);o=-1}t.push(o)}return t}function Cw(r,e,t,o,n,s,i,a,l,u){return new Dl(r,e,t,o,n,s,i,a,l,u).compute()}function kw(r,e,t,o){let n=r===e,s=r<e&&t<0,i=e<r&&t>1;if(n||s||i)return C.makeZerosTypedArray(0,o);let a=Math.abs(Math.ceil((e-r)/t)),l=C.makeZerosTypedArray(a,o);e<r&&t===1&&(t=-1),l[0]=r;for(let u=1;u<l.length;u++)l[u]=l[u-1]+t;return l}var ah=nt(r=>1/Math.sqrt(r)),L_e=Ft(ko,ah);function Nw(r,e,t,o,n,s,i,a,l,u){let c=[o/n,n],p=r.values,m=e.values;if(o===0)return te(t,e.dtype);let f=te(c,e.dtype);typeof l=="string"||typeof l=="number"?f.values.fill(l):typeof l=="boolean"&&f.values.fill(+l);for(let d=0;d<s;d++){let g=[],h=0;for(let b=0;b<i;b++){let T=p[d*i+b];g.push(T),h+=T*a[b]}if(h<0||h>=o/n)throw new Error(`Invalid indices: ${g} does not index into ${t}`);for(let b=0;b<n;b++)u?f.values[h*n+b]+=m[d*n+b]:f.values[h*n+b]=e.rank===0?m[0]:m[d*n+b]}return f}var Sw=nt(r=>1/(1+Math.exp(-r))),W_e=Yu(No,r=>1/(1+Math.exp(-r)));function Ew(r,e,t,o,n){let s=tt.isSliceContinous(o,e,t),i=C.sizeFromShape(t),a=C.computeStrides(o);if(s){let p=tt.computeFlatOffset(e,a);return n==="string"?r.slice(p,p+i):r.subarray(p,p+i)}let l=n==="string"?N.fromUint8ToStringArray(r):r,u=te(o,n,l),c=te(t,n);for(let p=0;p<c.size;++p){let m=c.indexToLoc(p),f=m.map((d,g)=>d+e[g]);c.set(u.get(...f),...m)}return n==="string"?N.fromStringArrayToUint8(c.values):c.values}function Iw(r,e,t,o,n,s,i){let a=e[0],l=s[0],u=new Array(l),c=new Array(a),p=e[1];if(l===0){if(a!==0)throw new Error(N.getSparseFillEmptyRowsIndicesDenseShapeMismatch(a));let h=C.getArrayFromDType(t,0),b=C.getArrayFromDType(n,0);return[h,[0,p],b,u,c]}let m=!0,f=0,d=new Array(l).fill(0);for(let h=0;h<a;++h){let b=r[h*p];if(b<0)throw new Error(N.getSparseFillEmptyRowsNegativeIndexErrorMessage(h,b));if(b>=l)throw new Error(N.getSparseFillEmptyRowsOutOfRangeIndexErrorMessage(h,b,l));++d[b],m=m&&b>=f,f=b}let g=!0;for(let h=0;h<l;++h){let b=d[h]===0;u[h]=b,g=g&&!b,d[h]=Math.max(d[h],1),h>0&&(d[h]+=d[h-1])}if(g&&m){let h=r,b=o;for(let T=0;T<a;++T)c[T]=T;return[h,[a,p],b,u,c]}else{let h=d[l-1],b=C.getArrayFromDType(t,h*p),T=C.getArrayFromDType(n,h),k=new Array(l).fill(0);for(let S=0;S<a;++S){let I=r[S*p],A=k[I],R=(I===0?0:d[I-1])+A;k[I]++;for(let D=0;D<p;++D)b[R*p+D]=r[S*p+D];T[R]=o[S],c[S]=R}for(let S=0;S<l;++S)if(k[S]===0){let A=S===0?0:d[S-1];b[A*p+0]=S;for(let R=1;R<p;++R)b[A*p+R]=0;T[A]=i}return[b,[h,p],T,u,c]}}function $w(r,e,t,o,n){let s=C.sizeFromShape(o),i=e[0],a=n.length,l=[],u=1,c=-1;for(let h=0;h<a;++h){let b=n[h];if(b===-1){if(c!==-1)throw new Error(N.getSparseReshapeMultipleNegativeOneOutputDimErrorMessage(c,h));c=h,l.push(1)}else{if(b<0)throw new Error(N.getSparseReshapeNegativeOutputDimErrorMessage(h,b));u*=b,l.push(b)}}if(c!==-1){if(u<=0)throw new Error(N.getSparseReshapeEmptyTensorZeroOutputDimErrorMessage());let h=Math.trunc(s/u);if(u*h!==s)throw new Error(N.getSparseReshapeInputOutputMultipleErrorMessage(o,l));l[c]=h}if(C.sizeFromShape(l)!==s)throw new Error(N.getSparseReshapeInputOutputMismatchErrorMessage(o,l));let m=o.length,f=[];if(m>0){f[m-1]=1;for(let h=m-2;h>=0;--h)f[h]=f[h+1]*o[h+1]}let d=[];if(a>0){d[a-1]=1;for(let h=a-2;h>=0;--h)d[h]=d[h+1]*l[h+1]}let g=C.getArrayFromDType(t,i*a);for(let h=0;h<i;++h){let b=0;for(let T=0;T<m;++T)b+=r[h*m+T]*f[T];for(let T=0;T<a;++T)g[h*a+T]=Math.trunc(b/d[T]),b%=d[T]}return[g,[i,a],l]}function Aw(r,e,t,o,n,s=!1,i=0){let a=o.length,l=[e[0],r.length/e[0]],u=l[1],p=a>0?n[a-1]+1:0;if(p<0)throw new Error(N.getSparseSegmentReductionNegativeSegmentIdsErrorMessage());let m=e.slice();m[0]=p;let f=m.reduce((k,S)=>k*S,1),d=C.getArrayFromDType(t,f);if(a===0)return p>0&&d.fill(i),[d,m];if(p<=0)throw new Error(N.getSparseSegmentReductionNegativeSegmentIdsErrorMessage());let g=0,h=1,b=0,T=n[g];for(;;){let k=0;if(h<a){if(k=n[h],T===k){++h;continue}if(T>=k)throw new Error(N.getSparseSegmentReductionNonIncreasingSegmentIdsErrorMessage())}if(T<0||T>=p)throw new Error(N.getSparseSegmentReductionSegmentIdOutOfRangeErrorMessage(T,p));T>b&&d.fill(i,b*u,T*u);for(let S=g;S<h;++S){let I=o[S];if(I<0||I>=l[0])throw new Error(N.getSparseSegmentReductionIndicesOutOfRangeErrorMessage(S,o[S],l[0]));for(let A=0;A<u;A++)d[T*u+A]+=r[I*u+A]}if(s)for(let S=0;S<u;S++)d[T*u+S]/=h-g;if(g=h,++h,b=T+1,T=k,h>a)break}return b<p&&d.fill(i,b*u,p*u),[d,m]}var Rw=nt(r=>Math.sqrt(r)),owe=Yu(So,r=>Math.sqrt(r));var lh=Ce((r,e)=>{let t=r-e;return t*t}),lwe=Se(Eo,lh);function Dw(r,e,t,o){let n=te(r,e.dtype);for(let s=0;s<n.size;s++){let i=n.indexToLoc(s),a=new Array(i.length);for(let l=0;l<a.length;l++)a[l]=i[l]*t[l]+o[l];n.set(e.get(...a),...i)}return n}var Fw=class{constructor(e,t,o,n,s,i){this.separator=C.encodeString(e),this.nGramWidths=t,this.leftPad=C.encodeString(o),this.rightPad=C.encodeString(n),this.padWidth=s,this.preserveShort=i}getPadWidth(e){return Math.min(this.padWidth<0?e-1:this.padWidth,e-1)}getNumNGrams(e,t){let o=this.getPadWidth(t);return Math.max(0,e+2*o-t+1)}createNGrams(e,t,o,n,s,i){for(let a=0;a<s;++a){let l=this.getPadWidth(i),u=Math.max(0,l-a),c=Math.max(0,l-(s-(a+1))),p=i-(u+c),m=t+(u>0?0:a-l),f=0;f+=u*this.leftPad.length;for(let T=0;T<p;++T)f+=e[m+T].length;f+=c*this.rightPad.length,f+=(u+c+p-1)*this.separator.length,o[n+a]=new Uint8Array(f);let g=o[n+a],h=0,b=T=>T.forEach(k=>g[h++]=k);for(let T=0;T<u;++T)b(this.leftPad),b(this.separator);for(let T=0;T<p-1;++T)b(e[m+T]),b(this.separator);if(p>0){b(e[m+p-1]);for(let T=0;T<c;++T)b(this.separator),b(this.rightPad)}else{for(let T=0;T<c-1;++T)b(this.rightPad),b(this.separator);b(this.rightPad)}}}compute(e,t){let o=e.length,n=t.length;if(n>0){let l=t[0];if(l!==0)throw new Error(`First split value must be 0, got ${l}`);for(let u=1;u<n;++u){let c=t[u]>=l;if(c=c&&t[u]<=o,!c)throw new Error(`Invalid split value ${t[u]}, must be in [${l}, ${o}]`);l=t[u]}if(l!==o)throw new Error(`Last split value must be data size. Expected ${o}, got ${l}`)}let s=n-1,i=C.getArrayFromDType("int32",n);if(o===0||n===0){let l=new Array(o);for(let u=0;u<=s;++u)i[u]=0;return[l,i]}i[0]=0;for(let l=1;l<=s;++l){let u=t[l]-t[l-1],c=0;this.nGramWidths.forEach(p=>{c+=this.getNumNGrams(u,p)}),this.preserveShort&&u>0&&c===0&&(c=1),i[l]=i[l-1]+c}let a=new Array(i[s]);for(let l=0;l<s;++l){let u=t[l],c=i[l];if(this.nGramWidths.forEach(p=>{let m=t[l+1]-t[l],f=this.getNumNGrams(m,p);this.createNGrams(e,u,a,c,f,p),c+=f}),this.preserveShort&&c===i[l]){let p=t[l+1]-t[l];if(p===0)continue;let m=p+2*this.padWidth,f=1;this.createNGrams(e,u,a,c,f,m)}}return[a,i]}};function Ow(r,e,t,o,n,s,i,a){return new Fw(t,o,n,s,i,a).compute(r,e)}function kD(r,e,t,o){if(!r.length)return;if(e.length===0){for(let s=0;s<r.length;++s)o.push(r.subarray(s,s+1));return}if(e.length===1){let s=e[0],i=r.indexOf(s);for(;i!==-1;){let a=r.subarray(0,i);(!t||a.length!==0)&&o.push(a),r=r.subarray(i+1),i=r.indexOf(s)}(!t||r.length!==0)&&o.push(r);return}let n=0;for(let s=0;s<r.length+1;s++)if(s===r.length||e.indexOf(r[s])!==-1){let i=r.subarray(n,s);(!t||i.length!==0)&&o.push(i),n=s+1}}function Pw(r,e,t){let o=r.length,n=[],s=0,i=0,a=new Array(o);for(let m=0;m<o;++m){let f=n.length;kD(r[m],e,t,n);let d=n.length-f;a[m]=d,s+=d,i=Math.max(i,d)}let l=C.getArrayFromDType("int32",s*2),u=new Array(s),c=[o,i],p=0;for(let m=0;m<o;++m)for(let f=0;f<a[m];++f)l[p*2]=m,l[p*2+1]=f,u[p]=n[p],++p;return[l,u,c]}function Lw(r,e){let t=C.getArrayFromDType("int32",r.length);for(let o=0;o<r.length;++o)t[o]=C.fingerPrint64(r[o]).modulo(e).getLowBitsUnsigned();return t}var uh=Ce((r,e)=>r-e),ND=ls((r,e,t,o)=>({real:r-t,imag:e-o})),wwe=Se(Io,uh,ND);function Bw(r,e){let t=new Array(r.rank);for(let n=0;n<t.length;n++)t[n]=r.shape[n]*e[n];let o=te(t,r.dtype);for(let n=0;n<o.values.length;++n){let s=o.indexToLoc(n),i=new Array(r.rank);for(let l=0;l<i.length;l++)i[l]=s[l]%r.shape[l];let a=r.locToIndex(i);o.values[n]=r.values[a]}return o}var Fl=(r,e)=>{let t=e.value-r.value;return t===0?r.index-e.index:t};function Mw(r,e,t=0,o=r.length-1){for(;o>t;){if(o-t>600){let a=o-t+1,l=e-t+1,u=Math.log(a),c=.5*Math.exp(2*u/3),p=.5*Math.sqrt(u*c*(a-c)/a)*Math.sign(l-a/2),m=Math.max(t,Math.floor(e-l*c/a+p)),f=Math.min(o,Math.floor(e+(a-l)*c/a+p));Mw(r,e,m,f)}let n=r[e],s=t,i=o;for(C.swap(r,t,e),Fl(r[o],n)>0&&C.swap(r,t,o);s<i;){for(C.swap(r,s,i),s++,i--;Fl(r[s],n)<0;)s=s+1;for(;Fl(r[i],n)>0;)i=i-1}Fl(r[t],n)===0?C.swap(r,t,i):(i=i+1,C.swap(r,i,o)),i<=e&&(t=i+1),e<=i&&(o=i-1)}}function Vw(r,e,t,o,n){let s=e[e.length-1],[i,a]=[r.length/s,s],l=C.getTypedArrayFromDType(t,i*o),u=C.getTypedArrayFromDType("int32",i*o);for(let p=0;p<i;p++){let m=p*a,f=r.subarray(m,m+a),d=new Array(f.length);f.forEach((T,k)=>d[k]={value:T,index:k}),o<d.length&&(Mw(d,o),d=d.slice(0,o)),n&&d.sort(Fl);let g=p*o,h=l.subarray(g,g+o),b=u.subarray(g,g+o);for(let T=0;T<o;T++)h[T]=d[T].value,b[T]=d[T].index}let c=e.slice();return c[c.length-1]=o,[te(c,t,l),te(c,"int32",u)]}function Gw(r,e,t,o){let n=C.parseAxisParam(e,t)[0],s=[1,t[0],1];for(let d=0;d<n;d++)s[0]*=t[d];s[1]=t[n];for(let d=n+1;d<t.length;d++)s[2]*=t[d];let i={},a=new Int32Array(t[n]),l=new Ut(s,o,r),u=[],c=s[0]===1&&s[2]===1;for(let d=0;d<t[n];d++){let g;if(c)g=r[d].toString();else{let h=[];for(let b=0;b<s[0];b++)for(let T=0;T<s[2];T++)h.push(l.get(b,d,T));g=h.join(",")}if(i[g]!==void 0)a[d]=i[g];else{let h=Object.keys(i).length;i[g]=h,a[d]=h,u.push(d)}}let p=s.slice();p[1]=Object.keys(i).length;let m=new Ut(p,o);u.forEach((d,g)=>{for(let h=0;h<s[0];h++)for(let b=0;b<s[2];b++)m.set(l.get(h,d,b),h,g,b)});let f=t.slice();return f[n]=p[1],{outputValues:m.values,outputShape:f,indices:a}}var{addImpl:zw,bincountImpl:Qu,bincountReduceImpl:Uw,castImpl:Ww,ceilImpl:jw,concatImpl:Hw,equalImpl:qw,expImpl:Kw,expm1Impl:Xw,floorImpl:Yw,gatherNdImpl:Qw,gatherV2Impl:Zw,greaterImpl:Jw,greaterEqualImpl:e0,lessImpl:t0,lessEqualImpl:r0,linSpaceImpl:o0,logImpl:n0,maxImpl:s0,maximumImpl:i0,minimumImpl:a0,multiplyImpl:l0,negImpl:u0,notEqualImpl:c0,prodImpl:p0,raggedGatherImpl:m0,raggedTensorToTensorImpl:f0,rangeImpl:d0,rsqrtImpl:h0,scatterImpl:g0,sigmoidImpl:x0,simpleAbsImpl:Zu,sliceImpl:y0,sparseFillEmptyRowsImpl:b0,sparseReshapeImpl:_0,sparseSegmentReductionImpl:Ju,sqrtImpl:w0,stridedSliceImpl:v0,stringNGramsImpl:T0,stringSplitImpl:C0,stringToHashBucketFastImpl:k0,subImpl:N0,tileImpl:S0,topKImpl:E0,transposeImpl:pn,uniqueImpl:I0}=ch;function ph(r,e){return["x","y","z","w","u","v"].slice(0,e).map(t=>`${r}.${t}`)}function ke(r,e){return e===1?[r]:ph(r,e)}function $0(r,e){if(r===1)return"rc";let t="";for(let o=0;o<r;o++)t+=e[o],o<r-1&&(t+=",");return t}var mh=class{constructor(e){if(this.variableNames=["A"],this.packedInputs=!1,this.packedOutput=!0,this.outputShape=e,this.rank=e.length,this.enableShapeUniforms=de(this.outputShape.length),this.rank===0)this.userCode=`
        void main() {
          setOutput(vec4(getA(), 0., 0., 0.));
        }
      `;else{let t=ke("rc",this.rank),o=Q(this.rank),n=this.getOutOfBoundsCondition(t),s=this.getSetup(t),i=this.getOutput(t);this.userCode=`
        void main() {
          ${o} rc = getOutputCoords();

          if(${n}) {
            setOutput(vec4(0));
          } else {
            ${s}

            setOutput(vec4(${i}));
          }
        }
      `}}getSourceCoordsArr(e){let t=[];for(let o=0;o<=1;o++)for(let n=0;n<=1;n++){let s=`${o===0?"r":"rp1"}, ${n===0?"c":"cp1"}`;for(let i=2;i<this.rank;i++)s=`${e[e.length-1-i]},`+s;t.push(s)}return t}getOutOfBoundsCondition(e){if(this.rank===1)return`rc > ${this.enableShapeUniforms?"outShape":this.outputShape[0]}`;let t="";for(let o=this.rank-2;o<this.rank;o++)t+=`${e[o]} >= ${this.enableShapeUniforms?`outShape[${o}]`:this.outputShape[o]}`,o<this.rank-1&&(t+="||");return t}getSetup(e){if(this.rank===1)return"";let t=e.slice(-2),o=this.enableShapeUniforms?`outShape[${this.rank} - 1]`:this.outputShape[this.rank-1],n=this.enableShapeUniforms?`outShape[${this.rank} - 2]`:this.outputShape[this.rank-2];return`
      int r = ${t[0]};
      int c = ${t[1]};
      int rp1 = r + 1;
      int cp1 = c + 1;

      bool cEdge = cp1 >= ${o};
      bool rEdge = rp1 >= ${n};
    `}getOutput(e){let t=this.getSourceCoordsArr(e);return this.rank===1?`getA(rc), (rc + 1 >= ${this.enableShapeUniforms?"outShape":this.outputShape[0]} ? 0. : getA(rc + 1)), 0, 0`:`getA(${t[0]}),
            cEdge ? 0. : getA(${t[1]}),
            rEdge ? 0. : getA(${t[2]}),
            rEdge || cEdge ? 0. : getA(${t[3]})`}};var Ol=class{constructor(e,t){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.customUniforms=[{name:"inputShape",type:"ivec3"}],this.outputShape=e,this.enableShapeUniforms=de(this.outputShape.length);let o="";for(let n=0;n<4;n++){let s="thisRC = rc;";n%2==1&&(s+="thisRC.z += 1;"),n>1&&(s+="thisRC.y += 1;"),o+=`
        ${s}
        ${n>0?"if(thisRC.y < rows && thisRC.z < cols){":""}
          int flatIndex = getFlatIndex(thisRC);

          ivec3 inputRC = inputCoordsFromReshapedOutCoords(flatIndex);
          vec2 inputRCInnerDims = vec2(float(inputRC.y),float(inputRC.z));

          result[${n}] =
            getChannel(getA(inputRC.x, inputRC.y, inputRC.z), inputRCInnerDims);
        ${n>0?"}":""}
      `}this.userCode=`
      ${SD(t,this.enableShapeUniforms)}
      ${this.enableShapeUniforms?rs():ts(e)}

      void main() {
        ivec3 rc = getOutputCoords();

        vec4 result = vec4(0.);

        ivec3 thisRC;
        int rows = ${this.enableShapeUniforms?"outShape[1]":e[1]};
        int cols = ${this.enableShapeUniforms?"outShape[2]":e[2]};

        ${o}

        setOutput(result);
      }
    `}};function SD(r,e){return`
    ivec3 inputCoordsFromReshapedOutCoords(int index) {
      ${e?J_(["r","c","d"],"inputShape"):Jt(["r","c","d"],r)}
      return ivec3(r, c, d);
    }
  `}var fh=class{constructor(e){this.gpgpu=e,this.numUsedTextures=0,this.numFreeTextures=0,this._numBytesAllocated=0,this._numBytesFree=0,this.freeTextures={},this.logEnabled=!1,this.usedTextures={}}acquireTexture(e,t,o){let n=R0(t,o),s=D0(e,n,o);s in this.freeTextures||(this.freeTextures[s]=[]),s in this.usedTextures||(this.usedTextures[s]=[]);let i=A0(e,n,this.gpgpu.gl,this.gpgpu.textureConfig,o);if(this.freeTextures[s].length>0){this.numFreeTextures--,this.numUsedTextures++,this._numBytesFree-=i,this.log();let l=this.freeTextures[s].shift();return this.usedTextures[s].push(l),l}let a;return n===Ve.PACKED_2X2_FLOAT32?a=this.gpgpu.createPackedMatrixTexture(e[0],e[1]):n===Ve.PACKED_2X2_FLOAT16?a=this.gpgpu.createFloat16PackedMatrixTexture(e[0],e[1]):n===Ve.UNPACKED_FLOAT32?a=this.gpgpu.createFloat32MatrixTexture(e[0],e[1]):n===Ve.UNPACKED_FLOAT16?a=this.gpgpu.createFloat16MatrixTexture(e[0],e[1]):n===Ve.PACKED_4X1_UNSIGNED_BYTE&&(a=this.gpgpu.createUnsignedBytesMatrixTexture(e[0],e[1])),this.usedTextures[s].push(a),this.numUsedTextures++,this._numBytesAllocated+=i,this.log(),a}releaseTexture(e,t,o,n){if(this.freeTextures==null)return;let s=R0(o,n),i=D0(t,s,n);i in this.freeTextures||(this.freeTextures[i]=[]);let a=A0(t,s,this.gpgpu.gl,this.gpgpu.textureConfig,n),l=E().get("WEBGL_DELETE_TEXTURE_THRESHOLD");l!==-1&&this._numBytesAllocated>l?(this.gpgpu.deleteMatrixTexture(e.texture),this._numBytesAllocated-=a):(this.freeTextures[i].push(e),this.numFreeTextures++,this._numBytesFree+=a),this.numUsedTextures--;let u=this.usedTextures[i],c=u.indexOf(e);if(c<0)throw new Error("Cannot release a texture that was never provided by this texture manager");u.splice(c,1),this.log()}log(){if(!this.logEnabled)return;let e=this.numFreeTextures+this.numUsedTextures;console.log("Free/Used",`${this.numFreeTextures} / ${this.numUsedTextures}`,`(${e})`);let t=this._numBytesFree/this._numBytesAllocated;console.log(`Bytes allocated: ${this._numBytesAllocated}`),console.log(`Bytes unused: ${this._numBytesFree} (${Math.round(100*t)}%)`)}get numBytesAllocated(){return this._numBytesAllocated}get numBytesFree(){return this._numBytesFree}getNumUsedTextures(){return this.numUsedTextures}getNumFreeTextures(){return this.numFreeTextures}dispose(){if(this.freeTextures!=null){for(let e in this.freeTextures)this.freeTextures[e].forEach(t=>{this.gpgpu.deleteMatrixTexture(t.texture)});for(let e in this.usedTextures)this.usedTextures[e].forEach(t=>{this.gpgpu.deleteMatrixTexture(t.texture)});this.freeTextures=null,this.usedTextures=null,this.numUsedTextures=0,this.numFreeTextures=0,this._numBytesAllocated=0,this._numBytesFree=0}}};function ED(r,e){let t=r;if(e===t.R32F)return 4;if(e===t.R16F)return 2;if(e===t.RGBA32F)return 16;if(e===r.RGBA)return 16;if(e===t.RGBA16F)return 8;if(e===t.RGBA8)return 4;throw new Error(`Unknown internal format ${e}`)}function A0(r,e,t,o,n){let s=ID(e,o),i;if(n){let[l,u]=fr(r[0],r[1]);i=l*u}else{let[l,u]=an(r[0],r[1]);i=l*u}let a=ED(t,s);return i*a}function ID(r,e){switch(r){case Ve.PACKED_2X2_FLOAT32:return qu(e);case Ve.PACKED_2X2_FLOAT16:return Ku(e);case Ve.UNPACKED_FLOAT32:return Wu(e);case Ve.UNPACKED_FLOAT16:return ju(e);case Ve.PACKED_4X1_UNSIGNED_BYTE:return Hu(e);default:throw new Error(`Unknown physical texture type ${r}`)}}function $D(r){return E().getBool("WEBGL_RENDER_FLOAT32_ENABLED")?r?Ve.PACKED_2X2_FLOAT32:Ve.UNPACKED_FLOAT32:r?Ve.PACKED_2X2_FLOAT16:Ve.UNPACKED_FLOAT16}function R0(r,e){if(r===je.UPLOAD)return Ve.PACKED_2X2_FLOAT32;if(r===je.RENDER||r==null)return $D(e);if(r===je.DOWNLOAD||r===je.PIXELS)return Ve.PACKED_4X1_UNSIGNED_BYTE;throw new Error(`Unknown logical texture type ${r}`)}function D0(r,e,t){return`${r[0]}_${r[1]}_${e}_${t}`}var st=class{constructor(e,t){this.variableNames=["A"],this.outputShape=e,this.enableShapeUniforms=de(this.outputShape.length),this.userCode=`
      float unaryOperation(float x) {
        ${t}
      }

      void main() {
        float x = getAAtOutCoords();
        float y = unaryOperation(x);

        setOutput(y);
      }
    `}},Re="if (isnan(x)) return x;",F0="return x;",dh="return abs(x);";var O0="return (x >= 0.0) ? x : (exp(x) - 1.0);",P0=Re+`
  return (x < 0.0) ? 0.0 : x;
`,L0=Re+`
  return (x < 0.0) ? 0.0 : min(6.0, x);
`,mn="return x;",B0="return 1.0 / (1.0 + exp(-1.0 * x));";var M0="return x;",V0=`
  vec4 result;

  result.r = (x.r >= 0.0) ? x.r : (exp(x.r) - 1.0);
  result.g = (x.g >= 0.0) ? x.g : (exp(x.g) - 1.0);
  result.b = (x.b >= 0.0) ? x.b : (exp(x.b) - 1.0);
  result.a = (x.a >= 0.0) ? x.a : (exp(x.a) - 1.0);

  return result;
`,G0=`
  vec4 result = x * vec4(greaterThanEqual(x, vec4(0.0)));
  bvec4 isNaN = isnan(x);

  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`,z0=`
  vec4 result = min(x, vec4(6.)) * vec4(greaterThanEqual(x, vec4(0.0)));
  bvec4 isNaN = isnan(x);

  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`,U0="return 1.0 / (1.0 + exp(-1.0 * x));",Pt=class{constructor(e,t){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=e,this.enableShapeUniforms=de(this.outputShape.length),this.userCode=`
      vec4 unaryOperation(vec4 x) {
        ${t}
      }

      void main() {
        vec4 x = getAAtOutCoords();
        vec4 y = unaryOperation(x);

        setOutput(y);
      }
    `}};var hh=class{constructor(e){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!1,this.outputShape=e,this.enableShapeUniforms=de(this.outputShape.length);let t=e.length,o=ke("rc",t),n=Q(t),s=$0(t,o),i=o.slice(-2),a=t<=1?"rc":`vec2(${i.join(",")})`;this.userCode=`
      void main() {
        ${n} rc = getOutputCoords();
        vec4 packedInput = getA(${s});

        setOutput(getChannel(packedInput, ${a}));
      }
    `}};var AD=Qt.whereImpl,RD=1e-7,DD=1e-4,ec={};function FD(r){return r in ec||(ec[r]={}),ec[r]}var OD=E().getNumber("CPU_HANDOFF_SIZE_THRESHOLD"),PD=600;function LD(){return E().global.screen==null?1024:E().global.screen.height*E().global.screen.width*window.devicePixelRatio*PD/1024/1024}var oo=class extends ao{constructor(e){super();if(this.pendingRead=new WeakMap,this.pendingDisposal=new WeakSet,this.dataRefCount=new WeakMap,this.numBytesInGPU=0,this.uploadWaitMs=0,this.downloadWaitMs=0,this.lastGlFlushTime=0,this.warnedAboutMemory=!1,this.pendingDeletes=0,this.disposed=!1,!E().getBool("HAS_WEBGL"))throw new Error("WebGL is not supported on this device");let t;if(e!=null){if(e instanceof cn)t=e;else{let o=yt(E().getNumber("WEBGL_VERSION"),e);t=new cn(o)}this.binaryCache={},this.gpgpuCreatedLocally=!1}else{let o=yt(E().getNumber("WEBGL_VERSION"));t=new cn(o),this.binaryCache=FD(E().getNumber("WEBGL_VERSION")),this.gpgpuCreatedLocally=!0}this.gpgpu=t,this.canvas=this.gpgpu.gl.canvas,this.textureManager=new fh(this.gpgpu),this.numMBBeforeWarning=LD(),this.texData=new hs(this,Xr())}nextDataId(){return oo.nextDataId++}numDataIds(){return this.texData.numDataIds()-this.pendingDeletes}write(e,t,o){if((E().getBool("WEBGL_CHECK_NUMERICAL_PROBLEMS")||E().getBool("DEBUG"))&&this.checkNumericalProblems(e),o==="complex64"&&e!=null)throw new Error("Cannot write to a complex64 dtype. Please use tf.complex(real, imag).");let n={id:this.nextDataId()};return this.texData.set(n,{shape:t,dtype:o,values:e,usage:je.UPLOAD,refCount:1}),n}refCount(e){return this.texData.has(e)?this.texData.get(e).refCount:0}incRef(e){let t=this.texData.get(e);t.refCount++}decRef(e){if(this.texData.has(e)){let t=this.texData.get(e);t.refCount--}}move(e,t,o,n,s){if(E().getBool("DEBUG")&&this.checkNumericalProblems(t),n==="complex64")throw new Error("Cannot write to a complex64 dtype. Please use tf.complex(real, imag).");this.texData.set(e,{shape:o,dtype:n,values:t,usage:je.UPLOAD,refCount:s})}disposeIntermediateTensorInfo(e){this.disposeData(e.dataId)}readSync(e){let t=this.texData.get(e),{values:o,dtype:n,complexTensorInfos:s,slice:i,shape:a,isPacked:l}=t;if(i!=null){let m;l?m=new Pt(a,mn):m=new st(a,mn);let f=this.runWebGLProgram(m,[{dataId:e,shape:a,dtype:n}],n),d=this.readSync(f.dataId);return this.disposeIntermediateTensorInfo(f),d}if(o!=null)return this.convertAndCacheOnCPU(e);if(n==="string")return o;let u=this.activeTimers!=null,c;u&&(c=C.now());let p;if(n==="complex64"){let m=this.readSync(s.real.dataId),f=this.readSync(s.imag.dataId);p=N.mergeRealAndImagArrays(m,f)}else p=this.getValuesFromTexture(e);return u&&(this.downloadWaitMs+=C.now()-c),this.convertAndCacheOnCPU(e,p)}async read(e){if(this.pendingRead.has(e)){let d=this.pendingRead.get(e);return new Promise(g=>d.push(g))}let t=this.texData.get(e),{values:o,shape:n,slice:s,dtype:i,complexTensorInfos:a,isPacked:l}=t;if(s!=null){let d;l?d=new Pt(n,mn):d=new st(n,mn);let g=this.runWebGLProgram(d,[{dataId:e,shape:n,dtype:i}],i),h=this.read(g.dataId);return this.disposeIntermediateTensorInfo(g),h}if(o!=null)return this.convertAndCacheOnCPU(e);if(E().getBool("DEBUG")&&!E().getBool("WEBGL_DOWNLOAD_FLOAT_ENABLED")&&E().getNumber("WEBGL_VERSION")===2)throw new Error("tensor.data() with WEBGL_DOWNLOAD_FLOAT_ENABLED=false and WEBGL_VERSION=2 not yet supported.");let u=null,c;if(i!=="complex64"&&E().get("WEBGL_BUFFER_SUPPORTED")){c=this.decode(e);let d=this.texData.get(c.dataId);u=this.gpgpu.createBufferFromTexture(d.texture.texture,...Cl(n))}this.pendingRead.set(e,[]),i!=="complex64"&&await this.gpgpu.createAndWaitForFence();let p;if(i==="complex64"){let d=await Promise.all([this.read(a.real.dataId),this.read(a.imag.dataId)]),g=d[0],h=d[1];p=N.mergeRealAndImagArrays(g,h)}else if(u==null)p=this.getValuesFromTexture(e);else{let d=C.sizeFromShape(n);p=this.gpgpu.downloadFloat32MatrixFromBuffer(u,d)}if(c!=null&&this.disposeIntermediateTensorInfo(c),u!=null){let d=this.gpgpu.gl;V(d,()=>d.deleteBuffer(u))}let m=this.convertAndCacheOnCPU(e,p),f=this.pendingRead.get(e);return this.pendingRead.delete(e),f.forEach(d=>d(m)),this.pendingDisposal.has(e)&&(this.pendingDisposal.delete(e),this.disposeData(e)&&Xr().removeDataId(e,this),this.pendingDeletes--),m}readToGPU(e,t={}){let o=this.texData.get(e),{values:n,shape:s,slice:i,dtype:a,isPacked:l,texture:u}=o;if(a==="complex64")throw new Error("Does not support reading texture for complex64 dtype.");if(i!=null){let f;l?f=new Pt(s,mn):f=new st(s,mn);let d=this.runWebGLProgram(f,[{dataId:e,shape:s,dtype:a}],a),g=this.readToGPU(d,t);return this.disposeIntermediateTensorInfo(d),g}if(u==null)throw n!=null?new Error("Data is not on GPU but on CPU."):new Error("There is no data on GPU or CPU.");let c=this.decode(e,t.customTexShape),p=Xr().makeTensorFromTensorInfo(c),m=this.texData.get(c.dataId);return Object.assign({tensorRef:p},m.texture)}bufferSync(e){let t=this.readSync(e.dataId);if(e.dtype==="string")try{let o=t.map(n=>C.decodeString(n));return te(e.shape,e.dtype,o)}catch(o){throw new Error("Failed to decode encoded string bytes into utf-8")}return te(e.shape,e.dtype,t)}checkNumericalProblems(e){if(e!=null)for(let t=0;t<e.length;t++){let o=e[t];if(!Jf(o))throw E().getBool("WEBGL_RENDER_FLOAT32_CAPABLE")?Error(`The value ${o} cannot be represented with your current settings. Consider enabling float32 rendering: 'tf.env().set('WEBGL_RENDER_FLOAT32_ENABLED', true);'`):Error(`The value ${o} cannot be represented on this device.`)}}getValuesFromTexture(e){let{shape:t,dtype:o,isPacked:n}=this.texData.get(e),s=C.sizeFromShape(t);if(E().getBool("WEBGL_DOWNLOAD_FLOAT_ENABLED")){let m=this.decode(e),f=this.texData.get(m.dataId),d=this.gpgpu.downloadMatrixFromPackedTexture(f.texture.texture,...Cl(t)).subarray(0,s);return this.disposeIntermediateTensorInfo(m),d}let i=E().getBool("WEBGL_PACK")&&n===!0,a=i?El(t):t,l=i?new kd(a):new Cd(a),u=this.runWebGLProgram(l,[{shape:a,dtype:o,dataId:e}],"float32"),c=this.texData.get(u.dataId),p=this.gpgpu.downloadByteEncodedFloatMatrixFromOutputTexture(c.texture.texture,c.texShape[0],c.texShape[1]).subarray(0,s);return this.disposeIntermediateTensorInfo(u),p}timerAvailable(){return E().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_RELIABLE")>0}time(e){let t=this.activeTimers,o=[],n=!1;this.programTimersStack==null?(this.programTimersStack=o,n=!0):this.activeTimers.push(o),this.activeTimers=o,e();let s=C.flatten(this.activeTimers.map(l=>l.query)).filter(l=>l!=null),i=C.flatten(this.activeTimers.map(l=>l.name)).filter(l=>l!=null);this.activeTimers=t,n&&(this.programTimersStack=null);let a={uploadWaitMs:this.uploadWaitMs,downloadWaitMs:this.downloadWaitMs,kernelMs:null,wallMs:null};return(async()=>{if(E().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_RELIABLE")>0){let l=await Promise.all(s);a.kernelMs=C.sum(l),a.getExtraProfileInfo=()=>l.map((u,c)=>({name:i[c],ms:u})).map(u=>`${u.name}: ${u.ms}`).join(", ")}else a.kernelMs={error:"WebGL query timers are not supported in this environment."};return this.uploadWaitMs=0,this.downloadWaitMs=0,a})()}memory(){return{unreliable:!1,numBytesInGPU:this.numBytesInGPU,numBytesInGPUAllocated:this.textureManager.numBytesAllocated,numBytesInGPUFree:this.textureManager.numBytesFree}}startTimer(){return E().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_RELIABLE")>0?this.gpgpu.beginQuery():{startMs:C.now(),endMs:null}}endTimer(e){return E().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_RELIABLE")>0?(this.gpgpu.endQuery(),e):(e.endMs=C.now(),e)}async getQueryTime(e){if(E().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_RELIABLE")>0)return this.gpgpu.waitForQueryAndGetTime(e);let t=e;return t.endMs-t.startMs}disposeData(e,t=!1){if(this.pendingDisposal.has(e))return!1;if(!this.texData.has(e))return!0;if(t?this.texData.get(e).refCount=0:this.texData.get(e).refCount--,!t&&this.texData.get(e).refCount>0)return!1;if(this.pendingRead.has(e))return this.pendingDisposal.add(e),this.pendingDeletes++,!1;this.releaseGPUData(e);let{complexTensorInfos:o}=this.texData.get(e);return o!=null&&(this.disposeData(o.real.dataId,t),this.disposeData(o.imag.dataId,t)),this.texData.delete(e),!0}releaseGPUData(e){let{texture:t,dtype:o,texShape:n,usage:s,isPacked:i,slice:a}=this.texData.get(e),l=a&&a.origDataId||e,u=this.dataRefCount.get(l);u>1?this.dataRefCount.set(l,u-1):(this.dataRefCount.delete(l),t!=null&&(this.numBytesInGPU-=this.computeBytes(n,o),this.textureManager.releaseTexture(t,n,s,i)));let c=this.texData.get(e);c.texture=null,c.texShape=null,c.isPacked=!1,c.slice=null}getTexture(e){return this.uploadToGPU(e),this.texData.get(e).texture.texture}getDataInfo(e){return this.texData.get(e)}shouldExecuteOnCPU(e,t=OD){return E().getBool("WEBGL_CPU_FORWARD")&&e.every(o=>this.texData.get(o.dataId).texture==null&&C.sizeFromShape(o.shape)<t)}getGPGPUContext(){return this.gpgpu}where(e){N.warn("tf.where() in webgl locks the UI thread. Call tf.whereAsync() instead");let t=e.dataSync();return AD(e.shape,t)}packedUnaryOp(e,t,o){let n=new Pt(e.shape,t),s=this.compileAndRun(n,[e],o);return Xr().makeTensorFromTensorInfo(s)}abs(e){if(this.shouldExecuteOnCPU([e])&&e.dtype!=="complex64"){let n=Zu(this.texData.get(e.dataId).values);return this.makeOutput(e.shape,e.dtype,n)}if(E().getBool("WEBGL_PACK_UNARY_OPERATIONS"))return this.packedUnaryOp(e,dh,e.dtype);let t=new st(e.shape,dh),o=this.compileAndRun(t,[e]);return Xr().makeTensorFromTensorInfo(o)}makeTensorInfo(e,t,o){let n;if(t==="string"&&o!=null&&o.length>0&&C.isString(o[0])){let s=o.map(i=>C.encodeString(i));n=this.write(s,e,t)}else n=this.write(o,e,t);return this.texData.get(n).usage=null,{dataId:n,shape:e,dtype:t}}makeOutput(e,t,o){return Xr().makeTensorFromTensorInfo(this.makeTensorInfo(e,t,o),this)}unpackTensor(e){let t=new hh(e.shape);return this.runWebGLProgram(t,[e],e.dtype)}packTensor(e){let t=new mh(e.shape),o=!0;return this.runWebGLProgram(t,[e],e.dtype,null,o)}packedReshape(e,t){let o=[Or(e.shape),...Pr(e.shape)],n={dtype:e.dtype,shape:o,dataId:e.dataId},s=[Or(t),...Pr(t)],i=new Ol(s,o),a=!0,l=[o],u=this.runWebGLProgram(i,[n],e.dtype,l,a);return{dataId:u.dataId,shape:t,dtype:u.dtype}}decode(e,t){let o=this.texData.get(e),{isPacked:n,shape:s,dtype:i}=o;if(t!=null){let m=C.sizeFromShape(s),f=t[0]*t[1]*4;C.assert(m<=f,()=>"customTexShape is too small. Row * Column * 4 should be equal or larger than the size of the tensor data.")}let a=El(s),l;n?l=new Td(a):l=new vd(a);let u=!0,c=[t!=null?t:Cl(a)],p=this.runWebGLProgram(l,[{shape:a,dtype:i,dataId:e}],i,c,u,t);return{dtype:i,shape:s,dataId:p.dataId}}runWebGLProgram(e,t,o,n,s=!1,i){let a=this.makeTensorInfo(e.outputShape,o),l=this.texData.get(a.dataId);if(e.packedOutput&&(l.isPacked=!0),e.outPackingScheme===to.DENSE){let b=i!=null?i:Cl(e.outputShape);l.texShape=b.map(T=>T*2)}if(e.outTexUsage!=null&&(l.usage=e.outTexUsage),C.sizeFromShape(a.shape)===0)return l.values=C.getTypedArrayFromDType(a.dtype,0),a;let u=[],c=t.map(b=>{if(b.dtype==="complex64")throw new Error("GPGPUProgram does not support complex64 input. For complex64 dtypes, please separate the program into real and imaginary parts.");let T=this.texData.get(b.dataId);if(T.texture==null){if(!e.packedInputs&&C.sizeFromShape(b.shape)<=E().getNumber("WEBGL_SIZE_UPLOAD_UNIFORM"))return{shape:b.shape,texData:null,isUniform:!0,uniformValues:T.values};e.packedInputs&&(T.isPacked=!0,T.shape=b.shape)}if(this.uploadToGPU(b.dataId),!!T.isPacked!=!!e.packedInputs)b=T.isPacked?this.unpackTensor(b):this.packTensor(b),u.push(b),T=this.texData.get(b.dataId);else if(T.isPacked&&!ro(T.shape,b.shape)){let k=b,S=b.shape;b.shape=T.shape,b=this.packedReshape(b,S),u.push(b),T=this.texData.get(b.dataId),k.shape=S}return{shape:b.shape,texData:T,isUniform:!1}});this.uploadToGPU(a.dataId);let p={shape:a.shape,texData:l,isUniform:!1},m=aw(e,c,p),f=this.getAndSaveBinary(m,()=>nw(this.gpgpu,e,c,p)),d=this.activeTimers!=null,g;d&&(g=this.startTimer()),E().get("ENGINE_COMPILE_ONLY")||iw(this.gpgpu,f,c,p,n),u.forEach(b=>this.disposeIntermediateTensorInfo(b)),d&&(g=this.endTimer(g),this.activeTimers.push({name:e.constructor.name,query:this.getQueryTime(g)}));let h=E().get("WEBGL_FLUSH_THRESHOLD");if(h>0){let b=C.now();b-this.lastGlFlushTime>h&&(this.gpgpu.gl.flush(),this.lastGlFlushTime=b)}if(!E().getBool("WEBGL_LAZILY_UNPACK")&&l.isPacked&&s===!1){let b=this.unpackTensor(a);return this.disposeIntermediateTensorInfo(a),b}return a}compileAndRun(e,t,o,n,s=!1){return o=o||t[0].dtype,this.runWebGLProgram(e,t,o,n,s)}getAndSaveBinary(e,t){return e in this.binaryCache||(this.binaryCache[e]=t()),this.binaryCache[e]}getTextureManager(){return this.textureManager}dispose(){this.disposed||(E().getBool("IS_TEST")||Object.keys(this.binaryCache).forEach(t=>{this.gpgpu.deleteProgram(this.binaryCache[t].webGLProgram),delete this.binaryCache[t]}),this.textureManager.dispose(),this.canvas!=null&&typeof HTMLCanvasElement!="undefined"&&this.canvas instanceof HTMLCanvasElement?this.canvas.remove():this.canvas=null,this.gpgpuCreatedLocally&&(this.gpgpu.program=null,this.gpgpu.dispose()),this.disposed=!0)}floatPrecision(){return this.floatPrecisionValue==null&&(this.floatPrecisionValue=Y(()=>{if(!E().get("WEBGL_RENDER_FLOAT32_ENABLED")){let e=E().getBool("DEBUG");E().set("DEBUG",!1);let t=this.abs(j(1e-8)).dataSync()[0];if(E().set("DEBUG",e),t>0)return 32}return 16})),this.floatPrecisionValue}epsilon(){return this.floatPrecision()===32?RD:DD}uploadToGPU(e){let t=this.texData.get(e),{shape:o,dtype:n,values:s,texture:i,usage:a,isPacked:l}=t;if(i!=null)return;let u=this.activeTimers!=null,c;u&&(c=C.now());let p=t.texShape;if(p==null&&(p=md(o,l),t.texShape=p),s!=null){let m=El(o),f,d=p[1],g=p[0],h=s instanceof Uint8Array||s instanceof Uint8ClampedArray;(l||!h)&&([d,g]=fr(p[0],p[1])),l?f=new Sd(m,h):f=new Nd(m,h);let b=h?[g,d]:p,T=this.makeTensorInfo(b,n),k=this.texData.get(T.dataId);h?k.usage=je.PIXELS:k.usage=je.UPLOAD,k.texShape=b,this.gpgpu.uploadDenseMatrixToTexture(this.getTexture(T.dataId),d,g,s);let S=[[g,d]],I=!0,A=this.runWebGLProgram(f,[T],n,S,I),R=this.texData.get(A.dataId);t.texShape=R.texShape,t.isPacked=R.isPacked,t.usage=R.usage,E().get("ENGINE_COMPILE_ONLY")?this.disposeData(A.dataId):(t.texture=R.texture,t.values=null,this.texData.delete(A.dataId)),this.disposeIntermediateTensorInfo(T),u&&(this.uploadWaitMs+=C.now()-c)}else{let m=this.acquireTexture(p,a,n,l);t.texture=m}}convertAndCacheOnCPU(e,t){let o=this.texData.get(e),{dtype:n}=o;return this.releaseGPUData(e),t!=null&&(o.values=BD(t,n)),o.values}acquireTexture(e,t,o,n){if(this.numBytesInGPU+=this.computeBytes(e,o),!this.warnedAboutMemory&&this.numBytesInGPU>this.numMBBeforeWarning*1024*1024){let s=(this.numBytesInGPU/1024/1024).toFixed(2);this.warnedAboutMemory=!0,console.warn(`High memory usage in GPU: ${s} MB, most likely due to a memory leak`)}return this.textureManager.acquireTexture(e,t,n)}computeBytes(e,t){return e[0]*e[1]*C.bytesPerElement(t)}checkCompileCompletion(){for(let[,e]of Object.entries(this.binaryCache))this.checkCompletion_(e)}async checkCompileCompletionAsync(){let e=[];if(this.gpgpu.parallelCompilationExtension){for(let[,t]of Object.entries(this.binaryCache))e.push(this.checkCompletionAsync_(t));return Promise.all(e)}else{for(let[,t]of Object.entries(this.binaryCache)){let o=new Promise(n=>{try{this.checkCompletion_(t),n(!0)}catch(s){throw s}});e.push(o)}return Promise.all(e)}}async checkCompletionAsync_(e){return this.gpgpu.gl.getProgramParameter(e.webGLProgram,this.gpgpu.parallelCompilationExtension.COMPLETION_STATUS_KHR)?this.checkCompletion_(e):(await Au(),this.checkCompletionAsync_(e))}checkCompletion_(e){if(this.gpgpu.gl.getProgramParameter(e.webGLProgram,this.gpgpu.gl.LINK_STATUS)===!1)throw console.log(this.gpgpu.gl.getProgramInfoLog(e.webGLProgram)),this.gpgpu.gl.getShaderParameter(e.fragmentShader,this.gpgpu.gl.COMPILE_STATUS)===!1?(Ou(e.source,this.gpgpu.gl.getShaderInfoLog(e.fragmentShader)),new Error("Failed to compile fragment shader.")):new Error("Failed to link vertex and fragment shaders.");return!0}getUniformLocations(){for(let[,e]of Object.entries(this.binaryCache)){let{uniformLocations:t,customUniformLocations:o,infLoc:n,nanLoc:s,inShapesLocations:i,inTexShapesLocations:a,outShapeLocation:l,outShapeStridesLocation:u,outTexShapeLocation:c}=wd(this.gpgpu,e.program,e.webGLProgram);e.uniformLocations=t,e.customUniformLocations=o,e.infLoc=n,e.nanLoc=s,e.inShapesLocations=i,e.inTexShapesLocations=a,e.outShapeLocation=l,e.outShapeStridesLocation=u,e.outTexShapeLocation=c}}};oo.nextDataId=0;function BD(r,e){if(e==="float32"||e==="complex64")return r;if(e==="int32"||e==="bool"){let t=e==="int32"?new Int32Array(r.length):new Uint8Array(r.length);for(let o=0;o<t.length;++o)t[o]=Math.round(r[o]);return t}else throw new Error(`Unknown dtype ${e}`)}var W0="3.21.0";function gh(){E().set("WEBGL_FORCE_F16_TEXTURES",!0)}Hr.isBrowser()&&Dp("webgl",()=>new oo,2);var MD={forceHalfFloat:gh};var us=`
  if (isnan(a)) return a;
  if (isnan(b)) return b;
`;var Lt=class{constructor(e,t,o){this.variableNames=["A","B"],this.outputShape=N.assertAndGetBroadcastShape(t,o),this.enableShapeUniforms=de(this.outputShape.length),this.userCode=`
      float binaryOperation(float a, float b) {
        ${e}
      }

      void main() {
        float a = getAAtOutCoords();
        float b = getBAtOutCoords();
        setOutput(binaryOperation(a, b));
      }
    `}};var dr=`
  result.r = isNaN.r ? NAN : result.r;
  result.g = isNaN.g ? NAN : result.g;
  result.b = isNaN.b ? NAN : result.b;
  result.a = isNaN.a ? NAN : result.a;
`;var er=class{constructor(e,t,o,n=!1){this.variableNames=["A","B"],this.supportsBroadcasting=!0,this.packedInputs=!0,this.packedOutput=!0,this.outputShape=N.assertAndGetBroadcastShape(t,o);let s=this.outputShape.length;this.enableShapeUniforms=de(s);let i="";if(n)if(s===0||C.sizeFromShape(this.outputShape)===1)i=`
          result.y = 0.;
          result.z = 0.;
          result.w = 0.;
        `;else if(i=`
          ${Q(s)} coords = getOutputCoords();
        `,s===1)this.enableShapeUniforms?i+=`
            result.y = (coords + 1) >= outShape ? 0. : result.y;
            result.z = 0.;
            result.w = 0.;
          `:i+=`
            result.y = (coords + 1) >= ${this.outputShape[0]} ? 0. : result.y;
            result.z = 0.;
            result.w = 0.;
          `;else{let l=ke("coords",s);this.enableShapeUniforms?i+=`
            bool nextRowOutOfBounds =
              (${l[s-2]} + 1) >= outShape[${s} - 2];
            bool nextColOutOfBounds =
              (${l[s-1]} + 1) >= outShape[${s} - 1];
            result.y = nextColOutOfBounds ? 0. : result.y;
            result.z = nextRowOutOfBounds ? 0. : result.z;
            result.w = nextColOutOfBounds || nextRowOutOfBounds ? 0. : result.w;
          `:i+=`
            bool nextRowOutOfBounds =
              (${l[s-2]} + 1) >= ${this.outputShape[s-2]};
            bool nextColOutOfBounds =
              (${l[s-1]} + 1) >= ${this.outputShape[s-1]};
            result.y = nextColOutOfBounds ? 0. : result.y;
            result.z = nextRowOutOfBounds ? 0. : result.z;
            result.w = nextColOutOfBounds || nextRowOutOfBounds ? 0. : result.w;
          `}this.userCode=`
      vec4 binaryOperation(vec4 a, vec4 b) {
        ${e}
      }

      void main() {
        vec4 a = getAAtOutCoords();
        vec4 b = getBAtOutCoords();

        vec4 result = binaryOperation(a, b);
        ${i}

        setOutput(result);
      }
    `}};function Ne(r){let{inputs:e,backend:t}=r,{x:o}=e;return t.incRef(o.dataId),{dataId:o.dataId,shape:o.shape,dtype:o.dtype}}var j0={kernelName:zr,backendName:"webgl",kernelFunc:Ne};function ct(r){let{inputs:e,backend:t}=r,{real:o,imag:n}=e,s=t.makeTensorInfo(o.shape,"complex64"),i=t.texData.get(s.dataId),a=Ne({inputs:{x:o},backend:t}),l=Ne({inputs:{x:n},backend:t});return i.complexTensorInfos={real:a,imag:l},s}var H0={kernelName:Cn,backendName:"webgl",kernelFunc:ct};var xh="return (a < 0.) ? b * a : a;",yh=`
  vec4 aLessThanZero = vec4(lessThan(a, vec4(0.)));
  return (aLessThanZero * (b * a)) + ((vec4(1.0) - aLessThanZero) * a);
`;function VD(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{alpha:s}=o,i=t.makeTensorInfo([],"float32",C.createScalarValue(s,"float32")),a=E().getBool("WEBGL_PACK_BINARY_OPERATIONS")?new er(yh,n.shape,i.shape):new Lt(xh,n.shape,i.shape),l=t.runWebGLProgram(a,[n,i],"float32");return t.disposeIntermediateTensorInfo(i),l}var q0={kernelName:vi,backendName:"webgl",kernelFunc:VD};var bh="return (a < 0.) ? b * a : a;",_h=`
  vec4 aLessThanZero = vec4(lessThan(a, vec4(0.)));
  return (aLessThanZero * (b * a)) + ((vec4(1.0) - aLessThanZero) * a);
`;function GD(r){let{inputs:e,backend:t}=r,{x:o,alpha:n}=e,s=E().getBool("WEBGL_PACK_BINARY_OPERATIONS")?new er(_h,o.shape,n.shape):new Lt(bh,o.shape,n.shape);return t.runWebGLProgram(s,[o,n],"float32")}var K0={kernelName:Hi,backendName:"webgl",kernelFunc:GD};var Bt="if (isnan(x)) return x;";function U({opSnippet:r,packedOpSnippet:e,cpuKernelImpl:t,dtype:o}){return({inputs:n,backend:s})=>{let{x:i}=n,a=s,l=o||i.dtype;if(a.shouldExecuteOnCPU([i])&&t!=null){let p=a.texData.get(i.dataId),m=t(p.values,l);return a.makeTensorInfo(i.shape,l,m)}let u=E().getBool("WEBGL_PACK_UNARY_OPERATIONS")&&e!=null,c;return u?c=new Pt(i.shape,e):c=new st(i.shape,r),a.runWebGLProgram(c,[i],l)}}function ce({opSnippet:r,packedOpSnippet:e,checkOutOfBounds:t=!1,supportsComplex:o=!1,cpuKernelImpl:n,dtype:s}){return({inputs:i,backend:a})=>{let{a:l,b:u}=i,c=a;if(o&&l.dtype==="complex64"){let d=c.texData.get(l.dataId),g=c.texData.get(u.dataId),[h,b]=[[d.complexTensorInfos.real,g.complexTensorInfos.real],[d.complexTensorInfos.imag,g.complexTensorInfos.imag]].map(k=>{let[S,I]=k,A={dataId:S.dataId,dtype:S.dtype,shape:l.shape},R={dataId:I.dataId,dtype:I.dtype,shape:u.shape},D=new Lt(r,l.shape,u.shape);return c.runWebGLProgram(D,[A,R],Ge(S.dtype,I.dtype))}),T=ct({inputs:{real:h,imag:b},backend:c});return c.disposeIntermediateTensorInfo(h),c.disposeIntermediateTensorInfo(b),T}let p=s||Ge(l.dtype,u.dtype);if((l.dtype==="string"||u.dtype==="string"||c.shouldExecuteOnCPU([l,u]))&&n!=null){let d=c.texData.get(l.dataId).values,g=c.texData.get(u.dataId).values,h=l.dtype==="string"?N.fromUint8ToStringArray(d):d,b=l.dtype==="string"?N.fromUint8ToStringArray(g):g,[T,k]=n(l.shape,u.shape,h,b,p),S=c.makeTensorInfo(k,p),I=c.texData.get(S.dataId);return I.values=T,S}let m=E().getBool("WEBGL_PACK_BINARY_OPERATIONS")&&e!=null,f;return m?f=new er(e,l.shape,u.shape,t):f=new Lt(r,l.shape,u.shape),c.runWebGLProgram(f,[l,u],p)}}function Lr(r,e=!1){if(r==="linear")return e?M0:F0;if(r==="relu")return e?G0:P0;if(r==="elu")return e?V0:O0;if(r==="relu6")return e?z0:L0;if(r==="prelu")return e?_h:bh;if(r==="leakyrelu")return e?yh:xh;if(r==="sigmoid")return e?U0:B0;throw new Error(`Activation ${r} has not been implemented for the WebGL backend.`)}var Pl=class{constructor(e,t,o,n=!1,s=!1,i=!1,a=null,l=!1,u=!1){this.variableNames=["matrixA","matrixB"],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=o,this.enableShapeUniforms=de(this.outputShape.length);let c=n?e[1]:e[2],p=Math.ceil(c/2),m=n?"i * 2, rc.y":"rc.y, i * 2",f=s?"rc.z, i * 2":"i * 2, rc.z",d=n?["a.xxyy","a.zzww"]:["a.xxzz","a.yyww"],g=s?["b.xzxz","b.ywyw"]:["b.xyxy","b.zwzw"],h="",b="";a&&(l?h=`vec4 activation(vec4 a) {
          vec4 b = getPreluActivationWeightsAtOutCoords();
          ${a}
        }`:u?h=`vec4 activation(vec4 a) {
          vec4 b = getLeakyreluAlphaAtOutCoords();
          ${a}
        }`:h=`vec4 activation(vec4 x) {
          ${a}
        }`,b="result = activation(result);");let T=i?"result += getBiasAtOutCoords();":"";i&&this.variableNames.push("bias"),l&&this.variableNames.push("preluActivationWeights"),u&&this.variableNames.push("leakyreluAlpha");let k="rc.x",S="rc.x";e[0]<t[0]?k=`int(min(float(rc.x), ${e[0]-1}.))`:t[0]<e[0]&&(S=`int(min(float(rc.x), ${t[0]-1}.))`),this.userCode=`
      ${h}
      // Don't use uniform for sharedDimensionPacked for performance.
      const float sharedDimension = ${p}.0;

      vec4 dot2x2ARowBCol(ivec3 rc) {
        vec4 result = vec4(0);
        for (int i = 0; i < ${p}; i++) {
          int batchA = ${k};
          int batchB = ${S};
          vec4 a = getMatrixA(batchA, ${m});
          vec4 b = getMatrixB(batchB, ${f});

          // These swizzled products need to be separately added.
          // See: https://github.com/tensorflow/tfjs/issues/1735
          result += (${d[0]} * ${g[0]});
          result += (${d[1]} * ${g[1]});
        }
        return result;
      }

      void main() {
        ivec3 rc = getOutputCoords();
        vec4 result = dot2x2ARowBCol(rc);

        ${T}

        ${b}

        setOutput(result);
      }
    `}};var wh={REAL:"return areal * breal - aimag * bimag;",IMAG:"return areal * bimag + aimag * breal;"},tc=class{constructor(e,t,o){this.variableNames=["AReal","AImag","BReal","BImag"],this.outputShape=N.assertAndGetBroadcastShape(t,o),this.userCode=`
      float binaryOpComplex(
          float areal, float aimag, float breal, float bimag) {
        ${e}
      }

      void main() {
        float areal = getARealAtOutCoords();
        float aimag = getAImagAtOutCoords();
        float breal = getBRealAtOutCoords();
        float bimag = getBImagAtOutCoords();
        setOutput(binaryOpComplex(areal, aimag, breal, bimag));
      }
    `}};var X0="return a * b;";function Ll(r){let{inputs:e,backend:t}=r,{a:o,b:n}=e,s=N.upcastType(o.dtype,n.dtype);if(o.dtype==="complex64"){let a=t.texData.get(o.dataId),l=t.texData.get(n.dataId),u=new tc(wh.REAL,o.shape,n.shape),c=new tc(wh.IMAG,o.shape,n.shape),p=[{dataId:a.complexTensorInfos.real.dataId,dtype:a.complexTensorInfos.real.dtype,shape:o.shape},{dataId:a.complexTensorInfos.imag.dataId,dtype:a.complexTensorInfos.imag.dtype,shape:o.shape},{dataId:l.complexTensorInfos.real.dataId,dtype:l.complexTensorInfos.real.dtype,shape:n.shape},{dataId:l.complexTensorInfos.imag.dataId,dtype:l.complexTensorInfos.imag.dtype,shape:n.shape}],m=t.runWebGLProgram(u,p,"float32"),f=t.runWebGLProgram(c,p,"float32"),d=ct({inputs:{real:m,imag:f},backend:t});return t.disposeIntermediateTensorInfo(m),t.disposeIntermediateTensorInfo(f),d}if(t.shouldExecuteOnCPU([o,n])){let a=t.texData.get(o.dataId),l=t.texData.get(n.dataId),[u,c]=l0(o.shape,n.shape,a.values,l.values,s),p=t.makeTensorInfo(c,s),m=t.texData.get(p.dataId);return m.values=u,p}let i;return E().getBool("WEBGL_PACK_BINARY_OPERATIONS")?i=new er(X0,o.shape,n.shape):i=new Lt(X0,o.shape,n.shape),t.runWebGLProgram(i,[o,n],s)}var Y0={kernelName:To,backendName:"webgl",kernelFunc:Ll};function Q0(r,e,t){let o=[Or(r.shape),...Pr(r.shape)],n={dtype:r.dtype,shape:o,dataId:r.dataId},s=[Or(e),...Pr(e)],i=new Ol(s,o),a=!0,l=[o],u=t.runWebGLProgram(i,[n],r.dtype,l,a);return{dataId:u.dataId,shape:e,dtype:u.dtype}}function O(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{shape:s}=o,i=t,a=C.sizeFromShape(n.shape),l=C.inferFromImplicitShape(s,a),u=C.sizeFromShape(l);C.assert(a===u,()=>`The new shape (${l}) has ${u} elements and the old shape (${n.shape}) has ${a} elements. The new shape and old shape must have the same number of elements.`);let c=i.texData.get(n.dataId);return c.isPacked&&!ro(n.shape,l)&&!(c.texture!==null&&ro(c.shape,l))?Q0(n,l,i):(i.incRef(n.dataId),{dataId:n.dataId,shape:l,dtype:n.dtype})}var Z0={kernelName:Zi,backendName:"webgl",kernelFunc:O};var rc=class{constructor(e,t){this.variableNames=["x"];let{windowSize:o,batchSize:n,inSize:s,outSize:i}=e;this.outputShape=[n,i];let a=Math.floor(o/4)*4,l=o%4,u="sumValue += dot(values, ones);";if(t!=null){let p=1/t;u=`sumValue += dot(values * ${C.isInt(p)?p.toPrecision(2):p}, ones);`}let c="";s%o>0&&(c=`
        if (inIdx < 0 || inIdx >= ${s}) {
          return 0.0;
        }
      `),this.userCode=`
      const vec4 ones = vec4(1.0, 1.0, 1.0, 1.0);

      float getValue(int batch, int inIdx) {
        ${c}
        return getX(batch, inIdx);
      }

      void main() {
        ivec2 coords = getOutputCoords();
        int batch = coords[0];
        int outIdx = coords[1];
        int inOffset = outIdx * ${o};

        float sumValue = 0.0;

        for (int i = 0; i < ${a}; i += 4) {
          int inIdx = inOffset + i;
          vec4 values = vec4(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            getValue(batch, inIdx + 2),
            getValue(batch, inIdx + 3)
          );

          ${u}
        }

        int inIdx = inOffset + ${a};
        if (${l===1}) {
          vec4 values = vec4(getValue(batch, inIdx), 0.0, 0.0, 0.0);

          ${u}
        } else if (${l===2}) {
          vec4 values = vec4(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1), 0.0, 0.0);

          ${u}
        } else if (${l===3}) {
          vec4 values = vec4(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            getValue(batch, inIdx + 2), 0.0);

          ${u}
        }
        setOutput(sumValue);
      }
    `}};var vh=class{constructor(e,t){this.variableNames=["x"];let{windowSize:o,batchSize:n,inSize:s,outSize:i}=e;this.outputShape=[n,i];let a="0.0",l="";t==="prod"?a="1.0":t==="min"?(a="1.0 / 1e-20",l="min"):t==="max"&&(a="-1.0 / 1e-20",l="max");let u=`${t}(${t}(${t}(minMaxValue[0], minMaxValue[1]), minMaxValue[2]), minMaxValue[3])`;t==="sum"?u="sumValue":t==="prod"?u="prodValue":t==="all"?u="allValue":t==="any"&&(u="anyValue");let c=Math.floor(o/4)*4,p=o%4,m=`
      if (${t==="sum"}) {
        sumValue += dot(values, ones);
      } else if (${t==="prod"}) {
        vec2 tmp = vec2(values[0], values[1]) * vec2(values[2], values[3]);
        prodValue *= tmp[0] * tmp[1];
      } else {
        minMaxValue = ${l}(values, minMaxValue);
        if (${t==="min"} || ${t==="max"}) {
          minMaxValue = ${l}(values, minMaxValue);
          bvec4 isNaN = isnan(values);
          if (isNaN.r || isNaN.g || isNaN.b || isNaN.a) {
            minMaxValue = vec4(NAN);
          }
        }
      }
    `,f="vec4";t==="all"?(a="1.0",m=`
        bool reducedAllValue = all(values);
        float floatedReducedAllValue = float(reducedAllValue);
        allValue = float(allValue >= 1.0 && floatedReducedAllValue >= 1.0);
      `,f="bvec4"):t==="any"&&(a="0.0",m=`
        bool reducedAnyValue = any(values);
        float floatedReducedAnyValue = float(reducedAnyValue);
        anyValue = float(anyValue >= 1.0 || floatedReducedAnyValue >= 1.0);
      `,f="bvec4");let d="";s%o>0&&(d=`
        if (inIdx < 0 || inIdx >= ${s}) {
          return initializationValue;
        }
      `),this.userCode=`
      const float initializationValue = ${a};
      const vec4 ones = vec4(1.0, 1.0, 1.0, 1.0);

      float getValue(int batch, int inIdx) {
        ${d}
        return getX(batch, inIdx);
      }

      void main() {
        ivec2 coords = getOutputCoords();
        int batch = coords[0];
        int outIdx = coords[1];
        int inOffset = outIdx * ${o};

        vec4 minMaxValue = vec4(${a});
        float prodValue = 1.0;
        float sumValue = 0.0;
        float allValue = 1.0;
        float anyValue = 0.0;

        for (int i = 0; i < ${c}; i += 4) {
          int inIdx = inOffset + i;
          ${f} values = ${f}(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            getValue(batch, inIdx + 2),
            getValue(batch, inIdx + 3)
          );

          ${m}
        }

        int inIdx = inOffset + ${c};
        if (${p===1}) {
          ${f} values = ${f}(
            getValue(batch, inIdx),
            initializationValue,
            initializationValue,
            initializationValue
          );

          ${m}
        } else if (${p===2}) {
          ${f} values = ${f}(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            initializationValue,
            initializationValue
          );

          ${m}
        } else if (${p===3}) {
          ${f} values = ${f}(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            getValue(batch, inIdx + 2),
            initializationValue
          );

          ${m}
        }
        setOutput(${u});
      }
    `}};function zD(r){let e=[];for(;e.length===0||e[e.length-1].outSize!==1;){let t=e.length?e[e.length-1].outSize:r[1],o=N.computeOptimalWindowSize(t);e.push({inSize:t,windowSize:o,outSize:Math.ceil(t/o)})}return e}function _t(r,e,t,o){let n=zD(r.shape),s=r;for(let i=0;i<n.length;i++){let{inSize:a,windowSize:l,outSize:u}=n[i],c,p;t==="mean"?c=i===0?new rc({windowSize:l,inSize:a,batchSize:r.shape[0],outSize:u},a):new rc({windowSize:l,inSize:a,batchSize:r.shape[0],outSize:u}):c=new vh({windowSize:l,inSize:a,batchSize:r.shape[0],outSize:u},t),p=s,s=o.runWebGLProgram(c,[s],e),p.dataId!==r.dataId&&o.disposeIntermediateTensorInfo(p)}return s}var Th=class{constructor(e,t){this.variableNames=["A"];let o=new Array(e.length);for(let i=0;i<o.length;i++)o[i]=e[t[i]];this.outputShape=o,this.rank=o.length;let n=Q(this.rank),s=UD(t);this.userCode=`
    void main() {
      ${n} resRC = getOutputCoords();
      setOutput(getA(${s}));
    }
    `}};function UD(r){let e=r.length;if(e>6)throw Error(`Transpose for rank ${e} is not yet supported`);let t=["resRC.x","resRC.y","resRC.z","resRC.w","resRC.u","resRC.v"],o=new Array(e);for(let n=0;n<r.length;n++)o[r[n]]=t[n];return o.join()}var Ch=class{constructor(e,t){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0;let o=new Array(e.length);for(let c=0;c<o.length;c++)o[c]=e[t[c]];if(this.outputShape=o,this.rank=o.length,this.rank>6)throw Error(`Packed transpose for rank ${this.rank} is not yet supported.`);let n=Q(this.rank),s=ph("rc",this.rank),i=new Array(this.rank);for(let c=0;c<t.length;c++)i[t[c]]=s[c];let a=`vec2(${i.slice(-2).join()})`,l=`++${s[this.rank-1]} < ${o[this.rank-1]}`,u=`getChannel(getA(${i.join()}), ${a})`;this.userCode=`
    void main() {
      ${n} rc = getOutputCoords();
      vec4 result = vec4(0.);
      result[0] = ${u};
      if(${l}) {
        result[1] = ${u};
      }
      --${s[this.rank-1]};
      if(++${s[this.rank-2]} < ${o[this.rank-2]}) {
        result[2] = ${u};
        if(${l}) {
          result[3] = ${u};
        }
      }
      setOutput(result);
    }
    `}};function no(r,e,t){let o=E().getBool("WEBGL_PACK_ARRAY_OPERATIONS")?new Ch(r.shape,e):new Th(r.shape,e);return t.runWebGLProgram(o,[r],r.dtype)}function J0(r,e,t,o){let n=e,s=r.shape.length,i=C.parseAxisParam(n,r.shape),a=i,l=N.getAxesPermutation(a,s),u=l!=null,c=r;u&&(c=no(r,l,o),a=N.getInnerMostAxes(a.length,s)),N.assertAxesAreInnerMostDims("sum",a,s);let[p,m]=N.computeOutAndReduceShapes(c.shape,a),f=p;t&&(f=N.expandShapeToKeepDim(p,i));let d=C.sizeFromShape(m),h=C.sizeFromShape(r.shape)/d,b=O({inputs:{x:c},attrs:{shape:[h,d]},backend:o}),T=jr(r.dtype),k=_t(b,T,"sum",o),S=O({inputs:{x:k},attrs:{shape:f},backend:o});return o.disposeIntermediateTensorInfo(b),o.disposeIntermediateTensorInfo(k),u&&o.disposeIntermediateTensorInfo(c),S}function fn(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{axis:s,keepDims:i}=o;return J0(n,s,i,t)}var ev={kernelName:ma,backendName:"webgl",kernelFunc:fn};function ye(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{perm:s}=o,i=t,a=n.shape.length,l=new Array(a);for(let c=0;c<l.length;c++)l[c]=n.shape[s[c]];let u;if(i.shouldExecuteOnCPU([n])){let p=i.texData.get(n.dataId).values,m=pn(p,n.shape,n.dtype,s,l);u=i.makeTensorInfo(l,n.dtype);let f=i.texData.get(u.dataId);f.values=m}else u=no(n,s,i);return u}var tv={kernelName:Ao,backendName:"webgl",kernelFunc:ye};var kh=1e3;function dn({a:r,b:e,transposeA:t,transposeB:o,backend:n,bias:s=null,preluActivationWeights:i=null,leakyreluAlpha:a=0,activation:l=null}){let u=r.shape.length,c=e.shape.length,p=t?r.shape[u-2]:r.shape[u-1],m=o?e.shape[c-1]:e.shape[c-2],f=t?r.shape[u-1]:r.shape[u-2],d=o?e.shape[c-2]:e.shape[c-1],g=r.shape.slice(0,-2),h=e.shape.slice(0,-2),b=C.sizeFromShape(g),T=C.sizeFromShape(h),S=Wa.assertAndGetBroadcastShape(r.shape.slice(0,-2),e.shape.slice(0,-2)).concat([f,d]);C.assert(p===m,()=>`Error in matMul: inner shapes (${p}) and (${m}) of Tensors with shapes ${r.shape} and ${e.shape} and transposeA=${t} and transposeB=${o} must match.`);let I=t?[b,p,f]:[b,f,p],A=o?[T,d,m]:[T,m,d],R=O({inputs:{x:r},backend:n,attrs:{shape:I}}),D=O({inputs:{x:e},backend:n,attrs:{shape:A}}),P=[R,D],L=Math.max(b,T),z=t?R.shape[1]:R.shape[2],B=s!=null,K=i!=null,W=l==="leakyrelu",X=l!=null?Lr(l,!0):null,se=B||K||W||X!=null,me;if((f===1||d===1)&&z>kh&&se===!1){let Ee=R,De=D;t&&(Ee=ye({inputs:{x:R},backend:n,attrs:{perm:[0,2,1]}}),P.push(Ee)),o&&(De=ye({inputs:{x:D},backend:n,attrs:{perm:[0,2,1]}}),P.push(De));let at=d!==1,Hl=d===1,Oc=Ee;at&&(Oc=O({inputs:{x:Ee},backend:n,attrs:{shape:[L,z,1]}}),P.push(Oc));let Tk=d===1?2:1,Pc=De;Hl&&(Pc=O({inputs:{x:De},backend:n,attrs:{shape:[L,1,z]}}),P.push(Pc));let Rx=Ll({inputs:{a:Oc,b:Pc},backend:n});me=fn({inputs:{x:Rx},backend:n,attrs:{axis:Tk,keepDims:!0}}),P.push(Rx)}else{let Ee=Ge(r.dtype,e.dtype),De=new Pl(I,A,[L,f,d],t,o,B,X,K,W),at=[R,D];if(s!=null&&at.push(s),K&&at.push(i),W){let Hl=n.makeTensorInfo([],"float32",C.createScalarValue(a,"float32"));at.push(Hl),P.push(Hl)}me=n.runWebGLProgram(De,at,Ee)}let fe=O({inputs:{x:me},backend:n,attrs:{shape:S}});P.push(me);for(let Ee of P)n.disposeIntermediateTensorInfo(Ee);return fe}function WD(r){let{inputs:e,backend:t,attrs:o}=r,{a:n,b:s,bias:i,preluActivationWeights:a}=e,{transposeA:l,transposeB:u,activation:c,leakyreluAlpha:p}=o;return dn({a:n,b:s,transposeA:l,transposeB:u,backend:t,bias:i,preluActivationWeights:a,leakyreluAlpha:p,activation:c})}var rv={kernelName:$n,backendName:"webgl",kernelFunc:WD};var ov="return abs(x);";function jD(r){let{inputs:e,backend:t}=r,{x:o}=e;if(t.shouldExecuteOnCPU([o])&&o.dtype!=="complex64"){let s=t.texData.get(o.dataId),i=Zu(s.values);return t.makeTensorInfo(o.shape,o.dtype,i)}let n;return E().getBool("WEBGL_PACK_UNARY_OPERATIONS")?n=new Pt(o.shape,ov):n=new st(o.shape,ov),t.runWebGLProgram(n,[o],o.dtype)}var nv={kernelName:Tn,backendName:"webgl",kernelFunc:jD};var HD=Re+`
  if (abs(x) > 1.) {
    return NAN;
  }
  return acos(x);
`,qD=U({opSnippet:HD}),sv={kernelName:ws,backendName:"webgl",kernelFunc:qD};var KD=Re+`
  if (x < 1.0) return NAN;
return log(x + sqrt(x * x - 1.0));`,XD=U({opSnippet:KD}),iv={kernelName:vs,backendName:"webgl",kernelFunc:XD};var av="return a + b;",YD=ce({opSnippet:av,packedOpSnippet:av,supportsComplex:!0,cpuKernelImpl:zw}),lv={kernelName:xr,backendName:"webgl",kernelFunc:YD};var Nh=class{constructor(e,t){this.outputShape=[],this.outputShape=e,this.variableNames=t.map((s,i)=>`T${i}`);let o=[];this.variableNames.forEach(s=>{o.push(`float v${s} = get${s}AtOutCoords();`)});let n=this.variableNames.map(s=>`v${s}`).join(" + ");this.userCode=`
      void main() {
        ${o.join(`
        `)}

        float result = ${n};
        setOutput(result);
      }
    `}};var Sh=class{constructor(e,t){this.outputShape=[],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=e,this.variableNames=t.map((s,i)=>`T${i}`);let o=[];this.variableNames.forEach(s=>{o.push(`vec4 v${s} = get${s}AtOutCoords();`)});let n=this.variableNames.map(s=>`v${s}`).join(" + ");this.userCode=`
      void main() {
        ${o.join(`
        `)}

        vec4 result = ${n};
        setOutput(result);
      }
    `}};function oc(r){let{inputs:e,backend:t}=r,o=e;if(o.length===1)return Ne({inputs:{x:o[0]},backend:t});if(o.length>E().get("WEBGL_MAX_TEXTURES_IN_SHADER")){let l=Math.floor(o.length/2),u=oc({inputs:o.slice(0,l),backend:t}),c=oc({inputs:o.slice(l),backend:t});return oc({inputs:[u,c],backend:t})}let n=o.map(l=>l.dtype).reduce((l,u)=>Ge(l,u)),s=o.map(l=>l.shape),a=E().getBool("WEBGL_PACK")?new Sh(o[0].shape,s):new Nh(o[0].shape,s);return t.runWebGLProgram(a,o,n)}var uv={kernelName:Ts,backendName:"webgl",kernelFunc:oc};function QD(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{axis:s,keepDims:i}=o,a=n.shape.length,l=C.parseAxisParam(s,n.shape),u=l,c=N.getAxesPermutation(u,a),p=n;c!=null&&(p=ye({inputs:{x:n},backend:t,attrs:{perm:c}}),u=N.getInnerMostAxes(u.length,a)),N.assertAxesAreInnerMostDims("all",u,a);let[m,f]=N.computeOutAndReduceShapes(p.shape,u),d=C.sizeFromShape(f),g=O({inputs:{x:p},backend:t,attrs:{shape:[-1,d]}}),h=_t(g,g.dtype,"all",t),b;if(i){let T=N.expandShapeToKeepDim(m,l);b=O({inputs:{x:h},backend:t,attrs:{shape:T}})}else b=O({inputs:{x:h},backend:t,attrs:{shape:m}});return t.disposeIntermediateTensorInfo(g),t.disposeIntermediateTensorInfo(h),c!=null&&t.disposeIntermediateTensorInfo(p),b}var cv={kernelName:Cs,backendName:"webgl",kernelFunc:QD};function ZD(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{axis:s,keepDims:i}=o,a=n.shape.length,l=C.parseAxisParam(s,n.shape),u=l,c=N.getAxesPermutation(u,a),p=n;c!=null&&(p=ye({inputs:{x:n},backend:t,attrs:{perm:c}}),u=N.getInnerMostAxes(u.length,a)),N.assertAxesAreInnerMostDims("any",u,a);let[m,f]=N.computeOutAndReduceShapes(p.shape,u),d=C.sizeFromShape(f),g=O({inputs:{x:p},backend:t,attrs:{shape:[-1,d]}}),h=_t(g,g.dtype,"any",t),b;if(i){let T=N.expandShapeToKeepDim(m,l);b=O({inputs:{x:h},backend:t,attrs:{shape:T}})}else b=O({inputs:{x:h},backend:t,attrs:{shape:m}});return t.disposeIntermediateTensorInfo(g),t.disposeIntermediateTensorInfo(h),c!=null&&t.disposeIntermediateTensorInfo(p),b}var pv={kernelName:ks,backendName:"webgl",kernelFunc:ZD};var Eh=class{constructor(e,t,o){this.variableNames=["A"];let{windowSize:n,batchSize:s,outSize:i}=e;o||this.variableNames.push("bestIndicesA"),this.outputShape=[s,i];let a=t==="max"?">":"<",l=o?"inOffset + i;":"round(getBestIndicesA(batch, inOffset + i));";this.userCode=`
      void main() {
        ivec2 coords = getOutputCoords();
        int batch = coords[0];
        int outIdx = coords[1];
        int inOffset = outIdx * ${n};

        int bestIndex = inOffset;
        float bestValue = getA(batch, bestIndex);

        for (int i = 0; i < ${n}; i++) {
          int inIdx = ${l};
          float candidate = getA(batch, inIdx);
          if (candidate ${a} bestValue) {
            bestValue = candidate;
            bestIndex = inIdx;
          }
        }
        setOutput(float(bestIndex));
      }
    `}};var Ih=class{constructor(e,t,o,n){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,C.assert(e.length>2,()=>`Packed arg${o.charAt(0).toUpperCase()+o.slice(1)} supports only inputs with rank above 2.`);let s=e[e.length-1],i=Math.ceil(s/t);this.outputShape=e.slice(0,-1),i>1&&this.outputShape.push(i),n||this.variableNames.push("bestIndicesA");let a=this.outputShape,l=a.length,u=Q(l),c=ke("coords",l),p,m;if(i===1){m=l+1;let D=Q(m);p=`
        ${D} sourceLocR = ${D}(${c.join()}, 0);
        ++${c[l-1]};
        ${D} sourceLocG = ${D}(${c.join()}, 0);
        ++${c[l-2]};
        ${D} sourceLocA = ${D}(${c.join()}, 0);
        --${c[l-1]};
        ${D} sourceLocB = ${D}(${c.join()}, 0);
        --${c[l-2]};`}else m=l,p=`
        ${u} sourceLocR = coords;
        ++${c[l-1]};
        ${u} sourceLocG = coords;
        ++${c[l-2]};
        ${u} sourceLocA = coords;
        --${c[l-1]};
        ${u} sourceLocB = coords;
        --${c[l-2]};`;let f=["x","y","z","w","u","v"].slice(0,m),d="."+f[m-1],g=f.map(D=>"int "+D),h=ke("sourceLocR",m-1).concat("inIdx.r"),b=ke("sourceLocG",m-1).concat("inIdx.g"),T=ke("sourceLocB",m-1).concat("inIdx.b"),k=ke("sourceLocA",m-1).concat("inIdx.a"),S=o==="max"?"greaterThan":"lessThan",I=n?"":`
          inIdx = round(vec4(getBestIndicesAChannel(${h.join()}),
                             getBestIndicesAChannel(${b.join()}),
                             getBestIndicesAChannel(${T.join()}),
                             getBestIndicesAChannel(${k.join()})));`,A=`vec4(
            getAChannel(${h.join()}),
            hasNextCol ? getAChannel(${b.join()}) : 0.,
            hasNextRow ? getAChannel(${T.join()}) : 0.,
            hasNextRow && hasNextCol ? getAChannel(${k.join()}) : 0.)`,R=n?"":`
      float getBestIndicesAChannel(${g.join()}) {
        return getChannel(getBestIndicesA(${f.join()}),
                                          vec2(${f.slice(-2).join()}));
      }`;this.userCode=`
      float getAChannel(${g.join()}) {
        return getChannel(getA(${f.join()}),
                               vec2(${f.slice(-2).join()}));
      }
      ${R}
      void main() {
        ${u} coords = getOutputCoords();
        bool hasNextCol = ${c[l-1]} < ${a[l-1]-1};
        bool hasNextRow = ${c[l-2]} < ${a[l-2]-1};
        ${p}
        ivec4 srcIdx = ivec4(sourceLocR${d}, sourceLocG${d},
          sourceLocB${d}, sourceLocA${d}) * ${t};
        ivec4 inIdx = srcIdx;
        vec4 bestIndex = vec4(inIdx);
        vec4 bestValue = ${A};

        for (int i = 0; i < ${t}; i++) {
          inIdx = srcIdx;
          ${I}
          vec4 candidate = ${A};
          bvec4 nan = isnan(candidate);
          bvec4 replace = bvec4(
            vec4(${S}(candidate, bestValue)) * (vec4(1.0) - vec4(nan)));

          bestValue = vec4(replace.x  ? candidate.x : bestValue.x,
                           replace.y  ? candidate.y : bestValue.y,
                           replace.z  ? candidate.z : bestValue.z,
                           replace.w  ? candidate.w : bestValue.w);
          bestIndex = mix(bestIndex, vec4(inIdx), vec4(replace));
          srcIdx++;
        }
        setOutput(bestIndex);
      }
    `}};function mv(r,e,t,o=null){let n=e.shape[0],s=e.shape[1];o!=null&&(n=o.shape[0],s=o.shape[1]);let i=N.computeOptimalWindowSize(s),a={windowSize:i,inSize:s,batchSize:n,outSize:Math.ceil(s/i)},l=new Eh(a,t,o==null),u=[e];o!=null&&u.push(o);let c=r.runWebGLProgram(l,u,"int32");if(c.shape[1]===1)return c;let p=mv(r,e,t,c);return r.disposeIntermediateTensorInfo(c),p}function fv(r,e,t,o=null){let n=o!=null?o.shape:e.shape,s=n[n.length-1],i=N.computeOptimalWindowSize(s),a=new Ih(n,i,t,o==null),l=o==null?[e]:[e,o],u=r.runWebGLProgram(a,l,"int32");if(u.shape.length===e.shape.length){let c=fv(r,e,t,u);return r.disposeIntermediateTensorInfo(u),c}return u}function nc(r,e,t,o){let n=[t];if(N.assertAxesAreInnerMostDims("arg"+o.charAt(0).toUpperCase()+o.slice(1),n,e.shape.length),!E().getBool("WEBGL_PACK_REDUCE")||e.shape.length<=2){let s=[],i=r.texData.get(e.dataId),a=i!==null&&i.isPacked,l=e;a&&(l=r.unpackTensor(e),s.push(l));let[u,c]=N.computeOutAndReduceShapes(l.shape,n),p=C.sizeFromShape(c),m=O({inputs:{x:l},backend:r,attrs:{shape:[-1,p]}});s.push(m);let f=mv(r,m,o);s.push(f);let d=O({inputs:{x:f},backend:r,attrs:{shape:u}});return s.forEach(g=>r.disposeIntermediateTensorInfo(g)),d}return fv(r,e,o)}function JD(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{axis:s}=o,i=C.parseAxisParam(s,n.shape),a=N.getAxesPermutation(i,n.shape.length),l=n,u=[];a!=null&&(l=ye({inputs:{x:n},backend:t,attrs:{perm:a}}),u.push(l),i=N.getInnerMostAxes(i.length,l.shape.length)),N.assertAxesAreInnerMostDims("argMax",[i[0]],l.shape.length);let c=nc(t,l,i[0],"max");return u.forEach(p=>t.disposeIntermediateTensorInfo(p)),c}var dv={kernelName:Ns,backendName:"webgl",kernelFunc:JD};function eF(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{axis:s}=o,i=C.parseAxisParam(s,n.shape),a=N.getAxesPermutation(i,n.shape.length),l=n,u=[];a!=null&&(l=ye({inputs:{x:n},backend:t,attrs:{perm:a}}),u.push(l),i=N.getInnerMostAxes(i.length,l.shape.length)),N.assertAxesAreInnerMostDims("argMin",[i[0]],l.shape.length);let c=nc(t,l,i[0],"min");return u.forEach(p=>t.disposeIntermediateTensorInfo(p)),c}var hv={kernelName:Ss,backendName:"webgl",kernelFunc:eF};var tF=Re+`
  if (abs(x) > 1.) {
    return NAN;
  }
  return asin(x);
`,rF=U({opSnippet:tF}),gv={kernelName:Es,backendName:"webgl",kernelFunc:rF};var oF=Re+"return log(x + sqrt(x * x + 1.0));",nF=U({opSnippet:oF}),xv={kernelName:Is,backendName:"webgl",kernelFunc:nF};var sF=Re+`
  return atan(x);
`,iF=U({opSnippet:sF}),yv={kernelName:$s,backendName:"webgl",kernelFunc:iF};var aF=us+`
  return atan(a, b);
`,lF=`
  vec4 result = atan(a, b);
  bvec4 isNaNA = isnan(a);
  bvec4 isNaNB = isnan(b);
  bvec4 isNaN = bvec4(isNaNA.x || isNaNB.x, isNaNA.y || isNaNB.y, isNaNA.z || isNaNB.z, isNaNA.w || isNaNB.w);
  `+dr+`
  return result;
`,uF=ce({opSnippet:aF,packedOpSnippet:lF}),bv={kernelName:Rs,backendName:"webgl",kernelFunc:uF};var cF=Re+`
  if ((x < -1.0) || (x > 1.0)) return NAN;
return (log(1.0 + x) - log(1.0 - x)) / 2.0;`,pF=U({opSnippet:cF}),_v={kernelName:As,backendName:"webgl",kernelFunc:pF};var hr=class{constructor(e,t,o,n=!1,s=!1){if(this.variableNames=["x"],t==="avg"&&o)throw new Error("Cannot compute positions for average pool.");let i=e.filterWidth,a=e.strideHeight,l=e.strideWidth,u=e.dilationHeight,c=e.dilationWidth,p=e.effectiveFilterHeight,m=e.effectiveFilterWidth,f=e.padInfo.top,d=e.padInfo.left;this.outputShape=e.outShape;let g=t==="avg",h=`((batch  * ${e.inHeight} + xR) * ${e.inWidth} + xC) * ${e.inChannels} + d`,b=`(xR * ${e.inWidth} + xC) * ${e.inChannels} + d`,T="0.0";if(g||(T="-1.0 / 1e-20"),o){let D=">=";this.userCode=`
        const ivec2 strides = ivec2(${a}, ${l});
        const ivec2 pads = ivec2(${f}, ${d});

        void main() {
          ivec4 coords = getOutputCoords();
          int batch = coords[0];
          int d = coords[3];

          ivec2 xRCCorner = coords.yz * strides - pads;
          int xRCorner = xRCCorner.x;
          int xCCorner = xRCCorner.y;

          // max/min x(?, ?, d) to get y(yR, yC, d).
          // ? = to be determined
          float minMaxValue = 0.0;
          float minMaxValueFound = 0.0;
          int minMaxPosition = 0;
          float avgValue = 0.0;

          for (int wR = 0; wR < ${p};
              wR += ${u}) {
            int xR = xRCorner + wR;

            if (xR < 0 || xR >= ${e.inHeight}) {
              continue;
            }

            for (int wC = 0; wC < ${m};
                wC += ${c}) {
              int xC = xCCorner + wC;

              if (xC < 0 || xC >= ${e.inWidth}) {
                continue;
              }

              float value = getX(batch, xR, xC, d);

              // If a min / max value has already been found, use it. If not,
              // use the current value.
              float currMinMaxValue = mix(
                  value, minMaxValue, minMaxValueFound);
              if (value ${D} currMinMaxValue) {
                minMaxValue = value;
                minMaxValueFound = 1.0;
                minMaxPosition = ${n?s?h:b:`wR * ${m} + wC`};
              }
            }
          }
          setOutput(float(minMaxPosition));
        }
      `;return}let k="max",S=`${t}(${t}(${t}(minMaxValue[0], minMaxValue[1]), minMaxValue[2]), minMaxValue[3])`;t==="avg"&&(S="avgValue / count");let I=Math.floor(i/4)*4,A=i%4,R=`
      if (${g}) {
        avgValue += dot(values, ones);
      } else {
        minMaxValue = ${k}(values, minMaxValue);
      }
    `;this.userCode=`
      const ivec2 strides = ivec2(${a}, ${l});
      const ivec2 pads = ivec2(${f}, ${d});
      const float initializationValue = ${T};
      const vec4 ones = vec4(1.0, 1.0, 1.0, 1.0);

      float count = 0.0;

      float getValue(int batch, int xR, int xC, int d) {
        if (xC < 0 || xC >= ${e.inWidth}) {
          return initializationValue;
        }
        count += 1.0;
        return getX(batch, xR, xC, d);
      }

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords[0];
        int d = coords[3];

        ivec2 xRCCorner = coords.yz * strides - pads;
        int xRCorner = xRCCorner.x;
        int xCCorner = xRCCorner.y;

        // max/min x(?, ?, d) to get y(yR, yC, d).
        // ? = to be determined
        vec4 minMaxValue = vec4(${T});
        float avgValue = 0.0;
        count = 0.0;

        for (int wR = 0; wR < ${p};
            wR += ${u}) {
          int xR = xRCorner + wR;

          if (xR < 0 || xR >= ${e.inHeight}) {
            continue;
          }

          for (int wC = 0; wC < ${I}; wC += 4) {
            int xC = xCCorner + wC * ${c};

            vec4 values = vec4(
              getValue(batch, xR, xC, d),
              getValue(batch, xR, xC + ${c}, d),
              getValue(batch, xR, xC + 2 * ${c}, d),
              getValue(batch, xR, xC + 3 * ${c}, d)
            );

            ${R}
          }

          int xC = xCCorner + ${I};
          if (${A===1}) {
            vec4 values = vec4(
              getValue(batch, xR, xC, d),
              initializationValue,
              initializationValue,
              initializationValue
            );

            ${R}
          } else if (${A===2}) {
            vec4 values = vec4(
              getValue(batch, xR, xC, d),
              getValue(batch, xR, xC + ${c}, d),
              initializationValue,
              initializationValue
            );

            ${R}
          } else if (${A===3}) {
            vec4 values = vec4(
              getValue(batch, xR, xC, d),
              getValue(batch, xR, xC + ${c}, d),
              getValue(batch, xR, xC + 2 * ${c}, d),
              initializationValue
            );

            ${R}
          }
        }
        setOutput(${S});
      }
    `}},hn=class{constructor(e,t,o,n=!1,s=!1){if(this.variableNames=["x"],t==="avg"&&o)throw new Error("Cannot compute positions for average pool.");let i=e.filterWidth,a=e.strideDepth,l=e.strideHeight,u=e.strideWidth,c=e.dilationDepth,p=e.dilationHeight,m=e.dilationWidth,f=e.effectiveFilterDepth,d=e.effectiveFilterHeight,g=e.effectiveFilterWidth,h=e.padInfo.front,b=e.padInfo.top,T=e.padInfo.left;this.outputShape=e.outShape;let k=t==="avg",S="0.0";if(k||(S="-1.0 / 1e-20"),o){let L=">=";this.userCode=`
        const ivec3 strides =
            ivec3(${a}, ${l}, ${u});
        const ivec3 pads = ivec3(${h}, ${b}, ${T});

        void main() {
          ivec5 coords = getOutputCoords();
          int batch = coords.x;
          int ch = coords.u;

          ivec3 xCorner = ivec3(coords.y, coords.z, coords.w) * strides - pads;
          int xDCorner = xCorner.x;
          int xRCorner = xCorner.y;
          int xCCorner = xCorner.z;

          // max/min x(?, ?, ?, ch) to get y(yD, yR, yC, ch).
          // ? = to be determined
          float minMaxValue = 0.0;
          float minMaxValueFound = 0.0;
          int minMaxPosition = 0;

          for (int wD = 0; wD < ${f};
              wD += ${c}) {
            int xD = xDCorner + wD;

            if (xD < 0 || xD >= ${e.inDepth}) {
              continue;
            }

            for (int wR = 0; wR < ${d};
                wR += ${p}) {
              int xR = xRCorner + wR;

              if (xR < 0 || xR >= ${e.inHeight}) {
                continue;
              }

              for (int wC = 0; wC < ${g};
                  wC += ${m}) {
                int xC = xCCorner + wC;

                if (xC < 0 || xC >= ${e.inWidth}) {
                  continue;
                }

                float value = getX(batch, xD, xR, xC, ch);

                // If a min / max value has already been found, use it. If not,
                // use the current value.
                float currMinMaxValue = mix(
                    value, minMaxValue, minMaxValueFound);
                if (value ${L} currMinMaxValue) {
                  minMaxValue = value;
                  minMaxValueFound = 1.0;
                  minMaxPosition = ${n?s?`(((batch * ${e.inDepth} + xD) * ${e.inHeight} + xR) * ${e.inWidth} + xC) * ${e.inChannels} + ch`:`((xD * ${e.inHeight} + xR) * ${e.inWidth} + xC) * ${e.inChannels} + ch`:`wD * ${d} * ${g} +
                      wR * ${g} + wC`};
                }
              }
            }
          }
          setOutput(float(minMaxPosition));
        }
      `;return}let I="max",A=`${t}(${t}(${t}(minMaxValue[0], minMaxValue[1]), minMaxValue[2]), minMaxValue[3])`;t==="avg"&&(A="avgValue / count");let R=Math.floor(i/4)*4,D=i%4,P=`
      if (${k}) {
        avgValue += dot(values, ones);
      } else {
        minMaxValue = ${I}(values, minMaxValue);
      }
    `;this.userCode=`
      const ivec3 strides =
        ivec3(${a}, ${l}, ${u});
      const ivec3 pads = ivec3(${h}, ${b}, ${T});
      const float initializationValue = ${S};
      const vec4 ones = vec4(1.0, 1.0, 1.0, 1.0);

      float count = 0.0;

      float getValue(int batch, int xD, int xR, int xC, int ch) {
        if (xC < 0 || xC >= ${e.inWidth}) {
          return initializationValue;
        }
        count += 1.0;
        return getX(batch, xD, xR, xC, ch);
      }

      void main() {
        ivec5 coords = getOutputCoords();
        int batch = coords.x;
        int ch = coords.u;

        ivec3 xCorner = ivec3(coords.y, coords.z, coords.w) * strides - pads;
        int xDCorner = xCorner.x;
        int xRCorner = xCorner.y;
        int xCCorner = xCorner.z;

        // max/min x(?, ?, ?, d) to get y(yD, yR, yC, ch).
        // ? = to be determined
        vec4 minMaxValue = vec4(${S});
        float avgValue = 0.0;
        count = 0.0;

        for (int wD = 0; wD < ${f};
            wD += ${c}) {
          int xD = xDCorner + wD;

          if (xD < 0 || xD >= ${e.inDepth}) {
            continue;
          }

          for (int wR = 0; wR < ${d};
            wR += ${p}) {
            int xR = xRCorner + wR;

            if (xR < 0 || xR >= ${e.inHeight}) {
              continue;
            }

            for (int wC = 0; wC < ${R}; wC += 4) {
              int xC = xCCorner + wC * ${m};

              vec4 values = vec4(
                getValue(batch, xD, xR, xC, ch),
                getValue(batch, xD, xR, xC + ${m}, ch),
                getValue(batch, xD, xR, xC + 2 * ${m}, ch),
                getValue(batch, xD, xR, xC + 3 * ${m}, ch)
              );

              ${P}
            }

            int xC = xCCorner + ${R};
            if (${D===1}) {
              vec4 values = vec4(
                getValue(batch, xD, xR, xC, ch),
                initializationValue,
                initializationValue,
                initializationValue
              );

              ${P}
            } else if (${D===2}) {
              vec4 values = vec4(
                getValue(batch, xD, xR, xC, ch),
                getValue(batch, xD, xR, xC + ${m}, ch),
                initializationValue,
                initializationValue
              );

              ${P}
            } else if (${D===3}) {
              vec4 values = vec4(
                getValue(batch, xD, xR, xC, ch),
                getValue(batch, xD, xR, xC + ${m}, ch),
                getValue(batch, xD, xR, xC + 2 * ${m}, ch),
                initializationValue
              );

              ${P}
            }
          }
          setOutput(${A});
        }
      }
    `}};function mF(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e;Zt(n,"avgPool");let{filterSize:s,strides:i,pad:a,dimRoundingMode:l}=o,u=1;C.assert(N.eitherStridesOrDilationsAreOne(i,u),()=>`Error in avgPool: Either strides or dilations must be 1. Got strides ${i} and dilations '${u}'`);let c=N.computePool2DInfo(n.shape,s,i,u,a,l);if(c.filterWidth===1&&c.filterHeight===1&&C.arraysEqual(c.inShape,c.outShape))return Ne({inputs:{x:n},backend:t});let p=new hr(c,"avg",!1);return t.runWebGLProgram(p,[n],"float32")}var wv={kernelName:Ds,backendName:"webgl",kernelFunc:mF};function fF(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{filterSize:s,strides:i,pad:a,dimRoundingMode:l,dataFormat:u}=o,c=[1,1,1],p=N.computePool3DInfo(n.shape,s,i,c,a,l,u),m=new hn(p,"avg",!1);return t.runWebGLProgram(m,[n],"float32")}var vv={kernelName:Fs,backendName:"webgl",kernelFunc:fF};var $h=class{constructor(e){this.variableNames=["dy"],this.outputShape=e.inShape;let t=e.filterHeight,o=e.filterWidth,n=e.strideHeight,s=e.strideWidth,i=e.dilationHeight,a=e.dilationWidth,l=e.effectiveFilterHeight,u=e.effectiveFilterWidth,c=l-1-e.padInfo.top,p=u-1-e.padInfo.left,m=1/(t*o);this.userCode=`
      const ivec2 pads = ivec2(${c}, ${p});
      const float avgMultiplier = float(${m});

      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];

        ivec2 dyRCCorner = coords.yz - pads;
        int dyRCorner = dyRCCorner.x;
        int dyCCorner = dyRCCorner.y;

        // Convolve dy(?, ?, d) with pos mask(:, :, d) to get dx(xR, xC, d).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;
        for (int wR = 0; wR < ${l};
            wR += ${i}) {
          float dyR = float(dyRCorner + wR) / ${n}.0;

          if (dyR < 0.0 || dyR >= ${e.outHeight}.0 || fract(dyR) > 0.0) {
            continue;
          }
          int idyR = int(dyR);

          for (int wC = 0; wC < ${u};
            wC+= ${a}) {
            float dyC = float(dyCCorner + wC) / ${s}.0;

            if (dyC < 0.0 || dyC >= ${e.outWidth}.0 ||
                fract(dyC) > 0.0) {
              continue;
            }
            int idyC = int(dyC);

            float dyValue = getDy(b, idyR, idyC, d);

            dotProd += dyValue * avgMultiplier;
          }
        }
        setOutput(dotProd);
      }
    `}},Ah=class{constructor(e){this.variableNames=["dy"],this.outputShape=e.inShape;let t=e.filterDepth,o=e.filterHeight,n=e.filterWidth,s=e.strideDepth,i=e.strideHeight,a=e.strideWidth,l=e.dilationDepth,u=e.dilationHeight,c=e.dilationWidth,p=e.effectiveFilterDepth,m=e.effectiveFilterHeight,f=e.effectiveFilterWidth,d=p-1-e.padInfo.front,g=m-1-e.padInfo.top,h=f-1-e.padInfo.left,b=1/(t*o*n);this.userCode=`
      const ivec3 pads = ivec3(${d}, ${g}, ${h});
      const float avgMultiplier = float(${b});

      void main() {
        ivec5 coords = getOutputCoords();
        int batch = coords.x;
        int ch = coords.u;

        ivec3 dyCorner = ivec3(coords.y, coords.z, coords.w) - pads;
        int dyDCorner = dyCorner.x;
        int dyRCorner = dyCorner.y;
        int dyCCorner = dyCorner.z;

        // Convolve dy(?, ?, ?, d) with pos mask(:, :, :, ch) to get
        // dx(xD, xR, xC, ch).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;

        for (int wD = 0; wD < ${p};
            wD += ${l}) {
          float dyD = float(dyDCorner + wD) / ${s}.0;

          if (dyD < 0.0 || dyD >= ${e.outDepth}.0 || fract(dyD) > 0.0) {
            continue;
          }
          int idyD = int(dyD);

          for (int wR = 0; wR < ${m};
              wR += ${u}) {
            float dyR = float(dyRCorner + wR) / ${i}.0;

            if (dyR < 0.0 || dyR >= ${e.outHeight}.0 ||
                fract(dyR) > 0.0) {
              continue;
            }
            int idyR = int(dyR);

            for (int wC = 0; wC < ${f};
                wC += ${c}) {
              float dyC = float(dyCCorner + wC) / ${a}.0;

              if (dyC < 0.0 || dyC >= ${e.outWidth}.0 ||
                  fract(dyC) > 0.0) {
                continue;
              }
              int idyC = int(dyC);

              float dyValue = getDy(batch, idyD, idyR, idyC, ch);

              dotProd += dyValue * avgMultiplier;
            }
          }
        }
        setOutput(dotProd);
      }
    `}};function dF(r){let{inputs:e,backend:t,attrs:o}=r,{dy:n,input:s}=e,i=s,{filterSize:a,strides:l,pad:u,dimRoundingMode:c}=o,p=[1,1,1],m=N.computePool3DInfo(i.shape,a,l,p,u,c),f=new Ah(m);return t.runWebGLProgram(f,[n],i.dtype)}var Tv={kernelName:Hc,backendName:"webgl",kernelFunc:dF};function hF(r){let{inputs:e,backend:t,attrs:o}=r,{dy:n,input:s}=e,i=s;Zt([n,s],"avgPoolGrad");let{filterSize:a,strides:l,pad:u}=o,c=N.computePool2DInfo(i.shape,a,l,1,u),p=new $h(c);return t.runWebGLProgram(p,[n],i.dtype)}var Cv={kernelName:jc,backendName:"webgl",kernelFunc:hF};function gF(r){let{inputs:e,backend:t,attrs:o}=r,{a:n,b:s}=e,{transposeA:i,transposeB:a}=o;return dn({a:n,b:s,transposeA:i,transposeB:a,backend:t})}var kv={kernelName:Os,backendName:"webgl",kernelFunc:gF};var Rh=class{constructor(e,t,o,n,s,i){this.outputShape=[],this.variableNames=["x","mean","variance"],N.assertAndGetBroadcastShape(e,t),N.assertAndGetBroadcastShape(e,o);let a="0.0";n!=null&&(N.assertAndGetBroadcastShape(e,n),this.variableNames.push("offset"),a="getOffsetAtOutCoords()");let l="1.0";s!=null&&(N.assertAndGetBroadcastShape(e,s),this.variableNames.push("scale"),l="getScaleAtOutCoords()"),this.outputShape=e,this.userCode=`
      void main() {
        float x = getXAtOutCoords();
        float mean = getMeanAtOutCoords();
        float variance = getVarianceAtOutCoords();
        float offset = ${a};
        float scale = ${l};
        float inv = scale * inversesqrt(variance + float(${i}));
        setOutput(dot(vec3(x, -mean, offset), vec3(inv, inv, 1)));
      }
    `}};var Dh=class{constructor(e,t,o,n,s,i){this.packedInputs=!0,this.packedOutput=!0,this.variableNames=["x","mean","variance"],N.assertAndGetBroadcastShape(e,t),N.assertAndGetBroadcastShape(e,o);let a="vec4(0.0)";n!=null&&(N.assertAndGetBroadcastShape(e,n),this.variableNames.push("offset"),a="getOffsetAtOutCoords()");let l="vec4(1.0)";s!=null&&(N.assertAndGetBroadcastShape(e,s),this.variableNames.push("scale"),l="getScaleAtOutCoords()"),this.outputShape=e,this.userCode=`
      void main() {
        vec4 offset = ${a};
        vec4 scale = ${l};

        vec4 x = getXAtOutCoords();
        vec4 mean = getMeanAtOutCoords();
        vec4 variance = getVarianceAtOutCoords();

        vec4 inv = scale * inversesqrt(variance + vec4(${i}));

        setOutput((x - mean) * inv + offset);
      }
    `}};var xF=({inputs:r,backend:e,attrs:t})=>{let{x:o,mean:n,variance:s,offset:i,scale:a}=r;C.assert(n.shape.length===s.shape.length,()=>"Batch normalization gradient requires mean and variance to have equal ranks."),C.assert(i==null||n.shape.length===i.shape.length,()=>"Batch normalization gradient requires mean and offset to have equal ranks."),C.assert(a==null||n.shape.length===a.shape.length,()=>"Batch normalization gradient requires mean and scale to have equal ranks.");let{varianceEpsilon:l}=t;l==null&&(l=.001);let u=[o,n,s],c=null;i!=null&&(c=i.shape,u.push(i));let p=null;a!=null&&(p=a.shape,u.push(a));let m=E().getBool("WEBGL_PACK_NORMALIZATION")?new Dh(o.shape,n.shape,s.shape,c,p,l):new Rh(o.shape,n.shape,s.shape,c,p,l);return e.runWebGLProgram(m,u,u[0].dtype)},Nv={kernelName:di,backendName:"webgl",kernelFunc:xF};var Fh=class{constructor(e){this.variableNames=["source"],this.outputShape=e,this.rank=e.length;let t=Q(this.rank);this.customUniforms=[{name:"start",arrayIndex:this.rank,type:"int"}];let o=yF(this.rank),n,s=e.map((i,a)=>`sourceLoc.${Oh[a]} = start[${a}] + coords.${Oh[a]};`);n=`
        ${t} sourceLoc;
        ${t} coords = getOutputCoords();
        ${s.join(`
`)}
      `,this.userCode=`
      void main() {
        ${n}
        setOutput(getSource(${o}));
      }
    `}},Oh=["x","y","z","w","u","v"];function yF(r){if(r===1)return"sourceLoc";if(r<=6)return Oh.slice(0,r).map(e=>"sourceLoc."+e).join(",");throw Error(`Slicing for rank ${r} is not yet supported`)}var Ph=class{constructor(e){this.variableNames=["source"],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=e,this.rank=e.length,this.customUniforms=[{name:"start",arrayIndex:this.rank,type:"int"}];let t=Q(this.rank),o=ke("coords",this.rank),n=ke("sourceLoc",this.rank),s=this.rank===1?"sourceLoc":`vec2(${n.slice(-2).join()})`,i=`getChannel(getSource(${n.join()}), ${s})`,a=`
      result.x = ${i};
      if (++${o[this.rank-1]} < ${e[this.rank-1]}) {
        ++${n[this.rank-1]};
        result.y = ${i};
        --${n[this.rank-1]};
      }
    `,l=this.rank===1?"":`
      --${o[this.rank-1]};
      if (++${o[this.rank-2]} < ${e[this.rank-2]}) {
        ++${n[this.rank-2]};
        result.z = ${i};
        if (++${o[this.rank-1]} < ${e[this.rank-1]}) {
          ++${n[this.rank-1]};
          result.w = ${i};
        }
      }
    `,u=this.rank<=4?`sourceLoc = coords +
            ${t}(${e.map((c,p)=>`start[${p}]`).join()});`:e.map((c,p)=>`${n[p]} = ${o[p]} + start[${p}];`).join(`
`);this.userCode=`
      void main() {
        ${t} coords = getOutputCoords();
        ${t} sourceLoc;
        ${u}
        vec4 result = vec4(0.);
        ${a}
        ${l}
        setOutput(result);
      }
    `}};function bF(r,e,t,o){let n=o.texData.get(r.dataId),s=o.makeTensorInfo(t,r.dtype),i=o.texData.get(s.dataId);Object.assign(i,n),i.refCount=1,i.shape=t,i.dtype=r.dtype;let a=tt.computeFlatOffset(e,C.computeStrides(r.shape));n.slice&&(a+=n.slice.flatOffset),i.slice={flatOffset:a,origDataId:n.slice&&n.slice.origDataId||r.dataId};let l=o.dataRefCount.get(i.slice.origDataId)||1;return o.dataRefCount.set(i.slice.origDataId,l+1),s}function tr(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{begin:s,size:i}=o,[a,l]=tt.parseSliceParams(n,s,i);if(tt.assertParamsValid(n,a,l),C.sizeFromShape(l)===0)return t.makeTensorInfo(l,n.dtype,[]);if(t.shouldExecuteOnCPU([n])||n.dtype==="string"){let p=t.texData.get(n.dataId),m=y0(p.values,a,l,n.shape,n.dtype);return t.makeTensorInfo(l,n.dtype,m)}let{isPacked:u}=t.texData.get(n.dataId),c=tt.isSliceContinous(n.shape,a,l);if(u||!c){let p=E().getBool("WEBGL_PACK_ARRAY_OPERATIONS")?new Ph(l):new Fh(l),m=[a];return t.runWebGLProgram(p,[n],n.dtype,m)}return t.uploadToGPU(n.dataId),bF(n,a,l,t)}var Sv={kernelName:En,backendName:"webgl",kernelFunc:tr};var _F=r=>{let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{blockShape:s,crops:i}=o;C.assert(n.shape.length<=4,()=>"batchToSpaceND for rank > 4 with a WebGL backend not implemented yet");let a=s.reduce((T,k)=>T*k),l=N.getReshaped(n.shape,s,a),u=N.getPermuted(l.length,s.length),c=N.getReshapedPermuted(n.shape,s,a),p=N.getSliceBeginCoords(i,s.length),m=N.getSliceSize(c,i,s.length),f=[],d=O({inputs:{x:n},backend:t,attrs:{shape:l}}),g=ye({inputs:{x:d},backend:t,attrs:{perm:u}}),h=O({inputs:{x:g},backend:t,attrs:{shape:c}}),b=tr({inputs:{x:h},backend:t,attrs:{begin:p,size:m}});return f.push(d),f.push(g),f.push(h),f.forEach(T=>t.disposeIntermediateTensorInfo(T)),b},Ev={kernelName:Ps,backendName:"webgl",kernelFunc:_F};function wF(r){let{inputs:e,backend:t,attrs:o}=r,{x:n,weights:s}=e,{size:i}=o,a=t.readSync(n.dataId),l=t.readSync(s.dataId),u=Qu(a,l,s.dtype,s.shape,i);return t.makeTensorInfo([i],s.dtype,u)}var Iv={kernelName:Ls,backendName:"webgl",kernelFunc:wF};function vF(r){let{inputs:e,backend:t}=r,{s0:o,s1:n}=e,s=t.readSync(o.dataId),i=t.readSync(n.dataId),a=N.assertAndGetBroadcastShape(Array.from(s),Array.from(i));return t.makeTensorInfo([a.length],"int32",Int32Array.from(a))}var $v={kernelName:Bs,backendName:"webgl",kernelFunc:vF};var TF="return float(a != b);",Lh=ce({opSnippet:TF,cpuKernelImpl:c0,dtype:"bool"}),Av={kernelName:Co,backendName:"webgl",kernelFunc:Lh};function Br(r){let{inputs:e,backend:t}=r,{input:o}=e,n=t.texData.get(o.dataId);return Ne({inputs:{x:n.complexTensorInfos.real},backend:t})}var Rv={kernelName:Sn,backendName:"webgl",kernelFunc:Br};var CF="return float(int(x));";function Dv(r,e){let t=new st(r.shape,CF),o=e.runWebGLProgram(t,[r],"int32");return{dataId:o.dataId,shape:o.shape,dtype:o.dtype}}function Bh(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{dtype:s}=o;if(s==="complex64"){if(n.dtype==="complex64")return Ne({inputs:{x:n},backend:t});let i=Nt(n.shape),a=Bh({inputs:{x:n},backend:t,attrs:{dtype:"float32"}}),l=ct({inputs:{real:a,imag:i},backend:t});return i.dispose(),t.disposeIntermediateTensorInfo(a),l}if(n.dtype==="complex64"){let i=Br({inputs:{input:n},backend:t}),a=Bh({inputs:{x:i},backend:t,attrs:{dtype:s}});return t.disposeIntermediateTensorInfo(i),a}if(!C.hasEncodingLoss(n.dtype,s)){let i=Ne({inputs:{x:n},backend:t});return{dataId:i.dataId,shape:i.shape,dtype:s}}if(t.shouldExecuteOnCPU([n])){let i=t.texData.get(n.dataId).values,[a,l,u]=Ww(i,n.shape,n.dtype,s);return t.makeTensorInfo(a,l,u)}if(s==="int32")return Dv(n,t);if(s==="bool"){let i=t.makeTensorInfo([],"bool",C.getTypedArrayFromDType("bool",1)),l=Lh({inputs:{a:n,b:i},backend:t});return t.disposeIntermediateTensorInfo(i),l}throw new Error(`Error in Cast: failed to cast ${n.dtype} to ${s}`)}var Fv={kernelName:Gr,backendName:"webgl",kernelFunc:Bh};var Ov="return ceil(x);",kF=U({opSnippet:Ov,packedOpSnippet:Ov,cpuKernelImpl:jw}),Pv={kernelName:co,backendName:"webgl",kernelFunc:kF};var Mh=class{constructor(e){this.variableNames=["A"],this.customUniforms=[{name:"minVal",type:"float"},{name:"maxVal",type:"float"}],this.outputShape=e,this.userCode=`

      void main() {
        float value = getAAtOutCoords();
        if (isnan(value)) {
          setOutput(value);
          return;
        }

        setOutput(clamp(value, minVal, maxVal));
      }
    `}};var Vh=class{constructor(e){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.customUniforms=[{name:"minVal",type:"float"},{name:"maxVal",type:"float"}],this.outputShape=e,this.userCode=`
      void main() {
        vec4 value = getAAtOutCoords();

        if (any(isnan(value))) {
          setOutput(value);
          return;
        }

        setOutput(clamp(value, vec4(minVal), vec4(maxVal)));
      }
    `}};function NF(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{clipValueMin:s,clipValueMax:i}=o,a;E().getBool("WEBGL_PACK_CLIP")?a=new Vh(n.shape):a=new Mh(n.shape);let l=[[s],[i]];return t.runWebGLProgram(a,[n],n.dtype,l)}var Lv={kernelName:Ms,backendName:"webgl",kernelFunc:NF};var Gh=class{constructor(e){this.variableNames=["real","imag"],this.outputShape=e,this.userCode=`
      void main() {
        float re = abs(getRealAtOutCoords());
        float im = abs(getImagAtOutCoords());
        float mx = max(re, im);

        // sadly the length function in glsl is not underflow-safe
        // (at least not on Intel GPUs). So the safe solution is
        // to ensure underflow-safety in all cases.
        setOutput(
          mx == 0.0 ? 0.0 : mx * length(vec2(1, min(re, im)/mx))
        );
      }
    `}};function Bv(r,e){return{dataId:e.dataId,dtype:e.dtype,shape:r.shape}}function SF(r){let{inputs:e,backend:t}=r,{x:o}=e,n=t.texData.get(o.dataId),s=new Gh(o.shape),i=[Bv(o,n.complexTensorInfos.real),Bv(o,n.complexTensorInfos.imag)];return t.runWebGLProgram(s,i,i[0].dtype)}var Mv={kernelName:Vs,backendName:"webgl",kernelFunc:SF};var zh=class{constructor(e){this.outputShape=[],this.outputShape=N.computeOutShape(e,1),this.variableNames=e.map((i,a)=>`T${a}`);let t=new Array(e.length-1);t[0]=e[0][1];for(let i=1;i<t.length;i++)t[i]=t[i-1]+e[i][1];let o=[`if (yC < ${t[0]}) setOutput(getT0(yR, yC));`];for(let i=1;i<t.length;i++){let a=t[i-1];o.push(`else if (yC < ${t[i]}) setOutput(getT${i}(yR, yC-${a}));`)}let n=t.length,s=t[t.length-1];o.push(`else setOutput(getT${n}(yR, yC-${s}));`),this.userCode=`
      void main() {
        ivec2 coords = getOutputCoords();
        int yR = coords.x;
        int yC = coords.y;

        ${o.join(`
        `)}
      }
    `}};var Uh=class{constructor(e,t){this.packedInputs=!0,this.packedOutput=!0,this.outputShape=[],this.outputShape=N.computeOutShape(e,t);let o=this.outputShape,n=o.length,s=Q(n),i=ke("coords",n),a=["x","y","z","w","u","v"].slice(0,n);this.variableNames=e.map((g,h)=>`T${h}`);let l=new Array(e.length-1);l[0]=e[0][t];for(let g=1;g<l.length;g++)l[g]=l[g-1]+e[g][t];let u=a[t],c=a.slice(-2),p=a.join(),m=`if (${u} < ${l[0]}) {
        return getChannel(
            getT0(${p}), vec2(${c.join()}));
        }`;for(let g=1;g<l.length;g++){let h=l[g-1];m+=`
        if (${u} < ${l[g]}  && ${u} >= ${l[g-1]}) {
          return getChannel(
            getT${g}(${sc(a,u,h)}),
            vec2(${sc(c,u,h)}));
        }`}let f=l.length,d=l[l.length-1];m+=`
        return getChannel(
          getT${f}(${sc(a,u,d)}),
          vec2(${sc(c,u,d)}));`,this.userCode=`
      float getValue(${a.map(g=>"int "+g)}) {
        ${m}
      }

      void main() {
        ${s} coords = getOutputCoords();
        vec4 result = vec4(getValue(${i}), 0., 0., 0.);

        ${i[n-1]} = ${i[n-1]} + 1;
        if (${i[n-1]} < ${o[n-1]}) {
          result.g = getValue(${i});
        }

        ${i[n-2]} = ${i[n-2]} + 1;
        if (${i[n-2]} < ${o[n-2]}) {
          result.a = getValue(${i});
        }

        ${i[n-1]} = ${i[n-1]} - 1;
        if (${i[n-2]} < ${o[n-2]} &&
            ${i[n-1]} < ${o[n-1]}) {
          result.b = getValue(${i});
        }
        setOutput(result);
      }
    `}};function sc(r,e,t){let o=r.indexOf(e);return r.map((s,i)=>i===o?`${s} - ${t}`:s).join()}function gn(r){let{inputs:e,backend:t}=r,{input:o}=e,n=t.texData.get(o.dataId);return Ne({inputs:{x:n.complexTensorInfos.imag},backend:t})}var Vv={kernelName:yi,backendName:"webgl",kernelFunc:gn};function cs(r,e,t){let o=r[0].dtype;if(o==="complex64"){let p=r.map(h=>Br({inputs:{input:h},backend:t})),m=r.map(h=>gn({inputs:{input:h},backend:t})),f=cs(p,e,t),d=cs(m,e,t),g=ct({inputs:{real:f,imag:d},backend:t});return p.forEach(h=>t.disposeIntermediateTensorInfo(h)),m.forEach(h=>t.disposeIntermediateTensorInfo(h)),t.disposeIntermediateTensorInfo(f),t.disposeIntermediateTensorInfo(d),g}let n=t.shouldExecuteOnCPU(r);if(o==="string"&&(n=!0),n){let p=r.map(T=>{let k=C.sizeFromShape(T.shape.slice(e));return O({inputs:{x:T},backend:t,attrs:{shape:[-1,k]}})}),m=p.map(T=>({vals:t.readSync(T.dataId),shape:T.shape})),f=N.computeOutShape(p.map(T=>T.shape),1),d=p[0].shape[0]===1,g=Hw(m,f,o,d),h=N.computeOutShape(r.map(T=>T.shape),e),b=t.makeTensorInfo(h,o,g);return p.forEach(T=>t.disposeIntermediateTensorInfo(T)),b}let s=E().getNumber("WEBGL_MAX_TEXTURES_IN_SHADER");if(r.length>s){let p=[];for(let f=0;f<r.length;f+=s){let d=r.slice(f,f+s);p.push(cs(d,e,t))}let m=cs(p,e,t);for(let f of p)t.disposeIntermediateTensorInfo(f);return m}if(E().getBool("WEBGL_PACK_ARRAY_OPERATIONS")&&r[0].shape.length>1){let p=new Uh(r.map(m=>m.shape),e);return t.runWebGLProgram(p,r,o)}let{tensors2D:i,outShape:a}=EF(r,e,t),l=new zh(i.map(p=>p.shape)),u=t.runWebGLProgram(l,i,o);i.forEach(p=>t.disposeIntermediateTensorInfo(p));let c=O({inputs:{x:u},attrs:{shape:a},backend:t});return t.disposeIntermediateTensorInfo(u),c}function EF(r,e,t){let o=N.computeOutShape(r.map(s=>s.shape),e);return{tensors2D:r.map(s=>O({inputs:{x:s},attrs:{shape:[-1,C.sizeFromShape(s.shape.slice(e))]},backend:t})),outShape:o}}function Wh(r){let{inputs:e,backend:t,attrs:o}=r,{axis:n}=o,s=C.parseAxisParam(n,e[0].shape)[0],i=e.map(u=>u.shape);N.assertParamsConsistent(i,s);let a=N.computeOutShape(e.map(u=>u.shape),s);if(C.sizeFromShape(a)===0)return t.makeTensorInfo(a,e[0].dtype,[]);let l=e.filter(u=>C.sizeFromShape(u.shape)>0);return l.length===1?Ne({inputs:{x:l[0]},backend:t}):cs(l,s,t)}var Gv={kernelName:Gs,backendName:"webgl",kernelFunc:Wh};var Bl=class{constructor(e,t=!1,o=null,n=!1,s=!1){this.variableNames=["x","W"],this.outputShape=e.outShape;let i=e.padInfo.top,a=e.padInfo.left,l=e.strideHeight,u=e.strideWidth,c=e.dilationHeight,p=e.dilationWidth,m=e.filterHeight,f=e.filterWidth,d=Math.floor(e.inChannels/4)*4,g=e.inChannels%4,h=e.dataFormat==="channelsLast",b=h?1:2,T=h?2:3,k=h?3:1,S="",I="";o&&(n?S=`float activation(float a) {
          float b = getPreluActivationWeightsAtOutCoords();
          ${o}
        }`:s?S=`float activation(float a) {
          float b = getLeakyreluAlphaAtOutCoords();
          ${o}
        }`:S=`
          float activation(float x) {
            ${o}
          }
        `,I="result = activation(result);");let A=t?"result += getBiasAtOutCoords();":"";t&&this.variableNames.push("bias"),n&&this.variableNames.push("preluActivationWeights"),s&&this.variableNames.push("leakyreluAlpha"),this.userCode=`
      ${S}

      const ivec2 strides = ivec2(${l}, ${u});
      const ivec2 pads = ivec2(${i}, ${a});

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords[0];
        int d2 = coords[${k}];

        ivec2 xRCCorner =
            ivec2(coords[${b}], coords[${T}]) * strides - pads;
        int xRCorner = xRCCorner.x;
        int xCCorner = xRCCorner.y;

        // Convolve x(?, ?, d1) with w(:, :, d1, d2) to get y(yR, yC, d2).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;
        for (int wR = 0; wR < ${m}; wR++) {
          int xR = xRCorner + wR * ${c};

          if (xR < 0 || xR >= ${e.inHeight}) {
            continue;
          }

          for (int wC = 0; wC < ${f}; wC++) {
            int xC = xCCorner + wC * ${p};

            if (xC < 0 || xC >= ${e.inWidth}) {
              continue;
            }

            for (int d1 = 0; d1 < ${d}; d1 += 4) {
              vec4 wValues = vec4(
                getW(wR, wC, d1, d2),
                getW(wR, wC, d1 + 1, d2),
                getW(wR, wC, d1 + 2, d2),
                getW(wR, wC, d1 + 3, d2)
              );

              if (${h}) {
                vec4 xValues = vec4(
                  getX(batch, xR, xC, d1),
                  getX(batch, xR, xC, d1 + 1),
                  getX(batch, xR, xC, d1 + 2),
                  getX(batch, xR, xC, d1 + 3)
                );
                dotProd += dot(xValues, wValues);
              } else {
                vec4 xValues = vec4(
                  getX(batch, d1, xR, xC),
                  getX(batch, d1 + 1, xR, xC),
                  getX(batch, d1 + 2, xR, xC),
                  getX(batch, d1 + 3, xR, xC)
                );
                dotProd += dot(xValues, wValues);
              }
            }

            if (${g===1}) {

              if (${h}) {
                dotProd +=
                    getX(batch, xR, xC, ${d}) *
                    getW(wR, wC, ${d}, d2);
              } else {
                dotProd +=
                    getX(batch, ${d}, xR, xC) *
                    getW(wR, wC, ${d}, d2);
              }

            } else if (${g===2}) {
              vec2 wValues = vec2(
                getW(wR, wC, ${d}, d2),
                getW(wR, wC, ${d} + 1, d2)
              );

              if (${h}) {
                vec2 xValues = vec2(
                  getX(batch, xR, xC, ${d}),
                  getX(batch, xR, xC, ${d} + 1)
                );
                dotProd += dot(xValues, wValues);
              } else {
                vec2 xValues = vec2(
                  getX(batch, ${d}, xR, xC),
                  getX(batch, ${d} + 1, xR, xC)
                );
                dotProd += dot(xValues, wValues);
              }

            } else if (${g===3}) {
              vec3 wValues = vec3(
                getW(wR, wC, ${d}, d2),
                getW(wR, wC, ${d} + 1, d2),
                getW(wR, wC, ${d} + 2, d2)
              );

              if (${h}) {
                vec3 xValues = vec3(
                  getX(batch, xR, xC, ${d}),
                  getX(batch, xR, xC, ${d} + 1),
                  getX(batch, xR, xC, ${d} + 2)
                );
                dotProd += dot(xValues, wValues);
              } else {
                vec3 xValues = vec3(
                  getX(batch, ${d}, xR, xC),
                  getX(batch, ${d} + 1, xR, xC),
                  getX(batch, ${d} + 2, xR, xC)
                );
                dotProd += dot(xValues, wValues);
              }

            }
          }
        }

        float result = dotProd;
        ${A}
        ${I}
        setOutput(result);
      }
    `}},jh=class{constructor(e){this.variableNames=["x","W"],this.outputShape=e.outShape;let t=e.padInfo.front,o=e.padInfo.top,n=e.padInfo.left,s=e.strideDepth,i=e.strideHeight,a=e.strideWidth,l=e.dilationDepth,u=e.dilationHeight,c=e.dilationWidth,p=e.filterDepth,m=e.filterHeight,f=e.filterWidth,d=Math.floor(e.inChannels/4)*4,g=e.inChannels%4;this.userCode=`
      const ivec3 strides = ivec3(${s}, ${i}, ${a});
      const ivec3 pads = ivec3(${t}, ${o}, ${n});

      void main() {
        ivec5 coords = getOutputCoords();
        int batch = coords.x;
        int d2 = coords.u;

        ivec3 xFRCCorner = ivec3(coords.y, coords.z, coords.w) * strides - pads;
        int xFCorner = xFRCCorner.x;
        int xRCorner = xFRCCorner.y;
        int xCCorner = xFRCCorner.z;

        // Convolve x(?, ?, ?, d1) with w(:, :, :, d1, d2) to get
        // y(yF, yR, yC, d2). ? = to be determined. : = across all
        // values in that axis.
        float dotProd = 0.0;
        for (int wF = 0; wF < ${p}; wF++) {
          int xF = xFCorner + wF * ${l};

          if (xF < 0 || xF >= ${e.inDepth}) {
            continue;
          }

          for (int wR = 0; wR < ${m}; wR++) {
            int xR = xRCorner + wR * ${u};

            if (xR < 0 || xR >= ${e.inHeight}) {
              continue;
            }

            for (int wC = 0; wC < ${f}; wC++) {
              int xC = xCCorner + wC * ${c};

              if (xC < 0 || xC >= ${e.inWidth}) {
                continue;
              }

              for (int d1 = 0; d1 < ${d}; d1 += 4) {
                vec4 xValues = vec4(
                  getX(batch, xF, xR, xC, d1),
                  getX(batch, xF, xR, xC, d1 + 1),
                  getX(batch, xF, xR, xC, d1 + 2),
                  getX(batch, xF, xR, xC, d1 + 3)
                );
                vec4 wValues = vec4(
                  getW(wF, wR, wC, d1, d2),
                  getW(wF, wR, wC, d1 + 1, d2),
                  getW(wF, wR, wC, d1 + 2, d2),
                  getW(wF, wR, wC, d1 + 3, d2)
                );

                dotProd += dot(xValues, wValues);
              }

              if (${g===1}) {
                dotProd +=
                  getX(batch, xF, xR, xC, ${d}) *
                  getW(wF, wR, wC, ${d}, d2);
              } else if (${g===2}) {
                vec2 xValues = vec2(
                  getX(batch, xF, xR, xC, ${d}),
                  getX(batch, xF, xR, xC, ${d} + 1)
                );
                vec2 wValues = vec2(
                  getW(wF, wR, wC, ${d}, d2),
                  getW(wF, wR, wC, ${d} + 1, d2)
                );
                dotProd += dot(xValues, wValues);
              } else if (${g===3}) {
                vec3 xValues = vec3(
                  getX(batch, xF, xR, xC, ${d}),
                  getX(batch, xF, xR, xC, ${d} + 1),
                  getX(batch, xF, xR, xC, ${d} + 2)
                );
                vec3 wValues = vec3(
                  getW(wF, wR, wC, ${d}, d2),
                  getW(wF, wR, wC, ${d} + 1, d2),
                  getW(wF, wR, wC, ${d} + 2, d2)
                );
                dotProd += dot(xValues, wValues);
              }
            }
          }
        }
        setOutput(dotProd);
      }
    `}};var Ml=class{constructor(e,t=!1,o=null,n=!1,s=!1){this.variableNames=["x","W"],this.packedInputs=!0,this.packedOutput=!0,this.customUniforms=[{name:"pads",type:"ivec2"},{name:"strides",type:"ivec2"},{name:"dilations",type:"ivec2"},{name:"inDims",type:"ivec2"}],this.outputShape=e.outShape,this.enableShapeUniforms=de(this.outputShape.length);let i=e.padInfo.left,a=e.strideWidth,l=e.dilationWidth,u=e.filterHeight,c=e.filterWidth,p=c,m=`
       int xR; int xC; int xCOffset;
       vec4 wTexel; vec4 previous; vec4 final;`;for(let h=0;h<c;h++)m+=`
           vec4 xTexelC${h*2};
           int xTexelC${h*2}Ready;
           vec4 xTexelC${h*2+1};
           int xTexelC${h*2+1}Ready;
           vec4 xC${h};`;m+=`
     for (int r = 0; r < ${u}; r++) {
      for (int d1 = 0; d1 < ${e.inChannels}; d1 += 2) {
       `;for(let h=0;h<c;h++)m+=`
           xTexelC${h*2} = vec4(0.0);
           xTexelC${h*2}Ready = 0;
           xTexelC${h*2+1} = vec4(0.0);
           xTexelC${h*2+1}Ready = 0;
           xC${h} = vec4(0.0);`;m+=`
         xR = xRCorner + r * dilations[0];
         if (xR >=0 && xR < inDims[0]) {
       `;for(let h=0;h<(p+1)/2;h++){let b=h*2;if(m+=`
           xC = xCCorner + ${b*l};
           `,a===1){if(b<c&&(i%2==1?(m+=`
                 xCOffset = xC + 1;
                 if (xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${b}Ready == 0) {
                   xTexelC${b} = getX(batch, xR, xCOffset, d1);

                   // Need to manually clear unused channels in case
                   // we're reading from recycled texture.
                   if (xCOffset + 1 >= inDims[1]) {
                     xTexelC${b}.zw = vec2(0.0);
                   }
                   xTexelC${b}Ready = 1;
                 }
               `,l===1&&b>0?m+=`
                 xC${b} = vec4(xTexelC${b-2}.zw, xTexelC${b}.xy);
                 `:m+=`
                   xCOffset = xC + 1 - 2;

                   if (xCOffset >= 0 && xCOffset < inDims[1]) {
                     previous = getX(batch, xR, xCOffset, d1);

                     // Need to manually clear unused channels in case
                     // we're reading from recycled texture.
                     if (xCOffset + 1 >= inDims[1]) {
                       previous.zw = vec2(0.0);
                     }

                     xC${b} = vec4(previous.zw, xTexelC${b}.xy);
                   } else {
                     xC${b} = vec4(0.0, 0.0, xTexelC${b}.xy);
                   }
                   `):m+=`
                 if (xC >= 0 && xC < inDims[1] && xTexelC${b}Ready == 0) {
                   xTexelC${b} = getX(batch, xR, xC, d1);
                   if (xC + 1 >= inDims[1]) {
                     xTexelC${b}.zw = vec2(0.0);
                   }
                   xTexelC${b}Ready = 1;
                 }

                 xC${b} = xTexelC${b};
                 `,b+1<c)){let T=i%2==0?C.nearestLargerEven(l):l;l%2==0&&i%2==1||l%2!=0&&i%2!=1?(m+=`
                   xCOffset = xC + imod(pads[1], 2) + ${T};

                   if (xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${b+1}Ready == 0) {
                     xTexelC${b+1} = getX(batch, xR, xCOffset, d1);

                     // Need to manually clear unused channels in case
                     // we're reading from recycled texture.
                     if (xCOffset + 1 >= inDims[1]) {
                       xTexelC${b+1}.zw = vec2(0.0);
                     }
                     xTexelC${b+1}Ready = 1;
                   }
                   `,l>1?m+=`
                     xCOffset -= 2;
                     if (xCOffset >= 0 && xCOffset < inDims[1]) {
                      previous = getX(batch, xR, xCOffset, d1);
                      xC${b+1} = vec4(previous.zw, xTexelC${b+1}.xy);
                     } else {
                      xC${b+1} = vec4(0.0, 0.0, xTexelC${b+1}.xy);
                     }
                     `:m+=`
                     xC${b+1} = vec4(xTexelC${b}.zw, xTexelC${b+1}.xy);
                     `):T===1?m+=`
                     xC${b+1} = xTexelC${b};
                     `:m+=`
                     xCOffset = xC + ${T};

                     if (xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${b+1}Ready == 0) {
                       xTexelC${b+1} = getX(batch, xR, xCOffset, d1);
                       if (xCOffset + 1 >= inDims[1]) {
                         xTexelC${b+1}.zw = vec2(0.0);
                       }
                       xTexelC${b+1}Ready = 1;
                     }

                     xC${b+1} = xTexelC${b+1};
                     `}}else b<c&&(i%2==1?(m+=`
                 xCOffset = xC + 1 - strides[1];
                 if(xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${b}Ready == 0) {
                   xTexelC${b} = getX(batch, xR, xCOffset, d1);
                   // Need to manually clear unused channels in case
                   // we're reading from recycled texture.
                   if (xCOffset + 1 >= inDims[1]) {
                     xTexelC${b}.zw = vec2(0.0);
                   }
                   xTexelC${b}Ready = 1;
                 }

                 if(xC + 1 >= 0 && xC + 1 < inDims[1] && xTexelC${b+1}Ready == 0) {
                   xTexelC${b+1} = getX(batch, xR, xC + 1, d1);
                   // Need to manually clear unused channels in case
                   // we're reading from recycled texture.
                   if (xC + 2 >= inDims[1]) {
                     xTexelC${b+1}.zw = vec2(0.0);
                   }
                   xTexelC${b+1}Ready = 1;
                 }

                 xC${b} = vec4(xTexelC${b}.zw, xTexelC${b+1}.zw);
               `,b+1<c&&(m+=`
                   final = vec4(0.0);
                   xCOffset = xC + 1 + strides[1];
                   if(xCOffset >= 0 && xCOffset < inDims[1]) {
                     final = getX(batch, xR, xCOffset, d1);
                   }
                   xC${b+1} = vec4(xTexelC${b+1}.xy, final.xy);
                 `)):(m+=`
                 if(xC >= 0 && xC < inDims[1] && xTexelC${b}Ready == 0) {
                   xTexelC${b} = getX(batch, xR, xC, d1);
                   if (xC + 1 >= inDims[1]) {
                     xTexelC${b}.zw = vec2(0.0);
                   }
                   xTexelC${b}Ready = 1;
                 }

                 xCOffset = xC + strides[1];
                 if(xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${b+1}Ready == 0) {
                   xTexelC${b+1} = getX(batch, xR, xCOffset, d1);
                   if (xCOffset + 1 >= inDims[1]) {
                     xTexelC${b+1}.zw = vec2(0.);
                   }
                   xTexelC${b+1}Ready = 1;
                 }

                 xC${b} = vec4(
                   xTexelC${b}.xy, xTexelC${b+1}.xy);
               `,b+1<c&&(m+=`
                   xC${b+1} = vec4(xTexelC${b}.zw, xTexelC${b+1}.zw);
                 `)));b<c&&(m+=`
             wTexel = getW(r, ${b}, d1, d2);
             dotProd += xC${b}.xxzz * vec4(wTexel.xy, wTexel.xy);
             if(d1 + 1 < ${e.inChannels}) {
               dotProd += xC${b}.yyww * vec4(wTexel.zw, wTexel.zw);
             }
           `,b+1<c&&(m+=`
               wTexel = getW(r, ${b+1}, d1, d2);
               dotProd += xC${b+1}.xxzz * vec4(wTexel.xy, wTexel.xy);
               if(d1 + 1 < ${e.inChannels}) {
                 dotProd += xC${b+1}.yyww * vec4(wTexel.zw, wTexel.zw);
               }
             `))}m+=`
     }
   `,m+=`
     }
   `,m+=`
     }
   `;let f="",d="";o&&(n?f=`vec4 activation(vec4 a) {
           vec4 b = getPreluActivationWeightsAtOutCoords();
           ${o}
         }`:s?f=`vec4 activation(vec4 a) {
           vec4 b = getLeakyreluAlphaAtOutCoords();
           ${o}
         }`:f=`vec4 activation(vec4 x) {
           ${o}
         }`,d="result = activation(result);");let g=t?"result += getBiasAtOutCoords();":"";t&&this.variableNames.push("bias"),n&&this.variableNames.push("preluActivationWeights"),s&&this.variableNames.push("leakyreluAlpha"),this.userCode=`
       ${f}

       void main() {
         ivec4 coords = getOutputCoords();
         int batch = coords.x;
         ivec2 xRCCorner = coords.yz * strides - pads;
         int d2 = coords.w;
         int xRCorner = xRCCorner.x;
         int xCCorner = xRCCorner.y;

         //intialize dotProd with a small epsilon seems to reduce GPU accuracy loss.
         vec4 dotProd = vec4(0.000000000000001);

         ${m}

         vec4 result = dotProd - vec4(0.000000000000001);
         ${g}
         ${d}
         setOutput(result);
       }
     `}};var Hh=class{constructor(e,t){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.customUniforms=[{name:"inputShape",type:"ivec4"},{name:"pad",type:"ivec2"},{name:"stride",type:"ivec2"},{name:"dilation",type:"ivec2"},{name:"inChannels",type:"int"},{name:"itemsPerBlockRow",type:"int"},{name:"outWidth",type:"int"}],this.outputShape=e,this.enableShapeUniforms=de(this.outputShape.length);let{dataFormat:o}=t,n=_e(),s=o==="channelsLast",i=s?1:2,a=s?2:3,l=this.enableShapeUniforms?"if(blockIndex < outShape[2] && pos < outShape[1]) {":`if(blockIndex < ${e[2]} && pos < ${e[1]}) {`,u="";for(let c=0;c<=1;c++)for(let p=0;p<=1;p++)u+=`
          blockIndex = rc.z + ${p};
          pos = rc.y + ${c};

          ${l}
            offsetY = int(blockIndex / outWidth) * stride[0] - pad[0];
            d0 = offsetY + dilation[0] * (pos / itemsPerBlockRow);

            if(d0 < inputShape[${i}] && d0 >= 0) {
              // Use custom imod instead mod. On Intel GPU, mod may generate
              // unexpected value.
              // https://github.com/tensorflow/tfjs/issues/5447
              offsetX = imod(blockIndex, outWidth) * stride[1] - pad[1];
              d1 = offsetX + dilation[1] * (imod(pos, itemsPerBlockRow) /
                  inChannels);

              if(d1 < inputShape[${a}] && d1 >= 0) {

                ch = imod(pos, inChannels);

                if (${s}) {
                  innerDims = vec2(d1, ch);
                  result[${c*2+p}] = getChannel(
                    getA(rc.x, d0, int(innerDims.x),
                    int(innerDims.y)), innerDims);
                } else {
                  innerDims = vec2(d0, d1);
                  result[${c*2+p}] = getChannel(
                    getA(rc.x, ch, int(innerDims.x),
                    int(innerDims.y)), innerDims);
                }
              }
            }
          }
        `;this.userCode=`
      void main() {
        ivec3 rc = getOutputCoords();

        vec4 result = vec4(0);

        int blockIndex, pos, offsetY, d0, offsetX, d1, ch;
        vec2 innerDims;

        ${u}

        ${n.output} = result;
      }
    `}};function ic(r,e){let t=r.length;return t>=3?e?[...r.slice(0,-3),r[t-3]*r[t-2],r[t-1]]:[...r.slice(0,-3),r[t-3],r[t-2]*r[t-1]]:!e&&t===1&&r[0]>1?[r[0],1]:null}function ac({x:r,filter:e,convInfo:t,backend:o,bias:n=null,preluActivationWeights:s=null,leakyreluAlpha:i=0,activation:a=null}){let l=r.shape,u=o.texData.get(r.dataId),c=t.inChannels,p=l[0]*l[1]*l[2],m=t.outChannels,f=t.dataFormat==="channelsLast",d=!1,g=!1,h,b=[];if(s!=null){let S=ic(s.shape,f);S!=null&&(s=O({inputs:{x:s},backend:o,attrs:{shape:S}}),b.push(s))}if(n!=null){let S=ic(n.shape,f);S!=null&&(n=O({inputs:{x:n},backend:o,attrs:{shape:S}}),b.push(n))}if(!((p===1||m===1)&&c>kh)&&u.isPacked&&f&&u.texture!=null&&l[2]%2!=0&&C.arraysEqual(u.shape.slice(-3),l.slice(-3))){let S=l[0]*l[1]*(l[2]+1),I={dataId:r.dataId,shape:[1,S,t.inChannels],dtype:r.dtype},A=u.shape;u.shape=u.shape.slice(),u.shape[u.shape.length-2]++,C.assert(ro(u.shape,I.shape),()=>`packed reshape ${u.shape} to ${I.shape} isn't free`);let R=O({inputs:{x:e},backend:o,attrs:{shape:[1,t.inChannels,t.outChannels]}});b.push(R);let D=dn({a:I,b:R,backend:o,transposeA:d,transposeB:g,bias:n,activation:a,preluActivationWeights:s,leakyreluAlpha:i}),P=o.texData.get(D.dataId);C.assert(P.isPacked,()=>"batchMatMul result is expected to be packed"),u.shape=A,P.shape=t.outShape,h=Ne({inputs:{x:D},backend:o}),h.shape=t.outShape,b.push(D)}else{let S=t.outHeight*t.outWidth,I=O({inputs:{x:r},backend:o,attrs:{shape:f?[t.batchSize,S,t.inChannels]:[t.batchSize,t.inChannels,S]}}),A=O({inputs:{x:e},backend:o,attrs:{shape:[1,t.inChannels,t.outChannels]}}),R=dn({a:f?I:A,b:f?A:I,transposeA:!f,transposeB:g,backend:o,bias:n,activation:a,preluActivationWeights:s,leakyreluAlpha:i});h=O({inputs:{x:R},backend:o,attrs:{shape:t.outShape}}),b.push(I),b.push(A),b.push(R)}for(let S of b)o.disposeIntermediateTensorInfo(S);return h}function lc({x:r,filter:e,convInfo:t,backend:o,bias:n=null,preluActivationWeights:s=null,leakyreluAlpha:i=0,activation:a=null}){let{filterWidth:l,filterHeight:u,inChannels:c,outWidth:p,outHeight:m,dataFormat:f}=t,d=f==="channelsLast",g=l*u*c,h=m*p,b=[t.batchSize,g,h],T=!0,k=!1,S=[];if(s!=null){let fe=ic(s.shape,d);fe!=null&&(s=O({inputs:{x:s},backend:o,attrs:{shape:fe}}),S.push(s))}if(n!=null){let fe=ic(n.shape,d);fe!=null&&(n=O({inputs:{x:n},backend:o,attrs:{shape:fe}}),S.push(n))}let I=O({inputs:{x:e},backend:o,attrs:{shape:[1,g,C.sizeFromShape(e.shape)/g]}});S.push(I);let A=new Hh(b,t),R=[r.shape,[t.padInfo.top,t.padInfo.left],[t.strideHeight,t.strideWidth],[t.dilationHeight,t.dilationWidth],[t.inChannels],[t.filterWidth*t.inChannels],[t.outWidth]],D=o.runWebGLProgram(A,[r],"float32",R),P=O({inputs:{x:D},backend:o,attrs:{shape:b}});S.push(D),S.push(P);let L=n!=null,z=s!=null,B=a==="leakyrelu",K=a?Lr(a,!0):null,W=new Pl(d?P.shape:I.shape,d?I.shape:P.shape,d?[t.batchSize,h,t.outChannels]:[t.batchSize,t.outChannels,h],T,k,L,K,z,B),X=d?[P,I]:[I,P];if(n&&X.push(n),z&&X.push(s),B){let fe=o.makeTensorInfo([],"float32",C.createScalarValue(i,"float32"));X.push(fe),S.push(fe)}let se=o.runWebGLProgram(W,X,"float32"),me=O({inputs:{x:se},backend:o,attrs:{shape:t.outShape}});S.push(se);for(let fe of S)o.disposeIntermediateTensorInfo(fe);return me}function IF(r){let{inputs:e,backend:t,attrs:o}=r,{x:n,filter:s}=e,{strides:i,pad:a,dataFormat:l,dilations:u,dimRoundingMode:c}=o,p=N.convertConv2DDataFormat(l),m=N.computeConv2DInfo(n.shape,s.shape,i,u,a,c,!1,p),f;if(m.filterHeight===1&&m.filterWidth===1&&m.dilationHeight===1&&m.dilationWidth===1&&m.strideHeight===1&&m.strideWidth===1&&(m.padInfo.type==="SAME"||m.padInfo.type==="VALID"))f=ac({x:n,filter:s,convInfo:m,backend:t});else if(m.strideWidth<=2&&p==="channelsLast"&&E().getBool("WEBGL_EXP_CONV")){let g=new Ml(m),h=[[m.padInfo.top,m.padInfo.left],[m.strideHeight,m.strideWidth],[m.dilationHeight,m.dilationWidth],[m.inHeight,m.inWidth]];f=t.runWebGLProgram(g,[n,s],"float32",h)}else if(E().getBool("WEBGL_CONV_IM2COL"))f=lc({x:n,filter:s,convInfo:m,backend:t});else{let g=new Bl(m);f=t.runWebGLProgram(g,[n,s],"float32")}let d=O({inputs:{x:f},backend:t,attrs:{shape:m.outShape}});return t.disposeIntermediateTensorInfo(f),d}var zv={kernelName:zs,backendName:"webgl",kernelFunc:IF};var qh=class{constructor(e){this.variableNames=["x","dy"],this.outputShape=e.filterShape;let t=e.strideHeight,o=e.strideWidth,n=e.padInfo.top,s=e.padInfo.left,i=e.dataFormat==="channelsLast";this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int wR = coords.x;
        int wC = coords.y;
        int d1 = coords.z;
        int d2 = coords.w;

        // Convolve x(?, ?, d1) with dy(:, :, d2) to get dw(wR, wC, d1, d2).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;

        for (int b = 0; b < ${e.batchSize}; b++) {
          for (int yR = 0; yR < ${e.outHeight}; yR++) {
            int xR = wR + yR * ${t} - ${n};

            if (xR < 0 || xR >= ${e.inHeight}) {
              continue;
            }

            for (int yC = 0; yC < ${e.outWidth}; yC++) {
              int xC = wC + yC * ${o} - ${s};

              if (xC < 0 || xC >= ${e.inWidth}) {
                continue;
              }

              if (${i}) {
                float dyValue = getDy(b, yR, yC, d2);
                float xValue = getX(b, xR, xC, d1);
                dotProd += (xValue * dyValue);
              } else {
                float dyValue = getDy(b, d2, yR, yC);
                float xValue = getX(b, d1, xR, xC);
                dotProd += (xValue * dyValue);
              }

            }
          }
        }
        setOutput(dotProd);
      }
    `}},Kh=class{constructor(e){this.variableNames=["dy","W"],this.outputShape=e.inShape;let t=e.filterHeight,o=e.filterWidth,n=e.strideHeight,s=e.strideWidth,i=e.dataFormat==="channelsLast",a=t-1-e.padInfo.top,l=o-1-e.padInfo.left,u=i?1:2,c=i?2:3,p=i?3:1;this.userCode=`
      const ivec2 pads = ivec2(${a}, ${l});

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords[0];
        int d1 = coords[${p}];

        ivec2 dyCorner = ivec2(coords[${u}], coords[${c}]) - pads;
        int dyRCorner = dyCorner.x;
        int dyCCorner = dyCorner.y;

        // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;
        for (int wR = 0; wR < ${t}; wR++) {
          float dyR = float(dyRCorner + wR) / ${n}.0;

          if (dyR < 0.0 || dyR >= ${e.outHeight}.0 || fract(dyR) > 0.0) {
            continue;
          }
          int idyR = int(dyR);

          int wRPerm = ${t} - 1 - wR;

          for (int wC = 0; wC < ${o}; wC++) {
            float dyC = float(dyCCorner + wC) / ${s}.0;

            if (dyC < 0.0 || dyC >= ${e.outWidth}.0 ||
                fract(dyC) > 0.0) {
              continue;
            }
            int idyC = int(dyC);

            int wCPerm = ${o} - 1 - wC;

            for (int d2 = 0; d2 < ${e.outChannels}; d2++) {

              if (${i}) {
                float xValue = getDy(batch, idyR, idyC, d2);
                float wValue = getW(wRPerm, wCPerm, d1, d2);
                dotProd += xValue * wValue;
              } else {
                float xValue = getDy(batch, d2, idyR, idyC);
                float wValue = getW(wRPerm, wCPerm, d1, d2);
                dotProd += xValue * wValue;
              }

            }
          }
        }
        setOutput(dotProd);
      }
    `}},Xh=class{constructor(e){this.variableNames=["x","dy"],this.outputShape=e.filterShape;let t=e.strideDepth,o=e.strideHeight,n=e.strideWidth,s=e.padInfo.front,i=e.padInfo.top,a=e.padInfo.left;this.userCode=`
      void main() {
        ivec5 coords = getOutputCoords();
        int wF = coords.x;
        int wR = coords.y;
        int wC = coords.z;
        int d1 = coords.w;
        int d2 = coords.u;

        float dotProd = 0.0;

        for (int b = 0; b < ${e.batchSize}; b++) {
          for (int yF = 0; yF < ${e.outDepth}; yF++) {
            int xF = wF + yF * ${t} - ${s};

            if (xF < 0 || xF >= ${e.inDepth}) {
              continue;
            }

            for (int yR = 0; yR < ${e.outHeight}; yR++) {
              int xR = wR + yR * ${o} - ${i};

              if (xR < 0 || xR >= ${e.inHeight}) {
                continue;
              }

              for (int yC = 0; yC < ${e.outWidth}; yC++) {
                int xC = wC + yC * ${n} - ${a};

                if (xC < 0 || xC >= ${e.inWidth}) {
                  continue;
                }

                float dyValue = getDy(b, yF, yR, yC, d2);
                float xValue = getX(b, xF, xR, xC, d1);
                dotProd += (xValue * dyValue);
              }
            }
          }
        }
        setOutput(dotProd);
      }
    `}},Yh=class{constructor(e){this.variableNames=["dy","W"],this.outputShape=e.inShape;let t=e.filterDepth,o=e.filterHeight,n=e.filterWidth,s=e.strideDepth,i=e.strideHeight,a=e.strideWidth,l=t-1-e.padInfo.front,u=o-1-e.padInfo.top,c=n-1-e.padInfo.left;this.userCode=`
      const ivec3 pads = ivec3(${l}, ${u}, ${c});

      void main() {
        ivec5 coords = getOutputCoords();
        int batch = coords.x;
        int d1 = coords.u;


        ivec3 dyCorner = ivec3(coords.y, coords.z, coords.w) - pads;
        int dyFCorner = dyCorner.x;
        int dyRCorner = dyCorner.y;
        int dyCCorner = dyCorner.z;

        float dotProd = 0.0;
        for (int wF = 0; wF < ${t}; wF++) {
          float dyF = float(dyFCorner + wF) / ${s}.0;

          if (dyF < 0.0 || dyF >= ${e.outDepth}.0 || fract(dyF) > 0.0) {
            continue;
          }
          int idyF = int(dyF);

          int wFPerm = ${t} - 1 - wF;

          for (int wR = 0; wR < ${o}; wR++) {
            float dyR = float(dyRCorner + wR) / ${i}.0;

            if (dyR < 0.0 || dyR >= ${e.outHeight}.0 ||
              fract(dyR) > 0.0) {
              continue;
            }
            int idyR = int(dyR);

            int wRPerm = ${o} - 1 - wR;

            for (int wC = 0; wC < ${n}; wC++) {
              float dyC = float(dyCCorner + wC) / ${a}.0;

              if (dyC < 0.0 || dyC >= ${e.outWidth}.0 ||
                  fract(dyC) > 0.0) {
                continue;
              }
              int idyC = int(dyC);

              int wCPerm = ${n} - 1 - wC;

              for (int d2 = 0; d2 < ${e.outChannels}; d2++) {
                float xValue = getDy(batch, idyF, idyR, idyC, d2);
                float wValue = getW(wFPerm, wRPerm, wCPerm, d1, d2);
                dotProd += xValue * wValue;
              }
            }
          }
        }
        setOutput(dotProd);
      }
    `}};function $F(r){let{inputs:e,backend:t,attrs:o}=r,{x:n,dy:s}=e,{strides:i,pad:a,dataFormat:l,dimRoundingMode:u,filterShape:c}=o,p=N.convertConv2DDataFormat(l),m=N.computeConv2DInfo(n.shape,c,i,1,a,u,!1,p),f=new qh(m);return t.runWebGLProgram(f,[n,s],"float32")}var Uv={kernelName:Us,backendName:"webgl",kernelFunc:$F};function AF(r){let{inputs:e,backend:t,attrs:o}=r,{dy:n,filter:s}=e,{inputShape:i,strides:a,pad:l,dataFormat:u,dimRoundingMode:c}=o,p=N.convertConv2DDataFormat(u),m=N.computeConv2DInfo(i,s.shape,a,1,l,c,!1,p),f=new Kh(m);return t.runWebGLProgram(f,[n,s],"float32")}var Wv={kernelName:Ws,backendName:"webgl",kernelFunc:AF};function RF(r){let{inputs:e,backend:t,attrs:o}=r,{x:n,filter:s}=e,{strides:i,pad:a,dilations:l}=o,u=N.computeConv3DInfo(n.shape,s.shape,i,l,a),c=new jh(u);return t.runWebGLProgram(c,[n,s],"float32")}var jv={kernelName:js,backendName:"webgl",kernelFunc:RF};function DF(r){let{inputs:e,backend:t,attrs:o}=r,{x:n,dy:s}=e,{strides:i,pad:a,filterShape:l}=o,u=N.computeConv3DInfo(n.shape,l,i,1,a),c=new Xh(u);return t.runWebGLProgram(c,[n,s],"float32")}var Hv={kernelName:qc,backendName:"webgl",kernelFunc:DF};function FF(r){let{inputs:e,backend:t,attrs:o}=r,{dy:n,filter:s}=e,{pad:i,strides:a,inputShape:l}=o,u=N.computeConv3DInfo(l,s.shape,a,1,i),c=new Yh(u);return t.runWebGLProgram(c,[n,s],"float32")}var qv={kernelName:Hs,backendName:"webgl",kernelFunc:FF};var OF=Bt+`
  return cos(x);
`,PF=U({opSnippet:OF}),Kv={kernelName:qs,backendName:"webgl",kernelFunc:PF};var LF=`
  float e2x = exp(-x);
  return (e2x + 1.0 / e2x) / 2.0;
`,BF=U({opSnippet:LF}),Xv={kernelName:Ks,backendName:"webgl",kernelFunc:BF};var Qh=class{constructor(e,t,o,n,s){this.variableNames=["Image","Boxes","BoxInd"],this.outputShape=[];let[i,a,l,u]=e,[c]=t,[p,m]=o;this.outputShape=[c,p,m,u];let f=n==="bilinear"?1:0,[d,g]=[`${a-1}.0`,`${l-1}.0`],[h,b,T]=p>1?[`${(a-1)/(p-1)}`,"(y2-y1) * height_ratio",`y1*${d} + float(y)*(height_scale)`]:["0.0","0.0",`0.5 * (y1+y2) * ${d}`],[k,S,I]=m>1?[`${(l-1)/(m-1)}`,"(x2-x1) * width_ratio",`x1*${g} + float(x)*(width_scale)`]:["0.0","0.0",`0.5 * (x1+x2) * ${g}`];this.userCode=`
      const float height_ratio = float(${h});
      const float width_ratio = float(${k});
      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int y = coords[1];
        int x = coords[2];
        int d = coords[3];

        // get box vals
        float y1 = getBoxes(b,0);
        float x1 = getBoxes(b,1);
        float y2 = getBoxes(b,2);
        float x2 = getBoxes(b,3);

        // get image in batch index
        int bInd = round(getBoxInd(b));
        if(bInd < 0 || bInd >= ${i}) {
          return;
        }

        float height_scale = ${b};
        float width_scale = ${S};

        float in_y = ${T};
        if( in_y < 0.0 || in_y > ${d} ) {
          setOutput(float(${s}));
          return;
        }
        float in_x = ${I};
        if( in_x < 0.0 || in_x > ${g} ) {
          setOutput(float(${s}));
          return;
        }

        vec2 sourceFracIndexCR = vec2(in_x,in_y);
        if(${f} == 1) {
          // Compute the four integer indices.
          ivec2 sourceFloorCR = ivec2(sourceFracIndexCR);
          ivec2 sourceCeilCR = ivec2(ceil(sourceFracIndexCR));

          float topLeft = getImage(b, sourceFloorCR.y, sourceFloorCR.x, d);
          float bottomLeft = getImage(b, sourceCeilCR.y, sourceFloorCR.x, d);
          float topRight = getImage(b, sourceFloorCR.y, sourceCeilCR.x, d);
          float bottomRight = getImage(b, sourceCeilCR.y, sourceCeilCR.x, d);

          vec2 fracCR = sourceFracIndexCR - vec2(sourceFloorCR);

          float top = topLeft + (topRight - topLeft) * fracCR.x;
          float bottom = bottomLeft + (bottomRight - bottomLeft) * fracCR.x;
          float newValue = top + (bottom - top) * fracCR.y;
          setOutput(newValue);
        } else {
          // Compute the coordinators of nearest neighbor point.
          ivec2 sourceNearestCR = ivec2(floor(
            sourceFracIndexCR + vec2(0.5,0.5)));
          float newValue = getImage(b, sourceNearestCR.y, sourceNearestCR.x, d);
          setOutput(newValue);
        }
      }
    `}};var MF=r=>{let{inputs:e,backend:t,attrs:o}=r,{image:n,boxes:s,boxInd:i}=e,{cropSize:a,method:l,extrapolationValue:u}=o,c=new Qh(n.shape,s.shape,a,l,u);return t.runWebGLProgram(c,[n,s,i],"float32")},Yv={kernelName:Qs,backendName:"webgl",kernelFunc:MF};var xn;(function(r){r.Prod="*",r.Sum="+"})(xn||(xn={}));var uc=class{constructor(e,t,o,n){this.op=e,this.outputShape=t,this.variableNames=["x"],this.customUniforms=[{name:"index",type:"float"}];let s=this.outputShape.length,i=this.op===xn.Prod?"1.0":"0.0",a=o?i:`getX(${Qv(s,"coords",this.op)})`,l=this.outputShape[this.outputShape.length-1],u="",c="";o?(u=n?`end != ${l-1}`:"end != 0",c=n?"end + 1":"end - 1"):(u=n?`end + pow2 < ${l}`:"end >= pow2",c=n?"end + pow2":"end - pow2"),this.userCode=`
      void main() {
        ${Q(s)} coords = getOutputCoords();
        int end = ${Zv(s,"coords",this.op)};
        float val = ${a};
        int pow2 = int(pow(2.0, index));
        if (${u}) {
          int idx = ${c};
          ${Zv(s,"coords",this.op)} = idx;
          val ${this.op}= getX(${Qv(s,"coords",this.op)});
        }
        setOutput(val);
      }
    `}};function Qv(r,e,t){if(r===1)return`${e}`;if(r===2)return`${e}.x, ${e}.y`;if(r===3)return`${e}.x, ${e}.y, ${e}.z`;if(r===4)return`${e}.x, ${e}.y, ${e}.z, ${e}.w`;throw new Error(`Cumulative ${t} for rank ${r} is not yet supported`)}function Zv(r,e,t){if(r===1)return`${e}`;if(r===2)return`${e}.y`;if(r===3)return`${e}.z`;if(r===4)return`${e}.w`;throw new Error(`Cumulative ${t} for rank ${r} is not yet supported`)}function cc(r,e,t,o,n,s){let i=e.shape.length,a=N.getAxesPermutation([o],i),l=e;a!=null&&(l=ye({inputs:{x:e},backend:t,attrs:{perm:a}}));let u=N.getInnerMostAxes(1,i)[0];if(u!==i-1)throw new Error(`WebGL cumprod shader expects an inner-most axis=${e.shape.length-1} but got axis=${o}`);let c=l.shape[u],p=Ne({inputs:{x:l},backend:t});for(let m=0;m<=Math.ceil(Math.log2(c))-1;m++){let f=new uc(r,l.shape,!1,s),d=[[m]],g=p;p=t.runWebGLProgram(f,[p],p.dtype,d),t.disposeIntermediateTensorInfo(g)}if(n){let m=new uc(r,l.shape,n,s),f=p;p=t.runWebGLProgram(m,[p],p.dtype),t.disposeIntermediateTensorInfo(f)}if(a!=null){let m=N.getUndoAxesPermutation(a),f=ye({inputs:{x:p},backend:t,attrs:{perm:m}});return t.disposeIntermediateTensorInfo(p),t.disposeIntermediateTensorInfo(l),f}return p}function VF(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{axis:s,exclusive:i,reverse:a}=o;return cc(xn.Prod,n,t,s,i,a)}var Jv={kernelName:Xs,backendName:"webgl",kernelFunc:VF};function GF(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{axis:s,exclusive:i,reverse:a}=o;return cc(xn.Sum,n,t,s,i,a)}var eT={kernelName:Ys,backendName:"webgl",kernelFunc:GF};function zF(r){let{inputs:e,backend:t,attrs:o}=r,{x:n,weights:s}=e,{size:i,binaryOutput:a}=o;if(n.shape.length===1){let l=t.readSync(n.dataId),u=t.readSync(s.dataId),c=Qu(l,u,s.dtype,s.shape,i);return t.makeTensorInfo([i],s.dtype,c)}else if(n.shape.length===2){let l=t.bufferSync(n),u=t.bufferSync(s),c=Uw(l,u,i,a);return t.makeTensorInfo(c.shape,s.dtype,c.values)}throw new Error(`Error in denseBincount: input must be at most rank 2, but got rank${n.shape.length}.`)}var tT={kernelName:Zs,backendName:"webgl",kernelFunc:zF};var Zh=class{constructor(e,t,o){this.variableNames=["x"],this.outputShape=[],this.outputShape=e,this.blockSize=t,this.dataFormat=o,this.userCode=`
    void main() {
      ivec4 coords = getOutputCoords();
      int b = coords[0];
      int h = ${this.getHeightCoordString()};
      int w = ${this.getWidthCoordString()};
      int d = ${this.getDepthCoordString()};

      int in_h = h / ${t};
      int offset_h = imod(h, ${t});
      int in_w = w / ${t};
      int offset_w = imod(w, ${t});
      int offset_d = (offset_h * ${t} + offset_w) *
        ${this.getOutputDepthSize()};
      int in_d = d + offset_d;

      float result = ${this.getInputSamplingString()};
      setOutput(result);
    }
  `}getHeightCoordString(){return this.dataFormat==="NHWC"?"coords[1]":"coords[2]"}getWidthCoordString(){return this.dataFormat==="NHWC"?"coords[2]":"coords[3]"}getDepthCoordString(){return this.dataFormat==="NHWC"?"coords[3]":"coords[1]"}getOutputDepthSize(){return this.dataFormat==="NHWC"?this.outputShape[3]:this.outputShape[1]}getInputSamplingString(){return this.dataFormat==="NHWC"?"getX(b, in_h, in_w, in_d)":"getX(b, in_d, in_h, in_w)"}};function UF(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{blockSize:s,dataFormat:i}=o,a=n.shape[0],l=i==="NHWC"?n.shape[1]:n.shape[2],u=i==="NHWC"?n.shape[2]:n.shape[3],c=i==="NHWC"?n.shape[3]:n.shape[1],p=l*s,m=u*s,f=c/(s*s),d=i==="NHWC"?[a,p,m,f]:[a,f,p,m],g=new Zh(d,s,i);return t.runWebGLProgram(g,[n],n.dtype)}var rT={kernelName:Js,backendName:"webgl",kernelFunc:UF};var Vl=class{constructor(e,t=!1,o=null,n=!1,s=!1){this.variableNames=["x","W"],this.customUniforms=[{name:"pads",type:"ivec2"},{name:"strides",type:"ivec2"},{name:"dilations",type:"ivec2"},{name:"inDims",type:"ivec2"}],this.outputShape=e.outShape,this.enableShapeUniforms=de(this.outputShape.length);let i=e.filterHeight,a=e.filterWidth,l=e.outChannels/e.inChannels,u="",c="";o&&(n?u=`float activation(float a) {
          float b = getPreluActivationWeightsAtOutCoords();
          ${o}
        }`:s?u=`float activation(float a) {
          float b = getLeakyreluAlphaAtOutCoords();
          ${o}
        }`:u=`
          float activation(float x) {
            ${o}
          }
        `,c="result = activation(result);");let p=t?"result += getBiasAtOutCoords();":"";t&&this.variableNames.push("bias"),n&&this.variableNames.push("preluActivationWeights"),s&&this.variableNames.push("leakyreluAlpha"),this.userCode=`
      ${u}

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords.x;
        ivec2 xRCCorner = coords.yz * strides - pads;
        int d2 = coords.w;
        int d1 = d2 / ${l};
        int q = d2 - d1 * ${l};

        int xRCorner = xRCCorner.x;
        int xCCorner = xRCCorner.y;

        // Convolve x(?, ?, d1) with w(:, :, d1, q) to get y(yR, yC, d2).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;
        // TO DO(dsmilkov): Flatten the two for loops and vec4 the operations.
        for (int wR = 0; wR < ${i}; wR++) {
          int xR = xRCorner + wR * dilations[0];

          if (xR < 0 || xR >= inDims[0]) {
            continue;
          }

          for (int wC = 0; wC < ${a}; wC++) {
            int xC = xCCorner + wC * dilations[1];

            if (xC < 0 || xC >= inDims[1]) {
              continue;
            }

            float xVal = getX(batch, xR, xC, d1);
            float wVal = getW(wR, wC, d1, q);
            dotProd += xVal * wVal;
          }
        }

        float result = dotProd;
        ${p}
        ${c}
        setOutput(result);
      }
    `}};var Gl=class{constructor(e,t=!1,o=null,n=!1,s=!1){this.variableNames=["x","W"],this.packedInputs=!0,this.packedOutput=!0,this.customUniforms=[{name:"pads",type:"ivec2"},{name:"strides",type:"ivec2"},{name:"dilations",type:"ivec2"},{name:"inDims",type:"ivec2"}],this.outputShape=e.outShape,this.enableShapeUniforms=de(this.outputShape.length);let i=e.outChannels/e.inChannels,a=e.padInfo.left,l=e.strideWidth,u=e.dilationWidth,c=e.filterHeight,p=e.filterWidth,m=p,f=`
      int xR; int xC; int xCOffset;
      vec4 wTexel; vec4 previous; vec4 final;`;for(let b=0;b<p;b++)f+=`
          vec4 xTexelC${b*2};
          int xTexelC${b*2}Ready;
          vec4 xTexelC${b*2+1};
          int xTexelC${b*2+1}Ready;
          vec4 xC${b};`;f+=`
    for (int r = 0; r < ${c}; r++) {
      `;for(let b=0;b<p;b++)f+=`
          xTexelC${b*2} = vec4(0.0);
          xTexelC${b*2}Ready = 0;
          xTexelC${b*2+1} = vec4(0.0);
          xTexelC${b*2+1}Ready = 0;
          xC${b} = vec4(0.0);`;f+=`
        xR = xRCorner + r * dilations[0];
        if (xR >=0 && xR < inDims[0]) {
      `;for(let b=0;b<(m+1)/2;b++){let T=b*2;if(f+=`
          xC = xCCorner + ${T*u};
          `,l===1){if(T<p&&(a%2==1?(f+=`
                xCOffset = xC + 1;
                if (xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${T}Ready == 0) {
                  xTexelC${T} = getX(batch, xR, xCOffset, d1);

                  // Need to manually clear unused channels in case
                  // we're reading from recycled texture.
                  if (xCOffset + 1 >= inDims[1]) {
                    xTexelC${T}.zw = vec2(0.0);
                  }
                  xTexelC${T}Ready = 1;
                }
              `,u===1&&T>0?f+=`
                xC${T} = vec4(xTexelC${T-2}.zw, xTexelC${T}.xy);
                `:f+=`
                  xCOffset = xC + 1 - 2;

                  if (xCOffset >= 0 && xCOffset < inDims[1]) {
                    previous = getX(batch, xR, xCOffset, d1);

                    // Need to manually clear unused channels in case
                    // we're reading from recycled texture.
                    if (xCOffset + 1 >= inDims[1]) {
                      previous.zw = vec2(0.0);
                    }

                    xC${T} = vec4(previous.zw, xTexelC${T}.xy);
                  } else {
                    xC${T} = vec4(0.0, 0.0, xTexelC${T}.xy);
                  }
                  `):f+=`
                if (xC >= 0 && xC < inDims[1] && xTexelC${T}Ready == 0) {
                  xTexelC${T} = getX(batch, xR, xC, d1);
                  if (xC + 1 >= inDims[1]) {
                    xTexelC${T}.zw = vec2(0.0);
                  }
                  xTexelC${T}Ready = 1;
                }

                xC${T} = xTexelC${T};
                `,T+1<p)){let k=a%2==0?C.nearestLargerEven(u):u;u%2==0&&a%2==1||u%2!=0&&a%2!=1?(f+=`
                  xCOffset = xC + imod(pads[1], 2) + ${k};

                  if (xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${T+1}Ready == 0) {
                    xTexelC${T+1} = getX(batch, xR, xCOffset, d1);

                    // Need to manually clear unused channels in case
                    // we're reading from recycled texture.
                    if (xCOffset + 1 >= inDims[1]) {
                      xTexelC${T+1}.zw = vec2(0.0);
                    }
                    xTexelC${T+1}Ready = 1;
                  }
                  `,u>1?f+=`
                    xCOffset -= 2;
                    if (xCOffset >= 0 && xCOffset < inDims[1]) {
                     previous = getX(batch, xR, xCOffset, d1);
                     xC${T+1} = vec4(previous.zw, xTexelC${T+1}.xy);
                    } else {
                     xC${T+1} = vec4(0.0, 0.0, xTexelC${T+1}.xy);
                    }
                    `:f+=`
                    xC${T+1} = vec4(xTexelC${T}.zw, xTexelC${T+1}.xy);
                    `):k===1?f+=`
                    xC${T+1} = xTexelC${T};
                    `:f+=`
                    xCOffset = xC + ${k};

                    if (xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${T+1}Ready == 0) {
                      xTexelC${T+1} = getX(batch, xR, xCOffset, d1);
                      if (xCOffset + 1 >= inDims[1]) {
                        xTexelC${T+1}.zw = vec2(0.0);
                      }
                      xTexelC${T+1}Ready = 1;
                    }

                    xC${T+1} = xTexelC${T+1};
                    `}}else T<p&&(a%2==1?(f+=`
                xCOffset = xC + 1 - strides[1];
                if(xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${T}Ready == 0) {
                  xTexelC${T} = getX(batch, xR, xCOffset, d1);
                  // Need to manually clear unused channels in case
                  // we're reading from recycled texture.
                  if (xCOffset + 1 >= inDims[1]) {
                    xTexelC${T}.zw = vec2(0.0);
                  }
                  xTexelC${T}Ready = 1;
                }

                if(xC + 1 >= 0 && xC + 1 < inDims[1] && xTexelC${T+1}Ready == 0) {
                  xTexelC${T+1} = getX(batch, xR, xC + 1, d1);
                  // Need to manually clear unused channels in case
                  // we're reading from recycled texture.
                  if (xC + 2 >= inDims[1]) {
                    xTexelC${T+1}.zw = vec2(0.0);
                  }
                  xTexelC${T+1}Ready = 1;
                }

                xC${T} = vec4(xTexelC${T}.zw, xTexelC${T+1}.zw);
              `,T+1<p&&(f+=`
                  final = vec4(0.0);
                  xCOffset = xC + 1 + strides[1];
                  if(xCOffset >= 0 && xCOffset < inDims[1]) {
                    final = getX(batch, xR, xCOffset, d1);
                  }
                  xC${T+1} = vec4(xTexelC${T+1}.xy, final.xy);
                `)):(f+=`
                if(xC >= 0 && xC < inDims[1] && xTexelC${T}Ready == 0) {
                  xTexelC${T} = getX(batch, xR, xC, d1);
                  if (xC + 1 >= inDims[1]) {
                    xTexelC${T}.zw = vec2(0.0);
                  }
                  xTexelC${T}Ready = 1;
                }

                xCOffset = xC + strides[1];
                if(xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${T+1}Ready == 0) {
                  xTexelC${T+1} = getX(batch, xR, xCOffset, d1);
                  if (xCOffset + 1 >= inDims[1]) {
                    xTexelC${T+1}.zw = vec2(0.);
                  }
                  xTexelC${T+1}Ready = 1;
                }

                xC${T} = vec4(
                  xTexelC${T}.xy, xTexelC${T+1}.xy);
              `,T+1<p&&(f+=`
                  xC${T+1} = vec4(xTexelC${T}.zw, xTexelC${T+1}.zw);
                `)));T<p&&(f+=`
            wTexel = getW(r, ${T}, d1, q);
            dotProd += xC${T} * vec4(wTexel.xz, wTexel.xz);
          `,T+1<p&&(f+=`
              wTexel = getW(r, ${T+1}, d1, q);
              dotProd += xC${T+1} * vec4(wTexel.xz, wTexel.xz);
            `))}f+=`
    }
  `,f+=`
      }
    `;let d="",g="";o&&(n?d=`vec4 activation(vec4 a) {
          vec4 b = getPreluActivationWeightsAtOutCoords();
          ${o}
        }`:s?d=`vec4 activation(vec4 a) {
          vec4 b = getLeakyreluAlphaAtOutCoords();
          ${o}
        }`:d=`vec4 activation(vec4 x) {
          ${o}
        }`,g="result = activation(result);");let h=t?"result += getBiasAtOutCoords();":"";t&&this.variableNames.push("bias"),n&&this.variableNames.push("preluActivationWeights"),s&&this.variableNames.push("leakyreluAlpha"),this.userCode=`
      ${d}

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords.x;
        ivec2 xRCCorner = coords.yz * strides - pads;
        int d2 = coords.w;
        int d1 = d2 / ${i};
        int q = d2 - d1 * ${i};
        int xRCorner = xRCCorner.x;
        int xCCorner = xRCCorner.y;

        //intialize dotProd with a small epsilon seems to reduce GPU accuracy loss.
        vec4 dotProd = vec4(0.000000000000001);

        ${f}

        vec4 result = dotProd - vec4(0.000000000000001);
        ${h}
        ${g}
        setOutput(result);
      }
    `}};function WF(r){let{inputs:e,backend:t,attrs:o}=r,{x:n,filter:s}=e,{strides:i,pad:a,dilations:l,dimRoundingMode:u}=o,c=l;c==null&&(c=[1,1]),C.assert(N.eitherStridesOrDilationsAreOne(i,c),()=>`Error in depthwiseConv2d: Either strides or dilations must be 1. Got strides ${i} and dilations '${c}'`);let p=N.computeConv2DInfo(n.shape,s.shape,i,c,a,u,!0),m;E().getBool("WEBGL_PACK_DEPTHWISECONV")&&p.strideWidth<=2&&p.outChannels/p.inChannels==1?m=new Gl(p):m=new Vl(p);let f=[[p.padInfo.top,p.padInfo.left],[p.strideHeight,p.strideWidth],[p.dilationHeight,p.dilationWidth],[p.inHeight,p.inWidth]];return t.runWebGLProgram(m,[n,s],"float32",f)}var oT={kernelName:ei,backendName:"webgl",kernelFunc:WF};var Jh=class{constructor(e){this.variableNames=["x","dy"],this.outputShape=e.filterShape;let t=e.strideHeight,o=e.strideWidth,n=e.padInfo.top,s=e.padInfo.left,i=e.outChannels/e.inChannels;this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int wR = coords.x;
        int wC = coords.y;
        int d1 = coords.z;
        int dm = coords.w;
        int d2 = d1 * ${i} + dm;

        float dotProd = 0.0;

        // TO DO: Vec4 over the batch size
        for (int b = 0; b < ${e.batchSize}; b++) {
          for (int yR = 0; yR < ${e.outHeight}; yR++) {
            int xR = wR + yR * ${t} - ${n};

            if (xR < 0 || xR >= ${e.inHeight}) {
              continue;
            }

            for (int yC = 0; yC < ${e.outWidth}; yC++) {
              int xC = wC + yC * ${o} - ${s};

              if (xC < 0 || xC >= ${e.inWidth}) {
                continue;
              }

              float dyValue = getDy(b, yR, yC, d2);
              float xValue = getX(b, xR, xC, d1);
              dotProd += (xValue * dyValue);
            }
          }
        }
        setOutput(dotProd);
      }
    `}},eg=class{constructor(e){this.variableNames=["dy","W"],this.outputShape=e.inShape;let t=e.filterHeight,o=e.filterWidth,n=e.strideHeight,s=e.strideWidth,i=t-1-e.padInfo.top,a=o-1-e.padInfo.left,l=e.outChannels/e.inChannels;this.userCode=`
      const ivec2 pads = ivec2(${i}, ${a});

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords[0];
        int d1 = coords[3];
        ivec2 dyCorner = coords.yz - pads;
        int dyRCorner = dyCorner.x;
        int dyCCorner = dyCorner.y;

        float dotProd = 0.0;

        for (int wR = 0; wR < ${t}; wR++) {
          float dyR = float(dyRCorner + wR) / ${n}.0;

          if (dyR < 0.0 || dyR >= ${e.outHeight}.0 || fract(dyR) > 0.0) {
            continue;
          }
          int idyR = int(dyR);

          int wRPerm = ${t} - 1 - wR;

          for (int wC = 0; wC < ${o}; wC++) {
            float dyC = float(dyCCorner + wC) / ${s}.0;

            if (dyC < 0.0 || dyC >= ${e.outWidth}.0 ||
                fract(dyC) > 0.0) {
              continue;
            }
            int idyC = int(dyC);

            int wCPerm = ${o} - 1 - wC;

            // TO DO: Vec4 over the channelMul
            for (int dm = 0; dm < ${l}; dm++) {
              int d2 = d1 * ${l} + dm;
              float xValue = getDy(batch, idyR, idyC, d2);
              float wValue = getW(wRPerm, wCPerm, d1, dm);
              dotProd += xValue * wValue;
            }
          }
        }
        setOutput(dotProd);
      }
    `}};function jF(r){let{inputs:e,backend:t,attrs:o}=r,{x:n,dy:s}=e,{strides:i,dilations:a,pad:l,dimRoundingMode:u,filterShape:c}=o,p=N.computeConv2DInfo(n.shape,c,i,a,l,u,!0),m=new Jh(p);return t.runWebGLProgram(m,[n,s],"float32")}var nT={kernelName:ti,backendName:"webgl",kernelFunc:jF};function HF(r){let{inputs:e,backend:t,attrs:o}=r,{dy:n,filter:s}=e,{strides:i,dilations:a,pad:l,dimRoundingMode:u,inputShape:c}=o,p=N.computeConv2DInfo(c,s.shape,i,a,l,u,!0),m=new eg(p);return t.runWebGLProgram(m,[n,s],"float32")}var sT={kernelName:ri,backendName:"webgl",kernelFunc:HF};var tg=class{constructor(e){this.variableNames=["X"],this.outputShape=[e,e],this.userCode=`
      void main() {
          ivec2 coords = getOutputCoords();
          float val = coords[0] == coords[1] ? getX(coords[0]) : 0.0;
          setOutput(val);
      }
    `}};function qF(r){let{inputs:e,backend:t}=r,{x:o}=e,n=[...o.shape,...o.shape],s=C.sizeFromShape(o.shape),i=O({inputs:{x:o},backend:t,attrs:{shape:[s]}}),a=new tg(s),l=t.runWebGLProgram(a,[i],i.dtype),u=O({inputs:{x:l},backend:t,attrs:{shape:n}});return t.disposeIntermediateTensorInfo(i),t.disposeIntermediateTensorInfo(l),u}var iT={kernelName:oi,backendName:"webgl",kernelFunc:qF};var rg=class{constructor(e){this.variableNames=["x","W"],this.outputShape=e.outShape;let{inHeight:t,inWidth:o,padInfo:n,strideHeight:s,strideWidth:i,filterHeight:a,filterWidth:l,dilationHeight:u,dilationWidth:c}=e,{top:p,left:m}=n;this.userCode=`
      const ivec2 strides = ivec2(${s}, ${i});
      const ivec2 pads = ivec2(${p}, ${m});
      const float neg_infinity = -3.4e38;

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords.x;
        int d1 = coords.w;
        ivec2 outTopLeftCorner =
            coords.yz * strides - pads;
        int hBeg = outTopLeftCorner.x;
        int wBeg = outTopLeftCorner.y;

        float curVal = neg_infinity;
        for (int h = 0; h < ${a}; h++) {
          int hIn = hBeg + h * ${u};

          if (hIn >= 0 && hIn < ${t}) {
            for (int w = 0; w < ${l}; w++) {
              int wIn = wBeg + w * ${c};

              if (wIn >= 0 && wIn < ${o}) {
                float xVal = getX(batch, hIn, wIn, d1);
                float wVal = getW(h, w, d1);

                float val = xVal + wVal;
                if (val > curVal) {
                  curVal = val;
                }
              }
            }
          }
        }

        float result = curVal;
        setOutput(result);
      }
    `}};function KF(r){let{inputs:e,backend:t,attrs:o}=r,{x:n,filter:s}=e,{strides:i,pad:a,dilations:l}=o,u=N.computeDilation2DInfo(n.shape,s.shape,i,a,"NHWC",l),c,p=new rg(u);c=t.runWebGLProgram(p,[n,s],"float32");let m=O({inputs:{x:c},backend:t,attrs:{shape:u.outShape}});return t.disposeIntermediateTensorInfo(c),m}var aT={kernelName:ni,backendName:"webgl",kernelFunc:KF};function XF(r){let{inputs:e,backend:t,attrs:o}=r,{equation:n}=o,s=e,{allDims:i,summedDims:a,idDims:l}=N.decodeEinsumEquation(n,s.length);N.checkEinsumDimSizes(i.length,l,s);let{path:u,steps:c}=N.getEinsumComputePath(a,l),p=c.length,m=null,f=i.length,d=[];for(let g=0;g<p;++g){for(let h of c[g]){let{permutationIndices:b,expandDims:T}=N.getEinsumPermutation(f,l[h]),k;N.isIdentityPermutation(b)?k=s[h]:(k=ye({inputs:{x:s[h]},backend:t,attrs:{perm:b}}),d.push(k));let S=k.shape.slice();for(let I=0;I<T.length;++I)S.splice(T[I],0,1);C.arraysEqual(k.shape,S)||(k=O({inputs:{x:k},backend:t,attrs:{shape:S}}),d.push(k)),m===null?m=k:(m=Ll({inputs:{a:k,b:m},backend:t}),d.push(m))}g<p-1&&(u[g]>=0&&(m=fn({inputs:{x:m},backend:t,attrs:{axis:u[g]-(i.length-f),keepDims:!1}}),d.push(m)),f--)}for(let g of d)g!==m&&t.disposeIntermediateTensorInfo(g);return m}var lT={kernelName:ii,backendName:"webgl",kernelFunc:XF};var YF="return (x >= 0.0) ? x : (exp(x) - 1.0);",QF=`
  vec4 result;

  result.r = (x.r >= 0.0) ? x.r : (exp(x.r) - 1.0);
  result.g = (x.g >= 0.0) ? x.g : (exp(x.g) - 1.0);
  result.b = (x.b >= 0.0) ? x.b : (exp(x.b) - 1.0);
  result.a = (x.a >= 0.0) ? x.a : (exp(x.a) - 1.0);

  return result;
`,ZF=U({opSnippet:YF,packedOpSnippet:QF}),uT={kernelName:ai,backendName:"webgl",kernelFunc:ZF};var JF="return (b >= 1.0) ? a : a * (b + 1.0);",eO=`
  vec4 bGTEZero = vec4(greaterThanEqual(b, vec4(0.)));
  return (bGTEZero * a) + ((vec4(1.0) - bGTEZero) * (a * (b + vec4(1.0))));
`,tO=r=>{let{inputs:e,backend:t}=r,{dy:o,y:n}=e,s=E().getBool("WEBGL_PACK_BINARY_OPERATIONS")?new er(eO,o.shape,n.shape):new Lt(JF,o.shape,n.shape);return t.runWebGLProgram(s,[o,n],o.dtype)},cT={kernelName:Kc,backendName:"webgl",kernelFunc:tO};var rO=`
  return vec4(equal(a, b));
`,oO="return float(a == b);",nO=ce({opSnippet:oO,packedOpSnippet:rO,dtype:"bool",cpuKernelImpl:qw}),pT={kernelName:po,backendName:"webgl",kernelFunc:nO};var sO=`
  // Error function is calculated approximately with elementary function.
  // See "Handbook of Mathematical Functions with Formulas,
  // Graphs, and Mathematical Tables", Abramowitz and Stegun.
  float p = ${N.ERF_P};
  float a1 = ${N.ERF_A1};
  float a2 = ${N.ERF_A2};
  float a3 = ${N.ERF_A3};
  float a4 = ${N.ERF_A4};
  float a5 = ${N.ERF_A5};

  float sign = sign(x);
  x = abs(x);
  float t = 1.0 / (1.0 + p * x);
  return sign * (1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*exp(-x*x));
`,iO=U({opSnippet:sO}),mT={kernelName:li,backendName:"webgl",kernelFunc:iO};var aO=Bt+`
  return exp(x);
`,lO=`
  vec4 result = exp(x);
  bvec4 isNaN = isnan(x);
  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`,og=U({opSnippet:aO,packedOpSnippet:lO,cpuKernelImpl:Kw,dtype:"float32"}),fT={kernelName:mo,backendName:"webgl",kernelFunc:og};function pc(r){let{inputs:e,attrs:t,backend:o}=r,{dim:n}=t,{input:s}=e,i=s.shape.length,a=s.shape.slice(),l=n;return n<0&&(C.assert(-(i+1)<=n,()=>`Axis must be in the interval [${-(i+1)}, ${i}]`),l=i+n+1),a.splice(l,0,1),O({inputs:{x:s},backend:o,attrs:{shape:a}})}var dT={kernelName:ui,backendName:"webgl",kernelFunc:pc};var hT="return exp(x) - 1.0;",uO=U({opSnippet:hT,packedOpSnippet:hT,cpuKernelImpl:Xw}),gT={kernelName:fo,backendName:"webgl",kernelFunc:uO};var mc=class{constructor(e,t,o){this.variableNames=["real","imag"];let n=t[1];this.outputShape=t;let s=o?`2.0 * ${Math.PI}`:`-2.0 * ${Math.PI}`,i=o?`${n}.0`:"1.0",a;if(e==="real")a="return real * expR - imag * expI;";else if(e==="imag")a="return real * expI + imag * expR;";else throw new Error(`FFT component must be either "real" or "imag", got ${e}.`);this.userCode=`
      const float exponentMultiplier = ${s};

      float unaryOpComplex(float real, float expR, float imag, float expI) {
        ${a}
      }

      float mulMatDFT(int batch, int index) {
        float indexRatio = float(index) / float(${n});
        float exponentMultiplierTimesIndexRatio =
            exponentMultiplier * indexRatio;

        float result = 0.0;

        for (int i = 0; i < ${n}; i++) {
          // x = (-2|2 * PI / N) * index * i;
          float x = exponentMultiplierTimesIndexRatio * float(i);
          float expR = cos(x);
          float expI = sin(x);
          float real = getReal(batch, i);
          float imag = getImag(batch, i);

          result +=
              unaryOpComplex(real, expR, imag, expI) / ${i};
        }

        return result;
      }

      void main() {
        ivec2 coords = getOutputCoords();
        setOutput(mulMatDFT(coords[0], coords[1]));
      }
    `}};function fc(r,e,t){let o=t.texData.get(r.dataId),n=C.sizeFromShape(r.shape),s=r.shape[r.shape.length-1],i=n/s,a=O({inputs:{x:r},backend:t,attrs:{shape:[i,s]}}),l=a.shape,u=new mc("real",l,e),c=new mc("imag",l,e),p=[{dataId:o.complexTensorInfos.real.dataId,dtype:o.complexTensorInfos.real.dtype,shape:l},{dataId:o.complexTensorInfos.imag.dataId,dtype:o.complexTensorInfos.imag.dtype,shape:l}],m=t.runWebGLProgram(u,p,"float32"),f=t.runWebGLProgram(c,p,"float32"),d=ct({inputs:{real:m,imag:f},backend:t});t.disposeIntermediateTensorInfo(m),t.disposeIntermediateTensorInfo(f);let g=O({inputs:{x:d},backend:t,attrs:{shape:r.shape}});return t.disposeIntermediateTensorInfo(a),t.disposeIntermediateTensorInfo(d),g}function cO(r){let{inputs:e,backend:t}=r,{input:o}=e;return fc(o,!1,t)}var xT={kernelName:ci,backendName:"webgl",kernelFunc:cO};var ng=class{constructor(e,t){this.outputShape=[],this.customUniforms=[{name:"value",type:"float"}],this.variableNames=["x"],this.outputShape=e,this.userCode=`
      void main() {
        // Input can be obtained from uniform value.
        setOutput(value);
      }
    `}};function Mr(r){let{backend:e,attrs:t}=r,{shape:o,value:n}=t,{dtype:s}=t;if(s=s||C.inferDtype(n),s==="string"){let i=C.getArrayFromDType(s,C.sizeFromShape(o));return i.fill(n),e.makeTensorInfo(o,s,i)}else{let i=new ng(o,n),a=[[n]];return e.runWebGLProgram(i,[],s,a)}}var yT={kernelName:pi,backendName:"webgl",kernelFunc:Mr};var sg=class{constructor(e){this.variableNames=["Image"],this.outputShape=[];let t=e[2];this.outputShape=e,this.userCode=`
        void main() {
          ivec4 coords = getOutputCoords();
          int x = coords[2];

          int coordX = ${t} - x - 1;
          float outputValue;
          if(coordX >= 0 && coordX < ${t}) {
            outputValue = getImage(coords[0], coords[1], coordX, coords[3]);
          } else {
            outputValue = getImage(coords[0], coords[1], coords[2], coords[3]);
          }
          setOutput(outputValue);
        }
    `}};var bT={kernelName:mi,backendName:"webgl",kernelFunc:({inputs:r,backend:e})=>{let{image:t}=r,o=e,n=new sg(t.shape);return o.runWebGLProgram(n,[t],t.dtype)}};var _T="return floor(x);",pO=U({opSnippet:_T,packedOpSnippet:_T,cpuKernelImpl:Yw}),wT={kernelName:ho,backendName:"webgl",kernelFunc:pO};var mO=`
  float s = sign(a) * sign(b);
  int ia = round(a);
  int ib = round(b);
  if (ib != 0) {
    // Windows (D3D) wants guaranteed non-zero int division at compile-time.
    return float(idiv(ia, ib, s));
  } else {
    return NAN;
  }
`,fO=`
  ivec4 ia = round(a);
  ivec4 ib = round(b);
  bvec4 cond = notEqual(ib, ivec4(0));
  ivec4 result = ivec4(0);
  vec4 s = sign(a) * sign(b);

  // Windows (D3D) wants guaranteed non-zero int division at compile-time.
  if (cond[0]) {
    result[0] = idiv(ia[0], ib[0], s[0]);
  }
  if (cond[1]) {
    result[1] = idiv(ia[1], ib[1], s[1]);
  }
  if (cond[2]) {
    result[2] = idiv(ia[2], ib[2], s[2]);
  }
  if (cond[3]) {
    result[3] = idiv(ia[3], ib[3], s[3]);
  }
  return vec4(result);
`,dO=ce({opSnippet:mO,packedOpSnippet:fO,dtype:"int32"}),vT={kernelName:fi,backendName:"webgl",kernelFunc:dO};var ig=class{constructor(e){this.variableNames=["A"];let t=_e(),[o,n]=e;this.outputShape=e,this.userCode=`
      void main() {
        ivec3 coords = getOutputCoords();
        int texR = coords[0];
        int texC = coords[1];
        int depth = coords[2];
        vec2 uv = (vec2(texC, texR) + halfCR) / vec2(${n}.0, ${o}.0);

        vec4 values = ${t.texture2D}(A, uv);
        float value;
        if (depth == 0) {
          value = values.r;
        } else if (depth == 1) {
          value = values.g;
        } else if (depth == 2) {
          value = values.b;
        } else if (depth == 3) {
          value = values.a;
        }

        setOutput(floor(value * 255.0 + 0.5));
      }
    `}};var ag=class{constructor(e){this.variableNames=["A"],this.packedInputs=!1,this.packedOutput=!0;let t=_e(),[o,n]=e;this.outputShape=e,this.userCode=`
      void main() {
        ivec3 coords = getOutputCoords();
        int texR = coords[0];
        int texC = coords[1];
        int depth = coords[2];

        vec4 result = vec4(0.);

        for(int row=0; row<=1; row++) {
          for(int col=0; col<=1; col++) {
            texC = coords[1] + row;
            depth = coords[2] + col;

            vec2 uv = (vec2(texC, texR) + halfCR) /
                       vec2(${n}.0, ${o}.0);
            vec4 values = ${t.texture2D}(A, uv);
            float value;
            if (depth == 0) {
              value = values.r;
            } else if (depth == 1) {
              value = values.g;
            } else if (depth == 2) {
              value = values.b;
            } else if (depth == 3) {
              value = values.a;
            }

            result[row * 2 + col] = floor(value * 255.0 + 0.5);
          }
        }

        ${t.output} = result;
      }
    `}};var TT={kernelName:In,backendName:"webgl",kernelFunc:hO},ps,lg=E().getBool("CANVAS2D_WILL_READ_FREQUENTLY_FOR_GPU");function hO(r){let{inputs:e,backend:t,attrs:o}=r,{pixels:n}=e,{numChannels:s}=o,i=typeof HTMLVideoElement!="undefined"&&n instanceof HTMLVideoElement,a=typeof HTMLImageElement!="undefined"&&n instanceof HTMLImageElement,[l,u]=i?[n.videoWidth,n.videoHeight]:[n.width,n.height],c=[u,l],p=[u,l,s];if(a||i){let g=E().getBool("CANVAS2D_WILL_READ_FREQUENTLY_FOR_GPU");(ps==null||g!==lg)&&(lg=g,ps=document.createElement("canvas").getContext("2d",{willReadFrequently:lg})),ps.canvas.width=l,ps.canvas.height=u,ps.drawImage(n,0,0,l,u),n=ps.canvas}let m=t.makeTensorInfo(c,"int32");t.texData.get(m.dataId).usage=je.PIXELS,t.gpgpu.uploadPixelDataToTexture(t.getTexture(m.dataId),n);let f=E().getBool("WEBGL_PACK")?new ag(p):new ig(p),d=t.runWebGLProgram(f,[m],"int32");return t.disposeData(m.dataId),d}function gO(r){let{inputs:e,backend:t,attrs:o}=r,{x:n,filter:s,bias:i,preluActivationWeights:a}=e,{strides:l,pad:u,dataFormat:c,dilations:p,dimRoundingMode:m,activation:f,leakyreluAlpha:d}=o,g=N.convertConv2DDataFormat(c),h=N.computeConv2DInfo(n.shape,s.shape,l,p,u,m,!1,g),b,T=[],k=i!=null,S=a!=null,I=f==="leakyrelu",A=()=>{let D=[n,s],P=(L,z)=>{if(z==="NCHW"&&L.shape.length===1&&L.shape[0]!==1){let B=O({inputs:{x:L},backend:t,attrs:{shape:[L.shape[0],1,1]}});return T.push(B),B}return L};if(k&&D.push(P(i,c)),S&&D.push(P(a,c)),I){let L=t.makeTensorInfo([],"float32",C.createScalarValue(d,"float32"));D.push(L),T.push(L)}return D};if(h.filterHeight===1&&h.filterWidth===1&&h.dilationHeight===1&&h.dilationWidth===1&&h.strideHeight===1&&h.strideWidth===1&&(h.padInfo.type==="SAME"||h.padInfo.type==="VALID"))b=ac({x:n,filter:s,convInfo:h,backend:t,bias:i,activation:f,preluActivationWeights:a,leakyreluAlpha:d});else if(h.strideWidth<=2&&g==="channelsLast"&&E().getBool("WEBGL_EXP_CONV")){let D=f?Lr(f,!0):null,P=new Ml(h,k,D,S,I),L=[[h.padInfo.top,h.padInfo.left],[h.strideHeight,h.strideWidth],[h.dilationHeight,h.dilationWidth],[h.inHeight,h.inWidth]],z=A();b=t.runWebGLProgram(P,z,"float32",L)}else if(E().getBool("WEBGL_CONV_IM2COL"))b=lc({x:n,filter:s,convInfo:h,backend:t,bias:i,activation:f,preluActivationWeights:a,leakyreluAlpha:d});else{let D=f?Lr(f,!1):null,P=new Bl(h,k,D,S,I),L=A();b=t.runWebGLProgram(P,L,"float32")}let R=O({inputs:{x:b},backend:t,attrs:{shape:h.outShape}});return T.push(b),T.forEach(D=>t.disposeIntermediateTensorInfo(D)),R}var CT={kernelName:An,backendName:"webgl",kernelFunc:gO};function xO(r){let{inputs:e,backend:t,attrs:o}=r,{x:n,filter:s,bias:i,preluActivationWeights:a}=e,{strides:l,pad:u,dilations:c,dimRoundingMode:p,activation:m,leakyreluAlpha:f}=o,d=[],g=c;g==null&&(g=[1,1]),C.assert(N.eitherStridesOrDilationsAreOne(l,g),()=>`Error in depthwiseConv2d: Either strides or dilations must be 1. Got strides ${l} and dilations '${g}'`);let h=N.computeConv2DInfo(n.shape,s.shape,l,g,u,p,!0),b=E().getBool("WEBGL_PACK_DEPTHWISECONV")&&h.strideWidth<=2&&h.outChannels/h.inChannels==1,T=m?Lr(m,b):null,k=[n,s],S=i!=null,I=a!=null,A=m==="leakyrelu";if(S&&k.push(i),I&&k.push(a),A){let L=t.makeTensorInfo([],"float32",C.createScalarValue(f,"float32"));k.push(L),d.push(L)}let R;b?R=new Gl(h,S,T,I,A):R=new Vl(h,S,T,I,A);let D=[[h.padInfo.top,h.padInfo.left],[h.strideHeight,h.strideWidth],[h.dilationHeight,h.dilationWidth],[h.inHeight,h.inWidth]],P=t.runWebGLProgram(R,k,"float32",D);return d.forEach(L=>t.disposeIntermediateTensorInfo(L)),P}var kT={kernelName:Rn,backendName:"webgl",kernelFunc:xO};var ug=class{constructor(e,t,o,n){this.sliceDim=e,this.strides=t,this.paramsShape=n,this.variableNames=["x","indices"],this.outputShape=o;let s=Q(o.length),i=`
    int index;`;for(let a=0;a<this.sliceDim;a++)i+=`
          index = round(getIndices(coords[0], ${a}));
          out_of_bounds = out_of_bounds || index < 0;
          out_of_bounds = out_of_bounds || index >= ${this.paramsShape[a]};
          flattenIndex += index * ${this.strides[a]};`;this.userCode=`
         void main() {
          ${s} coords = getOutputCoords();
          int flattenIndex = 0;
          bool out_of_bounds = false;

          ${i}

          setOutput(out_of_bounds ? 0.0 : getX(flattenIndex, coords[1]));
        }
      `}};function yO(r){let{inputs:e,backend:t}=r,{params:o,indices:n}=e,s=n.shape,i=s[s.length-1],a=C.sizeFromShape(o.shape),[l,u,c,p]=N.prepareAndValidate(o,n),m=O({inputs:{x:n},backend:t,attrs:{shape:[u,i]}}),f=O({inputs:{x:o},backend:t,attrs:{shape:[C.sizeFromShape(o.shape)/c,c]}});if(t.shouldExecuteOnCPU([o,n])||o.dtype==="string"){let b=t.readSync(n.dataId),T=t.bufferSync(o),k=Qw(b,T,o.dtype,u,i,c,p,o.shape,a);return t.makeTensorInfo(l,o.dtype,k.values)}let d=new ug(i,p,[u,c],o.shape),g=t.runWebGLProgram(d,[f,m],f.dtype),h=O({inputs:{x:g},backend:t,attrs:{shape:l}});return t.disposeIntermediateTensorInfo(m),t.disposeIntermediateTensorInfo(f),t.disposeIntermediateTensorInfo(g),h}var NT={kernelName:gi,backendName:"webgl",kernelFunc:yO};var cg=class{constructor(e,t){this.variableNames=["A","indices"],this.outputShape=t,this.rank=t.length;let o=Q(this.rank),n=bO(e,2);this.userCode=`
      void main() {
        ${o} resRC = getOutputCoords();
        int index = int(getIndices(resRC.x, resRC.z));
        float inBounds = (index >= 0) && (index < ${e[2]}) ? 1.0 : 0.0;
        setOutput(inBounds * getA(${n}));
      }
    `}};function bO(r,e){let t=["resRC.x","resRC.y","resRC.z","resRC.w"],o=[];for(let n=0;n<r.length;n++)n===2?o.push("index"):o.push(`${t[n]}`);return o.join()}function pg(r){let{inputs:e,backend:t,attrs:o}=r,{x:n,indices:s}=e,{axis:i,batchDims:a}=o,l=C.parseAxisParam(i,n.shape)[0];if(E().get("DEBUG")){let T=t.readSync(s.dataId),k=n.shape[l];for(let S=0;S<T.length;++S){let I=T[S];C.assert(I<=k-1&&I>=0,()=>`GatherV2: the index value ${I} is not in [0, ${k-1}]`)}}let u=N.segment_util.collectGatherOpShapeInfo(n,s,l,a),c=C.sizeFromShape(s.shape),p=[],m=O({inputs:{x:n},backend:t,attrs:{shape:[u.batchSize,u.outerSize,u.dimSize,u.sliceSize]}}),f=O({inputs:{x:s},backend:t,attrs:{shape:[u.batchSize,c/u.batchSize]}});p.push(m),p.push(f);let d=[u.batchSize,u.outerSize,c/u.batchSize,u.sliceSize];if(t.shouldExecuteOnCPU([n,s])||n.dtype==="string"){let T=t.bufferSync(f),k=t.bufferSync(m),S=Zw(k,T,d);return p.forEach(I=>t.disposeIntermediateTensorInfo(I)),t.makeTensorInfo(u.outputShape,S.dtype,S.values)}let g=new cg(m.shape,d),h=t.runWebGLProgram(g,[m,f],m.dtype);p.push(h);let b=O({inputs:{x:h},backend:t,attrs:{shape:u.outputShape}});return p.forEach(T=>t.disposeIntermediateTensorInfo(T)),b}var ST={kernelName:hi,backendName:"webgl",kernelFunc:pg};var _O="return float(a > b);",wO=`
  return vec4(greaterThan(a, b));
`,vO=ce({opSnippet:_O,packedOpSnippet:wO,cpuKernelImpl:Jw,dtype:"bool"}),ET={kernelName:go,backendName:"webgl",kernelFunc:vO};var TO="return float(a >= b);",CO=`
  return vec4(greaterThanEqual(a, b));
`,kO=ce({opSnippet:TO,packedOpSnippet:CO,dtype:"bool",cpuKernelImpl:e0}),IT={kernelName:xo,backendName:"webgl",kernelFunc:kO};function NO(r){let{inputs:e,backend:t}=r,{input:o}=e;return fc(o,!0,t)}var $T={kernelName:xi,backendName:"webgl",kernelFunc:NO};var SO="return float(!isnan(x) && !isinf(x));",EO=U({opSnippet:SO,dtype:"bool"}),AT={kernelName:bi,backendName:"webgl",kernelFunc:EO};var IO="return float(isinf(x));",$O=U({opSnippet:IO,dtype:"bool"}),RT={kernelName:_i,backendName:"webgl",kernelFunc:$O};var AO="return float(isnan(x));",RO=U({opSnippet:AO,dtype:"bool"}),DT={kernelName:wi,backendName:"webgl",kernelFunc:RO};var DO="return float(a < b);",FO=`
  return vec4(lessThan(a, b));
`,OO=ce({opSnippet:DO,packedOpSnippet:FO,cpuKernelImpl:t0,dtype:"bool"}),FT={kernelName:yo,backendName:"webgl",kernelFunc:OO};var PO="return float(a <= b);",LO=`
  return vec4(lessThanEqual(a, b));
`,BO=ce({opSnippet:PO,packedOpSnippet:LO,cpuKernelImpl:r0,dtype:"bool"}),OT={kernelName:bo,backendName:"webgl",kernelFunc:BO};function MO(r){let{backend:e,attrs:t}=r,{start:o,stop:n,num:s}=t,i=o0(o,n,s);return e.makeTensorInfo([i.length],"float32",i)}var PT={kernelName:Ti,backendName:"webgl",kernelFunc:MO};var VO=Bt+`
  return x < 0.0 ? 0./0. : log(x);
`,GO=`
  vec4 result = log(x);
  bvec4 isNaN = isnan(x);
  result.r = isNaN.r ? x.r : (x.r < 0.0 ? 0./0. : result.r);
  result.g = isNaN.g ? x.g : (x.g < 0.0 ? 0./0. : result.g);
  result.b = isNaN.b ? x.b : (x.b < 0.0 ? 0./0. : result.b);
  result.a = isNaN.a ? x.a : (x.a < 0.0 ? 0./0. : result.a);
  return result;
`,zO=U({opSnippet:VO,packedOpSnippet:GO,cpuKernelImpl:n0}),LT={kernelName:_o,backendName:"webgl",kernelFunc:zO};var UO=Bt+`
  return log(1.0 + x);
`,WO=U({opSnippet:UO}),BT={kernelName:Ci,backendName:"webgl",kernelFunc:WO};var jO="return float(a >= 1.0 && b >= 1.0);",HO=`
  return vec4(
    vec4(greaterThanEqual(a, vec4(1.0))) *
    vec4(greaterThanEqual(b, vec4(1.0))));
`,qO=ce({opSnippet:jO,packedOpSnippet:HO,dtype:"bool"}),MT={kernelName:ki,backendName:"webgl",kernelFunc:qO};var KO="return float(!(x >= 1.0));",XO=U({opSnippet:KO}),VT={kernelName:Ni,backendName:"webgl",kernelFunc:XO};var YO="return float(a >= 1.0 || b >= 1.0);",QO=`
  return min(
    vec4(greaterThanEqual(a, vec4(1.0))) +
    vec4(greaterThanEqual(b, vec4(1.0))),
    vec4(1.0));
`,ZO=ce({opSnippet:YO,packedOpSnippet:QO,dtype:"bool"}),GT={kernelName:Si,backendName:"webgl",kernelFunc:ZO};var mg=class{constructor(e,t,o,n,s){this.variableNames=["x"],this.outputShape=[];let i=t,a=e[3]-1;this.outputShape=e;let l,u=`float(${o}) + float(${n}) * sum`;s===.5?l=`inversesqrt(${u})`:s===1?l=`1.0/(${u})`:l=`exp(log(${u}) * float(-${s}));`,this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int r = coords[1];
        int c = coords[2];
        int d = coords[3];
        float x = getX(b, r, c, d);
        float sum = 0.0;
        for (int j = -${i}; j <= ${i}; j++) {
          int idx = d + j;
          if (idx >= 0 && idx <=  ${a}) {
            float z = getX(b, r, c, idx);
            sum += z * z;
          }
        }
        float val = x * ${l};
        setOutput(val);
      }
    `}};var fg=class{constructor(e,t,o,n,s){this.variableNames=["x"],this.outputShape=[],this.packedInputs=!0,this.packedOutput=!0;let i=t,a=e[3]-1;this.outputShape=e;let l,u=`float(${o}) + float(${n}) * sum`;s===.5?l=`inversesqrt(${u})`:s===1?l=`1.0/(${u})`:l=`exp(log(${u}) * float(-${s}));`,this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords.x;
        int r = coords.y;
        int c = coords.z;
        int d = coords.w;

        bool hasNextCol = d < ${this.outputShape[3]};
        bool hasNextRow = c < ${this.outputShape[2]};

        vec4 sum = vec4(0.);
        vec4 xFragAtOutputCoords = getX(b, r, c, d);

        vec4 xAtOutputCoords = vec4(
          getChannel(xFragAtOutputCoords, vec2(c, d)),
          hasNextCol ?
            getChannel(xFragAtOutputCoords, vec2(c, d + 1)) : 0.0,
          hasNextRow ?
            getChannel(xFragAtOutputCoords , vec2(c + 1, d)) : 0.0,
          (hasNextRow && hasNextCol) ?
            getChannel(xFragAtOutputCoords, vec2(c + 1, d + 1)) : 0.0
        );

        int firstChannel = d - ${i};
        vec2 cache = vec2(0.);
        if(firstChannel >= 0){
          vec4 firstChannelFrag = getX(b, r, c, firstChannel);
          cache.x = getChannel(firstChannelFrag, vec2(c, firstChannel));
            if(hasNextRow){
              cache.y = getChannel(firstChannelFrag, vec2(c + 1, firstChannel));
            }
        }

        ivec2 depth = ivec2(d, d + 1);
        for (int j = - ${i}; j <= ${i}; j++) {
          ivec2 idx = depth + j;
          bvec2 aboveLowerBound = greaterThanEqual(idx, ivec2(0));
          bvec2 belowUpperBound = lessThanEqual(idx, ivec2(${a}));

          bool depthInRange = aboveLowerBound.x && belowUpperBound.x;
          bool depthPlusOneInRange = aboveLowerBound.y && belowUpperBound.y;

          if(depthInRange || depthPlusOneInRange){
            vec4 z = vec4(0.);
            vec4 xFragAtCurrentDepth;
            z.xz = cache.xy;
            if(depthPlusOneInRange && hasNextCol){
              xFragAtCurrentDepth = idx.y != d ?
                getX(b, r, c, idx.y) : xFragAtOutputCoords;
              z.y = getChannel(xFragAtCurrentDepth, vec2(c, idx.y));
              if(hasNextRow){
                z.w = getChannel(xFragAtCurrentDepth, vec2(c + 1, idx.y));
              }
            }
            cache.xy = z.yw;
            sum += z * z;
          }
        }
        vec4 result = xAtOutputCoords * ${l};
        setOutput(result);
      }
    `}};var JO=r=>{let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{depthRadius:s,bias:i,alpha:a,beta:l}=o,u=E().getBool("WEBGL_PACK_NORMALIZATION")?new fg(n.shape,s,i,a,l):new mg(n.shape,s,i,a,l);return t.runWebGLProgram(u,[n],n.dtype)},zT={kernelName:Ei,backendName:"webgl",kernelFunc:JO};var dg=class{constructor(e,t,o,n,s){this.variableNames=["inputImage","outputImage","dy"],this.outputShape=[],this.outputShape=e,this.depth=e[3],this.depthRadius=t,this.bias=o,this.alpha=n,this.beta=s,this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int r = coords[1];
        int c = coords[2];

        float result = 0.0;
        for (int d = 0; d < ${this.depth}; ++d) {
          int depthBegin = int(max(0.0, float(d - ${t})));
          int depthEnd = int(min(float(${this.depth}),
              float(d + ${t} + 1)));

          const int MIN_DEPTH_BEGIN = 0;
          const int MAX_DEPTH_END = ${this.depth};

          float norm = 0.0;
          for (int k = MIN_DEPTH_BEGIN; k < MAX_DEPTH_END; ++k) {
            if (k < depthBegin){
              continue;
            }
            else if (k >= depthBegin && k < depthEnd) {
              norm += getInputImage(b, r, c, k) * getInputImage(b, r, c, k);
            }
            else {
              break;
            }
          }

          norm = float(${n}) * norm + float(${o});

          for(int k = MIN_DEPTH_BEGIN; k < MAX_DEPTH_END; ++k){
            if (k < depthBegin){
              continue;
            }
            else if (k >= depthBegin && k < depthEnd){
              float dyi = -2.0 * float(${n})
                * float(${s})
                * getInputImage(b ,r ,c, k) * getOutputImage(b, r, c, d)
                / norm;
              if (k == d) {
                dyi += pow(norm, -1.0 * ${s});
              }
              if (k == coords[3]) {
                dyi *= getDy(b, r, c, d);
                result += dyi;
              }
            }
            else {
              break;
            }
          }
      }
      setOutput(result);
      }
    `}};var eP=r=>{let{inputs:e,backend:t,attrs:o}=r,{x:n,y:s,dy:i}=e,{depthRadius:a,bias:l,alpha:u,beta:c}=o,p=new dg(n.shape,a,l,u,c);return t.runWebGLProgram(p,[n,s,i],n.dtype)},UT={kernelName:Xc,backendName:"webgl",kernelFunc:eP};function WT(r,e,t,o){let n=C.sizeFromShape(e),i=C.sizeFromShape(r.shape)/n,a=O({inputs:{x:r},attrs:{shape:[i,n]},backend:o}),l=_t(a,r.dtype,"max",o),u=O({inputs:{x:l},attrs:{shape:t},backend:o});return o.disposeIntermediateTensorInfo(a),o.disposeIntermediateTensorInfo(l),u}function hg(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{reductionIndices:s,keepDims:i}=o,a=n.shape.length,l=C.parseAxisParam(s,n.shape),u=l,c=N.getAxesPermutation(u,a),p=c!=null,m=t.shouldExecuteOnCPU([n]),f=n;if(p){if(m){let k=t.texData.get(f.dataId).values,S=new Array(a);for(let R=0;R<S.length;R++)S[R]=n.shape[c[R]];let I=pn(k,n.shape,n.dtype,c,S);f=t.makeTensorInfo(S,n.dtype);let A=t.texData.get(f.dataId);A.values=I}else f=no(n,c,t);u=N.getInnerMostAxes(u.length,a)}N.assertAxesAreInnerMostDims("max",u,a);let[d,g]=N.computeOutAndReduceShapes(f.shape,u),h=d;i&&(h=N.expandShapeToKeepDim(d,l));let b;if(m){let k=t.texData.get(f.dataId).values,S=s0(k,C.sizeFromShape(g),h,n.dtype);b=t.makeTensorInfo(h,n.dtype);let I=t.texData.get(b.dataId);I.values=S}else b=WT(f,g,h,t);return p&&t.disposeIntermediateTensorInfo(f),b}var jT={kernelName:Ii,backendName:"webgl",kernelFunc:hg};var tP=us+`
  return max(a, b);
`,rP=`
  vec4 result = vec4(max(a, b));
  bvec4 isNaNA = isnan(a);
  bvec4 isNaNB = isnan(b);
  bvec4 isNaN = bvec4(isNaNA.x || isNaNB.x, isNaNA.y || isNaNB.y, isNaNA.z || isNaNB.z, isNaNA.w || isNaNB.w);
  `+dr+`
  return result;
`,oP=ce({opSnippet:tP,packedOpSnippet:rP,cpuKernelImpl:i0}),HT={kernelName:wo,backendName:"webgl",kernelFunc:oP};function nP(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e;Zt(n,"maxPool");let{filterSize:s,strides:i,pad:a,dimRoundingMode:l}=o,u=1;C.assert(N.eitherStridesOrDilationsAreOne(i,u),()=>`Error in maxPool: Either strides or dilations must be 1. Got strides ${i} and dilations '${u}'`);let c=N.computePool2DInfo(n.shape,s,i,u,a,l);if(c.filterWidth===1&&c.filterHeight===1&&C.arraysEqual(c.inShape,c.outShape))return Ne({inputs:{x:n},backend:t});let p=new hr(c,"max",!1);return t.runWebGLProgram(p,[n],n.dtype)}var qT={kernelName:$i,backendName:"webgl",kernelFunc:nP};function sP(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{filterSize:s,strides:i,pad:a,dataFormat:l,dimRoundingMode:u}=o,c=[1,1,1],p=N.computePool3DInfo(n.shape,s,i,c,a,u,l),m=new hn(p,"max",!1);return t.runWebGLProgram(m,[n],n.dtype)}var KT={kernelName:Ai,backendName:"webgl",kernelFunc:sP};var gg=class{constructor(e){this.variableNames=["dy","maxPos"],this.outputShape=e.inShape;let t=e.strideHeight,o=e.strideWidth,n=e.dilationHeight,s=e.effectiveFilterHeight,i=e.effectiveFilterWidth,a=s-1-e.padInfo.top,l=i-1-e.padInfo.left,u=s*i-1;this.userCode=`
      const ivec2 pads = ivec2(${a}, ${l});

      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];

        ivec2 dyRCCorner = coords.yz - pads;
        int dyRCorner = dyRCCorner.x;
        int dyCCorner = dyRCCorner.y;

        // Convolve dy(?, ?, d) with pos mask(:, :, d) to get dx(xR, xC, d).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;
        for (int wR = 0; wR < ${s};
          wR += ${n}) {
          float dyR = float(dyRCorner + wR) / ${t}.0;

          if (dyR < 0.0 || dyR >= ${e.outHeight}.0 || fract(dyR) > 0.0) {
            continue;
          }
          int idyR = int(dyR);

          for (int wC = 0; wC < ${i}; wC++) {
            float dyC = float(dyCCorner + wC) / ${o}.0;

            if (dyC < 0.0 || dyC >= ${e.outWidth}.0 ||
                fract(dyC) > 0.0) {
              continue;
            }
            int idyC = int(dyC);

            float dyValue = getDy(b, idyR, idyC, d);
            int maxPosValue = ${u} - int(getMaxPos(b, idyR, idyC, d));

            // Get the current value, check it against the value from the
            // position matrix.
            int curPosValue = wR * ${i} + wC;
            float mask = float(maxPosValue == curPosValue ? 1.0 : 0.0);

            dotProd += dyValue * mask;
          }
        }
        setOutput(dotProd);
      }
    `}},xg=class{constructor(e){this.variableNames=["dy","maxPos"],this.outputShape=e.inShape;let t=e.strideDepth,o=e.strideHeight,n=e.strideWidth,s=e.dilationDepth,i=e.dilationHeight,a=e.dilationWidth,l=e.effectiveFilterDepth,u=e.effectiveFilterHeight,c=e.effectiveFilterWidth,p=l-1-e.padInfo.front,m=u-1-e.padInfo.top,f=c-1-e.padInfo.left,d=l*u*c-1;this.userCode=`
      const ivec3 pads = ivec3(${p}, ${m}, ${f});

      void main() {
        ivec5 coords = getOutputCoords();
        int batch = coords.x;
        int ch = coords.u;

        ivec3 dyCorner = ivec3(coords.y, coords.z, coords.w) - pads;
        int dyDCorner = dyCorner.x;
        int dyRCorner = dyCorner.y;
        int dyCCorner = dyCorner.z;

        // Convolve dy(?, ?, ?, ch) with pos mask(:, :, :, d) to get
        // dx(xD, xR, xC, ch).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;

        for (int wD = 0; wD < ${l};
           wD += ${s}) {
          float dyD = float(dyDCorner + wD) / ${t}.0;

          if (dyD < 0.0 || dyD >= ${e.outDepth}.0 || fract(dyD) > 0.0) {
            continue;
          }
          int idyD = int(dyD);

          for (int wR = 0; wR < ${u};
              wR += ${i}) {
            float dyR = float(dyRCorner + wR) / ${o}.0;

            if (dyR < 0.0 || dyR >= ${e.outHeight}.0 ||
                fract(dyR) > 0.0) {
              continue;
            }
            int idyR = int(dyR);

            for (int wC = 0; wC < ${c};
                wC += ${a}) {
              float dyC = float(dyCCorner + wC) / ${n}.0;

              if (dyC < 0.0 || dyC >= ${e.outWidth}.0 ||
                  fract(dyC) > 0.0) {
                continue;
              }
              int idyC = int(dyC);

              float dyValue = getDy(batch, idyD, idyR, idyC, ch);
              int maxPosValue = ${d} -
                  int(getMaxPos(batch, idyD, idyR, idyC, ch));

              // Get the current value, check it against the value from the
              // position matrix.
              int curPosValue =
                  wD * ${u} * ${c} +
                  wR * ${c} + wC;
              float mask = float(maxPosValue == curPosValue ? 1.0 : 0.0);

              dotProd += dyValue * mask;
            }
          }
        }
        setOutput(dotProd);
      }
    `}};function iP(r){let{inputs:e,backend:t,attrs:o}=r,{dy:n,input:s}=e,i=s,{filterSize:a,strides:l,pad:u,dimRoundingMode:c}=o,p=[1,1,1],m=N.computePool3DInfo(i.shape,a,l,p,u,c),f=new hn(m,"max",!0),d=t.runWebGLProgram(f,[i],i.dtype),g=new xg(m),h=t.runWebGLProgram(g,[n,d],i.dtype);return t.disposeIntermediateTensorInfo(d),h}var XT={kernelName:Qc,backendName:"webgl",kernelFunc:iP};function aP(r){let{inputs:e,backend:t,attrs:o}=r,{dy:n,input:s,output:i}=e,a=s;Zt([s,i],"maxPoolGrad");let{filterSize:l,strides:u,pad:c,dimRoundingMode:p}=o,m=N.computePool2DInfo(a.shape,l,u,1,c,p),f=!0,d=new hr(m,"max",f),g=t.runWebGLProgram(d,[a],a.dtype),h=new gg(m),b=t.runWebGLProgram(h,[n,g],a.dtype);return t.disposeIntermediateTensorInfo(g),b}var YT={kernelName:Yc,backendName:"webgl",kernelFunc:aP};function QT(r,e,t,o){let n=new hr(t,"max",!1),s=o.runWebGLProgram(n,[r],"float32");n=new hr(t,"max",!0,!0,e);let i=o.runWebGLProgram(n,[r],"float32");return[s,i]}var ZT={kernelName:Ri,backendName:"webgl",kernelFunc:({inputs:r,attrs:e,backend:t})=>{let{x:o}=r,{filterSize:n,strides:s,pad:i,includeBatchInIndex:a}=e,l=t;C.assert(o.shape.length===4,()=>`Error in maxPool: input must be rank 4 but got rank ${o.shape.length}.`);let u=[1,1];C.assert(N.eitherStridesOrDilationsAreOne(s,u),()=>`Error in maxPool: Either strides or dilations must be 1. Got strides ${s} and dilations '${u}'`);let c=N.computePool2DInfo(o.shape,n,s,u,i),[p,m]=QT(o,a,c,l);return[p,m]}};function JT(r,e,t,o){let n=C.sizeFromShape(e),i=C.sizeFromShape(r.shape)/n,a=O({inputs:{x:r},attrs:{shape:[i,n]},backend:o}),l=_t(a,"float32","mean",o),u=O({inputs:{x:l},attrs:{shape:t},backend:o});return o.disposeIntermediateTensorInfo(a),o.disposeIntermediateTensorInfo(l),u}var e1={kernelName:Di,backendName:"webgl",kernelFunc:({inputs:r,attrs:e,backend:t})=>{let{x:o}=r,{keepDims:n,axis:s}=e,i=t,a=o.shape.length,l=C.parseAxisParam(s,o.shape),u=l,c=N.getAxesPermutation(u,a),p=c!=null,m=i.shouldExecuteOnCPU([o]),f=[],d=o;if(p){if(m){let S=i.texData.get(d.dataId).values,I=new Array(a);for(let D=0;D<I.length;D++)I[D]=o.shape[c[D]];let A=pn(S,o.shape,o.dtype,c,I);d=i.makeTensorInfo(I,o.dtype);let R=i.texData.get(d.dataId);R.values=A}else d=no(o,c,i);f.push(d),u=N.getInnerMostAxes(u.length,a)}N.assertAxesAreInnerMostDims("sum",u,a);let[g,h]=N.computeOutAndReduceShapes(d.shape,u),b=g;n&&(b=N.expandShapeToKeepDim(g,l));let T=JT(d,h,b,i);for(let k of f)i.disposeIntermediateTensorInfo(k);return T}};function lP(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{axis:s,keepDims:i}=o,a=n.shape.length,l=C.parseAxisParam(s,n.shape),u=l,c=N.getAxesPermutation(u,a),p=n;c!=null&&(p=ye({inputs:{x:n},backend:t,attrs:{perm:c}}),u=N.getInnerMostAxes(u.length,n.shape.length)),N.assertAxesAreInnerMostDims("min",u,a);let[m,f]=N.computeOutAndReduceShapes(p.shape,u),d=C.sizeFromShape(f),g=O({inputs:{x:p},backend:t,attrs:{shape:[-1,d]}}),h=_t(g,g.dtype,"min",t),b;if(i){let T=N.expandShapeToKeepDim(m,l);b=O({inputs:{x:h},backend:t,attrs:{shape:T}})}else b=O({inputs:{x:h},backend:t,attrs:{shape:m}});return t.disposeIntermediateTensorInfo(g),t.disposeIntermediateTensorInfo(h),c!=null&&t.disposeIntermediateTensorInfo(p),b}var t1={kernelName:Fi,backendName:"webgl",kernelFunc:lP};var uP=us+`
  return min(a, b);
`,cP=`
  vec4 result = vec4(min(a, b));
  bvec4 isNaNA = isnan(a);
  bvec4 isNaNB = isnan(b);
  bvec4 isNaN = bvec4(isNaNA.x || isNaNB.x, isNaNA.y || isNaNB.y, isNaNA.z || isNaNB.z, isNaNA.w || isNaNB.w);
  `+dr+`
  return result;
`,pP=ce({opSnippet:uP,packedOpSnippet:cP,cpuKernelImpl:a0}),r1={kernelName:vo,backendName:"webgl",kernelFunc:pP};var yg=class{constructor(e,t,o){this.variableNames=["x"],this.outputShape=t.map((c,p)=>c[0]+e[p]+c[1]);let n=e.length,s=Q(n),i=t.map(c=>c[0]).join(","),a=t.map((c,p)=>c[0]+e[p]).join(","),l=["coords[0]","coords[1]","coords[2]","coords[3]"].slice(0,n),u=o==="reflect"?0:1;if(n===1){this.userCode=`
        int start = ${i};
        int end = ${a};

        void main() {
          int outC = getOutputCoords();
          if (outC < start) {
            outC = start * 2 - outC - ${u};
          } else if(outC >= end) {
            outC = (end - 1) * 2 - outC + ${u};
          }
          setOutput(getX(outC - start));
        }
      `;return}this.userCode=`
      ${s} start = ${s}(${i});
      ${s} end = ${s}(${a});

      void main() {
        ${s} outC = getOutputCoords();
        for (int i = 0; i < ${n}; i++) {
          if (outC[i] < start[i]) {
            outC[i] = start[i] * 2 - outC[i] - ${u};
          } else if(outC[i] >= end[i]) {
            outC[i] = (end[i] - 1) * 2 - outC[i] + ${u};
          }
        }
        ${s} coords = outC - start;
        setOutput(getX(${l}));
      }
    `}};var bg=class{constructor(e,t,o){this.variableNames=["x"],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=t.map((d,g)=>d[0]+e[g]+d[1]);let n=e.length,s=Q(n),i=t.map(d=>d[0]).join(","),a=t.map((d,g)=>d[0]+e[g]).join(","),l=ke("rc",n),u=ke("source",n),c=`${l[n-1]} < ${this.outputShape[n-1]}`,p=n===1?"source":`vec2(${u.slice(-2).join()})`,m=o==="reflect"?0:1,f="";if(n===1){let d=`
        ${s} source = rc;
        if (source < start) {
          source = start * 2 - source - ${m};
        } else if (source >= end) {
          source = (end - 1) * 2 - source + ${m};
        }
        source -= start;
      `;f=`
        ${s} rc = outputLoc;
        ${d}
        result[0] = getChannel(getX(${u.join()}), ${p});
        ${l[n-1]} += 1;
        if(${c}) {
          ${d}
          result[1] = getChannel(getX(${u.join()}), ${p});
        }
      `}else{let d=`
        ${s} source = rc;
        ${s} lt = ${s}(lessThan(source, start));
        ${s} gte = ${s}(greaterThanEqual(source, end));
        ${s} orig = 1 - (lt + gte);
        source = orig * source +
                lt * (start * 2 - source - ${m}) +
                gte * ((end - 1) * 2 - source + ${m});
        source -= start;
      `;f=`
        ${s} rc = outputLoc;
        ${d}
        result[0] = getChannel(getX(${u.join()}), ${p});
        ${l[n-1]} += 1;
        if(${c}) {
          ${d}
          result[1] = getChannel(getX(${u.join()}), ${p});
        }
        rc = outputLoc;
        ${l[n-2]} += 1;
        if(${l[n-2]} < ${this.outputShape[n-2]}) {
          ${d}
          result[2] = getChannel(getX(${u.join()}), ${p});
          ${l[n-1]} += 1;
          if(${c}) {
            ${d}
            result[3] = getChannel(getX(${u.join()}), ${p});
          }
        }
      `}this.userCode=`
      const ${s} start = ${s}(${i});
      const ${s} end = ${s}(${a});

      void main() {
        ${s} outputLoc = getOutputCoords();
        vec4 result = vec4(0.);
        ${f}
        setOutput(result);
      }
    `}};var mP=({inputs:r,backend:e,attrs:t})=>{let{x:o}=r,{paddings:n,mode:s}=t,i=E().getBool("WEBGL_PACK_ARRAY_OPERATIONS")?new bg(o.shape,n,s):new yg(o.shape,n,s);return e.runWebGLProgram(i,[o],o.dtype)},o1={kernelName:Oi,backendName:"webgl",kernelFunc:mP};var fP=`if (b == 0.0) return NAN;
  return mod(a, b);`,dP=`
  vec4 result = mod(a, b);
  bvec4 isNaN = equal(b, vec4(0.0));
  `+dr+`
  return result;
`,hP=ce({opSnippet:fP,packedOpSnippet:dP}),n1={kernelName:Pi,backendName:"webgl",kernelFunc:hP};var _g=class{constructor(e,t,o){this.variableNames=["probs"],this.customUniforms=[{name:"seed",type:"float"}],this.outputShape=[e,o],this.userCode=`
      void main() {
        ivec2 coords = getOutputCoords();
        int batch = coords[0];

        float r = random(seed);
        float cdf = 0.0;

        for (int i = 0; i < ${t-1}; i++) {
          cdf += getProbs(batch, i);

          if (r < cdf) {
            setOutput(float(i));
            return;
          }
        }

        // If no other event happened, last event happened.
        setOutput(float(${t-1}));
      }
    `}};var gP=`
if (a == b) {
  return 1.0;
};
return a / b;`,xP=`
  // vec4 one = vec4(equal(a, b));
  // return one + (vec4(1.0) - one) * a / b;
  vec4 result = a / b;
  if(a.x == b.x) {
    result.x = 1.;
  }
  if(a.y == b.y) {
    result.y = 1.;
  }
  if(a.z == b.z) {
    result.z = 1.;
  }
  if(a.w == b.w) {
    result.w = 1.;
  }

  return result;
`,wg=ce({opSnippet:gP,packedOpSnippet:xP,checkOutOfBounds:!0}),s1={kernelName:si,backendName:"webgl",kernelFunc:wg};var i1="return a - b;",vg=ce({opSnippet:i1,packedOpSnippet:i1,supportsComplex:!0,cpuKernelImpl:N0}),a1={kernelName:Io,backendName:"webgl",kernelFunc:vg};function Tg(r){let{inputs:e,backend:t,attrs:o}=r,{logits:n}=e,{dim:s}=o,i=C.parseAxisParam([s],n.shape),a=hg({inputs:{x:n},backend:t,attrs:{reductionIndices:i,keepDims:!1}}),l=N.expandShapeToKeepDim(a.shape,i),u=O({inputs:{x:a},backend:t,attrs:{shape:l}}),c=vg({inputs:{a:n,b:u},backend:t}),p=og({inputs:{x:c},backend:t}),m=fn({inputs:{x:p},backend:t,attrs:{axis:i,keepDims:!1}}),f=O({inputs:{x:m},backend:t,attrs:{shape:l}}),d=wg({inputs:{a:p,b:f},backend:t});return t.disposeIntermediateTensorInfo(a),t.disposeIntermediateTensorInfo(u),t.disposeIntermediateTensorInfo(c),t.disposeIntermediateTensorInfo(p),t.disposeIntermediateTensorInfo(m),t.disposeIntermediateTensorInfo(f),d}var l1={kernelName:ha,backendName:"webgl",kernelFunc:Tg};function yP(r){let{inputs:e,backend:t,attrs:o}=r,{logits:n}=e,{numSamples:s,seed:i,normalized:a}=o,l=a?n:Tg({inputs:{logits:n},backend:t,attrs:{dim:n.shape.length-1}}),u=l.shape[0],c=l.shape[1],p=new _g(u,c,s),m=[[i]],f=t.runWebGLProgram(p,[l],"int32",m);return a||t.disposeIntermediateTensorInfo(l),f}var u1={kernelName:Li,backendName:"webgl",kernelFunc:yP};var bP=Re+`
  return -x;
`,_P=`
  vec4 result = -x;
  bvec4 isNaN = isnan(x);

  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`;function wP(r){let{inputs:e,backend:t}=r,{x:o}=e;if(t.shouldExecuteOnCPU([o])){let s=t.texData.get(o.dataId),[i,a]=u0(s.values,o.shape,o.dtype);return t.makeTensorInfo(a,o.dtype,i)}let n;return E().getBool("WEBGL_PACK_UNARY_OPERATIONS")?n=new Pt(o.shape,_P):n=new st(o.shape,bP),t.runWebGLProgram(n,[o],o.dtype)}var c1={kernelName:kn,backendName:"webgl",kernelFunc:wP};var vP=Qt.nonMaxSuppressionV3Impl;function TP(r){N.warn("tf.nonMaxSuppression() in webgl locks the UI thread. Call tf.nonMaxSuppressionAsync() instead");let{inputs:e,backend:t,attrs:o}=r,{boxes:n,scores:s}=e,{maxOutputSize:i,iouThreshold:a,scoreThreshold:l}=o,u=t.readSync(n.dataId),c=t.readSync(s.dataId),{selectedIndices:p}=vP(u,c,i,a,l);return t.makeTensorInfo([p.length],"int32",new Int32Array(p))}var p1={kernelName:Bi,backendName:"webgl",kernelFunc:TP};var CP=Qt.nonMaxSuppressionV4Impl;function kP(r){N.warn("tf.nonMaxSuppression() in webgl locks the UI thread. Call tf.nonMaxSuppressionAsync() instead");let{inputs:e,backend:t,attrs:o}=r,{boxes:n,scores:s}=e,{maxOutputSize:i,iouThreshold:a,scoreThreshold:l,padToMaxOutputSize:u}=o,c=t.readSync(n.dataId),p=t.readSync(s.dataId),{selectedIndices:m,validOutputs:f}=CP(c,p,i,a,l,u);return[t.makeTensorInfo([m.length],"int32",new Int32Array(m)),t.makeTensorInfo([],"int32",new Int32Array([f]))]}var m1={kernelName:Mi,backendName:"webgl",kernelFunc:kP};var NP=Qt.nonMaxSuppressionV5Impl;function SP(r){N.warn("tf.nonMaxSuppression() in webgl locks the UI thread. Call tf.nonMaxSuppressionAsync() instead");let{inputs:e,backend:t,attrs:o}=r,{boxes:n,scores:s}=e,{maxOutputSize:i,iouThreshold:a,scoreThreshold:l,softNmsSigma:u}=o,c=t.readSync(n.dataId),p=t.readSync(s.dataId),m=i,f=a,d=l,g=u,{selectedIndices:h,selectedScores:b}=NP(c,p,m,f,d,g);return[t.makeTensorInfo([h.length],"int32",new Int32Array(h)),t.makeTensorInfo([b.length],"float32",new Float32Array(b))]}var f1={kernelName:Vi,backendName:"webgl",kernelFunc:SP};var Cg=class{constructor(e,t,o,n){this.variableNames=["indices"],this.outputShape=[e,t],this.userCode=`
      void main() {
        ivec2 coords = getOutputCoords();
        int index = round(getIndices(coords.x));
        setOutput(mix(float(${n}), float(${o}),
                      float(index == coords.y)));
      }
    `}};var EP=r=>{let{inputs:e,backend:t,attrs:o}=r,{indices:n}=e,{dtype:s,depth:i,onValue:a,offValue:l}=o,u=C.sizeFromShape(n.shape),c=new Cg(u,i,a,l),p=O({inputs:{x:n},backend:t,attrs:{shape:[u]}}),m=t.runWebGLProgram(c,[p],s);t.disposeIntermediateTensorInfo(p);let f=[...n.shape,i],d=O({inputs:{x:m},backend:t,attrs:{shape:f}});return t.disposeIntermediateTensorInfo(m),d},d1={kernelName:zi,backendName:"webgl",kernelFunc:EP};function zl(r){let{inputs:e,backend:t}=r,{x:o}=e;if(o.dtype==="complex64"){let n=Br({inputs:{input:o},backend:t}),s=zl({inputs:{x:n},backend:t}),i=gn({inputs:{input:o},backend:t}),a=zl({inputs:{x:i},backend:t}),l=ct({inputs:{real:s,imag:a},backend:t});return t.disposeIntermediateTensorInfo(n),t.disposeIntermediateTensorInfo(s),t.disposeIntermediateTensorInfo(i),t.disposeIntermediateTensorInfo(a),l}else return Mr({attrs:{shape:o.shape,dtype:o.dtype,value:o.dtype==="string"?"":0},backend:t})}var h1={kernelName:Ra,backendName:"webgl",kernelFunc:zl};function g1(r){let{inputs:e,backend:t}=r,{x:o}=e;if(o.dtype==="string")throw new Error("onesLike is not supported under string dtype");if(o.dtype==="complex64"){let n=Br({inputs:{input:o},backend:t}),s=g1({inputs:{x:n},backend:t}),i=gn({inputs:{input:o},backend:t}),a=zl({inputs:{x:i},backend:t}),l=ct({inputs:{real:s,imag:a},backend:t});return t.disposeIntermediateTensorInfo(n),t.disposeIntermediateTensorInfo(s),t.disposeIntermediateTensorInfo(i),t.disposeIntermediateTensorInfo(a),l}else return Mr({attrs:{shape:o.shape,dtype:o.dtype,value:1},backend:t})}var x1={kernelName:Gi,backendName:"webgl",kernelFunc:g1};function IP(r){let{inputs:e,backend:t,attrs:o}=r,{axis:n}=o;if(e.length===1)return pc({inputs:{input:e[0]},backend:t,attrs:{dim:n}});let s=e[0].shape,i=e[0].dtype;e.forEach(c=>{C.assertShapesMatch(s,c.shape,"All tensors passed to stack must have matching shapes"),C.assert(i===c.dtype,()=>"All tensors passed to stack must have matching dtypes")});let a=[],l=e.map(c=>{let p=pc({inputs:{input:c},backend:t,attrs:{dim:n}});return a.push(p),p}),u=Wh({inputs:l,backend:t,attrs:{axis:n}});return a.forEach(c=>t.disposeIntermediateTensorInfo(c)),u}var y1={kernelName:Ui,backendName:"webgl",kernelFunc:IP};var kg=class{constructor(e,t,o){this.variableNames=["x"],this.customUniforms=[{name:"value",type:"float"}],this.outputShape=t.map((u,c)=>u[0]+e[c]+u[1]);let n=e.length,s=Q(n),i=t.map(u=>u[0]).join(","),a=t.map((u,c)=>u[0]+e[c]).join(","),l=["coords[0]","coords[1]","coords[2]","coords[3]"].slice(0,n);if(n===1){this.userCode=`
        int start = ${i};
        int end = ${a};

        void main() {
          int outC = getOutputCoords();
          if (outC < start || outC >= end) {
            setOutput(value);
          } else {
            setOutput(getX(outC - start));
          }
        }
      `;return}this.userCode=`
      ${s} start = ${s}(${i});
      ${s} end = ${s}(${a});

      void main() {
        ${s} outC = getOutputCoords();
        if (any(lessThan(outC, start)) || any(greaterThanEqual(outC, end))) {
          setOutput(value);
        } else {
          ${s} coords = outC - start;
          setOutput(getX(${l}));
        }
      }
    `}};var Ng=class{constructor(e,t,o){this.variableNames=["x"],this.packedInputs=!0,this.packedOutput=!0,this.customUniforms=[{name:"value",type:"float"}],this.outputShape=t.map((g,h)=>g[0]+e[h]+g[1]);let n=e.length,s=Q(n),i=t.map(g=>g[0]).join(","),a=t.map((g,h)=>g[0]+e[h]).join(","),l=ke("rc",n),u=ke("source",n),c=`${l[n-1]} < ${this.outputShape[n-1]}`,p=n===1?"source":`vec2(${u.slice(-2).join()})`,m=[`${s} rc = outputLoc;`,`${l[n-1]} += 1;
       if(${c}) {
      `,n===1?"":`}
       rc = outputLoc;
       ${l[n-2]} += 1;
       if(${l[n-2]} < ${this.outputShape[n-2]}) {`,n===1?"":`  ${l[n-1]} += 1;
         if(${c}) {`],f=n===1?"rc < start || rc >= end":"any(lessThan(rc, start)) || any(greaterThanEqual(rc, end))",d="";for(let g=0,h=n===1?2:4;g<h;g++)d+=`
        ${m[g]}
        if (${f}) {
          result[${g}] = float(value);
        } else {
          ${s} source = rc - start;
          result[${g}] = getChannel(getX(${u.join()}), ${p});
        }
      `;d+=n===1?"} ":"}}",this.userCode=`
      const ${s} start = ${s}(${i});
      const ${s} end = ${s}(${a});

      void main() {
        ${s} outputLoc = getOutputCoords();
        vec4 result = vec4(0.);
        ${d}
        setOutput(result);
      }
    `}};var Sg=r=>{let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{paddings:s,constantValue:i}=o;if(C.sizeFromShape(n.shape)===0){let u=s.map((c,p)=>c[0]+n.shape[p]+c[1]);return Mr({backend:t,attrs:{shape:u,value:i,dtype:n.dtype}})}let a=E().getBool("WEBGL_PACK_ARRAY_OPERATIONS")?new Ng(n.shape,s,i):new kg(n.shape,s,i),l=[[i]];return t.runWebGLProgram(a,[n],n.dtype,l)},b1={kernelName:Wi,backendName:"webgl",kernelFunc:Sg};var $P=`
  if(a < 0.0 && floor(b) < b){
    return NAN;
  }
  if (b == 0.0) {
    return 1.0;
  }
  return (round(mod(b, 2.0)) != 1) ?
      pow(abs(a), b) : sign(a) * pow(abs(a), b);
`,AP=`
  // isModRound1 has 1 for components with round(mod(b, 2.0)) == 1, 0 otherwise.
  vec4 isModRound1 = vec4(equal(round(mod(b, 2.0)), ivec4(1)));
  vec4 multiplier = sign(a) * isModRound1 + (vec4(1.0) - isModRound1);
  vec4 result = multiplier * pow(abs(a), b);

  // Ensure that a^0 = 1, including 0^0 = 1 as this correspond to TF and JS
  bvec4 isExpZero = equal(b, vec4(0.0));
  result.r = isExpZero.r ? 1.0 : result.r;
  result.g = isExpZero.g ? 1.0 : result.g;
  result.b = isExpZero.b ? 1.0 : result.b;
  result.a = isExpZero.a ? 1.0 : result.a;

  bvec4 isNaN1 = lessThan(a, vec4(0.0));
  bvec4 isNaN2 = lessThan(floor(b), b);
  bvec4 isNaN = bvec4(isNaN1.x && isNaN2.x, isNaN1.y && isNaN2.y, isNaN1.z && isNaN2.z, isNaN1.w && isNaN2.w);
  `+dr+`
  return result;
`,RP=ce({opSnippet:$P,packedOpSnippet:AP}),_1={kernelName:ji,backendName:"webgl",kernelFunc:RP};function DP(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{axis:s,keepDims:i}=o,a=n.shape.length,l=[],u=C.parseAxisParam(s,n.shape),c=u,p=N.getAxesPermutation(c,a),m=n;p!=null&&(m=ye({inputs:{x:n},backend:t,attrs:{perm:p}}),c=N.getInnerMostAxes(c.length,a),l.push(m)),N.assertAxesAreInnerMostDims("prod",c,a);let f;if(t.shouldExecuteOnCPU([m])){let d=t.texData.get(m.dataId).values,{outVals:g,outShape:h,outDtype:b}=p0(m.shape,m.dtype,d,c);f=t.makeTensorInfo(h,b,g)}else{let[d,g]=N.computeOutAndReduceShapes(m.shape,c),h=C.sizeFromShape(g),b=O({inputs:{x:m},backend:t,attrs:{shape:[-1,h]}}),T=jr(n.dtype),k=_t(b,T,"prod",t);f=O({inputs:{x:k},backend:t,attrs:{shape:d}}),l.push(b),l.push(k)}if(i){l.push(f);let d=N.expandShapeToKeepDim(f.shape,u);f=O({inputs:{x:f},backend:t,attrs:{shape:d}})}return l.forEach(d=>t.disposeIntermediateTensorInfo(d)),f}var w1={kernelName:Nn,backendName:"webgl",kernelFunc:DP};function FP(r){let{inputs:e,backend:t,attrs:o}=r,{paramsNestedSplits:n,paramsDenseValues:s,indices:i}=e,{outputRaggedRank:a}=o,l=n.map(b=>t.readSync(b.dataId)),u=n.map(b=>b.shape),c=t.readSync(s.dataId),p=t.readSync(i.dataId),[m,f,d]=m0(l,u,c,s.shape,s.dtype,p,i.shape,a),g=m.map(b=>t.makeTensorInfo([b.length],"int32",b)),h=t.makeTensorInfo(d,s.dtype,f);return g.concat([h])}var v1={kernelName:qi,backendName:"webgl",kernelFunc:FP};function OP(r){let{inputs:e,backend:t,attrs:o}=r,{shape:n,values:s,defaultValue:i,rowPartitionTensors:a}=e,{rowPartitionTypes:l}=o,u=t.readSync(n.dataId),c=t.readSync(s.dataId),p=t.readSync(i.dataId),m=a.map(h=>t.readSync(h.dataId)),f=a.map(h=>h.shape),[d,g]=f0(u,n.shape,c,s.shape,s.dtype,p,i.shape,m,f,l);return t.makeTensorInfo(d,s.dtype,g)}var T1={kernelName:Ki,backendName:"webgl",kernelFunc:OP};var Eg=r=>{let{backend:e,attrs:t}=r,{start:o,stop:n,step:s,dtype:i}=t,a=d0(o,n,s,i);return e.makeTensorInfo([a.length],i,a)},C1={kernelName:Xi,backendName:"webgl",kernelFunc:Eg};var PP="return 1.0 / x;",LP=U({opSnippet:PP}),k1={kernelName:Yi,backendName:"webgl",kernelFunc:LP};var BP=Re+`
  return (x < 0.0) ? 0.0 : x;
`,MP=`
  vec4 result = x * vec4(greaterThanEqual(x, vec4(0.0)));
  bvec4 isNaN = isnan(x);

  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`,VP=U({opSnippet:BP,packedOpSnippet:MP}),N1={kernelName:Qi,backendName:"webgl",kernelFunc:VP};var GP=Re+`
  return (x < 0.0) ? 0.0 : min(6.0, x);
`,zP=`
  vec4 result = min(x, vec4(6.)) * vec4(greaterThanEqual(x, vec4(0.0)));
  bvec4 isNaN = isnan(x);

  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`,UP=U({opSnippet:GP,packedOpSnippet:zP}),S1={kernelName:ta,backendName:"webgl",kernelFunc:UP};var Ig=class{constructor(e,t,o,n,s){this.variableNames=["A"],this.outputShape=[];let[i,a,l,u]=e;this.outputShape=[i,t,o,u];let c=[n&&t>1?a-1:a,n&&o>1?l-1:l],p=[n&&t>1?t-1:t,n&&o>1?o-1:o],m;s?m="(vec2(yRC) + vec2(0.5)) * effectiveInputOverOutputRatioRC - vec2(0.5)":m="vec2(yRC) * effectiveInputOverOutputRatioRC",this.userCode=`
      const vec2 effectiveInputOverOutputRatioRC = vec2(
          ${c[0]/p[0]},
          ${c[1]/p[1]});
      const vec2 inputShapeRC = vec2(${a}.0, ${l}.0);

      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];
        ivec2 yRC = coords.yz;

        // Fractional source index.
        vec2 sourceFracIndexRC = ${m};

        // Compute the four integer indices.
        ivec2 sourceFloorRC = ivec2(max(sourceFracIndexRC, vec2(0.0)));
        ivec2 sourceCeilRC = ivec2(
          min(inputShapeRC - 1.0, ceil(sourceFracIndexRC)));

        float topLeft = getA(b, sourceFloorRC.x, sourceFloorRC.y, d);
        float bottomLeft = getA(b, sourceCeilRC.x, sourceFloorRC.y, d);
        float topRight = getA(b, sourceFloorRC.x, sourceCeilRC.y, d);
        float bottomRight = getA(b, sourceCeilRC.x, sourceCeilRC.y, d);

        vec2 fracRC = sourceFracIndexRC - vec2(sourceFloorRC);

        float top = topLeft + (topRight - topLeft) * fracRC.y;
        float bottom = bottomLeft + (bottomRight - bottomLeft) * fracRC.y;
        float newValue = top + (bottom - top) * fracRC.x;

        setOutput(newValue);
      }
    `}};var $g=class{constructor(e,t,o,n,s){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=[];let[i,a,l,u]=e;this.outputShape=[i,t,o,u];let c=[n&&t>1?a-1:a,n&&o>1?l-1:l],p=[n&&t>1?t-1:t,n&&o>1?o-1:o],m;s?m="(vec3(yRC) + vec3(0.5)) * effectiveInputOverOutputRatioRC - vec3(0.5)":m="vec3(yRC) * effectiveInputOverOutputRatioRC",this.userCode=`
      const vec3 effectiveInputOverOutputRatioRC = vec3(
          ${c[0]/p[0]},
          ${c[1]/p[1]},
          ${c[1]/p[1]});
      const vec3 inputShapeRC = vec3(${a}.0, ${l}.0,
                                     ${l}.0);

      float getAValue(int b, int r, int c, int d) {
        return getChannel(getA(b, r, c, d), vec2(c, d));
      }

      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];
        // Calculate values for next column in yRC.z.
        ivec3 yRC = coords.yzz + ivec3(0, 0, 1);

        // Fractional source index.
        vec3 sourceFracIndexRC = ${m};

        // Compute the four integer indices.
        ivec3 sourceFloorRC = ivec3(max(sourceFracIndexRC, vec3(0.0)));
        ivec3 sourceCeilRC = ivec3(
          min(inputShapeRC - 1.0, ceil(sourceFracIndexRC)));

        // Should we calculate next column and row elements in 2x2 packed cell.
        bool hasNextCol = d < ${u-1};
        bool hasNextRow = coords.z < ${o-1};

        // In parallel, construct four corners for all four components in
        // packed 2x2 cell.
        vec4 topLeft = vec4(
          getAValue(b, sourceFloorRC.x, sourceFloorRC.y, d),
          hasNextCol ? getAValue(b, sourceFloorRC.x, sourceFloorRC.y, d + 1)
                     : 0.0,
          hasNextRow ? getAValue(b, sourceFloorRC.x, sourceFloorRC.z, d)
                     : 0.0,
          (hasNextRow && hasNextCol) ?
            getAValue(b, sourceFloorRC.x, sourceFloorRC.z, d + 1) : 0.0);

        vec4 bottomLeft = vec4(
          getAValue(b, sourceCeilRC.x, sourceFloorRC.y, d),
          hasNextCol ? getAValue(b, sourceCeilRC.x, sourceFloorRC.y, d + 1)
                     : 0.0,
          hasNextRow ? getAValue(b, sourceCeilRC.x, sourceFloorRC.z, d)
                     : 0.0,
          (hasNextRow && hasNextCol) ?
            getAValue(b, sourceCeilRC.x, sourceFloorRC.z, d + 1) : 0.0);

        vec4 topRight = vec4(
          getAValue(b, sourceFloorRC.x, sourceCeilRC.y, d),
          hasNextCol ? getAValue(b, sourceFloorRC.x, sourceCeilRC.y, d + 1)
                     : 0.0,
          hasNextRow ? getAValue(b, sourceFloorRC.x, sourceCeilRC.z, d)
                     : 0.0,
          (hasNextRow && hasNextCol) ?
            getAValue(b, sourceFloorRC.x, sourceCeilRC.z, d + 1) : 0.0);

        vec4 bottomRight = vec4(
          getAValue(b, sourceCeilRC.x, sourceCeilRC.y, d),
          hasNextCol ? getAValue(b, sourceCeilRC.x, sourceCeilRC.y, d + 1)
                     : 0.0,
          hasNextRow ? getAValue(b, sourceCeilRC.x, sourceCeilRC.z, d)
                     : 0.0,
          (hasNextRow && hasNextCol) ?
            getAValue(b, sourceCeilRC.x, sourceCeilRC.z, d + 1) : 0.0);

        vec3 fracRC = sourceFracIndexRC - vec3(sourceFloorRC);

        vec4 top = mix(topLeft, topRight, fracRC.yyzz);
        vec4 bottom = mix(bottomLeft, bottomRight, fracRC.yyzz);
        vec4 newValue = mix(top, bottom, fracRC.x);

        setOutput(newValue);
      }
    `}};function WP(r){let{inputs:e,backend:t,attrs:o}=r,{images:n}=e,{alignCorners:s,halfPixelCenters:i,size:a}=o,[l,u]=a,c=E().getBool("WEBGL_PACK_IMAGE_OPERATIONS")?new $g(n.shape,l,u,s,i):new Ig(n.shape,l,u,s,i);return t.runWebGLProgram(c,[n],"float32")}var E1={kernelName:ea,backendName:"webgl",kernelFunc:WP};var Ag=class{constructor(e,t,o){this.variableNames=["dy"],this.outputShape=[],this.outputShape=t;let[,n,s]=t,[,i,a]=e,l=[o&&i>1?n-1:n,o&&a>1?s-1:s],u=[o&&i>1?i-1:i,o&&a>1?a-1:a],c=l[0]/u[0],p=l[1]/u[1],m=1/c,f=1/p,d=Math.ceil(m)*2+2,g=Math.ceil(f)*2+2;this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];
        int r = coords[1];
        int c = coords[2];

        float accumulator = 0.0;

        const float heightScale = float(${c});
        const float widthScale = float(${p});

        const float invHeightScale = float(${m});
        const float invWidthScale = float(${f});

        const int winHeight = int(${d});
        const int winWidth = int(${g});

        // Compute bounds for where in dy we will look
        float startRLerp = floor(float(r) * invHeightScale);
        int startDyR = int(startRLerp - float(winHeight / 2));

        float startCLerp = floor(float(c) * invWidthScale);
        int startDyC = int(startCLerp - float(winWidth / 2));

        // Loop over dy
        for (int dyROffset = 0; dyROffset < winHeight; dyROffset++) {
          int dyR = dyROffset + startDyR;

          // Guard against the window exceeding the bounds of dy
          if (dyR < 0 || dyR >= ${i}) {
            continue;
          }

          for (int dyCOffset = 0; dyCOffset < winWidth; dyCOffset++) {
            int dyC = dyCOffset + startDyC;

            // Guard against the window exceeding the bounds of dy
            if (dyC < 0 || dyC >= ${a}) {
              continue;
            }

            float dxR = float(dyR) * heightScale;
            int topDxRIndex = int(floor(dxR));
            int bottomDxRIndex = int(min(ceil(dxR), ${n-1}.0));
            float dxRLerp = dxR - float(topDxRIndex);
            float inverseDxRLerp = 1.0 - dxRLerp;

            float dxC = float(dyC) * widthScale;
            int leftDxCIndex = int(floor(dxC));
            int rightDxCIndex = int(min(ceil(dxC), ${s-1}.0));
            float dxCLerp = dxC - float(leftDxCIndex);
            float inverseDxCLerp = 1.0 - dxCLerp;

            if (r == topDxRIndex && c == leftDxCIndex) {
              // topLeft
              accumulator +=
                getDy(b, dyR, dyC, d) * inverseDxRLerp * inverseDxCLerp;
            }

            if (r == topDxRIndex && c == rightDxCIndex) {
              // topRight
              accumulator += getDy(b, dyR, dyC, d) * inverseDxRLerp * dxCLerp;
            }

            if (r == bottomDxRIndex && c == leftDxCIndex) {
              // bottomLeft
              accumulator += getDy(b, dyR, dyC, d) * dxRLerp * inverseDxCLerp;
            }

            if (r == bottomDxRIndex && c == rightDxCIndex) {
              // bottomRight
              accumulator += getDy(b, dyR, dyC, d) * dxRLerp * dxCLerp;
            }
          }
        }
        // End loop over dy

        setOutput(accumulator);
      }
    `}};function jP(r){let{inputs:e,backend:t,attrs:o}=r,{images:n,dy:s}=e,{alignCorners:i}=o,a=new Ag(s.shape,n.shape,i);return t.runWebGLProgram(a,[s],s.dtype)}var I1={kernelName:Jc,backendName:"webgl",kernelFunc:jP};var Rg=class{constructor(e,t,o,n,s){this.variableNames=["A"],this.outputShape=[];let[i,a,l,u]=e;this.outputShape=[i,t,o,u];let c=[n&&t>1?a-1:a,n&&o>1?l-1:l],p=[n&&t>1?t-1:t,n&&o>1?o-1:o],m=n?"0.5":"0.0",f;s?f="max((vec2(yRC) + vec2(0.5)) * effectiveInputOverOutputRatioRC, vec2(0.0))":f="vec2(yRC) * effectiveInputOverOutputRatioRC",this.userCode=`
      const vec2 effectiveInputOverOutputRatioRC = vec2(
          ${c[0]/p[0]},
          ${c[1]/p[1]});
      const vec2 inputShapeRC = vec2(${a}.0, ${l}.0);

      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];
        ivec2 yRC = coords.yz;

        // Fractional source index.
        vec2 sourceFracIndexRC = ${f};

        // Compute the coordinators of nearest neighbor point.
        ivec2 sourceNearestRC = ivec2(
          min(inputShapeRC - 1.0, floor(sourceFracIndexRC + ${m})));
        float newValue = getA(b, sourceNearestRC.x, sourceNearestRC.y, d);

        setOutput(newValue);
      }
    `}};var Dg=class{constructor(e,t,o,n,s){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=[];let[i,a,l,u]=e;this.outputShape=[i,t,o,u];let c=[n&&t>1?a-1:a,n&&o>1?l-1:l],p=[n&&t>1?t-1:t,n&&o>1?o-1:o],m=n?"0.5":"0.0",f;s?f="max((vec3(yRC) + vec3(0.5)) * effectiveInputOverOutputRatioRC, vec3(0.0))":f="vec3(yRC) * effectiveInputOverOutputRatioRC",this.userCode=`
      const vec3 effectiveInputOverOutputRatioRC = vec3(
          ${c[0]/p[0]},
          ${c[1]/p[1]},
          ${c[1]/p[1]});
      const vec3 inputShapeRC = vec3(${a}.0, ${l}.0,
                                     ${l}.0);

      float getAValue(int b, int r, int c, int d) {
        return getChannel(getA(b, r, c, d), vec2(c, d));
      }

      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];
        // Calculate values for next column in yRC.z.
        ivec3 yRC = coords.yzz + ivec3(0, 0, 1);

        // Fractional source index.
        vec3 sourceFracIndexRC = ${f};

        // Compute the coordinators of nearest neighbor point.
        ivec3 sourceNearestRC = ivec3(
          min(inputShapeRC - 1.0, floor(sourceFracIndexRC + ${m})));

        // Should we calculate next column and row elements in 2x2 packed cell.
        bool hasNextCol = d < ${u-1};
        bool hasNextRow = coords.z < ${o-1};

        vec4 newValue = vec4(
          getAValue(b, sourceNearestRC.x, sourceNearestRC.y, d),
          hasNextCol ? getAValue(b, sourceNearestRC.x, sourceNearestRC.y, d + 1)
                     : 0.0,
          hasNextRow ? getAValue(b, sourceNearestRC.x, sourceNearestRC.z, d)
                     : 0.0,
          (hasNextRow && hasNextCol) ?
            getAValue(b, sourceNearestRC.x, sourceNearestRC.z, d + 1) : 0.0);

        setOutput(newValue);
      }
    `}};function HP(r){let{inputs:e,backend:t,attrs:o}=r,{images:n}=e,{alignCorners:s,halfPixelCenters:i,size:a}=o,[l,u]=a,c=E().getBool("WEBGL_PACK_IMAGE_OPERATIONS")?new Dg(n.shape,l,u,s,i):new Rg(n.shape,l,u,s,i);return t.runWebGLProgram(c,[n],n.dtype)}var $1={kernelName:Ji,backendName:"webgl",kernelFunc:HP};var Fg=class{constructor(e,t,o){this.variableNames=["dy"],this.outputShape=[],this.outputShape=t;let[,n,s]=t,[,i,a]=e,l=[o&&i>1?n-1:n,o&&a>1?s-1:s],u=[o&&i>1?i-1:i,o&&a>1?a-1:a],c=l[0]/u[0],p=l[1]/u[1],m=1/c,f=1/p,d=Math.ceil(m)*2+2,g=Math.ceil(f)*2+2;this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];
        int r = coords[1];
        int c = coords[2];

        float accumulator = 0.0;

        const float heightScale = float(${c});
        const float widthScale = float(${p});

        const float invHeightScale = float(${m});
        const float invWidthScale = float(${f});

        const int winHeight = int(${d});
        const int winWidth = int(${g});

        // Compute bounds for where in dy we will look
        float startRLerp = floor(float(r) * invHeightScale);
        int startDyR = int(floor(startRLerp - float(winHeight / 2)));

        float startCLerp = floor(float(c) * invWidthScale);
        int startDyC = int(floor(startCLerp - float(winWidth / 2)));

        // Loop over dy
        for (int dyROffset = 0; dyROffset < winHeight; dyROffset++) {
          int dyR = dyROffset + startDyR;

          // Guard against the window exceeding the bounds of dy
          if (dyR < 0 || dyR >= ${i}) {
            continue;
          }

          for (int dyCOffset = 0; dyCOffset < winWidth; dyCOffset++) {
            int dyC = dyCOffset + startDyC;

            // Guard against the window exceeding the bounds of dy
            if (dyC < 0 || dyC >= ${a}) {
              continue;
            }

            float sourceFracRow =
              float(${l[0]}) *
                (float(dyR) / float(${u[0]}));

            float sourceFracCol =
                float(${l[1]}) *
                  (float(dyC) / float(${u[1]}));

            int sourceNearestRow = int(min(
                float(int(${n}) - 1),
                ${o} ? float(round(sourceFracRow)) :
                                  float(floor(sourceFracRow))));

            int sourceNearestCol = int(min(
                float(int(${s}) - 1),
                ${o} ? float(round(sourceFracCol)) :
                                  float(floor(sourceFracCol))));

            if (r == sourceNearestRow && c == sourceNearestCol) {
              accumulator += getDy(b, dyR, dyC, d);
            }
          }
        }
        // End loop over dy

        setOutput(accumulator);
      }
    `}};function qP(r){let{inputs:e,backend:t,attrs:o}=r,{images:n,dy:s}=e,{alignCorners:i}=o,a=new Fg(s.shape,n.shape,i);return t.runWebGLProgram(a,[s],s.dtype)}var A1={kernelName:Zc,backendName:"webgl",kernelFunc:qP};var Og=class{constructor(e,t){this.variableNames=["x"];let o=e.length;if(o>4)throw new Error(`WebGL backend: Reverse of rank-${o} tensor is not yet supported`);if(this.outputShape=e,o===1){this.userCode=`
        void main() {
          int coord = getOutputCoords();
          setOutput(getX(${e[0]} - coord - 1));
        }
      `;return}let n=a=>t.indexOf(a)!==-1&&e[a]!==1?`${e[a]} - coords[${a}] - 1`:`coords[${a}]`,s=e.map((a,l)=>n(l)).join(","),i=Q(o);this.userCode=`
      void main() {
        ${i} coords = getOutputCoords();
        setOutput(getX(${s}));
      }
    `}};var Pg=class{constructor(e,t){this.variableNames=["x"],this.packedInputs=!0,this.packedOutput=!0;let o=e.length;if(o>4)throw new Error(`WebGL backend: Reverse of rank-${o} tensor is not yet supported`);this.outputShape=e;let n=ke("rc",o),s=`${n[o-1]} + 1 < ${this.outputShape[o-1]}`,i=`${n[o-2]} + 1 < ${this.outputShape[o-2]}`,a=Q(o);o===1?this.userCode=`
        void main(){
          int rc = getOutputCoords();
          vec4 result = vec4(0.);
          result.r = getChannel(getX(${e[0]} - rc - 1),
            ${e[0]} - rc - 1);
          if(${s}){
              result.g = getChannel(getX(${e[0]} - (rc  + 1) - 1),
                ${e[0]} - (rc  + 1) - 1);
          }
          setOutput(result);
        }
      `:this.userCode=`
        void main() {
          ${a} rc = getOutputCoords();
          vec4 result = vec4(0.);
          result.r = ${l(n.slice())};
          if(${s}){
            result.g = ${u(n.slice())};
          }
          if(${i}) {
            result.b = ${c(n.slice())};
            if(${s}) {
              result.a = ${p(n.slice())};
            }
          }
          setOutput(result);
        }
    `;function l(d){return m(d)}function u(d){return d[o-1]="("+d[o-1]+" + 1)",m(d)}function c(d){return d[o-2]="("+d[o-2]+" + 1)",m(d)}function p(d){return d[o-1]="("+d[o-1]+" + 1)",d[o-2]="("+d[o-2]+" + 1)",m(d)}function m(d){let g=e.map((T,k)=>f(k,d)),h=g.join(","),b=g.slice(-2).join(",");return`getChannel(getX(${h}), vec2(${b}))`}function f(d,g){return t.indexOf(d)!==-1&&e[d]!==1?`${e[d]} - ${g[d]} - 1`:`${g[d]}`}}};function KP(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{dims:s}=o,i=n.shape.length,a=C.parseAxisParam(s,n.shape);if(i===0)return Ne({inputs:{x:n},backend:t});let l=E().getBool("WEBGL_PACK_ARRAY_OPERATIONS")?new Pg(n.shape,a):new Og(n.shape,a);return t.runWebGLProgram(l,[n],n.dtype)}var R1={kernelName:ra,backendName:"webgl",kernelFunc:KP};var Lg=class{constructor(e,t){this.variableNames=["Image"],this.outputShape=[],this.customUniforms=[{name:"params",type:"vec4"}];let o=e[1],n=e[2];this.outputShape=e;let s="";typeof t=="number"?s=`float outputValue = ${t.toFixed(2)};`:s=`
        vec3 fill = vec3(${t.join(",")});
        float outputValue = fill[coords[3]];`,this.userCode=`
        void main() {
          ivec4 coords = getOutputCoords();
          int x = coords[2];
          int y = coords[1];
          float coordXFloat = (float(x) - params[0]) * params[3] -
            (float(y) - params[1]) * params[2];
          float coordYFloat = (float(x) - params[0]) * params[2] +
            (float(y) - params[1]) * params[3];
          int coordX = int(round(coordXFloat + params[0]));
          int coordY = int(round(coordYFloat + params[1]));
          ${s}
          if(coordX >= 0 && coordX < ${n} && coordY >= 0 && coordY < ${o}) {
            outputValue = getImage(coords[0], coordY, coordX, coords[3]);
          }
          setOutput(outputValue);
        }
    `}};var D1={kernelName:Fa,backendName:"webgl",kernelFunc:({inputs:r,attrs:e,backend:t})=>{let{image:o}=r,{radians:n,fillValue:s,center:i}=e,a=t,l=new Lg(o.shape,s),[u,c]=N.getImageCenter(i,o.shape[1],o.shape[2]),p=[[u,c,Math.sin(n),Math.cos(n)]];return a.runWebGLProgram(l,[o],o.dtype,p)}};var XP=`
  // OpenGL ES does not support round function.
  // The algorithm is based on banker's rounding.
  float base = floor(x);
  if ((x - base) < 0.5) {
    return floor(x);
  } else if ((x - base) > 0.5) {
    return ceil(x);
  } else {
    if (mod(base, 2.0) == 0.0) {
      return base;
    } else {
      return base + 1.0;
    }
  }
`,YP=U({opSnippet:XP}),F1={kernelName:oa,backendName:"webgl",kernelFunc:YP};var QP="return inversesqrt(x);",ZP=U({opSnippet:QP,cpuKernelImpl:h0}),O1={kernelName:ko,backendName:"webgl",kernelFunc:ZP};var Ul=class{constructor(e,t,o,n,s,i,a=!0){this.variableNames=["updates","indices","defaultValue"],this.outputShape=i;let l=Q(s.length),u=Q(i.length),c="";o===1?c="i":o===2&&(c="i, j");let p=`getIndices(${c})`,m="";n===1?m="i":n===2&&(m="i, coords[1]");let f=`getUpdates(${m})`,d=t>1?"strides[j]":"strides";this.userCode=`
        ${l} strides = ${l}(${s});

        void main() {
          ${u} coords = getOutputCoords();
          float sum = 0.0;
          bool found = false;
          for (int i = 0; i < ${e}; i++) {
            int flattenedIndex = 0;
            for (int j = 0; j < ${t}; j++) {
              int index = round(${p});
              flattenedIndex += index * ${d};
            }
            if (flattenedIndex == coords[0]) {
              sum += ${f};
              found = true;
            }
          }
          setOutput(mix(getDefaultValue(), sum, float(found)));
        }
      `}};function JP(r){let{inputs:e,backend:t,attrs:o}=r,{indices:n,updates:s}=e,{shape:i}=o,{sliceRank:a,numUpdates:l,sliceSize:u,strides:c,outputSize:p}=N.calculateShapes(s,n,i),m=[p/u,u];if(p===0)return t.makeTensorInfo(i,n.dtype);let f=O({inputs:{x:n},backend:t,attrs:{shape:[l,a]}}),d=O({inputs:{x:s},backend:t,attrs:{shape:[l,u]}}),g=t.makeTensorInfo([],"float32",new Float32Array([0])),h=new Ul(l,a,f.shape.length,d.shape.length,c,m),b=t.runWebGLProgram(h,[d,f,g],d.dtype),T=O({inputs:{x:b},backend:t,attrs:{shape:i}});return t.disposeIntermediateTensorInfo(f),t.disposeIntermediateTensorInfo(d),t.disposeIntermediateTensorInfo(b),t.disposeIntermediateTensorInfo(g),T}var P1={kernelName:na,backendName:"webgl",kernelFunc:JP};var Bg=class{constructor(e,t,o,n){this.variableNames=["sortedSequence","values"],this.customUniforms=[{name:"numInputs",type:"int"}],this.outputShape=[e,o];let s="while (left < right) {",i=`for (int i = 0; i < ${Math.ceil(Math.log2(t+1))}; ++i) { if (left >= right) break;`,a=E().getNumber("WEBGL_VERSION")===2?s:i,l=n==="left"?"<":"<=";this.userCode=`
       int findBound(int batch, float value) {
         int left = 0;
         int right = numInputs;
         int mid;
         ${a}
           mid = (left + right) / 2;
           if (getSortedSequence(batch, mid) ${l} value) {
             left = mid + 1;
           } else {
             right = mid;
           }
         }
         return right;
       }

       void main() {
         ivec2 coords = getOutputCoords();
         int batch = coords[0];
         int valueIndex = coords[1];

         float value = getValues(batch, valueIndex);

         setOutput(float(findBound(batch, value)));
       }
     `}};function eL(r){let{inputs:e,backend:t,attrs:o}=r,{sortedSequence:n,values:s}=e,{side:i}=o,a=new Bg(n.shape[0],n.shape[1],s.shape[1],i),l=[[n.shape[1]]];return t.runWebGLProgram(a,[n,s],"int32",l)}var L1={kernelName:sa,backendName:"webgl",kernelFunc:eL};var Mg=class{constructor(e,t,o){this.variableNames=["c","a","b"],this.outputShape=t;let n,s;if(o>4)throw Error(`Where for rank ${o} is not yet supported`);if(o===1)s="resRC",n="resRC";else{let a=["resRC.x","resRC.y","resRC.z","resRC.w"],l=[],u=[];for(let c=0;c<t.length;c++)u.push(`${a[c]}`),c<e&&l.push(`${a[c]}`);n=l.join(),s=u.join()}let i=Q(o);this.userCode=`
      void main() {
        ${i} resRC = getOutputCoords();
        float cVal = getC(${n});
        if (cVal >= 1.0) {
          setOutput(getA(${s}));
        } else {
          setOutput(getB(${s}));
        }
      }
    `}};function tL(r){let{inputs:e,backend:t}=r,{condition:o,t:n,e:s}=e,i=new Mg(o.shape.length,n.shape,n.shape.length);return t.runWebGLProgram(i,[o,n,s],Ge(n.dtype,s.dtype))}var B1={kernelName:ia,backendName:"webgl",kernelFunc:tL};var rL=`
  // Stable and Attracting Fixed Point (0, 1) for Normalized Weights.
  // see: https://arxiv.org/abs/1706.02515
  float scaleAlpha = ${N.SELU_SCALEALPHA};
  float scale = ${N.SELU_SCALE};
  return (x >= 0.0) ? scale * x : scaleAlpha * (exp(x) - 1.0);
`,oL=U({opSnippet:rL}),M1={kernelName:aa,backendName:"webgl",kernelFunc:oL};var nL=Bt+`
  return 1.0 / (1.0 + exp(-1.0 * x));
`,sL=`
  vec4 result = 1.0 / (1.0 + exp(-1.0 * x));
  bvec4 isNaN = isnan(x);

  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`,iL=U({opSnippet:nL,packedOpSnippet:sL,cpuKernelImpl:x0}),V1={kernelName:No,backendName:"webgl",kernelFunc:iL};var aL=`
  if (isnan(x)) { return 0.0; }
  return sign(x);
`,lL=U({opSnippet:aL}),G1={kernelName:ca,backendName:"webgl",kernelFunc:lL};var uL=Bt+`
  return sin(x);
`,cL=U({opSnippet:uL}),z1={kernelName:la,backendName:"webgl",kernelFunc:cL};var pL=`
  float e2x = exp(x);
  return (e2x - 1.0 / e2x) / 2.0;
`,mL=U({opSnippet:pL}),U1={kernelName:ua,backendName:"webgl",kernelFunc:mL};var fL=`
  float epsilon = 1.1920928955078125e-7;
  float threshold = log(epsilon) + 2.0;

  bool too_large = x > -threshold;
  bool too_small = x < threshold;

  float result;
  float exp_x = exp(x);

  if (too_large){
    result = x;
  }
  else if (too_small){
    result = exp_x;
  }
  else{
    result = log(exp_x + 1.0);
  }
  return result;
`,dL=U({opSnippet:fL}),W1={kernelName:pa,backendName:"webgl",kernelFunc:dL};var hL=r=>{let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{blockShape:s,paddings:i}=o;C.assert(n.shape.length<=4,()=>"spaceToBatchND for rank > 4 with a WebGL backend not implemented yet");let a=s.reduce((b,T)=>b*T),l=[[0,0]];l.push(...i);for(let b=1+s.length;b<n.shape.length;++b)l.push([0,0]);let u=[],c=Sg({inputs:{x:n},backend:t,attrs:{paddings:l,constantValue:0}}),p=N.getReshaped(c.shape,s,a,!1),m=N.getPermuted(p.length,s.length,!1),f=N.getReshapedPermuted(c.shape,s,a,!1),d=O({inputs:{x:c},backend:t,attrs:{shape:p}}),g=ye({inputs:{x:d},backend:t,attrs:{perm:m}}),h=O({inputs:{x:g},backend:t,attrs:{shape:f}});return u.push(c),u.push(d),u.push(g),u.forEach(b=>t.disposeIntermediateTensorInfo(b)),h},j1={kernelName:fa,backendName:"webgl",kernelFunc:hL};function gL(r){let{inputs:e,backend:t}=r,{indices:o,values:n,denseShape:s,defaultValue:i}=e;if(s.shape.length!==1)throw new Error(`Dense shape must be a vector, saw:
         ${s.shape}`);if(o.shape.length!==2)throw new Error(`Indices must be a matrix, saw:
         ${o.shape}`);if(n.shape.length!==1)throw new Error(`Values must be a vector, saw:
         ${n.shape}`);if(i.shape.length!==0)throw new Error(`Default value must be a scalar, saw:
        ${i.shape}`);let a=t.readSync(o.dataId),l=t.readSync(n.dataId),u=t.readSync(s.dataId),c=t.readSync(i.dataId)[0],[p,m,f,d,g]=b0(a,o.shape,o.dtype,l,n.dtype,u,c);return[t.makeTensorInfo(m,o.dtype,p),t.makeTensorInfo([m[0]],n.dtype,f),t.makeTensorInfo([d.length],"bool",new Uint8Array(d.map(h=>Number(h)))),t.makeTensorInfo([g.length],o.dtype,new Int32Array(g))]}var H1={kernelName:ga,backendName:"webgl",kernelFunc:gL};function xL(r){let{inputs:e,backend:t}=r,{inputIndices:o,inputShape:n,newShape:s}=e;if(o.shape.length!==2)throw new Error(`Input indices should be a matrix but received shape ${o.shape}`);if(n.shape.length!==1)throw new Error(`Input shape should be a vector but received shape ${n.shape}`);if(s.shape.length!==1)throw new Error(`Target shape should be a vector but received shape ${s.shape}`);let i=Array.from(t.readSync(n.dataId)),a=t.readSync(o.dataId),l=Array.from(t.readSync(s.dataId)),[u,c,p]=_0(a,o.shape,o.dtype,i,l);return[t.makeTensorInfo(c,o.dtype,u),t.makeTensorInfo([p.length],s.dtype,new Int32Array(p))]}var q1={kernelName:xa,backendName:"webgl",kernelFunc:xL};function yL(r){let{inputs:e,backend:t}=r,{data:o,indices:n,segmentIds:s}=e;if(o.shape.length<1)throw new Error("Data should be at least 1 dimensional but received scalar");if(n.shape.length!==1)throw new Error(`Indices should be a vector but received shape
              ${n.shape}`);if(s.shape.length!==1)throw new Error(`Segment ids should be a vector but received shape
              ${s.shape}`);let i=t.readSync(o.dataId),a=t.readSync(n.dataId),l=t.readSync(s.dataId),[u,c]=Ju(i,o.shape,o.dtype,a,l,!0);return t.makeTensorInfo(c,o.dtype,u)}var K1={kernelName:ya,backendName:"webgl",kernelFunc:yL};function bL(r){let{inputs:e,backend:t}=r,{data:o,indices:n,segmentIds:s}=e;if(o.shape.length<1)throw new Error("Data should be at least 1 dimensional but received scalar");if(n.shape.length!==1)throw new Error(`Indices should be a vector but received shape
             ${n.shape}`);if(s.shape.length!==1)throw new Error(`Segment ids should be a vector but received shape
             ${s.shape}`);let i=t.readSync(o.dataId),a=t.readSync(n.dataId),l=t.readSync(s.dataId),[u,c]=Ju(i,o.shape,o.dtype,a,l);return t.makeTensorInfo(c,o.dtype,u)}var X1={kernelName:ba,backendName:"webgl",kernelFunc:bL};function _L(r){let{inputs:e,backend:t,attrs:o}=r,{sparseIndices:n,sparseValues:s,defaultValue:i}=e,{outputShape:a}=o,{sliceRank:l,numUpdates:u,sliceSize:c,strides:p,outputSize:m}=N.calculateShapes(s,n,a),f=!1;if(s.dtype==="string"){let b=t.bufferSync(n),T=t.bufferSync(s),k=C.decodeString(t.readSync(i.dataId)[0]),S=g0(b,T,a,m,c,u,l,p,k,f);return t.makeTensorInfo(a,S.dtype,S.values)}let d=new Ul(u,l,n.shape.length,s.shape.length,p,[m,1],f),g=t.runWebGLProgram(d,[s,n,i],s.dtype),h=O({inputs:{x:g},backend:t,attrs:{shape:a}});return t.disposeIntermediateTensorInfo(g),h}var Y1={kernelName:_a,backendName:"webgl",kernelFunc:_L};function wL(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{numOrSizeSplits:s,axis:i}=o,a=C.parseAxisParam(i,n.shape)[0],l=N.prepareSplitSize(n,s,a),u=n.shape.length,c=new Array(u).fill(0),p=n.shape.slice();return l.map(m=>{let f=[...p];f[a]=m;let d=tr({inputs:{x:n},backend:t,attrs:{begin:c,size:f}});return c[a]+=m,d})}var Q1={kernelName:da,backendName:"webgl",kernelFunc:wL};var Z1="return sqrt(x);",vL=U({opSnippet:Z1,packedOpSnippet:Z1,cpuKernelImpl:w0}),J1={kernelName:So,backendName:"webgl",kernelFunc:vL};var TL="return x * x;",CL=U({opSnippet:TL}),eC={kernelName:ep,backendName:"webgl",kernelFunc:CL};var tC="return (a - b) * (a - b);",kL=ce({opSnippet:tC,packedOpSnippet:tC}),rC={kernelName:Eo,backendName:"webgl",kernelFunc:kL};function NL({inputs:r,attrs:e,backend:t}){let{x:o}=r,n=Re+`
    return x > 0.0 ? 1.0 : float(${e.alpha});
  `,s=new st(o.shape,n);return t.runWebGLProgram(s,[o],o.dtype)}var oC={kernelName:Da,backendName:"webgl",kernelFunc:NL};var Vg=class{constructor(e,t,o){this.variableNames=["x"],this.outputShape=o;let n=o.length,s=Q(o.length),i=Q(o.length),a="";if(n===1)a="coords * strides + begin";else{let l=0;a=o.map((u,c)=>(l++,o.length===1?`coords * strides[${c}] + begin[${c}]`:`coords[${l-1}] * strides[${c}] + begin[${c}]`)).join(",")}this.userCode=`
      ${s} begin = ${s}(${e});
      ${s} strides = ${s}(${t});

      void main() {
        ${i} coords = getOutputCoords();
        setOutput(getX(${a}));
      }
    `}};function SL(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{begin:s,end:i,strides:a,beginMask:l,endMask:u,ellipsisMask:c,newAxisMask:p,shrinkAxisMask:m}=o,{finalShapeSparse:f,finalShape:d,isIdentity:g,sliceDim0:h,isSimpleSlice:b,begin:T,end:k,strides:S}=tt.sliceInfo(n.shape,s,i,a,l,u,c,p,m),I;if(g)I=O({inputs:{x:n},backend:t,attrs:{shape:d}});else if(h||b){C.assert(n.shape.length>=1,()=>`Input must have rank at least 1, got: ${n.shape.length}`);let R=tt.computeOutShape(T,k,S),D=tr({inputs:{x:n},backend:t,attrs:{begin:T,size:R}});I=O({inputs:{x:D},backend:t,attrs:{shape:d}}),t.disposeIntermediateTensorInfo(D)}else if(t.shouldExecuteOnCPU([n])){let D=t.readSync(n.dataId),P=te(n.shape,n.dtype,D),L=v0(f,P,S,T);I=t.makeTensorInfo(d,n.dtype,L.values)}else{let D=new Vg(T,S,f);I=t.runWebGLProgram(D,[n],n.dtype)}let A=O({inputs:{x:I},backend:t,attrs:{shape:d}});return t.disposeIntermediateTensorInfo(I),A}var nC={kernelName:wa,backendName:"webgl",kernelFunc:SL};function EL(r){let{inputs:e,backend:t,attrs:o}=r,{separator:n,nGramWidths:s,leftPad:i,rightPad:a,padWidth:l,preserveShortSequences:u}=o,{data:c,dataSplits:p}=e,m=t.readSync(c.dataId),f=t.readSync(p.dataId),[d,g]=T0(m,f,n,s,i,a,l,u);return[t.makeTensorInfo([d.length],"string",d),t.makeTensorInfo(p.shape,"int32",g)]}var sC={kernelName:va,backendName:"webgl",kernelFunc:EL};function IL(r){let{inputs:e,backend:t,attrs:o}=r,{skipEmpty:n}=o,{input:s,delimiter:i}=e;if(s.dtype!=="string")throw new Error("Input must be of datatype string");if(s.shape.length!==1)throw new Error(`Input must be a vector, got shape: ${s.shape}`);if(i.shape.length!==0)throw new Error(`Delimiter must be a scalar, got shape: ${i.shape}`);let a=t.readSync(s.dataId),l=t.readSync(i.dataId)[0],[u,c,p]=C0(a,l,n),m=c.length;return[t.makeTensorInfo([m,2],"int32",u),t.makeTensorInfo([m],"string",c),t.makeTensorInfo([2],"int32",new Int32Array(p))]}var iC={kernelName:Ta,backendName:"webgl",kernelFunc:IL};function $L(r){let{inputs:e,backend:t,attrs:o}=r,{numBuckets:n}=o,{input:s}=e;if(s.dtype!=="string")throw new Error("Input must be of datatype string");if(n<=0)throw new Error("Number of buckets must be at least 1");let i=t.readSync(s.dataId),a=k0(i,n);return t.makeTensorInfo(s.shape,"int32",a)}var aC={kernelName:Ca,backendName:"webgl",kernelFunc:$L};var AL="return tan(x);",RL=U({opSnippet:AL}),lC={kernelName:ka,backendName:"webgl",kernelFunc:RL};var DL=`
  float e2x = exp(-2.0 * abs(x));
  return sign(x) * (1.0 - e2x) / (1.0 + e2x);
`,FL=U({opSnippet:DL}),uC={kernelName:Na,backendName:"webgl",kernelFunc:FL};var Gg=class{constructor(e,t){this.variableNames=["A"];let o=new Array(e.length);for(let i=0;i<o.length;i++)o[i]=e[i]*t[i];this.outputShape=o,this.rank=o.length;let n=Q(this.rank),s=OL(e);this.userCode=`
      void main() {
        ${n} resRC = getOutputCoords();
        setOutput(getA(${s}));
      }
    `}};function OL(r){let e=r.length;if(e>5)throw Error(`Tile for rank ${e} is not yet supported`);if(e===1)return`imod(resRC, ${r[0]})`;let t=["resRC.x","resRC.y","resRC.z","resRC.w","resRC.u"],o=[];for(let n=0;n<r.length;n++)o.push(`imod(${t[n]}, ${r[n]})`);return o.join()}function zg(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{reps:s}=o;if(n.dtype==="string"||n.shape.length>5){let l=t.readSync(n.dataId),u=n.dtype==="string"?l.map(m=>C.decodeString(m)):l,c=te(n.shape,n.dtype,u),p=S0(c,s);return t.makeTensorInfo(p.shape,p.dtype,p.values)}let i=new Gg(n.shape,s);return t.runWebGLProgram(i,[n],n.dtype)}var cC={kernelName:$o,backendName:"webgl",kernelFunc:zg};var Ug=class{constructor(e){this.variableNames=["x","indices"],this.customUniforms=[{name:"n",type:"int"},{name:"firstPass",type:"int"},{name:"negativeInf",type:"float"},{name:"dir",type:"int"},{name:"inc",type:"int"}],this.outputShape=e,this.userCode=`
       void main() {
         ivec2 coords = getOutputCoords();
         int batch = coords[0];
         int elemIdx = coords[1];

         // We compare elements pair-wise within a group of size 2 * inc.
         // The comparing rule for each group alternates between ascending
         // and descending. Within each group, we compare each pair at
         // positions i and i+inc. To decide whether an element at position i
         // is x0 or x1, we mod it by 2 * inc, if the result is smaller than
         // inc, it is in the first half of the group, we denote it as x0,
         // otherwise we denote it as x1.
         // For example, as shown in the Bitonic top K paper referenced above,
         // Figure5(a) shows that element[1] is in the
         // second half of the group when group size is 2, but it is in the
         // first half of the group when group size is 4.

         bool isFirstInPair = imod(elemIdx, 2 * inc) < inc;
         int i = isFirstInPair ? elemIdx : elemIdx - inc;

         int i0 = firstPass == 1 ? i : int(getIndices(batch, i));
         int i1 = firstPass == 1 ? i + inc : int(getIndices(batch, i + inc));
         float x0 = i0 < n ? getX(batch, i0) : negativeInf;
         float x1 = i1 < n ? getX(batch, i1) : negativeInf;

         // Denotes which direction indices are in (ascending or descending).
         bool reverse = imod(elemIdx, 2 * dir) >= dir;
         bool isGreater = x0 > x1 || (x0 == x1 && i1 > i0);
         if (reverse == isGreater) { // Elements in opposite order of direction
           int iTemp = i0;
           i0 = i1;
           i1 = iTemp;
         }
         if (isFirstInPair) {
            setOutput(float(i0));
         } else {
            setOutput(float(i1));
         }
       }
     `}},Wg=class{constructor(e){this.variableNames=["x","indices"],this.customUniforms=[{name:"n",type:"int"},{name:"firstPass",type:"int"},{name:"k",type:"int"}],this.outputShape=e,this.userCode=`
    void main() {
         // Takes max of indices (0, k), (1, k + 1), (2, k + 2) ...
         ivec2 coords = getOutputCoords();
         int batch = coords[0];
         int elemIdx = coords[1];

         // The output size is half of the previous size.
         // If the previous sequence is | | | | _ _ _ _  | | | |  _ _ _ _ (k=4),
         // we only need to output the indices at positions |, the indices at
         // positions _ can be thrown away, see Figure5(b) After Phase 2
         // (Merge phase) in the Bitonic Top K paper referenced above.
         // For example, the paper shows we only need to output the orange bars.
         // The output sequence should look like this | | | | | | | |.
         // Because the sequence is halved, to map the output index back
         // to the previous sequence to find the corresponding value,
         // we need to double the index. When we double the index,
         // we basically interpolate a position, so 2i looks like
         // | _ | _ | _ | _ | _ | _ | _. We move the | to the first k position
         // of each 2k positions by - elemIdx % k. E.g. for output at
         // index 4,5,6,7, we want to get the corresponding element at
         // original index 8,9,10,11, for output at index 8,9,10,11,
         // we want to get the corresponding element at original index
         // 16,17,18,19, so on and so forth.

         int i = elemIdx < k ? elemIdx : (elemIdx * 2 - imod(elemIdx, k));
         int i0 = firstPass == 1 ? i : int(getIndices(batch, i));
         int i1 = firstPass == 1 ? i + k : int(getIndices(batch, i + k));

         float x0 = getX(batch, i0);
         float x1 = i1 < n ? getX(batch, i1) : x0;

         setOutput(x0 >= x1 ? float(i0) : float(i1));
       }
     `}};function yn(r,e){e!==null&&r.disposeIntermediateTensorInfo(e)}function pC(r){let e=1;for(;e<r;)e*=2;return e}function PL(r){let{inputs:e,backend:t,attrs:o}=r,{x:n}=e,{k:s,sorted:i}=o,a=E().getNumber("TOPK_LAST_DIM_CPU_HANDOFF_SIZE_THRESHOLD"),l=E().getNumber("TOPK_K_CPU_HANDOFF_THRESHOLD"),u=n.shape,c=u[u.length-1];if(t.shouldExecuteOnCPU([n])||c<a||s>l){let L=t.readSync(n.dataId),[z,B]=E0(L,u,n.dtype,s,i);return[t.makeTensorInfo(z.shape,z.dtype,z.values),t.makeTensorInfo(B.shape,B.dtype,B.values)]}if(s===0)return u[u.length-1]=0,[t.makeTensorInfo(u,n.dtype,[]),t.makeTensorInfo(u,"int32",[])];if(c===1)return[n,Mr({attrs:{shape:u,dtype:"int32",value:0},backend:t})];let p=t.texData.get(n.dataId),m=p!==null&&p.isPacked,f=m?t.unpackTensor(n):n,g=C.sizeFromShape(u)/c,h=O({inputs:{x:f},attrs:{shape:[g,c]},backend:t});m&&yn(t,f);let b=pC(s),T=pC(c),k=null,S=()=>k===null?[h,h]:[h,k],I=(L,z,B)=>{let K=S(),W=new Ug(B),se=[[c],[k===null?1:0],[Number.NEGATIVE_INFINITY],[L],[z]],me=k;k=t.runWebGLProgram(W,K,"int32",se),yn(t,me)};for(let L=1;L<b;L*=2){let z=L*2;for(let B=L;B>=1;B/=2)I(z,B,[g,T])}for(let L=T;L>b;L/=2){let z=S(),B=new Wg([g,L/2]),W=[[c],[k===null?1:0],[b]],X=k;k=t.runWebGLProgram(B,z,"int32",W),yn(t,X);let se=b/2,me=se*2;for(let fe=se;fe>=1;fe/=2)I(me,fe,k.shape)}let A=k;k=tr({inputs:{x:k},backend:t,attrs:{begin:0,size:[g,s]}}),yn(t,A);let R=pg({inputs:{x:h,indices:k},backend:t,attrs:{axis:1,batchDims:1}});yn(t,h);let D=u.slice(0,-1);D.push(s),A=k,k=O({inputs:{x:k},attrs:{shape:D},backend:t}),yn(t,A);let P=R;return R=O({inputs:{x:R},attrs:{shape:D},backend:t}),yn(t,P),[R,k]}var mC={kernelName:Sa,backendName:"webgl",kernelFunc:PL};var jg=class{constructor(e,t,o,n,s,i){this.variableNames=["Image","Transforms"],this.outputShape=i;let a=o==="nearest"?1:2,l;switch(n){case"constant":l=1;break;case"reflect":l=2;break;case"wrap":l=3;break;case"nearest":l=4;break;default:l=1;break}this.userCode=`
            float mapCoord(float outCoord, float len) {
              float inCoord = outCoord;
              if(${l} == 2) {
                if (inCoord < 0.0) {
                  if (len <= 1.0) {
                    inCoord = 0.0;
                  } else {
                    float sz2 = 2.0 * len;
                    if (inCoord < sz2) {
                      inCoord = sz2 * float(int(float(-inCoord / sz2))) +
                      inCoord;
                    }
                    inCoord = inCoord < -len ? inCoord + sz2 : -inCoord - 1.0;
                  }
                } else if (inCoord > len - 1.0) {
                  if (len <= 1.0) {
                    inCoord = 0.0;
                  } else {
                    float sz2 = 2.0 * len;
                    inCoord -= sz2 * float(int(float(inCoord / sz2)));
                    if (inCoord >= len) {
                      inCoord = sz2 - inCoord - 1.0;
                    }
                  }
                }
                return clamp(inCoord, 0.0, len - 1.0);
              } else if (${l} == 3) {
                if (inCoord < 0.0) {
                  if (len <= 1.0) {
                    inCoord = 0.0;
                  } else {
                    float sz = len - 1.0;
                    inCoord += len * (float(int(float(-inCoord / sz))) + 1.0);
                  }
                } else if (inCoord > len - 1.0) {
                  if (len <= 1.0) {
                    inCoord = 0.0;
                  } else {
                    float sz = len - 1.0;
                    inCoord -= len * float(int(float(inCoord / sz)));
                  }
                }
                return clamp(inCoord, 0.0, len - 1.0);
              } else if (${l} == 4) {
                return clamp(outCoord, 0.0, len - 1.0);
              } else {
                return outCoord;
              }
            }

            float readWithFillValue(int batch, int coordY, int coordX,
              int channel) {
              float outputValue;
              if (0 <= coordY && coordY < ${e} && 0 <= coordX && coordX < ${t}) {
                  outputValue = getImage(batch, coordY, coordX, channel);
              } else {
                outputValue = float(${s});
              }
              return outputValue;
            }

            void main() {
              ivec4 coords = getOutputCoords();
              float outputValue;
              int batch = coords[0];
              int x = coords[2];
              int y = coords[1];
              int channel = coords[3];
              float xf = float(x);
              float yf = float(y);
              float a1 = getTransforms(batch, 0);
              float a2 = getTransforms(batch, 1);
              float a3 = getTransforms(batch, 2);
              float b1 = getTransforms(batch, 3);
              float b2 = getTransforms(batch, 4);
              float b3 = getTransforms(batch, 5);
              float c1 = getTransforms(batch, 6);
              float c2 = getTransforms(batch, 7);
              float projection = c1 * xf + c2 * yf + 1.0;
              if (projection == 0.0) {
                outputValue = float(${s});
              } else {
                float inX = (a1 * xf + a2 * yf + a3) / projection;
                float inY = (b1 * xf + b2 * yf + b3) / projection;
                float mapX = mapCoord(inX, float(${t}));
                float mapY = mapCoord(inY, float(${e}));

                if (${a} == 1) {
                  int coordY = int(round(mapY));
                  int coordX = int(round(mapX));
                  outputValue = readWithFillValue(batch, coordY, coordX,
                    channel);
                } else {
                  float yFloor = floor(mapY);
                  float xFloor = floor(mapX);
                  float yCeil = yFloor + 1.0;
                  float xCeil = xFloor + 1.0;
                  float valueYFloor = (xCeil - mapX) *
                  readWithFillValue(batch, int(yFloor), int(xFloor), channel) +
                  (mapX - xFloor) *
                  readWithFillValue(batch, int(yFloor), int(xCeil), channel);
                  float valueYCeil = (xCeil - mapX) *
                  readWithFillValue(batch, int(yCeil), int(xFloor), channel) +
                  (mapX - xFloor) *
                  readWithFillValue(batch, int(yCeil), int(xCeil), channel);
                  outputValue = (yCeil - mapY) * valueYFloor +
                  (mapY - yFloor) * valueYCeil;
                }
              }
              setOutput(outputValue);
            }
        `}};function LL(r){let{inputs:e,backend:t,attrs:o}=r,{image:n,transforms:s}=e,{interpolation:i,fillMode:a,fillValue:l,outputShape:u}=o,[c,p,m,f]=n.shape,[d,g]=u!=null?u:[p,m],h=[c,d,g,f],b=new jg(p,m,i,a,l,h);return t.runWebGLProgram(b,[n,s],"float32")}var fC={kernelName:Ea,backendName:"webgl",kernelFunc:LL};function BL(r){let{inputs:e,attrs:t,backend:o}=r,{axis:n}=t,{x:s}=e;Zt(s,"unique"),console.warn("WARNING: ","UI might be locked temporarily as data is being downloaded");let i=o.readSync(s.dataId),{outputValues:a,outputShape:l,indices:u}=I0(i,n,s.shape,s.dtype);return[o.makeTensorInfo(l,s.dtype,a),o.makeTensorInfo([u.length],"int32",u)]}var dC={kernelName:Ia,backendName:"webgl",kernelFunc:BL};function ML(r){let{inputs:e,backend:t,attrs:o}=r,{value:n}=e,{axis:s}=o;s<0&&(s+=n.shape.length);let i=n,a=i.shape.length,l=n.shape[s],u=new Array(a-1),c=0;for(let g=0;g<a;g++)g!==s&&(u[c++]=i.shape[g]);let p=[],m=new Array(a).fill(0),f=i.shape.slice();f[s]=1;let d=new Array(l);for(let g=0;g<d.length;g++){m[s]=g;let h=tr({inputs:{x:i},backend:t,attrs:{begin:m,size:f}}),b=O({inputs:{x:h},backend:t,attrs:{shape:u}});d[g]=b,p.push(h)}return p.forEach(g=>t.disposeIntermediateTensorInfo(g)),d}var hC={kernelName:$a,backendName:"webgl",kernelFunc:ML};var Hg=class{constructor(e,t){this.variableNames=["x","segmentIds"];let o=e.windowSize,n=e.batchSize,s=e.inSize,i=e.numSegments,a=i*Math.ceil(s/o);this.outputShape=[n,a];let l="0.0",u="sumValue",c=Math.floor(o/4)*4,p=o%4,m=`
        sumValue += dot(values, segFilter);
    `,f="";s%o>0&&(f=`
        if (inIdx < 0 || inIdx >= ${s}) {
          return initializationValue;
        }
      `);let d="";s%o>0&&(d=`
        if (inIdx < 0 || inIdx >= ${s}) {
          return -1.0;
        }
      `),this.userCode=`
      const float initializationValue = ${l};

      float getValue(int batch, int inIdx) {
        ${f}
        return getX(batch, inIdx);
      }

      float getSegmentIdAtIndex(int inIdx) {
        ${d}
        return getSegmentIds(inIdx);
      }

      void main() {
        ivec2 coords = getOutputCoords();
        int batch = coords[0];
        int outIdx = coords[1];
        int inOffset = int(floor(float(outIdx) / float(
          ${i})) * float(${o}));
        int currentSeg = int(mod(float(outIdx), float(${i})));

        float sumValue = 0.0;

        for (int i = 0; i < ${c}; i += 4) {
          int inIdx = inOffset + i;
          vec4 values = vec4(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            getValue(batch, inIdx + 2),
            getValue(batch, inIdx + 3)
          );

          vec4 segFilter = vec4(
            int(getSegmentIdAtIndex(inIdx)) == currentSeg ? 1 : 0,
            int(getSegmentIdAtIndex(inIdx + 1)) == currentSeg ? 1 : 0,
            int(getSegmentIdAtIndex(inIdx + 2)) == currentSeg ? 1 : 0,
            int(getSegmentIdAtIndex(inIdx + 3)) == currentSeg ? 1 : 0
          );

          ${m}
        }

        int inIdx = inOffset + ${c};
        if (${p===1}) {
          vec4 values = vec4(
            getValue(batch, inIdx),
            initializationValue,
            initializationValue,
            initializationValue
          );

          int inIdxSeg = int(getSegmentIdAtIndex(inIdx));

          vec4 segFilter = vec4(
            int(getSegmentIdAtIndex(inIdx)) == currentSeg ? 1 : 0,
            0,
            0,
            0
          );

          ${m}
        } else if (${p===2}) {
          vec4 values = vec4(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            initializationValue,
            initializationValue
          );

          vec4 segFilter = vec4(
            int(getSegmentIdAtIndex(inIdx)) == currentSeg ? 1 : 0,
            int(getSegmentIdAtIndex(inIdx + 1)) == currentSeg ? 1 : 0,
              0,
              0
          );

          ${m}
        } else if (${p===3}) {
          vec4 values = vec4(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            getValue(batch, inIdx + 2),
            initializationValue
          );

          vec4 segFilter = vec4(
            int(getSegmentIdAtIndex(inIdx)) == currentSeg ? 1 : 0,
            int(getSegmentIdAtIndex(inIdx + 1)) == currentSeg ? 1 : 0,
            int(getSegmentIdAtIndex(inIdx + 2)) == currentSeg ? 1 : 0,
            0
          );

          ${m}
        }
        setOutput(${u});
      }
    `}};function VL(r){let{inputs:e,backend:t,attrs:o}=r,{x:n,segmentIds:s}=e,{numSegments:i}=o,a=n.shape.length,l=[],u=0,c=N.getAxesPermutation([u],a),p=n;c!=null&&(p=ye({inputs:{x:n},backend:t,attrs:{perm:c}}),l.push(p),u=N.getInnerMostAxes(1,a)[0]);let m=N.segment_util.computeOutShape(p.shape,u,i),f=C.sizeFromShape([p.shape[u]]),d=O({inputs:{x:p},backend:t,attrs:{shape:[-1,f]}});l.push(d);let g=jr(n.dtype),h=(S,I,A,R,D)=>{let P=S.shape[0],L=S.shape[1],z=N.segment_util.segOpComputeOptimalWindowSize(L,D),B={windowSize:z,inSize:L,batchSize:P,numSegments:D},K=new Hg(B,I),W=t.compileAndRun(K,[S,A],R);if(l.push(W),W.shape[1]===D)return W;let X=Eg({backend:t,attrs:{start:0,stop:D,step:1,dtype:"float32"}}),se=zg({inputs:{x:X},backend:t,attrs:{reps:[L/z]}});return l.push(X),l.push(se),h(W,I,se,R,D)},b=h(d,"unsortedSegmentSum",s,g,i),T=O({inputs:{x:b},backend:t,attrs:{shape:m}}),k=T;if(c!=null){l.push(T);let S=N.getUndoAxesPermutation(c);k=ye({inputs:{x:k},backend:t,attrs:{perm:S}})}return l.forEach(S=>t.disposeIntermediateTensorInfo(S)),k}var gC={kernelName:Aa,backendName:"webgl",kernelFunc:VL};var GL=[rv,nv,sv,iv,lv,uv,cv,pv,dv,hv,gv,xv,yv,bv,_v,wv,vv,Tv,Cv,kv,Nv,Ev,Iv,$v,Fv,Pv,Lv,H0,Mv,Gv,zv,Uv,Wv,jv,Hv,qv,Kv,Xv,Yv,Jv,eT,tT,rT,oT,nT,sT,iT,aT,lT,uT,cT,pT,mT,fT,dT,gT,xT,yT,bT,wT,vT,TT,CT,kT,NT,ST,ET,IT,j0,$T,Vv,AT,RT,DT,q0,FT,OT,PT,LT,BT,MT,VT,GT,zT,UT,jT,HT,qT,KT,XT,YT,ZT,e1,t1,r1,o1,n1,u1,Y0,c1,p1,m1,f1,Av,d1,x1,y1,b1,_1,K0,w1,v1,T1,C1,Rv,s1,k1,N1,S1,Z0,E1,I1,$1,A1,R1,D1,F1,O1,P1,L1,B1,M1,V1,G1,z1,U1,Sv,l1,W1,j1,H1,q1,K1,X1,Y1,Q1,J1,eC,rC,oC,nC,sC,iC,aC,a1,ev,lC,uC,cC,mC,fC,tv,dC,hC,gC,h1];for(let r of GL)Zl(r);var zL=E();zL.registerFlag("KEEP_INTERMEDIATE_TENSORS",()=>!1,r=>{r&&console.warn("Keep intermediate tensors is ON. This will print the values of all intermediate tensors during model inference. Not all models support this mode. For details, check e2e/benchmarks/ model_config.js. This significantly impacts performance.")});var St;(function(r){r[r.DT_INVALID=0]="DT_INVALID",r[r.DT_FLOAT=1]="DT_FLOAT",r[r.DT_DOUBLE=2]="DT_DOUBLE",r[r.DT_INT32=3]="DT_INT32",r[r.DT_UINT8=4]="DT_UINT8",r[r.DT_INT16=5]="DT_INT16",r[r.DT_INT8=6]="DT_INT8",r[r.DT_STRING=7]="DT_STRING",r[r.DT_COMPLEX64=8]="DT_COMPLEX64",r[r.DT_INT64=9]="DT_INT64",r[r.DT_BOOL=10]="DT_BOOL",r[r.DT_QINT8=11]="DT_QINT8",r[r.DT_QUINT8=12]="DT_QUINT8",r[r.DT_QINT32=13]="DT_QINT32",r[r.DT_BFLOAT16=14]="DT_BFLOAT16",r[r.DT_QINT16=15]="DT_QINT16",r[r.DT_QUINT16=16]="DT_QUINT16",r[r.DT_UINT16=17]="DT_UINT16",r[r.DT_COMPLEX128=18]="DT_COMPLEX128",r[r.DT_HALF=19]="DT_HALF",r[r.DT_RESOURCE=20]="DT_RESOURCE",r[r.DT_VARIANT=21]="DT_VARIANT",r[r.DT_UINT32=22]="DT_UINT32",r[r.DT_UINT64=23]="DT_UINT64",r[r.DT_FLOAT_REF=101]="DT_FLOAT_REF",r[r.DT_DOUBLE_REF=102]="DT_DOUBLE_REF",r[r.DT_INT32_REF=103]="DT_INT32_REF",r[r.DT_UINT8_REF=104]="DT_UINT8_REF",r[r.DT_INT16_REF=105]="DT_INT16_REF",r[r.DT_INT8_REF=106]="DT_INT8_REF",r[r.DT_STRING_REF=107]="DT_STRING_REF",r[r.DT_COMPLEX64_REF=108]="DT_COMPLEX64_REF",r[r.DT_INT64_REF=109]="DT_INT64_REF",r[r.DT_BOOL_REF=110]="DT_BOOL_REF",r[r.DT_QINT8_REF=111]="DT_QINT8_REF",r[r.DT_QUINT8_REF=112]="DT_QUINT8_REF",r[r.DT_QINT32_REF=113]="DT_QINT32_REF",r[r.DT_BFLOAT16_REF=114]="DT_BFLOAT16_REF",r[r.DT_QINT16_REF=115]="DT_QINT16_REF",r[r.DT_QUINT16_REF=116]="DT_QUINT16_REF",r[r.DT_UINT16_REF=117]="DT_UINT16_REF",r[r.DT_COMPLEX128_REF=118]="DT_COMPLEX128_REF",r[r.DT_HALF_REF=119]="DT_HALF_REF",r[r.DT_RESOURCE_REF=120]="DT_RESOURCE_REF",r[r.DT_VARIANT_REF=121]="DT_VARIANT_REF",r[r.DT_UINT32_REF=122]="DT_UINT32_REF",r[r.DT_UINT64_REF=123]="DT_UINT64_REF"})(St||(St={}));var xC;(function(r){let e;(function(t){t[t.LEGACY=0]="LEGACY",t[t.V1=1]="V1",t[t.V2=2]="V2"})(e=r.CheckpointFormatVersion||(r.CheckpointFormatVersion={}))})(xC||(xC={}));var UL={};function dc(r){return UL[r]}function x(r,e,t,o,n){let s=e.inputParams[r];if(s&&s.inputIndexStart!==void 0){let a=s.inputIndexStart,l=s.inputIndexEnd===0?void 0:s.inputIndexEnd===void 0?a+1:s.inputIndexEnd;if(s.type==="tensor")return Pe(e.inputNames[s.inputIndexStart],t,o,n);if(s.type==="tensors")return e.inputNames.slice(a,l).map(m=>Pe(m,t,o,n));let u=Pe(e.inputNames.slice(a)[0],t,o,n),c=u.dataSync();return s.type==="number"?c[0]:C.toNestedArray(u.shape,c)}let i=e.attrParams[r];return i&&i.value}function Pe(r,e,t,o){let[n,s]=it(r);if(o!=null){let a=o.getHashTableHandleByName(n);if(a!=null)return a}let i=t.currentContextIds.find(a=>!!e[hc(n,a)]);return i!==void 0?e[hc(n,i)][s]:void 0}function yC(r,e,t){return e[hc(r,t.currentContextId)]}function Mt(r,e){let[t,o,n]=it(r);return[hc(t,e&&e.currentContextId),o,n]}function hc(r,e){return e?`${r}-${e}`:r}function it(r){let e=r.split(":");if(e.length===1)return[r,0,void 0];let t=e[0],o=e.length===3?e[1]:void 0,n=Number(e[e.length-1]);return[t,n,o]}function Wl(r,e,t){let o=x("pad",r,e,t);if(o==="explicit"){o=x("explicitPaddings",r,e,t);let n=[[0,0],[0,0],[0,0],[0,0]];for(let s=0;s<4;s++)n[s][0]=o[s*2],n[s][1]=o[s*2+1];return n}return o}function rr(r){return r.kept?r:lt(r)}var Kg={};re(Kg,{json:()=>WL});var WL=[{tfOpName:"Add",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"AddV2",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"AddN",category:"arithmetic",inputs:[{start:0,end:0,name:"tensors",type:"tensors"}]},{tfOpName:"BiasAdd",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0}]},{tfOpName:"Sub",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"RealDiv",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Div",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"DivNoNan",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"FloorDiv",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Mul",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Maximum",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Minimum",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Pow",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"SquaredDifference",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Mod",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"FloorMod",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]}];var Xg={};re(Xg,{json:()=>jL});var jL=[{tfOpName:"Abs",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Acos",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Asin",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Atan",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Atan2",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"y",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Ceil",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"ClipByValue",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"clipValueMin",type:"number"},{start:2,name:"clipValueMax",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Complex",category:"basic_math",inputs:[{start:0,name:"real",type:"tensor"},{start:1,name:"imag",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"ComplexAbs",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Cos",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Cosh",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Elu",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Exp",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Floor",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Log",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Imag",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"Tout",name:"outputType",type:"dtype",notSupported:!0}]},{tfOpName:"Neg",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Real",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"Tout",name:"outputType",type:"dtype",notSupported:!0}]},{tfOpName:"Prelu",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"alpha",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Relu",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Relu6",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Selu",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Sigmoid",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Sin",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Sinh",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Sqrt",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Rsqrt",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Square",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Tan",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Tanh",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Sign",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Round",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Expm1",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Log1p",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Reciprocal",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Softplus",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Asinh",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Acosh",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Atanh",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Erf",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Prod",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axes",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool",notSupported:!0},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"LeakyRelu",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"alpha",name:"alpha",type:"number",defaultValue:.2},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"IsNan",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]}];var Yg={};re(Yg,{json:()=>HL});var HL=[{tfOpName:"EmptyTensorList",category:"control",inputs:[{start:0,name:"elementShape",type:"shape"},{start:1,name:"maxNumElements",type:"number"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"LoopCond",category:"control",inputs:[{start:0,name:"pred",type:"tensor"}]},{tfOpName:"Switch",category:"control",inputs:[{start:0,name:"data",type:"tensor"},{start:1,name:"pred",type:"tensor"}]},{tfOpName:"Merge",category:"control",inputs:[{start:0,end:0,name:"tensors",type:"tensors"}]},{tfOpName:"Enter",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"frame_name",name:"frameName",type:"string"},{tfName:"is_constant",name:"isConstant",type:"bool"}]},{tfOpName:"Exit",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"NextIteration",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"TensorArrayV3",category:"control",inputs:[{start:0,name:"size",type:"number"}],attrs:[{tfName:"dtype",name:"dtype",type:"dtype"},{tfName:"element_shape",name:"elementShape",type:"shape"},{tfName:"dynamic_size",name:"dynamicSize",type:"bool"},{tfName:"clear_after_read",name:"clearAfterRead",type:"bool"},{tfName:"identical_element_shapes",name:"identicalElementShapes",type:"bool"},{tfName:"tensor_array_name",name:"name",type:"string"}]},{tfOpName:"TensorArrayWriteV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"index",type:"number"},{start:2,name:"tensor",type:"tensor"},{start:3,name:"flowIn",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"TensorArrayReadV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"index",type:"number"},{start:2,name:"flowIn",type:"number"}],attrs:[{tfName:"dtype",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"TensorArrayGatherV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"indices",type:"number[]"},{start:2,name:"flowIn",type:"number"}],attrs:[{tfName:"dtype",name:"dtype",type:"dtype"},{tfName:"element_shape",name:"elementShape",type:"shape"}]},{tfOpName:"TensorArrayScatterV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"indices",type:"number[]"},{start:2,name:"tensor",type:"tensor"},{start:3,name:"flowIn",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"TensorArrayConcatV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"flowIn",type:"number"}],attrs:[{tfName:"dtype",name:"dtype",type:"dtype"},{tfName:"element_shape_except0",name:"elementShapeExcept0",type:"shape",notSupported:!0}]},{tfOpName:"TensorArraySplitV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"tensor",type:"tensor"},{start:2,name:"lengths",type:"number[]"},{start:3,name:"flowIn",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"TensorArraySizeV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"flowIn",type:"number"}]},{tfOpName:"TensorArrayCloseV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"}]},{tfOpName:"StatelessIf",category:"control",inputs:[{start:0,name:"cond",type:"tensor"},{start:1,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"then_branch",name:"thenBranch",type:"func"},{tfName:"else_branch",name:"elseBranch",type:"func"}]},{tfOpName:"If",category:"control",inputs:[{start:0,name:"cond",type:"tensor"},{start:1,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"then_branch",name:"thenBranch",type:"func"},{tfName:"else_branch",name:"elseBranch",type:"func"}]},{tfOpName:"StatelessWhile",category:"control",inputs:[{start:0,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"cond",name:"cond",type:"func"},{tfName:"body",name:"body",type:"func"}]},{tfOpName:"While",category:"control",inputs:[{start:0,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"cond",name:"cond",type:"func"},{tfName:"body",name:"body",type:"func"}]},{tfOpName:"TensorListScatter",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"},{start:1,name:"indices",type:"number[]"},{start:2,name:"elementShape",type:"shape"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListScatterV2",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"},{start:1,name:"indices",type:"number[]"},{start:2,name:"elementShape",type:"shape"},{start:3,name:"numElements",type:"number"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListGather",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"indices",type:"number[]"},{start:2,name:"elementShape",type:"shape"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListGetItem",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"index",type:"number"},{start:2,name:"elementShape",type:"shape"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListSetItem",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"index",type:"number"},{start:2,name:"tensor",type:"tensor"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListReserve",category:"control",inputs:[{start:0,name:"elementShape",type:"shape"},{start:1,name:"numElements",type:"number"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListFromTensor",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"},{start:1,name:"elementShape",type:"shape"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListStack",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"elementShape",type:"shape"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"},{tfName:"num_elements",name:"numElements",type:"dtype"}]},{tfOpName:"TensorListSplit",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"},{start:1,name:"elementShape",type:"shape"},{start:2,name:"lengths",type:"number[]"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListConcat",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"}],attrs:[{tfName:"element_shape",name:"elementShape",type:"shape"},{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListConcatV2",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"}],attrs:[{tfName:"element_shape",name:"elementShape",type:"shape"},{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListPopBack",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"elementShape",type:"shape"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListPushBack",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"tensor",type:"tensor"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListLength",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"}]},{tfOpName:"TensorListResize",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"size",type:"number"}]}];var Qg={};re(Qg,{json:()=>qL});var qL=[{tfOpName:"AvgPool",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0},{tfName:"ksize",name:"kernelSize",type:"number[]"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"MaxPool",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0},{tfName:"ksize",name:"kernelSize",type:"number[]"},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[],notSupported:!0},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"MaxPoolWithArgmax",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"ksize",name:"kernelSize",type:"number[]"},{tfName:"include_batch_in_index",name:"includeBatchInIndex",type:"bool"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"AvgPool3D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0},{tfName:"ksize",name:"kernelSize",type:"number[]"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"MaxPool3D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0},{tfName:"ksize",name:"kernelSize",type:"number[]"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Conv1D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"}],attrs:[{tfName:"stride",name:"stride",type:"number"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NWC"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"dilation",name:"dilation",type:"number",defaultValue:1}]},{tfOpName:"Conv2D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"useCudnnOnGpu",name:"useCudnnOnGpu",type:"bool"},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NHWC"},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[]},{tfName:"dilations",name:"dilations",type:"number[]"}]},{tfOpName:"_FusedConv2D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"},{start:2,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"num_args",name:"numArgs",type:"number"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[]},{tfName:"use_cudnn_on_gpu",name:"useCudnnOnGpu",type:"bool",defaultValue:!0},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NHWC"},{tfName:"dilations",name:"dilations",type:"number[]",defaultValue:[1,1,1,1]},{tfName:"fused_ops",name:"fusedOps",type:"string[]",defaultValue:[]},{tfName:"epsilon",name:"epsilon",type:"number",defaultValue:1e-4},{tfName:"leakyrelu_alpha",name:"leakyreluAlpha",type:"number",defaultValue:.2}]},{tfOpName:"Conv2DBackpropInput",category:"convolution",inputs:[{start:2,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"},{start:0,name:"outputShape",type:"number[]"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[]},{tfName:"dilations",name:"dilations",type:"number[]",notSupported:!0}]},{tfOpName:"DepthwiseConv2d",category:"convolution",inputs:[{start:0,name:"input",type:"tensor"},{start:1,name:"filter",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NHWC"},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[]},{tfName:"dilations",name:"dilations",type:"number[]"}]},{tfOpName:"DepthwiseConv2dNative",category:"convolution",inputs:[{start:0,name:"input",type:"tensor"},{start:1,name:"filter",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NHWC"},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[]},{tfName:"dilations",name:"dilations",type:"number[]"}]},{tfOpName:"FusedDepthwiseConv2dNative",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"},{start:2,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"num_args",name:"numArgs",type:"number"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NHWC"},{tfName:"dilations",name:"dilations",type:"number[]",defaultValue:[1,1,1,1]},{tfName:"fused_ops",name:"fusedOps",type:"string[]",defaultValue:[]},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[]}]},{tfOpName:"Conv3D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NHWC"},{tfName:"dilations",name:"dilations",type:"number[]"}]},{tfOpName:"Dilation2D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"rates",name:"dilations",type:"number[]"},{tfName:"padding",name:"pad",type:"string"}]}];var Zg={};re(Zg,{json:()=>KL});var KL=[{tfOpName:"Fill",category:"creation",inputs:[{start:0,name:"shape",type:"number[]"},{start:1,name:"value",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"LinSpace",category:"creation",inputs:[{start:0,name:"start",type:"number"},{start:1,name:"stop",type:"number"},{start:2,name:"num",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"OneHot",category:"creation",inputs:[{start:0,name:"indices",type:"tensor"},{start:1,name:"depth",type:"number"},{start:2,name:"onValue",type:"number",defaultValue:1},{start:3,name:"offValue",type:"number",defaultValue:0}],attrs:[{tfName:"axis",name:"axis",type:"number",notSupported:!0},{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"Ones",category:"creation",inputs:[{start:0,name:"shape",type:"number[]"}],attrs:[{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"OnesLike",category:"creation",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"dtype",name:"dtype",type:"dtype"}]},{tfOpName:"RandomStandardNormal",category:"creation",inputs:[{start:0,name:"shape",type:"number[]"}],attrs:[{tfName:"seed",name:"seed",type:"number",defaultValue:0},{tfName:"seed2",name:"seed2",type:"number",defaultValue:0,notSupported:!0},{tfName:"dtype",name:"dtype",type:"dtype"},{tfName:"T",name:"T",type:"number",notSupported:!0}]},{tfOpName:"RandomUniform",category:"creation",inputs:[{start:0,name:"shape",type:"number[]"}],attrs:[{tfName:"minval",name:"minval",type:"number",defaultValue:0},{tfName:"maxval",name:"maxval",type:"number",defaultValue:1},{tfName:"dtype",name:"dtype",type:"dtype"},{tfName:"seed",name:"seed",type:"number",defaultValue:0},{tfName:"seed2",name:"seed2",type:"number",defaultValue:0,notSupported:!0},{tfName:"T",name:"T",type:"number",notSupported:!0}]},{tfOpName:"Range",category:"creation",inputs:[{start:0,name:"start",type:"number"},{start:1,name:"stop",type:"number"},{start:2,name:"step",type:"number",defaultValue:0}],attrs:[{tfName:"Tidx",name:"dtype",type:"dtype"}]},{tfOpName:"TruncatedNormal",category:"creation",inputs:[{start:0,name:"shape",type:"number[]"}],attrs:[{tfName:"means",name:"mean",type:"number",defaultValue:0},{tfName:"stddev",name:"stdDev",type:"number",defaultValue:1},{tfName:"seed",name:"seed",type:"number"},{tfName:"seed2",name:"seed2",type:"number",defaultValue:0,notSupported:!0},{tfName:"dtype",name:"dtype",type:"dtype"},{tfName:"T",name:"T",type:"number",notSupported:!0}]},{tfOpName:"Zeros",category:"creation",inputs:[{start:0,name:"shape",type:"number[]"}],attrs:[{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"ZerosLike",category:"creation",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"Multinomial",category:"creation",inputs:[{start:0,name:"logits",type:"tensor"},{start:1,name:"numSamples",type:"number"}],attrs:[{tfName:"seed",name:"seed",type:"number"},{tfName:"seed2",name:"seed2",type:"number"},{tfName:"T",name:"dtype",type:"dtype"},{tfName:"output_dtype",name:"output_dtype",type:"dtype"}]}];var Jg={};re(Jg,{json:()=>XL});var XL=[{tfOpName:"NonMaxSuppressionV2",category:"dynamic",inputs:[{start:0,name:"boxes",type:"tensor"},{start:1,name:"scores",type:"tensor"},{start:2,name:"maxOutputSize",type:"number"},{start:3,name:"iouThreshold",type:"number"}]},{tfOpName:"NonMaxSuppressionV3",category:"dynamic",inputs:[{start:0,name:"boxes",type:"tensor"},{start:1,name:"scores",type:"tensor"},{start:2,name:"maxOutputSize",type:"number"},{start:3,name:"iouThreshold",type:"number"},{start:4,name:"scoreThreshold",type:"number"}]},{tfOpName:"NonMaxSuppressionV4",category:"dynamic",inputs:[{start:0,name:"boxes",type:"tensor"},{start:1,name:"scores",type:"tensor"},{start:2,name:"maxOutputSize",type:"number"},{start:3,name:"iouThreshold",type:"number"},{start:4,name:"scoreThreshold",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"T_threshold",name:"threshold",type:"dtype",notSupported:!0},{tfName:"pad_to_max_output_size",name:"padToMaxOutputSize",type:"bool"}]},{tfOpName:"NonMaxSuppressionV5",category:"dynamic",inputs:[{start:0,name:"boxes",type:"tensor"},{start:1,name:"scores",type:"tensor"},{start:2,name:"maxOutputSize",type:"number"},{start:3,name:"iouThreshold",type:"number"},{start:4,name:"scoreThreshold",type:"number"},{start:5,name:"softNmsSigma",type:"number"}]},{tfOpName:"Where",category:"dynamic",inputs:[{start:0,name:"condition",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"ListDiff",category:"dynamic",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"y",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]}];var ex={};re(ex,{json:()=>YL});var YL=[{tfOpName:"LowerBound",category:"evaluation",inputs:[{start:0,name:"sortedSequence",type:"tensor"},{start:1,name:"values",type:"tensor"}]},{tfOpName:"TopKV2",category:"evaluation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"k",type:"number"}],attrs:[{tfName:"sorted",name:"sorted",type:"bool"}]},{tfOpName:"UpperBound",category:"evaluation",inputs:[{start:0,name:"sortedSequence",type:"tensor"},{start:1,name:"values",type:"tensor"}]},{tfOpName:"Unique",category:"evaluation",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"UniqueV2",category:"evaluation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number"}]}];var tx={};re(tx,{json:()=>QL});var QL=[{tfOpName:"PlaceholderWithDefault",category:"graph",inputs:[{start:0,name:"default",type:"tensor"}],attrs:[{tfName:"shape",name:"shape",type:"shape"},{tfName:"dtype",name:"dtype",type:"dtype"}]},{tfOpName:"Placeholder",category:"graph",attrs:[{tfName:"shape",name:"shape",type:"shape"},{tfName:"dtype",name:"dtype",type:"dtype"}]},{tfOpName:"Const",category:"graph"},{tfOpName:"Identity",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"IdentityN",category:"graph",inputs:[{start:0,end:0,name:"x",type:"tensors"}]},{tfOpName:"Snapshot",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"Rank",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"Size",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"Shape",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"ShapeN",category:"graph",inputs:[{start:0,end:0,name:"x",type:"tensors"}]},{tfOpName:"Print",category:"graph",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"data",type:"tensors"}],attrs:[{tfName:"message",name:"message",type:"string"},{tfName:"first_n",name:"firstN",type:"number",notSupported:!0},{tfName:"summarize",name:"summarize",type:"number",defaultValue:3}]},{tfOpName:"NoOp",category:"graph",inputs:[]},{tfOpName:"StopGradient",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"FakeQuantWithMinMaxVars",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"min",name:"min",type:"number"},{tfName:"max",name:"max",type:"number"}]}];var rx={};re(rx,{json:()=>ZL});var ZL=[{tfOpName:"HashTable",category:"hash_table",inputs:[],attrs:[{tfName:"shared_name",name:"sharedName",type:"string"},{tfName:"use_node_name_sharing",name:"useNodeNameSharing",type:"bool"},{tfName:"key_dtype",name:"keyDType",type:"dtype"},{tfName:"value_dtype",name:"valueDType",type:"dtype"}]},{tfOpName:"HashTableV2",category:"hash_table",inputs:[],attrs:[{tfName:"shared_name",name:"sharedName",type:"string"},{tfName:"use_node_name_sharing",name:"useNodeNameSharing",type:"bool"},{tfName:"key_dtype",name:"keyDType",type:"dtype"},{tfName:"value_dtype",name:"valueDType",type:"dtype"}]},{tfOpName:"LookupTableImport",category:"hash_table",inputs:[{start:0,name:"tableHandle",type:"tensor"},{start:1,name:"keys",type:"tensor"},{start:2,name:"values",type:"tensor"}],attrs:[{tfName:"Tin",name:"tIn",type:"dtype",notSupported:!0},{tfName:"Tout",name:"tOut",type:"dtype",notSupported:!0}]},{tfOpName:"LookupTableImportV2",category:"hash_table",inputs:[{start:0,name:"tableHandle",type:"tensor"},{start:1,name:"keys",type:"tensor"},{start:2,name:"values",type:"tensor"}],attrs:[{tfName:"Tin",name:"tIn",type:"dtype",notSupported:!0},{tfName:"Tout",name:"tOut",type:"dtype",notSupported:!0}]},{tfOpName:"LookupTableFind",category:"hash_table",inputs:[{start:0,name:"tableHandle",type:"tensor"},{start:1,name:"keys",type:"tensor"},{start:2,name:"defaultValue",type:"tensor"}],attrs:[{tfName:"Tin",name:"tIn",type:"dtype",notSupported:!0},{tfName:"Tout",name:"tOut",type:"dtype",notSupported:!0}]},{tfOpName:"LookupTableFindV2",category:"hash_table",inputs:[{start:0,name:"tableHandle",type:"tensor"},{start:1,name:"keys",type:"tensor"},{start:2,name:"defaultValue",type:"tensor"}],attrs:[{tfName:"Tin",name:"tIn",type:"dtype",notSupported:!0},{tfName:"Tout",name:"tOut",type:"dtype",notSupported:!0}]},{tfOpName:"LookupTableSize",category:"hash_table",inputs:[{start:0,name:"tableHandle",type:"tensor"}]},{tfOpName:"LookupTableSizeV2",category:"hash_table",inputs:[{start:0,name:"tableHandle",type:"tensor"}]}];var ox={};re(ox,{json:()=>JL});var JL=[{tfOpName:"ResizeBilinear",category:"image",inputs:[{start:0,name:"images",type:"tensor"},{start:1,name:"size",type:"number[]"}],attrs:[{tfName:"align_corners",name:"alignCorners",type:"bool"},{tfName:"half_pixel_centers",name:"halfPixelCenters",type:"bool"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"ResizeNearestNeighbor",category:"image",inputs:[{start:0,name:"images",type:"tensor"},{start:1,name:"size",type:"number[]"}],attrs:[{tfName:"align_corners",name:"alignCorners",type:"bool"},{tfName:"half_pixel_centers",name:"halfPixelCenters",type:"bool"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"CropAndResize",category:"image",inputs:[{start:0,name:"image",type:"tensor"},{start:1,name:"boxes",type:"tensor"},{start:2,name:"boxInd",type:"tensor"},{start:3,name:"cropSize",type:"number[]"}],attrs:[{tfName:"method",name:"method",type:"string"},{tfName:"extrapolation_value",name:"extrapolationValue",type:"number"}]},{tfOpName:"ImageProjectiveTransformV3",category:"image",inputs:[{start:0,name:"images",type:"tensor"},{start:1,name:"transforms",type:"tensor"},{start:2,name:"outputShape",type:"number[]"},{start:3,name:"fillValue",type:"number"}],attrs:[{tfName:"interpolation",name:"interpolation",type:"string"},{tfName:"fill_mode",name:"fillMode",type:"string"}]}];var nx={};re(nx,{json:()=>eB});var eB=[{tfOpName:"Equal",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"NotEqual",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Greater",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"GreaterEqual",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Less",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"LessEqual",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"LogicalAnd",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"LogicalNot",category:"logical",inputs:[{start:0,name:"a",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"LogicalOr",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Select",category:"logical",inputs:[{start:0,name:"condition",type:"tensor"},{start:1,name:"a",type:"tensor"},{start:2,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"SelectV2",category:"logical",inputs:[{start:0,name:"condition",type:"tensor"},{start:1,name:"a",type:"tensor"},{start:2,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]}];var sx={};re(sx,{json:()=>tB});var tB=[{tfOpName:"_FusedMatMul",category:"matrices",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"},{start:2,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"num_args",name:"numArgs",type:"number"},{tfName:"fused_ops",name:"fusedOps",type:"string[]",defaultValue:[]},{tfName:"epsilon",name:"epsilon",type:"number",defaultValue:1e-4},{tfName:"transpose_a",name:"transposeA",type:"bool",defaultValue:!1},{tfName:"transpose_b",name:"transposeB",type:"bool",defaultValue:!1},{tfName:"leakyrelu_alpha",name:"leakyreluAlpha",type:"number",defaultValue:.2},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"MatMul",category:"matrices",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"transpose_a",name:"transposeA",type:"bool",defaultValue:!1},{tfName:"transpose_b",name:"transposeB",type:"bool",defaultValue:!1},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"BatchMatMul",category:"matrices",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"adj_x",name:"transposeA",type:"bool",defaultValue:!1},{tfName:"adj_y",name:"transposeB",type:"bool",defaultValue:!1},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"BatchMatMulV2",category:"matrices",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"adj_x",name:"transposeA",type:"bool",defaultValue:!1},{tfName:"adj_y",name:"transposeB",type:"bool",defaultValue:!1},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Transpose",category:"matrices",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"perm",type:"number[]"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Einsum",category:"matrices",inputs:[{start:0,end:0,name:"tensors",type:"tensors"}],attrs:[{tfName:"equation",name:"equation",type:"string"},{tfName:"N",name:"n",type:"number",defaultValue:2},{tfName:"T",name:"dtype",type:"dtype"}]}];var ix={};re(ix,{json:()=>rB});var rB=[{tfOpName:"EuclideanNorm",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool",defaultValue:!1}]},{tfOpName:"FusedBatchNorm",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"scale",type:"tensor"},{start:2,name:"offset",type:"tensor"},{start:3,name:"mean",type:"tensor"},{start:4,name:"variance",type:"tensor"}],attrs:[{tfName:"epsilon",name:"epsilon",type:"number",defaultValue:.001},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0}]},{tfOpName:"FusedBatchNormV2",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"scale",type:"tensor"},{start:2,name:"offset",type:"tensor"},{start:3,name:"mean",type:"tensor"},{start:4,name:"variance",type:"tensor"}],attrs:[{tfName:"epsilon",name:"epsilon",type:"number",defaultValue:.001},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0}]},{tfOpName:"FusedBatchNormV3",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"scale",type:"tensor"},{start:2,name:"offset",type:"tensor"},{start:3,name:"mean",type:"tensor"},{start:4,name:"variance",type:"tensor"}],attrs:[{tfName:"epsilon",name:"epsilon",type:"number",defaultValue:.001},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0}]},{tfOpName:"LRN",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"depth_radius",name:"radius",type:"number",defaultValue:5},{tfName:"bias",name:"bias",type:"number",defaultValue:1},{tfName:"alpha",name:"alpha",type:"number",defaultValue:1},{tfName:"beta",name:"beta",type:"number",defaultValue:.5}]},{tfOpName:"Softmax",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"LogSoftmax",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"SparseToDense",category:"normalization",inputs:[{start:0,name:"sparseIndices",type:"tensor"},{start:1,name:"outputShape",type:"number[]"},{start:2,name:"sparseValues",type:"tensor"},{start:3,name:"defaultValue",type:"tensor"}],attrs:[{tfName:"validate_indices",name:"validateIndices",type:"bool",defaultValue:!0,notSupported:!0}]}];var ax={};re(ax,{json:()=>oB});var oB=[{tfOpName:"Bincount",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"size",type:"number"},{start:2,name:"weights",type:"tensor"}]},{tfOpName:"DenseBincount",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"size",type:"number"},{start:2,name:"weights",type:"tensor"}],attrs:[{tfName:"binary_output",name:"binaryOutput",type:"bool"}]},{tfOpName:"Max",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"}]},{tfOpName:"Mean",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"}]},{tfOpName:"Min",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"}]},{tfOpName:"Sum",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"}]},{tfOpName:"All",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"}]},{tfOpName:"Any",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"}]},{tfOpName:"ArgMax",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number"}]},{tfOpName:"ArgMin",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number"}]},{tfOpName:"Prod",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"}]},{tfOpName:"Cumprod",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number"}],attrs:[{tfName:"exclusive",name:"exclusive",type:"bool"},{tfName:"reverse",name:"reverse",type:"bool"}]},{tfOpName:"Cumsum",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number"}],attrs:[{tfName:"exclusive",name:"exclusive",type:"bool"},{tfName:"reverse",name:"reverse",type:"bool"}]}];var lx={};re(lx,{json:()=>nB});var nB=[{tfOpName:"ConcatV2",category:"slice_join",inputs:[{start:0,end:-1,name:"tensors",type:"tensors"},{start:-1,name:"axis",type:"number"}],attrs:[{tfName:"N",name:"n",type:"number",defaultValue:2}]},{tfOpName:"Concat",category:"slice_join",inputs:[{start:1,end:0,name:"tensors",type:"tensors"},{start:0,name:"axis",type:"number"}],attrs:[{tfName:"N",name:"n",type:"number",defaultValue:2}]},{tfOpName:"GatherV2",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"indices",type:"tensor"},{start:2,name:"axis",type:"number",defaultValue:0}],attrs:[{tfName:"batch_dims",name:"batchDims",type:"number",defaultValue:0}]},{tfOpName:"Gather",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"indices",type:"tensor"}],attrs:[{tfName:"validate_indices",name:"validateIndices",type:"bool",notSupported:!0}]},{tfOpName:"Reverse",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"dims",type:"bool[]"}]},{tfOpName:"ReverseV2",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}]},{tfOpName:"Slice",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"begin",type:"number[]"},{start:2,name:"size",type:"number[]"}]},{tfOpName:"StridedSlice",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"begin",type:"number[]"},{start:2,name:"end",type:"number[]"},{start:3,name:"strides",type:"number[]"}],attrs:[{tfName:"begin_mask",name:"beginMask",type:"number",defaultValue:0},{tfName:"end_mask",name:"endMask",type:"number",defaultValue:0},{tfName:"new_axis_mask",name:"newAxisMask",type:"number",defaultValue:0},{tfName:"ellipsis_mask",name:"ellipsisMask",type:"number",defaultValue:0},{tfName:"shrink_axis_mask",name:"shrinkAxisMask",type:"number",defaultValue:0}]},{tfOpName:"Pack",category:"slice_join",inputs:[{start:0,end:0,name:"tensors",type:"tensors"}],attrs:[{tfName:"axis",name:"axis",type:"number",defaultValue:0}]},{tfOpName:"Unpack",category:"slice_join",inputs:[{start:0,name:"tensor",type:"tensor"}],attrs:[{tfName:"axis",name:"axis",type:"number",defaultValue:0},{tfName:"num",name:"num",type:"number",defaultValue:0,notSupported:!0}]},{tfOpName:"Tile",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"reps",type:"number[]"}]},{tfOpName:"Split",category:"slice_join",inputs:[{start:0,name:"axis",type:"number",defaultValue:0},{start:1,name:"x",type:"tensor"}],attrs:[{tfName:"num_split",name:"numOrSizeSplits",type:"number",defaultValue:1}]},{tfOpName:"SplitV",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"numOrSizeSplits",type:"number[]"},{start:2,name:"axis",type:"number",defaultValue:0}]},{tfOpName:"ScatterNd",category:"slice_join",inputs:[{start:0,name:"indices",type:"tensor"},{start:1,name:"values",type:"tensor"},{start:2,name:"shape",type:"number[]"}]},{tfOpName:"GatherNd",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"indices",type:"tensor"}]},{tfOpName:"SparseToDense",category:"slice_join",inputs:[{start:0,name:"sparseIndices",type:"tensor"},{start:1,name:"outputShape",type:"number[]"},{start:2,name:"sparseValues",type:"tensor"},{start:3,name:"defaultValue",type:"tensor"}],attrs:[{tfName:"validate_indices",name:"validateIndices",type:"bool",defaultValue:!1,notSupported:!0}]}];var ux={};re(ux,{json:()=>sB});var sB=[{tfOpName:"SparseFillEmptyRows",category:"sparse",inputs:[{start:0,name:"indices",type:"tensor"},{start:1,name:"values",type:"tensor"},{start:2,name:"denseShape",type:"tensor"},{start:3,name:"defaultValue",type:"tensor"}]},{tfOpName:"SparseReshape",category:"sparse",inputs:[{start:0,name:"inputIndices",type:"tensor"},{start:1,name:"inputShape",type:"tensor"},{start:2,name:"newShape",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"SparseSegmentMean",category:"sparse",inputs:[{start:0,name:"data",type:"tensor"},{start:1,name:"indices",type:"tensor"},{start:2,name:"segmentIds",type:"tensor"}]},{tfOpName:"SparseSegmentSum",category:"sparse",inputs:[{start:0,name:"data",type:"tensor"},{start:1,name:"indices",type:"tensor"},{start:2,name:"segmentIds",type:"tensor"}]}];var cx={};re(cx,{json:()=>iB});var iB=[{tfOpName:"FFT",category:"spectral",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"IFFT",category:"spectral",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"RFFT",category:"spectral",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"fft_length",type:"number",notSupported:!0}]},{tfOpName:"IRFFT",category:"spectral",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"fft_length",type:"number",notSupported:!0}]}];var px={};re(px,{json:()=>aB});var aB=[{tfOpName:"StringNGrams",category:"string",inputs:[{start:0,name:"data",type:"tensor"},{start:1,name:"dataSplits",type:"tensor"}],attrs:[{tfName:"separator",name:"separator",type:"string"},{tfName:"ngram_widths",name:"nGramWidths",type:"number[]"},{tfName:"left_pad",name:"leftPad",type:"string"},{tfName:"right_pad",name:"rightPad",type:"string"},{tfName:"pad_width",name:"padWidth",type:"number"},{tfName:"preserve_short_sequences",name:"preserveShortSequences",type:"bool"}],outputs:["ngrams","ngrams_splits"]},{tfOpName:"StringSplit",category:"string",inputs:[{start:0,name:"input",type:"tensor"},{start:1,name:"delimiter",type:"tensor"}],attrs:[{tfName:"skip_empty",name:"skipEmpty",type:"bool"}],outputs:["indices","values","shape"]},{tfOpName:"StringToHashBucketFast",category:"string",inputs:[{start:0,name:"input",type:"tensor"}],attrs:[{tfName:"num_buckets",name:"numBuckets",type:"number"}]}];var mx={};re(mx,{json:()=>lB});var lB=[{tfOpName:"Cast",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"SrcT",name:"sdtype",type:"dtype",notSupported:!0},{tfName:"DstT",name:"dtype",type:"dtype"}]},{tfOpName:"ExpandDims",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number"}]},{tfOpName:"MirrorPad",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"padding",type:"number[]"}],attrs:[{tfName:"mode",name:"mode",type:"string"}]},{tfOpName:"Pad",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"padding",type:"number[]"}],attrs:[{tfName:"constant_value",name:"constantValue",type:"number",defaultValue:0}]},{tfOpName:"PadV2",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"padding",type:"number[]"},{start:2,name:"constantValue",type:"number",defaultValue:0}]},{tfOpName:"Reshape",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"shape",type:"number[]"}]},{tfOpName:"Squeeze",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"axis",tfDeprecatedName:"squeeze_dims",name:"axis",type:"number[]"}]},{tfOpName:"SpaceToBatchND",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"blockShape",type:"number[]"},{start:2,name:"paddings",type:"number[]"}]},{tfOpName:"BatchToSpaceND",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"blockShape",type:"number[]"},{start:2,name:"crops",type:"number[]"}]},{tfOpName:"DepthToSpace",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"block_size",name:"blockSize",type:"number"},{tfName:"data_format",name:"dataFormat",type:"string"}]},{tfOpName:"BroadcastTo",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"shape",type:"number[]"}],attrs:[]},{tfOpName:"BroadcastArgs",category:"transformation",inputs:[{start:0,name:"s0",type:"tensor"},{start:1,name:"s1",type:"tensor"}],attrs:[]}];var gc=class{static get Instance(){return this._instance||(this._instance=new this)}constructor(){let e=[Kg,Xg,Yg,Qg,Zg,Jg,ex,tx,rx,ox,nx,sx,ix,ax,lx,ux,cx,px,mx],t=[].concat(...e.map(o=>o.json));this.opMappers=t.reduce((o,n)=>(o[n.tfOpName]=n,o),{})}transformGraph(e,t={}){let o=e.node,n=[],s=[],i=[],a=o.reduce((g,h)=>(g[h.name]=this.mapNode(h),h.op.startsWith("Placeholder")?n.push(g[h.name]):h.op==="Const"?s.push(g[h.name]):(h.input==null||h.input.length===0)&&i.push(g[h.name]),g),{}),l=[],u=[],c={},p={};t!=null&&(c=this.mapSignatureEntries(t.inputs),p=this.mapSignatureEntries(t.outputs));let m=Object.keys(a);m.forEach(g=>{let h=a[g];h.inputNames.forEach((b,T)=>{let[k,,S]=Mt(b),I=a[k];if(I.outputs!=null){let A=I.outputs.indexOf(S);if(A!==-1){let R=`${k}:${A}`;h.inputNames[T]=R}}h.inputs.push(I),I.children.push(h)})}),Object.keys(p).length===0?m.forEach(g=>{let h=a[g];h.children.length===0&&u.push(h)}):Object.keys(p).forEach(g=>{let[h]=Mt(g),b=a[h];b!=null&&(b.signatureKey=p[g],u.push(b))}),Object.keys(c).length>0?Object.keys(c).forEach(g=>{let[h]=Mt(g),b=a[h];b&&(b.signatureKey=c[g],l.push(b))}):l=n;let f={};e.library!=null&&e.library.function!=null&&(f=e.library.function.reduce((g,h)=>(g[h.signature.name]=this.mapFunction(h),g),{}));let d={nodes:a,inputs:l,outputs:u,weights:s,placeholders:n,signature:t,functions:f};return i.length>0&&(d.initNodes=i),d}mapSignatureEntries(e){return Object.keys(e||{}).reduce((t,o)=>(t[e[o].name]=o,t),{})}mapNode(e){let t=dc(e.op)||this.opMappers[e.op]||{};e.attr==null&&(e.attr={});let o={name:e.name,op:e.op,category:t.category,inputNames:(e.input||[]).map(n=>n.startsWith("^")?n.slice(1):n),inputs:[],children:[],inputParams:{},attrParams:{},rawAttrs:e.attr,outputs:t.outputs};return t.inputs!=null&&(o.inputParams=t.inputs.reduce((n,s)=>(n[s.name]={type:s.type,inputIndexStart:s.start,inputIndexEnd:s.end},n),{})),t.attrs!=null&&(o.attrParams=t.attrs.reduce((n,s)=>{let i=s.type,a;switch(s.type){case"string":a=xc(e.attr,s.tfName,s.defaultValue),a===void 0&&!!s.tfDeprecatedName&&(a=xc(e.attr,s.tfDeprecatedName,s.defaultValue));break;case"string[]":a=Cc(e.attr,s.tfName,s.defaultValue),a===void 0&&!!s.tfDeprecatedName&&(a=Cc(e.attr,s.tfDeprecatedName,s.defaultValue));break;case"number":a=bc(e.attr,s.tfName,s.defaultValue||0),a===void 0&&!!s.tfDeprecatedName&&(a=bc(e.attr,s.tfDeprecatedName,s.defaultValue));break;case"number[]":a=Tc(e.attr,s.tfName,s.defaultValue),a===void 0&&!!s.tfDeprecatedName&&(a=Tc(e.attr,s.tfDeprecatedName,s.defaultValue));break;case"bool":a=yc(e.attr,s.tfName,s.defaultValue),a===void 0&&!!s.tfDeprecatedName&&(a=yc(e.attr,s.tfDeprecatedName,s.defaultValue));break;case"bool[]":a=Nc(e.attr,s.tfName,s.defaultValue),a===void 0&&!!s.tfDeprecatedName&&(a=Nc(e.attr,s.tfDeprecatedName,s.defaultValue));break;case"shape":a=vc(e.attr,s.tfName,s.defaultValue),a===void 0&&!!s.tfDeprecatedName&&(a=vc(e.attr,s.tfDeprecatedName,s.defaultValue));break;case"shape[]":a=kc(e.attr,s.tfName,s.defaultValue),a===void 0&&!!s.tfDeprecatedName&&(a=kc(e.attr,s.tfDeprecatedName,s.defaultValue));break;case"dtype":a=_c(e.attr,s.tfName,s.defaultValue),a===void 0&&!!s.tfDeprecatedName&&(a=_c(e.attr,s.tfDeprecatedName,s.defaultValue));break;case"dtype[]":a=wc(e.attr,s.tfName,s.defaultValue),a===void 0&&!!s.tfDeprecatedName&&(a=wc(e.attr,s.tfDeprecatedName,s.defaultValue));break;case"func":a=_C(e.attr,s.tfName,s.defaultValue),a===void 0&&!!s.tfDeprecatedName&&(a=_C(e.attr,s.tfDeprecatedName,s.defaultValue));break;case"tensor":case"tensors":break;default:throw new Error(`Unsupported param type: ${s.type} for op: ${e.op}`)}return n[s.name]={value:a,type:i},n},{})),o}mapFunction(e){let t=e.nodeDef,o=[],n=[],s={};t!=null&&(s=t.reduce((p,m)=>(p[m.name]=this.mapNode(m),m.op==="Const"&&n.push(p[m.name]),p),{}));let i=[],a=[];e.signature.inputArg.forEach(p=>{let[m]=Mt(p.name),f={name:m,op:"Placeholder",inputs:[],inputNames:[],category:"graph",inputParams:{},attrParams:{dtype:{value:fx(p.type),type:"dtype"}},children:[]};f.signatureKey=p.name,i.push(f),s[m]=f}),Object.keys(s).forEach(p=>{let m=s[p];m.inputNames.forEach((f,d)=>{let[g,,h]=Mt(f),b=s[g];if(b.outputs!=null){let T=b.outputs.indexOf(h);if(T!==-1){let k=`${g}:${T}`;m.inputNames[d]=k}}m.inputs.push(b),b.children.push(m)})});let u=e.ret;e.signature.outputArg.forEach(p=>{let[m,f]=Mt(u[p.name]),d=s[m];d!=null&&(d.defaultOutput=f,a.push(d))});let c=this.mapArgsToSignature(e);return{nodes:s,inputs:i,outputs:a,weights:n,placeholders:o,signature:c}}mapArgsToSignature(e){return{methodName:e.signature.name,inputs:e.signature.inputArg.reduce((t,o)=>(t[o.name]=this.mapArgToTensorInfo(o),t),{}),outputs:e.signature.outputArg.reduce((t,o)=>(t[o.name]=this.mapArgToTensorInfo(o,e.ret),t),{})}}mapArgToTensorInfo(e,t){let o=e.name;return t!=null&&(o=t[o]),{name:o,dtype:e.type}}};function uB(r){let e=E().global;if(typeof e.atob!="undefined")return e.atob(r);if(typeof Buffer!="undefined")return new Buffer(r,"base64").toString();throw new Error("Unable to decode base64 in this environment. Missing built-in atob() or Buffer()")}function bC(r,e){let t=Array.isArray(r)?String.fromCharCode.apply(null,r):uB(r);return e?t:t.toLowerCase()}function xc(r,e,t,o=!1){let n=r[e];return n!=null?bC(n.s,o):t}function yc(r,e,t){let o=r[e];return o?o.b:t}function bc(r,e,t){let o=r[e]||{},n=o.i!=null?o.i:o.f!=null?o.f:t;return typeof n=="number"?n:parseInt(n,10)}function fx(r){switch(typeof r=="string"&&(r=St[r]),r){case St.DT_FLOAT:case St.DT_HALF:return"float32";case St.DT_INT32:case St.DT_INT64:case St.DT_INT8:case St.DT_UINT8:return"int32";case St.DT_BOOL:return"bool";case St.DT_DOUBLE:return"float32";case St.DT_STRING:return"string";default:return null}}function _C(r,e,t){let o=r[e];return o&&o.func?o.func.name:t}function _c(r,e,t){let o=r[e];return o&&o.type?fx(o.type):t}function wc(r,e,t){let o=r[e];return o&&o.list&&o.list.type?o.list.type.map(n=>fx(n)):t}function wC(r){if(!r.unknownRank)return r.dim!=null?r.dim.map(e=>typeof e.size=="number"?e.size:parseInt(e.size,10)):[]}function vc(r,e,t){let o=r[e];return o&&o.shape?wC(o.shape):t}function Tc(r,e,t){let o=r[e];return o?((o.list.f&&o.list.f.length?o.list.f:o.list.i)||[]).map(n=>typeof n=="number"?n:parseInt(n,10)):t}function Cc(r,e,t,o=!1){let n=r[e];return n&&n.list&&n.list.s?n.list.s.map(s=>bC(s,o)):t}function kc(r,e,t){let o=r[e];return o&&o.list&&o.list.shape?o.list.shape.map(n=>wC(n)):t}function Nc(r,e,t){let o=r[e];return o&&o.list&&o.list.b?o.list.b:t}var dx=class{constructor(e,t,o){this.node=e,this.tensorMap=t,this.context=o,this.inputs=[],this.attrs={},this.inputs=e.inputNames.map(n=>this.getInput(n)),e.rawAttrs!=null&&(this.attrs=Object.keys(e.rawAttrs).reduce((n,s)=>(n[s]=this.getAttr(s),n),{}))}getInput(e){return Pe(e,this.tensorMap,this.context)}getAttr(e,t){let o=this.node.rawAttrs[e];if(o.tensor!=null)return Pe(e,this.tensorMap,this.context);if(o.i!=null||o.f!=null)return bc(this.node.rawAttrs,e,t);if(o.s!=null)return xc(this.node.rawAttrs,e,t);if(o.b!=null)return yc(this.node.rawAttrs,e,t);if(o.shape!=null)return vc(this.node.rawAttrs,e,t);if(o.type!=null)return _c(this.node.rawAttrs,e,t);if(o.list!=null){if(o.list.i!=null||o.list.f!=null)return Tc(this.node.rawAttrs,e,t);if(o.list.s!=null)return Cc(this.node.rawAttrs,e,t);if(o.list.shape!=null)return kc(this.node.rawAttrs,e,t);if(o.list.b!=null)return Nc(this.node.rawAttrs,e,t);if(o.list.type!=null)return wc(this.node.rawAttrs,e,t)}return t}};var pe={};re(pe,{OP_SCOPE_SUFFIX:()=>ou,abs:()=>Le,acos:()=>Wp,acosh:()=>jp,add:()=>G,addN:()=>Hp,all:()=>qp,any:()=>Kp,argMax:()=>Xp,argMin:()=>Yp,asin:()=>Qp,asinh:()=>Zp,atan:()=>Jp,atan2:()=>em,atanh:()=>tm,avgPool:()=>Ka,avgPool3d:()=>sm,basicLSTMCell:()=>im,batchNorm:()=>kr,batchNorm2d:()=>am,batchNorm3d:()=>lm,batchNorm4d:()=>um,batchToSpaceND:()=>Xa,bincount:()=>Ya,booleanMaskAsync:()=>Gb,broadcastArgs:()=>cm,broadcastTo:()=>Nr,buffer:()=>te,cast:()=>oe,ceil:()=>pm,clipByValue:()=>mm,clone:()=>lt,complex:()=>Je,concat:()=>ge,concat1d:()=>fm,concat2d:()=>Qa,concat3d:()=>dm,concat4d:()=>hm,conv1d:()=>gm,conv2d:()=>Sr,conv2dTranspose:()=>xm,conv3d:()=>ym,conv3dTranspose:()=>bm,cos:()=>_m,cosh:()=>wm,cosineWindow:()=>Zn,cumprod:()=>vm,cumsum:()=>Tm,denseBincount:()=>Cm,depthToSpace:()=>km,depthwiseConv2d:()=>Wo,diag:()=>Nm,dilation2d:()=>Sm,div:()=>Z,divNoNan:()=>Em,dot:()=>Im,dropout:()=>Kb,einsum:()=>$m,elu:()=>Ja,enclosingPowerOfTwo:()=>Cu,equal:()=>Za,erf:()=>Am,euclideanNorm:()=>Dm,exp:()=>kt,expandDims:()=>Rt,expm1:()=>Fm,eye:()=>el,fft:()=>qo,fill:()=>jt,floor:()=>tl,floorDiv:()=>qa,fused:()=>ku,gather:()=>rl,gatherND:()=>Hb,greater:()=>Qr,greaterEqual:()=>ol,ifft:()=>eo,imag:()=>Tr,image:()=>Rr,inTopKAsync:()=>Xb,irfft:()=>_l,isFinite:()=>Om,isInf:()=>Pm,isNaN:()=>Lm,leakyRelu:()=>nl,less:()=>Bm,lessEqual:()=>jo,linalg:()=>G_,linspace:()=>Mm,localResponseNormalization:()=>Vm,log:()=>ur,log1p:()=>sl,logSigmoid:()=>Gm,logSoftmax:()=>zm,logSumExp:()=>al,logicalAnd:()=>Zr,logicalNot:()=>ll,logicalOr:()=>ul,logicalXor:()=>Um,losses:()=>z_,lowerBound:()=>Wm,matMul:()=>ie,max:()=>Ht,maxPool:()=>cl,maxPool3d:()=>jm,maxPoolWithArgmax:()=>Hm,maximum:()=>pl,mean:()=>Jr,meshgrid:()=>qm,min:()=>Xn,minimum:()=>ml,mirrorPad:()=>Km,mod:()=>Xm,moments:()=>Ym,movingAverage:()=>zb,mul:()=>F,multiRNNCell:()=>Qm,multinomial:()=>Zm,neg:()=>Ke,norm:()=>Yr,notEqual:()=>fl,oneHot:()=>jn,ones:()=>qt,onesLike:()=>Jm,op:()=>_,outerProduct:()=>ef,pad:()=>Kt,pad1d:()=>tf,pad2d:()=>rf,pad3d:()=>of,pad4d:()=>nf,pool:()=>sf,pow:()=>lr,prelu:()=>hl,print:()=>Ua,prod:()=>af,raggedGather:()=>lf,raggedTensorToTensor:()=>uf,rand:()=>cf,randomGamma:()=>bf,randomNormal:()=>gl,randomStandardNormal:()=>_f,randomUniform:()=>xl,range:()=>$r,real:()=>ar,reciprocal:()=>wf,relu:()=>Ar,relu6:()=>yl,reshape:()=>$,reverse:()=>gt,reverse1d:()=>vf,reverse2d:()=>Tf,reverse3d:()=>Cf,reverse4d:()=>kf,rfft:()=>Ko,round:()=>bl,rsqrt:()=>Nf,scalar:()=>j,scatterND:()=>Ub,searchSorted:()=>Yn,selu:()=>Sf,separableConv2d:()=>Ef,setdiff1dAsync:()=>If,sigmoid:()=>Ct,sign:()=>$f,signal:()=>V_,sin:()=>Af,sinh:()=>Rf,slice:()=>J,slice1d:()=>Df,slice2d:()=>Ff,slice3d:()=>Of,slice4d:()=>Pf,softmax:()=>Lf,softplus:()=>il,spaceToBatchND:()=>dl,sparse:()=>U_,sparseToDense:()=>jb,spectral:()=>M_,split:()=>cr,sqrt:()=>rt,square:()=>Be,squaredDifference:()=>wl,squeeze:()=>pr,stack:()=>Qe,step:()=>vl,stridedSlice:()=>Bf,string:()=>W_,sub:()=>H,sum:()=>le,tan:()=>Mf,tanh:()=>Kn,tensor:()=>qe,tensor1d:()=>Oe,tensor2d:()=>Xt,tensor3d:()=>ja,tensor4d:()=>Vf,tensor5d:()=>Gf,tensor6d:()=>zf,tile:()=>Ir,topk:()=>Uf,transpose:()=>Mo,truncatedNormal:()=>Wf,unique:()=>jf,unsortedSegmentSum:()=>Hf,unstack:()=>xt,upperBound:()=>qf,variable:()=>Kf,where:()=>At,whereAsync:()=>Tl,zeros:()=>Nt,zerosLike:()=>Ae});var vC=(r,e,t,o=pe)=>{switch(r.op){case"BiasAdd":case"AddV2":case"Add":return[o.add(x("a",r,e,t),x("b",r,e,t))];case"AddN":return[o.addN(x("tensors",r,e,t))];case"FloorMod":case"Mod":return[o.mod(x("a",r,e,t),x("b",r,e,t))];case"Mul":return[o.mul(x("a",r,e,t),x("b",r,e,t))];case"RealDiv":case"Div":return[o.div(x("a",r,e,t),x("b",r,e,t))];case"DivNoNan":return[o.divNoNan(x("a",r,e,t),x("b",r,e,t))];case"FloorDiv":return[o.floorDiv(x("a",r,e,t),x("b",r,e,t))];case"Sub":return[o.sub(x("a",r,e,t),x("b",r,e,t))];case"Minimum":return[o.minimum(x("a",r,e,t),x("b",r,e,t))];case"Maximum":return[o.maximum(x("a",r,e,t),x("b",r,e,t))];case"Pow":return[o.pow(x("a",r,e,t),x("b",r,e,t))];case"SquaredDifference":return[o.squaredDifference(x("a",r,e,t),x("b",r,e,t))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var TC=(r,e,t,o=pe)=>{switch(r.op){case"Abs":case"ComplexAbs":return[o.abs(x("x",r,e,t))];case"Acos":return[o.acos(x("x",r,e,t))];case"Acosh":return[o.acosh(x("x",r,e,t))];case"Asin":return[o.asin(x("x",r,e,t))];case"Asinh":return[o.asinh(x("x",r,e,t))];case"Atan":return[o.atan(x("x",r,e,t))];case"Atan2":return[o.atan2(x("x",r,e,t),x("y",r,e,t))];case"Atanh":return[o.atanh(x("x",r,e,t))];case"Ceil":return[o.ceil(x("x",r,e,t))];case"Complex":return[o.complex(x("real",r,e,t),x("imag",r,e,t))];case"Cos":return[o.cos(x("x",r,e,t))];case"Cosh":return[o.cosh(x("x",r,e,t))];case"Elu":return[o.elu(x("x",r,e,t))];case"Erf":return[o.erf(x("x",r,e,t))];case"Exp":return[o.exp(x("x",r,e,t))];case"Expm1":return[o.expm1(x("x",r,e,t))];case"Floor":return[o.floor(x("x",r,e,t))];case"Log":return[o.log(x("x",r,e,t))];case"Log1p":return[o.log1p(x("x",r,e,t))];case"Imag":return[o.imag(x("x",r,e,t))];case"Neg":return[o.neg(x("x",r,e,t))];case"Reciprocal":return[o.reciprocal(x("x",r,e,t))];case"Real":return[o.real(x("x",r,e,t))];case"Relu":return[o.relu(x("x",r,e,t))];case"Round":return[o.round(x("x",r,e,t))];case"Selu":return[o.selu(x("x",r,e,t))];case"Sigmoid":return[o.sigmoid(x("x",r,e,t))];case"Sin":return[o.sin(x("x",r,e,t))];case"Sign":return[o.sign(x("x",r,e,t))];case"Sinh":return[o.sinh(x("x",r,e,t))];case"Softplus":return[o.softplus(x("x",r,e,t))];case"Sqrt":return[o.sqrt(x("x",r,e,t))];case"Square":return[o.square(x("x",r,e,t))];case"Tanh":return[o.tanh(x("x",r,e,t))];case"Tan":return[o.tan(x("x",r,e,t))];case"ClipByValue":return[o.clipByValue(x("x",r,e,t),x("clipValueMin",r,e,t),x("clipValueMax",r,e,t))];case"Relu6":return[o.relu6(x("x",r,e,t))];case"Rsqrt":return[o.rsqrt(Pe(r.inputNames[0],e,t))];case"Prod":return[o.prod(x("x",r,e,t),x("axes",r,e,t))];case"LeakyRelu":return[o.leakyRelu(x("x",r,e,t),x("alpha",r,e,t))];case"Prelu":return[o.prelu(x("x",r,e,t),x("alpha",r,e,t))];case"IsNan":return[o.isNaN(Pe(r.inputNames[0],e,t))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};function wt(r,e,t=""){if(!(typeof r=="number"||typeof e=="number")){C.assert(r.length===e.length,()=>t+` Shapes ${r} and ${e} must match`);for(let o=0;o<r.length;o++){let n=r[o],s=e[o];C.assert(n<0||s<0||n===s,()=>t+` Shapes ${r} and ${e} must match`)}}}function CC(r){return!(typeof r=="number"||r.some(e=>e<0))}function ms(r,e,t){let o=Sc(r,t),n=!CC(o);if(n&&e.length===0)throw new Error(`Tried to calculate elements of an empty list with non-fully-defined elementShape: ${o}`);if(n&&e.forEach(s=>{o=Sc(s.shape,o)}),!CC(o))throw new Error(`Non-fully-defined elementShape: ${o}`);return o}function Sc(r,e){if(typeof r=="number")return e;if(typeof e=="number")return r;if(r.length!==e.length)throw new Error(`Incompatible ranks during merge: ${r} vs. ${e}`);let t=[];for(let o=0;o<r.length;++o){let n=r[o],s=e[o];if(n>=0&&s>=0&&n!==s)throw new Error(`Incompatible shape during merge: ${r} vs. ${e}`);t[o]=n>=0?n:s}return t}var hx=class{constructor(e,t,o,n,s,i,a){this.name=e,this.dtype=t,this.maxSize=o,this.elementShape=n,this.identicalElementShapes=s,this.dynamicSize=i,this.clearAfterRead=a,this.tensors=[],this.closed_=!1,this.idTensor=j(0),ht(this.idTensor)}get id(){return this.idTensor.id}get closed(){return this.closed_}clearAndClose(e){this.tensors.forEach(t=>{(e==null||!e.has(t.tensor.id))&&t.tensor.dispose()}),this.tensors=[],this.closed_=!0,this.idTensor.dispose()}size(){return this.tensors.length}read(e){if(this.closed_)throw new Error(`TensorArray ${this.name} has already been closed.`);if(e<0||e>=this.size())throw new Error(`Tried to read from index ${e}, but array size is: ${this.size()}`);let t=this.tensors[e];if(t.cleared)throw new Error(`TensorArray ${this.name}: Could not read index ${e} twice because it was cleared after a previous read (perhaps try setting clear_after_read = false?).`);return this.clearAfterRead&&(t.cleared=!0),t.read=!0,t.tensor}readMany(e){return e.map(t=>this.read(t))}write(e,t){if(this.closed_)throw new Error(`TensorArray ${this.name} has already been closed.`);if(e<0||!this.dynamicSize&&e>=this.maxSize)throw new Error(`Tried to write to index ${e}, but array is not resizeable and size is: ${this.maxSize}`);let o=this.tensors[e]||{};if(t.dtype!==this.dtype)throw new Error(`TensorArray ${this.name}: Could not write to TensorArray index ${e},
          because the value dtype is ${t.dtype}, but TensorArray dtype is ${this.dtype}.`);if(this.size()===0&&(this.elementShape==null||this.elementShape.length===0)&&(this.elementShape=t.shape),wt(this.elementShape,t.shape,`TensorArray ${this.name}: Could not write to TensorArray index ${e}.`),o.read)throw new Error(`TensorArray ${this.name}: Could not write to TensorArray index ${e}, because it has already been read.`);if(o.written)throw new Error(`TensorArray ${this.name}: Could not write to TensorArray index ${e}, because it has already been written.`);o.tensor=t,ht(t),o.written=!0,this.tensors[e]=o}writeMany(e,t){if(e.length!==t.length)throw new Error(`TensorArray ${this.name}: could not write multiple tensors,because the index size: ${e.length} is not the same as tensors size: ${t.length}.`);e.forEach((o,n)=>this.write(o,t[n]))}gather(e,t){if(!!t&&t!==this.dtype)throw new Error(`TensorArray dtype is ${this.dtype} but gather requested dtype ${t}`);if(e)e=e.slice(0,this.size());else{e=[];for(let n=0;n<this.size();n++)e.push(n)}if(e.length===0)return qe([],[0].concat(this.elementShape));let o=this.readMany(e);return wt(this.elementShape,o[0].shape,"TensorArray shape mismatch: "),Qe(o,0)}concat(e){if(!!e&&e!==this.dtype)throw new Error(`TensorArray dtype is ${this.dtype} but concat requested dtype ${e}`);if(this.size()===0)return qe([],[0].concat(this.elementShape));let t=[];for(let n=0;n<this.size();n++)t.push(n);let o=this.readMany(t);return wt(this.elementShape,o[0].shape,`TensorArray shape mismatch: tensor array shape (${this.elementShape}) vs first tensor shape (${o[0].shape})`),ge(o,0)}scatter(e,t){if(t.dtype!==this.dtype)throw new Error(`TensorArray dtype is ${this.dtype} but tensor has dtype ${t.dtype}`);if(e.length!==t.shape[0])throw new Error(`Expected len(indices) == tensor.shape[0], but saw: ${e.length} vs. ${t.shape[0]}`);let o=Math.max(...e);if(!this.dynamicSize&&o>=this.maxSize)throw new Error(`Max index must be < array size (${o}  vs. ${this.maxSize})`);this.writeMany(e,xt(t,0))}split(e,t){if(t.dtype!==this.dtype)throw new Error(`TensorArray dtype is ${this.dtype} but tensor has dtype ${t.dtype}`);let o=0,n=e.map(l=>(o+=l,o));if(o!==t.shape[0])throw new Error(`Expected sum of lengths to be equal to
          tensor.shape[0], but sum of lengths is
        ${o}, and tensor's shape is: ${t.shape}`);if(!this.dynamicSize&&e.length!==this.maxSize)throw new Error(`TensorArray's size is not equal to the size of lengths (${this.maxSize} vs. ${e.length}), and the TensorArray is not marked as dynamically resizeable`);let s=o===0?0:t.size/o,i=[];Y(()=>{t=$(t,[1,o,s]);for(let l=0;l<e.length;++l){let u=l===0?0:n[l-1],c=[0,u,0],p=[1,e[l],s];i[l]=$(J(t,c,p),this.elementShape)}return i});let a=[];for(let l=0;l<e.length;l++)a[l]=l;this.writeMany(a,i)}};var so=class{constructor(e,t,o,n=-1){this.tensors=e,this.elementShape=t,this.elementDtype=o,e!=null&&e.forEach(s=>{if(o!==s.dtype)throw new Error(`Invalid data types; op elements ${o}, but list elements ${s.dtype}`);wt(t,s.shape,"TensorList shape mismatch: "),ht(s)}),this.idTensor=j(0),this.maxNumElements=n,ht(this.idTensor)}get id(){return this.idTensor.id}copy(){return new so([...this.tensors],this.elementShape,this.elementDtype)}clearAndClose(e){this.tensors.forEach(t=>{(e==null||!e.has(t.id))&&t.dispose()}),this.tensors.length=0,this.idTensor.dispose()}size(){return this.tensors.length}stack(e,t,o=-1){if(t!==this.elementDtype)throw new Error(`Invalid data types; op elements ${t}, but list elements ${this.elementDtype}`);if(o!==-1&&this.tensors.length!==o)throw new Error(`Operation expected a list with ${o} elements but got a list with ${this.tensors.length} elements.`);wt(e,this.elementShape,"TensorList shape mismatch: ");let n=ms(this.elementShape,this.tensors,e);return Y(()=>{let s=this.tensors.map(i=>$(i,n));return Qe(s,0)})}popBack(e,t){if(t!==this.elementDtype)throw new Error(`Invalid data types; op elements ${t}, but list elements ${this.elementDtype}`);if(this.size()===0)throw new Error("Trying to pop from an empty list.");let o=ms(this.elementShape,this.tensors,e),n=this.tensors.pop();return n.kept=!1,wt(n.shape,e,"TensorList shape mismatch: "),$(n,o)}pushBack(e){if(e.dtype!==this.elementDtype)throw new Error(`Invalid data types; op elements ${e.dtype}, but list elements ${this.elementDtype}`);if(wt(e.shape,this.elementShape,"TensorList shape mismatch: "),this.maxNumElements===this.size())throw new Error("Trying to push element into a full list.");ht(e),this.tensors.push(e)}resize(e){if(e<0)throw new Error(`TensorListResize expects size to be non-negative. Got: ${e}`);if(this.maxNumElements!==-1&&e>this.maxNumElements)throw new Error(`TensorListResize input size ${e} is greater maxNumElement ${this.maxNumElements}.`);let t=new so([],this.elementShape,this.elementDtype,this.maxNumElements);t.tensors.length=e;for(let o=0;o<Math.min(this.tensors.length,e);++o)t.tensors[o]=this.tensors[o];return t}getItem(e,t,o){if(o!==this.elementDtype)throw new Error(`Invalid data types; op elements ${o}, but list elements ${this.elementDtype}`);if(e<0||e>this.tensors.length)throw new Error(`Trying to access element ${e} in a list with ${this.tensors.length} elements.`);if(this.tensors[e]==null)throw new Error(`element at index ${e} is null.`);wt(this.tensors[e].shape,t,"TensorList shape mismatch: ");let n=ms(this.elementShape,this.tensors,t);return $(this.tensors[e],n)}setItem(e,t){if(t.dtype!==this.elementDtype)throw new Error(`Invalid data types; op elements ${t.dtype}, but list elements ${this.elementDtype}`);if(e<0||this.maxNumElements!==-1&&e>=this.maxNumElements)throw new Error(`Trying to set element ${e} in a list with max ${this.maxNumElements} elements.`);wt(this.elementShape,t.shape,"TensorList shape mismatch: "),ht(t),this.tensors[e]!=null&&(this.tensors[e].kept=!1),this.tensors[e]=t}gather(e,t,o){if(t!==this.elementDtype)throw new Error(`Invalid data types; op elements ${t}, but list elements ${this.elementDtype}`);wt(this.elementShape,o,"TensorList shape mismatch: "),e=e.slice(0,this.size());let n=ms(this.elementShape,this.tensors,o);return e.length===0?qe([],[0].concat(n)):Y(()=>{let s=e.map(i=>$(this.tensors[i],n));return Qe(s,0)})}concat(e,t){if(!!e&&e!==this.elementDtype)throw new Error(`TensorList dtype is ${this.elementDtype} but concat requested dtype ${e}`);wt(this.elementShape,t,"TensorList shape mismatch: ");let o=ms(this.elementShape,this.tensors,t);return this.size()===0?qe([],[0].concat(o)):Y(()=>{let n=this.tensors.map(s=>$(s,o));return ge(n,0)})}};function kC(r,e,t){let o=r.dtype;if(r.shape.length<1)throw new Error(`Tensor must be at least a vector, but saw shape: ${r.shape}`);if(r.dtype!==t)throw new Error(`Invalid data types; op elements ${r.dtype}, but list elements ${t}`);let n=r.shape.slice(1);wt(n,e,"TensorList shape mismatch: ");let s=xt(r);return new so(s,e,o)}function NC(r,e,t,o){return new so([],r,e,o)}function SC(r,e,t,o){if(e.length!==r.shape[0])throw new Error(`Expected len(indices) == tensor.shape[0], but saw: ${e.length} vs. ${r.shape[0]}`);let n=Math.max(...e);if(o!=null&&o!==-1&&n>=o)throw new Error(`Max index must be < array size (${n}  vs. ${o})`);let s=new so([],t,r.dtype,o),i=xt(r,0);return e.forEach((a,l)=>{s.setItem(a,i[l])}),s}function EC(r,e,t){let o=0,n=e.map(c=>(o+=c,o));if(o!==r.shape[0])throw new Error(`Expected sum of lengths to be equal to
          tensor.shape[0], but sum of lengths is
        ${o}, and tensor's shape is: ${r.shape}`);let s=r.shape.slice(1),i=Sc(s,t),a=o===0?0:r.size/o,l=Y(()=>{let c=[];r=$(r,[1,o,a]);for(let p=0;p<e.length;++p){let m=p===0?0:n[p-1],f=[0,m,0],d=[1,e[p],a];c[p]=$(J(r,f,d),i)}return r.dispose(),c}),u=new so([],t,r.dtype,e.length);for(let c=0;c<l.length;c++)u.setItem(c,l[c]);return u}var IC=async(r,e,t)=>{switch(r.op){case"If":case"StatelessIf":{let o=x("thenBranch",r,e,t),n=x("elseBranch",r,e,t),s=x("cond",r,e,t),i=x("args",r,e,t);return(await s.data())[0]?t.functionMap[o].executeFunctionAsync(i,t.tensorArrayMap,t.tensorListMap):t.functionMap[n].executeFunctionAsync(i,t.tensorArrayMap,t.tensorListMap)}case"While":case"StatelessWhile":{let o=x("body",r,e,t),n=x("cond",r,e,t),s=x("args",r,e,t),i=await t.functionMap[n].executeFunctionAsync(s,t.tensorArrayMap,t.tensorListMap),a=s.map(c=>c.id),l=await i[0].data();i.forEach(c=>{!c.kept&&a.indexOf(c.id)===-1&&c.dispose()});let u=s;for(;l[0];){let c=u;u=await t.functionMap[o].executeFunctionAsync(u,t.tensorArrayMap,t.tensorListMap);let p=u.map(f=>f.id);c.forEach(f=>{!f.kept&&a.indexOf(f.id)===-1&&p.indexOf(f.id)===-1&&f.dispose()});let m=await t.functionMap[n].executeFunctionAsync(u,t.tensorArrayMap,t.tensorListMap);l=await m[0].data(),m.forEach(f=>{!f.kept&&a.indexOf(f.id)===-1&&p.indexOf(f.id)===-1&&f.dispose()})}return u}case"LoopCond":{let o=x("pred",r,e,t);return[rr(o)]}case"Switch":{let o=x("pred",r,e,t),n=x("data",r,e,t);return n.kept||(n=rr(n)),(await o.data())[0]?[void 0,n]:[n,void 0]}case"Merge":{let o=r.inputNames.find(n=>Pe(n,e,t)!==void 0);if(o){let n=Pe(o,e,t);return[rr(n)]}return}case"Enter":{let o=x("frameName",r,e,t),n=x("tensor",r,e,t);return t.enterFrame(o),[rr(n)]}case"Exit":{let o=x("tensor",r,e,t);return t.exitFrame(),[rr(o)]}case"NextIteration":{let o=x("tensor",r,e,t);return t.nextIteration(),[rr(o)]}case"TensorArrayV3":{let o=x("size",r,e,t),n=x("dtype",r,e,t),s=x("elementShape",r,e,t),i=x("dynamicSize",r,e,t),a=x("clearAfterRead",r,e,t),l=x("identicalElementShapes",r,e,t),u=x("name",r,e,t),c=new hx(u,n,o,s,l,i,a);return t.addTensorArray(c),[c.idTensor,j(1)]}case"TensorArrayWriteV3":{let o=x("tensorArrayId",r,e,t),n=x("index",r,e,t),s=x("tensor",r,e,t),i=t.getTensorArray(o.id);return i.write(n,s),[i.idTensor]}case"TensorArrayReadV3":{let o=x("tensorArrayId",r,e,t),n=x("index",r,e,t);return[t.getTensorArray(o.id).read(n)]}case"TensorArrayGatherV3":{let o=x("tensorArrayId",r,e,t),n=x("indices",r,e,t),s=x("dtype",r,e,t);return[t.getTensorArray(o.id).gather(n,s)]}case"TensorArrayScatterV3":{let o=x("tensorArrayId",r,e,t),n=x("indices",r,e,t),s=x("tensor",r,e,t),i=t.getTensorArray(o.id);return i.scatter(n,s),[i.idTensor]}case"TensorArrayConcatV3":{let o=x("tensorArrayId",r,e,t),n=t.getTensorArray(o.id),s=x("dtype",r,e,t);return[n.concat(s)]}case"TensorArraySplitV3":{let o=x("tensorArrayId",r,e,t),n=x("tensor",r,e,t),s=x("lengths",r,e,t),i=t.getTensorArray(o.id);return i.split(s,n),[i.idTensor]}case"TensorArraySizeV3":{let o=x("tensorArrayId",r,e,t),n=t.getTensorArray(o.id);return[j(n.size(),"int32")]}case"TensorArrayCloseV3":{let o=x("tensorArrayId",r,e,t),n=t.getTensorArray(o.id);return n.clearAndClose(),[n.idTensor]}case"TensorListSetItem":{let o=x("tensorListId",r,e,t),n=x("index",r,e,t),s=x("tensor",r,e,t),i=t.getTensorList(o.id);return i.setItem(n,s),[i.idTensor]}case"TensorListGetItem":{let o=x("tensorListId",r,e,t),n=x("index",r,e,t),s=x("elementShape",r,e,t),i=x("elementDType",r,e,t);return[t.getTensorList(o.id).getItem(n,s,i)]}case"TensorListScatterV2":case"TensorListScatter":{let o=x("indices",r,e,t),n=x("tensor",r,e,t),s=x("elementShape",r,e,t),i=x("numElements",r,e,t),a=SC(n,o,s,i);return t.addTensorList(a),[a.idTensor]}case"TensorListReserve":case"EmptyTensorList":{let o=x("elementShape",r,e,t),n=x("elementDType",r,e,t),s;r.op==="TensorListReserve"?s="numElements":s="maxNumElements";let i=x(s,r,e,t),a=r.op==="TensorListReserve"?-1:i,l=NC(o,n,i,a);return t.addTensorList(l),[l.idTensor]}case"TensorListGather":{let o=x("tensorListId",r,e,t),n=x("indices",r,e,t),s=x("elementShape",r,e,t),i=x("elementDType",r,e,t);return[t.getTensorList(o.id).gather(n,i,s)]}case"TensorListStack":{let o=x("tensorListId",r,e,t),n=x("elementShape",r,e,t),s=x("elementDType",r,e,t),i=x("numElements",r,e,t);return[t.getTensorList(o.id).stack(n,s,i)]}case"TensorListFromTensor":{let o=x("tensor",r,e,t),n=x("elementShape",r,e,t),s=x("elementDType",r,e,t),i=kC(o,n,s);return t.addTensorList(i),[i.idTensor]}case"TensorListConcat":case"TensorListConcatV2":{let o=x("tensorListId",r,e,t),n=t.getTensorList(o.id),s=x("dtype",r,e,t),i=x("elementShape",r,e,t);return[n.concat(s,i)]}case"TensorListPushBack":{let o=x("tensorListId",r,e,t),n=x("tensor",r,e,t),s=t.getTensorList(o.id);return s.pushBack(n),[s.idTensor]}case"TensorListPopBack":{let o=x("tensorListId",r,e,t),n=x("elementShape",r,e,t),s=x("elementDType",r,e,t);return[t.getTensorList(o.id).popBack(n,s)]}case"TensorListSplit":{let o=x("tensor",r,e,t),n=x("elementShape",r,e,t),s=x("lengths",r,e,t),i=EC(o,s,n);return t.addTensorList(i),[i.idTensor]}case"TensorListLength":{let o=x("tensorListId",r,e,t),n=t.getTensorList(o.id);return[j(n.size(),"int32")]}case"TensorListResize":{let o=x("tensorListId",r,e,t),n=x("size",r,e,t),i=t.getTensorList(o.id).resize(n);return t.addTensorList(i),[i.idTensor]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};function $C(r,e,t){let[o,n]=x("fusedOps",r,e,t),s=o==="biasadd",i=!s,a=n==="prelu",l=o==="fusedbatchnorm",u=x("numArgs",r,e,t);if(s){if(a&&u!==2)throw new Error("FusedConv2d and DepthwiseConv2d with BiasAdd and Prelu must have two extra arguments: bias and alpha.");if(!a&&s&&u!==1)throw new Error("FusedConv2d and DepthwiseConv2d with BiasAdd must have one extra argument: bias.")}if(l)throw new Error("FusedConv2d and DepthwiseConv2d with FusedBatchNorm is not supported");let c=x("strides",r,e,t),p=Wl(r,e,t),m=x("dataFormat",r,e,t).toUpperCase(),f=x("dilations",r,e,t),[d,g]=x("args",r,e,t);i&&(g=d,d=void 0);let h=x("leakyreluAlpha",r,e,t);return{stride:c,pad:p,dataFormat:m,dilations:f,biasArg:d,preluArg:g,activationFunc:n,leakyreluAlpha:h}}var AC=(r,e,t,o=pe)=>{switch(r.op){case"Conv1D":{let n=x("stride",r,e,t),s=x("pad",r,e,t),i=x("dataFormat",r,e,t).toUpperCase(),a=x("dilation",r,e,t);return[o.conv1d(x("x",r,e,t),x("filter",r,e,t),n,s,i,a)]}case"Conv2D":{let n=x("strides",r,e,t),s=Wl(r,e,t),i=x("dataFormat",r,e,t).toUpperCase(),a=x("dilations",r,e,t);return[o.conv2d(x("x",r,e,t),x("filter",r,e,t),[n[1],n[2]],s,i,[a[1],a[2]])]}case"_FusedConv2D":{let{stride:n,pad:s,dataFormat:i,dilations:a,biasArg:l,preluArg:u,activationFunc:c,leakyreluAlpha:p}=$C(r,e,t);return[o.fused.conv2d({x:x("x",r,e,t),filter:x("filter",r,e,t),strides:[n[1],n[2]],pad:s,dataFormat:i,dilations:[a[1],a[2]],bias:l,activation:c,preluActivationWeights:u,leakyreluAlpha:p})]}case"FusedDepthwiseConv2dNative":{let{stride:n,pad:s,dataFormat:i,dilations:a,biasArg:l,preluArg:u,activationFunc:c,leakyreluAlpha:p}=$C(r,e,t);return[o.fused.depthwiseConv2d({x:x("x",r,e,t),filter:x("filter",r,e,t),strides:[n[1],n[2]],pad:s,dataFormat:i,dilations:[a[1],a[2]],bias:l,activation:c,preluActivationWeights:u,leakyreluAlpha:p})]}case"Conv2DBackpropInput":case"Conv2dTranspose":{let n=x("outputShape",r,e,t),s=x("strides",r,e,t),i=Wl(r,e,t);return[o.conv2dTranspose(x("x",r,e,t),x("filter",r,e,t),n,[s[1],s[2]],i)]}case"DepthwiseConv2dNative":case"DepthwiseConv2d":{let n=x("strides",r,e,t),s=Wl(r,e,t),i=x("dilations",r,e,t),a=x("dataFormat",r,e,t).toUpperCase();return[o.depthwiseConv2d(x("input",r,e,t),x("filter",r,e,t),[n[1],n[2]],s,a,[i[1],i[2]])]}case"Conv3D":{let n=x("strides",r,e,t),s=x("pad",r,e,t),i=x("dataFormat",r,e,t).toUpperCase(),a=x("dilations",r,e,t);return[o.conv3d(x("x",r,e,t),x("filter",r,e,t),[n[1],n[2],n[3]],s,i,[a[1],a[2],a[3]])]}case"AvgPool":{let n=x("strides",r,e,t),s=x("pad",r,e,t),i=x("kernelSize",r,e,t);return[o.avgPool(x("x",r,e,t),[i[1],i[2]],[n[1],n[2]],s)]}case"MaxPool":{let n=x("strides",r,e,t),s=x("pad",r,e,t),i=x("kernelSize",r,e,t);return[o.maxPool(x("x",r,e,t),[i[1],i[2]],[n[1],n[2]],s)]}case"MaxPoolWithArgmax":{let n=x("strides",r,e,t),s=x("pad",r,e,t),i=x("kernelSize",r,e,t),a=x("includeBatchInIndex",r,e,t),{result:l,indexes:u}=o.maxPoolWithArgmax(x("x",r,e,t),[i[1],i[2]],[n[1],n[2]],s,a);return[l,u]}case"AvgPool3D":{let n=x("strides",r,e,t),s=x("pad",r,e,t),i=x("kernelSize",r,e,t);return[o.avgPool3d(x("x",r,e,t),[i[1],i[2],i[3]],[n[1],n[2],n[3]],s)]}case"MaxPool3D":{let n=x("strides",r,e,t),s=x("pad",r,e,t),i=x("kernelSize",r,e,t);return[o.maxPool3d(x("x",r,e,t),[i[1],i[2],i[3]],[n[1],n[2],n[3]],s)]}case"Dilation2D":{let n=x("strides",r,e,t),s=x("pad",r,e,t),i=x("dilations",r,e,t),a=n[1],l=n[2],u=i[1],c=i[2];return[o.dilation2d(x("x",r,e,t),x("filter",r,e,t),[a,l],s,[u,c],"NHWC")]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};var RC=(r,e,t,o=pe)=>{switch(r.op){case"Fill":{let n=x("shape",r,e,t),s=x("dtype",r,e,t),i=x("value",r,e,t);return[o.fill(n,i,s)]}case"LinSpace":{let n=x("start",r,e,t),s=x("stop",r,e,t),i=x("num",r,e,t);return[o.linspace(n,s,i)]}case"Multinomial":{let n=x("logits",r,e,t),s=x("numSamples",r,e,t),i=x("seed",r,e,t);return[o.multinomial(n,s,i)]}case"OneHot":{let n=x("indices",r,e,t),s=x("depth",r,e,t),i=x("onValue",r,e,t),a=x("offValue",r,e,t),l=x("dtype",r,e,t);return[o.oneHot(n,s,i,a,l)]}case"Ones":return[o.ones(x("shape",r,e,t),x("dtype",r,e,t))];case"OnesLike":return[o.onesLike(x("x",r,e,t))];case"RandomStandardNormal":return[o.randomStandardNormal(x("shape",r,e,t),x("dtype",r,e,t),x("seed",r,e,t))];case"RandomUniform":return[o.randomUniform(x("shape",r,e,t),x("minval",r,e,t),x("maxval",r,e,t),x("dtype",r,e,t))];case"Range":{let n=x("start",r,e,t),s=x("stop",r,e,t),i=x("step",r,e,t);return[o.range(n,s,i,x("dtype",r,e,t))]}case"TruncatedNormal":{let n=x("shape",r,e,t),s=x("mean",r,e,t),i=x("stdDev",r,e,t),a=x("seed",r,e,t);return[o.truncatedNormal(n,s,i,x("dtype",r,e,t),a)]}case"Zeros":return[o.zeros(x("shape",r,e,t),x("dtype",r,e,t))];case"ZerosLike":return[o.zerosLike(x("x",r,e,t))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};function gx(r,e,t){let o=x("boxes",r,e,t),n=x("scores",r,e,t),s=x("maxOutputSize",r,e,t),i=x("iouThreshold",r,e,t),a=x("scoreThreshold",r,e,t),l=x("softNmsSigma",r,e,t);return{boxes:o,scores:n,maxOutputSize:s,iouThreshold:i,scoreThreshold:a,softNmsSigma:l}}var DC=async(r,e,t,o,n=pe)=>{switch(r.op){case"NonMaxSuppressionV5":{let{boxes:s,scores:i,maxOutputSize:a,iouThreshold:l,scoreThreshold:u,softNmsSigma:c}=gx(r,e,t),p=await n.image.nonMaxSuppressionWithScoreAsync(s,i,a,l,u,c);return[p.selectedIndices,p.selectedScores]}case"NonMaxSuppressionV4":{let{boxes:s,scores:i,maxOutputSize:a,iouThreshold:l,scoreThreshold:u}=gx(r,e,t),c=x("padToMaxOutputSize",r,e,t),p=await n.image.nonMaxSuppressionPaddedAsync(s,i,a,l,u,c);return[p.selectedIndices,p.validOutputs]}case"NonMaxSuppressionV3":case"NonMaxSuppressionV2":{let{boxes:s,scores:i,maxOutputSize:a,iouThreshold:l,scoreThreshold:u}=gx(r,e,t);return[await n.image.nonMaxSuppressionAsync(s,i,a,l,u)]}case"Where":{let s=n.cast(x("condition",r,e,t),"bool"),i=[await n.whereAsync(s)];return s.dispose(),i}case"ListDiff":return n.setdiff1dAsync(x("x",r,e,t),x("y",r,e,t));default:throw TypeError(`Node type ${r.op} is not implemented`)}};var FC=(r,e,t,o=pe)=>{switch(r.op){case"LowerBound":{let n=x("sortedSequence",r,e,t),s=x("values",r,e,t);return[o.lowerBound(n,s)]}case"TopKV2":{let n=x("x",r,e,t),s=x("k",r,e,t),i=x("sorted",r,e,t),a=o.topk(n,s,i);return[a.values,a.indices]}case"UpperBound":{let n=x("sortedSequence",r,e,t),s=x("values",r,e,t);return[o.upperBound(n,s)]}case"Unique":{let n=x("x",r,e,t),s=o.unique(n);return[s.values,s.indices]}case"UniqueV2":{let n=x("x",r,e,t),s=x("axis",r,e,t),i=o.unique(n,s);return[i.values,i.indices]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};var OC=(r,e,t,o=pe)=>{switch(r.op){case"Const":return e[r.name];case"PlaceholderWithDefault":let n=x("default",r,e,t);return[Pe(r.name,e,t)||n];case"Placeholder":return[Pe(r.name,e,t)];case"Identity":case"StopGradient":case"FakeQuantWithMinMaxVars":{let c=x("x",r,e,t);return[rr(c)]}case"IdentityN":return x("x",r,e,t).map(c=>rr(c));case"Snapshot":let s=x("x",r,e,t);return[rr(s)];case"Shape":return[o.tensor1d(x("x",r,e,t).shape,"int32")];case"ShapeN":return x("x",r,e,t).map(c=>o.tensor1d(c.shape));case"Size":return[o.scalar(x("x",r,e,t).size,"int32")];case"Rank":return[o.scalar(x("x",r,e,t).rank,"int32")];case"NoOp":return[o.scalar(1)];case"Print":let i=x("x",r,e,t),a=x("data",r,e,t),l=x("message",r,e,t),u=x("summarize",r,e,t);console.warn("The graph has a tf.print() operation,usually used for debugging, which slows down performance."),console.log(l);for(let c=0;c<a.length;c++)console.log(Array.prototype.slice.call(a[c].dataSync()).slice(0,u));return[i];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var xx=class{constructor(e,t){this.keyDType=e,this.valueDType=t,this.handle=j(0),this.tensorMap=new Map,ht(this.handle)}get id(){return this.handle.id}clearAndClose(){this.tensorMap.forEach(e=>e.dispose()),this.tensorMap.clear(),this.handle.dispose()}size(){return this.tensorMap.size}tensorSize(){return j(this.size(),"int32")}async import(e,t){this.checkKeyAndValueTensor(e,t);let o=await e.data();return this.tensorMap.forEach(n=>n.dispose()),this.tensorMap.clear(),Y(()=>{let n=xt(t),s=o.length,i=n.length;C.assert(s===i,()=>`The number of elements doesn't match, keys has ${s} elements, the values has ${i} elements.`);for(let a=0;a<s;a++){let l=o[a],u=n[a];ht(u),this.tensorMap.set(l,u)}return this.handle})}async find(e,t){this.checkKeyAndValueTensor(e,t);let o=await e.data();return Y(()=>{let n=[];for(let s=0;s<o.length;s++){let i=o[s],a=this.findWithDefault(i,t);n.push(a)}return Qe(n)})}findWithDefault(e,t){let o=this.tensorMap.get(e);return o!=null?o:t}checkKeyAndValueTensor(e,t){if(e.dtype!==this.keyDType)throw new Error(`Expect key dtype ${this.keyDType}, but got ${e.dtype}`);if(t.dtype!==this.valueDType)throw new Error(`Expect value dtype ${this.valueDType}, but got ${t.dtype}`)}};var PC=async(r,e,t,o)=>{switch(r.op){case"HashTable":case"HashTableV2":{let n=x("keyDType",r,e,t),s=x("valueDType",r,e,t),i=new xx(n,s);return o.addHashTable(r.name,i),[i.handle]}case"LookupTableImport":case"LookupTableImportV2":{let n=x("tableHandle",r,e,t,o),s=x("keys",r,e,t),i=x("values",r,e,t);return[await o.getHashTableById(n.id).import(s,i)]}case"LookupTableFind":case"LookupTableFindV2":{let n=x("tableHandle",r,e,t,o),s=x("keys",r,e,t),i=x("defaultValue",r,e,t);return[await o.getHashTableById(n.id).find(s,i)]}case"LookupTableSize":case"LookupTableSizeV2":{let n=x("tableHandle",r,e,t,o);return[o.getHashTableById(n.id).tensorSize()]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};var LC=(r,e,t,o=pe)=>{switch(r.op){case"ResizeBilinear":{let n=x("images",r,e,t),s=x("size",r,e,t),i=x("alignCorners",r,e,t),a=x("halfPixelCenters",r,e,t);return[o.image.resizeBilinear(n,[s[0],s[1]],i,a)]}case"ResizeNearestNeighbor":{let n=x("images",r,e,t),s=x("size",r,e,t),i=x("alignCorners",r,e,t),a=x("halfPixelCenters",r,e,t);return[o.image.resizeNearestNeighbor(n,[s[0],s[1]],i,a)]}case"CropAndResize":{let n=x("image",r,e,t),s=x("boxes",r,e,t),i=x("boxInd",r,e,t),a=x("cropSize",r,e,t),l=x("method",r,e,t),u=x("extrapolationValue",r,e,t);return[o.image.cropAndResize(n,s,i,a,l,u)]}case"ImageProjectiveTransformV3":{let n=x("images",r,e,t),s=x("transforms",r,e,t),i=x("outputShape",r,e,t),a=x("fillValue",r,e,t),l=x("interpolation",r,e,t),u=x("fillMode",r,e,t);return[o.image.transform(n,s,l.toLowerCase(),u.toLowerCase(),a,i)]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};var BC=(r,e,t,o=pe)=>{switch(r.op){case"Equal":return[o.equal(x("a",r,e,t),x("b",r,e,t))];case"NotEqual":return[o.notEqual(x("a",r,e,t),x("b",r,e,t))];case"Greater":return[o.greater(x("a",r,e,t),x("b",r,e,t))];case"GreaterEqual":return[o.greaterEqual(x("a",r,e,t),x("b",r,e,t))];case"Less":return[o.less(x("a",r,e,t),x("b",r,e,t))];case"LessEqual":return[o.lessEqual(x("a",r,e,t),x("b",r,e,t))];case"LogicalAnd":return[o.logicalAnd(x("a",r,e,t),x("b",r,e,t))];case"LogicalNot":return[o.logicalNot(x("a",r,e,t))];case"LogicalOr":return[o.logicalOr(x("a",r,e,t),x("b",r,e,t))];case"Select":case"SelectV2":return[o.where(x("condition",r,e,t),x("a",r,e,t),x("b",r,e,t))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var MC=(r,e,t,o=pe)=>{switch(r.op){case"BatchMatMul":case"BatchMatMulV2":case"MatMul":return[o.matMul(x("a",r,e,t),x("b",r,e,t),x("transposeA",r,e,t),x("transposeB",r,e,t))];case"Einsum":return[o.einsum(x("equation",r,e,t),...x("tensors",r,e,t))];case"Transpose":return[o.transpose(x("x",r,e,t),x("perm",r,e,t))];case"_FusedMatMul":let[n,s]=x("fusedOps",r,e,t),i=n==="biasadd",a=s==="prelu",l=x("numArgs",r,e,t),u=x("leakyreluAlpha",r,e,t);if(i){if(a&&l!==2)throw new Error("Fused MatMul with BiasAdd and Prelu must have two extra arguments: bias and alpha.");if(!a&&l!==1)throw new Error("Fused MatMul with BiasAdd must have one extra argument: bias.")}let[c,p]=x("args",r,e,t);return[o.fused.matMul({a:x("a",r,e,t),b:x("b",r,e,t),transposeA:x("transposeA",r,e,t),transposeB:x("transposeB",r,e,t),bias:c,activation:s,preluActivationWeights:p,leakyreluAlpha:u})];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var VC=(r,e,t,o=pe)=>{switch(r.op){case"EuclideanNorm":return[o.euclideanNorm(x("x",r,e,t),x("axis",r,e,t),x("keepDims",r,e,t))];case"FusedBatchNorm":case"FusedBatchNormV2":return[o.batchNorm(x("x",r,e,t),x("mean",r,e,t),x("variance",r,e,t),x("offset",r,e,t),x("scale",r,e,t),x("epsilon",r,e,t))];case"FusedBatchNormV3":return[o.batchNorm(x("x",r,e,t),x("mean",r,e,t),x("variance",r,e,t),x("offset",r,e,t),x("scale",r,e,t),x("epsilon",r,e,t))];case"LRN":return[o.localResponseNormalization(x("x",r,e,t),x("radius",r,e,t),x("bias",r,e,t),x("alpha",r,e,t),x("beta",r,e,t))];case"Softmax":return[o.softmax(x("x",r,e,t))];case"LogSoftmax":return[o.logSoftmax(x("x",r,e,t))];case"SparseToDense":return[o.sparseToDense(x("sparseIndices",r,e,t),x("outputShape",r,e,t),x("sparseValues",r,e,t),x("defaultValue",r,e,t))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var GC=(r,e,t,o=pe)=>{switch(r.op){case"Max":{let a=x("axis",r,e,t),l=x("keepDims",r,e,t);return[o.max(x("x",r,e,t),a,l)]}case"Mean":{let a=x("axis",r,e,t),l=x("keepDims",r,e,t);return[o.mean(x("x",r,e,t),a,l)]}case"Min":{let a=x("axis",r,e,t),l=x("keepDims",r,e,t);return[o.min(x("x",r,e,t),a,l)]}case"Sum":{let a=x("axis",r,e,t),l=x("keepDims",r,e,t);return[o.sum(x("x",r,e,t),a,l)]}case"All":{let a=x("axis",r,e,t),l=x("keepDims",r,e,t);return[o.all(x("x",r,e,t),a,l)]}case"Any":{let a=x("axis",r,e,t),l=x("keepDims",r,e,t);return[o.any(x("x",r,e,t),a,l)]}case"ArgMax":{let a=x("axis",r,e,t);return[o.argMax(x("x",r,e,t),a)]}case"ArgMin":{let a=x("axis",r,e,t);return[o.argMin(x("x",r,e,t),a)]}case"Prod":{let a=x("axis",r,e,t),l=x("keepDims",r,e,t);return[o.prod(x("x",r,e,t),a,l)]}case"Cumprod":{let a=x("axis",r,e,t),l=x("exclusive",r,e,t),u=x("reverse",r,e,t);return[o.cumprod(x("x",r,e,t),a,l,u)]}case"Cumsum":{let a=x("axis",r,e,t),l=x("exclusive",r,e,t),u=x("reverse",r,e,t);return[o.cumsum(x("x",r,e,t),a,l,u)]}case"Bincount":let n=x("x",r,e,t),s=x("weights",r,e,t),i=x("size",r,e,t);return[o.bincount(n,s,i)];case"DenseBincount":{let a=x("x",r,e,t),l=x("weights",r,e,t),u=x("size",r,e,t),c=x("binaryOutput",r,e,t);return[o.denseBincount(a,l,u,c)]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};var zC=(r,e,t,o=pe)=>{switch(r.op){case"ConcatV2":case"Concat":{let n=x("n",r,e,t),s=x("axis",r,e,t),i=x("tensors",r,e,t);return i=i.slice(0,n),[o.concat(i,s)]}case"Gather":{let n=x("x",r,e,t),s=x("indices",r,e,t);return[o.gather(n,o.cast(s,"int32"),0)]}case"GatherV2":{let n=x("axis",r,e,t),s=x("batchDims",r,e,t),i=x("x",r,e,t),a=x("indices",r,e,t);return[o.gather(i,o.cast(a,"int32"),n,s)]}case"Reverse":{let n=x("dims",r,e,t),s=[];for(let a=0;a<n.length;a++)n[a]&&s.push(a);let i=x("x",r,e,t);return[o.reverse(i,s)]}case"ReverseV2":{let n=x("axis",r,e,t),s=x("x",r,e,t);return[o.reverse(s,n)]}case"Slice":{let n=x("begin",r,e,t),s=x("size",r,e,t);return[o.slice(x("x",r,e,t),n,s)]}case"StridedSlice":{let n=x("begin",r,e,t),s=x("end",r,e,t),i=x("strides",r,e,t),a=x("beginMask",r,e,t),l=x("endMask",r,e,t),u=x("ellipsisMask",r,e,t),c=x("newAxisMask",r,e,t),p=x("shrinkAxisMask",r,e,t),m=x("x",r,e,t);return[o.stridedSlice(m,n,s,i,a,l,u,c,p)]}case"Pack":return Y(()=>{let n=x("axis",r,e,t),s=x("tensors",r,e,t),i=s[0].shape,a=o.squeeze(s[0]).shape,l=s.map(u=>{let c=C.arraysEqual(u.shape,i);if(!c&&!C.arraysEqual(o.squeeze(u).shape,a))throw new Error("the input tensors shape does not match");return c?u:o.reshape(u,i)});return[o.stack(l,n)]});case"Unpack":{let n=x("axis",r,e,t),s=x("tensor",r,e,t);return o.unstack(s,n)}case"Tile":{let n=x("reps",r,e,t);return[o.tile(x("x",r,e,t),n)]}case"Split":case"SplitV":{let n=x("axis",r,e,t),s=x("numOrSizeSplits",r,e,t),i=x("x",r,e,t);return o.split(i,s,n)}case"ScatterNd":{let n=x("indices",r,e,t),s=x("values",r,e,t),i=x("shape",r,e,t);return[o.scatterND(n,s,i)]}case"GatherNd":{let n=x("x",r,e,t),s=x("indices",r,e,t);return[o.gatherND(n,s)]}case"SparseToDense":{let n=x("sparseIndices",r,e,t),s=x("outputShape",r,e,t),i=x("sparseValues",r,e,t),a=x("defaultValue",r,e,t);return[o.sparseToDense(n,i,s,i.dtype===a.dtype?a:o.cast(a,i.dtype))]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};var UC=(r,e,t,o=pe)=>{switch(r.op){case"SparseFillEmptyRows":{let{outputIndices:n,outputValues:s,emptyRowIndicator:i,reverseIndexMap:a}=o.sparse.sparseFillEmptyRows(x("indices",r,e,t),x("values",r,e,t),x("denseShape",r,e,t),x("defaultValue",r,e,t));return[n,s,i,a]}case"SparseReshape":{let{outputIndices:n,outputShape:s}=o.sparse.sparseReshape(x("inputIndices",r,e,t),x("inputShape",r,e,t),x("newShape",r,e,t));return[n,s]}case"SparseSegmentMean":return[o.sparse.sparseSegmentMean(x("data",r,e,t),x("indices",r,e,t),x("segmentIds",r,e,t))];case"SparseSegmentSum":return[o.sparse.sparseSegmentSum(x("data",r,e,t),x("indices",r,e,t),x("segmentIds",r,e,t))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var WC=(r,e,t,o=pe)=>{switch(r.op){case"FFT":return[o.fft(x("x",r,e,t))];case"IFFT":return[o.ifft(x("x",r,e,t))];case"RFFT":return[o.rfft(x("x",r,e,t))];case"IRFFT":return[o.irfft(x("x",r,e,t))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var jC=(r,e,t,o=pe)=>{switch(r.op){case"StringNGrams":{let{nGrams:n,nGramsSplits:s}=o.string.stringNGrams(x("data",r,e,t),x("dataSplits",r,e,t),x("separator",r,e,t),x("nGramWidths",r,e,t),x("leftPad",r,e,t),x("rightPad",r,e,t),x("padWidth",r,e,t),x("preserveShortSequences",r,e,t));return[n,s]}case"StringSplit":{let{indices:n,values:s,shape:i}=o.string.stringSplit(x("input",r,e,t),x("delimiter",r,e,t),x("skipEmpty",r,e,t));return[n,s,i]}case"StringToHashBucketFast":return[o.string.stringToHashBucketFast(x("input",r,e,t),x("numBuckets",r,e,t))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var HC=(r,e,t,o=pe)=>{switch(r.op){case"Cast":return[o.cast(x("x",r,e,t),x("dtype",r,e,t))];case"ExpandDims":{let n=x("axis",r,e,t);return[o.expandDims(x("x",r,e,t),n)]}case"Squeeze":{let n=x("axis",r,e,t);return[o.squeeze(x("x",r,e,t),n)]}case"Reshape":return[o.reshape(x("x",r,e,t),x("shape",r,e,t))];case"MirrorPad":return[o.mirrorPad(x("x",r,e,t),x("padding",r,e,t),x("mode",r,e,t))];case"PadV2":case"Pad":return[o.pad(x("x",r,e,t),x("padding",r,e,t),x("constantValue",r,e,t))];case"SpaceToBatchND":{let n=x("blockShape",r,e,t),s=x("paddings",r,e,t);return[o.spaceToBatchND(x("x",r,e,t),n,s)]}case"BatchToSpaceND":{let n=x("blockShape",r,e,t),s=x("crops",r,e,t);return[o.batchToSpaceND(x("x",r,e,t),n,s)]}case"DepthToSpace":{let n=x("blockSize",r,e,t),s=x("dataFormat",r,e,t).toUpperCase();return[o.depthToSpace(x("x",r,e,t),n,s)]}case"BroadcastTo":return[o.broadcastTo(x("x",r,e,t),x("shape",r,e,t))];case"BroadcastArgs":return[o.broadcastArgs(x("s0",r,e,t),x("s1",r,e,t))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};function yx(r,e,t,o,n=Y){let s=((i,a,l)=>{switch(i.category){case"arithmetic":return n(()=>vC(i,a,l));case"basic_math":return n(()=>TC(i,a,l));case"control":return IC(i,a,l);case"convolution":return n(()=>AC(i,a,l));case"creation":return n(()=>RC(i,a,l));case"dynamic":return DC(i,a,l);case"evaluation":return n(()=>FC(i,a,l));case"image":return n(()=>LC(i,a,l));case"graph":return n(()=>OC(i,a,l));case"logical":return n(()=>BC(i,a,l));case"matrices":return n(()=>MC(i,a,l));case"normalization":return n(()=>VC(i,a,l));case"reduction":return n(()=>GC(i,a,l));case"slice_join":return n(()=>zC(i,a,l));case"sparse":return n(()=>UC(i,a,l));case"spectral":return n(()=>WC(i,a,l));case"string":return n(()=>jC(i,a,l));case"transformation":return n(()=>HC(i,a,l));case"hash_table":return PC(i,a,l,o);case"custom":let u=dc(i.op);if(u&&u.customExecutor)return u.customExecutor(new dx(i,a,l));throw TypeError(`Custom op ${i.op} is not registered.`);default:throw TypeError(`Unknown op '${i.op}'. File an issue at https://github.com/tensorflow/tfjs/issues so we can add it, or register a custom execution with tf.registerOp()`)}})(r,e,t);return C.isPromise(s)?s.then(i=>[].concat(i)):[].concat(s)}var Ec=class{constructor(e={},t={},o={},n={}){this.weightMap=e,this.tensorArrayMap=t,this.tensorListMap=o,this.functionMap=n,this.rootContext={id:0,frameName:"",iterationId:0},this.contexts=[this.rootContext],this.lastId=0,this.generateCurrentContextIds()}newFrame(e,t){return{id:e,frameName:t,iterationId:0}}set currentContext(e){this.contexts!==e&&(this.contexts=e,this.generateCurrentContextIds())}get currentContext(){return this.contexts}get currentContextId(){return this._currentContextIds[0]}get currentContextIds(){return this._currentContextIds}generateCurrentContextIds(){let e=[];for(let t=0;t<this.contexts.length-1;t++){let o=this.contexts.slice(0,this.contexts.length-t);e.push(this.contextIdforContexts(o))}e.push(""),this._currentContextIds=e}contextIdforContexts(e){return e?e.map(t=>t.id===0&&t.iterationId===0?"":`${t.frameName}-${t.iterationId}`).join("/"):""}enterFrame(e){this.contexts&&(this.lastId++,this.contexts=this.contexts.slice(),this.contexts.push(this.newFrame(this.lastId,e)),this._currentContextIds.unshift(this.contextIdforContexts(this.contexts)))}exitFrame(){if(this.contexts&&this.contexts.length>1)this.contexts=this.contexts.slice(),this.contexts.splice(-1),this.currentContextIds.shift();else throw new Error("Cannot exit frame, the context is empty")}nextIteration(){if(this.contexts&&this.contexts.length>0){this.contexts=this.contexts.slice(),this.lastId++;let e=Object.assign({},this.contexts[this.contexts.length-1]);e.iterationId+=1,e.id=this.lastId,this.contexts.splice(-1,1,e),this._currentContextIds.splice(0,1,this.contextIdforContexts(this.contexts))}else throw new Error("Cannot increase frame iteration, the context is empty")}getWeight(e){return this.weightMap[e]}addTensorArray(e){this.tensorArrayMap[e.id]=e}getTensorArray(e){return this.tensorArrayMap[e]}addTensorList(e){this.tensorListMap[e.id]=e}getTensorList(e){return this.tensorListMap[e]}dispose(e){for(let t in this.tensorArrayMap)this.tensorArrayMap[t].clearAndClose(e);for(let t in this.tensorListMap)this.tensorListMap[t].clearAndClose(e)}};function bx(r,e,t,o){let n=new Set,s=[],i=null,a=null,l=new Set,u=Object.keys(r).map(m=>it(m)[0]),c=[];o!=null&&(c=o.map(m=>it(m.name)[0]));let p=[...e];for(;p.length>0;){let m=p.pop();if((_x(m)||fB(m)||dB(m))&&i==null&&(i=m,a=i.children.map(f=>f.name).filter(f=>n.has(f))),n.add(m.name),t[m.name]==null&&u.indexOf(m.name)===-1&&c.indexOf(m.name)===-1){if(m.inputs.length===0){s.push(m.name);continue}m.inputs.forEach(f=>{l.has(f.name)||(l.add(f.name),p.push(f))})}}return{inputs:r,outputs:e,usedNodes:n,missingInputs:s,dynamicNode:i,syncInputs:a}}function qC(r,e,t){let{usedNodes:o,inputs:n}=t,s=[],i=Object.keys(n).map(c=>it(c)[0]).map(c=>r.nodes[c]),a=r.initNodes;i.forEach(c=>{o.has(c.name)&&s.push(c)}),r.weights.forEach(c=>{o.has(c.name)&&s.push(c)}),a!=null&&a.forEach(c=>{o.has(c.name)&&s.push(c)});let l=new Set,u=[];for(;s.length>0;){let c=s.pop();l.add(c.name),e[c.name]||u.push(c),c.children.forEach(p=>{!l.has(p.name)&&o.has(p.name)&&p.inputs.every(m=>l.has(m.name))&&s.push(p)})}return u}var cB=["Switch","Merge","Enter","Exit","NextIteration","StatelessIf","StatelessWhile","if","While"],pB=["NonMaxSuppressionV2","NonMaxSuppressionV3","NonMaxSuppressionV5","Where"],mB=["HashTable","HashTableV2","LookupTableImport","LookupTableImportV2","LookupTableFind","LookupTableFindV2","LookupTableSize","LookupTableSizeV2"];function _x(r){return cB.indexOf(r.op)>=0}function fB(r){return pB.indexOf(r.op)>=0}function dB(r){return mB.indexOf(r.op)>=0}var fs=class{constructor(e,t){this.graph=e,this.parent=t,this.compiledMap=new Map,this._weightMap={},this.SEPERATOR=",",this._functions={},this._functionExecutorMap={},this.intermediateTensors={},this.keepTensorForDebug=!1,this._outputs=e.outputs,this._inputs=e.inputs,this._initNodes=e.initNodes,this._signature=e.signature,this._functions=e.functions,e.functions!=null&&Object.keys(e.functions).forEach(o=>{this._functionExecutorMap[o]=new fs(e.functions[o],this)})}get weightIds(){return this.parent?this.parent.weightIds:this._weightIds}get functionExecutorMap(){return this.parent?this.parent.functionExecutorMap:this._functionExecutorMap}get weightMap(){return this.parent?this.parent.weightMap:this._weightMap}set weightMap(e){let t=Object.keys(e).map(o=>e[o].map(n=>n.id));this._weightIds=[].concat(...t),this._weightMap=e}set resourceManager(e){this._resourceManager=e}get inputs(){return this._inputs.map(e=>({name:e.name,shape:e.attrParams.shape?e.attrParams.shape.value:void 0,dtype:e.attrParams.dtype?e.attrParams.dtype.value:void 0}))}get outputs(){return this._outputs.map(e=>({name:e.name,shape:e.attrParams.shape?e.attrParams.shape.value:void 0,dtype:e.attrParams.dtype?e.attrParams.dtype.value:void 0}))}get inputNodes(){return this._inputs.map(e=>e.signatureKey||e.name)}get outputNodes(){return this._outputs.map(e=>{let t=e.signatureKey||e.name;return e.defaultOutput?`${t}:${e.defaultOutput}`:t})}get functions(){return Object.keys(this._functions).reduce((e,t)=>(e[t]=this._functions[t].signature,e),{})}getCompilationKey(e,t){let o=e.map(s=>s.name).sort(),n=t.map(s=>s.name).sort();return o.join(this.SEPERATOR)+"--"+n.join(this.SEPERATOR)}compile(e,t){let o=bx(e,t,this.weightMap,this._initNodes),{missingInputs:n,dynamicNode:s,syncInputs:i}=o;if(s!=null)throw new Error(`This execution contains the node '${s.name}', which has the dynamic op '${s.op}'. Please use model.executeAsync() instead. Alternatively, to avoid the dynamic ops, specify the inputs [${i}]`);if(n.length>0){let a=t.map(u=>u.name),l=Object.keys(e);throw new Error(`Cannot compute the outputs [${a}] from the provided inputs [${l}]. Missing the following inputs: [${n}]`)}return qC(this.graph,this.weightMap,o)}execute(e,t){e=this.mapInputs(e);let o=Object.keys(e).sort();this.checkInputs(e),this.checkInputShapeAndType(e),t=this.mapOutputs(t),this.checkOutputs(t);let n=o.map(p=>this.graph.nodes[it(p)[0]]),s=t.map(p=>it(p)[0]),i=s.map(p=>this.graph.nodes[p]);this.resetIntermediateTensors(),i.length===0&&(i=this._outputs);let a=this.getCompilationKey(n,i),l=this.compiledMap.get(a);l==null&&(l=this.compile(e,i),this.compiledMap.set(a,l));let u={},c={};return Y(()=>{let p=new Ec(this.weightMap,u,c,this.functionExecutorMap),m=Object.assign({},this.weightMap);Object.keys(e).forEach(g=>{let[h,b]=it(g),T=[];T[b]=e[g],m[h]=T});let f=this.getFrozenTensorIds(m),d={};for(let g=0;g<l.length;g++){let h=l[g];if(!m[h.name]){let b=yx(h,m,p,this._resourceManager);if(C.isPromise(b))throw new Error(`The execution of the op '${h.op}' returned a promise. Please use model.executeAsync() instead.`);m[h.name]=b,this.checkTensorForDisposal(h.name,h,m,p,f,s,d)}}return this.parent==null&&p.dispose(f),t.map(g=>Pe(g,m,p))})}getFrozenTensorIds(e){let t=[].concat.apply([],Object.keys(e).map(o=>e[o]).map(o=>o.map(n=>n.id)));return new Set(t)}checkTensorForDisposal(e,t,o,n,s,i,a){t.category==="control"||i.indexOf(e)!==-1||(o[e].forEach(l=>{l!=null&&(a[l.id]=(a[l.id]||0)+t.children.length)}),t.inputs.forEach(l=>{if(l.category!=="control"){let u=yC(l.name,o,n);u!=null&&u.forEach(c=>{if(c&&!c.kept&&!s.has(c.id)){let p=a[c.id];if(p===1){if(!this.keepTensorForDebug)c.dispose();else{let[m,f]=Mt(t.name,n);this.intermediateTensors[m]?this.intermediateTensors[m][f]=c:(this.intermediateTensors[m]=[],this.intermediateTensors[m][f]=c)}delete a[c.id]}else p!=null&&a[c.id]--}})}}))}async executeAsync(e,t){return this._executeAsync(e,t)}disposeIntermediateTensors(){!this.intermediateTensors||(Object.keys(this.intermediateTensors).forEach(e=>this.intermediateTensors[e].forEach(t=>t.dispose())),this.disposeTensorsMap())}disposeTensorsMap(){!this.tensorsMap||Object.keys(this.tensorsMap).forEach(e=>{this.tensorsMap[e].forEach(o=>{o&&!o.kept&&!o.isDisposed&&!this.keepIds.has(o.id)&&o.dispose()})})}getIntermediateTensors(){return this.tensorsMap}resetIntermediateTensors(){for(let e in this.intermediateTensors)this.intermediateTensors[e].forEach(t=>t.dispose()),delete this.intermediateTensors[e]}async _executeAsync(e,t,o=!1,n={},s={}){o||(e=this.mapInputs(e),this.checkInputs(e),this.checkInputShapeAndType(e),t=this.mapOutputs(t),this.checkOutputs(t));try{this.keepTensorForDebug=E().getBool("KEEP_INTERMEDIATE_TENSORS")}catch(c){console.warn(c.message)}this.resetIntermediateTensors();let i=new Ec(this.weightMap,n,s,this.functionExecutorMap);this.tensorsMap=await this.executeWithControlFlow(e,i,t,o);let a=t.map(c=>Pe(c,this.tensorsMap,i)),l=a.map(c=>c.id),u=Object.keys(e).map(c=>e[c].id);return this.keepIds=new Set([...l,...u,...this.weightIds]),this.keepTensorForDebug||this.disposeTensorsMap(),this.parent==null&&i.dispose(this.keepIds),a}async executeFunctionAsync(e,t,o){let n=e.reduce((s,i,a)=>(s[this.inputs[a].name]=i,s),{});return this._executeAsync(n,this.outputNodes,!0,t,o)}async executeWithControlFlow(e,t,o,n){let s=Object.keys(e),i=s.map(k=>this.graph.nodes[it(k)[0]]),a=o.map(k=>it(k)[0]),l=a.map(k=>this.graph.nodes[k]);l.length===0&&(l=this._outputs);let{usedNodes:u,missingInputs:c,dynamicNode:p,syncInputs:m}=bx(e,l,this.weightMap,this._initNodes),f=[...i,...this.graph.weights,...this._initNodes||[]].map(k=>({node:k,contexts:t.currentContext})),d=Object.assign({},this.weightMap);Object.keys(e).forEach(k=>{let[S,I]=it(k),A=[];A[I]=e[k],d[S]=A});let g={},h=this.getFrozenTensorIds(d),b={};for(;f.length>0;){let k=this.processStack(i,f,t,d,b,h,a,g,u);await Promise.all(k)}p==null&&!n&&console.warn("This model execution did not contain any nodes with control flow or dynamic output shapes. You can use model.execute() instead.");let T=l.filter(k=>!_x(k)&&!Pe(k.name,d,t)).map(k=>k.name);if(T.length>0){let k="";throw p!=null&&(k=`Alternatively, to avoid the dynamic ops, use model.execute() and specify the inputs [${m}]`),new Error(`Cannot compute the outputs [${T}] from the provided inputs [${s}]. Consider providing the following inputs: [${c}]. ${k}`)}return d}processStack(e,t,o,n,s,i,a,l,u){let c=[];for(;t.length>0;){let p=t.pop();o.currentContext=p.contexts;let m="";if(p.node.op==="Enter"&&x("isConstant",p.node,n,o)&&([m]=Mt(p.node.name,o)),n[p.node.name]==null){let f=yx(p.node,n,o,this._resourceManager);m||([m]=Mt(p.node.name,o));let d=o.currentContext;C.isPromise(f)?c.push(f.then(g=>(n[m]=g,o.currentContext=d,this.checkTensorForDisposal(m,p.node,n,o,i,a,l),this.processChildNodes(p.node,t,o,n,s,u),g))):(n[m]=f,this.checkTensorForDisposal(m,p.node,n,o,i,a,l),this.processChildNodes(p.node,t,o,n,s,u))}else this.processChildNodes(p.node,t,o,n,s,u)}return c}processChildNodes(e,t,o,n,s,i){e.children.forEach(a=>{let[l]=Mt(a.name,o);s[l]||!i.has(a.name)||(a.op==="Merge"?a.inputNames.some(u=>!!Pe(u,n,o))&&(s[l]=!0,t.push({contexts:o.currentContext,node:a})):a.inputNames.every(u=>!!Pe(u,n,o))&&(s[l]=!0,t.push({contexts:o.currentContext,node:a})))})}dispose(){Object.keys(this.weightMap).forEach(e=>this.weightMap[e].forEach(t=>t.dispose()))}checkInputShapeAndType(e){Object.keys(e).forEach(t=>{let o=e[t],[n]=it(t),s=this.graph.nodes[n];if(s.attrParams.shape&&s.attrParams.shape.value){let i=s.attrParams.shape.value,a=i.length===o.shape.length&&o.shape.every((l,u)=>i[u]===-1||i[u]===l);C.assert(a,()=>`The shape of dict['${s.name}'] provided in model.execute(dict) must be [${i}], but was [${o.shape}]`)}s.attrParams.dtype&&s.attrParams.dtype.value&&C.assert(o.dtype===s.attrParams.dtype.value,()=>`The dtype of dict['${s.name}'] provided in model.execute(dict) must be ${s.attrParams.dtype.value}, but was ${o.dtype}`)})}mapInputs(e){let t={};for(let o in e)if(this._signature!=null&&this._signature.inputs!=null&&this._signature.inputs[o]!=null){let n=this._signature.inputs[o];t[n.name]=e[o]}else t[o]=e[o];return t}checkInputs(e){let t=Object.keys(e).filter(o=>{let[n]=it(o);return this.graph.nodes[n]==null});if(t.length>0)throw new Error(`The dict provided in model.execute(dict) has keys: [${t}] that are not part of graph`)}mapOutputs(e){return e.map(t=>this._signature!=null&&this._signature.outputs!=null&&this._signature.outputs[t]!=null?this._signature.outputs[t].name:t,{})}checkOutputs(e){e.forEach(t=>{let[o]=it(t);if(!this.graph.nodes[o])throw new Error(`The output '${t}' is not found in the graph`)})}};var vx=class{constructor(e={},t={}){this.hashTableNameToHandle=e,this.hashTableMap=t}addHashTable(e,t){this.hashTableNameToHandle[e]=t.handle,this.hashTableMap[t.id]=t}getHashTableHandleByName(e){return this.hashTableNameToHandle[e]}getHashTableById(e){return this.hashTableMap[e]}dispose(){for(let e in this.hashTableMap)this.hashTableMap[e].clearAndClose(),delete this.hashTableMap[e];for(let e in this.hashTableNameToHandle)this.hashTableNameToHandle[e].dispose(),delete this.hashTableNameToHandle[e]}};var hB="?tfjs-format=file",gB="model.json",Tx=class{constructor(e,t={},o=Wn){this.modelUrl=e,this.loadOptions=t,this.version="n/a",this.io=o,t==null&&(this.loadOptions={}),this.resourceManager=new vx}get modelVersion(){return this.version}get inputNodes(){return this.executor.inputNodes}get outputNodes(){return this.executor.outputNodes}get inputs(){return this.executor.inputs}get outputs(){return this.executor.outputs}get weights(){return this.executor.weightMap}get metadata(){return this.artifacts.userDefinedMetadata}get modelSignature(){return this.signature}get modelStructuredOutputKeys(){return this.structuredOutputKeys}findIOHandler(){let e=this.modelUrl;if(e.load!=null)this.handler=e;else if(this.loadOptions.requestInit!=null)this.handler=this.io.browserHTTPRequest(e,this.loadOptions);else{let t=this.io.getLoadHandlers(e,this.loadOptions);if(t.length===0)t.push(this.io.browserHTTPRequest(e,this.loadOptions));else if(t.length>1)throw new Error(`Found more than one (${t.length}) load handlers for URL '${[e]}'`);this.handler=t[0]}}load(){if(this.findIOHandler(),this.handler.load==null)throw new Error("Cannot proceed with model loading because the IOHandler provided does not have the `load` method implemented.");let e=this.handler.load();return C.isPromise(e)?e.then(t=>this.loadSync(t)):this.loadSync(e)}loadSync(e){this.artifacts=e;let t=this.artifacts.modelTopology,o=this.artifacts.signature;if(this.artifacts.userDefinedMetadata!=null){let s=this.artifacts.userDefinedMetadata;s.signature!=null&&(o=s.signature),s.structuredOutputKeys!=null&&(this.structuredOutputKeys=s.structuredOutputKeys)}this.signature=o,this.version=`${t.versions.producer}.${t.versions.minConsumer}`;let n=this.io.decodeWeights(this.artifacts.weightData,this.artifacts.weightSpecs);if(this.executor=new fs(gc.Instance.transformGraph(t,this.signature)),this.executor.weightMap=this.convertTensorMapToTensorsMap(n),this.executor.resourceManager=this.resourceManager,e.modelInitializer!=null&&e.modelInitializer.node!=null){let s=gc.Instance.transformGraph(e.modelInitializer);this.initializer=new fs(s),this.initializer.weightMap=this.executor.weightMap,this.initializer.resourceManager=this.resourceManager,this.initializer.executeAsync({},[])}return!0}async save(e,t){if(typeof e=="string"){let o=this.io.getSaveHandlers(e);if(o.length===0)throw new Error(`Cannot find any save handlers for URL '${e}'`);if(o.length>1)throw new Error(`Found more than one (${o.length}) save handlers for URL '${e}'`);e=o[0]}if(e.save==null)throw new Error("GraphModel.save() cannot proceed because the IOHandler provided does not have the `save` attribute defined.");return e.save(this.artifacts)}predict(e,t){let o=this.execute(e,this.outputNodes);if(this.structuredOutputKeys){let n=o instanceof ue?[o]:o,s={};return n.forEach((i,a)=>s[this.structuredOutputKeys[a]]=i),s}return o}normalizeInputs(e){if(!(e instanceof ue)&&!Array.isArray(e))return e;if(e=Array.isArray(e)?e:[e],e.length!==this.inputNodes.length)throw new Error(`Input tensor count mismatch,the graph model has ${this.inputNodes.length} placeholders, while there are ${e.length} input tensors.`);return this.inputNodes.reduce((t,o,n)=>(t[o]=e[n],t),{})}normalizeOutputs(e){return e=e||this.outputNodes,Array.isArray(e)?e:[e]}execute(e,t){e=this.normalizeInputs(e),t=this.normalizeOutputs(t);let o=this.executor.execute(e,t);return o.length>1?o:o[0]}async executeAsync(e,t){e=this.normalizeInputs(e),t=this.normalizeOutputs(t);let o=await this.executor.executeAsync(e,t);return o.length>1?o:o[0]}getIntermediateTensors(){return this.executor.getIntermediateTensors()}disposeIntermediateTensors(){this.executor.disposeIntermediateTensors()}convertTensorMapToTensorsMap(e){return Object.keys(e).reduce((t,o)=>(t[o]=[e[o]],t),{})}dispose(){this.executor.dispose(),this.initializer&&this.initializer.dispose(),this.resourceManager.dispose()}};async function Ic(r,e={},t=Wn){if(r==null)throw new Error("modelUrl in loadGraphModel() cannot be null. Please provide a url or an IOHandler that loads the model");e==null&&(e={}),e.fromTFHub&&typeof r=="string"&&(r=xB(r));let o=new Tx(r,e,t);return await o.load(),o}function xB(r){return r.endsWith("/")||(r=r+"/"),`${r}${gB}${hB}`}function $c(r){return[Math.abs(r.endPoint[0]-r.startPoint[0]),Math.abs(r.endPoint[1]-r.startPoint[1])]}function jl(r){return[r.startPoint[0]+(r.endPoint[0]-r.startPoint[0])/2,r.startPoint[1]+(r.endPoint[1]-r.startPoint[1])/2]}function KC(r,e,t){let o=e.shape[1],n=e.shape[2],s=[[r.startPoint[1]/o,r.startPoint[0]/n,r.endPoint[1]/o,r.endPoint[0]/n]];return Rr.cropAndResize(e,s,[0],t)}function XC(r,e){let t=[r.startPoint[0]*e[0],r.startPoint[1]*e[1]],o=[r.endPoint[0]*e[0],r.endPoint[1]*e[1]],n=r.palmLandmarks.map(s=>[s[0]*e[0],s[1]*e[1]]);return{startPoint:t,endPoint:o,palmLandmarks:n}}function Cx(r,e=1.5){let t=jl(r),o=$c(r),n=[e*o[0]/2,e*o[1]/2],s=[t[0]-n[0],t[1]-n[1]],i=[t[0]+n[0],t[1]+n[1]];return{startPoint:s,endPoint:i,palmLandmarks:r.palmLandmarks}}function kx(r){let e=jl(r),t=$c(r),n=Math.max(...t)/2,s=[e[0]-n,e[1]-n],i=[e[0]+n,e[1]+n];return{startPoint:s,endPoint:i,palmLandmarks:r.palmLandmarks}}function Nx(r,e){let t=[r.endPoint[0]-r.startPoint[0],r.endPoint[1]-r.startPoint[1]],o=[t[0]*e[0],t[1]*e[1]],n=[r.startPoint[0]+o[0],r.startPoint[1]+o[1]],s=[r.endPoint[0]+o[0],r.endPoint[1]+o[1]];return{startPoint:n,endPoint:s,palmLandmarks:r.palmLandmarks}}var Sx=class{constructor(e,t,o,n,s,i){this.model=e;this.width=t;this.height=o;this.iouThreshold=s;this.scoreThreshold=i;this.anchors=n.map(a=>[a.x_center,a.y_center]),this.anchorsTensor=Xt(this.anchors),this.inputSizeTensor=Oe([t,o]),this.doubleInputSizeTensor=Oe([t*2,o*2])}normalizeBoxes(e){return Y(()=>{let t=J(e,[0,0],[-1,2]),o=J(e,[0,2],[-1,2]),n=G(Z(t,this.inputSizeTensor),this.anchorsTensor),s=Z(o,this.doubleInputSizeTensor),i=F(H(n,s),this.inputSizeTensor),a=F(G(n,s),this.inputSizeTensor);return Qa([i,a],1)})}normalizeLandmarks(e,t){return Y(()=>{let o=G(Z($(e,[-1,7,2]),this.inputSizeTensor),this.anchors[t]);return F(o,this.inputSizeTensor)})}async getBoundingBoxes(e){let t=Y(()=>F(H(e,.5),2)),o;if(Hn()==="webgl"){let h=E().get("WEBGL_PACK_DEPTHWISECONV");E().set("WEBGL_PACK_DEPTHWISECONV",!0),o=this.model.predict(t),E().set("WEBGL_PACK_DEPTHWISECONV",h)}else o=this.model.predict(t);let n=pr(o),s=Y(()=>pr(Ct(J(n,[0,0],[-1,1])))),i=J(n,[0,1],[-1,4]),a=this.normalizeBoxes(i),l=console.warn;console.warn=()=>{};let u=Rr.nonMaxSuppression(a,s,1,this.iouThreshold,this.scoreThreshold);console.warn=l;let c=await u.array(),p=[t,o,u,n,a,i,s];if(c.length===0)return p.forEach(h=>h.dispose()),null;let m=c[0],f=J(a,[m,0],[1,-1]),d=J(n,[m,5],[1,14]),g=Y(()=>$(this.normalizeLandmarks(d,m),[-1,2]));return p.push(d),p.forEach(h=>h.dispose()),{boxes:f,palmLandmarks:g}}async estimateHandBounds(e){let t=e.shape[1],o=e.shape[2],n=Y(()=>Z(Rr.resizeBilinear(e,[this.width,this.height]),255)),s=await this.getBoundingBoxes(n);if(s===null)return n.dispose(),null;let i=s.boxes.arraySync(),a=i[0].slice(0,2),l=i[0].slice(2,4),u=s.palmLandmarks.arraySync();return n.dispose(),s.boxes.dispose(),s.palmLandmarks.dispose(),XC({startPoint:a,endPoint:l,palmLandmarks:u},[o/this.width,t/this.height])}};var Ac={thumb:[1,2,3,4],indexFinger:[5,6,7,8],middleFinger:[9,10,11,12],ringFinger:[13,14,15,16],pinky:[17,18,19,20],palmBase:[0]};function yB(r){return r-2*Math.PI*Math.floor((r+Math.PI)/(2*Math.PI))}function YC(r,e){let t=Math.PI/2-Math.atan2(-(e[1]-r[1]),e[0]-r[0]);return yB(t)}var QC=(r,e)=>[[1,0,r],[0,1,e],[0,0,1]];function io(r,e){let t=0;for(let o=0;o<r.length;o++)t+=r[o]*e[o];return t}function bB(r,e){let t=[];for(let o=0;o<r.length;o++)t.push(r[o][e]);return t}function ZC(r,e){let t=[],o=r.length;for(let n=0;n<o;n++){t.push([]);for(let s=0;s<o;s++)t[n].push(io(r[n],bB(e,s)))}return t}function Ex(r,e){let t=Math.cos(r),o=Math.sin(r),n=[[t,-o,0],[o,t,0],[0,0,1]],s=QC(e[0],e[1]),i=ZC(s,n),a=QC(-e[0],-e[1]);return ZC(i,a)}function JC(r){let e=[[r[0][0],r[1][0]],[r[0][1],r[1][1]]],t=[r[0][2],r[1][2]],o=[-io(e[0],t),-io(e[1],t)];return[e[0].concat(o[0]),e[1].concat(o[1]),[0,0,1]]}function Ix(r,e){return[io(r,e[0]),io(r,e[1])]}var _B=.8,wB=[0,-.4],vB=3,TB=[0,-.1],CB=1.65,ek=[0,5,9,13,17,1,2],kB=0,NB=2,$x=class{constructor(e,t,o,n,s,i){this.boundingBoxDetector=e;this.meshDetector=t;this.meshWidth=o;this.meshHeight=n;this.maxContinuousChecks=s;this.detectionConfidence=i;this.regionsOfInterest=[];this.runsWithoutHandDetector=0;this.maxHandsNumber=1}getBoxForPalmLandmarks(e,t){let o=e.map(s=>{let i=[...s,1];return Ix(i,t)}),n=this.calculateLandmarksBoundingBox(o);return Cx(kx(Nx(n,wB)),vB)}getBoxForHandLandmarks(e){let t=this.calculateLandmarksBoundingBox(e),o=Cx(kx(Nx(t,TB)),CB),n=[];for(let s=0;s<ek.length;s++)n.push(e[ek[s]].slice(0,2));return o.palmLandmarks=n,o}transformRawCoords(e,t,o,n){let s=$c(t),i=[s[0]/this.meshWidth,s[1]/this.meshHeight],a=e.map(f=>[i[0]*(f[0]-this.meshWidth/2),i[1]*(f[1]-this.meshHeight/2),f[2]]),l=Ex(o,[0,0]),u=a.map(f=>[...Ix(f,l),f[2]]),c=JC(n),p=[...jl(t),1],m=[io(p,c[0]),io(p,c[1])];return u.map(f=>[f[0]+m[0],f[1]+m[1],f[2]])}async estimateHand(e){let t=this.shouldUpdateRegionsOfInterest();if(t===!0){let I=await this.boundingBoxDetector.estimateHandBounds(e);if(I===null)return e.dispose(),this.regionsOfInterest=[],null;this.updateRegionsOfInterest(I,!0),this.runsWithoutHandDetector=0}else this.runsWithoutHandDetector++;let o=this.regionsOfInterest[0],n=YC(o.palmLandmarks[kB],o.palmLandmarks[NB]),s=jl(o),i=[s[0]/e.shape[2],s[1]/e.shape[1]],a=Rr.rotateWithOffset(e,n,0,i),l=Ex(-n,s),u;t===!0?u=this.getBoxForPalmLandmarks(o.palmLandmarks,l):u=o;let c=KC(u,a,[this.meshWidth,this.meshHeight]),p=Z(c,255);c.dispose(),a.dispose();let m;if(Hn()==="webgl"){let I=E().get("WEBGL_PACK_DEPTHWISECONV");E().set("WEBGL_PACK_DEPTHWISECONV",!0),m=this.meshDetector.predict(p),E().set("WEBGL_PACK_DEPTHWISECONV",I)}else m=this.meshDetector.predict(p);let[f,d]=m;p.dispose();let g=f.dataSync()[0];if(this.lastConfidence=g,f.dispose(),g<this.detectionConfidence)return d.dispose(),this.regionsOfInterest=[],null;let h=$(d,[-1,3]),b=h.arraySync();d.dispose(),h.dispose();let T=this.transformRawCoords(b,u,n,l),k=this.getBoxForHandLandmarks(T);return this.updateRegionsOfInterest(k,!1),{landmarks:T,handInViewConfidence:g,boundingBox:{topLeft:k.startPoint,bottomRight:k.endPoint}}}calculateLandmarksBoundingBox(e){let t=e.map(i=>i[0]),o=e.map(i=>i[1]),n=[Math.min(...t),Math.min(...o)],s=[Math.max(...t),Math.max(...o)];return{startPoint:n,endPoint:s}}updateRegionsOfInterest(e,t){if(t)this.regionsOfInterest=[e];else{let o=this.regionsOfInterest[0],n=0;if(o!=null&&o.startPoint!=null){let[s,i]=e.startPoint,[a,l]=e.endPoint,[u,c]=o.startPoint,[p,m]=o.endPoint,f=Math.max(s,u),d=Math.max(i,c),g=Math.min(a,p),h=Math.min(l,m),b=(g-f)*(h-d),T=(a-s)*(l-i),k=(p-u)*(m-i);n=b/(T+k-b)}this.regionsOfInterest[0]=n>_B?o:e}}shouldUpdateRegionsOfInterest(){return this.regionsOfInterest.length!==this.maxHandsNumber||this.runsWithoutHandDetector>=this.maxContinuousChecks}};async function SB(){return Ic("beadloop-model://handdetector/model.json",{fromTFHub:!1})}var tk=256,rk=256;async function EB(){return Ic("beadloop-model://handskeleton/model.json",{fromTFHub:!1})}async function IB(){return C.fetch("beadloop-model://anchors.json").then(r=>r.json())}async function ok({maxContinuousChecks:r=Infinity,detectionConfidence:e=.8,iouThreshold:t=.3,scoreThreshold:o=.5}={}){let[n,s,i]=await Promise.all([IB(),SB(),EB()]),a=new Sx(s,tk,rk,n,t,o),l=new $x(a,i,tk,rk,r,e);return new nk(l)}function $B(r){return r instanceof ue?[r.shape[0],r.shape[1]]:[r.height,r.width]}function AB(r,e){let{handInViewConfidence:t,landmarks:o,boundingBox:n}=r;return{handInViewConfidence:t,landmarks:o.map(s=>[e-1-s[0],s[1],s[2]]),boundingBox:{topLeft:[e-1-n.topLeft[0],n.topLeft[1]],bottomRight:[e-1-n.bottomRight[0],n.bottomRight[1]]}}}var nk=class{constructor(e){this.pipeline=e}static getAnnotations(){return Ac}async estimateHands(e,t=!1){let[,o]=$B(e),n=Y(()=>(e instanceof ue||(e=Ha.fromPixels(e)),Rt(oe(e,"float32")))),s;try{s=await this.pipeline.estimateHand(n)}finally{n.dispose()}if(s===null)return[];let i=s;t===!0&&(i=AB(s,o));let a={};for(let l of Object.keys(Ac))a[l]=Ac[l].map(u=>i.landmarks[u]);return[{handInViewConfidence:i.handInViewConfidence,boundingBox:i.boundingBox,landmarks:i.landmarks,annotations:a}]}};var Rc=ds(ck()),Dc=ds(fk());var dk,hk=class{constructor(e){dk=e}fetch(e,t){return dk(e,t)}now(){return Date.now()}encode(e,t){if(t!=="utf-8"&&t!=="utf8")throw new Error(`Browser's encoder only supports utf-8, but got ${t}`);return new Dc.TextEncoder(t).encode(e)}decode(e,t){return new Dc.TextDecoder(t).decode(e)}},gk="wechat-webgl";function xk(r,e=!1){let t=r.tf,o=r.backendName||gk;if(e&&console.log(t),t.getBackend()===o)return;let n=r.webgl;t.ENV.setPlatform("wechat",new hk(r.fetchFunc)),zB(t),r.webgl&&r.canvas?WB(t,n,r.canvas,o,e):console.log("webgl backend is not initialized, please inject webgl backend and the offscreen canvas.")}function zB(r){r.ENV.global.btoa=Rc.btoa,r.ENV.global.atob=Rc.atob}var UB=2;function WB(r,e,t,o=gk,n=!1){if(r.findBackend(o)==null){let s={alpha:!1,antialias:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1,depth:!1,stencil:!1,failIfMajorPerformanceCaveat:!0},i=t.getContext("webgl",s);n&&console.log("start backend registration");try{r.registerBackend(o,()=>{e.setWebGLContext(1,i),r.ENV.set("WEBGL_VERSION",1);let l=new e.GPGPUContext(i);return new e.MathBackendWebGL(l)},UB),r.getKernelsForBackend("webgl").forEach(l=>{let u=Object.assign({},l,{backendName:o});r.registerKernel(u)})}catch(a){throw new Error(`Failed to register Webgl backend: ${a.message}`)}}r.setBackend(o),n&&console.log("current backend = ",r.getBackend())}var Fc=ds(vk()),Ax=null;async function qB(r,e){let t={},o=!1,n=()=>{if(o)throw new Error("\u6A21\u578B\u52A0\u8F7D\u5DF2\u53D6\u6D88")},s=()=>{Ax===t&&(Rp("wechat-webgl"),Ax=null)},i=(0,Fc.createModelLoader)(wx,e.config,e.onProgress);e.control&&(e.control.cancel=()=>{o=!0,i.cancel()}),await i.prepare(),n(),Yy("wechat-webgl")&&Rp("wechat-webgl"),Ax=t;let a;try{xk({tf:Zf,webgl:qg,canvas:r,fetchFunc:i.fetch});let c,p=async()=>(await Ky("wechat-webgl"),n(),await Xy(),n(),ok({maxContinuousChecks:8,detectionConfidence:.8}));try{a=await Promise.race([p(),new Promise((m,f)=>{c=setTimeout(()=>{o=!0,i.cancel(),f(new Error("\u624B\u90E8\u8BC6\u522B\u521D\u59CB\u5316\u8D85\u8FC7 20 \u79D2\uFF0C\u53EF\u91CD\u8BD5\u6216\u6539\u7528\u7167\u7247\u8BD5\u6234"))},Fc.LOAD_TIMEOUT)})])}finally{clearTimeout(c)}}catch(c){throw i.cancel(),s(),c}let l=!1,u={diagnostics(){return{confidence:a.pipeline.lastConfidence,backend:Hn(),tensors:qy().numTensors}},async estimate(c){return l?[]:a.estimateHands({width:c.width,height:c.height,data:new Uint8Array(c.data)},!1)},dispose(){if(l)return;l=!0;let c=a.pipeline,p=c.boundingBoxDetector;c.meshDetector.dispose(),p.model.dispose(),p.anchorsTensor.dispose(),p.inputSizeTensor.dispose(),p.doubleInputSizeTensor.dispose(),s()}};if(o)throw u.dispose(),new Error("\u6A21\u578B\u52A0\u8F7D\u5DF2\u53D6\u6D88");return u}
/**
 * @license
 * Copyright 2017 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * =============================================================================
 */
/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
/**
 * @license
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the License);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an AS IS BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
/**
 * @license
 * Copyright 2021 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
/**
 * @license
 * Copyright 2021 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
/**
 * @license
 * Copyright 2022 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
/**
 * @license
 * Copyright 2022 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
/** @license See the LICENSE file. */
