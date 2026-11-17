# Josie's coffee logo: clean full logo + "coffee" in the crossout colour. usage: mk.py SRC OUT [pink]
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi
SRC,OUT=sys.argv[1],sys.argv[2]; MARK=len(sys.argv)>3
SS=3; CS=0.66; CA=9; VS=1.0; XS=1.12; CAFE=0.88; WID=1500; AX,AY=848,752
LOGO=(255,162,200); ROSE=(181,85,115); COL=LOGO if MARK else ROSE
im=Image.open(SRC).convert('RGBA'); A=np.array(im); al=A[:,:,3]
lab,n=ndi.label(al>200)
def at(x,y):
    return int(lab[y,x])
def comp(i,pad=3):
    reg=ndi.binary_dilation(lab==i,iterations=pad); ys,xs=np.where(reg); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    o=np.zeros((y1-y0,x1-x0,4),np.uint8); o[:,:,:3]=LOGO; o[:,:,3]=(al[y0:y1,x0:x1]*reg[y0:y1,x0:x1])
    return Image.fromarray(o,'RGBA')
# components found by a point on each letter (c a f e of cafe, o of Josie's)
def near(x,y):
    ys,xs=np.where(lab>0); k=np.argmin((xs-x)**2+(ys-y)**2); return int(lab[ys[k],xs[k]])
IDS={'c':near(600,580),'a':near(720,560),'f':near(810,500),'e':near(915,500),'o':near(330,430)}
print(IDS)
g={k:comp(v) for k,v in IDS.items()}
g['o']=g['o'].resize((round(g['o'].width*g['c'].height/g['o'].height*1.06),round(g['c'].height*1.06)),Image.LANCZOS)
def bold(img,b):
    a=img.split()[3].filter(ImageFilter.MaxFilter(b*2+1)).filter(ImageFilter.GaussianBlur(SS*2)).point(lambda v:max(0,min(255,int((v-128)*6))))
    o=Image.new('RGBA',img.size,COL+(0,)); o.putalpha(a); return o
def word(txt,sc,b,gap=1):
    ps=[]
    for ch in txt:
        gl=g[ch]; pad=b*SS+2; gl=Image.fromarray(np.pad(np.array(gl),((pad,pad),(pad,pad),(0,0))),'RGBA')
        gl=gl.resize((round(gl.width*sc*SS*XS),round(gl.height*sc*SS*VS)),Image.LANCZOS); ps.append(bold(gl,round(b*SS*sc)))
    H=int(max(p.height for p in ps)*1.2)+40*SS; base=H-20*SS
    pl_=[base-p.height+int(b*SS*sc)+(int(p.height*0.16) if ch=='f' else 0) for p,ch in zip(ps,txt)]; xs=[20*SS]
    for i in range(1,len(ps)):
        a1=np.array(ps[i-1].split()[3])>128; a2=np.array(ps[i].split()[3])>128; need=-1e9
        for y in range(H):
            yl=y-pl_[i-1]; yr=y-pl_[i]
            if 0<=yl<a1.shape[0] and 0<=yr<a2.shape[0] and a1[yl].any() and a2[yr].any():
                need=max(need,xs[i-1]+np.where(a1[yl])[0].max()+gap*SS*sc*1.6-np.where(a2[yr])[0].min())
        xs.append(need)
    W=int(xs[-1]+ps[-1].width)+20*SS; s=Image.new('RGBA',(W,H),(0,0,0,0))
    for i,p in enumerate(ps): s.alpha_composite(p,(int(xs[i]),pl_[i]))
    return s
# base: logo with cafe lifted out, redrawn smaller in place
cm=np.zeros(al.shape,bool)
for i in (IDS['c'],IDS['a'],IDS['f'],IDS['e']): cm|=ndi.binary_dilation(lab==i,iterations=3)
base=A.copy(); base[cm]=(0,0,0,0)
ys,xs=np.where(cm); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
cf=A[y0:y1,x0:x1].copy(); cf[~cm[y0:y1,x0:x1]]=0; cf=Image.fromarray(cf,'RGBA')
cw,ch=round(cf.width*CAFE),round(cf.height*CAFE); cf=cf.resize((cw,ch),Image.LANCZOS)
can=Image.new('RGBA',(WID,im.height),(0,0,0,0)); can.alpha_composite(Image.fromarray(base,'RGBA'),(0,0))
can.alpha_composite(cf,((x0+x1)//2-cw//2,(y0+y1)//2-ch//2))
# crossout, same weight as coffee strokes
d=ImageDraw.Draw(can); P=[(566,562),(724,542),(845,519),(983,481)]
d.line(P,fill=COL+(255,),width=24,joint='curve')
for x,y in (P[0],P[-1]): d.ellipse([x-12,y-12,x+12,y+12],fill=COL+(255,))
s=word('coffee',CS,2); r=s.rotate(CA,resample=Image.BICUBIC,expand=True); r=r.resize((r.width//SS,r.height//SS),Image.LANCZOS); bb=r.getbbox()
can.alpha_composite(r,(AX-bb[0],AY-bb[3])); print('coffee',bb)
can.save(OUT)
