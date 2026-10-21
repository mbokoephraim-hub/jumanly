import re,sys
def fix(s):
    css0=s.index('<style>'); css1=s.index('</style>')
    css=s[css0:css1]
    for a,b in [('.rub{padding:20px 16px 6px}','.rub{padding:20px 20px 6px}'),('padding:14px 16px;border-bottom','padding:14px 20px;border-bottom'),
                ('.ch{display:block;padding:0 16px;','.ch{display:block;padding:0 20px;'),('.ob{margin:16px;','.ob{margin:16px 20px;'),
                ('.gr{padding:24px 16px 6px;','.gr{padding:24px 20px 6px;'),('padding:15px 16px;border-bottom','padding:15px 20px;border-bottom'),
                ('.row{width:100%;display:flex;align-items:center;gap:14px;padding:12px 16px}','.row{width:100%;display:flex;align-items:center;gap:14px;padding:12px 20px}')]:
        css=css.replace(a,b)
    s=s[:css0]+css+s[css1:]
    def tag(m):
        t=m.group(0)
        if 'class="opt"' in t or '{{q.pick}}' in t: return t
        t=re.sub(r'(padding|margin): (\d+px|0) 16px', r'\1: \2 20px', t)
        t=re.sub(r'(?<![-\w])(left|right): 16px', r'\1: 20px', t)
        return t
    s=re.sub(r'<(div|p|header|label|button class="row"|button onClick="\{\{goParam\}\}"|img|span|button onClick="\{\{goRech)[^>]*>', tag, s)
    return s
