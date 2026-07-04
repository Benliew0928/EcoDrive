const fs = require('fs');

const rewardsPagePath = 'C:/EcoDriveNew/apps/dashboard/app/rewards/page.tsx';

let content = fs.readFileSync(rewardsPagePath, 'utf8');

const replacements = [
    // Top summary
    ['.summary-eyebrow {\n    color: #8fa69f;\n    font-size: 9px;', '.summary-eyebrow {\n    color: #8fa69f;\n    font-size: 14px;'],
    ['.currency-label {\n    font-size: 12px;', '.currency-label {\n    font-size: 16px;'],
    ['.metric-label {\n    color: #81958f;\n    font-size: 8px;', '.metric-label {\n    color: #81958f;\n    font-size: 13px;'],
    ['.metric-value {\n    font-size: 18px;', '.metric-value {\n    font-size: 26px;'],
    ['.metric-sub {\n    font-size: 8px;', '.metric-sub {\n    font-size: 13px;'],
    
    // Header buttons
    ['.my-rewards-trigger-btn {\n    background:', '.my-rewards-trigger-btn {\n    background:'], // no-op anchor
    ['.my-rewards-trigger-btn {', '.my-rewards-trigger-btn {'], // no-op anchor
    // Replacing attributes individually using regex
    [/(\.my-rewards-trigger-btn[\s\S]*?font-size:\s*)11px/g, '$116px'],
    [/(\.my-rewards-trigger-btn[\s\S]*?padding:\s*)10px 14px/g, '$114px 20px'],
    [/(\.trigger-badge[\s\S]*?font-size:\s*)8px/g, '$113px'],
    
    // Category pills / filters
    [/(\.inline-back-home-btn[\s\S]*?font-size:\s*)10px/g, '$114px'],
    [/(\.inline-back-home-btn[\s\S]*?height:\s*)32px/g, '$148px'],
    [/(\.inline-back-home-btn[\s\S]*?padding:\s*)6px 12px/g, '$112px 18px'],
    [/(\.nav-category-pill[\s\S]*?height:\s*)32px/g, '$148px'],
    [/(\.pill-icon[\s\S]*?font-size:\s*)14px/g, '$120px'],
    [/(\.pill-title[\s\S]*?font-size:\s*)11px/g, '$116px'],
    
    // Category Landing Home
    [/(\.medium-category-card h3[\s\S]*?font-size:\s*)18px/g, '$124px'],
    [/(\.medium-category-card p[\s\S]*?font-size:\s*)10px/g, '$115px'],
    [/(\.medium-card-total[\s\S]*?font-size:\s*)9px/g, '$114px'],
    
    // Browser tools
    [/(\.browser-title-group h2[\s\S]*?font-size:\s*)16px/g, '$122px'],
    [/(\.total-badge[\s\S]*?font-size:\s*)10px/g, '$114px'],
    [/(\.compact-search-box input[\s\S]*?font-size:\s*)10px/g, '$115px'],
    [/(\.compact-search-box input[\s\S]*?height:\s*)28px/g, '$148px'],
    [/(\.compact-sort-select[\s\S]*?font-size:\s*)10px/g, '$115px'],
    [/(\.compact-sort-select[\s\S]*?height:\s*)28px/g, '$148px'],
    
    // Rewards home intro
    [/(\.rewards-home-intro > span[\s\S]*?font-size:\s*)8px/g, '$113px'],
    [/(\.rewards-home-intro h2[\s\S]*?font-size:\s*)clamp\(25px, 2.4vw, 36px\)/g, '$1clamp(28px, 3.5vw, 42px)'],
    [/(\.rewards-home-intro > p[\s\S]*?font-size:\s*)11px/g, '$116px'],
    [/(\.rewards-home-facts strong[\s\S]*?font-size:\s*)28px/g, '$148px'],
    [/(\.rewards-home-facts span[\s\S]*?font-size:\s*)8px/g, '$114px'],
    
    // Reward category buttons
    [/(\.reward-category-number[\s\S]*?font-size:\s*)14px/g, '$120px'],
    [/(\.reward-category-copy strong[\s\S]*?font-size:\s*)19px/g, '$126px'],
    [/(\.reward-category-copy small[\s\S]*?font-size:\s*)10px/g, '$115px'],
    [/(\.reward-category-count[\s\S]*?font-size:\s*)9px/g, '$114px'],
    
    // Voucher tabs
    [/(\.voucher-tab-button[\s\S]*?font-size:\s*)10px/g, '$115px'],
    [/(\.voucher-tab-button[\s\S]*?min-height:\s*)31px/g, '$148px'],
    
    // Pagination
    [/(\.pagination-btn[\s\S]*?font-size:\s*)9px/g, '$115px'],
    [/(\.pagination-btn[\s\S]*?min-height:\s*)30px/g, '$148px'],
    [/(\.pagination-text[\s\S]*?font-size:\s*)9px/g, '$115px'],
    
    // Item cards
    [/(\.item-card-header h3[\s\S]*?font-size:\s*)16px/g, '$122px'],
    [/(\.item-partner[\s\S]*?font-size:\s*)10px/g, '$115px'],
    [/(\.reward-card-desc[\s\S]*?font-size:\s*)10px/g, '$115px'],
    [/(\.item-card-meta span[\s\S]*?font-size:\s*)8px/g, '$113px'],
    [/(\.item-cost strong[\s\S]*?font-size:\s*)20px/g, '$128px'],
    [/(\.item-cost small[\s\S]*?font-size:\s*)9px/g, '$114px'],
    [/(\.item-redeem-action[\s\S]*?font-size:\s*)10px/g, '$116px'],
    [/(\.item-redeem-action[\s\S]*?min-height:\s*)34px/g, '$148px'],
    
    // Owned rewards
    [/(\.owned-info-details h3[\s\S]*?font-size:\s*)14px/g, '$120px'],
    [/(\.owned-partner[\s\S]*?font-size:\s*)9px/g, '$114px'],
    [/(\.owned-dates-row small[\s\S]*?font-size:\s*)7px/g, '$112px'],
    [/(\.owned-dates-row strong[\s\S]*?font-size:\s*)9px/g, '$114px'],
    [/(\.coins-spent-tag[\s\S]*?font-size:\s*)9px/g, '$114px'],
    [/(\.use-voucher-btn[\s\S]*?font-size:\s*)8px/g, '$114px'],
    [/(\.use-voucher-btn[\s\S]*?padding:\s*)4px 10px/g, '$112px 16px'],
    [/(\.status-badge-text[\s\S]*?font-size:\s*)9px/g, '$114px'],
    [/(\.fullpage-empty-vouchers h3[\s\S]*?font-size:\s*)14px/g, '$120px'],
    [/(\.fullpage-empty-vouchers p[\s\S]*?font-size:\s*)10px/g, '$114px']
];

for (const [search, replace] of replacements) {
    content = content.replace(search, replace);
}

fs.writeFileSync(rewardsPagePath, content, 'utf8');
console.log('Fixed rewards page styles!');
