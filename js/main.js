// js/main.js

// 导入各模块的入口函数
import { loadOverviewModule } from './moduleA.js';  // 整体评价模块
import { loadB1Module } from './moduleB1.js';
import { loadB2Module } from './moduleB2.js';
import { loadCModule } from './moduleC.js';
import { loadDModule } from './moduleD.js';  
import { loadEModule } from './moduleE.js';
import { loadFModule } from './moduleF.js';  // 新增: 导入商机预测模块

let rmData = null;        // 原始数据表 Table_RM_EVA_PRE.csv 的数据
let rmCustData = null;    // 新数据表 Table_RM_CUST_EVA_FINAL.csv 的数据
let selectedRM = null;

// 更新日期显示函数
function updateDateDisplay() {
  const dateElement = document.getElementById('currentDate');
  if (dateElement) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    dateElement.innerHTML = `<i class="far fa-calendar-alt"></i> ${year}年${month}月${day}日`;
  }
}

// 更新用户欢迎区
function updateWelcomeArea() {
  if (!selectedRM) return;
  
  const rmAvatar = document.getElementById('rmAvatar');
  const welcomeTitle = document.getElementById('welcomeTitle');
  const welcomeSubtitle = document.getElementById('welcomeSubtitle');
  
  if (rmAvatar && welcomeTitle && welcomeSubtitle) {
    // 使用RM_ID的首字母作为头像
    rmAvatar.textContent = selectedRM.RM_ID.charAt(0) + selectedRM.RM_ID.charAt(1);
    
    // 更新欢迎信息
    welcomeTitle.textContent = `${selectedRM.RM_ID}, 欢迎回来！`;
    
    // 计算销售线索数量
    let salesLeadsCount = 0;
    if (rmCustData) {
      const rmCustomers = rmCustData.filter(cust => cust.RM_ID === selectedRM.RM_ID);
      salesLeadsCount = rmCustomers.filter(cust => cust.Next_Status == 1 || cust.Next_Status == 2).length;
    }
    
    welcomeSubtitle.textContent = `您有 ${salesLeadsCount} 个销售线索待处理`;
  }
}



// 加载原始数据和新数据
function loadData() {
  // 首先加载原始数据
  fetch('Table_RM_EVA_PRE.csv')
    .then(response => response.text())
    .then(csvData => {
      rmData = Papa.parse(csvData, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      }).data;
      
      // 再加载新数据
      return fetch('Table_RM_CUST_EVA_FINAL.csv');
    })
    .then(response => response.text())
    .then(csvData => {
      rmCustData = Papa.parse(csvData, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      }).data;
      
      // 初始化理财经理选择器
      initRMSelector();
      
      // 更新日期显示
      updateDateDisplay();
      
      // 更新欢迎区域
      updateWelcomeArea();
      

      // 加载默认模块 - 整体评价
      loadModule('overview');
    })
    .catch(error => {
      console.error('数据加载失败:', error);
      document.getElementById('mainContent').innerHTML = `<p>数据加载失败，请检查 CSV 文件是否存在且格式正确。</p>`;

      // 更新日期显示
      updateDateDisplay();
    });
}

// RM_ID排序
function compareRMIds(a, b) {
  // 提取数字部分进行比较
  const getNumber = id => {
    const match = id.match(/RM(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };
  
  return getNumber(a) - getNumber(b);
}

// 初始化理财经理选择器
function initRMSelector() {
  const rmSelector = document.getElementById('rmSelector');
  rmSelector.innerHTML = '<option value="">选择理财经理...</option>';
  
  // 获取唯一RM_ID列表 
  const uniqueRMIds = [...new Set(rmData.map(rm => rm.RM_ID))].filter(Boolean);
  
  // 按照RM_ID的数字部分排序
  uniqueRMIds.sort(compareRMIds);
  
  uniqueRMIds.forEach(rmId => {
    const option = document.createElement('option');
    option.value = rmId;
    option.textContent = rmId;
    rmSelector.appendChild(option);
  });
  
  // 默认选择RM1
  const defaultRmId = "RM1";
  if (uniqueRMIds.includes(defaultRmId)) {
    selectedRM = rmData.find(rm => rm.RM_ID === defaultRmId);
    rmSelector.value = defaultRmId;
  } else if (uniqueRMIds.length > 0) {
    selectedRM = rmData.find(rm => rm.RM_ID === uniqueRMIds[0]);
    rmSelector.value = selectedRM.RM_ID;
  }
  
  // 为下拉框添加事件监听器
  rmSelector.addEventListener('change', function() {
    const selectedId = this.value;
    selectedRM = rmData.find(rm => rm.RM_ID === selectedId);
    
    // 更新欢迎区域
    updateWelcomeArea();
    
    
    // 获取当前活跃的模块
    const activeLink = document.querySelector('.nav-link.active');
    if (activeLink) {
      loadModule(activeLink.getAttribute('data-module'));
    }
  });
}

// 加载对应模块的函数
function loadModule(moduleName) {
  const mainContent = document.getElementById('mainContent');
  // 调整内容区域的样式
  mainContent.style.minHeight = 'calc(100vh - 100px)';
  mainContent.style.padding = '20px';
  
  mainContent.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i></div>';
  
  // 更新导航栏活跃状态
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('data-module') === moduleName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
  
  // 根据模块名加载对应模块
  switch (moduleName) {
    case 'overview':
      // 使用moduleA的loadOverviewModule函数加载整体评价模块
      if (selectedRM && rmData && rmCustData) {
        loadOverviewModule(selectedRM, rmData, rmCustData);
      } else {
        mainContent.innerHTML = '<div class="section-title"><i class="fas fa-tachometer-alt"></i> 首页</div><p>数据加载错误，请检查数据是否正确。</p>';
      }
      break;
    case 'performance':
      // 清空主内容区
      mainContent.innerHTML = '';
      
      // 使用原始数据 rmData 加载 B1（收入评价）和 B2（规模评价）模块
      loadB1Module(selectedRM, rmData);
      loadB2Module(selectedRM, rmData);
      break;
    case 'income':
      // 使用原始数据 rmData 加载 C 模块
      loadCModule(selectedRM, rmData, rmCustData);
      break;
    case 'scale':
      // 使用新数据 rmCustData 加载 D 模块（规模归因）
      if (rmCustData && selectedRM) {
        loadDModule(selectedRM, rmCustData);
      } else {
        mainContent.innerHTML = '<div class="section-title"><i class="fas fa-balance-scale"></i> 规模归因</div><p>数据加载错误，请检查客户数据是否正确。</p>';
      }
      break;
    case 'customer':
      // 使用新数据 rmCustData 加载 E 模块（客户经营）
      if (rmCustData && selectedRM) {
        loadEModule(selectedRM, rmCustData);
      } else {
        mainContent.innerHTML = '<div class="section-title"><i class="fas fa-users"></i> 客户经营</div><p>数据加载错误，请检查客户数据是否正确。</p>';
      }
      break;
    case 'opportunity':
      // 新增: 加载商机预测模块
      if (rmCustData && selectedRM) {
        loadFModule(selectedRM, rmCustData);
      } else {
        mainContent.innerHTML = '<div class="section-title"><i class="fas fa-lightbulb"></i> 商机预测</div><p>数据加载错误，请检查客户数据是否正确。</p>';
      }
      break;
    default:
      mainContent.innerHTML = '<p>未知模块</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // 为导航链接添加点击事件
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const module = this.getAttribute('data-module');
      loadModule(module);
    });
  });
  
  // 添加暗色模式切换事件
  const themeToggleBtn = document.getElementById('themeToggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleDarkMode);
  }
  
  // 更新日期显示
  updateDateDisplay();

  // 加载数据
  loadData();
});

// 暗色模式切换函数
function toggleDarkMode() {
  const body = document.body;
  body.classList.toggle('light-mode');
  
  const themeIcon = document.querySelector('#themeToggle i');
  if (themeIcon) {
    if (body.classList.contains('light-mode')) {
      themeIcon.className = 'fas fa-moon';
    } else {
      themeIcon.className = 'fas fa-sun';
    }
  }
}