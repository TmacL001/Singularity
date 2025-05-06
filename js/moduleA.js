/**
 * moduleA.js - 整体评价模块
 * 
 * 该模块负责初始化理财经理工作台界面的整体布局和交互逻辑
 * 集成了各个模块的功能，包括用户欢迎区、关键指标展示、收入分析和规模分析
 */

import { callChatGpt } from './chatGptService.js';
import { initRmAnalysisSummary } from './rmAnalysisSummary.js';


// 全局变量
let mainContent = null;
let currentRmId = null;
let currentDate = new Date();

// 辅助函数：格式化数字
function formatCurrency(value) {
    return Number(value).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatPercent(value) {
    return Number(value).toFixed(1);
}

// 主函数：加载整体评价模块
export function loadOverviewModule(selectedRM, rmData, rmCustData) {
    // 先保存主内容区引用
    mainContent = document.getElementById('mainContent');
    if (!mainContent) {
        console.error('Error: mainContent element not found');
        return;
    }
    
    // 清空主内容区
    mainContent.innerHTML = `
        <div class="section-title animate-fade">
            <i class="fas fa-tachometer-alt"></i> 整体评价
        </div>
    `;
    
    // 添加CSS样式
    addStyles();
    
    // 构建界面结构
    try {
        console.log("开始初始化仪表盘...");
        // 初始化各模块
        initHeader(selectedRM);
        console.log("头部初始化完成");
        
        initKeyMetrics(selectedRM, rmData); 
        console.log("关键指标初始化完成");
        
        initIncomeAnalysis(selectedRM, rmData);
        console.log("收入分析初始化完成");
        
        initAumAnalysis(selectedRM, rmData, rmCustData);
        console.log("规模分析初始化完成");
        
                // 最后添加智能问答模块
        try {
            // 适当延迟加载以确保其他模块已完全渲染
            setTimeout(() => {
                import('./moduleQA.js').then(module => {
                    module.initQAModule(selectedRM, rmData, rmCustData);
                    console.log("智能问答模块初始化完成");
                }).catch(error => {
                    console.error("智能问答模块加载失败:", error);
                });
            }, 800); // 给其他模块一定的渲染时间
        } catch (qaError) {
            console.error("智能问答模块初始化失败:", qaError);
            // 继续执行，不中断整个加载过程
        }

                // 添加大模型综合分析点评模块
        try {
            // 适当延迟加载以确保其他模块已完全渲染
            setTimeout(() => {
                initRmAnalysisSummary(selectedRM, rmData, rmCustData);
                console.log("大模型综合分析点评模块初始化完成");
            }, 1200); // 给其他模块一定的渲染时间
        } catch (summaryError) {
            console.error("大模型综合分析点评模块初始化失败:", summaryError);
            // 继续执行，不中断整个加载过程
        }

        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        mainContent.innerHTML += `
            <div class="error-message">
                <strong>加载整体评价模块失败</strong><br>
                错误信息: ${error.message}<br>
                请检查控制台获取更多详情。
            </div>
        `;
    }
}


// 初始化头部区域
function initHeader(selectedRM) {
    if (!selectedRM || !mainContent) return;
    
    // 生成一个基于RM_ID的数字，用于选择头像
    const avatarIndex = getNumberFromString(selectedRM.RM_ID) % 10; // 假设有10个不同的头像
    
    // 静态卡通头像URL - 使用知名的免费卡通头像集
    // 这里使用了Flat Icon提供的免费卡通头像集的CDN链接
    const staticAvatars = [
        'https://cdn-icons-png.flaticon.com/512/147/147144.png', // 男性卡通头像
        'https://cdn-icons-png.flaticon.com/512/194/194938.png', // 女性卡通头像
        'https://cdn-icons-png.flaticon.com/512/219/219969.png', // 中性卡通头像
        'https://cdn-icons-png.flaticon.com/512/4333/4333609.png', // 商务人士
        'https://cdn-icons-png.flaticon.com/512/6997/6997662.png', // 程序员
        'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', // 医生
        'https://cdn-icons-png.flaticon.com/512/3220/3220315.png', // 教师
        'https://cdn-icons-png.flaticon.com/512/2922/2922510.png', // 年轻人
        'https://cdn-icons-png.flaticon.com/512/4202/4202843.png', // 老年人
    ];
    
    // 如果外部链接无法访问，使用本地备用头像
    const fallbackAvatar = 'assets/default-avatar.png';
    
    const headerSection = document.createElement('section');
    headerSection.className = 'dashboard-header';
    headerSection.innerHTML = `
        <div class="welcome-container">
            <div class="user-info">
                <div class="user-avatar">
                    <img src="${staticAvatars[avatarIndex]}" 
                         alt="RM Avatar" 
                         onerror="this.src='${fallbackAvatar}'; if(this.src === '${fallbackAvatar}') this.src='https://via.placeholder.com/80?text=${selectedRM.RM_ID}'">
                </div>
                <div class="user-details">
                    <h2 id="welcomeMessage">Hello, ${selectedRM.RM_ID}! 欢迎回来！</h2>
                    <p id="lastLoginInfo">上次登录: ${formatDate(new Date(Date.now() - 86400000))}</p>
                </div>
            </div>
            <div class="calendar-container">
                <div class="calendar-header">
                    <span id="currentMonth">${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月</span>
                </div>
                <div class="calendar-body">
                    <div id="calendarDateDisplay" class="date-display">
                        <div class="current-date">${currentDate.getDate()}</div>
                        <div class="day-name">${getDayName(currentDate)}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 添加到主内容区域
    mainContent.appendChild(headerSection);
}


function getNumberFromString(str) {
    let total = 0;
    for (let i = 0; i < str.length; i++) {
        total += str.charCodeAt(i);
    }
    return total;
}

function updateAvatarStyles() {
    // 添加卡通头像特定的样式
    const existingStyle = document.getElementById('avatar-styles');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'avatar-styles';
    styleElement.textContent = `
        /* 卡通头像样式 */
        .user-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            overflow: hidden;
            border: 3px solid var(--highlight-bg, #3fa2e9);
            box-shadow: 0 0 15px rgba(63, 162, 233, 0.5);
            background-color: white; /* 白色背景，确保头像可见 */
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .user-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover; /* 确保头像填满圆形区域 */
        }
    `;
    
    document.head.appendChild(styleElement);
}

// 初始化关键指标区域
function initKeyMetrics(selectedRM, rmData) {
    if (!selectedRM || !mainContent || !rmData) return;
    
    // 获取当前理财经理所在的组
    const rmGroup = selectedRM.cust_aum_scale_group;
    
    // 过滤出同组的理财经理数据
    const sameGroupRMs = rmData.filter(rm => rm.cust_aum_scale_group === rmGroup);
    
    // 计算同组平均值
    const avgCustNums = calculateAverage(sameGroupRMs, 'cust_nums');
    const avgIncomeValue = calculateAverage(sameGroupRMs, 'RM_Yrev_2025') / 10000; 
    const avgAumValue = calculateAverage(sameGroupRMs, 'RM_Yaum_2025') / 100000000; 
    
    // 数据转换处理
    const custNums = selectedRM.cust_nums || 0;
    const incomeValue = (selectedRM.RM_Yrev_2025/10000 || 0).toFixed(1);
    const aumValue = selectedRM.RM_Yaum_2025 ? (selectedRM.RM_Yaum_2025 / 100000000).toFixed(1) : 0;
    
    // 计算差异百分比
    const custNumsDiff = avgCustNums > 0 ? ((custNums - avgCustNums) / avgCustNums * 100).toFixed(1) : 0;
    const incomeDiff = avgIncomeValue > 0 ? ((parseFloat(incomeValue) - avgIncomeValue) / avgIncomeValue * 100).toFixed(1) : 0;
    const aumDiff = avgAumValue > 0 ? ((parseFloat(aumValue) - avgAumValue) / avgAumValue * 100).toFixed(1) : 0;
    
    // 生成比较指示器HTML
    const custNumsCompareHTML = generateCompareIndicator(custNumsDiff);
    const incomeCompareHTML = generateCompareIndicator(incomeDiff);
    const aumCompareHTML = generateCompareIndicator(aumDiff);
    
    const metricsSection = document.createElement('section');
    metricsSection.className = 'key-metrics-section';
    metricsSection.innerHTML = `
        <h3 class="section-heading"><i class="fas fa-chart-line"></i> 关键业绩指标</h3>
        <div class="metrics-container">
            <div class="metric-card">
                <div class="metric-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="metric-details">
                    <h4>管理户数</h4>
                    <div class="metric-value-container">
                        <div class="metric-value" id="custNumsValue">${custNums}</div>
                        <div class="metric-unit">人</div>
                        <div class="metric-compare">${custNumsCompareHTML}</div>
                    </div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-icon">
                    <i class="fas fa-money-bill-wave"></i>
                </div>
                <div class="metric-details">
                    <h4>收入完成值</h4>
                    <div class="metric-value-container">
                        <div class="metric-value" id="incomeCompletionValue">${incomeValue}</div>
                        <div class="metric-unit">万元</div>
                        <div class="metric-compare">${incomeCompareHTML}</div>
                    </div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-icon">
                    <i class="fas fa-balance-scale"></i>
                </div>
                <div class="metric-details">
                    <h4>规模完成值</h4>
                    <div class="metric-value-container">
                        <div class="metric-value" id="scaleCompletionValue">${aumValue}</div>
                        <div class="metric-unit">亿元</div>
                        <div class="metric-compare">${aumCompareHTML}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 添加到主内容区域
    mainContent.appendChild(metricsSection);
}

// CSS样式更新，调整单位的位置和样式
function updateStyles() {
    // 更新或添加样式
    const existingStyle = document.getElementById('metrics-inline-style');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'metrics-inline-style';
    styleElement.textContent = `
        .metric-value-container {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 5px;
        }
        
        .metric-value {
            font-size: 30px;
            font-weight: bold;
            color: var(--highlight-bg, #3fa2e9);
        }
        
        .metric-unit {
            font-size: 16px;
            color: #a0a0a0;
            margin-right: 20px; /* 增加单位与对比指标之间的间距 */
        }
        
        .metric-compare {
            font-size: 15px;
            font-weight: bold;
            display: flex;
            align-items: center;
        }
        
        .compare-up {
            color: #4CAF50;
            display: flex;
            align-items: center;
        }
        
        .compare-down {
            color: #F44336;
            display: flex;
            align-items: center;
        }
        
        .compare-neutral {
            color: #9E9E9E;
        }
        
        .compare-up i, .compare-down i {
            margin-right: 20px;
            font-size: 30px;
        }
    `;
    
    document.head.appendChild(styleElement);
    
    console.log('指标布局样式为"数值+单位+对比指标"并排显示');
}

// 计算同组平均值的辅助函数
function calculateAverage(array, property) {
    if (!array || array.length === 0) return 0;
    
    const validValues = array
        .map(item => item[property])
        .filter(val => val !== null && val !== undefined && !isNaN(val));
    
    if (validValues.length === 0) return 0;
    
    const sum = validValues.reduce((total, val) => total + Number(val), 0);
    return sum / validValues.length;
}

// 生成比较指示器HTML的辅助函数
function generateCompareIndicator(diffPercent) {
    // 转为数字确保比较正确
    const diff = Number(diffPercent);
    
    // 如果差异为0或无效值，返回空
    if (diff === 0 || isNaN(diff)) {
        return `<span class="compare-neutral">0.0%</span>`;
    }
    
    // 根据差异值生成上升/下降指示器
    if (diff > 0) {
        return `
            <span class="compare-up">
                <i class="fas fa-caret-up"></i>
                ${Math.abs(diff)}%
            </span>
        `;
    } else {
        return `
            <span class="compare-down">
                <i class="fas fa-caret-down"></i>
                ${Math.abs(diff)}%
            </span>
        `;
    }
}

// 初始化收入分析区域
function initIncomeAnalysis(selectedRM, rmData) {
    if (!selectedRM || !rmData || !mainContent) return;
    
    const incomeSection = document.createElement('section');
    incomeSection.className = 'income-analysis-section';
    incomeSection.innerHTML = `
        <h3 class="section-heading"><i class="fas fa-money-bill-wave"></i> 收入分析</h3>
        <div class="analysis-container">
            <div class="analysis-card">
                <h4 class="card-title"><i class="fas fa-tasks"></i> 收入序时进度 & 整体完成度</h4>
                <div class="card-content">
                    <!-- 注意这里的嵌套结构 -->
                    <div style="margin-bottom: 20px;">
                        <div class="stat-title">收入KPI 完成度 - 序时进度 </div>
                        <div id="incomeTimeProgressBar" class="progress-container">
                            <div class="progress-bar" style="width: 0%"></div>
                            <div class="progress-text">0%</div>
                        </div>
                    </div>
                    <div>
                        <div class="stat-title">收入KPI 完成度 - 整体进度 </div>
                        <div id="incomeOverallProgressBar" class="progress-container">
                            <div class="progress-bar" style="width: 0%"></div>
                            <div class="progress-text">0%</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="analysis-card">
                <h4 class="card-title"><i class="fas fa-trophy"></i> 收入排名情况</h4>
                <div class="card-content" style="height: 250px;">
                    <div id="incomeRankingChart" style="width: 100%; height: 100%;"></div>
                </div>
            </div>
            <div class="analysis-card">
                <h4 class="card-title"><i class="fas fa-chart-pie"></i> 收入结构分布</h4>
                <div class="card-content" style="height: 250px;">
                    <div id="revenueStructureChart" style="width: 100%; height: 100%;"></div>
                </div>
            </div>
        </div>
    `;
    
    // 添加到主内容区域
    mainContent.appendChild(incomeSection);
    
    // 在DOM加载完成后初始化图表
    setTimeout(() => {
        try {
            // 更新收入完成情况
            updateIncomeTaskCompletion(selectedRM, rmData);
            
            // 初始化收入排名图表
            initIncomeRankingChart(selectedRM, rmData);
            
            // 初始化收入结构分布图
            initRevenueStructureChart(selectedRM, rmData);
        } catch (error) {
            console.error('Error initializing income analysis charts:', error);
        }
    }, 500);
}

// 更新收入任务完成情况
function updateIncomeTaskCompletion(selectedRM, rmData) {
    if (!selectedRM) return;
    
    // 获取进度条元素
    const timeProgressBar = document.getElementById('incomeTimeProgressBar');
    const overallProgressBar = document.getElementById('incomeOverallProgressBar');
    
    if (!timeProgressBar || !overallProgressBar) {
        console.error('Income progress bars not found', timeProgressBar, overallProgressBar);
        return;
    }
    
    // 计算 RR1 = RM_REV_KPI_RR / RM_Rev_todate * 100 (与moduleB1.js保持一致)
    const rr1Value = (selectedRM.RM_REV_KPI_RR / selectedRM.RM_Rev_todate * 100) || 0;
    // 计算 RR2 = RM_REV_KPI / RM_Rev_todate * 100 (与moduleB1.js保持一致)
    const rr2Value = (selectedRM.RM_REV_KPI / selectedRM.RM_Rev_todate * 100) || 0;
    
    const rr1Formatted = formatPercent(rr1Value);
    const rr2Formatted = formatPercent(rr2Value);
    
    // 更新进度条 - 采用与B1模块相同的方法
    const timeProgressBarInner = timeProgressBar.querySelector('.progress-bar');
    const timeProgressText = timeProgressBar.querySelector('.progress-text');
    const overallProgressBarInner = overallProgressBar.querySelector('.progress-bar');
    const overallProgressText = overallProgressBar.querySelector('.progress-text');
    
    if (!timeProgressBarInner || !timeProgressText || !overallProgressBarInner || !overallProgressText) {
        console.error('Income progress bar children not found');
        return;
    }
    
    // 控制最大值为100%
    const safeRR1 = Math.min(rr1Value, 100);
    const safeRR2 = Math.min(rr2Value, 100);
    
    // 更新序时进度RR1
    timeProgressBarInner.style.width = `${safeRR1}%`;
    timeProgressText.textContent = `${rr1Formatted}%`;

    // 添加颜色逻辑
     timeProgressBarInner.style.background = 'linear-gradient(90deg, #3fa2e9, #0d47a1)';
    
    
    // 更新整体进度RR2
    overallProgressBarInner.style.width = `${safeRR2}%`;
    overallProgressText.textContent = `${rr2Formatted}%`;
    
    // 添加颜色逻辑
    overallProgressBarInner.style.background = 'linear-gradient(90deg, #3fa2e9, #0d47a1)';

}

// 初始化收入排名图表 - 垂直柱状图
function initIncomeRankingChart(selectedRM, rmData) {
    if (!selectedRM || !rmData) return;
    
    const chartContainer = document.getElementById('incomeRankingChart');
    if (!chartContainer) return;
    
    // 获取选中理财经理所在的组
    const rmGroup = selectedRM.cust_aum_scale_group;
    
    // 过滤同组的理财经理数据
    const groupData = rmData.filter(rm => rm.cust_aum_scale_group === rmGroup && rm.RM_Rev_todate);
    
    // 按收入从大到小排序
    groupData.sort((a, b) => b.RM_Rev_todate - a.RM_Rev_todate);
    
    // 准备图表数据
    const rmIds = groupData.map(rm => rm.RM_ID);
    const incomeValues = groupData.map(rm => (rm.RM_Rev_todate / 10000).toFixed(1)); // 转换为万元
    
    // 准备颜色数据
    const colors = groupData.map(rm => 
        rm.RM_ID === selectedRM.RM_ID ? '#FF7043' : 'rgba(63, 162, 233, 0.5)'
    );
    
    // 初始化图表
    const chart = echarts.init(chartContainer);
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params) {
                return `${params[0].name}<br/>${params[0].value} 万元`;
            }
        },
        grid: {
            left: '5%',
            right: '5%',
            bottom: '10%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: rmIds,
            axisLabel: {
                interval: 0,
                rotate: 45,
                color: '#e0e0e0',
                fontSize: 10
            },
            axisLine: {
                lineStyle: {
                    color: '#e0e0e0',
                    show: false
                
                }
            },
            axisTick: {
                alignWithLabel: true
            }
        },
        yAxis: {
            type: 'value',
            name: '收入 (万元)',
            nameTextStyle: {
                color: '#e0e0e0'
            },
            axisLabel: {
                color: '#e0e0e0'
            },
            axisLine: {
                lineStyle: {
                    color: '#e0e0e0'
                }
            },
            splitLine: {
                show: false  // 隐藏横向网格线
            }
        },
        series: [{
            name: '收入',
            type: 'bar',
            data: incomeValues,
            itemStyle: {
                color: function(params) {
                    return colors[params.dataIndex];
                },
                borderRadius: [5, 5, 0, 0]
            },
            emphasis: {
                itemStyle: {
                    color: '#3fa2e9',
                    shadowBlur: 10,
                    shadowColor: 'rgba(63, 162, 233, 0.5)'
                }
            },
            animationDelay: function (idx) {
                return idx * 100;
            }
        }],
        animationEasing: 'elasticOut',
        animationDuration: 1000
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

// 初始化收入结构分布图 - 环形图
function initRevenueStructureChart(selectedRM, rmData) {
    if (!selectedRM || !rmData) return;
    
    const chartContainer = document.getElementById('revenueStructureChart');
    if (!chartContainer) return;
    
    // 获取收入结构数据
    const companyRevenue = selectedRM.RM_TD_Rev_cpt || 0; // 公司联动收入
    const retailCreditRevenue = selectedRM.RM_TD_Rev_crt || 0; // 零售信贷收入
    const depositFTPRevenue = selectedRM.RM_TD_Rev_dpt || 0; // 存款FTP
    const intermediaryRevenue = selectedRM.RM_TD_Rev_aum || 0; // 中间业务收入
    
    // 计算总收入
    const totalRevenue = companyRevenue + retailCreditRevenue + depositFTPRevenue + intermediaryRevenue;
    
    // 计算各部分占比 (%)
    const companyPct = totalRevenue > 0 ? (companyRevenue / totalRevenue * 100).toFixed(1) : 0;
    const retailCreditPct = totalRevenue > 0 ? (retailCreditRevenue / totalRevenue * 100).toFixed(1) : 0;
    const depositFTPPct = totalRevenue > 0 ? (depositFTPRevenue / totalRevenue * 100).toFixed(1) : 0;
    const intermediaryPct = totalRevenue > 0 ? (intermediaryRevenue / totalRevenue * 100).toFixed(1) : 0;
    
    // 创建图表数据
    const chartData = [
        { value: intermediaryRevenue, name: `中间业务收入 ${intermediaryPct}%`, itemStyle: { color: '#4B9CD3' } },
        { value: depositFTPRevenue, name: `存款FTP ${depositFTPPct}%`, itemStyle: { color: '#13294B' } },
        { value: retailCreditRevenue, name: `零售信贷收入 ${retailCreditPct}%`, itemStyle: { color: '#8FD6E1' } },
        { value: companyRevenue, name: `公司收入 ${companyPct}%`, itemStyle: { color: '#0D47A1' } }
    ];
    
    // 初始化图表
    const chart = echarts.init(chartContainer);
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                return `${params.name}:<br/>${formatNumber(params.value)} (${params.percent.toFixed(1)}%)`;
            }
        },
        legend: {
            orient: 'vertical',
            right: '5%',
            top: 'center',
            textStyle: {
                color: '#e0e0e0',
                fontSize: 12
            },
            itemGap: 8 
        },
        series: [{
            name: '收入结构',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderRadius: 6,
                borderColor: 'rgba(15, 37, 55, 0.8)',
                borderWidth: 2
            },
            label: {
                show: false,
                position: 'center'
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: '14',
                    fontWeight: 'bold',
                    color: '#e0e0e0'
                },
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            },
            labelLine: {
                show: false
            },
            data: chartData
        }],
        animationDuration: 1500
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

// 初始化规模分析区域
function initAumAnalysis(selectedRM, rmData, rmCustData) {
    if (!selectedRM || !rmData || !mainContent) return;
    
    const aumSection = document.createElement('section');
    aumSection.className = 'aum-analysis-section';
    aumSection.innerHTML = `
        <h3 class="section-heading"><i class="fas fa-balance-scale"></i> 规模分析</h3>
        <div class="analysis-container">
            <div class="analysis-card">
                <h4 class="card-title"><i class="fas fa-tasks"></i> 规模序时进度 & 整体完成度</h4>
                <div class="card-content">
                    <!-- 注意这里的嵌套结构 -->
                    <div style="margin-bottom: 20px;">
                        <div class="stat-title">规模KPI 完成度 - 序时进度 </div>
                        <div id="scaleTimeProgressBar" class="progress-container">
                            <div class="progress-bar" style="width: 0%"></div>
                            <div class="progress-text">0%</div>
                        </div>
                    </div>
                    <div>
                        <div class="stat-title">规模KPI 完成度 - 整体进度 </div>
                        <div id="scaleOverallProgressBar" class="progress-container">
                            <div class="progress-bar" style="width: 0%"></div>
                            <div class="progress-text">0%</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="analysis-card">
                <h4 class="card-title"><i class="fas fa-trophy"></i> 规模排名情况</h4>
                <div class="card-content" style="height: 250px;">
                    <div id="scaleRankingChart" style="width: 100%; height: 100%;"></div>
                </div>
            </div>
            <div class="analysis-card">
                <h4 class="card-title"><i class="fas fa-users"></i> AUM分布</h4>
                <div class="card-content" style="height: 250px;">
                    <div id="customerDistributionChart" style="width: 100%; height: 100%;"></div>
                </div>
            </div>
        </div>
    `;
    
    // 添加到主内容区域
    mainContent.appendChild(aumSection);
    
    // 在DOM加载完成后初始化图表
    setTimeout(() => {
        try {
            // 更新规模完成情况
            updateScaleTaskCompletion(selectedRM, rmData);
            
            // 初始化规模排名图表
            initScaleRankingChart(selectedRM, rmData);
            
            // 创建客户分布图表
            initCustomerDistributionChart(selectedRM, rmCustData);
        } catch (error) {
            console.error('Error initializing AUM analysis charts:', error);
        }
    }, 500);
}

// 更新规模任务完成情况
function updateScaleTaskCompletion(selectedRM, rmData) {
    if (!selectedRM) return;
    
    // 获取进度条元素
    const timeProgressBar = document.getElementById('scaleTimeProgressBar');
    const overallProgressBar = document.getElementById('scaleOverallProgressBar');
    
    if (!timeProgressBar || !overallProgressBar) {
        console.error('Scale progress bars not found', timeProgressBar, overallProgressBar);
        return;
    }
    
    // 根据moduleB2.js的计算逻辑计算规模完成率
    let rr1Value = 0, rr2Value = 0;
    if (selectedRM.RM_Yaum_2025) {
        rr1Value = (selectedRM.RM_AUM_KPI_RR / selectedRM.RM_Yaum_2025 * 100) || 0;
        rr2Value = (selectedRM.RM_AUM_KPI / selectedRM.RM_Yaum_2025 * 100) || 0;
    }
    
    const rr1Formatted = formatPercent(rr1Value);
    const rr2Formatted = formatPercent(rr2Value);
    
    // 更新进度条 - 采用与B2模块相同的方法
    const timeProgressBarInner = timeProgressBar.querySelector('.progress-bar');
    const timeProgressText = timeProgressBar.querySelector('.progress-text');
    const overallProgressBarInner = overallProgressBar.querySelector('.progress-bar');
    const overallProgressText = overallProgressBar.querySelector('.progress-text');
    
    if (!timeProgressBarInner || !timeProgressText || !overallProgressBarInner || !overallProgressText) {
        console.error('Scale progress bar children not found');
        return;
    }
    
    // 控制最大值为100%
    const safeRR1 = Math.min(rr1Value, 100);
    const safeRR2 = Math.min(rr2Value, 100);
    
    // 更新序时进度RR1
    timeProgressBarInner.style.width = `${safeRR1}%`;
    timeProgressText.textContent = `${rr1Formatted}%`;
    
    // 添加颜色逻辑
    timeProgressBarInner.style.background = 'linear-gradient(90deg, #3fa2e9, #0d47a1)';
    
    
    // 更新整体进度RR2
    overallProgressBarInner.style.width = `${safeRR2}%`;
    overallProgressText.textContent = `${rr2Formatted}%`;
    
    // 添加颜色逻辑
    overallProgressBarInner.style.background = 'linear-gradient(90deg, #3fa2e9, #0d47a1)';

}

// 初始化规模排名图表 - 垂直柱状图
function initScaleRankingChart(selectedRM, rmData) {
    if (!selectedRM || !rmData) return;
    
    const chartContainer = document.getElementById('scaleRankingChart');
    if (!chartContainer) return;
    
    // 获取选中理财经理所在的组
    const rmGroup = selectedRM.cust_aum_scale_group;
    
   // 过滤同组的理财经理数据
   const groupData = rmData.filter(rm => rm.cust_aum_scale_group === rmGroup && rm.RM_GROUP_AUM_GRW !== undefined);
    
     // 按规模增长率从大到小排序（改用 RM_GROUP_AUM_GRW）
    groupData.sort((a, b) => (b.RM_GROUP_AUM_GRW || 0) - (a.RM_GROUP_AUM_GRW || 0));
    
    // 准备图表数据
    const rmIds = groupData.map(rm => rm.RM_ID);
    const aumValues = groupData.map(rm => formatPercent((rm.RM_GROUP_AUM_GRW || 0) * 100));
    
    // 准备颜色数据
    const colors = groupData.map(rm => 
        rm.RM_ID === selectedRM.RM_ID ? '#FF7043' : 'rgba(63, 162, 233, 0.5)'
    );
    
    // 初始化图表
    const chart = echarts.init(chartContainer);
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params) {
                return `${params[0].name}<br/>规模增长率: ${params[0].value}%`;
            }
        },
        grid: {
            left: '5%',
            right: '5%',
            bottom: '10%',
            top: '20%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: rmIds,
            axisLabel: {
                interval: 0,
                rotate: 45,
                color: '#e0e0e0',
                fontSize: 10
            },
            axisLine: {
                lineStyle: {
                    color: '#e0e0e0'
                }
            },
            axisTick: {
                alignWithLabel: true
            }
        },
        yAxis: {
            type: 'value',
            name: '规模增长率 (%)',  // 修改Y轴名称
            nameTextStyle: {
                color: '#e0e0e0'
            },
            axisLabel: {
                color: '#e0e0e0',
                formatter: '{value}%'  // 添加百分比符号
            },
            axisLine: {
                lineStyle: {
                    color: '#e0e0e0',
                    show: false
                }
            },
            splitLine: {
                show: false  // 隐藏横向网格线
            }
        },
        series: [{
            name: '规模增长率',  // 修改系列名称
            type: 'bar',
            data: aumValues,
            itemStyle: {
                color: function(params) {
                    return colors[params.dataIndex];
                },
                borderRadius: [5, 5, 0, 0]
            },
            emphasis: {
                itemStyle: {
                    color: '#3fa2e9',
                    shadowBlur: 10,
                    shadowColor: 'rgba(63, 162, 233, 0.5)'
                }
            },
            animationDelay: function (idx) {
                return idx * 100;
            }
        }],
        animationEasing: 'elasticOut',
        animationDuration: 1000
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

// 初始化客户数与AUM分布图表 - 环形图
function initCustomerDistributionChart(selectedRM, rmCustData) {
    if (!selectedRM) return;
    
    const chartContainer = document.getElementById('customerDistributionChart');
    if (!chartContainer) return;
    
    // 获取AUM数据并计算平均值
    // 理财AUM - 计算1-6月的平均值
    const wealthManagementValues = [
        selectedRM.RM_Maum_wm_1 || 0,
        selectedRM.RM_Maum_wm_2 || 0,
        selectedRM.RM_Maum_wm_3 || 0,
        selectedRM.RM_Maum_wm_4 || 0,
        selectedRM.RM_Maum_wm_5 || 0,
        selectedRM.RM_Maum_wm_6 || 0
    ];
    const wealthManagementAum = wealthManagementValues.reduce((sum, val) => sum + val, 0) / 6;
    
    // 基金AUM - 计算1-6月的平均值
    const fundValues = [
        selectedRM.RM_Maum_fund_1 || 0,
        selectedRM.RM_Maum_fund_2 || 0,
        selectedRM.RM_Maum_fund_3 || 0,
        selectedRM.RM_Maum_fund_4 || 0,
        selectedRM.RM_Maum_fund_5 || 0,
        selectedRM.RM_Maum_fund_6 || 0
    ];
    const fundAum = fundValues.reduce((sum, val) => sum + val, 0) / 6;
    
    // 保险AUM - 计算1-6月的平均值
    const insuranceValues = [
        selectedRM.RM_Maum_inr_1 || 0,
        selectedRM.RM_Maum_inr_2 || 0,
        selectedRM.RM_Maum_inr_3 || 0,
        selectedRM.RM_Maum_inr_4 || 0,
        selectedRM.RM_Maum_inr_5 || 0,
        selectedRM.RM_Maum_inr_6 || 0
    ];
    const insuranceAum = insuranceValues.reduce((sum, val) => sum + val, 0) / 6;
    
    // 存款AUM - 计算1-6月的平均值
    const depositValues = [
        selectedRM.RM_Maum_dpt_1 || 0,
        selectedRM.RM_Maum_dpt_2 || 0,
        selectedRM.RM_Maum_dpt_3 || 0,
        selectedRM.RM_Maum_dpt_4 || 0,
        selectedRM.RM_Maum_dpt_5 || 0,
        selectedRM.RM_Maum_dpt_6 || 0
    ];
    const depositAum = depositValues.reduce((sum, val) => sum + val, 0) / 6;
    
    // 计算总AUM
    const totalAum = wealthManagementAum + fundAum + insuranceAum + depositAum;
    
    // 计算各部分占比 (%)
    const wealthPct = totalAum > 0 ? (wealthManagementAum / totalAum * 100).toFixed(1) : 0;
    const fundPct = totalAum > 0 ? (fundAum / totalAum * 100).toFixed(1) : 0;
    const insurancePct = totalAum > 0 ? (insuranceAum / totalAum * 100).toFixed(1) : 0;
    const depositPct = totalAum > 0 ? (depositAum / totalAum * 100).toFixed(1) : 0;
    
    // 创建图表数据
    const chartData = [
        { value: wealthManagementAum, name: `理财AUM ${wealthPct}%`, itemStyle: { color: '#4B9CD3' } },
        { value: fundAum, name: `基金AUM ${fundPct}%`, itemStyle: { color: '#13294B' } },
        { value: insuranceAum, name: `保险AUM ${insurancePct}%`, itemStyle: { color: '#8FD6E1' } },
        { value: depositAum, name: `存款 ${depositPct}%`, itemStyle: { color: '#0D47A1' } }
    ];
    
    // 初始化图表
    const chart = echarts.init(chartContainer);
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                return `${params.name}:<br/>${formatNumber(params.value)} (${params.percent.toFixed(1)}%)`;
            }
        },
        legend: {
            orient: 'vertical',
            right: '5%',
            top: 'center',
            textStyle: {
                color: '#e0e0e0',
                fontSize: 12
            },
            itemGap: 8 
        },
        series: [{
            name: 'AUM分布',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderRadius: 6,
                borderColor: 'rgba(15, 37, 55, 0.8)',
                borderWidth: 2
            },
            label: {
                show: false,
                position: 'center'
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: '14',
                    fontWeight: 'bold',
                    color: '#e0e0e0'
                },
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            },
            labelLine: {
                show: false
            },
            data: chartData
        }],
        animationDuration: 1500
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

// 辅助函数：初始化客户层级数据结构
function initTierData(tierOrder) {
    const data = {};
    tierOrder.forEach(tier => {
        data[tier] = 0;
    });
    return data;
}


// 创建占位图表（当相应的函数不可用时）
function createPlaceholderChart(containerId, title) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const chart = echarts.init(container);
    const option = {
        title: {
            text: `${title} (数据加载中...)`,
            left: 'center',
            textStyle: { color: '#e0e0e0', fontSize: 14 }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: ['加载中...'],
            axisLabel: { color: '#e0e0e0' }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#e0e0e0' }
        },
        series: [
            {
                type: 'bar',
                data: [0],
                itemStyle: { color: '#3fa2e9' }
            }
        ]
    };
    
    chart.setOption(option);
}

// 辅助函数：格式化日期
function formatDate(date) {
    return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
}

// 辅助函数：补零
function padZero(num) {
    return num < 10 ? '0' + num : num;
}

// 辅助函数：获取星期几
function getDayName(date) {
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return days[date.getDay()];
}

// 添加CSS样式
function addStyles() {
    // 检查样式是否已存在
    if (document.getElementById('moduleA-styles')) {
        return; // 避免重复添加
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'moduleA-styles';
    styleElement.textContent = `
        /* 错误信息样式 */
        .error-message {
            background-color: rgba(244, 67, 54, 0.15);
            color: #F44336;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            border-left: 5px solid #F44336;
        }
        
        /* 整体评价模块的样式 */
        .dashboard-header {
            background-color: var(--card-bg, rgba(15, 37, 55, 0.5));
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 25px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border: 1px solid var(--border-color, rgba(63, 162, 233, 0.2));
        }
        
        .welcome-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .user-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            overflow: hidden;
            border: 3px solid var(--highlight-bg, #3fa2e9);
            box-shadow: 0 0 15px rgba(63, 162, 233, 0.5);
        }
        
        .user-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .user-details h2 {
            font-size: 24px;
            margin: 0 0 5px 0;
            color: var(--text-color, #e0e0e0);
        }
        
        .user-details p {
            margin: 0;
            color: #a0a0a0;
            font-size: 14px;
        }
        
        .calendar-container {
            background-color: rgba(63, 162, 233, 0.1);
            border-radius: 10px;
            padding: 15px;
            width: 180px;
            text-align: center;
            border: 1px solid rgba(63, 162, 233, 0.3);
        }
        
        .calendar-header {
            margin-bottom: 10px;
            font-weight: bold;
            color: var(--text-color, #e0e0e0);
        }
        
        .calendar-body {
            display: flex;
            justify-content: center;
        }
        
        .date-display {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .current-date {
            font-size: 36px;
            font-weight: bold;
            color: var(--highlight-bg, #3fa2e9);
        }
        
        .day-name {
            font-size: 14px;
            color: var(--text-color, #e0e0e0);
            margin-top: 5px;
        }
        
        /* 关键指标部分样式 */
        .section-heading {
            font-size: 18px;
            margin: 0 0 15px 0;
            color: var(--text-color, #e0e0e0);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .section-heading i {
            color: var(--highlight-bg, #3fa2e9);
        }
        
        .key-metrics-section {
            margin-bottom: 25px;
        }
        
        .metrics-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        }
        
        /* 修改的指标卡片样式 */
        .metric-card {
            background: linear-gradient(145deg, rgba(15, 37, 55, 0.8), rgba(9, 30, 44, 0.9));
            border-radius: 12px;
            padding: 25px;
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(63, 162, 233, 0.2);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s;
            position: relative;
            overflow: hidden;
            text-align: center;
        }
        
        .metric-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 5px;
            background: linear-gradient(90deg, var(--highlight-bg, #3fa2e9), #0d47a1);
        }
        
        .metric-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
            border-color: var(--highlight-bg, #3fa2e9);
        }
        
        .metric-icon {
            width: 50px;
            height: 50px;
            background-color: rgba(63, 162, 233, 0.15);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 15px;
            font-size: 22px;
            color: var(--highlight-bg, #3fa2e9);
        }
        
        .metric-details {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
        }
        
        .metric-details h4 {
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #bbbbbb;
            text-align: center;
        }
        /* 修改指标卡片的值和对比样式 */
        .metric-value-container {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 5px;
        }
            
        .metric-value {
            font-size: 30px;
            font-weight: bold;
            color: var(--highlight-bg, #3fa2e9);

        }
        
        .metric-compare {
            font-size: 18px;
            font-weight: bold;
            display: flex;
            align-items: center;
        }
        
        .compare-up {
            color: #4CAF50;
            display: flex;
            align-items: center;
        }
        
        .compare-down {
            color: #F44336;
            display: flex;
            align-items: center;
        }
        
        .compare-neutral {
            color: #9E9E9E;
        }
        
        .compare-up i, .compare-down i {
            margin-right: 3px;
            font-size: 30px;
        }
        
            .metric-unit {
            font-size: 16px;
            color: #a0a0a0;
            text-align: center;
            display: inline-flex;
            align-items: center; // 垂直居中对齐
        }
                
        /* 分析部分的样式 */
        .income-analysis-section,
        .aum-analysis-section {
            margin-bottom: 25px;
        }
        
        .analysis-container {
            display: flex;
            gap: 20px;
            justify-content: space-between;
        }
        
        .analysis-card {
            background-color: rgba(15, 37, 55, 0.8);
            border-radius: 12px;
            flex: 1;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(63, 162, 233, 0.2);
            overflow: hidden;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .analysis-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }
        
        .card-title {
            margin: 0;
            padding: 15px;
            font-size: 16px;
            background-color: rgba(63, 162, 233, 0.1);
            color: var(--text-color, #e0e0e0);
            border-bottom: 1px solid rgba(63, 162, 233, 0.2);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .card-title i {
            color: var(--highlight-bg, #3fa2e9);
        }
        
        .card-content {
            padding: 15px;
        }
        
        .progress-container {
           width: 100%;
            background-color: rgba(9, 30, 44, 0.5);
            border-radius: 10px;
            height: 24px;
            margin-bottom: 15px;
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(63, 162, 233, 0.2);
        }
        
        .stat-title {
            font-size: 14px;
            color: #bbbbbb;
            margin-bottom: 10px;
        }
        
        .progress-bar-container {
            height: 20px;
            background-color: rgba(9, 30, 44, 0.5);
            border-radius: 10px;
            overflow: hidden;
            position: relative;
            margin-bottom: 15px;
            border: 1px solid rgba(63, 162, 233, 0.2);
        }
        
        .progress-bar {
            height: 100%;
            border-radius: 10px;
            background-color: var(--highlight-bg, #3fa2e9);
            transition: width 1.5s ease-in-out;
        }
        
        .progress-text {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: var(--text-color, #e0e0e0);
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .absolute-value-container {
            text-align: center;
            background-color: rgba(9, 30, 44, 0.5);
            border-radius: 10px;
            padding: 15px;
            margin-top: 20px;
            border: 1px solid rgba(63, 162, 233, 0.2);
        }
        
        .absolute-value {
            font-size: 30px;
            font-weight: bold;
            color: var(--highlight-bg, #3fa2e9);
            margin: 10px 0;
        }
        
        .value-unit {
            font-size: 20px;
            color: #a0a0a0;
        }
        
        /* 响应式布局 */
        @media (max-width: 1200px) {
            .analysis-container {
                flex-direction: column;
            }
            
            .welcome-container {
                flex-direction: column;
                gap: 20px;
            }
            
            .calendar-container {
                width: 100%;
            }
            
            .metrics-container {
                flex-direction: column;
            }
        }
    `;
    updateStyles();
    updateAvatarStyles(); 
    document.head.appendChild(styleElement);

}
