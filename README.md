# ae-scripts

Small utility scripts for Adobe After Effects.

## Included Script

### `lrc-ae.jsx`
Creates timed text layers in an active composition from an `.lrc` lyric file.

#### What it does
- Parses timestamped lyric lines from an LRC file.
- Creates one text layer per timestamped line.
- Sets each layer's `inPoint` and `outPoint` to match lyric timing.
- Extends composition duration automatically when needed.
- Preserves your current/default text styling in After Effects.

## Requirements

- Adobe After Effects
- An open AE project with an active composition selected
- A valid `.lrc` file

## Usage

1. Open After Effects and select the target composition.
2. Run `lrc-ae.jsx` (`File → Scripts → Run Script File...`).
3. Choose your `.lrc` file when prompted.
4. The script will generate lyric text layers timed to your file.

## Supported LRC Format

The script reads lines like:

```lrc
[00:12.34]First line
[00:15.00][00:30.00]Repeated line at two timestamps
```

Notes:
- Empty lines are ignored.
- Non-timestamp metadata lines are ignored.
- Fractional timestamps with 1–3 digits are supported (e.g. `.3`, `.34`, `.345`).

## Timing Behavior

- Each lyric line ends when the next lyric starts.
- The final lyric line gets a default duration of 2 seconds.
- A minimum duration of 0.2 seconds is enforced.

## Troubleshooting

- **“Select an active composition first.”**  
  Select a comp in the Project panel or open one in the Timeline.
- **“No timestamped lyric lines were found...”**  
  Confirm your file uses `[mm:ss(.fraction)]` timestamps and contains lyric text on those lines.
