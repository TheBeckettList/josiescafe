import sys
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
from scipy import ndimage as ndi
SS=3
im=Image.open('orig.png').convert('RGB'); A=np.array(im).astype(float); BGc=(251,250,251); G=A[:,:,1]
lab,n=ndi.label(G<225)
def comp(i,pad=3):
    reg=ndi.binary_dilation(lab==i,iterations=pad); al=np.clip((250-G)/70,0,1)*reg
    ys,xs=np.where(reg); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    out=np.zeros((y1-y0,x1-x0,4),np.uint8); out[:,:,:3]=A[y0:y1,x0:x1].astype(np.uint8); out[:,:,3]=(al[y0:y1,x0:x1]*255).astype(np.uint8)
    return Image.fromarray(out,'RGBA')
g={'c':comp(12),'a':comp(11),'f':comp(9),'e':comp(10),'o':comp(8)}
g['o']=g['o'].resize((round(g['o'].width*g['c'].height/g['o'].height*1.06),round(g['c'].height*1.06)),Image.LANCZOS)
PINK=(243,168,200)
def bold(img,b):
    if b<=0: return img
    a=img.split()[3].filter(ImageFilter.MaxFilter(b*2+1)).filter(ImageFilter.GaussianBlur(max(1,SS))).point(lambda v: max(0,min(255,int((v-115)*4))))
    o=Image.new('RGBA',img.size,PINK+(0,)); o.putalpha(a); return o
def word(txt,sc,b,kern,strike=False,gap=7):
    ps=[]
    for ch in txt:
        gl=g[ch]; pad=b*SS+2
        gl=Image.fromarray(np.pad(np.array(gl),((pad,pad),(pad,pad),(0,0))),'RGBA')
        gl=gl.resize((round(gl.width*sc*SS),round(gl.height*sc*SS)),Image.LANCZOS)
        ps.append(bold(gl,round(b*SS*sc)))
    H=int(max(p.height for p in ps))+40*SS; base=H-20*SS
    place_=[]; xs=[20*SS]
    for i,p in enumerate(ps):
        top=base-p.height+int(b*SS*sc); place_.append(top)
    for i in range(1,len(ps)):
        pl,pr=ps[i-1],ps[i]; al=np.array(pl.split()[3])>128; ar=np.array(pr.split()[3])>128
        need=-1e9
        for y in range(H):
            yl=y-place_[i-1]; yr=y-place_[i]
            if 0<=yl<pl.height and 0<=yr<pr.height and al[yl].any() and ar[yr].any():
                rl=np.where(al[yl])[0].max(); lr=np.where(ar[yr])[0].min()
                need=max(need,xs[i-1]+rl+gap*SS*sc*1.6-lr)
        xs.append(need)
    W=int(xs[-1]+ps[-1].width)+20*SS
    s_=Image.new('RGBA',(W,H),(0,0,0,0))
    for i,p in enumerate(ps): s_.alpha_composite(p,(int(xs[i]),place_[i]))
    return s_
def place(img,s,ang,anchor,ax,ay):
    r=s.rotate(ang,resample=Image.BICUBIC,expand=True); r=r.resize((r.width//SS,r.height//SS),Image.LANCZOS); bb=r.getbbox()
    x=ax-(bb[0] if anchor[0]=='l' else bb[2]); y=ay-(bb[1] if anchor[1]=='t' else bb[3])
    img.alpha_composite(r,(x,y)); return (x+bb[0],y+bb[1],x+bb[2],y+bb[3])

KS=float(sys.argv[1]); CS=float(sys.argv[2]); CA=float(sys.argv[3]); LX=int(sys.argv[4]); LY=int(sys.argv[5])

CS=float(sys.argv[1]); CA=float(sys.argv[2]); LX=int(sys.argv[3]); LY=int(sys.argv[4]); WID=int(sys.argv[5])
can=Image.new('RGBA',(WID,1024),BGc+(255,)); can.alpha_composite(im.convert('RGBA'),(0,0))
d=ImageDraw.Draw(can); LC=(181,85,115); P=[(552,316),(700,300),(810,280),(940,250)]
d.line(P,fill=LC,width=14,joint='curve')
for x,y in (P[0],P[-1]): d.ellipse([x-7,y-7,x+7,y+7],fill=LC)
print('coffee',place(can,word('coffee',CS,4,0),CA,'lb',LX,LY))
can.convert('RGB').save('logo2.png')
