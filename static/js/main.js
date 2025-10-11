/**
 * main.js - 应用主入口
 */

// 全局变量
let adminSystem;

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    console.log('应用初始化...');
    adminSystem = new AdminSystem();
    adminSystem.init();
    
    // 导出到全局
    window.adminSystem = adminSystem;
    
    console.log('✓ Schema Generator 已就绪');
});

