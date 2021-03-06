# Kana-Solver

## Romanize Japanese utau

### Features:
- Extract and install japanese encoded utau zip files without changing the system locale
- Create your own rules to convert japanese characters to a romanized version
- Convert UST file from - to CV <-> VCV
- Convert Japanese file from - to romaji

### Screenshots

[![File Browser](https://raw.githubusercontent.com/leonardothehuman/Kana-Solver/main/screenshots/1-FileBrowser.png)]()
[![Conversion Rules Editor](https://raw.githubusercontent.com/leonardothehuman/Kana-Solver/main/screenshots/2-ConversionEditor.png)]()
[![Uninstaller](https://raw.githubusercontent.com/leonardothehuman/Kana-Solver/main/screenshots/6-Dark-Mode.png)]()
[![Avoid losing changes](https://raw.githubusercontent.com/leonardothehuman/Kana-Solver/main/screenshots/2-ConversionEditor2.png)]()
[![Utau Picker](https://raw.githubusercontent.com/leonardothehuman/Kana-Solver/main/screenshots/3-UtauPicker.png)]()
[![Conversion Options](https://raw.githubusercontent.com/leonardothehuman/Kana-Solver/main/screenshots/4-ConversionOptions.png)]()
[![Extractor](https://raw.githubusercontent.com/leonardothehuman/Kana-Solver/main/screenshots/5-Extractor.png)]()

## Useful links
[Utau Official Page](http://utau2008.xrea.jp/)

[Direct link to the latest version](http://utau2008.xrea.jp/utau0418e-inst.zip)

### Some cool UTAU voicebanks
[Momo Momone](https://momonemomo.com/)

[Kasane Teto](https://kasaneteto.jp/teto/voice.html)

[Ritsu Namine](http://canon-voice.com/voice.html)


## To build this project run: 
1. `npm install`
2. `npm run downloadNW -- win64sdk`
3. `npm run regenerate`
4. `npm run build-dev`
5. go to `"dist/package.nw"` directory and run `npm install`
6. Return to the "kana-solver-html-app" directory and run `npm run run-nw`

## License
This project is licensed under GNU GPL v3, some files that may be used in other projects are licensed under MIT license, please refeer to the file header to know it's specific license ...

All binaries are licensed under GNU GPL v3
