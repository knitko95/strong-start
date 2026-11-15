"""Refresh public still-preview bounds after selecting preview.frame in the catalogue.

Authoring only: requires Pillow; does not modify image files. The Node build checks
the resulting metadata without Python dependencies.
"""
import json
from pathlib import Path
from PIL import Image

catalogue_path=Path(__file__).resolve().parents[1]/'exercise-guides/poses/catalogue.v1.json'
catalogue=json.loads(catalogue_path.read_text(encoding='utf-8'))
for exercise in catalogue['exercises'].values():
    preview=exercise['preview']
    frame=exercise['frames'][preview['frame']]
    with Image.open(catalogue_path.parent/frame['asset']) as image:
        # Ignore very faint edge noise; retain the entire person and equipment.
        bounds=image.getchannel('A').point(lambda value:255 if value>32 else 0).getbbox()
        if not bounds:
            raise ValueError(f"Empty preview: {exercise['name']}")
        preview['bounds']=list(bounds)
catalogue_path.write_text(json.dumps(catalogue,indent=2)+'\n',encoding='utf-8')
print(f"Updated bounds for {len(catalogue['exercises'])} selected preview stills; image files unchanged.")
