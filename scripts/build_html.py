"""Export the static demonstration to a single HTML with local styles and fonts."""
import argparse,base64,mimetypes,pathlib,re
parser=argparse.ArgumentParser()
parser.add_argument('--output',default='/tmp/central-condominio.html')
args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
js=(root/'assets/central.js').read_text()
if '</script' in js.lower():raise ValueError('Inline script contains a closing script tag.')
def inline_style(match):
 path=(root/match.group(1)).resolve()
 if root not in path.parents:raise ValueError('Stylesheet outside project.')
 css=path.read_text()
 def inline_asset(asset):
  value=asset.group(1).strip('"\'')
  if value.startswith(('data:','http:','https:','#')):return asset.group(0)
  source=(path.parent/value).resolve()
  if root not in source.parents:raise ValueError('Asset outside project.')
  mime=mimetypes.guess_type(source.name)[0] or 'application/octet-stream'
  return 'url("data:'+mime+';base64,'+base64.b64encode(source.read_bytes()).decode()+'")'
 css=re.sub(r'url\(([^)]+)\)',inline_asset,css)
 return '<style>\n'+css+'\n</style>'
html,n=re.subn(r'<link\s+rel="stylesheet"\s+href="([^\"]+)"\s*/?>',inline_style,html)
assert n==2,'Expected base stylesheet and AQUAVILLE theme'
html,n=re.subn(r'<script\s+defer\s+src="assets/central.js"></script>','',html)
assert n==1,'Expected one local script'
html=html.replace('</body>','<script>\n'+js+'\n</script>\n</body>')
output=pathlib.Path(args.output);output.parent.mkdir(parents=True,exist_ok=True);output.write_text(html)
print(f'HTML portátil exportado: {output} ({output.stat().st_size} bytes)')
