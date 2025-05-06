/**
 * moduleF.js - 商机预测模块
 * 
 * 该模块负责初始化理财经理工作台界面的商机预测功能
 * 集成了销售线索概览、销售线索分布、预测迁移矩阵和客户名单等功能
 */

// 全局变量
let mainContent = null;
let selectedRM = null;
let rmCustData = null;

// 辅助函数：格式化数字
function formatNumber(value) {
    return Number(value).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// 辅助函数：格式化货币
function formatCurrency(value) {
    return Number(value).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// 辅助函数：格式化百分比
function formatPercent(value) {
    return Number(value).toFixed(2) + '%';
}

function isExecuted(customer) {
    // 检查所有可能的变体
    return Number(customer.if_exe) === 1 || 
           customer.if_exe === '1' || 
           customer.if_exe === true ||
           Number(customer.if_exe) === 1 || 
           customer.if_exe === '1' || 
           customer.if_exe === true;
}

// 主函数：加载商机预测模块
export function loadFModule(selectedRmData, rmCustDataInput) {
    // 保存引用
    selectedRM = selectedRmData;
    rmCustData = rmCustDataInput;
    
    // 先保存主内容区引用
    mainContent = document.getElementById('mainContent');
    if (!mainContent) {
        console.error('Error: mainContent element not found');
        return;
    }
    
    // 清空主内容区
    mainContent.innerHTML = `
        <div class="section-title animate-fade">
            <i class="fas fa-lightbulb"></i> 商机预测
        </div>
    `;
    
    // 添加CSS样式
    addStyles();
    
    // 构建界面结构
    try {
        console.log("开始初始化商机预测模块...");
        
        // 初始化各模块
        initSalesLeadsOverview();
        console.log("销售线索概览初始化完成");
        
        
        
        initPredictionMatrix();
        console.log("预测迁移矩阵初始化完成");

        // 新增: 初始化桑基图
        initSankeyChart();
        console.log("客户预测变化桑基图初始化完成");

        initSalesLeadsDistribution();
        console.log("销售线索分布初始化完成");
        
        initCustomerList();
        console.log("客户名单初始化完成");
        
        console.log('商机预测模块初始化成功');
    } catch (error) {
        console.error('Failed to initialize business opportunity prediction module:', error);
        mainContent.innerHTML += `
            <div class="error-message">
                <strong>加载商机预测模块失败</strong><br>
                错误信息: ${error.message}<br>
                请检查控制台获取更多详情。
            </div>
        `;
    }
}

// F1. 销售线索概览
function initSalesLeadsOverview() {
    if (!selectedRM || !rmCustData || !mainContent) return;
    
    // 获取当前理财经理的客户数据
    const rmCustomers = rmCustData.filter(cust => cust.RM_ID === selectedRM.RM_ID);
    
    // 打印样本数据以便调试
    console.log("样本客户数据：", rmCustomers.slice(0, 3));
    console.log("if_exe 示例：", rmCustomers.map(c => c.if_exe).slice(0, 10));
    
    // 1. 总销售线索
    const totalSalesLeads = rmCustomers.filter(cust => cust.Next_Status == 1 || cust.Next_Status == 2).length;
    console.log("总销售线索数量:", totalSalesLeads);

    // 2. 执行率 - 计算已执行线索数量
    let executedLeads = 0;
    rmCustomers.forEach(cust => {
        // 只考虑 Next_Status 为 1 或 2 的客户
        if (cust.Next_Status == 1 || cust.Next_Status == 2) {
            // 如果 if_exe 是数值或可以转换为数值，直接加总
            if (typeof cust.if_exe === 'number') {
                executedLeads += cust.if_exe;
            } else {
                // 尝试转换为数值再加总
                const numValue = Number(cust.if_exe);
                if (!isNaN(numValue)) {
                    executedLeads += numValue;
                }
            }
        }
    });
    console.log("已执行线索数量:", executedLeads);

    const executionRate = totalSalesLeads > 0 ? (executedLeads / totalSalesLeads * 100) : 0;
    console.log("执行率:", executionRate, "%");
    
    // 3. 预测规模变化
    let predictedAumChange = 0;
    rmCustomers.forEach(cust => {
        const predAum = Number(cust.Pred_AUM || 0);
        const currentAum = Number(cust.CUST_AVG_AUM || 0);
        predictedAumChange += (predAum - currentAum);
    });
    // 转换为万元
    predictedAumChange = predictedAumChange / 10000;
    
    // 4. 预测收入变化
    let predictedRevChange = 0;
    rmCustomers.forEach(cust => {
        // 计算当前平均收入 (cust_tot_rev_1 到 cust_tot_rev_6 的平均值)
        const currentRevArray = [
            Number(cust.cust_tot_rev_1 || 0),
            Number(cust.cust_tot_rev_2 || 0),
            Number(cust.cust_tot_rev_3 || 0),
            Number(cust.cust_tot_rev_4 || 0),
            Number(cust.cust_tot_rev_5 || 0),
            Number(cust.cust_tot_rev_6 || 0)
        ];
        
        const validRevValues = currentRevArray.filter(val => !isNaN(val));
        const avgCurrentRev = validRevValues.length > 0 ? 
            validRevValues.reduce((sum, val) => sum + val, 0) / validRevValues.length : 0;
        
        const predRev = Number(cust.Pred_Rev || 0);
        predictedRevChange += (predRev - avgCurrentRev);
    });
    // 转换为万元
    predictedRevChange = predictedRevChange / 10000;
    
    // 创建展示区域
    const overviewSection = document.createElement('section');
    overviewSection.className = 'sales-leads-overview-section';
    overviewSection.innerHTML = `
        <h3 class="section-heading"><i class="fas fa-bullseye"></i> 销售线索概览</h3>
        <div class="metrics-container">
            <div class="metric-card">
                <div class="metric-icon">
                    <i class="fas fa-funnel-dollar"></i>
                </div>
                <div class="metric-details">
                    <h4>总销售线索</h4>
                    <div class="metric-value-container">
                        <div class="metric-value" id="totalLeadsValue">${totalSalesLeads}</div>
                        <div class="metric-unit">条</div>
                    </div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-icon">
                    <i class="fas fa-tasks"></i>
                </div>
                <div class="metric-details">
                    <h4>执行率</h4>
                    <div class="metric-value-container">
                        <div class="metric-value" id="executionRateValue">${formatPercent(executionRate)}</div>
                        <div class="metric-unit"></div>
                    </div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="metric-details">
                    <h4>预测规模变化</h4>
                    <div class="metric-value-container">
                        <div class="metric-value ${predictedAumChange >= 0 ? 'positive' : 'negative'}" id="predictedAumChangeValue">${predictedAumChange >= 0 ? '+' : ''}${formatCurrency(predictedAumChange)}</div>
                        <div class="metric-unit">万元</div>
                    </div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-icon">
                    <i class="fas fa-hand-holding-usd"></i>
                </div>
                <div class="metric-details">
                    <h4>预测收入变化</h4>
                    <div class="metric-value-container">
                        <div class="metric-value ${predictedRevChange >= 0 ? 'positive' : 'negative'}" id="predictedRevChangeValue">${predictedRevChange >= 0 ? '+' : ''}${formatCurrency(predictedRevChange)}</div>
                        <div class="metric-unit">万元</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 添加到主内容区域
    mainContent.appendChild(overviewSection);
}

// F2. 销售线索分布
function initSalesLeadsDistribution() {
    if (!selectedRM || !rmCustData || !mainContent) return;
    
    // 获取当前理财经理的客户数据
    const rmCustomers = rmCustData.filter(cust => cust.RM_ID === selectedRM.RM_ID);
    
    // 创建图表容器
    const distributionSection = document.createElement('section');
    distributionSection.className = 'sales-leads-distribution-section';
    distributionSection.innerHTML = `
        <h3 class="section-heading"><i class="fas fa-chart-bar"></i> 销售线索分布</h3>
        <div class="analysis-container">
            <div class="analysis-card full-width">
                <h4 class="card-title"><i class="fas fa-chart-bar"></i> 销售线索分布情况</h4>
                <div class="card-content" style="height: 400px;">
                    <div id="salesLeadsDistributionChart" style="width: 100%; height: 100%;"></div>
                </div>
            </div>
        </div>
    `;
    
    // 添加到主内容区域
    mainContent.appendChild(distributionSection);
    
    // 在DOM加载完成后初始化图表
    setTimeout(() => {
        try {
            // 初始化销售线索分布图表
            createSalesLeadsDistributionChart(rmCustomers);
        } catch (error) {
            console.error('Error initializing sales leads distribution chart:', error);
        }
    }, 500);
}

// 创建销售线索分布图表
// 修改 createSalesLeadsDistributionChart 函数
function createSalesLeadsDistributionChart(customers) {
    const chartContainer = document.getElementById('salesLeadsDistributionChart');
    if (!chartContainer) return;
    
    console.log("销售线索分布样本数据：", customers.slice(0, 3));
    console.log("if_exe 示例：", customers.map(c => c.if_exe).slice(0, 10));
    
    // 销售线索类型映射
    const salesLeadsMap = {
        0: "无",
        1: "存款产品",
        2: "理财产品",
        3: "基金",
        4: "保险",
        5: "贵金属",
        6: "信用卡",
        7: "贷款",
        8: "其他"
    };
    
    // 按线索类型分组统计
    const salesLeadsData = {};
    
    // 初始化所有可能的线索类型
    Object.keys(salesLeadsMap).forEach(key => {
        salesLeadsData[key] = { executed: 0, notExecuted: 0, total: 0 };
    });
    
    // 调试信息，查看if_exe的值分布
    const ifExeValues = {};
    customers.forEach(cust => {
        const val = cust.if_exe;
        if (val !== undefined && val !== null) {
            if (!ifExeValues[val]) ifExeValues[val] = 0;
            ifExeValues[val]++;
        }
    });
    console.log("if_exe值分布:", ifExeValues);
    
    // 统计数据 - 修正执行线索的逻辑
    customers.forEach(cust => {
        const salesLeadsType = cust.sales_leads;
        if (salesLeadsType !== null && salesLeadsType !== undefined) {
            // 确保该类型在统计对象中存在
            if (!salesLeadsData[salesLeadsType]) {
                salesLeadsData[salesLeadsType] = { executed: 0, notExecuted: 0, total: 0 };
            }
            
            // 增加总数
            salesLeadsData[salesLeadsType].total++;
            
            // 明确判断if_exe是否为1（可能是数字1、字符串"1"或布尔true）
            // 修正这里的逻辑，确保正确识别已执行的线索
            const ifExeValue = cust.if_exe;
            const isExecuted = 
                ifExeValue === 1 || 
                ifExeValue === "1" || 
                ifExeValue === true;
            
            if (isExecuted) {
                salesLeadsData[salesLeadsType].executed++;
            } else {
                salesLeadsData[salesLeadsType].notExecuted++;
            }
        }
    });
    
    // 准备图表数据
    const categories = [];
    const executedData = [];
    const notExecutedData = [];
    
    Object.keys(salesLeadsData).forEach(type => {
        // 只显示有效的销售线索类型（有数据且不是"无"）
        if (type != 0 && salesLeadsData[type].total > 0) {
            categories.push(salesLeadsMap[type] || `${type}`);
            executedData.push(salesLeadsData[type].executed);
            notExecutedData.push(salesLeadsData[type].notExecuted);
            
            // 打印各类型的执行率
            const typeExecutionRate = salesLeadsData[type].total > 0 ? 
                (salesLeadsData[type].executed / salesLeadsData[type].total * 100).toFixed(2) : 0;
            console.log(`线索类型 ${type} (${salesLeadsMap[type] || '未知'}): 执行率 ${typeExecutionRate}%, 总数: ${salesLeadsData[type].total}, 已执行: ${salesLeadsData[type].executed}, 未执行: ${salesLeadsData[type].notExecuted}`);
        }
    });
    
    // 初始化图表
    const chart = echarts.init(chartContainer);
    
    // 保持水平方向的柱状图（不交换x轴和y轴）
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params) {
                const index = params[0].dataIndex;
                const category = categories[index];
                const type = Object.keys(salesLeadsMap).find(key => salesLeadsMap[key] === category) || '未知';
                const executed = params[0].data || 0;
                const notExecuted = params[1].data || 0;
                const total = executed + notExecuted;
                const executionRate = total > 0 ? (executed / total * 100).toFixed(2) : 0;
                
                return `${category}<br/>
                        <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:#4CAF50;"></span> 已执行: ${executed} (${executionRate}%)<br/>
                        <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:#F44336;"></span> 未执行: ${notExecuted}<br/>
                        <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:#a0a0a0;"></span> 总计: ${total}`;
            }
        },
        legend: {
            data: ['已执行', '未执行'],
            textStyle: {
                color: '#e0e0e0'
            },
            top: 10
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '8%',
            containLabel: true
        },
        // 保持水平方向，y轴是分类，x轴是数值
        yAxis: {
            type: 'category',
            data: categories,
            axisLabel: {
                color: '#e0e0e0'
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
        xAxis: {
            type: 'value',
            axisLabel: {
                color: '#e0e0e0'
            },
            axisLine: {
                lineStyle: {
                    color: '#e0e0e0'
                }
            },
            splitLine: {
                show: false
            }
        },
        series: [
            {
                name: '已执行',
                type: 'bar',
                stack: 'total',
                emphasis: {
                    focus: 'series'
                },
                itemStyle: {
                    // 将渐变色改为纯色
                    color: '#4CAF50',  // 纯绿色
                    borderRadius: [0, 6, 6, 0]
                },
                data: executedData
            },
            {
                name: '未执行',
                type: 'bar',
                stack: 'total',
                emphasis: {
                    focus: 'series'
                },
                itemStyle: {
                    // 将渐变色改为纯色
                    color: '#3fa2e9',  // 纯红色
                    borderRadius: [0, 6, 6, 0]
                },
                data: notExecutedData
            }
        ],
        animationDuration: 1000,
        animationEasing: 'elasticOut'
    };
    
    chart.setOption(option);
    
    // 响应式调整
    window.addEventListener('resize', () => {
        chart.resize();
    });
}

// 在 moduleF.js 中添加以下函数，参考 moduleD.js 中的 createAumTransferMatrixControl 函数
function createMatrixViewControl(container) {
    // 创建一个独立的控制容器，使用绝对定位确保它可见
    const controlDiv = document.createElement('div');
    controlDiv.id = 'matrixViewControl';
    controlDiv.style.position = 'absolute'; // 使用绝对定位
    controlDiv.style.top = '50px';          // 从图表顶部留出空间
    controlDiv.style.left = '20px';         // 从左侧留出空间
    controlDiv.style.zIndex = '10';         // 确保在图表上层
    controlDiv.style.textAlign = 'left';
    
    
    container.appendChild(controlDiv);
    
    // 创建模式选择器HTML
    controlDiv.innerHTML = `
    <div class="matrix-mode-selector">
      <button class="matrix-mode-btn active" data-mode="customerCount">客户数</button>
      <button class="matrix-mode-btn" data-mode="amount">金额</button>
    </div>
    `;
    
    // 添加样式
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      #matrixViewControl .matrix-mode-selector {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 15px;
      }
      
      #matrixViewControl .matrix-mode-btn {
        padding: 6px 15px;
        margin: 0 5px;
        background-color: #091e2c;
        color: #e0e0e0;
        border: 1px solid #3fa2e9;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s;
      }
      
      #matrixViewControl .matrix-mode-btn.active {
        background-color: #3fa2e9;
        color: white;
        font-weight: bold;
      }
    `;
    document.head.appendChild(styleElement);
    
    // 事件绑定逻辑保持不变
    const buttons = controlDiv.querySelectorAll('.matrix-mode-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', function() {
        // 更新按钮状态
        buttons.forEach(b => {
          b.classList.remove('active');
        });
        this.classList.add('active');
        
        // 更新图表
        const selectedMode = this.getAttribute('data-mode');
        // 重新绘制图表
        if (predictionMatrixChart) {
          drawBubbleChart(selectedMode);
        }
      });
    });
    
    return {
      buttons,
      getActiveMode: () => {
        const activeBtn = controlDiv.querySelector('.matrix-mode-btn.active');
        return activeBtn ? activeBtn.getAttribute('data-mode') : 'customerCount';
      }
    };
}

// F3. 预测迁移矩阵
function initPredictionMatrix() {
    if (!selectedRM || !rmCustData || !mainContent) return;
    
    // 创建图表容器
    const matrixSection = document.createElement('section');
    matrixSection.className = 'prediction-matrix-section';
    matrixSection.innerHTML = `
      <h3 class="section-heading"><i class="fas fa-project-diagram"></i> 预测迁移矩阵</h3>
    <div class="analysis-container">
        <div class="analysis-card full-width">
            <h4 class="card-title"><i class="fas fa-project-diagram"></i> 客户AUM层级迁移预测</h4>
            <div class="card-content" style="height: 550px;">
                <!-- 这里将所有图表放在同一行 -->
                <div style="display: flex; gap: 20px; height: 100%;">
                    <div id="predictionMatrixChart" style="width: 40%; height: 100%;"></div>
                    <div id="scaleGrowthChart" style="width: 30%; height: 100%;"></div>
                    <div id="revenueGrowthChart" style="width: 30%; height: 100%;"></div>
                </div>
            </div>
        </div>
    </div>
`;
    
    // 添加到主内容区域
    mainContent.appendChild(matrixSection);
    
    // 在DOM加载完成后初始化图表
    setTimeout(() => {
        try {
            // 创建视图切换控制器
            createMatrixViewControl(document.getElementById('predictionMatrixChart'));
            
            // 初始化预测迁移矩阵图表
            initPredictionMatrixChart(rmCustData);
            
            // 添加这两行：初始化两个新图表
            initScaleGrowthChart(rmCustData.filter(cust => cust.RM_ID === selectedRM.RM_ID));
            initRevenueGrowthChart(rmCustData.filter(cust => cust.RM_ID === selectedRM.RM_ID));
        } catch (error) {
            console.error('Error initializing prediction matrix chart:', error);
        }
    }, 500);
} 
// 全局变量，用于存储预测矩阵图表及其数据
let predictionMatrixChart = null;
let predictionMatrixData = {
    customerCount: [],
    amount: []
};

// 添加数据转换函数，将客户数据转换为气泡图所需格式
function convertToMatrixBubbleData(customers, tierOrder, mode) {
    const bubbleData = [];
    
    // 初始化客户数矩阵和金额矩阵
    const customerCountMatrix = [];
    const amountMatrix = [];
    
    // 计算总变化金额（绝对值）
    let totalChangeAmount = 0;
    customers.forEach(cust => {
      const initialAum = Number(cust.CUST_AVG_AUM || 0);
      const predAum = Number(cust.Pred_AUM || 0);
      totalChangeAmount += Math.abs(predAum - initialAum);
    });
    
    // 每个层级的总客户数统计
    const totalCustomersByTier = {};
    tierOrder.forEach(tier => {
      totalCustomersByTier[tier] = customers.filter(cust => cust.AUM_AVG_GROUP === tier).length;
    });
    
    // 统计每个迁移单元格的客户数和金额变化
    for (let i = 0; i < tierOrder.length; i++) {
      const initialTier = tierOrder[i];
      
      for (let j = 0; j < tierOrder.length; j++) {
        const predTier = tierOrder[j];
        
        // 找到从initialTier迁移到predTier的客户
        const migratingCustomers = customers.filter(cust => 
          cust.AUM_AVG_GROUP === initialTier && 
          cust.Pred_AUM_Group === predTier
        );
        
        // 计算客户数占比
        const customerCount = migratingCustomers.length;
        const customerCountPercentage = totalCustomersByTier[initialTier] > 0 ? 
          (customerCount / totalCustomersByTier[initialTier] * 100) : 0;
        
        // 计算金额变化占比
        let amountChange = 0;
        migratingCustomers.forEach(cust => {
          const initialAum = Number(cust.CUST_AVG_AUM || 0);
          const predAum = Number(cust.Pred_AUM || 0);
          amountChange += (predAum - initialAum);
        });
        
        const amountChangePercentage = totalChangeAmount > 0 ? 
          (amountChange / totalChangeAmount * 100) : 0;
        
        // 添加到矩阵数据
        customerCountMatrix.push([j, i, customerCountPercentage]);
        amountMatrix.push([j, i, amountChangePercentage]);
        
        // 保存数据，便于切换视图
        predictionMatrixData.customerCount = customerCountMatrix;
        predictionMatrixData.amount = amountMatrix;
        
        // 根据模式选择数据
        const value = mode === 'customerCount' ? customerCountPercentage : amountChangePercentage;
        const dataForSize = mode === 'customerCount' ? customerCount : Math.abs(amountChange);
        
        if (value > 0) {
          // 计算气泡大小 - 使用平方根缩放来增强差异性
          const symbolSize = Math.max(10, Math.min(70, Math.sqrt(value) * 10));
          
          // 根据层级变化决定颜色
          let color;
          if (j > i) { // 层级上升
            color = '#3fa2e9'; // 蓝色
          } else if (j < i) { // 层级下降
            color = '#FF7043'; // 橙色
          } else { // 层级不变
            color = '#a0a0a0'; // 灰色
          }
          
          bubbleData.push([
            j, i, // 坐标 (x,y)
            value.toFixed(1), // 格式化的百分比值
            initialTier, // 期初层级
            predTier, // 期末层级
            dataForSize, // 原始数据（客户数或金额）
            symbolSize, // 气泡大小
            color // 颜色
          ]);
        }
      }
    }
    
    return bubbleData;
  }


// 初始化预测迁移矩阵图表
// 将 initPredictionMatrixChart 函数重构为气泡图形式的实现
function initPredictionMatrixChart(allCustData) {
    const chartContainer = document.getElementById('predictionMatrixChart');
    if (!chartContainer) return;
    
    // 获取当前理财经理的客户数据
    const rmCustomers = allCustData.filter(cust => cust.RM_ID === selectedRM.RM_ID);
    
    // 定义AUM层级顺序（从低到高）
    const tierOrder = [
      "0-50K", 
      "50-300K", 
      "300K-1Mn", 
      "1-6Mn", 
      "6-30Mn", 
      "30mn+"
    ];
    
    // 创建全局变量存储预测矩阵数据
    predictionMatrixData = {
      customerCount: [],
      amount: []
    };
    
    // 当前模式
    let currentMode = 'customerCount';
    
    // 绘制气泡图的函数，将其定义为全局函数，以便控制器可以调用
    window.drawBubbleChart = function(mode) {
      // 更新当前模式
      currentMode = mode;
      
      // 清除并重建图表实例
      echarts.dispose(chartContainer);
      predictionMatrixChart = echarts.init(chartContainer);
      
      // 准备数据
      const bubbleData = convertToMatrixBubbleData(rmCustomers, tierOrder, mode);
      
      // 创建气泡系列
      const series = [];
      
      // 为每个气泡创建单独的系列
      bubbleData.forEach(item => {
        const [x, y, value, initialTier, predTier, count, symbolSize, color] = item;
        
        series.push({
          type: 'scatter',
          symbol: 'circle',
          symbolSize: symbolSize, // 使用计算的气泡大小
          itemStyle: {
            color: color // 使用计算的颜色
          },
          label: {
            show: true,
            position: 'inside',
            formatter: value + '%', // 显示百分比值
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
          data: [[x, y]] // 坐标
        });
      });
      
      // 设置图表选项
      const option = {
        backgroundColor: 'transparent',
        title: {
          text: `客户AUM层级迁移预测 - ${mode === 'customerCount' ? '客户数占比' : '金额占比'}`,
          left: 'center',
          top: 0,
          textStyle: { color: '#e0e0e0', fontSize: 16 }
        },
        tooltip: {
          trigger: 'item',
          formatter: function(params) {
            const initialTier = params.data[4];
            const predTier = params.data[5];
            const count = params.data[6];
            
            if (mode === 'customerCount') {
              return `从 ${initialTier} 到 ${predTier}<br/>
                      占比: ${params.data[2]}%<br/>
                      客户数: ${count}人`;
            } else {
              return `从 ${initialTier} 到 ${predTier}<br/>
                      占比: ${params.data[2]}%<br/>
                      金额变化: ${formatCurrency(count)}`;
            }
          }
        },
        legend: {
          data: [
            {name: '层级提升', icon: 'circle', itemStyle: {color: '#3fa2e9'}},
            {name: '层级下降', icon: 'circle', itemStyle: {color: '#FF7043'}}
          ],
          bottom: 10,
          textStyle: {color: '#e0e0e0'}
        },
        grid: {
          left: '10%',
          right: '5%',
          bottom: '15%',
          top: '100px',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: tierOrder,
          name: '预测AUM层级',
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
          data: tierOrder,
          name: '当前AUM层级',
          nameLocation: 'middle',
          nameGap: 70,
          axisLabel: { color: '#e0e0e0' },
          axisLine: { lineStyle: { color: '#e0e0e0' } },
          splitLine: { show: false }
        },
        series: series,
        animationDuration: 1500
      };
      
      predictionMatrixChart.setOption(option);
      
      // 响应式调整
      window.addEventListener('resize', () => {
        predictionMatrixChart.resize();
      });
    }
    
    // 初始绘制
    drawBubbleChart(currentMode);
  }
// 更新预测迁移矩阵图表
function updatePredictionMatrixChart(viewType) {
  const chartContainer = document.getElementById('predictionMatrixChart');
  if (!chartContainer || !predictionMatrixChart) return;
  
  // 查找活动按钮并模拟点击
  document.querySelectorAll('#matrixViewControl .mode-btn').forEach(btn => {
    if (btn.getAttribute('data-mode') === viewType) {
      btn.click();
    }
  });
}


// 预测规模增长率图表
function initScaleGrowthChart(customers) {
    const chartContainer = document.getElementById('scaleGrowthChart');
    if (!chartContainer) return;
    
    console.log("初始化预测规模增长率图表...");
    
    // 定义AUM层级顺序（从高到低）
    const tierOrder = [
        "30mn+", 
        "6-30Mn", 
        "1-6Mn", 
        "300K-1Mn", 
        "50-300K", 
        "0-50K"
    ];
    
    // 按层级计算预测增长率
    const growthData = {};
    const customerCountsByTier = {};
    
    // 初始化数据结构
    tierOrder.forEach(tier => {
        growthData[tier] = 0;
        customerCountsByTier[tier] = 0;
    });
    
    // 计算每个层级的规模增长率
    customers.forEach(cust => {
        const tier = cust.AUM_AVG_GROUP;
        if (tier && tierOrder.includes(tier)) {
            const currentAum = Number(cust.CUST_AVG_AUM || 0);
            const predictedAum = Number(cust.Pred_AUM || 0);
            
            if (currentAum > 0) { // 避免除以零
                growthData[tier] += (predictedAum - currentAum) / currentAum;
                customerCountsByTier[tier]++;
            }
        }
    });
    
    // 计算平均增长率
    tierOrder.forEach(tier => {
        if (customerCountsByTier[tier] > 0) {
            growthData[tier] = (growthData[tier] / customerCountsByTier[tier]) * 100; // 转为百分比
        }
    });
    
    // 提取数据用于图表
    const chartData = tierOrder.map(tier => ({
        tier: tier,
        value: growthData[tier]
    }));
    
    // 初始化图表
    const chart = echarts.init(chartContainer);
    
    const option = {
        title: {
            text: '预测规模增长率',
            left: 'center',
            top: 0,
            textStyle: { color: '#e0e0e0', fontSize: 14 }
        },
        tooltip: {
            trigger: 'axis',
            formatter: function(params) {
                return `${params[0].name}层级<br/>
                        预测规模增长率: ${formatPercent(params[0].value)}`;
            },
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '15%',
            right: '15%',
            bottom: '15%',
            top: '60px',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            name: '增长率（%）',
            nameLocation: 'middle',
            nameGap: 30,
            axisLabel: { 
                color: '#e0e0e0',
                formatter: function(value) {
                    return value + '%';
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
                type: 'bar',
                data: tierOrder.map(tier => growthData[tier]),
                barWidth: '60%',
                itemStyle: { 
                    color: function(params) {
                        // 正值为蓝色，负值为红色
                        return params.value >= 0 ? '#3fa2e9' : '#FF7043';
                    }
                },
                label: {
                    show: true,
                    formatter: function(params) {
                        return formatPercent(params.value);
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

// 预测收入增长率图表
function initRevenueGrowthChart(customers) {
    const chartContainer = document.getElementById('revenueGrowthChart');
    if (!chartContainer) return;
    
    console.log("初始化预测收入增长率图表...");
    
    // 定义AUM层级顺序（从高到低）
    const tierOrder = [
        "30mn+", 
        "6-30Mn", 
        "1-6Mn", 
        "300K-1Mn", 
        "50-300K", 
        "0-50K"
    ];
    
    // 按层级计算预测收入增长率
    const growthData = {};
    const customerCountsByTier = {};
    
    // 初始化数据结构
    tierOrder.forEach(tier => {
        growthData[tier] = 0;
        customerCountsByTier[tier] = 0;
    });
    
    // 计算每个层级的收入增长率
    customers.forEach(cust => {
        const tier = cust.AUM_AVG_GROUP;
        if (tier && tierOrder.includes(tier)) {
            // 计算当前平均收入
            const currentRevArray = [
                Number(cust.cust_tot_rev_1 || 0),
                Number(cust.cust_tot_rev_2 || 0),
                Number(cust.cust_tot_rev_3 || 0),
                Number(cust.cust_tot_rev_4 || 0),
                Number(cust.cust_tot_rev_5 || 0),
                Number(cust.cust_tot_rev_6 || 0)
            ];
            
            const validRevValues = currentRevArray.filter(val => !isNaN(val));
            const currentRev = validRevValues.length > 0 ? 
                validRevValues.reduce((sum, val) => sum + val, 0) / validRevValues.length : 0;
            
            const predictedRev = Number(cust.Pred_Rev || 0);
            
            if (currentRev > 0) { // 避免除以零
                growthData[tier] += (predictedRev - currentRev) / currentRev;
                customerCountsByTier[tier]++;
            }
        }
    });
    
    // 计算平均增长率
    tierOrder.forEach(tier => {
        if (customerCountsByTier[tier] > 0) {
            growthData[tier] = (growthData[tier] / customerCountsByTier[tier]) * 100; // 转为百分比
        }
    });
    
    // 提取数据用于图表
    const chartData = tierOrder.map(tier => ({
        tier: tier,
        value: growthData[tier]
    }));
    
    // 初始化图表
    const chart = echarts.init(chartContainer);
    
    const option = {
        title: {
            text: '预测收入增长率',
            left: 'center',
            top: 0,
            textStyle: { color: '#e0e0e0', fontSize: 14 }
        },
        tooltip: {
            trigger: 'axis',
            formatter: function(params) {
                return `${params[0].name}层级<br/>
                        预测收入增长率: ${formatPercent(params[0].value)}`;
            },
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '15%',
            right: '15%',
            bottom: '15%',
            top: '60px',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            name: '增长率（%）',
            nameLocation: 'middle',
            nameGap: 30,
            axisLabel: { 
                color: '#e0e0e0',
                formatter: function(value) {
                    return value + '%';
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
                type: 'bar',
                data: tierOrder.map(tier => growthData[tier]),
                barWidth: '60%',
                itemStyle: { 
                    color: function(params) {
                        // 正值为蓝色，负值为红色
                        return params.value >= 0 ? '#3fa2e9' : '#FF7043';
                    }
                },
                label: {
                    show: true,
                    formatter: function(params) {
                        return formatPercent(params.value);
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

// F3.6 客户预测变化桑基图
function initSankeyChart() {
    if (!selectedRM || !rmCustData || !mainContent) return;
    
    // 创建图表容器
    const sankeySection = document.createElement('section');
    sankeySection.className = 'sankey-chart-section';
    sankeySection.innerHTML = `
        <h3 class="section-heading"><i class="fas fa-random"></i> 客户变化预测</h3>
        <div class="analysis-container">
            <div class="analysis-card half-width">
                <h4 class="card-title"><i class="fas fa-random"></i> 客户AUM层级迁移流向图</h4>
                <div class="card-content" style="height: 450px;">
                    <div id="sankeyChartContainer" style="width: 100%; height: 100%; position: relative;">
                        <div id="sankeyChart" style="width: 100%; height: 100%;"></div>
                    </div>
                </div>
            </div>
            <div class="analysis-card half-width">
                <h4 class="card-title"><i class="fas fa-chart-bubble"></i> 客户资产变化四象限分析</h4>
                <div class="card-content" style="height: 450px;">
                    <div id="quadrantChart" style="width: 100%; height: 100%;"></div>
                </div>
            </div>
        </div>
    `;
    
    // 添加到主内容区域
    mainContent.appendChild(sankeySection);
    
    // 在DOM加载完成后初始化图表
    setTimeout(() => {
        try {
            // 创建视图切换控制器 - 使用moduleD.js的风格
            createSankeyViewControl(document.getElementById('sankeyChartContainer'));
            
            // 初始化桑基图
            createSankeyChart('customerCount');
            
            // 初始化四象限图表
            renderQuadrantChart(rmCustData.filter(cust => cust.RM_ID === selectedRM.RM_ID));
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }, 500);
}

// 设置桑基图的视图切换控件 - 仿照moduleD.js风格
function createSankeyViewControl(container) {
    // 创建一个独立的控制容器
    const controlDiv = document.createElement('div');
    controlDiv.id = 'sankeyViewControl';
    controlDiv.style.textAlign = 'center';
    controlDiv.style.marginBottom = '15px';
    controlDiv.style.marginTop = '10px';
    controlDiv.style.zIndex = '100';
    controlDiv.style.position = 'relative';
    
    // 将控制容器插入到图表容器之前
    container.parentNode.insertBefore(controlDiv, container);
    
    // 创建模式选择器HTML
    controlDiv.innerHTML = `
    <div class="mode-selector">
      <button class="mode-btn active" data-mode="customerCount">客户数</button>
      <button class="mode-btn" data-mode="revenue">收入</button>
      <button class="mode-btn" data-mode="aum">AUM</button>
    </div>
    `;
    
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
      
      #sankeyViewControl .mode-btn:hover:not(.active) {
        background-color: rgba(63, 162, 233, 0.2);
      }
    `;
    document.head.appendChild(styleElement);
    
    // 绑定事件
    const buttons = controlDiv.querySelectorAll('.mode-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', function() {
        // 更新按钮状态
        buttons.forEach(b => {
          b.classList.remove('active');
        });
        this.classList.add('active');
        
        // 更新图表
        const selectedMode = this.getAttribute('data-mode');
        createSankeyChart(selectedMode);
      });
    });
}

// 设置桑基图视图切换
function setupSankeyViewSwitcher() {
    const buttons = document.querySelectorAll('#sankeyViewControl .mode-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', function() {
        // 更新按钮状态
        buttons.forEach(b => {
          b.classList.remove('active');
        });
        this.classList.add('active');
        
        // 更新图表
        const selectedMode = this.getAttribute('data-mode');
        createSankeyChart(selectedMode);
      });
    });
}

// 设置桑基图的视图切换控件
function setupSankeyViewControl(container) {
    // 创建一个独立的控制容器
    const controlDiv = document.createElement('div');
    controlDiv.id = 'sankeyViewControl';
    controlDiv.style.textAlign = 'center';
    controlDiv.style.marginBottom = '15px';
    controlDiv.style.marginTop = '10px';
    controlDiv.style.zIndex = '100';
    controlDiv.style.position = 'relative';
    
    // 将控制容器放在图表容器的上方
    container.parentNode.insertBefore(controlDiv, container);
    
    // 创建模式选择器HTML
    controlDiv.innerHTML = `
    <div class="mode-selector">
      <button class="mode-btn active" data-mode="customerCount">客户数</button>
      <button class="mode-btn" data-mode="revenue">收入</button>
      <button class="mode-btn" data-mode="aum">AUM</button>
    </div>
    `;
    
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
      
      #sankeyViewControl .mode-btn:hover:not(.active) {
        background-color: rgba(63, 162, 233, 0.2);
      }
    `;
    document.head.appendChild(styleElement);
    
    // 绑定事件
    const buttons = controlDiv.querySelectorAll('.mode-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', function() {
        // 更新按钮状态
        buttons.forEach(b => {
          b.classList.remove('active');
        });
        this.classList.add('active');
        
        // 更新图表
        const selectedMode = this.getAttribute('data-mode');
        createSankeyChart(selectedMode);
      });
    });
    
    return {
      buttons,
      getActiveMode: () => {
        const activeBtn = controlDiv.querySelector('.mode-btn.active');
        return activeBtn ? activeBtn.getAttribute('data-mode') : 'customerCount';
      }
    };
}

// 创建桑基图
function createSankeyChart(mode) {
    const chartContainer = document.getElementById('sankeyChart');
    if (!chartContainer) return;
    
    // 获取当前理财经理的客户数据
    const rmCustomers = rmCustData.filter(cust => cust.RM_ID === selectedRM.RM_ID);
    
    // 定义AUM层级顺序（从高到低）
    const tierOrder = [
      "30mn+", 
      "6-30Mn", 
      "1-6Mn", 
      "300K-1Mn", 
      "50-300K", 
      "0-50K"
    ];
    
    // 定义每个层级的颜色（使用与moduleD.js相同的颜色）
    const tierColors = {
      "30mn+": '#1a73e8',
      "6-30Mn": '#4B9CD3',
      "1-6Mn": '#13294B',
      "300K-1Mn": '#8FD6E1',
      "50-300K": '#0D47A1',
      "0-50K": '#3fa2e9'
    };
    
    // 创建节点数据
    const nodes = [];
    
    // 先添加所有的初始层级节点
    tierOrder.forEach((tier) => {
        nodes.push({ 
            name: `初始 ${tier}`,
            itemStyle: {
                color: tierColors[tier]
            }
        });
    });
    
    // 再添加所有的预测层级节点
    tierOrder.forEach((tier) => {
        nodes.push({ 
            name: `预测 ${tier}`,
            itemStyle: {
                color: tierColors[tier]
            }
        });
    });
    
    // 创建链接数据
    const links = [];
    
    // 创建映射以追踪从一个层级到另一个层级的数据
    const flowMap = {};
    
    // 初始化流量映射
    tierOrder.forEach(sourceTier => {
        flowMap[sourceTier] = {};
        tierOrder.forEach(targetTier => {
            flowMap[sourceTier][targetTier] = {
                customerCount: 0,
                aumChange: 0,
                revenueChange: 0
            };
        });
    });
    
    // 计算流量
    rmCustomers.forEach(customer => {
        const initialTier = customer.AUM_AVG_GROUP;
        const predTier = customer.Pred_AUM_Group;
        
        // 跳过缺少必要数据的客户
        if (!initialTier || !predTier || !tierOrder.includes(initialTier) || !tierOrder.includes(predTier)) {
            return;
        }
        
        // 计算AUM变化
        const initialAum = Number(customer.CUST_AVG_AUM || 0);
        const predAum = Number(customer.Pred_AUM || 0);
        const aumChange = predAum - initialAum;
        
        // 计算收入变化
        // 使用多个收入字段的平均值作为当前收入
        const revenueFields = [
            'cust_tot_rev_1', 'cust_tot_rev_2', 'cust_tot_rev_3',
            'cust_tot_rev_4', 'cust_tot_rev_5', 'cust_tot_rev_6'
        ];
        
        let validRevenueCount = 0;
        let totalCurrentRevenue = 0;
        
        revenueFields.forEach(field => {
            if (customer[field] !== undefined && customer[field] !== null) {
                const value = Number(customer[field]);
                if (!isNaN(value)) {
                    totalCurrentRevenue += value;
                    validRevenueCount++;
                }
            }
        });
        
        const currentRevenue = validRevenueCount > 0 ? totalCurrentRevenue / validRevenueCount : 0;
        const predRevenue = Number(customer.Pred_Rev || 0);
        const revenueChange = 0.8 * predRevenue - currentRevenue;
        
        // 更新流量映射
        flowMap[initialTier][predTier].customerCount++;
        flowMap[initialTier][predTier].aumChange += aumChange;
        flowMap[initialTier][predTier].revenueChange += revenueChange;
    });
    
    // 创建链接数据
    tierOrder.forEach((sourceTier, sourceIndex) => {
        tierOrder.forEach((targetTier, targetIndex) => {
            // 根据模式选择值
            let value = 0;
            switch (mode) {
                case 'customerCount':
                    value = flowMap[sourceTier][targetTier].customerCount;
                    break;
                case 'aum':
                    value = Math.abs(flowMap[sourceTier][targetTier].aumChange);
                    break;
                case 'revenue':
                    value = Math.abs(flowMap[sourceTier][targetTier].revenueChange);
                    break;
            }
            
            // 只添加有流量的链接
            if (value > 0) {
                // 根据层级升降设置不同颜色
                let lineColor;
                if (tierOrder.indexOf(targetTier) < tierOrder.indexOf(sourceTier)) {
                    // 层级上升 - 使用蓝色
                    lineColor = '#3fa2e9';
                } else if (tierOrder.indexOf(targetTier) > tierOrder.indexOf(sourceTier)) {
                    // 层级下降 - 使用红色
                    lineColor = '#f5222d';
                } else {
                    // 层级不变 - 使用灰色
                    lineColor = '#999999';
                }
                
                links.push({
                    source: sourceIndex,
                    target: tierOrder.length + targetIndex,
                    value: value,
                    lineStyle: {
                        color: lineColor,
                        opacity: 0.7
                    },
                    // 保存原始数据用于提示框
                    customData: {
                        customerCount: flowMap[sourceTier][targetTier].customerCount,
                        aumChange: flowMap[sourceTier][targetTier].aumChange,
                        revenueChange: flowMap[sourceTier][targetTier].revenueChange,
                        sourceTier,
                        targetTier
                    }
                });
            }
        });
    });
    
    // 初始化图表
    const chart = echarts.init(chartContainer);
    
    // 根据模式设置图表标题
    let chartTitle = '';
    let valueFormatter = '';
    switch (mode) {
        case 'customerCount':
            chartTitle = '客户数量迁移流向';
            valueFormatter = '人';
            break;
        case 'aum':
            chartTitle = 'AUM变化迁移流向';
            valueFormatter = '万元';
            break;
        case 'revenue':
            chartTitle = '收入变化迁移流向';
            valueFormatter = '万元';
            break;
    }
    
    // 设置图表选项
    const option = {
        backgroundColor: 'transparent',
        title: {
            text: `客户AUM层级${chartTitle}`,
            left: 'center',
            top: 0,
            textStyle: { color: '#e0e0e0', fontSize: 16 }
        },
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                if (params.dataType === 'edge') {
                    const customData = params.data.customData;
                    const source = customData.sourceTier;
                    const target = customData.targetTier;
                    
                    // 确定迁移类型
                    let migrationType, color;
                    if (tierOrder.indexOf(target) < tierOrder.indexOf(source)) {
                        migrationType = '上升';
                        color = '#3fa2e9';
                    } else if (tierOrder.indexOf(target) > tierOrder.indexOf(source)) {
                        migrationType = '下降';
                        color = '#f5222d';
                    } else {
                        migrationType = '保持不变';
                        color = '#999999';
                    }
                    
                    // 根据不同模式展示不同的提示信息
                    let valueInfo = '';
                    switch (mode) {
                        case 'customerCount':
                            valueInfo = `${customData.customerCount} 人`;
                            break;
                        case 'aum':
                            valueInfo = `${formatCurrency(customData.aumChange / 10000)} 万元`;
                            break;
                        case 'revenue':
                            valueInfo = `${formatCurrency(customData.revenueChange / 10000)} 万元`;
                            break;
                    }
                    
                    // 包含所有三种指标的信息
                    return `${source} → ${target}<br/>
                           <span style="color:${color}">■</span> ${migrationType}<br/>
                           客户数量: ${customData.customerCount} 人<br/>
                           AUM变化: ${formatCurrency(customData.aumChange / 10000)} 万元<br/>
                           收入变化: ${formatCurrency(customData.revenueChange / 10000)} 万元`;
                }
                return params.name;
            }
        },
        series: [
            {
                type: 'sankey',
                layout: 'none',
                emphasis: {
                    focus: 'adjacency'
                },
                data: nodes,
                links: links,
                orient: 'horizontal',
                label: {
                    formatter: '{b}',
                    color: '#e0e0e0',
                    position: 'right',
                    fontSize: 11  // 减小字体大小
                },
                lineStyle: {
                    curveness: 0.5,
                    opacity: 0.7
                },
                itemStyle: {
                    borderWidth: 1,
                    borderColor: '#091e2c'
                },
                focusNodeAdjacency: true,
                // 调整布局参数
                layoutIterations: 64,
                nodeWidth: 15,
                nodeGap: 6,
                left: '5%',    
                right: '8%'
            }
        ],
        // 添加标题标注
        graphic: [
            {
                type: 'text',
                left: '5%',
                top: '40px',
                style: {
                    text: '初始层级',
                    textAlign: 'center',
                    fill: '#e0e0e0',
                    fontSize: 12,
                    fontWeight: 'bold'
                }
            },
            {
                type: 'text',
                right: '8%',
                top: '45px',
                style: {
                    text: '预测层级',
                    textAlign: 'center',
                    fill: '#e0e0e0',
                    fontSize: 12,
                    fontWeight: 'bold'
                }
            }
        ],
        animationDuration: 1000,
        animationEasing: 'elasticOut'
    };
    
    chart.setOption(option);
    
    // 响应式调整
    window.addEventListener('resize', () => {
        chart.resize();
    });
}

// F3.5 客户AUM变化预测四象限图
function initQuadrantChart() {
    if (!selectedRM || !rmCustData || !mainContent) return;
    
    // 获取当前理财经理的客户数据
    const rmCustomers = rmCustData.filter(cust => cust.RM_ID === selectedRM.RM_ID);
    
    // 创建图表容器
    const quadrantSection = document.createElement('section');
    quadrantSection.className = 'quadrant-chart-section';
    quadrantSection.innerHTML = `
        <h3 class="section-heading"><i class="fas fa-chart-scatter"></i> 客户AUM变化预测</h3>
        <div class="analysis-container">
            <div class="analysis-card full-width">
                <h4 class="card-title"><i class="fas fa-chart-bubble"></i> 客户资产变化四象限分析</h4>
                <div class="card-content" style="height: 500px;">
                    <div id="quadrantChart" style="width: 100%; height: 100%;"></div>
                </div>
            </div>
        </div>
    `;
    
    // 添加到主内容区域
    mainContent.appendChild(quadrantSection);
    
    // 在DOM加载完成后初始化图表
    setTimeout(() => {
        try {
            // 初始化四象限图表
            renderQuadrantChart(rmCustomers);
        } catch (error) {
            console.error('Error initializing quadrant chart:', error);
        }
    }, 500);
}

// 渲染客户AUM变化预测四象限图
function renderQuadrantChart(customers) {
    const chartContainer = document.getElementById('quadrantChart');
    if (!chartContainer) return;
    
    console.log("初始化客户AUM变化四象限图...");
    
    // 处理数据
    const chartData = customers.map(customer => {
        // 计算预测变化幅度 - 修正公式
        const predUpwardLvl = Number(customer.Pred_upward_lvl || 0);
        const predChurnLvl = Number(customer.Pred_Churn_lvl || 0);
        const aumValue = Number(customer.CUST_AVG_AUM || 1); // 避免除以0
        const changeLevel = (predUpwardLvl - predChurnLvl); // 直接使用预测上升水平减去预测流失水平
        
        // 计算预测变化概率
        const predUpwardRate = Number(customer.Pred_upward_rate || 0);
        const predChurnRate = Number(customer.Pred_Churn_rate || 0);
        const changeRate = predUpwardRate - predChurnRate;
        
        return {
            id: customer.CUST_ID,
            name: customer.name || '未知客户',
            changeRate: changeRate, // x轴: 变化概率
            changeLevel: changeLevel, // y轴: 变化幅度
            aumValue: aumValue, // 气泡大小
            predUpwardRate: predUpwardRate * 100, // 提升概率(%)
            predChurnRate: predChurnRate * 100, // 流失概率(%)
            currentTier: customer.AUM_AVG_GROUP || '未知',
            predTier: customer.Pred_AUM_Group || '未知'
        };
    }).filter(item => {
        // 过滤掉无效数据
        return !isNaN(item.changeRate) && !isNaN(item.changeLevel) && !isNaN(item.aumValue);
    });
    
    console.log("四象限图数据样本:", chartData.slice(0, 3));
    
    // 计算AUM值的范围，用于气泡大小映射
    const aumValues = chartData.map(item => item.aumValue);
    const minAum = Math.min(...aumValues);
    const maxAum = Math.max(...aumValues);
    
    // 计算变化幅度的范围，用于y轴设置
    const changeLevels = chartData.map(item => item.changeLevel);
    const minChangeLevel = Math.min(...changeLevels);
    const maxChangeLevel = Math.max(...changeLevels);
    
    // 计算数据的标准差，用于确定合适的轴范围
    const sum = changeLevels.reduce((acc, val) => acc + val, 0);
    const mean = sum / changeLevels.length;
    const squaredDiffs = changeLevels.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / changeLevels.length;
    const stdDev = Math.sqrt(variance);
    
    // 使用标准差的2.5倍作为轴范围，使数据更集中
    // 但确保包含异常值
    const yAxisMax = Math.max(
        Math.ceil(Math.abs(mean + 2.5 * stdDev)), 
        Math.ceil(Math.abs(mean - 2.5 * stdDev)),
        Math.ceil(Math.abs(minChangeLevel)),
        Math.ceil(Math.abs(maxChangeLevel))
    );
    
    // 初始化图表
    const chart = echarts.init(chartContainer);
    
    // 配置
    const option = {
        backgroundColor: 'transparent',
        title: {
            text: '客户资产变化四象限分析',
            left: 'center',
            top: 10,
            textStyle: { color: '#e0e0e0', fontSize: 16 }
        },
        grid: {
            left: '10%',
            right: '10%',
            bottom: '10%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            name: '预测变化概率',
            // 调整X轴范围使数据点更集中
            min: -0.6,
            max: 0.6,
            splitLine: {
                lineStyle: {
                    color: '#333'
                }
            },
            axisLine: {
                lineStyle: {
                    color: '#e0e0e0'
                }
            },
            axisLabel: {
                color: '#e0e0e0',
                formatter: function(value) {
                    if (value === -0.6) return '低概率';
                    if (value === 0) return '中等';
                    if (value === 0.6) return '高概率';
                    return '';
                }
            },
            axisTick: {
                show: false
            }
        },
        yAxis: {
            type: 'value',
            name: '预测变化幅度(%)',
            min: -yAxisMax,
            max: yAxisMax,
            splitLine: {
                lineStyle: {
                    color: '#333'
                }
            },
            axisLine: {
                lineStyle: {
                    color: '#e0e0e0'
                }
            },
            axisLabel: {
                color: '#e0e0e0',
                formatter: function(value) {
                    if (value === -yAxisMax) return '大幅下降';
                    if (value === 0) return '持平';
                    if (value === yAxisMax) return '大幅上升';
                    return value + '%';
                }
            },
            axisTick: {
                show: false
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                const data = params.data;
                return `客户ID: ${data.id}<br/>
                        客户名称: ${data.name}<br/>
                        当前层级: ${data.currentTier}<br/>
                        预测层级: ${data.predTier}<br/>
                        资产规模: ${formatCurrency(data.aumValue)}<br/>
                        提升概率: ${formatPercent(data.predUpwardRate)}<br/>
                        流失概率: ${formatPercent(data.predChurnRate)}<br/>
                        变化幅度: ${formatPercent(data.changeLevel)}`;
            }
        },
        // 移除了dataZoom配置，禁用缩放功能
        series: [
            {
                type: 'scatter',
                name: '客户资产变化预测',
                data: chartData.map(item => {
                    return {
                        value: [item.changeRate, item.changeLevel],
                        id: item.id,
                        name: item.name,
                        currentTier: item.currentTier,
                        predTier: item.predTier,
                        aumValue: item.aumValue,
                        predUpwardRate: item.predUpwardRate,
                        predChurnRate: item.predChurnRate,
                        changeLevel: item.changeLevel
                    };
                }),
                symbolSize: function(data) {
                    // 修复：正确访问数据点的aumValue属性
                    // params参数是该数据点的对象，可以直接访问其属性
                    const aumValue = data.aumValue || 1;
                    // 增大气泡基础大小，调整缩放比例使差异更明显
                    return 15 + Math.sqrt(aumValue) / 500; // 增加基础大小并调整系数
                },
                itemStyle: {
                    color: function(params) {
                        const x = params.data.value[0]; // 变化概率
                        const y = params.data.value[1]; // 变化幅度
                        
                        // 根据象限不同使用不同颜色
                        if (x >= 0 && y >= 0) return '#3fa2e9'; // 右上：高概率+大幅上升
                        if (x < 0 && y >= 0) return '#1f48c5';  // 左上：低概率+大幅上升
                        if (x < 0 && y < 0) return '#ff4d4f';   // 左下：低概率+大幅下降
                        if (x >= 0 && y < 0) return '#fa8c16';  // 右下：高概率+大幅下降
                        return '#a0a0a0'; // 默认灰色
                    },
                    opacity: 0.9,
                    borderColor: '#fff',
                    borderWidth: 1
                },
                emphasis: {
                    itemStyle: {
                        borderWidth: 2,
                        opacity: 1
                    }
                }
            }
        ],
        // 添加四象限中心十字轴线
        graphic: [
            // X轴中心线
            {
                type: 'line',
                z: 0,
                shape: {
                    x1: '50%',
                    y1: '10%',
                    x2: '50%', 
                    y2: '90%'
                },
                style: {
                    stroke: '#666',
                    lineWidth: 1
                },
                silent: true
            },
            // Y轴中心线
            {
                type: 'line',
                z: 0,
                shape: {
                    x1: '10%',
                    y1: '50%',
                    x2: '90%',
                    y2: '50%'
                },
                style: {
                    stroke: '#666',
                    lineWidth: 1
                },
                silent: true
            },
            // 右上象限文本
            {
                type: 'text',
                z: 10,
                left: '75%', 
                top: '25%',
                style: {
                    text: '高概率上升',
                    fill: '#3fa2e9',
                    fontSize: 12
                },
                silent: true
            },
            // 左上象限文本
            {
                type: 'text',
                z: 10,
                left: '25%',
                top: '25%',
                style: {
                    text: '低概率上升',
                    fill: '#1f48c5',
                    fontSize: 12
                },
                silent: true
            },
            // 左下象限文本
            {
                type: 'text',
                z: 10,
                left: '25%',
                top: '75%',
                style: {
                    text: '低概率下降',
                    fill: '#ff4d4f',
                    fontSize: 12
                },
                silent: true
            },
            // 右下象限文本
            {
                type: 'text',
                z: 10,
                left: '75%',
                top: '75%',
                style: {
                    text: '高概率下降',
                    fill: '#fa8c16', 
                    fontSize: 12
                },
                silent: true
            }
        ],
        animationDuration: 1500,
        animationEasing: 'elasticOut'
    };
    
    chart.setOption(option);
    
    // 响应式调整
    window.addEventListener('resize', () => {
        chart.resize();
    });
    
    // 点击事件 - 可以添加联动客户名单的功能
    chart.on('click', function(params) {
        const customerId = params.data.id;
        console.log('点击客户:', customerId);
        
        // 高亮客户名单中对应的行
        highlightCustomerInTable(customerId);
    });
}

// 高亮客户名单表格中的对应客户
function highlightCustomerInTable(customerId) {
    const tableRows = document.querySelectorAll('#customerTable tbody tr');
    tableRows.forEach(row => {
        // 移除所有行的高亮
        row.classList.remove('highlighted-row');
        
        // 获取当前行的客户ID单元格（第一个TD）
        const idCell = row.querySelector('td:first-child');
        if (idCell && idCell.textContent === customerId) {
            // 添加高亮类
            row.classList.add('highlighted-row');
            
            // 滚动到该行
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}

// F4. 客户名单
function initCustomerList() {
    if (!selectedRM || !rmCustData || !mainContent) return;
    
    // 获取当前理财经理的客户数据
    const rmCustomers = rmCustData.filter(cust => cust.RM_ID === selectedRM.RM_ID);
    
    // 创建客户名单容器
    const customerListSection = document.createElement('section');
    customerListSection.className = 'customer-list-section';
    customerListSection.innerHTML = `
        <h3 class="section-heading"><i class="fas fa-users"></i> 客户名单</h3>
        <div class="customer-list-container">
            <div class="table-controls">
                <div class="search-container">
                    <input type="text" id="customerSearch" placeholder="搜索客户..." class="search-input">
                    <button id="searchButton" class="search-button"><i class="fas fa-search"></i></button>
                </div>
                <div class="filter-container">
                    <select id="tierFilter" class="filter-select">
                        <option value="">所有层级</option>
                        <option value="0-50K">0-50K</option>
                        <option value="50-300K">50-300K</option>
                        <option value="300K-1Mn">300K-1Mn</option>
                        <option value="1-6Mn">1-6Mn</option>
                        <option value="6-30Mn">6-30Mn</option>
                        <option value="30mn+">30mn+</option>
                    </select>
                    <select id="salesLeadsFilter" class="filter-select">
                        <option value="">所有销售线索</option>
                        <option value="1">存款产品</option>
                        <option value="2">理财产品</option>
                        <option value="3">基金</option>
                        <option value="4">保险</option>
                        <option value="5">贵金属</option>
                        <option value="6">信用卡</option>
                        <option value="7">贷款</option>
                        <option value="8">其他</option>
                    </select>
                </div>
            </div>
            <div class="table-container">
                <table id="customerTable" class="customer-table">
                    <thead>
                        <tr>
                            <th data-sort="CUST_ID">客户ID <i class="fas fa-sort"></i></th>
                            <th data-sort="name">姓名 <i class="fas fa-sort"></i></th>
                            <th data-sort="age">年龄 <i class="fas fa-sort"></i></th>
                            <th data-sort="profession">职业 <i class="fas fa-sort"></i></th>
                            <th data-sort="risk_level">风险等级 <i class="fas fa-sort"></i></th>
                            <th data-sort="sales_leads" class="highlight-column">销售线索 <i class="fas fa-sort"></i></th>
                            <th data-sort="CUST_AVG_AUM">AUM月日均 <i class="fas fa-sort"></i></th>
                            <th data-sort="AUM_AVG_GROUP">现有层级 <i class="fas fa-sort"></i></th>
                            <th data-sort="Pred_AUM_Group" class="highlight-column">预测层级 <i class="fas fa-sort"></i></th>
                            <th data-sort="Pred_Churn_rate" class="highlight-column">预测流失概率 <i class="fas fa-sort"></i></th>
                            <th data-sort="Pred_upward_rate" class="highlight-column">预测提升概率 <i class="fas fa-sort"></i></th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- 客户数据将通过JavaScript动态填充 -->
                    </tbody>
                </table>
            </div>
            <div class="pagination-container">
                <button id="prevPage" class="pagination-button"><i class="fas fa-chevron-left"></i> 上一页</button>
                <span id="pageInfo" class="page-info">第 1 页 / 共 1 页</span>
                <button id="nextPage" class="pagination-button">下一页 <i class="fas fa-chevron-right"></i></button>
            </div>
        </div>
    `;
    
    // 添加到主内容区域
    mainContent.appendChild(customerListSection);
    
    // 在DOM加载完成后初始化客户列表
    setTimeout(() => {
        try {
            // 填充客户表格
            populateCustomerTable(rmCustomers);
            
            // 添加排序功能
            setupTableSorting();
            
            // 添加搜索和过滤功能
            setupSearchAndFilters();
            
            // 添加分页功能
            setupPagination();
        } catch (error) {
            console.error('Error initializing customer list:', error);
        }
    }, 500);
}

// 销售线索类型映射
const salesLeadsMap = {
    0: "无",
    1: "存款产品",
    2: "理财产品",
    3: "基金",
    4: "保险",
    5: "贵金属",
    6: "信用卡",
    7: "贷款",
    8: "其他"
};

// 风险等级映射
const riskLevelMap = {
    1: "保守型",
    2: "稳健型",
    3: "平衡型",
    4: "积极型",
    5: "激进型"
};

// 全局变量，用于存储客户数据和当前分页状态
let filteredCustomers = [];
let currentPage = 1;
const rowsPerPage = 10;

// 填充客户表格
function populateCustomerTable(customers) {
    const tableBody = document.querySelector('#customerTable tbody');
    if (!tableBody) return;
    
    // 保存筛选后的客户数据
    filteredCustomers = [...customers];
    
    // 清空表格
    tableBody.innerHTML = '';
    
    // 计算当前页数据范围
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, filteredCustomers.length);
    
    // 遍历客户数据并填充表格
    for (let i = startIndex; i < endIndex; i++) {
        const customer = filteredCustomers[i];
        
        // 创建行
        const row = document.createElement('tr');
        
        // 计算字段值并处理可能的空值
        const aumValue = Number(customer.CUST_AVG_AUM || 0);
        const formattedAum = formatCurrency(aumValue);
        const churnRate = customer.Pred_Churn_rate !== null && customer.Pred_Churn_rate !== undefined ? 
            formatPercent(customer.Pred_Churn_rate * 100) : 'N/A';
        const upwardRate = customer.Pred_upward_rate !== null && customer.Pred_upward_rate !== undefined ? 
            formatPercent(customer.Pred_upward_rate * 100) : 'N/A';
        
        // 添加单元格
        row.innerHTML = `
            <td>${customer.CUST_ID || ''}</td>
            <td>${customer.name || ''}</td>
            <td>${customer.age || ''}</td>
            <td>${customer.profession || ''}</td>
            <td>${riskLevelMap[customer.risk_level] || customer.risk_level || ''}</td>
            <td class="highlight-cell">${salesLeadsMap[customer.sales_leads] || ''}</td>
            <td>${formattedAum}</td>
            <td>${customer.AUM_AVG_GROUP || ''}</td>
            <td class="highlight-cell">${customer.Pred_AUM_Group || ''}</td>
            <td class="highlight-cell ${parseFloat(churnRate) > 50 ? 'high-risk' : ''}">${churnRate}</td>
            <td class="highlight-cell ${parseFloat(upwardRate) > 50 ? 'high-potential' : ''}">${upwardRate}</td>
        `;
        
        // 添加行到表格
        tableBody.appendChild(row);
    }
    
    // 更新分页信息
    updatePaginationInfo();
}

// 设置表格排序
function setupTableSorting() {
    const headers = document.querySelectorAll('#customerTable th[data-sort]');
    
    headers.forEach(header => {
        header.addEventListener('click', function() {
            const sortField = this.getAttribute('data-sort');
            const sortDirection = this.classList.contains('sort-asc') ? 'desc' : 'asc';
            
            // 移除所有排序指示器
            headers.forEach(h => {
                h.classList.remove('sort-asc', 'sort-desc');
                h.querySelector('i').className = 'fas fa-sort';
            });
            
            // 添加当前排序指示器
            this.classList.add(`sort-${sortDirection}`);
            this.querySelector('i').className = `fas fa-sort-${sortDirection}`;
            
            // 排序数据
            sortCustomers(sortField, sortDirection);
            
            // 重置到第一页
            currentPage = 1;
            
            // 重新填充表格
            populateCustomerTable(filteredCustomers);
        });
    });
}

// 排序客户数据
function sortCustomers(field, direction) {
    filteredCustomers.sort((a, b) => {
        let valueA = a[field] !== null && a[field] !== undefined ? a[field] : '';
        let valueB = b[field] !== null && b[field] !== undefined ? b[field] : '';
        
        // 特殊处理数字字段
        if (['age', 'CUST_AVG_AUM', 'Pred_Churn_rate', 'Pred_upward_rate'].includes(field)) {
            valueA = Number(valueA) || 0;
            valueB = Number(valueB) || 0;
        } else {
            // 字符串比较
            valueA = String(valueA).toLowerCase();
            valueB = String(valueB).toLowerCase();
        }
        
        // 根据方向排序
        if (direction === 'asc') {
            return valueA > valueB ? 1 : -1;
        } else {
            return valueA < valueB ? 1 : -1;
        }
    });
}

// 设置搜索和过滤功能
function setupSearchAndFilters() {
    const searchInput = document.getElementById('customerSearch');
    const searchButton = document.getElementById('searchButton');
    const tierFilter = document.getElementById('tierFilter');
    const salesLeadsFilter = document.getElementById('salesLeadsFilter');
    
    // 搜索功能
    const performSearch = () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const tierValue = tierFilter.value;
        const salesLeadsValue = salesLeadsFilter.value;
        
        // 获取理财经理的所有客户
        const rmCustomers = rmCustData.filter(cust => cust.RM_ID === selectedRM.RM_ID);
        
        // 应用过滤条件
        filteredCustomers = rmCustomers.filter(customer => {
            // 搜索项匹配
            const searchMatch = !searchTerm || 
                String(customer.CUST_ID || '').toLowerCase().includes(searchTerm) ||
                String(customer.name || '').toLowerCase().includes(searchTerm) ||
                String(customer.profession || '').toLowerCase().includes(searchTerm);
            
            // 层级过滤
            const tierMatch = !tierValue || customer.AUM_AVG_GROUP === tierValue;
            
            // 销售线索过滤
            const salesLeadsMatch = !salesLeadsValue || String(customer.sales_leads) === salesLeadsValue;
            
            return searchMatch && tierMatch && salesLeadsMatch;
        });
        
        // 重置到第一页
        currentPage = 1;
        
        // 更新表格
        populateCustomerTable(filteredCustomers);
    };
    
    // 添加事件监听器
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    tierFilter.addEventListener('change', performSearch);
    salesLeadsFilter.addEventListener('change', performSearch);
}

// 设置分页功能
function setupPagination() {
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            populateCustomerTable(filteredCustomers);
        }
    });
    
    nextButton.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredCustomers.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            populateCustomerTable(filteredCustomers);
        }
    });
}

// 更新分页信息
function updatePaginationInfo() {
    const pageInfo = document.getElementById('pageInfo');
    const totalPages = Math.ceil(filteredCustomers.length / rowsPerPage);
    
    pageInfo.textContent = `第 ${currentPage} 页 / 共 ${totalPages} 页`;
    
    // 更新按钮状态
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}



// 添加CSS样式
function addStyles() {
    // 检查样式是否已存在
    if (document.getElementById('moduleF-styles')) {
        return; // 避免重复添加
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'moduleF-styles';
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
        
        /* 半宽卡片样式 */
        .analysis-card.half-width {
            flex: 0 0 calc(50% - 10px);
        }
        
        @media (max-width: 1200px) {
            .analysis-card.half-width {
                flex: 0 0 100%;
                margin-bottom: 20px;
            }
        }
            
        /* 销售线索概览模块的样式 */
        .sales-leads-overview-section,
        .sales-leads-distribution-section,
        .prediction-matrix-section,
        .customer-list-section {
            margin-bottom: 25px;
        }
        
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
        
        .metrics-container {
            display: flex;
            gap: 20px;
            justify-content: space-between;
        }
        
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
        
        .metric-value-container {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 5px;
        }
        
        .metric-value {
            font-size: 28px;
            font-weight: bold;
            color: var(--highlight-bg, #3fa2e9);
        }
        
        .metric-value.positive {
            color: #4CAF50;
        }
        
        .metric-value.negative {
            color: #F44336;
        }
        
        .metric-unit {
            font-size: 16px;
            color: #a0a0a0;
        }
        
        /* 分析卡片样式 */
        .analysis-container {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .analysis-card {
            background-color: rgba(15, 37, 55, 0.8);
            border-radius: 12px;
            padding: 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(63, 162, 233, 0.2);
            overflow: hidden;
            transition: transform 0.3s, box-shadow 0.3s;
            flex: 1;
            min-width: 300px;
        }
        
        .analysis-card.full-width {
            flex: 0 0 100%;
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
        
        .card-controls {
            display: flex;
            justify-content: flex-end;
            padding: 10px 15px;
            background-color: rgba(9, 30, 44, 0.5);
            border-bottom: 1px solid rgba(63, 162, 233, 0.2);
        }
        
        .tab-group {
            display: flex;
            background-color: rgba(9, 30, 44, 0.7);
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid rgba(63, 162, 233, 0.3);
        }
        
        .tab-btn {
            padding: 8px 15px;
            background: none;
            border: none;
            color: #a0a0a0;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 14px;
        }
        
        .tab-btn.active {
            background-color: var(--highlight-bg, #3fa2e9);
            color: #ffffff;
        }
        
        .tab-btn:hover:not(.active) {
            background-color: rgba(63, 162, 233, 0.2);
            color: var(--text-color, #e0e0e0);
        }
        
        /* 客户名单表格样式 */
        .customer-list-container {
            background-color: rgba(15, 37, 55, 0.8);
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(63, 162, 233, 0.2);
            overflow: hidden;
        }
        
        .table-controls {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .search-container {
            display: flex;
            gap: 5px;
        }
        
        .search-input {
            padding: 8px 12px;
            border-radius: 6px;
            background-color: rgba(9, 30, 44, 0.7);
            border: 1px solid rgba(63, 162, 233, 0.3);
            color: var(--text-color, #e0e0e0);
            width: 250px;
        }
        
        .search-input:focus {
            outline: none;
            border-color: var(--highlight-bg, #3fa2e9);
            box-shadow: 0 0 0 2px rgba(63, 162, 233, 0.2);
        }
        
        .search-button {
            padding: 8px 12px;
            border-radius: 6px;
            background-color: var(--highlight-bg, #3fa2e9);
            border: none;
            color: #ffffff;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .search-button:hover {
            background-color: #2980b9;
        }
        
        .filter-container {
            display: flex;
            gap: 10px;
        }
        
        .filter-select {
            padding: 8px 12px;
            border-radius: 6px;
            background-color: rgba(9, 30, 44, 0.7);
            border: 1px solid rgba(63, 162, 233, 0.3);
            color: var(--text-color, #e0e0e0);
            cursor: pointer;
        }
        
        .filter-select:focus {
            outline: none;
            border-color: var(--highlight-bg, #3fa2e9);
        }
        
        .table-container {
            overflow-x: auto;
            margin-bottom: 15px;
        }
        
        .customer-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        
        .customer-table th {
            background-color: rgba(9, 30, 44, 0.8);
            color: var(--text-color, #e0e0e0);
            text-align: left;
            padding: 12px 15px;
            position: sticky;
            top: 0;
            cursor: pointer;
            user-select: none;
            transition: background-color 0.3s;
            white-space: nowrap;
        }
        
        .customer-table th:hover {
            background-color: rgba(63, 162, 233, 0.2);
        }
        
        .customer-table th i {
            margin-left: 5px;
            font-size: 12px;
        }
        
        .customer-table th.sort-asc i {
            color: var(--highlight-bg, #3fa2e9);
        }
        
        .customer-table th.sort-desc i {
            color: var(--highlight-bg, #3fa2e9);
        }
        
        .customer-table tr {
            border-bottom: 1px solid rgba(63, 162, 233, 0.1);
            transition: background-color 0.3s;
        }
        
        .customer-table tr:hover {
            background-color: rgba(63, 162, 233, 0.1);
        }
        
        .customer-table td {
            padding: 10px 15px;
            color: #c0c0c0;
            white-space: nowrap;
        }
        
        .highlight-column, .highlight-cell {
            background-color: rgba(63, 162, 233, 0.05);
        }
        
        .highlight-cell.high-risk {
            background-color: rgba(244, 67, 54, 0.1);
            color: #F44336;
            font-weight: bold;
        }
        
        .highlight-cell.high-potential {
            background-color: rgba(76, 175, 80, 0.1);
            color: #4CAF50;
            font-weight: bold;
        }
        
        .pagination-container {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 15px;
            margin-top: 20px;
        }
        
        .pagination-button {
            padding: 8px 15px;
            border-radius: 6px;
            background-color: rgba(63, 162, 233, 0.15);
            border: 1px solid rgba(63, 162, 233, 0.3);
            color: var(--highlight-bg, #3fa2e9);
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .pagination-button:hover:not(:disabled) {
            background-color: var(--highlight-bg, #3fa2e9);
            color: #ffffff;
        }
        
        .pagination-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .page-info {
            font-size: 14px;
            color: #a0a0a0;
        }
        
        .sankey-chart-section {
            margin-bottom: 25px;
        }

        .quadrant-chart-section {
            margin-bottom: 25px;
        }

        /* 客户名单高亮行样式 */
        .customer-table tr.highlighted-row {
            background-color: rgba(63, 162, 233, 0.2);
            border: 1px solid #3fa2e9;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(63, 162, 233, 0.4); }
            70% { box-shadow: 0 0 0 8px rgba(63, 162, 233, 0); }
            100% { box-shadow: 0 0 0 0 rgba(63, 162, 233, 0); }
}

        /* 响应式布局 */
        @media (max-width: 1200px) {
            .metrics-container {
                flex-wrap: wrap;
            }
            
            .metric-card {
                flex: 0 0 calc(50% - 10px);
            }
            
            .filter-container {
                flex-direction: column;
            }
        }
        
        @media (max-width: 768px) {
            .metric-card {
                flex: 0 0 100%;
            }
            
            .table-controls {
                flex-direction: column;
            }
            
            .search-container {
                width: 100%;
            }
            
            .search-input {
                flex: 1;
            }
        }
    `;
    
    document.head.appendChild(styleElement);
}