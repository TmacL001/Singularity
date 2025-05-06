import { callChatGpt } from './chatGptService.js';


// 全局变量
let mainContent = null;




function formatCurrency(value) {
    return Number(value).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatPercent(value) {
    return Number(value).toFixed(1);
}

function createModuleMapping() {
    return {
        // 收入整体结构
        '收入结构': 'selectedRMRevenueChart',
        '收入构成': 'selectedRMRevenueChart',
        '收入构架': 'selectedRMRevenueChart',
        '收入组成': 'selectedRMRevenueChart',
        
        // 收入分解
        '收入分解': 'revenueBreakdownSankey',
        '收入细分': 'revenueBreakdownSankey',
        '收入来源': 'revenueBreakdownSankey',
        
        // 中间业务收入排名
        '中间业务排名': 'intermediateRevenueScatter',
        '中间业务收入排名': 'intermediateRevenueScatter',
        '中收排名': 'intermediateRevenueScatter',
        
        // 中间业务结构
        '中间业务结构': 'intermediateBusinessChart',
        '中间业务组成': 'intermediateBusinessChart',
        '中收结构': 'intermediateBusinessChart',
        
        // 万元收益 vs 财富类AUM
        '万元收益': 'yieldVsSalesScatter',
        '财富类产品': 'yieldVsSalesScatter',
        '万元收益率': 'yieldVsSalesScatter',
        
        // 中间业务产品对比
        '产品对比': 'detailedComparisonChart',
        '产品销量': 'detailedComparisonChart',
        '购买人数': 'detailedComparisonChart',
        
        // 存款收入排名
        '存款排名': 'depositRevenueScatter',
        '存款收入排名': 'depositRevenueScatter',
        '存款ftp排名': 'depositRevenueScatter',
        
        // 存款收入分解
        '存款分解': 'depositBreakdownAnalysis2',
        '存款结构': 'depositBreakdownAnalysis2',
        '活期存款': 'depositBreakdownAnalysis2',
        '定期存款': 'depositBreakdownAnalysis2',
        
        // 存款收入结构
        '存款收入结构': 'depositRevenueChart',
        '存款收入趋势': 'depositRevenueChart',
        
        // 信贷收入排名
        '信贷排名': 'creditRevenueScatter',
        '信贷收入排名': 'creditRevenueScatter',
        '贷款收入排名': 'creditRevenueScatter',
        
        // 信贷收入分解
        '信贷分解': 'creditBreakdownAnalysis',
        '信贷结构': 'creditBreakdownAnalysis',
        '信贷客户': 'creditBreakdownAnalysis',
        
        // 信贷收入结构
        '信贷收入结构': 'creditRevenueChart',
        '信贷收入趋势': 'creditRevenueChart',
        
        // 对公收入排名
        '对公排名': 'corporateRevenueScatter',
        '对公收入排名': 'corporateRevenueScatter',
        '对公联动排名': 'corporateRevenueScatter',
        
        // 对公收入结构
        '对公收入结构': 'corporateRevenueChart',
        '对公收入趋势': 'corporateRevenueChart',
        '联动收入': 'corporateRevenueChart',

        // 添加 moduleB1 相关映射
        '收入完成情况': 'incomeTaskCompletionAnalysis',
        '收入进度': 'incomeTaskCompletionAnalysis',
        '收入KPI': 'incomeTaskCompletionAnalysis',
        '收入排名': 'incomeRankAnalysis',
        '收入趋势': 'incomeTrendChart',
        '收入对比': 'incomeScatterChart',
        '同组收入排名': 'incomeGroupRankChart',
        
        // 添加 moduleB2 相关映射
        '规模完成情况': 'scaleTaskCompletionAnalysis',
        '规模进度': 'scaleTaskCompletionAnalysis',
        '规模KPI': 'scaleTaskCompletionAnalysis',
        '规模排名': 'scaleRankAnalysis',
        '规模趋势': 'scaleTrendChart',
        '规模对比': 'scaleScatterChart',
        '同组规模排名': 'scaleGroupRankChart',

         // 添加 moduleD 相关映射
         'AUM变化原因': 'aumChangeWaterfallChart',
         '规模变化原因': 'aumChangeWaterfallChart',
         'AUM变化归因': 'aumChangeWaterfallChart',
         '资产变化分析': 'aumChangeWaterfallChart',
 
         'AUM转移矩阵': 'aumLossScatterChart',
         '客户层级迁移': 'aumLossScatterChart',
         '规模转移分析': 'aumLossScatterChart',
         
         'AUM流失分布': 'aumLossDistributionChart',
         '资产流失分位': 'aumLossDistributionChart',
         '客户流失分析': 'aumLossDistributionChart',
         
         '客户层级增速': 'customerTierAumGrowthChart',
         'AUM增速分析': 'customerTierAumGrowthChart',
         '各层级增长表现': 'customerTierAumGrowthChart'
    };
}

// 检测问题中的关键词并返回相关模块ID
function detectModuleFromQuestion(question) {
    const moduleMapping = createModuleMapping();
    const normalizedQuestion = question.toLowerCase();
    
    // 遍历映射表中的关键词
    for (const [keyword, moduleId] of Object.entries(moduleMapping)) {
        if (normalizedQuestion.includes(keyword.toLowerCase())) {
            return moduleId;
        }
    }
    
    // 如果没有找到匹配的关键词，返回null
    return null;
}

// 问答模块初始化函数
export function initQAModule(selectedRM, rmData, rmCustData) {
     // 获取主内容区引用
    mainContent = document.getElementById('mainContent');
    if (!selectedRM || !mainContent) return;
    
    // 创建问答模块容器
    const qaSection = document.createElement('section');
    qaSection.className = 'qa-section';
    qaSection.innerHTML = `
        <h3 class="section-heading"><i class="fas fa-robot"></i> 智能问答</h3>
        <div class="qa-container">
            <div class="qa-input-container">
                <input type="text" id="qaInput" class="qa-input" placeholder="请输入您的问题，例如: 我的收入结构如何？业绩排名怎么样？" />
                <button id="qaSubmitBtn" class="qa-submit-btn">
                    <i class="fas fa-paper-plane"></i> 提问
                </button>
            </div>
            <div id="qaResult" class="qa-result">
                <div class="qa-welcome-message">
                    <i class="fas fa-lightbulb qa-tip-icon"></i>
                    <div>
                        <h4>智能助手已就位</h4>
                        <p>您可以询问关于业绩、收入结构、客户情况等问题。例如：</p>
                        <ul>
                            <li>"我的收入结构怎么样？"</li>
                            <li>"我的业绩在组内排名如何？"</li>
                            <li>"我的中间业务收入有什么特点？"</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 添加到主内容区域
    mainContent.appendChild(qaSection);
    
    // 添加问答模块相关的样式
    addQAStyles();
    
    // 绑定事件处理
    setupQAEventHandlers(selectedRM, rmData);
}

// 添加问答模块的样式
function addQAStyles() {
    // 检查样式是否已存在
    if (document.getElementById('qa-module-styles')) {
        return; // 避免重复添加
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'qa-module-styles';
    styleElement.textContent = `
        .qa-section {
            margin-bottom: 25px;
        }
        
        .qa-container {
            background-color: rgba(15, 37, 55, 0.8);
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(63, 162, 233, 0.2);
        }
        
        .qa-input-container {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .qa-input {
            flex: 1;
            padding: 12px 15px;
            border-radius: 8px;
            border: 1px solid rgba(63, 162, 233, 0.3);
            background-color: rgba(9, 30, 44, 0.7);
            color: var(--text-color, #e0e0e0);
            font-size: 16px;
            transition: all 0.3s;
        }
        
        .qa-input:focus {
            outline: none;
            border-color: var(--highlight-bg, #3fa2e9);
            box-shadow: 0 0 0 2px rgba(63, 162, 233, 0.2);
        }
        
        .qa-submit-btn {
            padding: 0 20px;
            border-radius: 8px;
            border: none;
            background: linear-gradient(135deg, var(--highlight-bg, #3fa2e9), #0d47a1);
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .qa-submit-btn:hover {
            background: linear-gradient(135deg, #5eb1ec, #1565c0);
            transform: translateY(-2px);
        }
        
        .qa-submit-btn:active {
            transform: translateY(0);
        }
        
        .qa-result {
            min-height: 100px;
            border-radius: 8px;
            background-color: rgba(9, 30, 44, 0.5);
            padding: 15px;
            color: var(--text-color, #e0e0e0);
            font-size: 16px;
            line-height: 1.6;
            overflow-wrap: break-word;
            transition: all 0.3s;
        }
        
        .qa-welcome-message {
            display: flex;
            gap: 15px;
            align-items: flex-start;
        }
        
        .qa-tip-icon {
            font-size: 24px;
            color: var(--highlight-bg, #3fa2e9);
            margin-top: 5px;
        }
        
        .qa-welcome-message h4 {
            margin: 0 0 10px 0;
            color: var(--highlight-bg, #3fa2e9);
        }
        
        .qa-welcome-message p {
            margin: 0 0 10px 0;
        }
        
        .qa-welcome-message ul {
            margin: 0;
            padding-left: 20px;
            color: #bbbbbb;
        }
        
        .qa-welcome-message li {
            margin-bottom: 5px;
        }
        
        .qa-loader {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100px;
        }
        
        .qa-loader-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(63, 162, 233, 0.3);
            border-radius: 50%;
            border-top-color: var(--highlight-bg, #3fa2e9);
            animation: spin 1s linear infinite;
        }
        
        .qa-question {
            margin-bottom: 15px;
            font-weight: bold;
            color: var(--highlight-bg, #3fa2e9);
            padding-left: 25px;
            position: relative;
        }
        
        .qa-question:before {
            content: "Q:";
            position: absolute;
            left: 0;
            color: #bbbbbb;
        }
        
        .qa-answer {
            padding-left: 25px;
            position: relative;
        }
        
        .qa-answer:before {
            content: "A:";
            position: absolute;
            left: 0;
            color: #bbbbbb;
            font-weight: bold;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
            .qa-input-container {
                flex-direction: column;
            }
            
            .qa-submit-btn {
                padding: 12px;
            }
        }
    `;

    // 添加模块导航按钮样式
    const styleText = `
        /* 现有样式 */
        
        /* 模块导航按钮样式 */
        .qa-module-link {
            margin-top: 15px;
            text-align: right;
        }
        
        .module-navigate-btn {
            background-color: rgba(63, 162, 233, 0.15);
            color: var(--highlight-bg, #3fa2e9);
            border: 1px solid rgba(63, 162, 233, 0.3);
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        .module-navigate-btn:hover {
            background-color: rgba(63, 162, 233, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .module-navigate-btn:active {
            transform: translateY(0);
        }
        
        /* 高亮动画 */
        @keyframes highlight-pulse {
            0% { box-shadow: 0 0 15px 5px rgba(63, 162, 233, 0.4); }
            50% { box-shadow: 0 0 25px 10px rgba(63, 162, 233, 0.7); }
            100% { box-shadow: 0 0 15px 5px rgba(63, 162, 233, 0.4); }
        }
        
        .highlight-pulse {
            animation: highlight-pulse 1.5s ease-in-out 2;
        }
    `;

    styleElement.textContent += styleText;

    document.head.appendChild(styleElement);
}

// 更智能地检测问题中的关键词和意图
function smartDetectModuleFromQuestion(question) {
    const moduleMapping = createModuleMapping();
    const normalizedQuestion = question.toLowerCase();
    
    // 定义不同类型的问题模式
    const patterns = {
        '收入结构': ['收入构成', '收入分布', '收入占比', '收入来源', '什么收入最多'],
        '排名': ['排名怎样', '排名如何', '在什么位置', '是第几', '名次', '对比其他'],
        '趋势': ['趋势如何', '变化', '走势', '增长', '下降', '持续'],
        '建议': ['怎么提高', '如何改进', '提升', '改善方法', '提高收入', '优化结构'],
        '完成情况': ['完成度', '进度如何', 'KPI', '任务完成', '达成率'],
          // 添加 moduleD 相关的问题模式
          '变化原因': ['为什么变化', '原因是什么', '归因', '造成的', '导致的', '因素'],
          '转移': ['转移', '迁移', '流动', '变化', '升降级'],
          '流失': ['流失', '流出', '减少', '下降', '损失'],
          '增速': ['增速', '增长率', '增长情况', '上升', '增加']
    };
    
    // 检测问题的主题
    let matchedThemes = [];
    for (const [theme, keywords] of Object.entries(patterns)) {
        if (keywords.some(keyword => normalizedQuestion.includes(keyword))) {
            matchedThemes.push(theme);
        }
    }
    
    // 检测特定业务领域
    const businessAreas = {
        '中间业务': ['中间业务', '中收', '理财', '基金', '保险'],
        '存款': ['存款', '活期', '定期', 'FTP'],
        '信贷': ['信贷', '贷款', '零售信贷'],
        '对公': ['对公', '公司', '联动'],
        '收入': ['收入', '业绩', '营收'],
        '规模': ['规模', 'AUM', '资产']
    };
    
    let matchedAreas = [];
    for (const [area, keywords] of Object.entries(businessAreas)) {
        if (keywords.some(keyword => normalizedQuestion.includes(keyword))) {
            matchedAreas.push(area);
        }
    }

    // 针对 moduleD 的特定规则
    if (matchedAreas.includes('规模') || normalizedQuestion.includes('aum')) {
        if (matchedThemes.includes('变化原因')) {
            return 'aumChangeWaterfallChart';
        } else if (matchedThemes.includes('转移') || normalizedQuestion.includes('迁移')) {
            return 'aumLossScatterChart';
        } else if (matchedThemes.includes('流失')) {
            return 'aumLossDistributionChart';
        } else if (matchedThemes.includes('增速')) {
            return 'customerTierAumGrowthChart';
        }
    }
    
    if (matchedAreas.includes('客户层级')) {
        if (matchedThemes.includes('增速') || normalizedQuestion.includes('增长')) {
            return 'customerTierAumGrowthChart';
        } else if (matchedThemes.includes('转移') || normalizedQuestion.includes('迁移')) {
            return 'aumLossScatterChart';
        }
    }
    
    if (matchedAreas.includes('流失客户')) {
        return 'aumLossDistributionChart';
    }
    

       // 收入评价模块的映射
       if (matchedAreas.includes('收入')) {
        if (matchedThemes.includes('完成情况')) {
            return 'incomeTaskCompletionAnalysis';
        } else if (matchedThemes.includes('排名')) {
            return 'incomeRankAnalysis';
        } else if (matchedThemes.includes('趋势')) {
            return 'incomeTrendChart';
        }
    }
    
    // 规模评价模块的映射
    if (matchedAreas.includes('规模')) {
        if (matchedThemes.includes('完成情况')) {
            return 'scaleTaskCompletionAnalysis';
        } else if (matchedThemes.includes('排名')) {
            return 'scaleRankAnalysis';
        } else if (matchedThemes.includes('趋势')) {
            return 'scaleTrendChart';
        }
    }


    // 根据识别的主题和业务领域，选择合适的模块
    let bestModuleId = null;
    

    // 如果有明确的业务领域和主题匹配
    if (matchedAreas.length > 0 && matchedThemes.length > 0) {
        // 例如：中间业务 + 排名 = 中间业务排名模块
        const area = matchedAreas[0];
        const theme = matchedThemes[0];
        
        const combinedKey = `${area}${theme}`;
        const combinedMapping = {
            '中间业务收入结构': 'intermediateBusinessChart',
            '中间业务排名': 'intermediateRevenueScatter',
            '中间业务趋势': 'intermediateBusinessChart',
            '存款收入结构': 'depositRevenueChart',
            '存款排名': 'depositRevenueScatter',
            '存款趋势': 'depositRevenueChart',
            '信贷收入结构': 'creditRevenueChart',
            '信贷排名': 'creditRevenueScatter',
            '信贷趋势': 'creditRevenueChart',
            '对公收入结构': 'corporateRevenueChart',
            '对公排名': 'corporateRevenueScatter',
            '对公趋势': 'corporateRevenueChart'
        };
        
        bestModuleId = combinedMapping[combinedKey] || null;
    }
    
    // 如果没有找到组合匹配，则回退到简单关键词匹配
    if (!bestModuleId) {
        // 原始的关键词匹配逻辑
        for (const [keyword, moduleId] of Object.entries(moduleMapping)) {
            if (normalizedQuestion.includes(keyword.toLowerCase())) {
                bestModuleId = moduleId;
                break;
            }
        }
    }
    
    return bestModuleId;
}

// 设置问答模块的事件处理
function setupQAEventHandlers(selectedRM, rmData) {
    const qaInput = document.getElementById('qaInput');
    const qaSubmitBtn = document.getElementById('qaSubmitBtn');
    const qaResult = document.getElementById('qaResult');
    
    if (!qaInput || !qaSubmitBtn || !qaResult) {
        console.error('QA module elements not found');
        return;
    }
    
    // 提交按钮点击事件
    qaSubmitBtn.addEventListener('click', () => {
        handleQASubmit(qaInput, qaResult, selectedRM, rmData);
    });
    
    // 输入框回车事件
    qaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleQASubmit(qaInput, qaResult, selectedRM, rmData);
        }
    });
}

// 处理问答提交
async function handleQASubmit(qaInput, qaResult, selectedRM, rmData) {
    const question = qaInput.value.trim();
    
    // 如果问题为空，不处理
    if (!question) {
        return;
    }
    
    // 显示加载状态
    qaResult.innerHTML = `
        <div class="qa-question">${escapeHtml(question)}</div>
        <div class="qa-loader">
            <div class="qa-loader-spinner"></div>
        </div>
    `;
    
    try {
        // 生成丰富的上下文信息
        const contextInfo = generateContextInfo(selectedRM, rmData);
        
        // 使用更完整的提示构建
        const prompt = buildFullPromptWithModuleDetection(question, contextInfo, selectedRM);
        
        // 调用AI服务
        const response = await callChatGpt(prompt);

        
        
        // 只需保留一个moduleId声明
        // 使用smartDetectModuleFromQuestion函数来检测问题中的关键词        
        const moduleId = smartDetectModuleFromQuestion(question);

        // 可选：从AI响应中获取答案（但不再重复声明moduleId）
         const { answer } = parseAIResponse(response);
        
        // 查找模块名称映射
        const moduleNameMapping = {
            // 添加C1模块的映射
            'selectedRMRevenueChart': '收入整体结构图',
            'revenueBreakdownSankey': '收入分解图',
            'intermediateRevenueScatter': '中间业务收入排名',
            'intermediateBusinessChart': '中间业务结构图',
            'yieldVsSalesScatter': '万元收益vs财富类AUM图',
            'detailedComparisonChart': '中间业务产品对比图',
            'depositRevenueScatter': '存款收入排名',
            'depositBreakdownAnalysis2': '存款收入分解',
            'depositRevenueChart': '存款收入结构图',
            'creditRevenueScatter': '信贷收入排名',
            'creditBreakdownAnalysis': '信贷收入分解',
            'creditRevenueChart': '信贷收入结构图',
            'corporateRevenueScatter': '对公收入排名',
            'corporateRevenueChart': '对公收入结构图',
            
            // 添加moduleB1的模块
            'incomeTaskCompletionAnalysis': '收入完成情况分析',
            'incomeRankAnalysis': '收入排名分析',
            'incomeTrendChart': '收入趋势图表',
            'incomeScatterChart': '收入散点图',
            'incomeGroupRankChart': '同组收入排名',
            
            // 添加moduleB2的模块
            'scaleTaskCompletionAnalysis': '规模完成情况分析',
            'scaleRankAnalysis': '规模排名分析',
            'scaleTrendChart': '规模趋势图表',
            'scaleScatterChart': '规模散点图',
            'scaleGroupRankChart': '同组规模排名',
            // 原有的moduleD的模块映射
            'aumChangeWaterfallChart': 'AUM变化原因分析',
            'aumLossScatterChart': 'AUM转移矩阵',
            'aumLossDistributionChart': 'AUM流失分布图',
            'customerTierAumGrowthChart': '客户层级AUM增速表现'
        };
        
        // 找到模块对应的可读名称
        let moduleName = moduleNameMapping[moduleId] || "相关图表";
        
        // 显示结果
        let resultHTML = `
        <div class="qa-question">${escapeHtml(question)}</div>
        <div class="qa-answer">${answer.replace(/\n/g, '<br>')}</div>
        `;
        
        if (moduleId) {
            resultHTML += `
                <div class="qa-module-link">
                    <button class="module-navigate-btn" data-module-id="${moduleId}">
                        <i class="fas fa-location-arrow"></i> 查看${moduleName}
                    </button>
                </div>
            `;
        }
        
        qaResult.innerHTML = resultHTML;
        
        // 如果有模块链接，添加点击事件
        const navigateBtn = qaResult.querySelector('.module-navigate-btn');
        if (navigateBtn) {
            navigateBtn.addEventListener('click', function() {
                const targetModuleId = this.getAttribute('data-module-id');
                
                // 添加加载状态
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在导航...';
                
                // 根据模块ID类型执行不同的导航逻辑
                if (isDModule(targetModuleId)) {
                    switchToDModule(selectedRM, rmCustData).then(() => {
                        setTimeout(() => scrollToModule(targetModuleId), 500);
                    });
                } else if (isC1Module(targetModuleId)) {
                    switchToModuleC1(selectedRM, rmData).then(() => {
                        setTimeout(() => scrollToModule(targetModuleId), 500);
                    });
                } else if (targetModuleId.includes('income')) {
                    switchToB1Module(selectedRM, rmData).then(() => {
                        setTimeout(() => scrollToModule(targetModuleId), 500);
                    });
                } else if (targetModuleId.includes('scale')) {
                    switchToB2Module(selectedRM, rmData).then(() => {
                        setTimeout(() => scrollToModule(targetModuleId), 500);
                    });
                } else {
                    // 直接滚动到当前页面中的元素
                    scrollToModule(targetModuleId);
                }
            });
        }
    } catch (error) {
        console.error('Error getting AI response:', error);
        qaResult.innerHTML = `
            <div class="qa-question">${escapeHtml(question)}</div>
            <div class="qa-answer">
                <span style="color: #F44336;">很抱歉，获取回答时出现了问题。请稍后再试。</span>
            </div>
        `;
    }
    
    // 清空输入框
    qaInput.value = '';
}
function buildFullPromptWithModuleDetection(question, contextInfo, selectedRM) {
    // 基本提示内容与原来相同
    const basePrompt = `...`; // 原有提示内容
    
    // 添加模块映射信息
    const moduleMapping = `
    以下是系统中可用的模块及其ID：
    - 收入整体结构图 (selectedRMRevenueChart): 显示收入的整体结构分布
    - 收入分解图 (revenueBreakdownSankey): 展示收入的详细分解
    - 中间业务收入排名 (intermediateRevenueScatter): 显示在中间业务收入方面的排名
    ... [其他模块映射]
    
    请在回答问题后，另起一行，以 "MODULE_ID:" 开头，标明最相关的模块ID。如果没有相关模块，请返回 "MODULE_ID: none"。
    `;
    
    return basePrompt + moduleMapping;
}

function parseAIResponse(response) {
    // 检查返回内容中是否包含模块ID标记
    const lines = response.split('\n');
    let moduleId = "none";
    let answer = response;
    
    // 查找含有MODULE_ID:的行
    const moduleIdLineIndex = lines.findIndex(line => line.trim().startsWith('MODULE_ID:'));
    
    if (moduleIdLineIndex !== -1) {
        // 提取模块ID
        moduleId = lines[moduleIdLineIndex].trim().substring('MODULE_ID:'.length).trim();
        
        // 从答案中移除模块ID行
        lines.splice(moduleIdLineIndex, 1);
        answer = lines.join('\n');
    }
    
    return { answer, moduleId };
}

// 平滑滚动到指定模块 - 增强版
function scrollToModule(moduleId) {
    console.log(`尝试滚动到模块: ${moduleId}`);

    // 首先尝试直接找到ID匹配的元素
    let element = document.getElementById(moduleId);
    
    // 如果没找到，尝试其他定位策略
    if (!element) {
        // 使用模块类型分流处理
        if (moduleId.includes('income')) {
            handleB1ModuleScroll(moduleId);
            return;
        } else if (moduleId.includes('scale')) {
            handleB2ModuleScroll(moduleId);
            return;
        } else if (isC1Module(moduleId)) {
            handleC1ModuleScroll(moduleId);
            return;
        } else if (isDModule(moduleId)) {
            handleDModuleScroll(moduleId);
            return;
        }
        
        // 再尝试通过属性选择器查找
        element = document.querySelector(`[data-chart-id="${moduleId}"]`) || 
                 document.querySelector(`[data-module-id="${moduleId}"]`) ||
                 document.querySelector(`[data-id="${moduleId}"]`);
        
        if (!element) {
            console.warn(`找不到模块: ${moduleId}`);
            return;
        }
    }
    
    scrollAndHighlight(element);
}

// 添加这些辅助函数
function isC1Module(moduleId) {
    const c1ModuleIds = [
        'selectedRMRevenueChart', 'revenueBreakdownSankey', 'intermediateRevenueScatter',
        'intermediateBusinessChart', 'yieldVsSalesScatter', 'detailedComparisonChart',
        'depositRevenueScatter', 'depositBreakdownAnalysis2', 'depositRevenueChart',
        'creditRevenueScatter', 'creditBreakdownAnalysis', 'creditRevenueChart',
        'corporateRevenueScatter', 'corporateRevenueChart'
    ];
    return c1ModuleIds.includes(moduleId);
}
function isDModule(moduleId) {
    const dModuleIds = [
        'aumChangeWaterfallChart', 'aumLossScatterChart',
        'aumLossDistributionChart', 'customerTierAumGrowthChart'
    ];
    return dModuleIds.includes(moduleId);
}

// 然后添加handleC1ModuleScroll函数
function handleC1ModuleScroll(moduleId) {
    let targetElement = document.getElementById(moduleId);
    
    if (!targetElement) {
        // 尝试使用更详细的查找方式
        const possibleSelectors = [
            `#${moduleId}`,
            `.chart-container #${moduleId}`,
            `#C1Module #${moduleId}`
        ];
        
        for (const selector of possibleSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                targetElement = element;
                break;
            }
        }
        
        // 如果还是找不到，尝试找到包含该ID的容器
        if (!targetElement) {
            const container = document.querySelector(`.chart-container:has(#${moduleId})`);
            if (container) {
                targetElement = container;
            } else {
                console.warn(`在C1模块中找不到与 ${moduleId} 匹配的元素`);
                return;
            }
        }
    }
    
    scrollAndHighlight(targetElement);
}

function switchToModuleC1(selectedRM, rmData) {
    return new Promise((resolve, reject) => {
        // 检查C1模块是否已经加载
        if (document.getElementById('C1Module')) {
            resolve();
            return;
        }
        
        // 加载模块
        import('./moduleC1.js').then(module => {
            module.loadC1Module(selectedRM, rmData);
            // 给模块一点加载时间
            setTimeout(resolve, 300);
        }).catch(error => {
            console.error('Error loading C1 module:', error);
            reject(error);
        });
    });
}

// 处理B1模块中的元素滚动
function handleB1ModuleScroll(moduleId) {
    let targetElement;
    
    // 根据moduleId查找对应的B1模块元素
    switch (moduleId) {
        case 'incomeTaskCompletionAnalysis':
            targetElement = document.querySelector('.chart-container:nth-child(1) .analysis-content');
            break;
        case 'incomeRankAnalysis':
            targetElement = document.querySelector('.chart-container:nth-child(2) .analysis-content');
            break;
        case 'incomeTrendChart':
            targetElement = document.getElementById('incomeTrendChart');
            break;
        case 'incomeScatterChart':
            targetElement = document.getElementById('incomeScatterChart');
            break;
        case 'incomeGroupRankChart':
            targetElement = document.getElementById('incomeGroupRankChart');
            break;
        default:
            // 找不到特定元素，尝试滚动到B1模块本身
            targetElement = document.getElementById('B1Module');
    }
    
    if (targetElement) {
        scrollAndHighlight(targetElement);
    } else {
        console.warn(`在B1模块中找不到与 ${moduleId} 匹配的元素`);
    }
}

// 处理B2模块中的元素滚动
function handleB2ModuleScroll(moduleId) {
    let targetElement;
    
    // 根据moduleId查找对应的B2模块元素
    switch (moduleId) {
        case 'scaleTaskCompletionAnalysis':
            targetElement = document.querySelector('#B2Module .chart-container:nth-child(1) .analysis-content');
            break;
        case 'scaleRankAnalysis':
            targetElement = document.querySelector('#B2Module .chart-container:nth-child(2) .analysis-content');
            break;
        case 'scaleTrendChart':
            targetElement = document.getElementById('scaleTrendChart');
            break;
        case 'scaleScatterChart':
            targetElement = document.getElementById('scaleScatterChart');
            break;
        case 'scaleGroupRankChart':
            targetElement = document.getElementById('scaleGroupRankChart');
            break;
        default:
            // 找不到特定元素，尝试滚动到B2模块本身
            targetElement = document.getElementById('B2Module');
    }
    
    if (targetElement) {
        scrollAndHighlight(targetElement);
    } else {
        console.warn(`在B2模块中找不到与 ${moduleId} 匹配的元素`);
    }
}

// 添加导航到 moduleD 的辅助函数
function switchToDModule(selectedRM, rmCustData) {
    // 检查 DModule 是否已经加载
    if (!document.getElementById('DModule')) {
        // 如果未加载，导入 moduleD 并加载
        import('./moduleD.js').then(module => {
            module.loadDModule(selectedRM, rmCustData);
        }).catch(error => {
            console.error('Error loading D module:', error);
        });
    }
}
// 添加 moduleD 相关的处理逻辑
function handleDModuleScroll(moduleId) {
    let targetElement;
    
    // 根据 moduleId 查找对应的 moduleD 元素
    switch (moduleId) {
        case 'aumChangeWaterfallChart':
            targetElement = document.getElementById('aumChangeWaterfallChart');
            break;
        case 'aumLossScatterChart':
            targetElement = document.getElementById('aumLossScatterChart');
            break;
        case 'aumLossDistributionChart':
            targetElement = document.getElementById('aumLossDistributionChart');
            break;
        case 'customerTierAumGrowthChart':
            targetElement = document.getElementById('customerTierAumGrowthChart');
            break;
        default:
            // 找不到特定元素，尝试滚动到 DModule 本身
            targetElement = document.getElementById('DModule');
    }
    
    if (targetElement) {
        scrollAndHighlight(targetElement);
    } else {
        console.warn(`在 DModule 中找不到与 ${moduleId} 匹配的元素`);
    }
}
// 滚动并高亮显示元素的辅助函数
function scrollAndHighlight(element) {
    // 首先，尝试查找图表容器
    let container = findChartContainer(element);
    
    // 获取元素的位置
    const rect = container.getBoundingClientRect();
    const offset = rect.top + window.scrollY - 80; // 减去顶部导航栏高度的偏移量
    
    console.log(`滚动到位置: ${offset}px`);
    
    // 平滑滚动到元素位置
    window.scrollTo({
        top: offset,
        behavior: 'smooth'
    });
    
    // 添加高亮效果
    highlightElement(container);
}

function findChartContainer(element) {
    // 首先检查元素自身是否是图表容器
    if (element.classList.contains('chart-container') || 
        element.classList.contains('analysis-card') || 
        element.parentElement.classList.contains('card-content')) {
        return element;
    }
    
    // 向上查找.chart-container类
    let container = element;
    let searchLimit = 10; // 限制搜索深度，避免无限循环
    
    while (container && searchLimit > 0) {
        // 检查是否有适合作为容器的元素
        if (container.classList.contains('chart-container') || 
            container.classList.contains('analysis-card') || 
            container.classList.contains('card-content')) {
            return container;
        }
        
        // 如果是卡片内容区域，返回其父级卡片
        if (container.parentElement && container.parentElement.classList.contains('card-content')) {
            return container.parentElement.parentElement;
        }
        
        container = container.parentElement;
        searchLimit--;
    }
    
    // 如果仍然找不到合适的容器，尝试查找周围的卡片
    let card = element.closest('.analysis-card');
    if (card) return card;
    
    // 如果都找不到，返回原始元素或其父元素
    return element.parentElement || element;
}
// 高亮显示元素
function highlightElement(element) {
    console.log(`高亮显示元素: `, element);
    
    // 保存原始样式
    const originalStyle = {
        boxShadow: element.style.boxShadow,
        transition: element.style.transition,
        border: element.style.border,
        backgroundColor: element.style.backgroundColor
    };
    
    // 添加高亮样式
    element.style.transition = 'all 0.5s ease-in-out';
    element.style.boxShadow = '0 0 20px 5px rgba(63, 162, 233, 0.7)';
    element.style.border = '2px solid rgba(63, 162, 233, 0.8)';
    
    // 滚动到元素位置
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
    
    // 添加动画类
    element.classList.add('highlight-pulse');
    
    // 3秒后恢复原始样式
    setTimeout(() => {
        element.style.boxShadow = originalStyle.boxShadow;
        element.style.border = originalStyle.border;
        element.style.backgroundColor = originalStyle.backgroundColor;
        
        setTimeout(() => {
            element.style.transition = originalStyle.transition;
            element.classList.remove('highlight-pulse');
        }, 500);
    }, 3000);
}
// 生成上下文信息
function generateContextInfo(selectedRM, rmData) {
 
    // 扩展KPI完成情况的信息
    const kpiInfo = {
        revTimeProgress: selectedRM.RM_REV_KPI_RR && selectedRM.RM_Rev_todate ? 
            (selectedRM.RM_REV_KPI_RR / selectedRM.RM_Rev_todate * 100) : 0,
        revOverallProgress: selectedRM.RM_REV_KPI && selectedRM.RM_Rev_todate ? 
            (selectedRM.RM_REV_KPI / selectedRM.RM_Rev_todate * 100) : 0,
        aumTimeProgress: selectedRM.RM_AUM_KPI_RR && selectedRM.RM_Yaum_2025 ? 
            (selectedRM.RM_AUM_KPI_RR / selectedRM.RM_Yaum_2025 * 100) : 0,
        aumOverallProgress: selectedRM.RM_AUM_KPI && selectedRM.RM_Yaum_2025 ? 
            (selectedRM.RM_AUM_KPI / selectedRM.RM_Yaum_2025 * 100) : 0,
        revPerformanceRating: calculatePerformanceRating(rmData, selectedRM, 'revenue'),
        scalePerformanceRating: calculatePerformanceRating(rmData, selectedRM, 'scale')
    };
    
    
       // 获取当前理财经理的基本信息
    const baseInfo = {
        rmId: selectedRM.RM_ID,
        group: selectedRM.cust_aum_scale_group,
        custNum: selectedRM.cust_nums || 0,
        income: selectedRM.RM_Yrev_2025 ? (selectedRM.RM_Yrev_2025 / 10000).toFixed(1) : 0,
        aum: selectedRM.RM_Yaum_2025 ? (selectedRM.RM_Yaum_2025 / 100000000).toFixed(1) : 0
    };
    
    // 收入结构信息
    const revenueInfo = {
        total: selectedRM.RM_Rev_todate || 0,
        companyRevenue: selectedRM.RM_TD_Rev_cpt || 0,
        retailCreditRevenue: selectedRM.RM_TD_Rev_crt || 0,
        depositFTPRevenue: selectedRM.RM_TD_Rev_dpt || 0,
        intermediaryRevenue: selectedRM.RM_TD_Rev_aum || 0
    };
    
    // 规模结构信息
    const aumInfo = {
        wealthManagement: calculateAverageM([
            selectedRM.RM_Maum_wm_1 || 0,
            selectedRM.RM_Maum_wm_2 || 0,
            selectedRM.RM_Maum_wm_3 || 0,
            selectedRM.RM_Maum_wm_4 || 0,
            selectedRM.RM_Maum_wm_5 || 0,
            selectedRM.RM_Maum_wm_6 || 0
        ]),
        fund: calculateAverageM([
            selectedRM.RM_Maum_fund_1 || 0,
            selectedRM.RM_Maum_fund_2 || 0,
            selectedRM.RM_Maum_fund_3 || 0,
            selectedRM.RM_Maum_fund_4 || 0,
            selectedRM.RM_Maum_fund_5 || 0,
            selectedRM.RM_Maum_fund_6 || 0
        ]),
        insurance: calculateAverageM([
            selectedRM.RM_Maum_inr_1 || 0,
            selectedRM.RM_Maum_inr_2 || 0,
            selectedRM.RM_Maum_inr_3 || 0,
            selectedRM.RM_Maum_inr_4 || 0,
            selectedRM.RM_Maum_inr_5 || 0,
            selectedRM.RM_Maum_inr_6 || 0
        ]),
        deposit: calculateAverageM([
            selectedRM.RM_Maum_dpt_1 || 0,
            selectedRM.RM_Maum_dpt_2 || 0,
            selectedRM.RM_Maum_dpt_3 || 0,
            selectedRM.RM_Maum_dpt_4 || 0,
            selectedRM.RM_Maum_dpt_5 || 0,
            selectedRM.RM_Maum_dpt_6 || 0
        ])
    };
    

    const intermediaryInfo = {
        wealthManagementRevenue: selectedRM.RM_Mrev_wm_6 || 0, // 最近一个月的理财收入
        fundRevenue: selectedRM.RM_Mrev_fund_6 || 0, // 最近一个月的基金收入
        insuranceRevenue: selectedRM.RM_Mrev_inr_6 || 0, // 最近一个月的保险收入
        // 添加销售数据
        wealthManagementCustomers: selectedRM.RM_wm_custs || 0,
        fundCustomers: selectedRM.RM_fund_custs || 0,
        insuranceCustomers: selectedRM.RM_inr_custs || 0,
        // 计算每万收益率
        wealthManagementYield: selectedRM.RM_Yld_WM || 0,
        fundYield: selectedRM.RM_Yld_fund || 0,
        insuranceYield: selectedRM.RM_Yld_inr || 0
    };
    
    // 添加存款业务收入的结构
    const depositInfo = {
        totalDeposit: selectedRM.RM_TD_Rev_dpt || 0,
        currentDeposit: selectedRM.RM_Mrev_cdpt_6 || 0, // 活期存款（最近月）
        timeDeposit: selectedRM.RM_Mrev_dpt_6 - (selectedRM.RM_Mrev_cdpt_6 || 0), // 定期存款（差值计算）
        depositCustomers: selectedRM.RM_cdpt_custs || 0,
        depositYield: selectedRM.RM_Yld_DPT || 0
    };
    
    // 添加信贷业务收入
    const creditInfo = {
        totalCredit: selectedRM.RM_TD_Rev_crt || 0,
        latestCreditRevenue: selectedRM.RM_Mrev_crt_6 || 0, // 最近一个月
        creditCustomers: selectedRM.RM_crt_custs || 0,
        // 信贷规模 - 计算1-6月的平均值
        creditScale: calculateAverageM([
            selectedRM.RM_Maum_crt_1 || 0,
            selectedRM.RM_Maum_crt_2 || 0,
            selectedRM.RM_Maum_crt_3 || 0,
            selectedRM.RM_Maum_crt_4 || 0,
            selectedRM.RM_Maum_crt_5 || 0,
            selectedRM.RM_Maum_crt_6 || 0
        ])
    };
    
    // 添加对公业务收入
    const corporateInfo = {
        totalCorporate: selectedRM.RM_TD_Rev_cpt || 0,
        latestCorporateRevenue: selectedRM.RM_Mrev_cpt_6 || 0 // 最近一个月
        // 这里可以添加更多对公业务的指标
    };
    
    // 添加6个月的收入趋势数据
    const monthlyTrends = {
        totalRevenue: [
            selectedRM.RM_Mrev_1 || 0,
            selectedRM.RM_Mrev_2 || 0,
            selectedRM.RM_Mrev_3 || 0,
            selectedRM.RM_Mrev_4 || 0,
            selectedRM.RM_Mrev_5 || 0,
            selectedRM.RM_Mrev_6 || 0
        ],
        intermediaryRevenue: [
            selectedRM.RM_Mrev_aum_1 || 0,
            selectedRM.RM_Mrev_aum_2 || 0,
            selectedRM.RM_Mrev_aum_3 || 0,
            selectedRM.RM_Mrev_aum_4 || 0,
            selectedRM.RM_Mrev_aum_5 || 0,
            selectedRM.RM_Mrev_aum_6 || 0
        ],
        depositRevenue: [
            selectedRM.RM_Mrev_dpt_1 || 0,
            selectedRM.RM_Mrev_dpt_2 || 0,
            selectedRM.RM_Mrev_dpt_3 || 0,
            selectedRM.RM_Mrev_dpt_4 || 0,
            selectedRM.RM_Mrev_dpt_5 || 0,
            selectedRM.RM_Mrev_dpt_6 || 0
        ],
        creditRevenue: [
            selectedRM.RM_Mrev_crt_1 || 0,
            selectedRM.RM_Mrev_crt_2 || 0,
            selectedRM.RM_Mrev_crt_3 || 0,
            selectedRM.RM_Mrev_crt_4 || 0,
            selectedRM.RM_Mrev_crt_5 || 0,
            selectedRM.RM_Mrev_crt_6 || 0
        ],
        corporateRevenue: [
            selectedRM.RM_Mrev_cpt_1 || 0,
            selectedRM.RM_Mrev_cpt_2 || 0,
            selectedRM.RM_Mrev_cpt_3 || 0,
            selectedRM.RM_Mrev_cpt_4 || 0,
            selectedRM.RM_Mrev_cpt_5 || 0,
            selectedRM.RM_Mrev_cpt_6 || 0
        ]
    };

        // 添加收入趋势
        const revenueTrends = {
            monthly: getMonthlyIncomeData(selectedRM),
            quarterly: getQuarterlyIncomeData(selectedRM),
            yearly: getYearlyIncomeData(selectedRM)
        };

        // 添加规模趋势
        const scaleTrends = {
            monthly: getMonthlyScaleData(selectedRM),
            quarterly: getQuarterlyScaleData(selectedRM),
            yearly: getYearlyScaleData(selectedRM)
        };



    // 获取同组理财经理数据（用于排名）
    const groupData = rmData.filter(rm => rm.cust_aum_scale_group === selectedRM.cust_aum_scale_group);
    
    // 收入排名
    const incomeRanking = calculateRanking(groupData, selectedRM.RM_ID, 'RM_Rev_todate');
    
    // 规模排名
    const aumRanking = calculateRanking(groupData, selectedRM.RM_ID, 'RM_Yaum_2025');

    // 收入排名详细信息
    const incomeRankDetail = calculateDetailedRanking(groupData, selectedRM.RM_ID, 'RM_Rev_todate', '收入');
    
    // 规模排名详细信息
    const scaleRankDetail = calculateDetailedRanking(groupData, selectedRM.RM_ID, 'RM_Yaum_2025', '规模');


      // AUM变化原因分析信息
      const aumChangeInfo = calculateAumChangeInfo(selectedRM, rmCustData);
    
      // AUM转移矩阵信息
      const aumTransferInfo = calculateAumTransferInfo(selectedRM, rmCustData);
      
      // AUM流失分布信息
      const aumLossInfo = calculateAumLossInfo(selectedRM, rmCustData);
      
      // 客户层级AUM增速表现信息
      const tierGrowthInfo = calculateTierGrowthInfo(selectedRM, rmCustData);
    
    // 返回整合的上下文信息
    return {
        baseInfo,
        revenueInfo,
        aumInfo,
        kpiInfo,
        incomeRanking,
        aumRanking,
        totalRMs: groupData.length,
         // 添加新的信息块
         intermediaryInfo,
         depositInfo,
         creditInfo,
         corporateInfo,
         monthlyTrends,
         revenueTrends,
         scaleTrends,
        incomeRankDetail,
         scaleRankDetail,
          // 添加 moduleD 相关信息
        aumChangeInfo,
        aumTransferInfo,
        aumLossInfo,
        tierGrowthInfo
    };
}

// 计算 AUM 变化原因分析信息
function calculateAumChangeInfo(selectedRM, rmCustData) {
    if (!selectedRM || !rmCustData) return {};
    
    const rmId = selectedRM.RM_ID;
    const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);
    
    // 计算期初总AUM
    const initialTotalAum = rmCustomers.reduce((sum, cust) => sum + Number(cust.CUST_AVG_AUM_2 || 0), 0);
    
    // 计算期末总AUM
    const finalTotalAum = rmCustomers.reduce((sum, cust) => sum + Number(cust.CUST_AVG_AUM || 0), 0);
    
    // 总AUM变化
    const totalChange = finalTotalAum - initialTotalAum;
    
    // 按客户状态分组计算各组AUM变化
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
    
    // 找出贡献最大的正向变化和负向变化
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
    
    return {
        initialAum: initialTotalAum,
        finalAum: finalTotalAum,
        totalChange: totalChange,
        changePercent: initialTotalAum > 0 ? (totalChange / initialTotalAum * 100) : 0,
        statusGroups: statusGroups,
        maxPositiveGroup: maxPositiveGroup,
        maxPositiveChange: maxPositiveChange,
        maxNegativeGroup: maxNegativeGroup,
        maxNegativeChange: maxNegativeChange
    };
}

// 计算 AUM 转移矩阵信息
function calculateAumTransferInfo(selectedRM, rmCustData) {
    if (!selectedRM || !rmCustData) return {};
    
    const rmId = selectedRM.RM_ID;
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
    
    // 计算保持不变和发生变化的客户数
    let stableCustomers = 0;
    let upgradedCustomers = 0;
    let downgradedCustomers = 0;
    
    rmCustomers.forEach(cust => {
        const initialTier = cust.AUM_AVG_GROUP_2;
        const finalTier = cust.AUM_AVG_GROUP;
        
        if (!initialTier || !finalTier || 
            !tierOrder.includes(initialTier) || 
            !tierOrder.includes(finalTier)) {
            return;
        }
        
        const initialIdx = tierOrder.indexOf(initialTier);
        const finalIdx = tierOrder.indexOf(finalTier);
        
        if (initialIdx === finalIdx) {
            stableCustomers++;
        } else if (finalIdx < initialIdx) {
            // 层级上升（较低的索引表示较高的层级）
            upgradedCustomers++;
        } else {
            // 层级下降
            downgradedCustomers++;
        }
    });
    
    const totalCustomers = stableCustomers + upgradedCustomers + downgradedCustomers;
    
    return {
        totalCustomers: totalCustomers,
        stableCustomers: stableCustomers,
        stablePercent: totalCustomers > 0 ? (stableCustomers / totalCustomers * 100) : 0,
        upgradedCustomers: upgradedCustomers,
        upgradedPercent: totalCustomers > 0 ? (upgradedCustomers / totalCustomers * 100) : 0,
        downgradedCustomers: downgradedCustomers,
        downgradedPercent: totalCustomers > 0 ? (downgradedCustomers / totalCustomers * 100) : 0
    };
}

// 计算 AUM 流失分布信息
function calculateAumLossInfo(selectedRM, rmCustData) {
    if (!selectedRM || !rmCustData) return {};
    
    const rmId = selectedRM.RM_ID;
    const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);
    
    // 计算每个客户的AUM变化
    rmCustomers.forEach(cust => {
        const initialAum = Number(cust.CUST_AVG_AUM_2 || 0);
        const finalAum = Number(cust.CUST_AVG_AUM || 0);
        cust.AUM_DELTA = finalAum - initialAum;
    });
    
    // 只考虑流失的客户（AUM变化为负值）
    const lossCustomers = rmCustomers.filter(cust => cust.AUM_DELTA < 0);
    
    // 计算流失总额（取绝对值）
    const totalLossAmount = lossCustomers.reduce((sum, cust) => sum + Math.abs(cust.AUM_DELTA), 0);
    
    // 按流失金额从大到小排序
    lossCustomers.sort((a, b) => Math.abs(b.AUM_DELTA) - Math.abs(a.AUM_DELTA));
    
    // 计算前10%流失客户的占比
    const top10PercentCount = Math.ceil(lossCustomers.length * 0.1);
    const top10PercentAmount = lossCustomers.slice(0, top10PercentCount)
        .reduce((sum, cust) => sum + Math.abs(cust.AUM_DELTA), 0);
    const top10PercentShare = totalLossAmount > 0 ? (top10PercentAmount / totalLossAmount * 100) : 0;
    
    // 按客户初始层级统计流失
    const tierLossInfo = {};
    
    // 定义客户层级顺序
    const tierOrder = [
        "30mn+", 
        "6-30Mn", 
        "1-6Mn", 
        "300K-1Mn", 
        "50-300K", 
        "0-50K"
    ];
    
    tierOrder.forEach(tier => {
        const tierCustomers = lossCustomers.filter(cust => cust.AUM_AVG_GROUP_2 === tier);
        const tierLossAmount = tierCustomers.reduce((sum, cust) => sum + Math.abs(cust.AUM_DELTA), 0);
        
        tierLossInfo[tier] = {
            count: tierCustomers.length,
            amount: tierLossAmount,
            share: totalLossAmount > 0 ? (tierLossAmount / totalLossAmount * 100) : 0
        };
    });
    
    return {
        totalLossCustomers: lossCustomers.length,
        totalLossAmount: totalLossAmount,
        top10PercentShare: top10PercentShare,
        tierLossInfo: tierLossInfo
    };
}

// 计算客户层级AUM增速表现信息
function calculateTierGrowthInfo(selectedRM, rmCustData) {
    if (!selectedRM || !rmCustData) return {};
    
    const rmId = selectedRM.RM_ID;
    const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);
    
    // 定义客户层级顺序
    const tierOrder = [
        "30mn+", 
        "6-30Mn", 
        "1-6Mn", 
        "300K-1Mn", 
        "50-300K", 
        "0-50K"
    ];
    
    // 计算每个层级的AUM增速
    const tierGrowthRates = {};
    
    tierOrder.forEach(tier => {
        const tierCustomers = rmCustomers.filter(cust => cust.AUM_AVG_GROUP === tier);
        
        const growthRates = [];
        tierCustomers.forEach(cust => {
            const initialAum = Number(cust.CUST_AVG_AUM_2 || 0);
            const finalAum = Number(cust.CUST_AVG_AUM || 0);
            
            if (initialAum > 0) {
                const growthRate = (finalAum / initialAum) - 1;
                growthRates.push(growthRate);
            }
        });
        
        // 计算平均增速
        const avgGrowthRate = growthRates.length > 0 ? 
            growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length : 0;
        
        tierGrowthRates[tier] = {
            customerCount: tierCustomers.length,
            avgGrowthRate: avgGrowthRate,
            growthRates: growthRates
        };
    });
    
    // 找出增速最高和最低的层级
    let highestGrowthTier = null;
    let highestGrowthRate = -Infinity;
    let lowestGrowthTier = null;
    let lowestGrowthRate = Infinity;
    
    tierOrder.forEach(tier => {
        if (tierGrowthRates[tier].customerCount > 0) {
            const avgRate = tierGrowthRates[tier].avgGrowthRate;
            
            if (avgRate > highestGrowthRate) {
                highestGrowthRate = avgRate;
                highestGrowthTier = tier;
            }
            
            if (avgRate < lowestGrowthRate) {
                lowestGrowthRate = avgRate;
                lowestGrowthTier = tier;
            }
        }
    });
    
    return {
        tierGrowthRates: tierGrowthRates,
        highestGrowthTier: highestGrowthTier,
        highestGrowthRate: highestGrowthRate,
        lowestGrowthTier: lowestGrowthTier,
        lowestGrowthRate: lowestGrowthRate
    };
}

function switchToB1Module(selectedRM, rmData) {
    // 检查B1模块是否已经加载
    if (!document.getElementById('B1Module')) {
        // 如果未加载，导入moduleB1并加载
        import('./moduleB1.js').then(module => {
            module.loadB1Module(selectedRM, rmData);
        }).catch(error => {
            console.error('Error loading B1 module:', error);
        });
    }
}

function switchToB2Module(selectedRM, rmData) {
    // 检查B2模块是否已经加载
    if (!document.getElementById('B2Module')) {
        // 如果未加载，导入moduleB2并加载
        import('./moduleB2.js').then(module => {
            module.loadB2Module(selectedRM, rmData);
        }).catch(error => {
            console.error('Error loading B2 module:', error);
        });
    }
}


// 计算数组平均值的辅助函数（已存在，这里是为了完整性）
function calculateAverageM(array) {
    if (!array || array.length === 0) return 0;
    
    const validValues = array.filter(val => val !== null && val !== undefined && !isNaN(val));
    
    if (validValues.length === 0) return 0;
    
    const sum = validValues.reduce((total, val) => total + Number(val), 0);
    return sum / validValues.length;
}

// 计算排名的辅助函数
function calculateRanking(items, currentId, valueKey) {
    if (!items || items.length === 0 || !currentId || !valueKey) return { rank: 0, total: 0 };
    
    // 过滤有效数据并按值从大到小排序
    const validItems = items
        .filter(item => item[valueKey] !== null && item[valueKey] !== undefined)
        .sort((a, b) => b[valueKey] - a[valueKey]);
    
    // 查找当前RM的排名
    const index = validItems.findIndex(item => item.RM_ID === currentId);
    const rank = index !== -1 ? index + 1 : 0;
    
    return {
        rank,
        total: validItems.length,
        percentile: validItems.length > 0 ? ((validItems.length - rank) / validItems.length * 100).toFixed(1) : 0
    };
}

// 添加计算业绩评级的辅助函数
function calculatePerformanceRating(rmData, selectedRM, type) {
    if (!selectedRM || !rmData || rmData.length === 0) {
        return { rating: 'unknown', text: '未知' };
    }
    
    const group = selectedRM.cust_aum_scale_group;
    const sameGroupRMs = rmData.filter(rm => rm.cust_aum_scale_group === group);
    
    let sortedRMs, rank, total;
    
    if (type === 'revenue') {
        // 收入评级
        sortedRMs = [...sameGroupRMs].sort((a, b) => b.RM_Rev_todate - a.RM_Rev_todate);
        rank = sortedRMs.findIndex(rm => rm.RM_ID === selectedRM.RM_ID) + 1;
    } else {
        // 规模评级
        sortedRMs = [...sameGroupRMs].sort((a, b) => b.RM_Yaum_2025 - a.RM_Yaum_2025);
        rank = sortedRMs.findIndex(rm => rm.RM_ID === selectedRM.RM_ID) + 1;
    }
    
    total = sameGroupRMs.length;
    const percentile = (rank / total) * 100;
    
    let rating, text;
    if (percentile <= 20) {
        rating = 'excellent';
        text = '优秀';
    } else if (percentile <= 40) {
        rating = 'good';
        text = '良好';
    } else if (percentile <= 70) {
        rating = 'average';
        text = '一般';
    } else {
        rating = 'poor';
        text = '差';
    }
    
    return { 
        rating, 
        text,
        rank,
        total,
        percentile: (100 - percentile).toFixed(1)
    };
}

// 添加计算详细排名信息的辅助函数
function calculateDetailedRanking(items, currentId, valueKey, label) {
    if (!items || items.length === 0 || !currentId || !valueKey) {
        return { rank: 0, total: 0, percentile: '0.0' };
    }
    
    const validItems = items
        .filter(item => item[valueKey] !== null && item[valueKey] !== undefined)
        .sort((a, b) => b[valueKey] - a[valueKey]);
    
    const index = validItems.findIndex(item => item.RM_ID === currentId);
    const rank = index !== -1 ? index + 1 : 0;
    const total = validItems.length;
    
    // 找出当前RM前后的理财经理，提供更详细的排名情况
    const currentValue = validItems.find(item => item.RM_ID === currentId)?.[valueKey] || 0;
    
    // 前一名的RM
    let previousRM = null;
    if (index > 0) {
        previousRM = {
            id: validItems[index - 1].RM_ID,
            value: validItems[index - 1][valueKey],
            gap: validItems[index - 1][valueKey] - currentValue
        };
    }
    
    // 后一名的RM
    let nextRM = null;
    if (index !== -1 && index < validItems.length - 1) {
        nextRM = {
            id: validItems[index + 1].RM_ID,
            value: validItems[index + 1][valueKey],
            gap: currentValue - validItems[index + 1][valueKey]
        };
    }
    
    // 计算与前后的差距百分比
    if (previousRM && currentValue > 0) {
        previousRM.gapPercent = (previousRM.gap / currentValue * 100).toFixed(1);
    }
    
    if (nextRM && nextRM.value > 0) {
        nextRM.gapPercent = (nextRM.gap / nextRM.value * 100).toFixed(1);
    }
    
    return {
        rank,
        total,
        percentile: total > 0 ? ((total - rank) / total * 100).toFixed(1) : '0.0',
        label,
        currentValue,
        previousRM,
        nextRM,
        isTopRanked: rank === 1,
        isBottomRanked: rank === total
    };
}

// 以下是从moduleB1和moduleB2中导入的数据获取函数
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
// 构建完整的提示语
function buildFullPrompt(question, contextInfo, selectedRM) {
    return `
你是一位优秀的银行理财经理助手，现在需要为RM_ID为"${selectedRM.RM_ID}"的理财经理回答问题。
以下是该理财经理的基本情况:

1. 基本信息:
   - RM_ID: ${contextInfo.baseInfo.rmId}
   - 所属组别: ${contextInfo.baseInfo.group}
   - 管理客户数: ${contextInfo.baseInfo.custNum}人
   - 收入完成值: ${contextInfo.baseInfo.income}万元
   - 规模完成值: ${contextInfo.baseInfo.aum}亿元

2. 收入结构:
   - 总收入: ${formatCurrency(contextInfo.revenueInfo.total)}
   - 公司收入: ${formatCurrency(contextInfo.revenueInfo.companyRevenue)} (${calculatePercentage(contextInfo.revenueInfo.companyRevenue, contextInfo.revenueInfo.total)}%)
   - 零售信贷收入: ${formatCurrency(contextInfo.revenueInfo.retailCreditRevenue)} (${calculatePercentage(contextInfo.revenueInfo.retailCreditRevenue, contextInfo.revenueInfo.total)}%)
   - 存款FTP: ${formatCurrency(contextInfo.revenueInfo.depositFTPRevenue)} (${calculatePercentage(contextInfo.revenueInfo.depositFTPRevenue, contextInfo.revenueInfo.total)}%)
   - 中间业务收入: ${formatCurrency(contextInfo.revenueInfo.intermediaryRevenue)} (${calculatePercentage(contextInfo.revenueInfo.intermediaryRevenue, contextInfo.revenueInfo.total)}%)

3. 规模结构:
   - 理财AUM: ${formatCurrency(contextInfo.aumInfo.wealthManagement)}
   - 基金AUM: ${formatCurrency(contextInfo.aumInfo.fund)}
   - 保险AUM: ${formatCurrency(contextInfo.aumInfo.insurance)}
   - 存款AUM: ${formatCurrency(contextInfo.aumInfo.deposit)}

4. KPI完成情况:
   - 收入序时进度: ${formatPercent(contextInfo.kpiInfo.revTimeProgress)}%
   - 收入整体进度: ${formatPercent(contextInfo.kpiInfo.revOverallProgress)}%
   - 规模序时进度: ${formatPercent(contextInfo.kpiInfo.aumTimeProgress)}%
   - 规模整体进度: ${formatPercent(contextInfo.kpiInfo.aumOverallProgress)}%

5. 排名情况:
   - 收入排名: 第${contextInfo.incomeRanking.rank}/${contextInfo.incomeRanking.total}位，超过${contextInfo.incomeRanking.percentile}%的同组理财经理
   - 规模排名: 第${contextInfo.aumRanking.rank}/${contextInfo.aumRanking.total}位，超过${contextInfo.aumRanking.percentile}%的同组理财经理

6. 中间业务详情:
   - 理财收入: ${formatCurrency(contextInfo.intermediaryInfo.wealthManagementRevenue)}，客户数: ${contextInfo.intermediaryInfo.wealthManagementCustomers}，万元收益率: ${formatPercent(contextInfo.intermediaryInfo.wealthManagementYield)}
   - 基金收入: ${formatCurrency(contextInfo.intermediaryInfo.fundRevenue)}，客户数: ${contextInfo.intermediaryInfo.fundCustomers}，万元收益率: ${formatPercent(contextInfo.intermediaryInfo.fundYield)}
   - 保险收入: ${formatCurrency(contextInfo.intermediaryInfo.insuranceRevenue)}，客户数: ${contextInfo.intermediaryInfo.insuranceCustomers}，万元收益率: ${formatPercent(contextInfo.intermediaryInfo.insuranceYield)}

7. 存款业务详情:
   - 总存款收入: ${formatCurrency(contextInfo.depositInfo.totalDeposit)}
   - 活期存款: ${formatCurrency(contextInfo.depositInfo.currentDeposit)}
   - 定期存款: ${formatCurrency(contextInfo.depositInfo.timeDeposit)}
   - 存款客户数: ${contextInfo.depositInfo.depositCustomers}
   - 存款万元收益率: ${formatPercent(contextInfo.depositInfo.depositYield)}

8. 信贷业务详情:
   - 总信贷收入: ${formatCurrency(contextInfo.creditInfo.totalCredit)}
   - 最近月信贷收入: ${formatCurrency(contextInfo.creditInfo.latestCreditRevenue)}
   - 信贷客户数: ${contextInfo.creditInfo.creditCustomers}
   - 信贷规模: ${formatCurrency(contextInfo.creditInfo.creditScale)}

9. 对公业务详情:
   - 总对公收入: ${formatCurrency(contextInfo.corporateInfo.totalCorporate)}
   - 最近月对公收入: ${formatCurrency(contextInfo.corporateInfo.latestCorporateRevenue)}

10. 月度收入趋势(最近6个月):
   - 数值: ${contextInfo.monthlyTrends.totalRevenue.slice(-6).map(item => formatCurrency(item)).join(', ')}
   
11. AUM变化原因分析:
   - 期初AUM: ${formatCurrency(contextInfo.aumChangeInfo.initialAum)}
   - 期末AUM: ${formatCurrency(contextInfo.aumChangeInfo.finalAum)}
   - 总变化: ${formatCurrency(contextInfo.aumChangeInfo.totalChange)} (${formatPercent(contextInfo.aumChangeInfo.changePercent)}%)
   - 主要正向贡献: ${contextInfo.aumChangeInfo.maxPositiveGroup || '无'} (${formatCurrency(contextInfo.aumChangeInfo.maxPositiveChange)})
   - 主要负向影响: ${contextInfo.aumChangeInfo.maxNegativeGroup || '无'} (${formatCurrency(contextInfo.aumChangeInfo.maxNegativeChange)})

12. 客户层级迁移情况:
   - 总客户数: ${contextInfo.aumTransferInfo.totalCustomers}人
   - 层级稳定客户: ${contextInfo.aumTransferInfo.stableCustomers}人 (${formatPercent(contextInfo.aumTransferInfo.stablePercent)}%)
   - 层级上升客户: ${contextInfo.aumTransferInfo.upgradedCustomers}人 (${formatPercent(contextInfo.aumTransferInfo.upgradedPercent)}%)
   - 层级下降客户: ${contextInfo.aumTransferInfo.downgradedCustomers}人 (${formatPercent(contextInfo.aumTransferInfo.downgradedPercent)}%)

13. AUM流失分布:
   - 流失客户数: ${contextInfo.aumLossInfo.totalLossCustomers}人
   - 总流失金额: ${formatCurrency(contextInfo.aumLossInfo.totalLossAmount)}
   - Top 10%流失客户贡献: ${formatPercent(contextInfo.aumLossInfo.top10PercentShare)}%的总流失金额

14. 客户层级AUM增速表现:
   - 增速最高层级: ${contextInfo.tierGrowthInfo.highestGrowthTier || '无'} (${formatPercent(contextInfo.tierGrowthInfo.highestGrowthRate * 100)}%)
   - 增速最低层级: ${contextInfo.tierGrowthInfo.lowestGrowthTier || '无'} (${formatPercent(contextInfo.tierGrowthInfo.lowestGrowthRate * 100)}%)

基于以上信息，请简明专业地回答以下问题，控制在300字以内：${question}

注意:
1. 回答要精准、专业，语气友好
2. 直接给出答案，不要引用"根据提供的信息"等词句
3. 如果无法回答，请说明需要进一步的数据支持
4. 可以提供简单的改进建议，但要基于数据事实
5. 答案应当直奔主题，简明扼要
6. 善用数据分析，找出数据中的趋势和特点
7. 如果问题涉及某个具体业务板块，请重点使用该板块的详细数据
`;
}

// 格式化AI响应
function formatAIResponse(response) {
    if (!response) return '无法获取回答，请稍后再试。';
    
    // 替换换行符为<br>标签
    return response.replace(/\n/g, '<br>');
}

function formatNumber(value) {
    return Number(value).toLocaleString('zh-CN', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });
}

// HTML转义函数（安全处理用户输入）
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 计算百分比的辅助函数
function calculatePercentage(part, total) {
    if (!total || total <= 0) return '0.0';
    return ((part / total) * 100).toFixed(1);
}