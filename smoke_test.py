import json
import sys
import urllib.request
from pathlib import Path
from urllib.parse import urlencode

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8000'
FORM = Path('backend/easyform-ai/data/forms/w9.pdf')
INSTRUCTIONS = Path('backend/easyform-ai/data/instructions/w9_instructions.pdf')

def multipart(parts):
    boundary = '----EasyFormSmokeBoundary'
    chunks = []
    for name, path in parts:
        chunks += [f'--{boundary}\r\n'.encode(), f'Content-Disposition: form-data; name="{name}"; filename="{path.name}"\r\n'.encode(), b'Content-Type: application/pdf\r\n\r\n', path.read_bytes(), b'\r\n']
    chunks.append(f'--{boundary}--\r\n'.encode())
    return b''.join(chunks), f'multipart/form-data; boundary={boundary}'

def post(path, parts):
    body, content_type = multipart(parts)
    req = urllib.request.Request(BASE + path, body, {'Content-Type': content_type})
    return json.load(urllib.request.urlopen(req))

health = json.load(urllib.request.urlopen(BASE + '/api/health'))
form = post('/api/analyze', [('form', FORM)])
assert form['mode'] == 'form_only' and form['fields'] and form['form']['pages']
sid = form['sid']
page = urllib.request.urlopen(f'{BASE}/api/session/{sid}/page/form/1.png').read()
assert page.startswith(b'\x89PNG')
fid = form['fields'][0]['field_id']
req = urllib.request.Request(BASE + f'/api/session/{sid}/explain', json.dumps({'field_id': fid}).encode(), {'Content-Type': 'application/json'})
explanation = json.load(urllib.request.urlopen(req))
assert explanation['field_id'] == fid and 'evidence' in explanation
both = post('/api/analyze', [('form', FORM), ('instructions', INSTRUCTIONS)])
assert both['mode'] == 'form_plus_instructions' and both['instructions']
print(json.dumps({'health': health['ok'], 'form_only_fields': len(form['fields']), 'png_bytes': len(page), 'explanation_status': explanation['explanation']['evidence_status'], 'form_plus_instructions': bool(both['instructions'])}))
