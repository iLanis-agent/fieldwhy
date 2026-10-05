(function(root){
'use strict';
// awk field splitting (gawk semantics). fs: the value of FS as awk sees it (after any string escape processing).
function classify(fs){
  if(fs===' ')return 'default';
  if(fs==='')return 'chars';
  if(Array.from(fs).length===1)return 'single';
  return 'regex';
}
var CLASSES={alpha:'A-Za-z',digit:'0-9',alnum:'A-Za-z0-9',upper:'A-Z',lower:'a-z',space:' \\t\\n\\r\\f\\v',blank:' \\t',punct:'!-\\/:-@\\[-`{-~',xdigit:'0-9A-Fa-f'};
function ereToJs(p){
  var out='',i=0;
  while(i<p.length){
    var c=p[i];
    if(c==='\\'){
      if(i+1>=p.length){out+='\\\\';i++;continue;}
      var d=p[i+1];i+=2;
      if(d==='t')out+='\\t';else if(d==='n')out+='\\n';
      else if(d==='.'||d==='|'||d==='\\'||d==='+'||d==='*'||d==='?'||d==='('||d===')'||d==='['||d===']'||d==='{'||d==='}'||d==='^'||d==='$'||d==='/'||d==='-')out+='\\'+d;
      else out+=/[A-Za-z0-9]/.test(d)?d:'\\'+d;
      continue;
    }
    if(c==='['){
      var j=i+1,neg=false,set='';
      if(p[j]==='^'){neg=true;j++;}
      if(p[j]===']'){set+='\\]';j++;}
      while(j<p.length&&p[j]!==']'){
        if(p[j]==='['&&p[j+1]===':'){var e=p.indexOf(':]',j+2);if(e>0){var nm=p.slice(j+2,e);if(!CLASSES[nm])throw new Error('unknown class [:'+nm+':]');set+=CLASSES[nm];j=e+2;continue;}}
        if(p[j]==='\\'){set+='\\\\';j++;continue;}
        if(p[j]==='-'){ if(set===''||p[j+1]===']'||j+1>=p.length)set+='\\-';else set+='-'; j++;continue;}
        if(p[j]==='^'||p[j]==='['){set+='\\'+p[j];j++;continue;}
        set+=p[j];j++;
      }
      if(j>=p.length)throw new Error('unmatched [ in regular expression');
      out+='['+(neg?'^':'')+set+']';i=j+1;continue;
    }
    if(c==='{'){out+='\\{';i++;continue;}
    if(c==='}'){out+='\\}';i++;continue;}
    if(c==='/'){out+='\\/';i++;continue;}
    out+=c;i++;
  }
  return out;
}
function makeSplitter(fs){
  var kind=classify(fs);
  if(kind==='default')return {kind:kind,split:function(line){var t=line.replace(/^[ \t\n]+|[ \t\n]+$/g,'');return t===''?[]:t.split(/[ \t\n]+/);}};
  if(kind==='chars')return {kind:kind,split:function(line){return Array.from(line);}};
  if(kind==='single')return {kind:kind,split:function(line){return line===''?[]:line.split(fs);}};
  var re;
  try{re=new RegExp(ereToJs(fs),'g');}catch(e){throw new Error('bad FS regex: '+e.message);}
  if(new RegExp('^(?:'+re.source+')$').test(''))throw new Error('FS regex can match the empty string; awks disagree on that, not supported here');
  return {kind:kind,hasAlt:/\|/.test(fs),split:function(line){
    if(line==='')return [];
    var out=[],pos=0,m;re.lastIndex=0;
    while((m=re.exec(line))!==null){
      if(m[0]===''){re.lastIndex++;continue;}
      out.push(line.slice(pos,m.index));pos=m.index+m[0].length;
    }
    out.push(line.slice(pos));return out;
  }};
}
function run(line,fs,ofs,action){
  var sp=makeSplitter(fs),f=sp.split(line),NF=f.length,res={kind:sp.kind,hasAlt:sp.hasAlt,fields:f.slice(),NF:NF,line:line,record:line,changed:false,ofs:ofs};
  function rebuild(arr){res.fields=arr;res.NF=arr.length;res.record=arr.join(ofs);res.changed=true;}
  if(action==='rewrite'){var w=f.slice();if(!w.length)w.push('');rebuild(w);}
  else if(action==='extend'){var a=f.slice();while(a.length<NF+2)a.push('');a[NF+1]='X';rebuild(a);}
  else if(action==='trunc2'){var b=f.slice(0,2);while(b.length<2)b.push('');rebuild(b);}
  return res;
}
var api={run:run,classify:classify,ereToJs:ereToJs,makeSplitter:makeSplitter};
if(typeof module!=='undefined')module.exports=api;else root.FieldWhy=api;
})(this);
