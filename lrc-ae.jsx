/*
 * Create After Effects text layers from an LRC lyric file.
 *
 * Workflow:
 * 1. Select a composition in After Effects.
 * 2. Run this script.
 * 3. Pick an .lrc file.
 *
 * The script keeps the text layer's default styling untouched so AE uses the
 * current/default character and paragraph settings.
 */

(function () {
    var DEFAULT_LINE_DURATION = 2.0;
    var MIN_LINE_DURATION = 0.2;

    function main() {
        if (!app.project) {
            alert("Open a project and select a composition first.");
            return;
        }

        var comp = app.project.activeItem;
        if (!(comp && comp instanceof CompItem)) {
            alert("Select an active composition first.");
            return;
        }

        var lrcFile = File.openDialog(
            "Select an LRC lyric file",
            "LRC Files:*.lrc",
        );
        if (!lrcFile) {
            return;
        }

        var entries = parseLrcFile(lrcFile);
        if (entries.length === 0) {
            alert(
                "No timestamped lyric lines were found in the selected file.",
            );
            return;
        }

        app.beginUndoGroup("Create Lyrics From LRC");
        try {
            createLyricLayers(comp, entries);
        } catch (error) {
            alert("Failed to create lyric layers:\n" + error.toString());
        } finally {
            app.endUndoGroup();
        }
    }

    function parseLrcFile(file) {
        if (!file.exists) {
            throw new Error("The selected file does not exist.");
        }

        file.encoding = "UTF-8";
        if (!file.open("r")) {
            throw new Error("Could not open the selected file.");
        }

        var contents = file.read();
        file.close();

        if (contents && contents.charCodeAt(0) === 0xfeff) {
            contents = contents.substring(1);
        }

        var lines = contents.split(/\r\n|\r|\n/);
        var entries = [];
        var entryIndex = 0;

        for (var lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
            var line = trimString(lines[lineIndex]);
            if (!line) {
                continue;
            }

            var timestampPattern = /\[(\d+):(\d{2})(?:\.(\d{1,3}))?\]/g;
            var timestamps = [];
            var timestampMatch;

            while ((timestampMatch = timestampPattern.exec(line)) !== null) {
                timestamps.push(
                    parseTimestamp(
                        timestampMatch[1],
                        timestampMatch[2],
                        timestampMatch[3],
                    ),
                );
            }

            if (timestamps.length === 0) {
                continue;
            }

            timestampPattern.lastIndex = 0;
            var text = trimString(line.replace(timestampPattern, ""));
            if (!text) {
                continue;
            }

            for (
                var timestampIndex = 0;
                timestampIndex < timestamps.length;
                timestampIndex += 1
            ) {
                entries.push({
                    time: timestamps[timestampIndex],
                    text: text,
                    order: entryIndex,
                });
                entryIndex += 1;
            }
        }

        entries.sort(function (left, right) {
            if (left.time !== right.time) {
                return left.time - right.time;
            }

            return left.order - right.order;
        });

        return entries;
    }

    function parseTimestamp(minutesText, secondsText, fractionText) {
        var minutes = parseInt(minutesText, 10);
        var seconds = parseInt(secondsText, 10);
        var fraction = 0;

        if (fractionText) {
            fraction =
                parseInt(fractionText, 10) / Math.pow(10, fractionText.length);
        }

        return minutes * 60 + seconds + fraction;
    }

    function createLyricLayers(comp, entries) {
        var lastEndTime = comp.duration;

        for (var entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
            var entry = entries[entryIndex];
            var nextEntry = entries[entryIndex + 1];
            var endTime = nextEntry
                ? nextEntry.time
                : entry.time + DEFAULT_LINE_DURATION;

            if (endTime - entry.time < MIN_LINE_DURATION) {
                endTime = entry.time + MIN_LINE_DURATION;
            }

            if (endTime > lastEndTime) {
                lastEndTime = endTime;
            }
        }

        if (comp.duration < lastEndTime) {
            comp.duration = lastEndTime;
        }

        for (
            var reverseIndex = entries.length - 1;
            reverseIndex >= 0;
            reverseIndex -= 1
        ) {
            var lyric = entries[reverseIndex];
            var following = entries[reverseIndex + 1];
            var layerEnd = following
                ? following.time
                : lyric.time + DEFAULT_LINE_DURATION;

            if (layerEnd - lyric.time < MIN_LINE_DURATION) {
                layerEnd = lyric.time + MIN_LINE_DURATION;
            }

            if (layerEnd > comp.duration) {
                layerEnd = comp.duration;
            }

            var textLayer = comp.layers.addText(lyric.text);
            textLayer.name = lyric.text;
            textLayer.startTime = 0;
            textLayer.inPoint = lyric.time;
            textLayer.outPoint = layerEnd;
        }
    }

    function trimString(value) {
        return value.replace(/^\s+|\s+$/g, "");
    }

    main();
})();
