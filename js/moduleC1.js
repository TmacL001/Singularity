// js/moduleC1.js - 收入归因-收入结构模块

// 辅助函数：格式化数字
function formatCurrency(value) {
    return Number(value).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatPercent(value) {
    return Number(value).toFixed(1);
}


function formatNumber(value) {
  const num = Number(value);
  if (isNaN(num)) return '0';
  
  if (Math.abs(num) >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  return num.toFixed(2);
  }


// 计算近6个月平均增长率
function calculateGrowthRate(data) {
    if (!data || data.length < 2) return 0;
    
    // 避免除以零错误
    const filteredData = data.filter(item => item.value !== undefined && item.value !== null);
    if (filteredData.length < 2) return 0;
    
    // 计算月环比变化率
    const changes = [];
    for (let i = 1; i < filteredData.length; i++) {
      if (filteredData[i-1].value > 0) {
        changes.push((filteredData[i].value - filteredData[i-1].value) / filteredData[i-1].value);
      }
    }
    
    if (changes.length === 0) return 0;
    
    // 返回平均环比增长率（%）
    return (changes.reduce((sum, val) => sum + val, 0) / changes.length) * 100;
}


// C1.1 收入结构 - 旭日图
function initRevenueStructureCharts(selectedRM) {
  console.log("初始化收入结构图表，选中理财经理:", selectedRM);
  
  if (!selectedRM) {
    console.error("未选择理财经理或数据为空");
    return {};
  }
  
  // 使用月度数据累加计算各类收入
  let nonInterestRevenue = 0; // 非利息收入(中间业务)
  let depositInterestRevenue = 0; // 存款利息收入
  let loanInterestRevenue = 0; // 贷款利息收入
  let corporateRevenue = 0; // 公司收入
  
  // 累加6个月数据
  for (let i = 1; i <= 6; i++) {
    nonInterestRevenue += Number(selectedRM[`RM_Mrev_aum_${i}`] || 0);
    depositInterestRevenue += Number(selectedRM[`RM_Mrev_dpt_${i}`] || 0);
    loanInterestRevenue += Number(selectedRM[`RM_Mrev_crt_${i}`] || 0);
    corporateRevenue += Number(selectedRM[`RM_Mrev_cpt_${i}`] || 0);
  }
  
  // 利息收入 = 存款利息收入 + 贷款利息收入
  const interestRevenue = depositInterestRevenue + loanInterestRevenue;
  
  // 零售收入 = 非利息收入 + 利息收入
  const retailRevenue = nonInterestRevenue + interestRevenue;
  
  // 总收入 = 零售收入 + 公司收入
  const totalRevenue = retailRevenue + corporateRevenue;
  
  // 计算占比
  const retailPercent = totalRevenue > 0 ? (retailRevenue / totalRevenue * 100) : 0;
  const corporatePercent = totalRevenue > 0 ? (corporateRevenue / totalRevenue * 100) : 0;
  
  const nonInterestPercent = retailRevenue > 0 ? (nonInterestRevenue / retailRevenue * 100) : 0;
  const interestPercent = retailRevenue > 0 ? (interestRevenue / retailRevenue * 100) : 0;
  
  const depositInterestPercent = interestRevenue > 0 ? (depositInterestRevenue / interestRevenue * 100) : 0;
  const loanInterestPercent = interestRevenue > 0 ? (loanInterestRevenue / interestRevenue * 100) : 0;
  
  // 初始化图表
  const chart = echarts.init(document.getElementById('selectedRMRevenueChart'));
  
  // 关键：使用简单的饼图+自定义图例，而不是旭日图
  const option = {
    title: {
      text: `${selectedRM.RM_ID || '当前理财经理'}收入结构`,
      left: 'center',
      top: 0,
      textStyle: { color: '#e0e0e0', fontSize: 14 }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    // 显式添加图例配置
    legend: {
      type: 'plain', // 使用普通图例
      orient: 'vertical',
      right: '5%',
      top: 'middle',
      align: 'left',
      itemGap: 10,
      itemWidth: 15,
      itemHeight: 15,
      textStyle: {
        color: '#e0e0e0'
      },
      data: ['零售收入', '公司收入', '利息收入', '非利息收入', '存款利息收入', '贷款利息收入']
    },
    // 使用多个饼图系列，替代旭日图，确保图例正确显示
    series: [
      // 第一层：零售收入与公司收入
      {
        name: '总收入',
        type: 'pie',
        radius: ['15%', '35%'],
        center: ['40%', '50%'],
        data: [
          { name: '零售收入', value: retailRevenue, itemStyle: { color: '#4B9CD3' } },
          { name: '公司收入', value: corporateRevenue, itemStyle: { color: '#E63946' } }
        ],
        label: {
          formatter: '{b}\n{d}%',
          color: '#fff',
          fontSize: 12
        },
        labelLine: {
          length: 10,
          length2: 10
        }
      },
      // 第二层：利息收入与非利息收入
      {
        name: '零售收入',
        type: 'pie',
        radius: ['40%', '55%'],
        center: ['40%', '50%'],
        data: [
          { name: '利息收入', value: interestRevenue, itemStyle: { color: '#13294B' } },
          { name: '非利息收入', value: nonInterestRevenue, itemStyle: { color: '#1f48c5' } }
        ],
        label: {
          formatter: '{b}\n{d}%',
          color: '#fff',
          fontSize: 12
        }
      },
      // 第三层：存款利息收入与贷款利息收入
      {
        name: '利息收入',
        type: 'pie',
        radius: ['60%', '75%'],
        center: ['40%', '50%'],
        data: [
          { name: '存款利息收入', value: depositInterestRevenue, itemStyle: { color: '#3fa2e9' } },
          { name: '贷款利息收入', value: loanInterestRevenue, itemStyle: { color: '#8FD6E1' } }
        ],
        label: {
          formatter: '{b}\n{d}%',
          color: '#fff',
          fontSize: 12
        }
      }
    ]
  };
  
  // 应用图表设置
  chart.setOption(option);
  
  // 注册窗口调整大小事件
  window.addEventListener('resize', () => chart.resize());
  
  // 返回计算好的数据供分析使用
  return {
    selectedRM: {
      aum: nonInterestRevenue / 10000, // 非利息收入(中间业务)
      dpt: depositInterestRevenue / 10000, // 存款利息收入
      crt: loanInterestRevenue / 10000, // 贷款利息收入
      cpt: corporateRevenue / 10000, // 公司收入
      total: totalRevenue / 10000,
      aumPercent: nonInterestPercent.toFixed(1),
      dptPercent: depositInterestPercent.toFixed(1),
      crtPercent: loanInterestPercent.toFixed(1),
      cptPercent: corporatePercent.toFixed(1)
    }
  };
}

// C1.2 收入分解 - 桑基图
function initRevenueBreakdownSankey(selectedRM) {
    const chart = echarts.init(document.getElementById('revenueBreakdownSankey'));
    
    // 计算六个月的汇总数据
    let totalRevenue = 0;
    let corporateRevenue = 0;
    let retailCreditRevenue = 0;
    let depositFTPRevenue = 0;
    let intermediaryRevenue = 0;
    
    // 第二层分解数据
    let currentDepositFTP = 0;
    let timeDepositFTP = 0;
    let wmRevenue = 0;
    let fundRevenue = 0;
    let insuranceRevenue = 0;
    
    // 汇总6个月数据
    for (let i = 1; i <= 6; i++) {
      // 总收入
      totalRevenue += Number(selectedRM[`RM_Mrev_${i}`] || 0);
      
      // 第一层分解
      corporateRevenue += Number(selectedRM[`RM_Mrev_cpt_${i}`] || 0);
      retailCreditRevenue += Number(selectedRM[`RM_Mrev_crt_${i}`] || 0);
      depositFTPRevenue += Number(selectedRM[`RM_Mrev_dpt_${i}`] || 0);
      intermediaryRevenue += Number(selectedRM[`RM_Mrev_aum_${i}`] || 0);
      
      // 第二层分解
      currentDepositFTP += Number(selectedRM[`RM_Mrev_cdpt_${i}`] || 0);
      timeDepositFTP += Number(selectedRM[`RM_Mrev_ddpt_${i}`] || 0);
      wmRevenue += Number(selectedRM[`RM_Mrev_wm_${i}`] || 0);
      fundRevenue += Number(selectedRM[`RM_Mrev_fund_${i}`] || 0);
      insuranceRevenue += Number(selectedRM[`RM_Mrev_inr_${i}`] || 0);
    }
    
    // 转换为万元
    totalRevenue = totalRevenue / 10000;
    corporateRevenue = corporateRevenue / 10000;
    retailCreditRevenue = retailCreditRevenue / 10000;
    depositFTPRevenue = depositFTPRevenue / 10000;
    intermediaryRevenue = intermediaryRevenue / 10000;
    currentDepositFTP = currentDepositFTP / 10000;
    timeDepositFTP = timeDepositFTP / 10000;
    wmRevenue = wmRevenue / 10000;
    fundRevenue = fundRevenue / 10000;
    insuranceRevenue = insuranceRevenue / 10000;
    
    // 定义节点
    const nodes = [
      // 第一层
      { name: '总收入', itemStyle: { color: '#1a73e8' } },
      
      // 第二层
      { name: '中间业务收入', itemStyle: { color: '#4B9CD3' } },
      { name: '存款收入', itemStyle: { color: '#13294B' } },
      { name: '零售信贷收入', itemStyle: { color: '#8FD6E1' } },
      { name: '公司收入', itemStyle: { color: '#0D47A1' } },
      
      // 第三层
      { name: '理财中收', itemStyle: { color: '#3fa2e9' } },
      { name: '基金中收', itemStyle: { color: '#66c7ff' } },
      { name: '保险中收', itemStyle: { color: '#1f48c5' } },
      { name: '活期存款收入', itemStyle: { color: '#3fa2e9' } },
      { name: '定期存款收入', itemStyle: { color: '#1f48c5' } }
    ];
    
    // 定义链接
    const links = [
      // 第一层到第二层的链接
      { source: '总收入', target: '中间业务收入', value: intermediaryRevenue },
      { source: '总收入', target: '存款收入', value: depositFTPRevenue },
      { source: '总收入', target: '零售信贷收入', value: retailCreditRevenue },
      { source: '总收入', target: '公司收入', value: corporateRevenue },
      
      // 第二层到第三层的链接
      { source: '中间业务收入', target: '理财中收', value: wmRevenue },
      { source: '中间业务收入', target: '基金中收', value: fundRevenue },
      { source: '中间业务收入', target: '保险中收', value: insuranceRevenue },
      { source: '存款收入', target: '活期存款收入', value: currentDepositFTP },
      { source: '存款收入', target: '定期存款收入', value: timeDepositFTP }
    ];
    
    // 图表配置
    const option = {
      title: {
        text: '收入分解',
        show: false
      },
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: function(params) {
          if (params.data.source && params.data.target) {
            return `${params.data.source} → ${params.data.target}: ${formatCurrency(params.data.value)} 万元`;
          } else {
            return `${params.name}`;
          }
        }
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
          lineStyle: {
            color: 'source',
            curveness: 0.5,
            opacity: 0.5
          },
          label: {
            color: '#e0e0e0',
            fontFamily: 'Arial',
            fontSize: 12,
            formatter: function(params) {
              // 为节点添加金额信息
              let totalValue = 0;
              links.forEach(link => {
                if (link.target === params.name) {
                  totalValue = link.value;
                }
              });
              
              if (params.name === '总收入') {
                return `${params.name}: ${formatCurrency(totalRevenue)} 万元`;
              } else if (totalValue > 0) {
                return `${params.name}: ${formatCurrency(totalValue)} 万元`;
              }
              return params.name;
            }
          },
          emphasis: {
            focusNodeAdjacency: true
          },
          layoutIterations: 64,
          nodeWidth: 20,
          nodeGap: 8
        }
      ],
      animationDuration: 1500
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
    
    // 更新分析
    updateRevenueBreakdownAnalysis(selectedRM, {
      totalRevenue,
      corporateRevenue,
      retailCreditRevenue,
      depositFTPRevenue,
      intermediaryRevenue,
      currentDepositFTP,
      timeDepositFTP,
      wmRevenue,
      fundRevenue,
      insuranceRevenue
    });
    
    return {
      totalRevenue,
      corporateRevenue,
      retailCreditRevenue,
      depositFTPRevenue,
      intermediaryRevenue,
      currentDepositFTP,
      timeDepositFTP,
      wmRevenue,
      fundRevenue,
      insuranceRevenue
    };
  }

// E1: 客户层级分析 - 客户数 & 收入分布-数据
function initCustomerTierDistribution(selectedRM, rmCustData) {
  if (!selectedRM || !rmCustData || rmCustData.length === 0) {
    console.error("客户层级分析数据不完整");
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
  const customerData = {
    rm: initTierData2(tierOrder),
    group: initTierData2(tierOrder)
  };
  
  // 统计当前RM的客户分布
  let rmTotalCustomers = 0;
  let rmTotalRevenue = 0;
  
  rmCustomers.forEach(cust => {
    const tier = cust.AUM_AVG_GROUP;
    if (tier && tierOrder.includes(tier)) {
      // 客户数量统计
      customerData.rm.count[tier]++;
      rmTotalCustomers++;
      
      // 收入统计
      const revenue = Number(cust.cust_tot_rev_1 || 0);
      customerData.rm.revenue[tier] += revenue;
      rmTotalRevenue += revenue;
    }
  });
  
  // 统计同组RM的客户分布
  let groupTotalCustomers = 0;
  let groupTotalRevenue = 0;
  
  groupCustomers.forEach(cust => {
    const tier = cust.AUM_AVG_GROUP;
    if (tier && tierOrder.includes(tier)) {
      // 客户数量统计
      customerData.group.count[tier]++;
      groupTotalCustomers++;
      
      // 收入统计
      const revenue = Number(cust.cust_tot_rev_1 || 0);
      customerData.group.revenue[tier] += revenue;
      groupTotalRevenue += revenue;
    }
  });
  
  // 计算占比
  tierOrder.forEach(tier => {
    // RM客户数占比
    customerData.rm.countPercent[tier] = rmTotalCustomers > 0 
      ? (customerData.rm.count[tier] / rmTotalCustomers * 100) 
      : 0;
    
    // RM收入占比
    customerData.rm.revenuePercent[tier] = rmTotalRevenue > 0 
      ? (customerData.rm.revenue[tier] / rmTotalRevenue * 100) 
      : 0;
    
    // 同组客户数占比
    customerData.group.countPercent[tier] = groupTotalCustomers > 0 
      ? (customerData.group.count[tier] / groupTotalCustomers * 100) 
      : 0;
    
    // 同组收入占比
    customerData.group.revenuePercent[tier] = groupTotalRevenue > 0 
      ? (customerData.group.revenue[tier] / groupTotalRevenue * 100) 
      : 0;
  });

  // 初始化两个图表-左边图表和右边图表
  initCustomerCountChart(customerData, tierOrder, rmId, rmGroup);
  initCustomerRevenueChart(customerData, tierOrder, rmId, rmGroup);
  
  // 更新分析内容-点评
  updateCustomerTierAnalysis(customerData, tierOrder, rmId, rmGroup, rmTotalCustomers, rmTotalRevenue);

  return customerData;
}
// E1:初始化层级数据结构
function initTierData2(tierOrder) {

  const data = {
    count: {},
    countPercent: {},
    revenue: {},
    revenuePercent: {}
  };
  
  tierOrder.forEach(tier => {
    data.count[tier] = 0;
    data.countPercent[tier] = 0;
    data.revenue[tier] = 0;
    data.revenuePercent[tier] = 0;
 
  });
  
  return data;
}

// E1:初始化客户数占比图表-左边图表
function initCustomerCountChart(data, tierOrder, rmId, rmGroup) {

const chart = echarts.init(document.getElementById('customerCountChart'));

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
      return `${params[0].name}客户:<br/>
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
        color: '#4B9CD3'
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
        color: '#FF7043' 
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

//  E1:初始化客户收入占比图表-右边图表
function initCustomerRevenueChart(data, tierOrder, rmId, rmGroup) {
  const chart = echarts.init(document.getElementById('customerRevenueChart'));
  
  const rmData = tierOrder.map(tier => data.rm.revenuePercent[tier]);
  const groupData = tierOrder.map(tier => data.group.revenuePercent[tier]);
  
  // 对数据进行调整，使得蓝色和红色条形图分别位于左右两侧
  // 将同组平均值取反，这样可以向左显示
  const adjustedGroupData = groupData.map(val => -val);
  
  const option = {
    title: {
      text: '收入占比分布',
      left: 'center',
      top: 0,
      textStyle: { color: '#e0e0e0', fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        // 确保显示正确的值（取反后的需要再次取反）
        const groupValue = params.length > 1 ? Math.abs(params[1].value) : 0;
        return `${params[0].name}客户:<br/>
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
          color: '#4B9CD3'
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
          color: '#FF7043'
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

//  E1:客户层级分析-点评分析
function updateCustomerTierAnalysis(data, tierOrder, rmId, rmGroup, totalCustomers, totalRevenue) {
  const analysisElem = document.getElementById('customerTierAnalysis');
  if (!analysisElem) return;
  
  // 找出RM客户数最多的层级
  let maxCountTier = tierOrder[0];
  tierOrder.forEach(tier => {
    if (data.rm.countPercent[tier] > data.rm.countPercent[maxCountTier]) {
      maxCountTier = tier;
    }
  });

  // 找出RM收入最高的层级
  let maxRevenueTier = tierOrder[0];
  tierOrder.forEach(tier => {
    if (data.rm.revenuePercent[tier] > data.rm.revenuePercent[maxRevenueTier]) {
      maxRevenueTier = tier;
    }
  });
  
  // 分析主要客户差异
  let diffAnalysis = '';
  let strategyRecommendation = '';
  
  // 计算RM与同组的客户层级差异
  const tierDiffs = {};
  let maxDiffTier = tierOrder[0];
  let maxDiffValue = 0;
  
  tierOrder.forEach(tier => {
    const countDiff = data.rm.countPercent[tier] - data.group.countPercent[tier];
    tierDiffs[tier] = countDiff;
    
    if (Math.abs(countDiff) > Math.abs(maxDiffValue)) {
      maxDiffTier = tier;
      maxDiffValue = countDiff;
    }
  });
  
  if (maxDiffValue > 0) {
    diffAnalysis = `相比同组RM，<span class="highlight">${maxDiffTier}</span>客户占比<span class="highlight">高出${formatPercent(maxDiffValue)}%</span>`;
  } else {
    diffAnalysis = `相比同组RM，<span class="highlight">${maxDiffTier}</span>客户占比<span class="highlight">低${formatPercent(Math.abs(maxDiffValue))}%</span>`;
  }
  
  // 分析收入与客户数匹配度
  const revCountRatio = {};
  let bestEfficiencyTier = '';
  let bestEfficiencyRatio = 0;
  let worstEfficiencyTier = '';
  let worstEfficiencyRatio = Infinity;
  
  tierOrder.forEach(tier => {
    if (data.rm.countPercent[tier] > 0) {
      revCountRatio[tier] = data.rm.revenuePercent[tier] / data.rm.countPercent[tier];
      
      if (revCountRatio[tier] > bestEfficiencyRatio) {
        bestEfficiencyRatio = revCountRatio[tier];
        bestEfficiencyTier = tier;
      }
      
      if (revCountRatio[tier] < worstEfficiencyRatio) {
        worstEfficiencyRatio = revCountRatio[tier];
        worstEfficiencyTier = tier;
      }
    }
  });
  
  // 定义高价值客户层级（通常是资产规模最大的两个层级）
  const highValueTiers = tierOrder.slice(0, 2);
  
  // 制定推荐策略
  if (highValueTiers.includes(bestEfficiencyTier)) {
    // 如果最高效率的是高价值客户
    if (data.rm.countPercent[bestEfficiencyTier] < data.group.countPercent[bestEfficiencyTier]) {
      strategyRecommendation = `建议重点拓展<span class="highlight">${bestEfficiencyTier}</span>高价值客户，提升整体收入效率`;
    } else {
      strategyRecommendation = `建议持续深耕<span class="highlight">${bestEfficiencyTier}</span>优质客户，进一步提高客户贡献度`;
    }
  } else if (highValueTiers.includes(worstEfficiencyTier)) {
    // 如果最低效率的是高价值客户
    strategyRecommendation = `需提升<span class="highlight">${worstEfficiencyTier}</span>客户的收入贡献，开展针对性营销活动`;
  } else {
    // 检查高价值客户整体占比
    const rmHighValuePercent = highValueTiers.reduce((sum, tier) => sum + data.rm.countPercent[tier], 0);
    const groupHighValuePercent = highValueTiers.reduce((sum, tier) => sum + data.group.countPercent[tier], 0);
    
    if (rmHighValuePercent < groupHighValuePercent) {
      strategyRecommendation = `建议增加高净值<span class="highlight">${highValueTiers.join('/')}</span>客户占比，优化客户结构，提升整体收入`;
    } else {
      strategyRecommendation = `客户结构较为均衡，建议关注<span class="highlight">${worstEfficiencyTier}</span>客户的转化提升`;
    }
  }

  // 生成分析文本
  analysisElem.innerHTML = `
    <p>理财经理<span class="highlight">${rmId}</span>共管理<span class="highlight">${totalCustomers}</span>位客户，
       客户主要集中在<span class="highlight">${maxCountTier}</span>层级，占比<span class="highlight">${formatPercent(data.rm.countPercent[maxCountTier])}%</span>。</p>
    <p>收入主要来源于<span class="highlight">${maxRevenueTier}</span>层级客户，贡献了<span class="highlight">${formatPercent(data.rm.revenuePercent[maxRevenueTier])}%</span>的收入。</p>
    <p>${diffAnalysis}，
       且<span class="highlight">${bestEfficiencyTier}</span>层级客户的收入效率最高，<span class="highlight">${worstEfficiencyTier}</span>层级客户的收入效率最低。</p>
    <p>建议：${strategyRecommendation}。</p>
  `;
}


// E2: 客户收入变化原因分析 - Waterfall图
function initCustomerRevenueWaterfallChart(selectedRM, rmCustData) {
  if (!selectedRM || !rmCustData || rmCustData.length === 0) {
    console.error("客户收入变化分解图数据不完整");
    return;
  }
  
  // 获取当前选中RM的ID
  const rmId = selectedRM.RM_ID;
  
  // 筛选当前RM的客户
  const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);
  
  // 计算期初总收入
  const initialTotalRevenue = rmCustomers.reduce((sum, cust) => sum + Number(cust.CUST_AVG_REV_2 || 0), 0);
  
  // 计算期末总收入
  const finalTotalRevenue = rmCustomers.reduce((sum, cust) => sum + Number(cust.CUST_AVG_REV || 0), 0);
  
  // 总收入变化
  const totalChange = finalTotalRevenue - initialTotalRevenue;
  
  // 按CUST_AUM_STATUS_QUO_AVG分组，计算各组收入变化
  const statusGroups = {};
  
  rmCustomers.forEach(cust => {
    const status = cust.CUST_AUM_STATUS_QUO_AVG || '未分类';
    const revenueChange = Number(cust.CUST_AVG_REV || 0) - Number(cust.CUST_AVG_REV_2 || 0);
    
    if (!statusGroups[status]) {
      statusGroups[status] = {
        change: 0,
        count: 0
      };
    }
    
    statusGroups[status].change += revenueChange;
    statusGroups[status].count += 1;
  });
  
  console.log("收入变化分组:", statusGroups);
  
  // 准备Waterfall图的数据
  const categories = ['期初收入'];
  const values = [initialTotalRevenue];
  const itemStyles = [{ color: '#3fa2e9' }]; // 期初收入-蓝色
  
  // 变化贡献
  let runningTotal = initialTotalRevenue;
  
  // 按收入变化绝对值从大到小排序
  const sortedStatuses = Object.keys(statusGroups).sort((a, b) => 
    Math.abs(statusGroups[b].change) - Math.abs(statusGroups[a].change)
  );
  
  sortedStatuses.forEach(status => {
    const change = statusGroups[status].change;
    const count = statusGroups[status].count;
    
    // 忽略变化很小的类别
    if (Math.abs(change) < 0.01) return;
    
    categories.push(`${status}(${count}人)`);
    values.push(change);
    
    // 根据CUST_AUM_STATUS_QUO_AVG的值和变化方向来分配颜色
    // 'Upgrade'或'Upward'类别使用橙色(#FF7043)，其他情况下：正向变化为蓝色，负向变化为红色
    if (status === 'Upgrade' || status === 'Upward') {
      itemStyles.push({ color: '#FF7043' }); // 橙色
    } else {
      itemStyles.push({
        color: change >= 0 ? '#3fa2e9' : '#FF7043' // 正向为蓝色(#3fa2e9)，负向为橙色
      });
    }
    
    runningTotal += change;
  });
  
  // 添加期末收入
  categories.push('期末收入');
  values.push(finalTotalRevenue);
  itemStyles.push({ color: '#3fa2e9' }); // 期末收入-蓝色
  
  // 初始化图表
  const chart = echarts.init(document.getElementById('revenueWaterfallChart'));
  
  const option = {
    title: {
      text: '客户收入变化原因分析',
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
          return `期初总收入: ${formatNumber(data.value)}`;
        } else if (data.dataIndex === categories.length - 1) {
          return `期末总收入: ${formatNumber(data.value)}`;
        } else {
          const change = data.value;
          const changePercent = (change / initialTotalRevenue * 100).toFixed(1);
          return `${data.name}<br>` +
                 `收入变化: ${formatNumber(change)}<br>` +
                 `占期初收入比例: ${changePercent}%`;
        }
      }
    },
    legend: {
      data: ['收入变化'],
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
      name: '收入',
      nameLocation: 'middle',
      nameGap: 50,
      axisLabel: {
        color: '#e0e0e0',
        formatter: function(value) {
          if (value >= 10000) {
            return (value / 10000).toFixed(0) + 'w';
          }
          return value;
        }
      }, 
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false} 
    },
    series: [
      {
        name: '收入变化',
        type: 'bar',
        stack: 'Total',
        label: {
          show: true,
          position: 'top',
          color: '#e0e0e0',
          formatter: function(params) {
            if (params.dataIndex === 0 || params.dataIndex === categories.length - 1) {
              return formatNumber(params.value);
            } else {
              return (params.value >= 0 ? '+' : '') + formatNumber(params.value);
            }
          }
        },
        data: values.map((value, index) => ({
          value: value,
          itemStyle: itemStyles[index]
        }))
      }
    ],
    // 去除横线
    splitLine: { show: false },
    animationDuration: 1500
  };
  
  chart.setOption(option);
  
  // 更新分析内容
  updateRevenueWaterfallAnalysis(initialTotalRevenue, finalTotalRevenue, statusGroups, rmId);
  
  window.addEventListener('resize', () => chart.resize());
  }
  
  // E2: 更新客户收入变化分析-- Waterfall图
  function updateRevenueWaterfallAnalysis(initialRevenue, finalTotalRevenue, statusGroups, rmId) {
  const analysisElem = document.getElementById('revenueWaterfallAnalysis');
  if (!analysisElem) return;
  
  // 计算总变化及百分比
  const totalChange = finalTotalRevenue - initialRevenue;
  const changePercent = (totalChange / initialRevenue * 100).toFixed(1);
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
    <p>理财经理<span class="highlight">${rmId}</span>的客户收入从期初的<span class="highlight">${formatNumber(initialRevenue)}</span>
    ${isIncrease ? '增长' : '减少'}至<span class="highlight">${formatNumber(finalTotalRevenue)}</span>，
    变化<span class="highlight">${isIncrease ? '+' : ''}${formatNumber(totalChange)} (${changePercent}%)</span>。</p>
  `;
  
  if (maxPositiveGroup && maxPositiveChange > 0) {
    analysisText += `
      <p>收入增长主要来源于<span class="highlight">${maxPositiveGroup}</span>客户群体，
      贡献了<span class="highlight">${formatNumber(maxPositiveChange)}</span>的收入增长，
      占总正向贡献的<span class="highlight">${positiveContribution}%</span>。</p>
    `;
  }
  
  if (maxNegativeGroup && maxNegativeChange < 0) {
    analysisText += `
      <p>收入减少主要来自<span class="highlight">${maxNegativeGroup}</span>客户群体，
      造成了<span class="highlight">${formatNumber(maxNegativeChange)}</span>的收入损失，
      占总负向影响的<span class="highlight">${negativeContribution}%</span>。</p>
    `;
  }
  
  // 提供建议
  if (isIncrease) {
    if (maxNegativeGroup && maxNegativeChange < 0) {
      analysisText += `
        <p>建议：继续保持<span class="highlight">${maxPositiveGroup}</span>客户群体的良好发展，
        同时关注<span class="highlight">${maxNegativeGroup}</span>客户群体的收入下滑问题，
        制定针对性策略减少收入流失。</p>
      `;
    } else {
      analysisText += `
        <p>建议：各客户群体收入表现均呈正向发展，建议继续保持当前经营策略，
        可重点关注<span class="highlight">${maxPositiveGroup}</span>客户群体，进一步扩大收入增长。</p>
      `;
    }
  } else {
    if (maxPositiveGroup && maxPositiveChange > 0) {
      analysisText += `
        <p>建议：虽然整体收入下滑，但<span class="highlight">${maxPositiveGroup}</span>客户群体表现良好，
        建议分析其成功经验，并重点解决<span class="highlight">${maxNegativeGroup}</span>客户群体的收入问题，
        遏制收入下滑趋势。</p>
      `;
    } else {
      analysisText += `
        <p>建议：收入全面下滑，情况较为严峻，建议优先解决<span class="highlight">${maxNegativeGroup}</span>
        客户群体的收入问题，制定紧急干预措施，扭转收入下滑趋势。</p>
      `;
    }
  }
  
  // 设置分析内容
  analysisElem.innerHTML = analysisText;
  }
  
  // E3- 初始化收入分布热力图-Heatmap-数据
  function initIncomeDistributionHeatmap(selectedRM, rmCustData) {
  if (!selectedRM || !rmCustData || rmCustData.length === 0) {
    console.error("收入分布热力图数据不完整");
    return;
  }
  
  console.log("开始初始化收入分布热力图...");
  
  // 获取当前选中RM的ID
  const rmId = selectedRM.RM_ID;
  
  // 定义客户层级顺序（从高到低）- 纵轴
  const tierOrder = [
    "30mn+", 
    "6-30Mn", 
    "1-6Mn", 
    "300K-1Mn", 
    "50-300K", 
    "0-50K"
  ];
  
  // 定义收入分位数 - 横轴
  const incomePercentiles = [
    "Bottom 12.5%",
    "12.5-25%",
    "25-37.5%",
    "37.5-50%",
    "50-62.5%",
    "62.5-75%",
    "75-87.5%",
    "Top 12.5%"
  ];
  
  // 1. 计算所有客户收入的分位数边界
  const allCustomersRevenue = rmCustData.map(cust => Number(cust.CUST_AVG_REV || 0)).filter(rev => rev > 0);
  allCustomersRevenue.sort((a, b) => a - b);
  
  const percentileBoundaries = [];
  for (let i = 1; i <= 8; i++) {
    const index = Math.floor(allCustomersRevenue.length * i / 8) - 1;
    percentileBoundaries.push(allCustomersRevenue[Math.max(0, index)]);
  }
  
  console.log("收入分位数边界:", percentileBoundaries);
  
  // 2. 计算热力图数据
  // A. 选中RM的客户热力图数据
  const rmHeatmapData = initializeHeatmapData(tierOrder, incomePercentiles);
  const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);
  const rmTotalCustomers = rmCustomers.length;
  
  // B. 全行客户热力图数据
  const allHeatmapData = initializeHeatmapData(tierOrder, incomePercentiles);
  const allTotalCustomers = rmCustData.length;
  
  // 遍历所有客户，填充热力图数据
  rmCustData.forEach(cust => {
    const tier = cust.AUM_AVG_GROUP;
    const revenue = Number(cust.CUST_AVG_REV || 0);
    
    // 找出该客户属于哪个收入分位
    let percentileIndex = 0;
    while (percentileIndex < percentileBoundaries.length && revenue > percentileBoundaries[percentileIndex]) {
      percentileIndex++;
    }
    percentileIndex = Math.min(percentileIndex, incomePercentiles.length - 1);
    const percentile = incomePercentiles[percentileIndex];
    
    // 如果客户有有效层级且在预定义的层级中
    if (tier && tierOrder.includes(tier)) {
      // 更新全行客户热力图数据
      allHeatmapData[tier][percentile] += 1;
      
      // 如果是当前RM的客户，更新RM热力图数据
      if (cust.RM_ID === rmId) {
        rmHeatmapData[tier][percentile] += 1;
      }
    }
  });
  
  console.log("已计算RM热力图数据，客户总数:", rmTotalCustomers);
  console.log("已计算全行热力图数据，客户总数:", allTotalCustomers);
  
  // 3. 转换数据为ECharts格式并计算百分比
  const rmChartData = convertToEChartsData(rmHeatmapData, tierOrder, incomePercentiles, rmTotalCustomers);
  const allChartData = convertToEChartsData(allHeatmapData, tierOrder, incomePercentiles, allTotalCustomers);
  
  // 4. 计算差异数据 
  const diffHeatmapData = initializeHeatmapData(tierOrder, incomePercentiles);
  
  // 计算每个单元格的百分比差异
  tierOrder.forEach(tier => {
    incomePercentiles.forEach(percentile => {
      const rmPercentage = rmTotalCustomers > 0 ? (rmHeatmapData[tier][percentile] / rmTotalCustomers * 100) : 0;
      const allPercentage = allTotalCustomers > 0 ? (allHeatmapData[tier][percentile] / allTotalCustomers * 100) : 0;
      diffHeatmapData[tier][percentile] = rmPercentage - allPercentage;
    });
  });
  
  // 转换差异数据为ECharts格式
  const diffChartData = [];
  
  tierOrder.forEach((tier, i) => {
    incomePercentiles.forEach((percentile, j) => {
      const diff = diffHeatmapData[tier][percentile];
      
      // 记录原始值和该单元格的客户数信息
      const rmCount = rmHeatmapData[tier][percentile];
      const allCount = allHeatmapData[tier][percentile];
      
      diffChartData.push([j, i, diff.toFixed(1), `RM: ${rmCount}, 全行: ${allCount}`]);
    });
  });
  
  console.log("已准备好热力图数据，准备初始化视图切换器...");
  
  // 确保热力图容器存在
  const chartContainer = document.getElementById('incomeHeatmapChart');
  if (!chartContainer) {
    console.error("找不到热力图容器 #incomeHeatmapChart");
    return;
  }
  
  // 5. 创建统一的热力图，默认显示第一个视图（理财经理客户收入分布）
  initHeatmapViews(rmChartData, allChartData, diffChartData, tierOrder, incomePercentiles, rmId, rmHeatmapData, allHeatmapData);
  
  // 更新分析内容 - 默认为理财经理视图的分析
  updateIncomeHeatmapAnalysis(rmHeatmapData, allHeatmapData, tierOrder, incomePercentiles, rmId, 'rm');
  
  console.log("收入分布热力图初始化完成");
  }
  
  // Modified initHeatmapViews function with button styling and visualMap adjustment
  function initHeatmapViews(rmChartData, allChartData, diffChartData, tierOrder, incomePercentiles, rmId, rmHeatmapData, allHeatmapData) {
  // Get the chart container
  const chartContainer = document.getElementById('incomeHeatmapChart');
  
  // Create a dedicated control div similar to detailedComparisonControl
  const controlDiv = document.createElement('div');
  controlDiv.id = 'heatmapViewControl';
  controlDiv.style.textAlign = 'center';
  controlDiv.style.marginBottom = '15px';
  controlDiv.style.marginTop = '10px';
  controlDiv.style.zIndex = '100';
  controlDiv.style.position = 'relative';
  
  // Create the mode selector with custom styling
  controlDiv.innerHTML = `
    <div class="mode-selector">
      <button class="mode-btn active" data-mode="rm">理财经理分布</button>
      <button class="mode-btn" data-mode="all">全行分布</button>
      <button class="mode-btn" data-mode="diff">分布差异</button>
    </div>
  `;
  
  // Add custom styles to match requirements
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    #heatmapViewControl .mode-btn {
      padding: 6px 15px;
      margin: 0 5px;
      background-color: #091e2c;
      color: #e0e0e0;
      border: 1px solid #4B9CD3;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    #heatmapViewControl .mode-btn.active {
      background-color: #3fa2e9;
      color: white;
      font-weight: bold;
    }
  `;
  document.head.appendChild(styleElement);
  
  // Insert the control div before the chart
  chartContainer.parentNode.insertBefore(controlDiv, chartContainer);
  
  // Define views data
  const views = {
    'rm': { data: rmChartData, title: '选中理财经理客户收入分布' },
    'all': { data: allChartData, title: '全行客户收入分布' },
    'diff': { data: diffChartData, title: '理财经理vs全行差异分布' }
  };
  
  // Current mode (default is 'rm')
  let currentMode = 'rm';
  
  // Function to draw heatmap with adjusted visualMap
  function drawCustomHeatmap(container, data, tierOrder, incomePercentiles, labelPrefix, title) {
    // Check if an instance already exists
    let chart;
    try {
      chart = echarts.getInstanceByDom(container);
      if (!chart) {
        chart = echarts.init(container);
      }
    } catch (e) {
      chart = echarts.init(container);
    }
    
    const option = {
      title: {
        text: title,
        left: 'center',
        top: 0,
        textStyle: { color: '#e0e0e0', fontSize: 14 }
      },
      tooltip: {
        position: 'top',
        formatter: function(params) {
          const value = params.value;
          return `${tierOrder[value[1]]} 客户 / ${incomePercentiles[value[0]]} 收入分位:<br>` +
                 `占比: ${value[2]}%<br>` +
                 `客户数: ${value[3]}`;
        }
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '10%',
        top: '60px',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: incomePercentiles,
        name: '客户收入分位',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: {
          color: '#e0e0e0',
          rotate: 45,
          fontSize: 10
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
      visualMap: {
        min: 0,
        max: Math.max(...data.map(item => parseFloat(item[2]))),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        text: ['高', '低'],
        textStyle: { color: '#e0e0e0' },
        inRange: {
          // 统一配色方案，使用渐变蓝色
          color: ['#c2ddf6', '#a8cbed', '#74a9e6', '#3fa2e9', '#2a67d3', '#1f48c5']
        },
        // Set initial value to 2 instead of 0
        range: [2, 100]
      },
      series: [{
        name: `${labelPrefix}客户分布`,
        type: 'heatmap',
        data: data,
        label: {
          show: true,
          color: '#fff',
          formatter: function(params) {
            return params.value[2] + '%';
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }],
      animationDuration: 1500
    };
    
    chart.setOption(option, true);
    window.addEventListener('resize', () => chart.resize());
  }
  
  // Function to draw diff heatmap with adjusted visualMap
  function drawCustomDiffHeatmap(container, data, tierOrder, incomePercentiles, rmId, title) {
    // Check if an instance already exists
    let chart;
    try {
      chart = echarts.getInstanceByDom(container);
      if (!chart) {
        chart = echarts.init(container);
      }
    } catch (e) {
      chart = echarts.init(container);
    }
    
    // Find max/min values for the visualMap
    const values = data.map(item => parseFloat(item[2]));
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const absMax = Math.max(Math.abs(minValue), Math.abs(maxValue));
    
    const option = {
      title: {
        text: title,
        left: 'center',
        top: 0,
        textStyle: { color: '#e0e0e0', fontSize: 14 }
      },
      tooltip: {
        position: 'top',
        formatter: function(params) {
          const value = params.value;
          return `${tierOrder[value[1]]} 客户 / ${incomePercentiles[value[0]]} 收入分位:<br>` +
                 `差异: ${value[2]}%<br>` +
                 `${value[3]}`;
        }
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '10%',
        top: '60px',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: incomePercentiles,
        name: '客户收入分位',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: {
          color: '#e0e0e0',
          rotate: 45,
          fontSize: 10
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
      visualMap: {
        show: true,
        min: -absMax,
        max: absMax,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        text: ['高', '低'],
        textStyle: { color: '#e0e0e0' },
        inRange: {
          color: ['#1f48c5', '#3fa2e9', '#c2ddf6', '#FF7043', '#FF4500']
        },
        // Start at value 2 for the visualMap
        range: [2, absMax]
      },
      series: [{
        name: `${rmId}与全行差异`,
        type: 'heatmap',
        data: data,
        label: {
          show: true,
          color: function(params) {
            const value = parseFloat(params.value[2]);
            return Math.abs(value) > 0.1 ? '#ffffff' : '#212121';
          },
          formatter: function(params) {
            const value = parseFloat(params.value[2]);
            // Add + prefix for positive values
            return value > 0 ? '+' + params.value[2] + '%' : params.value[2] + '%';
          }
        },
        // Custom styling for each cell
        itemStyle: {
          color: function(params) {
            const value = parseFloat(params.value[2]);
            if (value > 0) {
              // Positive values use blue
              return value > 1 ? '#1f48c5' : '#3fa2e9';
            } else if (value < 0) {
              // Negative values use red
              return value < -1 ? '#FF4500' : '#FF7043';
            } else {
              // Zero values use neutral color
              return '#e0e0e0';
            }
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }],
      animationDuration: 1500
    };
    
    chart.setOption(option, true);
    window.addEventListener('resize', () => chart.resize());
  }
  
  // Function to update the chart based on the selected mode
  function updateChart(mode) {
    const viewData = views[mode];
    
    // Update button states
    document.querySelectorAll('#heatmapViewControl .mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`#heatmapViewControl .mode-btn[data-mode="${mode}"]`).classList.add('active');
    
    // Draw the appropriate chart
    if (mode === 'diff') {
      drawCustomDiffHeatmap(chartContainer, viewData.data, tierOrder, incomePercentiles, rmId, viewData.title);
    } else {
      drawCustomHeatmap(chartContainer, viewData.data, tierOrder, incomePercentiles, mode === 'rm' ? rmId : '全行', viewData.title);
    }
    
    // Update analysis content
    updateIncomeHeatmapAnalysis(rmHeatmapData, allHeatmapData, tierOrder, incomePercentiles, rmId, mode);
    
    // Update current mode
    currentMode = mode;
  }
  
  // Add button event listeners
  document.querySelectorAll('#heatmapViewControl .mode-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const mode = this.getAttribute('data-mode');
      updateChart(mode);
    });
  });
  
  // Initialize with default view (理财经理分布)
  updateChart('rm');
  
  console.log("热力图视图切换器已初始化，包含 3 个视图选项");
  }
  
  // E3- 初始化热力图数据结构-Heatmap
  function initializeHeatmapData(tierOrder, incomePercentiles) {
  const data = {};
  
  tierOrder.forEach(tier => {
    data[tier] = {};
    incomePercentiles.forEach(percentile => {
      data[tier][percentile] = 0;
    });
  });
  
  return data;
  }
  
  // E3- 转换数据为ECharts格式-Heatmap
  function convertToEChartsData(heatmapData, tierOrder, incomePercentiles, totalCustomers) {
  const chartData = [];
  
  tierOrder.forEach((tier, i) => {
    incomePercentiles.forEach((percentile, j) => {
      const count = heatmapData[tier][percentile];
      const percentage = totalCustomers > 0 ? (count / totalCustomers * 100) : 0;
      
      chartData.push([j, i, percentage.toFixed(1), count]);
    });
  });
  
  return chartData;
  }
  
  // E3- 绘制热力图-Heatmap（修改为使用echarts.getInstanceByDom或init新实例）
  function drawHeatmap(container, data, tierOrder, incomePercentiles, labelPrefix, title) {
  // 检查是否已经有图表实例，如果有则直接使用
  let chart;
  try {
    chart = echarts.getInstanceByDom(container);
    if (!chart) {
      chart = echarts.init(container);
    }
  } catch (e) {
    chart = echarts.init(container);
  }
  
  const option = {
    title: {
      text: title,
      left: 'center',
      top: 0,
      textStyle: { color: '#e0e0e0', fontSize: 14 }
    },
    tooltip: {
      position: 'top',
      formatter: function(params) {
        const value = params.value;
        return `${tierOrder[value[1]]} 客户 / ${incomePercentiles[value[0]]} 收入分位:<br>` +
               `占比: ${value[2]}%<br>` +
               `客户数: ${value[3]}`;
      }
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '10%',
      top: '60px',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: incomePercentiles,
      name: '客户收入分位',
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        color: '#e0e0e0',
        rotate: 45,
        fontSize: 10
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
    visualMap: {
      min: 0,
      max: Math.max(...data.map(item => parseFloat(item[2]))),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      text: ['高', '低'],
      textStyle: { color: '#e0e0e0' },
      inRange: {
        // 统一配色方案，使用渐变蓝色（不使用纯白色或极浅色）
        color: ['#c2ddf6', '#a8cbed', '#74a9e6', '#3fa2e9', '#2a67d3', '#1f48c5']
      }
    },
    series: [{
      name: `${labelPrefix}客户分布`,
      type: 'heatmap',
      data: data,
      label: {
        show: true,
        color: '#fff',
        formatter: function(params) {
          return params.value[2] + '%';
        }
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      itemStyle: {
        borderColor: '#091e2c',
        borderWidth: 1
        }
    }],
    animationDuration: 1500
  };
  
  chart.setOption(option, true);
  window.addEventListener('resize', () => chart.resize());
  }
  
  // E3- 绘制差异热力图-Heatmap（修改为使用echarts.getInstanceByDom或init新实例）
  function drawDiffHeatmap(container, data, tierOrder, incomePercentiles, rmId, title) {
  // 检查是否已经有图表实例，如果有则直接使用
  let chart;
  try {
    chart = echarts.getInstanceByDom(container);
    if (!chart) {
      chart = echarts.init(container);
    }
  } catch (e) {
    chart = echarts.init(container);
  }
  
  // 找出数据中的最大和最小值，用于设置颜色映射范围
  const values = data.map(item => parseFloat(item[2]));
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const absMax = Math.max(Math.abs(minValue), Math.abs(maxValue));
  
  const option = {
    title: {
      text: title,
      left: 'center',
      top: 0,
      textStyle: { color: '#e0e0e0', fontSize: 14 }
    },
    tooltip: {
      position: 'top',
      formatter: function(params) {
        const value = params.value;
        return `${tierOrder[value[1]]} 客户 / ${incomePercentiles[value[0]]} 收入分位:<br>` +
               `差异: ${value[2]}%<br>` +
               `${value[3]}`;
      }
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '10%',
      top: '60px',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: incomePercentiles,
      name: '客户收入分位',
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        color: '#e0e0e0',
        rotate: 45,
        fontSize: 10
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
    visualMap: {
      show: false,  // 隐藏视觉映射组件
      min: -absMax,
      max: absMax,
      inRange: {
        // 统一配色方案，使用渐变蓝色（不使用纯白色或极浅色）
        color: ['#1f48c5', '#3fa2e9', '#c2ddf6', '#FF7043', '#FF4500']
      }
    },
    series: [{
      name: `${rmId}与全行差异`,
      type: 'heatmap',
      data: data,
      label: {
        show: true,
        color: function(params) {
          const value = parseFloat(params.value[2]);
          return Math.abs(value) > 0.1 ? '#ffffff' : '#212121';
        },
        formatter: function(params) {
          const value = parseFloat(params.value[2]);
          // 为正值添加 + 前缀
          return value > 0 ? '+' + params.value[2] + '%' : params.value[2] + '%';
        }
      },
      // 自定义每个单元格的样式
      itemStyle: {
        color: function(params) {
          const value = parseFloat(params.value[2]);
          if (value > 0) {
            // 正值使用蓝色
            return value > 1 ? '#1f48c5' : '#3fa2e9';
          } else if (value < 0) {
            // 负值使用红色
            return value < -1 ? '#FF4500' : '#FF7043';
          } else {
            // 零值使用中性色
            return '#e0e0e0';
          }
        }
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }],
    animationDuration: 1500
  };
  
  chart.setOption(option, true);
  window.addEventListener('resize', () => chart.resize());
  }
  
  // E3- 更新收入分布热力图分析-Heatmap（添加视图类型参数）
  function updateIncomeHeatmapAnalysis(rmHeatmapData, allHeatmapData, tierOrder, incomePercentiles, rmId, viewType) {
  const analysisElem = document.getElementById('incomeHeatmapAnalysis');
  if (!analysisElem) return;
  
  // 1. 找出RM客户分布最集中的区域
  let maxRmConcentration = 0;
  let rmConcentratedTier = '';
  let rmConcentratedPercentile = '';
  
  tierOrder.forEach(tier => {
    incomePercentiles.forEach(percentile => {
      if (rmHeatmapData[tier][percentile] > maxRmConcentration) {
        maxRmConcentration = rmHeatmapData[tier][percentile];
        rmConcentratedTier = tier;
        rmConcentratedPercentile = percentile;
      }
    });
  });
  
  // 2. 找出全行客户分布最集中的区域
  let maxAllConcentration = 0;
  let allConcentratedTier = '';
  let allConcentratedPercentile = '';
  
  tierOrder.forEach(tier => {
    incomePercentiles.forEach(percentile => {
      if (allHeatmapData[tier][percentile] > maxAllConcentration) {
        maxAllConcentration = allHeatmapData[tier][percentile];
        allConcentratedTier = tier;
        allConcentratedPercentile = percentile;
      }
    });
  });
  
  // 3. 计算RM与全行的分布差异
  let maxDiff = 0;
  let maxDiffTier = '';
  let maxDiffPercentile = '';
  let isDiffHigher = true;
  
  const rmTotal = Object.values(rmHeatmapData).flatMap(t => Object.values(t)).reduce((a, b) => a + b, 0);
  const allTotal = Object.values(allHeatmapData).flatMap(t => Object.values(t)).reduce((a, b) => a + b, 0);
  
  tierOrder.forEach(tier => {
    incomePercentiles.forEach(percentile => {
      const rmPercentage = rmTotal > 0 ? (rmHeatmapData[tier][percentile] / rmTotal * 100) : 0;
      const allPercentage = allTotal > 0 ? (allHeatmapData[tier][percentile] / allTotal * 100) : 0;
      const diff = rmPercentage - allPercentage;
      
      if (Math.abs(diff) > Math.abs(maxDiff)) {
        maxDiff = diff;
        maxDiffTier = tier;
        maxDiffPercentile = percentile;
        isDiffHigher = diff > 0;
      }
    });
  });
  
  // 4. 根据当前视图类型生成分析文本
  let analysisText = '';
  
  // 基础信息-所有视图共享
  const baseInfoText = `
    <p>理财经理<span class="highlight">${rmId}</span>的客户主要集中在<span class="highlight">${rmConcentratedTier}</span>层级的<span class="highlight">${rmConcentratedPercentile}</span>收入分位，占比明显高于其他区域。</p>
    <p>全行客户主要集中在<span class="highlight">${allConcentratedTier}</span>层级的<span class="highlight">${allConcentratedPercentile}</span>收入分位，这表明市场整体客户分布存在较明显的聚集趋势。</p>
  `;
  
  // 根据视图类型添加特定分析
  switch(viewType) {
    case 'rm':
      analysisText = baseInfoText + `
        <p>理财经理<span class="highlight">${rmId}</span>的客户结构表现出较为明显的集中趋势，这可能表明该理财经理在特定客户群体中具有较强的竞争力或客户维护能力。</p>
        <p>建议：充分发挥在<span class="highlight">${rmConcentratedTier}</span>层级的客户服务优势，同时考虑适当拓展其他客户层级，以实现更均衡的客户结构。</p>
      `;
      break;
      
    case 'all':
      analysisText = baseInfoText + `
        <p>全行客户分布情况反映了市场的整体趋势，<span class="highlight">${allConcentratedTier}</span>层级的<span class="highlight">${allConcentratedPercentile}</span>收入分位客户是行业共同关注的重点客群。</p>
        <p>建议：密切关注全行客户分布变化趋势，及时调整营销策略，把握市场结构变化带来的业务机会。</p>
      `;
      break;
      
    case 'diff':
      analysisText = baseInfoText + `
        <p>相比全行平均水平，<span class="highlight">${rmId}</span>在<span class="highlight">${maxDiffTier}</span>层级的<span class="highlight">${maxDiffPercentile}</span>收入分位客户占比<span class="highlight">${isDiffHigher ? '高' : '低'}</span>出<span class="highlight">${Math.abs(maxDiff).toFixed(1)}%</span>。</p>
        <p>建议：</p>
        <p>1. ${isDiffHigher ? 
             `进一步巩固在<span class="highlight">${maxDiffTier}</span>层级<span class="highlight">${maxDiffPercentile}</span>收入分位的优势，同时拓展其他区域客户。` : 
             `加强<span class="highlight">${maxDiffTier}</span>层级<span class="highlight">${maxDiffPercentile}</span>收入分位的客户开发，提高市场覆盖率。`}</p>
        <p>2. 关注<span class="highlight">${allConcentratedTier}</span>层级的<span class="highlight">${allConcentratedPercentile}</span>收入分位客户，这是市场主流客群，具有较大的开发潜力。</p>
      `;
      break;
      
    default:
      // 默认显示差异分析
      analysisText = baseInfoText + `
        <p>相比全行平均水平，<span class="highlight">${rmId}</span>在<span class="highlight">${maxDiffTier}</span>层级的<span class="highlight">${maxDiffPercentile}</span>收入分位客户占比<span class="highlight">${isDiffHigher ? '高' : '低'}</span>出<span class="highlight">${Math.abs(maxDiff).toFixed(1)}%</span>。</p>
        <p>建议：关注差异显著的客户群体，制定针对性的经营策略，优化客户结构。</p>
      `;
  }
  
  // 设置分析内容
  analysisElem.innerHTML = analysisText;
  }
  
  // E4: 客户层级ROA分位数图表-箱线图-数据
  function initCustomerTierRevenueTrend(selectedRM, rmCustData) {
  if (!selectedRM || !rmCustData || rmCustData.length === 0) {
    console.error("客户层级ROA表现数据不完整");
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
  
  // 计算每个RM在各层级的ROA
  const rmDataByTier = {};
  const selectedRmRoaByTier = {};
  
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
        // 计算总收入和总AUM
        let totalRevenue = 0;
        let totalAUM = 0;
        
        rmTierCustomers.forEach(cust => {
          // 收入取cust_tot_rev_1到cust_tot_rev_6的平均
          let custRevenue = 0;
          let revCount = 0;
          for (let i = 1; i <= 6; i++) {
            const rev = Number(cust[`cust_tot_rev_${i}`] || 0);
            if (rev > 0) {
              custRevenue += rev;
              revCount++;
            }
          }
          totalRevenue += (revCount > 0) ? custRevenue : Number(cust.cust_tot_rev_1 || 0);
          
          // AUM取cust_tot_aum_1到cust_tot_aum_6的平均
          let custAUM = 0;
          let aumCount = 0;
          for (let i = 1; i <= 6; i++) {
            const aum = Number(cust[`cust_tot_aum_${i}`] || 0);
            if (aum > 0) {
              custAUM += aum;
              aumCount++;
            }
          }
          totalAUM += (aumCount > 0) ? custAUM : Number(cust.cust_tot_aum_1 || 0);
        });
        
        // 计算ROA = 总收入 / 总AUM
        const roa = totalAUM > 0 ? (totalRevenue / totalAUM * 100) : 0; // ROA以百分比表示
        
        // 初始化该层级数据结构
        if (!rmDataByTier[tier]) {
          rmDataByTier[tier] = [];
        }
        
        // 添加该RM在该层级的ROA
        rmDataByTier[tier].push(roa);
        
        // 如果是当前选中的RM，记录其ROA
        if (currentRmId === rmId) {
          selectedRmRoaByTier[tier] = roa;
        }
      }
    });
  });
  
  // 计算每个层级的ROA箱线图数据
  const boxPlotData = [];
  
  // 遍历每个客户层级
  tierOrder.forEach(tier => {
    // 获取该层级的所有RM的ROA
    const tierRoas = rmDataByTier[tier] || [];
    
    // 如果该层级没有有效数据，则跳过
    if (tierRoas.length === 0) {
      console.log(`层级 ${tier} 没有有效的ROA数据，跳过`);
      return;
    }
    
    // 计算箱线图数据：最小值、Q1、中位数、Q3、最大值
    const sortedRoas = [...tierRoas].sort((a, b) => a - b);
    const minVal = sortedRoas[0];
    const maxVal = sortedRoas[sortedRoas.length - 1];
    const q1 = sortedRoas[Math.floor(sortedRoas.length * 0.25)];
    const median = sortedRoas[Math.floor(sortedRoas.length * 0.5)];
    const q3 = sortedRoas[Math.floor(sortedRoas.length * 0.75)];
    
    // 添加箱线图数据
    boxPlotData.push([minVal, q1, median, q3, maxVal, tier]);
  });
  
  // 初始化客户层级ROA分位数图表
  initCustomerTierRevenueChart(boxPlotData, selectedRmRoaByTier, rmId, rmDataByTier);
  
  // 确保更新分析内容
  updateCustomerTierRevenueAnalysis(selectedRM, boxPlotData, selectedRmRoaByTier, rmDataByTier);
  }
  
  // E4: 初始化客户层级ROA分位数图表-箱线图-画图
  function initCustomerTierRevenueChart(boxPlotData, selectedRmRoaByTier, rmId, rmDataByTier) {
  // 先清除原有的图表区域，并创建独立的小图表容器
  const chartArea = document.getElementById('customerTierRevenueChart');
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
    chartContainer.id = `tierChart_${index}`;
    chartContainer.style.height = '200px'; // 图表高度
    chartArea.appendChild(chartContainer);
    
    // 获取当前层级名称
    const tierName = boxData[5];
    
    // 创建图表实例
    const chart = echarts.init(chartContainer);
    
    // 准备数据
    const singleBoxData = [boxData.slice(0, 5)]; // 仅保留boxplot所需的5个数值
    const rmRoa = selectedRmRoaByTier[tierName];
    
    // 计算选中RM的百分位位置
    let percentileText = '';
    if (rmRoa !== undefined) {
      // 获取该层级的所有RM的ROA
      const tierRoas = rmDataByTier[tierName];
      const sortedRoas = [...tierRoas].sort((a, b) => a - b);
      
      // 计算百分位
      const lowerCount = sortedRoas.filter(roa => roa < rmRoa).length;
      const percentile = (100-lowerCount / sortedRoas.length * 100).toFixed(1);
      percentileText = `位于前 ${percentile}%`;
    }
    
    // 计算适当的X轴范围，确保箱体和RM点都完整显示
    // 计算数据范围并添加边距
    let minValue = Math.min(...boxData.slice(0, 5));
    let maxValue = Math.max(...boxData.slice(0, 5));
    
    // 如果有选中RM的数据，考虑纳入范围
    if (rmRoa !== undefined) {
      minValue = Math.min(minValue, rmRoa);
      maxValue = Math.max(maxValue, rmRoa);
    }
    
    // 计算数据范围
    const dataRange = maxValue - minValue;
    
    // 设置边距，确保箱体不会顶到边缘
    // 至少留出20%的边距空间
    const margin = Math.max(dataRange * 0.25, 0.2);
    const adjustedMin = Math.max(0, minValue - margin);  // ROA通常不会为负，但如有特殊情况可以去掉max(0,...)
    const adjustedMax = maxValue + margin;
    
    // 设置图表选项
    const option = {
      title: {
        text: `${tierName}层级ROA分布`,
        left: 'center',
        top: 0,
        textStyle: { color: '#e0e0e0', fontSize: 15 }
      },
      tooltip: {
        trigger: 'item',
        axisPointer: { type: 'shadow' },
        formatter: function(params) {
          if (params.seriesName === '理财经理位置') {
            return `${tierName}层级<br/>${rmId}的ROA: ${params.value.toFixed(2)}%`;
          } else {
            return `${tierName}层级ROA分布:<br/>
                    最小值: ${boxData[0].toFixed(2)}%<br/>
                    Q1: ${boxData[1].toFixed(2)}%<br/>
                    中位数: ${boxData[2].toFixed(2)}%<br/>
                    Q3: ${boxData[3].toFixed(2)}%<br/>
                    最大值: ${boxData[4].toFixed(2)}%`;
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
        name: 'ROA(%)',
        nameLocation: 'middle',
        nameGap: 25,
        min: adjustedMin,
        max: adjustedMax,
        axisLabel: { 
          color: '#e0e0e0',
          fontSize: 10,
          formatter: function(value) {
            return value.toFixed(2) + '%';
          }
        },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { lineStyle: { color: 'rgba(224, 224, 224, 0.2)' } }
      },
      yAxis: {
        type: 'category',
        data: ['ROA'],
        axisLabel: { color: '#e0e0e0' },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      },
      series: [
        {
          name: 'ROA分位数',
          type: 'boxplot',
          data: singleBoxData,
          itemStyle: {
            color: '#4B9CD3',
            borderColor: '#888'
          }
        }
      ]
    };
    
    // 如果有选中RM的ROA数据，添加到图表中
    if (rmRoa !== undefined) {
      option.series.push({
        name: '理财经理位置',
        type: 'scatter',
        symbolSize: 15,
        data: [[rmRoa, 'ROA']],
        itemStyle: { 
          color: '#FF7043',
          borderColor: '#fff',
          borderWidth: 1
        }
      });
      
      // 添加标记线，显示RM在ROA分布中的位置
      option.series[0].markLine = {
        silent: true,
        lineStyle: {
          color: '#FF7043',
          type: 'dashed'
        },
        data: [
          {
            xAxis: rmRoa,
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
    percentileContainer.innerHTML = rmRoa !== undefined ? `${rmId} ${percentileText}` : '无数据';
    
    // 将百分位容器添加到图表容器后面
    chartContainer.appendChild(percentileContainer);
    
    // 添加自适应调整
    window.addEventListener('resize', () => chart.resize());
  });
  }
  
  // E4: 客户层级ROA表现 - 箱线图点评
  function updateCustomerTierRevenueAnalysis(selectedRM, boxPlotData, selectedRmRoaByTier, rmDataByTier) {
  // 获取分析元素
  const analysisElem = document.getElementById('customerTierRevenueAnalysis');
  if (!analysisElem) {
    console.error("找不到客户层级ROA分析元素");
    return;
  }
  
  const rmId = selectedRM.RM_ID;
  
  // 有效的层级 - 从boxPlotData中提取
  const validTiers = boxPlotData.map(data => data[5]);
  
  // 分析RM在各层级的ROA表现
  const tierPerformance = {};
  
  validTiers.forEach(tier => {
    const rmRoa = selectedRmRoaByTier[tier];
    if (rmRoa !== undefined) {
      // 获取该层级的所有RM的ROA
      const tierRoas = rmDataByTier[tier] || [];
      
      // 如果有足够数据计算平均值
      if (tierRoas.length > 0) {
        // 计算该层级所有RM的平均ROA
        const avgRoa = tierRoas.reduce((sum, roa) => sum + roa, 0) / tierRoas.length;
        
        // 计算RM在该层级的表现（相对于平均值的百分比）
        const performance = rmRoa - avgRoa;
        const performancePercent = (avgRoa !== 0) ? (performance / avgRoa * 100) : 0;
        
        tierPerformance[tier] = {
          roa: rmRoa,
          avgRoa: avgRoa,
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
  
  console.log("客户层级ROA分析:", {
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
      <p>理财经理<span class="highlight">${rmId}</span>在不同客户层级的ROA表现如下：</p>
      <p>在<span class="highlight">${bestTier}</span>客户层级中表现最好，ROA为<span class="highlight">${tierPerformance[bestTier].roa.toFixed(2)}%</span>，<span class="highlight">${tierPerformance[bestTier].position}</span>同层级平均水平<span class="highlight">${Math.abs(bestPerformance).toFixed(2)}个百分点</span>。</p>
      <p>在<span class="highlight">${worstTier}</span>客户层级中表现较弱，ROA为<span class="highlight">${tierPerformance[worstTier].roa.toFixed(2)}%</span>，<span class="highlight">${tierPerformance[worstTier].position}</span>同层级平均水平<span class="highlight">${Math.abs(worstPerformance).toFixed(2)}个百分点</span>。</p>
    `;
    
    // 提供针对性建议
    if (bestPerformance > 0) {
      analysisText += `
        <p>建议：总结<span class="highlight">${bestTier}</span>层级客户的成功经验，探究ROA较高的原因，将成功经验复制到其他客户层级，特别是<span class="highlight">${worstTier}</span>层级，提升整体资产收益率。</p>
      `;
    } else {
      analysisText += `
        <p>建议：所有客户层级ROA均低于平均水平，需全面提升资产配置和产品销售能力，优先改善<span class="highlight">${worstTier}</span>层级客户的资产收益效率。</p>
      `;
    }
  } else {
    analysisText = `
      <p>暂无足够数据分析理财经理<span class="highlight">${rmId}</span>在各客户层级的ROA表现。</p>
    `;
  }
  
  // 直接设置HTML内容
  analysisElem.innerHTML = analysisText;
  console.log("已更新客户层级ROA分析");
  }
// E5: 客户 ROA vs 规模变化散点图 - 改进版本
function initCustomerRoaVsAumChangeChart(selectedRM, rmCustData) {
  if (!selectedRM || !rmCustData || rmCustData.length === 0) {
    console.error("客户 ROA vs 规模变化数据不完整");
    return;
  }
  
  console.log("开始初始化客户 ROA vs 规模变化散点图...");
  
  // 获取当前选中RM的ID
  const rmId = selectedRM.RM_ID;
  
  // 获取AUM层级的唯一值列表
  const aumGroups = [
    "30mn+", 
    "6-30Mn", 
    "1-6Mn", 
    "300K-1Mn", 
    "50-300K", 
    "0-50K"
  ].filter(group => rmCustData.some(cust => cust.AUM_AVG_GROUP === group));
  
  // 确保图表容器存在
  const chartContainer = document.getElementById('roaVsAumChangeChart');
  if (!chartContainer) {
    console.error("找不到图表容器 #roaVsAumChangeChart");
    return;
  }
  
  // 为每个客户计算AUM_DELTA字段
  rmCustData.forEach(cust => {
    cust.AUM_DELTA = Number(cust.CUST_AVG_AUM || 0) - Number(cust.CUST_AVG_AUM_2 || 0);
    // 确保ROA是数值类型
    cust.CUST_ROA = Number(cust.CUST_ROA || 0);
  });
  
  // 创建图表视图切换控制
  createRoaAumViewControl(chartContainer, aumGroups);
  
  // 初始化图表并设置默认视图 - 选择默认组
  const defaultGroup = aumGroups.includes('6-30Mn') ? '6-30Mn' : aumGroups[0];
  initRoaAumViews(rmCustData, aumGroups, rmId, defaultGroup);
  
  console.log("客户 ROA vs 规模变化散点图初始化完成");
}

// E5: 创建视图切换控制组件 - 基本不变
function createRoaAumViewControl(container, aumGroups) {
  // 创建一个独立的控制容器，模仿detailedComparisonControl
  const controlDiv = document.createElement('div');
  controlDiv.id = 'roaAumViewControl';
  controlDiv.style.textAlign = 'center';
  controlDiv.style.marginBottom = '15px';
  controlDiv.style.marginTop = '10px';
  
  // 确定默认选中的组
  const defaultGroup = aumGroups.includes('6-30Mn') ? '6-30Mn' : aumGroups[0];
  
  // 创建模式选择器HTML
  controlDiv.innerHTML = `
    <div class="mode-selector">
      ${aumGroups.map((group) => 
         `<button class="mode-btn ${group === defaultGroup ? 'active' : ''}" data-group="${group}">${group}</button>`
      ).join('')}
    </div>
  `;
  
  // 将控制容器插入到图表容器之前
  container.parentNode.insertBefore(controlDiv, container);
  
  // 添加样式
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    #roaAumViewControl .mode-selector {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    #roaAumViewControl .mode-btn {
      padding: 6px 15px;
      margin: 0 3px;
      background-color: #091e2c;
      color: #e0e0e0;
      border: 1px solid #4B9CD3;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    #roaAumViewControl .mode-btn.active {
      background-color: #3fa2e9;
      color: white;
      font-weight: bold;
    }
  `;
  document.head.appendChild(styleElement);
}

// E5: 初始化并管理图表视图 - 主要改进
function initRoaAumViews(rmCustData, aumGroups, rmId, defaultGroup) {
  const chartContainer = document.getElementById('roaVsAumChangeChart');
  
  // 当前选中的AUM组别
  let currentAumGroup = defaultGroup;
  
  // 格式化数字函数
  function formatNumber(value) {
    const num = Number(value);
    if (isNaN(num)) return '0';
    
    if (Math.abs(num) >= 10000) {
      return (num / 10000).toFixed(1) + 'w';
    }
    
    return num.toFixed(2);
  }
  
  // 获取排序后的数组特定百分位的值
  function getPercentileValue(sortedArr, percentile) {
    if (!sortedArr || sortedArr.length === 0) return 0;
    const index = Math.floor(sortedArr.length * percentile / 100);
    return sortedArr[Math.min(index, sortedArr.length - 1)];
  }
  
  // 绘制散点图函数 - 改进版本
  function drawScatterChart(aumGroup) {
    // 检查是否已有图表实例
    let chart;
    try {
      chart = echarts.getInstanceByDom(chartContainer);
      if (!chart) {
        chart = echarts.init(chartContainer);
      }
    } catch (e) {
      chart = echarts.init(chartContainer);
    }
    
    // 筛选当前RM的客户，进一步筛选指定AUM组别的客户
    const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);
    const groupCustomers = rmCustomers.filter(cust => cust.AUM_AVG_GROUP === aumGroup);
    
    console.log(`已筛选${groupCustomers.length}位客户属于RM: ${rmId}, AUM层级: ${aumGroup}`);
    
    // 准备散点图数据
    const scatterData = [];
    
    // 获取ROA和AUM_DELTA的所有值用于后续处理
    const roaValues = [];
    const aumDeltaValues = [];
    
    groupCustomers.forEach(cust => {
      const roa = Number(cust.CUST_ROA || 0);
      const aumDelta = cust.AUM_DELTA;
      
      if (!isNaN(roa) && !isNaN(aumDelta)) {
        roaValues.push(roa);
        aumDeltaValues.push(aumDelta);
        
        // 保存原始分类标记用于颜色编码
        scatterData.push({
          value: [roa, aumDelta],
          custId: cust.CUST_ID,
          roa: roa,
          aumDelta: aumDelta,
          aumUpDown: cust.AUM_AVG_UP_DOWN,
          roaRank: cust.ROA_AUMGROUP_RANK
        });
      }
    });
    
    // 如果没有有效数据，显示空图表
    if (scatterData.length === 0) {
      chart.setOption({
        title: {
          text: `${aumGroup}层级客户 ROA vs AUM变化分布 (无数据)`,
          left: 'center',
          top: 10,
          textStyle: { color: '#e0e0e0', fontSize: 16 }
        },
        grid: {
          left: '5%',
          right: '5%',
          bottom: '15%',
          top: '80px',
          containLabel: true
        }
      });
      return;
    }
    
    // 排序数据用于计算百分位数
    const sortedRoa = [...roaValues].sort((a, b) => a - b);
    const sortedAumDelta = [...aumDeltaValues].sort((a, b) => a - b);
    
    // 计算ROA的百分位数值
    const roaMin = getPercentileValue(sortedRoa, 1);  // 1%分位数
    const roaLow = getPercentileValue(sortedRoa, 15);  // 15%分位数
    const roaMedian = getPercentileValue(sortedRoa, 50); // 中位数
    const roaHigh = getPercentileValue(sortedRoa, 75); // 75%分位数
    const roaMax = getPercentileValue(sortedRoa, 99); // 99%分位数
    
    // 计算AUM变化的百分位数值
    const aumDeltaMin = getPercentileValue(sortedAumDelta, 1);
    const aumDeltaLow = getPercentileValue(sortedAumDelta, 5);
    const aumDeltaHigh = getPercentileValue(sortedAumDelta, 95);
    const aumDeltaMax = getPercentileValue(sortedAumDelta, 99);
    
    // 设置合理的轴范围 - 改进部分
    // 使用5%-95%的数据范围，但确保覆盖中位数的一定范围
    
    // 计算ROA轴的范围 - 改进以更好地处理离群值
    const roaRange = roaHigh - roaLow;
    const roaBuffer = roaRange * 0.3; // 添加30%的缓冲区
    let roaAxisMin = Math.max(0, roaLow - roaBuffer); // 不小于0
    let roaAxisMax = roaHigh + roaBuffer;
    
    // 如果中位数接近0，确保有合理的显示范围
    if (roaMedian < roaAxisMin) {
      // 如果中位数小于轴的最小值，降低最小值
      roaAxisMin = Math.max(0, roaMedian * 0.9); // 留出10%空间
    }
    
    // 如果数据范围很小，确保至少有一个最小范围
    if (roaRange < 0.001) {
      roaAxisMin = Math.max(0, roaMedian - 0.01);
      roaAxisMax = roaMedian + 0.01;
    }
    if (roaMedian > roaAxisMax) {
      // 如果中位数大于轴的最大值，提高最大值
      roaAxisMax = roaMedian * 1.1; // 留出10%空间
    }
 // 确保范围有最小的宽度以便清晰显示
  const minRoaRange = 0.01; // 最小ROA范围为1%
  if (roaAxisMax - roaAxisMin < minRoaRange) {
    // 如果范围太窄，扩展它
    const midpoint = (roaAxisMax + roaAxisMin) / 2;
    roaAxisMin = Math.max(0, midpoint - minRoaRange/2);
    roaAxisMax = midpoint + minRoaRange/2;
  }

  // 如果中位数接近0，确保有合理的显示范围
  if (roaMedian < 0.01 && roaHigh > 0) {
    roaAxisMax = Math.max(roaAxisMax, 0.02);
  }
  
  // 如果数据范围很小，确保至少有一个最小范围
  if (roaRange < 0.001) {
    roaAxisMin = Math.max(0, roaMedian - 0.01);
    roaAxisMax = roaMedian + 0.01;
  }
  
    
    // 计算AUM变化轴的范围 - 改进以更好地处理离群值
    // 确保0点在视觉中心附近，这对于AUM变化很重要
    const maxAbsAumDelta = Math.max(
      Math.abs(aumDeltaLow), 
      Math.abs(aumDeltaHigh)
    );
    
    // 为AUM变化轴创建对称的范围
    let aumDeltaAxisMin = -maxAbsAumDelta * 1.2; // 添加20%的缓冲区
    let aumDeltaAxisMax = maxAbsAumDelta * 1.2;
    
    // 如果数据范围很小，确保至少有一个最小范围
    if (maxAbsAumDelta < 100) {
      aumDeltaAxisMin = -1000;
      aumDeltaAxisMax = 1000;
    }
    
    // 创建图表配置
    const option = {
      title: {
        text: `${aumGroup}层级客户 ROA vs AUM变化分布`,
        left: 'center',
        top: 10,
        textStyle: { color: '#e0e0e0', fontSize: 16 }
      },
      tooltip: {
        formatter: function(params) {
          const data = params.data;
          return `客户ID: ${data.custId}<br/>` +
                 `ROA: ${(data.roa * 100).toFixed(2)}%<br/>` +
                 `AUM变化: ${formatNumber(data.aumDelta)}<br/>` +
                 `ROA等级: ${data.roaRank}<br/>` +
                 `AUM变化方向: ${data.aumUpDown}`;
        }
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '15%',
        top: '80px',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'ROA (%)',
        nameLocation: 'middle',
        nameGap: 30,
        min: roaAxisMin,
        max: roaAxisMax,
        axisLabel: {
          color: '#e0e0e0',
          formatter: function(value) {
            return (value * 100).toFixed(1) + '%';
          }
        },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { 
          show: true,
          lineStyle: { color: 'rgba(224, 224, 224, 0.3)' } 
        }
      },
      yAxis: {
        type: 'value',
        name: 'AUM变化',
        nameLocation: 'middle',
        nameGap: 60,
        min: aumDeltaAxisMin,
        max: aumDeltaAxisMax,
        axisLabel: { 
          color: '#e0e0e0',
          formatter: function(value) {
            return formatNumber(value);
          }
        },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { 
          show: true,
          lineStyle: { color: 'rgba(224, 224, 224, 0.3)' } 
        }
      },
      // 添加图例
      legend: {
        orient: 'horizontal',
        left: 'center',
        bottom: '5px',
        itemGap: 20,
        textStyle: { color: '#e0e0e0' },
        data: [
          {
            name: '高ROA且AUM增长',
            icon: 'circle',
            itemStyle: { color: '#3fa2e9' }
          },
          {
            name: '低ROA且AUM下降',
            icon: 'circle',
            itemStyle: { color: '#FF4500' }
          },
          {
            name: '高ROA但AUM下降',
            icon: 'circle',
            itemStyle: { color: '#FF7043' }
          },
          {
            name: '其他客户',
            icon: 'circle',
            itemStyle: { color: '#9e9e9e' }
          }
        ]
      },
      series: [
        {
          name: '客户分布',
          type: 'scatter',
          symbolSize: 15,
          data: scatterData.map(item => ({
            value: item.value,
            custId: item.custId,
            roa: item.roa,
            aumDelta: item.aumDelta,
            roaRank: item.roaRank,
            aumUpDown: item.aumUpDown,
            itemStyle: {
              color: function() {
                // 首先判断 AUM_DELTA 是否小于 0
                if (item.aumDelta < 0) {
                  return '#FF7043'; // 所有 AUM_DELTA < 0 的点都设为橙色
                }
                
                // AUM 增长的情况下，高 ROA 客户突出显示为深蓝色
                if (item.roaRank === 'ROA%-Top20%' || item.roaRank === 'ROA%-Top40%') {
                  return '#1f48c5'; // 深蓝色
                }
                
                // 其他客户为普通蓝色
                return '#3fa2e9';
              }
            }
          })),
          // 设置散点图效果
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(255, 255, 255, 0.5)'
            }
          }
        },
        // 添加参考线 - X轴0线
        {
          type: 'line',
          markLine: {
            silent: true,
            lineStyle: {
              color: 'rgba(224, 224, 224, 0.5)',
              type: 'dashed'
            },
            data: [{ yAxis: 0 }]
          }
        },
        // 添加参考线 - 纵向ROA中位数线
        {
          type: 'line',
          markLine: {
            silent: true,
            lineStyle: {
              color: 'rgba(255, 165, 0, 0.8)', // 更改为橙色，增加不透明度
              type: 'dashed',
              width: 2 // 增加线宽
            },
            label: {
              show: true, // 显示标签
              formatter: function() {
                return `ROA中位数: ${(roaMedian * 100).toFixed(1)}%`;
              },
              position: 'insideEndTop', // 标签位置在顶部
              color: '#ffffff',  // 白色标签
              backgroundColor: 'rgba(70, 70, 70, 0.8)', // 带灰色背景
              padding: [2, 4],   // 添加内边距
              fontSize: 12
            },
            data: [{ xAxis: roaMedian }]
          }
        }
      ],
      animationDuration: 1500
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
    
    // 更新分析内容
    updateRoaVsAumChangeAnalysis(rmCustData, rmId, aumGroup);
  }
  
  // 添加视图切换按钮事件
  document.querySelectorAll('#roaAumViewControl .mode-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      // 更新按钮状态
      document.querySelectorAll('#roaAumViewControl .mode-btn').forEach(b => {
        b.classList.remove('active');
      });
      this.classList.add('active');
      
      // 获取选中的AUM组别并更新图表
      const selectedGroup = this.getAttribute('data-group');
      currentAumGroup = selectedGroup;
      drawScatterChart(selectedGroup);
    });
  });
  
  // 初始绘制默认AUM组别的图表
  drawScatterChart(currentAumGroup);
}
  
  // E5: 更新分析内容
  function updateRoaVsAumChangeAnalysis(rmCustData, rmId, aumGroup) {
  const analysisElem = document.getElementById('roaVsAumChangeAnalysis');
  if (!analysisElem) return;
  
  // 筛选当前RM的客户，进一步筛选指定AUM组别的客户
  const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);
  const groupCustomers = rmCustomers.filter(cust => cust.AUM_AVG_GROUP === aumGroup);
  
  // 计算ROA和AUM变化的四个象限的客户数量
  const quadrants = {
    q1: 0, // 高ROA，AUM增加（右上）
    q2: 0, // 低ROA，AUM增加（左上）
    q3: 0, // 低ROA，AUM减少（左下）
    q4: 0  // 高ROA，AUM减少（右下）
  };
  
  const totalCustomers = groupCustomers.length;
  
  if (totalCustomers > 0) {
    // 计算ROA的中位数，用作高低ROA的分界点
    const sortedRoa = [...groupCustomers].sort((a, b) => Number(a.CUST_ROA || 0) - Number(b.CUST_ROA || 0));
    const medianRoa = sortedRoa[Math.floor(sortedRoa.length / 2)].CUST_ROA || 0;
    
    // 统计各象限的客户数量
    groupCustomers.forEach(cust => {
      const roa = Number(cust.CUST_ROA || 0);
      const aumDelta = cust.AUM_DELTA;
      
      if (roa > medianRoa && aumDelta > 0) {
        quadrants.q1++;
      } else if (roa <= medianRoa && aumDelta > 0) {
        quadrants.q2++;
      } else if (roa <= medianRoa && aumDelta <= 0) {
        quadrants.q3++;
      } else if (roa > medianRoa && aumDelta <= 0) {
        quadrants.q4++;
      }
    });
  }
  
  // 计算各象限占比
  const q1Percent = totalCustomers > 0 ? (quadrants.q1 / totalCustomers * 100).toFixed(1) : 0;
  const q2Percent = totalCustomers > 0 ? (quadrants.q2 / totalCustomers * 100).toFixed(1) : 0;
  const q3Percent = totalCustomers > 0 ? (quadrants.q3 / totalCustomers * 100).toFixed(1) : 0;
  const q4Percent = totalCustomers > 0 ? (quadrants.q4 / totalCustomers * 100).toFixed(1) : 0;
  
  // 找出客户数量最多的象限
  let maxQuadrant = 'q1';
  let maxCount = quadrants.q1;
  
  Object.keys(quadrants).forEach(q => {
    if (quadrants[q] > maxCount) {
      maxCount = quadrants[q];
      maxQuadrant = q;
    }
  });
  
  // 根据象限确定描述文本
  const quadrantDesc = {
    q1: "高ROA且AUM增长", 
    q2: "低ROA但AUM增长", 
    q3: "低ROA且AUM下降", 
    q4: "高ROA但AUM下降"
  };
  
  // 计算优质客户指标(右上象限占比)和风险客户指标(左下象限占比)
  const qualityCustomerPercent = q1Percent;
  const riskCustomerPercent = q3Percent;
  
  // 生成分析文本
  let analysisText = '';
  
  if (totalCustomers > 0) {
    analysisText = `
      <p>理财经理<span class="highlight">${rmId}</span>在<span class="highlight">${aumGroup}</span>层级共有<span class="highlight">${totalCustomers}</span>位客户，
      其中最主要的客户分布在<span class="highlight">${quadrantDesc[maxQuadrant]}</span>象限，
      占比<span class="highlight">${maxQuadrant === 'q1' ? q1Percent : 
                                  maxQuadrant === 'q2' ? q2Percent : 
                                  maxQuadrant === 'q3' ? q3Percent : q4Percent}%</span>。</p>
      
      <p><span class="highlight">${quadrants.q1}</span>位客户属于高ROA且AUM增长类型，占比<span class="highlight">${q1Percent}%</span>，
      这部分客户表现优秀，收益率高且资产稳健增长，应重点维护。</p>
      
      <p><span class="highlight">${quadrants.q3}</span>位客户属于低ROA且AUM下降类型，占比<span class="highlight">${q3Percent}%</span>，
      这部分客户可能面临流失风险，需要及时干预。</p>
    `;
    
    // 添加针对性建议
    if (Number(qualityCustomerPercent) > 30) {
      analysisText += `
        <p>建议：右上象限（高ROA且AUM增长）客户占比较高，表现良好，建议总结成功经验并复制推广至其他客户层级。</p>
      `;
    } else if (Number(riskCustomerPercent) > 30) {
      analysisText += `
        <p>建议：左下象限（低ROA且AUM下降）客户占比较高，客户流失风险大，需立即制定挽留计划，提高产品配置效益。</p>
      `;
    } else {
      analysisText += `
        <p>建议：客户整体分布较为分散，建议针对不同象限的客户制定差异化策略，重点向右上方向（高ROA+AUM增长）转化。</p>
      `;
    }
  } else {
    analysisText = `
      <p>理财经理<span class="highlight">${rmId}</span>在<span class="highlight">${aumGroup}</span>层级暂无客户数据。</p>
    `;
  }
  
  // 设置分析内容
  analysisElem.innerHTML = analysisText;
  }
  
  
  // E6: ROA vs 规模变化-Mekko chart 实现
  function initRoaVsAumMekkoChart(selectedRM, rmCustData) {
  if (!selectedRM || !rmCustData || rmCustData.length === 0) {
    console.error("客户 ROA vs 规模变化 Mekko 图数据不完整");
    return;
  }
  
  console.log("开始初始化客户 ROA vs 规模变化 Mekko 图...");
  
  // 获取当前选中RM的ID
  const rmId = selectedRM.RM_ID;
  
  // 获取AUM层级的唯一值列表
  const aumGroups = [
    "30mn+", 
    "6-30Mn", 
    "1-6Mn", 
    "300K-1Mn", 
    "50-300K", 
    "0-50K"
  ].filter(group => rmCustData.some(cust => cust.AUM_AVG_GROUP === group));
  
  // 确保图表容器存在
  const chartContainer = document.getElementById('roaVsAumMekkoChart');
  if (!chartContainer) {
    console.error("找不到图表容器 #roaVsAumMekkoChart");
    return;
  }
  
  // 创建视图切换控制器
  createMekkoViewControl(chartContainer, aumGroups);
  
  // 初始化图表并设置默认视图 (6-30Mn)
  const defaultGroup = aumGroups.includes('6-30Mn') ? '6-30Mn' : aumGroups[0];
  initMekkoViews(rmCustData, aumGroups, rmId, defaultGroup);
  
  console.log("客户 ROA vs 规模变化 Mekko 图初始化完成");
  }
  
  // 创建视图切换控制组件
  function createMekkoViewControl(container, aumGroups) {
  // 创建一个独立的控制容器
  const controlDiv = document.createElement('div');
  controlDiv.id = 'mekkoViewControl';
  controlDiv.style.textAlign = 'center';
  controlDiv.style.marginBottom = '15px';
  controlDiv.style.marginTop = '10px';
  controlDiv.style.zIndex = '100';
  controlDiv.style.position = 'relative';
  
  // 创建模式选择器HTML
  const defaultGroup = aumGroups.includes('6-30Mn') ? '6-30Mn' : aumGroups[0];
  
  controlDiv.innerHTML = `
    <div class="mode-selector">
      ${aumGroups.map(group => 
         `<button class="mode-btn ${group === defaultGroup ? 'active' : ''}" data-group="${group}">${group}</button>`
      ).join('')}
    </div>
  `;
  
  // 将控制容器插入到图表容器之前
  container.parentNode.insertBefore(controlDiv, container);
  
  // 添加样式
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    #mekkoViewControl .mode-selector {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    #mekkoViewControl .mode-btn {
      padding: 6px 15px;
      margin: 0 3px;
      background-color: #091e2c;
      color: #e0e0e0;
      border: 1px solid #4B9CD3;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    #mekkoViewControl .mode-btn.active {
      background-color: #3fa2e9;
      color: white;
      font-weight: bold;
    }
  `;
  document.head.appendChild(styleElement);
  }
  
  // 初始化并管理Mekko图表视图
  function initMekkoViews(rmCustData, aumGroups, rmId, defaultGroup) {
  const chartContainer = document.getElementById('roaVsAumMekkoChart');
  
  // 当前选中的AUM组别
  let currentAumGroup = defaultGroup;
  
  // 定义ROA分位顺序（从左到右）
  const roaRankOrder = [
    'ROA%-Top80%+',
    'ROA%-Top80%',
    'ROA%-Top60%',
    'ROA%-Top40%',
    'ROA%-Top20%'
  ];
  
  // 定义AUM变化顺序（从上到下）
  const aumChangeOrder = ['Up', 'Tie', 'Down'];
  
  // 绘制Mekko图函数
  function drawMekkoChart(aumGroup) {
    // 检查是否已有图表实例
    let chart;
    try {
      chart = echarts.getInstanceByDom(chartContainer);
      if (!chart) {
        chart = echarts.init(chartContainer);
      }
    } catch (e) {
      chart = echarts.init(chartContainer);
    }
    
    // 筛选当前RM的客户，进一步筛选指定AUM组别的客户
    const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);
    const groupCustomers = rmCustomers.filter(cust => cust.AUM_AVG_GROUP === aumGroup);
    
    console.log(`已筛选${groupCustomers.length}位客户属于RM: ${rmId}, AUM层级: ${aumGroup}`);
    
    // 统计数据结构
    const stats = {
      total: groupCustomers.length,
      byRoaRank: {},
      byRoaRankAndAumChange: {}
    };
    
    // 初始化数据结构
    roaRankOrder.forEach(rank => {
      stats.byRoaRank[rank] = 0;
      stats.byRoaRankAndAumChange[rank] = {};
      aumChangeOrder.forEach(change => {
        stats.byRoaRankAndAumChange[rank][change] = 0;
      });
    });
    
    // 统计每个ROA分位的客户总数和各AUM变化状态的客户数
    groupCustomers.forEach(cust => {
      const roaRank = cust.ROA_AUMGROUP_RANK || 'ROA%-Top80%+'; // 默认值为最低分位
      const aumChange = cust.AUM_AVG_UP_DOWN || 'Tie'; // 默认值为持平
      
      // 忽略无效的ROA分位
      if (!roaRankOrder.includes(roaRank)) return;
      
      // 总计
      stats.byRoaRank[roaRank]++;
      
      // 按AUM变化状态统计
      if (aumChangeOrder.includes(aumChange)) {
        stats.byRoaRankAndAumChange[roaRank][aumChange]++;
      } else {
        // 对于未知变化状态，归为Tie
        stats.byRoaRankAndAumChange[roaRank]['Tie']++;
      }
    });
    
    // 准备图表数据
    const series = [];
    const xAxisData = [];
    
    // 1. 计算每个ROA分位列的宽度比例
    const columnWidths = {};
    roaRankOrder.forEach(rank => {
      columnWidths[rank] = stats.total > 0 ? stats.byRoaRank[rank] / stats.total : 0;
      xAxisData.push({
        value: rank,
        textStyle: {
          align: 'center'
        }
      });
    });
    
    // 2. 为每个AUM变化状态创建系列
    aumChangeOrder.forEach((change, index) => {
      const data = [];
      
      roaRankOrder.forEach(rank => {
        const totalInRank = stats.byRoaRank[rank];
        const countInRankAndChange = stats.byRoaRankAndAumChange[rank][change];
        
        // 计算在该ROA分位内，当前AUM变化状态的占比
        const percentage = totalInRank > 0 ? (countInRankAndChange / totalInRank * 100) : 0;
        
        // 收集展示信息
        data.push({
          value: percentage,
          count: countInRankAndChange,
          total: totalInRank,
          countPercentage: percentage.toFixed(1) + '%',
          columnWidthPercentage: (columnWidths[rank] * 100).toFixed(1) + '%',
          aumChange: change,
          roaRank: rank
        });
      });
      
      // 给各种AUM变化状态分配颜色
      let color;
      switch (change) {
        case 'Up':
          color = '#3fa2e9'; // 亮蓝色
          break;
        case 'Tie':
          color = '#1f48c5'; // 深蓝色
          break;
        case 'Down':
          color = '#ff7043'; // 橙色
          break;
        default:
          color = '#9e9e9e'; // 灰色
      }
      
      // 添加系列
      series.push({
        name: aumChangeOrder[index],
        type: 'bar',
        stack: 'total',
        label: {
          show: true,
          formatter: function(params) {
            // 只在数值较大时显示标签
            if (params.data.count < 2) return '';
            return params.data.count;
          },
          color: '#ffffff',
          fontSize: 12
        },
        barWidth: function(params) {
          const rank = params.name;
          // 将百分比转换为像素宽度
          return columnWidths[rank] * 100 + '%';
        },
        itemStyle: {
          color: color
        },
        data: data
      });
    });
    
    // 添加顶部标签系列，显示每个ROA分位的客户总数
    const topLabelData = roaRankOrder.map(rank => {
      return {
        value: stats.byRoaRank[rank],
        roaRank: rank,
        clientCount: stats.byRoaRank[rank]
      };
    });
    
    series.push({
      name: '客户总数',
      type: 'bar',
      stack: 'topLabel',
      silent: true,
      itemStyle: {
        opacity: 0  // 完全透明，仅用于定位标签
      },
      label: {
        show: true,
        position: 'top',
        formatter: function(params) {
          return `${params.data.clientCount}人`;
        },
        color: '#e0e0e0',
        fontSize: 12,
        fontWeight: 'bold'
      },
      barWidth: function(params) {
        const rank = params.name;
        return columnWidths[rank] * 100 + '%';
      },
      data: topLabelData,
      z: -1  // 确保在最底层
    });
    
    // 设置图表配置
    const option = {
      title: {
        text: `${aumGroup}层级客户 %ROA vs 规模变化分布`,
        left: 'center',
        top: 10,
        textStyle: { color: '#e0e0e0', fontSize: 16 }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          const data = params.data;
          if (!data || !data.roaRank) return '';
          
          return `ROA分位: ${data.roaRank}<br>` +
                 `AUM变化: ${data.aumChange || '总计'}<br>` +
                 `客户数: ${data.count || data.clientCount || 0}人<br>` +
                 (data.countPercentage ? `占该分位比例: ${data.countPercentage}<br>` : '') +
                 (data.columnWidthPercentage ? `占总客户比例: ${data.columnWidthPercentage}` : '');
        }
      },
      legend: {
        data: aumChangeOrder,
        left: 'center',
        bottom: 0,
        itemGap: 30,
        textStyle: { color: '#e0e0e0' },
        selectedMode: false // 禁用图例点击
      },
      grid: {
        left: '5%',
        right: '5%',
        top: '70px',
        bottom: '40px',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLabel: {
          color: '#e0e0e0',
          interval: 0,
          rotate: 0
        },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        name: 'ROA分位',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: { color: '#e0e0e0' }
      },
      yAxis: {
        type: 'value',
        name: 'AUM变化占比 (%)',
        nameLocation: 'middle',
        nameGap: 45,
        min: 0,
        max: 100,
        axisLabel: {
          color: '#e0e0e0',
          formatter: '{value}%'
        },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { lineStyle: { color: 'rgba(224, 224, 224, 0.2)' } }
      },
      series: series,
      animationDuration: 1500
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
    
    // 更新分析内容
    updateRoaVsAumMekkoAnalysis(rmCustData, rmId, aumGroup, stats);
  }
  
  // 添加视图切换按钮事件
  document.querySelectorAll('#mekkoViewControl .mode-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      // 更新按钮状态
      document.querySelectorAll('#mekkoViewControl .mode-btn').forEach(b => {
        b.classList.remove('active');
      });
      this.classList.add('active');
      
      // 获取选中的AUM组别并更新图表
      const selectedGroup = this.getAttribute('data-group');
      currentAumGroup = selectedGroup;
      drawMekkoChart(selectedGroup);
    });
  });
  
  // 初始绘制默认AUM组别的图表
  drawMekkoChart(currentAumGroup);
  }
  
  // 更新分析内容
  function updateRoaVsAumMekkoAnalysis(rmCustData, rmId, aumGroup, stats) {
  const analysisElem = document.getElementById('roaVsAumMekkoAnalysis');
  if (!analysisElem) return;
  
  // 定义ROA分位顺序（从高到低）用于分析
  const roaRankOrder = [
    'ROA%-Top20%',
    'ROA%-Top40%',
    'ROA%-Top60%',
    'ROA%-Top80%',
    'ROA%-Top80%+'
  ];
  
  // 定义AUM变化顺序
  const aumChangeOrder = ['Up', 'Tie', 'Down'];
  
  // 判断是否有足够数据进行分析
  if (stats.total === 0) {
    analysisElem.innerHTML = `
      <p>理财经理<span class="highlight">${rmId}</span>在<span class="highlight">${aumGroup}</span>层级暂无客户数据。</p>
    `;
    return;
  }
  
  // 找出客户数最多的ROA分位
  let maxRoaRank = '';
  let maxRoaRankCount = 0;
  
  for (const rank in stats.byRoaRank) {
    if (stats.byRoaRank[rank] > maxRoaRankCount) {
      maxRoaRankCount = stats.byRoaRank[rank];
      maxRoaRank = rank;
    }
  }
  
  // 找出最理想的客户组合：高ROA且AUM上升
  const highRoaUpCount = stats.byRoaRankAndAumChange['ROA%-Top20%']?.['Up'] || 0;
  const highRoaUpPercent = stats.total > 0 ? (highRoaUpCount / stats.total * 100).toFixed(1) : 0;
  
  // 找出最需关注的客户组合：低ROA且AUM下降
  const lowRoaDownCount = stats.byRoaRankAndAumChange['ROA%-Top80%+']?.['Down'] || 0;
  const lowRoaDownPercent = stats.total > 0 ? (lowRoaDownCount / stats.total * 100).toFixed(1) : 0;
  
  // 计算总体AUM变化趋势
  let totalUp = 0;
  let totalDown = 0;
  
  for (const rank in stats.byRoaRankAndAumChange) {
    totalUp += stats.byRoaRankAndAumChange[rank]['Up'] || 0;
    totalDown += stats.byRoaRankAndAumChange[rank]['Down'] || 0;
  }
  
  const upPercent = stats.total > 0 ? (totalUp / stats.total * 100).toFixed(1) : 0;
  const downPercent = stats.total > 0 ? (totalDown / stats.total * 100).toFixed(1) : 0;
  
  // 分析ROA与AUM变化的关系
  let relationshipAnalysis = '';
  
  // 计算高ROA客户（Top20%和Top40%）的AUM上升比例
  const highRoaCustomers = (stats.byRoaRank['ROA%-Top20%'] || 0) + (stats.byRoaRank['ROA%-Top40%'] || 0);
  const highRoaUpCustomers = (stats.byRoaRankAndAumChange['ROA%-Top20%']?.['Up'] || 0) + 
                             (stats.byRoaRankAndAumChange['ROA%-Top40%']?.['Up'] || 0);
  
  const highRoaUpRatio = highRoaCustomers > 0 ? (highRoaUpCustomers / highRoaCustomers * 100).toFixed(1) : 0;
  
  // 计算低ROA客户（Top80%和Top80%+）的AUM下降比例
  const lowRoaCustomers = (stats.byRoaRank['ROA%-Top80%'] || 0) + (stats.byRoaRank['ROA%-Top80%+'] || 0);
  const lowRoaDownCustomers = (stats.byRoaRankAndAumChange['ROA%-Top80%']?.['Down'] || 0) + 
                              (stats.byRoaRankAndAumChange['ROA%-Top80%+']?.['Down'] || 0);
  
  const lowRoaDownRatio = lowRoaCustomers > 0 ? (lowRoaDownCustomers / lowRoaCustomers * 100).toFixed(1) : 0;
  
  // 确定ROA与AUM关系的强度
  if (Number(highRoaUpRatio) > 50 && Number(lowRoaDownRatio) > 50) {
    relationshipAnalysis = `
      <p>数据显示<span class="highlight">ROA</span>与<span class="highlight">AUM变化</span>存在<span class="highlight">强相关性</span>：
      高ROA客户中有<span class="highlight">${highRoaUpRatio}%</span>呈AUM上升趋势，
      低ROA客户中有<span class="highlight">${lowRoaDownRatio}%</span>呈AUM下降趋势。
      这表明客户ROA表现与资产增长具有明显的正相关关系。</p>
    `;
  } else if (Number(highRoaUpRatio) > 40 || Number(lowRoaDownRatio) > 40) {
    relationshipAnalysis = `
      <p>数据显示<span class="highlight">ROA</span>与<span class="highlight">AUM变化</span>存在<span class="highlight">一定相关性</span>：
      高ROA客户中有<span class="highlight">${highRoaUpRatio}%</span>呈AUM上升趋势，
      低ROA客户中有<span class="highlight">${lowRoaDownRatio}%</span>呈AUM下降趋势。
      客户ROA表现与资产变化有一定关联，但也受其他因素影响。</p>
    `;
  } else {
    relationshipAnalysis = `
      <p>数据显示<span class="highlight">ROA</span>与<span class="highlight">AUM变化</span>相关性<span class="highlight">不明显</span>：
      高ROA客户AUM上升比例为<span class="highlight">${highRoaUpRatio}%</span>，
      低ROA客户AUM下降比例为<span class="highlight">${lowRoaDownRatio}%</span>。
      客户资产变化可能受其他因素影响更大。</p>
    `;
  }
  
  // 生成分析文本
  let analysisText = `
    <p>理财经理<span class="highlight">${rmId}</span>在<span class="highlight">${aumGroup}</span>层级共有<span class="highlight">${stats.total}</span>位客户。
    其中客户ROA分布最集中在<span class="highlight">${maxRoaRank}</span>分位，共<span class="highlight">${maxRoaRankCount}</span>位客户。</p>
    
    <p>客户AUM变化整体趋势：<span class="highlight">${upPercent}%</span>的客户资产呈上升趋势，
    <span class="highlight">${downPercent}%</span>的客户资产呈下降趋势。</p>
    
    ${relationshipAnalysis}
  `;
  
  // 添加针对性建议
  if (Number(highRoaUpPercent) >= 20) {
    analysisText += `
      <p>建议：充分挖掘高ROA且AUM上升的<span class="highlight">${highRoaUpCount}</span>位优质客户潜力，
      总结服务经验并向其他客户推广，提升整体ROA和AUM水平。</p>
    `;
  } else if (Number(lowRoaDownPercent) >= 20) {
    analysisText += `
      <p>建议：重点关注低ROA且AUM下降的<span class="highlight">${lowRoaDownCount}</span>位高风险客户，
      制定针对性挽留方案，提升收益率和客户满意度，防止进一步资产流失。</p>
    `;
  } else {
    analysisText += `
      <p>建议：针对不同ROA分位和AUM变化的客户群体实施差异化服务策略，
      重点提升中低ROA客户的产品配置效率，稳固高ROA客户的资产规模。</p>
    `;
  }
  
  // 设置分析内容
  analysisElem.innerHTML = analysisText;
  }
  

// C2.1.1 中间业务收入排名 - 散点图
function initIntermediateRevenueScatter(selectedRM, rmData) {
    const chart = echarts.init(document.getElementById('intermediateRevenueScatter'));
    
    // 筛选所有有效数据
    const validRMs = rmData.filter(rm => 
      rm.cust_aum_scale_group && 
      rm.RM_TD_Rev_aum !== undefined && 
      rm.RM_TD_Rev_aum !== null
    );
    
    // 按管户规模组分组
    const groupOrder = ['A', 'B', 'C', 'D', 'E'];
    const groupedData = {};
    groupOrder.forEach(group => {
      groupedData[group] = validRMs.filter(rm => rm.cust_aum_scale_group === group);
    });
    
    // 准备数据
    const seriesData = [];
    const selectedData = [];
    
    groupOrder.forEach((group, index) => {
      groupedData[group].forEach(rm => {
        const dataPoint = {
          value: [index, rm.RM_TD_Rev_aum / 10000], // X轴是组别索引，Y轴是收入值（万元）
          rmId: rm.RM_ID,
          group: rm.cust_aum_scale_group,
          revenue: rm.RM_TD_Rev_aum / 10000 // 转换为万元
        };
        
        if (rm.RM_ID === selectedRM.RM_ID) {
          selectedData.push(dataPoint);
        } else {
          seriesData.push(dataPoint);
        }
      });
    });
    
    const option = {
      title: {
        show: false
      },
      tooltip: {
        formatter: function(params) {
          return `理财经理: ${params.data.rmId}<br/>` +
                 `管户规模组: ${params.data.group}<br/>` +
                 `中间业务收入: ${formatCurrency(params.data.revenue)} 万元`;
        }
      },
      xAxis: {
        type: 'category',
        data: groupOrder,
        name: '管户规模组',
        nameLocation: 'middle',
        nameGap: 25,
        axisLabel: { color: '#e0e0e0' },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '中间业务收入 (万元)',
        nameLocation: 'middle',
        nameGap: 40,
        axisLabel: { color: '#e0e0e0' },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      },
      grid: {
        left: '10%',
        right: '5%',
        bottom: '15%',
        top: '10%'
      },
      series: [
        {
          type: 'scatter',
          data: seriesData,
          symbolSize: 10,
          itemStyle: {
            color: '#4B9CD3'
          }
        },
        {
          type: 'scatter',
          data: selectedData,
          symbolSize: 15,
          itemStyle: {
            color: '#ff8c00'
          },
          label: {
            show: true,
            formatter: params => params.data.rmId,
            position: 'top',
            color: '#ff8c00',
            fontWeight: 'bold'
          }
        }
      ],
      animationDuration: 1500
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
    
    // 返回选中经理的管户规模组，用于后续图表
    return selectedRM.cust_aum_scale_group;
  }
// C2.1.2 中间业务收入排名 - 纵向柱状图
function initIntermediateRankingBar(selectedRM, rmData, selectedGroup) {
    const chart = echarts.init(document.getElementById('intermediateRankingBar'));
    
    // 筛选同组数据
    const sameGroupRMs = rmData.filter(rm => rm.cust_aum_scale_group === selectedGroup);
    
    // 按中间业务收入排序 (从大到小)
    sameGroupRMs.sort((a, b) => (b.RM_TD_Rev_aum || 0) - (a.RM_TD_Rev_aum || 0));
    
    // 获取选中经理在同组中的排名
    const rmIndex = sameGroupRMs.findIndex(rm => rm.RM_ID === selectedRM.RM_ID);
    const rankPercentile = rmIndex / sameGroupRMs.length * 100;
    
    // 确定评价等级和对应的样式类
    let rankLabel = '';
    let stampClass = '';
    
    if (rankPercentile <= 20) {
      rankLabel = '优秀';
      stampClass = 'stamp-excellent';
    } else if (rankPercentile <= 40) {
      rankLabel = '良好';
      stampClass = 'stamp-good';
    } else if (rankPercentile <= 70) {
      rankLabel = '一般';
      stampClass = 'stamp-average';
    } else {
      rankLabel = '差';
      stampClass = 'stamp-poor';
    }
    
    // 准备数据
    const xData = sameGroupRMs.map(rm => rm.RM_ID);
    const yData = sameGroupRMs.map(rm => (rm.RM_TD_Rev_aum || 0) / 10000);
    
    // 颜色数据
    const barColors = xData.map(id => id === selectedRM.RM_ID ? '#ff8c00' : '#4B9CD3');
    
    const option = {
      title: {
        text: `${selectedGroup}组排名`,
        left: 'center',
        top: 0,
        textStyle: { color: '#e0e0e0', fontSize: 14 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          return `理财经理: ${params[0].name}<br/>` +
                 `中间业务收入: ${(params[0].value).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} 万元`;
        }
      },
      xAxis: {
        type: 'value',
        name: '中间业务收入 (万元)',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: { color: '#e0e0e0' },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'category',
        data: xData,
        axisLabel: { 
          color: '#e0e0e0',
          formatter: function(value) {
            if (value === selectedRM.RM_ID) {
              return '{highlighted|' + value + '}';
            }
            return value;
          },
          rich: {
            highlighted: {
              color: '#ff8c00',
              fontWeight: 'bold'
            }
          }
        },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false },
        // 关键修改: 设置inverse为true，从上到下依次递减
        inverse: true
      },
      grid: {
        left: '15%',
        right: '10%',
        bottom: '10%',
        top: '40px'
      },
      series: [
        {
          type: 'bar',
          data: yData.map((value, index) => ({
            value: value,
            itemStyle: {
              color: barColors[index]
            }
          })),
          label: {
            show: true,
            position: 'right',
            formatter: function(params) {
              return params.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            },
            color: '#e0e0e0'
          }
        }
      ],
      animationDuration: 1500
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
    
    // 在图表容器中添加评级印章
    setTimeout(() => {
      const chartContainer = document.getElementById('intermediateRankingBar').parentNode;
      
      // 检查是否已经存在performance-stamp，如果有则移除
      const existingStamp = chartContainer.querySelector('.performance-stamp');
      if (existingStamp) {
        existingStamp.remove();
      }
      
      // 创建新的performance-stamp
      const stamp = document.createElement('div');
      stamp.className = `performance-stamp ${stampClass}`;
      stamp.textContent = rankLabel;
      
      // 给容器添加position: relative以便于定位印章
      chartContainer.style.position = 'relative';
      
      // 添加印章
      chartContainer.appendChild(stamp);
      
      // 添加排名文本
      const rankDiv = document.getElementById('intermediateRevenueRank');
      if (rankDiv) {
        rankDiv.innerHTML = `
          <div class="rank-text">
            在${selectedGroup}组中排名${rmIndex + 1}/${sameGroupRMs.length}
          </div>
        `;
      }
    }, 500);
  }

// C2.2 中间业务结构 - 堆叠柱状图+折线图
function initIntermediateBusinessChart(selectedRM) {
    const chart = echarts.init(document.getElementById('intermediateBusinessChart'));
    const months = [];
    const totalRevenue = [];
    const wmRevenue = [];
    const fundRevenue = [];
    const insuranceRevenue = [];
    const percentages = [];
  
    for (let i = 1; i <= 6; i++) {
      const monthKey = 7 - i;
      const monthLabel = `月份${monthKey}`;
      const total = selectedRM[`RM_Mrev_${monthKey}`] || 0;
      const aum = selectedRM[`RM_Mrev_aum_${monthKey}`] || 0;
      const wm = selectedRM[`RM_Mrev_wm_${monthKey}`] || 0;
      const fund = selectedRM[`RM_Mrev_fund_${monthKey}`] || 0;
      const insurance = selectedRM[`RM_Mrev_inr_${monthKey}`] || 0;
  
      months.push(monthLabel);
      totalRevenue.push(total / 10000);
      wmRevenue.push(wm / 10000);
      fundRevenue.push(fund / 10000);
      insuranceRevenue.push(insurance / 10000);
  
      const percent = total > 0 ? (aum / total * 100) : 0;
      percentages.push(percent);
    }
  
    months.reverse();
    totalRevenue.reverse();
    wmRevenue.reverse();
    fundRevenue.reverse();
    insuranceRevenue.reverse();
    percentages.reverse();
  
    const option = {
      title: {
        text: '',
        show: false
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function(params) {
          // 只显示堆叠柱状图各系列的 tooltip（不显示汇总系列）
          const barData = params.filter(param => param.seriesType === 'bar' && param.seriesName !== '');
          let result = `${params[0].name}<br/>`;
          barData.forEach(param => {
            result += `${param.seriesName}: ${formatCurrency(param.value)} 万元<br/>`;
          });
          // 对于折线系列，不显示数据标签
          return result;
        }
      },
      legend: {
        data: ['理财', '基金', '保险', '占比'],
        textStyle: { color: '#e0e0e0' },
        top: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '40px',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { color: '#e0e0e0' },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      },
      yAxis: [
        {
          type: 'value',
          name: '收入 (万元)',
          nameTextStyle: { color: '#e0e0e0' },
          // 这里需要添加 min 和 max 的配置，让柱状图更动态
          min: function(value) {
            return Math.max(0, value.min - (value.max - value.min) * 0.2);
          },
          max: function(value) {
            return Math.ceil(value.max * 0.6);
          },
          axisLabel: { color: '#e0e0e0' },
          axisLine: { lineStyle: { color: '#e0e0e0' } },
          splitLine: { show: false }
        },
        {
          type: 'value',
          name: '占比 (%)',
          nameTextStyle: { color: '#e0e0e0' },
          // 这里需要修改 min 和 max 的配置，让折线图更动态
          min: function(value) {
            return Math.max(0, value.min - (value.max - value.min) * 0.2);
          },
          max: function(value) {
            return Math.ceil(value.max * 0.6);
          },
          min: 0,
          max: 100,
          axisLabel: { 
            color: '#e0e0e0',
            formatter: '{value}%'
          },
          axisLine: { lineStyle: { color: '#e0e0e0' } },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '理财',
          type: 'bar',
          stack: '中间业务',
          data: wmRevenue,
          itemStyle: { color: '#3fa2e9' },
          label: {
            show: true,
            position: 'inside',
            formatter: function(params) {
              const index = params.dataIndex;
              const total = wmRevenue[index] + fundRevenue[index] + insuranceRevenue[index];
              const percentage = total > 0 ? (params.value / total * 100).toFixed(1) : '0.0';
              return percentage + '%';
            },
            color: '#ffffff',
            fontSize: 11
          }
        },
        {
          name: '基金',
          type: 'bar',
          stack: '中间业务',
          data: fundRevenue,
          itemStyle: { color: '#66c7ff' },
              // 添加以下 label 配置
          label: {
            show: true,
            position: 'inside',
            formatter: function(params) {
              const index = params.dataIndex;
              const total = wmRevenue[index] + fundRevenue[index] + insuranceRevenue[index];
              const percentage = total > 0 ? (params.value / total * 100).toFixed(1) : '0.0';
              return percentage + '%';
            },
            color: '#ffffff',
            fontSize: 11
          }
        },
        {
          name: '保险',
          type: 'bar',
          stack: '中间业务',
          data: insuranceRevenue,
          itemStyle: { color: '#1f48c5' }
          
        },
        {
          name: '占比',
          type: 'line',
          yAxisIndex: 1,
          data: percentages,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#ff8c00' },
          lineStyle: { width: 2 },
          label: { show: false }
        },
        // 新增汇总系列，只显示每根柱子的总和（单位：万元），透明不影响视觉
        {
          name: '',
          type: 'bar',
          data: totalRevenue,
          barGap: '-100%',
          itemStyle: { color: 'transparent' },
          label: {
           show:false
          }
        }
      ],
      animationDuration: 1500
    };
  
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
  
    return {
      aumData: months.map((month, i) => ({ month, value: totalRevenue[i] })),
      percentData: months.map((month, i) => ({ month, value: percentages[i] })),
      avgPercent: percentages.reduce((sum, val) => sum + val, 0) / percentages.length,
      trend: calculateGrowthRate(months.map((month, i) => ({ month, value: totalRevenue[i] })))
    };
  }
 
// C2.3 万元收益 vs 财富类产品销量-ScatterChart
function initYieldVsSalesScatter(selectedRM, rmData) {
  const chart = echarts.init(document.getElementById('yieldVsSalesScatter'));
  
  // 筛选同组数据
  const selectedGroup = selectedRM.cust_aum_scale_group;
  const sameGroupRMs = rmData.filter(rm => rm.cust_aum_scale_group === selectedGroup);
  
  // 准备数据
  const seriesData = [];
  const selectedData = [];
  
  // 存储最大最小值，用于后续自动调整坐标轴
  let minSales = Infinity, maxSales = -Infinity;
  let minYield = Infinity, maxYield = -Infinity;
  
  sameGroupRMs.forEach(rm => {
    // 计算财富类产品平均AUM - 修改为使用RM_Maum_aum_1-6
    let aumAvg = 0;
    for (let i = 1; i <= 6; i++) {
      aumAvg += Number(rm[`RM_Maum_wm_${i}`] || 0)+ Number(rm[`RM_Maum_fund_${i}`] || 0)+Number(rm[`RM_Maum_inr_${i}`] || 0) ;
    }
    aumAvg = aumAvg / 6;
    const salesValue = aumAvg / 10000;
    const yieldValue = Number(rm.RM_Yld_AUM || 0);
    const bubbleSize = Number(rm.RM_TD_Rev_aum || 0) / 1000; // 气泡大小代表中间业务收入
    
    // 更新最大最小值
    minSales = Math.min(minSales, salesValue);
    maxSales = Math.max(maxSales, salesValue);
    minYield = Math.min(minYield, yieldValue);
    maxYield = Math.max(maxYield, yieldValue);
    
    // 数据点
    const dataPoint = {
      value: [salesValue, yieldValue, bubbleSize],
      rmId: rm.RM_ID
    };
    
    if (rm.RM_ID === selectedRM.RM_ID) {
      selectedData.push(dataPoint);
    } else {
      seriesData.push(dataPoint);
    }
  });
  
  // 为坐标轴增加额外空间，避免点堆积在边缘
  const salesPadding = (maxSales - minSales) * 0.2;
  const yieldPadding = (maxYield - minYield) * 0.2;
  
  const option = {
    title: {
      show: false
    },
    tooltip: {
      formatter: function(params) {
        return `理财经理: ${params.data.rmId}<br/>` +
               `财富类产品平均AUM: ${formatCurrency(params.data.value[0])} 万元<br/>` +
               `万元收益: ${params.data.value[1].toFixed(2)}<br/>` +
               `中间业务收入: ${formatCurrency(params.data.value[2])} 万元`;
      }
    },
    xAxis: {
      type: 'value',
      name: '财富类产品平均AUM (万元)',
      nameLocation: 'middle',
      nameGap: 30,
      min: Math.max(0, minSales - salesPadding),
      max: maxSales + salesPadding,
      axisLabel: { 
        color: '#e0e0e0',
        showMinLabel: false,
        showMaxLabel: false 
      },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '万元收益',
      nameLocation: 'middle',
      nameGap: 40,
      min: Math.max(0, minYield - yieldPadding),
      max: maxYield + yieldPadding,
      axisLabel: { 
        color: '#e0e0e0',
        showMinLabel: false,
        showMaxLabel: false 
      },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    grid: {
      left: '-6%',
      right: '5%',
      bottom: '12%',
      top: '8%',
      containLabel: true
    },
    series: [
      {
        type: 'scatter',
        name: '同组理财经理',
        data: seriesData,
        symbolSize: function(data) {
          // 根据中间业务收入调整气泡大小，确保最小尺寸
          return Math.sqrt(data[2]) * 0.5 + 8;
        },
        itemStyle: {
          color: '#4B9CD3'
        }
      },
      {
        type: 'scatter',
        name: '选中理财经理',
        data: selectedData,
        symbolSize: function(data) {
          // 选中的经理气泡稍大一些
          return Math.sqrt(data[2]) * 0.5 + 12;
        },
        itemStyle: {
          color: '#ff8c00'
        },
        label: {
          show: true,
          formatter: function(params) {
            return params.data.rmId;
          },
          position: 'top',
          color: '#ff8c00',
          fontWeight: 'bold'
        }
      }
    ],
    animationDuration: 1500
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
}
  
// C2.4 细分数据对比：购买人数，销量，以及万元收益
function initDetailedComparison(selectedRM, rmData) {
  const chart = echarts.init(document.getElementById('detailedComparisonChart'));
  
  // 筛选同组数据
  const selectedGroup = selectedRM.cust_aum_scale_group;
  const sameGroupRMs = rmData.filter(rm => rm.cust_aum_scale_group === selectedGroup);
  
  // 当前显示模式（初始为产品销量）
  let currentMode = 'sales';
  
  // 对数据进行预处理，按产品类型分组
function prepareChartData(mode) {
    // 存储选中经理和其他经理的数据，按产品类型分组
    const data = {
      selected: {
        wm: { name: selectedRM.RM_ID, values: [], bubbleSize: 0 },
        fund: { name: selectedRM.RM_ID, values: [], bubbleSize: 0 },
        inr: { name: selectedRM.RM_ID, values: [], bubbleSize: 0 }
      },
      others: {
        wm: [],
        fund: [],
        inr: []
      }
    };
    
    // 遍历所有同组理财经理的数据
    sameGroupRMs.forEach(rm => {
      let isSelected = (rm.RM_ID === selectedRM.RM_ID);
      const bubbleSize = Number(rm.RM_TD_Rev_aum || 0) / 1000;
      
      // 根据不同模式，获取不同的数据指标
      let wmValue, fundValue, inrValue;
      
      if (mode === 'sales') {
        // 计算各产品销量
        let wmSales = 0, fundSales = 0, inrSales = 0;
        for (let i = 1; i <= 6; i++) {
          wmSales += Number(rm[`RM_Mtrx_wm_${i}`] || 0);
          fundSales += Number(rm[`RM_Mtrx_fund_${i}`] || 0);
          inrSales += Number(rm[`RM_Mtrx_inr_${i}`] || 0);
        }
        
        wmValue = wmSales / 10000;
        fundValue = fundSales / 10000;
        inrValue = inrSales / 10000;
      } else if (mode === 'customers') {
        wmValue = Number(rm.RM_wm_custs || 0);
        fundValue = Number(rm.RM_fund_custs || 0);
        inrValue = Number(rm.RM_inr_custs || 0);
      } else if (mode === 'yield') {
        wmValue = Number(rm.RM_Yld_WM || 0);
        fundValue = Number(rm.RM_Yld_fund || 0);
        inrValue = Number(rm.RM_Yld_inr || 0);
      }
      
      // 将数据添加到相应的数组中
      if (isSelected) {
        data.selected.wm.values.push(wmValue);
        data.selected.fund.values.push(fundValue);
        data.selected.inr.values.push(inrValue);
        data.selected.wm.bubbleSize = bubbleSize;
        data.selected.fund.bubbleSize = bubbleSize;
        data.selected.inr.bubbleSize = bubbleSize;
      } else {
        data.others.wm.push({ value: wmValue, bubbleSize, rmId: rm.RM_ID });
        data.others.fund.push({ value: fundValue, bubbleSize, rmId: rm.RM_ID });
        data.others.inr.push({ value: inrValue, bubbleSize, rmId: rm.RM_ID });
      }
    });
    
    return data;
  }
  
  // 初始化为产品销量模式的数据
  let chartData = prepareChartData('sales');
  
  function updateChart() {
    // 确定标题和标签
    let title, yAxisLabels, valueUnit;
    
    if (currentMode === 'sales') {
      title = '产品销量对比';
      yAxisLabels = ['理财产品', '基金产品', '保险产品'];
      valueUnit = '万元';
    } else if (currentMode === 'customers') {
      title = '购买人数对比';
      yAxisLabels = ['理财客户', '基金客户', '保险客户'];
      valueUnit = '人';
    } else {
      title = '万元收益对比';
      yAxisLabels = ['理财收益', '基金收益', '保险收益'];
      valueUnit = '';
    }
    
    // 为每个产品类型计算其他经理的散点数据
    const seriesData = [];
    
    // 为每个产品类型创建一个系列，显示其他经理的数据
    const productTypes = ['wm', 'fund', 'inr'];
    const gridHeight = 100 / 3; // 每个网格的高度百分比
    
    // 为三个图表创建三个系列对
    productTypes.forEach((type, index) => {
      // 其他经理的散点数据
      seriesData.push({
        name: `${yAxisLabels[index]}-其他经理`,
        type: 'scatter',
        xAxisIndex: index,
        yAxisIndex: index,
        symbolSize: function(data) {
          return Math.sqrt(data[2]) * 0.3 + 5;
        },
        itemStyle: { color: '#4B9CD3' },
        data: chartData.others[type].map(item => [item.value, 0, item.bubbleSize, item.rmId])
      });
      
      // 选中经理的散点数据
      seriesData.push({
        name: `${yAxisLabels[index]}-选中经理`,
        type: 'scatter',
        xAxisIndex: index,
        yAxisIndex: index,
        symbolSize: function(data) {
          return Math.sqrt(data[2]) * 0.3 + 10;
        },
        itemStyle: { color: '#ff8c00' },
        label: {
          show: true,
          position: 'right',
          formatter: selectedRM.RM_ID,
          color: '#ff8c00',
          fontWeight: 'bold'
        },
        data: [[chartData.selected[type].values[0], 0, chartData.selected[type].bubbleSize, selectedRM.RM_ID]]
      });
    });
    
    // 为每个产品类型创建一个网格和坐标轴
    const grids = [];
    const xAxes = [];
    const yAxes = [];
    
    productTypes.forEach((type, index) => {
      // 计算网格位置
      grids.push({
        left: '7%',
        right: '5%',
        top: `${index * gridHeight + 5}%`,
        height: `${gridHeight - 10}%`
      });
      
      // 获取该类型的所有数据点，用于计算适当的坐标轴范围
      const allValues = [
        ...chartData.others[type].map(item => item.value),
        ...chartData.selected[type].values
      ];
      
      const min = Math.min(...allValues);
      const max = Math.max(...allValues);
      const range = max - min;
      
      // 为坐标轴增加一些空间，使散点不会太靠近边缘
      const paddingRatio = 0.1;
      const paddingValue = range * paddingRatio;
      
      // X轴设置 - 为万元收益视图特别调整
      let axisMin = Math.max(0, min - paddingValue); // 确保不小于0
      let axisMax = max + paddingValue;
      
      // 当显示万元收益视图时，特别调整坐标轴比例
      if (currentMode === 'yield') {
        // 计算更适合的范围，确保数据点不会挤在一起
        const range = max - min;
        // 如果数据范围太小，增加缓冲空间
        if (range < 0.01) {
          axisMin = Math.max(0, min - range * 0.1);
          axisMax = max/100 + range/100;
        }
        // 如果所有点接近，加大间距
        if (allValues.length > 3 && new Set(allValues.map(v => v.toFixed(1))).size <= 3) {
          axisMin = Math.max(0, min - 0.5);
          axisMax = max + 0.5;
        }
      }
      
      xAxes.push({
        type: 'value',
        gridIndex: index,
        name: index === 1 ? `${currentMode === 'sales' ? '产品销量' : currentMode === 'customers' ? '购买人数' : '万元收益'} (${valueUnit})` : '',
        nameLocation: 'middle',
        nameGap: 30,
        min: axisMin,
        max: axisMax,
        axisLabel: { color: '#e0e0e0' ,
          showMaxLabel: false  ,
          showMinLabel: false // 添加这行，不显示最大值标签
        },
        axisLine: { lineStyle: { color: '#e0e0e0' },show: true },
        splitLine: { show: false }
      });
      
      // Y轴设置（只显示分类标签）
      yAxes.push({
        type: 'category',
        gridIndex: index,
        data: [''],  // 不显示标签
        axisLabel: { show: false },
        axisTick: { show: false },
        axisLine: { show: true, lineStyle: { color: '#e0e0e0' }  }, // 只在底部图表显示轴线
        position: 'left'
      });
    });
    
    // 图表配置
    const option = {
      title: {
        text: title,
        left: 'center',
        top: 0,
        textStyle: { color: '#e0e0e0', fontSize: 14 }
      },
      tooltip: {
        formatter: function(params) {
          const productType = yAxisLabels[params.seriesIndex / 2];
          return `理财经理: ${params.data[3]}<br/>` +
                 `${productType}: ${params.data[0].toFixed(2)} ${valueUnit}`;
        }
      },
      grid: grids,
      xAxis: xAxes,
      yAxis: yAxes,
      series: seriesData,
      // 在图表左侧添加产品类型标签
      graphic: [
        {
          type: 'text',
          left: 5,
          top: '16.7%',
          style: {
            text: yAxisLabels[0],
            textAlign: 'left',
            fill: '#e0e0e0',
            fontSize: 12
          }
        },
        {
          type: 'text',
          left: 5,
          top: '50%',
          style: {
            text: yAxisLabels[1],
            textAlign: 'left',
            fill: '#e0e0e0',
            fontSize: 12
          }
        },
        {
          type: 'text',
          left: 5,
          top: '83.3%',
          style: {
            text: yAxisLabels[2],
            textAlign: 'left',
            fill: '#e0e0e0',
            fontSize: 12
          }
        }
      ],
      animationDuration: 1500
    };
    
    chart.setOption(option);
  }
  
  // 初始化图表
  updateChart();
  
  // 添加模式切换按钮
  const controlDiv = document.getElementById('detailedComparisonControl');
  if (controlDiv) {
    controlDiv.innerHTML = `
      <div class="mode-selector">
        <button class="mode-btn active" data-mode="sales">产品销量</button>
        <button class="mode-btn" data-mode="customers">购买人数</button>
        <button class="mode-btn" data-mode="yield">万元收益</button>
      </div>
    `;
    
    // 添加按钮事件监听
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        currentMode = this.getAttribute('data-mode');
        chartData = prepareChartData(currentMode);
        updateChart();
      });
    });
  }
  
  window.addEventListener('resize', () => chart.resize());
}

// C3.1.1 存款收入排名 - 纵向柱状图
function initDepositRevenueScatter(selectedRM, rmData) {
    const chart = echarts.init(document.getElementById('depositRevenueScatter'));
    
    // 筛选所有有效数据
    const validRMs = rmData.filter(rm => 
      rm.cust_aum_scale_group && 
      rm.RM_TD_Rev_dpt !== undefined && 
      rm.RM_TD_Rev_dpt !== null
    );
    
    // 按管户规模组分组
    const groupOrder = ['A', 'B', 'C', 'D', 'E'];
    const groupedData = {};
    groupOrder.forEach(group => {
      groupedData[group] = validRMs.filter(rm => rm.cust_aum_scale_group === group);
    });
    
    // 准备数据
    const seriesData = [];
    const selectedData = [];
    
    groupOrder.forEach((group, index) => {
      groupedData[group].forEach(rm => {
        const dataPoint = {
          value: [index, rm.RM_TD_Rev_dpt / 10000], // X轴是组别索引，Y轴是收入值（万元）
          rmId: rm.RM_ID,
          group: rm.cust_aum_scale_group,
          revenue: rm.RM_TD_Rev_dpt / 10000 // 转换为万元
        };
        
        if (rm.RM_ID === selectedRM.RM_ID) {
          selectedData.push(dataPoint);
        } else {
          seriesData.push(dataPoint);
        }
      });
    });
    
    const option = {
      title: {
        show: false
      },
      tooltip: {
        formatter: function(params) {
          return `理财经理: ${params.data.rmId}<br/>` +
                 `管户规模组: ${params.data.group}<br/>` +
                 `存款FTP收入: ${formatCurrency(params.data.revenue)} 万元`;
        }
      },
      xAxis: {
        type: 'category',
        data: groupOrder,
        name: '管户规模组',
        nameLocation: 'middle',
        nameGap: 25,
        axisLabel: { color: '#e0e0e0' },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '存款FTP收入 (万元)',
        nameLocation: 'middle',
        nameGap: 40,
        axisLabel: { color: '#e0e0e0' },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      },
      grid: {
        left: '10%',
        right: '5%',
        bottom: '15%',
        top: '10%'
      },
      series: [
        {
          type: 'scatter',
          data: seriesData,
          symbolSize: 10,
          itemStyle: {
            color: '#4B9CD3' // 使用与存款FTP相一致的颜色
          }
        },
        {
          type: 'scatter',
          data: selectedData,
          symbolSize: 15,
          itemStyle: {
            color: '#ff8c00'
          },
          label: {
            show: true,
            formatter: params => params.data.rmId,
            position: 'top',
            color: '#ff8c00',
            fontWeight: 'bold'
          }
        }
      ],
      animationDuration: 1500
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
    
    // 返回选中经理的管户规模组，用于后续图表
    return selectedRM.cust_aum_scale_group;
  }
// C3.1.2 存款收入排名 - 纵向柱状图
function initDepositRankingBar(selectedRM, rmData, selectedGroup) {
    const chart = echarts.init(document.getElementById('depositRankingBar'));
    
    // 筛选同组数据
    const sameGroupRMs = rmData.filter(rm => rm.cust_aum_scale_group === selectedGroup);
    
    // 按存款FTP收入排序 (从大到小)
    sameGroupRMs.sort((a, b) => (b.RM_TD_Rev_dpt || 0) - (a.RM_TD_Rev_dpt || 0));
    
    // 获取选中经理在同组中的排名
    const rmIndex = sameGroupRMs.findIndex(rm => rm.RM_ID === selectedRM.RM_ID);
    const rankPercentile = rmIndex / sameGroupRMs.length * 100;
    
    // 确定评价等级和对应的样式类
    let rankLabel = '';
    let stampClass = '';
    
    if (rankPercentile <= 20) {
      rankLabel = '优秀';
      stampClass = 'stamp-excellent';
    } else if (rankPercentile <= 40) {
      rankLabel = '良好';
      stampClass = 'stamp-good';
    } else if (rankPercentile <= 70) {
      rankLabel = '一般';
      stampClass = 'stamp-average';
    } else {
      rankLabel = '差';
      stampClass = 'stamp-poor';
    }
    
    // 准备数据
    const xData = sameGroupRMs.map(rm => rm.RM_ID);
    const yData = sameGroupRMs.map(rm => (rm.RM_TD_Rev_dpt || 0) / 10000);
    
    // 颜色数据
    const barColors = xData.map(id => id === selectedRM.RM_ID ? '#ff8c00' : '#13294B');
    
    const option = {
      title: {
        text: `${selectedGroup}组排名`,
        left: 'center',
        top: 0,
        textStyle: { color: '#e0e0e0', fontSize: 14 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          return `理财经理: ${params[0].name}<br/>` +
                 `存款FTP收入: ${(params[0].value).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} 万元`;
        }
      },
      xAxis: {
        type: 'value',
        name: '存款FTP收入 (万元)',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: { color: '#e0e0e0' },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'category',
        data: xData,
        axisLabel: { 
          color: '#e0e0e0',
          formatter: function(value) {
            if (value === selectedRM.RM_ID) {
              return '{highlighted|' + value + '}';
            }
            return value;
          },
          rich: {
            highlighted: {
              color: '#ff8c00',
              fontWeight: 'bold'
            }
          }
        },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false },
        inverse: true
      },
      grid: {
        left: '15%',
        right: '10%',
        bottom: '10%',
        top: '40px'
      },
      series: [
        {
          type: 'bar',
          data: yData.map((value, index) => ({
            value: value,
            itemStyle: {
              color: barColors[index]
            }
          })),
          label: {
            show: true,
            position: 'right',
            formatter: function(params) {
              return params.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            },
            color: '#e0e0e0'
          }
        }
      ],
      animationDuration: 1500
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
    
    // 在图表容器中添加评级印章
    setTimeout(() => {
      const chartContainer = document.getElementById('depositRankingBar').parentNode;
      
      // 检查是否已经存在performance-stamp，如果有则移除
      const existingStamp = chartContainer.querySelector('.performance-stamp');
      if (existingStamp) {
        existingStamp.remove();
      }
      
      // 创建新的performance-stamp
      const stamp = document.createElement('div');
      stamp.className = `performance-stamp ${stampClass}`;
      stamp.textContent = rankLabel;
      
      // 给容器添加position: relative以便于定位印章
      chartContainer.style.position = 'relative';
      
      // 添加印章
      chartContainer.appendChild(stamp);
      
      // 添加排名文本
      const rankDiv = document.getElementById('depositRevenueRank');
      if (rankDiv) {
        rankDiv.innerHTML = `
          <div class="rank-text">
            在${selectedGroup}组中排名${rmIndex + 1}/${sameGroupRMs.length}
          </div>
        `;
      }
    }, 500);
  
    // 更新存款收入排名分析
    updateDepositRevenueRankingAnalysis(selectedRM, rmData, selectedGroup, rmIndex, sameGroupRMs.length, rankPercentile);
  }

// C3.2 存款收入分解：Scartter chart 万元收益/活期客户占比
function initDepositBreakdownAnalysis(selectedRM, rmData) {
  const chart = echarts.init(document.getElementById('depositBreakdownAnalysis2'));
  
  // 筛选同组数据
  const selectedGroup = selectedRM.cust_aum_scale_group;
  const sameGroupRMs = rmData.filter(rm => rm.cust_aum_scale_group === selectedGroup);
  
  // 为每个维度准备数据
  const dimensions = ['活期规模占比', '活期人数占比', '存款万元收益'];
  const units = ['%', '%', ''];
  
  // 存储每个维度的数据
  const dimensionData = [[], [], []];
  const selectedDimensionData = [[], [], []];
  const selectedRMStats = {};
  
  // 处理每个理财经理的数据
  sameGroupRMs.forEach(rm => {
    // 计算活期规模占比
    let totalDeposit = 0;
    let currentDeposit = 0;
    for (let i = 1; i <= 6; i++) {
      totalDeposit += Number(rm[`RM_Maum_dpt_${i}`] || 0);
      currentDeposit += Number(rm[`RM_Maum_cdpt_${i}`] || 0);
    }
    const currentDepositRatio = totalDeposit > 0 ? currentDeposit / totalDeposit * 100 : 0;
    
    // 计算活期人数占比
    const currentCustomerRatio = rm.cust_nums > 0 ? Number(rm.RM_cdpt_custs || 0) / Number(rm.cust_nums || 1) * 100 : 0;
    
    // 计算存款万元收益
    const depositYield = Number(rm.RM_Yld_DPT || 0) / 100;
    
    // 收集所有数据点
    const dataPoints = [currentDepositRatio, currentCustomerRatio, depositYield];
    
    if (rm.RM_ID === selectedRM.RM_ID) {
      // 如果是选中的理财经理，存储到选中数据数组
      dataPoints.forEach((value, index) => {
        selectedDimensionData[index].push([value, 0, rm.RM_ID]);
      });
      
      // 存储数据用于分析
      selectedRMStats.currentDepositRatio = currentDepositRatio;
      selectedRMStats.currentCustomerRatio = currentCustomerRatio;
      selectedRMStats.depositYield = depositYield;
    } else {
      // 其他理财经理数据
      dataPoints.forEach((value, index) => {
        dimensionData[index].push([value, 0, rm.RM_ID]);
      });
    }
  });
  
  // 更新分析内容
  updateDepositBreakdownAnalysis(selectedRM, selectedRMStats, sameGroupRMs);
  
  // 为每个维度准备系列
  const series = [];
  
  // 找出每个维度的最小值和最大值，用于自适应坐标轴
  const minValues = [];
  const maxValues = [];
  
  for (let i = 0; i < 3; i++) {
    // 所有数据点，包括选中点和其他点
    const allPoints = [...dimensionData[i].map(point => point[0]), ...selectedDimensionData[i].map(point => point[0])];
    minValues[i] = Math.min(...allPoints);
    maxValues[i] = Math.max(...allPoints);
    
    // 其他理财经理的系列
    series.push({
      name: `${dimensions[i]}-其他经理`,
      type: 'scatter',
      xAxisIndex: i,
      yAxisIndex: i,
      symbolSize: 30,
      itemStyle: { color: '#4B9CD3' },
      data: dimensionData[i]
    });
    
    // 选中理财经理的系列
    series.push({
      name: `${dimensions[i]}-选中经理`,
      type: 'scatter',
      xAxisIndex: i,
      yAxisIndex: i,
      symbolSize: 30,
      itemStyle: { color: '#ff8c00' },
      label: {
        show: true,
        formatter: params => params.data[2],
        position: 'right',
        color: '#ff8c00',
        fontWeight: 'bold'
      },
      data: selectedDimensionData[i]
    });
  }
  
  // 为每个维度准备网格和坐标轴
  const grids = [];
  const xAxes = [];
  const yAxes = [];
  
  const gridHeight = 25; // 每个网格的高度占比
  const gridSpacing = 5; // 网格之间的间距
  
  // 为每个维度创建独立的网格和坐标轴
  dimensions.forEach((dim, index) => {
    // 计算网格位置
    grids.push({
      left: '10%',
      right: '10%',
      top: `${index * (gridHeight + gridSpacing) + 15}%`, // 顶部留出标题空间
      height: `${gridHeight}%`
    });
    
    // 计算坐标轴范围，确保数据点不会挤在一起
    const range = maxValues[index] - minValues[index];
    const padding = range * 0.1; // 添加10%的边距
    
    // X轴 - 值轴
    xAxes.push({
      gridIndex: index,
      type: 'value',
      min: Math.max(0, minValues[index] - padding), // 确保不小于0
      max: maxValues[index] + padding,
      axisLabel: { color: '#e0e0e0' , showMaxLabel: false ,  showMinLabel: false, show: true },// 添加这行，不显示最大值标签 
      axisLine: { lineStyle: { color: '#e0e0e0' }, show: true },
      splitLine: { show: false }
    });
    
    // Y轴 - 类目轴，但只显示标签
    yAxes.push({
      gridIndex: index,
      type: 'category',
      data: [''],  // 空数据，只用于定位
      axisLabel: { show: false },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e0e0e0' } }
    });
  });
  
  // 图表配置
  const option = {
    title: {
      text: '存款收入分解分析',
      left: 'center',
      top: 0,
      textStyle: { color: '#e0e0e0', fontSize: 14 }
    },
    tooltip: {
      formatter: function(params) {
        const rmId = params.data[2];
        const value = params.data[0];
        const dimIndex = Math.floor(params.seriesIndex / 2);
        
        let tooltipText = `理财经理: ${rmId}<br/>`;
        tooltipText += `${dimensions[dimIndex]}: ${value.toFixed(2)}${units[dimIndex]}`;
        
        return tooltipText;
      }
    },
    grid: grids,
    xAxis: xAxes,
    yAxis: yAxes,
    series: series,
    // 在左侧添加标签
    graphic: dimensions.map((dim, index) => ({
      type: 'text',
      left: 10,
      top: `${index * (gridHeight + gridSpacing) + gridHeight/2 + 10}%`,
      style: {
        text: dim,
        textAlign: 'left',
        fill: '#e0e0e0',
        fontSize: 12
      }
    })),
    animationDuration: 1500
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
  
  return selectedRMStats;
}
// C3.3 存款收入结构 - 堆叠柱状图+折线图
function initDepositRevenueChart(selectedRM) {
    const chart = echarts.init(document.getElementById('depositRevenueChart'));
    const months = [];
    const totalRevenue = [];
    const currentDeposit = [];
    const timeDeposit = [];
    const totalDeposit = [];
    const percentages = [];
  
    for (let i = 1; i <= 6; i++) {
      const monthKey = 7 - i;
      const monthLabel = `月份${monthKey}`;
      const total = selectedRM[`RM_Mrev_${monthKey}`] || 0;
      const current = selectedRM[`RM_Mrev_cdpt_${monthKey}`] || 0;
      const time = selectedRM[`RM_Mrev_ddpt_${monthKey}`] || 0;
      const deposit = current + time; 
  
      months.push(monthLabel);
      totalRevenue.push(total / 10000);
      currentDeposit.push(current / 10000);
      timeDeposit.push(time / 10000);
      totalDeposit.push(deposit / 10000);
  
      const percent = total > 0 ? (deposit / total * 100) : 0;
      percentages.push(percent);
    }
  
    months.reverse();
    totalRevenue.reverse();
    currentDeposit.reverse();
    timeDeposit.reverse();
    totalDeposit.reverse();
    percentages.reverse();
  
    const option = {
      title: {
        text: '',
        show: false
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function(params) {
          const barData = params.filter(param => param.seriesType === 'bar' && param.seriesName !== '');
          let result = `${params[0].name}<br/>`;
          barData.forEach(param => {
            result += `${param.seriesName}: ${formatCurrency(param.value)} 万元<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: ['活期', '定期', '占比'],
        textStyle: { color: '#e0e0e0' },
        top: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { color: '#e0e0e0' },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      },
      yAxis: [
        {
          type: 'value',
          name: '收入 (万元)',
          nameTextStyle: { color: '#e0e0e0' },
          axisLabel: { color: '#e0e0e0' },
          axisLine: { lineStyle: { color: '#e0e0e0' } },
          splitLine: { show: false }
        },
        {
          type: 'value',
          name: '占比 (%)',
          nameTextStyle: { color: '#e0e0e0' },
          min: 0,
          max: 100,
          axisLabel: { 
            color: '#e0e0e0',
            formatter: '{value}%'
          },
          axisLine: { lineStyle: { color: '#e0e0e0' } },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '活期',
          type: 'bar',
          stack: '存款',
          data: currentDeposit,
          itemStyle: { color: '#3fa2e9' },
          label: {
            show: true,
            position: 'inside',
            formatter: function(params) {
              // 计算当前系列占总存款的百分比
              const index = params.dataIndex;
              const total = currentDeposit[index] + timeDeposit[index];
              const percentage = total > 0 ? (params.value / total * 100).toFixed(1) : '0.0';
              return percentage + '%';
            },
            color: '#ffffff',
            fontSize: 11
          }
        },
        {
          name: '定期',
          type: 'bar',
          stack: '存款',
          data: timeDeposit,
          itemStyle: { color: '#1f48c5' },
          label: {
            show: true,
            position: 'inside',
            formatter: function(params) {
              // 计算当前系列占总存款的百分比
              const index = params.dataIndex;
              const total = currentDeposit[index] + timeDeposit[index];
              const percentage = total > 0 ? (params.value / total * 100).toFixed(1) : '0.0';
              return percentage + '%';
            },
            color: '#ffffff',
            fontSize: 11
          }
        },
        {
          name: '占比',
          type: 'line',
          yAxisIndex: 1,
          data: percentages,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#ff8c00' },
          lineStyle: { width: 2 },
          label: { show: false }
        },
        {
          name: '',
          type: 'bar',
          data: totalDeposit,
          barGap: '-100%',
          itemStyle: { color: 'transparent' },
          label: {
            show: true,
            position: 'top',
            formatter: function(params) { return formatCurrency(params.value) },
            color: '#e0e0e0'
          }
        }
      ],
      animationDuration: 1500
    };
  
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
  
    return {
      depositData: months.map((month, i) => ({ month, value: totalDeposit[i] })),
      percentData: months.map((month, i) => ({ month, value: percentages[i] })),
      avgPercent: percentages.reduce((sum, val) => sum + val, 0) / percentages.length,
      trend: calculateGrowthRate(months.map((month, i) => ({ month, value: totalDeposit[i] })))
    };
  }
// C4.1.1 信贷收入排名 - 散点图
function initCreditRevenueScatter(selectedRM, rmData) {
    const chart = echarts.init(document.getElementById('creditRevenueScatter'));
    
    // 筛选所有有效数据
    const validRMs = rmData.filter(rm => 
      rm.cust_aum_scale_group && 
      rm.RM_TD_Rev_crt !== undefined && 
      rm.RM_TD_Rev_crt !== null
    );
    
    // 按管户规模组分组
    const groupOrder = ['A', 'B', 'C', 'D', 'E'];
    const groupedData = {};
    groupOrder.forEach(group => {
      groupedData[group] = validRMs.filter(rm => rm.cust_aum_scale_group === group);
    });
    
    // 准备数据
    const seriesData = [];
    const selectedData = [];
    
    groupOrder.forEach((group, index) => {
      groupedData[group].forEach(rm => {
        const dataPoint = {
          value: [index, rm.RM_TD_Rev_crt / 10000], // X轴是组别索引，Y轴是收入值（万元）
          rmId: rm.RM_ID,
          group: rm.cust_aum_scale_group,
          revenue: rm.RM_TD_Rev_crt / 10000 // 转换为万元
        };
        
        if (rm.RM_ID === selectedRM.RM_ID) {
          selectedData.push(dataPoint);
        } else {
          seriesData.push(dataPoint);
        }
      });
    });
    
    const option = {
      title: {
        show: false
      },
      tooltip: {
        formatter: function(params) {
          return `理财经理: ${params.data.rmId}<br/>` +
                 `管户规模组: ${params.data.group}<br/>` +
                 `信贷收入: ${formatCurrency(params.data.revenue)} 万元`;
        }
      },
      xAxis: {
        type: 'category',
        data: groupOrder,
        name: '管户规模组',
        nameLocation: 'middle',
        nameGap: 25,
        axisLabel: { color: '#e0e0e0' },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '信贷收入 (万元)',
        nameLocation: 'middle',
        nameGap: 40,
        axisLabel: { color: '#e0e0e0' },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      },
      grid: {
        left: '10%',
        right: '5%',
        bottom: '15%',
        top: '10%'
      },
      series: [
        {
          type: 'scatter',
          data: seriesData,
          symbolSize: 10,
          itemStyle: {
            color: '#8FD6E1' // 使用与信贷相一致的颜色
          }
        },
        {
          type: 'scatter',
          data: selectedData,
          symbolSize: 15,
          itemStyle: {
            color: '#ff8c00'
          },
          label: {
            show: true,
            formatter: params => params.data.rmId,
            position: 'top',
            color: '#ff8c00',
            fontWeight: 'bold'
          }
        }
      ],
      animationDuration: 1500
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
    
    // 返回选中经理的管户规模组，用于后续图表
    return selectedRM.cust_aum_scale_group;
  }
  
// C4.1.2 信贷收入排名 - 纵向柱状图
function initCreditRankingBar(selectedRM, rmData, selectedGroup) {
    const chart = echarts.init(document.getElementById('creditRankingBar'));
    
    // 筛选同组数据
    const sameGroupRMs = rmData.filter(rm => rm.cust_aum_scale_group === selectedGroup);
    
    // 按信贷收入排序 (从大到小)
    sameGroupRMs.sort((a, b) => (b.RM_TD_Rev_crt || 0) - (a.RM_TD_Rev_crt || 0));
    
    // 获取选中经理在同组中的排名
    const rmIndex = sameGroupRMs.findIndex(rm => rm.RM_ID === selectedRM.RM_ID);
    const rankPercentile = rmIndex / sameGroupRMs.length * 100;
    
    // 确定评价等级和对应的样式类
    let rankLabel = '';
    let stampClass = '';
    
    if (rankPercentile <= 20) {
      rankLabel = '优秀';
      stampClass = 'stamp-excellent';
    } else if (rankPercentile <= 40) {
      rankLabel = '良好';
      stampClass = 'stamp-good';
    } else if (rankPercentile <= 70) {
      rankLabel = '一般';
      stampClass = 'stamp-average';
    } else {
      rankLabel = '差';
      stampClass = 'stamp-poor';
    }
    
    // 准备数据
    const xData = sameGroupRMs.map(rm => rm.RM_ID);
    const yData = sameGroupRMs.map(rm => (rm.RM_TD_Rev_crt || 0) / 10000);
    
    // 颜色数据
    const barColors = xData.map(id => id === selectedRM.RM_ID ? '#ff8c00' : '#8FD6E1');
    
    const option = {
      title: {
        text: `${selectedGroup}组排名`,
        left: 'center',
        top: 0,
        textStyle: { color: '#e0e0e0', fontSize: 14 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          return `理财经理: ${params[0].name}<br/>` +
                 `信贷收入: ${(params[0].value).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} 万元`;
        }
      },
      xAxis: {
        type: 'value',
        name: '信贷收入 (万元)',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: { color: '#e0e0e0' },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'category',
        data: xData,
        axisLabel: { 
          color: '#e0e0e0',
          formatter: function(value) {
            if (value === selectedRM.RM_ID) {
              return '{highlighted|' + value + '}';
            }
            return value;
          },
          rich: {
            highlighted: {
              color: '#ff8c00',
              fontWeight: 'bold'
            }
          }
        },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false },
        // 设置inverse为true，从上到下依次递减
        inverse: true
      },
      grid: {
        left: '15%',
        right: '10%',
        bottom: '10%',
        top: '40px'
      },
      series: [
        {
          type: 'bar',
          data: yData.map((value, index) => ({
            value: value,
            itemStyle: {
              color: barColors[index]
            }
          })),
          label: {
            show: true,
            position: 'right',
            formatter: function(params) {
              return params.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            },
            color: '#e0e0e0'
          }
        }
      ],
      animationDuration: 1500
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
    
    // 在图表容器中添加评级印章
    setTimeout(() => {
      const chartContainer = document.getElementById('creditRankingBar').parentNode;
      
      // 检查是否已经存在performance-stamp，如果有则移除
      const existingStamp = chartContainer.querySelector('.performance-stamp');
      if (existingStamp) {
        existingStamp.remove();
      }
      
      // 创建新的performance-stamp
      const stamp = document.createElement('div');
      stamp.className = `performance-stamp ${stampClass}`;
      stamp.textContent = rankLabel;
      
      // 给容器添加position: relative以便于定位印章
      chartContainer.style.position = 'relative';
      
      // 添加印章
      chartContainer.appendChild(stamp);
      
      // 添加排名文本
      const rankDiv = document.getElementById('creditRevenueRank');
      if (rankDiv) {
        rankDiv.innerHTML = `
          <div class="rank-text">
            在${selectedGroup}组中排名${rmIndex + 1}/${sameGroupRMs.length}
          </div>
        `;
      }
    }, 500);
    
    return {
      rankPercentile,
      rmIndex,
      totalRMs: sameGroupRMs.length,
      selectedGroup
    };
  }

// C4.2 信贷收入分解：信贷规模/信贷客户占比
function initCreditBreakdownAnalysis(selectedRM, rmData) {
  const chart = echarts.init(document.getElementById('creditBreakdownAnalysis'));
  
  // 筛选同组数据
  const selectedGroup = selectedRM.cust_aum_scale_group;
  const sameGroupRMs = rmData.filter(rm => rm.cust_aum_scale_group === selectedGroup);
  
  // 为每个维度准备数据
  const dimensions = ['信贷规模占比', '信贷客户占比'];
  const units = ['%', '%'];
  
  // 存储每个维度的数据
  const dimensionData = [[], []];
  const selectedDimensionData = [[], []];
  const selectedRMStats = {};
  
  // 处理每个理财经理的数据
  sameGroupRMs.forEach(rm => {
    // 计算信贷规模占比
    let totalScale = 0;
    let creditScale = 0;
    for (let i = 1; i <= 6; i++) {
      totalScale += Number(rm[`RM_Maum_${i}`] || 0);
      creditScale += Number(rm[`RM_Maum_crt_${i}`] || 0);
    }
    const creditScaleRatio = totalScale > 0 ? creditScale / totalScale * 100 : 0;
    
    // 计算信贷客户人数占比
    const creditCustomerRatio = rm.cust_nums > 0 ? Number(rm.RM_crt_custs || 0) / Number(rm.cust_nums || 1) * 100 : 0;
    
    // 收集数据点
    const dataPoints = [creditScaleRatio, creditCustomerRatio];
    
    if (rm.RM_ID === selectedRM.RM_ID) {
      // 如果是选中的理财经理，存储到选中数据数组
      dataPoints.forEach((value, index) => {
        selectedDimensionData[index].push([value, 0, rm.RM_ID]);
      });
      
      // 存储数据用于分析
      selectedRMStats.creditScaleRatio = creditScaleRatio;
      selectedRMStats.creditCustomerRatio = creditCustomerRatio;
    } else {
      // 其他理财经理数据
      dataPoints.forEach((value, index) => {
        dimensionData[index].push([value, 0, rm.RM_ID]);
      });
    }
  });
  
  // 更新分析内容
  updateCreditBreakdownAnalysis(selectedRM, selectedRMStats, sameGroupRMs);
  
  // 为每个维度准备系列
  const series = [];
  
  // 找出每个维度的最小值和最大值，用于自适应坐标轴
  const minValues = [];
  const maxValues = [];
  
  for (let i = 0; i < 2; i++) {
    // 所有数据点，包括选中点和其他点
    const allPoints = [...dimensionData[i].map(point => point[0]), ...selectedDimensionData[i].map(point => point[0])];
    minValues[i] = Math.min(...allPoints);
    maxValues[i] = Math.max(...allPoints);
    
    // 其他理财经理的系列
    series.push({
      name: `${dimensions[i]}-其他经理`,
      type: 'scatter',
      xAxisIndex: i,
      yAxisIndex: i,
      symbolSize: 30,
      itemStyle: { color: '#8FD6E1' },
      data: dimensionData[i]
    });
    
    // 选中理财经理的系列
    series.push({
      name: `${dimensions[i]}-选中经理`,
      type: 'scatter',
      xAxisIndex: i,
      yAxisIndex: i,
      symbolSize: 30,
      itemStyle: { color: '#ff8c00' },
      label: {
        show: true,
        formatter: params => params.data[2],
        position: 'right',
        color: '#ff8c00',
        fontWeight: 'bold'
      },
      data: selectedDimensionData[i]
    });
  }
  
  // 为每个维度准备网格和坐标轴
  const grids = [];
  const xAxes = [];
  const yAxes = [];
  
  const gridHeight = 35; // 每个网格的高度占比
  const gridSpacing = 10; // 网格之间的间距
  
  // 为每个维度创建独立的网格和坐标轴
  dimensions.forEach((dim, index) => {
    // 计算网格位置
    grids.push({
      left: '10%',
      right: '10%',
      top: `${index * (gridHeight + gridSpacing) + 15}%`, // 顶部留出标题空间
      height: `${gridHeight}%`
    });
    
    // 计算坐标轴范围，确保数据点不会挤在一起
    const range = maxValues[index] - minValues[index];
    const padding = range * 0.1; // 添加10%的边距
    
    // X轴 - 值轴
    xAxes.push({
      gridIndex: index,
      type: 'value',
      min: Math.max(0, minValues[index] - padding), // 确保不小于0
      max: maxValues[index] + padding,
      axisLabel: { 
        color: '#e0e0e0',
        formatter: function(value) {
          return Math.round(value);
        }
      },
      axisLine: { show: true, lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    });
    
    // Y轴 - 类目轴，但只显示标签
    yAxes.push({
      gridIndex: index,
      type: 'category',
      data: [''],  // 空数据，只用于定位
      axisLabel: { show: true },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e0e0e0' } }
    });
  });
  
  // 图表配置
  const option = {
    title: {
      text: '信贷收入分解分析',
      left: 'center',
      top: 0,
      textStyle: { color: '#e0e0e0', fontSize: 14 }
    },
    tooltip: {
      formatter: function(params) {
        const rmId = params.data[2];
        const value = params.data[0];
        const dimIndex = Math.floor(params.seriesIndex / 2);
        
        let tooltipText = `理财经理: ${rmId}<br/>`;
        tooltipText += `${dimensions[dimIndex]}: ${value.toFixed(2)}${units[dimIndex]}`;
        
        return tooltipText;
      }
    },
    grid: grids,
    xAxis: xAxes,
    yAxis: yAxes,
    series: series,
    // 在左侧添加标签
    graphic: dimensions.map((dim, index) => ({
      type: 'text',
      left: 10,
      top: `${index * (gridHeight + gridSpacing) + gridHeight/2 + 10}%`,
      style: {
        text: dim,
        textAlign: 'left',
        fill: '#e0e0e0',
        fontSize: 12
      }
    })),
    animationDuration: 1500
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
  
  return selectedRMStats;
}

// C4.3 信贷收入结构 - 柱状图+折线图
function initCreditRevenueChart(selectedRM) {
    const chart = echarts.init(document.getElementById('creditRevenueChart'));
    const months = [];
    const totalRevenue = [];
    const creditRevenue = [];
    const percentages = [];
  
    for (let i = 1; i <= 6; i++) {
      const monthKey = 7 - i;
      const monthLabel = `月份${monthKey}`;
      const total = selectedRM[`RM_Mrev_${monthKey}`] || 0;
      const credit = selectedRM[`RM_Mrev_crt_${monthKey}`] || 0;
  
      months.push(monthLabel);
      totalRevenue.push(total / 10000);
      creditRevenue.push(credit / 10000);
  
      const percent = total > 0 ? (credit / total * 100) : 0;
      percentages.push(percent);
    }
  
    months.reverse();
    totalRevenue.reverse();
    creditRevenue.reverse();
    percentages.reverse();
  
    const option = {
      title: {
        text: '',
        show: false
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function(params) {
          const barData = params.find(param => param.seriesType === 'bar');
          let result = `${params[0].name}<br/>`;
          if (barData) {
            result += `信贷收入: ${formatCurrency(barData.value)} 万元<br/>`;
          }
          return result;
        }
      },
      legend: {
        data: ['信贷收入', '占比'],
        textStyle: { color: '#e0e0e0' },
        top: 0
      },
      grid: {
        left: '-5%',
        right: '-2%',
        bottom: '10%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { color: '#e0e0e0' },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false },
        showMinLabel: false,
        showMaxLabel: false 
      },
      yAxis: [
        {
          type: 'value',
          name: '收入 (万元)',
          nameTextStyle: { color: '#e0e0e0' },
          min: function(value) {
            return Math.max(0, value.min - (value.max - value.min) * 0.2);
          },
          max: function(value) {
            return Math.ceil(value.max * 0.9);
          },
          axisLabel: { 
            color: '#e0e0e0',
            showMinLabel: false,
            showMaxLabel: false 
           },
          axisLine: { lineStyle: { color: '#e0e0e0' } },
          splitLine: { show: false },
          
        },
        {
          type: 'value',
          name: '占比 (%)',
          nameTextStyle: { color: '#e0e0e0' },
          // 这里需要添加 min 和 max 的配置，让柱状图更动态
          min: function(value) {
            return Math.max(0, value.min - (value.max - value.min) * 0.2);
          },
          max: function(value) {
            return Math.ceil(value.max * 1.1);
          },
          axisLabel: { 
            color: '#e0e0e0',
            formatter: '{value}%',
            showMinLabel: false,
            showMaxLabel: false 
          },
          axisLine: { lineStyle: { color: '#e0e0e0' } },
          splitLine: { show: false },
          
        }
      ],
      series: [
        {
          name: '信贷收入',
          type: 'bar',
          data: creditRevenue,
          itemStyle: { color: '#3fa2e9' },
          barWidth: '40%',
          label: {
            show: true,
            position: 'top',
            formatter: function(params) { return formatCurrency(params.value) },
            color: '#e0e0e0'
          }
        },
        {
          name: '占比',
          type: 'line',
          yAxisIndex: 1,
          data: percentages,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#ff8c00' },
          lineStyle: { width: 2 },
          label: { show: false }
        }
      ],
      animationDuration: 1500
    };
  
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
  
    return {
      creditData: months.map((month, i) => ({ month, value: creditRevenue[i] })),
      percentData: months.map((month, i) => ({ month, value: percentages[i] })),
      avgPercent: percentages.reduce((sum, val) => sum + val, 0) / percentages.length,
      trend: calculateGrowthRate(months.map((month, i) => ({ month, value: creditRevenue[i] })))
    };
  }
  
// C5.1.1 对公收入排名 - 散点图
function initCorporateRevenueScatter(selectedRM, rmData) {
    const chart = echarts.init(document.getElementById('corporateRevenueScatter'));
    
    // 筛选所有有效数据
    const validRMs = rmData.filter(rm => 
      rm.cust_aum_scale_group && 
      rm.RM_TD_Rev_cpt !== undefined && 
      rm.RM_TD_Rev_cpt !== null
    );
    
    // 按管户规模组分组
    const groupOrder = ['A', 'B', 'C', 'D', 'E'];
    const groupedData = {};
    groupOrder.forEach(group => {
      groupedData[group] = validRMs.filter(rm => rm.cust_aum_scale_group === group);
    });
    
    // 准备数据
    const seriesData = [];
    const selectedData = [];
    
    groupOrder.forEach((group, index) => {
      groupedData[group].forEach(rm => {
        const dataPoint = {
          value: [index, rm.RM_TD_Rev_cpt / 10000], // X轴是组别索引，Y轴是收入值（万元）
          rmId: rm.RM_ID,
          group: rm.cust_aum_scale_group,
          revenue: rm.RM_TD_Rev_cpt / 10000 // 转换为万元
        };
        
        if (rm.RM_ID === selectedRM.RM_ID) {
          selectedData.push(dataPoint);
        } else {
          seriesData.push(dataPoint);
        }
      });
    });
    
    const option = {
      title: {
        show: false
      },
      tooltip: {
        formatter: function(params) {
          return `理财经理: ${params.data.rmId}<br/>` +
                 `管户规模组: ${params.data.group}<br/>` +
                 `对公联动收入: ${formatCurrency(params.data.revenue)} 万元`;
        }
      },
      xAxis: {
        type: 'category',
        data: groupOrder,
        name: '管户规模组',
        nameLocation: 'middle',
        nameGap: 25,
        axisLabel: { color: '#e0e0e0' },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '对公联动收入 (万元)',
        nameLocation: 'middle',
        nameGap: 40,
        axisLabel: { color: '#e0e0e0' },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      },
      grid: {
        left: '10%',
        right: '5%',
        bottom: '15%',
        top: '10%'
      },
      series: [
        {
          type: 'scatter',
          data: seriesData,
          symbolSize: 10,
          itemStyle: {
            color: '#0D47A1' // 使用与对公联动相一致的颜色
          }
        },
        {
          type: 'scatter',
          data: selectedData,
          symbolSize: 15,
          itemStyle: {
            color: '#ff8c00'
          },
          label: {
            show: true,
            formatter: params => params.data.rmId,
            position: 'top',
            color: '#ff8c00',
            fontWeight: 'bold'
          }
        }
      ],
      animationDuration: 1500
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
    
    // 返回选中经理的管户规模组，用于后续图表
    return selectedRM.cust_aum_scale_group;
  }
  
// C5.1.2 对公收入排名 - 纵向柱状图
function initCorporateRankingBar(selectedRM, rmData, selectedGroup) {
    const chart = echarts.init(document.getElementById('corporateRankingBar'));
    
    // 筛选同组数据
    const sameGroupRMs = rmData.filter(rm => rm.cust_aum_scale_group === selectedGroup);
    
    // 按对公联动收入排序 (从大到小)
    sameGroupRMs.sort((a, b) => (b.RM_TD_Rev_cpt || 0) - (a.RM_TD_Rev_cpt || 0));
    
    // 获取选中经理在同组中的排名
    const rmIndex = sameGroupRMs.findIndex(rm => rm.RM_ID === selectedRM.RM_ID);
    const rankPercentile = rmIndex / sameGroupRMs.length * 100;
    
    // 确定评价等级和对应的样式类
    let rankLabel = '';
    let stampClass = '';
    
    if (rankPercentile <= 20) {
      rankLabel = '优秀';
      stampClass = 'stamp-excellent';
    } else if (rankPercentile <= 40) {
      rankLabel = '良好';
      stampClass = 'stamp-good';
    } else if (rankPercentile <= 70) {
      rankLabel = '一般';
      stampClass = 'stamp-average';
    } else {
      rankLabel = '差';
      stampClass = 'stamp-poor';
    }
    
    // 准备数据
    const xData = sameGroupRMs.map(rm => rm.RM_ID);
    const yData = sameGroupRMs.map(rm => (rm.RM_TD_Rev_cpt || 0) / 10000);
    
    // 颜色数据
    const barColors = xData.map(id => id === selectedRM.RM_ID ? '#ff8c00' : '#0D47A1');
    
    const option = {
      title: {
        text: `${selectedGroup}组排名`,
        left: 'center',
        top: 0,
        textStyle: { color: '#e0e0e0', fontSize: 14 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          return `理财经理: ${params[0].name}<br/>` +
                 `对公联动收入: ${(params[0].value).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} 万元`;
        }
      },
      xAxis: {
        type: 'value',
        name: '对公联动收入 (万元)',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: { color: '#e0e0e0' },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'category',
        data: xData,
        axisLabel: { 
          color: '#e0e0e0',
          formatter: function(value) {
            if (value === selectedRM.RM_ID) {
              return '{highlighted|' + value + '}';
            }
            return value;
          },
          rich: {
            highlighted: {
              color: '#ff8c00',
              fontWeight: 'bold'
            }
          }
        },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false },
        // 设置inverse为true，从上到下依次递减
        inverse: true
      },
      grid: {
        left: '15%',
        right: '10%',
        bottom: '10%',
        top: '40px'
      },
      series: [
        {
          type: 'bar',
          data: yData.map((value, index) => ({
            value: value,
            itemStyle: {
              color: barColors[index]
            }
          })),
          label: {
            show: true,
            position: 'right',
            formatter: function(params) {
              return params.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            },
            color: '#e0e0e0'
          }
        }
      ],
      animationDuration: 1500
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
    
    // 在图表容器中添加评级印章
    setTimeout(() => {
      const chartContainer = document.getElementById('corporateRankingBar').parentNode;
      
      // 检查是否已经存在performance-stamp，如果有则移除
      const existingStamp = chartContainer.querySelector('.performance-stamp');
      if (existingStamp) {
        existingStamp.remove();
      }
      
      // 创建新的performance-stamp
      const stamp = document.createElement('div');
      stamp.className = `performance-stamp ${stampClass}`;
      stamp.textContent = rankLabel;
      
      // 给容器添加position: relative以便于定位印章
      chartContainer.style.position = 'relative';
      
      // 添加印章
      chartContainer.appendChild(stamp);
      
      // 添加排名文本
      const rankDiv = document.getElementById('corporateRevenueRank');
      if (rankDiv) {
        rankDiv.innerHTML = `
          <div class="rank-text">
            在${selectedGroup}组中排名${rmIndex + 1}/${sameGroupRMs.length}
          </div>
        `;
      }
    }, 500);
    
    return {
      rankPercentile,
      rmIndex,
      totalRMs: sameGroupRMs.length,
      selectedGroup
    };
  }

// C5.2对公贷收入结构 -折线图
function initCorporateRevenueChart(selectedRM) {
    const chart = echarts.init(document.getElementById('corporateRevenueChart'));
    const months = [];
    const totalRevenue = [];
    const corporateRevenue = [];
    const percentages = [];
  
    for (let i = 1; i <= 6; i++) {
      const monthKey = 7 - i;
      const monthLabel = `月份${monthKey}`;
      const total = selectedRM[`RM_Mrev_${monthKey}`] || 0;
      const corporate = selectedRM[`RM_Mrev_cpt_${monthKey}`] || 0;
  
      months.push(monthLabel);
      totalRevenue.push(total / 10000);
      corporateRevenue.push(corporate / 10000);
  
      const percent = total > 0 ? (corporate / total * 100) : 0;
      percentages.push(percent);
    }
  
    months.reverse();
    totalRevenue.reverse();
    corporateRevenue.reverse();
    percentages.reverse();
    
    // 计算百分比数据的最大值和最小值
    const maxPercent = Math.max(...percentages);
    const minPercent = Math.min(...percentages);
    
    // 动态计算Y轴的范围，让曲线显示在更高位置
    // 首先确定数据范围
    const range = maxPercent - minPercent;
    
    // 设置更大的上部缓冲区，让折线显示在更高位置
    const lowerBuffer = range * 0.2; // 底部只保留20%的缓冲空间
    const upperBuffer = range * 1.5; // 顶部增加150%的缓冲空间
    
    // 计算Y轴的最小值和最大值
    let yMin = Math.max(0, minPercent - lowerBuffer); // 不低于0
    let yMax = maxPercent + upperBuffer;
    
    // 如果数据范围太小，确保至少有10%的显示范围，并且线条位置更高
    if (range < 5) {
      const mid = (minPercent + maxPercent) / 2;
      yMin = Math.max(0, mid - 3);
      yMax = mid + 2; // 加大上部空间
    }
  
    const option = {
      title: {
        text: '',
        show: false
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          return `${params[0].name}<br/>对公贷收入占比: ${formatPercent(params[0].value)}%`;
        }
      },
      legend: {
        data: ['对公收入占比'],
        textStyle: { color: '#e0e0e0' },
        top: 0
      },
      grid: {
        left: '-10%',
        right: '4%',
        bottom: '10%',
        top: '40px',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { color: '#e0e0e0' },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '对公收入占比 (%)',
        nameTextStyle: { color: '#e0e0e0' },
        min: yMin, // 使用动态计算的最小值
        max: yMax, // 使用动态计算的最大值
        axisLabel: { 
          color: '#e0e0e0',
          formatter: '{value}%',
          showMaxLabel: false // 不显示最大值
        },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      },
      series: [
        {
          name: '占比',
          type: 'line',
          data: percentages,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: { color: '#ff8c00' },
          lineStyle: { width: 3 },
          label: {
            show: true,
            position: 'top',
            formatter: function(params) { return params.value.toFixed(1) + '%'; },
            color: '#e0e0e0'
          }
        }
      ],
      animationDuration: 1500
    };
  
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
  
    return {
      corporateData: months.map((month, i) => ({ month, value: corporateRevenue[i] })),
      percentData: months.map((month, i) => ({ month, value: percentages[i] })),
      avgPercent: percentages.reduce((sum, val) => sum + val, 0) / percentages.length,
      trend: calculateGrowthRate(months.map((month, i) => ({ month, value: corporateRevenue[i] })))
    };
  }
  
// 创建连接线和括号元素
function createConnectingElements() {
    const bracket = document.createElement('div');
    bracket.className = 'connecting-bracket';
    bracket.style.position = 'absolute';
    bracket.style.top = '50%';
    bracket.style.left = '48%';
    bracket.style.transform = 'translateY(-50%)';
    bracket.style.width = '30px';
    bracket.style.height = '80%';
    bracket.style.borderRight = '3px solid #3fa2e9';
    bracket.style.borderTop = '3px solid #3fa2e9';
    bracket.style.borderBottom = '3px solid #3fa2e9';
    bracket.style.borderRadius = '0 10px 10px 0';
    bracket.style.zIndex = '5';
  
    const lines = [];
    for (let i = 0; i < 4; i++) {
      const line = document.createElement('div');
      line.className = 'connecting-line';
      line.style.position = 'absolute';
      line.style.left = '30px';
      line.style.height = '3px';
      line.style.width = '15px';
      line.style.backgroundColor = '#3fa2e9';
      lines.push(line);
    }
    lines[0].style.top = '12.5%';
    lines[1].style.top = '37.5%';
    lines[2].style.top = '62.5%';
    lines[3].style.top = '87.5%';
    lines.forEach(line => bracket.appendChild(line));
    return bracket;
  }
  
// C1.1 点评分析:收入结构 - 环形图
function updateRevenueStructureAnalysis(structureData, intermediateData, depositData, creditData, corporateData, selectedRM) {
    const analysisElement = document.getElementById('revenueStructureAnalysis');
    if (!analysisElement) return;
  
    const types = [
      { name: '中间业务', percent: structureData.aumPercent, value: structureData.aum, trend: intermediateData.trend },
      { name: '存款FTP', percent: structureData.dptPercent, value: structureData.dpt, trend: depositData.trend },
      { name: '零售信贷', percent: structureData.crtPercent, value: structureData.crt, trend: creditData.trend },
      { name: '公司联动', percent: structureData.cptPercent, value: structureData.cpt, trend: corporateData.trend }
    ];
  
    types.sort((a, b) => b.percent - a.percent);
    const topType = types[0];
    const secondType = types[1];
    const fastestGrowingType = [...types].sort((a, b) => b.trend - a.trend)[0];
  
    const getTrendDesc = (trend) => {
      if (trend > 10) return "显著增长";
      if (trend > 5) return "稳步增长";
      if (trend > 0) return "略有增长";
      if (trend > -5) return "略有下降";
      if (trend > -10) return "下降明显";
      return "大幅下滑";
    };
  
    analysisElement.innerHTML = `
      <p>理财经理 <span class="highlight">${selectedRM.RM_ID}</span> 的收入总额为 <span class="highlight">${formatCurrency(structureData.total)}</span> 万元，其中：</p>
      <p>主要收入来源为<span class="highlight">${topType.name}</span>，占比 <span class="highlight">${topType.percent}%</span>，绝对值 <span class="highlight">${formatCurrency(topType.value)}</span> 万元，近期趋势${getTrendDesc(topType.trend)}。</p>
      <p>其次是<span class="highlight">${secondType.name}</span>，占比 <span class="highlight">${secondType.percent}%</span>，绝对值 <span class="highlight">${formatCurrency(secondType.value)}</span> 万元。</p>
      <p>值得注意的是，<span class="highlight">${fastestGrowingType.name}</span>近期增长最为显著（${formatPercent(fastestGrowingType.trend)}%）。</p>
      <p>建议：${topType.percent > 50 ? 
        `收入过于依赖${topType.name}，建议拓展其他收入来源，降低单一业务风险` : 
        `收入结构较为均衡，可重点发展${fastestGrowingType.name}，持续优化收入结构`}。</p>
    `;
  }
// C1.2 点评分析:收入结构sanchy chart-分析
function updateRevenueBreakdownAnalysis(selectedRM, data) {
    const analysisElement = document.getElementById('revenueBreakdownAnalysis');
    if (!analysisElement) return;
    
    // 计算各部分占比
    const intermediaryPercent = data.totalRevenue > 0 ? (data.intermediaryRevenue / data.totalRevenue * 100).toFixed(1) : 0;
    const depositPercent = data.totalRevenue > 0 ? (data.depositFTPRevenue / data.totalRevenue * 100).toFixed(1) : 0;
    const creditPercent = data.totalRevenue > 0 ? (data.retailCreditRevenue / data.totalRevenue * 100).toFixed(1) : 0;
    const corporatePercent = data.totalRevenue > 0 ? (data.corporateRevenue / data.totalRevenue * 100).toFixed(1) : 0;
    
    // 计算细分部分占比
    const wmPercent = data.intermediaryRevenue > 0 ? (data.wmRevenue / data.intermediaryRevenue * 100).toFixed(1) : 0;
    const fundPercent = data.intermediaryRevenue > 0 ? (data.fundRevenue / data.intermediaryRevenue * 100).toFixed(1) : 0;
    const insurancePercent = data.intermediaryRevenue > 0 ? (data.insuranceRevenue / data.intermediaryRevenue * 100).toFixed(1) : 0;
    
    const currentDepositPercent = data.depositFTPRevenue > 0 ? (data.currentDepositFTP / data.depositFTPRevenue * 100).toFixed(1) : 0;
    const timeDepositPercent = data.depositFTPRevenue > 0 ? (data.timeDepositFTP / data.depositFTPRevenue * 100).toFixed(1) : 0;
    
    // 判断主要收入来源
    const revenueTypes = [
      { name: '中间业务', value: data.intermediaryRevenue, percent: intermediaryPercent },
      { name: '存款FTP', value: data.depositFTPRevenue, percent: depositPercent },
      { name: '零售信贷', value: data.retailCreditRevenue, percent: creditPercent },
      { name: '公司联动', value: data.corporateRevenue, percent: corporatePercent }
    ];
    
    revenueTypes.sort((a, b) => b.value - a.value);
    const mainRevenue = revenueTypes[0];
    const secondRevenue = revenueTypes[1];
    
    // 判断中间业务的主要来源
    const intermediaryTypes = [
      { name: '理财', value: data.wmRevenue, percent: wmPercent },
      { name: '基金', value: data.fundRevenue, percent: fundPercent },
      { name: '保险', value: data.insuranceRevenue, percent: insurancePercent }
    ];
    
    intermediaryTypes.sort((a, b) => b.value - a.value);
    const mainIntermediary = intermediaryTypes[0];
    
    // 判断存款FTP的主要来源
    const depositTypes = [
      { name: '活期', value: data.currentDepositFTP, percent: currentDepositPercent },
      { name: '定期', value: data.timeDepositFTP, percent: timeDepositPercent }
    ];
    
    depositTypes.sort((a, b) => b.value - a.value);
    const mainDeposit = depositTypes[0];
    
    // 生成分析内容
    analysisElement.innerHTML = `
      <p>理财经理 <span class="highlight">${selectedRM.RM_ID}</span> 的半年总收入为 <span class="highlight">${formatCurrency(data.totalRevenue)}</span> 万元，主要来源为<span class="highlight">${mainRevenue.name}</span>，占总收入的 <span class="highlight">${mainRevenue.percent}%</span>，其次是<span class="highlight">${secondRevenue.name}</span>，占 <span class="highlight">${secondRevenue.percent}%</span>。</p>
      <p>在中间业务收入中，<span class="highlight">${mainIntermediary.name}</span>贡献最大，占中间业务收入的 <span class="highlight">${mainIntermediary.percent}%</span>，为 <span class="highlight">${formatCurrency(mainIntermediary.value)}</span> 万元。</p>
      <p>存款FTP收入方面，<span class="highlight">${mainDeposit.name}</span>存款是主要来源，占存款收入的 <span class="highlight">${mainDeposit.percent}%</span>，为 <span class="highlight">${formatCurrency(mainDeposit.value)}</span> 万元。</p>
      <p>建议：${
        mainRevenue.percent > 50 
          ? `收入结构较为集中在${mainRevenue.name}，建议适当平衡收入来源，降低单一业务风险` 
          : `收入结构相对均衡，可进一步加强${mainRevenue.name}和${secondRevenue.name}业务协同，提升整体收入`
      }。</p>
    `;
  }

  // 点评分析:更新中间业务分析
function updateIntermediateBusinessAnalysis(data, selectedRM) {
    const analysisElement = document.getElementById('intermediateBusinessAnalysis');
    if (!analysisElement) return;
  
    const avgValue = data.aumData.reduce((sum, item) => sum + item.value, 0) / data.aumData.length;
    let maxValue = -Infinity, maxMonth = '';
    let minValue = Infinity, minMonth = '';
  
    data.aumData.forEach(item => {
      if (item.value > maxValue) {
        maxValue = item.value;
        maxMonth = item.month;
      }
      if (item.value < minValue) {
        minValue = item.value;
        minMonth = item.month;
      }
    });
  
    let trendDesc = '';
    if (data.trend > 10) trendDesc = "显著增长";
    else if (data.trend > 5) trendDesc = "稳步增长";
    else if (data.trend > 0) trendDesc = "略有增长";
    else if (data.trend > -5) trendDesc = "略有下降";
    else if (data.trend > -10) trendDesc = "下降明显";
    else trendDesc = "大幅下滑";
  
    analysisElement.innerHTML = `
      <p>理财经理 <span class="highlight">${selectedRM.RM_ID}</span> 的中间业务收入近期呈<span class="highlight">${trendDesc}</span>趋势，平均月度收入 <span class="highlight">${formatCurrency(avgValue)}</span> 万元。</p>
      <p>中间业务收入占总收入比例平均为 <span class="highlight">${formatPercent(data.avgPercent)}%</span>。</p>
      <p>最高收入出现在 <span class="highlight">${maxMonth}</span>，为 <span class="highlight">${formatCurrency(maxValue)}</span> 万元。</p>
      <p>建议：${data.trend < 0 ? 
        '关注中间业务收入下滑原因，加强产品销售培训，提升客户转化率。' : 
        '保持良好势头，进一步挖掘客户理财需求，扩大中间业务收入占比。'}</p>
    `;
  }
  
// 点评分析:更新存款收入分析
function updateDepositRevenueAnalysis(data, selectedRM) {
    const analysisElement = document.getElementById('depositRevenueAnalysis');
    if (!analysisElement) return;
  
    const avgValue = data.depositData.reduce((sum, item) => sum + item.value, 0) / data.depositData.length;
    let maxValue = -Infinity, maxMonth = '';
    let minValue = Infinity, minMonth = '';
  
    data.depositData.forEach(item => {
      if (item.value > maxValue) {
        maxValue = item.value;
        maxMonth = item.month;
      }
      if (item.value < minValue) {
        minValue = item.value;
        minMonth = item.month;
      }
    });
  
    let trendDesc = '';
    if (data.trend > 10) trendDesc = "显著增长";
    else if (data.trend > 5) trendDesc = "稳步增长";
    else if (data.trend > 0) trendDesc = "略有增长";
    else if (data.trend > -5) trendDesc = "略有下降";
    else if (data.trend > -10) trendDesc = "下降明显";
    else trendDesc = "大幅下滑";
  
    analysisElement.innerHTML = `
      <p>理财经理 <span class="highlight">${selectedRM.RM_ID}</span> 的存款收入近期呈<span class="highlight">${trendDesc}</span>趋势，平均月度收入 <span class="highlight">${formatCurrency(avgValue)}</span> 万元。</p>
      <p>存款收入占总收入比例平均为 <span class="highlight">${formatPercent(data.avgPercent)}%</span>。</p>
      <p>最高收入出现在 <span class="highlight">${maxMonth}</span>，为 <span class="highlight">${formatCurrency(maxValue)}</span> 万元。</p>
      <p>建议：${data.trend < 0 ? 
        '关注存款收入下滑原因，加强活期和定期存款营销，尤其是高FTP贡献的存款产品。' : 
        '保持良好势头，进一步优化存款结构，增加定期存款占比，提升存款FTP收益。'}</p>
    `;
  }

// 3.1 点评分析:存款收入排名分析
function updateDepositRevenueRankingAnalysis(selectedRM, rmData, selectedGroup, rmIndex, totalRMs, rankPercentile) {
    const analysisElement = document.getElementById('depositRevenueRankingAnalysis');
    if (!analysisElement) return;
    
    // 计算该组的平均收入
    const sameGroupRMs = rmData.filter(rm => rm.cust_aum_scale_group === selectedGroup);
    const avgRevenue = sameGroupRMs.reduce((sum, rm) => sum + (rm.RM_TD_Rev_dpt || 0), 0) / totalRMs / 10000;
    
    // 计算选中经理与平均值的差异
    const selectedRevenue = (selectedRM.RM_TD_Rev_dpt || 0) / 10000;
    const diffPercent = avgRevenue > 0 ? ((selectedRevenue - avgRevenue) / avgRevenue * 100) : 0;
    
    // 确定评价内容
    let rankDescription, suggestion;
    
    if (rankPercentile <= 20) {
      rankDescription = "表现优秀，位于本组前20%";
      suggestion = "成功将活期和定期存款结构优化，可继续维持高质量的存款结构，扩大FTP收益";
    } else if (rankPercentile <= 40) {
      rankDescription = "表现良好，位于本组前40%";
      suggestion = "可通过提高定期存款占比，增加客户活期+定期配置，进一步提高存款FTP收入";
    } else if (rankPercentile <= 70) {
      rankDescription = "表现一般，位于本组的中等水平";
      suggestion = "建议加强存款营销能力，尤其是高息定期存款产品的推广，提升FTP收入";
    } else {
      rankDescription = "表现有待提升，位于本组后30%";
      suggestion = "需要重点关注存款营销策略，学习组内优秀经理的经验，提高存款规模和结构质量";
    }
    
    // 生成分析内容
    analysisElement.innerHTML = `
      <p>理财经理 <span class="highlight">${selectedRM.RM_ID}</span> 在${selectedGroup}组中排名第 <span class="highlight">${rmIndex + 1}</span>/${totalRMs}，${rankDescription}。</p>
      <p>存款FTP收入为 <span class="highlight">${formatCurrency(selectedRevenue)}</span> 万元，${
        diffPercent > 0 
          ? `高于本组平均值 <span class="highlight">${formatCurrency(avgRevenue)}</span> 万元，超出 <span class="highlight">${formatPercent(diffPercent)}%</span>` 
          : `低于本组平均值 <span class="highlight">${formatCurrency(avgRevenue)}</span> 万元，差距 <span class="highlight">${formatPercent(Math.abs(diffPercent))}%</span>`
      }。</p>
      <p>建议：${suggestion}</p>
    `;
  }

//3.2 点评分析:存款结构分析
function updateDepositBreakdownAnalysis(selectedRM, data, sameGroupRMs) {
    const analysisElement = document.getElementById('depositBreakdownAnalysis3');
    if (!analysisElement) return;
    
    // 计算组内平均值
    let avgCurrentDepositRatio = 0;
    let avgCurrentCustomerRatio = 0;
    let avgDepositYield = 0;
    
    sameGroupRMs.forEach(rm => {
      // 活期规模占比
      let totalDeposit = 0;
      let currentDeposit = 0;
      for (let i = 1; i <= 6; i++) {
        totalDeposit += Number(rm[`RM_Maum_dpt_${i}`] || 0);
        currentDeposit += Number(rm[`RM_Maum_cdpt_${i}`] || 0);
      }
      avgCurrentDepositRatio += totalDeposit > 0 ? currentDeposit / totalDeposit : 0;
      
      // 活期人数占比
      avgCurrentCustomerRatio += rm.cust_nums > 0 ? Number(rm.RM_cdpt_custs || 0) / Number(rm.cust_nums || 1) : 0;
      
      // 存款万元收益
      avgDepositYield += Number(rm.RM_Yld_DPT || 0) / 100;
    });
    
    const count = sameGroupRMs.length;
    avgCurrentDepositRatio /= count;
    avgCurrentCustomerRatio /= count;
    avgDepositYield /= count;
    
    // 与平均值差异
    const currentDepositDiff = data.currentDepositRatio - avgCurrentDepositRatio;
    const currentCustomerDiff = data.currentCustomerRatio - avgCurrentCustomerRatio;
    const depositYieldDiff = data.depositYield - avgDepositYield;
    
    // 生成分析内容
    analysisElement.innerHTML = `
      <p>理财经理 <span class="highlight">${selectedRM.RM_ID}</span> 的存款结构分析：</p>
      <p>活期规模占比为 <span class="highlight">${(data.currentDepositRatio * 1).toFixed(1)}%</span>，${
        currentDepositDiff > 0 
          ? `高于同组平均 <span class="highlight">${(avgCurrentDepositRatio * 100).toFixed(1)}%</span>` 
          : `低于同组平均 <span class="highlight">${(avgCurrentDepositRatio * 100).toFixed(1)}%</span>`
      }。</p>
      <p>活期客户占比为 <span class="highlight">${(data.currentCustomerRatio * 1).toFixed(1)}%</span>，${
        currentCustomerDiff > 0 
          ? `高于同组平均 <span class="highlight">${(avgCurrentCustomerRatio * 100).toFixed(1)}%</span>` 
          : `低于同组平均 <span class="highlight">${(avgCurrentCustomerRatio * 100).toFixed(1)}%</span>`
      }。</p>
      <p>存款万元收益为 <span class="highlight">${(data.depositYield * 100).toFixed(2)}</span>，${
        depositYieldDiff > 0 
          ? `高于同组平均 <span class="highlight">${(avgDepositYield * 100).toFixed(2)}</span>` 
          : `低于同组平均 <span class="highlight">${(avgDepositYield * 100).toFixed(2)}</span>`
      }。</p>
      <p>建议：${
        data.currentDepositRatio > avgCurrentDepositRatio && data.depositYield < avgDepositYield
          ? '当前活期占比较高但收益较低，应加强定期存款营销，提高存款结构收益率。'
          : data.currentDepositRatio < avgCurrentDepositRatio && data.depositYield > avgDepositYield
          ? '当前定期占比较高且收益良好，可保持当前存款结构策略，同时适当发展基础客户。'
          : data.currentDepositRatio > avgCurrentDepositRatio && data.depositYield > avgDepositYield
          ? '当前存款结构平衡且收益良好，可继续保持并拓展客户基础。'
          : '应重点关注存款结构优化，适当提高高收益定期产品比例，提升整体FTP贡献。'
      }</p>
    `;
  }
   // 信贷收入排名分析
function updateCreditRevenueRankingAnalysis(selectedRM, rmData, rankData) {
    const analysisElement = document.getElementById('creditRevenueRankingAnalysis');
    if (!analysisElement) return;
    
    const { selectedGroup, rmIndex, totalRMs, rankPercentile } = rankData;
    
    // 计算该组的平均收入
    const sameGroupRMs = rmData.filter(rm => rm.cust_aum_scale_group === selectedGroup);
    const avgRevenue = sameGroupRMs.reduce((sum, rm) => sum + (rm.RM_TD_Rev_crt || 0), 0) / totalRMs / 10000;
    
    // 计算选中经理与平均值的差异
    const selectedRevenue = (selectedRM.RM_TD_Rev_crt || 0) / 10000;
    const diffPercent = avgRevenue > 0 ? ((selectedRevenue - avgRevenue) / avgRevenue * 100) : 0;
    
    // 确定评价内容
    let rankDescription, suggestion;
    
    if (rankPercentile <= 20) {
      rankDescription = "表现优秀，位于本组前20%";
      suggestion = "继续保持良好的信贷营销能力，可尝试提高单客户信贷额度或拓展优质信贷客户";
    } else if (rankPercentile <= 40) {
      rankDescription = "表现良好，位于本组前40%";
      suggestion = "在控制风险的前提下，可尝试适度增加信贷客户数量，提高整体信贷收入";
    } else if (rankPercentile <= 70) {
      rankDescription = "表现一般，位于本组的中等水平";
      suggestion = "建议加强信贷产品培训，提升客户需求挖掘能力，增加信贷业务占比";
    } else {
      rankDescription = "表现有待提升，位于本组后30%";
      suggestion = "需要重点关注信贷业务能力提升，学习组内优秀经理的经验，提高信贷销售能力";
    }
    
    // 生成分析内容
    analysisElement.innerHTML = `
      <p>理财经理 <span class="highlight">${selectedRM.RM_ID}</span> 在${selectedGroup}组中排名第 <span class="highlight">${rmIndex + 1}</span>/${totalRMs}，${rankDescription}。</p>
      <p>信贷收入为 <span class="highlight">${formatCurrency(selectedRevenue)}</span> 万元，${
        diffPercent > 0 
          ? `高于本组平均值 <span class="highlight">${formatCurrency(avgRevenue)}</span> 万元，超出 <span class="highlight">${formatPercent(diffPercent)}%</span>` 
          : `低于本组平均值 <span class="highlight">${formatCurrency(avgRevenue)}</span> 万元，差距 <span class="highlight">${formatPercent(Math.abs(diffPercent))}%</span>`
      }。</p>
      <p>建议：${suggestion}</p>
    `;
  } 
  // 点评分析: 更新信贷收入分析
function updateCreditRevenueAnalysis(data, selectedRM) {
    const analysisElement = document.getElementById('creditRevenueAnalysis');
    if (!analysisElement) return;
  
    const avgValue = data.creditData.reduce((sum, item) => sum + item.value, 0) / data.creditData.length;
    let maxValue = -Infinity, maxMonth = '';
    let minValue = Infinity, minMonth = '';
  
    data.creditData.forEach(item => {
      if (item.value > maxValue) {
        maxValue = item.value;
        maxMonth = item.month;
      }
      if (item.value < minValue) {
        minValue = item.value;
        minMonth = item.month;
      }
    });
  
    let trendDesc = '';
    if (data.trend > 10) trendDesc = "显著增长";
    else if (data.trend > 5) trendDesc = "稳步增长";
    else if (data.trend > 0) trendDesc = "略有增长";
    else if (data.trend > -5) trendDesc = "略有下降";
    else if (data.trend > -10) trendDesc = "下降明显";
    else trendDesc = "大幅下滑";
  
    analysisElement.innerHTML = `
      <p>理财经理 <span class="highlight">${selectedRM.RM_ID}</span> 的信贷收入近期呈<span class="highlight">${trendDesc}</span>趋势，平均月度收入 <span class="highlight">${formatCurrency(avgValue)}</span> 万元。</p>
      <p>信贷收入占总收入比例平均为 <span class="highlight">${formatPercent(data.avgPercent)}%</span>。</p>
      <p>最高收入出现在 <span class="highlight">${maxMonth}</span>，为 <span class="highlight">${formatCurrency(maxValue)}</span> 万元。</p>
      <p>建议：${data.trend < 0 ? 
        '加强信贷客户挖掘，针对性开展信贷营销活动，提升信贷收入占比。' : 
        '保持良好发展态势，注意控制信贷风险，提高优质客户占比。'}</p>
    `;
  }
  // 信贷收入分解分析
function updateCreditBreakdownAnalysis(selectedRM, data, sameGroupRMs) {
    const analysisElement = document.getElementById('creditBreakdownAnalysis2');
    if (!analysisElement) return;
    
    // 计算组内平均值
    let avgCreditScaleRatio = 0;
    let avgCreditCustomerRatio = 0;
    
    sameGroupRMs.forEach(rm => {
      // 信贷规模占比
      let totalScale = 0;
      let creditScale = 0;
      for (let i = 1; i <= 6; i++) {
        totalScale += Number(rm[`RM_Maum_${i}`] || 0);
        creditScale += Number(rm[`RM_Maum_crt_${i}`] || 0);
      }
      avgCreditScaleRatio += totalScale > 0 ? creditScale / totalScale : 0;
      
      // 信贷客户人数占比
      avgCreditCustomerRatio += rm.cust_nums > 0 ? Number(rm.RM_crt_custs || 0) / Number(rm.cust_nums || 1) : 0;
    });
    
    const count = sameGroupRMs.length;
    avgCreditScaleRatio = avgCreditScaleRatio / count * 100; // 转换为百分比
    avgCreditCustomerRatio = avgCreditCustomerRatio / count * 100; // 转换为百分比
    
    // 与平均值差异
    const creditScaleDiff = data.creditScaleRatio - avgCreditScaleRatio;
    const creditCustomerDiff = data.creditCustomerRatio - avgCreditCustomerRatio;
    
    // 生成分析内容
    let analysis = `
      <p>理财经理 <span class="highlight">${selectedRM.RM_ID}</span> 的信贷结构分析：</p>
      <p>信贷规模占比为 <span class="highlight">${data.creditScaleRatio.toFixed(1)}%</span>，${
        creditScaleDiff > 0 
          ? `高于同组平均 <span class="highlight">${avgCreditScaleRatio.toFixed(1)}%</span>` 
          : `低于同组平均 <span class="highlight">${avgCreditScaleRatio.toFixed(1)}%</span>`
      }。</p>
      <p>信贷客户占比为 <span class="highlight">${data.creditCustomerRatio.toFixed(1)}%</span>，${
        creditCustomerDiff > 0 
          ? `高于同组平均 <span class="highlight">${avgCreditCustomerRatio.toFixed(1)}%</span>` 
          : `低于同组平均 <span class="highlight">${avgCreditCustomerRatio.toFixed(1)}%</span>`
      }。</p>
    `;
    
    // 添加建议
    if (creditScaleDiff > 0 && creditCustomerDiff > 0) {
      analysis += `<p>建议：信贷业务表现良好，可继续保持并优化信贷客户结构，关注高价值客户，提高单客户信贷规模。</p>`;
    } else if (creditScaleDiff > 0 && creditCustomerDiff <= 0) {
      analysis += `<p>建议：信贷规模占比较高但客户数相对较少，应拓展信贷客户覆盖面，避免过度集中风险。</p>`;
    } else if (creditScaleDiff <= 0 && creditCustomerDiff > 0) {
      analysis += `<p>建议：信贷客户基础较好但规模占比较低，可提高单客户信贷额度，深挖现有客户需求。</p>`;
    } else {
      analysis += `<p>建议：信贷业务发展空间较大，应加强信贷产品营销，提高客户覆盖率及信贷规模占比。</p>`;
    }
    
    analysisElement.innerHTML = analysis;
}
  // 点评分析: 更新对公贷收入分析
function updateCorporateRevenueAnalysis(data, selectedRM) {
    const analysisElement = document.getElementById('corporateRevenueAnalysis');
    if (!analysisElement) return;
  
    const avgValue = data.corporateData.reduce((sum, item) => sum + item.value, 0) / data.corporateData.length;
    let maxValue = -Infinity, maxMonth = '';
    let minValue = Infinity, minMonth = '';
  
    data.corporateData.forEach(item => {
      if (item.value > maxValue) {
        maxValue = item.value;
        maxMonth = item.month;
      }
      if (item.value < minValue) {
        minValue = item.value;
        minMonth = item.month;
      }
    });
  
    let trendDesc = '';
    if (data.trend > 10) trendDesc = "显著增长";
    else if (data.trend > 5) trendDesc = "稳步增长";
    else if (data.trend > 0) trendDesc = "略有增长";
    else if (data.trend > -5) trendDesc = "略有下降";
    else if (data.trend > -10) trendDesc = "下降明显";
    else trendDesc = "大幅下滑";
  
    analysisElement.innerHTML = `
      <p>理财经理 <span class="highlight">${selectedRM.RM_ID}</span> 的对公贷收入近期呈<span class="highlight">${trendDesc}</span>趋势，平均月度收入 <span class="highlight">${formatCurrency(avgValue)}</span> 万元。</p>
      <p>对公贷收入占总收入比例平均为 <span class="highlight">${formatPercent(data.avgPercent)}%</span>。</p>
      <p>最高收入出现在 <span class="highlight">${maxMonth}</span>，为 <span class="highlight">${formatCurrency(maxValue)}</span> 万元。</p>
      <p>建议：${data.trend < 0 ? 
        '加强企业客户拓展，提升对公业务营销能力，增加联动收入。' : 
        '持续深化客户合作关系，挖掘企业上下游资源，扩大联动业务规模。'}</p>
    `;
  }
  // 点评分析: 中间业务收入排名分析 (续)
function updateIntermediateRevenueAnalysis(selectedRM, rmData, selectedGroup) {
    const analysisElement = document.getElementById('intermediateRevenueAnalysis');
    if (!analysisElement) return;
    
    // 筛选同组数据
    const sameGroupRMs = rmData.filter(rm => rm.cust_aum_scale_group === selectedGroup);
    
    // 按中间业务收入排序
    sameGroupRMs.sort((a, b) => (b.RM_TD_Rev_aum || 0) - (a.RM_TD_Rev_aum || 0));
    
    // 获取选中经理在同组中的排名
    const rmIndex = sameGroupRMs.findIndex(rm => rm.RM_ID === selectedRM.RM_ID);
    const rankPercentile = rmIndex / sameGroupRMs.length * 100;
    const totalRMs = sameGroupRMs.length;
    
    // 计算该组的平均收入
    const avgRevenue = sameGroupRMs.reduce((sum, rm) => sum + (rm.RM_TD_Rev_aum || 0), 0) / totalRMs / 10000;
    
    // 计算选中经理与平均值的差异
    const selectedRevenue = (selectedRM.RM_TD_Rev_aum || 0) / 10000;
    const diffPercent = avgRevenue > 0 ? ((selectedRevenue - avgRevenue) / avgRevenue * 100) : 0;
    
    // 确定评价内容
    let rankDescription, suggestion;
    
    if (rankPercentile <= 20) {
      rankDescription = "表现优秀，位于本组前20%";
      suggestion = "可以尝试进一步拓展产品线，提高单客户产品销售量，同时分享成功经验给其他团队成员";
    } else if (rankPercentile <= 40) {
      rankDescription = "表现良好，位于本组前40%";
      suggestion = "可通过增加产品销售种类或提升客户活跃度来进一步提高中间业务收入";
    } else if (rankPercentile <= 70) {
      rankDescription = "表现一般，位于本组的中等水平";
      suggestion = "建议加强产品知识培训，提高销售技巧，提升中间业务收入";
    } else {
      rankDescription = "表现有待提升，位于本组后30%";
      suggestion = "需要重点关注，建议学习组内优秀经理的经验，针对性提高中间业务销售能力";
    }
    
    // 生成分析内容
    analysisElement.innerHTML = `
      <p>理财经理 <span class="highlight">${selectedRM.RM_ID}</span> 在${selectedGroup}组中排名第 <span class="highlight">${rmIndex + 1}</span>/${totalRMs}，${rankDescription}。</p>
      <p>中间业务收入为 <span class="highlight">${formatCurrency(selectedRevenue)}</span> 万元，${
        diffPercent > 0 
          ? `高于本组平均值 <span class="highlight">${formatCurrency(avgRevenue)}</span> 万元，超出 <span class="highlight">${formatPercent(diffPercent)}%</span>` 
          : `低于本组平均值 <span class="highlight">${formatCurrency(avgRevenue)}</span> 万元，差距 <span class="highlight">${formatPercent(Math.abs(diffPercent))}%</span>`
      }。</p>
      <p>建议：${suggestion}</p>
    `;
  }
  
  // 点评分析: 万元收益 vs 财富类产品销量分析
function updateYieldVsSalesAnalysis(selectedRM, rmData) {
    const analysisElement = document.getElementById('yieldVsSalesAnalysis');
    if (!analysisElement) return;
    
    // 筛选同组数据
    const selectedGroup = selectedRM.cust_aum_scale_group;
    const sameGroupRMs = rmData.filter(rm => rm.cust_aum_scale_group === selectedGroup);
    
    // 计算选中经理的指标
    let selectedSales = 0;
    for (let i = 1; i <= 6; i++) {
      selectedSales += Number(selectedRM[`RM_Mtrx_aum_${i}`] || 0);
    }
    selectedSales = selectedSales / 6 / 10000; // 平均月销量（万元）
    
    const selectedYield = Number(selectedRM.RM_Yld_AUM || 0);
    const selectedScale = Number(selectedRM.RM_Yaum_2025 || 0) / 10000; // 管理规模（万元）
    
    // 计算组内平均值
    let groupSalesSum = 0, groupYieldSum = 0, groupScaleSum = 0;
    
    sameGroupRMs.forEach(rm => {
      let sales = 0;
      for (let i = 1; i <= 6; i++) {
        sales += Number(rm[`RM_Mtrx_aum_${i}`] || 0);
      }
      groupSalesSum += sales / 6;
      groupYieldSum += Number(rm.RM_Yld_AUM || 0);
      groupScaleSum += Number(rm.RM_Yaum_2025 || 0);
    });
    
    const avgSales = groupSalesSum / sameGroupRMs.length / 10000;
    const avgYield = groupYieldSum / sameGroupRMs.length;
    const avgScale = groupScaleSum / sameGroupRMs.length / 10000;
    
    // 计算相对表现
    const salesPerformance = avgSales > 0 ? ((selectedSales - avgSales) / avgSales * 100) : 0;
    const yieldPerformance = avgYield > 0 ? ((selectedYield - avgYield) / avgYield * 100) : 0;
    const scalePerformance = avgScale > 0 ? ((selectedScale - avgScale) / avgScale * 100) : 0;
    
    // 生成分析内容
    let analysis = `
      <p>理财经理 <span class="highlight">${selectedRM.RM_ID}</span> 的财富类产品平均月销量为 <span class="highlight">${formatCurrency(selectedSales)}</span> 万元，${
        salesPerformance > 0 
          ? `高于${selectedGroup}组平均值 <span class="highlight">${formatCurrency(avgSales)}</span> 万元，超出 <span class="highlight">${formatPercent(salesPerformance)}%</span>` 
          : `低于${selectedGroup}组平均值 <span class="highlight">${formatCurrency(avgSales)}</span> 万元，差距 <span class="highlight">${formatPercent(Math.abs(salesPerformance))}%</span>`
      }。</p>
      <p>万元收益为 <span class="highlight">${selectedYield.toFixed(2)}</span>，${
        yieldPerformance > 0 
          ? `高于${selectedGroup}组平均值 <span class="highlight">${avgYield.toFixed(2)}</span>，表现较好` 
          : `低于${selectedGroup}组平均值 <span class="highlight">${avgYield.toFixed(2)}</span>，有提升空间`
      }。</p>
      <p>管理规模为 <span class="highlight">${formatCurrency(selectedScale)}</span> 万元，${
        scalePerformance > 0 
          ? `高于组平均值 <span class="highlight">${formatCurrency(avgScale)}</span> 万元` 
          : `低于组平均值 <span class="highlight">${formatCurrency(avgScale)}</span> 万元`
      }。</p>
    `;
    
    // 添加建议
    if (salesPerformance > 0 && yieldPerformance > 0) {
      analysis += `<p>建议：当前销量和收益表现均优秀，可尝试拓展高收益产品，进一步提升整体业绩。</p>`;
    } else if (salesPerformance > 0 && yieldPerformance <= 0) {
      analysis += `<p>建议：销量表现良好但收益率偏低，建议优化产品结构，增加高收益产品的销售比例。</p>`;
    } else if (salesPerformance <= 0 && yieldPerformance > 0) {
      analysis += `<p>建议：收益率表现良好但销量有待提高，建议扩大客户覆盖面，增加营销频次。</p>`;
    } else {
      analysis += `<p>建议：销量和收益均有提升空间，建议全面加强产品知识培训和销售技巧，提高客户转化率。</p>`;
    }
    
    analysisElement.innerHTML = analysis;
  }
  // 点评分析: 细分数据对比分析
function updateDetailedComparisonAnalysis(selectedRM, rmData) {
    const analysisElement = document.getElementById('detailedComparisonAnalysis');
    if (!analysisElement) return;
    
    // 筛选同组数据
    const selectedGroup = selectedRM.cust_aum_scale_group;
    const sameGroupRMs = rmData.filter(rm => rm.cust_aum_scale_group === selectedGroup);
    
    // 计算各项指标
    // 1. 理财产品数据
    const wmCusts = Number(selectedRM.RM_wm_custs || 0);
    let wmSales = 0;
    for (let i = 1; i <= 6; i++) {
      wmSales += Number(selectedRM[`RM_Mtrx_wm_${i}`] || 0);
    }
    wmSales = wmSales / 6 / 10000; // 平均月销量（万元）
    const wmYield = Number(selectedRM.RM_Yld_WM || 0);
    
    // 2. 基金产品数据
    const fundCusts = Number(selectedRM.RM_fund_custs || 0);
    let fundSales = 0;
    for (let i = 1; i <= 6; i++) {
      fundSales += Number(selectedRM[`RM_Mtrx_fund_${i}`] || 0);
    }
    fundSales = fundSales / 6 / 10000; // 平均月销量（万元）
    const fundYield = Number(selectedRM.RM_Yld_fund || 0);
    
    // 3. 保险产品数据
    const inrCusts = Number(selectedRM.RM_inr_custs || 0);
    let inrSales = 0;
    for (let i = 1; i <= 6; i++) {
      inrSales += Number(selectedRM[`RM_Mtrx_inr_${i}`] || 0);
    }
    inrSales = inrSales / 6 / 10000; // 平均月销量（万元）
    const inrYield = Number(selectedRM.RM_Yld_inr || 0);
    
    // 计算组内平均值
    let avgWmCusts = 0, avgFundCusts = 0, avgInrCusts = 0;
    let avgWmSales = 0, avgFundSales = 0, avgInrSales = 0;
    let avgWmYield = 0, avgFundYield = 0, avgInrYield = 0;
    
    sameGroupRMs.forEach(rm => {
      // 客户数
      avgWmCusts += Number(rm.RM_wm_custs || 0);
      avgFundCusts += Number(rm.RM_fund_custs || 0);
      avgInrCusts += Number(rm.RM_inr_custs || 0);
      
      // 销量
      let wmS = 0, fundS = 0, inrS = 0;
      for (let i = 1; i <= 6; i++) {
        wmS += Number(rm[`RM_Mtrx_wm_${i}`] || 0);
        fundS += Number(rm[`RM_Mtrx_fund_${i}`] || 0);
        inrS += Number(rm[`RM_Mtrx_inr_${i}`] || 0);
      }
      avgWmSales += wmS / 6;
      avgFundSales += fundS / 6;
      avgInrSales += inrS / 6;
      
      // 收益
      avgWmYield += Number(rm.RM_Yld_WM || 0);
      avgFundYield += Number(rm.RM_Yld_fund || 0);
      avgInrYield += Number(rm.RM_Yld_inr || 0);
    });
    
    const count = sameGroupRMs.length;
    
    // 客户数平均值
    avgWmCusts /= count;
    avgFundCusts /= count;
    avgInrCusts /= count;
    
    // 销量平均值（万元）
    avgWmSales = avgWmSales / count / 10000;
    avgFundSales = avgFundSales / count / 10000;
    avgInrSales = avgInrSales / count / 10000;
    
    // 收益平均值
    avgWmYield /= count;
    avgFundYield /= count;
    avgInrYield /= count;
    
    // 找出相对优势产品和劣势产品
    const products = [
      { 
        name: '理财产品', 
        salesDiff: (wmSales - avgWmSales) / avgWmSales * 100,
        custsDiff: (wmCusts - avgWmCusts) / avgWmCusts * 100,
        yieldDiff: (wmYield - avgWmYield) / avgWmYield * 100,
        sales: wmSales,
        custs: wmCusts,
        yield: wmYield,
        avgSales: avgWmSales,
        avgCusts: avgWmCusts,
        avgYield: avgWmYield
      },
      { 
        name: '基金产品', 
        salesDiff: (fundSales - avgFundSales) / avgFundSales * 100,
        custsDiff: (fundCusts - avgFundCusts) / avgFundCusts * 100,
        yieldDiff: (fundYield - avgFundYield) / avgFundYield * 100,
        sales: fundSales,
        custs: fundCusts,
        yield: fundYield,
        avgSales: avgFundSales,
        avgCusts: avgFundCusts,
        avgYield: avgFundYield
      },
      { 
        name: '保险产品', 
        salesDiff: (inrSales - avgInrSales) / avgInrSales * 100,
        custsDiff: (inrCusts - avgInrCusts) / avgInrCusts * 100,
        yieldDiff: (inrYield - avgInrYield) / avgInrYield * 100,
        sales: inrSales,
        custs: inrCusts,
        yield: inrYield,
        avgSales: avgInrSales,
        avgCusts: avgInrCusts,
        avgYield: avgInrYield
      }
    ];
    
    // 按销量表现排序
    products.sort((a, b) => b.salesDiff - a.salesDiff);
    
    // 优势产品是排名第一的，劣势产品是排名最后的
    const bestProduct = products[0];
    const worstProduct = products[products.length - 1];
    
    // 生成分析内容
    let analysis = `
      <p>理财经理 <span class="highlight">${selectedRM.RM_ID}</span> 在中间业务细分产品中：</p>
      <p><span class="highlight">${bestProduct.name}</span>表现最佳，销量为<span class="highlight">${formatCurrency(bestProduct.sales)}</span>万元，${
        bestProduct.salesDiff > 0 
          ? `高于组平均值<span class="highlight">${formatCurrency(bestProduct.avgSales)}</span>万元，超出<span class="highlight">${formatPercent(bestProduct.salesDiff)}%</span>` 
          : `接近组平均值<span class="highlight">${formatCurrency(bestProduct.avgSales)}</span>万元`
      }；客户数为<span class="highlight">${bestProduct.custs}</span>，${
        bestProduct.custsDiff > 0 
          ? `高于平均值<span class="highlight">${Math.round(bestProduct.avgCusts)}</span>` 
          : `接近平均值<span class="highlight">${Math.round(bestProduct.avgCusts)}</span>`
      }。</p>
      
      <p><span class="highlight">${worstProduct.name}</span>有提升空间，销量为<span class="highlight">${formatCurrency(worstProduct.sales)}</span>万元，${
        worstProduct.salesDiff < 0 
          ? `低于组平均值<span class="highlight">${formatCurrency(worstProduct.avgSales)}</span>万元，差距<span class="highlight">${formatPercent(Math.abs(worstProduct.salesDiff))}%</span>` 
          : `接近组平均值<span class="highlight">${formatCurrency(worstProduct.avgSales)}</span>万元`
      }；万元收益为<span class="highlight">${worstProduct.yield.toFixed(2)}</span>，${
        worstProduct.yieldDiff < 0 
          ? `低于平均值<span class="highlight">${worstProduct.avgYield.toFixed(2)}</span>` 
          : `接近平均值<span class="highlight">${worstProduct.avgYield.toFixed(2)}</span>`
      }。</p>
    `;
    
    // 添加建议
    if (bestProduct.salesDiff > 20) {
      analysis += `<p>建议：继续发挥${bestProduct.name}优势，同时加强${worstProduct.name}的营销和客户教育，平衡产品销售结构，增加整体收益。</p>`;
    } else if (worstProduct.salesDiff < -20) {
      analysis += `<p>建议：针对${worstProduct.name}，制定专项提升计划，加强产品知识培训，提高销售能力，缩小与平均水平的差距。</p>`;
    } else {
      analysis += `<p>建议：产品销售结构较为均衡，可考虑策略性提升单客户产品覆盖度，增加交叉销售机会，提高整体收益率。</p>`;
    }
    
    analysisElement.innerHTML = analysis;
  }
// 对公收入排名分析
function updateCorporateRevenueRankingAnalysis(selectedRM, rmData, rankData) {
    const analysisElement = document.getElementById('corporateRevenueRankingAnalysis');
    if (!analysisElement) return;
    
    const { selectedGroup, rmIndex, totalRMs, rankPercentile } = rankData;
    
    // 计算该组的平均收入
    const sameGroupRMs = rmData.filter(rm => rm.cust_aum_scale_group === selectedGroup);
    const avgRevenue = sameGroupRMs.reduce((sum, rm) => sum + (rm.RM_TD_Rev_cpt || 0), 0) / totalRMs / 10000;
    
    // 计算选中经理与平均值的差异
    const selectedRevenue = (selectedRM.RM_TD_Rev_cpt || 0) / 10000;
    const diffPercent = avgRevenue > 0 ? ((selectedRevenue - avgRevenue) / avgRevenue * 100) : 0;
    
    // 确定评价内容
    let rankDescription, suggestion;
    
    if (rankPercentile <= 20) {
      rankDescription = "表现优秀，位于本组前20%";
      suggestion = "继续保持良好的对公业务拓展能力，可尝试深挖现有企业客户的上下游资源";
    } else if (rankPercentile <= 40) {
      rankDescription = "表现良好，位于本组前40%";
      suggestion = "可通过加强与公司板块的协同，挖掘更多优质企业客户资源";
    } else if (rankPercentile <= 70) {
      rankDescription = "表现一般，位于本组的中等水平";
      suggestion = "建议提升对公业务营销能力，加强对企业客户需求的把握，提高联动效率";
    } else {
      rankDescription = "表现有待提升，位于本组后30%";
      suggestion = "需要重点关注对公业务能力提升，学习优秀同行经验，加强公私联动意识";
    }
    
    // 生成分析内容
    analysisElement.innerHTML = `
      <p>理财经理 <span class="highlight">${selectedRM.RM_ID}</span> 在${selectedGroup}组中排名第 <span class="highlight">${rmIndex + 1}</span>/${totalRMs}，${rankDescription}。</p>
      <p>对公联动收入为 <span class="highlight">${formatCurrency(selectedRevenue)}</span> 万元，${
        diffPercent > 0 
          ? `高于本组平均值 <span class="highlight">${formatCurrency(avgRevenue)}</span> 万元，超出 <span class="highlight">${formatPercent(diffPercent)}%</span>` 
          : `低于本组平均值 <span class="highlight">${formatCurrency(avgRevenue)}</span> 万元，差距 <span class="highlight">${formatPercent(Math.abs(diffPercent))}%</span>`
      }。</p>
      <p>建议：${suggestion}</p>
    `;
  }

  // 整合后的导出函数 - 替换当前的loadC1Module和loadC2Module
export function loadIncomeStructureModule(selectedRM, rmData, rmCustData) {
    if (!selectedRM || !rmData || rmData.length === 0) {
      console.error("加载收入结构模块时数据不完整");
      return;
    }
    
    console.log("开始加载收入结构模块，选中理财经理:", selectedRM.RM_ID);
    
    try {
      // 创建主容器
      const container = document.createElement('div');
      container.id = 'C1Module';
      container.innerHTML = `
          
          <!-- C1.1 收入结构 - 旭日图 -->
        <div class="chart-container">
          <div class="chart-header">
            <div class="chart-title">
              <i class="fas fa-braille"></i> C1.1 收入整体结构
            </div>
          </div>
          <div class="chart-flex">
            <div class="chart-area">
              <div id="selectedRMRevenueChart" style="width: 100%; height: 400px;"></div>
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
          
          <!-- C1.2 收入分解 - 桑基图 -->
        <div class="chart-container">
        <div class="chart-header">
            <div class="chart-title">
            <i class="fas fa-stream"></i> C1.2 收入分解
            </div>
        </div>
        <div class="chart-flex">
            <div class="chart-area">
            <div id="revenueBreakdownSankey" style="width: 100%; height: 450px;"></div>
            </div>
            <div class="chart-analysis">
            <div class="analysis-title">
                <i class="fas fa-lightbulb"></i> 智能分析
            </div>
            <div class="analysis-content" id="revenueBreakdownAnalysis">
                <p>加载中...</p>
            </div>
            </div>
        </div>
        </div>

            <!-- 客户层级分析 - 客户数 & 收入分布 -->
      <div class="chart-container">
        <div class="chart-header">
          <div class="chart-title">
            <i class="fas fa-layer-group"></i> C2.1 客户数 & 收入分布
          </div>
        </div>
        <div class="chart-flex">
          <div class="chart-area">
            <div style="display: flex; gap: 20px; height: 500px;">
              <div id="customerCountChart" style="width: 50%; height: 100%;"></div>
              <div id="customerRevenueChart" style="width: 50%; height: 100%;"></div>
            </div>
          </div>
          <div class="chart-analysis">
            <div class="analysis-title">
              <i class="fas fa-lightbulb"></i> 智能分析
            </div>
            <div class="analysis-content" id="customerTierAnalysis">
              <p>加载中...</p>
            </div>
          </div>
        </div>
      </div>
   
 <!-- 客户收入变化原因分析 (C2.2) -->
    <div class="chart-container">
      <div class="chart-header">
        <div class="chart-title">
          <i class="fas fa-chart-bar"></i> C2.2 客户收入变化原因分析
        </div>
      </div>
      <div class="chart-flex">
        <div class="chart-area">
          <div id="revenueWaterfallChart" style="width: 100%; height: 500px;"></div>
        </div>
        <div class="chart-analysis">
          <div class="analysis-title">
            <i class="fas fa-lightbulb"></i> 智能分析
          </div>
          <div class="analysis-content" id="revenueWaterfallAnalysis">
            <p>加载中...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 收入分布热力图 (C2.3) -->
    <div class="chart-container">
      <div class="chart-header">
        <div class="chart-title">
          <i class="fas fa-th"></i> C2.3 客户收入分布热力图
        </div>
      </div>
      <div class="chart-flex">
        <div class="chart-area">
          <!-- 增加明确的高度以确保按钮可见 -->
          <div id="incomeHeatmapChart" style="width: 100%; height: 550px; position: relative;"></div>
        </div>
        <div class="chart-analysis">
          <div class="analysis-title">
            <i class="fas fa-lightbulb"></i> 智能分析
          </div>
          <div class="analysis-content" id="incomeHeatmapAnalysis">
            <p>加载中...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 客户层级收入表现 - 收入分位数 (C2.4) -->
    <div class="chart-container">
      <div class="chart-header">
        <div class="chart-title">
          <i class="fas fa-layer-group"></i> C2.4 客户层级收入分位数
        </div>
      </div>
      <div class="chart-flex">
        <div class="chart-area">
          <div id="customerTierRevenueChart" style="width: 100%; height: 720px;"></div>
        </div>
        <div class="chart-analysis">
          <div class="analysis-title">
            <i class="fas fa-lightbulb"></i> 智能分析
          </div>
          <div class="analysis-content" id="customerTierRevenueAnalysis">
            <p>加载中...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 客户ROA vs 规模变化散点图 (C2.5) -->
    <div class="chart-container">
      <div class="chart-header">
        <div class="chart-title">
          <i class="fas fa-chart-scatter"></i> C2.5 客户 ROA vs 规模变化
        </div>
      </div>
      <div class="chart-flex">
        <div class="chart-area">
          <div id="roaVsAumChangeChart" style="width: 100%; height: 500px;"></div>
        </div>
        <div class="chart-analysis">
          <div class="analysis-title">
            <i class="fas fa-lightbulb"></i> 智能分析
          </div>
          <div class="analysis-content" id="roaVsAumChangeAnalysis">
            <p>加载中...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 客户ROA vs 规模变化 Mekko图 (C2.6) -->
    <div class="chart-container">
      <div class="chart-header">
        <div class="chart-title">
          <i class="fas fa-chart-bar"></i> C2.6 %ROA vs 规模变化
        </div>
      </div>
      <div class="chart-flex">
        <div class="chart-area">
          <div id="roaVsAumMekkoChart" style="width: 100%; height: 500px;"></div>
        </div>
        <div class="chart-analysis">
          <div class="analysis-title">
            <i class="fas fa-lightbulb"></i> 智能分析
          </div>
          <div class="analysis-content" id="roaVsAumMekkoAnalysis">
            <p>加载中...</p>
          </div>
        </div>
      </div>
    </div>

         <!-- C3.1 中间业务收入排名 - 调整为先显示这个 -->
        <div class="chart-container">
        <div class="chart-header">
            <div class="chart-title">
            <i class="fas fa-trophy"></i> C3.1 中间业务收入排名
            </div>
        </div>
        <div class="chart-flex">
            <!-- 图表放在左侧，散点图和柱状图并排 -->
            <div class="chart-area">
            <div style="display: flex; gap: 20px; height: 350px;">
                <div id="intermediateRevenueScatter" style="width: 50%; height: 100%;"></div>
                <div style="width: 50%; height: 100%; position: relative;">
                <div id="intermediateRankingBar" style="width: 100%; height: 100%;"></div>
                <div id="intermediateRevenueRank" class="rank-container" style="text-align: center; margin-top: 10px;"></div>
                </div>
            </div>
            </div>
            <!-- 点评放在右侧 -->
            <div class="chart-analysis">
            <div class="analysis-title">
                <i class="fas fa-lightbulb"></i> 智能分析
            </div>
            <div class="analysis-content" id="intermediateRevenueAnalysis">
                <p>加载中...</p>
            </div>
            </div>
        </div>
        </div>
          <!-- C3.2 中间业务结构 - 调整为后显示这个 -->
          <div class="chart-container">
            <div class="chart-header">
              <div class="chart-title">
                <i class="fas fa-exchange-alt"></i> C3.2 中间业务结构
              </div>
            </div>
            <div class="chart-flex">
              <div class="chart-area">
                <div id="intermediateBusinessChart" style="width: 100%; height: 400px;"></div>
              </div>
              <div class="chart-analysis">
                <div class="analysis-title">
                  <i class="fas fa-lightbulb"></i> 智能分析
                </div>
                <div class="analysis-content" id="intermediateBusinessAnalysis">
                  <p>加载中...</p>
                </div>
              </div>
            </div>
          </div>
          
         <!-- C3.3 万元收益 vs 财富类AUM -->
        <div class="chart-container">
        <div class="chart-header">
            <div class="chart-title">
            <i class="fas fa-chart-bubble"></i> C3.3 中间业务：万元收益 vs 财富类管理资产
            </div>
        </div>
        <div class="chart-flex">
            <div class="chart-area">
            <div id="yieldVsSalesScatter" style="width: 100%; height: 380px;"></div>
            </div>
            <div class="chart-analysis">
            <div class="analysis-title">
                <i class="fas fa-lightbulb"></i> 智能分析
            </div>
            <div class="analysis-content" id="yieldVsSalesAnalysis">
                <p>加载中...</p>
            </div>
            </div>
        </div>
        </div>
      
          <!-- C3.4 中间业务：购买人数，销量，以及万元收益 -->
          <div class="chart-container">
            <div class="chart-header">
              <div class="chart-title">
                <i class="fas fa-table"></i> C3.4 中间业务：购买人数，销量，以及万元收益
              </div>
            </div>
            <div id="detailedComparisonControl" style="text-align: center; margin-bottom: 15px;"></div>
            <div class="chart-flex">
              <div class="chart-area">
                <div id="detailedComparisonChart" style="width: 100%; height: 350px;"></div>
              </div>
              <div class="chart-analysis">
                <div class="analysis-title">
                  <i class="fas fa-lightbulb"></i> 智能分析
                </div>
                <div class="analysis-content" id="detailedComparisonAnalysis">
                  <p>加载中...</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- C4.1 存款收入排名 -->
            <div class="chart-container">
            <div class="chart-header">
                <div class="chart-title">
                <i class="fas fa-trophy"></i> C4.1 存款收入排名
                </div>
            </div>
            <div class="chart-flex">
                <!-- 图表放在左侧，散点图和柱状图并排 -->
                <div class="chart-area">
                <div style="display: flex; gap: 20px; height: 350px;">
                    <div id="depositRevenueScatter" style="width: 50%; height: 100%;"></div>
                    <div style="width: 50%; height: 100%; position: relative;">
                    <div id="depositRankingBar" style="width: 100%; height: 100%;"></div>
                    <div id="depositRevenueRank" class="rank-container" style="text-align: center; margin-top: 10px;"></div>
                    </div>
                </div>
                </div>
                <!-- 点评放在右侧 -->
                <div class="chart-analysis">
                <div class="analysis-title">
                    <i class="fas fa-lightbulb"></i> 智能分析
                </div>
                <div class="analysis-content" id="depositRevenueRankingAnalysis">
                    <p>加载中...</p>
                </div>
                </div>
            </div>
            </div>

                  <!-- C4.2 存款收入分解 -->
        <div class="chart-container">
          <div class="chart-header">
            <div class="chart-title">
              <i class="fas fa-layer-group"></i> C4.2 存款收入分解：万元收益/活期客户占比
            </div>
          </div>
          <div class="chart-flex">
            <div class="chart-area">
              <div id="depositBreakdownAnalysis2" style="width: 100%; height: 400px;"></div>
            </div>
            <div class="chart-analysis">
              <div class="analysis-title">
                <i class="fas fa-lightbulb"></i> 智能分析
              </div>
              <div class="analysis-content" id="depositBreakdownAnalysis3">
                <p>加载中...</p>
              </div>
            </div>
          </div>
        </div>
          <!-- C4.3 存款收入结构 -->
          <div class="chart-container">
            <div class="chart-header">
              <div class="chart-title">
                <i class="fas fa-money-check-alt"></i> C4.3 存款收入结构
              </div>
            </div>
            <div class="chart-flex">
              <div class="chart-area">
                <div id="depositRevenueChart" style="width: 100%; height: 300px;"></div>
              </div>
              <div class="chart-analysis">
                <div class="analysis-title">
                  <i class="fas fa-lightbulb"></i> 智能分析
                </div>
                <div class="analysis-content" id="depositRevenueAnalysis">
                  <p>加载中...</p>
                </div>
              </div>
            </div>
          </div>
          
                <!-- C5.1 信贷收入排名 -->
        <div class="chart-container">
        <div class="chart-header">
            <div class="chart-title">
            <i class="fas fa-trophy"></i> C5.1 信贷收入排名
            </div>
        </div>
        <div class="chart-flex">
            <!-- 图表放在左侧，散点图和柱状图并排 -->
            <div class="chart-area">
            <div style="display: flex; gap: 20px; height: 380px;">
                <div id="creditRevenueScatter" style="width: 50%; height: 100%;"></div>
                <div style="width: 50%; height: 100%; position: relative;">
                <div id="creditRankingBar" style="width: 100%; height: 100%;"></div>
                <div id="creditRevenueRank" class="rank-container" style="text-align: center; margin-top: 10px;"></div>
                </div>
            </div>
            </div>
            <!-- 点评放在右侧 -->
            <div class="chart-analysis">
            <div class="analysis-title">
                <i class="fas fa-lightbulb"></i> 智能分析
            </div>
            <div class="analysis-content" id="creditRevenueRankingAnalysis">
                <p>加载中...</p>
            </div>
            </div>
        </div>
        </div>

        <!-- C5.2 信贷收入分解 -->
        <div class="chart-container">
          <div class="chart-header">
            <div class="chart-title">
              <i class="fas fa-layer-group"></i> C5.2 信贷收入分解：信贷规模/信贷客户占比
            </div>
          </div>
          <div class="chart-flex">
            <div class="chart-area">
              <div id="creditBreakdownAnalysis" style="width: 100%; height: 400px;"></div>
            </div>
            <div class="chart-analysis">
              <div class="analysis-title">
                <i class="fas fa-lightbulb"></i> 智能分析
              </div>
              <div class="analysis-content" id="creditBreakdownAnalysis2">
                <p>加载中...</p>
              </div>
            </div>
          </div>
        </div>
          <!-- C5.3 信贷收入结构 -->
          <div class="chart-container">
            <div class="chart-header">
              <div class="chart-title">
                <i class="fas fa-credit-card"></i> C5.3 信贷收入结构
              </div>
            </div>
            <div class="chart-flex">
              <div class="chart-area">
                <div id="creditRevenueChart" style="width: 100%; height: 350px;"></div>
              </div>
              <div class="chart-analysis">
                <div class="analysis-title">
                  <i class="fas fa-lightbulb"></i> 智能分析
                </div>
                <div class="analysis-content" id="creditRevenueAnalysis">
                  <p>加载中...</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- C6.1 对公收入排名 -->
<div class="chart-container">
<div class="chart-header">
    <div class="chart-title">
    <i class="fas fa-trophy"></i> C6.1 对公收入排名
    </div>
</div>
<div class="chart-flex">
    <!-- 图表放在左侧，散点图和柱状图并排 -->
    <div class="chart-area">
    <div style="display: flex; gap: 20px; height: 380px;">
        <div id="corporateRevenueScatter" style="width: 50%; height: 100%;"></div>
        <div style="width: 50%; height: 100%; position: relative;">
        <div id="corporateRankingBar" style="width: 100%; height: 100%;"></div>
        <div id="corporateRevenueRank" class="rank-container" style="text-align: center; margin-top: 10px;"></div>
        </div>
    </div>
    </div>
    <!-- 点评放在右侧 -->
    <div class="chart-analysis">
    <div class="analysis-title">
        <i class="fas fa-lightbulb"></i> 智能分析
    </div>
    <div class="analysis-content" id="corporateRevenueRankingAnalysis">
        <p>加载中...</p>
    </div>
    </div>
</div>
</div>

          <!-- C6.2 对公贷收入结构 -->
          <div class="chart-container">
            <div class="chart-header">
              <div class="chart-title">
                <i class="fas fa-building"></i> C6.2 对公贷收入结构
              </div>
            </div>
            <div class="chart-flex">
              <div class="chart-area">
                <div id="corporateRevenueChart" style="width: 100%; height: 300px;"></div>
              </div>
              <div class="chart-analysis">
                <div class="analysis-title">
                  <i class="fas fa-lightbulb"></i> 智能分析
                </div>
                <div class="analysis-content" id="corporateRevenueAnalysis">
                  <p>加载中...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    
      const mainContent = document.getElementById('mainContent');
      mainContent.appendChild(container);
      
      // 添加样式
      const styles = document.createElement('style');
      styles.textContent = `
        .mode-selector {
          display: flex;
          justify-content: center;
          gap: 10px;
        }
        
        .mode-btn {
          padding: 5px 10px;
          border: 1px solid #4B9CD3;
          background-color: transparent;
          color: #e0e0e0;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .mode-btn.active {
          background-color: #4B9CD3;
          color: white;
        }
        
        .rank-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }
        
        .rank-text {
          color: #e0e0e0;
          font-size: 0.9em;
        }
      `;
      document.head.appendChild(styles);
    
      // 初始化所有图表 - 注意顺序已按照要求调整
      // 1. 收入结构环形图
      const structureData = initRevenueStructureCharts(selectedRM);
      initRevenueBreakdownSankey(selectedRM);

      initCustomerTierDistribution(selectedRM, rmCustData);
      
    
      // 2. 中间业务收入排名
      const selectedGroup = initIntermediateRevenueScatter(selectedRM, rmData);
      initIntermediateRankingBar(selectedRM, rmData, selectedGroup);
      updateIntermediateRevenueAnalysis(selectedRM, rmData, selectedGroup);

      // 初始化E2图表：客户层级收入分位数
      initCustomerTierRevenueTrend(selectedRM, rmCustData);

      // 初始化E3图表：收入分布热力图
      initIncomeDistributionHeatmap(selectedRM, rmCustData);

      // 初始化E4图表：客户收入变化原因分析 
      initCustomerRevenueWaterfallChart(selectedRM, rmCustData);

      // 初始化E5图表：客户ROA vs 规模变化散点图
      initCustomerRoaVsAumChangeChart(selectedRM, rmCustData);

      // 初始化E6图表：客户ROA vs 规模变化 Mekko图
      initRoaVsAumMekkoChart(selectedRM, rmCustData);
      
      // 3. 中间业务结构
      const intermediateData = initIntermediateBusinessChart(selectedRM);
      
      // 4. 万元收益 vs 财富类产品销量
      initYieldVsSalesScatter(selectedRM, rmData);
      updateYieldVsSalesAnalysis(selectedRM, rmData);
      
      // 5. 细分数据对比
      initDetailedComparison(selectedRM, rmData);
      updateDetailedComparisonAnalysis(selectedRM, rmData);
      
      // 6. 存款收入排名
      const depositGroup = initDepositRevenueScatter(selectedRM, rmData);
     initDepositRankingBar(selectedRM, rmData, depositGroup);
     //3.2 存款收入分解
     initDepositBreakdownAnalysis(selectedRM, rmData);

        // 6. 存款收入结构
      const depositData = initDepositRevenueChart(selectedRM);  
      

        const creditGroup = initCreditRevenueScatter(selectedRM, rmData);
        const creditRankData = initCreditRankingBar(selectedRM, rmData, creditGroup);
        updateCreditRevenueRankingAnalysis(selectedRM, rmData, creditRankData);
    // 在这段代码后面，C4.3信贷收入结构（initCreditRevenueChart）之前添加:
    // 调用信贷收入分解分析
        initCreditBreakdownAnalysis(selectedRM, rmData);

      // 7. 信贷收入结构
      const creditData = initCreditRevenueChart(selectedRM);
      
      // 在这里添加对公收入排名图表
    const corporateGroup = initCorporateRevenueScatter(selectedRM, rmData);
    const corporateRankData = initCorporateRankingBar(selectedRM, rmData, corporateGroup);
    updateCorporateRevenueRankingAnalysis(selectedRM, rmData, corporateRankData);

      // 8. 对公贷收入结构
      const corporateData = initCorporateRevenueChart(selectedRM);
      
      // 更新所有分析内容
      updateRevenueStructureAnalysis(structureData.selectedRM, intermediateData, depositData, creditData, corporateData, selectedRM);
      updateIntermediateBusinessAnalysis(intermediateData, selectedRM);
      updateDepositRevenueAnalysis(depositData, selectedRM);
      updateCreditRevenueAnalysis(creditData, selectedRM);
      updateCorporateRevenueAnalysis(corporateData, selectedRM);
      
    } catch (error) {
      console.error("加载收入结构模块时出错:", error);
      // 在界面显示错误信息
      const errorDiv = document.createElement('div');
      errorDiv.style.color = 'red';
      errorDiv.style.padding = '10px';
      errorDiv.textContent = `加载图表出错: ${error.message}`;
      document.getElementById('mainContent').appendChild(errorDiv);
    }
  }
  
  // 保留这两个导出函数，但让它们调用新的整合函数
export function loadC1Module(selectedRM, rmData, rmCustData) {
  loadIncomeStructureModule(selectedRM, rmData, rmCustData);
  }
  
export function loadC2Module(selectedRM, rmData) {
    // 此函数保留以兼容现有代码，但不再单独加载内容
    // 所有功能已在loadIncomeStructureModule中完成
    console.log("C2Module整合到loadIncomeStructureModule中");
  }