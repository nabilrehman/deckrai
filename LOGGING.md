# Logging System

Deckr.ai includes a browser-based logging system for monitoring Designer Mode generation and debugging.

## Browser Console Monitoring (tail -f equivalent)

Since this is a browser application, logs are written to:
1. **Browser Console** - Live updates in real-time
2. **LocalStorage** - Persistent storage (last 1000 entries)

### View Live Logs

Open browser DevTools (F12 or Cmd+Option+I) and use:

```javascript
// View all logs in console
window.deckrLogs.printAll()

// Download logs as file
window.deckrLogs.download()

// Clear logs
window.deckrLogs.clear()

// Get logs programmatically
const logs = window.deckrLogs.getAll()
```

### Monitor in Real-Time

1. Open browser DevTools (F12)
2. Go to Console tab
3. Run a Designer Mode generation
4. Watch logs appear in real-time (like `tail -f`)

### Log Levels

- **INFO**: General information (generation started, matches found, etc.)
- **WARN**: Warnings (reference not found, fallback used, etc.)
- **ERROR**: Errors (API failures, parsing errors, etc.)
- **DEBUG**: Detailed debugging information

### Log Format

```
[2025-11-13T22:18:30.123Z] [INFO] Starting Designer Mode generation {"mode":"template","hasReferences":true,"referenceCount":37,"notesLength":1234}
[2025-11-13T22:18:45.456Z] [INFO] Starting reference matching: 8 slides, 37 references
[2025-11-13T22:19:12.789Z] [INFO] Matched slide 1 to reference {"slideNumber":1,"referenceName":"DA Mentor Led Hackathon _ Q4 2025 - Page 11","matchScore":95,"category":"content"}
```

### Download Logs for Analysis

After a generation run:

```javascript
// Downloads logs as deckr-logs-2025-11-13T22-18-30.log
window.deckrLogs.download()
```

Then analyze with:
```bash
# View in terminal
cat ~/Downloads/deckr-logs-*.log

# Search for errors
grep ERROR ~/Downloads/deckr-logs-*.log

# Count matches
grep "Matched slide" ~/Downloads/deckr-logs-*.log | wc -l

# View reference matching results
grep "Matched slide" ~/Downloads/deckr-logs-*.log
```

## What Gets Logged

### Designer Mode Generation
- Generation start (mode, reference count, notes length)
- Reference matching start/completion
- Individual slide matches (slide number, reference name, match score, category)
- Matching strategy
- Errors and warnings

### Reference Matching
- Matching start (slide count, reference count)
- Each successful match (slide, reference, score, category)
- Failed matches (reference not found)
- Matching completion (total matched)

## Storage Limits

- **Max Log Entries**: 1000 (oldest entries are auto-deleted)
- **Storage**: Browser localStorage (typically 5-10MB)
- **Persistence**: Logs survive page reloads but are cleared when localStorage is cleared

## Debugging Tips

### Check if Template Mode is Working
```javascript
window.deckrLogs.getAll().filter(log => log.message.includes('Template mode'))
```

### See All Reference Matches
```javascript
window.deckrLogs.getAll().filter(log => log.message.includes('Matched slide'))
```

### Find Errors
```javascript
window.deckrLogs.getAll().filter(log => log.level === 'ERROR')
```

### Check Match Scores
```javascript
window.deckrLogs.getAll()
  .filter(log => log.message.includes('Matched slide'))
  .map(log => `Slide ${log.data.slideNumber}: ${log.data.matchScore}% - ${log.data.referenceName}`)
```

## Log Rotation

Logs are automatically trimmed to the last 1000 entries. To manually clear:

```javascript
window.deckrLogs.clear()
```

## Production Monitoring

In production (Cloud Run), you can:

1. **Open DevTools remotely**: Right-click → Inspect → Console tab
2. **Download logs**: `window.deckrLogs.download()`
3. **Share logs**: Email or attach downloaded .log file for support

## Session Logger (Existing System)

The existing `sessionLogger` service downloads complete session reports as markdown files after each generation.

Browser Logger vs Session Logger:
- **Browser Logger**: Real-time, lightweight, structured logs for monitoring
- **Session Logger**: Complete session report, downloadable markdown file
