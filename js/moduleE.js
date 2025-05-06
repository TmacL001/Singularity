// moduleE.js - 客户经营模块

// 辅助函数：格式化百分比显示
function formatPercent(value) {
  return Number(value).toFixed(1);
}

// 辅助函数：格式化数字显示
function formatNumber(value) {
  const num = Number(value);
  if (isNaN(num)) return '0';

  if (Math.abs(num) >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  return num.toFixed(0);
}

function formatNumberYi(value) {
  const num = Number(value);
  if (isNaN(num)) return '0';

  if (Math.abs(num) >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿';
  } else if (Math.abs(num) >= 10000) {
    return (num / 10000).toFixed(2) + '万';
  }
  return num.toFixed(0);
}

// 当前视图类型（客户数 vs 金额）- 用于状态管理
let activeViewType = 'count';
let assetViewType = 'amount';

// 初始化客户层级结构视图切换
function initCustomerStructureTabs() {
  const countTab = document.getElementById('customerStructureCountTab');
  const amountTab = document.getElementById('customerStructureAmountTab');

  if (!countTab || !amountTab) return;

  countTab.addEventListener('click', function() {
    if (activeViewType !== 'count') {
      activeViewType = 'count';
      countTab.classList.add('active');
      amountTab.classList.remove('active');
      updateCustomerStructureChart();
    }
  });

  amountTab.addEventListener('click', function() {
    if (activeViewType !== 'amount') {
      activeViewType = 'amount';
      amountTab.classList.add('active');
      countTab.classList.remove('active');
      updateCustomerStructureChart();
    }
  });
}

// 根据当前选择的视图类型更新图表
function updateCustomerStructureChart() {
  const selectedRM = window.currentSelectedRM;
  const rmCustData = window.currentRmCustData;

  if (!selectedRM || !rmCustData) return;

  if (activeViewType === 'count') {
    renderCustomerStructureChart(selectedRM, rmCustData, 'count');
  } else {
    renderCustomerStructureChart(selectedRM, rmCustData, 'amount');
  }
}

// 客户层级顺序映射（用于比较）
const tierOrderMap = {
  "30mn+": 6, 
  "6-30Mn": 5, 
  "1-6Mn": 4, 
  "300K-1Mn": 3, 
  "50-300K": 2, 
  "0-50K": 1
};

// 判断客户是升级还是降级
function compareTiers(initialTier, finalTier) {
  const initialValue = tierOrderMap[initialTier] || 0;
  const finalValue = tierOrderMap[finalTier] || 0;
  
  if (finalValue > initialValue) {
    return 'upgrade';
  } else if (finalValue < initialValue) {
    return 'downgrade';
  }
  return 'same';
}

// E1: 客户数量和资产规模指标卡片
function initCustomerMetricsCards(selectedRM, rmCustData) {
  if (!selectedRM || !rmCustData || rmCustData.length === 0) {
    console.error("客户指标数据不完整");
    return;
  }

  // 获取当前RM的ID
  const rmId = selectedRM.RM_ID;
  
  // 过滤当前RM的客户数据
  const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);
  
  // 计算指标
  // 1. 管理客户总数
  const totalCustomers = selectedRM.cust_nums || 0;
  
  // 2. 新增客户数
  const newCustomers = rmCustomers.filter(cust => cust.NEW_OLD === 1).length;
  
  // 3&4. 降级和升级客户数
  let downgradedCustomers = 0;
  let upgradedCustomers = 0;
  
  rmCustomers.forEach(cust => {
    const initialTier = cust.AUM_AVG_GROUP_2;
    const finalTier = cust.AUM_AVG_GROUP;
    
    if (initialTier && finalTier && initialTier !== finalTier) {
      const change = compareTiers(initialTier, finalTier);
      if (change === 'upgrade') {
        upgradedCustomers++;
      } else if (change === 'downgrade') {
        downgradedCustomers++;
      }
    }
  });

  // 更新指标卡UI
  updateMetricCard('totalCustomersMetric', totalCustomers, '管理客户数', 'fa-users');
  updateMetricCard('newCustomersMetric', newCustomers, '新增客户数', 'fa-user-plus');
  updateMetricCard('downgradedCustomersMetric', downgradedCustomers, '降级客户数', 'fa-arrow-down');
  updateMetricCard('upgradedCustomersMetric', upgradedCustomers, '升级客户数', 'fa-arrow-up');
}

// 更新单个指标卡
function updateMetricCard(elementId, value, title, iconClass) {
  const metricElement = document.getElementById(elementId);
  if (!metricElement) return;
  
  metricElement.innerHTML = `
    <div class="metric-icon">
      <i class="fas ${iconClass}"></i>
    </div>
    <div class="metric-content">
      <h3 class="metric-title">${title}</h3>
      <div class="metric-value">${formatNumber(value)}</div>
    </div>
  `;

  // 添加动画效果
  metricElement.classList.add('metric-animated');
  setTimeout(() => metricElement.classList.remove('metric-animated'), 1000);
}

// E2: 客户层级结构（堆叠柱状图）
function renderCustomerStructureChart(selectedRM, rmCustData, viewType = 'count') {
  if (!selectedRM || !rmCustData || rmCustData.length === 0) {
    console.error("客户层级结构数据不完整");
    return;
  }

  // 获取当前RM的ID
  const rmId = selectedRM.RM_ID;
  
  // 过滤当前RM的客户数据
  const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);
  
  // 定义客户层级顺序（从高到低）
  const tierOrder = [
    "30mn+", 
    "6-30Mn", 
    "1-6Mn", 
    "300K-1Mn", 
    "50-300K", 
    "0-50K"
  ];
  
  // 初始化12个月的数据结构
  const monthlyData = Array(6).fill().map(() => {
    const tierData = {};
    tierOrder.forEach(tier => {
      tierData[tier] = {
        count: 0,
        amount: 0
      };
    });
    return tierData;
  });
  
  // 统计每月的客户层级分布
  rmCustomers.forEach(customer => {
    const customerTier = customer.AUM_AVG_GROUP;
    if (!customerTier || !tierOrder.includes(customerTier)) return;
    
    // 假设我们有12个月的数据, cust_tot_aum_1 到 cust_tot_aum_6
    for (let month = 1; month <= 6; month++) {
      const monthlyAmount = Number(customer[`cust_tot_aum_${month}`] || 0);
      
      // 更新每月的统计数据
      monthlyData[month-1][customerTier].count += 1;
      monthlyData[month-1][customerTier].amount += monthlyAmount;
    }
  });
  
  // 渲染图表
  const chart = echarts.init(document.getElementById('customerStructureChart'));
  
  // 准备系列数据
  const series = [];
  
  // 配色方案 - 使用渐变蓝色系
  const colors = [
    '#123458',  // 深色 
    '#3fa2e9',  // 明亮蓝色
    '#1f48c5',  // 深蓝色
    '#4B9CD3',  // 浅蓝色
    '#1DCD9F',  // 天蓝色
    '#A7C7E7'   // 淡蓝色
  ];
  
  // 为每个层级创建一个堆叠系列
 // 确保系列数据按照大小排序
tierOrder.forEach((tier, index) => {
  // 计算这个层级的总数值
  const totalValue = monthlyData.reduce((sum, data) => 
    sum + (viewType === 'count' ? data[tier].count : data[tier].amount), 0);
    
  series.push({
    name: tier,
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    data: monthlyData.map(data => viewType === 'count' ? data[tier].count : data[tier].amount),
    itemStyle: {
      color: colors[index % colors.length],
      borderRadius: [4, 4, 0, 0]
    },
    // 添加一个额外属性用于排序
    totalValue: totalValue
  });
});

// 按照值从大到小排序
series.sort((a, b) => b.totalValue - a.totalValue);

series.forEach(s => delete s.totalValue);
  
  // 图表配置
  const option = {
    title: {
      text: `客户层级结构 - ${viewType === 'count' ? '客户数' : '金额'}`,
      left: 'center',
      top: 10,
      textStyle: { color: '#e0e0e0', fontSize: 16 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function(params) {
        const month = params[0].axisValue;
        let total = 0;
        let tooltipContent = `${month}月客户层级分布:<br/>`;
        
        params.forEach(param => {
          const value = param.value;
          total += value;
          tooltipContent += `${param.seriesName}: ${viewType === 'count' ? 
            `${value}人` : 
            `${formatNumberYi(value)}`}<br/>`;
        });
        
        tooltipContent += `<br/>总${viewType === 'count' ? '客户数' : '金额'}: ${
          viewType === 'count' ? 
          `${total}人` : 
          `${formatNumberYi(total)}`
        }`;
        
        return tooltipContent;
      }
    },
    legend: {
      data: tierOrder,
      top: 40,
      textStyle: { color: '#e0e0e0' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '80px',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: Array(6).fill().map((_, i) => `${i+1}月`),
      axisLabel: { color: '#e0e0e0' },
      axisLine: { lineStyle: { color: '#e0e0e0' } }
    },
    yAxis: {
      type: 'value',
      name: viewType === 'count' ? '客户数量' : '金额',
      nameTextStyle: { color: '#e0e0e0' },
      axisLabel: { 
        color: '#e0e0e0',
        formatter: function(value) {
          return viewType === 'count' ? 
            `${value}` : 
            `${formatNumberYi(value)}`;
        } 
      },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { lineStyle: { color: 'rgba(224, 224, 224, 0.2)' } }
    },
    series: series,
    // 添加以下配置显示百分比
  label: {
    show: true,
    position: 'inside',
    formatter: function(params) {
      // 计算每个系列在对应月份的总和
      let monthIndex = params.dataIndex;
      let total = 0;
      series.forEach(s => {
        total += s.data[monthIndex];
      });
      
      // 计算百分比并格式化，当值过小时不显示
      const percent = (params.value / total) * 100;
      return percent >= 5 ? `${percent.toFixed(1)}%` : '';
    },
    fontSize: 10,
    color: '#fff',
    textBorderWidth: 1,
    textBorderColor: 'rgba(0,0,0,0.5)'
  },
  
    animationDuration: 1500
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
  
  // 分析客户层级结构变化并更新点评
  analyzeCustomerStructureChange(monthlyData, tierOrder, viewType);
}

// 分析客户层级结构变化
function analyzeCustomerStructureChange(monthlyData, tierOrder, viewType) {
  const analysisElement = document.getElementById('customerStructureAnalysis');
  if (!analysisElement) return;
  
  // 比较第1个月和第12个月的数据
  const firstMonth = monthlyData[0];
  const lastMonth = monthlyData[5];
  
  // 计算每个层级的占比变化
  const tierChanges = [];
  let firstMonthTotal = 0;
  let lastMonthTotal = 0;
  
  tierOrder.forEach(tier => {
    firstMonthTotal += viewType === 'count' ? firstMonth[tier].count : firstMonth[tier].amount;
    lastMonthTotal += viewType === 'count' ? lastMonth[tier].count : lastMonth[tier].amount;
  });
  
  tierOrder.forEach(tier => {
    const firstMonthValue = viewType === 'count' ? firstMonth[tier].count : firstMonth[tier].amount;
    const lastMonthValue = viewType === 'count' ? lastMonth[tier].count : lastMonth[tier].amount;
    
    const firstMonthPercent = firstMonthTotal > 0 ? (firstMonthValue / firstMonthTotal * 100) : 0;
    const lastMonthPercent = lastMonthTotal > 0 ? (lastMonthValue / lastMonthTotal * 100) : 0;
    
    tierChanges.push({
      tier: tier,
      percentChange: lastMonthPercent - firstMonthPercent,
      firstMonthPercent: firstMonthPercent,
      lastMonthPercent: lastMonthPercent,
      absoluteChange: lastMonthValue - firstMonthValue,
      growthRate: firstMonthValue > 0 ? (lastMonthValue - firstMonthValue) / firstMonthValue * 100 : 0
    });
  });
  
  // 按百分比变化排序
  tierChanges.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));
  
  // 分析显著变化
  const significantChanges = tierChanges.filter(change => Math.abs(change.percentChange) >= 1);
  
  let analysisText = '';
  
  if (significantChanges.length > 0) {
    // 获取最显著的变化
    const topChange = significantChanges[0];
    const direction = topChange.percentChange > 0 ? '上升' : '下降';
    const changeType = topChange.tier === '30mn+' || topChange.tier === '6-30Mn' ? '高价值客户' : 
                       (topChange.tier === '0-50K' || topChange.tier === '50-300K' ? '低价值客户' : '中价值客户');
    
    analysisText += `<p>在过去12个月中，<span class="highlight">${changeType}</span>占比出现了明显${direction}，
      <span class="highlight">${topChange.tier}</span>层级${viewType === 'count' ? '客户数' : '资产'}占比从
      <span class="highlight">${formatPercent(topChange.firstMonthPercent)}%</span>
      ${direction}至<span class="highlight">${formatPercent(topChange.lastMonthPercent)}%</span>，
      变化幅度<span class="highlight">${formatPercent(Math.abs(topChange.percentChange))}个百分点</span>。</p>`;
    
    // 添加第二显著的变化（如果有）
    if (significantChanges.length > 1) {
      const secondChange = significantChanges[1];
      const secondDirection = secondChange.percentChange > 0 ? '上升' : '下降';
      const secondChangeType = secondChange.tier === '30mn+' || secondChange.tier === '6-30Mn' ? '高价值客户' : 
                              (secondChange.tier === '0-50K' || secondChange.tier === '50-300K' ? '低价值客户' : '中价值客户');
      
      analysisText += `<p>同时，<span class="highlight">${secondChangeType}</span>也有明显变化，
        <span class="highlight">${secondChange.tier}</span>层级占比从
        <span class="highlight">${formatPercent(secondChange.firstMonthPercent)}%</span>
        ${secondDirection}至<span class="highlight">${formatPercent(secondChange.lastMonthPercent)}%</span>。</p>`;
    }
    
    // 判断客户结构是否优化
    const highValueTiers = ['30mn+', '6-30Mn', '1-6Mn'];
    const highValueChanges = tierChanges.filter(change => highValueTiers.includes(change.tier));
    const highValueImproving = highValueChanges.some(change => change.percentChange > 0);
    
    if (highValueImproving) {
      analysisText += `<p>整体来看，高价值客户占比呈<span class="highlight positive">增长趋势</span>，
        客户结构不断优化。建议继续加强高净值客户的开发和维护，巩固当前的良好态势。</p>`;
    } else {
      analysisText += `<p>整体来看，客户结构呈现<span class="highlight negative">下沉趋势</span>，
        高价值客户占比减少。建议加强客户培育和资产提升，重点关注价值客户的挽留和增长。</p>`;
    }
  } else {
    analysisText = `<p>在过去12个月中，客户层级结构相对稳定，各层级占比变化不明显。
      建议继续保持当前的客户经营策略，适当加强高价值客户的培育和发展。</p>`;
  }
  
  analysisElement.innerHTML = analysisText;
}

// E3: 客户资产结构（堆叠柱状图）
function initCustomerAssetStructureChart(selectedRM, rmCustData) {
  if (!selectedRM || !rmCustData || rmCustData.length === 0) {
    console.error("客户资产结构数据不完整");
    return;
  }

  // 获取当前RM的ID
  const rmId = selectedRM.RM_ID;
  
  // 过滤当前RM的客户数据
  const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);
  
  // 定义资产类型
  const assetTypes = [
    { name: '活期存款', field: 'cust_cdpt_aum_', color: '#091e2c' },
    { name: '定期存款', field: 'cust_fdpt_aum_', color: '#3fa2e9' },
    { name: '基金', field: 'cust_fund_aum_', color: '#1f48c5' },
    { name: '保险', field: 'cust_inr_aum_', color: '#4B9CD3' },
    { name: '理财', field: 'cust_wm_aum_', color: '#8FD6E1' },
    { name: '信贷', field: 'cust_crt_aum_', color: '#A7C7E7' }
  ];
  

// 初始化6个月的数据结构
const monthlyData = Array(6).fill().map(() => {
  const assetData = {};
  assetTypes.forEach(type => {
    assetData[type.name] = 0;
  });
  return assetData;
});

// 统计每月的资产结构
for (let month = 1; month <= 6; month++) {
  rmCustomers.forEach(customer => {
    assetTypes.forEach(assetType => {
      const fieldName = `${assetType.field}${month}`;
      const assetValue = Number(customer[fieldName] || 0);
      monthlyData[month-1][assetType.name] += assetValue;
    });
  });
}

// 计算每种资产类型的总值
const assetTotals = {};
assetTypes.forEach(type => {
  assetTotals[type.name] = 0;
  for (let month = 0; month < monthlyData.length; month++) {
    assetTotals[type.name] += monthlyData[month][type.name];
  }
});
  
  // 渲染图表
  const chart = echarts.init(document.getElementById('assetStructureChart'));
  
  // 准备系列数据
  const series = assetTypes
  .map(assetType => ({
    name: assetType.name,
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    data: monthlyData.map(data => data[assetType.name]),
    itemStyle: {
      color: assetType.color,
      borderRadius: [4, 4, 0, 0]
    },
    totalValue: assetTotals[assetType.name]
  }))
  .sort((a, b) => b.totalValue - a.totalValue);
  
  // 删除不需要的排序辅助属性
series.forEach(s => delete s.totalValue);

  // 图表配置
  const option = {
    title: {
      text: '客户资产结构',
      left: 'center',
      top: 10,
      textStyle: { color: '#e0e0e0', fontSize: 16 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function(params) {
        const month = params[0].axisValue;
        let total = 0;
        let tooltipContent = `${month}资产分布:<br/>`;
        
        params.forEach(param => {
          const value = param.value;
          total += value;
          const percent = total > 0 ? (value / total * 100).toFixed(1) : '0.0';
          tooltipContent += `${param.seriesName}: ${formatNumberYi(value)} (${percent}%)<br/>`;
        });
        
        tooltipContent += `<br/>总资产: ${formatNumberYi(total)}`;
        
        return tooltipContent;
      }
    },
    legend: {
      data: assetTypes.map(type => type.name),
      top: 40,
      textStyle: { color: '#e0e0e0' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '80px',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: Array(6).fill().map((_, i) => `${i+1}月`),
      axisLabel: { color: '#e0e0e0' },
      axisLine: { lineStyle: { color: '#e0e0e0' } }
    },
    yAxis: {
      type: 'value',
      name: '金额',
      nameTextStyle: { color: '#e0e0e0' },
      axisLabel: { 
        color: '#e0e0e0',
        formatter: function(value) {
          return formatNumberYi(value);
        }
      },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { lineStyle: { color: 'rgba(224, 224, 224, 0.2)' } }
    },
    series: series,
      // 添加以下配置显示百分比
  label: {
    show: true,
    position: 'inside',
    formatter: function(params) {
      // 计算每个系列在对应月份的总和
      let monthIndex = params.dataIndex;
      let total = 0;
      series.forEach(s => {
        total += s.data[monthIndex];
      });
      
      // 计算百分比并格式化，当值过小时不显示
      const percent = (params.value / total) * 100;
      return percent >= 5 ? `${percent.toFixed(1)}%` : '';
    },
    fontSize: 10,
    color: '#fff',
    textBorderWidth: 1,
    textBorderColor: 'rgba(0,0,0,0.5)'
  },
    animationDuration: 1500
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
  
  // 分析资产结构变化并更新点评
  analyzeAssetStructureChange(monthlyData, assetTypes);
}

// 分析资产结构变化
function analyzeAssetStructureChange(monthlyData, assetTypes) {
  const analysisElement = document.getElementById('assetStructureAnalysis');
  if (!analysisElement) return;
  
  // 比较第1个月和第12个月的资产结构
  const firstMonth = monthlyData[0];
  const lastMonth = monthlyData[5];
  
  // 计算各类资产的总和
  let firstMonthTotal = 0;
  let lastMonthTotal = 0;
  
  assetTypes.forEach(type => {
    firstMonthTotal += firstMonth[type.name];
    lastMonthTotal += lastMonth[type.name];
  });
  
  // 计算各类资产的占比变化
  const assetChanges = [];
  
  assetTypes.forEach(type => {
    const firstMonthValue = firstMonth[type.name];
    const lastMonthValue = lastMonth[type.name];
    
    const firstMonthPercent = firstMonthTotal > 0 ? (firstMonthValue / firstMonthTotal * 100) : 0;
    const lastMonthPercent = lastMonthTotal > 0 ? (lastMonthValue / lastMonthTotal * 100) : 0;
    
    assetChanges.push({
      type: type.name,
      percentChange: lastMonthPercent - firstMonthPercent,
      firstMonthPercent: firstMonthPercent,
      lastMonthPercent: lastMonthPercent,
      absoluteChange: lastMonthValue - firstMonthValue,
      growthRate: firstMonthValue > 0 ? (lastMonthValue - firstMonthValue) / firstMonthValue * 100 : 0
    });
  });
  
  // 按百分比变化绝对值排序
  assetChanges.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));
  
  // 计算总资产变化
  const totalGrowthRate = firstMonthTotal > 0 ? (lastMonthTotal - firstMonthTotal) / firstMonthTotal * 100 : 0;
  const totalGrowthDirection = totalGrowthRate >= 0 ? '增长' : '减少';
  
  let analysisText = '';
  
  // 分析总体情况
  analysisText += `<p>过去12个月内，客户总资产<span class="highlight">${totalGrowthDirection}</span>了
    <span class="highlight">${formatPercent(Math.abs(totalGrowthRate))}%</span>，
    从<span class="highlight">${formatNumberYi(firstMonthTotal)}</span>
    ${totalGrowthDirection}至<span class="highlight">${formatNumberYi(lastMonthTotal)}</span>。</p>`;
  
  // 分析占比变化最大的资产类型
  if (assetChanges.length > 0) {
    const topChange = assetChanges[0];
    if (Math.abs(topChange.percentChange) >= 1) {
      const direction = topChange.percentChange > 0 ? '上升' : '下降';
      
      analysisText += `<p>资产结构中，<span class="highlight">${topChange.type}</span>占比
        从<span class="highlight">${formatPercent(topChange.firstMonthPercent)}%</span>
        ${direction}至<span class="highlight">${formatPercent(topChange.lastMonthPercent)}%</span>，
        变化幅度<span class="highlight">${formatPercent(Math.abs(topChange.percentChange))}个百分点</span>，
        是变化最明显的资产类型。</p>`;
    }
  }
  
  // 分析投资类资产与存款类资产的关系变化
  const investmentTypes = ['理财', '基金', '保险'];
  const depositTypes = ['活期存款', '定期存款'];
  
  let firstMonthInvestment = 0;
  let lastMonthInvestment = 0;
  let firstMonthDeposit = 0;
  let lastMonthDeposit = 0;
  
  assetChanges.forEach(change => {
    if (investmentTypes.includes(change.type)) {
      firstMonthInvestment += firstMonth[change.type];
      lastMonthInvestment += lastMonth[change.type];
    }
    if (depositTypes.includes(change.type)) {
      firstMonthDeposit += firstMonth[change.type];
      lastMonthDeposit += lastMonth[change.type];
    }
  });
  
  const firstMonthInvPercent = firstMonthTotal > 0 ? (firstMonthInvestment / firstMonthTotal * 100) : 0;
  const lastMonthInvPercent = lastMonthTotal > 0 ? (lastMonthInvestment / lastMonthTotal * 100) : 0;
  const invPercentChange = lastMonthInvPercent - firstMonthInvPercent;
  
  if (Math.abs(invPercentChange) >= 2) {
    const direction = invPercentChange > 0 ? '上升' : '下降';
    
    analysisText += `<p>投资类资产（理财、基金、保险）总占比
      从<span class="highlight">${formatPercent(firstMonthInvPercent)}%</span>
      ${direction}至<span class="highlight">${formatPercent(lastMonthInvPercent)}%</span>，
      表明客户风险偏好${invPercentChange > 0 ? '增强' : '降低'}。</p>`;
  }
  
  // 添加建议
  if (invPercentChange > 2) {
    analysisText += `<p>建议：抓住客户风险偏好提升的机会，适度增加更多高收益投资产品的配置，
      提高客户资产收益和中间业务收入。</p>`;
  } else if (invPercentChange < -2) {
    analysisText += `<p>建议：关注客户风险偏好下降的趋势，提供更多稳健型理财产品选择，
      同时逐步引导客户重新认识适度投资的价值。</p>`;
  } else {
    analysisText += `<p>建议：维持当前的资产配置策略，根据市场情况适时调整产品结构，
      持续优化客户资产收益。</p>`;
  }
  
  analysisElement.innerHTML = analysisText;
}

// E4: 客户收入分布（帕累托分析）
function initRevenueDistributionChart(selectedRM, rmCustData) {
  if (!selectedRM || !rmCustData || rmCustData.length === 0) {
    console.error("客户收入分布数据不完整");
    return;
  }

  // 获取当前RM的ID
  const rmId = selectedRM.RM_ID;
  
  // 过滤当前RM的客户数据
  const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);
  
  // 定义收入类型
  const revenueTypes = [
    { name: '中间业务', field: 'cust_aum_rev_', color: '#091e2c' },
    { name: '存款', field: 'cust_dpt_rev_', color: '#3fa2e9' },
    { name: '信贷', field: 'cust_crt_rev_', color: '#1f48c5' },
    { name: '对公', field: 'cust_cpt_rev_', color: '#4B9CD3' }
  ];
  
  // 计算每个客户的总收入
  const customerRevenues = rmCustomers.map(customer => {
    let totalRevenue = 0;
    
    // 汇总6个月的所有收入类型
    for (let month = 1; month <= 6; month++) {
      revenueTypes.forEach(revenueType => {
        const fieldName = `${revenueType.field}${month}`;
        totalRevenue += Number(customer[fieldName] || 0);
      });
    }
    
    return {
      customerId: customer.CUST_ID,
      totalRevenue: totalRevenue
    };
  });
  
  // 按总收入从高到低排序
  customerRevenues.sort((a, b) => b.totalRevenue - a.totalRevenue);
  
  // 计算总收入
  const totalRevenue = customerRevenues.reduce((sum, item) => sum + item.totalRevenue, 0);
  
  // 计算累积百分比
  let cumulativeRevenue = 0;
  const paretoData = customerRevenues.map((item, index) => {
    cumulativeRevenue += item.totalRevenue;
    const cumulativePercent = (cumulativeRevenue / totalRevenue) * 100;
    
    return {
      rank: index + 1,
      customerPercent: ((index + 1) / customerRevenues.length) * 100,
      revenue: item.totalRevenue,
      cumulativeRevenue: cumulativeRevenue,
      cumulativePercent: cumulativePercent
    };
  });
  
  // 找到收入达到80%的客户占比点
  let eightyPercentIndex = paretoData.findIndex(item => item.cumulativePercent >= 80);
  if (eightyPercentIndex === -1) eightyPercentIndex = paretoData.length - 1;
  
  const customerPercent = paretoData[eightyPercentIndex].customerPercent;
  
  // 准备图表数据
  const xAxisData = paretoData.map(item => `Top ${Math.round(item.customerPercent)}%`);
  const barData = paretoData.map(item => item.revenue);
  const lineData = paretoData.map(item => item.cumulativePercent);
  
  // 选择合适的间隔显示X轴标签（避免过于拥挤）
  const interval = Math.ceil(paretoData.length / 10);
  
  // 渲染图表
  const chart = echarts.init(document.getElementById('revenueDistributionChart'));
  
  const option = {
    title: {
      text: '客户收入分布 (帕累托分析)',
      left: 'center',
      top: 10,
      textStyle: { color: '#e0e0e0', fontSize: 16 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: function(params) {
        const index = params[0].dataIndex;
        const data = paretoData[index];
        return `客户排名: Top ${Math.round(data.customerPercent)}%<br/>
                收入: ${formatNumberYi(data.revenue)}<br/>
                累计收入占比: ${formatPercent(data.cumulativePercent)}%`;
      }
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: '80px',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLabel: {
        color: '#e0e0e0',
        interval: function(index) {
          return index % interval === 0;
        },
        rotate: 45
      },
      axisLine: { lineStyle: { color: '#e0e0e0' } }
    },
    yAxis: [
      {
        type: 'value',
        name: '收入',
        nameTextStyle: { color: '#e0e0e0' },
        axisLabel: {
          color: '#e0e0e0',
          formatter: function(value) {
            return formatNumberYi(value);
          }
        },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { lineStyle: { color: 'rgba(224, 224, 224, 0.2)' } }
      },
      {
        type: 'value',
        name: '累计占比(%)',
        nameTextStyle: { color: '#e0e0e0' },
        min: 0,
        max: 100,
        axisLabel: { color: '#e0e0e0' },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '客户收入',
        type: 'bar',
        data: barData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#3fa2e9' },
            { offset: 1, color: '#1f48c5' }
          ])
        }
      },
      {
        name: '累计占比',
        type: 'line',
        yAxisIndex: 1,
        data: lineData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: '#FF9F43'
        },
        itemStyle: {
          color: '#FF9F43'
        },
        markLine: {
          silent: true,
          lineStyle: {
            color: '#FF4D4F',
            type: 'dashed',
            width: 2
          },
          data: [
            { yAxis: 80, name: '80%收入线' }
          ],
          label: {
            formatter: '80%收入',
            color: '#e0e0e0',
            position: 'insideEndTop'
          }
        }
      }
    ],
    animationDuration: 1500
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
  
  // 分析收入分布并更新点评
  analyzeRevenueDistribution(customerPercent, paretoData);
}

// 分析收入分布
function analyzeRevenueDistribution(customerPercent, paretoData) {
  const analysisElement = document.getElementById('revenueDistributionAnalysis');
  if (!analysisElement) return;
  
  // 找到收入达到50%、80%和90%的客户占比
  const fiftyPercentIndex = paretoData.findIndex(item => item.cumulativePercent >= 50);
  const eightyPercentIndex = paretoData.findIndex(item => item.cumulativePercent >= 80);
  const ninetyPercentIndex = paretoData.findIndex(item => item.cumulativePercent >= 90);
  
  const fiftyPercentCustomer = fiftyPercentIndex !== -1 ? paretoData[fiftyPercentIndex].customerPercent : 0;
  const eightyPercentCustomer = eightyPercentIndex !== -1 ? paretoData[eightyPercentIndex].customerPercent : 0;
  const ninetyPercentCustomer = ninetyPercentIndex !== -1 ? paretoData[ninetyPercentIndex].customerPercent : 0;
  
  let analysisText = '';
  
  // 分析帕累托分布
  analysisText += `<p>根据帕累托分析，<span class="highlight">前${formatPercent(fiftyPercentCustomer)}%的客户</span>贡献了
    <span class="highlight">50%的总收入</span>，<span class="highlight">前${formatPercent(eightyPercentCustomer)}%的客户</span>
    贡献了<span class="highlight">80%的总收入</span>，<span class="highlight">前${formatPercent(ninetyPercentCustomer)}%的客户</span>
    贡献了<span class="highlight">90%的总收入</span>。</p>`;
  
  // 判断收入集中度
  if (eightyPercentCustomer <= 20) {
    analysisText += `<p>客户收入分布<span class="highlight negative">高度集中</span>，符合典型的二八定律，
      前20%的高价值客户贡献了绝大部分收入。建议重点关注和维护这些核心客户，同时逐步开发潜在高价值客户，
      提高整体收入稳定性。</p>`;
  } else if (eightyPercentCustomer <= 30) {
    analysisText += `<p>客户收入分布<span class="highlight">较为集中</span>，
      前30%的客户贡献了主要收入。建议在维护核心客户的同时，加强中等价值客户的培育，
      逐步优化收入结构。</p>`;
  } else {
    analysisText += `<p>客户收入分布<span class="highlight positive">相对均衡</span>，
      不存在过度依赖少数客户的情况。建议持续保持当前的客户经营策略，同时识别更多增长潜力大的客户，
      提升整体收入水平。</p>`;
  }
  
  analysisElement.innerHTML = analysisText;
}

// E5: 客户收入贡献结构分析
function initRevenueStructureChart(selectedRM, rmCustData) {
  if (!selectedRM || !rmCustData || rmCustData.length === 0) {
    console.error("客户收入贡献结构数据不完整");
    return;
  }

  // 获取当前RM的ID
  const rmId = selectedRM.RM_ID;
  
  // 过滤当前RM的客户数据
  const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);
  
  // 定义收入类型
  const revenueTypes = [
    { name: '中间业务', field: 'cust_aum_rev_', color: '#091e2c' },
    { name: '存款', field: 'cust_dpt_rev_', color: '#3fa2e9' },
    { name: '信贷', field: 'cust_crt_rev_', color: '#1f48c5' },
    { name: '对公', field: 'cust_cpt_rev_', color: '#4B9CD3' }
  ];
  
  // 初始化6个月的数据结构
  const monthlyData = Array(6).fill().map(() => {
    const revenueData = {};
    revenueTypes.forEach(type => {
      revenueData[type.name] = 0;
    });
    return revenueData;
  });
  
  // 统计每月的收入结构
  for (let month = 1; month <= 6; month++) {
    rmCustomers.forEach(customer => {
      revenueTypes.forEach(revenueType => {
        const fieldName = `${revenueType.field}${month}`;
        const revenueValue = Number(customer[fieldName] || 0);
        monthlyData[month-1][revenueType.name] += revenueValue;
      });
    });
  }
  
  // 计算每月总收入
  const monthlyTotalRevenue = monthlyData.map(data => {
    return Object.values(data).reduce((sum, value) => sum + value, 0);
  });
  
  // 计算每种收入类型的总值
  const revenueTotals = {};
  revenueTypes.forEach(type => {
    revenueTotals[type.name] = 0;
    for (let month = 0; month < monthlyData.length; month++) {
      revenueTotals[type.name] += monthlyData[month][type.name];
    }
  });
  
  // 渲染图表
  const chart = echarts.init(document.getElementById('revenueStructureChart'));
  
  // 准备系列数据
  const barSeries = revenueTypes
    .map(revenueType => ({
      name: revenueType.name,
      type: 'bar',
      stack: 'total',
      emphasis: { focus: 'series' },
      data: monthlyData.map(data => data[revenueType.name]),
      itemStyle: {
        color: revenueType.color,
        borderRadius: [4, 4, 0, 0]
      },
      totalValue: revenueTotals[revenueType.name]
    }))
    .sort((a, b) => b.totalValue - a.totalValue);
  
  // 删除不需要的排序辅助属性
  barSeries.forEach(s => delete s.totalValue);
  
  // 添加总收入趋势折线图
  const lineSeries = {
    name: '总收入',
    type: 'line',
    yAxisIndex: 1,
    data: monthlyTotalRevenue,
    smooth: true,
    symbol: 'circle',
    symbolSize: 8,
    lineStyle: {
      width: 3,
      color: '#FF9F43'
    },
    itemStyle: {
      color: '#FF9F43'
    }
  };
  
  // 图表配置
  const option = {
    title: {
      text: '客户收入贡献结构',
      left: 'center',
      top: 10,
      textStyle: { color: '#e0e0e0', fontSize: 16 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: function(params) {
        const month = params[0].axisValue;
        let total = 0;
        let tooltipContent = `${month}收入分布:<br/>`;
        
        // 先处理柱状图数据
        params.forEach(param => {
          if (param.seriesType === 'bar') {
            const value = param.value;
            total += value;
            tooltipContent += `${param.seriesName}: ${formatNumberYi(value)}<br/>`;
          }
        });
        
        // 然后添加总收入数据
        params.forEach(param => {
          if (param.seriesType === 'line') {
            tooltipContent += `<br/><strong>总收入: ${formatNumberYi(param.value)}</strong>`;
          }
        });
        
        return tooltipContent;
      }
    },
    legend: {
      data: [...revenueTypes.map(type => type.name), '总收入'],
      top: 40,
      textStyle: { color: '#e0e0e0' }
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: '80px',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: Array(6).fill().map((_, i) => `${i+1}月`),
      axisLabel: { color: '#e0e0e0' },
      axisLine: { lineStyle: { color: '#e0e0e0' } }
    },
    yAxis: [
      {
        type: 'value',
        name: '收入金额',
        nameTextStyle: { color: '#e0e0e0' },
        axisLabel: {
          color: '#e0e0e0',
          formatter: function(value) {
            return formatNumberYi(value);
          }
        },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { lineStyle: { color: 'rgba(224, 224, 224, 0.2)' } }
      },
      {
        type: 'value',
        name: '总收入',
        nameTextStyle: { color: '#e0e0e0' },
        axisLabel: {
          color: '#e0e0e0',
          formatter: function(value) {
            return formatNumberYi(value);
          }
        },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      }
    ],
    series: [...barSeries, lineSeries],
    animationDuration: 1500
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
  
  // 分析收入结构变化并更新点评
  analyzeRevenueStructure(monthlyData, revenueTypes, monthlyTotalRevenue);
}

// 分析收入结构变化
function analyzeRevenueStructure(monthlyData, revenueTypes, monthlyTotalRevenue) {
  const analysisElement = document.getElementById('revenueStructureAnalysis');
  if (!analysisElement) return;
  
  // 比较第1个月和第6个月的收入结构
  const firstMonth = monthlyData[0];
  const lastMonth = monthlyData[5];
  
  // 计算各类收入的总和
  const firstMonthTotal = monthlyTotalRevenue[0];
  const lastMonthTotal = monthlyTotalRevenue[5];
  
  // 计算总收入增长率
  const revenueGrowthRate = firstMonthTotal > 0 ? ((lastMonthTotal - firstMonthTotal) / firstMonthTotal * 100) : 0;
  const growthDirection = revenueGrowthRate >= 0 ? '增长' : '下降';
  
  // 计算各类收入的占比变化
  const revenueChanges = [];
  
  revenueTypes.forEach(type => {
    const firstMonthValue = firstMonth[type.name];
    const lastMonthValue = lastMonth[type.name];
    
    const firstMonthPercent = firstMonthTotal > 0 ? (firstMonthValue / firstMonthTotal * 100) : 0;
    const lastMonthPercent = lastMonthTotal > 0 ? (lastMonthValue / lastMonthTotal * 100) : 0;
    
    revenueChanges.push({
      type: type.name,
      percentChange: lastMonthPercent - firstMonthPercent,
      firstMonthPercent: firstMonthPercent,
      lastMonthPercent: lastMonthPercent,
      absoluteChange: lastMonthValue - firstMonthValue,
      growthRate: firstMonthValue > 0 ? (lastMonthValue - firstMonthValue) / firstMonthValue * 100 : 0
    });
  });
  
  // 按百分比变化绝对值排序
  revenueChanges.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));
  
  let analysisText = '';
  
  // 分析总体趋势
  analysisText += `<p>过去6个月内，客户总收入<span class="highlight">${growthDirection}</span>
    <span class="highlight">${formatPercent(Math.abs(revenueGrowthRate))}%</span>，
    从<span class="highlight">${formatNumberYi(firstMonthTotal)}</span>
    ${growthDirection}至<span class="highlight">${formatNumberYi(lastMonthTotal)}</span>。</p>`;
  
  // 分析占比变化最大的收入来源
  if (revenueChanges.length > 0) {
    const topChange = revenueChanges[0];
    if (Math.abs(topChange.percentChange) >= 2) {
      const direction = topChange.percentChange > 0 ? '上升' : '下降';
      
      analysisText += `<p>收入结构中，<span class="highlight">${topChange.type}</span>占比
        从<span class="highlight">${formatPercent(topChange.firstMonthPercent)}%</span>
        ${direction}至<span class="highlight">${formatPercent(topChange.lastMonthPercent)}%</span>，
        变化幅度<span class="highlight">${formatPercent(Math.abs(topChange.percentChange))}个百分点</span>，
        是变化最明显的收入来源。</p>`;
    }
  }
  
  // 分析中间业务收入占比
  const middleBusinessChange = revenueChanges.find(change => change.type === '中间业务');
  
  if (middleBusinessChange && Math.abs(middleBusinessChange.percentChange) >= 2) {
    const direction = middleBusinessChange.percentChange > 0 ? '上升' : '下降';
    
    analysisText += `<p>中间业务收入占比从<span class="highlight">${formatPercent(middleBusinessChange.firstMonthPercent)}%</span>
      ${direction}至<span class="highlight">${formatPercent(middleBusinessChange.lastMonthPercent)}%</span>，`;
    
    if (middleBusinessChange.percentChange > 0) {
      analysisText += `表明非利息收入贡献提升，收入结构优化。</p>`;
    } else {
      analysisText += `表明需加强产品销售和中收项目拓展。</p>`;
    }
  }
  
  // 添加收入结构相关建议
  if (revenueGrowthRate < 0) {
    analysisText += `<p>建议：针对收入整体下降的趋势，加强客户活跃度维护，
      开展针对性营销活动提升交叉销售，重点关注高贡献客户群体。</p>`;
  } else if (middleBusinessChange && middleBusinessChange.percentChange < -5) {
    analysisText += `<p>建议：加强中间业务产品销售，提高非利息收入占比，
      优化收入结构，减轻对存贷款业务的依赖。</p>`;
  } else {
    analysisText += `<p>建议：持续维持良好的收入增长态势，优化产品结构，
      深挖客户价值，均衡发展各类收入来源。</p>`;
  }
  
  analysisElement.innerHTML = analysisText;
}


// 加载客户经营模块的主函数
function loadCustomerOperationModule(selectedRM, rmCustData) {
  // 创建模块容器
  const container = document.createElement('div');
  container.id = 'EModule';
  container.innerHTML = `
    <!-- E1. 客户数量和资产规模卡片 -->
    <div class="chart-container">
      <div class="chart-header">
        <div class="chart-title">
          <i class="fas fa-users"></i> E1.客户数量与层级变化
        </div>
      </div>
      <div class="metrics-container">
        <div id="totalCustomersMetric" class="metric-card">
          <div class="metric-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="metric-content">
            <h3 class="metric-title">管理客户数</h3>
            <div class="metric-value">0</div>
          </div>
        </div>
        <div id="newCustomersMetric" class="metric-card">
          <div class="metric-icon">
            <i class="fas fa-user-plus"></i>
          </div>
          <div class="metric-content">
            <h3 class="metric-title">新增客户数</h3>
            <div class="metric-value">0</div>
          </div>
        </div>
        <div id="downgradedCustomersMetric" class="metric-card">
          <div class="metric-icon">
            <i class="fas fa-arrow-down"></i>
          </div>
          <div class="metric-content">
            <h3 class="metric-title">降级客户数</h3>
            <div class="metric-value">0</div>
          </div>
        </div>
        <div id="upgradedCustomersMetric" class="metric-card">
          <div class="metric-icon">
            <i class="fas fa-arrow-up"></i>
          </div>
          <div class="metric-content">
            <h3 class="metric-title">升级客户数</h3>
            <div class="metric-value">0</div>
          </div>
        </div>
      </div>
    </div>

    <!-- E2. 客户层级结构 -->
    <div class="chart-container">
      <div class="chart-header">
        <div class="chart-title">
          <i class="fas fa-layer-group"></i> E2.客户层级结构
        </div>
      </div>
      <div id="customerStructureControl" style="text-align: center; margin-bottom: 15px;">
        <div class="mode-selector">
          <button id="customerStructureCountTab" class="mode-btn active" data-mode="count">客户数</button>
          <button id="customerStructureAmountTab" class="mode-btn" data-mode="amount">金额</button>
        </div>
      </div>
      <div class="chart-flex">
        <div class="chart-area">
          <div id="customerStructureChart" style="width: 100%; height: 500px;"></div>
        </div>
        <div class="chart-analysis">
          <div class="analysis-title">
            <i class="fas fa-lightbulb"></i> 智能分析
          </div>
          <div class="analysis-content" id="customerStructureAnalysis">
            <p>加载中...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- E3. 客户资产结构 -->
    <div class="chart-container">
      <div class="chart-header">
        <div class="chart-title">
          <i class="fas fa-chart-pie"></i> E3.客户资产结构
        </div>
      </div>
      <div class="chart-flex">
        <div class="chart-area">
          <div id="assetStructureChart" style="width: 100%; height: 500px;"></div>
        </div>
        <div class="chart-analysis">
          <div class="analysis-title">
            <i class="fas fa-lightbulb"></i> 智能分析
          </div>
          <div class="analysis-content" id="assetStructureAnalysis">
            <p>加载中...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- E4. 客户收入分布（帕累托） -->
<div class="chart-container">
  <div class="chart-header">
    <div class="chart-title">
      <i class="fas fa-chart-pie"></i> E4.客户收入分布
    </div>
  </div>
  <div class="chart-flex">
    <div class="chart-area">
      <div id="revenueDistributionChart" style="width: 100%; height: 500px;"></div>
    </div>
    <div class="chart-analysis">
      <div class="analysis-title">
        <i class="fas fa-lightbulb"></i> 智能分析
      </div>
      <div class="analysis-content" id="revenueDistributionAnalysis">
        <p>加载中...</p>
      </div>
    </div>
  </div>
</div>

<!-- E5. 客户收入贡献结构 -->
<div class="chart-container">
  <div class="chart-header">
    <div class="chart-title">
      <i class="fas fa-chart-line"></i> E5.客户收入贡献结构
    </div>
  </div>
  <div class="chart-flex">
    <div class="chart-area">
      <div id="revenueStructureChart" style="width: 100%; height: 500px;"></div>
    </div>
    <div class="chart-analysis">
      <div class="analysis-title">
        <i class="fas fa-lightbulb"></i> 智能分析
      </div>
      <div class="analysis-content" id="revenueStructureAnalysis">
        <p>加载中...</p>
      </div>
    </div>
  </div>
</div>

  `;

  // 添加到主内容区域
  const mainContent = document.getElementById('mainContent');
  mainContent.appendChild(container);

  // 添加特定样式
  addCustomStyles();

  // 初始化数据
  setTimeout(() => {
    try {
      // 1. 初始化客户指标卡片
      initCustomerMetricsCards(selectedRM, rmCustData);
      
      // 2. 初始化客户层级结构图表
      renderCustomerStructureChart(selectedRM, rmCustData, 'count');
      
      // 3. 初始化客户资产结构图表
      initCustomerAssetStructureChart(selectedRM, rmCustData);

      // 4. 初始化客户收入分布图表
    initRevenueDistributionChart(selectedRM, rmCustData);

    // 5. 初始化客户收入贡献结构图表
    initRevenueStructureChart(selectedRM, rmCustData);
      
      // 初始化Tab切换
      initCustomerStructureTabs();
      
      // 保存当前数据到全局变量
      window.currentSelectedRM = selectedRM;
      window.currentRmCustData = rmCustData;
    } catch (error) {
      console.error("初始化客户经营模块出错:", error);
    }
  }, 100);
}

// 添加模块特定的样式
function addCustomStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .metrics-container {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-top: 20px;
      margin-bottom: 20px;
    }

    .metric-card {
      background: linear-gradient(145deg, rgba(15, 37, 55, 0.7), rgba(15, 37, 55, 0.9));
      border-radius: 8px;
      padding: 20px;
      display: flex;
      align-items: center;
      border: 1px solid rgba(63, 162, 233, 0.2);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s, box-shadow 0.3s;
    }
    
    .metric-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      border-color: rgba(63, 162, 233, 0.5);
    }
    
    .metric-icon {
      width: 50px;
      height: 50px;
      background-color: rgba(63, 162, 233, 0.15);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      font-size: 22px;
      color: #3fa2e9;
      flex-shrink: 0;
    }
    
    .metric-content {
      flex-grow: 1;
    }
    
    .metric-title {
      color: #e0e0e0;
      font-size: 14px;
      margin: 0 0 10px 0;
      font-weight: normal;
      opacity: 0.9;
    }
    
    .metric-value {
      color: white;
      font-size: 24px;
      font-weight: bold;
      margin: 0;
    }
    
    .metric-animated {
      animation: pulse 1s;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    .mode-selector {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .mode-btn {
      padding: 6px 15px;
      border: 1px solid #4B9CD3;
      background-color: transparent;
      color: #e0e0e0;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 14px;
      min-width: 100px;
    }
    
    .mode-btn.active {
      background-color: #4B9CD3;
      color: white;
      font-weight: bold;
    }
    
    .mode-btn:hover:not(.active) {
      background-color: rgba(75, 156, 211, 0.2);
    }
    
    .highlight {
      color: #3fa2e9;
      font-weight: bold;
    }
    
    .positive {
      color: #52c41a;
    }
    
    .negative {
      color: #ff4d4f;
    }
    
    @media (max-width: 1200px) {
      .metrics-container {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 768px) {
      .metrics-container {
        grid-template-columns: 1fr;
      }
    }
  `;
  
  document.head.appendChild(styleElement);
}

// 模块的导出函数
export function loadEModule(selectedRM, rmCustData) {
  // 清空主内容区
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = '';

  // 添加模块标题
  const titleContainer = document.createElement('div');
  titleContainer.className = 'section-title animate-fade';
  titleContainer.innerHTML = `
    <i class="fas fa-users"></i> 客户经营
  `;
  mainContent.appendChild(titleContainer);

  // 加载客户经营模块
  loadCustomerOperationModule(selectedRM, rmCustData);
}