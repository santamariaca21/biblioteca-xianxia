#!/usr/bin/env python3
"""
Escanea bloques de capítulos ZH para detectar términos que no están en el glosario.
Detecta: nombres propios, técnicas, lugares, bestias, niveles de cultivo.

Uso: python3 scripts/scan-new-terms.py [START] [END]
  Ej: python3 scripts/scan-new-terms.py 100 150
"""
import json, os, sys, re
from collections import Counter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WTR_DIR = os.path.join(SCRIPT_DIR, '..', '..', 'scripts', 'wtr-comparisons')
GLOSARIO_PATH = os.path.join(SCRIPT_DIR, "glosario-maestro.json")

# Common Chinese surnames (top 100)
SURNAMES = set('赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜'
               '戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳酆鲍史唐'
               '费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和'
               '穆萧尹姚邵湛汪祁毛禹狄米贝明臧计伏成戴谈宋茅庞熊纪舒屈项祝董梁杜阮'
               '蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐邱骆高夏蔡田樊胡凌霍虞万支'
               '柯昝管卢莫经房裘缪干解应宗丁宣邓')

# Common words to filter out (not names/terms)
STOP_WORDS = set([
    '于是', '时间', '强大', '时候', '应该', '毕竟', '但是', '不过', '虽然', '因为',
    '所以', '如果', '然后', '已经', '可以', '不能', '这个', '那个', '什么', '怎么',
    '自己', '他们', '我们', '你们', '这样', '那样', '一个', '一些', '还是', '就是',
    '不是', '知道', '觉得', '认为', '感觉', '发现', '看到', '听到', '出来', '进去',
    '起来', '下来', '上去', '回来', '过去', '现在', '突然', '立刻', '马上', '终于',
    '果然', '居然', '竟然', '虽然', '也许', '或许', '可能', '似乎', '仿佛', '非常',
    '十分', '极其', '相当', '真的', '确实', '当然', '一定', '必须', '需要', '想要',
    '准备', '开始', '继续', '停止', '结束', '任务', '强大的', '应该是', '毕竟这',
    '万公里', '的力量', '的实力', '一瞬间', '同时',
])

# Technique suffixes
TECH_SUFFIXES = ['术', '法', '诀', '功', '阵', '拳', '掌', '指', '步']

# Place suffixes
PLACE_SUFFIXES = ['城', '国', '域', '界', '星', '塔', '殿', '宫', '谷', '山', '海', '林',
                  '岛', '洞', '峰', '原', '湖', '河', '关', '府', '院', '阁', '堡']

# Beast indicators
BEAST_CHARS = set('兽龙蛇狼虎豹鹰猿蝎蜘蛛鼠猫犬牛马猪猴鸟鱼蟒蜥蜴蚁蝶')

# Cultivation indicators
CULT_SUFFIXES = ['天赋', '境', '级', '层', '期', '阶']


def load_known_terms(glosario_path):
    """Load all known Chinese terms from glossary."""
    glosario = json.load(open(glosario_path))
    known = set()
    for cat, entries in glosario.items():
        if cat.startswith('_'):
            continue
        for zh in entries:
            if zh.startswith('_'):
                continue
            known.add(zh)
    return known


def extract_candidates(text):
    """Extract potential terms from Chinese text."""
    candidates = {
        'nombres': Counter(),
        'tecnicas': Counter(),
        'zonas': Counter(),
        'bestias': Counter(),
        'cultivo': Counter(),
        'otros': Counter(),
    }

    # Names: surname + 1-2 chars
    for m in re.finditer(r'([\u4e00-\u9fff])([\u4e00-\u9fff]{1,2})', text):
        full = m.group(0)
        if m.group(1) in SURNAMES and len(full) <= 3:
            candidates['nombres'][full] += 1

    # Techniques: 2-6 chars ending in technique suffix
    for suffix in TECH_SUFFIXES:
        for m in re.finditer(rf'([\u4e00-\u9fff]{{1,5}}{suffix})', text):
            candidates['tecnicas'][m.group(1)] += 1

    # Places: 2-6 chars ending in place suffix
    for suffix in PLACE_SUFFIXES:
        for m in re.finditer(rf'([\u4e00-\u9fff]{{1,5}}{suffix})', text):
            candidates['zonas'][m.group(1)] += 1

    # Beasts: sequences containing beast characters
    for m in re.finditer(r'[\u4e00-\u9fff]{2,6}', text):
        word = m.group(0)
        if any(c in BEAST_CHARS for c in word) and '兽' not in word[:1]:
            candidates['bestias'][word] += 1

    # Cultivation terms: sequences with cultivation indicators
    for suffix in CULT_SUFFIXES:
        for m in re.finditer(rf'([\u4e00-\u9fff]{{1,4}}{suffix})', text):
            candidates['cultivo'][m.group(1)] += 1

    return candidates


def main():
    nums = [a for a in sys.argv[1:] if not a.startswith("--")]
    start = int(nums[0]) if len(nums) > 0 else 100
    end = int(nums[1]) if len(nums) > 1 else 150

    known = load_known_terms(GLOSARIO_PATH)
    print(f"Glosario actual: {len(known)} términos")
    print(f"Escaneando caps {start}-{end}...\n")

    all_candidates = {
        'nombres': Counter(),
        'tecnicas': Counter(),
        'zonas': Counter(),
        'bestias': Counter(),
        'cultivo': Counter(),
    }

    caps_scanned = 0
    for n in range(start, end + 1):
        wtr_path = os.path.join(WTR_DIR, f'wtr_cap{n}.json')
        if not os.path.exists(wtr_path):
            continue

        wtr = json.load(open(wtr_path))
        text = wtr.get('content', '')
        if not text:
            continue

        caps_scanned += 1
        candidates = extract_candidates(text)
        for cat in all_candidates:
            all_candidates[cat] += candidates[cat]

    # Filter: only terms NOT in glossary, not stop words, appearing 3+ times
    min_count = 3
    print(f"Caps escaneados: {caps_scanned}")
    print(f"Filtro: >= {min_count} apariciones, no en glosario, no stop words\n")

    total_new = 0
    for cat, counter in all_candidates.items():
        new_terms = [(term, count) for term, count in counter.most_common(100)
                     if term not in known
                     and term not in STOP_WORDS
                     and count >= min_count
                     and len(term) >= 2
                     # Filter partial words: skip if ends with 的/了/是/着/地/得
                     and term[-1] not in '的了是着地得最']
        if new_terms:
            print(f"=== {cat.upper()} ({len(new_terms)} nuevos) ===")
            for term, count in new_terms:
                print(f"  {term} ({count}x)")
            total_new += len(new_terms)
            print()

    print(f"{'='*50}")
    print(f"Total términos nuevos detectados: {total_new}")
    if total_new > 0:
        print("Revisar y agregar al glosario-maestro.json antes de traducir.")


if __name__ == "__main__":
    main()
