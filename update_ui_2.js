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

// 2. cockpit-screen.tsx
const cockpitScreenPath = 'C:/EcoDriveNew/apps/dashboard/components/cockpit-screen.tsx';
replaceInFile(cockpitScreenPath, [
    ['font-size: 9px;', 'font-size: 13px;'], 
    ['padding: 3px 10px;', 'padding: 6px 14px;'],
    ['font-size: 22px;', 'font-size: 26px;'], 
    ['font-size: 12px;\n          font-weight: 850;', 'font-size: 14px;\n          font-weight: 850;'], 
    ['font-size: 10px !important;', 'font-size: 13px !important;'], 
    ['padding: 8px 12px !important;', 'padding: 10px 14px !important;'], 
    ['font-size: 10.5px;', 'font-size: 14px;'], 
    ['.podium-card-h--1st .podium-h-name {\n          color: #FCD34D;\n        }', '.podium-card-h--1st .podium-h-name {\n          color: #FCD34D;\n          font-size: 16px;\n        }'], 
    ['font-size: 8.5px;', 'font-size: 12px;'], 
    ['font-size: 9.5px;', 'font-size: 13px;'], 
    ['font-size: 9.5px !important;', 'font-size: 12px !important;'], 
    ['font-size: 11.5px !important;', 'font-size: 15px !important;'], 
    ['font-size: 8.5px !important;', 'font-size: 12px !important;'], 
    ['font-size: 10px !important;', 'font-size: 13px !important;'], 
    ['grid-template-columns: 220px 1fr !important;', 'grid-template-columns: 200px 1fr !important;']
]);

// 3. rewards/page.tsx
const rewardsPagePath = 'C:/EcoDriveNew/apps/dashboard/app/rewards/page.tsx';
replaceInFile(rewardsPagePath, [
    ['font-size: 15px;', 'font-size: 18px;'],
    ['padding: 16px;', 'padding: 14px;'],
    ['width: 64px;', 'width: 56px;'],
    ['height: 64px;', 'height: 56px;'],
    ['font-size: 13px;\n      font-weight: 700;', 'font-size: 16px;\n      font-weight: 700;'], 
    ['font-size: 12px;\n      font-weight: 700;', 'font-size: 15px;\n      font-weight: 700;'], 
    ['padding: 6px 12px;', 'padding: 10px 16px;'],
    ['min-height: 42px', 'min-height: 48px'],
    ['font-size: 24px;', 'font-size: 28px;'],
    ['font-size: 14px;\n      color: #718096;', 'font-size: 16px;\n      color: #718096;'], 
    ['font-size: 14px;\n      margin: 0;', 'font-size: 16px;\n      margin: 0;'], 
    ['minmax(200px, 1fr)', 'minmax(180px, 1fr)']
]);

// 4. city/page.tsx
const cityPagePath = 'C:/EcoDriveNew/apps/dashboard/app/city/page.tsx';
replaceInFile(cityPagePath, [
    ['min-height: 42px;', 'min-height: 48px;'],
    ['font-size: 10px;\n      font-weight: 800;', 'font-size: 14px;\n      font-weight: 800;'] 
]);

// 5. cockpit-shell.tsx
const cockpitShellPath = 'C:/EcoDriveNew/apps/dashboard/components/cockpit-shell.tsx';
replaceInFile(cockpitShellPath, [
    [/size=\{14\}/g, 'size={18}'],
    [/size=\{16\}/g, 'size={20}']
]);
