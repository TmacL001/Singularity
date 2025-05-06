// 模块 B2：规模评价模块
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
  
  // =====================
  // B2.1 任务完成情况
  // =====================
  export async function updateScaleTaskCompletion(selectedRM, rmData) {
    if (!selectedRM) return;
    let rr1Value = 0, rr2Value = 0;
    if (selectedRM.RM_Yaum_2025) {
      rr1Value = (selectedRM.RM_AUM_KPI_RR / selectedRM.RM_Yaum_2025 * 100) || 0;
      rr2Value = (selectedRM.RM_AUM_KPI / selectedRM.RM_Yaum_2025 * 100) || 0;
    }
    const rr1Formatted = formatPercent(rr1Value);
    const rr2Formatted = formatPercent(rr2Value);
    const scaleAbsolute = selectedRM.RM_Yaum_2025 ? selectedRM.RM_Yaum_2025 / 100000000 : 0;
    
    const scaleTimeBar = document.getElementById('scaleTimeProgressBar');
    if (scaleTimeBar) {
      scaleTimeBar.querySelector('.progress-bar').style.width = `${Math.min(rr1Value, 100)}%`;
      scaleTimeBar.querySelector('.progress-text').textContent = `${rr1Formatted}%`;
    }
    const scaleOverallBar = document.getElementById('scaleOverallProgressBar');
    if (scaleOverallBar) {
      scaleOverallBar.querySelector('.progress-bar').style.width = `${Math.min(rr2Value, 100)}%`;
      scaleOverallBar.querySelector('.progress-text').textContent = `${rr2Formatted}%`;
    }
    
    const absoluteScaleElem = document.getElementById('absoluteScale');
    if (absoluteScaleElem) {
      absoluteScaleElem.textContent = formatCurrency(scaleAbsolute);
    }
    
    const analysisElem = document.getElementById('scaleTaskCompletionAnalysis');
    if (analysisElem) {
      analysisElem.innerHTML = '<p>正在生成分析...</p>';
      
      // Create prompt for ChatGPT
      const prompt = `
      请你作为一名专业的金融分析师，基于以下理财经理的规模完成情况数据，给出简短专业的点评和建议：
      
      - 理财经理ID: ${selectedRM.RM_ID}
      - 规模序时完成率: ${rr1Formatted}%
      - 规模整体完成率: ${rr2Formatted}%
      - 规模完成绝对值: ${formatCurrency(scaleAbsolute)} 亿元
      
      请给出专业分析和具体建议，分析包括规模完成情况评价，建议包括如何提高规模。用简体中文回答，控制在80字以内，使用HTML格式，用<span class="highlight">标签</span>突出关键数据和结论。
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
  // =====================
  // B2.2 同组排名
  // =====================
  
  // 初始化散点图（B2.2.1）
export function initScaleScatterChart(selectedRM, rmData) {
  const chart = echarts.init(document.getElementById('scaleScatterChart'));
  
  const scaleGroupOrder = ["A", "B", "C", "D", "E"];
  const scaleGroups = scaleGroupOrder.filter(group => rmData.some(rm => rm.cust_aum_scale_group === group));
  
  const data = rmData.map(rm => ({
    rmId: rm.RM_ID,
    scaleGroup: rm.cust_aum_scale_group || '未分组',
    scaleValue: rm.RM_GROUP_AUM_GRW * 100 || 0,
    isSelected: rm.RM_ID === selectedRM.RM_ID
  }));
  
  // 修正：直接使用组的索引作为x轴坐标，确保组与位置对齐
  const regularData = [];
  let selectedPoint = null;
  
  data.forEach(item => {
    const groupIndex = scaleGroups.indexOf(item.scaleGroup);
    const point = [
      groupIndex >= 0 ? groupIndex : scaleGroups.length, // 如果未分组，放在最后
      item.scaleValue,
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
      text: 'B2.2.1 散点图',
      left: 'center',
      textStyle: { color: '#e0e0e0', fontSize: 14 }
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        const groupIndex = params.data[0];
        const groupName = groupIndex < scaleGroups.length ? scaleGroups[groupIndex] : '未分组';
        return `${params.data[2]}<br/>规模组: ${groupName}<br/>规模增长率: ${formatPercent(params.data[1])}%`;
      }
    },
    xAxis: {
      type: 'category',
      name: '管户规模组',
      data: scaleGroups,
      nameLocation: 'center',
      nameGap: 30,
      nameTextStyle: { color: '#e0e0e0' },
      axisLabel: { color: '#e0e0e0' },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '规模增长率 (%)', 
      nameTextStyle: { color: '#e0e0e0' },
      min: value => value.min < 0 ? value.min * 1.3 : value.min * 0.7, // 处理负增长率
      max: value => value.max * 0.8,
      splitNumber: 8,
      axisLabel: { color: '#e0e0e0', showMinLabel: false, showMaxLabel: false },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      splitLine: { show: false }
    },
    series: [
      {
        // 普通数据点
        name: '规模同组',
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
  
  // 初始化柱状图（B2.2.2）
export function initScaleGroupRankChart(selectedRM, rmData) {
    const chart = echarts.init(document.getElementById('scaleGroupRankChart'));
    
    const selectedGroup = selectedRM.cust_aum_scale_group || '未分组';
    const sameGroupRMs = rmData.filter(rm => rm.cust_aum_scale_group === selectedGroup);
    const sortedRMs = [...sameGroupRMs].sort((a, b) => (b.RM_GROUP_AUM_GRW || 0) - (a.RM_GROUP_AUM_GRW || 0));

    const rmIds = sortedRMs.map(rm => rm.RM_ID);
    const scaleValues = sortedRMs.map(rm => (rm.RM_GROUP_AUM_GRW || 0) * 100);
    const isSelected = sortedRMs.map(rm => rm.RM_ID === selectedRM.RM_ID);
    
    const option = {
      title: {
        text: 'B2.2.2 同组排名',
        left: 'center',
        textStyle: { color: '#e0e0e0', fontSize: 14 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: params => `${params[0].name}<br/>规模增长率: ${formatPercent(params[0].value)}%`
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
        name: '规模增长率 (%)', 
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
          name: '规模',
          type: 'bar',
          data: scaleValues,
          itemStyle: {
            color: params => isSelected[params.dataIndex] ? '#FF8C00' : '#3fa2e9'
          },
          label: {
            show: true,
            position: 'right',
            formatter: params => isSelected[params.dataIndex] ? `${formatPercent(params.value)}%` : '',
            color: '#e0e0e0'
          }
        }
      ],
      animationDuration: 1500
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
  }
  
  // 更新同组排名点评（B2.2）
  export async function updateScaleRankAnalysis(selectedRM, rmData) {
    if (!selectedRM) return;
    const analysisElem = document.getElementById('scaleRankAnalysis');
    const group = selectedRM.cust_aum_scale_group || '未分组';
    const scaleValue = selectedRM.RM_Yaum_2025 ? selectedRM.RM_Yaum_2025 / 10000 : 0;
    const custAum = selectedRM.cust_aum ? selectedRM.cust_aum / 10000 : 0;
    const groupPerf = selectedRM.RM_GROUP_AUM_Perf || '';
    const growthValue = (selectedRM.RM_GROUP_AUM_GRW || 0) * 100;
    const growthValueFormatted = formatPercent(growthValue); // 格式化为百分比，保留1位小数


    
    const sameGroupRMs = rmData.filter(rm => rm.cust_aum_scale_group === group);
    const sortedRMs = [...sameGroupRMs].sort((a, b) => (b.RM_GROUP_AUM_GRW || 0) - (a.RM_GROUP_AUM_GRW || 0));
    const rank = sortedRMs.findIndex(rm => rm.RM_ID === selectedRM.RM_ID) + 1;
    const total = sameGroupRMs.length;
    
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
      - 管户规模: ${formatCurrency(custAum)} 万元
      - 规模增长率: ${growthValueFormatted}%
      - 组内增长率排名: 第 ${rank}/${total}
      ${groupPerf ? `- 规模评级: ${groupPerf}（${perfDesc}）` : ''}

      请基于规模增长率给出专业分析和具体建议，包括该理财经理在组内的增长表现评价和针对性的提升建议。用简体中文回答，控制在120字以内，使用HTML格式，用<span class="highlight">标签</span>突出关键数据和结论。重点分析规模增长率的表现，不要关注规模绝对值。
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
  
  // =====================
  // B2.3 RM 规模趋势
  // =====================
  
  function getMonthlyScaleData12(selectedRM) {
    const result = [];
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    for (let i = 1; i <= 12; i++) {
      const key = `RM_Maum_${i}`;
      if (selectedRM[key] !== undefined && selectedRM[key] !== null) {
        // 反向映射月份：RM_Maum_1是12月，RM_Maum_12是1月
        const monthIndex = (12 - i) % 12; // 反转月份顺序
        const monthName = monthNames[monthIndex];
        
        // 将单位从万元改为亿元（除以10000）
        result.push({ name: monthName, value: selectedRM[key] / 100000000 });
      }
    }
    
    // 确保月份按照正确顺序排列
    return result.reverse();
  }

function getMonthlyScaleData(selectedRM) {
    const result = [];
    for (let i = 1; i <= 36; i++) {
      const key = `RM_Maum_${i}`;
      if (selectedRM[key] !== undefined && selectedRM[key] !== null) {
        result.push({ name: `月${i}`, value: selectedRM[key] / 10000 });
      }
    }
    return result;
  }
function getQuarterlyScaleData(selectedRM) {
    const result = [];
    for (let i = 1; i <= 14; i++) {
      const key = `RM_Qaum_${i}`;
      if (selectedRM[key] !== undefined && selectedRM[key] !== null) {
        result.push({ name: `Q${i}`, value: selectedRM[key] / 10000 });
      }
    }
    return result;
  }
function getYearlyScaleData(selectedRM) {
    const result = [];
    const years = [2022, 2023, 2024, 2025];
    years.forEach(year => {
      const key = `RM_Yaum_${year}`;
      if (selectedRM[key] !== undefined && selectedRM[key] !== null) {
        result.push({ name: `${year}年`, value: selectedRM[key] / 10000 });
      }
    });
    return result;
  }
  
export function initScaleTrendChart(selectedRM) {
    const chart = echarts.init(document.getElementById('scaleTrendChart'));
    const data = getMonthlyScaleData12(selectedRM);
    const titleText = '月度规模趋势';
    
    const barWidth = data.length <= 6 ? '40%' : (data.length <= 12 ? '30%' : '20%');
    const option = {
      title: {
        text: titleText,
        left: 'center',
        textStyle: { color: '#e0e0e0', fontSize: 14 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: params => `${params[0].name}：${formatCurrency(params[0].value)} 亿元`
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
        axisLabel: {
          color: '#e0e0e0',
          rotate: data.length > 8 ? 45 : 0
        },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '规模 (亿元)',
        nameTextStyle: { color: '#e0e0e0' },
        axisLabel: { color: '#e0e0e0' },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false }
      },
      series: [
        {
          name: '规模',
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
    
    // 调用静态分析
    updateScaleTrendStaticAnalysis(selectedRM, data);
  }
  
function updateScaleTrendStaticAnalysis(selectedRM, data) {
    if (!selectedRM || !data || data.length === 0) return;
    const analysisElem = document.getElementById('scaleTrendAnalysis');
    if (!analysisElem) return;
    
    // 计算基本统计数据
    let max = -Infinity, maxIdx = -1;
    let min = Infinity, minIdx = -1;
    let total = 0;
    
    data.forEach((item, idx) => {
      if (item.value > max) { max = item.value; maxIdx = idx; }
      if (item.value < min) { min = item.value; minIdx = idx; }
      total += item.value;
    });
    
    const avg = data.length > 0 ? total / data.length : 0;
    const trend = calculateTrend(data);
    
    // 计算规模增长率
    let growthRate = 0;
    if (data.length >= 2) {
      const firstValue = data[0].value;
      const lastValue = data[data.length - 1].value;
      growthRate = firstValue > 0 ? ((lastValue - firstValue) / firstValue * 100) : 0;
    }
    
    // 生成静态分析内容（单位已更改为亿元）
    let analysisHTML = `
      <p>理财经理<span class="highlight">${selectedRM.RM_ID}</span>的规模表现：</p>
      <p>月平均规模<span class="highlight">${formatCurrency(avg)}</span>亿元，
         最高规模出现在<span class="highlight">${data[maxIdx]?.name || '无数据'}</span>，达<span class="highlight">${formatCurrency(max)}</span>亿元。</p>
      <p>近12个月规模增长率为<span class="highlight">${formatPercent(growthRate)}%</span>，
         整体呈<span class="highlight">${trend}</span>趋势。</p>
    `;
    
    // 根据趋势提供不同建议
    if (trend.includes('上升')) {
      analysisHTML += `
        <p>建议：继续保持良好增长势头，加强客户维护，拓展高净值客户群，关注资产配置多样化。</p>
      `;
    } else if (trend.includes('下降')) {
      analysisHTML += `
        <p>建议：分析规模下降原因，加强客户维系，尤其是高净值客户群体，提高产品吸引力。</p>
      `;
    } else {
      analysisHTML += `
        <p>建议：尝试丰富产品结构，主动拓展客户资源，重点挖掘存量客户潜力，提升规模增长动力。</p>
      `;
    }
    
    analysisElem.innerHTML = analysisHTML;
  }

async function updateScaleTrendAnalysis(period, selectedRM, data) {
  if (!selectedRM || !data || data.length === 0) return;
  const analysisElem = document.getElementById('scaleTrendAnalysis');
  
  // Calculate basic statistics
  let max = -Infinity, maxIdx = -1;
  data.forEach((item, idx) => {
    if (item.value > max) { max = item.value; maxIdx = idx; }
  });
  const avg = data.reduce((s, item) => s + item.value, 0) / data.length;
  const trend = calculateTrend(data);
  const periodText = period === 'month' ? '月度' : (period === 'quarter' ? '季度' : '年度');
  
  // Calculate volatility
  let volatility = 0;
  if (data.length > 1) {
    const diffs = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i-1].value !== 0) {
        diffs.push(Math.abs(data[i].value - data[i-1].value) / data[i-1].value);
      }
    }
    volatility = (diffs.reduce((s, d) => s + d, 0) / diffs.length * 100).toFixed(1);
  }
  
  if (analysisElem) {
    analysisElem.innerHTML = '<p>正在生成分析...</p>';
    
    // Create data series string representation for the prompt
    const dataPoints = data.map(item => `${item.name}: ${formatCurrency(item.value)}万元`).join(', ');
    
    // Create prompt for ChatGPT
    const prompt = `
    请你作为一名专业的金融分析师，基于以下理财经理的${periodText}规模趋势数据，给出简短专业的点评和建议：
    
    - 理财经理ID: ${selectedRM.RM_ID}
    - ${periodText}数据点: ${dataPoints}
    - 趋势特征: ${trend.replace(/<[^>]*>/g, '')}
    - 波动率: ${volatility}%
    - 最高规模: ${maxIdx >= 0 ? formatCurrency(max) + '万元（' + data[maxIdx].name + '）' : 'N/A'}
    - 平均${periodText}规模: ${formatCurrency(avg)}万元
    
    请分析规模趋势特点，包括上升/下降/稳定的规律性，并给出针对性建议。用简体中文回答，控制在80字以内，使用HTML格式，用<span class="highlight">标签</span>突出关键数据和结论。
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
  
  // 模块入口函数：加载 B2 模块（规模评价模块）
export function loadB2Module(selectedRM, rmData) {
    const container = document.createElement('div');
    container.id = 'B2Module';
    container.innerHTML = `
      <div class="module-container animate-fade">
        <div class="module-header">
          <div class="module-title">
            <i class="fas fa-balance-scale"></i> B2. 规模评价
          </div>
        </div>
        <!-- B2.1 任务完成情况 -->
        <div class="chart-container">
          <div class="chart-header">
            <div class="chart-title">
              <i class="fas fa-tasks"></i> B2.1 任务完成情况
            </div>
          </div>
          <div class="chart-flex">
            <div class="chart-area">
              <div class="row-flex">
                <div class="col-7">
                  <div style="margin-bottom: 20px;">
                    <div class="stat-title">规模KPI 完成度 - 序时进度（RR1）</div>
                    <div id="scaleTimeProgressBar" class="progress-container">
                      <div class="progress-bar" style="width: 0%"></div>
                      <div class="progress-text">0%</div>
                    </div>
                  </div>
                  <div>
                    <div class="stat-title">规模KPI 完成度 - 整体进度（RR2）</div>
                    <div id="scaleOverallProgressBar" class="progress-container">
                      <div class="progress-bar" style="width: 0%"></div>
                      <div class="progress-text">0%</div>
                    </div>
                  </div>
                </div>
                <div class="col-5">
                  <div style="text-align: center; padding: 20px; background-color: var(--primary-bg); border-radius: 8px; border: 1px solid var(--border-color); height: 100%; display: flex; flex-direction: column; justify-content: center;">
                    <div style="font-size: 16px; margin-bottom: 15px;">规模完成绝对值</div>
                    <div id="absoluteScale" style="font-size: 32px; font-weight: bold; color: var(--highlight-bg);"></div>
                    <div style="font-size: 14px; color: #bbbbbb; margin-top: 10px;">亿元</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="chart-analysis">
              <div class="analysis-title">
                <i class="fas fa-lightbulb"></i> 智能分析
              </div>
              <div class="analysis-content" id="scaleTaskCompletionAnalysis">
                <p>加载中...</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- B2.2 同组排名 -->
        <div class="chart-container" style="height: 450px;">
          <div class="chart-header">
            <div class="chart-title">
              <i class="fas fa-users"></i> B2.2 同组排名
            </div>
          </div>
          <div class="chart-flex">
            <div class="chart-area">
              <div style="display: flex; gap: 20px; height: 380px;">
                <div id="scaleScatterChart" style="width: 50%; height: 100%;"></div>
                <div id="scaleGroupRankChart" style="width: 50%; height: 100%;"></div>
              </div>
            </div>
            <div class="chart-analysis">
              <div class="analysis-title">
                <i class="fas fa-lightbulb"></i> 智能分析
              </div>
              <div class="analysis-content" id="scaleRankAnalysis">
                <p>加载中...</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- B2.3 RM 规模趋势 -->
        <div class="chart-container">
          <div class="chart-header">
            <div class="chart-title">
              <i class="fas fa-chart-bar"></i> B2.3 RM 规模趋势
            </div>
            <!-- 移除控制按钮部分 -->
          </div>
          <div class="chart-flex">
            <div class="chart-area">
              <div id="scaleTrendChart" style="width: 100%; height: 300px;"></div>
            </div>
            <div class="chart-analysis">
              <div class="analysis-title">
                <i class="fas fa-lightbulb"></i> 智能分析
              </div>
              <div class="analysis-content" id="scaleTrendAnalysis">
                <p>加载中...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // 将 B2 模块添加到页面中
    const mainContent = document.getElementById('mainContent');
    mainContent.appendChild(container);
    
    // 初始化各子模块
    updateScaleTaskCompletion(selectedRM, rmData);
    initScaleScatterChart(selectedRM, rmData);
    initScaleGroupRankChart(selectedRM, rmData);
    updateScaleRankAnalysis(selectedRM, rmData);
    initScaleTrendChart(selectedRM); // 移除 'month' 参数
    
    
  }
  