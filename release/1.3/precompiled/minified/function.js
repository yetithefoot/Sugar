function Ab(a,b,c,d,f){if(!a.f)a.f=[];E(b)||(b=0);a.f.push(setTimeout(function(){a.f.splice(g,1);c.apply(d,f||[])},b));var g=a.f.length}
H(Function,j,m,{lazy:function(a,b){function c(){if(!(g&&f.length>b-2)){f.push([this,arguments]);e()}}var d=this,f=[],g=m,e,i,h;a=a||1;b=b||Infinity;i=P(a,void 0,"ceil");h=P(i/a);e=function(){if(!(g||f.length==0)){for(var l=x.max(f.length-h,0);f.length>l;)Function.prototype.apply.apply(d,f.shift());Ab(c,i,function(){g=m;e()});g=j}};return c},delay:function(a){var b=I(arguments).slice(1);Ab(this,a,this,this,b);return this},throttle:function(a){return this.lazy(a,1)},debounce:function(a){var b=this;
return function(){b.cancel();Ab(b,a,b,this,arguments)}},cancel:function(){if(ca(this.f))for(;this.f.length>0;)clearTimeout(this.f.shift());return this},after:function(a){var b=this,c=0,d=[];if(E(a)){if(a===0){b.call();return b}}else a=1;return function(){var f;d.push(I(arguments));c++;if(c==a){f=b.call(this,d);c=0;d=[];return f}}},once:function(){var a=this;return function(){return la(a,"memo")?a.memo:a.memo=a.apply(this,arguments)}},fill:function(){var a=this,b=I(arguments);return function(){var c=
I(arguments);b.forEach(function(d,f){if(d!=k||f>=c.length)c.splice(f,0,d)});return a.apply(this,c)}}});
