import httpx
bbox = '-87.15,12.66,-87.14,12.67'
base = 'http://localhost:8000/api/v1'

tests = [
    ('Analysis', 'GET', f'{base}/parcela/analysis?bbox={bbox}', None),
    ('TrueColor', 'GET', f'{base}/parcela/true-color?bbox={bbox}', None),
    ('NDVI', 'GET', f'{base}/parcela/ndvi-image?bbox={bbox}', None),
    ('EVI', 'GET', f'{base}/parcela/evi-image?bbox={bbox}', None),
    ('SWIR', 'GET', f'{base}/parcela/swir-image?bbox={bbox}', None),
    ('MNDWI', 'GET', f'{base}/parcela/mndwi-image?bbox={bbox}', None),
    ('Predict', 'POST', f'{base}/predict/yield', {'crop':'maiz','area_ha':2.5,'bbox':bbox}),
    ('Crops', 'GET', f'{base}/predict/crops', None),
]

for name, method, url, body in tests:
    try:
        if method == 'POST':
            r = httpx.post(url, json=body, timeout=60)
        else:
            r = httpx.get(url, timeout=60)
        ct = r.headers.get('content-type', '')
        if 'image' in ct:
            print(f'{name}: {r.status_code} OK - {len(r.content)} bytes PNG')
        elif 'json' in ct:
            data = r.json()
            if name == 'Analysis':
                print(f'{name}: {r.status_code} OK - NDVI={data.get("ndvi",{}).get("ndvi_mean","?")} Moisture={data.get("moisture",{}).get("moisture_mean","?")}')
            elif name == 'Predict':
                p = data.get('prediction',{})
                print(f'{name}: {r.status_code} OK - yield={p.get("total_yield_kg","?")}kg conf={data.get("confidence",{}).get("score","?")}')
            elif name == 'Crops':
                print(f'{name}: {r.status_code} OK - {len(data.get("crops",[]))} crops')
            else:
                print(f'{name}: {r.status_code} OK')
        else:
            print(f'{name}: {r.status_code} ct={ct} size={len(r.content)}')
    except Exception as e:
        print(f'{name}: ERROR - {e}')

print('\nAll tests complete.')
