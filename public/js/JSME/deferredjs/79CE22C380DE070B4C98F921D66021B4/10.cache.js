$wnd.jsme.runAsyncCallback10('var $sa="400px",ata="Accept",bta="Close (ESC)",cta="Paste",dta="Paste the text to import into the text area below.",eta="accept",fta="close",m$="data-selenium-id",gta="dragend",hta="dragenter",ita="dragover",jta="drop",kta="file",lta="gwt-FileUpload",mta="gwt-HTML",nta="jsa_clipboard/button/",ota="jsa_clipboard/text_area",pta="jsa_clipboard/window";x(254,242,{});function n$(){n$=z;o$=new DD(gta,new p$)}function q$(a){a.a.cancelBubble=!0;OB(a.a)}function p$(){}x(255,254,{},p$);_.ee=function(){q$(this)};\n_.he=function(){return o$};var o$;function r$(){r$=z;s$=new DD(hta,new t$)}function t$(){}x(256,254,{},t$);_.ee=function(){q$(this)};_.he=function(){return s$};var s$;function u$(){u$=z;v$=new DD(ita,new w$)}function w$(){}x(257,254,{},w$);_.ee=function(){q$(this)};_.he=function(){return v$};var v$;function x$(){x$=z;y$=new DD(jta,new z$)}function z$(){}x(258,254,{},z$);\n_.ee=function(a){var b,c,d,e;this.a.cancelBubble=!0;OB(this.a);d=(this.a.dataTransfer||null).files;e=0;a:for(;e<d.length;++e){if(0<a.a.d&&e>=a.a.d)break a;b=d[e];c=new FileReader;qta(c,a.a.b);1==a.a.c&&c.readAsText(b)}0==d.length&&(b=(this.a.dataTransfer||null).getData(Aq),a.a.b.a.a.d.ob[Wq]=null!=b?b:n)};_.he=function(){return y$};var y$;function A$(a,b,c){ZE(!a.lb?a.lb=new lF(a):a.lb,c,b)}function B$(){this.ob=KB(kta);this.ob[ln]=lta}x(384,365,Kr,B$);_.Ae=function(a){OH(this,a)};\nfunction C$(a){var b=NB(Gn);bw(pq,J1(b));this.ob=b;this.b=new $2(this.ob);this.ob[ln]=mta;Z2(this.b,a,!0);h3(this)}x(388,389,Kr,C$);function D$(a,b){var c,d;c=NB(Nq);d=NB(zq);d[Mm]=a.a.a;d.style[Xq]=a.b.a;var e=(MG(),NG(d));c.appendChild(e);LG(a.d,c);$H(a,b,d)}function E$(){UI.call(this);this.a=(XI(),dJ);this.b=(eJ(),hJ);this.e[fn]=$f;this.e[en]=$f}x(437,381,Ur,E$);_.Ze=function(a){var b;b=MB(a.ob);(a=dI(this,a))&&this.d.removeChild(MB(b));return a};\nfunction F$(a){try{a.s=!1;var b,c,d;d=a.gb;c=a._;d||(a.ob.style[Yq]=go,DJ(a.ob,!1),a._=!1,a.lf());b=a.ob;b.style[ro]=0+(HC(),Dp);b.style[Iq]=bg;$4(a,O0(cC($doc)+(bC()-HB(a.ob,ip)>>1),0),O0(dC($doc)+(aC()-HB(a.ob,hp)>>1),0));d||((a._=c)?(a.ob.style[pn]=Rp,a.ob.style[Yq]=Zq,DJ(a.ob,!0),Hx(a.fb,200)):(a.ob.style[Yq]=Zq,DJ(a.ob,!0)))}finally{a.s=!0}}function G$(a,b){var c;c=(new R3(a)).vd.lg();c.ob.setAttribute(m$,nta+b);return c}\nfunction H$(a){var b;b=G$(bta,fta);KH(b,new I$(a),(JD(),JD(),KD));return b}\nfunction J$(){N4();var a,b,c,d,e;l5.call(this,(E5(),F5),null,!0);this.wj();this.cb=!0;this.ob.setAttribute(m$,pta);this.U=!0;a=new C$(this.e);this.d=new qK;this.d.ob.setAttribute(m$,ota);EH(this.d,dg);BH(this.d,dg);E4(this,$sa);e=new E$;e.ob.style[fo]=dg;e.e[fn]=10;c=(XI(),YI);e.a=c;D$(e,a);D$(e,this.d);this.c=new lJ;this.c.e[fn]=20;for(b=this.uj(),c=0,d=b.length;c<d;++c)a=b[c],iJ(this.c,a);D$(e,this.c);S4(this,e);b5(this,!1);KH(this.d,new K$(this),(dE(),dE(),eE));this.vj()}x(795,796,S0,J$);\n_.uj=function(){return A(BK,o,50,[H$(this)])};_.vj=function(){var a=this.d;a.ob.readOnly=!0;var b=FH(a.ob)+"-readonly";AH(a.Me(),b,!0)};_.wj=function(){D5(this.H.b,"Copy")};_.lf=function(){k5(this);this.ob.style[dr]=hg};_.c=null;_.d=null;_.e="Press Ctrl-C (Command-C on Mac) or right click (Option-click on Mac) on the selected text to copy it, then paste into another program.";function K$(a){this.a=a}x(798,1,{},K$);_.pe=function(a){27==(a.a.keyCode||0)&&U4(this.a,!1)};_.a=null;\nfunction I$(a){this.a=a}x(799,1,{},I$);_.ke=function(){U4(this.a,!1)};_.a=null;function L$(a){this.a=a}x(800,1,{},L$);\n_.Sd=function(){GH(this.a.d.ob,!0);SI(this.a.d,!0);var a=this.a.d,b;b=IB(a.ob,Wq).length;if(0<b&&a.jb){if(0>b)throw new vW("Length must be a positive integer. Length: "+b);if(b>IB(a.ob,Wq).length)throw new vW("From Index: 0  To Index: "+b+"  Text Length: "+IB(a.ob,Wq).length);var a=a.ob,c=0;try{var d=a.createTextRange(),e=a.value.substr(c,b).match(/(\\r\\n)/gi);null!=e&&(b-=e.length);var f=a.value.substring(0,c).match(/(\\r\\n)/gi);null!=f&&(c-=f.length);d.collapse(!0);d.moveStart("character",c);d.moveEnd("character",\nb);d.select()}catch(g){}}};_.a=null;function M$(a){var b;b=G$(a.a,eta);KH(b,new N$(a),(JD(),JD(),KD));return b}function O$(a){a.e=dta;a.a=ata;D5(a.H.b,cta)}function P$(a){N4();J$.call(this);this.b=a}x(802,795,S0,P$);_.uj=function(){return A(BK,o,50,[M$(this),H$(this)])};_.vj=function(){BH(this.d,"150px")};_.wj=function(){O$(this)};_.lf=function(){k5(this);this.ob.style[dr]=hg;uB((rB(),sB),new Q$(this))};_.a=null;_.b=null;function R$(a){N4();P$.call(this,a)}x(801,802,S0,R$);\n_.uj=function(){var a;return A(BK,o,50,[M$(this),(a=new B$,a.ob.setAttribute(m$,"jsa_clipboard/button/browse_upload"),KH(a,new S$(this),(V1(),V1(),W1)),a),H$(this)])};_.vj=function(){BH(this.d,"150px");var a=new T$(this),b=this.d;A$(b,new U$,(r$(),r$(),s$));A$(b,new V$,(n$(),n$(),o$));A$(b,new W$,(u$(),u$(),v$));A$(b,new X$(a),(x$(),x$(),y$))};_.wj=function(){O$(this);this.e+=" Or drag and drop a file on it."};function S$(a){this.a=a}x(803,1,{},S$);\n_.je=function(a){var b,c;b=new FileReader;a=(c=a.a.srcElement,c.files[0]);rta(b,new Y$(this));b.readAsText(a)};_.a=null;function Y$(a){this.a=a}x(804,1,{},Y$);_.xj=function(a){nK(this.a.a.d,a)};_.a=null;x(807,1,{});x(806,807,{});_.b=null;_.c=1;_.d=-1;function T$(a){this.a=a;this.b=new Z$(this);this.c=this.d=1}x(805,806,{},T$);_.a=null;function Z$(a){this.a=a}x(808,1,{},Z$);_.xj=function(a){this.a.a.d.ob[Wq]=null!=a?a:n};_.a=null;function N$(a){this.a=a}x(812,1,{},N$);\n_.ke=function(){if(this.a.b){var a=this.a.b,b;b=new DN(a.a,0,IB(this.a.d.ob,Wq));dU(a.a.a,b.a)}U4(this.a,!1)};_.a=null;function Q$(a){this.a=a}x(813,1,{},Q$);_.Sd=function(){GH(this.a.d.ob,!0);SI(this.a.d,!0)};_.a=null;x(814,1,js);_.be=function(){var a,b;a=new $$(this.a);void 0!=$wnd.FileReader?b=new R$(a):b=new P$(a);G4(b);F$(b)};function $$(a){this.a=a}x(815,1,{},$$);_.a=null;x(816,1,js);\n_.be=function(){var a;a=new J$;var b=this.a,c,d;nK(a.d,b);c=(d=SW(b,"\\r\\n|\\r|\\n|\\n\\r"),d.length);1>=c&&(c=~~(b.length/16));BH(a.d,20*(10>c+1?c+1:10)+Dp);uB((rB(),sB),new L$(a));G4(a);F$(a)};function rta(a,b){a.onload=function(a){b.xj(a.target.result)}}function qta(a,b){a.onloadend=function(a){b.xj(a.target.result)}}function X$(a){this.a=a}x(823,1,{},X$);_.a=null;function U$(){}x(824,1,{},U$);function V$(){}x(825,1,{},V$);function W$(){}x(826,1,{},W$);Z(807);Z(806);Z(823);Z(824);Z(825);Z(826);Z(254);\nZ(256);Z(255);Z(257);Z(258);Z(795);Z(802);Z(801);Z(815);Z(798);Z(799);Z(800);Z(812);Z(813);Z(803);Z(804);Z(805);Z(808);Z(388);Z(437);Z(384);U(Q0)(10);\n//@ sourceURL=10.js\n')
