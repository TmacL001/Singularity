/**
 * 展示分析结果
 * @param {string} analysisResult - 从ChatGPT API获取的分析结果
 */
// 删除不完整的 console.log
/**
 * rmAnalysisSummary.js - RM综合分析点评模块（重构版）
 * 
 * 该模块根据多维度数据表进行细化分析，涵盖收入评价、规模评价、收入结构、
 * 中间业务、存款业务、信贷业务、对公业务、规模归因和客户经营等维度
 */

import { callChatGpt } from './chatGptService.js';

// 全局变量
let mainContainer = null;
let currentRmId = null;
let summarySection = null;

/**
 * 初始化综合分析点评模块
 * @param {Object} selectedRM - 当前选中的理财经理数据
 * @param {Array} rmData - 所有理财经理的数据
 * @param {Array} rmCustData - 理财经理客户数据
 * @param {HTMLElement} container - 放置分析结果的容器（选填，默认附加到mainContent）
 */

function formatDateTime(date) {
    return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
}

function padZero(num) {
    return num < 10 ? '0' + num : num;
}

function addSummaryStyles() {
    // 检查样式是否已存在
    if (document.getElementById('rm-analysis-summary-styles')) {
        return; // 避免重复添加
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'rm-analysis-summary-styles';
    styleElement.textContent = `
        .rm-analysis-summary-section {
            margin-bottom: 25px;
        }
        
        .summary-card {
            background-color: var(--card-bg, rgba(15, 37, 55, 0.8));
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(63, 162, 233, 0.2);
            overflow: visible;
        }
        
        .generate-button {
            background: linear-gradient(135deg, rgba(63, 162, 233, 0.2), rgba(63, 162, 233, 0.05));
            color: var(--highlight-bg, #3fa2e9);
            border: 1px solid rgba(63, 162, 233, 0.3);
            border-radius: 8px;
            padding: 12px 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s;
            font-size: 15px;
            margin: 20px auto;
            width: fit-content;
        }
        
        .generate-button:hover {
            background: linear-gradient(135deg, rgba(63, 162, 233, 0.3), rgba(63, 162, 233, 0.1));
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(63, 162, 233, 0.2);
        }
        
        .summary-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 30px;
            color: var(--text-color, #e0e0e0);
        }
        
        .summary-spinner {
            width: 50px;
            height: 50px;
            border: 5px solid rgba(63, 162, 233, 0.3);
            border-radius: 50%;
            border-top-color: var(--highlight-bg, #3fa2e9);
            animation: spin 1s linear infinite;
            margin-bottom: 15px;
        }
        
        .summary-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 30px;
            color: #F44336;
            text-align: center;
        }
        
        .summary-error i {
            font-size: 40px;
            margin-bottom: 15px;
        }
        
        .error-details {
            font-size: 14px;
            margin-bottom: 20px;
            color: #bbbbbb;
        }
        
        .retry-button {
            background-color: rgba(244, 67, 54, 0.1);
            color: #F44336;
            border: 1px solid rgba(244, 67, 54, 0.3);
            border-radius: 6px;
            padding: 8px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
        }
        
        .retry-button:hover {
            background-color: rgba(244, 67, 54, 0.2);
        }
        
        .summary-result {
            padding: 20px;
            color: var(--text-color, #e0e0e0);
            line-height: 1.6;
        }
        
        .analysis-section-title {
            font-size: 16px;
            color: var(--text-color, #e0e0e0);
            margin-top: 20px;
            margin-bottom: 10px;
            font-weight: bold;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(63, 162, 233, 0.2);
        }
        
        .analysis-section-content {
            font-size: 15px;
            color: #ddd;
            margin-bottom: 15px;
            line-height: 1.8;
            padding-left: 15px;
            text-align: justify;
        }
        
            .star-rating {
            display: inline-flex;
            align-items: center;
            margin-left: 12px;
            padding: 4px 12px;
            background: linear-gradient(135deg, rgba(15, 37, 55, 0.8), rgba(25, 47, 65, 0.9));
            border-radius: 20px;
            border: 1px solid rgba(63, 162, 233, 0.3);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2),
                        inset 0 1px 2px rgba(255, 255, 255, 0.1);
        }
        
        .star-rating .star {
            font-size: 18px;
            margin: 0 2px;
            transform: translateY(-1px);
        }
        
        .star-rating .filled-star {
            background: linear-gradient(45deg, #00ffff, #3fa2e9);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 0 8px rgba(63, 162, 233, 0.5),
                        0 0 16px rgba(0, 255, 255, 0.3);
            display: inline-block;
            animation: starGlow 2s infinite alternate;
        }
        
        .star-rating .empty-star {
            color: rgba(63, 162, 233, 0.3);
            text-shadow: 0 0 3px rgba(63, 162, 233, 0.2);
        }
        
        @keyframes starGlow {
            0% {
                filter: brightness(1);
                text-shadow: 0 0 8px rgba(63, 162, 233, 0.5),
                           0 0 16px rgba(0, 255, 255, 0.3);
            }
            100% {
                filter: brightness(1.2);
                text-shadow: 0 0 12px rgba(63, 162, 233, 0.7),
                           0 0 24px rgba(0, 255, 255, 0.5);
            }
        }

         // 添加鼠标悬停效果
        .star-rating:hover {
            background: linear-gradient(135deg, rgba(25, 47, 65, 0.9), rgba(35, 57, 75, 1));
            border-color: rgba(63, 162, 233, 0.5);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3),
                        inset 0 1px 3px rgba(255, 255, 255, 0.15),
                        0 0 20px rgba(63, 162, 233, 0.1);
            transform: translateY(-1px);
            transition: all 0.3s ease;
        }

        // 为每个星级添加特定的颜色主题
        .star-rating[data-score="5"] .filled-star {
            background: linear-gradient(45deg, #FFD700, #FFA500);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 0 8px rgba(255, 215, 0, 0.5),
                        0 0 16px rgba(255, 165, 0, 0.3);
        }
        
        .star-rating[data-score="4"] .filled-star {
            background: linear-gradient(45deg, #3fa2e9, #00bfff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .star-rating[data-score="3"] .filled-star {
            background: linear-gradient(45deg, #90EE90, #32CD32);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
            .star-rating[data-score="2"] .filled-star {
            background: linear-gradient(45deg, #FFA07A, #FF6347);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .star-rating[data-score="1"] .filled-star {
            background: linear-gradient(45deg, #DC143C, #8B0000);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }


        .summary-timestamp {
            font-size: 12px;
            color: #888;
            text-align: right;
            padding: 0 20px 15px;
            font-style: italic;
        }
        
        .summary-actions {
            display: flex;
            justify-content: flex-end;
            padding: 0 20px 20px;
        }
        
        .action-button {
            background-color: rgba(63, 162, 233, 0.1);
            color: var(--highlight-bg, #3fa2e9);
            border: 1px solid rgba(63, 162, 233, 0.3);
            border-radius: 6px;
            padding: 8px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
        }
        
        .action-button:hover {
            background-color: rgba(63, 162, 233, 0.2);
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    
    document.head.appendChild(styleElement);
}

function generateAnalysisPrompt(analysisData) {
    const { baseInfo } = analysisData;
    
    // 格式化金额的辅助函数
    const formatMoney = (value) => {
        return Number(value).toLocaleString('zh-CN', { 
            minimumFractionDigits: 1, 
            maximumFractionDigits: 1
        });
    };
    
    // 构建提示文本
    let prompt = `
你是一位专业的银行理财经理业绩分析师，现在需要为RM_ID为"${baseInfo.rmId}"的理财经理提供一份多维度综合业绩分析。
请基于以下多个维度的数据，生成一份专业、全面、有洞见的分析报告：

### 基本信息
- RM_ID: ${baseInfo.rmId}
- 管户规模组: ${baseInfo.group}
- 管理客户数: ${baseInfo.custNums}人
- 同组理财经理总数: ${baseInfo.groupTotalRMs}人
`;

    // 添加B1.1 收入评价 - 任务完成情况
    if (analysisData.incomePerformanceAnalysis) {
        const incomePerf = analysisData.incomePerformanceAnalysis;
        prompt += `
### 1. 收入评价 - 任务完成情况
- 当前累计收入: ${formatMoney(incomePerf.currentRevenue)}万元
- 序时进度(RR1): ${incomePerf.rr1}%
- 整体进度(RR2): ${incomePerf.rr2}%
- 进度评估: ${incomePerf.assessment}
- 评分: ${incomePerf.score}分
`;
    }

    // 添加B1.2 收入评价 - 同组排名
    if (analysisData.incomeRankingAnalysis) {
        const incomeRank = analysisData.incomeRankingAnalysis;
        prompt += `
### 2. 收入评价 - 同组排名
- 收入排名: 第${incomeRank.rank}/${incomeRank.total}名 (${incomeRank.percentile}%)
- 排名分级: ${incomeRank.grade}
- 收入与组均值对比: ${incomeRank.comparisonToAverage > 0 ? '高于' : '低于'}平均值${Math.abs(incomeRank.comparisonToAverage).toFixed(1)}%
- 评分: ${incomeRank.score}分
`;
    }

    // 添加B1.3 收入趋势
    if (analysisData.incomeTrendAnalysis) {
        const incomeTrend = analysisData.incomeTrendAnalysis;
        prompt += `
### 3. 收入趋势
- 收入趋势: ${incomeTrend.trend}
- 波动率: ${incomeTrend.volatility}%
- 连续增长月数: ${incomeTrend.consecutiveGrowthMonths}个月
- 最高/平均收入比: ${incomeTrend.maxToAvgRatio}
- 评分: ${incomeTrend.score}分
`;
    }

    // 添加B2.1 规模评价 - 任务完成情况
    if (analysisData.aumPerformanceAnalysis) {
        const aumPerf = analysisData.aumPerformanceAnalysis;
        prompt += `
### 4. 规模评价 - 任务完成情况
- 当前AUM: ${formatMoney(aumPerf.currentAum)}亿元
- 序时进度(RR1): ${aumPerf.rr1}%
- 整体进度(RR2): ${aumPerf.rr2}%
- 进度评估: ${aumPerf.assessment}
- 评分: ${aumPerf.score}分
`;
    }

    // 添加B2.2 规模评价 - 同组排名
    if (analysisData.aumRankingAnalysis) {
        const aumRank = analysisData.aumRankingAnalysis;
        prompt += `
### 5. 规模评价 - 同组排名
- AUM排名: 第${aumRank.rank}/${aumRank.total}名 (${aumRank.percentile}%)
- 排名分级: ${aumRank.grade}
- AUM与组均值对比: ${aumRank.comparisonToAverage > 0 ? '高于' : '低于'}平均值${Math.abs(aumRank.comparisonToAverage).toFixed(1)}%
- 评分: ${aumRank.score}分
`;
    }

    // 添加B2.3 规模趋势
    if (analysisData.aumTrendAnalysis) {
        const aumTrend = analysisData.aumTrendAnalysis;
        prompt += `
### 6. 规模趋势
- AUM趋势: ${aumTrend.trend}
- 波动率: ${aumTrend.volatility}%
- 最高/平均AUM比: ${aumTrend.maxToAvgRatio}
- 评分: ${aumTrend.score}分
`;
    }

    // 添加C1.1 收入结构分析
    if (analysisData.incomeStructureAnalysis) {
        const incomeStructure = analysisData.incomeStructureAnalysis;
        prompt += `
### 7. 收入结构
- 对公业务占比: ${incomeStructure.corporate.percent}%
- 零售信贷占比: ${incomeStructure.retail.percent}%
- 存款FTP占比: ${incomeStructure.deposit.percent}%
- 中间业务占比: ${incomeStructure.intermediary.percent}%
- 主要收入来源: ${incomeStructure.mainSource}
- 收入来源稳定性: ${incomeStructure.stability}
- 评分: ${incomeStructure.score}分
`;
    }

    // 添加C1.2 收入分解分析
    if (analysisData.incomeBreakdownAnalysis) {
        const incomeBreakdown = analysisData.incomeBreakdownAnalysis;
        prompt += `
### 8. 收入分解
- 对公收入占比: ${incomeBreakdown.corporate.percent}%
- 信贷收入占比: ${incomeBreakdown.credit.percent}%
- 存款收入占比: ${incomeBreakdown.deposit.percent}% (活期${incomeBreakdown.currentDeposit.percent}%/定期${incomeBreakdown.timeDeposit.percent}%)
- 中间业务收入占比: ${incomeBreakdown.intermediary.percent}% (理财${incomeBreakdown.wealthManagement.percent}%/基金${incomeBreakdown.fund.percent}%/保险${incomeBreakdown.insurance.percent}%)
- 评分: ${incomeBreakdown.score}分
`;
    }

    // 添加C2.1-C2.4 中间业务分析
    if (analysisData.intermediaryBusinessAnalysis) {
        const intermediary = analysisData.intermediaryBusinessAnalysis;
        prompt += `
### 9. 中间业务分析
- 中间业务收入排名: 第${intermediary.ranking.rank}/${intermediary.ranking.total}名
- 理财产品: 收入${formatMoney(intermediary.wealthManagement.revenue)}万元，客户${intermediary.wealthManagement.customers}人，万元收益${intermediary.wealthManagement.yield}
- 基金产品: 收入${formatMoney(intermediary.fund.revenue)}万元，客户${intermediary.fund.customers}人，万元收益${intermediary.fund.yield}
- 保险产品: 收入${formatMoney(intermediary.insurance.revenue)}万元，客户${intermediary.insurance.customers}人，万元收益${intermediary.insurance.yield}
- 评分: 排名维度${intermediary.scores.rankScore}分，收益维度${intermediary.scores.yieldScore}分
`;
    }

    // 添加C3.1-C3.3 存款业务分析
    if (analysisData.depositBusinessAnalysis) {
        const deposit = analysisData.depositBusinessAnalysis;
        prompt += `
### 10. 存款业务分析
- 存款收入排名: 第${deposit.ranking.rank}/${deposit.ranking.total}名
- 活期存款规模占比: ${deposit.currentDeposit.aumPercent}%
- 活期存款客户占比: ${deposit.currentDeposit.customerPercent}%
- 活期存款收入占比: ${deposit.currentDeposit.revenuePercent}%
- 存款万元收益: ${deposit.yield}
- 评分: ${deposit.score}分
`;
    }

    // 添加C4.1-C4.3 信贷业务分析
    if (analysisData.creditBusinessAnalysis) {
        const credit = analysisData.creditBusinessAnalysis;
        prompt += `
### 11. 信贷业务分析
- 信贷收入排名: 第${credit.ranking.rank}/${credit.ranking.total}名
- 信贷规模占比: ${credit.structure.aumPercent}%
- 信贷客户占比: ${credit.structure.customerPercent}%
- 信贷收入占总收入比: ${credit.trend.revenuePercent}%
- 信贷收入趋势: ${credit.trend.trend}
- 评分: ${credit.score}分
`;
    }

    // 添加C5.1-C5.2 对公业务分析
    if (analysisData.corporateBusinessAnalysis) {
        const corporate = analysisData.corporateBusinessAnalysis;
        prompt += `
### 12. 对公业务分析
- 对公收入排名: 第${corporate.ranking.rank}/${corporate.ranking.total}名
- 对公收入占总收入比: ${corporate.structure.revenuePercent}%
- 对公收入趋势: ${corporate.structure.trend}
- 评分: ${corporate.score}分
`;
    }

    // 添加D1-D4 规模归因分析
    if (analysisData.aumAttributionAnalysis) {
        const aumAttribution = analysisData.aumAttributionAnalysis;
        prompt += `
### 13. 规模归因分析
- AUM变化: ${formatMoney(aumAttribution.aumChange)}元
- 正向变化(升级+新客): ${aumAttribution.positiveChange.percent}%
- 负向变化(降级+流失): ${aumAttribution.negativeChange.percent}%
- 客户层级变化: 升级${aumAttribution.upgradedCustomers}人，稳定${aumAttribution.stableCustomers}人，降级${aumAttribution.downgradedCustomers}人
- 评分: ${aumAttribution.score}分
`;
    }

    // 添加E1-E6 客户经营分析
    if (analysisData.customerOperationAnalysis) {
        const customerOps = analysisData.customerOperationAnalysis;
        prompt += `
### 14. 客户经营分析
- 高价值客户占比: ${customerOps.highValueCustomers.percent}%
- 客户结构健康度: ${customerOps.customerStructureHealth}
- ROA表现: 高ROA客户${customerOps.highROACustomers.percent}%，低ROA客户${customerOps.lowROACustomers.percent}%
- 优质客户(高ROA+增长): ${customerOps.premiumCustomers.percent}%
- 评分: ${customerOps.score}分
`;
    }

    prompt += `
请基于以上多维度数据，提供详细的专业分析报告，需要涵盖以下内容：

分析要求：
1. 对每个数据维度进行详细点评，严格按照各维度的分析要求进行评估
2. 每个维度使用★★★★★五星评分展示（使用实心★和空心☆表示）
3. 点评内容要包含数据分析、结果解读、问题诊断等
4. 避免使用特殊符号（如#、*、序号等）
5. 使用清晰的层级结构，直接用维度名称作为标题
6. 每个维度分析完成后要空一行，确保段落清晰
7. 如果内容较长，请在每个主要维度间适当分段
8. 重要：不允许只输出标题和星级，必须有详细的分析内容！
9. 重要：星级必须与明确提到的评分相对应（1分=★☆☆☆☆，2分=★★☆☆☆，3分=★★★☆☆，4分=★★★★☆，5分=★★★★★）

分析格式示例：
收入评价 - 任务完成情况 ★★★★☆
评估该理财经理的收入绝对值为XXX万元，序时进度达到XX%，整体进度达到XX%，表现为达成目标。在同组中处于相对较好水平。评分为4分，进度超前主要由于中间业务收入增长较快，显示出较强的产品营销能力。收入达成表现较为稳定，未见明显波动风险。

具体分析维度包括：
收入评价 - 任务完成情况
收入评价 - 同组排名
收入趋势
规模评价 - 任务完成情况
规模评价 - 同组排名
规模趋势
收入结构
收入分解
中间业务分析
存款业务分析
信贷业务分析
对公业务分析
规模归因分析
客户经营分析

请确保完整分析所有维度，不要遗漏任何一个。不要使用序号标记维度。
`;

    return prompt;
}

export async function initRmAnalysisSummary(selectedRM, rmData, rmCustData, container = null) {
    // 如果container参数不存在，默认使用mainContent
    mainContainer = container || document.getElementById('mainContent');
    if (!mainContainer) {
        console.error('Error: 找不到目标容器元素');
        return;
    }
    
    currentRmId = selectedRM.RM_ID;
    
    // 检查是否已存在分析部分，如存在则移除
    removeExistingSummary();
    
    // 创建分析部分结构
    createSummarySection();

    // 显示生成按钮而不是直接生成分析
    showGenerateButton(selectedRM, rmData, rmCustData);

    // 添加CSS样式
    addSummaryStyles();
    
   // 不自动开始生成分析，等待用户点击按钮
   console.log('RM综合分析点评初始化完成');
}

function showGenerateButton(selectedRM, rmData, rmCustData) {
    const contentContainer = document.getElementById('summaryContent');
    if (contentContainer) {
        contentContainer.innerHTML = `
            <button id="generateAnalysisBtn" class="generate-button">
                <i class="fas fa-brain"></i> 生成大模型点评
            </button>
        `;
        
        // 绑定按钮点击事件
        document.getElementById('generateAnalysisBtn').addEventListener('click', async function() {
            this.disabled = true; // 防止重复点击
            await generateAnalysisNew(selectedRM, rmData, rmCustData);
        });
    }
}

async function generateAnalysisNew(selectedRM, rmData, rmCustData) {
    // 显示加载状态
    showLoadingState();
    
    try {
        // 收集所有维度的数据
        const analysisData = collectMultiDimensionalData(selectedRM, rmData, rmCustData);
        
        // 分批进行分析
        const batchedResults = await performBatchedAnalysis(analysisData);
        
        // 合并并展示结果
        const combinedResult = batchedResults.join('\n\n');
        displayAnalysisResult(combinedResult);
        
        console.log('RM综合分析点评加载完成');
    } catch (error) {
        handleError(error);
    }
}

/**
 * 分批进行分析
 * @param {Object} analysisData - 所有分析数据
 * @returns {Promise<string[]>} - 分批分析结果数组
 */
async function performBatchedAnalysis(analysisData) {
    const batches = [
        // 批次1：收入评价
        {
            name: '收入评价',
            dimensions: ['incomePerformanceAnalysis', 'incomeRankingAnalysis', 'incomeTrendAnalysis']
        },
        // 批次2：规模评价
        {
            name: '规模评价',
            dimensions: ['aumPerformanceAnalysis', 'aumRankingAnalysis', 'aumTrendAnalysis']
        },
        // 批次3：收入结构
        {
            name: '收入结构',
            dimensions: ['incomeStructureAnalysis', 'incomeBreakdownAnalysis']
        },
        // 批次4：业务分析1
        {
            name: '中间业务分析 & 存款业务分析',
            dimensions: ['intermediaryBusinessAnalysis', 'depositBusinessAnalysis']
        },
        // 批次5：业务分析2
        {
            name: '信贷业务分析 & 对公业务分析',
            dimensions: ['creditBusinessAnalysis', 'corporateBusinessAnalysis']
        },
        // 批次6：综合分析
        {
            name: '规模&收入归因分析 & 客户经营分析',
            dimensions: ['aumAttributionAnalysis', 'customerOperationAnalysis']
        }
    ];
    
    const results = [];
    
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        updateLoadingProgress(`正在分析${batch.name}... (${i + 1}/${batches.length})`);
        
        const batchPrompt = generateBatchPrompt(analysisData, batch.dimensions);
        
        let batchResult = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        // 添加重试机制，确保获取完整响应
        while (!batchResult && retryCount < maxRetries) {
            try {
                batchResult = await callChatGptWithRetry(batchPrompt, 45000); // 增加超时时间到45秒
                
                // 验证结果是否完整
                if (batchResult && batchResult.length > 0) {
                    // 确保每个维度都有分析内容（不仅仅是星级评分）
                    const hasContent = batch.dimensions.every(dim => {
                        const dimName = getDimensionDisplayName(dim);
                        // 查找维度名称和其后的内容
                        const dimIndex = batchResult.indexOf(dimName);
                        if (dimIndex === -1) return false;
                        
                        // 查找下一个维度的位置
                        const nextDimIndex = batchResult.indexOf('**', dimIndex + dimName.length);
                        
                        // 如果没有下一个维度，则检查到结尾的内容
                        const contentLength = nextDimIndex === -1 ? 
                            batchResult.slice(dimIndex + dimName.length).length :
                            nextDimIndex - (dimIndex + dimName.length);
                        
                        // 确保有足够的内容（比如至少100个字符表示分析内容）
                        return contentLength > 50;
                    });
                    
                    if (!hasContent) {
                        console.log(`批次 ${batch.name} 结果不完整，重试中...`);
                        batchResult = null;
                        retryCount++;
                        await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒再重试
                    }
                } else {
                    retryCount++;
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } catch (error) {
                console.error(`批次 ${batch.name} 分析失败:`, error);
                retryCount++;
                if (retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
        
        if (batchResult) {
            results.push(batchResult);
        } else {
            // 如果多次重试仍失败，添加错误信息
            results.push(`**${batch.name}分析未能成功生成** \n\n由于API响应问题，本批次分析未能完成。请点击重试按钮重新生成。`);
        }
    }
    
    return results;
}


// 获取维度显示名称的辅助函数
function getDimensionDisplayName(dimensionKey) {
    const nameMap = {
        'incomePerformanceAnalysis': '收入评价 - 任务完成情况',
        'incomeRankingAnalysis': '收入评价 - 同组排名',
        'incomeTrendAnalysis': '收入趋势',
        'aumPerformanceAnalysis': '规模评价 - 任务完成情况',
        'aumRankingAnalysis': '规模评价 - 同组排名',
        'aumTrendAnalysis': '规模趋势',
        'incomeStructureAnalysis': '收入结构',
        'incomeBreakdownAnalysis': '收入分解',
        'intermediaryBusinessAnalysis': '中间业务分析',
        'depositBusinessAnalysis': '存款业务分析',
        'creditBusinessAnalysis': '信贷业务分析',
        'corporateBusinessAnalysis': '对公业务分析',
        'aumAttributionAnalysis': '规模归因分析',
        'customerOperationAnalysis': '客户经营分析'
    };
    return nameMap[dimensionKey] || dimensionKey;
}

/**
 * 生成单批次的提示文本
 * @param {Object} analysisData - 所有分析数据
 * @param {string[]} dimensions - 本批次要包含的维度
 * @returns {string} - 批次提示文本
 */
function generateBatchPrompt(analysisData, dimensions) {
    const { baseInfo } = analysisData;
    
    // 格式化金额的辅助函数
      const formatMoney = (value, unit) => {
        if (unit === '亿元') {
            // AUM转换为亿元
            return (Number(value) / 100000000).toFixed(1);
        } else if (unit === '万元') {
            // 收入直接以万元显示
            return (Number(value) / 10000).toFixed(1);
        }
        return Number(value).toLocaleString('zh-CN', { 
            minimumFractionDigits: 1, 
            maximumFractionDigits: 1
        });
    };
    
    // 构建提示文本
    let prompt = `
你是一位专业的银行理财经理业绩分析师，现在需要为RM_ID为"${baseInfo.rmId}"的理财经理提供特定维度的分析。
请基于以下数据，对指定维度进行专业分析：

### 基本信息
- RM_ID: ${baseInfo.rmId}
- 管户规模组: ${baseInfo.group}
- 管理客户数: ${baseInfo.custNums}人
- 同组理财经理总数: ${baseInfo.groupTotalRMs}人
`;

    // 添加本批次需要分析的维度数据
    dimensions.forEach(dimension => {
        // B1.1 收入评价 - 任务完成情况
        if (dimension === 'incomePerformanceAnalysis' && analysisData.incomePerformanceAnalysis) {
            const incomePerf = analysisData.incomePerformanceAnalysis;
            prompt += `
### 1. 收入评价 - 任务完成情况
- 当前累计收入: ${formatMoney(incomePerf.currentRevenue, '万元')}万元
- 序时进度(RR1): ${incomePerf.rr1}%
- 整体进度(RR2): ${incomePerf.rr2}%
- 进度评估: ${incomePerf.assessment}
- 评分: ${incomePerf.score}分
`;
        }
        
        // B1.2 收入评价 - 同组排名
        if (dimension === 'incomeRankingAnalysis' && analysisData.incomeRankingAnalysis) {
            const incomeRank = analysisData.incomeRankingAnalysis;
            prompt += `
### 2. 收入评价 - 同组排名
- 收入排名: 第${incomeRank.rank}/${incomeRank.total}名 (${incomeRank.percentile}%)
- 排名分级: ${incomeRank.grade}
- 收入与组均值对比: ${incomeRank.comparisonToAverage > 0 ? '高于' : '低于'}平均值${Math.abs(incomeRank.comparisonToAverage).toFixed(1)}%
- 评分: ${incomeRank.score}分
`;
        }
        
        // B1.3 收入趋势
        if (dimension === 'incomeTrendAnalysis' && analysisData.incomeTrendAnalysis) {
            const incomeTrend = analysisData.incomeTrendAnalysis;
            prompt += `
### 3. 收入趋势
- 收入趋势: ${incomeTrend.trend}
- 波动率: ${incomeTrend.volatility}%
- 连续增长月数: ${incomeTrend.consecutiveGrowthMonths}个月
- 最高/平均收入比: ${incomeTrend.maxToAvgRatio}
- 评分: ${incomeTrend.score}分
`;
        }
        
        // B2.1 规模评价 - 任务完成情况
        if (dimension === 'aumPerformanceAnalysis' && analysisData.aumPerformanceAnalysis) {
            const aumPerf = analysisData.aumPerformanceAnalysis;
            prompt += `
### 4. 规模评价 - 任务完成情况
- 当前AUM: ${formatMoney(aumPerf.currentAum, '亿元')}亿元
- 序时进度(RR1): ${aumPerf.rr1}%
- 整体进度(RR2): ${aumPerf.rr2}%
- 进度评估: ${aumPerf.assessment}
- 评分: ${aumPerf.score}分
`;
        }
        
        // B2.2 规模评价 - 同组排名
        if (dimension === 'aumRankingAnalysis' && analysisData.aumRankingAnalysis) {
            const aumRank = analysisData.aumRankingAnalysis;
            prompt += `
### 5. 规模评价 - 同组排名
- AUM排名: 第${aumRank.rank}/${aumRank.total}名 (${aumRank.percentile}%)
- 排名分级: ${aumRank.grade}
- AUM与组均值对比: ${aumRank.comparisonToAverage > 0 ? '高于' : '低于'}平均值${Math.abs(aumRank.comparisonToAverage).toFixed(1)}%
- 评分: ${aumRank.score}分
`;
        }
        
        // B2.3 规模趋势
        if (dimension === 'aumTrendAnalysis' && analysisData.aumTrendAnalysis) {
            const aumTrend = analysisData.aumTrendAnalysis;
            prompt += `
### 6. 规模趋势
- AUM趋势: ${aumTrend.trend}
- 波动率: ${aumTrend.volatility}%
- 最高/平均AUM比: ${aumTrend.maxToAvgRatio}
- 评分: ${aumTrend.score}分
`;
        }
        
        // C1.1 收入结构分析
        if (dimension === 'incomeStructureAnalysis' && analysisData.incomeStructureAnalysis) {
            const incomeStructure = analysisData.incomeStructureAnalysis;
            prompt += `
### 7. 收入结构
- 对公业务占比: ${incomeStructure.corporate.percent}%
- 零售信贷占比: ${incomeStructure.retail.percent}%
- 存款FTP占比: ${incomeStructure.deposit.percent}%
- 中间业务占比: ${incomeStructure.intermediary.percent}%
- 主要收入来源: ${incomeStructure.mainSource}
- 收入来源稳定性: ${incomeStructure.stability}
- 评分: ${incomeStructure.score}分
`;
        }
        
        // C1.2 收入分解分析
        if (dimension === 'incomeBreakdownAnalysis' && analysisData.incomeBreakdownAnalysis) {
            const incomeBreakdown = analysisData.incomeBreakdownAnalysis;
            prompt += `
### 8. 收入分解
- 对公收入占比: ${incomeBreakdown.corporate.percent}%
- 信贷收入占比: ${incomeBreakdown.credit.percent}%
- 存款收入占比: ${incomeBreakdown.deposit.percent}% (活期${incomeBreakdown.currentDeposit.percent}%/定期${incomeBreakdown.timeDeposit.percent}%)
- 中间业务收入占比: ${incomeBreakdown.intermediary.percent}% (理财${incomeBreakdown.wealthManagement.percent}%/基金${incomeBreakdown.fund.percent}%/保险${incomeBreakdown.insurance.percent}%)
- 评分: ${incomeBreakdown.score}分
`;
        }
        

     // C2 中间业务分析
if (dimension === 'intermediaryBusinessAnalysis' && analysisData.intermediaryBusinessAnalysis) {
    const intermediary = analysisData.intermediaryBusinessAnalysis;
    prompt += `
### 9. 中间业务分析
- 中间业务收入排名: 第${intermediary.ranking.rank}/${intermediary.ranking.total}名
- 理财产品: 收入${formatMoney(intermediary.wealthManagement.revenue, '万元')}万元，客户${intermediary.wealthManagement.customers}人，万元收益${intermediary.wealthManagement.yield}
- 基金产品: 收入${formatMoney(intermediary.fund.revenue, '万元')}万元，客户${intermediary.fund.customers}人，万元收益${intermediary.fund.yield}
- 保险产品: 收入${formatMoney(intermediary.insurance.revenue, '万元')}万元，客户${intermediary.insurance.customers}人，万元收益${intermediary.insurance.yield}
- 评分: 排名维度${intermediary.scores.rankScore}分，收益维度${intermediary.scores.yieldScore}分
`;
}
        
        // C3 存款业务分析
        if (dimension === 'depositBusinessAnalysis' && analysisData.depositBusinessAnalysis) {
            const deposit = analysisData.depositBusinessAnalysis;
            prompt += `
### 10. 存款业务分析
- 存款收入排名: 第${deposit.ranking.rank}/${deposit.ranking.total}名
- 活期存款规模占比: ${deposit.currentDeposit.aumPercent}%
- 活期存款客户占比: ${deposit.currentDeposit.customerPercent}%
- 活期存款收入占比: ${deposit.currentDeposit.revenuePercent}%
- 存款万元收益: ${deposit.yield}
- 评分: ${deposit.score}分
`;
        }
        
        // C4 信贷业务分析
        if (dimension === 'creditBusinessAnalysis' && analysisData.creditBusinessAnalysis) {
            const credit = analysisData.creditBusinessAnalysis;
            prompt += `
### 11. 信贷业务分析
- 信贷收入排名: 第${credit.ranking.rank}/${credit.ranking.total}名
- 信贷规模占比: ${credit.structure.aumPercent}%
- 信贷客户占比: ${credit.structure.customerPercent}%
- 信贷收入占总收入比: ${credit.trend.revenuePercent}%
- 信贷收入趋势: ${credit.trend.trend}
- 评分: ${credit.score}分
`;
        }
        
        // C5 对公业务分析
        if (dimension === 'corporateBusinessAnalysis' && analysisData.corporateBusinessAnalysis) {
            const corporate = analysisData.corporateBusinessAnalysis;
            prompt += `
### 12. 对公业务分析
- 对公收入排名: 第${corporate.ranking.rank}/${corporate.ranking.total}名
- 对公收入占总收入比: ${corporate.structure.revenuePercent}%
- 对公收入趋势: ${corporate.structure.trend}
- 评分: ${corporate.score}分
`;
        }
        
        // D 规模归因分析
        if (dimension === 'aumAttributionAnalysis' && analysisData.aumAttributionAnalysis) {
            const aumAttribution = analysisData.aumAttributionAnalysis;
            prompt += `
### 13. 规模归因分析
- AUM变化: ${formatMoney(aumAttribution.aumChange)}元
- 正向变化(升级+新客): ${aumAttribution.positiveChange.percent}%
- 负向变化(降级+流失): ${aumAttribution.negativeChange.percent}%
- 客户层级变化: 升级${aumAttribution.upgradedCustomers}人，稳定${aumAttribution.stableCustomers}人，降级${aumAttribution.downgradedCustomers}人
- 评分: ${aumAttribution.score}分
`;
        }
        
        // E 客户经营分析
        if (dimension === 'customerOperationAnalysis' && analysisData.customerOperationAnalysis) {
            const customerOps = analysisData.customerOperationAnalysis;
            prompt += `
### 14. 客户经营分析
- 高价值客户占比: ${customerOps.highValueCustomers.percent}%
- 客户结构健康度: ${customerOps.customerStructureHealth}
- ROA表现: 高ROA客户${customerOps.highROACustomers.percent}%，低ROA客户${customerOps.lowROACustomers.percent}%
- 优质客户(高ROA+增长): ${customerOps.premiumCustomers.percent}%
- 评分: ${customerOps.score}分
`;
        }
    });

    prompt += `
请对以上维度进行专业分析，严格按照以下格式要求输出：

输出格式【重要】：
1. 每个维度的格式必须是：
   维度名称 ★★★★☆  （根据评分显示对应星级，如：1分=★☆☆☆☆，2分=★★☆☆☆，3分=★★★☆☆，4分=★★★★☆，5分=★★★★★）
   详细分析内容...（换行后写具体分析）

2. 重要要求：
   - 星级评分必须与数据中的"评分"严格对应
   - 维度名称和星级在同一行，星级紧跟在维度名称后面
   - 分析内容在新的一行开始
   - 每个维度之间空一行
   - 收入数据统一使用"万元"作为单位
   - AUM数据统一使用"亿元"作为单位

3. 分析内容必须包括：
   - 数值表现：引用具体数据
   - 业绩评价：好/中/差的判断
   - 原因分析：表现好或差的可能原因
  

示例格式：
收入评价 - 任务完成情况 ★★★★☆
该理财经理的收入绝对值为123.5万元，序时进度达到95%，整体进度达到90%，表现为达成目标。评分为4分，主要因为...

规模评价 - 任务完成情况 ★★★☆☆
当前AUM规模为5.68亿元，序时进度达到85%，整体进度达到82%，接近目标。评分为3分...

请确保所有14个维度都按此格式分析。
`;

    return prompt;
}

/**
 * 更新加载进度显示
 * @param {string} message - 进度消息
 */
function updateLoadingProgress(message) {
    const contentContainer = document.getElementById('summaryContent');
    if (contentContainer) {
        const loadingDiv = contentContainer.querySelector('.summary-loading');
        if (loadingDiv) {
            const progressP = loadingDiv.querySelector('p') || loadingDiv.appendChild(document.createElement('p'));
            progressP.textContent = message;
        }
    }
}

// 带重试的ChatGPT调用
async function callChatGptWithRetry(prompt, timeout = 30000, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await Promise.race([
                callChatGpt(prompt),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('API调用超时')), timeout)
                )
            ]);
        } catch (error) {
            if (i === retries - 1) throw error;
            console.log(`API调用失败，正在重试 (${i + 1}/${retries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒后重试
        }
    }
}

/**
 * 移除已存在的分析部分
 */
function removeExistingSummary() {
    const existingSection = document.getElementById('rmAnalysisSummarySection');
    if (existingSection) {
        existingSection.remove();
    }
}

/**
 * 创建分析部分的HTML结构
 */
function createSummarySection() {
    summarySection = document.createElement('section');
    summarySection.id = 'rmAnalysisSummarySection';
    summarySection.className = 'rm-analysis-summary-section';
    
    summarySection.innerHTML = `
        <h3 class="section-heading">
            <i class="fas fa-brain"></i> 多维度综合分析点评
        </h3>
        <div class="analysis-container">
            <div class="analysis-card summary-card">
                <h4 class="card-title">
                    <i class="fas fa-chart-line"></i> RM绩效全方位评估
                </h4>
                <div class="card-content" id="summaryContent">
                    <!-- 内容将在这里动态加载 -->
                </div>
            </div>
        </div>
    `;
    
    // 添加到主容器中
    mainContainer.appendChild(summarySection);
    
    // 添加CSS样式
    addSummaryStyles();
}

/**
 * 显示加载状态
 */
function showLoadingState() {
    const contentContainer = document.getElementById('summaryContent');
    if (contentContainer) {
        contentContainer.innerHTML = `
            <div class="summary-loading">
                <div class="summary-spinner"></div>
                <p>正在进行多维度数据分析，请稍候...</p>
                <p style="font-size: 12px; color: #999; margin-top: 10px;">
                    由于分析维度较多，此过程可能需要30-60秒，请耐心等待...
                </p>
            </div>
        `;
    }
}

/**
 * 处理错误情况
 * @param {Error} error - 错误对象
 */
function handleError(error) {
    console.error('生成综合分析点评时出错:', error);
    
    const contentContainer = document.getElementById('summaryContent');
    if (contentContainer) {
        contentContainer.innerHTML = `
            <div class="summary-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>生成综合分析点评时遇到问题</p>
                <p class="error-details">错误信息: ${error.message}</p>
                <button id="retrySummaryBtn" class="retry-button">
                    <i class="fas fa-redo"></i> 重试
                </button>
            </div>
        `;
        
        // 绑定重试按钮事件
        const retryButton = document.getElementById('retrySummaryBtn');
        if (retryButton) {
            retryButton.addEventListener('click', function() {
                // 获取当前页面上下文中的数据
                const selectedRM = window.currentSelectedRM; // 假设全局变量存储当前选中的RM
                const rmData = window.rmData; // 假设全局变量存储RM数据
                const rmCustData = window.rmCustData; // 假设全局变量存储RM客户数据
                
                if (selectedRM && rmData) {
                    generateAnalysis(selectedRM, rmData, rmCustData);
                } else {
                    contentContainer.innerHTML = `
                        <div class="summary-error">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>无法重试：缺少必要数据</p>
                        </div>
                    `;
                }
            });
        }
    }
}

/**
 * 展示分析结果
 * @param {string} analysisResult - 从ChatGPT API获取的分析结果
 */
function displayAnalysisResult(analysisResult) {
    const contentContainer = document.getElementById('summaryContent');
    if (!contentContainer) return;
    
    console.log('Total analysis result length:', analysisResult ? analysisResult.length : 0);
    
    // 处理分析结果中的章节和要点
    const formattedResult = formatAnalysisResult(analysisResult);
    
    contentContainer.innerHTML = `
        <div class="summary-result">
            ${formattedResult}
        </div>
        <div class="summary-timestamp">
            <i class="far fa-clock"></i> 分析生成时间: ${formatDateTime(new Date())}
        </div>
    `;
    
    // 添加打印功能
    addPrintButton(contentContainer, analysisResult);
    
    // 确保容器不会截断内容
    contentContainer.style.overflow = 'visible';
    contentContainer.style.maxHeight = 'none';
}

/**
 * 格式化分析结果，添加样式和结构
 * @param {string} result - 原始分析结果文本
 * @returns {string} 格式化后的HTML
 */

function formatAnalysisResult(result) {
    if (!result) return '<p>无法生成分析结果</p>';
    
    // 按换行符拆分内容
    const lines = result.split('\n');
    let formatted = '';
    let currentContent = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) continue;
        
        // 检查是否是标题行（包含★或☆）
        if (line.includes('★') || line.includes('☆')) {
            // 如果之前有累积的内容，先处理它
            if (currentContent) {
                formatted += `<div class="analysis-section-content">${currentContent}</div>`;
                currentContent = '';
            }
            
             // 清理标题，去除 ### 符号和其他特殊字符
             let cleanLine = line.replace(/^###\s*/, '')
                                    .replace(/^##+\s*/, '')
                                    .replace(/\*\*/g, '')
                                    .replace(/^[\d\.]+\s*/, '')
                                    .trim();
            
            // 提取标题和星级
            const starIndex = cleanLine.indexOf('★') !== -1 ? cleanLine.indexOf('★') : cleanLine.indexOf('☆');
            const title = cleanLine.substring(0, starIndex).trim();
            const stars = cleanLine.substring(starIndex).trim();
            

             // 计算星级分数
             const filledStars = (stars.match(/★/g) || []).length;

             // 将星级字符转换为更有科技感的HTML
            const starsHtml = stars
            .replace(/★/g, '<span class="star filled-star">★</span>')
            .replace(/☆/g, '<span class="star empty-star">☆</span>');


            // 构建标题HTML
            // 构建标题HTML
            formatted += `
                <div class="analysis-section-title">
                    ${title} 
                    <span class="star-rating" data-score="${filledStars}">
                        ${starsHtml}
                    </span>
                </div>`;
        } else {
            // 清理内容行，也要去除可能的Markdown格式
            let cleanContent = line.replace(/^###\s*/, '')
                                  .replace(/^##+\s*/, '')
                                  .replace(/\*\*/g, '')
                                  .replace(/^[\d\.]+\s*/, '')
                                  .trim();
            
            // 累积内容行
            if (cleanContent) {
                if (currentContent) {
                    currentContent += ' ';
                }
                currentContent += cleanContent;
            }
        }
    }
    
    // 处理最后剩余的内容
    if (currentContent) {
        formatted += `<div class="analysis-section-content">${currentContent}</div>`;
    }
    
    return formatted;
}

/**
 * 格式化分析结果，添加样式和结构
 * @param {string} result - 原始分析结果文本
 * @returns {string} 格式化后的HTML
 */

/**
 * 高亮分析结果中的关键词和指标
 * @param {string} text - 要处理的HTML文本
 * @returns {string} 高亮后的HTML
 */
function highlightKeywords(text) {
    // 简化高亮处理，只保留最重要的指标
    // 高亮百分比数字
    text = text.replace(/(\d+(\.\d+)?%)/g, '<span class="keyword-percentage">$1</span>');
    
    // 高亮排名表述
    text = text.replace(/(第\d+名|排名第\d+|Top\s*\d+%|Bottom\s*\d+%)/g, '<span class="keyword-ranking">$1</span>');
    
    return text;
}

/**
 * 添加打印按钮
 * @param {HTMLElement} container - 容器元素
 * @param {string} analysisText - 分析文本（用于纯文本打印）
 */
function addPrintButton(container, analysisText) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'summary-actions';
    buttonContainer.innerHTML = `
        <button id="printSummaryBtn" class="action-button">
            <i class="fas fa-print"></i> 打印分析报告
        </button>
    `;
    
    container.appendChild(buttonContainer);
    
    // 绑定打印按钮事件
    document.getElementById('printSummaryBtn').addEventListener('click', function() {
        printAnalysisReport(currentRmId, analysisText);
    });
}

/**
 * 打印分析报告
 * @param {string} rmId - 理财经理ID
 * @param {string} analysisText - 分析文本
 */
function printAnalysisReport(rmId, analysisText) {
    // 创建打印窗口
    const printWindow = window.open('', '_blank');
    
    // 构建打印内容
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>理财经理 ${rmId} 多维度综合分析报告</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                h1, h2, h3 {
                    color: #0d47a1;
                }
                .header {
                    border-bottom: 2px solid #0d47a1;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                .report-date {
                    color: #666;
                    font-style: italic;
                }
                .footer {
                    margin-top: 30px;
                    border-top: 1px solid #ddd;
                    padding-top: 10px;
                    font-size: 12px;
                    color: #666;
                }
                .section {
                    margin-bottom: 20px;
                }
                p {
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>理财经理多维度综合分析报告</h1>
                <p>RM ID: <strong>${rmId}</strong></p>
                <p class="report-date">生成时间: ${formatDateTime(new Date())}</p>
            </div>
            
            <div class="section">
                ${analysisText.replace(/\n/g, '<br>')}
            </div>
            
            <div class="footer">
                <p>本报告由AI助手自动生成，仅供参考。</p>
                <p>© ${new Date().getFullYear()} 理财经理工作台</p>
            </div>
        </body>
        </html>
    `;
    
    // 写入内容并打印
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // 等待样式加载完成后打印
    setTimeout(() => {
        printWindow.print();
        // printWindow.close(); // 可选：打印后自动关闭窗口
    }, 500);
}

/**
 * 收集多维度数据用于综合分析
 * @param {Object} selectedRM - 当前选中的理财经理数据
 * @param {Array} rmData - 所有理财经理的数据
 * @param {Array} rmCustData - 理财经理客户数据
 * @returns {Object} 汇总的分析数据
 */
function collectMultiDimensionalData(selectedRM, rmData, rmCustData) {
    // 获取该理财经理所在的组
    const rmGroup = selectedRM.cust_aum_scale_group;
    
    // 过滤出同组的理财经理数据
    const sameGroupRMs = rmData.filter(rm => rm.cust_aum_scale_group === rmGroup);
    
    // 基本信息
    const baseInfo = {
        rmId: selectedRM.RM_ID,
        group: rmGroup,
        custNums: selectedRM.cust_nums || 0,
        groupTotalRMs: sameGroupRMs.length
    };
    
    // B1.1 收入评价 - 任务完成情况
    const incomePerformanceAnalysis = analyzeIncomePerformance(selectedRM);
    
    // B1.2 收入评价 - 同组排名
    const incomeRankingAnalysis = analyzeIncomeRanking(selectedRM, sameGroupRMs);
    
    // B1.3 收入趋势
    const incomeTrendAnalysis = analyzeIncomeTrend(selectedRM);
    
    // B2.1 规模评价 - 任务完成情况
    const aumPerformanceAnalysis = analyzeAumPerformance(selectedRM);
    
    // B2.2 规模评价 - 同组排名
    const aumRankingAnalysis = analyzeAumRanking(selectedRM, sameGroupRMs);
    
    // B2.3 规模趋势
    const aumTrendAnalysis = analyzeAumTrend(selectedRM);
    
    // C1.1 收入结构分析
    const incomeStructureAnalysis = analyzeIncomeStructure(selectedRM);
    
    // C1.2 收入分解分析
    const incomeBreakdownAnalysis = analyzeIncomeBreakdown(selectedRM);
    
    // C2.1-C2.4 中间业务分析
    const intermediaryBusinessAnalysis = analyzeIntermediaryBusiness(selectedRM, sameGroupRMs);
    
    // C3.1-C3.3 存款业务分析
    const depositBusinessAnalysis = analyzeDepositBusiness(selectedRM, sameGroupRMs);
    
    // C4.1-C4.3 信贷业务分析
    const creditBusinessAnalysis = analyzeCreditBusiness(selectedRM, sameGroupRMs);
    
    // C5.1-C5.2 对公业务分析
    const corporateBusinessAnalysis = analyzeCorporateBusiness(selectedRM, sameGroupRMs);
    
    // D1-D4 规模归因分析
    const aumAttributionAnalysis = analyzeAumAttribution(selectedRM, rmCustData);
    
    // E1-E6 客户经营分析
    const customerOperationAnalysis = analyzeCustomerOperation(selectedRM, rmCustData);
    
    return {
        baseInfo,
        incomePerformanceAnalysis,
        incomeRankingAnalysis,
        incomeTrendAnalysis,
        aumPerformanceAnalysis,
        aumRankingAnalysis,
        aumTrendAnalysis,
        incomeStructureAnalysis,
        incomeBreakdownAnalysis,
        intermediaryBusinessAnalysis,
        depositBusinessAnalysis,
        creditBusinessAnalysis,
        corporateBusinessAnalysis,
        aumAttributionAnalysis,
        customerOperationAnalysis
    };
}

// B1.1 收入评价 - 任务完成情况
function analyzeIncomePerformance(selectedRM) {
    const currentRevenue = selectedRM.RM_Rev_todate || 0;
    const timeKPI = selectedRM.RM_REV_KPI_RR || 0;
    const overallKPI = selectedRM.RM_REV_KPI || 0;
    
    const rr1 = timeKPI > 0 ? ((timeKPI / currentRevenue ) * 100).toFixed(1) : 0;
    const rr2 = overallKPI > 0 ? ((timeKPI / currentRevenue ) * 100).toFixed(1) : 0;
    
    // 评分逻辑
    let score = 1;
    let assessment = '';
    
    if (rr1 >= 120 && rr2 >= 120) {
        score = 5;
        assessment = '远超目标';
    } else if (rr1 >= 100 && rr2 >= 100) {
        score = 4;
        assessment = '达成目标';
    } else if (rr1 >= 80 || rr2 >= 80) {
        score = 3;
        assessment = '接近目标';
    } else if (rr1 >= 50 || rr2 >= 50) {
        score = 2;
        assessment = '明显落后';
    } else {
        score = 1;
        assessment = '严重滞后';
    }
    
    return { currentRevenue, rr1, rr2, score, assessment };
}

// B1.2 收入评价 - 同组排名
function analyzeIncomeRanking(selectedRM, sameGroupRMs) {
    const currentRevenue = selectedRM.RM_Rev_todate || 0;
    const grade = selectedRM.RM_GROUP_REV_Perf || 'D';
    
    // 对同组RM按收入排序
    const sortedRMs = sameGroupRMs
        .sort((a, b) => (b.RM_Rev_todate || 0) - (a.RM_Rev_todate || 0));
    
    // 找到当前RM的排名
    const rank = sortedRMs.findIndex(rm => rm.RM_ID === selectedRM.RM_ID) + 1;
    const total = sortedRMs.length;
    const percentile = total > 0 ? ((1 - rank / total) * 100).toFixed(1) : 0;
    
    // 计算组内平均值
    const groupAverage = sortedRMs.reduce((sum, rm) => sum + (rm.RM_Rev_todate || 0), 0) / total;
    const comparisonToAverage = groupAverage > 0 ? ((currentRevenue - groupAverage) / groupAverage * 100).toFixed(1) : 0;
    
    // 评分逻辑
    let score = 1;
    if (rank <= total * 0.1 && grade === 'A') {
        score = 5;
    } else if (rank <= total * 0.2 && grade === 'B') {
        score = 4;
    } else if (rank <= total * 0.5 && grade === 'C') {
        score = 3;
    } else if (grade === 'D' && rank > total * 0.5) {
        score = 2;
    }
    
    return { rank, total, percentile, grade, groupAverage, comparisonToAverage, score };
}

// B1.3 收入趋势
function analyzeIncomeTrend(selectedRM) {
    // 获取近6个月收入数据
    const monthlyRevenue = [];
    for (let i = 1; i <= 6; i++) {
        monthlyRevenue.push(selectedRM[`RM_Mrev_${i}`] || 0);
    }
    
    // 计算趋势
    let growthCount = 0;
    let declineCount = 0;
    for (let i = 1; i < monthlyRevenue.length; i++) {
        if (monthlyRevenue[i] > monthlyRevenue[i - 1]) {
            growthCount++;
        } else if (monthlyRevenue[i] < monthlyRevenue[i - 1]) {
            declineCount++;
        }
    }
    
    const trend = growthCount > declineCount ? '上升' : declineCount > growthCount ? '下降' : '平稳';
    
    // 计算波动率
    const avg = monthlyRevenue.reduce((sum, val) => sum + val, 0) / monthlyRevenue.length;
    const variance = monthlyRevenue.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / monthlyRevenue.length;
    const volatility = avg > 0 ? (Math.sqrt(variance) / avg * 100).toFixed(1) : 0;
    
    // 计算连续增长月数
    let consecutiveGrowthMonths = 0;
    for (let i = monthlyRevenue.length - 1; i > 0; i--) {
        if (monthlyRevenue[i] > monthlyRevenue[i - 1]) {
            consecutiveGrowthMonths++;
        } else {
            break;
        }
    }
    
    // 计算最高收入和平均收入比
    const maxRevenue = Math.max(...monthlyRevenue);
    const maxToAvgRatio = avg > 0 ? (maxRevenue / avg).toFixed(2) : 0;
    
    // 评分逻辑
    let score = 1;
    if (consecutiveGrowthMonths >= 6 && volatility < 10) {
        score = 5;
    } else if (trend === '上升' && volatility < 20) {
        score = 4;
    } else if (trend === '平稳' && volatility < 30) {
        score = 3;
    } else if (trend === '下降' || volatility >= 30) {
        score = 2;
    }
    
    return { monthlyRevenue, trend, volatility, consecutiveGrowthMonths, maxToAvgRatio, score };
}

// B2.1 规模评价 - 任务完成情况
function analyzeAumPerformance(selectedRM) {
    const currentAum = selectedRM.RM_Yaum_2025 || 0;
    const timeKPI = selectedRM.RM_AUM_KPI_RR || 0;
    const overallKPI = selectedRM.RM_AUM_KPI || 0;
    
    const rr1 = timeKPI > 0 ? (( timeKPI / currentAum) * 100).toFixed(1) : 0;
    const rr2 = overallKPI > 0 ? ((overallKPI / currentAum ) * 100).toFixed(1) : 0;
    
    // 评分逻辑
    let score = 1;
    let assessment = '';
    
    if (rr1 >= 120 && rr2 >= 120) {
        score = 5;
        assessment = '远超目标';
    } else if (rr1 >= 100 && rr2 >= 100) {
        score = 4;
        assessment = '达成目标';
    } else if (rr1 >= 80 || rr2 >= 80) {
        score = 3;
        assessment = '接近目标';
    } else if (rr1 >= 50 || rr2 >= 50) {
        score = 2;
        assessment = '明显落后';
    } else {
        score = 1;
        assessment = '严重滞后';
    }
    
    return { currentAum, rr1, rr2, score, assessment };
}
// B2.2 规模评价 - 同组排名
function analyzeAumRanking(selectedRM, sameGroupRMs) {
    const currentAum = selectedRM.RM_Yaum_2025 || 0;
    const grade = selectedRM.RM_GROUP_AUM_Perf || 'D';
    
    // 对同组RM按AUM排序
    const sortedRMs = sameGroupRMs
        .sort((a, b) => (b.RM_Yaum_2025 || 0) - (a.RM_Yaum_2025 || 0));
    
    // 找到当前RM的排名
    const rank = sortedRMs.findIndex(rm => rm.RM_ID === selectedRM.RM_ID) + 1;
    const total = sortedRMs.length;
    const percentile = total > 0 ? ((1 - rank / total) * 100).toFixed(1) : 0;
    
    // 计算组内平均值
    const groupAverage = sortedRMs.reduce((sum, rm) => sum + (rm.RM_Yaum_2025 || 0), 0) / total;
    const comparisonToAverage = groupAverage > 0 ? ((currentAum - groupAverage) / groupAverage * 100).toFixed(1) : 0;
    
    // 修改评分逻辑 - 严格按照字段RM_GROUP_AUM_Perf
    let score = 1;
    switch(grade) {
        case 'A':
            score = 5;
            break;
        case 'B':
            score = 4;
            break;
        case 'C':
            score = 3;
            break;
        case 'D':
            score = 2;
            break;
        default:
            score = 1;
    }
    
    return { rank, total, percentile, grade, groupAverage, comparisonToAverage, score };
}

// B2.3 规模趋势
// B2.3 规模趋势
function analyzeAumTrend(selectedRM) {
    // 获取近6个月AUM数据
    const monthlyAum = [];
    for (let i = 1; i <= 6; i++) {
        monthlyAum.push(selectedRM[`RM_Maum_${i}`] || 0);
    }
    
    // 计算连续增长月数
    let consecutiveGrowthMonths = 0;
    for (let i = monthlyAum.length - 1; i > 0; i--) {
        if (monthlyAum[i] > monthlyAum[i - 1]) {
            consecutiveGrowthMonths++;
        } else {
            break;
        }
    }
    
    // 计算波动率
    const avg = monthlyAum.reduce((sum, val) => sum + val, 0) / monthlyAum.length;
    const variance = monthlyAum.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / monthlyAum.length;
    const volatility = avg > 0 ? (Math.sqrt(variance) / avg * 100).toFixed(1) : 0;
    
    // 分析趋势
    let growthCount = 0;
    let declineCount = 0;
    for (let i = 1; i < monthlyAum.length; i++) {
        if (monthlyAum[i] > monthlyAum[i - 1]) {
            growthCount++;
        } else if (monthlyAum[i] < monthlyAum[i - 1]) {
            declineCount++;
        }
    }
    
    const trend = growthCount > declineCount ? '上升' : declineCount > growthCount ? '下降' : '平稳';
    
    // 计算最高AUM和平均AUM比
    const maxAum = Math.max(...monthlyAum);
    const maxToAvgRatio = avg > 0 ? (maxAum / avg).toFixed(2) : 0;
    
    // 修改评分逻辑 - 严格按照新的标准
    let score = 1;
    if (consecutiveGrowthMonths >= 6 && volatility < 10) {
        score = 5;
    } else if (trend === '上升' && volatility < 20) {
        score = 4;
    } else if (trend === '平稳' || volatility < 30) {
        score = 3;
    } else if (trend === '下降' || volatility >= 30) {
        score = 2;
    } else if (trend === '下降' && volatility >= 50) {
        score = 1;
    }
    
    return { monthlyAum, trend, volatility, consecutiveGrowthMonths, maxToAvgRatio, score };
}

// C1.1 收入结构分析
function analyzeIncomeStructure(selectedRM) {
    const totalRevenue = selectedRM.RM_Rev_todate || 0;
    const corporate = selectedRM.RM_TD_Rev_cpt || 0;
    const retail = selectedRM.RM_TD_Rev_crt || 0;
    const deposit = selectedRM.RM_TD_Rev_dpt || 0;
    const intermediary = selectedRM.RM_TD_Rev_aum || 0;
    
    // 计算各部分占比
    const corporatePercent = totalRevenue > 0 ? (corporate / totalRevenue * 100).toFixed(1) : 0;
    const retailPercent = totalRevenue > 0 ? (retail / totalRevenue * 100).toFixed(1) : 0;
    const depositPercent = totalRevenue > 0 ? (deposit / totalRevenue * 100).toFixed(1) : 0;
    const intermediaryPercent = totalRevenue > 0 ? (intermediary / totalRevenue * 100).toFixed(1) : 0;
    
    // 确定主要收入来源
    const sources = [
        { name: '对公业务', value: corporate },
        { name: '零售信贷', value: retail },
        { name: '存款FTP', value: deposit },
        { name: '中间业务', value: intermediary }
    ];
    
    const mainSource = sources.reduce((max, current) => 
        current.value > max.value ? current : max, sources[0]).name;
    
    // 分析稳定性
    let stability = '未知';
    const maxPercent = Math.max(corporatePercent, retailPercent, depositPercent, intermediaryPercent);
    if (maxPercent < 40) {
        stability = '高度均衡';
    } else if (maxPercent < 60) {
        stability = '较为均衡';
    } else if (maxPercent < 70) {
        stability = '较为集中';
    } else {
        stability = '高度集中';
    }
    
    // 评分逻辑
    let score = 1;
    if (stability === '高度均衡') {
        score = 5;
    } else if (stability === '较为均衡') {
        score = 4;
    } else if (stability === '较为集中') {
        score = 3;
    } else {
        score = 2;
    }
    
    return {
        totalRevenue,
        corporate: { value: corporate, percent: corporatePercent },
        retail: { value: retail, percent: retailPercent },
        deposit: { value: deposit, percent: depositPercent },
        intermediary: { value: intermediary, percent: intermediaryPercent },
        mainSource,
        stability,
        score
    };
}

// C1.2 收入分解分析
function analyzeIncomeBreakdown(selectedRM) {
    // 获取近6个月各类收入数据
    let totalMonthlyRevenue = 0;
    let totalCorporateRevenue = 0;
    let totalCreditRevenue = 0;
    let totalDepositRevenue = 0;
    let totalCurrentDepositRevenue = 0;
    let totalIntermediaryRevenue = 0;
    let totalWealthManagementRevenue = 0;
    let totalFundRevenue = 0;
    let totalInsuranceRevenue = 0;
    
    for (let i = 1; i <= 6; i++) {
        totalMonthlyRevenue += selectedRM[`RM_Mrev_${i}`] || 0;
        totalCorporateRevenue += selectedRM[`RM_Mrev_cpt_${i}`] || 0;
        totalCreditRevenue += selectedRM[`RM_Mrev_crt_${i}`] || 0;
        totalDepositRevenue += selectedRM[`RM_Mrev_dpt_${i}`] || 0;
        totalCurrentDepositRevenue += selectedRM[`RM_Mrev_cdpt_${i}`] || 0;
        totalIntermediaryRevenue += selectedRM[`RM_Mrev_aum_${i}`] || 0;
        totalWealthManagementRevenue += selectedRM[`RM_Mrev_wm_${i}`] || 0;
        totalFundRevenue += selectedRM[`RM_Mrev_fund_${i}`] || 0;
        totalInsuranceRevenue += selectedRM[`RM_Mrev_inr_${i}`] || 0;
    }
    
    // 计算各部分占比
    const corporatePercent = totalMonthlyRevenue > 0 ? (totalCorporateRevenue / totalMonthlyRevenue * 100).toFixed(1) : 0;
    const creditPercent = totalMonthlyRevenue > 0 ? (totalCreditRevenue / totalMonthlyRevenue * 100).toFixed(1) : 0;
    const depositPercent = totalMonthlyRevenue > 0 ? (totalDepositRevenue / totalMonthlyRevenue * 100).toFixed(1) : 0;
    const intermediaryPercent = totalMonthlyRevenue > 0 ? (totalIntermediaryRevenue / totalMonthlyRevenue * 100).toFixed(1) : 0;
    
    // 存款分解
    const currentDepositPercent = totalDepositRevenue > 0 ? (totalCurrentDepositRevenue / totalDepositRevenue * 100).toFixed(1) : 0;
    const timeDepositPercent = totalDepositRevenue > 0 ? ((totalDepositRevenue - totalCurrentDepositRevenue) / totalDepositRevenue * 100).toFixed(1) : 0;
    
    // 中间业务分解
    const wealthManagementPercent = totalIntermediaryRevenue > 0 ? (totalWealthManagementRevenue / totalIntermediaryRevenue * 100).toFixed(1) : 0;
    const fundPercent = totalIntermediaryRevenue > 0 ? (totalFundRevenue / totalIntermediaryRevenue * 100).toFixed(1) : 0;
    const insurancePercent = totalIntermediaryRevenue > 0 ? (totalInsuranceRevenue / totalIntermediaryRevenue * 100).toFixed(1) : 0;
    
    // 评分逻辑
    let score = 1;
    const maxPercent = Math.max(corporatePercent, creditPercent, depositPercent, intermediaryPercent);
    if (maxPercent < 40) {
        score = 5;
    } else if (maxPercent < 50) {
        score = 4;
    } else if (maxPercent < 60) {
        score = 3;
    } else if (maxPercent < 70) {
        score = 2;
    }
    
    return {
        corporate: { value: totalCorporateRevenue, percent: corporatePercent },
        credit: { value: totalCreditRevenue, percent: creditPercent },
        deposit: { value: totalDepositRevenue, percent: depositPercent },
        currentDeposit: { value: totalCurrentDepositRevenue, percent: currentDepositPercent },
        timeDeposit: { value: totalDepositRevenue - totalCurrentDepositRevenue, percent: timeDepositPercent },
        intermediary: { value: totalIntermediaryRevenue, percent: intermediaryPercent },
        wealthManagement: { value: totalWealthManagementRevenue, percent: wealthManagementPercent },
        fund: { value: totalFundRevenue, percent: fundPercent },
        insurance: { value: totalInsuranceRevenue, percent: insurancePercent },
        score
    };
}

// C2.1-C2.4 中间业务分析
// C2.1-C2.4 中间业务分析
function analyzeIntermediaryBusiness(selectedRM, sameGroupRMs) {
    // C2.1 收入排名
    const intermediaryRevenue = selectedRM.RM_TD_Rev_aum || 0;
    
    const sortedByIntermediary = sameGroupRMs
        .sort((a, b) => (b.RM_TD_Rev_aum || 0) - (a.RM_TD_Rev_aum || 0));
    
    const rank = sortedByIntermediary.findIndex(rm => rm.RM_ID === selectedRM.RM_ID) + 1;
    const total = sortedByIntermediary.length;
    const groupAverage = sortedByIntermediary.reduce((sum, rm) => sum + (rm.RM_TD_Rev_aum || 0), 0) / total;
    
    // 计算排名百分位
    const percentileRank = total > 0 ? (rank / total * 100) : 100;
    
    // 修改评分逻辑 - C2.1 收入排名
    let rankScore = 1;
    if (percentileRank <= 10) {
        rankScore = 5;
    } else if (percentileRank <= 20) {
        rankScore = 4;
    } else if (percentileRank <= 50) {
        rankScore = 3;
    } else if (percentileRank <= 80) {
        rankScore = 2;
    } else {
        rankScore = 1;
    }
    
    // C2.3 万元收益与销量
    const wealthManagementAum = averageMonthlyValue(selectedRM, 'RM_Maum_wm_', 6);
    const fundAum = averageMonthlyValue(selectedRM, 'RM_Maum_fund_', 6);
    const insuranceAum = averageMonthlyValue(selectedRM, 'RM_Maum_inr_', 6);
    
    const wealthManagementYield = selectedRM.RM_Yld_WM || 0;
    const fundYield = selectedRM.RM_Yld_fund || 0;
    const insuranceYield = selectedRM.RM_Yld_inr || 0;
    
    // C2.4 细分指标
    const wealthManagementCustomers = selectedRM.RM_wm_custs || 0;
    const fundCustomers = selectedRM.RM_fund_custs || 0;
    const insuranceCustomers = selectedRM.RM_inr_custs || 0;
    
    // 保持原有的收益评分逻辑
    let yieldScore = 1;
    const overallYield = selectedRM.RM_Yld_AUM || 0;
    if (overallYield > groupAverage * 1.2) {
        yieldScore = 5;
    } else if (overallYield > groupAverage) {
        yieldScore = 4;
    } else if (overallYield > groupAverage * 0.8) {
        yieldScore = 3;
    } else {
        yieldScore = 2;
    }
    
    return {
        revenue: intermediaryRevenue,
        ranking: { rank, total, groupAverage },
        wealthManagement: {
            aum: wealthManagementAum,
            revenue: selectedRM.RM_Mrev_wm_6 || 0,
            customers: wealthManagementCustomers,
            yield: wealthManagementYield
        },
        fund: {
            aum: fundAum,
            revenue: selectedRM.RM_Mrev_fund_6 || 0,
            customers: fundCustomers,
            yield: fundYield
        },
        insurance: {
            aum: insuranceAum,
            revenue: selectedRM.RM_Mrev_inr_6 || 0,
            customers: insuranceCustomers,
            yield: insuranceYield
        },
        scores: { rankScore, yieldScore }
    };
}

// C3.1-C3.3 存款业务分析
function analyzeDepositBusiness(selectedRM, sameGroupRMs) {
    // C3.1 收入排名
    const depositRevenue = selectedRM.RM_TD_Rev_dpt || 0;
    
    const sortedByDeposit = sameGroupRMs
        .sort((a, b) => (b.RM_TD_Rev_dpt || 0) - (a.RM_TD_Rev_dpt || 0));
    
    const rank = sortedByDeposit.findIndex(rm => rm.RM_ID === selectedRM.RM_ID) + 1;
    const total = sortedByDeposit.length;
    const groupAverage = sortedByDeposit.reduce((sum, rm) => sum + (rm.RM_TD_Rev_dpt || 0), 0) / total;
    
    // C3.2 分解分析
    const depositAum = averageMonthlyValue(selectedRM, 'RM_Maum_dpt_', 6);
    const currentDepositAum = averageMonthlyValue(selectedRM, 'RM_Maum_cdpt_', 6);
    const currentDepositPercent = depositAum > 0 ? (currentDepositAum / depositAum * 100).toFixed(1) : 0;
    
    const currentDepositCustomers = selectedRM.RM_cdpt_custs || 0;
    const totalCustomers = selectedRM.cust_nums || 0;
    const currentCustomerPercent = totalCustomers > 0 ? (currentDepositCustomers / totalCustomers * 100).toFixed(1) : 0;
    
    const depositYield = selectedRM.RM_Yld_DPT || 0;
    
    // C3.3 收入结构
    const currentDepositRevenue = averageMonthlyValue(selectedRM, 'RM_Mrev_cdpt_', 6);
    const timeDepositRevenue = averageMonthlyValue(selectedRM, 'RM_Mrev_dpt_', 6) - currentDepositRevenue;
    const currentRevenuePercent = currentDepositRevenue + timeDepositRevenue > 0 ? 
        (currentDepositRevenue / (currentDepositRevenue + timeDepositRevenue) * 100).toFixed(1) : 0;
    
    // 评分逻辑
    let score = 1;
    if (currentDepositPercent > 50) {
        score = 5;
    } else if (currentDepositPercent > 40) {
        score = 4;
    } else if (currentDepositPercent > 30) {
        score = 3;
    } else if (currentDepositPercent > 20) {
        score = 2;
    }
    
    return {
        revenue: depositRevenue,
        ranking: { rank, total, groupAverage },
        currentDeposit: {
            aum: currentDepositAum,
            aumPercent: currentDepositPercent,
            customers: currentDepositCustomers,
            customerPercent: currentCustomerPercent,
            revenue: currentDepositRevenue,
            revenuePercent: currentRevenuePercent
        },
        timeDeposit: {
            aum: depositAum - currentDepositAum,
            revenue: timeDepositRevenue
        },
        yield: depositYield,
        score
    };
}

// C4.1-C4.3 信贷业务分析
function analyzeCreditBusiness(selectedRM, sameGroupRMs) {
    // C4.1 收入排名
    const creditRevenue = selectedRM.RM_TD_Rev_crt || 0;
    
    const sortedByCredit = sameGroupRMs
        .sort((a, b) => (b.RM_TD_Rev_crt || 0) - (a.RM_TD_Rev_crt || 0));
    
    const rank = sortedByCredit.findIndex(rm => rm.RM_ID === selectedRM.RM_ID) + 1;
    const total = sortedByCredit.length;
    const groupAverage = sortedByCredit.reduce((sum, rm) => sum + (rm.RM_TD_Rev_crt || 0), 0) / total;
    
    // C4.2 结构分析
    const creditAum = averageMonthlyValue(selectedRM, 'RM_Maum_crt_', 6);
    const totalAum = averageMonthlyValue(selectedRM, 'RM_Maum_', 6);
    const creditAumPercent = totalAum > 0 ? (creditAum / totalAum * 100).toFixed(1) : 0;
    
    const creditCustomers = selectedRM.RM_crt_custs || 0;
    const totalCustomers = selectedRM.cust_nums || 0;
    const creditCustomerPercent = totalCustomers > 0 ? (creditCustomers / totalCustomers * 100).toFixed(1) : 0;
    
    // C4.3 收入趋势
    const creditMonthlyRevenue = averageMonthlyValue(selectedRM, 'RM_Mrev_crt_', 6);
    const totalMonthlyRevenue = averageMonthlyValue(selectedRM, 'RM_Mrev_', 6);
    const creditRevenuePercent = totalMonthlyRevenue > 0 ? (creditMonthlyRevenue / totalMonthlyRevenue * 100).toFixed(1) : 0;
    
    // 分析趋势
    const creditTrend = analyzeTrend(selectedRM, 'RM_Mrev_crt_', 6);
    
    // 评分逻辑
    let score = 1;
    if (creditRevenuePercent > 20 && creditTrend === '上升') {
        score = 5;
    } else if (creditRevenuePercent > 15 && creditTrend !== '下降') {
        score = 4;
    } else if (creditRevenuePercent > 10) {
        score = 3;
    } else if (creditRevenuePercent > 5) {
        score = 2;
    }
    
    return {
        revenue: creditRevenue,
        ranking: { rank, total, groupAverage },
        structure: {
            aum: creditAum,
            aumPercent: creditAumPercent,
            customers: creditCustomers,
            customerPercent: creditCustomerPercent
        },
        trend: {
            monthlyRevenue: creditMonthlyRevenue,
            revenuePercent: creditRevenuePercent,
            trend: creditTrend
        },
        score
    };
}

// C5.1-C5.2 对公业务分析
function analyzeCorporateBusiness(selectedRM, sameGroupRMs) {
    // C5.1 收入排名
    const corporateRevenue = selectedRM.RM_TD_Rev_cpt || 0;
    
    const sortedByCorporate = sameGroupRMs
        .sort((a, b) => (b.RM_TD_Rev_cpt || 0) - (a.RM_TD_Rev_cpt || 0));
    
    const rank = sortedByCorporate.findIndex(rm => rm.RM_ID === selectedRM.RM_ID) + 1;
    const total = sortedByCorporate.length;
    const groupAverage = sortedByCorporate.reduce((sum, rm) => sum + (rm.RM_TD_Rev_cpt || 0), 0) / total;
    
    // C5.2 收入结构
    const corporateMonthlyRevenue = averageMonthlyValue(selectedRM, 'RM_Mrev_cpt_', 6);
    const totalMonthlyRevenue = averageMonthlyValue(selectedRM, 'RM_Mrev_', 6);
    const corporateRevenuePercent = totalMonthlyRevenue > 0 ? (corporateMonthlyRevenue / totalMonthlyRevenue * 100).toFixed(1) : 0;
    
    // 分析趋势
    const corporateTrend = analyzeTrend(selectedRM, 'RM_Mrev_cpt_', 6);
    
    // 评分逻辑
    let score = 1;
    if (corporateRevenuePercent > 20 && corporateTrend === '上升') {
        score = 5;
    } else if (corporateRevenuePercent > 15 && corporateTrend !== '下降') {
        score = 4;
    } else if (corporateRevenuePercent > 10) {
        score = 3;
    } else if (corporateRevenuePercent > 5) {
        score = 2;
    }
    
    return {
        revenue: corporateRevenue,
        ranking: { rank, total, groupAverage },
        structure: {
            monthlyRevenue: corporateMonthlyRevenue,
            revenuePercent: corporateRevenuePercent,
            trend: corporateTrend
        },
        score
    };
}

// D1-D4 规模归因分析
function analyzeAumAttribution(selectedRM, rmCustData) {
    if (!rmCustData || rmCustData.length === 0) return null;
    
    const rmId = selectedRM.RM_ID;
    const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);
    
    // D1 AUM变化原因
    let initialTotalAum = 0;
    let finalTotalAum = 0;
    const changeReasons = {
        升级: { count: 0, aumChange: 0 },
        降级: { count: 0, aumChange: 0 },
        流失: { count: 0, aumChange: 0 },
        新客: { count: 0, aumChange: 0 }
    };
    
    rmCustomers.forEach(cust => {
        const initialAum = cust.CUST_AVG_AUM_2 || 0;
        const finalAum = cust.CUST_AVG_AUM || 0;
        const change = finalAum - initialAum;
        const status = cust.CUST_AUM_STATUS_QUO_AVG || '未分类';
        
        initialTotalAum += initialAum;
        finalTotalAum += finalAum;
        
        if (changeReasons[status]) {
            changeReasons[status].count++;
            changeReasons[status].aumChange += change;
        }
    });
    
    const totalAumChange = finalTotalAum - initialTotalAum;
    
    // D2 AUM转移矩阵
    let upgradedCustomers = 0;
    let stableCustomers = 0;
    let downgradedCustomers = 0;
    
    const tierOrder = ['30mn+', '6-30Mn', '1-6Mn', '300K-1Mn', '50-300K', '0-50K'];
    
    rmCustomers.forEach(cust => {
        const initialTier = cust.AUM_AVG_GROUP_2;
        const finalTier = cust.AUM_AVG_GROUP;
        
        if (initialTier && finalTier) {
            const initialIdx = tierOrder.indexOf(initialTier);
            const finalIdx = tierOrder.indexOf(finalTier);
            
            if (initialIdx !== -1 && finalIdx !== -1) {
                if (initialIdx > finalIdx) upgradedCustomers++;
                else if (initialIdx < finalIdx) downgradedCustomers++;
                else stableCustomers++;
            }
        }
    });
    
    // 计算正向和负向变化比例
    const totalPositiveChange = changeReasons['升级'].aumChange + changeReasons['新客'].aumChange;
    const totalNegativeChange = Math.abs(changeReasons['降级'].aumChange + changeReasons['流失'].aumChange);
    const totalChange = totalPositiveChange + totalNegativeChange;
    
    const positivePercent = totalChange > 0 ? (totalPositiveChange / totalChange * 100).toFixed(1) : 0;
    const negativePercent = totalChange > 0 ? (totalNegativeChange / totalChange * 100).toFixed(1) : 0;
    
    // 评分逻辑
    let score = 1;
    if (positivePercent > 70 && totalAumChange > 0) {
        score = 5;
    } else if (positivePercent > 50 && totalAumChange > 0) {
        score = 4;
    } else if (positivePercent > 30) {
        score = 3;
    } else if (negativePercent > 50) {
        score = 2;
    }
    
    return {
        initialAum: initialTotalAum,
        finalAum: finalTotalAum,
        aumChange: totalAumChange,
        changeReasons,
        upgradedCustomers,
        stableCustomers,
        downgradedCustomers,
        positiveChange: { value: totalPositiveChange, percent: positivePercent },
        negativeChange: { value: totalNegativeChange, percent: negativePercent },
        score
    };
}

// E1-E6 客户经营分析
function analyzeCustomerOperation(selectedRM, rmCustData) {
    if (!rmCustData || rmCustData.length === 0) return null;
    
    const rmId = selectedRM.RM_ID;
    const rmCustomers = rmCustData.filter(cust => cust.RM_ID === rmId);
    
    // E1 客户数与收入分布
    const tierCounts = {};
    const tierRevenue = {};
    const tierOrder = ['30mn+', '6-30Mn', '1-6Mn', '300K-1Mn', '50-300K', '0-50K'];
    
    tierOrder.forEach(tier => {
        tierCounts[tier] = 0;
        tierRevenue[tier] = 0;
    });
    
    rmCustomers.forEach(cust => {
        const tier = cust.AUM_AVG_GROUP;
        const revenue = cust.cust_tot_rev_1 || 0;
        
        if (tier && tierOrder.includes(tier)) {
            tierCounts[tier]++;
            tierRevenue[tier] += revenue;
        }
    });
    
    const totalCustomers = rmCustomers.length;
    const totalRevenue = Object.values(tierRevenue).reduce((sum, val) => sum + val, 0);
    
    // 计算高价值客户占比
    const highValueCustomers = tierCounts['30mn+'] + tierCounts['6-30Mn'] + tierCounts['1-6Mn'];
    const highValuePercent = totalCustomers > 0 ? (highValueCustomers / totalCustomers * 100).toFixed(1) : 0;
    
    // E2 ROA表现
    let highROACount = 0;
    let lowROACount = 0;
    
    rmCustomers.forEach(cust => {
        const roa = cust.CUST_ROA || 0;
        const rank = cust.ROA_AUMGROUP_RANK;
        
        if (rank && parseInt(rank) <= 20) {
            highROACount++;
        } else if (rank && parseInt(rank) >= 80) {
            lowROACount++;
        }
    });
    
    const highROAPercent = totalCustomers > 0 ? (highROACount / totalCustomers * 100).toFixed(1) : 0;
    const lowROAPercent = totalCustomers > 0 ? (lowROACount / totalCustomers * 100).toFixed(1) : 0;
    
    // E5 ROA与规模变化
    let premiumCustomerCount = 0; // 高ROA且AUM增长
    let riskCustomerCount = 0; // 低ROA且AUM下降
    
    rmCustomers.forEach(cust => {
        const roa = cust.CUST_ROA || 0;
        const aumChange = cust.AUM_AVG_UP_DOWN || 'Tie';
        const rank = cust.ROA_AUMGROUP_RANK;
        
        if (rank && parseInt(rank) <= 20 && aumChange === 'Up') {
            premiumCustomerCount++;
        } else if (rank && parseInt(rank) >= 80 && aumChange === 'Down') {
            riskCustomerCount++;
        }
    });
    
    const premiumPercent = totalCustomers > 0 ? (premiumCustomerCount / totalCustomers * 100).toFixed(1) : 0;
    const riskPercent = totalCustomers > 0 ? (riskCustomerCount / totalCustomers * 100).toFixed(1) : 0;
    
    // 评估客户结构健康度
    let customerStructureHealth = '一般';
    if (highValuePercent > 50 && premiumPercent > 30) {
        customerStructureHealth = '优秀';
    } else if (highValuePercent > 30 && premiumPercent > 20) {
        customerStructureHealth = '良好';
    } else if (highValuePercent < 20 || riskPercent > 30) {
        customerStructureHealth = '较差';
    }
    
    // 评分逻辑
    let score = 1;
    if (customerStructureHealth === '优秀') {
        score = 5;
    } else if (customerStructureHealth === '良好') {
        score = 4;
    } else if (customerStructureHealth === '一般') {
        score = 3;
    } else {
        score = 2;
    }
    
    return {
        totalCustomers,
        totalRevenue,
        tierDistribution: tierCounts,
        highValueCustomers: { count: highValueCustomers, percent: highValuePercent },
        highROACustomers: { count: highROACount, percent: highROAPercent },
        lowROACustomers: { count: lowROACount, percent: lowROAPercent },
        premiumCustomers: { count: premiumCustomerCount, percent: premiumPercent },
        riskCustomers: { count: riskCustomerCount, percent: riskPercent },
        customerStructureHealth,
        score
    };
}

// 辅助函数：计算月度平均值
function averageMonthlyValue(selectedRM, prefix, months) {
    let sum = 0;
    let count = 0;
    
    for (let i = 1; i <= months; i++) {
        const value = selectedRM[`${prefix}${i}`];
        if (value !== null && value !== undefined) {
            sum += value;
            count++;
        }
    }
    
    return count > 0 ? sum / count : 0;
}

// 辅助函数：分析趋势
function analyzeTrend(selectedRM, prefix, months) {
    const values = [];
    for (let i = 1; i <= months; i++) {
        values.push(selectedRM[`${prefix}${i}`] || 0);
    }
    
    let growthCount = 0;
    let declineCount = 0;
    
    for (let i = 1; i < values.length; i++) {
        if (values[i] > values[i - 1]) {
            growthCount++;
        } else if (values[i] < values[i - 1]) {
            declineCount++;
        }
    }
    
    if (growthCount > declineCount) {
        return '上升';
    } else if (declineCount > growthCount) {
        return '下降';
    } else {
        return '平稳';
    }
}

// 辅助函数：计算排名
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