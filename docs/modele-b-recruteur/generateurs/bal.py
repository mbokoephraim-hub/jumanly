import sys
from html.parser import HTMLParser
V={'meta','link','img','input','br','path','circle','rect','line','polyline'}
for f in sys.argv[1:]:
    s=open('canvas/project/'+f).read(); s=s[:s.index('<script type="text/x-dc"')]
    class P(HTMLParser):
        def __init__(s):super().__init__();s.st=[];s.err=0
        def handle_starttag(s,t,a):
            if t not in V:s.st.append((t,s.getpos()))
        def handle_endtag(s,t):
            if t in V:return
            if s.st and s.st[-1][0]==t:s.st.pop()
            else:
                if s.err<3:print(f,'mismatch',t,s.getpos(),s.st[-3:])
                s.err+=1
    p=P();p.feed(s);print(f,'reste',[x[0] for x in p.st],'err',p.err)
