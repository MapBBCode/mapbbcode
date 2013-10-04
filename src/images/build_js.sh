#/bin/sh
OUTPUT=../EditorSprites.js
echo "window.MapBBCode.buttonsImage = 'data:image/png;base64,'" > $OUTPUT
rsvg-convert -h 26 -a spritesheet.svg | base64 | sed "s/^\(.\+\)$/+'\\1'/" >> $OUTPUT
echo ';' >> $OUTPUT
