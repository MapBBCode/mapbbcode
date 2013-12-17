#/bin/sh
SPATH=`dirname "$0"`
OUTPUT=$SPATH/EditorSprites.js
echo "/* jshint laxbreak: true */" > $OUTPUT
echo "window.MapBBCode.buttonsImage = 'data:image/png;base64,'" >> $OUTPUT
rsvg-convert -h 26 -a $SPATH/spritesheet.svg | base64 | sed "s/^\(.\+\)$/+'\\1'/" >> $OUTPUT
echo ';' >> $OUTPUT
