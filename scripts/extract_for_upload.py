"""
AI Hub 방언 데이터 추출 (TS=wav zip, TL=json zip 쌍 매칭)
결과: wav + json 플랫 폴더 → Drive 업로드용
"""
import zipfile, os, re

DIALECT_ROOT = r'C:\Users\kts64\Downloads\139-1.중·노년층 한국어 방언 데이터 (강원도, 경상도)'
OUT_DIR      = r'C:\Users\kts64\TTT\data\upload_ready\dialect'
MAX_PER_PAIR = 500   # 쌍당 최대 추출 수

os.makedirs(OUT_DIR, exist_ok=True)

# 모든 zip 수집
all_zips = []
for root, dirs, files in os.walk(DIALECT_ROOT):
    for f in files:
        if f.endswith('.zip'):
            all_zips.append(os.path.join(root, f))

print(f'발견한 zip: {len(all_zips)}개')
for z in all_zips:
    print(f'  {os.path.basename(z)}')

# TS(wav) - TL(json) 쌍 찾기
# 예: TS_01.경상도_... ↔ TL_01.경상도_...
wav_zips  = {f: p for p, f in ((p, os.path.basename(p)) for p in all_zips) if f.startswith('TS_')}
json_zips = {f: p for p, f in ((p, os.path.basename(p)) for p in all_zips) if f.startswith('TL_')}

print(f'\nwav(TS) zip: {list(wav_zips.keys())}')
print(f'json(TL) zip: {list(json_zips.keys())}')

total_added = 0

for wav_fname, wav_zip_path in sorted(wav_zips.items()):
    # TS_01 → TL_01 매핑
    pair_key = wav_fname.replace('TS_', 'TL_', 1)
    if pair_key not in json_zips:
        print(f'\n{wav_fname} → 매칭 json zip 없음 ({pair_key}), 스킵')
        continue

    json_zip_path = json_zips[pair_key]
    print(f'\n매칭: {wav_fname} ↔ {pair_key}')

    # json zip에서 stem→member 인덱스 구성
    print('  json 인덱싱 중...')
    with zipfile.ZipFile(json_zip_path, 'r') as jz:
        json_members = jz.namelist()
        json_map = {
            os.path.splitext(os.path.basename(m))[0]: m
            for m in json_members if m.endswith('.json')
        }
    print(f'  json: {len(json_map)}개')

    # wav zip에서 선택 추출 + 매칭 json 추출
    added = 0
    with zipfile.ZipFile(wav_zip_path, 'r') as wz, \
         zipfile.ZipFile(json_zip_path, 'r') as jz:

        wav_members = [m for m in wz.namelist() if m.endswith('.wav')]
        print(f'  wav: {len(wav_members)}개 → {min(MAX_PER_PAIR, len(wav_members))}개 추출')

        for wav_member in wav_members[:MAX_PER_PAIR]:
            stem = os.path.splitext(os.path.basename(wav_member))[0]

            # wav 쓰기
            wav_out = os.path.join(OUT_DIR, os.path.basename(wav_member))
            with open(wav_out, 'wb') as f:
                f.write(wz.read(wav_member))

            # json 쓰기
            if stem in json_map:
                json_out = os.path.join(OUT_DIR, stem + '.json')
                with open(json_out, 'wb') as f:
                    f.write(jz.read(json_map[stem]))
                added += 1

    print(f'  wav+json 쌍 추출: {added}개')
    total_added += added

# 결과 요약
wav_count  = sum(1 for f in os.listdir(OUT_DIR) if f.endswith('.wav'))
json_count = sum(1 for f in os.listdir(OUT_DIR) if f.endswith('.json'))
total_size = sum(
    os.path.getsize(os.path.join(OUT_DIR, f))
    for f in os.listdir(OUT_DIR)
)

print(f'\n=== 완료 ===')
print(f'wav:  {wav_count}개')
print(f'json: {json_count}개')
print(f'크기: {total_size/1e9:.2f} GB')
print(f'위치: {OUT_DIR}')

# json 구조 샘플 확인
import json
for f in os.listdir(OUT_DIR):
    if f.endswith('.json'):
        with open(os.path.join(OUT_DIR, f), encoding='utf-8') as jf:
            sample = json.load(jf)
        print(f'\njson 키: {list(sample.keys())}')
        print(f'내용 일부: {str(sample)[:300]}')
        break
