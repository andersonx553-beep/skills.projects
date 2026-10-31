"""UI smoke tests. Requires a running server. Fixtures below exist only in this test."""
import argparse, json, pathlib
from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://127.0.0.1:3000')
parser.add_argument('--screenshots', default='/tmp/central-condominio-qa')
args = parser.parse_args()
out = pathlib.Path(args.screenshots); out.mkdir(parents=True, exist_ok=True)
checks = 0

def checked(label):
    global checks
    checks += 1
    print(f'PASS {checks}: {label}', flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True)
    context = browser.new_context(viewport={'width':1440,'height':1100})
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(args.url, wait_until='networkidle')
    expect(page.get_by_role('heading', name='Visão geral', exact=True)).to_be_visible()
    expect(page.get_by_text('Conexão pendente', exact=True)).to_be_visible()
    checked('Dashboard sem credenciais declara conexão pendente, sem números fictícios')
    page.screenshot(path=str(out/'desktop.png'), full_page=True)
    page.get_by_role('button', name='Entrar', exact=True).click()
    dialog = page.get_by_role('dialog')
    expect(dialog).to_be_visible()
    expect(dialog.get_by_role('button', name='Entrar com segurança')).to_be_disabled()
    page.keyboard.press('Escape')
    expect(dialog).not_to_be_visible()
    checked('Login sem backend não simula autenticação; modal fecha pelo teclado')
    for label in ['Solicitações','Serviços','Comunicados','Documentos','Modelos de checklist','Checklist diário','Aprovações','Unidades','Blocos','Pessoas','Vínculos','Relatórios e auditoria','Configurações']:
        page.get_by_role('navigation').get_by_role('button',name=label,exact=True).click()
        expect(page.get_by_role('heading',name=label,exact=True).first).to_be_visible()
    checked('Todos os módulos têm navegação e estado coerente sem conexão')
    page.get_by_role('navigation').get_by_role('button',name='Custos e materiais Futuro').click()
    expect(page.get_by_role('heading',name='Integração ainda não ativada')).to_be_visible()
    checked('Custos e materiais fica explicitamente bloqueado para integração futura')
    response = context.request.post(args.url+'/api/command',data=json.dumps({'command':'bootstrap','name':'Tentativa'}),headers={'Content-Type':'application/json','Origin':'https://untrusted.example'})
    assert response.status == 403
    checked('API bloqueia mutações com origem não autorizada')
    health = context.request.get(args.url+'/api/health')
    assert health.status == 200 and health.json()['status']=='ok'
    checked('Servidor de produção responde à verificação funcional')
    page.set_viewport_size({'width':390,'height':844})
    page.goto(args.url,wait_until='networkidle')
    page.get_by_role('button',name='Abrir menu').click()
    page.get_by_role('navigation').get_by_role('button',name='Serviços',exact=True).click()
    expect(page.get_by_role('heading',name='Serviços',exact=True)).to_be_visible()
    expect(page.locator('.sidebar')).not_to_be_in_viewport()
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path=str(out/'mobile.png'),full_page=True)
    checked('Menu e conteúdo funcionam em 390 px sem overflow horizontal')
    # Isolated UI fixture: this is NOT a real Supabase integration or production seed.
    uid='11111111-1111-4111-8111-111111111111'; cid='22222222-2222-4222-8222-222222222222'
    def item(id,kind,title,status):
        return {'id':id,'condominium_id':cid,'kind':kind,'title':title,'status':status,'data':{'description':'Fixture isolada de teste','priority':'normal'},'assigned_to':uid,'due_date':None,'revision':1,'file_revision':1,'created_by':uid,'updated_by':uid,'created_at':'2026-10-31T12:00:00Z','updated_at':'2026-10-31T12:00:00Z'}
    state={'configured':True,'user':{'id':uid,'email':'test@example.invalid'},'selected':cid,'condos':[{'id':cid,'name':'DEMONSTRAÇÃO — Testes de interface','timezone':'America/Fortaleza','settings':{'require_evidence':True}}],'memberships':[{'user_id':uid,'display_name':'Conta de teste','role':'admin','permissions':['*'],'condominium_id':cid}],'members':[{'user_id':uid,'display_name':'Conta de teste','role':'admin','permissions':['*'],'condominium_id':cid}],'records':[item('33333333-3333-4333-8333-333333333333','requests','Solicitação de teste','open'),item('44444444-4444-4444-8444-444444444444','services','Serviço de teste','todo')],'approvals':[],'updatedAt':'2026-10-31T12:00:00Z'}
    page.route('**/api/state*',lambda route: route.fulfill(json={'versions':[],'messages':[],'attachments':[],'events':[],'recipients':0,'delivery':[]} if 'record=' in route.request.url else state))
    commands=[]
    def command(route):
        commands.append(route.request.post_data_json)
        route.fulfill(json={'ok':True,'data':None})
    page.route('**/api/command',command)
    page.set_viewport_size({'width':1440,'height':1100})
    page.goto(args.url,wait_until='networkidle')
    page.get_by_role('button',name='Solicitações abertas 1 Ver solicitações abertas').click()
    expect(page.get_by_role('combobox',name='Filtrar por status')).to_have_value('open')
    expect(page.get_by_role('button',name='Solicitação de teste',exact=False).first).to_be_visible()
    checked('Fixture: indicador abre lista com filtro correspondente')
    page.get_by_role('button',name='Novo registro').click()
    dialog=page.get_by_role('dialog')
    dialog.get_by_label('Título',exact=True).fill('Nova solicitação de interface')
    dialog.get_by_label('Descrição',exact=True).fill('Verificação de payload, sem gravação real')
    dialog.get_by_label('Responsável',exact=True).select_option(uid)
    dialog.get_by_role('button',name='Salvar registro').click()
    expect(dialog).not_to_be_visible()
    assert commands[-1]['command']=='save' and commands[-1]['kind']=='requests' and commands[-1]['assigned']==uid
    checked('Fixture: formulário envia campos e atribuição corretos para o servidor')
    page.get_by_role('navigation').get_by_role('button',name='Serviços',exact=True).click()
    page.get_by_role('button',name='Serviço de teste',exact=False).click()
    expect(page.get_by_role('dialog')).to_be_visible()
    expect(page.get_by_role('heading',name='Arquivos privados')).to_be_visible()
    expect(page.get_by_role('heading',name='Histórico e autoria')).to_be_visible()
    page.keyboard.press('Escape')
    checked('Fixture: detalhe de serviço reúne ações, arquivos e histórico')
    page.get_by_role('navigation').get_by_role('button',name='Configurações',exact=True).click()
    expect(page.get_by_role('heading',name='Equipe e permissões')).to_be_visible()
    expect(page.get_by_role('button',name='Salvar regras')).to_be_enabled()
    checked('Fixture: administrador acessa configuração de regras e equipe')
    assert not errors, errors
    checked('Nenhum erro de JavaScript durante os fluxos de interface')
    context.close();browser.close()
print(f'{checks} verificações de interface passaram. Fixtures não validam Auth/Storage hospedados.')
