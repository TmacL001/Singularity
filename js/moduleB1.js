// js/moduleB1.js
import { callChatGpt } from './chatGptService.js';
// 辅助函数：格式化数字
function formatCurrency(value) {
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
function formatPercent(value) {
  return Number(value).toFixed(1);
}
// 辅助函数：计算趋势
function calculateTrend(data) {
  if (!data || data.length < 2) return '平稳';
  let increases = 0, decreases = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i].value > data[i - 1].value) increases++;
    else if (data[i].value < data[i - 1].value) decreases++;
  }
  const total = data.length - 1;
  const inc = increases / total;
  const dec = decreases / total;
  if (inc > 0.7) return '<span class="highlight">显著上升</span>';
  if (inc > 0.5) return '<span class="highlight">上升</span>';
  if (dec > 0.7) return '<span class="highlight">显著下降</span>';
  if (dec > 0.5) return '<span class="highlight">下降</span>';
  return '<span class="highlight">波动</span>';
}

/* =====================
   B1.1 任务完成情况
   ===================== */
// 更新收入任务完成情况：RR1、RR2和收入完成绝对值
async function updateIncomeTaskCompletion(selectedRM, rmData) {
  if (!selectedRM) return;
  
  // Calculate RR1 = RM_REV_KPI_RR / RM_Rev_todate * 100
  const rr1Value = (selectedRM.RM_REV_KPI_RR / selectedRM.RM_Rev_todate * 100) || 0;
  // Calculate RR2 = RM_REV_KPI / RM_Rev_todate * 100
  const rr2Value = (selectedRM.RM_REV_KPI / selectedRM.RM_Rev_todate * 100) || 0;
  const rr1Formatted = formatPercent(rr1Value);
  const rr2Formatted = formatPercent(rr2Value);
  // Revenue completion absolute value (converted to "万元")
  const revenueAbsolute = selectedRM.RM_Rev_todate / 10000;
  
  // Update time progress bar
  const timeBar = document.getElementById('incomeTimeProgressBar');
  if (timeBar) {
    timeBar.querySelector('.progress-bar').style.width = `${Math.min(rr1Value, 100)}%`;
    timeBar.querySelector('.progress-text').textContent = `${rr1Formatted}%`;
  }
  // Update overall progress bar
  const overallBar = document.getElementById('incomeOverallProgressBar');
  if (overallBar) {
    overallBar.querySelector('.progress-bar').style.width = `${Math.min(rr2Value, 100)}%`;
    overallBar.querySelector('.progress-text').textContent = `${rr2Formatted}%`;
  }
  // Update revenue absolute value display
  const absoluteElem = document.getElementById('absoluteRevenueIncome');
  if (absoluteElem) {
    absoluteElem.textContent = formatCurrency(revenueAbsolute);
  }

  // Update LLM analysis text using ChatGPT
  const analysisElem = document.getElementById('incomeTaskCompletionAnalysis');
  if (analysisElem) {
    analysisElem.innerHTML = '<p>正在生成分析...</p>';
    
    // Create prompt for ChatGPT
    const prompt = `
    请你作为一名专业的金融分析师，基于以下理财经理的收入完成情况数据，给出简短专业的点评和建议：
    
    - 理财经理ID: ${selectedRM.RM_ID}
    - 收入序时完成率: ${rr1Formatted}%
    - 收入整体完成率: ${rr2Formatted}%
    - 收入完成额: ${formatCurrency(revenueAbsolute)} 万元
    
    请给出专业分析和具体建议，分析包括完成情况评价，建议包括如何提高业绩。用简体中文回答，控制在50字以内，使用HTML格式，用<span class="highlight">标签</span>突出关键数据和结论。
    `;
    
    try {
      const analysis = await callChatGpt(prompt);
      analysisElem.innerHTML = analysis;
    } catch (error) {
      console.error("Error generating analysis:", error);
      analysisElem.innerHTML = '<p>分析生成失败，请稍后再试。</p>';
    }
  }
}

/* =====================
   B1.2 同组排名
   ===================== */
// 初始化散点图（B1.2.1）：使用 cust_aum_scale_group 与 RM_Rev_todate
function initIncomeScatterChart(selectedRM, rmData) {
  const chart = echarts.init(document.getElementById('incomeScatterChart'));
  // 横轴：管户规模组（A～E，按降序排列）
  const groupOrder = ["A", "B", "C", "D", "E"];
  const groups = groupOrder.filter(group => rmData.some(rm => rm.cust_aum_scale_group === group));
  
  // 准备数据：每个点包含 RM_ID, 所属规模组, 收入绝对值（万元）等信息
  const data = rmData.map(rm => ({
    rmId: rm.RM_ID,
    group: rm.cust_aum_scale_group || '未分组',
    revenue: rm.RM_Rev_todate / 10000,
    isSelected: rm.RM_ID === selectedRM.RM_ID
  }));
  
  // 分离普通数据点和选中的数据点
  const regularData = [];
  let selectedPoint = null;
  
  data.forEach(item => {
    const groupIndex = groups.indexOf(item.group);
    const point = [
      groupIndex >= 0 ? groupIndex : groups.length, // 如果未分组，放在最后
      item.revenue,
      item.rmId
    ];
    
    if (item.isSelected) {
      selectedPoint = point;
    } else {
      regularData.push(point);
    }
  });
  
  const option = {
    title: {
      text: 'B1.2.1 散点图',
      left: 'center',
      textStyle: { color: '#e0e0e0', fontSize: 14 }
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        const groupIndex = params.data[0];
        const groupName = groupIndex < groups.length ? groups[groupIndex] : '未分组';
        return `${params.data[2]}<br/>规模组: ${groupName}<br/>收入: ${formatCurrency(params.data[1])} 万元`;
      }
    },
    xAxis: {
      type: 'category',
      name: '管户规模组',
      data: groups,
      nameLocation: 'center',
      nameGap: 30,
      nameTextStyle: { color: '#e0e0e0' },
      axisLabel: { color: '#e0e0e0' },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '收入 (万元)',
      nameTextStyle: { color: '#e0e0e0' },
      min: value => value.min < 0 ? value.min * 1.5 : value.min * 0.6,
      max: value => value.max * 0.8,
      splitNumber: 8,
      axisLabel: { color: '#e0e0e0', showMinLabel: false, showMaxLabel: false },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    series: [
      {
        // 普通数据点
        name: '收入同组',
        type: 'scatter',
        symbolSize: 14,
        data: regularData,
        itemStyle: {
          color: '#3fa2e9',
          borderColor: '#fff',
          borderWidth: 0
        },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: '#fff' }
        }
      },
      {
        // 选中的数据点
        name: '当前理财经理',
        type: 'scatter',
        symbolSize: 24,
        data: selectedPoint ? [selectedPoint] : [],
        itemStyle: {
          color: '#FF8C00',
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'top',
          formatter: params => params.data[2], // rmId
          color: '#e0e0e0'
        },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: '#fff' }
        }
      }
    ],
    animationDuration: 1500
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
}

// 初始化柱状图（B1.2.2）：只显示同组内理财经理的收入，按收入降序排序
function initIncomeGroupRankChart(selectedRM, rmData) {
  const chart = echarts.init(document.getElementById('incomeGroupRankChart'));
  const group = selectedRM.cust_aum_scale_group || '未分组';
  const sameGroup = rmData.filter(rm => rm.cust_aum_scale_group === group);
  const sorted = [...sameGroup].sort((a, b) => b.RM_Rev_todate - a.RM_Rev_todate);
  
  const rmIds = sorted.map(rm => rm.RM_ID);
  const revenues = sorted.map(rm => rm.RM_Rev_todate / 10000);
  const isSelected = sorted.map(rm => rm.RM_ID === selectedRM.RM_ID);
  
  const option = {
    title: {
      text: 'B1.2.2 同组排名',
      left: 'center',
      textStyle: { color: '#e0e0e0', fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: params => `${params[0].name}<br/>收入: ${formatCurrency(params[0].value)} 万元<br/>排名: ${params[0].dataIndex + 1}/${rmIds.length}`
    },
    grid: {
      left: '15%',
      right: '5%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '收入 (万元)',
      nameTextStyle: { color: '#e0e0e0' },
      axisLabel: { color: '#e0e0e0' },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: rmIds,
      inverse: true,
      axisLabel: {
        color: '#e0e0e0',
        formatter: value => value.length > 10 ? value.substring(0, 10) + '...' : value
      },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    series: [
      {
        type: 'bar',
        data: revenues,
        itemStyle: {
          color: params => isSelected[params.dataIndex] ? '#FF8C00' : '#3fa2e9'
        },
        label: {
          show: true,
          position: 'right',
          formatter: params => isSelected[params.dataIndex] ? formatCurrency(params.value) : '',
          color: '#e0e0e0'
        },
        animationDuration: 1500
      }
    ]
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());

}

// 更新同组排名点评（B1.2）
async function updateIncomeRankAnalysis(selectedRM, rmData) {
  if (!selectedRM) return;
  const analysisElem = document.getElementById('incomeRankAnalysis');
  const group = selectedRM.cust_aum_scale_group || '未分组';
  const revenue = selectedRM.RM_Rev_todate / 10000;
  const custAum = selectedRM.cust_aum ? selectedRM.cust_aum / 10000 : 0;
  const groupPerf = selectedRM.RM_GROUP_REV_Perf || '';
  
  const sameGroup = rmData.filter(rm => rm.cust_aum_scale_group === group);
  const sorted = [...sameGroup].sort((a, b) => b.RM_Rev_todate - a.RM_Rev_todate);
  const rank = sorted.findIndex(rm => rm.RM_ID === selectedRM.RM_ID) + 1;
  const total = sameGroup.length;
  
  // Form description of performance rating
  let perfDesc = '';
  if (groupPerf) {
    switch(groupPerf) {
      case 'A': perfDesc = 'Top 20%'; break;
      case 'B': perfDesc = 'Top 20-60%'; break;
      case 'C': perfDesc = 'Top 60-80%'; break;
      case 'D': perfDesc = 'Top 80-100%'; break;
      default: perfDesc = '未知';
    }
  }

  if (analysisElem) {
    analysisElem.innerHTML = '<p>正在生成分析...</p>';
    
    // Create prompt for ChatGPT
    const prompt = `
    请你作为一名专业的金融分析师，基于以下理财经理的同组排名数据，给出简短专业的点评和建议：
    
    - 理财经理ID: ${selectedRM.RM_ID}
    - 所在规模组: ${group}
    - 收入绝对值: ${formatCurrency(revenue)} 万元
    - 组内排名: 第 ${rank}/${total}
    ${groupPerf ? `- 收入评级: ${groupPerf}（${perfDesc}）` : ''}
    
    请给出专业分析和具体建议，包括该理财经理在组内的表现评价和针对性的提升建议。用简体中文回答，控制在120字以内，使用HTML格式，用<span class="highlight">标签</span>突出关键数据和结论。
    `;
    
    try {
      const analysis = await callChatGpt(prompt);
      analysisElem.innerHTML = analysis;
      
      // Add performance stamp based on rank
      const chartContainer = analysisElem.closest('.chart-container');
      
      // Remove existing stamp if it exists
      const existingStamp = chartContainer.querySelector('.performance-stamp');
      if (existingStamp) {
        existingStamp.remove();
      }
      
      // Determine rating based on rank position in the group
      let rating = '';
      let ratingText = '';
      if (rank <= Math.ceil(total * 0.2)) {
        rating = 'excellent';
        ratingText = '优秀';
      } else if (rank <= Math.ceil(total * 0.4)) {
        rating = 'good';
        ratingText = '良好';
      } else if (rank <= Math.ceil(total * 0.7)) {
        rating = 'average';
        ratingText = '一般';
      } else {
        rating = 'poor';
        ratingText = '差';
      }
      
      // Add stamp
      const stampDiv = document.createElement('div');
      stampDiv.className = `performance-stamp stamp-${rating}`;
      stampDiv.textContent = ratingText;
      chartContainer.appendChild(stampDiv);
      
    } catch (error) {
      console.error("Error generating analysis:", error);
      analysisElem.innerHTML = '<p>分析生成失败，请稍后再试。</p>';
    }
  }
}

/* =====================
   B1.3 收入趋势
   ===================== */
// 获取月度收入数据（示例：假设字段 RM_Mrev_1 到 RM_Mrev_36）
function getMonthlyIncomeData(selectedRM) {
  const result = [];
  for (let i = 1; i <= 36; i++) {
    const key = `RM_Mrev_${i}`;
    if (selectedRM[key] !== undefined && selectedRM[key] !== null) {
      result.push({ name: `月${i}`, value: selectedRM[key] / 10000 });
    }
  }
  return result;
}
// 获取季度收入数据（示例：假设字段 RM_Qrev_1 到 RM_Qrev_8）
function getQuarterlyIncomeData(selectedRM) {
  const result = [];
  for (let i = 1; i <= 8; i++) {
    const key = `RM_Qrev_${i}`;
    if (selectedRM[key] !== undefined && selectedRM[key] !== null) {
      result.push({ name: `Q${i}`, value: selectedRM[key] / 10000 });
    }
  }
  return result;
}
// 获取年度收入数据（假设字段 RM_Yrev_2022 到 RM_Yrev_2025）
function getYearlyIncomeData(selectedRM) {
  const result = [];
  const years = [2022, 2023, 2024, 2025];
  years.forEach(year => {
    const key = `RM_Yrev_${year}`;
    if (selectedRM[key] !== undefined && selectedRM[key] !== null) {
      result.push({ name: `${year}年`, value: selectedRM[key] / 10000 });
    }
  });
  return result;
}


// 获取 cust_tot_rev_1-12 数据
function getCustomRevenueData(selectedRM) {
  const result = [];
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  for (let i = 1; i <= 12; i++) {
    const key = `RM_Mrev_${i}`;
    if (selectedRM[key] !== undefined && selectedRM[key] !== null) {
      // 反向映射月份：RM_Mrev_1是12月，RM_Mrev_12是1月
      const monthIndex = (12 - i) % 12; // 反转月份顺序
      const monthName = monthNames[monthIndex];
      result.push({ name: monthName, value: selectedRM[key] / 10000 });
    }
  }
  
  // 按照正确的月份顺序排序
  return result.reverse();
}


function initIncomeTrendChart(selectedRM) {
  const chart = echarts.init(document.getElementById('incomeTrendChart'));
  const data = getCustomRevenueData(selectedRM);
  const titleText = '月度收入趋势';
  
  const barWidth = data.length <= 6 ? '40%' : (data.length <= 12 ? '30%' : '20%');
  const option = {
    title: {
      text: titleText,
      left: 'center',
      textStyle: { color: '#e0e0e0', fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: params => `${params[0].name}：${formatCurrency(params[0].value)} 万元`
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
      data: data.map(item => item.name),
      axisLabel: { color: '#e0e0e0', rotate: data.length > 8 ? 45 : 0 },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '收入 (万元)',
      nameTextStyle: { color: '#e0e0e0' },
      axisLabel: { color: '#e0e0e0' },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    series: [
      {
        type: 'bar',
        data: data.map(item => item.value),
        barWidth: barWidth,
        itemStyle: { color: '#3fa2e9' },
        label: {
          show: false, // 移除柱状图上的数据标签
        }
      }
    ],
    animationDuration: 1500
  };
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());

  // 计算趋势并更新分析
  updateIncomeTrendAnalysis(selectedRM, data);
}

// Replace the updateIncomeTrendAnalysis function with this updated version
// 替换为静态分析内容
function updateIncomeTrendAnalysis(selectedRM, data) {
  const analysis = document.getElementById('incomeTrendAnalysis');
  if (!analysis) return;
  
  // 计算基本统计
  let max = -Infinity, maxIdx = -1;
  let min = Infinity, minIdx = -1;
  let total = 0;
  
  data.forEach((item, idx) => {
    if (item.value > max) { max = item.value; maxIdx = idx; }
    if (item.value < min) { min = item.value; minIdx = idx; }
    total += item.value;
  });
  
  const avg = data.length > 0 ? total / data.length : 0;
  
  // 计算趋势
  const trend = calculateTrend(data);
  
  // 计算最近增长情况
  let recentGrowth = '';
  if (data.length >= 2) {
    const lastValue = data[data.length - 1].value;
    const prevValue = data[data.length - 2].value;
    const growthRate = prevValue > 0 ? ((lastValue - prevValue) / prevValue * 100) : 0;
    
    if (growthRate > 10) recentGrowth = '显著增长';
    else if (growthRate > 5) recentGrowth = '稳步增长';
    else if (growthRate > 0) recentGrowth = '略有增长';
    else if (growthRate > -5) recentGrowth = '略有下降';
    else if (growthRate > -10) recentGrowth = '下降明显';
    else recentGrowth = '大幅下滑';
  }
  
  // 生成静态分析内容
  analysis.innerHTML = `
    <p>理财经理<span class="highlight">${selectedRM.RM_ID}</span>收入表现：</p>
    <p>月平均收入<span class="highlight">${formatCurrency(avg)}</span>万元，
       最高收入出现在<span class="highlight">${data[maxIdx]?.name || '无数据'}</span>，达<span class="highlight">${formatCurrency(max)}</span>万元。</p>
    <p>近期收入呈<span class="highlight">${recentGrowth}</span>趋势，整体呈<span class="highlight">${trend}</span>态势。</p>
    <p>建议：${
      trend.includes('上升') 
        ? '保持当前良好势头，重点关注高净值客户，深挖存量客户价值。' 
        : '关注收入下滑原因，增加产品营销力度，提高客户活跃度。'
    }</p>
  `;
}

function evaluateIncomeTaskCompletion(selectedRM, rmData) {
  if (!selectedRM) return null;
  
  // 获取当前理财经理的RR值
  const rr1Value = (selectedRM.RM_REV_KPI_RR / selectedRM.RM_Rev_todate * 100) || 0;
  const rr2Value = (selectedRM.RM_REV_KPI / selectedRM.RM_Rev_todate * 100) || 0;
  
  // 取RR1和RR2中较高的一个作为评价标准
  const rrValue = Math.max(rr1Value, rr2Value);
  
  // 获取同组理财经理
  const group = selectedRM.cust_aum_scale_group || '未分组';
  const sameGroup = rmData.filter(rm => rm.cust_aum_scale_group === group);
  
  // 计算每个理财经理的RR值并排序
  const rrValues = sameGroup.map(rm => {
    const rmRR1 = (rm.RM_REV_KPI_RR / rm.RM_Rev_todate * 100) || 0;
    const rmRR2 = (rm.RM_REV_KPI / rm.RM_Rev_todate * 100) || 0;
    return Math.max(rmRR1, rmRR2);
  }).sort((a, b) => b - a);
  
  // 找出当前理财经理RR值的排名
  const index = rrValues.findIndex(val => val <= rrValue);
  const percentile = (index + 1) / rrValues.length * 100;
  
  // 根据百分比确定评级
  let rating = '';
  if (percentile <= 20) {
    rating = 'excellent';
  } else if (percentile <= 40) {
    rating = 'good';
  } else if (percentile <= 70) {
    rating = 'average';
  } else {
    rating = 'poor';
  }
  
  // 返回评级和对应的中文描述
  const ratingText = {
    'excellent': '优秀',
    'good': '良好',
    'average': '一般',
    'poor': '差'
  };
  
  return {
    rating: rating,
    text: ratingText[rating]
  };
}

/* =====================
   模块入口函数：加载 B1 模块（收入评价）
   ===================== */
  export async function  loadB1Module(selectedRM, rmData) {
  // 创建 B1 模块整体 HTML 结构
  const container = document.createElement('div');
  container.id = 'B1Module';
  container.innerHTML = `
    <div class="module-container animate-fade">
      <div class="module-header">
        <div class="module-title">
          <i class="fas fa-money-bill-wave"></i> B1. 收入评价
        </div>
      </div>
      <!-- B1.1 任务完成情况 -->
      <div class="chart-container">
        <div class="chart-header">
          <div class="chart-title">
            <i class="fas fa-tasks"></i> B1.1 任务完成情况
          </div>
        </div>
        <div class="chart-flex">
          <div class="chart-area">
            <div class="row-flex">
              <div class="col-7">
                <!-- 收入KPI 完成度-序时进度 -->
                <div style="margin-bottom: 20px;">
                  <div class="stat-title">收入KPI 完成度 - 序时进度</div>
                  <div id="incomeTimeProgressBar" class="progress-container">
                    <div class="progress-bar" style="width: 0%"></div>
                    <div class="progress-text">0%</div>
                  </div>
                </div>
                <!-- 收入KPI 完成度-整体进度 -->
                <div>
                  <div class="stat-title">收入KPI 完成度 - 整体进度</div>
                  <div id="incomeOverallProgressBar" class="progress-container">
                    <div class="progress-bar" style="width: 0%"></div>
                    <div class="progress-text">0%</div>
                  </div>
                </div>
              </div>
              <div class="col-5">
                <!-- 收入完成绝对值 -->
                <div style="text-align: center; padding: 20px; background-color: var(--primary-bg); border-radius: 8px; border: 1px solid var(--border-color); height: 100%; display: flex; flex-direction: column; justify-content: center;">
                  <div style="font-size: 16px; margin-bottom: 15px;">收入完成值</div>
                  <div id="absoluteRevenueIncome" style="font-size: 32px; font-weight: bold; color: var(--highlight-bg);"></div>
                  <div style="font-size: 14px; color: #bbbbbb; margin-top: 10px;">万元</div>
                </div>
              </div>
            </div>
          </div>
          <div class="chart-analysis">
            <div class="analysis-title">
              <i class="fas fa-lightbulb"></i> 智能分析
            </div>
            <div class="analysis-content" id="incomeTaskCompletionAnalysis">
              <p>加载中...</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- B1.2 同组排名 -->
      <div class="chart-container" style="height: 450px;">
        <div class="chart-header">
          <div class="chart-title">
            <i class="fas fa-users"></i> B1.2 同组排名
          </div>
        </div>
        <div class="chart-flex">
          <div class="chart-area">
            <div style="display: flex; gap: 20px; height: 380px;">
              <div id="incomeScatterChart" style="width: 50%; height: 100%;"></div>
              <div id="incomeGroupRankChart" style="width: 50%; height: 100%;"></div>
            </div>
          </div>
          <div class="chart-analysis">
            <div class="analysis-title">
              <i class="fas fa-lightbulb"></i> 智能分析
            </div>
            <div class="analysis-content" id="incomeRankAnalysis">
              <p>加载中...</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- B1.3 收入趋势 -->
      <div class="chart-container">
        <div class="chart-header">
          <div class="chart-title">
            <i class="fas fa-chart-bar"></i> B1.3 RM 收入趋势
          </div>
        </div>
        <div class="chart-flex">
          <div class="chart-area">
            <div id="incomeTrendChart" style="width: 100%; height: 300px;"></div>
          </div>
          <div class="chart-analysis">
            <div class="analysis-title">
              <i class="fas fa-lightbulb"></i> 智能分析
            </div>
            <div class="analysis-content" id="incomeTrendAnalysis">
              <p>加载中...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // 清空主内容区并插入 B1 模块
  const mainContent = document.getElementById('mainContent');
  mainContent.appendChild(container);
  
  // 初始化各子模块
  await updateIncomeTaskCompletion(selectedRM, rmData); 
  initIncomeScatterChart(selectedRM, rmData);
  initIncomeGroupRankChart(selectedRM, rmData);
  await updateIncomeRankAnalysis(selectedRM, rmData);  
  initIncomeTrendChart(selectedRM); // 不再传递周期参数
  
}
