"""Export the static demonstration to a single portable HTML file."""
import argparse,pathlib,re
parser=argparse.ArgumentParser()
parser.add_argument('--output',default='/tmp/central-condominio.html')
args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
css=(root/'assets/central.css').read_text()
js=(root/'assets/central.js').read_text()
if '</script' in js.lower():
 raise ValueError('Inline script contains a closing script tag; use an escaped representation before exporting.')
html,n=re.subn(r'<link\s+rel="stylesheet"\s+href="assets/central.css"\s*/?>',lambda _: '<style>\n'+css+'\n</style>',html)
assert n==1,'Expected one local stylesheet'
html,n=re.subn(r'<script\s+defer\s+src="assets/central.js"></script>','',html)
assert n==1,'Expected one local script'
html=html.replace('</body>','<script>\n'+js+'\n</script>\n</body>')
output=pathlib.Path(args.output);output.parent.mkdir(parents=True,exist_ok=True);output.write_text(html)
print(f'HTML portátil exportado: {output} ({output.stat().st_size} bytes)')
