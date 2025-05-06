// js/moduleC.js - 收入归因模块

// 导入各子模块
import { loadIncomeStructureModule } from './moduleC1.js';

// 辅助函数：格式化数字
function formatCurrency(value) {
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatPercent(value) {
  return Number(value).toFixed(1);
}

// 模块入口函数：加载收入归因模块
export function loadIncomeAttributionModule(selectedRM, rmData, rmCustData) {
  // 清空主内容区
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = '';
  
  // 添加模块标题
  const titleContainer = document.createElement('div');
  titleContainer.className = 'section-title animate-fade';
  titleContainer.innerHTML = `
    <i class="fas fa-money-bill-wave"></i> 收入归因
  `;
  mainContent.appendChild(titleContainer);
  

  loadIncomeStructureModule(selectedRM, rmData, rmCustData);
 
}

// 这个函数会被main.js调用
export function loadCModule(selectedRM, rmData ,rmCustData) {
  loadIncomeAttributionModule(selectedRM, rmData, rmCustData);
}