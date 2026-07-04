const fs = require('fs');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    for (const [search, replace] of replacements) {
        if (typeof search === 'string') {
            content = content.replace(search, replace);
        } else {
            content = content.replace(search, replace);
        }
    }
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    } else {
        console.log(`No changes made to ${filePath}`);
    }
}

// 1. globals.css
const globalsCssPath = 'C:/EcoDriveNew/apps/dashboard/app/globals.css';
replaceInFile(globalsCssPath, [
    // Add tokens
    [/:root\s*\{([\s\S]*?)\}/, (match, p1) => {
        if (p1.includes('--header-height')) return match;
        return `:root {${p1}\n  /* ──── Automotive Scaling Tokens ──── */\n  --header-height: 56px;\n  --dock-height: 64px;\n  --content-padding-x: 16px;\n}`;
    }],
    // Header
    ['height: 64px;', 'height: var(--header-height, 56px);'],
    ['padding: 0 28px;', 'padding: 0 var(--content-padding-x, 16px);'],
    ['font-size: 17px;', 'font-size: 20px; /* clock */'],
    ['font-size: 15px;\n  font-weight: 800;', 'font-size: 18px;\n  font-weight: 800; /* brand */'],
    ['font-size: 13px;\n  font-weight: 700;\n  padding: 6px 16px;', 'font-size: 16px;\n  font-weight: 700;\n  padding: 8px 18px;'],
    ['font-size: 12px;\n  font-weight: 700;\n  gap: 6px;\n  height: 34px;', 'font-size: 14px;\n  font-weight: 700;\n  gap: 6px;\n  height: 44px;'],
    ['font-size: 12px;\n  margin: 0;', 'font-size: 14px;\n  margin: 0;'],
    // Main Layout
    ['padding: 88px 28px 100px;', 'padding: 66px 16px 76px;'],
    // Bottom Dock
    ['height: 72px;', 'height: var(--dock-height, 64px);'],
    ['gap: 8px;\n  height: 42px;\n  padding: 0 14px;\n  font-size: 13px;', 'gap: 10px;\n  height: 52px;\n  padding: 0 18px;\n  font-size: 16px;'], // Need to make sure mode-chip matches.
    // Panels & Cards
    ['gap: 18px;\n  min-height: 0;\n  padding: 22px;', 'gap: 12px;\n  min-height: 0;\n  padding: 16px;'],
    ['font-size: 12px;\n  font-weight: 800;\n  margin: 0;\n  text-transform: uppercase;', 'font-size: 14px;\n  font-weight: 800;\n  margin: 0;\n  text-transform: uppercase;'],
    ['font-size: clamp(28px, 4vw, 48px);', 'font-size: clamp(26px, 4.5vw, 40px);'],
    ['gap: 12px;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  padding: 14px;', 'gap: 12px;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  padding: 12px;'],
    ['min-height: 110px;\n  padding: 14px;', 'min-height: 90px;\n  padding: 12px;'],
    ['.metric-card p {\n  font-size: 12px;', '.metric-card p {\n  font-size: 14px;'],
    ['font-size: clamp(24px, 3vw, 38px);', 'font-size: clamp(28px, 4vw, 42px);'],
    ['.metric-card span {\n  color: var(--muted);\n  font-size: 12px;', '.metric-card span {\n  color: var(--muted);\n  font-size: 13px;'],
    ['.secondary-panel {\n  padding: 18px;', '.secondary-panel {\n  padding: 14px;'],
    ['font-size: clamp(48px, 9vw, 100px);', 'font-size: clamp(52px, 10vw, 110px);'],
    ['.speed-orb small {\n  color: var(--muted);\n  font-size: 13px;', '.speed-orb small {\n  color: var(--muted);\n  font-size: 16px;'],
    ['min-height: 40px;\n  padding: 0 12px;', 'min-height: 44px;\n  padding: 0 12px;'],
    ['.packet-row span {\n  color: var(--muted);\n  font-size: 11px;', '.packet-row span {\n  color: var(--muted);\n  font-size: 14px;'],
    ['.packet-row strong {\n  color: var(--text);\n  font-size: 13px;', '.packet-row strong {\n  color: var(--text);\n  font-size: 16px;'],
    ['.hardware-pod span {\n  color: var(--muted);\n  font-size: 12px;', '.hardware-pod span {\n  color: var(--muted);\n  font-size: 14px;'],
    // Live Surface
    ['min-height: 480px;', 'min-height: 420px;'],
    // Route Planner
    ['font-size: 14px;\n  outline: none;', 'font-size: 16px;\n  outline: none;'],
    ['height: 48px;\n  position: relative;', 'height: 52px;\n  position: relative;'],
    ['font-size: 13px;\n  color: var(--green);', 'font-size: 15px;\n  color: var(--green);'],
    ['padding: 10px 14px;', 'padding: 12px 16px;'],
    ['font-size: 13px;\n  text-align: left;', 'font-size: 16px;\n  text-align: left;'],
    ['font-size: 16px;\n  margin: 0;', 'font-size: 18px;\n  margin: 0;'],
    ['border-radius: 8px;\n  padding: 14px;', 'border-radius: 8px;\n  padding: 12px;'],
    ['font-size: 10px;\n  text-transform: uppercase;', 'font-size: 13px;\n  text-transform: uppercase;'],
    ['font-size: 15px;\n}', 'font-size: 17px;\n}'], // .route-stats .stat strong
    ['font-size: 13px;\n  font-weight: 700;', 'font-size: 16px;\n  font-weight: 700;'], // route-cta
    ['padding: 10px;\n  border-radius: 6px;', 'padding: 14px;\n  border-radius: 6px;'], // route-cta
    ['font-size: 11px;\n  font-weight: 800;', 'font-size: 13px;\n  font-weight: 800;'], // eco tag
    ['font-size: 11px;\n  font-weight: 700;', 'font-size: 13px;\n  font-weight: 700;'], // eco bonus
    ['grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));', 'grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));'],
    // City Builder
    ['font-size: 10px;\n}', 'font-size: 13px;\n}'], // city summary span
    ['font-size: 19px;\n  line-height: 1;', 'font-size: 22px;\n  line-height: 1;'], // city summary strong
    ['padding: 12px;\n}', 'padding: 10px;\n}'], // city summary padding
    ['font-size: 15px;\n', 'font-size: 18px;\n'], // city map heading
    ['min-height: 45px;', 'min-height: 52px;'],
    ['font-size: 11px;\n  overflow: hidden;', 'font-size: 14px;\n  overflow: hidden;'], // building option copy
    ['font-size: 11px;\n  font-weight: 900;', 'font-size: 14px;\n  font-weight: 900;'], // building option cost
    ['height: 32px;\n  justify-content: center;\n  width: 32px;', 'height: 38px;\n  justify-content: center;\n  width: 38px;'],
    ['padding: 11px;\n}', 'padding: 12px;\n}'], // building panel
    ['gap: 4px;\n  grid-template-columns', 'gap: 3px;\n  grid-template-columns'],
    ['font-size: 7px;\n  font-weight: 800;', 'font-size: 10px;\n  font-weight: 800;'], // city building small
    ['font-size: 10px;\n  gap: 6px;', 'font-size: 13px;\n  gap: 6px;'], // city message
    ['font-size: 9px;\n  line-height: 1.35;', 'font-size: 12px;\n  line-height: 1.35;'], // city adjacency tip
    // Community / Leaderboard
    ['clamp(24px, 3.5vw, 36px);', 'clamp(26px, 4vw, 38px);'],
    ['font-size: 13px;\n  text-transform: uppercase;', 'font-size: 15px;\n  text-transform: uppercase;'], // leaderboard header p
    ['padding: 32px 24px;', 'padding: 20px 16px;'],
    ['font-size: 13.5px;\n  font-weight: 700;', 'font-size: 16px;\n  font-weight: 700;'], // podium name
    ['font-size: 15px;\n  color: #FFD700;', 'font-size: 18px;\n  color: #FFD700;'], // 1st place
    ['font-size: 11px;\n  color: var(--muted);', 'font-size: 14px;\n  color: var(--muted);'], // podium score
    ['font-size: 13.5px;\n  font-weight: 800;', 'font-size: 16px;\n  font-weight: 800;'], // podium score span
    ['min-height: 380px;', 'min-height: 320px;'],
    ['padding: 20px;\n  display: flex;', 'padding: 16px;\n  display: flex;'], // leaderboard card
    ['font-size: 16px;\n  font-weight: 850;', 'font-size: 18px;\n  font-weight: 850;'], // leaderboard title
    ['padding: 10px 14px;', 'padding: 10px 12px;'], // leaderboard row padding
    ['font-size: 13px;\n  font-weight: 800;', 'font-size: 15px;\n  font-weight: 800;'], // rank v2
    ['width: 34px;\n  height: 34px;', 'width: 40px;\n  height: 40px;'], // avatar wrapper
    ['font-size: 13.5px;\n  font-weight: 600;', 'font-size: 16px;\n  font-weight: 600;'], // name v2
    ['font-size: 11px;\n  font-weight: 700;\n  color: var(--muted);', 'font-size: 13px;\n  font-weight: 700;\n  color: var(--muted);'], // state label
    ['font-size: 11.5px;\n  font-weight: 750;', 'font-size: 14px;\n  font-weight: 750;'], // state select dropdown
    ['gap: 20px;\n  margin: 15px auto 10px;', 'gap: 14px;\n  margin: 15px auto 10px;'], // podium section
    ['gap: 24px;\n  width: 100%;', 'gap: 16px;\n  width: 100%;'], // leaderboards grid
    
    // Responsive
    ['height: 56px;\n  }', 'height: 50px;\n  }'] // @media 720px header
]);

console.log("globals.css updated.");
