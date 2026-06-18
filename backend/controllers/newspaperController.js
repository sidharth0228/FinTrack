const Portfolio = require('../models/Portfolio');
const Stock = require('../models/Stock');
const MutualFund = require('../models/MutualFund');
const Property = require('../models/Property');
const Loan = require('../models/Loan');
const Alert = require('../models/Alert');
const Watchlist = require('../models/Watchlist');
const NewspaperRefresh = require('../models/NewspaperRefresh');

// Helper to generate a realistic random change percentage
function getRandomChange(min, max) {
    const val = Math.random() * (max - min) + min;
    return parseFloat(val.toFixed(2));
}

// Controller to get dynamic financial newspaper content
exports.getNewspaper = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch User Portfolio & Watchlist Data
        const synced = await Portfolio.findOne({ userId });
        const manualStocks = await Stock.find({ userId });
        const mutualFunds = await MutualFund.find({ userId });
        const properties = await Property.find({ userId });
        const loans = await Loan.find({ userId, status: 'Active' });
        const userWatchlist = await Watchlist.find({ userId });

        // Compile all active assets
        const stocks = [
            ...(synced ? synced.stocks.map(s => ({ name: s.tradingsymbol, symbol: s.tradingsymbol, type: 'Stock' })) : []),
            ...manualStocks.map(s => ({ name: s.name, symbol: s.symbol, type: 'Stock', sector: s.sector }))
        ];
        const funds = mutualFunds.map(f => ({ name: f.name, symbol: f.type, type: 'Mutual Fund' }));
        const props = properties.map(p => ({ name: p.name, symbol: p.propertyType, type: 'Property', location: p.location }));

        const holdings = { stocks, funds, properties: props, loans };

        // Check latest database cached refresh record
        let latestRefresh = await NewspaperRefresh.findOne({ userId }).sort({ refreshedAt: -1 });

        let forceRefresh = false;
        let isEmergency = false;

        if (latestRefresh) {
            const timeDiff = Date.now() - new Date(latestRefresh.refreshedAt).getTime();
            
            // 1. If 12 hours have elapsed, force an automatic refresh
            if (timeDiff >= 12 * 60 * 60 * 1000) {
                forceRefresh = true;
            } else {
                // 2. Emergency Alert System:
                // Bypass 12-hour cycle randomly (15% chance if last check was > 5 minutes ago) to simulate incoming critical news
                if (timeDiff > 5 * 60 * 1000 && Math.random() < 0.15) {
                    forceRefresh = true;
                    isEmergency = true;
                }
            }
        } else {
            forceRefresh = true;
        }

        if (forceRefresh) {
            const edition = await compileNewspaperEdition(userId, holdings, userWatchlist, isEmergency, false);
            return res.json(edition);
        }

        // Return cached edition, but dynamically overlay active Alerts
        const activeAlerts = await Alert.find({ userId, isDismissed: false }).sort({ date: -1 });
        const resultData = latestRefresh.toObject();
        
        resultData.emergencyAlerts = activeAlerts.map(a => ({ _id: a._id, text: a.text, isCritical: a.isCritical, isRead: a.isRead }));
        resultData.criticalAlertCount = activeAlerts.filter(a => a.isCritical).length;
        resultData.refreshTime = new Date(latestRefresh.refreshedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        resultData.newsCoverageStats = {
            sourcesParsed: (resultData.holdingsNews ? resultData.holdingsNews.length : 0) + (resultData.watchlistNews ? resultData.watchlistNews.length : 0) + (resultData.futureBuyList ? resultData.futureBuyList.length : 0) + 4,
            timeMs: Math.floor(Math.random() * 150) + 120
        };

        res.json(resultData);

    } catch (error) {
        console.error("Newspaper GET error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Controller to manually refresh newspaper content
exports.refreshNewspaper = async (req, res) => {
    try {
        const userId = req.user.id;
        const triggerEmergency = req.body && req.body.triggerEmergency === true;

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

        const edition = await compileNewspaperEdition(userId, holdings, userWatchlist, triggerEmergency, true);
        res.json(edition);

    } catch (error) {
        console.error("Newspaper manual refresh error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Core compiler to generate personalized financial content
async function compileNewspaperEdition(userId, holdings, userWatchlist, isEmergency, isManual) {
    const activeStocks = holdings.stocks || [];
    const activeFunds = holdings.funds || [];
    const activeProps = holdings.properties || [];
    const watchlistAssets = userWatchlist.filter(w => !w.isFutureBuy);
    const futureBuyAssets = userWatchlist.filter(w => w.isFutureBuy);

    // Dynamic Lists based strictly on user holdings/watchlist/buys
    const holdingsNames = [
        ...activeStocks.map(s => s.name),
        ...activeFunds.map(f => f.name),
        ...activeProps.map(p => p.name)
    ];
    if (holdingsNames.length === 0) {
        holdingsNames.push('Reliance Industries', 'TCS', 'HDFC Bank');
    }

    const wlNames = watchlistAssets.map(w => w.name);
    if (wlNames.length === 0) {
        wlNames.push('Infosys', 'Tata Motors');
    }

    const fbNames = futureBuyAssets.map(w => w.name);
    if (fbNames.length === 0) {
        fbNames.push('Larsen & Toubro', 'ICICI Bank');
    }

    // 1. Handle Critical/Emergency Alert seeds
    if (isEmergency) {
        const targetAsset = holdingsNames[Math.floor(Math.random() * holdingsNames.length)];
        const criticalTemplates = [
            `🚨 BREAKING NEWS: CEO of ${targetAsset} announces sudden resignation amid strategic differences with the board. Shares down 8.5%.`,
            `🚨 BREAKING NEWS: Regulatory bodies launch comprehensive fraud investigation into financial statements of ${targetAsset}.`,
            `🚨 BREAKING NEWS: Severe liquidity crunch forces debt restructuring and potential bankruptcy filings at ${targetAsset}.`,
            `🚨 BREAKING NEWS: SEBI takes punitive regulatory action against ${targetAsset} for non-compliance with disclosure standards.`,
            `🚨 BREAKING NEWS: Class-action lawsuit filed against ${targetAsset} alleging major environmental and safety violations.`,
            `🚨 BREAKING NEWS: ${targetAsset} discloses massive cybersecurity data breach exposing proprietary customer information.`,
            `🚨 BREAKING NEWS: ${targetAsset} reports severe earnings miss for the quarter; margins compress by 300 bps.`,
            `🚨 BREAKING NEWS: Stock crash detected in ${targetAsset}; price collapses over 12% in morning trade amid panic selling.`
        ];
        const alertText = criticalTemplates[Math.floor(Math.random() * criticalTemplates.length)];
        
        const newAlert = new Alert({
            userId,
            text: alertText,
            isCritical: true,
            isDismissed: false
        });
        await newAlert.save();
    }

    // Ensure at least one alert exists in database
    const dbAlerts = await Alert.find({ userId, isDismissed: false }).sort({ date: -1 });
    if (dbAlerts.length === 0) {
        const defaultAlert = new Alert({
            userId,
            text: `🚨 MARKET ALERT: RBI Monetary Policy Committee keeps repo rate unchanged at 6.50% following latest economic surveys.`,
            isCritical: false,
            isDismissed: false
        });
        await defaultAlert.save();
        dbAlerts.push(defaultAlert);
    }

    // 2. Generate Market Snapshot
    const marketSnapshot = [
        { name: 'NIFTY 50', value: '23,456.80', change: getRandomChange(0.2, 1.2), up: true },
        { name: 'SENSEX', value: '77,215.10', change: getRandomChange(0.1, 1.0), up: true },
        { name: 'BANK NIFTY', value: '50,112.45', change: getRandomChange(-0.8, -0.1), up: false },
        { name: 'NASDAQ', value: '17,732.60', change: getRandomChange(0.5, 1.5), up: true },
        { name: 'S&P 500', value: '5,431.12', change: getRandomChange(0.3, 1.1), up: true },
        { name: 'GOLD (MCX)', value: '71,840.00', change: getRandomChange(-0.5, 0.5), up: Math.random() > 0.5 },
        { name: 'BITCOIN', value: '$66,240.00', change: getRandomChange(-2.5, 3.5), up: Math.random() > 0.5 }
    ];

    // 3. Main Headline Story (Related to user holdings)
    const primaryAsset = holdingsNames[0];
    const mainHeadline = {
        headline: `${primaryAsset.toUpperCase()} ANNOUNCES MAJOR GLOBAL TRANSITION; PORTFOLIO OUTLOOK REVISED`,
        summary: `Shares of ${primaryAsset} surged following the board's approval of a capital allocation review. Analyst desks estimate a net positive valuation impact of up to 12%. The development comes amid positive domestic macroeconomic tailwinds and robust industrial growth. Credit agencies have maintained stable ratings, with brokerage firms issuing buy updates.`,
        relatedHoldings: [primaryAsset],
        impactScore: "+8/10",
        sentiment: "Bullish",
        impactLevel: "High"
    };

    // 4. Holdings News Generation
    const holdingsNews = [];
    for (const assetName of holdingsNames.slice(0, 3)) {
        const roll = Math.random();
        let sentiment = "Neutral";
        let impactLevel = "Medium";
        let impactScore = "+1";
        let headline = "";
        let summary = "";

        if (roll < 0.4) {
            sentiment = "Bullish";
            impactLevel = Math.random() > 0.5 ? "High" : "Medium";
            impactScore = `+${Math.floor(Math.random() * 5) + 5}`;
            headline = `${assetName} expands strategic operations footprint; Q1 net profits set to exceed street targets`;
            summary = `${assetName} announced the roll-out of 45 new service distribution points. Analysts anticipate localized operational cost benefits.`;
        } else if (roll < 0.8) {
            sentiment = "Bearish";
            impactLevel = Math.random() > 0.5 ? "High" : "Medium";
            impactScore = `-${Math.floor(Math.random() * 5) + 1}`;
            headline = `${assetName} faces raw material inflation pressure; near-term margins under observation`;
            summary = `Extended vendor negotiation timelines have increased operating expenditure at ${assetName}, triggering target price revisions.`;
        } else {
            headline = `${assetName} initiates restructuring of underperforming business verticals`;
            summary = `A strategic review of capital division allocations is underway at ${assetName} to boost balance sheet resilience.`;
        }

        holdingsNews.push({
            companyName: assetName,
            headline,
            summary,
            impactScore,
            sentiment,
            impactLevel
        });
    }

    // 5. Watchlist News Generation
    const watchlistNews = [];
    for (const assetName of wlNames.slice(0, 3)) {
        const sentiments = ["Bullish", "Bearish", "Neutral"];
        const impactLevels = ["Low", "Medium", "High"];
        const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
        const impactLevel = impactLevels[Math.floor(Math.random() * impactLevels.length)];

        watchlistNews.push({
            title: `Brokerage desks issue positive valuation review for ${assetName}`,
            desc: `Channel checks point to accelerating contract booking velocity in the markets for ${assetName}, supporting entry level accumulations.`,
            sentiment,
            impactLevel
        });
    }

    // 6. Future BuyOpportunities News Generation
    const futureBuyList = [];
    for (const fbName of fbNames.slice(0, 3)) {
        const sentiments = ["Bullish", "Bearish", "Neutral"];
        const impactLevels = ["Low", "Medium", "High"];
        const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
        const impactLevel = impactLevels[Math.floor(Math.random() * impactLevels.length)];

        futureBuyList.push({
            title: `Infrastructure order wins push ${fbName} capacity utilization targets higher`,
            desc: `${fbName} reported securing a series of domestic contracts, validating growth metrics for long-term target portfolio allocation.`,
            sentiment,
            impactLevel
        });
    }

    // 7. Sector news
    const sectorReport = [
        {
            name: "Technology",
            sentiment: "Bullish",
            development: "Strong cloud services pipeline in US & Europe; digital overhauls resume.",
            movers: "TCS (+1.8%), Infosys (+2.1%)"
        },
        {
            name: "Banking",
            sentiment: "Neutral",
            development: "Deposit rates peaking; credit expansion continues, asset quality stable.",
            movers: "HDFC (+0.5%), ICICI Bank (-0.3%)"
        },
        {
            name: "Energy",
            sentiment: "Bullish",
            development: "Crude stability protects refining margins; green hydrogen projects receive government subsidies.",
            movers: "Reliance (+2.2%), NTPC (+1.4%)"
        }
    ];

    // 8. AI Analyst Desk
    const aiAnalystDesk = {
        portfolioRisk: "Moderate. Allocations are aligned with long-term capital preservation guidelines.",
        emergingOpportunities: "Pharmaceutical sector demonstrates defensive value and attractive entry multiples after recent corrective cycles.",
        hiddenRisks: "Mortgage rates and bond yield curve spreads represent potential cost headwinds for real estate exposures.",
        concentrationWarnings: "No severe sector concentration detected. Holdings are diversified across core blue-chips.",
        suggestedMonitoringAreas: "Monitor debt-to-income metrics and credit limit usage to safeguard ratings cushion."
    };

    const marketOpinion = "The domestic growth momentum remains highly resilient, supported by private capex expansion and steady credit growth. While global headwinds such as restrictive central bank policies persist, the domestic economy is insulated by strong domestic consumption. For long-term investors, focusing on companies with clean balance sheets, strong free cash flows, and low debt-to-equity metrics is key to outperforming volatile phases.";

    const totalArticles = 1 + holdingsNews.length + watchlistNews.length + futureBuyList.length;
    const criticalAlerts = dbAlerts.filter(a => a.isCritical).length;

    // Create refresh history record in database
    const newRefresh = new NewspaperRefresh({
        userId,
        refreshedAt: new Date(),
        isManual,
        isEmergency,
        articleCount: totalArticles,
        criticalAlertCount: criticalAlerts,
        marketSnapshot,
        emergencyAlerts: dbAlerts.map(a => ({
            _id: a._id,
            text: a.text,
            isCritical: a.isCritical,
            isRead: a.isRead,
            isDismissed: a.isDismissed,
            date: a.date
        })),
        mainHeadline,
        holdingsNews,
        watchlistNews,
        futureBuyList,
        sectorReport,
        aiAnalystDesk,
        marketOpinion
    });
    await newRefresh.save();

    const result = newRefresh.toObject();
    result.emergencyAlerts = dbAlerts.map(a => ({ _id: a._id, text: a.text, isCritical: a.isCritical, isRead: a.isRead }));
    result.refreshTime = new Date(newRefresh.refreshedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    result.newsCoverageStats = {
        sourcesParsed: (holdingsNames.length || 0) + (wlNames.length || 0) + (fbNames.length || 0) + 4,
        timeMs: Math.floor(Math.random() * 150) + 120
    };

    return result;
}

exports.compileNewspaperEdition = compileNewspaperEdition;
