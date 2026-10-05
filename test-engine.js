// node test-engine.js SEED LINES_PER_FS   compares the engine with gawk and mawk (FS passed via ENVIRON, no escape processing)
var F=require('./engine.js'),cp=require('child_process');
var seed=+process.argv[2]||1,N=+process.argv[3]||500;
function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
function pick(a){return a[Math.floor(rnd()*a.length)];}
var CH=['a','b','a','b',' ',' ','\t',',',',','|',':','.','x','1','\u00e9','\u4e2d','-','\\'];
function line(){var n=Math.floor(rnd()*14),s='';for(var i=0;i<n;i++)s+=pick(CH);return s;}
var CONF={
 single:[' ',',','|','\t',':','.','a','x','-','\\','\u00e9'].filter(function(x){return x!==' ';}),
 default:[' '],
 chars:[''],
 regex:['[,:]',' +',',+','[ ]','[ \t]+','[[:space:]]+','[[:blank:]]','\\|','[|]','\\.','a+','[ab]','[^a-z]','(,|:)+',', ','ab','[,:]+x?','\t+',':[ ]*',' *, *','x|1'],
 alt:['a|ab','ab|a','x|xa','(a|ab)b?','b|ba|a']
};
var OFS=['-',' ','::','','\t'];
var tools=['gawk','mawk'];
var stats={};
function rec(t,cls,ok){var k=t+' '+cls;stats[k]=stats[k]||{n:0,bad:0};stats[k].n++;if(!ok)stats[k].bad++;}
var shown=0;
var PROG={
 split:'BEGIN{FS=ENVIRON["FSV"]}{o=NF;for(i=1;i<=NF;i++)o=o "\\001" $i;print o}',
 rewrite:'BEGIN{FS=ENVIRON["FSV"];OFS=ENVIRON["OFSV"]}{$1=$1;print NF "\\001" $0}',
 extend:'BEGIN{FS=ENVIRON["FSV"];OFS=ENVIRON["OFSV"]}{$(NF+2)="X";print NF "\\001" $0}',
 trunc2:'BEGIN{FS=ENVIRON["FSV"];OFS=ENVIRON["OFSV"]}{NF=2;print NF "\\001" $0}'
};
function expected(l,fs,ofs,act){
  var r=F.run(l,fs,ofs,act);
  if(act==='split')return [r.NF].concat(r.fields).join('\u0001');
  return r.NF+'\u0001'+r.record;
}
Object.keys(CONF).forEach(function(cls){
  CONF[cls].forEach(function(fs){
    var lines=[];for(var i=0;i<N;i++)lines.push(line());
    var ofs=pick(OFS);
    var engOK=true;try{F.makeSplitter(fs);}catch(e){engOK=false;}
    if(!engOK){stats['engine-rejected '+cls]=(stats['engine-rejected '+cls]||{n:0,bad:0});stats['engine-rejected '+cls].n++;return;}
    Object.keys(PROG).forEach(function(act){
      tools.forEach(function(t){
        var r=cp.spawnSync(t,[PROG[act]],{input:lines.join('\n')+'\n',env:Object.assign({},process.env,{FSV:fs,OFSV:ofs,LC_ALL:'C.UTF-8'}),encoding:'utf8',maxBuffer:1<<26});
        var got=r.stdout.split('\n');got.pop();
        lines.forEach(function(l,i){
          var exp=expected(l,fs,ofs,act),ok=got[i]===exp;
          if(t==='mawk'&&/[^\x00-\x7f]/.test(l)){rec('mawk non-ASCII lines (informational)',cls,ok);return;}
          rec(t,cls,ok);
          if(!ok&&cls!=='alt'&&(t==='gawk'||(t==='mawk'&&process.env.SHOWMAWK))&&shown++<8)console.log('DIFF',t,act,JSON.stringify(fs),JSON.stringify(l),'engine',JSON.stringify(exp),'awk',JSON.stringify(got[i]));
        });
      });
    });
  });
});
console.log(JSON.stringify({seed:+process.argv[2],perFS:N,stats:stats}));
