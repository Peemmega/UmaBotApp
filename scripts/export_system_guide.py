"""Export guide tables from the sibling bot without importing its database.

Run from any directory: python scripts/export_system_guide.py [--check]
The bot checkout can be supplied with --bot-root. Review prose and the audit
whenever this check detects a rules change; exporting tables alone is not enough.
"""
import argparse
import ast
import json
from pathlib import Path

APP = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--bot-root', type=Path, default=APP.parent / 'UmaDnDBot')
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
BOT = args.bot_root


def tree(relative):
    return ast.parse((BOT / relative).read_text(encoding='utf-8-sig'))


def assignment(relative, name):
    for node in tree(relative).body:
        if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == name for t in node.targets):
            return node.value
    raise ValueError(f'{name} not found in {relative}')


def literal(relative, name):
    return ast.literal_eval(assignment(relative, name))


def pure_function(relative, name, namespace):
    node = next(n for n in tree(relative).body if isinstance(n, ast.FunctionDef) and n.name == name)
    exec(compile(ast.Module(body=[node], type_ignores=[]), str(BOT / relative), 'exec'), namespace)
    return namespace[name]


caps = literal('utils/dice/dice_presets.py', 'MAX_SPEED_PHASE')
ns = {'MAX_SPEED_PHASE': caps, 'is_wet_lane': lambda *_: False}
import math
ns['math'] = math
ns['get_phase_from_turn'] = pure_function('utils/race/race_dice.py', 'get_phase_from_turn', ns)
accelerate = pure_function('utils/game/progression.py', 'incrase_speed_by_acceleration', ns)
scales = {}
for style in caps:
    scales[style] = []
    for phase in range(1, 5):
        player = {'style': style, 'current_max_speed': 0, 'race_profile': {'power': 10, 'speed': 0}}
        accelerate({'turn': phase, 'max_turn': 4}, player, 1)
        scales[style].append(round((player['current_max_speed'] - 0.3) / 15, 2))


def race_example(module, race_id):
    relative = f'utils/race/presets/{module}.py'
    paths = literal(relative, 'TRACK_PATHS')
    races = assignment(relative, 'RACES')
    race = next(value for key, value in zip(races.keys, races.values) if ast.literal_eval(key) == race_id)
    fields = {ast.literal_eval(key): value for key, value in zip(race.keys, race.values)}
    path_node = fields['path']
    path = paths[ast.literal_eval(path_node.slice)] if isinstance(path_node, ast.Subscript) else ast.literal_eval(path_node)
    course = ast.literal_eval(fields['course'])
    distance_ns = {'get_race_distance_m': lambda _: course['distance_m']}
    distance_type = pure_function('utils/race/race_preset_data.py', 'get_race_distance_type', distance_ns)
    return {'id': race_id, 'name': ast.literal_eval(fields['name']), 'track': ast.literal_eval(fields['track']), 'course': course, 'path': path, 'turns': len(path), 'distanceType': distance_type({})}


data = {
    'source': 'UmaDnDBot',
    'maxSpeedPhase': caps,
    'dicePreset': literal('utils/dice/dice_presets.py', 'DICE_PRESET'),
    'accelerationScale': scales,
    'aptitudeModifier': literal('utils/race/race_aptitude.py', 'APTITUDE_MODIFIER'),
    'laneCosts': literal('utils/race/race_lane.py', 'LANE_STAMINA_BASE_COSTS'),
    'zoneValue': literal('utils/zone/zone_preset.py', 'ZONE_VALUE'),
    'zonePointCost': literal('utils/zone/zone_preset.py', 'ZONE_POINT_COST'),
    'zonePoints': literal('utils/zone/zone_preset.py', 'DEFAULT_ZONE')['points'],
    'packRange': literal('utils/race/rank_display.py', 'BASE_GOLD_RANGE'),
    'packLaneTolerance': literal('utils/race/rank_display.py', 'GOLD_LANE_TOLERANCE'),
    'blockStep': literal('utils/race/race_lane.py', 'LANE_BLOCK_PENALTY_STEP'),
    'blockCap': literal('utils/race/race_lane.py', 'LANE_BLOCK_PENALTY_CAP'),
    'draftFactor': literal('utils/race/stamina_rules.py', 'DRAFTING_STAMINA_FACTOR'),
    'sunnyCost': literal('utils/race/stamina_rules.py', 'SUNNY_STAMINA_COST'),
    'timingTempo': literal('utils/race/web_timing_config.py', 'WEB_TIMING_TEMPO_TABLE'),
    'timingTempoConfig': literal('utils/race/web_timing_config.py', 'WEB_TIMING_TEMPO_CONFIG'),
    'timingZone': literal('utils/race/web_timing_config.py', 'WEB_TIMING_ZONE_EFFECT'),
    'timingSpeedCap': literal('utils/race/web_timing_config.py', 'MAX_WEB_TIMING_SPEED'),
    'timingResult': literal('utils/race/web_timing_config.py', 'TIMING_RESULT_MULTIPLIERS'),
    'raceExamples': [race_example(module, key) for module, key in [('nakayama', 'SprintersStakes'), ('tokyo', 'YasudaKinen'), ('hanshin', 'TakarazukaKinen'), ('kyoto', 'TennoShoSpring')]],
}
target = APP / 'uma-dashboard-ui/src/data/systemGuideRules.json'
content = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
if args.check:
    if not target.exists() or target.read_text(encoding='utf-8') != content:
        raise SystemExit('Guide tables differ from the bot. Export and review the guide prose/audit.')
    print('Guide tables match the bot source.')
else:
    target.write_text(content, encoding='utf-8')
    print(f'Exported {target}')
