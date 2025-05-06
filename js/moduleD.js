// moduleD.js - 规模归因模块

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
return num.toFixed(2);
}

function formatNumberYi(value) {
  const num = Number(value);
  if (isNaN(num)) return '0';

  if (Math.abs(num) >= 10000) {
    return (num / 100000000).toFixed(1) + '亿';
  }

  return num.toFixed(2);
}

// 当前活动视图类型（默认为AUM金额视图）
let activeViewType = 'aum';

// 初始化Tab切换
function initTabs() {
const aumTab = document.getElementById('aumTab');
const customerTab = document.getElementById('customerTab');

aumTab.addEventListener('click', function() {
  if (activeViewType !== 'aum') {
    activeViewType = 'aum';
    aumTab.classList.add('active');
    customerTab.classList.remove('active');
    updateWaterfallChartByActiveTab();
  }
});

customerTab.addEventListener('click', function() {
  if (activeViewType !== 'customer') {
    activeViewType = 'customer';
    customerTab.classList.add('active');
    aumTab.classList.remove('active');
    updateWaterfallChartByActiveTab();
  }
});
}

// 根据当前活动Tab更新图表
function updateWaterfallChartByActiveTab() {
const selectedRM = window.currentSelectedRM;
const rmCustData = window.currentRmCustData;

if (activeViewType === 'aum') {
  initAumChangeWaterfallChart(selectedRM, rmCustData);
} else {
  initCustomerCountWaterfallChart(selectedRM, rmCustData);
}
}

// D1: 客户数分布 & AUM分布（双柱状图）
function initCustomerDistributionCharts(selectedRM, rmCustData) {
  if (!selectedRM || !rmCustData || rmCustData.length === 0) {
    console.error("客户数分布 & AUM分布数据不完整");
    return;
  }

  // 获取当前选中RM的ID和所属组
  const rmId = selectedRM.RM_ID;
  const rmGroup = selectedRM.cust_aum_scale_group || "未分组";

  // 筛选数据：当前RM的客户 & 同组RM的客户
  const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);
  const groupCustomers = rmCustData.filter(cust => cust.cust_aum_scale_group === rmGroup);

  console.log(`已找到${rmCustomers.length}位客户属于RM: ${rmId}`);
  console.log(`已找到${groupCustomers.length}位客户属于同组: ${rmGroup}`);

  // 获取存在的客户层级
  const uniqueTiers = [...new Set(rmCustData.map(cust => cust.AUM_AVG_GROUP))].filter(Boolean);
  console.log("发现的客户层级:", uniqueTiers);
  
  // 定义客户层级顺序（从高到低）
  const tierOrder = [
    "30mn+", 
    "6-30Mn", 
    "1-6Mn", 
    "300K-1Mn", 
    "50-300K", 
    "0-50K"
  ].filter(tier => uniqueTiers.includes(tier));
  
  // 如果没有找到任何预定义的层级，则使用数据中的唯一层级（按字母顺序）
  if (tierOrder.length === 0) {
    tierOrder.push(...uniqueTiers.sort());
  }

  console.log("使用的客户层级顺序:", tierOrder);

  // 初始化数据结构
  const distributionData = {
    rm: initTierData(tierOrder),
    group: initTierData(tierOrder)
  };
  
  // 统计当前RM的客户分布
  let rmTotalCustomers = 0;
  let rmTotalAum = 0;
  
  rmCustomers.forEach(cust => {
    const tier = cust.AUM_AVG_GROUP;
    if (tier && tierOrder.includes(tier)) {
      // 客户数统计
      distributionData.rm.count[tier]++;
      rmTotalCustomers++;
      
      // AUM值统计
      const aumValue = Number(cust.CUST_AVG_AUM || 0);
      distributionData.rm.aum[tier] += aumValue;
      rmTotalAum += aumValue;
    }
  });
  
  // 统计同组RM的客户分布
  let groupTotalCustomers = 0;
  let groupTotalAum = 0;
  
  groupCustomers.forEach(cust => {
    const tier = cust.AUM_AVG_GROUP;
    if (tier && tierOrder.includes(tier)) {
      // 客户数统计
      distributionData.group.count[tier]++;
      groupTotalCustomers++;
      
      // AUM值统计
      const aumValue = Number(cust.CUST_AVG_AUM || 0);
      distributionData.group.aum[tier] += aumValue;
      groupTotalAum += aumValue;
    }
  });
  
  // 计算占比
  tierOrder.forEach(tier => {
    // RM客户数占比
    distributionData.rm.countPercent[tier] = rmTotalCustomers > 0 
      ? (distributionData.rm.count[tier] / rmTotalCustomers * 100) 
      : 0;
    
    // RM AUM占比
    distributionData.rm.aumPercent[tier] = rmTotalAum > 0 
      ? (distributionData.rm.aum[tier] / rmTotalAum * 100) 
      : 0;
    
    // 同组客户数占比
    distributionData.group.countPercent[tier] = groupTotalCustomers > 0 
      ? (distributionData.group.count[tier] / groupTotalCustomers * 100) 
      : 0;
    
    // 同组AUM占比
    distributionData.group.aumPercent[tier] = groupTotalAum > 0 
      ? (distributionData.group.aum[tier] / groupTotalAum * 100) 
      : 0;
  });

  // 初始化两个图表-左边客户数占比图表和右边AUM占比图表
  initCustomerCountDistributionChart(distributionData, tierOrder, rmId, rmGroup);
  initAumDistributionChart(distributionData, tierOrder, rmId, rmGroup);
  
  // 更新分析内容
  updateCustomerDistributionAnalysis(distributionData, tierOrder, rmId, rmGroup, rmTotalCustomers, rmTotalAum);

  return distributionData;
}
// D1: 初始化层级数据结构
function initTierData(tierOrder) {
  const data = {
    count: {},
    countPercent: {},
    aum: {},
    aumPercent: {}
  };
  
  tierOrder.forEach(tier => {
    data.count[tier] = 0;
    data.countPercent[tier] = 0;
    data.aum[tier] = 0;
    data.aumPercent[tier] = 0;
  });
  
  return data;
}

// D1: 初始化客户数占比图表
function initCustomerCountDistributionChart(data, tierOrder, rmId, rmGroup) {
  const chart = echarts.init(document.getElementById('customerCountDistributionChart'));

  const rmData = tierOrder.map(tier => data.rm.countPercent[tier]);
  const groupData = tierOrder.map(tier => data.group.countPercent[tier]);

  // 对数据进行调整，使得蓝色和红色条形图分别位于左右两侧
  // 将同组平均值取反，这样可以向左显示
  const adjustedGroupData = groupData.map(val => -val);

  const option = {
    title: {
      text: '客户数占比分布',
      left: 'center',
      top: 0,
      textStyle: { color: '#e0e0e0', fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        // 确保显示正确的值（取反后的需要再次取反）
        const groupValue = params.length > 1 ? Math.abs(params[1].value) : 0;
        return `${params[0].name}层级客户数占比:<br/>
                ${rmId}: ${formatPercent(params[0].value)}%<br/>
                ${rmGroup}组平均: ${formatPercent(groupValue)}%`;
      },
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: [`${rmId}`, `${rmGroup}组平均`],
      textStyle: { color: '#e0e0e0' },
      top: 25,
      itemGap: 30 // 增加图例项之间的间距
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '8%',
      top: '80px', // 增加顶部间距，为图例腾出更多空间
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '占比 (%)',
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        color: '#e0e0e0',
        formatter: function(value) {
          // 显示绝对值，不显示负号
          return Math.abs(value) + '%';
        }
      },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: tierOrder,
      name: '客户层级',
      nameLocation: 'end',
      nameGap: 15,
      axisLabel: { color: '#e0e0e0' },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    series: [
      {
        name: `${rmId}`,
        type: 'bar',
        data: rmData,
        barWidth: '60%',
        itemStyle: { 
          color: '#3fa2e9' // 使用指定的蓝色
        },
        label: {
          show: true,
          formatter: function(params) {
            // 取绝对值并保留一位小数
            return Math.abs(params.value).toFixed(1) + '%';
          },
          position: 'right',
          color: '#e0e0e0'
        }
      },
      {
        name: `${rmGroup}组平均`,
        type: 'bar',
        data: adjustedGroupData,
        barWidth: '60%',
        itemStyle: { 
          color: '#FF7043' // 橙色
        },
        label: {
          show: true,
          formatter: function(params) {
            // 取绝对值并保留一位小数
            return Math.abs(params.value).toFixed(1) + '%';
          },
          position: 'left',
          color: '#e0e0e0'
        }
      }
    ],
    animationDuration: 1500
  };

  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
}

// D1: 初始化客户AUM占比图表
function initAumDistributionChart(data, tierOrder, rmId, rmGroup) {
  const chart = echarts.init(document.getElementById('aumDistributionChart'));
  
  const rmData = tierOrder.map(tier => data.rm.aumPercent[tier]);
  const groupData = tierOrder.map(tier => data.group.aumPercent[tier]);
  
  // 对数据进行调整，使得蓝色和红色条形图分别位于左右两侧
  // 将同组平均值取反，这样可以向左显示
  const adjustedGroupData = groupData.map(val => -val);
  
  const option = {
    title: {
      text: 'AUM占比分布',
      left: 'center',
      top: 0,
      textStyle: { color: '#e0e0e0', fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        // 确保显示正确的值（取反后的需要再次取反）
        const groupValue = params.length > 1 ? Math.abs(params[1].value) : 0;
        return `${params[0].name}层级AUM占比:<br/>
                ${rmId}: ${formatPercent(params[0].value)}%<br/>
                ${rmGroup}组平均: ${formatPercent(groupValue)}%`;
      },
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: [`${rmId}`, `${rmGroup}组平均`],
      textStyle: { color: '#e0e0e0' },
      top: 25,
      itemGap: 30 // 增加图例项之间的间距
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '8%',
      top: '80px', // 增加顶部间距，为图例腾出更多空间
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '占比 (%)',
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        color: '#e0e0e0',
        formatter: function(value) {
          // 显示绝对值，不显示负号
          return Math.abs(value) + '%';
        }
      },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: tierOrder,
      name: '客户层级',
      nameLocation: 'end',
      nameGap: 15,
      axisLabel: { color: '#e0e0e0' },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    series: [
      {
        name: `${rmId}`,
        type: 'bar',
        data: rmData,
        barWidth: '60%',
        itemStyle: { 
          color: '#3fa2e9' // 使用指定的蓝色
        },
        label: {
          show: true,
          formatter: function(params) {
            // 取绝对值并保留一位小数
            return Math.abs(params.value).toFixed(1) + '%';
          },
          position: 'right',
          color: '#e0e0e0'
        }
      },
      {
        name: `${rmGroup}组平均`,
        type: 'bar',
        data: adjustedGroupData,
        barWidth: '60%',
        itemStyle: { 
          color: '#FF7043' // 橙色
        },
        label: {
          show: true,
          formatter: function(params) {
            // 取绝对值并保留一位小数
            return Math.abs(params.value).toFixed(1) + '%';
          },
          position: 'left',
          color: '#e0e0e0'
        }
      }
    ],
    animationDuration: 1500
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
}

// D1: 客户分布分析-点评分析
function updateCustomerDistributionAnalysis(data, tierOrder, rmId, rmGroup, totalCustomers, totalAum) {
  const analysisElem = document.getElementById('customerDistributionAnalysis');
  if (!analysisElem) return;
  
  // 找出RM客户数最多的层级
  let maxCountTier = tierOrder[0];
  tierOrder.forEach(tier => {
    if (data.rm.countPercent[tier] > data.rm.countPercent[maxCountTier]) {
      maxCountTier = tier;
    }
  });

  // 找出RM AUM最高的层级
  let maxAumTier = tierOrder[0];
  tierOrder.forEach(tier => {
    if (data.rm.aumPercent[tier] > data.rm.aumPercent[maxAumTier]) {
      maxAumTier = tier;
    }
  });
  
  // 计算RM与同组的客户层级差异
  const tierDiffs = {};
  let maxCountDiffTier = tierOrder[0];
  let maxCountDiffValue = 0;
  
  tierOrder.forEach(tier => {
    const countDiff = data.rm.countPercent[tier] - data.group.countPercent[tier];
    tierDiffs[tier] = countDiff;
    
    if (Math.abs(countDiff) > Math.abs(maxCountDiffValue)) {
      maxCountDiffTier = tier;
      maxCountDiffValue = countDiff;
    }
  });
  
  // 分析AUM与客户数的匹配度
  const aumCustomerRatio = {};
  let bestMatchTier = '';
  let worstMatchTier = '';
  let bestMatchDiff = Infinity;
  let worstMatchDiff = -Infinity;
  
  tierOrder.forEach(tier => {
    const diff = data.rm.aumPercent[tier] - data.rm.countPercent[tier];
    aumCustomerRatio[tier] = diff;
    
    if (Math.abs(diff) < Math.abs(bestMatchDiff)) {
      bestMatchTier = tier;
      bestMatchDiff = diff;
    }
    
    if (Math.abs(diff) > Math.abs(worstMatchDiff)) {
      worstMatchTier = tier;
      worstMatchDiff = diff;
    }
  });
  
  let matchAnalysis = '';
  if (worstMatchDiff > 0) {
    matchAnalysis = `<span class="highlight">${worstMatchTier}</span>层级的AUM贡献显著高于其客户数占比，表明该层级客户资产质量较高`;
  } else {
    matchAnalysis = `<span class="highlight">${worstMatchTier}</span>层级的客户数占比显著高于其AUM贡献，表明该层级客户资产质量有提升空间`;
  }
  
  // 分析客户数差异
  let countDiffAnalysis = '';
  if (maxCountDiffValue > 0) {
    countDiffAnalysis = `相比同组平均水平，<span class="highlight">${maxCountDiffTier}</span>层级客户占比<span class="highlight">高出${formatPercent(maxCountDiffValue)}%</span>`;
  } else {
    countDiffAnalysis = `相比同组平均水平，<span class="highlight">${maxCountDiffTier}</span>层级客户占比<span class="highlight">低${formatPercent(Math.abs(maxCountDiffValue))}%</span>`;
  }
  
  // 制定优化策略建议
  let strategyRecommendation = '';
  
  // 根据资产质量和客户分布情况制定建议
  if (worstMatchDiff < 0 && tierOrder.indexOf(worstMatchTier) < 3) {
    // 如果高层级客户资产质量不佳
    strategyRecommendation = `提升<span class="highlight">${worstMatchTier}</span>层级客户的资产质量，增加高净值客户的资产配置深度`;
  } else if (worstMatchDiff > 0 && tierOrder.indexOf(worstMatchTier) >= 3) {
    // 如果低层级客户中有高质量资产
    strategyRecommendation = `挖掘<span class="highlight">${worstMatchTier}</span>层级中的优质客户，推动其向更高层级跃迁`;
  } else if (maxCountDiffValue < 0 && tierOrder.indexOf(maxCountDiffTier) < 2) {
    // 如果高层级客户占比低于平均
    strategyRecommendation = `增加<span class="highlight">${maxCountDiffTier}</span>层级的客户拓展力度，提升高净值客户覆盖率`;
  } else {
    strategyRecommendation = `优化客户结构，重点发展<span class="highlight">${maxAumTier}</span>层级客户，提升整体AUM贡献`;
  }

  // 生成分析文本
  analysisElem.innerHTML = `
    <p>理财经理<span class="highlight">${rmId}</span>共管理<span class="highlight">${totalCustomers}</span>位客户，
       客户主要集中在<span class="highlight">${maxCountTier}</span>层级，占比<span class="highlight">${formatPercent(data.rm.countPercent[maxCountTier])}%</span>。</p>
    <p>AUM贡献主要来源于<span class="highlight">${maxAumTier}</span>层级客户，贡献了<span class="highlight">${formatPercent(data.rm.aumPercent[maxAumTier])}%</span>的资产规模。</p>
    <p>${countDiffAnalysis}，${matchAnalysis}。</p>
    <p>建议：${strategyRecommendation}。</p>
  `;
}


// D3: RM客户结构变化分析（四个并排柱状图）
function initCustomerStructureChangeCharts(selectedRM, rmCustData) {
  if (!selectedRM || !rmCustData || rmCustData.length === 0) {
    console.error("RM客户结构变化分析数据不完整");
    return;
  }

  // 获取当前选中RM的ID
  const rmId = selectedRM.RM_ID;

  // 筛选当前RM的客户
  const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);

  console.log(`已找到${rmCustomers.length}位客户属于RM: ${rmId}`);

  // 获取存在的客户期初层级
  const uniqueInitialTiers = [...new Set(rmCustomers.map(cust => cust.AUM_AVG_GROUP_2))].filter(Boolean);
  console.log("发现的客户期初层级:", uniqueInitialTiers);
  
  // 定义客户层级顺序（从高到低）
  const tierOrder = [
    "30mn+", 
    "6-30Mn", 
    "1-6Mn", 
    "300K-1Mn", 
    "50-300K", 
    "0-50K"
  ].filter(tier => uniqueInitialTiers.includes(tier));
  
  // 如果没有找到任何预定义的层级，则使用数据中的唯一层级（按字母顺序）
  if (tierOrder.length === 0) {
    tierOrder.push(...uniqueInitialTiers.sort());
  }

  console.log("使用的客户层级顺序:", tierOrder);
  // 调整客户层级顺序（从高到低）
  const orderMap = {
  "30mn+": 5, 
  "6-30Mn": 4, 
  "1-6Mn": 3, 
  "300K-1Mn": 2, 
  "50-300K": 1, 
  "0-50K": 0
  };
// 根据预定义的顺序对层级进行排序
  tierOrder.sort((a, b) => {
  // 如果两个层级都在映射中，按映射顺序排序
  if (orderMap[a] !== undefined && orderMap[b] !== undefined) {
    return orderMap[a] - orderMap[b];
  }
  // 否则保持原来的顺序
  return 0;
});

console.log("调整后的客户层级顺序:", tierOrder);


  // 初始化分析数据结构
  const structureChangeData = initTierStructureData(tierOrder);
  
  // 分析每个层级的客户变化
  tierOrder.forEach(tier => {
    // 获取该层级的所有客户
    const tierCustomers = rmCustomers.filter(cust => cust.AUM_AVG_GROUP_2 === tier);
    const totalTierCustomers = tierCustomers.length;
    
    if (totalTierCustomers === 0) return;
    
    // 统计降级和升级的客户
    const downgradedCustomers = tierCustomers.filter(cust => cust.CUST_AUM_STATUS_QUO_AVG === '降级流失');
    const upgradedCustomers = tierCustomers.filter(cust => cust.CUST_AUM_STATUS_QUO_AVG === '升级而来');
    
    // 计算降级率和升级率
    structureChangeData.downgradeRate[tier] = downgradedCustomers.length / totalTierCustomers * 100;
    structureChangeData.upgradeRate[tier] = upgradedCustomers.length / totalTierCustomers * 100;
    
    // 计算降级导致的AUM损失
    structureChangeData.downgradeLoss[tier] = downgradedCustomers.reduce((sum, cust) => {
      const change = Number(cust.CUST_AVG_AUM || 0) - Number(cust.CUST_AVG_AUM_2 || 0);
      return sum + (change < 0 ? change : 0); // 只计算负向变化
    }, 0);
    
    // 计算升级带来的AUM增长
    structureChangeData.upgradeGain[tier] = upgradedCustomers.reduce((sum, cust) => {
      const change = Number(cust.CUST_AVG_AUM || 0) - Number(cust.CUST_AVG_AUM_2 || 0);
      return sum + (change > 0 ? change : 0); // 只计算正向变化
    }, 0);
    
    // 客户数量统计
    structureChangeData.customerCounts[tier] = {
      total: totalTierCustomers,
      downgraded: downgradedCustomers.length,
      upgraded: upgradedCustomers.length
    };
  });

  console.log("客户结构变化分析数据:", structureChangeData);
  
  // 初始化四个图表
  initDowngradeRateChart(structureChangeData, tierOrder, rmId);
  initUpgradeRateChart(structureChangeData, tierOrder, rmId);
  initDowngradeLossChart(structureChangeData, tierOrder, rmId);
  initUpgradeGainChart(structureChangeData, tierOrder, rmId);
  
  // 更新分析内容
  updateCustomerStructureChangeAnalysis(structureChangeData, tierOrder, rmId);
  
  return structureChangeData;
}

// D3: 初始化层级结构变化数据
function initTierStructureData(tierOrder) {
  const data = {
    downgradeRate: {},
    upgradeRate: {},
    downgradeLoss: {},
    upgradeGain: {},
    customerCounts: {}
  };
  
  tierOrder.forEach(tier => {
    data.downgradeRate[tier] = 0;
    data.upgradeRate[tier] = 0;
    data.downgradeLoss[tier] = 0;
    data.upgradeGain[tier] = 0;
    data.customerCounts[tier] = {
      total: 0,
      downgraded: 0,
      upgraded: 0
    };
  });
  
  return data;
}
// D3: 初始化客层降级率图表-1（水平柱状图）
function initDowngradeRateChart(data, tierOrder, rmId) {
  const chart = echarts.init(document.getElementById('downgradeRateChart'));
  
  const values = tierOrder.map(tier => data.downgradeRate[tier]);
  
  const option = {
    title: {
      text: '客层降级率',
      left: 'center',
      top: 0,
      textStyle: { color: '#e0e0e0', fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        return `${params[0].name}层级<br/>
                降级率: ${formatPercent(params[0].value)}%<br/>
                降级客户: ${data.customerCounts[params[0].name].downgraded}人<br/>
                总客户: ${data.customerCounts[params[0].name].total}人`;
      },
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '5%',
      right: '15%',
      bottom: '15%',
      top: '60px',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '降级率（%）',
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: { color: '#e0e0e0', fontSize: 10 , show: false },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: tierOrder,
      name: '客户层级',
      nameLocation: 'end',
      nameGap: 15,
      axisLabel: { color: '#e0e0e0'},
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    series: [
      {
        type: 'bar',
        data: values,
        barWidth: '60%',
        itemStyle: { 
          color: '#FF7043' // 降级用红色
        },
        label: {
          show: true,
          formatter: function(params) {
            return formatPercent(params.value) + '%';
          },
          position: 'right',
          color: '#ffffff'
          ,fontSize: 12
        }
      }
    ],
    animationDuration: 1500
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
}

// D3: 初始化客层升级率图表-2（水平柱状图）
function initUpgradeRateChart(data, tierOrder, rmId) {
  const chart = echarts.init(document.getElementById('upgradeRateChart'));
  
  const values = tierOrder.map(tier => data.upgradeRate[tier]);
  
  const option = {
    title: {
      text: '客层升级率',
      left: 'center',
      top: 0,
      textStyle: { color: '#e0e0e0', fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        return `${params[0].name}层级<br/>
                升级率: ${formatPercent(params[0].value)}%<br/>
                升级客户: ${data.customerCounts[params[0].name].upgraded}人<br/>
                总客户: ${data.customerCounts[params[0].name].total}人`;
      },
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '5%',
      right: '15%',
      bottom: '15%',
      top: '60px',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '升级率 (%)',
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: { color: '#e0e0e0', show: false},
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: tierOrder,
      name: '',
      nameLocation: 'end',
      nameGap: 15,
      axisLabel: { color: '#e0e0e0', show: false },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    series: [
      {
        type: 'bar',
        data: values,
        barWidth: '60%',
        itemStyle: { 
          color: ' #3fa2e9' // 
        },
        label: {
          show: true,
          formatter: function(params) {
            return formatPercent(params.value) + '%';
          },
          position: 'right',
          color: '#ffffff'
        }
      }
    ],
    animationDuration: 1500
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
}

// D3: 初始化降级导致的AUM损失图表-3（水平柱状图）
function initDowngradeLossChart(data, tierOrder, rmId) {
  const chart = echarts.init(document.getElementById('downgradeLossChart'));
  
  // 取绝对值，因为损失是负值，但图表显示为正值
  const values = tierOrder.map(tier => Math.abs(data.downgradeLoss[tier]));
  
  const option = {
    title: {
      text: '降级导致的AUM损失',
      left: 'center',
      top: 0,
      textStyle: { color: '#e0e0e0', fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        return `${params[0].name}层级<br/>
                AUM损失: ${formatNumber(params[0].value)}<br/>
                降级客户: ${data.customerCounts[params[0].name].downgraded}人`;
      },
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '5%',
      right: '15%',
      bottom: '15%',
      top: '60px',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: 'AUM流失(亿元)',
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        color: '#e0e0e0',
        show: false
        },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: tierOrder,
      name: '',
      nameLocation: 'end',
      nameGap: 15,
      axisLabel: { color: '#e0e0e0' ,show: false},
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    series: [
      {
        type: 'bar',
        data: values,
        barWidth: '60%',
        itemStyle: { 
          color: '#FF7043' 
        },
        label: {
          show: true,
          formatter: function(params) {
            return formatNumberYi(params.value);
          },
          position: 'right',
          color: '#ffffff'
        }
      }
    ],
    animationDuration: 1500
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
}

// D3: 初始化升级带来的AUM增长图表-4（水平柱状图）
function initUpgradeGainChart(data, tierOrder, rmId) {
  const chart = echarts.init(document.getElementById('upgradeGainChart'));
  
  const values = tierOrder.map(tier => data.upgradeGain[tier]);
  
  const option = {
    title: {
      text: '升级带来的AUM增长',
      left: 'center',
      top: 0,
      textStyle: { color: '#e0e0e0', fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        return `${params[0].name}层级<br/>
                AUM增长: ${formatNumber(params[0].value)}<br/>
                升级客户: ${data.customerCounts[params[0].name].upgraded}人`;
      },
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '5%',
      right: '20%',
      bottom: '15%',
      top: '60px',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: 'AUM增长(亿元)',
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        color: '#e0e0e0',
        show: false
      },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: tierOrder,
      name: '',
      nameLocation: 'end',
      nameGap: 15,
      axisLabel: { color: '#e0e0e0',show: false },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    series: [
      {
        type: 'bar',
        data: values,
        barWidth: '60%',
        itemStyle: { 
          color: '#3fa2e9' // 增长用蓝色
        },
        label: {
          show: true,
          formatter: function(params) {
            return formatNumberYi(params.value);
          },
          position: 'right',
          color: '#ffffff'
        }
      }
    ],
    animationDuration: 1500
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
}

// D3: 客户结构变化分析-点评分析
function updateCustomerStructureChangeAnalysis(data, tierOrder, rmId) {
  const analysisElem = document.getElementById('customerStructureChangeAnalysis');
  if (!analysisElem) return;
  
  // 分析每个层级的升降级情况
  let totalCustomers = 0;
  let totalDowngraded = 0;
  let totalUpgraded = 0;
  let totalDowngradeLoss = 0;
  let totalUpgradeGain = 0;
  
  tierOrder.forEach(tier => {
    totalCustomers += data.customerCounts[tier].total;
    totalDowngraded += data.customerCounts[tier].downgraded;
    totalUpgraded += data.customerCounts[tier].upgraded;
    totalDowngradeLoss += Math.abs(data.downgradeLoss[tier]);
    totalUpgradeGain += data.upgradeGain[tier];
  });
  
  // 找出降级率最高和最低的层级
  let highestDowngradeTier = tierOrder[0];
  let lowestDowngradeTier = tierOrder[0];
  
  tierOrder.forEach(tier => {
    if (data.downgradeRate[tier] > data.downgradeRate[highestDowngradeTier]) {
      highestDowngradeTier = tier;
    }
    if (data.downgradeRate[tier] < data.downgradeRate[lowestDowngradeTier]) {
      lowestDowngradeTier = tier;
    }
  });
  
  // 找出升级率最高和最低的层级
  let highestUpgradeTier = tierOrder[0];
  let lowestUpgradeTier = tierOrder[0];
  
  tierOrder.forEach(tier => {
    if (data.upgradeRate[tier] > data.upgradeRate[highestUpgradeTier]) {
      highestUpgradeTier = tier;
    }
    if (data.upgradeRate[tier] < data.upgradeRate[lowestUpgradeTier]) {
      lowestUpgradeTier = tier;
    }
  });
  
  // 找出AUM损失最严重的层级
  let highestLossTier = tierOrder[0];
  tierOrder.forEach(tier => {
    if (Math.abs(data.downgradeLoss[tier]) > Math.abs(data.downgradeLoss[highestLossTier])) {
      highestLossTier = tier;
    }
  });
  
  // 找出AUM增长最显著的层级
  let highestGainTier = tierOrder[0];
  tierOrder.forEach(tier => {
    if (data.upgradeGain[tier] > data.upgradeGain[highestGainTier]) {
      highestGainTier = tier;
    }
  });
  
  // 计算整体升降级对比
  const totalDowngradeRate = (totalDowngraded / totalCustomers * 100).toFixed(1);
  const totalUpgradeRate = (totalUpgraded / totalCustomers * 100).toFixed(1);
  const netAumChange = totalUpgradeGain - totalDowngradeLoss;
  
  // 生成分析文本
  let analysisText = `
    <p>理财经理<span class="highlight">${rmId}</span>的客户结构分析显示，整体客户降级率为<span class="highlight">${totalDowngradeRate}%</span>，
    升级率为<span class="highlight">${totalUpgradeRate}%</span>。</p>
  `;
  
  // 分析降级情况
  analysisText += `
    <p><span class="highlight">${highestDowngradeTier}</span>层级客户降级率最高，达到<span class="highlight">${formatPercent(data.downgradeRate[highestDowngradeTier])}%</span>，
    造成AUM损失<span class="highlight">${formatNumber(Math.abs(data.downgradeLoss[highestDowngradeTier]))}</span>。</p>
  `;
  
  // 分析升级情况
  analysisText += `
    <p><span class="highlight">${highestUpgradeTier}</span>层级客户升级率最高，达到<span class="highlight">${formatPercent(data.upgradeRate[highestUpgradeTier])}%</span>，
    带来AUM增长<span class="highlight">${formatNumber(data.upgradeGain[highestUpgradeTier])}</span>。</p>
  `;
  
  // 分析净影响
  if (netAumChange > 0) {
    analysisText += `
      <p>客户结构变化为资产规模带来<span class="highlight">净增长${formatNumber(netAumChange)}</span>，
      主要贡献来自<span class="highlight">${highestGainTier}</span>层级客户的升级。</p>
    `;
  } else {
    analysisText += `
      <p>客户结构变化为资产规模带来<span class="highlight">净损失${formatNumber(Math.abs(netAumChange))}</span>，
      主要损失来自<span class="highlight">${highestLossTier}</span>层级客户的降级。</p>
    `;
  }
  
  // 提供建议
  let recommendation = '';
  
  if (totalDowngradeRate > totalUpgradeRate) {
    recommendation = `
      <p>建议：重点关注<span class="highlight">${highestDowngradeTier}</span>层级的客户稳定性，制定针对性的客户维护策略，
      减少客户降级流失；同时加强<span class="highlight">${highestUpgradeTier}</span>层级的客户发展，复制成功经验。</p>
    `;
  } else if (totalUpgradeRate > totalDowngradeRate) {
    recommendation = `
      <p>建议：继续发挥<span class="highlight">${highestUpgradeTier}</span>层级客户升级的优势，同时关注<span class="highlight">${highestLossTier}</span>层级
      客户降级导致的资产流失，平衡客户结构发展。</p>
    `;
  } else {
    recommendation = `
      <p>建议：优化客户分层经营策略，重点提升<span class="highlight">${lowestUpgradeTier}</span>层级的客户服务质量，
      并加强<span class="highlight">${highestDowngradeTier}</span>层级客户的稳定性管理。</p>
    `;
  }
  
  analysisText += recommendation;
  
  // 设置分析内容
  analysisElem.innerHTML = analysisText;
}



// D2: AUM金额变化分析 - Waterfall图
function initAumChangeWaterfallChart(selectedRM, rmCustData) {
  if (!selectedRM || !rmCustData || rmCustData.length === 0) {
    console.error("AUM变化原因分析数据不完整");
    return;
  }

  // 获取当前选中RM的ID
  const rmId = selectedRM.RM_ID;

  // 筛选当前RM的客户
  const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);

  // 计算期初总AUM
  const initialTotalAum = rmCustomers.reduce((sum, cust) => sum + Number(cust.CUST_AVG_AUM_2 || 0), 0);

  // 计算期末总AUM
  const finalTotalAum = rmCustomers.reduce((sum, cust) => sum + Number(cust.CUST_AVG_AUM || 0), 0);

  // 总AUM变化
  const totalChange = finalTotalAum - initialTotalAum;

  // 按CUST_AUM_STATUS_QUO_AVG分组，计算各组AUM变化
  const statusGroups = {};

  rmCustomers.forEach(cust => {
    const status = cust.CUST_AUM_STATUS_QUO_AVG || '未分类';
    const aumChange = Number(cust.CUST_AVG_AUM || 0) - Number(cust.CUST_AVG_AUM_2 || 0);
    
    if (!statusGroups[status]) {
      statusGroups[status] = {
        change: 0,
        count: 0
      };
    }
    
    statusGroups[status].change += aumChange;
    statusGroups[status].count += 1;
  });

  console.log("AUM变化分组:", statusGroups);

  // 准备Waterfall图的数据
  const categories = ['期初AUM'];
  const values = [0]; // 期初值设为0，作为基准点
  const actualValues = [initialTotalAum]; // 存储实际值用于显示
  const itemStyles = [{ 
    color: '#3fa2e9',
    opacity: 0.7 // 降低期初柱子的不透明度
  }]; // 期初AUM-蓝色，半透明

  // 变化贡献
  let runningTotal = 0;

  // 先处理新客（如果有）
  if (statusGroups['新客']) {
    const change = statusGroups['新客'].change;
    const count = statusGroups['新客'].count;
    
    categories.push(`新客`);
    values.push(change);
    actualValues.push(change);
    itemStyles.push({ 
      color: '#FF7043', 
      shadowBlur: 10,  // 添加阴影效果
      shadowColor: 'rgba(255, 112, 67, 0.5)'  // 阴影颜色
    }); // 新客 -> 橙色，高亮效果
    
    runningTotal += change;
    
    // 从状态组中删除新客，以便后续按变化排序
    delete statusGroups['新客'];
  }

  // 按AUM变化绝对值从大到小排序其他类别
  const sortedStatuses = Object.keys(statusGroups).sort((a, b) => 
    Math.abs(statusGroups[b].change) - Math.abs(statusGroups[a].change)
  );

  sortedStatuses.forEach(status => {
    const change = statusGroups[status].change;
    const count = statusGroups[status].count;
    
    // 忽略变化很小的类别
    if (Math.abs(change) < 0.01) return;
    
    categories.push(`${status}`);
    values.push(change);
    actualValues.push(change);
    
    // 根据CUST_AUM_STATUS_QUO_AVG的值和变化方向来分配颜色
    let itemStyle = {};
    if (status === '升级而来') {
      // 升级而来 -> 橙色
      itemStyle = { 
        color: '#fa8c16', 
        shadowBlur: 10,  // 添加阴影效果
        shadowColor: 'rgba(250, 140, 22, 0.5)'  // 阴影颜色
      };
    } else if (status === '隐性流失' || status === '降级流失') {
      // 隐性流失或降级而来 -> 红色
      itemStyle = { 
        color: '#f5222d', 
        shadowBlur: 10,  // 添加阴影效果
        shadowColor: 'rgba(245, 34, 45, 0.5)'  // 阴影颜色
      };
    } else {
      // 其他情况：正向变化为蓝色，负向变化为红色
      itemStyle = {
        color: change >= 0 ? '#1890ff' : '#f5222d',
        shadowBlur: 10,  // 添加阴影效果
        shadowColor: change >= 0 ? 'rgba(24, 144, 255, 0.5)' : 'rgba(245, 34, 45, 0.5)'  // 阴影颜色
      };
    }
    
    itemStyles.push(itemStyle);
    
    runningTotal += change;
  });

  // 添加期末AUM
  categories.push('期末AUM');
  values.push(0); // 设为0用于堆叠显示
  actualValues.push(finalTotalAum); // 实际值
  itemStyles.push({ 
    color: '#3fa2e9', 
    opacity: 0.7 // 降低期末柱子的不透明度
  }); // 期末AUM-蓝色，半透明

  // 初始化图表
  const chart = echarts.init(document.getElementById('aumChangeWaterfallChart'));

  // 找出最大的变化值（绝对值），用于设置Y轴范围
  const maxChangeAbs = Math.max(...actualValues.slice(1, -1).map(v => Math.abs(v)));

  const option = {
    title: {
      text: 'AUM变化原因分析',
      left: 'center',
      top: 0,
      textStyle: { color: '#e0e0e0', fontSize: 16 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function(params) {
        const data = params[0];
        if (data.dataIndex === 0) {
          return `期初总AUM: ${formatNumberYi(initialTotalAum)}`;
        } else if (data.dataIndex === categories.length - 1) {
          return `期末总AUM: ${formatNumberYi(finalTotalAum)}`;
        } else {
          const change = actualValues[data.dataIndex];
          const changePercent = (change / initialTotalAum * 100).toFixed(1);
          return `${data.name}<br>` +
                 `AUM变化: ${formatNumberYi(change)}<br>` +
                 `占期初AUM比例: ${changePercent}%`;
        }
      }
    },
    legend: {
      data: ['AUM变化'],
      textStyle: { color: '#e0e0e0' },
      top: 30
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '10%',
      top: '80px',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        color: '#e0e0e0',
        rotate: 45,
        fontSize: 12,
        interval: 0
      },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: 'AUM变化',
      nameLocation: 'middle',
      nameGap: 50,
      min: -maxChangeAbs * 1.2, // 设置固定比例，使正负变化容易对比
      max: maxChangeAbs * 1.2,  // 同上
      axisLabel: {
        color: '#e0e0e0',
        formatter: function(value) {
          return (value / 100000000).toFixed(0) + '亿元';
        }
      }, 
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false} 
    },
    series: [
      {
        name: 'AUM变化',
        type: 'bar',
        stack: 'Total',
        barWidth: '60%', // 增加柱子宽度
        barGap: '10%', // 调整柱子间距
        barCategoryGap: '35%', // 增加类目间柱子距离
        label: {
          show: true,
          position: 'top',
          color: '#e0e0e0',
          fontSize: 12,
          fontWeight: 'bold', // 加粗标签文字
          formatter: function(params) {
            // 期初和期末显示总值
            if (params.dataIndex === 0) {
              return formatNumberYi(initialTotalAum);
            } else if (params.dataIndex === categories.length - 1) {
              return formatNumberYi(finalTotalAum);
            } else {
              // 变动柱显示变动值
              const actualValue = actualValues[params.dataIndex];
              // 添加颜色标记和加粗变动柱的标签
              return `{${actualValue >= 0 ? 'positive' : 'negative'}|${(actualValue >= 0 ? '+' : '') + formatNumberYi(actualValue)}}`;
            }
          },
          rich: {
            positive: {
              color: '#1890ff',
              fontWeight: 'bold'
            },
            negative: {
              color: '#f5222d',
              fontWeight: 'bold'
            }
          }
        },
        data: [
          // 期初值 - 特殊处理使其显示为整体柱状，但高度缩短
          {
            value: initialTotalAum * 0.3, // 缩短期初柱子高度更多
            itemStyle: itemStyles[0]
          },
          // 中间的变动值，增强效果
          ...values.slice(1, -1).map((value, idx) => ({
            value: value,
            itemStyle: itemStyles[idx + 1]
          })),
          // 期末值 - 特殊处理使其显示为整体柱状
          {
            value: (finalTotalAum - runningTotal) * 0.3, // 缩短期末柱子高度更多
            itemStyle: itemStyles[itemStyles.length - 1]
          }
        ]
      }
    ],
    // 添加中间柱子的分隔空间
    markLine: {
      silent: true,
      lineStyle: {
        color: 'rgba(255,255,255,0.1)',
        type: 'dashed'
      },
      data: [
        {xAxis: 0.5},
        {xAxis: categories.length - 1.5}
      ]
    },
    // 去除横线
    splitLine: { show: false },
    animationDuration: 1500
  };

  chart.setOption(option);

  // 更新分析内容
  updateAumChangeWaterfallAnalysis(initialTotalAum, finalTotalAum, statusGroups, rmId);

  window.addEventListener('resize', () => chart.resize());

  // 存储当前数据和RM到全局
  window.currentSelectedRM = selectedRM;
  window.currentRmCustData = rmCustData;
}

// D2: 客户数量变化分析 - Waterfall图
function initCustomerCountWaterfallChart(selectedRM, rmCustData) {
if (!selectedRM || !rmCustData || rmCustData.length === 0) {
  console.error("客户数量变化分析数据不完整");
  return;
}

// 获取当前选中RM的ID
const rmId = selectedRM.RM_ID;

// 筛选当前RM的客户
const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);

// 筛选非新客
const nonNewCustomers = rmCustomers.filter(cust => cust.CUST_AUM_STATUS_QUO_AVG !== '新客');

// 计算期初总客户数（所有非新客的数量）
const initialCustomerCount = nonNewCustomers.length;

// 计算期末总客户数（所有客户，包括新客）
const finalCustomerCount = rmCustomers.length;

// 按CUST_AUM_STATUS_QUO_AVG分组，统计各组客户数量
const statusGroups = {};

rmCustomers.forEach(cust => {
  const status = cust.CUST_AUM_STATUS_QUO_AVG || '未分类';
  
  if (!statusGroups[status]) {
    statusGroups[status] = {
      count: 0
    };
  }
  
  statusGroups[status].count += 1;
});

console.log("客户数量分组:", statusGroups);

// 准备Waterfall图的数据
const categories = ['期初客户数'];
const values = [0]; // 设置为0，用于基准点
const actualValues = [initialCustomerCount]; // 存储实际值
const itemStyles = [{ color: '#3fa2e9' }]; // 期初客户数-蓝色

let runningTotal = 0;

// 先处理新客（如果有）
if (statusGroups['新客']) {
  const count = statusGroups['新客'].count;
  
  categories.push(`新客`);
  values.push(count);
  actualValues.push(count);
  itemStyles.push({ color: '#FF7043' }); // 新客 -> 橙色
  
  runningTotal += count;
  
  // 从状态组中删除新客，以便后续按数量排序
  delete statusGroups['新客'];
}

// 按客户数量从大到小排序其他类别
const sortedStatuses = Object.keys(statusGroups).sort((a, b) => 
  statusGroups[b].count - statusGroups[a].count
);

sortedStatuses.forEach(status => {
  const count = statusGroups[status].count;
  
  // 忽略数量为0的类别
  if (count === 0) return;
  
  categories.push(`${status}`);
  values.push(0); // 设置为0，这些类别只用于展示，不影响总数
  actualValues.push(count);
  
  // 根据类别分配颜色
  if (status === '升级而来') {
    itemStyles.push({ color: '#FF7043' }); // 升级而来 -> 橙色
  } else if (status === '隐性流失' || status === '降级流失') {
    itemStyles.push({ color: '#f5222d' }); // 隐性流失或降级而来 -> 红色
  } else {
    itemStyles.push({ color: '#3fa2e9' }); // 其他 -> 蓝色
  }
});

// 添加期末客户数
categories.push('期末客户数');
values.push(0);
actualValues.push(finalCustomerCount);
itemStyles.push({ color: '#3fa2e9' }); // 期末客户数-蓝色

// 初始化图表
const chart = echarts.init(document.getElementById('aumChangeWaterfallChart'));

// 计算最大客户数量变化，用于设置Y轴范围
const maxCustomerCount = Math.max(...actualValues.slice(1, -1));

const option = {
  title: {
    text: '客户数量变化分析',
    left: 'center',
    top: 0,
    textStyle: { color: '#e0e0e0', fontSize: 16 }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: function(params) {
      const data = params[0];
      if (data.dataIndex === 0) {
        return `期初客户数: ${initialCustomerCount}人`;
      } else if (data.dataIndex === categories.length - 1) {
        return `期末客户数: ${finalCustomerCount}人`;
      } else {
        const count = actualValues[data.dataIndex];
        const countPercent = (count / initialCustomerCount * 100).toFixed(1);
        return `${data.name}<br>` +
               `客户数量: ${count}人<br>` +
               `占期初客户比例: ${countPercent}%`;
      }
    }
  },
  legend: {
    data: ['客户数量'],
    textStyle: { color: '#e0e0e0' },
    top: 30
  },
  grid: {
    left: '5%',
    right: '5%',
    bottom: '10%',
    top: '80px',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: categories,
    axisLabel: {
      color: '#e0e0e0',
      rotate: 45,
      fontSize: 12,
      interval: 0
    },
    axisLine: { lineStyle: { color: '#e0e0e0' } },
    splitLine: { show: false }
  },
  yAxis: {
    type: 'value',
    name: '客户数量',
    nameLocation: 'middle',
    nameGap: 50,
    min: 0,
    max: maxCustomerCount * 2.5, // 设置适当比例
    axisLabel: {
      color: '#e0e0e0',
      formatter: function(value) {
        return value + '人';
      }
    }, 
    axisLine: { lineStyle: { color: '#e0e0e0' } },
    splitLine: { show: false }
  },
  series: [
    {
      name: '客户数量',
      type: 'bar',
      stack: 'Total',
      label: {
        show: true,
        position: 'top',
        color: '#e0e0e0',
        formatter: function(params) {
          if (params.dataIndex === 0) {
            return initialCustomerCount + '人';
          } else if (params.dataIndex === categories.length - 1) {
            return finalCustomerCount + '人';
          } else {
            return actualValues[params.dataIndex] + '人';
          }
        }
      },
      data: [
        // 期初客户数 - 特殊处理
        {
          value: initialCustomerCount*0.1,
          itemStyle: itemStyles[0]
        },
        // 中间类别 - 使用实际数值
        ...actualValues.slice(1, -1).map((value, idx) => ({
          value: value,
          itemStyle: itemStyles[idx + 1]
        })),
        // 期末客户数 - 特殊处理
        {
          value: finalCustomerCount * 1.3 - actualValues.slice(1, -1).reduce((sum, val) => sum + val, 0), // 提高期末值的比例
          itemStyle: itemStyles[itemStyles.length - 1]
        }
      ]
    }
  ],
  // 去除横线
  splitLine: { show: false },
  animationDuration: 1500
};

chart.setOption(option);

// 更新客户数量分析内容
updateCustomerCountWaterfallAnalysis(initialCustomerCount, finalCustomerCount, statusGroups, rmId);

window.addEventListener('resize', () => chart.resize());
}

// D2: 更新AUM变化原因分析
function updateAumChangeWaterfallAnalysis(initialAum, finalAum, statusGroups, rmId) {
const analysisElem = document.getElementById('aumChangeWaterfallAnalysis');
if (!analysisElem) return;

// 计算总变化及百分比
const totalChange = finalAum - initialAum;
const changePercent = (totalChange / initialAum * 100).toFixed(1);
const isIncrease = totalChange >= 0;

// 找出贡献最大和最小的状态组
let maxPositiveGroup = null;
let maxPositiveChange = 0;
let maxNegativeGroup = null;
let maxNegativeChange = 0;

Object.keys(statusGroups).forEach(status => {
  const change = statusGroups[status].change;
  
  if (change > maxPositiveChange) {
    maxPositiveChange = change;
    maxPositiveGroup = status;
  }
  
  if (change < maxNegativeChange) {
    maxNegativeChange = change;
    maxNegativeGroup = status;
  }
});

// 计算正向贡献和负向贡献总和
let totalPositiveChange = 0;
let totalNegativeChange = 0;

Object.keys(statusGroups).forEach(status => {
  const change = statusGroups[status].change;
  
  if (change > 0) {
    totalPositiveChange += change;
  } else if (change < 0) {
    totalNegativeChange += change;
  }
});

// 计算主要正负贡献占比
const positiveContribution = maxPositiveChange > 0 ? 
  (maxPositiveChange / totalPositiveChange * 100).toFixed(1) : 0;
  
const negativeContribution = maxNegativeChange < 0 ? 
  (Math.abs(maxNegativeChange) / Math.abs(totalNegativeChange) * 100).toFixed(1) : 0;

// 生成分析文本
let analysisText = `
  <p>理财经理<span class="highlight">${rmId}</span>的客户AUM从期初的<span class="highlight">${formatNumberYi(initialAum)}</span>
  ${isIncrease ? '增长' : '减少'}至<span class="highlight">${formatNumberYi(finalAum)}</span>，
  变化<span class="highlight">${isIncrease ? '+' : ''}${formatNumberYi(totalChange)} (${changePercent}%)</span>。</p>
`;

if (maxPositiveGroup && maxPositiveChange > 0) {
  analysisText += `
    <p>AUM增长主要来源于<span class="highlight">${maxPositiveGroup}</span>客户群体，
    贡献了<span class="highlight">${formatNumberYi(maxPositiveChange)}</span>的资产增长，
    占总正向贡献的<span class="highlight">${positiveContribution}%</span>。</p>
  `;
}

if (maxNegativeGroup && maxNegativeChange < 0) {
  analysisText += `
    <p>AUM减少主要来自<span class="highlight">${maxNegativeGroup}</span>客户群体，
    造成了<span class="highlight">${formatNumberYi(maxNegativeChange)}</span>的资产流失，
    占总负向影响的<span class="highlight">${negativeContribution}%</span>。</p>
  `;
}

// 提供建议
if (isIncrease) {
  if (maxNegativeGroup && maxNegativeChange < 0) {
    analysisText += `
      <p>建议：继续发挥<span class="highlight">${maxPositiveGroup}</span>客户群体的优势，同时重点关注<span class="highlight">${maxNegativeGroup}</span>客户群体，制定针对性挽留策略减少资产流失。</p>
    `;
  } else {
    analysisText += `
      <p>建议：保持当前客户经营策略，重点推广<span class="highlight">${maxPositiveGroup}</span>成功经验，进一步扩大AUM规模。</p>
    `;
  }
} else {
  if (maxPositiveGroup && maxPositiveChange > 0) {
    analysisText += `
      <p>建议：紧急制定<span class="highlight">${maxNegativeGroup}</span>客户群体的资产挽留计划，同时扩大<span class="highlight">${maxPositiveGroup}</span>客户群体的覆盖，扭转AUM下降趋势。</p>
    `;
  } else {
    analysisText += `
      <p>建议：全面调整客户经营策略，重点分析<span class="highlight">${maxNegativeGroup}</span>客户流失原因，加强客户关系维护和资产挽留。</p>
    `;
  }
}

// 设置分析内容
analysisElem.innerHTML = analysisText;
}

// D2: 更新客户数量分析
function updateCustomerCountWaterfallAnalysis(initialCount, finalCount, statusGroups, rmId) {
const analysisElem = document.getElementById('aumChangeWaterfallAnalysis');
if (!analysisElem) return;

// 计算总变化及百分比
const totalChange = finalCount - initialCount;
const changePercent = (totalChange / initialCount * 100).toFixed(1);
const isIncrease = totalChange >= 0;

// 找出客户数最多的状态组（除了新客）
let maxCustomerGroup = null;
let maxCustomerCount = 0;

Object.keys(statusGroups).forEach(status => {
  const count = statusGroups[status].count;
  
  if (count > maxCustomerCount) {
    maxCustomerCount = count;
    maxCustomerGroup = status;
  }
});

// 获取新客数量（如果有）
const newCustomerCount = window.currentRmCustData.filter(
  cust => cust.RM_ID === rmId && cust.CUST_AUM_STATUS_QUO_AVG === '新客'
).length;

// 生成分析文本
let analysisText = `
  <p>理财经理<span class="highlight">${rmId}</span>的客户总数从期初的<span class="highlight">${initialCount}</span>人
  ${isIncrease ? '增长' : '减少'}至<span class="highlight">${finalCount}</span>人，
  变化<span class="highlight">${isIncrease ? '+' : ''}${totalChange}人 (${changePercent}%)</span>。</p>
`;

if (newCustomerCount > 0) {
  const newCustomerPercent = (newCustomerCount / finalCount * 100).toFixed(1);
  analysisText += `
    <p>期末客户中新增<span class="highlight">${newCustomerCount}</span>名新客户，
    占总客户数的<span class="highlight">${newCustomerPercent}%</span>。</p>
  `;
}

if (maxCustomerGroup && maxCustomerCount > 0) {
  const groupPercent = (maxCustomerCount / finalCount * 100).toFixed(1);
  analysisText += `
    <p>在现有客户结构中，<span class="highlight">${maxCustomerGroup}</span>客户群体数量最多，
    共<span class="highlight">${maxCustomerCount}</span>人，
    占总客户数的<span class="highlight">${groupPercent}%</span>。</p>
  `;
}

// 提供建议
if (newCustomerCount > 0) {
  analysisText += `
    <p>建议：重点关注新增的<span class="highlight">${newCustomerCount}</span>名客户，提供优质服务体验，
    并深入了解<span class="highlight">${maxCustomerGroup}</span>客户群体的需求特点，有针对性地开展产品推荐和服务提升。</p>
  `;
} else {
  analysisText += `
    <p>建议：加大新客户开发力度，同时针对<span class="highlight">${maxCustomerGroup}</span>客户群体制定专属服务方案，
    提高客户满意度和黏性。</p>
  `;
}

// 设置分析内容
analysisElem.innerHTML = analysisText;
}

// D3: AUM转移矩阵热力图 - 创建视图切换控制
function createAumTransferMatrixControl(container) {
  // 创建一个独立的控制容器
  const controlDiv = document.createElement('div');
  controlDiv.id = 'aumTransferMatrixControl';
  controlDiv.style.textAlign = 'center';
  controlDiv.style.marginBottom = '15px';
  controlDiv.style.marginTop = '10px';
  controlDiv.style.zIndex = '100';
  controlDiv.style.position = 'relative';
  
  // 创建模式选择器HTML
  controlDiv.innerHTML = `
    <div class="mode-selector">
      <button class="mode-btn active" data-mode="count">客户数</button>
      <button class="mode-btn" data-mode="amount">金额</button>
    </div>
  `;
  
  // 将控制容器插入到图表容器之前
  container.parentNode.insertBefore(controlDiv, container);
  
  // 添加样式
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    #aumTransferMatrixControl .mode-selector {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    #aumTransferMatrixControl .mode-btn {
      padding: 6px 15px;
      margin: 0 5px;
      background-color: #091e2c;
      color: #e0e0e0;
      border: 1px solid #3fa2e9;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    #aumTransferMatrixControl .mode-btn.active {
      background-color: #3fa2e9;
      color: white;
      font-weight: bold;
    }
  `;
  document.head.appendChild(styleElement);
  }
  
  // D3: 初始化热力图数据结构 
function initializeTransferMatrixData(tierOrder) {
  const data = {};
  tierOrder.forEach(initialTier => {
    data[initialTier] = {};
    tierOrder.forEach(finalTier => {
      data[initialTier][finalTier] = {
        count: 0,
        amount: 0
      };
    });
  });
  return data;
  }
  
  // D3: 转换数据为ECharts格式 - 修改以正确计算金额比例并使用气泡显示
function convertToTransferMatrixData(transferData, tierOrder, mode, totalCounts, totalAumChange) {
  const chartData = [];
  
  tierOrder.forEach((initialTier, i) => {
    tierOrder.forEach((finalTier, j) => {
      // 根据视图模式选择数据
      let value = 0;
      let rawCount = transferData[initialTier][finalTier].count;
      let rawAmount = transferData[initialTier][finalTier].amount;
      let symbolSize = 0;
      
      if (mode === 'count') {
        // 客户数视图：计算百分比
        if (totalCounts[initialTier] > 0) {
          value = (rawCount / totalCounts[initialTier]) * 100;
          symbolSize = Math.max(5, Math.min(70, Math.sqrt(Math.abs(value)) * 13));
        }
      } else {
        // 金额视图：计算占总变化的百分比
        if (totalAumChange !== 0) {
          value = (rawAmount / totalAumChange) * 100;
          symbolSize = Math.max(5, Math.min(70, Math.sqrt(Math.abs(value)) * 13));
        }
      }
      
      chartData.push([
        j, i, // ECharts坐标 (x,y)
        value.toFixed(1), // 格式化的百分比值
        rawCount, // 原始客户数
        initialTier, // 期初层级
        finalTier, // 期末层级
        formatNumber(rawAmount), // 格式化的金额变化
        symbolSize, // 气泡大小
        rawAmount > 0 ? '#3fa2e9' : '#FF7043' // 正值为蓝色，负值为橙色
      ]);
    });
  });
  
  return chartData;
  }
  
  // D3: AUM转移矩阵热力图 - 修改为气泡散点图-key
function initAumLossScatterChart(selectedRM, rmCustData) {
  if (!selectedRM || !rmCustData || rmCustData.length === 0) {
    console.error("AUM转移矩阵热力图数据不完整");
    return;
  }
  
  console.log("开始初始化AUM转移矩阵气泡图...");
  
  // 获取当前选中RM的ID
  const rmId = selectedRM.RM_ID;
  
  // 获取图表容器
  const chartContainer = document.getElementById('aumLossScatterChart');
  if (!chartContainer) {
    console.error("找不到图表容器");
    return;
  }
  
  // 创建视图切换控制
  createAumTransferMatrixControl(chartContainer);
  
  // 默认视图模式
  let currentMode = 'count';
  
  // 定义AUM层级顺序（从高到低）
  const tierOrder = [
    "30mn+", 
    "6-30Mn", 
    "1-6Mn", 
    "300K-1Mn", 
    "50-300K", 
    "0-50K"
  ];
  
  // 筛选当前RM的客户
  const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);
  
  // 创建转移矩阵数据结构
  const transferMatrix = initializeTransferMatrixData(tierOrder);
  
  // 统计各层级的客户总数
  const initialCounts = {};
  tierOrder.forEach(tier => initialCounts[tier] = 0);
  
  // 计算总AUM变化量
  let totalAumChange = 0;
  
  // 填充转移矩阵数据
  rmCustomers.forEach(cust => {
    const initialTier = cust.AUM_AVG_GROUP_2;
    const finalTier = cust.AUM_AVG_GROUP;
    const initialAum = Number(cust.CUST_AVG_AUM_2 || 0);
    const finalAum = Number(cust.CUST_AVG_AUM || 0);
    const aumChange = finalAum - initialAum;
    
    // 过滤无效数据
    if (!initialTier || !finalTier || 
        !tierOrder.includes(initialTier) || 
        !tierOrder.includes(finalTier)) {
      return;
    }
    
    // 更新矩阵
    transferMatrix[initialTier][finalTier].count++;
    transferMatrix[initialTier][finalTier].amount += aumChange;
    
    // 更新初始层级计数
    initialCounts[initialTier]++;
    
    // 更新总AUM变化
    totalAumChange += aumChange;
  });
  
  // 找出有数据的层级
  const tiersWithData = [];
  tierOrder.forEach(tier => {
    const hasInitial = tierOrder.some(t => transferMatrix[tier][t].count > 0);
    const hasFinal = tierOrder.some(t => transferMatrix[t][tier].count > 0);
    
    if (hasInitial || hasFinal) {
      tiersWithData.push(tier);
    }
  });
  
  // 绘制气泡图
  function drawBubbleChart(mode) {
    // A清除并重建图表实例
    echarts.dispose(chartContainer);
    const chart = echarts.init(chartContainer);
    
    // 准备数据
    const bubbleData = convertToTransferMatrixData(
      transferMatrix, 
      tiersWithData, 
      mode, 
      initialCounts,
      totalAumChange
    );
    
    // 重组数据为散点图系列
    const series = [];
    
    // 生成每个单元格的系列
    bubbleData.forEach(item => {
      series.push({
        type: 'scatter',
        symbol: 'circle',
        symbolSize: item[7], // 使用计算的气泡大小
        itemStyle: {
          color: item[8] // 使用计算的颜色
        },
        label: {
          show: true,
          position: 'inside',
          formatter: item[2] + '%', // 显示百分比值
          color: '#fff',
          fontSize: 12
        },
        emphasis: {
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            fontSize: 14
          }
        },
        data: [[item[0], item[1]]] // 坐标
      });
    });
    
    // 设置图表选项
    const option = getUpdatedBubbleChartOption(currentMode, tiersWithData, series);
    
    // 渲染图表
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
    
    // 更新分析
    updateAumLossScatterAnalysis(transferMatrix, initialCounts, mode, rmId, totalAumChange);
  }
  
  // 绑定按钮事件
  document.querySelectorAll('#aumTransferMatrixControl .mode-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      // 更新按钮状态
      document.querySelectorAll('#aumTransferMatrixControl .mode-btn').forEach(b => {
        b.classList.remove('active');
      });
      this.classList.add('active');
      
      // 更新图表
      const selectedMode = this.getAttribute('data-mode');
      currentMode = selectedMode;
      drawBubbleChart(selectedMode);
    });
  });
  
  // 初始绘制
  drawBubbleChart(currentMode);
  }
  
  // D3: 更新分析内容 - 根据模式显示不同分析
function updateAumLossScatterAnalysis(transferMatrix, initialCounts, mode, rmId, totalAumChange) {
  const analysisElem = document.getElementById('aumLossScatterAnalysis');
  if (!analysisElem) return;
  
  // 定义AUM层级顺序
  const tierOrder = [
    "30mn+", 
    "6-30Mn", 
    "1-6Mn", 
    "300K-1Mn", 
    "50-300K", 
    "0-50K"
  ];
  
  // 计算总客户数
  const totalCustomers = Object.values(initialCounts).reduce((sum, count) => sum + count, 0);
  
  // 计算保持不变和发生变化的客户数
  let stableCustomers = 0;
  let upgradedCustomers = 0;
  let downgradedCustomers = 0;
  
  tierOrder.forEach((initialTier, i) => {
    tierOrder.forEach((finalTier, j) => {
      const count = transferMatrix[initialTier][finalTier].count;
      
      if (i === j) {
        // 保持相同层级
        stableCustomers += count;
      } else if (j < i) {
        // 层级上升 (finalTier的索引小于initialTier的索引，因为tierOrder是从高到低排序)
        upgradedCustomers += count;
      } else {
        // 层级下降
        downgradedCustomers += count;
      }
    });
  });
  
  // 计算百分比
  const stablePercent = totalCustomers > 0 ? (stableCustomers / totalCustomers * 100).toFixed(1) : 0;
  const upgradedPercent = totalCustomers > 0 ? (upgradedCustomers / totalCustomers * 100).toFixed(1) : 0;
  const downgradedPercent = totalCustomers > 0 ? (downgradedCustomers / totalCustomers * 100).toFixed(1) : 0;
  
  // 找出最稳定和最不稳定的层级
  let mostStableTier = '';
  let mostStablePercent = 0;
  let leastStableTier = '';
  let leastStablePercent = 100;
  
  tierOrder.forEach(tier => {
    if (initialCounts[tier] > 0) {
      const stableCount = transferMatrix[tier][tier].count;
      const stablePercentage = (stableCount / initialCounts[tier]) * 100;
      
      if (stablePercentage > mostStablePercent) {
        mostStablePercent = stablePercentage;
        mostStableTier = tier;
      }
      
      if (stablePercentage < leastStablePercent) {
        leastStablePercent = stablePercentage;
        leastStableTier = tier;
      }
    }
  });
  
  // 生成分析文本
  let analysisText = '';
  
  if (totalCustomers > 0) {
    if (mode === 'count') {
      // 客户数视图分析
      analysisText = `
        <p>理财经理<span class="highlight">${rmId}</span>共有<span class="highlight">${totalCustomers}</span>位客户，
        其中<span class="highlight">${stablePercent}%</span>的客户保持在原有AUM层级，
        <span class="highlight">${upgradedPercent}%</span>的客户层级上升，
        <span class="highlight">${downgradedPercent}%</span>的客户层级下降。</p>
        
        <p><span class="highlight">${mostStableTier}</span>层级的客户最稳定，
        有<span class="highlight">${mostStablePercent.toFixed(1)}%</span>的客户保持在原层级；
        而<span class="highlight">${leastStableTier}</span>层级的客户最不稳定，
        只有<span class="highlight">${leastStablePercent.toFixed(1)}%</span>的客户保持在原层级。</p>
      `;
    } else {
      // 金额视图分析
      analysisText = `
        <p>理财经理<span class="highlight">${rmId}</span>的客户总AUM变化为<span class="highlight">${formatNumber(totalAumChange)}</span>。</p>
        <p>气泡图展示了不同客户层级间的AUM流转情况，蓝色表示正向变化（增长），橙色表示负向变化（减少），气泡大小表示占总变化的比例。</p>
        <p>矩阵对角线上的气泡表示保持在同一层级的客户AUM变化，对角线以下的气泡表示客户层级上升，对角线以上的气泡表示客户层级下降。</p>
      `;
    }
    
    // 根据整体趋势添加建议
    if (parseFloat(upgradedPercent) > parseFloat(downgradedPercent)) {
      analysisText += `
        <p>客户整体呈现<span class="highlight">上升趋势</span>，建议：</p>
        <p>1. 继续保持促进客户AUM提升的良好策略；</p>
        <p>2. 重点关注<span class="highlight">${leastStableTier}</span>层级客户的稳定性，减少客户波动；</p>
        <p>3. 总结<span class="highlight">${mostStableTier}</span>层级的成功经验，在其他层级推广。</p>
      `;
    } else if (parseFloat(downgradedPercent) > parseFloat(upgradedPercent)) {
      analysisText += `
        <p>客户整体呈现<span class="highlight">下降趋势</span>，建议：</p>
        <p>1. 紧急制定客户挽留计划，尤其是<span class="highlight">${leastStableTier}</span>层级；</p>
        <p>2. 分析客户层级下降的原因，重点关注关键客户群体；</p>
        <p>3. 参考<span class="highlight">${mostStableTier}</span>层级的稳定策略，在其他层级推广。</p>
      `;
    } else {
      analysisText += `
        <p>客户层级变化较为<span class="highlight">平衡</span>，建议：</p>
        <p>1. 制定针对性策略，促进更多客户向上层级迁移；</p>
        <p>2. 加强<span class="highlight">${leastStableTier}</span>层级客户的维护，提高客户稳定性；</p>
        <p>3. 总结并推广<span class="highlight">${mostStableTier}</span>层级的成功经验。</p>
      `;
    }
  } else {
    analysisText = `<p>暂无有效客户数据，无法进行AUM转移矩阵分析。</p>`;
  }
  
  // 更新分析内容
  analysisElem.innerHTML = analysisText;
  }
  
  // D2: AUM流失热力图(流失分位数) - 创建视图切换控制-1
function createAumLossViewControl(container) {
  // 创建一个独立的控制容器
  const controlDiv = document.createElement('div');
  controlDiv.id = 'aumLossViewControl';
  controlDiv.style.textAlign = 'center';
  controlDiv.style.marginBottom = '15px';
  controlDiv.style.marginTop = '10px';
  controlDiv.style.zIndex = '100';
  controlDiv.style.position = 'relative';
  
  // 创建模式选择器HTML
  controlDiv.innerHTML = `
    <div class="mode-selector">
      <button class="mode-btn active" data-mode="rm">选中RM视图</button>
      <button class="mode-btn" data-mode="group">同组平均视图</button>
    </div>
  `;
  
  // 将控制容器插入到图表容器之前
  container.parentNode.insertBefore(controlDiv, container);
  
  // 添加样式
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    #aumLossViewControl .mode-selector {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    #aumLossViewControl .mode-btn {
      padding: 6px 15px;
      margin: 0 5px;
      background-color: #091e2c;
      color: #e0e0e0;
      border: 1px solid #3fa2e9;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    #aumLossViewControl .mode-btn.active {
      background-color: #3fa2e9;
      color: white;
      font-weight: bold;
    }
  `;
  document.head.appendChild(styleElement);
  }
  // D2: AUM流失热力图(流失分位数) - 创建视图切换控制-2
function getUpdatedBubbleChartOption(mode, tiersWithData, series) {
  return {
    backgroundColor: 'transparent',
    title: {
      text: `AUM转移矩阵 - ${mode === 'count' ? '客户数占比' : '金额占比'}`,
      left: 'center',
      top: 0,
      textStyle: { color: '#e0e0e0', fontSize: 16 }
    },
    tooltip: {
      formatter: function(params) {
        // 现有的tooltip格式化逻辑
      }
    },
    legend: {
      data: [
        {name: '正向变化', icon: 'circle', itemStyle: {color: '#3fa2e9'}},
        {name: '负向变化', icon: 'circle', itemStyle: {color: '#FF7043'}}
      ],
      bottom: 10,
      textStyle: {color: '#e0e0e0'}
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '15%',
      top: '60px',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: tiersWithData,
      name: '期末层级',
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        color: '#e0e0e0',
        interval: 0
      },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: tiersWithData,
      name: '期初层级',
      nameLocation: 'middle',
      // 增加nameGap以避免与坐标轴数字重合
      nameGap: 80,
      axisLabel: { color: '#e0e0e0' },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    series: series,
    animationDuration: 1500
  };
  }
  // D2: AUM流失热力图(流失分位数) - 创建视图切换控制-3
function getUpdatedAumLossBubbleOption(mode, lossPercentiles, tierOrder, series) {
  return {
    backgroundColor: 'transparent',
    title: {
      text: `AUM流失分布 - ${mode === 'rm' ? '选中RM' : '同组平均'}`,
      left: 'center',
      top: 0,
      textStyle: { color: '#e0e0e0', fontSize: 16 }
    },
    tooltip: {
      formatter: function(params) {
        // 现有的tooltip格式化逻辑
      }
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '15%',
      top: '60px',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: lossPercentiles,
      name: '流失金额分位',
      nameLocation: 'middle',
      nameGap: 50,
      axisLabel: {
        color: '#e0e0e0',
        interval: 0
      },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: tierOrder,
      name: '客户初始层级',
      nameLocation: 'middle',
      // 增加nameGap以避免与坐标轴数字重合
      nameGap: 80,
      axisLabel: { color: '#e0e0e0' },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    series: series,
    animationDuration: 1500
  };
  }
  
// D2: 初始化热力图数据结构(流失分位数)
function initializeAumLossData(tierOrder, lossPercentiles) {
  const data = {};
  tierOrder.forEach(tier => {
    data[tier] = {};
    lossPercentiles.forEach(percentile => {
      data[tier][percentile] = {
        count: 0,
        amount: 0
      };
    });
  });
  return data;
  }
  
// D2: 转换数据为气泡图格式(流失分位数)
function convertToAumLossBubbleData(lossData, tierOrder, lossPercentiles, totalLossAmount) {
  const bubbleData = [];
  
  tierOrder.forEach((tier, i) => {
    lossPercentiles.forEach((percentile, j) => {
      // 获取当前单元格的数据
      const cellData = lossData[tier][percentile];
      const aumLossAmount = cellData.amount;
      const customerCount = cellData.count;
      
      // 计算占总流失的比例
      let lossPercent = 0;
      if (totalLossAmount > 0 && aumLossAmount !== 0) {
        lossPercent = (aumLossAmount / totalLossAmount) * 100;
      }
      
      
      // 计算气泡大小 - 使用平方根缩放来增强差异性
      const symbolSize = Math.max(5, Math.min(70, Math.sqrt(Math.abs(lossPercent)) * 13));
      
      bubbleData.push([
        j, i, // 坐标 (x,y)
        lossPercent.toFixed(1), // 格式化的百分比值
        customerCount, // 客户数
        tier, // 客户层级
        percentile, // 分位区间
        formatNumber(aumLossAmount), // 格式化的流失金额
        symbolSize, // 气泡大小
        '#3fa2e9' // 颜色
      ]);
    });
  });
  
  return bubbleData;
  }
  
// D2: AUM流失热力图(流失分位数) - 修改为气泡图-key
function initAumLossDistributionChart(selectedRM, rmCustData) {
  if (!selectedRM || !rmCustData || rmCustData.length === 0) {
    console.error("AUM流失热力图数据不完整");
    return;
  }
  
  console.log("开始初始化 AUM 流失气泡图...");
  
  const rmId = selectedRM.RM_ID;
  const rmGroup = selectedRM.cust_aum_scale_group || "未分组";
  
  const chartContainer = document.getElementById('aumLossDistributionChart');
  if (!chartContainer) {
    console.error("找不到图表容器 #aumLossDistributionChart");
    return;
  }
  
  // 确保图表容器样式隔离
  chartContainer.style.backgroundColor = '#091e2c';
  chartContainer.style.opacity = '1';
  
  // 创建视图切换控制
  createAumLossViewControl(chartContainer);
  
  // 默认视图模式
  let currentMode = 'rm';
  
  // 客户层级定义（从高到低排序）
  const tierOrder = [
    "30mn+", 
    "6-30Mn", 
    "1-6Mn", 
    "300K-1Mn", 
    "50-300K", 
    "0-50K"
  ];
  
  // AUM流失分位定义
  const lossPercentiles = [
    "Top 1%",
    "1-5%",
    "5-10%",
    "10-20%",
    "20-50%",
    "50-100%"
  ];
  
  // 绘制气泡图函数
  function drawBubbleChart(mode) {
    // 清除并重建图表实例
    echarts.dispose(chartContainer);
    const chart = echarts.init(chartContainer);
  
    // 根据模式筛选数据
    let filteredData = [];
    if (mode === 'rm') {
      // 仅显示选中 RM 的客户数据
      filteredData = rmCustData.filter(cust => cust.RM_ID === rmId);
    } else {
      // 显示选中 RM 所在分组的所有客户数据
      filteredData = rmCustData.filter(cust => cust.cust_aum_scale_group === rmGroup);
    }
  
    console.log(`筛选出 ${filteredData.length} 个客户数据点，模式: ${mode}`);
  
    // 计算每个客户的AUM变化
    filteredData.forEach(cust => {
      const initialAum = Number(cust.CUST_AVG_AUM_2 || 0);
      const finalAum = Number(cust.CUST_AVG_AUM || 0);
      cust.AUM_DELTA = finalAum - initialAum;
    });
  
    // 只考虑流失的客户（AUM变化为负值）
    const lossCustomers = filteredData.filter(cust => cust.AUM_DELTA < 0);
  
    console.log(`已筛选${lossCustomers.length}位流失客户${mode === 'rm' ? '属于RM: ' + rmId : '属于分组: ' + rmGroup}`);
  
    // 如果没有流失客户，显示空图表并返回
    if (lossCustomers.length === 0) {
      console.log("没有客户流失数据，不生成气泡图");
      chart.setOption({
        title: {
          text: `AUM流失分布 - ${mode === 'rm' ? '选中RM' : '同组平均'} (无数据)`,
          left: 'center',
          top: 10,
          textStyle: { color: '#e0e0e0', fontSize: 16 }
        }
      });
      updateAumLossDistributionAnalysis([], mode, rmId, rmGroup);
      return;
    }
  
    // 初始化数据结构
    const lossData = initializeAumLossData(tierOrder, lossPercentiles);
    
    // 计算AUM流失总额（取绝对值）
    const totalAumLoss = lossCustomers.reduce((sum, cust) => sum + Math.abs(cust.AUM_DELTA), 0);
  
    // 按客户初始层级分组
    const tierData = {};
    tierOrder.forEach(tier => {
      tierData[tier] = [];
    });
  
    lossCustomers.forEach(cust => {
      const tier = cust.AUM_AVG_GROUP_2;
      if (tier && tierOrder.includes(tier)) {
        tierData[tier].push(cust);
      } else {
        console.log(`客户 ${cust.CUST_ID} 的期初层级 ${tier} 不在预定义层级列表中`);
      }
    });
  
    // 处理每个客户层级
    tierOrder.forEach(tier => {
      const customers = tierData[tier] || [];
  
      // 如果该层级没有客户，跳过
      if (customers.length === 0) {
        return;
      }
  
      // 按AUM流失金额（绝对值）从大到小排序
      customers.sort((a, b) => Math.abs(b.AUM_DELTA) - Math.abs(a.AUM_DELTA));
  
      // 计算各分位区间对应的索引位置
      const percentileIndices = {
        "Top 1%": Math.ceil(customers.length * 0.01),
        "1-5%": Math.ceil(customers.length * 0.05),
        "5-10%": Math.ceil(customers.length * 0.1),
        "10-20%": Math.ceil(customers.length * 0.2),
        "20-50%": Math.ceil(customers.length * 0.5),
        "50-100%": customers.length
      };
  
      // 确保每个分位至少有一个客户
      Object.keys(percentileIndices).forEach(key => {
        if (percentileIndices[key] < 1) percentileIndices[key] = 1;
      });
  
      // 处理每个分位区间
      let startIndex = 0;
      lossPercentiles.forEach(percentile => {
        const endIndex = percentileIndices[percentile];
        const customersInRange = customers.slice(startIndex, endIndex);
  
        // 计算该区间的AUM流失总额（取绝对值）
        const aumLossSum = customersInRange.reduce((sum, cust) => 
          sum + Math.abs(cust.AUM_DELTA), 0);
  
        // 更新数据结构
        lossData[tier][percentile] = {
          count: customersInRange.length,
          amount: aumLossSum
        };
  
        // 更新起始索引
        startIndex = endIndex;
      });
    });
  
    // 转换为气泡图数据
    const bubbleData = convertToAumLossBubbleData(lossData, tierOrder, lossPercentiles, totalAumLoss);
    
    // 准备系列数据
    const series = [];
    
    // 生成每个气泡的系列
    bubbleData.forEach(item => {
      series.push({
        type: 'scatter',
        symbol: 'circle',
        symbolSize: item[7], // 使用计算的气泡大小
        itemStyle: {
          color: item[8] // 使用计算的颜色
        },
        label: {
          show: true,
          position: 'inside',
          formatter: item[2] + '%', // 显示百分比值
          color: '#fff',
          fontSize: 12
        },
        emphasis: {
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            fontSize: 14
          }
        },
        data: [[item[0], item[1]]] // 坐标
      });
    });
  
    // 设置图表选项
    // 设置图表选项
    const option = getUpdatedAumLossBubbleOption(currentMode, lossPercentiles, tierOrder, series);
  
    // 渲染图表
    try {
      chart.setOption(option);
      window.addEventListener('resize', () => chart.resize());
      console.log("AUM流失气泡图渲染成功");
    } catch (e) {
      console.error("渲染图表失败:", e);
    }
  
    // 更新分析内容
    updateAumLossDistributionAnalysis(lossCustomers, mode, rmId, rmGroup);
  }
  
  // 绑定视图切换按钮事件
  document.querySelectorAll('#aumLossViewControl .mode-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      // 更新按钮状态
      document.querySelectorAll('#aumLossViewControl .mode-btn').forEach(b => {
        b.classList.remove('active');
      });
      this.classList.add('active');
      
      // 获取选中的模式并更新图表
      const selectedMode = this.getAttribute('data-mode');
      currentMode = selectedMode;
      drawBubbleChart(selectedMode);
    });
  });
  
  // 初始绘制默认视图
  drawBubbleChart(currentMode);
  }
  
// D2: 更新 AUM 流失分布分析内容(流失分位数)
function updateAumLossDistributionAnalysis(filteredData, mode, rmId, rmGroup) {
    const analysisElem = document.getElementById('aumLossDistributionAnalysis');
    if (!analysisElem) return;
    
    // 如果没有流失客户数据
    if (filteredData.length === 0) {
      analysisElem.innerHTML = `
        <p>${mode === 'rm' ? `理财经理<span class="highlight">${rmId}</span>` : `<span class="highlight">${rmGroup}</span>组`}暂无客户流失数据。</p>
      `;
      return;
    }
    
    // 计算总流失金额（取绝对值）
    const totalLossAmount = filteredData.reduce((sum, cust) => sum + Math.abs(cust.AUM_DELTA), 0);
    
    // 按层级统计流失客户数量和金额
    const tierStats = {};
    const tierOrder = [
      "30mn+", 
      "6-30Mn", 
      "1-6Mn", 
      "300K-1Mn", 
      "50-300K", 
      "0-50K"
    ];
    
    tierOrder.forEach(tier => {
      tierStats[tier] = {
        count: 0,
        amount: 0
      };
    });
    
    // 统计各层级的流失情况
    filteredData.forEach(cust => {
      const tier = cust.AUM_AVG_GROUP_2;
      if (tier && tierStats[tier]) {
        tierStats[tier].count++;
        tierStats[tier].amount += Math.abs(cust.AUM_DELTA);
      }
    });
    
    // 找出流失客户数量和金额最多的层级
    let maxLossCountTier = tierOrder[0];
    let maxLossAmountTier = tierOrder[0];
    
    tierOrder.forEach(tier => {
      if (tierStats[tier].count > tierStats[maxLossCountTier].count) {
        maxLossCountTier = tier;
      }
      
      if (tierStats[tier].amount > tierStats[maxLossAmountTier].amount) {
        maxLossAmountTier = tier;
      }
    });
    
    // 计算顶部流失客户的影响
    // 按流失金额从大到小排序
    filteredData.sort((a, b) => Math.abs(b.AUM_DELTA) - Math.abs(a.AUM_DELTA));
    
    // 计算Top 10%客户的流失占比
    const top10PercentCount = Math.ceil(filteredData.length * 0.1);
    const top10PercentAmount = filteredData.slice(0, top10PercentCount)
      .reduce((sum, cust) => sum + Math.abs(cust.AUM_DELTA), 0);
    const top10PercentShare = (top10PercentAmount / totalLossAmount * 100).toFixed(1);
    
    // 计算Top 20%客户的流失占比
    const top20PercentCount = Math.ceil(filteredData.length * 0.2);
    const top20PercentAmount = filteredData.slice(0, top20PercentCount)
      .reduce((sum, cust) => sum + Math.abs(cust.AUM_DELTA), 0);
    const top20PercentShare = (top20PercentAmount / totalLossAmount * 100).toFixed(1);
    
    // 分析Top 5%流失客户的层级分布
    const top5PercentCount = Math.ceil(filteredData.length * 0.05);
    const top5PercentCustomers = filteredData.slice(0, top5PercentCount);
    
    // 统计Top 5%客户的层级分布
    const top5PercentTierCounts = {};
    tierOrder.forEach(tier => {
      top5PercentTierCounts[tier] = 0;
    });
    
    top5PercentCustomers.forEach(cust => {
      const tier = cust.AUM_AVG_GROUP_2;
      if (tier && top5PercentTierCounts[tier] !== undefined) {
        top5PercentTierCounts[tier]++;
      }
    });
    
    // 找出Top 5%流失客户最集中的层级
    let maxTop5PercentTier = tierOrder[0];
    tierOrder.forEach(tier => {
      if (top5PercentTierCounts[tier] > top5PercentTierCounts[maxTop5PercentTier]) {
        maxTop5PercentTier = tier;
      }
    });
    
    // 计算该层级在Top 5%中的占比
    const maxTop5PercentShare = top5PercentCount > 0 ? 
      (top5PercentTierCounts[maxTop5PercentTier] / top5PercentCount * 100).toFixed(1) : "0";
    
    // 生成分析文本
    let analysisText = `
      <p>${mode === 'rm' ? `理财经理<span class="highlight">${rmId}</span>` : `<span class="highlight">${rmGroup}</span>组`}
      共有<span class="highlight">${filteredData.length}</span>位流失客户，
      总流失金额为<span class="highlight">${formatNumber(totalLossAmount)}</span>。</p>
      
      <p>从客户数量看，<span class="highlight">${maxLossCountTier}</span>层级的流失客户最多，
      共<span class="highlight">${tierStats[maxLossCountTier].count}</span>位，
      占总流失客户的<span class="highlight">${(tierStats[maxLossCountTier].count / filteredData.length * 100).toFixed(1)}%</span>。</p>
      
      <p>从金额看，<span class="highlight">${maxLossAmountTier}</span>层级的流失金额最大，
      达<span class="highlight">${formatNumber(tierStats[maxLossAmountTier].amount)}</span>，
      占总流失金额的<span class="highlight">${(tierStats[maxLossAmountTier].amount / totalLossAmount * 100).toFixed(1)}%</span>。</p>
      
      <p>热力图分析显示，流失呈现出明显的"二八效应"：
      仅<span class="highlight">10%</span>的顶部流失客户贡献了<span class="highlight">${top10PercentShare}%</span>的总流失金额，
      Top 5%的流失客户中，<span class="highlight">${maxTop5PercentShare}%</span>来自<span class="highlight">${maxTop5PercentTier}</span>层级。</p>
    `;
    
    // 添加针对性建议
    if (maxLossAmountTier === "30mn+" || maxLossAmountTier === "6-30Mn") {
      analysisText += `
        <p>建议：重点关注<span class="highlight">${maxLossAmountTier}</span>层级的高净值客户流失问题，
        制定专门的挽留策略，优先挽回热力图左上区域的大额流失客户。</p>
      `;
    } else if (tierStats[maxLossCountTier].count > filteredData.length * 0.5) {
      analysisText += `
        <p>建议：<span class="highlight">${maxLossCountTier}</span>层级的流失客户数量占比较高，
        需分析该层级客户流失的共性原因，针对性改进服务质量，提高客户满意度。</p>
      `;
    } else {
      analysisText += `
        <p>建议：针对不同层级的流失客户采取差异化挽留策略，
        优先挽回热力图中高亮区域的客户，特别是<span class="highlight">${maxLossAmountTier}</span>层级的Top 10%大额流失客户。</p>
      `;
    }
    
    // 设置分析内容
    analysisElem.innerHTML = analysisText;
  }
  
 // D4: 客户层级AUM增速表现 - 箱线图数据处理
function initCustomerTierAumGrowthTrend(selectedRM, rmCustData) {
  if (!selectedRM || !rmCustData || rmCustData.length === 0) {
    console.error("客户层级AUM增速表现数据不完整");
    return;
  }

  // 获取当前选中RM的ID
  const rmId = selectedRM.RM_ID;

  // 获取存在的客户层级
  const uniqueTiers = [...new Set(rmCustData.map(cust => cust.AUM_AVG_GROUP))].filter(Boolean);
  console.log("发现的客户层级:", uniqueTiers);
  
  // 定义客户层级顺序（从高到低）
  const tierOrder = [
    "30mn+", 
    "6-30Mn", 
    "1-6Mn", 
    "300K-1Mn", 
    "50-300K", 
    "0-50K"
  ].filter(tier => uniqueTiers.includes(tier));
  
  // 如果没有找到任何预定义的层级，则使用数据中的唯一层级（按字母顺序）
  if (tierOrder.length === 0) {
    tierOrder.push(...uniqueTiers.sort());
  }

  console.log("使用的客户层级顺序:", tierOrder);

  // 计算每个RM在各层级的AUM增速
  const rmDataByTier = {};
  const selectedRmGrowthByTier = {};

  // 获取所有RM ID
  const allRmIds = [...new Set(rmCustData.map(cust => cust.RM_ID))];
  
  // 遍历每个RM
  allRmIds.forEach(currentRmId => {
    // 遍历每个客户层级
    tierOrder.forEach(tier => {
      // 获取该RM在该层级的所有客户
      const rmTierCustomers = rmCustData.filter(cust => 
        cust.RM_ID === currentRmId && cust.AUM_AVG_GROUP === tier
      );
      
      // 如果该RM在该层级有客户
      if (rmTierCustomers.length > 0) {
        // 计算每个客户的AUM增速
        rmTierCustomers.forEach(cust => {
          const initialAum = Number(cust.CUST_AVG_AUM_2 || 0);
          const finalAum = Number(cust.CUST_AVG_AUM || 0);
          
          // 只考虑有效的初始AUM值
          if (initialAum > 0) {
            // 计算AUM增速 = (最终AUM / 初始AUM) - 1
            const aumGrowth = (finalAum / initialAum) - 1;
            
            // 初始化该层级数据结构
            if (!rmDataByTier[tier]) {
              rmDataByTier[tier] = [];
            }
            
            // 添加客户的AUM增速
            rmDataByTier[tier].push(aumGrowth);
            
            // 如果是当前选中的RM，记录其客户AUM增速
            if (currentRmId === rmId) {
              if (!selectedRmGrowthByTier[tier]) {
                selectedRmGrowthByTier[tier] = [];
              }
              selectedRmGrowthByTier[tier].push(aumGrowth);
            }
          }
        });
      }
    });
  });
  
  // 计算每个层级的箱线图数据
  const boxPlotData = [];
  
  // 遍历每个客户层级
  tierOrder.forEach(tier => {
    // 获取该层级的所有RM客户的AUM增速
    const tierGrowthRates = rmDataByTier[tier] || [];
    
    // 如果该层级没有有效数据，则跳过
    if (tierGrowthRates.length === 0) {
      console.log(`层级 ${tier} 没有有效的AUM增速数据，跳过`);
      return;
    }
    
    // 计算箱线图数据：最小值、Q1、中位数、Q3、最大值
    const sortedGrowthRates = [...tierGrowthRates].sort((a, b) => a - b);
    const minVal = sortedGrowthRates[0];
    const maxVal = sortedGrowthRates[sortedGrowthRates.length - 1];
    const q1 = sortedGrowthRates[Math.floor(sortedGrowthRates.length * 0.25)];
    const median = sortedGrowthRates[Math.floor(sortedGrowthRates.length * 0.5)];
    const q3 = sortedGrowthRates[Math.floor(sortedGrowthRates.length * 0.75)];
    
    // 添加箱线图数据
    boxPlotData.push([minVal, q1, median, q3, maxVal, tier]);
  });

  // 计算选中RM在各层级的平均AUM增速
  const selectedRmAvgGrowthByTier = {};
  for (const tier in selectedRmGrowthByTier) {
    const growthRates = selectedRmGrowthByTier[tier];
    if (growthRates && growthRates.length > 0) {
      selectedRmAvgGrowthByTier[tier] = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    }
  }

  // 初始化客户层级AUM增速图表
  initCustomerTierAumGrowthChart(boxPlotData, selectedRmAvgGrowthByTier, rmId, rmDataByTier);
  
  // 更新分析内容
  updateCustomerTierAumGrowthAnalysis(selectedRM, boxPlotData, selectedRmAvgGrowthByTier, rmDataByTier);
}

// D4: 初始化客户层级AUM增速图表 - 箱线图
function initCustomerTierAumGrowthChart(boxPlotData, selectedRmAvgGrowthByTier, rmId, rmDataByTier) {
  // 先清除原有的图表区域，并创建独立的小图表容器
  const chartArea = document.getElementById('customerTierAumGrowthChart');
  chartArea.innerHTML = '';
  chartArea.style.display = 'grid';
  chartArea.style.gridTemplateColumns = 'repeat(3, 1fr)'; // 3列布局
  chartArea.style.gridGap = '15px';
  chartArea.style.height = '720px'; // 总高度
  
  // 提取层级名称
  const tierNames = boxPlotData.map(item => item[5]);
  
  // 为每个层级创建独立的图表
  boxPlotData.forEach((boxData, index) => {
    // 创建图表容器
    const chartContainer = document.createElement('div');
    chartContainer.id = `aumGrowthTierChart_${index}`;
    chartContainer.style.height = '200px'; // 图表高度
    chartArea.appendChild(chartContainer);
    
    // 获取当前层级名称
    const tierName = boxData[5];
    
    // 创建图表实例
    const chart = echarts.init(chartContainer);
    
    // 准备数据
    const singleBoxData = [boxData.slice(0, 5)]; // 仅保留boxplot所需的5个数值
    const rmAvgGrowth = selectedRmAvgGrowthByTier[tierName];
    
    // 计算选中RM的百分位位置
    let percentileText = '';
    if (rmAvgGrowth !== undefined) {
      // 获取该层级的所有增速数据
      const tierGrowthRates = rmDataByTier[tierName];
      const sortedGrowthRates = [...tierGrowthRates].sort((a, b) => a - b);
      
      // 计算百分位
      const lowerCount = sortedGrowthRates.filter(rate => rate < rmAvgGrowth).length;
      const percentile = (100-lowerCount / sortedGrowthRates.length * 100).toFixed(1);
      percentileText = `位于前 ${percentile}%`;
    }
    
    // 计算适当的X轴范围，确保箱体和RM点都完整显示
    // 计算数据范围并添加边距
    let minValue = Math.min(...boxData.slice(0, 5));
    let maxValue = Math.max(...boxData.slice(0, 5));
    
    // 如果有选中RM的数据，考虑纳入范围
    if (rmAvgGrowth !== undefined) {
      minValue = Math.min(minValue, rmAvgGrowth);
      maxValue = Math.max(maxValue, rmAvgGrowth);
    }
    
    // 计算数据范围
    const dataRange = maxValue - minValue;
    
    // 设置边距，确保箱体不会顶到边缘
    // 至少留出20%的边距空间
    const margin = Math.max(dataRange * 0.15, 0.2);
    const adjustedMin = minValue - margin;
    const adjustedMax = maxValue + margin;
    
    // 设置图表选项
    const option = {
      title: {
        text: `${tierName}层级AUM增速分布`,
        left: 'center',
        top: 0,
        textStyle: { color: '#e0e0e0', fontSize: 15 }
      },
      tooltip: {
        trigger: 'item',
        axisPointer: { type: 'shadow' },
        formatter: function(params) {
          if (params.seriesName === '理财经理位置') {
            return `${tierName}层级<br/>${rmId}的平均AUM增速: ${(params.value * 100).toFixed(2)}%`;
          } else {
            return `${tierName}层级AUM增速分布:<br/>
                    最小值: ${(boxData[0] * 100).toFixed(1)}%<br/>
                    Q1: ${(boxData[1] * 100).toFixed(1)}%<br/>
                    中位数: ${(boxData[2] * 100).toFixed(1)}%<br/>
                    Q3: ${(boxData[3] * 100).toFixed(1)}%<br/>
                    最大值: ${(boxData[4] * 100).toFixed(1)}%`;
          }
        }
      },
      grid: {
        left: '10%',
        right: '5%',
        bottom: '15%',
        top: '50px',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'AUM增速(%)',
        nameLocation: 'middle',
        nameGap: 25,
        min: adjustedMin,
        max: adjustedMax*0.8,
        axisLabel: { 
          color: '#e0e0e0',
          fontSize: 10,
          formatter: function(value) {
            return (value).toFixed(0) + '%';
          }
        },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { lineStyle: { color: 'rgba(224, 224, 224, 0.2)' } }
      },
      yAxis: {
        type: 'category',
        data: ['增速'],
        axisLabel: { color: '#e0e0e0' },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      },
      series: [
        {
          name: 'AUM增速分布',
          type: 'boxplot',
          data: singleBoxData,
          itemStyle: {
            color: '#3fa2e9',
            borderColor: '#888'
          }
        }
      ]
    };
    
    // 如果有选中RM的增速数据，添加到图表中
    if (rmAvgGrowth !== undefined) {
      option.series.push({
        name: '理财经理位置',
        type: 'scatter',
        symbolSize: 15,
        data: [[rmAvgGrowth, '增速']],
        itemStyle: { 
          color: '#FF7043',
          borderColor: '#fff',
          borderWidth: 1
        }
      });
      
      // 添加标记线，显示RM在增速分布中的位置
      option.series[0].markLine = {
        silent: true,
        lineStyle: {
          color: '#FF7043',
          type: 'dashed'
        },
        data: [
          {
            xAxis: rmAvgGrowth,
            label: {
              formatter: `${rmId}`,
              position: 'middle',
              color: '#FF7043'
            }
          }
        ]
      };
    }
    
    chart.setOption(option);
    
    // 创建并添加百分位文本容器
    const percentileContainer = document.createElement('div');
    percentileContainer.style.textAlign = 'center';
    percentileContainer.style.color = '#e0e0e0';
    percentileContainer.style.fontSize = '15px';
    percentileContainer.style.marginTop = '5px';
    percentileContainer.innerHTML = rmAvgGrowth !== undefined ? `${rmId} ${percentileText}` : '无数据';
    
    // 将百分位容器添加到图表容器后面
    chartContainer.appendChild(percentileContainer);
    
    // 添加自适应调整
    window.addEventListener('resize', () => chart.resize());
  });
}

// D4: 客户层级AUM增速表现 - 箱线图点评
function updateCustomerTierAumGrowthAnalysis(selectedRM, boxPlotData, selectedRmAvgGrowthByTier, rmDataByTier) {
  // 获取分析元素
  const analysisElem = document.getElementById('customerTierAumGrowthAnalysis');
  if (!analysisElem) {
    console.error("找不到客户层级AUM增速分析元素");
    return;
  }
  
  const rmId = selectedRM.RM_ID;
  
  // 有效的层级 - 从boxPlotData中提取
  const validTiers = boxPlotData.map(data => data[5]);
  
  // 分析RM在各层级的AUM增速表现
  const tierPerformance = {};
  
  validTiers.forEach(tier => {
    const rmAvgGrowth = selectedRmAvgGrowthByTier[tier];
    if (rmAvgGrowth !== undefined) {
      // 获取该层级的所有增速数据
      const tierGrowthRates = rmDataByTier[tier] || [];
      
      // 如果有足够数据计算平均值
      if (tierGrowthRates.length > 0) {
        // 计算该层级所有客户的平均增速
        const avgGrowth = tierGrowthRates.reduce((sum, rate) => sum + rate, 0) / tierGrowthRates.length;
        
        // 计算RM在该层级的表现（相对于平均值的差异）
        const performance = rmAvgGrowth - avgGrowth;
        const performancePercent = (performance * 100).toFixed(2);
        
        tierPerformance[tier] = {
          growth: rmAvgGrowth,
          avgGrowth: avgGrowth,
          performance: performance,
          performancePercent: performancePercent,
          position: performance > 0 ? '高于' : '低于'
        };
      }
    }
  });
  
  // 找出表现最好和最差的层级
  let bestTier = null;
  let worstTier = null;
  let bestPerformance = -Infinity;
  let worstPerformance = Infinity;
  
  Object.keys(tierPerformance).forEach(tier => {
    const perf = tierPerformance[tier].performance;
    
    if (perf > bestPerformance) {
      bestPerformance = perf;
      bestTier = tier;
    }
    
    if (perf < worstPerformance) {
      worstPerformance = perf;
      worstTier = tier;
    }
  });
  
  console.log("客户层级AUM增速分析:", {
    tierPerformance,
    bestTier,
    worstTier,
    bestPerformance,
    worstPerformance
  });
  
  // 生成分析文本
  let analysisText = '';
  
  if (bestTier && worstTier) {
    analysisText = `
      <p>理财经理<span class="highlight">${rmId}</span>在不同客户层级的AUM增速表现如下：</p>
      <p>在<span class="highlight">${bestTier}</span>客户层级中表现最好，平均AUM增速为<span class="highlight">${(tierPerformance[bestTier].growth * 100).toFixed(2)}%</span>，<span class="highlight">${tierPerformance[bestTier].position}</span>同层级平均水平<span class="highlight">${Math.abs(tierPerformance[bestTier].performancePercent)}个百分点</span>。</p>
      <p>在<span class="highlight">${worstTier}</span>客户层级中表现较弱，平均AUM增速为<span class="highlight">${(tierPerformance[worstTier].growth * 100).toFixed(2)}%</span>，<span class="highlight">${tierPerformance[worstTier].position}</span>同层级平均水平<span class="highlight">${Math.abs(tierPerformance[worstTier].performancePercent)}个百分点</span>。</p>
    `;
    
    // 提供针对性建议
    let recommendationText = '';
    
    const highValueTiers = ['30mn+', '6-30Mn', '1-6Mn'].filter(t => validTiers.includes(t));
    const highValuePerformance = highValueTiers.map(t => tierPerformance[t]?.performance || -Infinity);
    const hasPositiveHighValuePerformance = highValuePerformance.some(p => p > 0);
    
    if (hasPositiveHighValuePerformance) {
      const bestHighValueTier = highValueTiers[highValuePerformance.indexOf(Math.max(...highValuePerformance))];
      recommendationText = `
        <p>建议：总结<span class="highlight">${bestHighValueTier}</span>层级客户的成功经验，探究AUM增速较高的原因，将成功策略复制到其他客户层级，特别是<span class="highlight">${worstTier}</span>层级，提升整体资产增长率。同时，关注高价值客户的留存，防止资产流失。</p>
      `;
    } else if (bestPerformance > 0) {
      recommendationText = `
        <p>建议：重点分析<span class="highlight">${bestTier}</span>层级的客户服务策略，将成功经验推广至高价值客户层级，特别需要改善<span class="highlight">${worstTier}</span>层级客户的资产增长表现，制定针对性的资产提升计划。</p>
      `;
    } else {
      recommendationText = `
        <p>建议：全面提升客户资产管理能力，尤其是高价值客户层级。优先改善<span class="highlight">${worstTier}</span>层级的客户服务，制定紧急的资产挽留方案，同时参考行业最佳实践，提高整体客户资产增长率。</p>
      `;
    }
    
    analysisText += recommendationText;
  } else {
    analysisText = `
      <p>暂无足够数据分析理财经理<span class="highlight">${rmId}</span>在各客户层级的AUM增速表现。</p>
    `;
  }
  
  // 直接设置HTML内容
  analysisElem.innerHTML = analysisText;
  console.log("已更新客户层级AUM增速分析");
}


// D5: 客户层级变化桑基图 - 创建视图切换控制
function createSankeyViewControl(container) {
  // 创建一个独立的控制容器
  const controlDiv = document.createElement('div');
  controlDiv.id = 'sankeyViewControl';
  controlDiv.style.textAlign = 'center';
  controlDiv.style.marginBottom = '15px';
  controlDiv.style.marginTop = '10px';
  controlDiv.style.zIndex = '100';
  controlDiv.style.position = 'relative';
  
  // 创建模式选择器HTML
  controlDiv.innerHTML = `
    <div class="mode-selector">
      <button class="mode-btn active" data-mode="count">客户数</button>
      <button class="mode-btn" data-mode="amount">金额</button>
    </div>
  `;
  
  // 将控制容器插入到图表容器之前
  container.parentNode.insertBefore(controlDiv, container);
  
  // 添加样式
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    #sankeyViewControl .mode-selector {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    #sankeyViewControl .mode-btn {
      padding: 6px 15px;
      margin: 0 5px;
      background-color: #091e2c;
      color: #e0e0e0;
      border: 1px solid #3fa2e9;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    #sankeyViewControl .mode-btn.active {
      background-color: #3fa2e9;
      color: white;
      font-weight: bold;
    }
  `;
  document.head.appendChild(styleElement);
}

// D5: 初始化客户层级变化桑基图
function initCustomerTierSankeyChart(selectedRM, rmCustData) {
  if (!selectedRM || !rmCustData || rmCustData.length === 0) {
    console.error("客户层级变化桑基图数据不完整");
    return;
  }
  
  console.log("开始初始化客户层级变化桑基图...");
  
  // 获取当前选中RM的ID
  const rmId = selectedRM.RM_ID;
  
  // 获取图表容器
  const chartContainer = document.getElementById('customerTierSankeyChart');
  if (!chartContainer) {
    console.error("找不到图表容器");
    return;
  }
  
  // 创建视图切换控制
  createSankeyViewControl(chartContainer);
  
  // 默认视图模式
  let currentMode = 'count';
  
  // 定义AUM层级顺序（从高到低）
  const tierOrder = [
    "30mn+", 
    "6-30Mn", 
    "1-6Mn", 
    "300K-1Mn", 
    "50-300K", 
    "0-50K"
  ];
  
  // 定义每个层级的颜色（使用蓝色系）
  const tierColors = {
    "30mn+": '#1a73e8',
    "6-30Mn": '#4B9CD3',
    "1-6Mn": '#13294B',
    "300K-1Mn": '#8FD6E1',
    "50-300K": '#0D47A1',
    "0-50K": '#3fa2e9'
  };
  
  // 筛选当前RM的客户
  const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);
  
  // 绘制桑基图
  function drawSankeyChart(mode) {
    // 清除并重建图表实例
    echarts.dispose(chartContainer);
    const chart = echarts.init(chartContainer);
    
    // 准备桑基图数据
    const nodes = [];
    const links = [];
    
    // 创建节点 - 期初层级
    tierOrder.forEach(tier => {
      nodes.push({ 
        name: `期初-${tier}`,
        itemStyle: {
          color: tierColors[tier]
        }
      });
    });
    
    // 创建节点 - 期末层级
    tierOrder.forEach(tier => {
      nodes.push({ 
        name: `期末-${tier}`,
        itemStyle: {
          color: tierColors[tier]
        }
      });
    });
    
    // 创建桑基图的连接关系
    const flowData = {};
    
    rmCustomers.forEach(cust => {
      const initialTier = cust.AUM_AVG_GROUP_2;
      const finalTier = cust.AUM_AVG_GROUP;
      const initialAum = Number(cust.CUST_AVG_AUM_2 || 0);
      const finalAum = Number(cust.CUST_AVG_AUM || 0);
      const deltaAum = finalAum - initialAum;
      
      // 过滤无效数据
      if (!initialTier || !finalTier || 
          !tierOrder.includes(initialTier) || 
          !tierOrder.includes(finalTier)) {
        return;
      }
      
      const key = `${initialTier}->${finalTier}`;
      
      if (!flowData[key]) {
        flowData[key] = {
          count: 0,
          amount: 0
        };
      }
      
      flowData[key].count++;
      flowData[key].amount += deltaAum;
    });
    
    // 创建连接
    Object.keys(flowData).forEach(key => {
      const [source, target] = key.split('->');
      const value = mode === 'count' ? flowData[key].count : Math.abs(flowData[key].amount);
      
      if (value > 0) {
        const sourceIndex = tierOrder.indexOf(source);
        const targetIndex = tierOrder.indexOf(target);
        
        // 根据升降趋势设置流向颜色
        let flowColor;
        if (targetIndex < sourceIndex) {
          // 升级 - 使用蓝色
          flowColor = '#3fa2e9';
        } else if (targetIndex > sourceIndex) {
          // 降级 - 使用橙色
          flowColor = '#f5222d';
        } else {
          // 持平 - 使用灰色
          flowColor = '#999999';
        }
        
        links.push({
          source: `期初-${source}`,
          target: `期末-${target}`,
          value: value,
          // 保存原始数据用于提示框
          customData: {
            count: flowData[key].count,
            amount: flowData[key].amount
          },
          lineStyle: {
            color: flowColor,
            opacity: 0.6
          },
          emphasis: {
            lineStyle: {
              opacity: 0.9
            }
          }
        });
      }
    });
    
    // 设置图表选项
    const option = {
      backgroundColor: 'transparent',
      title: {
        text: `客户层级变化流向 - ${mode === 'count' ? '客户数' : '金额'}`,
        left: 'center',
        top: 0,
        textStyle: { 
          color: '#e0e0e0', 
          fontSize: 16
        }
      },
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: function(params) {
          if (params.data.source && params.data.target) {
            const sourceLevel = params.data.source.replace('期初-', '');
            const targetLevel = params.data.target.replace('期末-', '');
            const customData = params.data.customData;
            
            // 计算层级变化
            const sourceIndex = tierOrder.indexOf(sourceLevel);
            const targetIndex = tierOrder.indexOf(targetLevel);
            let changeType;
            if (targetIndex < sourceIndex) {
              changeType = '<span style="color: #3fa2e9">升级</span>';
            } else if (targetIndex > sourceIndex) {
              changeType = '<span style="color: #FF7043">降级</span>';
            } else {
              changeType = '<span style="color: #999999">持平</span>';
            }
            
            return `${sourceLevel} → ${targetLevel} (${changeType})<br/>` +
                   `客户数: ${customData.count}人<br/>` +
                   `金额变化: ${formatNumber(customData.amount)}`;
          }
          return params.name.replace('期初-', '').replace('期末-', '');
        }
      },
      grid: {
        left: '-10%',
        right: '0%',  // 增加右侧间距，让期末层级往右移
        top: '70px',
        bottom: '10%'
      },
      series: [
        {
          type: 'sankey',
          data: nodes,
          links: links,
          focusNodeAdjacency: 'allEdges',
          itemStyle: {
            borderWidth: 1,
            borderColor: '#091e2c'
          },
          label: {
            color: '#e0e0e0',
            fontFamily: 'Arial',
            fontSize: 12,
            formatter: function(params) {
              return params.name.replace('期初-', '').replace('期末-', '');
            }
          },
          emphasis: {
            focusNodeAdjacency: true
          },
          layoutIterations: 64,
          nodeWidth: 20,
          nodeGap: 8,
          left: '5%',    // 控制整体桑基图位置
          right: '8%'
        }
      ],
      // 添加标题标注
      graphic: [
        {
          type: 'text',
          left: '5%',
          top: '8px',
          style: {
            text: '期初层级',
            textAlign: 'center',
            fill: '#e0e0e0',
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        {
          type: 'text',
          right: '8%',
          top: '10px',
          style: {
            text: '期末层级',
            textAlign: 'center',
            fill: '#e0e0e0',
            fontSize: 14,
            fontWeight: 'bold'
          }
        }
      ],
      animationDuration: 1500
    };
    
    // 渲染图表
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
    
    // 更新分析
    updateCustomerTierSankeyAnalysis(flowData, mode, rmId);
  }
  
  // 绑定按钮事件
  document.querySelectorAll('#sankeyViewControl .mode-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      // 更新按钮状态
      document.querySelectorAll('#sankeyViewControl .mode-btn').forEach(b => {
        b.classList.remove('active');
      });
      this.classList.add('active');
      
      // 更新图表
      const selectedMode = this.getAttribute('data-mode');
      currentMode = selectedMode;
      drawSankeyChart(selectedMode);
    });
  });
  
  // 初始绘制
  drawSankeyChart(currentMode);
}

// D5: 更新桑基图分析内容
function updateCustomerTierSankeyAnalysis(flowData, mode, rmId) {
  const analysisElem = document.getElementById('customerTierSankeyAnalysis');
  if (!analysisElem) return;
  
  // 分析流向数据
  let maxFlowKey = '';
  let maxFlowValue = 0;
  let totalValue = 0;
  let upgradeValue = 0;
  let downgradeValue = 0;
  let stableValue = 0;
  
  Object.keys(flowData).forEach(key => {
    const [source, target] = key.split('->');
    const value = mode === 'count' ? flowData[key].count : Math.abs(flowData[key].amount);
    
    totalValue += value;
    
    // 比较层级索引
    const sourceIndex = ["30mn+", "6-30Mn", "1-6Mn", "300K-1Mn", "50-300K", "0-50K"].indexOf(source);
    const targetIndex = ["30mn+", "6-30Mn", "1-6Mn", "300K-1Mn", "50-300K", "0-50K"].indexOf(target);
    
    if (targetIndex < sourceIndex) {
      upgradeValue += value;
    } else if (targetIndex > sourceIndex) {
      downgradeValue += value;
    } else {
      stableValue += value;
    }
    
    if (value > maxFlowValue) {
      maxFlowValue = value;
      maxFlowKey = key;
    }
  });
  
  const upgradePercent = (upgradeValue / totalValue * 100).toFixed(1);
  const downgradePercent = (downgradeValue / totalValue * 100).toFixed(1);
  const stablePercent = (stableValue / totalValue * 100).toFixed(1);
  
  // 生成分析文本
  let analysisText = '';
  
  if (mode === 'count') {
    analysisText = `
      <p>理财经理<span class="highlight">${rmId}</span>的客户层级变化分析：</p>
      <p>整体上，有<span class="highlight" style="color: #52c41a;">${upgradePercent}%</span>的客户实现了层级提升，
      <span class="highlight" style="color: #3fa2e9;">${stablePercent}%</span>的客户保持在原层级，
      <span class="highlight" style="color: #ff4d4f;">${downgradePercent}%</span>的客户层级下降。</p>
    `;
  } else {
    analysisText = `
      <p>理财经理<span class="highlight">${rmId}</span>的客户AUM变化分析：</p>
      <p>从资金流向看，<span class="highlight" style="color: #52c41a;">${upgradePercent}%</span>的资金流向更高层级，
      <span class="highlight" style="color: #3fa2e9;">${stablePercent}%</span>的资金保持在原层级，
      <span class="highlight" style="color: #ff4d4f;">${downgradePercent}%</span>的资金流向较低层级。</p>
    `;
  }
  
  // 最大流向分析
  if (maxFlowKey) {
    const [source, target] = maxFlowKey.split('->');
    const sourceIndex = ["30mn+", "6-30Mn", "1-6Mn", "300K-1Mn", "50-300K", "0-50K"].indexOf(source);
    const targetIndex = ["30mn+", "6-30Mn", "1-6Mn", "300K-1Mn", "50-300K", "0-50K"].indexOf(target);
    const changeType = targetIndex < sourceIndex ? '升级' : 
                      targetIndex > sourceIndex ? '降级' : '稳定';
    const changeColor = targetIndex < sourceIndex ? '#52c41a' : 
                       targetIndex > sourceIndex ? '#ff4d4f' : '#3fa2e9';
    
    analysisText += `
      <p>最主要的流向是从<span class="highlight">${source}</span>层级到<span class="highlight">${target}</span>层级(
      <span style="color: ${changeColor}; font-weight: bold;">${changeType}</span>)，
      ${mode === 'count' ? 
        `涉及<span class="highlight">${maxFlowValue}</span>位客户` : 
        `金额达<span class="highlight">${formatNumber(maxFlowValue)}</span>`}，
      占总${mode === 'count' ? '客户数' : '金额'}的<span class="highlight">${(maxFlowValue / totalValue * 100).toFixed(1)}%</span>。</p>
    `;
  }
  
  // 建议
  if (parseFloat(upgradePercent) > parseFloat(downgradePercent)) {
    analysisText += `
      <p style="background: rgba(82, 196, 26, 0.1); padding: 10px; border-radius: 5px; border-left: 4px solid #52c41a;">
      建议：继续保持促进客户层级提升的策略，重点关注现有成功路径的复制和推广。对于仍处于较低层级的客户，可参考主要提升路径制定针对性的升级计划。</p>
    `;
  } else {
    analysisText += `
      <p style="background: rgba(255, 77, 79, 0.1); padding: 10px; border-radius: 5px; border-left: 4px solid #ff4d4f;">
      建议：需要重点关注客户层级下降的原因，特别是主要下降路径。建议开展客户调研，了解资产流失原因，并参考成功提升客户的经营策略，完善客户维护方案。</p>
    `;
  }
  
  analysisElem.innerHTML = analysisText;
}


function loadAUMreasoningModule(selectedRM, rmCustData) {
// 1. 创建模块容器
const container = document.createElement('div');
container.id = 'DModule';
container.innerHTML = `

 <!-- 客户分布分析 - 客户数 & AUM分布 -->
      <div class="chart-container">
        <div class="chart-header">
          <div class="chart-title">
            <i class="fas fa-layer-group"></i> D1.客户数 & AUM分布
          </div>
        </div>
        <div class="chart-flex">
          <div class="chart-area">
            <div style="display: flex; gap: 20px; height: 500px;">
              <div id="customerCountDistributionChart" style="width: 50%; height: 100%;"></div>
              <div id="aumDistributionChart" style="width: 50%; height: 100%;"></div>
            </div>
          </div>
          <div class="chart-analysis">
            <div class="analysis-title">
              <i class="fas fa-lightbulb"></i> 智能分析
            </div>
            <div class="analysis-content" id="customerDistributionAnalysis">
              <p>加载中...</p>
            </div>
          </div>
        </div>
      </div>

       <div class="chart-container">
        <div class="chart-header">
          <div class="chart-title">
            <i class="fas fa-exchange-alt"></i> E3.RM客户结构变化分析
          </div>
        </div>
        <div class="chart-flex">
          <div class="chart-area">
            <div style="display: flex; gap: 10px; height: 500px;">
              <div id="downgradeRateChart" style="width: 25%; height: 100%;"></div>
              <div id="upgradeRateChart" style="width: 25%; height: 100%;"></div>
              <div id="downgradeLossChart" style="width: 25%; height: 100%;"></div>
              <div id="upgradeGainChart" style="width: 25%; height: 100%;"></div>
            </div>
          </div>
          <div class="chart-analysis">
            <div class="analysis-title">
              <i class="fas fa-lightbulb"></i> 智能分析
            </div>
            <div class="analysis-content" id="customerStructureChangeAnalysis">
              <p>加载中...</p>
            </div>
          </div>
        </div>
      </div>

<!-- 添加Tab切换  -->
<div class="chart-container">
  <div class="chart-header">
    <div class="chart-title">
      <i class="fas fa-chart-line"></i> D2.AUM变化原因分析
    </div>
  </div>
  <div id="detailedComparisonControl" style="text-align: center; margin-bottom: 15px;">
    <div class="mode-selector">
      <button id="aumTab" class="mode-btn active" data-mode="aum">AUM金额</button>
      <button id="customerTab" class="mode-btn" data-mode="customer">客户数</button>
    </div>
  </div>
  <div class="chart-flex">
    <div class="chart-area">
      <div id="aumChangeWaterfallChart" style="width: 100%; height: 500px;"></div>
    </div>
    <div class="chart-analysis">
      <div class="analysis-title">
        <i class="fas fa-lightbulb"></i> 智能分析
      </div>
      <div class="analysis-content" id="aumChangeWaterfallAnalysis">
        <p>加载中...</p>
      </div>
    </div>
  </div>
</div>



 <!-- AUM转移矩阵 (D3) -->
            <div class="chart-container">
              <div class="chart-header">
                <div class="chart-title">
                  <i class="fas fa-chart-scatter"></i> D3.AUM转移矩阵
                </div>
              </div>
              <div class="chart-flex">
                <div class="chart-area">
                  <div id="aumLossScatterChart" style="width: 100%; height: 500px;"></div>
                </div>
                <div class="chart-analysis">
                  <div class="analysis-title">
                    <i class="fas fa-lightbulb"></i> 智能分析
                  </div>
                  <div class="analysis-content" id="aumLossScatterAnalysis">
                    <p>加载中...</p>
                  </div>
                </div>
              </div>
            </div>
      
  <!-- AUM流失分布散点图 (D4) -->
      <div class="chart-container">
        <div class="chart-header">
          <div class="chart-title">
            <i class="fas fa-chart-scatter"></i> D4.AUM流失分布散点图(流失分位数)
          </div>
        </div>
        <div class="chart-flex">
          <div class="chart-area">
            <div id="aumLossDistributionChart" style="width: 100%; height: 500px;"></div>
          </div>
          <div class="chart-analysis">
            <div class="analysis-title">
              <i class="fas fa-lightbulb"></i> 智能分析
            </div>
            <div class="analysis-content" id="aumLossDistributionAnalysis">
              <p>加载中...</p>
            </div>
          </div>
        </div>
      </div>

            <div class="chart-container">
        <div class="chart-header">
          <div class="chart-title">
            <i class="fas fa-project-diagram"></i> D5.客户层级变化桑基图
          </div>
        </div>
        <div class="chart-flex">
          <div class="chart-area">
            <div id="customerTierSankeyChart" style="width: 100%; height: 500px;"></div>
          </div>
          <div class="chart-analysis">
            <div class="analysis-title">
              <i class="fas fa-lightbulb"></i> 智能分析
            </div>
            <div class="analysis-content" id="customerTierSankeyAnalysis">
              <p>加载中...</p>
            </div>
          </div>
        </div>
      </div>

            <!-- 客户层级AUM增速表现 (D6) -->
            <div class="chart-header">
              <div class="chart-title">
                <i class="fas fa-chart-line"></i> D6.客户层级AUM增速表现
              </div>
            </div>
            <div class="chart-flex">
              <div class="chart-area">
                <div id="customerTierAumGrowthChart" style="width: 100%; height: 720px;"></div>
              </div>
              <div class="chart-analysis">
                <div class="analysis-title">
                  <i class="fas fa-lightbulb"></i> 智能分析
                </div>
                <div class="analysis-content" id="customerTierAumGrowthAnalysis">
                  <p>加载中...</p>
                </div>
              </div>
            </div>
          </div>
`;
const mainContent = document.getElementById('mainContent');
mainContent.appendChild(container);

// 添加样式
const style = document.createElement('style');
style.textContent = `
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
`;
document.head.appendChild(style);

// 初始化Tab
initTabs();

// 默认显示AUM金额视图
initCustomerDistributionCharts(selectedRM, rmCustData);

initCustomerStructureChangeCharts(selectedRM, rmCustData);

initAumChangeWaterfallChart(selectedRM, rmCustData);

initAumLossDistributionChart(selectedRM, rmCustData);

initAumLossScatterChart(selectedRM, rmCustData);
initCustomerTierSankeyChart(selectedRM, rmCustData);

initCustomerTierAumGrowthTrend(selectedRM, rmCustData);


// 存储当前数据到全局变量，便于切换视图时使用
window.currentSelectedRM = selectedRM;
window.currentRmCustData = rmCustData;
}

export function loadDModule(selectedRM, rmCustData) {
// 清空主内容区
const mainContent = document.getElementById('mainContent');
mainContent.innerHTML = '';

// 添加模块标题
const titleContainer = document.createElement('div');
titleContainer.className = 'section-title animate-fade';
titleContainer.innerHTML = `
  <i class="fas fa-search"></i> 规模归因
`;
mainContent.appendChild(titleContainer);

loadAUMreasoningModule(selectedRM, rmCustData);
}