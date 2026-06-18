import EmailService from './EmailService.js';
import Portfolio from '../models/Portfolio.js';
import Stock from '../models/Stock.js';
import MutualFund from '../models/MutualFund.js';
import Property from '../models/Property.js';
import Loan from '../models/Loan.js';
import Watchlist from '../models/Watchlist.js';
import NewspaperRefresh from '../models/NewspaperRefresh.js';
import { compileNewspaperEdition } from '../controllers/newspaperController.js';
import User from '../models/User.js';

class NewspaperEmailService {
    async sendDailyNewspaperForUser(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');
            
            // Check if daily newspaper emails are enabled
            if (!user.dailyNewspaperEnabled) {
                console.log(`Daily newspaper email is disabled for user: ${user.email}`);
                return false;
            }

            const recipientEmail = user.newspaperEmailAddress || user.email;
            console.log(`Compiling daily newspaper for user: ${user.email} (recipient: ${recipientEmail})`);

            // Fetch user holdings and watchlist
            const synced = await Portfolio.findOne({ userId });
            const manualStocks = await Stock.find({ userId });
            const mutualFunds = await MutualFund.find({ userId });
            const properties = await Property.find({ userId });
            const loans = await Loan.find({ userId, status: 'Active' });
            const userWatchlist = await Watchlist.find({ userId });

            const stocks = [
                ...(synced ? synced.stocks.map(s => ({ name: s.tradingsymbol, symbol: s.tradingsymbol, type: 'Stock' })) : []),
                ...manualStocks.map(s => ({ name: s.name, symbol: s.symbol, type: 'Stock', sector: s.sector }))
            ];
            const funds = mutualFunds.map(f => ({ name: f.name, symbol: f.type, type: 'Mutual Fund' }));
            const props = properties.map(p => ({ name: p.name, symbol: p.propertyType, type: 'Property', location: p.location }));

            const holdings = { stocks, funds, properties: props, loans };

            // Compile edition
            const edition = await compileNewspaperEdition(userId, holdings, userWatchlist, false, false);
            
            // Generate HTML Content
            const html = this.generateNewspaperHtml(user, edition);

            // Send Email
            const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            const subject = `📰 FinTrack Daily • Morning Edition - ${dateStr}`;
            const success = await EmailService.sendEmailWithRetry(userId, recipientEmail, subject, html, 'daily');
            
            if (success) {
                user.lastNewspaperSentAt = new Date();
                await user.save();
            }
            return success;
        } catch (error) {
            console.error('Error in sendDailyNewspaperForUser:', error);
            return false;
        }
    }

    generateNewspaperHtml(user, data) {
        const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        // Render critical alerts list if they exist
        const criticalAlerts = data.emergencyAlerts ? data.emergencyAlerts.filter(a => a.isCritical) : [];
        let alertsHtml = '';
        if (criticalAlerts.length > 0) {
            alertsHtml = `
                <div style="background-color: #B91C1C; color: #FFFFFF; padding: 15px; border-radius: 4px; margin-bottom: 20px; font-family: Georgia, serif;">
                    <div style="font-family: 'Times New Roman', Times, serif; font-size: 1.25rem; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; text-align: center; margin-bottom: 8px;">🚨 CRITICAL ALERTS DETECTED</div>
                    <ul style="margin: 0; padding-left: 20px; font-size: 0.95rem; line-height: 1.5;">
                        ${criticalAlerts.map(a => `<li style="margin-bottom: 6px;">${a.text}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // Render Market Snapshot
        const snapshotHtml = data.marketSnapshot ? data.marketSnapshot.map(item => {
            const isBullish = item.up;
            const arrow = isBullish ? '▲' : '▼';
            const color = isBullish ? '#0E7490' : '#B91C1C';
            const changeSign = isBullish ? '+' : '';
            return `
                <span style="display: inline-block; margin-right: 15px; font-size: 0.8rem; font-weight: bold; font-family: monospace; color: ${color}; white-space: nowrap;">
                    <span style="font-style: italic; font-family: Georgia, serif; color: #111111;">${item.name}</span> ${item.value} (${arrow} ${changeSign}${item.change}%)
                </span>
            `;
        }).join(' • ') : '';

        // Render Holdings Dispatch
        const holdingsHtml = data.holdingsNews ? data.holdingsNews.map(story => {
            const isBullish = story.sentiment === 'Bullish';
            const sentimentColor = isBullish ? '#0E7490' : (story.sentiment === 'Bearish' ? '#B91C1C' : '#444444');
            return `
                <div style="border-bottom: 1px dashed #cccccc; padding-bottom: 12px; margin-bottom: 12px;">
                    <div style="font-family: monospace; font-size: 0.75rem; font-weight: bold; color: #B89047; text-transform: uppercase; margin-bottom: 4px;">${story.companyName}</div>
                    <h4 style="margin: 0 0 6px 0; font-family: Georgia, serif; font-size: 1.1rem; color: #111111; line-height: 1.3;">${story.headline}</h4>
                    <p style="margin: 0 0 8px 0; font-family: Georgia, serif; font-size: 0.85rem; color: #333333; line-height: 1.4; text-align: justify;">${story.summary}</p>
                    <div style="font-size: 0.75rem; font-family: Georgia, serif; color: #666666;">
                        Impact: <span style="font-weight: bold;">${story.impactLevel} (${story.impactScore})</span> | Sentiment: <span style="color: ${sentimentColor}; font-weight: bold;">${story.sentiment}</span>
                    </div>
                </div>
            `;
        }).join('') : '<p style="color: #666666; font-style: italic;">No portfolio holdings news generated.</p>';

        // Render Watchlist News
        const watchlistHtml = data.watchlistNews ? data.watchlistNews.map(item => {
            const isBullish = item.sentiment === 'Bullish';
            const sentimentColor = isBullish ? '#0E7490' : (item.sentiment === 'Bearish' ? '#B91C1C' : '#444444');
            return `
                <div style="border-bottom: 1px dashed #cccccc; padding-bottom: 10px; margin-bottom: 10px;">
                    <h4 style="margin: 0 0 4px 0; font-family: Georgia, serif; font-size: 1rem; color: #111111;">${item.title}</h4>
                    <p style="margin: 0 0 6px 0; font-family: Georgia, serif; font-size: 0.85rem; color: #555555; line-height: 1.4;">${item.desc}</p>
                    <div style="font-size: 0.75rem; font-family: Georgia, serif; color: #666666;">
                        Impact: <span style="font-weight: bold;">${item.impactLevel}</span> | Sentiment: <span style="color: ${sentimentColor}; font-weight: bold;">${item.sentiment}</span>
                    </div>
                </div>
            `;
        }).join('') : '<p style="color: #666666; font-style: italic;">No watchlist news.</p>';

        // Render Future Buy News
        const futureBuyHtml = data.futureBuyList ? data.futureBuyList.map(item => {
            const isBullish = item.sentiment === 'Bullish';
            const sentimentColor = isBullish ? '#0E7490' : (item.sentiment === 'Bearish' ? '#B91C1C' : '#444444');
            return `
                <div style="border-bottom: 1px dashed #cccccc; padding-bottom: 10px; margin-bottom: 10px;">
                    <h4 style="margin: 0 0 4px 0; font-family: Georgia, serif; font-size: 1rem; color: #111111;">${item.title}</h4>
                    <p style="margin: 0 0 6px 0; font-family: Georgia, serif; font-size: 0.85rem; color: #555555; line-height: 1.4;">${item.desc}</p>
                    <div style="font-size: 0.75rem; font-family: Georgia, serif; color: #666666;">
                        Impact: <span style="font-weight: bold;">${item.impactLevel}</span> | Sentiment: <span style="color: ${sentimentColor}; font-weight: bold;">${item.sentiment}</span>
                    </div>
                </div>
            `;
        }).join('') : '<p style="color: #666666; font-style: italic;">No future buy list opportunities.</p>';

        // Render AI Analyst notes
        const aiDesk = data.aiAnalystDesk || {};
        const aiHtml = `
            <div style="border: 2px solid #B89047; padding: 15px; background-color: rgba(184, 144, 71, 0.02); margin-top: 15px;">
                <div style="font-family: 'Times New Roman', Times, serif; font-size: 1.05rem; font-weight: bold; color: #B89047; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #B89047; padding-bottom: 4px;">AI Analyst Desk Notes</div>
                <div style="font-family: Georgia, serif; font-size: 0.85rem; line-height: 1.5; color: #111111;">
                    <div style="margin-bottom: 8px;"><strong>Portfolio Risk:</strong> ${aiDesk.portfolioRisk || 'Stable'}</div>
                    <div style="margin-bottom: 8px;"><strong>Emerging Opportunities:</strong> ${aiDesk.emergingOpportunities || 'N/A'}</div>
                    <div style="margin-bottom: 8px;"><strong>Hidden Risks:</strong> ${aiDesk.hiddenRisks || 'N/A'}</div>
                    <div style="margin-bottom: 8px;"><strong>Concentration Warnings:</strong> ${aiDesk.concentrationWarnings || 'N/A'}</div>
                    <div><strong>Suggested Monitoring:</strong> ${aiDesk.suggestedMonitoringAreas || 'N/A'}</div>
                </div>
            </div>
        `;

        const mainHeadline = data.mainHeadline || {};
        const mainSentimentColor = mainHeadline.sentiment === 'Bullish' ? '#0E7490' : (mainHeadline.sentiment === 'Bearish' ? '#B91C1C' : '#444444');

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>FinTrack Daily</title>
        </head>
        <body style="background-color: #F3F4F6; margin: 0; padding: 20px; font-family: Georgia, serif; -webkit-font-smoothing: antialiased;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 680px; background-color: #FCFAF2; border: 1px solid #111111; box-shadow: 0 4px 6px rgba(0,0,0,0.05); padding: 25px;">
                <tr>
                    <td>
                        <!-- Emergency Alerts Banner -->
                        ${alertsHtml}

                        <!-- Header Section -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-bottom: 3px double #111111; padding-bottom: 10px; margin-bottom: 15px; text-align: center;">
                            <tr>
                                <td>
                                    <h1 style="margin: 0; font-family: 'Times New Roman', Times, serif; font-size: 2.75rem; font-weight: 800; letter-spacing: -1px; text-transform: uppercase; color: #111111;">FINTRACK DAILY</h1>
                                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #111111; border-bottom: 1px solid #111111; padding: 6px 10px; margin-top: 8px; font-size: 0.75rem; font-family: monospace; text-transform: uppercase; color: #444444;">
                                        <table width="100%">
                                            <tr>
                                                <td align="left" style="font-size: 0.75rem;">The Premier Portfolio Daily • Vol. IV No. 172</td>
                                                <td align="right" style="font-size: 0.75rem;">${dateStr}</td>
                                            </tr>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                        </table>

                        <!-- Market Snapshot Bar -->
                        <div style="border-bottom: 3px double #111111; padding-bottom: 8px; margin-bottom: 15px; line-height: 1.8;">
                            <div style="font-size: 0.75rem; font-family: monospace; font-weight: bold; text-transform: uppercase; color: #B89047; margin-bottom: 4px;">Market Overview Snapshot:</div>
                            ${snapshotHtml}
                        </div>

                        <!-- Top Headline Section -->
                        <div style="border-bottom: 1px solid #111111; padding-bottom: 15px; margin-bottom: 15px;">
                            <div style="font-family: monospace; font-size: 0.8rem; font-weight: bold; color: #B89047; text-transform: uppercase; margin-bottom: 6px;">Top Story Headline</div>
                            <h2 style="margin: 0 0 10px 0; font-family: 'Times New Roman', Times, serif; font-size: 1.8rem; font-weight: bold; color: #111111; line-height: 1.15; text-transform: uppercase;">
                                ${mainHeadline.headline || 'VALUATION SHIFTS OBSERVED ACROSS CORE PORTFOLIO ASSETS'}
                            </h2>
                            <p style="margin: 0 0 10px 0; font-style: italic; font-size: 1rem; line-height: 1.4; color: #444444;">
                                ${mainHeadline.summary || ''}
                            </p>
                            <p style="margin: 0 0 12px 0; font-size: 0.9rem; line-height: 1.5; color: #111111; text-align: justify;">
                                In a defining move for capital markets, the board's latest strategic review is driving major changes in pricing dynamics. Retail and institutional channels report stable inflows following this announcement. Professional trading houses indicate high volume concentrations matching these developments, confirming shifts in broad-market indexing weights.
                            </p>
                            <div style="font-size: 0.75rem; color: #666666;">
                                Impact: <span style="font-weight: bold; color: #111111;">${mainHeadline.impactLevel || 'High'} (${mainHeadline.impactScore || 'N/A'})</span> | Sentiment: <span style="color: ${mainSentimentColor}; font-weight: bold;">${mainHeadline.sentiment || 'Neutral'}</span>
                            </div>
                        </div>

                        <!-- Main Grid Section -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <!-- Left Column: Holdings Dispatch -->
                                <td width="60%" valign="top" style="padding-right: 15px; border-right: 1px solid #dddddd;">
                                    <div style="font-family: 'Times New Roman', Times, serif; font-size: 1.15rem; font-weight: bold; color: #B89047; text-transform: uppercase; border-bottom: 2px solid #111111; padding-bottom: 4px; margin-bottom: 12px;">Your Holdings Dispatch</div>
                                    ${holdingsHtml}
                                </td>
                                <!-- Right Column: Watchlist & Future Buy -->
                                <td width="40%" valign="top" style="padding-left: 15px;">
                                    <div style="font-family: 'Times New Roman', Times, serif; font-size: 1.15rem; font-weight: bold; color: #B89047; text-transform: uppercase; border-bottom: 2px solid #111111; padding-bottom: 4px; margin-bottom: 12px;">Watchlist Monitor</div>
                                    ${watchlistHtml}

                                    <div style="font-family: 'Times New Roman', Times, serif; font-size: 1.15rem; font-weight: bold; color: #B89047; text-transform: uppercase; border-bottom: 2px solid #111111; padding-bottom: 4px; margin-top: 20px; margin-bottom: 12px;">Future Buy Monitor</div>
                                    ${futureBuyHtml}
                                </td>
                            </tr>
                        </table>

                        <!-- Opinion Section & AI Desk -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 15px; border-top: 1px solid #111111; padding-top: 15px;">
                            <tr>
                                <td valign="top" width="50%" style="padding-right: 10px;">
                                    <div style="font-family: 'Times New Roman', Times, serif; font-size: 1.15rem; font-weight: bold; color: #B89047; text-transform: uppercase; border-bottom: 2px solid #111111; padding-bottom: 4px; margin-bottom: 10px;">Market Editorial</div>
                                    <p style="margin: 0; font-size: 0.85rem; line-height: 1.5; font-style: italic; color: #444444; text-align: justify;">
                                        "${data.marketOpinion || 'The domestic growth momentum remains highly resilient, supported by steady credit growth. While global headwinds persist, balance sheet health and cash flow visibility remain key outperformance drivers.'}"
                                    </p>
                                </td>
                                <td valign="top" width="50%" style="padding-left: 10px;">
                                    ${aiHtml}
                                </td>
                            </tr>
                        </table>

                        <!-- Footer -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 3px double #111111; padding-top: 15px; margin-top: 20px; text-align: center; font-size: 0.75rem; color: #666666; font-family: Georgia, serif; line-height: 1.5;">
                            <tr>
                                <td>
                                    <div>FinTrack Daily is a personalized dispatch compiled based on your registered assets.</div>
                                    <div style="font-weight: bold; margin-top: 4px;">
                                        Sources Parsed: ${data.newsCoverageStats ? data.newsCoverageStats.sourcesParsed : '--'} | Compile Time: ${data.newsCoverageStats ? data.newsCoverageStats.timeMs : '--'}ms
                                    </div>
                                    <div style="font-size: 0.7rem; color: #888888; margin-top: 8px;">
                                        This email was sent to ${recipientEmail} because you enabled Daily Newspaper Email notifications. 
                                        To change your preferences, go to Settings → Notifications in your dashboard.
                                    </div>
                                    <div style="font-size: 0.7rem; color: #888888; margin-top: 4px;">© 2026 FinTrack Inc. All rights reserved.</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;
    }
}

export default new NewspaperEmailService();
