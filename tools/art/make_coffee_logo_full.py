import sys,numpy as np
from PIL import Image, ImageFilter
src=Image.open(sys.argv[1]).convert('RGB'); col=np.array([243,168,200.])
W,H=src.size; TOP=90; BOT=40
can=Image.new('RGB',(W,H+TOP+BOT),(251,250,251)); can.paste(src,(0,TOP)); out=np.array(can).astype(float)
f=Image.open('/home/claude/josiescafe/img/logo-full.png').convert('RGBA').split()[3]
def amap(sc):
    a=f.resize((round(300*sc),round(397*sc)),Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.8)).point(lambda v:max(0,min(255,int((v-70)*1.8))))
    return np.array(a)/255.
def patch(sc,ox,oy,y0,y1,overlap_from):
    A=amap(sc)
    for y in range(y0,y1):           # y in padded canvas
        fy=y-TOP-oy
        if not(0<=fy<A.shape[0]): continue
        fx=np.arange(W)-ox; ok=(fx>=0)&(fx<A.shape[1]); al=np.zeros(W); al[ok]=A[fy,fx[ok]]
        if y>=overlap_from:
            srcal=np.clip((250-out[y,:,1])/70,0,1); al=al*(srcal<0.15)
        out[y]=out[y]*(1-al[:,None])+col*al[:,None]
patch(2.92,58,-72,0,TOP+30,TOP)
patch(2.9,64,-110,TOP+H-30,H+TOP+BOT,TOP+H-30)
Image.fromarray(out.astype(np.uint8)).save(sys.argv[3])
