# Setting Up Playwright MCP Server in Claude Code

## 🎯 What is Playwright MCP?

Playwright MCP (Model Context Protocol) allows Claude to directly control a browser and interact with your web application. This is perfect for visually testing the credit system UI components.

---

## 📋 Prerequisites

1. **Claude Desktop App** (not web version)
2. **Node.js** installed
3. **Your dev server running** on `http://localhost:3000`

---

## 🚀 Setup Instructions

### **Option 1: Automatic Setup (Recommended)**

1. **Install Playwright MCP Server**

```bash
npm install -g @executeautomation/playwright-mcp-server
```

2. **Configure Claude Code MCP Settings**

On **macOS/Linux**, edit:
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

On **Windows**, edit:
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

3. **Add this configuration:**

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@executeautomation/playwright-mcp-server"
      ],
      "env": {
        "PLAYWRIGHT_BROWSERS_PATH": "0"
      }
    }
  }
}
```

4. **Restart Claude Desktop App**

5. **Verify Installation**

In Claude Code, you should now see new tools available:
- `playwright_navigate` - Navigate to URL
- `playwright_click` - Click elements
- `playwright_screenshot` - Take screenshots
- `playwright_fill` - Fill form fields
- `playwright_evaluate` - Run JavaScript

---

### **Option 2: Manual Testing (Without MCP)**

If you can't use MCP, you can still test with Playwright directly:

1. **Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install
```

2. **Run Tests**

```bash
# Run all tests
npx playwright test

# Run tests in headed mode (see the browser)
npx playwright test --headed

# Run specific test
npx playwright test tests/e2e/credit-system.spec.ts

# Open test report
npx playwright show-report
```

---

## 🧪 Test the Credit System UI

Once Playwright MCP is configured, ask Claude to:

### **Test 1: Screenshot the Credit Badge**

```
"Navigate to http://localhost:3000, wait for the page to load,
take a screenshot of the credit badge in the header"
```

### **Test 2: Test Out of Credits Modal**

```
"Navigate to http://localhost:3000, click the 'Buy more' button
in the credit badge, take a screenshot of the modal"
```

### **Test 3: Test Pricing Page**

```
"Navigate to http://localhost:3000/pricing,
take a screenshot of the entire page"
```

### **Test 4: Test Low Credits Warning**

```
"Navigate to http://localhost:3000, check if the low credits
warning banner is visible, take a screenshot"
```

---

## 📸 Expected Results

### **CreditBadge (Sufficient Credits)**
- Blue badge showing "10 credits"
- "Buy more" button visible
- Hover shows tooltip

### **CreditBadge (Low Credits)**
- Orange badge showing "3 credits"
- Warning icon displayed
- Pulsing animation

### **CreditBadge (Out of Credits)**
- Red badge showing "0 credits"
- Pulsing animation
- Urgent styling

### **OutOfCreditsModal**
- Modal overlay visible
- 4 credit pack cards displayed
- "Most Popular" badge on Pro Pack
- Bonus badges visible
- "Maybe later" dismiss button

### **LowCreditsWarning**
- Orange banner at top
- Warning icon
- "Buy Credits Now" button
- Dismissible with X button

### **CreditPurchasePage**
- Tabs: "One-Time Purchase" vs "Monthly Plans"
- Current balance displayed
- Grid of pricing cards
- Feature comparison section
- Trust signals at bottom

---

## 🔍 Debugging

### **MCP Server Not Showing Up**

1. Check Claude Desktop config file location:
```bash
# macOS/Linux
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Windows
type %APPDATA%\Claude\claude_desktop_config.json
```

2. Verify JSON syntax is valid:
```bash
# Use jq to validate
cat claude_desktop_config.json | jq .
```

3. Check Claude logs:
```bash
# macOS
tail -f ~/Library/Logs/Claude/mcp*.log

# Windows
type %LOCALAPPDATA%\Claude\logs\mcp*.log
```

### **Browser Not Opening**

1. Install Playwright browsers:
```bash
npx playwright install chromium
```

2. Check browser installation:
```bash
npx playwright --version
```

### **Dev Server Not Running**

1. Start dev server:
```bash
npm run dev
```

2. Verify it's accessible:
```bash
curl http://localhost:3000
```

---

## 🎬 Example MCP Commands for Claude

Once MCP is set up, you can ask Claude things like:

**Visual Testing:**
```
"Open the app in a browser, navigate to the pricing page,
and take screenshots of each pricing tier"
```

**Interaction Testing:**
```
"Click on the credit badge, verify the modal appears,
click on the 'Pro Pack' card, and screenshot the result"
```

**Responsive Testing:**
```
"Resize the browser to mobile width (375px),
navigate to /pricing, and screenshot how it looks on mobile"
```

**Flow Testing:**
```
"Simulate a user running out of credits:
1. Navigate to the app
2. Check current credit balance
3. Click 'Create Slide' 10 times
4. Verify the OutOfCreditsModal appears
5. Screenshot the modal"
```

---

## 📚 Additional Resources

- **Playwright MCP Server**: https://github.com/executeautomation/playwright-mcp-server
- **Playwright Docs**: https://playwright.dev
- **MCP Specification**: https://modelcontextprotocol.io

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Playwright MCP server shows in Claude's tool list
- [ ] Can navigate to localhost:3000
- [ ] Can take screenshots
- [ ] Can click elements
- [ ] Can fill forms
- [ ] Screenshots are clear and readable
- [ ] Browser launches successfully

---

## 🆘 Troubleshooting

**Issue: "Could not find browser"**
```bash
npx playwright install --with-deps chromium
```

**Issue: "Port 3000 not accessible"**
```bash
# Check if dev server is running
lsof -i :3000

# If not, start it
npm run dev
```

**Issue: "MCP server failed to start"**
```bash
# Test the command manually
npx -y @executeautomation/playwright-mcp-server
```

**Issue: "Cannot connect to browser"**
```bash
# Check Playwright installation
npx playwright --version

# Reinstall if needed
npm install -D @playwright/test
npx playwright install
```

---

## 🎯 Next Steps

Once Playwright MCP is working:

1. ✅ Test all credit UI components visually
2. ✅ Take screenshots for documentation
3. ✅ Test responsive design (mobile/tablet/desktop)
4. ✅ Test user flows (purchase, consumption, warnings)
5. ✅ Create visual regression tests

---

**Note:** If you're using Claude Code in the browser (not desktop app), MCP servers are not available. In that case, use the manual Playwright testing approach instead.
